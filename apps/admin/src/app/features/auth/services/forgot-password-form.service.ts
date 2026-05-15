import { Injectable, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth.service';

/**
 * ViewModel for the forgot-password (request reset email) page.
 * Reads loading / success / error state from AuthService.
 */
@Injectable()
export class ForgotPasswordFormService {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  readonly isLoading = this.auth.isRequestingReset;
  readonly emailSent = this.auth.resetEmailSent;
  readonly error = this.auth.resetError;

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { email } = this.form.getRawValue();
    await this.auth.requestPasswordReset(email);
  }

  reset(): void {
    this.auth.clearResetState();
    this.form.reset();
  }
}
