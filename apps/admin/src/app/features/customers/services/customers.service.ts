import { Injectable, computed, inject, signal } from '@angular/core';
import { ApiService } from '../../../core/api/api.service';
import type { Customer } from '../models/customer.model';
import type { SortOption } from '../models/customer.model';

/**
 * ViewModel for the Customers list page.
 * Provided at root scope so the list state persists across navigation.
 *
 * NOTE: The API does not yet expose a server-side sort endpoint for
 * orders_desc or spent_desc — sorting for those options is done client-side.
 */
@Injectable({ providedIn: 'root' })
export class CustomersService {
  private readonly api = inject(ApiService);

  // ─── Private mutable state ───────────────────────────────────────────────
  private readonly _items = signal<Customer[]>([]);
  private readonly _total = signal<number>(0);
  private readonly _page = signal<number>(1);
  private readonly _limit = signal<number>(20);
  private readonly _search = signal<string>('');
  private readonly _sortBy = signal<SortOption>('recent');
  private readonly _isLoading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  // ─── Public readonly signals ─────────────────────────────────────────────
  readonly items = this._items.asReadonly();
  readonly total = this._total.asReadonly();
  readonly page = this._page.asReadonly();
  readonly limit = this._limit.asReadonly();
  readonly search = this._search.asReadonly();
  readonly sortBy = this._sortBy.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();

  // ─── Computed ─────────────────────────────────────────────────────────────
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this._total() / this._limit())));

  /** Client-side sorted view of items (name_asc — server handles recency order). */
  readonly sortedItems = computed<Customer[]>(() => {
    const items: Customer[] = [...this._items()];
    const sort = this._sortBy();
    if (sort === 'name_asc') {
      return items.sort((a: Customer, b: Customer) => a.name.localeCompare(b.name));
    }
    // 'recent' — API already returns in descending created order.
    // 'orders_desc' / 'spent_desc' require aggregated data not yet on Customer model.
    // Return as-is; backend enhancement noted below.
    return items;
  });

  // ─── Load ─────────────────────────────────────────────────────────────────
  load(): void {
    this._isLoading.set(true);
    this._error.set(null);

    this.api
      .listCustomers({
        page: this._page(),
        limit: this._limit(),
        search: this._search() || undefined,
      })
      .subscribe({
        next: (res) => {
          this._items.set(res.items);
          this._total.set(res.total);
          this._isLoading.set(false);
        },
        error: (err: Error) => {
          this._error.set(err.message ?? 'Failed to load customers');
          this._isLoading.set(false);
        },
      });
  }

  // ─── Filter / sort setters ────────────────────────────────────────────────
  setSearch(value: string): void {
    this._search.set(value);
    this._page.set(1);
    this.load();
  }

  setSort(sort: SortOption): void {
    this._sortBy.set(sort);
    // Only reset + reload for sorts that require server-side params.
    // name_asc is pure client-side; no reload needed.
    if (sort !== 'name_asc') {
      this._page.set(1);
      this.load();
    }
  }

  setPage(page: number): void {
    this._page.set(page);
    this.load();
  }

  clearError(): void {
    this._error.set(null);
  }
}
