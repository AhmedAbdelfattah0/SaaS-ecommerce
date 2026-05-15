import { Injectable, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { ApiService } from '../../../core/api/api.service';

/**
 * ViewModel for the /accept-invite page.
 *
 * Page-provided so state is fresh per invite arrival. Orchestrates the
 * two-step accept flow:
 *   1. supabase.auth.updateUser({ password, data: { full_name } })
 *      — runs client-side via AuthService.applyInviteUpdate
 *   2. POST /api/team/accept-invite — backend creates the admin_users row
 *      using service role (RLS would block a direct client write)
 *   3. Refresh the session so user_metadata + admin_users data reach the
 *      local profile signal, then navigate to /dashboard.
 *
 * Invalid / expired invite tokens are detected by AuthService.isAuthenticated
 * — if the recovery session was never established the auth check fails and
 * the page renders a "link expired" banner instead of the form.
 */
@Injectable()
export class AcceptInviteFormService {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  readonly showPassword = signal(false);
  readonly showConfirm = signal(false);

  private readonly _isLoading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly form = this.fb.nonNullable.group(
    {
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: AcceptInviteFormService.passwordsMatch },
  );

  togglePassword(): void {
    this.showPassword.update((v) => !v);
  }

  toggleConfirm(): void {
    this.showConfirm.update((v) => !v);
  }

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this._isLoading.set(true);
    this._error.set(null);
    try {
      const { fullName, password } = this.form.getRawValue();

      const update = await this.auth.applyInviteUpdate(fullName, password);
      if (!update.ok) {
        this._error.set(update.error);
        return;
      }

      try {
        await firstValueFrom(this.api.acceptInvite());
      } catch (err) {
        this._error.set(err instanceof Error ? err.message : 'Failed to finalize invite');
        return;
      }

      await this.auth.refreshSession();
      await this.router.navigate(['/dashboard']);
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Cross-field validator — tags confirmPassword with `passwordMismatch`
   * so sc-field-error renders the message under the confirm input.
   */
  private static passwordsMatch(group: AbstractControl): ValidationErrors | null {
    const pw = group.get('password');
    const confirm = group.get('confirmPassword');
    if (!pw || !confirm) return null;
    if (!pw.value || !confirm.value) return null;

    if (pw.value === confirm.value) {
      const existing = confirm.errors;
      if (existing && existing['passwordMismatch']) {
        const rest = { ...existing };
        delete rest['passwordMismatch'];
        confirm.setErrors(Object.keys(rest).length ? rest : null);
      }
      return null;
    }

    confirm.setErrors({ ...(confirm.errors ?? {}), passwordMismatch: true });
    return { passwordMismatch: true };
  }
}
