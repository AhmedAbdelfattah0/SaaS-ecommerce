import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { AdminIconComponent } from '../../../../shared/components/admin-icon/admin-icon.component';
import { fmtDate } from '../../models/customer.model';

@Component({
  selector: 'admin-customer-stats',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AdminIconComponent],
  templateUrl: './customer-stats.component.html',
})
export class CustomerStatsComponent {
  readonly ordersCount = input.required<number>();
  readonly totalSpentFormatted = input.required<string>();
  readonly avgOrderValueFormatted = input.required<string>();
  readonly lastOrderDate = input<string | null>(null);

  formatLastOrder(iso: string | null): string {
    if (!iso) return 'No orders yet';
    return fmtDate(iso);
  }
}
