import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BannerComponent, FieldErrorComponent } from '@storecraft/ui';
import { ResetPasswordFormService } from '../../services/reset-password-form.service';
import { AdminI18nService } from '../../../../shared/services/admin-i18n.service';
import { AdminIconComponent } from '../../../../shared/components/admin-icon/admin-icon.component';

@Component({
  selector: 'admin-reset-password-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    AdminIconComponent,
    BannerComponent,
    FieldErrorComponent,
  ],
  providers: [ResetPasswordFormService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './reset-password-page.component.html',
  styleUrl: './reset-password-page.component.scss',
})
export class ResetPasswordPageComponent {
  private readonly vm = inject(ResetPasswordFormService);
  private readonly i18n = inject(AdminI18nService);

  readonly form = this.vm.form;
  readonly isLoading = this.vm.isLoading;
  readonly showPassword = this.vm.showPassword;
  readonly showConfirm = this.vm.showConfirm;
  readonly error = this.vm.error;
  readonly currentLang = this.i18n.currentLang;

  readonly hasError = computed(() => this.error() !== null);

  readonly newPasswordMessages = computed(() => ({
    required: this.t('reset.newPassword.required', 'New password is required'),
    minlength: this.t('reset.newPassword.minlength', 'Password must be at least 8 characters'),
  }));

  readonly confirmPasswordMessages = computed(() => ({
    required: this.t('reset.confirmPassword.required', 'Please confirm your password'),
    passwordMismatch: this.t('reset.confirmPassword.mismatch', 'Passwords do not match'),
  }));

  togglePassword(): void {
    this.vm.togglePassword();
  }

  toggleConfirm(): void {
    this.vm.toggleConfirm();
  }

  onSubmit(): void {
    void this.vm.submit();
  }

  fieldInvalid(name: 'newPassword' | 'confirmPassword'): boolean {
    const c = this.form.controls[name];
    return c.touched && c.invalid;
  }

  t(key: string, fallback?: string): string {
    return this.i18n.t(key, fallback);
  }
}
