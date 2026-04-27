import { Hono } from 'hono';
import { createClient } from '@supabase/supabase-js';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { Env, Variables } from '../index';

export const authRouter = new Hono<{ Bindings: Env; Variables: Variables }>();

// ============================================================
// Schemas
// ============================================================

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
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
  }
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

async function recordFailedLogin(
  env: Env,
  email: string,
  ipAddress: string,
  reason: string
): Promise<void> {
  const supabase = serviceClient(env);
  await supabase.from('failed_login_attempts').insert({
    email,
    ip_address: ipAddress,
    reason,
  });
}

// ============================================================
// Routes
// ============================================================

/**
 * POST /api/auth/login
 * Authenticates an admin user via Supabase Auth.
 * - Logs success/failure to audit_logs.
 * - Records failed attempts to failed_login_attempts.
 * - Returns Supabase session on success (session managed by Supabase, not localStorage).
 */
authRouter.post('/login', zValidator('json', loginSchema), async (c) => {
  const { email, password } = c.req.valid('json');
  const ipAddress = getClientIp(c.req.raw);
  const userAgent = c.req.header('User-Agent') ?? '';

  // Use anon key for auth operations — Supabase handles JWT issuance
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_ANON_KEY);
  const serviceSupabase = serviceClient(c.env);

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user || !data.session) {
    // Record failed login attempt (Task 24 will enforce lockout — this is tracking only)
    await recordFailedLogin(c.env, email, ipAddress, error?.message ?? 'Unknown error');

    // Audit log for failed login
    await writeAuditLog(c.env, {
      tenantId: null,
      actorType: 'admin',
      actorId: null,
      actorEmail: email,
      action: 'auth.login.failed',
      ipAddress,
      userAgent,
      severity: 'warning',
      metadata: { reason: error?.message ?? 'Unknown error' },
    });

    return c.json({ data: null, error: 'Invalid email or password' }, 401);
  }

  // Fetch tenant_id from admin_users for this authenticated user
  const { data: adminUser } = await serviceSupabase
    .from('admin_users')
    .select('tenant_id, role, mfa_enabled')
    .eq('id', data.user.id)
    .single();

  if (!adminUser) {
    // User exists in Supabase Auth but not in admin_users — unauthorized
    await supabase.auth.signOut();
    return c.json({ data: null, error: 'Admin account not found' }, 403);
  }

  // Update last_login_at
  await serviceSupabase
    .from('admin_users')
    .update({ last_login_at: new Date().toISOString() })
    .eq('id', data.user.id);

  // Audit log for successful login
  await writeAuditLog(c.env, {
    tenantId: adminUser.tenant_id,
    actorType: 'admin',
    actorId: data.user.id,
    actorEmail: email,
    action: 'auth.login.success',
    ipAddress,
    userAgent,
    severity: 'info',
  });

  return c.json({
    data: {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: data.session.expires_at,
      user: {
        id: data.user.id,
        email: data.user.email,
        tenantId: adminUser.tenant_id,
        role: adminUser.role,
        mfaEnabled: adminUser.mfa_enabled,
      },
    },
    error: null,
  });
});

/**
 * POST /api/auth/logout
 * Signs out the current session via Supabase.
 */
authRouter.post('/logout', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ data: null, error: 'Missing token' }, 401);
  }

  const token = authHeader.slice(7);
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_ANON_KEY);

  // Validate token first
  const { data: { user } } = await supabase.auth.getUser(token);
  if (user) {
    const ipAddress = getClientIp(c.req.raw);
    await writeAuditLog(c.env, {
      tenantId: null,
      actorType: 'admin',
      actorId: user.id,
      actorEmail: user.email ?? null,
      action: 'auth.logout',
      ipAddress,
      userAgent: c.req.header('User-Agent') ?? '',
      severity: 'info',
    });
  }

  await supabase.auth.signOut();

  return c.json({ data: { loggedOut: true }, error: null });
});

/**
 * GET /api/auth/me
 * Returns the current admin user's profile from the JWT.
 * JWT validation is enforced by authMiddleware — if we reach here, token is valid.
 */
authRouter.get('/me', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ data: null, error: 'Missing token' }, 401);
  }

  const token = authHeader.slice(7);
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_ANON_KEY);
  const serviceSupabase = serviceClient(c.env);

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return c.json({ data: null, error: 'Invalid or expired token' }, 401);
  }

  const { data: adminUser } = await serviceSupabase
    .from('admin_users')
    .select('tenant_id, role, mfa_enabled, last_login_at, must_change_password')
    .eq('id', user.id)
    .single();

  if (!adminUser) {
    return c.json({ data: null, error: 'Admin account not found' }, 403);
  }

  return c.json({
    data: {
      id: user.id,
      email: user.email,
      tenantId: adminUser.tenant_id,
      role: adminUser.role,
      mfaEnabled: adminUser.mfa_enabled,
      lastLoginAt: adminUser.last_login_at,
      mustChangePassword: adminUser.must_change_password,
    },
    error: null,
  });
});
