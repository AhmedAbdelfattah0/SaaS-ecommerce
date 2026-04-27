import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Router } from '@angular/router';
import { inject } from '@angular/core';
import { AdminIconComponent } from '../../../../shared/components/admin-icon/admin-icon.component';
import type { Order } from '@storecraft/models';
import { fmtDate } from '../../models/customer.model';

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  pending:    { label: 'Pending',    cls: 'badge badge-amber' },
  processing: { label: 'Processing', cls: 'badge badge-blue' },
  shipped:    { label: 'Shipped',    cls: 'badge badge-purple' },
  delivered:  { label: 'Delivered',  cls: 'badge badge-green' },
  cancelled:  { label: 'Cancelled',  cls: 'badge badge-red' },
};

@Component({
  selector: 'admin-customer-orders',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AdminIconComponent],
  templateUrl: './customer-orders.component.html',
})
export class CustomerOrdersComponent {
  private readonly router = inject(Router);

  readonly orders = input.required<Order[]>();

  statusBadge(status: string): { label: string; cls: string } {
    return STATUS_MAP[status] ?? { label: status, cls: 'badge badge-gray' };
  }

  fmtDate(iso: string): string {
    return fmtDate(iso);
  }

  fmtMoney(n: number): string {
    return `EGP ${new Intl.NumberFormat('en-EG').format(n)}`;
  }

  navigateToOrder(id: string): void {
    this.router.navigate(['/orders', id]);
  }
}
