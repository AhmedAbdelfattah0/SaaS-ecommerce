-- ============================================================
-- Migration: 20260424000003_audit_and_security_tables.sql
-- Purpose: Audit logs (append-only), failed login tracking, webhook idempotency
-- ============================================================

-- ========================
-- 1. AUDIT LOGS — append-only security audit trail
-- No UPDATE policy. No DELETE policy. Enforced at RLS level.
-- Backend writes via service role (bypasses RLS).
-- ========================
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE SET NULL,
  actor_type text NOT NULL,
  actor_id uuid,
  actor_email text,
  action text NOT NULL,
  resource_type text,
  resource_id text,
  ip_address inet,
  user_agent text,
  request_id text,
  metadata jsonb DEFAULT '{}',
  severity text NOT NULL DEFAULT 'info',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Tenant admins can read their own audit logs
CREATE POLICY "Tenant can read own audit logs" ON audit_logs
  FOR SELECT
  USING (
    tenant_id IN (SELECT tenant_id FROM admin_users WHERE id = auth.uid())
  );

-- Intentionally NO INSERT policy for users — service role writes logs from backend
-- Intentionally NO UPDATE policy — audit logs are append-only
-- Intentionally NO DELETE policy — audit logs are append-only

CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity);

-- ========================
-- 2. FAILED LOGIN ATTEMPTS — brute-force tracking
-- Service role only. No user-level policies.
-- Lockout enforcement is in Task 24; this table is for tracking only.
-- ========================
CREATE TABLE IF NOT EXISTS failed_login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  ip_address inet,
  attempted_at timestamptz DEFAULT now(),
  reason text
);

ALTER TABLE failed_login_attempts ENABLE ROW LEVEL SECURITY;

-- No user-level policies — service role (Hono backend) writes and reads via bypass
-- This prevents any authenticated user from querying the attempts table

CREATE INDEX IF NOT EXISTS idx_failed_login_email ON failed_login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_failed_login_ip ON failed_login_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_failed_login_attempted_at ON failed_login_attempts(attempted_at);

-- ========================
-- 3. WEBHOOK EVENTS — idempotency for Lemon Squeezy webhooks
-- Unique constraint on event_id prevents duplicate processing.
-- ========================
CREATE TABLE IF NOT EXISTS webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text UNIQUE NOT NULL,
  provider text NOT NULL DEFAULT 'lemonsqueezy',
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}',
  processed_at timestamptz DEFAULT now(),
  processing_status text NOT NULL DEFAULT 'processed'
    CHECK (processing_status IN ('processed', 'failed', 'skipped'))
);

ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- No user-level policies — service role only (Hono webhook handler writes via bypass)

CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id ON webhook_events(event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed_at ON webhook_events(processed_at);
CREATE INDEX IF NOT EXISTS idx_webhook_events_provider ON webhook_events(provider);
