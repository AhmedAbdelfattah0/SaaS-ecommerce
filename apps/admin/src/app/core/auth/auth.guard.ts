import { CanMatchFn, Router } from '@angular/router';
import { effect, inject, Injector, runInInjectionContext } from '@angular/core';
import { AuthService } from './auth.service';

/**
 * Resolves once AuthService has finished its initial Supabase session
 * restore. Both guards below await this so a hard refresh on a protected
 * route doesn't bounce to /login while the persisted session is still
 * being read from localStorage.
 */
function waitForAuthReady(auth: AuthService, injector: Injector): Promise<void> {
  if (!auth.isInitializing()) return Promise.resolve();
  return new Promise((resolve) => {
    runInInjectionContext(injector, () => {
      const ref = effect((onCleanup) => {
        if (!auth.isInitializing()) {
          onCleanup(() => ref.destroy());
          resolve();
        }
      });
    });
  });
}

/**
 * Route guard — only matches when an authenticated session exists.
 * Otherwise redirects to /login. Used on the protected admin shell.
 */
export const authGuard: CanMatchFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const injector = inject(Injector);

  await waitForAuthReady(auth, injector);

  if (auth.isAuthenticated()) {
    return true;
  }
  return router.createUrlTree(['/login']);
};

/**
 * Inverse guard — only matches when NOT authenticated.
 * Used on /login so signed-in users get bounced to /dashboard.
 */
export const guestOnlyGuard: CanMatchFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const injector = inject(Injector);

  await waitForAuthReady(auth, injector);

  if (auth.isAuthenticated()) {
    return router.createUrlTree(['/dashboard']);
  }
  return true;
};
