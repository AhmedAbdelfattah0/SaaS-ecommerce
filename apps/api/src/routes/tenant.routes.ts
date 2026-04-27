import { Hono } from 'hono';
import { createClient } from '@supabase/supabase-js';
import type { Env } from '../index';

export const tenantRouter = new Hono<{ Bindings: Env }>();

/**
 * GET /api/tenant/resolve
 * Public endpoint — reads Host header and returns minimal tenant info for Angular storefront init.
 * SECURITY: Returns ONLY { tenantId, storeName, layoutType, primaryColor }.
 * Does NOT expose plan, status, email, custom_domain, or subscription IDs.
 */
tenantRouter.get('/resolve', async (c) => {
  const host = c.req.header('host') ?? '';
  const domain = host.split(':')[0];

  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_ANON_KEY);

  // Step 1: Resolve tenant by domain — minimum fields for status check only
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('id, name, status')
    .eq('custom_domain', domain)
    .is('deleted_at', null)
    .single();

  if (tenantError || !tenant) {
    return c.json({ data: null, error: 'Tenant not found' }, 404);
  }

  if (tenant.status !== 'active') {
    return c.json({ data: null, error: 'Store is not available' }, 403);
  }

  // Step 2: Fetch theme for layout type and primary color only
  const { data: theme } = await supabase
    .from('themes')
    .select('layout_type, primary_color')
    .eq('tenant_id', tenant.id)
    .single();

  return c.json({
    data: {
      tenantId: tenant.id,
      storeName: tenant.name,
      layoutType: (theme?.layout_type as 'classic' | 'boutique' | 'catalog') ?? 'classic',
      primaryColor: theme?.primary_color ?? '#000000',
    },
    error: null,
  });
});
