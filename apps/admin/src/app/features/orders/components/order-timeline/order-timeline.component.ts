import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminIconComponent } from '../../../../shared/components/admin-icon/admin-icon.component';
import type { OrderStatus, OrderStatusHistory } from '@storecraft/models';

const STATUS_ORDER: OrderStatus[] = ['pending', 'processing', 'shipped', 'delivered'];

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending:    'Order Placed',
  processing: 'Processing',
  shipped:    'Shipped',
  delivered:  'Delivered',
  cancelled:  'Cancelled',
};

const STATUS_DESCRIPTIONS: Record<OrderStatus, string> = {
  pending:    'Order received and awaiting processing',
  processing: 'Order is being prepared',
  shipped:    'Order shipped and on the way',
  delivered:  'Order delivered successfully',
  cancelled:  'Order has been cancelled',
};

interface TimelineStep {
  status: OrderStatus;
  label: string;
  description: string;
  state: 'done' | 'active' | 'pending';
  historyEntry: OrderStatusHistory | null;
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

@Component({
  selector: 'admin-order-timeline',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, AdminIconComponent],
  templateUrl: './order-timeline.component.html',
  styleUrl: './order-timeline.component.scss',
})
export class OrderTimelineComponent {
  readonly history = input.required<OrderStatusHistory[]>();
  readonly current = input.required<OrderStatus>();

  readonly isCancelled = computed(() => this.current() === 'cancelled');

  readonly cancelEntry = computed(() =>
    this.history().find((h) => h.status === 'cancelled') ?? null,
  );

  readonly steps = computed<TimelineStep[]>(() => {
    const currentStatus = this.current();
    const historyMap = new Map<OrderStatus, OrderStatusHistory>();
    for (const h of this.history()) {
      historyMap.set(h.status, h);
    }

    const currentIndex = STATUS_ORDER.indexOf(
      currentStatus === 'cancelled' ? 'pending' : currentStatus,
    );

    return STATUS_ORDER.map((status, index) => {
      let state: 'done' | 'active' | 'pending';
      if (currentStatus === 'cancelled') {
        state = index === 0 ? 'done' : 'pending';
      } else if (index < currentIndex) {
        state = 'done';
      } else if (index === currentIndex) {
        state = 'active';
      } else {
        state = 'pending';
      }

      return {
        status,
        label: STATUS_LABELS[status],
        description: STATUS_DESCRIPTIONS[status],
        state,
        historyEntry: historyMap.get(status) ?? null,
      };
    });
  });

  readonly formatDate = formatDate;
}
