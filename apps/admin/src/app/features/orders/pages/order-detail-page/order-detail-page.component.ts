import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { OrderDetailService } from '../../services/order-detail.service';
import { OrderStatusBadgeComponent } from '../../components/order-status-badge/order-status-badge.component';
import { OrderTimelineComponent } from '../../components/order-timeline/order-timeline.component';
import { OrderItemsListComponent } from '../../components/order-items-list/order-items-list.component';
import {
  OrderStatusUpdateComponent,
  type StatusChangeEvent,
} from '../../components/order-status-update/order-status-update.component';
import { AdminIconComponent } from '../../../../shared/components/admin-icon/admin-icon.component';
import { BannerComponent } from '@storecraft/ui';

function fmtMoney(n: number): string {
  return `EGP ${new Intl.NumberFormat('en-EG').format(n)}`;
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
  selector: 'admin-order-detail-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [OrderDetailService],
  imports: [
    CommonModule,
    OrderStatusBadgeComponent,
    OrderTimelineComponent,
    OrderItemsListComponent,
    OrderStatusUpdateComponent,
    AdminIconComponent,
    BannerComponent,
  ],
  templateUrl: './order-detail-page.component.html',
  styleUrl: './order-detail-page.component.scss',
})
export class OrderDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly svc = inject(OrderDetailService);

  readonly orderId = computed(() => this.route.snapshot.paramMap.get('id') ?? '');

  readonly shortId = computed(() => {
    const order = this.svc.order();
    return order ? order.id.slice(0, 8).toUpperCase() : '';
  });

  readonly placedAt = computed(() => {
    const order = this.svc.order();
    if (!order) return '';
    const d = new Date(order.createdAt);
    const date = d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    return `Placed on ${date} at ${time}`;
  });

  readonly customerInitials = computed(() => {
    const order = this.svc.order();
    if (!order) return '';
    const name = order.items[0]?.name ?? 'Customer';
    return initials(name);
  });

  readonly customerName = computed(() => {
    const order = this.svc.order();
    if (!order) return 'Customer';
    return order.items[0]?.name ?? 'Customer';
  });

  readonly avatarBg = AVATAR_COLORS[0];

  readonly subtotal = computed(() => fmtMoney(this.svc.order()?.subtotal ?? 0));
  readonly shipping = computed(() => fmtMoney(this.svc.order()?.shipping ?? 0));
  readonly total = computed(() => fmtMoney(this.svc.order()?.total ?? 0));

  ngOnInit(): void {
    const id = this.orderId();
    if (id) {
      this.svc.load(id);
    }
  }

  goBack(): void {
    this.router.navigate(['/orders']);
  }

  onStatusChange(event: StatusChangeEvent): void {
    const id = this.orderId();
    if (id) {
      this.svc.updateStatus(id, event.status, event.note);
    }
  }

  onPrint(): void {
    window.print();
  }

  readonly fmtMoney = fmtMoney;
}
