import { CanMatchFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

/**
 * Route guard — only matches when an authenticated session exists.
 * Otherwise redirects to /login. Used on the protected admin shell.
 */
export const authGuard: CanMatchFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isInitializing()) {
    // Block until initial Supabase session restore completes.
    // The login route is open, so any user attempting protected routes
    // briefly gets redirected here — the AuthService bootstrap completes
    // very fast and the next navigation will pass.
    return router.createUrlTree(['/login']);
  }

  if (auth.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/login']);
};

/**
 * Inverse guard — only matches when NOT authenticated.
 * Used on /login so signed-in users get bounced to /dashboard.
 */
export const guestOnlyGuard: CanMatchFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isAuthenticated()) {
    return router.createUrlTree(['/dashboard']);
  }
  return true;
};
