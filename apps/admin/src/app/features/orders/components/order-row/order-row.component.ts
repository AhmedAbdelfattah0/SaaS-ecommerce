import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminIconComponent } from '../../../../shared/components/admin-icon/admin-icon.component';
import { OrderStatusBadgeComponent } from '../order-status-badge/order-status-badge.component';
import type { Order } from '@storecraft/models';

function fmtMoney(n: number): string {
  return `EGP ${new Intl.NumberFormat('en-EG').format(n)}`;
}

function relativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase();
}

const AVATAR_COLORS = [
  '#2563EB', '#7C3AED', '#DC2626', '#D97706', '#16A34A', '#0891B2',
];

@Component({
  selector: 'admin-order-row',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, AdminIconComponent, OrderStatusBadgeComponent],
  template: `
    <tr (click)="rowClick.emit(order().id)" class="order-tr">
      <!-- Order ID -->
      <td>
        <span class="mono">#{{ shortId() }}</span>
      </td>
      <!-- Customer -->
      <td>
        <div class="hstack gap-3">
          <div
            class="avatar sm"
            [style.background]="avatarBg()"
          >{{ customerInitials() }}</div>
          <div>
            <div class="customer-name">{{ customerName() }}</div>
            <div class="muted customer-email">{{ order().customerId }}</div>
          </div>
        </div>
      </td>
      <!-- Items -->
      <td class="num muted">{{ order().items.length }} item{{ order().items.length !== 1 ? 's' : '' }}</td>
      <!-- Total -->
      <td class="num">{{ formattedTotal() }}</td>
      <!-- Status -->
      <td>
        <admin-order-status-badge [status]="order().status" />
      </td>
      <!-- Time -->
      <td class="muted nowrap">{{ relativeDate(order().createdAt) }}</td>
      <!-- Actions -->
      <td>
        <div class="row-actions">
          <button class="icon-btn" title="View order" (click)="$event.stopPropagation(); rowClick.emit(order().id)">
            <admin-icon name="eye" [size]="15" />
          </button>
        </div>
      </td>
    </tr>
  `,
  styles: [`
    :host { display: contents; }
    .order-tr { cursor: pointer; }
    .customer-name { font-size: 13px; font-weight: 500; }
    .customer-email { font-size: 12px; margin-top: 1px; }
    .num { font-variant-numeric: tabular-nums; }
    .muted { color: var(--color-text-muted); }
    .nowrap { white-space: nowrap; }
    .hstack { display: flex; align-items: center; }
    .gap-3 { gap: var(--sp-3); }
  `],
})
export class OrderRowComponent {
  readonly order = input.required<Order>();
  readonly index = input<number>(0);
  readonly isNew = input<boolean>(false);

  readonly rowClick = output<string>();

  readonly shortId = computed(() => this.order().id.slice(0, 8).toUpperCase());
  readonly formattedTotal = computed(() => fmtMoney(this.order().total));
  readonly customerName = computed(() => {
    const firstItem = this.order().items[0];
    return firstItem?.name ? firstItem.name.split(' — ')[0] : 'Customer';
  });
  readonly customerInitials = computed(() => initials(this.customerName()));
  readonly avatarBg = computed(
    () => AVATAR_COLORS[this.index() % AVATAR_COLORS.length],
  );

  readonly relativeDate = relativeDate;
}
