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
  templateUrl: './order-items-list.component.html',
  styleUrl: './order-items-list.component.scss',
})
export class OrderItemsListComponent {
  readonly items = input.required<OrderItem[]>();
  readonly fmtMoney = fmtMoney;
}
