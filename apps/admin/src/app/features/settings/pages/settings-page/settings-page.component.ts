import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { PageHeaderComponent } from '@storecraft/ui';
import { AdminI18nService } from '../../../../shared/services/admin-i18n.service';
import { AdminIconComponent } from '../../../../shared/components/admin-icon/admin-icon.component';
import { SettingsService } from '../../services/settings.service';

@Component({
  selector: 'admin-settings-page',
  standalone: true,
  imports: [AdminIconComponent, PageHeaderComponent],
  providers: [SettingsService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './settings-page.component.html',
  styleUrl: './settings-page.component.scss',
})
export class SettingsPageComponent {
  protected readonly i18n = inject(AdminI18nService);
  protected readonly svc = inject(SettingsService);

  toggleNotification(key: 'orderNotifications' | 'lowStockAlerts' | 'weeklyReport' | 'marketingEmails'): void {
    this.svc.patch({ [key]: !this.svc.settings()[key] });
  }
}
