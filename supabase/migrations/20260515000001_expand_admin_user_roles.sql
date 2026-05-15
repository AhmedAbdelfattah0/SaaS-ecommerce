-- ============================================================
-- Expand admin_users.role constraint so /team invites can accept
-- the full set the Admin UI exposes:
--   owner    — tenant creator (one per tenant)
--   admin    — full admin access (was already allowed)
--   staff    — limited write access
--   viewer   — read-only
--   superadmin — platform-level (was already allowed)
--
-- Migration: 20260515000001_expand_admin_user_roles.sql
-- Required by POST /api/team/accept-invite when the inviter chose
-- staff or viewer as the role.
-- ============================================================

ALTER TABLE admin_users
  DROP CONSTRAINT IF EXISTS admin_users_role_check;

ALTER TABLE admin_users
  ADD CONSTRAINT admin_users_role_check
  CHECK (role IN ('owner', 'admin', 'staff', 'viewer', 'superadmin'));
