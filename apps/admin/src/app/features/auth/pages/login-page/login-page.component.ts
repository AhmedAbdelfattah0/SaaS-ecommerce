import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LoginFormService } from '../../services/login-form.service';
import { LoginFormComponent } from '../../components/login-form/login-form.component';

@Component({
  selector: 'admin-login-page',
  standalone: true,
  imports: [LoginFormComponent],
  providers: [LoginFormService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="login-page-shell">
      <admin-login-form />
    </main>
  `,
  styles: [
    `
      .login-page-shell {
        display: grid;
        place-items: center;
        min-height: 100vh;
        padding: 24px;
        background: var(--color-bg);
      }
    `,
  ],
})
export class LoginPageComponent {}
