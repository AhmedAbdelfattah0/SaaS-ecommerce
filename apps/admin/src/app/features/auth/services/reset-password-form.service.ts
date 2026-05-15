import { Injectable, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { AuthService } from '../../../core/auth/auth.service';

/**
 * ViewModel for the reset-password page (lands here from the email link).
 * Supabase auto-establishes a recovery session via the URL fragment; this
 * service just collects the new password and calls updatePassword().
 */
@Injectable()
export class ResetPasswordFormService {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);

  readonly showPassword = signal(false);
  readonly showConfirm = signal(false);

  readonly form = this.fb.nonNullable.group(
    {
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: ResetPasswordFormService.passwordsMatch },
  );

  readonly isLoading = this.auth.isUpdatingPassword;
  readonly error = this.auth.passwordUpdateError;

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
    const { newPassword } = this.form.getRawValue();
    await this.auth.updatePassword(newPassword);
  }

  /**
   * Cross-field validator: tag the confirmPassword control with
   * `passwordMismatch` when its value differs from newPassword, so
   * sc-field-error renders the message under the confirm field.
   */
  private static passwordsMatch(group: AbstractControl): ValidationErrors | null {
    const newPw = group.get('newPassword');
    const confirmPw = group.get('confirmPassword');
    if (!newPw || !confirmPw) return null;
    if (!newPw.value || !confirmPw.value) return null;

    if (newPw.value === confirmPw.value) {
      const existing = confirmPw.errors;
      if (existing && existing['passwordMismatch']) {
        // Clear only the mismatch flag, preserve any other validators.
        const rest = { ...existing };
        delete rest['passwordMismatch'];
        confirmPw.setErrors(Object.keys(rest).length ? rest : null);
      }
      return null;
    }

    confirmPw.setErrors({ ...(confirmPw.errors ?? {}), passwordMismatch: true });
    return { passwordMismatch: true };
  }
}
