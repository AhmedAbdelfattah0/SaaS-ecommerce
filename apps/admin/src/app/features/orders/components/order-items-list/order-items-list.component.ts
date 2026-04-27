import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { OrderItem } from '@storecraft/models';

function fmtMoney(n: number): string {
  return `EGP ${new Intl.NumberFormat('en-EG').format(n)}`;
}

@Component({
  selector: 'admin-order-items-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="items-list">
      @for (item of items(); track item.id) {
        <div class="item-row">
          <div class="item-img-placeholder"></div>
          <div class="item-info">
            <span class="item-name">{{ item.name }}</span>
            @if (item.variantId) {
              <span class="item-variant muted">Variant: {{ item.variantId }}</span>
            }
          </div>
          <div class="item-qty muted">× {{ item.quantity }}</div>
          <div class="item-price num">{{ fmtMoney(item.price * item.quantity) }}</div>
        </div>
      }
    </div>
  `,
  styles: [`
    .items-list {
      display: flex;
      flex-direction: column;
    }
    .item-row {
      display: flex;
      align-items: center;
      gap: var(--sp-3);
      padding: var(--sp-3) 0;
      border-bottom: 1px solid var(--color-border);
    }
    .item-row:last-child {
      border-bottom: none;
    }
    .item-img-placeholder {
      width: 40px;
      height: 40px;
      border-radius: var(--r-md);
      background: #F1F5F9;
      border: 1px solid var(--color-border);
      flex-shrink: 0;
    }
    .item-info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .item-name {
      font-size: 13.5px;
      font-weight: 500;
      color: var(--color-text);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .item-variant {
      font-size: 12px;
    }
    .item-qty {
      font-size: 13px;
      white-space: nowrap;
    }
    .item-price {
      font-size: 13.5px;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
      min-width: 90px;
      text-align: right;
    }
    .num { font-variant-numeric: tabular-nums; }
    .muted { color: var(--color-text-muted); }
  `],
})
export class OrderItemsListComponent {
  readonly items = input.required<OrderItem[]>();
  readonly fmtMoney = fmtMoney;
}
