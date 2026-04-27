import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AdminI18nService } from '../../../../shared/services/admin-i18n.service';
import { AdminIconComponent } from '../../../../shared/components/admin-icon/admin-icon.component';
import { IntegrationsService } from '../../services/integrations.service';
import type { Integration } from '../../models/integration.model';

@Component({
  selector: 'admin-integrations-page',
  standalone: true,
  imports: [AdminIconComponent],
  providers: [IntegrationsService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './integrations-page.component.html',
  styleUrl: './integrations-page.component.css',
})
export class IntegrationsPageComponent {
  protected readonly i18n = inject(AdminI18nService);
  protected readonly svc = inject(IntegrationsService);

  toggle(item: Integration): void {
    this.svc.toggle(item.id);
  }
}
