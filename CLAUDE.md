<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

<!-- nx configuration end-->

# Local dev setup — first-time clone

The Admin app uses Angular `fileReplacements` to swap a per-developer
environment file at build time.

1. Copy the template:
   ```
   cp apps/admin/src/environments/environment.local.example.ts \
      apps/admin/src/environments/environment.local.ts
   ```
2. Fill in your real `supabaseUrl` + publishable anon key from
   Supabase → Project Settings → API.
3. `nx serve admin` (development config) now uses `environment.local.ts`.
4. `nx build admin --configuration=production` uses `environment.prod.ts`
   (still a placeholder — wire real prod values at deploy time via your
   CI/CD secrets, NOT by committing them).

`environment.local.ts` is gitignored. Never commit real keys to
`environment.ts` or `environment.prod.ts`.

# Admin Auth Model

The Admin app uses an **invite-only signup model**. Do NOT add a `/signup`
page to `apps/admin/` — tenant-owner self-signup belongs on the future
marketing site (alongside Lemon Squeezy checkout). Admin handles three
auth surfaces:

- `/login` — done
- `/forgot-password` + `/reset-password` — done
- `/accept-invite` — done; reached via email link from `/team` invites
  - Spec: `docs/auth-invite-flow.spec.md`

## Supabase config required for invite + reset flows

In the Supabase dashboard:

- **Auth → URL Configuration → Redirect URLs** — add for each environment:
  - `http://localhost:4200/reset-password`
  - `http://localhost:4200/accept-invite`
  - Plus the production admin URL counterparts when deployed
- **Auth → Email Templates → Invite User** — default works; customize subject /
  body if desired. The invite link calls back to `redirectTo` set by the backend
  (`{ADMIN_URL}/accept-invite`).
- **Auth → Email Templates → Reset Password** — default works.
