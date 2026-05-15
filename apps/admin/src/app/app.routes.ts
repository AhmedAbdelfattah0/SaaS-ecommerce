import { Route } from '@angular/router';
import { authGuard, guestOnlyGuard } from './core/auth/auth.guard';

export const appRoutes: Route[] = [
  {
    path: 'login',
    canMatch: [guestOnlyGuard],
    loadComponent: () =>
      import('./features/auth/pages/login-page/login-page.component').then(
        (m) => m.LoginPageComponent,
      ),
  },
  {
    path: 'forgot-password',
    canMatch: [guestOnlyGuard],
    loadComponent: () =>
      import(
        './features/auth/pages/forgot-password-page/forgot-password-page.component'
      ).then((m) => m.ForgotPasswordPageComponent),
  },
  {
    // No guard — Supabase establishes a recovery session via the URL fragment
    // when the user arrives from the password-reset email link.
    path: 'reset-password',
    loadComponent: () =>
      import(
        './features/auth/pages/reset-password-page/reset-password-page.component'
      ).then((m) => m.ResetPasswordPageComponent),
  },
  {
    // No guard — invited users arrive with a Supabase-issued session via the
    // URL fragment. The page itself checks isAuthenticated() and renders an
    // "expired link" state when no session is present.
    path: 'accept-invite',
    loadComponent: () =>
      import(
        './features/auth/pages/accept-invite-page/accept-invite-page.component'
      ).then((m) => m.AcceptInvitePageComponent),
  },
  {
    path: '',
    canMatch: [authGuard],
    loadComponent: () =>
      import('./shared/components/admin-shell/admin-shell.component').then(
        (m) => m.AdminShellComponent,
      ),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/pages/dashboard-page/dashboard-page.component').then(
            (m) => m.DashboardPageComponent,
          ),
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./features/products/pages/products-list-page/products-list-page.component').then(
            (m) => m.ProductsListPageComponent,
          ),
      },
      {
        path: 'products/:id',
        loadComponent: () =>
          import(
            './features/products/pages/product-detail-page/product-detail-page.component'
          ).then((m) => m.ProductDetailPageComponent),
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./features/orders/pages/orders-list-page/orders-list-page.component').then(
            (m) => m.OrdersListPageComponent,
          ),
      },
      {
        path: 'orders/:id',
        loadComponent: () =>
          import('./features/orders/pages/order-detail-page/order-detail-page.component').then(
            (m) => m.OrderDetailPageComponent,
          ),
      },
      {
        path: 'customers',
        loadComponent: () =>
          import(
            './features/customers/pages/customers-list-page/customers-list-page.component'
          ).then((m) => m.CustomersListPageComponent),
      },
      {
        path: 'customers/:id',
        loadComponent: () =>
          import(
            './features/customers/pages/customer-detail-page/customer-detail-page.component'
          ).then((m) => m.CustomerDetailPageComponent),
      },
      {
        path: 'theme',
        loadComponent: () =>
          import(
            './features/theme-editor/pages/theme-editor-page/theme-editor-page.component'
          ).then((m) => m.ThemeEditorPageComponent),
      },
      {
        path: 'integrations',
        loadComponent: () =>
          import(
            './features/integrations/pages/integrations-page/integrations-page.component'
          ).then((m) => m.IntegrationsPageComponent),
      },
      {
        path: 'payments',
        loadComponent: () =>
          import('./features/payments/pages/payments-page/payments-page.component').then(
            (m) => m.PaymentsPageComponent,
          ),
      },
      {
        path: 'shipping',
        loadComponent: () =>
          import('./features/shipping/pages/shipping-page/shipping-page.component').then(
            (m) => m.ShippingPageComponent,
          ),
      },
      {
        path: 'team',
        loadComponent: () =>
          import('./features/team/pages/team-page/team-page.component').then(
            (m) => m.TeamPageComponent,
          ),
      },
      {
        // Temporary redirect — the real /settings/billing page is Wave 4
        // work (Lemon Squeezy plan management). Until then the sidebar's
        // "Upgrade" card points here and falls through to the Settings
        // tab so users land on a sensible page.
        path: 'settings/billing',
        redirectTo: 'settings',
        pathMatch: 'full',
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/settings/pages/settings-page/settings-page.component').then(
            (m) => m.SettingsPageComponent,
          ),
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
