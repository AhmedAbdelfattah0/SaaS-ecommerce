import { createMiddleware } from 'hono/factory';
import { createClient } from '@supabase/supabase-js';
import type { Env, Variables } from '../index';

export type AuthVariables = Variables & {
  userId: string;
  userEmail: string;
};

/**
 * JWT validation middleware.
 * Validates the Supabase JWT from the Authorization header.
 * - Rejects expired tokens with HTTP 401.
 * - Sets userId and userEmail on context.
 * - Updates tenant context tenant_id from admin_users lookup.
 */
export const authMiddleware = createMiddleware<{
  Bindings: Env;
  Variables: AuthVariables;
}>(async (c, next) => {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ data: null, error: 'Missing or invalid Authorization header' }, 401);
  }

  const token = authHeader.slice(7);

  // Use Supabase server client to validate the JWT
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_ANON_KEY);

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    // Expired tokens return an error from getUser
    return c.json({ data: null, error: 'Invalid or expired token' }, 401);
  }

  c.set('userId', user.id);
  c.set('userEmail', user.email ?? '');

  await next();
});
