# Admin Auth — Invite Flow Spec (deferred)

**Status:** Deferred. Architectural decision locked; implementation waits until /team is wired and the marketing site exists.

## Architectural decision

StoreCraft Admin uses an **invite-only signup model**.

- **No `/signup` in the Admin app.** Tenant-owner self-signup happens on a future marketing site (where it integrates with Lemon Squeezy checkout, trials, and onboarding).
- Admin handles three auth surfaces only:
  1. `/login` ✅ done
  2. `/forgot-password` + `/reset-password` ✅ done
  3. `/accept-invite` 🟡 spec below, not yet built
- Rationale: B2B SaaS norms separate the marketing funnel from working-app auth. Avoid mixing B2C signup into a B2B admin.

## What to build

### 1. `/accept-invite` page (Admin app)

Page where invited users land from their email link.

- Reads `access_token` from URL hash (Supabase recovery-style flow — the same mechanism `/reset-password` already uses)
- If no token or expired token: show `<sc-banner variant="warning">` with *"Invite link is invalid or expired. Ask your tenant admin to resend."* and disable the form
- Fields (all wired through `<sc-field-error>`):
  - **Full name** — required, `minLength(2)`
  - **Password** — required, `minLength(8)` (match login validation)
  - **Confirm password** — required, must match password (custom validator — same pattern as `/reset-password`)
- "Accept invite & sign in" submit button bound to `[disabled]="isLoading() || form.invalid"`
- On submit:
  1. `supabase.auth.updateUser({ password, data: { name } })`
  2. Read `tenant_id` + `role` from `session.user.user_metadata` (set by the invite at issuance time)
  3. `POST /api/team/accept-invite` to create the `admin_users` row (RLS won't let the client write this directly before the link exists)
  4. Navigate to `/dashboard` with a one-time success banner
- Visual: matches `auth-shell` styling (`@use 'styles/auth-card' as *;` — same as login + forgot-password)

### 2. `/team` page — wire up the dead "Invite Member" button

- Modal (use `<sc-modal>`) with: email input + role select (`admin` / `staff` / `viewer`)
- On submit: `POST /api/team/invite { email, role }`
- Show `<sc-banner variant="success">` inline: *"Invite sent to {email}. They'll appear here once they accept."*
- Optional: add a "Pending invites" section showing recent invites (read from a new `pending_invites` table OR from Supabase's invite audit log — pick whichever is simpler given current schema)

### 3. Backend — `POST /api/team/invite` (Hono)

- Validates: email format, role enum, caller has `admin` or `owner` role in the tenant
- Calls:
  ```ts
  supabase.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${env.ADMIN_URL}/accept-invite`,
    data: {
      tenant_id: caller.tenant_id,
      role: requestedRole,
      invited_by: caller.id,
    },
  })
  ```
- Returns 201 with the invite ID
- On error: 4xx with descriptive message
- **Uses service role key** for the admin invite call (NOT the anon key)

### 4. Backend — `POST /api/team/accept-invite` (Hono)

- Called from the `/accept-invite` page AFTER the user has set their password via `supabase.auth.updateUser`
- Validates: caller has an active session; `tenant_id` + `role` present in `user_metadata`
- `INSERT INTO admin_users (id, tenant_id, email, role)` using:
  - `id` — authenticated user's id
  - `tenant_id` — from metadata
  - `email` — from the session
  - `role` — from metadata
- On duplicate (`admin_users.id` already exists): return 200 with *"Already accepted"* — **idempotent**
- On RLS / unexpected error: 4xx with the underlying message

### 5. Supabase config (manual; add to CLAUDE.md "Local dev setup")

- **Auth → URL Configuration → Redirect URLs**: add `http://localhost:4200/accept-invite` (dev) and the production admin URL when deployed
- **Auth → Email Templates → Invite User**: customize subject + body if desired; default works for dev

## Verification checklist

- [ ] `nx lint admin` → zero errors
- [ ] `nx build admin` → passes
- [ ] `npx tsc --noEmit` in `apps/api` → zero errors
- [ ] `nx serve admin` + `nx dev api` both boot cleanly
- [ ] Full flow test:
  1. Sign in as `bebo7391@gmail.com` (existing admin)
  2. Navigate to `/team`, click **Invite Member**
  3. Invite a second email (use a real inbox you can check)
  4. Verify the invite email arrives
  5. Click the link → land on `/accept-invite`
  6. Fill the form, submit
  7. Land on `/dashboard`
  8. In Supabase SQL editor: verify a new `admin_users` row exists for the invitee, linked to Demo Fashion Store

## Suggested commit split

When implementing, split into four focused commits:

1. `feat(admin/auth): add accept-invite page with form validation`
2. `feat(api/team): add POST /api/team/invite endpoint`
3. `feat(api/team): add POST /api/team/accept-invite endpoint`
4. `feat(admin/team): wire up invite member modal + pending invites`
