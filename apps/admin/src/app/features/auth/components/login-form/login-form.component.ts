import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { BannerComponent } from '@storecraft/ui';
import { LoginFormService } from '../../services/login-form.service';
import { AdminI18nService } from '../../../../shared/services/admin-i18n.service';
import { AdminIconComponent } from '../../../../shared/components/admin-icon/admin-icon.component';

@Component({
  selector: 'admin-login-form',
  standalone: true,
  imports: [ReactiveFormsModule, AdminIconComponent, BannerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login-form.component.html',
  styleUrl: './login-form.component.scss',
})
export class LoginFormComponent {
  private readonly vm = inject(LoginFormService);
  private readonly i18n = inject(AdminI18nService);

  readonly form = this.vm.form;
  readonly isLoading = this.vm.isAuthenticating;
  readonly showPassword = this.vm.showPassword;
  readonly authError = this.vm.authError;
  readonly currentLang = this.i18n.currentLang;

  readonly hasError = computed(() => this.authError() !== null);

  togglePassword(): void {
    this.vm.togglePassword();
  }

  onSubmit(): void {
    void this.vm.submit();
  }

  t(key: string, fallback?: string): string {
    return this.i18n.t(key, fallback);
  }
}
