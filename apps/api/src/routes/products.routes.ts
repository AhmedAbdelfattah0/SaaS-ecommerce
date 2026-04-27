import { Hono } from 'hono';
import { createClient } from '@supabase/supabase-js';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { Env, Variables } from '../index';

export const productsRouter = new Hono<{ Bindings: Env; Variables: Variables }>();

// ============================================================
// Schemas
// ============================================================

const createProductSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  description: z.string().default(''),
  price: z.number().nonnegative(),
  comparePrice: z.number().nonnegative().optional(),
  stock: z.number().int().nonnegative().default(0),
  categoryId: z.string().uuid().optional(),
  images: z.array(z.string().url()).default([]),
  status: z.enum(['active', 'draft']).default('draft'),
});

const updateProductSchema = createProductSchema.partial();

const createVariantSchema = z.object({
  name: z.string().min(1),
  value: z.string().min(1),
  priceModifier: z.number().default(0),
  stock: z.number().int().nonnegative().default(0),
});

const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(['active', 'draft', 'all']).default('all'),
  categoryId: z.string().uuid().optional(),
  search: z.string().optional(),
});

// ============================================================
// Helper: service-role Supabase client for backend operations
// ============================================================
function serviceClient(env: Env) {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
}

// ============================================================
// Categories
// ============================================================

const createCategorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
});

/**
 * GET /api/categories
 */
productsRouter.get('/categories', async (c) => {
  const tenant = c.get('tenant');
  const supabase = serviceClient(c.env);

  const { data, error } = await supabase
    .from('categories')
    .select('id, name, slug, created_at')
    .eq('tenant_id', tenant.id)
    .order('name', { ascending: true });

  if (error) {
    return c.json({ data: null, error: error.message }, 500);
  }

  return c.json({ data, error: null });
});

/**
 * POST /api/categories
 */
productsRouter.post('/categories', zValidator('json', createCategorySchema), async (c) => {
  const tenant = c.get('tenant');
  const body = c.req.valid('json');
  const supabase = serviceClient(c.env);

  const { data, error } = await supabase
    .from('categories')
    .insert({ tenant_id: tenant.id, name: body.name, slug: body.slug })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return c.json({ data: null, error: 'Category slug already exists' }, 409);
    }
    return c.json({ data: null, error: error.message }, 500);
  }

  return c.json({ data, error: null }, 201);
});

/**
 * DELETE /api/categories/:id
 */
productsRouter.delete('/categories/:id', async (c) => {
  const tenant = c.get('tenant');
  const categoryId = c.req.param('id');
  const supabase = serviceClient(c.env);

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', categoryId)
    .eq('tenant_id', tenant.id);

  if (error) {
    return c.json({ data: null, error: error.message }, 500);
  }

  return c.json({ data: { deleted: true }, error: null });
});

// ============================================================
// Products
// ============================================================

/**
 * GET /api/products
 * Paginated list. Storefront: ?status=active only. Admin: all statuses.
 * Never returns status=deleted.
 */
productsRouter.get('/', zValidator('query', paginationSchema), async (c) => {
  const tenant = c.get('tenant');
  const { page, limit, status, categoryId, search } = c.req.valid('query');
  const supabase = serviceClient(c.env);
  const offset = (page - 1) * limit;

  let query = supabase
    .from('products')
    .select('id, name, slug, description, price, compare_price, stock, category_id, images, status, created_at, updated_at', { count: 'exact' })
    .eq('tenant_id', tenant.id)
    .neq('status', 'deleted')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status !== 'all') {
    query = query.eq('status', status);
  }

  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  if (search) {
    query = query.ilike('name', `%${search}%`);
  }

  const { data, error, count } = await query;

  if (error) {
    return c.json({ data: null, error: error.message }, 500);
  }

  return c.json({
    data,
    error: null,
    meta: {
      total: count ?? 0,
      page,
      limit,
      totalPages: Math.ceil((count ?? 0) / limit),
    },
  });
});

/**
 * POST /api/products
 */
productsRouter.post('/', zValidator('json', createProductSchema), async (c) => {
  const tenant = c.get('tenant');
  const body = c.req.valid('json');
  const supabase = serviceClient(c.env);

  const { data, error } = await supabase
    .from('products')
    .insert({
      tenant_id: tenant.id,
      name: body.name,
      slug: body.slug,
      description: body.description,
      price: body.price,
      compare_price: body.comparePrice,
      stock: body.stock,
      category_id: body.categoryId,
      images: body.images,
      status: body.status,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return c.json({ data: null, error: 'Product slug already exists' }, 409);
    }
    return c.json({ data: null, error: error.message }, 500);
  }

  return c.json({ data, error: null }, 201);
});

