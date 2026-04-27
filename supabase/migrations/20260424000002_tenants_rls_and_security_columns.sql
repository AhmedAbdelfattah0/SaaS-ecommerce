-- ============================================================
-- Migration: 20260424000002_tenants_rls_and_security_columns.sql
-- Purpose: Fix tenants RLS, add soft-delete, add admin_users security columns
-- ============================================================

-- ========================
-- 1. TENANTS — soft delete column
-- ========================
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- ========================
-- 2. TENANTS — fix RLS policy
-- The old USING(false) blanket policy blocks all authenticated users.
-- Service role bypasses RLS automatically, so Hono backend still works.
-- We now allow tenant admins to SELECT their own tenant row.
-- ========================
DROP POLICY IF EXISTS "Service role manages tenants" ON tenants;

CREATE POLICY "Tenants select own row" ON tenants
  FOR SELECT
  USING (
    id IN (SELECT tenant_id FROM admin_users WHERE id = auth.uid())
  );

-- ========================
-- 3. ADMIN USERS — security columns for MFA, lockout, password tracking
-- ========================
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS mfa_enabled boolean DEFAULT false;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS mfa_enrolled_at timestamptz;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS last_login_at timestamptz;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS password_changed_at timestamptz DEFAULT now();
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS must_change_password boolean DEFAULT false;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS locked_until timestamptz;
