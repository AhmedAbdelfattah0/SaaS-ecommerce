import {
  Injectable,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

export interface AdminProfile {
  id: string;
  email: string;
  fullName: string;
  role: 'owner' | 'admin' | 'staff';
  tenantId: string;
}

export type AuthErrorKind = 'invalid_credentials' | 'mfa_required' | 'unknown';

export interface AuthError {
  kind: AuthErrorKind;
  message: string;
}

const SESSION_STORAGE_KEY = 'sc_admin_session';

/**
 * Auth ViewModel — wraps Supabase Auth client.
 *
 * Components inject this and bind to its signals; never call Supabase directly.
 * AuthInterceptor reads `accessToken()` to attach the JWT to /api/* requests.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);

  private readonly _user = signal<AdminProfile | null>(null);
  private readonly _accessToken = signal<string | null>(null);
  private readonly _isInitializing = signal<boolean>(true);
  private readonly _isAuthenticating = signal<boolean>(false);
  private readonly _error = signal<AuthError | null>(null);

  // ─── Password reset flow ─────────────────────────────────
  private readonly _isRequestingReset = signal<boolean>(false);
  private readonly _resetEmailSent = signal<boolean>(false);
  private readonly _resetError = signal<string | null>(null);

  // ─── Password update flow (after recovery link) ──────────
  private readonly _isUpdatingPassword = signal<boolean>(false);
  private readonly _passwordUpdateError = signal<string | null>(null);

  readonly user = this._user.asReadonly();
  readonly accessToken = this._accessToken.asReadonly();
  readonly isInitializing = this._isInitializing.asReadonly();
  readonly isAuthenticating = this._isAuthenticating.asReadonly();
  readonly error = this._error.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null);

  readonly isRequestingReset = this._isRequestingReset.asReadonly();
  readonly resetEmailSent = this._resetEmailSent.asReadonly();
  readonly resetError = this._resetError.asReadonly();
  readonly isUpdatingPassword = this._isUpdatingPassword.asReadonly();
  readonly passwordUpdateError = this._passwordUpdateError.asReadonly();

  private readonly supabase: SupabaseClient | null;

  constructor() {
    this.supabase = isPlatformBrowser(this.platformId)
      ? createClient(environment.supabaseUrl, environment.supabaseAnonKey, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            storageKey: SESSION_STORAGE_KEY,
          },
        })
      : null;

    void this.bootstrap();

    effect(() => {
      const session = this._accessToken();
      if (isPlatformBrowser(this.platformId) && session) {
        // Token signal watched by interceptor — no further action needed.
      }
    });
  }

  async login(email: string, password: string): Promise<void> {
    if (!this.supabase) return;
    this._error.set(null);
    this._isAuthenticating.set(true);
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });
      if (error) {
        this._error.set({
          kind: this.classifyError(error.message),
          message: error.message,
        });
        return;
      }
      if (!data.session) {
        this._error.set({ kind: 'unknown', message: 'Login succeeded but no session returned.' });
        return;
      }
      await this.applySession(data.session);
      await this.router.navigate(['/dashboard']);
    } catch (err) {
      this._error.set({
        kind: 'unknown',
        message: err instanceof Error ? err.message : 'Unknown sign-in error',
      });
    } finally {
      this._isAuthenticating.set(false);
    }
  }

  async logout(): Promise<void> {
    if (this.supabase) {
      await this.supabase.auth.signOut();
    }
    this.clearSession();
    await this.router.navigate(['/login']);
  }

  /** Called by interceptor on 401 — clear session and redirect. */
  async forceSignOut(): Promise<void> {
    this.clearSession();
    if (this.supabase) {
      await this.supabase.auth.signOut().catch(() => undefined);
    }
    await this.router.navigate(['/login']);
  }

  clearError(): void {
    this._error.set(null);
  }

  /**
   * Send a password-reset email via Supabase Auth. The user clicks the link
   * in the email which lands on /reset-password — Supabase auto-establishes
   * a recovery session there, after which the user can call updatePassword().
   */
  async requestPasswordReset(email: string): Promise<void> {
    if (!this.supabase) return;
    this._isRequestingReset.set(true);
    this._resetEmailSent.set(false);
    this._resetError.set(null);
    try {
      const redirectTo = isPlatformBrowser(this.platformId)
        ? `${window.location.origin}/reset-password`
        : undefined;
      const { error } = await this.supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) {
        this._resetError.set(error.message);
        return;
      }
      this._resetEmailSent.set(true);
    } catch (err) {
      this._resetError.set(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      this._isRequestingReset.set(false);
    }
  }

  /**
   * Update the current user's password. Requires an active session — typically
   * the recovery session established by clicking the email link, or the user's
   * normal logged-in session.
   */
  async updatePassword(newPassword: string): Promise<void> {
    if (!this.supabase) return;
    this._isUpdatingPassword.set(true);
    this._passwordUpdateError.set(null);
    try {
      const { error } = await this.supabase.auth.updateUser({ password: newPassword });
      if (error) {
        this._passwordUpdateError.set(error.message);
        return;
      }
      await this.router.navigate(['/dashboard']);
    } catch (err) {
      this._passwordUpdateError.set(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      this._isUpdatingPassword.set(false);
    }
  }

  clearResetState(): void {
    this._resetEmailSent.set(false);
    this._resetError.set(null);
    this._passwordUpdateError.set(null);
  }

  /**
   * Apply the invitee's chosen password + full name during the /accept-invite
   * flow. Does NOT navigate or call the backend — the caller (form service)
   * chains the backend `acceptInvite` call before navigating.
   *
   * Returns { ok: true } on success or { ok: false, error } on failure.
   */
  async applyInviteUpdate(
    name: string,
    password: string,
  ): Promise<{ ok: true } | { ok: false; error: string }> {
    if (!this.supabase) return { ok: false, error: 'Supabase client not initialized' };
    try {
      const { error } = await this.supabase.auth.updateUser({
        password,
        data: { full_name: name },
      });
      if (error) return { ok: false, error: error.message };
      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  }

  /**
   * Re-read the current session and refresh the local profile signal.
   * Called from /accept-invite after the backend creates the admin_users
   * row so the in-memory profile picks up the new role + tenant.
   */
  async refreshSession(): Promise<void> {
    if (!this.supabase) return;
    const { data } = await this.supabase.auth.getSession();
    if (data.session) {
      await this.applySession(data.session);
    }
  }

  private async bootstrap(): Promise<void> {
    if (!this.supabase) {
      this._isInitializing.set(false);
      return;
    }
    try {
      const { data } = await this.supabase.auth.getSession();
      if (data.session) {
        await this.applySession(data.session);
      }
      this.supabase.auth.onAuthStateChange((_event, session) => {
        if (session) {
          void this.applySession(session);
        } else {
          this.clearSession();
        }
      });
    } finally {
      this._isInitializing.set(false);
    }
  }

  private async applySession(session: Session): Promise<void> {
    this._accessToken.set(session.access_token);
    const meta = (session.user.user_metadata ?? {}) as {
      full_name?: string;
      role?: AdminProfile['role'];
      tenant_id?: string;
    };
    const profile: AdminProfile = {
      id: session.user.id,
      email: session.user.email ?? '',
      fullName: meta.full_name ?? session.user.email ?? '',
      role: meta.role ?? 'admin',
      tenantId: meta.tenant_id ?? '',
    };
    this._user.set(profile);
  }

  private clearSession(): void {
    this._user.set(null);
    this._accessToken.set(null);
  }

  private classifyError(message: string): AuthErrorKind {
    const lower = message.toLowerCase();
    if (lower.includes('invalid') || lower.includes('credentials')) return 'invalid_credentials';
    if (lower.includes('mfa')) return 'mfa_required';
    return 'unknown';
  }
}
