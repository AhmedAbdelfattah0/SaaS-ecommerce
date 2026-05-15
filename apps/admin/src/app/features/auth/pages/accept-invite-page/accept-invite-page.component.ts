import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BannerComponent, FieldErrorComponent } from '@storecraft/ui';
import { AcceptInviteFormService } from '../../services/accept-invite-form.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { AdminI18nService } from '../../../../shared/services/admin-i18n.service';
import { AdminIconComponent } from '../../../../shared/components/admin-icon/admin-icon.component';

@Component({
  selector: 'admin-accept-invite-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    AdminIconComponent,
    BannerComponent,
    FieldErrorComponent,
  ],
  providers: [AcceptInviteFormService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './accept-invite-page.component.html',
  styleUrl: './accept-invite-page.component.scss',
})
export class AcceptInvitePageComponent {
  private readonly vm = inject(AcceptInviteFormService);
  private readonly auth = inject(AuthService);
  private readonly i18n = inject(AdminI18nService);

  readonly form = this.vm.form;
  readonly isLoading = this.vm.isLoading;
  readonly showPassword = this.vm.showPassword;
  readonly showConfirm = this.vm.showConfirm;
  readonly error = this.vm.error;
  readonly currentLang = this.i18n.currentLang;

  /**
   * Treats the page as a valid invite arrival only if Supabase managed to
   * establish a session from the URL fragment (the invite-style recovery
   * link). If the token is missing or expired, the user lands here with
   * no session — show the "link expired" warning instead of the form.
   *
   * `isInitializing` covers the first paint while Supabase is still
   * processing the URL fragment.
   */
  readonly isInitializing = this.auth.isInitializing;
  readonly inviteValid = computed(() => this.auth.isAuthenticated());

  readonly hasError = computed(() => this.error() !== null);

  readonly fullNameMessages = computed(() => ({
    required: this.t('invite.fullName.required', 'Full name is required'),
    minlength: this.t('invite.fullName.minlength', 'Name must be at least 2 characters'),
  }));

  readonly passwordMessages = computed(() => ({
    required: this.t('invite.password.required', 'Password is required'),
    minlength: this.t('invite.password.minlength', 'Password must be at least 8 characters'),
  }));

  readonly confirmPasswordMessages = computed(() => ({
    required: this.t('invite.confirmPassword.required', 'Please confirm your password'),
    passwordMismatch: this.t('invite.confirmPassword.mismatch', 'Passwords do not match'),
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

  fieldInvalid(name: 'fullName' | 'password' | 'confirmPassword'): boolean {
    const c = this.form.controls[name];
    return c.touched && c.invalid;
  }

  t(key: string, fallback?: string): string {
    return this.i18n.t(key, fallback);
  }
}
