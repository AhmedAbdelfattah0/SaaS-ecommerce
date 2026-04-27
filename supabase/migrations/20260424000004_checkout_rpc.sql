-- ============================================================
-- Migration: 20260424000004_checkout_rpc.sql
-- Purpose: Atomic checkout RPC function for Orders API (Task 14)
-- Uses SECURITY DEFINER to run with elevated privileges while
-- keeping all operations tenant-scoped via explicit tenant_id params.
-- ============================================================

CREATE OR REPLACE FUNCTION create_order(
  p_tenant_id uuid,
  p_customer_email text,
  p_customer_name text,
  p_customer_phone text DEFAULT NULL,
  p_customer_address jsonb DEFAULT NULL,
  p_items jsonb DEFAULT '[]',
  p_subtotal numeric DEFAULT 0,
  p_shipping numeric DEFAULT 0,
  p_total numeric DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_customer_id uuid;
  v_order_id uuid;
BEGIN
  -- Validate required inputs
  IF p_tenant_id IS NULL THEN
    RAISE EXCEPTION 'tenant_id is required';
  END IF;

  IF p_customer_email IS NULL OR p_customer_email = '' THEN
    RAISE EXCEPTION 'customer email is required';
  END IF;

  -- Upsert customer (find-or-create by email within tenant)
  INSERT INTO customers (tenant_id, email, name, phone, address)
  VALUES (p_tenant_id, p_customer_email, p_customer_name, p_customer_phone, p_customer_address)
  ON CONFLICT (tenant_id, email) DO UPDATE
    SET name = EXCLUDED.name,
        phone = COALESCE(EXCLUDED.phone, customers.phone),
        address = COALESCE(EXCLUDED.address, customers.address)
  RETURNING id INTO v_customer_id;

  -- Create order
  INSERT INTO orders (tenant_id, customer_id, status, subtotal, shipping, total)
  VALUES (p_tenant_id, v_customer_id, 'pending', p_subtotal, p_shipping, p_total)
  RETURNING id INTO v_order_id;

  -- Insert order items from jsonb array
  INSERT INTO order_items (order_id, tenant_id, product_id, variant_id, name, price, quantity)
  SELECT
    v_order_id,
    p_tenant_id,
    NULLIF(item->>'product_id', '')::uuid,
    NULLIF(item->>'variant_id', '')::uuid,
    item->>'name',
    (item->>'price')::numeric,
    (item->>'quantity')::integer
  FROM jsonb_array_elements(p_items) AS item;

  -- Insert initial status history entry
  INSERT INTO order_status_history (order_id, tenant_id, status, note)
  VALUES (v_order_id, p_tenant_id, 'pending', 'Order created');

  RETURN jsonb_build_object(
    'order_id', v_order_id,
    'customer_id', v_customer_id
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'create_order failed: %', SQLERRM;
END;
$$;

-- Revoke public execute, grant to authenticated and service_role only
REVOKE EXECUTE ON FUNCTION create_order FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_order TO authenticated;
GRANT EXECUTE ON FUNCTION create_order TO service_role;
