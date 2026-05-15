import { Hono } from 'hono';
import { createClient } from '@supabase/supabase-js';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { Env, Variables } from '../index';

export const teamRouter = new Hono<{ Bindings: Env; Variables: Variables }>();

// ============================================================
// Schemas
// ============================================================

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'staff', 'viewer']),
});

// ============================================================
// Helpers
// ============================================================

function serviceClient(env: Env) {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
}

function getClientIp(req: Request): string {
  return (
    req.headers.get('CF-Connecting-IP') ??
    req.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ??
    'unknown'
  );
}

async function writeAuditLog(
  env: Env,
  params: {
    tenantId: string | null;
    actorType: string;
    actorId: string | null;
    actorEmail: string | null;
    action: string;
    ipAddress: string;
    userAgent: string;
    severity?: string;
    metadata?: Record<string, unknown>;
  },
): Promise<void> {
  const supabase = serviceClient(env);
  await supabase.from('audit_logs').insert({
    tenant_id: params.tenantId,
    actor_type: params.actorType,
    actor_id: params.actorId,
    actor_email: params.actorEmail,
    action: params.action,
    ip_address: params.ipAddress,
    user_agent: params.userAgent,
    severity: params.severity ?? 'info',
    metadata: params.metadata ?? {},
  });
}

/**
 * Resolve the caller from the Authorization header — returns the validated
 * userId + email plus their admin_users record (tenant_id + role). Returns
 * null when the JWT is missing, invalid, or the user has no admin_users row.
 */
async function requireAdmin(
  env: Env,
  authHeader: string | undefined,
): Promise<{
  userId: string;
  email: string;
  tenantId: string;
  role: string;
} | null> {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);

  const anon = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
  const { data: { user }, error } = await anon.auth.getUser(token);
  if (error || !user) return null;

  const service = serviceClient(env);
  const { data: adminUser } = await service
    .from('admin_users')
    .select('tenant_id, role')
    .eq('id', user.id)
    .single();
  if (!adminUser) return null;

  return {
    userId: user.id,
    email: user.email ?? '',
    tenantId: adminUser.tenant_id,
    role: adminUser.role,
  };
}

// ============================================================
// Routes
// ============================================================

/**
 * POST /api/team/invite
 *
 * Tenant admin invites a new team member by email. Calls
 * supabase.auth.admin.inviteUserByEmail with the new user's tenant_id +
 * role embedded in user_metadata; Supabase sends the invite email and
 * the link lands the invitee on ${ADMIN_URL}/accept-invite.
 *
 * - Validates: email format, role enum, caller has admin/superadmin role
 *   in the tenant context resolved from the Host header
 * - Uses service-role key (admin operation; NOT the anon key)
 * - Writes audit_logs entries on success + failure
 */
