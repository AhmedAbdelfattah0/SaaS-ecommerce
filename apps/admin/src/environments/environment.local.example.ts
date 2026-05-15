// Template for the gitignored environment.local.ts.
//
// First-time setup:
//   cp apps/admin/src/environments/environment.local.example.ts \
//      apps/admin/src/environments/environment.local.ts
//
// Then fill in real values from your Supabase project dashboard
// (Project Settings → API → Project URL + publishable anon key).
//
// `nx serve admin` will pick up environment.local.ts automatically via
// fileReplacements in apps/admin/project.json's development configuration.

export const environment = {
  production: false,
  // Point directly at the local wrangler dev server. CORS is wide-open
  // there (apps/api/src/index.ts uses `app.use('*', cors())`).
  apiBaseUrl: 'http://localhost:8787/api',
  supabaseUrl: 'https://YOUR_PROJECT.supabase.co',
  supabaseAnonKey: 'YOUR_ANON_KEY_HERE',
};
