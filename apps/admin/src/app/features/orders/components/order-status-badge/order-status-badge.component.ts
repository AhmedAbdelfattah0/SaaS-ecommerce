import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { OrderStatus } from '@storecraft/models';

export interface StatusConfig {
  label: string;
  cls: string;
  dotColor: string;
}

export const ORDER_STATUS_MAP: Record<OrderStatus, StatusConfig> = {
  pending:    { label: 'Pending',    cls: 'badge badge-amber',  dotColor: '#D97706' },
  processing: { label: 'Processing', cls: 'badge badge-blue',   dotColor: '#2563EB' },
  shipped:    { label: 'Shipped',    cls: 'badge badge-purple', dotColor: '#7C3AED' },
  delivered:  { label: 'Delivered',  cls: 'badge badge-green',  dotColor: '#16A34A' },
  cancelled:  { label: 'Cancelled',  cls: 'badge badge-red',    dotColor: '#DC2626' },
};

@Component({
  selector: 'admin-order-status-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span [class]="config().cls">
      <span class="badge-dot" [style.background]="config().dotColor"></span>
      {{ config().label }}
    </span>
  `,
  styleUrl: './order-status-badge.component.scss',
})
export class OrderStatusBadgeComponent {
  readonly status = input.required<OrderStatus>();

  readonly config = computed<StatusConfig>(() => {
    return ORDER_STATUS_MAP[this.status()] ?? {
      label: this.status(),
      cls: 'badge badge-gray',
      dotColor: '#64748B',
    };
  });
}
