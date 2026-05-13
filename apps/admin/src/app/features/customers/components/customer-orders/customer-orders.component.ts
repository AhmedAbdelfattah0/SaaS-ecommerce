import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Router } from '@angular/router';
import { inject } from '@angular/core';
import { AdminIconComponent } from '../../../../shared/components/admin-icon/admin-icon.component';
import type { Order } from '@storecraft/models';
import { fmtDate } from '../../models/customer.model';

const STATUS_MAP: Record<string, { label: string; cls: string; dotColor: string }> = {
  pending:    { label: 'Pending',    cls: 'badge badge-amber',  dotColor: '#D97706' },
  processing: { label: 'Processing', cls: 'badge badge-blue',   dotColor: '#2563EB' },
  shipped:    { label: 'Shipped',    cls: 'badge badge-purple', dotColor: '#7C3AED' },
  delivered:  { label: 'Delivered',  cls: 'badge badge-green',  dotColor: '#16A34A' },
  cancelled:  { label: 'Cancelled',  cls: 'badge badge-red',    dotColor: '#DC2626' },
};

@Component({
  selector: 'admin-customer-orders',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AdminIconComponent],
  templateUrl: './customer-orders.component.html',
  styleUrl: './customer-orders.component.scss',
})
export class CustomerOrdersComponent {
  private readonly router = inject(Router);

  readonly orders = input.required<Order[]>();

  statusBadge(status: string): { label: string; cls: string; dotColor: string } {
    return STATUS_MAP[status] ?? { label: status, cls: 'badge badge-gray', dotColor: '#64748B' };
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
