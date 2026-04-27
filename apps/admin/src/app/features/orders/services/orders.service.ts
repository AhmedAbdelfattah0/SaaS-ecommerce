import { Injectable, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiService } from '../../../core/api/api.service';
import type { Order, OrderStatus } from '@storecraft/models';
import type { FilterState, SortOption } from '../models/order.model';

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private readonly api = inject(ApiService);
  private readonly destroyRef = inject(DestroyRef);

  // ── private writeable signals
  private readonly _items = signal<Order[]>([]);
  private readonly _total = signal(0);
  private readonly _isLoading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _search = signal('');
  private readonly _statusFilter = signal<FilterState['status']>('all');
  private readonly _sortBy = signal<SortOption>('created_desc');
  private readonly _page = signal(1);
  private readonly _limit = signal(20);

  // ── public readonly signals
  readonly items = this._items.asReadonly();
  readonly total = this._total.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly search = this._search.asReadonly();
  readonly statusFilter = this._statusFilter.asReadonly();
  readonly sortBy = this._sortBy.asReadonly();
  readonly page = this._page.asReadonly();
  readonly limit = this._limit.asReadonly();

  // ── derived
  readonly totalPages = computed(() => Math.ceil(this._total() / this._limit()) || 1);

  readonly statusCounts = computed(() => {
    const all = this._items();
    return {
      all: this._total(),
      pending:    all.filter((o) => o.status === 'pending').length,
      processing: all.filter((o) => o.status === 'processing').length,
      shipped:    all.filter((o) => o.status === 'shipped').length,
      delivered:  all.filter((o) => o.status === 'delivered').length,
      cancelled:  all.filter((o) => o.status === 'cancelled').length,
    };
  });

  readonly newPendingCount = computed(
    () => this._items().filter((o) => o.status === 'pending').length,
  );

  load(): void {
    this._isLoading.set(true);
    this._error.set(null);

    const status = this._statusFilter();
    const params = {
      page: this._page(),
      limit: this._limit(),
      search: this._search() || undefined,
      status: status !== 'all' ? (status as OrderStatus) : undefined,
    };

    this.api
      .listOrders(params)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result: { items: Order[]; total: number }) => {
          this._items.set(result.items);
          this._total.set(result.total);
          this._isLoading.set(false);
        },
        error: (err: unknown) => {
          const msg = err instanceof Error ? err.message : 'Failed to load orders';
          this._error.set(msg);
          this._isLoading.set(false);
        },
      });
  }

  setSearch(value: string): void {
    this._search.set(value);
    this._page.set(1);
    this.load();
  }

  setStatus(status: FilterState['status']): void {
    this._statusFilter.set(status);
    this._page.set(1);
    this.load();
  }

  setSortBy(sort: SortOption): void {
    this._sortBy.set(sort);
    this._page.set(1);
    this.load();
  }

  setPage(page: number): void {
    this._page.set(page);
    this.load();
  }

  refresh(): void {
    this.load();
  }
}