teamRouter.post('/invite', zValidator('json', inviteSchema), async (c) => {
  const { email, role } = c.req.valid('json');
  const tenant = c.get('tenant');
  const ipAddress = getClientIp(c.req.raw);
  const userAgent = c.req.header('User-Agent') ?? '';

  const caller = await requireAdmin(c.env, c.req.header('Authorization'));
  if (!caller) {
    return c.json({ data: null, error: 'Unauthorized' }, 401);
  }

  // Caller must belong to the resolved tenant
  if (caller.tenantId !== tenant.id) {
    await writeAuditLog(c.env, {
      tenantId: tenant.id,
      actorType: 'admin',
      actorId: caller.userId,
      actorEmail: caller.email,
      action: 'team.invite.forbidden',
      ipAddress,
      userAgent,
      severity: 'warning',
      metadata: { reason: 'cross-tenant', invitedEmail: email },
    });
    return c.json({ data: null, error: 'Forbidden' }, 403);
  }

  // Only admin / superadmin can invite (owner role tracked separately when expanded)
  if (caller.role !== 'admin' && caller.role !== 'superadmin' && caller.role !== 'owner') {
    return c.json({ data: null, error: 'Forbidden' }, 403);
  }

  if (!c.env.ADMIN_URL) {
    return c.json({ data: null, error: 'ADMIN_URL not configured' }, 500);
  }

  const supabase = serviceClient(c.env);

  const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${c.env.ADMIN_URL}/accept-invite`,
    data: {
      tenant_id: tenant.id,
      role,
      invited_by: caller.userId,
    },
  });

  if (error || !data.user) {
    await writeAuditLog(c.env, {
      tenantId: tenant.id,
      actorType: 'admin',
      actorId: caller.userId,
      actorEmail: caller.email,
      action: 'team.invite.failed',
      ipAddress,
      userAgent,
      severity: 'warning',
      metadata: { invitedEmail: email, role, reason: error?.message ?? 'unknown' },
    });
    return c.json({ data: null, error: error?.message ?? 'Invite failed' }, 400);
  }

  await writeAuditLog(c.env, {
    tenantId: tenant.id,
    actorType: 'admin',
    actorId: caller.userId,
    actorEmail: caller.email,
    action: 'team.invite.sent',
    ipAddress,
    userAgent,
    severity: 'info',
    metadata: { invitedEmail: email, invitedUserId: data.user.id, role },
  });

  return c.json(
    {
      data: { inviteId: data.user.id, email },
      error: null,
    },
    201,
  );
});

/**
 * POST /api/team/accept-invite
 *
 * Called from /accept-invite AFTER the invitee has set their password via
 * supabase.auth.updateUser. The user's session is now established under
 * their normal credentials (not the recovery flow); user_metadata holds
 * `tenant_id`, `role`, and `invited_by` set by the inviter at invite time.
 *
 * This endpoint INSERTs the admin_users row using service-role (RLS would
 * block a direct client write) and is idempotent: re-running it for an
 * already-accepted user returns 200 with { alreadyAccepted: true } instead
 * of failing on the primary-key conflict.
 */
teamRouter.post('/accept-invite', async (c) => {
  const authHeader = c.req.header('Authorization');
  const ipAddress = getClientIp(c.req.raw);
  const userAgent = c.req.header('User-Agent') ?? '';

  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ data: null, error: 'Unauthorized' }, 401);
  }
  const token = authHeader.slice(7);

  const anon = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_ANON_KEY);
  const { data: { user }, error: authError } = await anon.auth.getUser(token);

  if (authError || !user) {
    return c.json({ data: null, error: 'Invalid or expired session' }, 401);
  }

  // Pull tenant_id + role from user_metadata (set by the inviter)
  const meta = (user.user_metadata ?? {}) as {
    tenant_id?: string;
    role?: string;
    invited_by?: string;
    full_name?: string;
  };

  if (!meta.tenant_id || !meta.role) {
    return c.json(
      {
        data: null,
        error:
          'Invite metadata missing. Ask your tenant admin to resend the invite.',
      },
      400,
    );
  }

  const service = serviceClient(c.env);

  // Idempotency: if the admin_users row already exists, return success
  // without retrying the insert.
  const { data: existing } = await service
    .from('admin_users')
    .select('id, tenant_id, role')
    .eq('id', user.id)
    .single();

  if (existing) {
    return c.json({
      data: {
        id: existing.id,
        tenantId: existing.tenant_id,
        role: existing.role,
        alreadyAccepted: true,
      },
      error: null,
    });
  }

  // First-time accept — create the admin_users row
  const { data: inserted, error: insertError } = await service
    .from('admin_users')
    .insert({
      id: user.id,
      tenant_id: meta.tenant_id,
      email: user.email ?? '',
      role: meta.role,
    })
    .select('id, tenant_id, role')
    .single();

  if (insertError || !inserted) {
    await writeAuditLog(c.env, {
      tenantId: meta.tenant_id,
      actorType: 'admin',
      actorId: user.id,
      actorEmail: user.email ?? null,
      action: 'team.invite.accept.failed',
      ipAddress,
      userAgent,
      severity: 'error',
      metadata: { reason: insertError?.message ?? 'unknown', role: meta.role },
    });
    return c.json(
      { data: null, error: insertError?.message ?? 'Failed to finalize invite' },
      500,
    );
  }

  await writeAuditLog(c.env, {
    tenantId: meta.tenant_id,
    actorType: 'admin',
    actorId: user.id,
    actorEmail: user.email ?? null,
    action: 'team.invite.accepted',
    ipAddress,
    userAgent,
    severity: 'info',
    metadata: { role: meta.role, invitedBy: meta.invited_by ?? null },
  });

  return c.json({
    data: {
      id: inserted.id,
      tenantId: inserted.tenant_id,
      role: inserted.role,
      alreadyAccepted: false,
    },
    error: null,
  });
});
