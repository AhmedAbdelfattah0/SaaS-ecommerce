import { createMiddleware } from 'hono/factory';
import { createClient } from '@supabase/supabase-js';
import type { Env, Variables } from '../index';

export const tenantMiddleware = createMiddleware<{
  Bindings: Env;
  Variables: Variables;
}>(async (c, next) => {
  // Skip public routes
  const path = new URL(c.req.url).pathname;
  if (path.startsWith('/api/public/') || path.startsWith('/api/tenant/')) {
    await next();
    return;
  }

  const host = c.req.header('host') ?? '';
  // Strip port if present
  const domain = host.split(':')[0];

  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_ANON_KEY);

  const { data: tenant, error } = await supabase
    .from('tenants')
    .select('id, name, plan, status, custom_domain')
    .eq('custom_domain', domain)
    .single();

  if (error || !tenant) {
    return c.json({ error: 'Tenant not found', data: null }, 404);
  }

  if (tenant.status !== 'active') {
    return c.json({ error: 'Subscription inactive', data: null }, 403);
  }

  c.set('tenant', {
    id: tenant.id,
    name: tenant.name,
    plan: tenant.plan,
    status: tenant.status,
    customDomain: tenant.custom_domain,
  });

  await next();
});
