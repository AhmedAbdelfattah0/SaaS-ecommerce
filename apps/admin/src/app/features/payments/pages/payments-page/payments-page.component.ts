import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { PageHeaderComponent, BannerComponent } from '@storecraft/ui';
import { AdminI18nService } from '../../../../shared/services/admin-i18n.service';
import { AdminIconComponent } from '../../../../shared/components/admin-icon/admin-icon.component';
import { PaymentsService } from '../../services/payments.service';
import type { PaymentProvider } from '../../models/payment-provider.model';

@Component({
  selector: 'admin-payments-page',
  standalone: true,
  imports: [AdminIconComponent, PageHeaderComponent, BannerComponent],
  providers: [PaymentsService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './payments-page.component.html',
  styleUrl: './payments-page.component.scss',
})
export class PaymentsPageComponent {
  protected readonly i18n = inject(AdminI18nService);
  protected readonly svc = inject(PaymentsService);

  toggle(provider: keyof PaymentProvider): void {
    this.svc.toggleProvider(provider);
  }
}
