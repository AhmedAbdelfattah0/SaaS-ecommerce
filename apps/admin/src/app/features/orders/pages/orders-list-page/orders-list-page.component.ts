import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { OrdersService } from '../../services/orders.service';
import { OrderRowComponent } from '../../components/order-row/order-row.component';
import { OrderFiltersComponent, type FiltersChangeEvent } from '../../components/order-filters/order-filters.component';
import { AdminIconComponent } from '../../../../shared/components/admin-icon/admin-icon.component';
import type { FilterState, SortOption } from '../../models/order.model';

@Component({
  selector: 'admin-orders-list-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [],
  imports: [
    CommonModule,
    OrderRowComponent,
    OrderFiltersComponent,
    AdminIconComponent,
  ],
  templateUrl: './orders-list-page.component.html',
  styleUrl: './orders-list-page.component.css',
})
export class OrdersListPageComponent implements OnInit {
  private readonly router = inject(Router);
  readonly svc = inject(OrdersService);

  readonly statusTabs: { key: FilterState['status']; label: string }[] = [
    { key: 'all',        label: 'All' },
    { key: 'pending',    label: 'Pending' },
    { key: 'processing', label: 'Processing' },
    { key: 'shipped',    label: 'Shipped' },
    { key: 'delivered',  label: 'Delivered' },
    { key: 'cancelled',  label: 'Cancelled' },
  ];

  ngOnInit(): void {
    this.svc.load();
  }

  navigateToOrder(id: string): void {
    this.router.navigate(['/orders', id]);
  }

  onStatusTabChange(tab: FilterState['status']): void {
    this.svc.setStatus(tab);
  }

  onFiltersChange(event: FiltersChangeEvent): void {
    this.svc.setSearch(event.search);
    this.svc.setSortBy(event.sortBy as SortOption);
  }

  onPageChange(page: number): void {
    this.svc.setPage(page);
  }

  onRefresh(): void {
    this.svc.refresh();
  }

  getTabCount(key: FilterState['status']): number {
    const counts = this.svc.statusCounts();
    return counts[key] ?? 0;
  }

  get pages(): number[] {
    const total = this.svc.totalPages();
    return Array.from({ length: total }, (_, i) => i + 1);
  }
}
