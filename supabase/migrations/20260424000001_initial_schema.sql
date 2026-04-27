-- ============================================================
-- StoreCraft Multi-Tenant Supabase Schema — Initial Migration
-- Migration: 20260424000001_initial_schema.sql
-- ============================================================

-- ========================
-- 1. TENANTS
-- ========================
CREATE TABLE IF NOT EXISTS tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  custom_domain text UNIQUE,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'suspended', 'cancelled')),
  plan text NOT NULL DEFAULT 'starter'
    CHECK (plan IN ('starter', 'pro')),
  lemon_squeezy_subscription_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Blanket deny — service role bypasses RLS automatically
-- Real SELECT policy added in migration 20260424000002
CREATE POLICY "Service role manages tenants" ON tenants
  USING (false);

-- ========================
-- 2. THEMES
-- ========================
CREATE TABLE IF NOT EXISTS themes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  store_name text NOT NULL,
  primary_color text NOT NULL DEFAULT '#000000',
  secondary_color text NOT NULL DEFAULT '#ffffff',
  bg_color text NOT NULL DEFAULT '#ffffff',
  text_color text NOT NULL DEFAULT '#000000',
  font_family text NOT NULL DEFAULT 'Inter',
  logo_url text,
  layout_type text NOT NULL DEFAULT 'classic'
    CHECK (layout_type IN ('classic', 'boutique', 'catalog')),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE themes ENABLE ROW LEVEL SECURITY;

-- Public read — storefront reads theme without auth
CREATE POLICY "Public can read theme" ON themes
  FOR SELECT USING (true);

-- Admin can update their own tenant's theme
CREATE POLICY "Admin can update own theme" ON themes
  FOR UPDATE
  USING (
    tenant_id = (
      SELECT tenant_id FROM admin_users WHERE id = auth.uid()
    )
  );

-- ========================
-- 3. ADMIN USERS (declared early — referenced by themes and other policies)
-- ========================
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'superadmin')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can read own record" ON admin_users
  FOR SELECT
  USING (id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_admin_users_tenant_id ON admin_users(tenant_id);

-- ========================
-- 4. CATEGORIES
-- ========================
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  slug text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (tenant_id, slug)
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can access categories" ON categories
  FOR ALL
  USING (
    tenant_id = (SELECT tenant_id FROM admin_users WHERE id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_categories_tenant_id ON categories(tenant_id);

-- ========================
-- 5. PRODUCTS
-- ========================
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  slug text NOT NULL,
  description text NOT NULL DEFAULT '',
  price numeric(10, 2) NOT NULL DEFAULT 0,
  compare_price numeric(10, 2),
  stock integer NOT NULL DEFAULT 0,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  images jsonb NOT NULL DEFAULT '[]',
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('active', 'draft', 'deleted')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (tenant_id, slug)
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can manage products" ON products
  FOR ALL
  USING (
    tenant_id = (SELECT tenant_id FROM admin_users WHERE id = auth.uid())
  );

-- Public can read active products (storefront)
CREATE POLICY "Public can read active products" ON products
  FOR SELECT
  USING (status = 'active');

CREATE INDEX IF NOT EXISTS idx_products_tenant_id ON products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);

-- ========================
-- 6. PRODUCT VARIANTS
-- ========================
CREATE TABLE IF NOT EXISTS product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  value text NOT NULL,
  price_modifier numeric(10, 2) NOT NULL DEFAULT 0,
  stock integer NOT NULL DEFAULT 0
);

ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can manage variants" ON product_variants
  FOR ALL
  USING (
    tenant_id = (SELECT tenant_id FROM admin_users WHERE id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_product_variants_tenant_id ON product_variants(tenant_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);

-- ========================
-- 7. CUSTOMERS
-- ========================
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  address jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE (tenant_id, email)
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can view customers" ON customers
  FOR SELECT
  USING (
    tenant_id = (SELECT tenant_id FROM admin_users WHERE id = auth.uid())
  );

CREATE POLICY "Allow insert for checkout" ON customers
  FOR INSERT
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_customers_tenant_id ON customers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(tenant_id, email);

-- ========================
-- 8. ORDERS
-- ========================
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  customer_id uuid REFERENCES customers(id),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  subtotal numeric(10, 2) NOT NULL DEFAULT 0,
  shipping numeric(10, 2) NOT NULL DEFAULT 0,
  total numeric(10, 2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can manage orders" ON orders
  FOR ALL
  USING (
    tenant_id = (SELECT tenant_id FROM admin_users WHERE id = auth.uid())
  );

CREATE POLICY "Allow insert for checkout" ON orders
  FOR INSERT
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_orders_tenant_id ON orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- ========================
-- 9. ORDER ITEMS
-- ========================
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES products(id),
  variant_id uuid REFERENCES product_variants(id),
  name text NOT NULL,
  price numeric(10, 2) NOT NULL,
  quantity integer NOT NULL DEFAULT 1
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can view order items" ON order_items
  FOR SELECT
  USING (
    tenant_id = (SELECT tenant_id FROM admin_users WHERE id = auth.uid())
  );

CREATE POLICY "Allow insert for checkout" ON order_items
  FOR INSERT
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_order_items_tenant_id ON order_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- ========================
-- 10. ORDER STATUS HISTORY
-- ========================
CREATE TABLE IF NOT EXISTS order_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL,
  changed_at timestamptz DEFAULT now(),
  note text
);

ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can view status history" ON order_status_history
  FOR SELECT
  USING (
    tenant_id = (SELECT tenant_id FROM admin_users WHERE id = auth.uid())
  );

CREATE POLICY "Allow insert for status changes" ON order_status_history
  FOR INSERT
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_order_status_history_tenant_id ON order_status_history(tenant_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON order_status_history(order_id);
