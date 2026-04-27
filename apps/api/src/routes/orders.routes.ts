import { Hono } from 'hono';
import { createClient } from '@supabase/supabase-js';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { Env, Variables } from '../index';

export const ordersRouter = new Hono<{ Bindings: Env; Variables: Variables }>();

// ============================================================
// Schemas
// ============================================================

const orderStatusSchema = z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled']);

const checkoutItemSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().optional(),
  name: z.string().min(1),
  price: z.number().nonnegative(),
  quantity: z.number().int().positive(),
});

const checkoutSchema = z.object({
  customerEmail: z.string().email(),
  customerName: z.string().min(1),
  customerPhone: z.string().optional(),
  customerAddress: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      postalCode: z.string().optional(),
      country: z.string().optional(),
    })
    .optional(),
  items: z.array(checkoutItemSchema).min(1),
  subtotal: z.number().nonnegative(),
  shipping: z.number().nonnegative().default(0),
  total: z.number().nonnegative(),
});

const updateOrderSchema = z.object({
  status: orderStatusSchema,
  note: z.string().optional(),
});

const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'all']).default('all'),
  search: z.string().optional(),
});

const customerPaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
});

// ============================================================
// Helper: service-role Supabase client
// ============================================================
function serviceClient(env: Env) {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
}

// ============================================================
// Orders
// ============================================================

/**
 * GET /api/orders
 * Paginated order list for tenant admins.
 */
ordersRouter.get('/', zValidator('query', paginationSchema), async (c) => {
  const tenant = c.get('tenant');
  const { page, limit, status, search } = c.req.valid('query');
  const supabase = serviceClient(c.env);
  const offset = (page - 1) * limit;

  let query = supabase
    .from('orders')
    .select(
      `id, status, subtotal, shipping, total, created_at, updated_at,
       customers(id, name, email, phone)`,
      { count: 'exact' }
    )
    .eq('tenant_id', tenant.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status !== 'all') {
    query = query.eq('status', status);
  }

  const { data, error, count } = await query;

  if (error) {
    return c.json({ data: null, error: error.message }, 500);
  }

  // Filter by customer name/email if search provided
  let filteredData = data;
  if (search && data) {
    const term = search.toLowerCase();
    filteredData = data.filter((order) => {
      const customer = order.customers as { name?: string; email?: string } | null;
      return (
        customer?.name?.toLowerCase().includes(term) ||
        customer?.email?.toLowerCase().includes(term) ||
        order.id.toLowerCase().includes(term)
      );
    });
  }

  return c.json({
    data: filteredData,
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
 * GET /api/orders/:id
 * Order detail with items and status history.
 */
ordersRouter.get('/:id', async (c) => {
  const tenant = c.get('tenant');
  const orderId = c.req.param('id');
  const supabase = serviceClient(c.env);

  const { data: order, error } = await supabase
    .from('orders')
    .select(
      `*,
       customers(id, name, email, phone, address),
       order_items(id, product_id, variant_id, name, price, quantity),
       order_status_history(id, status, changed_at, note)`
    )
    .eq('id', orderId)
    .eq('tenant_id', tenant.id)
    .single();

  if (error || !order) {
    return c.json({ data: null, error: 'Order not found' }, 404);
  }

  return c.json({ data: order, error: null });
});

/**
 * POST /api/orders
 * Checkout — atomic transaction via Supabase RPC.
 */
ordersRouter.post('/', zValidator('json', checkoutSchema), async (c) => {
  const tenant = c.get('tenant');
  const body = c.req.valid('json');
  const supabase = serviceClient(c.env);

  // Transform items for RPC
  const items = body.items.map((item) => ({
    product_id: item.productId,
    variant_id: item.variantId ?? null,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
  }));

  const { data, error } = await supabase.rpc('create_order', {
    p_tenant_id: tenant.id,
    p_customer_email: body.customerEmail,
    p_customer_name: body.customerName,
    p_customer_phone: body.customerPhone ?? null,
    p_customer_address: body.customerAddress ?? null,
    p_items: items,
    p_subtotal: body.subtotal,
    p_shipping: body.shipping,
    p_total: body.total,
  });

  if (error) {
    return c.json({ data: null, error: error.message }, 500);
  }

  return c.json({ data, error: null }, 201);
});

/**
 * PATCH /api/orders/:id
 * Update order status — appends to status history.
 */
ordersRouter.patch('/:id', zValidator('json', updateOrderSchema), async (c) => {
  const tenant = c.get('tenant');
  const orderId = c.req.param('id');
  const { status, note } = c.req.valid('json');
  const supabase = serviceClient(c.env);

  // Update order status
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', orderId)
    .eq('tenant_id', tenant.id)
    .select()
    .single();

  if (orderError || !order) {
    return c.json({ data: null, error: 'Order not found' }, 404);
  }

  // Append status history entry
  await supabase.from('order_status_history').insert({
    order_id: orderId,
    tenant_id: tenant.id,
    status,
    note: note ?? null,
  });

  return c.json({ data: order, error: null });
});

// ============================================================
// Customers
// ============================================================

/**
 * GET /api/customers
 * Paginated customer list for tenant admin.
 */
ordersRouter.get('/customers', zValidator('query', customerPaginationSchema), async (c) => {
  const tenant = c.get('tenant');
  const { page, limit, search } = c.req.valid('query');
  const supabase = serviceClient(c.env);
  const offset = (page - 1) * limit;

  let query = supabase
    .from('customers')
    .select('id, name, email, phone, address, created_at', { count: 'exact' })
    .eq('tenant_id', tenant.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
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
 * GET /api/customers/:id
 * Customer detail with order history and total spent.
 */
ordersRouter.get('/customers/:id', async (c) => {
  const tenant = c.get('tenant');
  const customerId = c.req.param('id');
  const supabase = serviceClient(c.env);

  const [customerResult, ordersResult] = await Promise.all([
    supabase
      .from('customers')
      .select('id, name, email, phone, address, created_at')
      .eq('id', customerId)
      .eq('tenant_id', tenant.id)
      .single(),
    supabase
      .from('orders')
      .select('id, status, total, created_at')
      .eq('customer_id', customerId)
      .eq('tenant_id', tenant.id)
      .order('created_at', { ascending: false }),
  ]);

  if (customerResult.error || !customerResult.data) {
    return c.json({ data: null, error: 'Customer not found' }, 404);
  }

  const orders = ordersResult.data ?? [];
  const totalSpent = orders.reduce((sum, o) => sum + Number(o.total), 0);

  return c.json({
    data: {
      ...customerResult.data,
      orders,
      totalOrders: orders.length,
      totalSpent,
    },
    error: null,
  });
});
