import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

/**
 * Attaches the Supabase access token to every /api/* request.
 * Handles 401 (sign out + redirect) and 403/MFA_REQUIRED (redirect to MFA placeholder).
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const isApiRequest =
    req.url.startsWith(environment.apiBaseUrl) ||
    req.url.startsWith('/api') ||
    req.url.includes('/api/');

  let outgoing = req;
  if (isApiRequest) {
    const token = auth.accessToken();
    if (token) {
      outgoing = req.clone({
        setHeaders: { Authorization: `Bearer ${token}` },
      });
    }
  }

  return next(outgoing).pipe(
    catchError((err: HttpErrorResponse) => {
      if (!isApiRequest) {
        return throwError(() => err);
      }

      if (err.status === 401) {
        void auth.forceSignOut();
      } else if (err.status === 403 && err.error?.code === 'MFA_REQUIRED') {
        void router.navigate(['/mfa-verify']);
      }

      return throwError(() => err);
    }),
  );
};
