import { Hono } from 'hono';
import { createClient } from '@supabase/supabase-js';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { Env, Variables } from '../index';

export const billingRouter = new Hono<{ Bindings: Env; Variables: Variables }>();

// ============================================================
// Schemas
// ============================================================

const checkoutSessionSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  plan: z.enum(['starter', 'pro']),
});

const domainSetupSchema = z.object({
  customDomain: z
    .string()
    .min(3)
    .regex(/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z]{2,})+$/, 'Invalid domain format'),
});

// ============================================================
// Lemon Squeezy plan variant IDs
// Configure via environment or hardcode for now — must be updated
// with real Lemon Squeezy variant IDs from your store.
// ============================================================
const PLAN_VARIANT_IDS: Record<string, string> = {
  starter: 'STARTER_VARIANT_ID',
  pro: 'PRO_VARIANT_ID',
};

// ============================================================
// Helpers
// ============================================================

function serviceClient(env: Env) {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
}

/**
 * Verify Lemon Squeezy webhook HMAC-SHA256 signature.
 * Returns true if valid, false if invalid.
 * Replay protection: rejects payloads with X-Timestamp older than 5 minutes.
 */
async function verifyWebhookSignature(
  secret: string,
  rawBody: string,
  signatureHeader: string | null,
  timestampHeader: string | null
): Promise<{ valid: boolean; reason?: string }> {
  if (!signatureHeader) {
    return { valid: false, reason: 'Missing X-Signature header' };
  }

  // Replay protection — reject if timestamp older than 5 minutes
  if (timestampHeader) {
    const timestamp = parseInt(timestampHeader, 10);
    if (!isNaN(timestamp)) {
      const ageSeconds = Math.floor(Date.now() / 1000) - timestamp;
      if (ageSeconds > 300) {
        return { valid: false, reason: `Webhook timestamp too old: ${ageSeconds}s` };
      }
    }
  }

  // HMAC-SHA256 verification using Web Crypto API (Workers native)
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBytes = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody));

  // Convert to hex
  const computedSignature = Array.from(new Uint8Array(signatureBytes))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  // Constant-time comparison using a timing-safe approach
  if (computedSignature.length !== signatureHeader.length) {
    return { valid: false, reason: 'Signature length mismatch' };
  }

  let mismatch = 0;
  for (let i = 0; i < computedSignature.length; i++) {
    mismatch |= computedSignature.charCodeAt(i) ^ signatureHeader.charCodeAt(i);
  }

  if (mismatch !== 0) {
    return { valid: false, reason: 'Signature mismatch' };
  }

  return { valid: true };
}

async function writeAuditLog(
  env: Env,
  params: {
    tenantId: string | null;
    actorType: string;
    action: string;
    metadata?: Record<string, unknown>;
    severity?: string;
  }
): Promise<void> {
  const supabase = serviceClient(env);
  await supabase.from('audit_logs').insert({
    tenant_id: params.tenantId,
    actor_type: params.actorType,
    action: params.action,
    metadata: params.metadata ?? {},
    severity: params.severity ?? 'info',
  });
}

// ============================================================
// Routes
// ============================================================

/**
 * POST /api/billing/checkout
 * Creates a new tenant (status: pending) and a Lemon Squeezy checkout session.
 * Returns { checkoutUrl } — Angular redirects user to complete payment.
 * Tenant is only activated after receiving the subscription_created webhook.
 */
billingRouter.post('/checkout', zValidator('json', checkoutSessionSchema), async (c) => {
  const { name, email, plan } = c.req.valid('json');
  const supabase = serviceClient(c.env);

  // Create tenant with status: pending — will be activated by webhook
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .insert({ name, email, status: 'pending', plan })
    .select('id')
    .single();

  if (tenantError) {
    if (tenantError.code === '23505') {
      return c.json({ data: null, error: 'Email already registered' }, 409);
    }
    return c.json({ data: null, error: tenantError.message }, 500);
  }

  // Create Lemon Squeezy checkout session via native fetch (Workers-compatible)
  const variantId = PLAN_VARIANT_IDS[plan];
  const lsResponse = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${c.env.LEMONSQUEEZY_API_KEY}`,
      'Content-Type': 'application/vnd.api+json',
      Accept: 'application/vnd.api+json',
    },
    body: JSON.stringify({
      data: {
        type: 'checkouts',
        attributes: {
          checkout_data: {
            email,
            name,
            custom: { tenantId: tenant.id },
          },
          product_options: {
            redirect_url: `https://app.storecraft.app/onboarding?tenantId=${tenant.id}`,
          },
        },
        relationships: {
          variant: {
            data: { type: 'variants', id: variantId },
          },
        },
      },
    }),
  });

  if (!lsResponse.ok) {
    const lsError = await lsResponse.text();
    // Clean up pending tenant on Lemon Squeezy failure
    await supabase.from('tenants').delete().eq('id', tenant.id);
    return c.json({ data: null, error: `Billing provider error: ${lsError}` }, 502);
  }

  const lsData = (await lsResponse.json()) as { data: { attributes: { url: string } } };
  const checkoutUrl = lsData.data?.attributes?.url;

  await writeAuditLog(c.env, {
    tenantId: tenant.id,
    actorType: 'system',
    action: 'billing.checkout.created',
    metadata: { plan, email },
    severity: 'info',
  });

  return c.json({ data: { checkoutUrl, tenantId: tenant.id }, error: null }, 201);
});

/**
 * POST /api/billing/webhook
 * Lemon Squeezy webhook handler.
 * - Verifies HMAC-SHA256 signature on every request.
 * - Rejects replays older than 5 minutes.
 * - Idempotent: deduplicates by event_id.
 * - Logs all receipts and outcomes to audit_logs.
 */
