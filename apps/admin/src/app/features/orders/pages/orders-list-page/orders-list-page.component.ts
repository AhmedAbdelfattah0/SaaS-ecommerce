import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { OrdersService } from '../../services/orders.service';
import { OrderFiltersComponent, type FiltersChangeEvent } from '../../components/order-filters/order-filters.component';
import { OrderStatusBadgeComponent } from '../../components/order-status-badge/order-status-badge.component';
import { AdminIconComponent } from '../../../../shared/components/admin-icon/admin-icon.component';
import {
  PageHeaderComponent,
  TabsComponent,
  DataTableComponent,
  DataColumnComponent,
  BannerComponent,
  EmptyStateComponent,
  type Tab,
  type DataTableSort,
} from '@storecraft/ui';
import type { FilterState, SortOption, Order } from '../../models/order.model';

const AVATAR_COLORS = [
  '#2563EB', '#7C3AED', '#DC2626', '#D97706', '#16A34A', '#0891B2',
];

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

@Component({
  selector: 'admin-orders-list-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [],
  imports: [
    OrderFiltersComponent,
    OrderStatusBadgeComponent,
    AdminIconComponent,
    PageHeaderComponent,
    TabsComponent,
    DataTableComponent,
    DataColumnComponent,
    BannerComponent,
    EmptyStateComponent,
  ],
  templateUrl: './orders-list-page.component.html',
  styleUrl: './orders-list-page.component.scss',
})
export class OrdersListPageComponent implements OnInit {
  private readonly router = inject(Router);
  readonly svc = inject(OrdersService);

  // ─── sc-data-table sort state ─────────────────────────────────────────────
  readonly sortState = signal<DataTableSort | undefined>(undefined);

  // ─── Status tabs (computed so counts stay reactive) ───────────────────────
  readonly statusTabs = computed<Tab[]>(() => [
    { key: 'all',        label: 'All',        count: this.getTabCount('all') },
    { key: 'pending',    label: 'Pending',    count: this.getTabCount('pending') },
    { key: 'processing', label: 'Processing', count: this.getTabCount('processing') },
    { key: 'shipped',    label: 'Shipped',    count: this.getTabCount('shipped') },
    { key: 'delivered',  label: 'Delivered',  count: this.getTabCount('delivered') },
    { key: 'cancelled',  label: 'Cancelled',  count: this.getTabCount('cancelled') },
  ]);

  ngOnInit(): void {
    this.svc.load();
  }

  // ─── Tab count helper ─────────────────────────────────────────────────────
  private getTabCount(key: FilterState['status']): number {
    return this.svc.statusCounts()[key] ?? 0;
  }

  // ─── Order ID short form ──────────────────────────────────────────────────
  shortId(id: string): string {
    return id.slice(0, 8).toUpperCase();
  }

  // ─── Customer helpers ─────────────────────────────────────────────────────
  customerName(order: Order): string {
    const firstItem = order.items[0];
    return firstItem?.name ? firstItem.name.split(' — ')[0] : 'Customer';
  }

  customerInitials(order: Order): string {
    const name = this.customerName(order);
    return name
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0] ?? '')
      .join('')
      .toUpperCase();
  }

  avatarBg(index: number): string {
    return AVATAR_COLORS[index % AVATAR_COLORS.length];
  }

  // TODO(stage-9): consider unifying with avatarColorForName once both call sites agree on a hash key
  // avatarBgForOrder derives a stable color from the order id's char code sum
  avatarBgForOrder(order: Order): string {
    const sum = order.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return AVATAR_COLORS[sum % AVATAR_COLORS.length];
  }

  // ─── Formatting helpers ───────────────────────────────────────────────────
  readonly fmtMoney = fmtMoney;
  readonly relativeDate = relativeDate;

  // ─── Pagination pages helper ──────────────────────────────────────────────
  paginationPages(): number[] {
    const total = this.svc.totalPages();
    const current = this.svc.page();
    const pages: number[] = [];
    const start = Math.max(1, current - 2);
    const end = Math.min(total, current + 2);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  // ─── Row click → navigate to detail ──────────────────────────────────────
  onRowClick(order: Order): void {
    this.router.navigate(['/orders', order.id]);
  }

  // ─── Filter: status tab ───────────────────────────────────────────────────
  onStatusTabChange(tab: FilterState['status']): void {
    this.svc.setStatus(tab);
  }

  // ─── Filter: search + sort from order-filters component ──────────────────
  onFiltersChange(event: FiltersChangeEvent): void {
    this.svc.setSearch(event.search);
    this.svc.setSortBy(event.sortBy as SortOption);
  }

  // ─── sc-data-table sort (column header click) ─────────────────────────────
  // SortOption whitelist: 'total_desc' | 'total_asc' | 'created_desc' | 'created_asc'
  // Table key 'date' maps to service key 'created'.
  onTableSort(tableSort: DataTableSort | undefined): void {
    this.sortState.set(tableSort);
    if (!tableSort) return;
    const keyMap: Record<string, string> = {
      total: 'total',
      date: 'created',
    };
    const serviceKey = keyMap[tableSort.key];
    if (!serviceKey) return;
    const sortOption = `${serviceKey}_${tableSort.direction}` as SortOption;
    const allowed: SortOption[] = ['total_desc', 'total_asc', 'created_desc', 'created_asc'];
    if (allowed.includes(sortOption)) {
      this.svc.setSortBy(sortOption);
    }
  }

  // ─── Pagination ───────────────────────────────────────────────────────────
  onPageChange(page: number): void {
    this.svc.setPage(page);
  }

  // ─── Refresh ─────────────────────────────────────────────────────────────
  onRefresh(): void {
    this.svc.refresh();
  }
}
