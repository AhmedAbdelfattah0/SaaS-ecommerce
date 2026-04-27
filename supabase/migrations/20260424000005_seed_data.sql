-- ============================================================
-- Migration: 20260424000005_seed_data.sql
-- Purpose: Seed 2 demo tenants + themes for development/testing
-- All inserts are idempotent via ON CONFLICT DO NOTHING
-- ============================================================

-- ========================
-- Tenant 1 — Demo Fashion Store (Pro plan, Boutique layout)
-- ========================
INSERT INTO tenants (id, name, email, custom_domain, status, plan)
VALUES (
  'aaaaaaaa-0000-0000-0000-000000000001',
  'Demo Fashion Store',
  'demo@fashionstore.com',
  'fashionstore.demo.storecraft.app',
  'active',
  'pro'
) ON CONFLICT DO NOTHING;

INSERT INTO themes (tenant_id, store_name, primary_color, secondary_color, bg_color, text_color, font_family, layout_type)
VALUES (
  'aaaaaaaa-0000-0000-0000-000000000001',
  'Demo Fashion Store',
  '#1a1a2e',
  '#e94560',
  '#ffffff',
  '#1a1a2e',
  'Poppins',
  'boutique'
) ON CONFLICT DO NOTHING;

INSERT INTO categories (tenant_id, name, slug)
VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Women', 'women'),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Men', 'men'),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Accessories', 'accessories')
ON CONFLICT DO NOTHING;

-- ========================
-- Tenant 2 — Tech Gadgets HQ (Starter plan, Catalog layout)
-- ========================
INSERT INTO tenants (id, name, email, custom_domain, status, plan)
VALUES (
  'aaaaaaaa-0000-0000-0000-000000000002',
  'Tech Gadgets HQ',
  'admin@techgadgets.com',
  'techgadgets.demo.storecraft.app',
  'active',
  'starter'
) ON CONFLICT DO NOTHING;

INSERT INTO themes (tenant_id, store_name, primary_color, secondary_color, bg_color, text_color, font_family, layout_type)
VALUES (
  'aaaaaaaa-0000-0000-0000-000000000002',
  'Tech Gadgets HQ',
  '#0f3460',
  '#e94560',
  '#f5f5f5',
  '#0f3460',
  'Roboto',
  'catalog'
) ON CONFLICT DO NOTHING;

INSERT INTO categories (tenant_id, name, slug)
VALUES
  ('aaaaaaaa-0000-0000-0000-000000000002', 'Phones', 'phones'),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'Laptops', 'laptops'),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'Audio', 'audio')
ON CONFLICT DO NOTHING;
