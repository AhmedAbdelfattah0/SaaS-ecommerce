import { Hono } from 'hono';
import { createClient } from '@supabase/supabase-js';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { Env, Variables } from '../index';

export const themeRouter = new Hono<{ Bindings: Env; Variables: Variables }>();

const themeUpdateSchema = z.object({
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  backgroundColor: z.string().optional(),
  textColor: z.string().optional(),
  fontFamily: z.string().optional(),
  logoUrl: z.string().optional(),
  storeName: z.string().optional(),
  layoutType: z.enum(['classic', 'boutique', 'catalog']).optional(),
});

/**
 * GET /api/theme
 * Public — returns theme for tenant resolved from Host header
 */
themeRouter.get('/', async (c) => {
  const host = c.req.header('host') ?? '';
  const domain = host.split(':')[0];

  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_ANON_KEY);

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('custom_domain', domain)
    .single();

  if (!tenant) {
    return c.json({ data: null, error: 'Tenant not found' }, 404);
  }

  const { data: theme, error } = await supabase
    .from('themes')
    .select('*')
    .eq('tenant_id', tenant.id)
    .single();

  if (error || !theme) {
    return c.json({ data: null, error: 'Theme not found' }, 404);
  }

  return c.json({
    data: {
      tenantId: theme.tenant_id,
      primaryColor: theme.primary_color,
      secondaryColor: theme.secondary_color,
      backgroundColor: theme.bg_color,
      textColor: theme.text_color,
      fontFamily: theme.font_family,
      logoUrl: theme.logo_url,
      storeName: theme.store_name,
      layoutType: theme.layout_type,
    },
    error: null,
  });
});

/**
 * PATCH /api/theme
 * Admin JWT required — updates theme for the authenticated tenant
 */
themeRouter.patch('/', zValidator('json', themeUpdateSchema), async (c) => {
  const tenant = c.get('tenant');
  const body = c.req.valid('json');

  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_ANON_KEY);

  const updatePayload: Record<string, unknown> = {};
  if (body.primaryColor !== undefined) updatePayload['primary_color'] = body.primaryColor;
  if (body.secondaryColor !== undefined) updatePayload['secondary_color'] = body.secondaryColor;
  if (body.backgroundColor !== undefined) updatePayload['bg_color'] = body.backgroundColor;
  if (body.textColor !== undefined) updatePayload['text_color'] = body.textColor;
  if (body.fontFamily !== undefined) updatePayload['font_family'] = body.fontFamily;
  if (body.logoUrl !== undefined) updatePayload['logo_url'] = body.logoUrl;
  if (body.storeName !== undefined) updatePayload['store_name'] = body.storeName;
  if (body.layoutType !== undefined) updatePayload['layout_type'] = body.layoutType;
  updatePayload['updated_at'] = new Date().toISOString();

  const { data: theme, error } = await supabase
    .from('themes')
    .update(updatePayload)
    .eq('tenant_id', tenant.id)
    .select()
    .single();

  if (error) {
    return c.json({ data: null, error: error.message }, 500);
  }

  return c.json({ data: theme, error: null });
});
