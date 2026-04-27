import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AdminI18nService } from '../../../../shared/services/admin-i18n.service';
import { AdminIconComponent } from '../../../../shared/components/admin-icon/admin-icon.component';
import { ShippingService } from '../../services/shipping.service';

@Component({
  selector: 'admin-shipping-page',
  standalone: true,
  imports: [AdminIconComponent],
  providers: [ShippingService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './shipping-page.component.html',
  styleUrl: './shipping-page.component.css',
})
export class ShippingPageComponent {
  protected readonly i18n = inject(AdminI18nService);
  protected readonly svc = inject(ShippingService);

  toggleZone(id: string): void {
    this.svc.toggleZone(id);
  }

  toggleCarrier(id: string): void {
    this.svc.toggleCarrier(id);
  }
}
