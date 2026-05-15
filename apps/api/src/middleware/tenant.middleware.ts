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
  const rawDomain = host.split(':')[0];

  // Dev-mode tenant fallback — when the request arrives on a loopback
  // hostname, resolve to a designated dev tenant via DEV_TENANT_DOMAIN
  // env var. Without this, every /api/* call from `nx serve admin` would
  // 404 because no tenant has custom_domain = 'localhost'.
  const isLoopback = rawDomain === 'localhost' || rawDomain === '127.0.0.1';
  const domain = isLoopback && c.env.DEV_TENANT_DOMAIN ? c.env.DEV_TENANT_DOMAIN : rawDomain;

  // Use the service role key — anon is blocked from reading `tenants` by RLS
  // ("Service role manages tenants" USING (false)). Tenant resolution from
  // the Host header is a backend infrastructure read that must succeed for
  // every authenticated request, so this query bypasses RLS by design.
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);

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
