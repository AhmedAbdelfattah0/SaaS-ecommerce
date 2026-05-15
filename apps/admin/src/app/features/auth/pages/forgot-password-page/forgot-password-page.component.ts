import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BannerComponent, FieldErrorComponent } from '@storecraft/ui';
import { ForgotPasswordFormService } from '../../services/forgot-password-form.service';
import { AdminI18nService } from '../../../../shared/services/admin-i18n.service';
import { AdminIconComponent } from '../../../../shared/components/admin-icon/admin-icon.component';

@Component({
  selector: 'admin-forgot-password-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    AdminIconComponent,
    BannerComponent,
    FieldErrorComponent,
  ],
  providers: [ForgotPasswordFormService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './forgot-password-page.component.html',
  styleUrl: './forgot-password-page.component.scss',
})
export class ForgotPasswordPageComponent {
  private readonly vm = inject(ForgotPasswordFormService);
  private readonly i18n = inject(AdminI18nService);

  readonly form = this.vm.form;
  readonly isLoading = this.vm.isLoading;
  readonly emailSent = this.vm.emailSent;
  readonly error = this.vm.error;
  readonly currentLang = this.i18n.currentLang;

  readonly hasError = computed(() => this.error() !== null);

  readonly emailMessages = computed(() => ({
    required: this.t('forgot.email.required', 'Email is required'),
    email: this.t('forgot.email.invalid', 'Please enter a valid email address'),
  }));

  onSubmit(): void {
    void this.vm.submit();
  }

  resetForm(): void {
    this.vm.reset();
  }

  fieldInvalid(): boolean {
    const c = this.form.controls.email;
    return c.touched && c.invalid;
  }

  t(key: string, fallback?: string): string {
    return this.i18n.t(key, fallback);
  }
}