/**
 * GET /api/products/:id
 */
productsRouter.get('/:id', async (c) => {
  const tenant = c.get('tenant');
  const productId = c.req.param('id');
  const supabase = serviceClient(c.env);

  const { data: product, error } = await supabase
    .from('products')
    .select('*, product_variants(*)')
    .eq('id', productId)
    .eq('tenant_id', tenant.id)
    .neq('status', 'deleted')
    .single();

  if (error || !product) {
    return c.json({ data: null, error: 'Product not found' }, 404);
  }

  return c.json({ data: product, error: null });
});

/**
 * PATCH /api/products/:id
 */
productsRouter.patch('/:id', zValidator('json', updateProductSchema), async (c) => {
  const tenant = c.get('tenant');
  const productId = c.req.param('id');
  const body = c.req.valid('json');
  const supabase = serviceClient(c.env);

  const updatePayload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.name !== undefined) updatePayload['name'] = body.name;
  if (body.slug !== undefined) updatePayload['slug'] = body.slug;
  if (body.description !== undefined) updatePayload['description'] = body.description;
  if (body.price !== undefined) updatePayload['price'] = body.price;
  if (body.comparePrice !== undefined) updatePayload['compare_price'] = body.comparePrice;
  if (body.stock !== undefined) updatePayload['stock'] = body.stock;
  if (body.categoryId !== undefined) updatePayload['category_id'] = body.categoryId;
  if (body.images !== undefined) updatePayload['images'] = body.images;
  if (body.status !== undefined) updatePayload['status'] = body.status;

  const { data, error } = await supabase
    .from('products')
    .update(updatePayload)
    .eq('id', productId)
    .eq('tenant_id', tenant.id)
    .select()
    .single();

  if (error) {
    return c.json({ data: null, error: error.message }, 500);
  }

  return c.json({ data, error: null });
});

/**
 * DELETE /api/products/:id
 * Soft delete — sets status to 'deleted'
 */
productsRouter.delete('/:id', async (c) => {
  const tenant = c.get('tenant');
  const productId = c.req.param('id');
  const supabase = serviceClient(c.env);

  const { error } = await supabase
    .from('products')
    .update({ status: 'deleted', updated_at: new Date().toISOString() })
    .eq('id', productId)
    .eq('tenant_id', tenant.id);

  if (error) {
    return c.json({ data: null, error: error.message }, 500);
  }

  return c.json({ data: { deleted: true }, error: null });
});

// ============================================================
// Product Variants
// ============================================================

/**
 * POST /api/products/:id/variants
 */
productsRouter.post('/:id/variants', zValidator('json', createVariantSchema), async (c) => {
  const tenant = c.get('tenant');
  const productId = c.req.param('id');
  const body = c.req.valid('json');
  const supabase = serviceClient(c.env);

  // Verify product belongs to tenant
  const { data: product } = await supabase
    .from('products')
    .select('id')
    .eq('id', productId)
    .eq('tenant_id', tenant.id)
    .single();

  if (!product) {
    return c.json({ data: null, error: 'Product not found' }, 404);
  }

  const { data, error } = await supabase
    .from('product_variants')
    .insert({
      product_id: productId,
      tenant_id: tenant.id,
      name: body.name,
      value: body.value,
      price_modifier: body.priceModifier,
      stock: body.stock,
    })
    .select()
    .single();

  if (error) {
    return c.json({ data: null, error: error.message }, 500);
  }

  return c.json({ data, error: null }, 201);
});

/**
 * DELETE /api/products/:id/variants/:variantId
 */
productsRouter.delete('/:id/variants/:variantId', async (c) => {
  const tenant = c.get('tenant');
  const variantId = c.req.param('variantId');
  const supabase = serviceClient(c.env);

  const { error } = await supabase
    .from('product_variants')
    .delete()
    .eq('id', variantId)
    .eq('tenant_id', tenant.id);

  if (error) {
    return c.json({ data: null, error: error.message }, 500);
  }

  return c.json({ data: { deleted: true }, error: null });
});
