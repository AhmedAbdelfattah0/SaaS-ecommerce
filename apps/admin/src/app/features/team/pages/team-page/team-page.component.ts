import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  BannerComponent,
  FieldErrorComponent,
  ModalComponent,
  PageHeaderComponent,
} from '@storecraft/ui';
import type { InviteRole } from '../../../../core/api/api.service';
import { AdminI18nService } from '../../../../shared/services/admin-i18n.service';
import { AdminIconComponent } from '../../../../shared/components/admin-icon/admin-icon.component';
import { TeamService } from '../../services/team.service';

const INVITE_ROLES: { value: InviteRole; label: string }[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'staff', label: 'Staff' },
  { value: 'viewer', label: 'Viewer' },
];

@Component({
  selector: 'admin-team-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    AdminIconComponent,
    PageHeaderComponent,
    ModalComponent,
    BannerComponent,
    FieldErrorComponent,
  ],
  providers: [TeamService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './team-page.component.html',
  styleUrl: './team-page.component.scss',
})
export class TeamPageComponent {
  private readonly fb = inject(FormBuilder);
  protected readonly i18n = inject(AdminI18nService);
  protected readonly svc = inject(TeamService);

  readonly inviteRoles = INVITE_ROLES;
  readonly inviteModalOpen = signal(false);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    role: ['admin' as InviteRole, [Validators.required]],
  });

  readonly emailMessages = computed(() => ({
    required: this.i18n.t('team.invite.email.required', 'Email is required'),
    email: this.i18n.t('team.invite.email.invalid', 'Please enter a valid email address'),
  }));

  remove(id: string): void {
    this.svc.removeMember(id);
  }

  openInviteModal(): void {
    this.form.reset({ email: '', role: 'admin' });
    this.svc.dismissInviteError();
    this.inviteModalOpen.set(true);
  }

  closeInviteModal(): void {
    if (this.svc.isInviting()) return;
    this.inviteModalOpen.set(false);
  }

  async submitInvite(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { email, role } = this.form.getRawValue();
    const result = await this.svc.inviteMember({ email, role });
    if (result.ok) {
      this.inviteModalOpen.set(false);
    }
  }

  fieldInvalid(name: 'email' | 'role'): boolean {
    const c = this.form.controls[name];
    return c.touched && c.invalid;
  }
}
