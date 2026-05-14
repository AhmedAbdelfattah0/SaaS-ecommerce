# Admin SCSS Partials

This directory contains shared SCSS partials for the admin app's component styles.

## Purpose

Source-code deduplication. The same `.btn` rule appeared in 10+ files, `.badge` in 8+, `.field`/`.input`/`.hint` in 7+, `.toggle` in 3, `.int-card` chrome in 2, `.skeleton` in 4. These partials eliminate that repetition.

## What this does NOT do

Reduce final CSS bundle size. Angular's emulated view encapsulation rewrites selectors with `_ngcontent-<hash>` attributes. SCSS `@use` inlines the partial at compile time — BEFORE Angular's encapsulation pass. Each consuming component still emits its own scoped copy of the partial's CSS in the final bundle. The win is source-code maintainability, not bundle size.

## Partials

| File | Contents |
|---|---|
| `_badge.scss` | `.badge`, `.badge-dot`, color variants (green/blue/purple/amber/red/gray), size variants (sm/lg) |
| `_button.scss` | `.btn`, size variants (sm/md), color variants (primary/secondary/ghost/danger/danger-outline), `.btn-full`, `.icon-btn` |
| `_form-field.scss` | `.field`, `.field label`/`.field-label`, `.input`, `.select`, `.textarea`, `.input-error`, `.hint` |
| `_toggle.scss` | `.toggle`, `.toggle::before`, `.toggle.on` |
| `_integration-card.scss` | `.int-card`, `.int-head`, `.int-logo`, `.int-name`, `.int-desc`, `.int-foot` |
| `_skeleton.scss` | `.skeleton` with `@keyframes skeleton-shimmer` |

## How to import

```scss
// Adjust the relative path based on your component's depth from apps/admin/src/
// components/ and pages/ under features/ are 5 levels deep:
@use '../../../../../styles/badge' as *;
@use '../../../../../styles/button' as *;
@use '../../../../../styles/form-field' as *;
@use '../../../../../styles/toggle' as *;
@use '../../../../../styles/integration-card' as *;
@use '../../../../../styles/skeleton' as *;
```

Always use `as *` so the imported rules are available without a namespace prefix.

## Depth reference

```
apps/admin/src/                        → depth 0 (styles/ lives here)
apps/admin/src/app/                    → depth 1
apps/admin/src/app/features/           → depth 2
apps/admin/src/app/features/<feature>/ → depth 3
apps/admin/src/app/features/<feature>/components/<comp>/  → depth 5 → '../../../../../styles/...'
apps/admin/src/app/features/<feature>/pages/<page>/       → depth 5 → '../../../../../styles/...'
```

## Theme Editor safety

NO partial in this directory declares `:root`. Only `apps/admin/src/styles.scss` may declare `:root` tokens. The Theme Editor mutates tokens at runtime via `document.documentElement.style.setProperty(...)`. All partial rules consume tokens via `var(--token)` — never hardcoded values.

## Adding new partials

1. Create `_my-partial.scss` in this directory.
2. Use `var(--token)` for all themeable values.
3. Do NOT add `:root` blocks.
4. Update this README's partials table.
5. Import in consuming components with `@use '../<depth>/styles/my-partial' as *;`.

## _tokens.scss

Intentionally NOT created. All partials reference CSS custom properties via `var(--token)` at runtime — no compile-time Sass variable access is needed. Creating `_tokens.scss` would be dead code.