billingRouter.post('/webhook', async (c) => {
  const rawBody = await c.req.text();
  const signatureHeader = c.req.header('X-Signature');
  const timestampHeader = c.req.header('X-Timestamp');
  const supabase = serviceClient(c.env);

  // Step 1: Verify signature
  const { valid, reason } = await verifyWebhookSignature(
    c.env.LEMONSQUEEZY_WEBHOOK_SECRET,
    rawBody,
    signatureHeader ?? null,
    timestampHeader ?? null
  );

  if (!valid) {
    await writeAuditLog(c.env, {
      tenantId: null,
      actorType: 'webhook',
      action: 'billing.webhook.rejected',
      metadata: { reason },
      severity: 'warning',
    });
    return c.json({ error: 'Invalid webhook signature' }, 401);
  }

  let payload: {
    meta?: { event_name?: string; custom_data?: { tenantId?: string } };
    data?: {
      id?: string;
      attributes?: {
        subscription_id?: string;
        status?: string;
        custom_data?: { tenantId?: string };
      };
    };
  };

  try {
    payload = JSON.parse(rawBody) as typeof payload;
  } catch {
    return c.json({ error: 'Invalid JSON payload' }, 400);
  }

  const eventName = payload.meta?.event_name ?? '';
  const eventId = payload.data?.id ?? '';
  const tenantId =
    payload.meta?.custom_data?.tenantId ??
    payload.data?.attributes?.custom_data?.tenantId ??
    null;

  // Step 2: Idempotency check — reject duplicate event_id
  const { data: existingEvent } = await supabase
    .from('webhook_events')
    .select('id')
    .eq('event_id', eventId)
    .single();

  if (existingEvent) {
    await writeAuditLog(c.env, {
      tenantId,
      actorType: 'webhook',
      action: 'billing.webhook.duplicate',
      metadata: { eventId, eventName },
      severity: 'info',
    });
    return c.json({ data: { deduplicated: true }, error: null });
  }

  // Step 3: Process event
  let processingStatus: 'processed' | 'failed' | 'skipped' = 'skipped';
  let processingError: string | null = null;

  try {
    if (tenantId) {
      switch (eventName) {
        case 'subscription_created': {
          const subscriptionId = payload.data?.id ?? '';
          await supabase
            .from('tenants')
            .update({
              status: 'active',
              lemon_squeezy_subscription_id: subscriptionId,
              updated_at: new Date().toISOString(),
            })
            .eq('id', tenantId);
          processingStatus = 'processed';
          break;
        }

        case 'subscription_cancelled': {
          await supabase
            .from('tenants')
            .update({ status: 'cancelled', updated_at: new Date().toISOString() })
            .eq('id', tenantId);
          processingStatus = 'processed';
          break;
        }

        case 'subscription_expired': {
          await supabase
            .from('tenants')
            .update({ status: 'suspended', updated_at: new Date().toISOString() })
            .eq('id', tenantId);
          processingStatus = 'processed';
          break;
        }

        case 'subscription_resumed': {
          await supabase
            .from('tenants')
            .update({ status: 'active', updated_at: new Date().toISOString() })
            .eq('id', tenantId);
          processingStatus = 'processed';
          break;
        }

        default:
          processingStatus = 'skipped';
      }
    } else {
      processingStatus = 'skipped';
    }
  } catch (err) {
    processingStatus = 'failed';
    processingError = err instanceof Error ? err.message : 'Unknown processing error';
  }

  // Step 4: Record event (idempotency table)
  await supabase.from('webhook_events').insert({
    event_id: eventId,
    provider: 'lemonsqueezy',
    event_type: eventName,
    payload,
    processing_status: processingStatus,
  });

  // Step 5: Audit log
  await writeAuditLog(c.env, {
    tenantId,
    actorType: 'webhook',
    action: `billing.webhook.${processingStatus}`,
    metadata: {
      eventId,
      eventName,
      processingStatus,
      ...(processingError ? { error: processingError } : {}),
    },
    severity: processingStatus === 'failed' ? 'error' : 'info',
  });

  if (processingStatus === 'failed') {
    return c.json({ error: processingError ?? 'Processing failed' }, 500);
  }

  return c.json({ data: { received: true, status: processingStatus }, error: null });
});

/**
 * POST /api/billing/domain
 * Admin JWT required — sets or updates the custom domain for a tenant.
 * Returns DNS CNAME instructions.
 */
billingRouter.post('/domain', zValidator('json', domainSetupSchema), async (c) => {
  const tenant = c.get('tenant');
  const { customDomain } = c.req.valid('json');
  const supabase = serviceClient(c.env);

  const { error } = await supabase
    .from('tenants')
    .update({ custom_domain: customDomain, updated_at: new Date().toISOString() })
    .eq('id', tenant.id);

  if (error) {
    if (error.code === '23505') {
      return c.json({ data: null, error: 'Domain already in use' }, 409);
    }
    return c.json({ data: null, error: error.message }, 500);
  }

  await writeAuditLog(c.env, {
    tenantId: tenant.id,
    actorType: 'admin',
    action: 'billing.domain.updated',
    metadata: { customDomain },
    severity: 'info',
  });

  return c.json({
    data: {
      customDomain,
      dnsInstructions: {
        type: 'CNAME',
        host: customDomain,
        value: 'storefront.storecraft.app',
        ttl: 3600,
        note: 'Point your domain CNAME record to our Cloudflare Pages deployment. DNS propagation may take up to 48 hours.',
      },
    },
    error: null,
  });
});
