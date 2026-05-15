# Stage 10 — Polish debt surfaced from real usage

After Stages 1–9 finished the SCSS architecture refactor and Stage 9b's
auth/invite work brought the admin app online against real Supabase, a
backlog of polish items emerged from actually clicking through the
product. This doc captures that scope. Do not execute it as one chunk —
each section is independently shippable and reviewable.

Status legend: 🔴 = not started · 🟡 = partially landed (see notes) · 🟢 = done

---

## 1. Form validation rollout — full audit pass 🟡

Two waves landed so far:

- **Wave A (already shipped):** sc-field-error wired across the six
  forms that had `Validators.*` rules:
  login, product, forgot-password, reset-password, accept-invite, team-invite.
- **Wave B (already shipped):** theme-editor color-picker / logo-upload /
  storeName + proactive password hints under auth password fields.

Remaining work — pages that have inputs but **no real form yet**:

### 1.1 `/settings` page 🔴

Template-driven `[value]` bindings on a static `svc.settings()` signal.
Save Changes button is unwired. Needs:

- Convert to a Reactive `FormGroup` (or several grouped controls)
- Validators per field:
  - `storeName`: required, minLength(2)
  - `storeEmail`: required, Validators.email
  - `storePhone`: optional, pattern for E.164 / local format
  - `currency`, `timezone`, `language`: required (selects)
  - `subdomain`: required, pattern `[a-z0-9-]{3,}`
  - `customDomain`: optional, pattern (FQDN)
  - `notification toggles`: bool, no validation
  - `primaryColor`: pattern (hex) — same rule as color-picker
- Wire `<sc-field-error>` under each validated input
- Wire Save Changes → `ApiService.updateSettings()` (endpoint not yet exposed)
- Pre-fill `<sc-banner variant="success">` on save success, error on failure
- Danger Zone confirmation modals (Pause Store / Delete Store) use
  `<sc-modal>` with explicit type-the-name guards

### 1.2 `/payments` page 🔴

Provider config inputs are currently readonly. Real impl needs:

- One `FormGroup` per provider (Paymob / Fawry / Valu / COD)
- Validators:
  - Paymob: apiKey required + minLength, integrationId* required (numeric),
    iframeId required (numeric)
  - Fawry: merchantCode required, securityKey required
  - Valu: merchantId required
  - COD: fee number ≥ 0, feeType enum
- Toggle is the gate — when off, fields are disabled (not removed)
- sc-field-error wired
- Save button per card, OR single Save Changes header button

### 1.3 `/shipping` page 🔴

- Zones: row-edit modal with `name`, `countries[]`, `rate.type` enum,
  `rate.price` number, `estimatedDays` string
- Carriers grid: connect-flow modal for each (carrier-specific creds)
- Flat-rate fallback: real form with `fallbackRate` number ≥ 0,
  `freeShippingThreshold` number ≥ 0
- All wired through sc-field-error

### 1.4 `/team` page 🔴

- Edit Role (pencil icon): currently dead UI. Needs:
  - `<sc-modal>` with role select + reason note (audit log)
  - `PATCH /api/team/:id/role` endpoint (new)
  - Role select bound to a Reactive FormControl + sc-field-error
- Remove Member confirmation: replace the current `confirm()` with
  `<sc-modal>` + reason field

### 1.5 Customer-detail edit form 🔴

Currently read-only. If editing customers is in scope:

- Inline `<sc-modal>` "Edit customer" form
- Reactive form: name (required), email (Validators.email), phone
  (optional pattern), address fields
- `PATCH /api/customers/:id` endpoint (new)

### Pattern recap (apply to all 1.x sections)

```html
<input class="input" formControlName="…"
       [class.is-invalid]="ctrl.touched && ctrl.invalid"
       [attr.aria-invalid]="ctrl.touched && ctrl.invalid" />
<sc-field-error [control]="ctrl" fieldLabel="…"
                [messages]="{ required: '…', minlength: '…' }" />
```

Commit one section at a time — never a monolithic "all forms" commit.

---

## 2. sc-toast component 🔴

Deferred from Stage 9. Needed for transient feedback that's
inappropriate for a sticky `<sc-banner>`:

- "Status updated" (orders detail page — currently inline badges with
  `// TODO(stage-9)` markers)
- "Saved successfully" (anywhere with save buttons)
- "Email sent" / "Invite sent" (could replace some current banner uses
  where the message is purely confirmational)
- "Link copied to clipboard"

Design constraints:

- Lives in `libs/ui` alongside the other `sc-*` components
- Portal-rendered into a host element on document.body (not inside the
  triggering component's view) so toasts survive route changes
- Stack vertically, top-right by default (RTL-aware)
- Auto-dismiss after ~4s, hover pauses, dismissible by user
- API: `toastService.success('Saved')` / `.error()` / `.info()` /
  `.warning(message, { duration?, action? })`
- Token-driven colors (var(--color-success) etc.)
- ARIA: `role="status"` for info/success, `role="alert"` for error/warning

Once shipped, migrate:
- orders detail-page transient badges → `toastService.success('Status updated')`
- team-page invite-success banner → keep banner (it's confirmational +
  in-page context); or convert to toast — designer call
- product-form save success → toast

---

## 3. Local dev setup script 🔴

The current "new developer onboarding" dance is ~30 minutes of
copy-paste from CLAUDE.md and one-off SQL inserts. Bundle into
`scripts/setup-local-dev.sh`:

1. Confirm prereqs: `node`, `npm`, `supabase` CLI installed
2. `cp apps/admin/src/environments/environment.local.example.ts
      apps/admin/src/environments/environment.local.ts`
   — prompt for SUPABASE_URL + SUPABASE_ANON_KEY, write them in
3. Generate `apps/api/.dev.vars` from a template, prompt for
   SUPABASE_SERVICE_ROLE_KEY, LEMONSQUEEZY_API_KEY (placeholder OK for
   first run), LEMONSQUEEZY_WEBHOOK_SECRET (placeholder OK)
4. Apply Supabase migrations: `supabase db push`
5. Prompt for the dev admin's email, look up `auth.users.id` via the
   Supabase admin API (or skip — instruct the user to sign up first
   then re-run with `--seed-admin`)
6. INSERT into admin_users linking the dev admin to the seeded
   "Demo Fashion Store" tenant with role='owner'
7. Verify by hitting `/health` on the API and the SPA shell on the
   admin
8. Print a green "ready to go — `nx serve admin` + `nx dev api`" final

Bash or Node — either is fine. Bash is more portable, Node lets us
reuse the existing Supabase client.

---

### §C1 — Custom date-range picker on dashboard 🔴

The Wave-3 polish pass shipped:
- 7D/30D/90D pill toggle (was already wired via sc-tabs)
- KPI mock numbers now scale per active range so the toggle visibly changes
  the page (deterministic — see `scaleForRange()` in dashboard.service.ts)
- Active range surfaces as a read-only date label ("Apr 19 – Apr 26, 2026")
  next to the pills

Remaining for a fully-featured experience:
- Custom date-range picker (replace the read-only label with a clickable
  date-range control). Native `<input type="date">` range is acceptable;
  a richer Flatpickr-style picker is a Stage 11 nice-to-have.
- Real `/api/analytics/dashboard?range=…` endpoint feeding revenue chart,
  donut segments, top products, low stock. Currently those are static mocks
  that don't change with range — only KPI numbers do.
- Persist last-used range in localStorage so a returning user sees their
  preferred window.

## 4. Real-usage UX items surfaced 🟡

Caught during the recent end-to-end test:

### 4.1 Login redirect race 🟢

Fixed in commit 2233b63 — `authGuard` / `guestOnlyGuard` now wait for
the initial Supabase session restore before deciding. Refresh on a
protected page no longer bounces to /login.

### 4.2 Dev proxy never worked 🟢

Fixed in commit a7f8881 — replaced the silently-ignored
`@angular/build:dev-server` proxyConfig with a direct
`apiBaseUrl: 'http://localhost:8787/api'` override in
`environment.local.ts`. CORS is wide-open on the API so this just
works.

### 4.3 Tenant middleware blocked all loopback requests 🟢

Fixed in commit 62b4d16 + 0d9d927:
- `tenant.middleware.ts` now falls back to `DEV_TENANT_DOMAIN` env var
  when host is `localhost` / `127.0.0.1`
- Uses `SUPABASE_SERVICE_ROLE_KEY` instead of the anon key (RLS
  blocks anon on `tenants`)

### 4.4 Demo tenant has no `admin_users` seed 🔴

Per-developer manual SQL INSERT is required after the first Supabase
auth signup. Captured in section 3 above — the setup script should
handle it.

### 4.5 Sentry runtime monitoring 🔴

TODO marker in `apps/api/src/index.ts` since Stage 1. Park here so it
doesn't get forgotten.

---

## 5. Tracking debt from TODO(stage-9) markers 🟡

Still in the codebase after Stage 9 completed (most are dedup
candidates, not bugs):

- `customer-orders.component.scss:3` — sc-badge component unification
- `customer-stats.component.scss:3` — stat-tile / kpi-card consolidation
- `product-status-badge.component.scss:1` — sc-badge unification
- `status-badge.component.scss:3` — sc-badge unification
- `order-status-badge.component.scss:3` — sc-badge unification
- `font-selector.component.scss:42` — color-mix() ring upgrade
- `team-page.component.scss:108,124` — was for hard-coded role colors,
  resolved in commit 83bcee3 (semantic role tokens)
- `orders-list-page.component.ts:114` — avatarColorForName call-site
  alignment between name-hash and id-hash variants
- `order-detail-page.component.scss:90` — sc-toast for transient
  feedback (captured in section 2 above)

Run `grep -rn 'TODO(stage-9)' apps/admin/src libs/ui/src libs/utils/src`
before kicking off any unification work to make sure the list above is
current.

---

## Suggested execution order

1. Pick ONE of section 1's pages (settings is probably most valuable
   first since it's user-visible immediately) and ship it.
2. Build sc-toast (section 2) — unlocks better UX across the rest of
   section 1 and resolves the orders transient-feedback debt.
3. Local dev script (section 3) — pays off the moment the next
   contributor joins.
4. Remaining section 1 pages in order of user-visibility:
   payments, shipping, team edit-role, customer edit.

No section blocks any other — pick what's most valuable to ship first.
