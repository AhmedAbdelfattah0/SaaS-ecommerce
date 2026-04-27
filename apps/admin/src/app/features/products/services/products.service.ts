import { Injectable, computed, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../../core/api/api.service';
import type { Category, Product, ProductStatus } from '../models/product.model';
import type { FilterState, SortOption } from '../models/product.model';

@Injectable({ providedIn: 'root' })
export class ProductsService {
  private readonly api = inject(ApiService);

  // ─── Private mutable state ───────────────────────────────────────────────
  private readonly _items = signal<Product[]>([]);
  private readonly _total = signal<number>(0);
  private readonly _page = signal<number>(1);
  private readonly _limit = signal<number>(20);
  private readonly _search = signal<string>('');
  private readonly _statusFilter = signal<FilterState['status']>('all');
  private readonly _categoryFilter = signal<string>('');
  private readonly _sortBy = signal<SortOption>('created_desc');
  private readonly _isLoading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _selectedIds = signal<Set<string>>(new Set());
  private readonly _categories = signal<Category[]>([]);
  private readonly _categoriesLoaded = signal<boolean>(false);

  // ─── Public readonly signals ─────────────────────────────────────────────
  readonly items = this._items.asReadonly();
  readonly total = this._total.asReadonly();
  readonly page = this._page.asReadonly();
  readonly limit = this._limit.asReadonly();
  readonly search = this._search.asReadonly();
  readonly statusFilter = this._statusFilter.asReadonly();
  readonly categoryFilter = this._categoryFilter.asReadonly();
  readonly sortBy = this._sortBy.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly selectedIds = this._selectedIds.asReadonly();
  readonly categories = this._categories.asReadonly();

  // ─── Computed ─────────────────────────────────────────────────────────────
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this._total() / this._limit())));
  readonly hasSelection = computed(() => this._selectedIds().size > 0);
  readonly selectedCount = computed(() => this._selectedIds().size);
  readonly allSelected = computed(
    () => this._items().length > 0 && this._selectedIds().size === this._items().length,
  );

  // ─── Load products ────────────────────────────────────────────────────────
  load(): void {
    this._isLoading.set(true);
    this._error.set(null);

    const status = this._statusFilter();
    const params = {
      page: this._page(),
      limit: this._limit(),
      search: this._search() || undefined,
      categoryId: this._categoryFilter() || undefined,
      status: status === 'all' ? undefined : (status as 'active' | 'draft' | 'deleted'),
    };

    this.api.listProducts(params).subscribe({
      next: (res) => {
        this._items.set(res.items);
        this._total.set(res.total);
        this._isLoading.set(false);
      },
      error: (err: Error) => {
        this._error.set(err.message ?? 'Failed to load products');
        this._isLoading.set(false);
      },
    });
  }

  // ─── Load categories ──────────────────────────────────────────────────────
  loadCategories(): void {
    if (this._categoriesLoaded()) return;
    this.api.listCategories().subscribe({
      next: (cats) => {
        this._categories.set(cats);
        this._categoriesLoaded.set(true);
      },
      error: () => {
        // Non-critical: silently fail
      },
    });
  }

  // ─── Filter / sort setters ────────────────────────────────────────────────
  setSearch(value: string): void {
    this._search.set(value);
    this._page.set(1);
    this.load();
  }

  setStatus(value: FilterState['status']): void {
    this._statusFilter.set(value);
    this._page.set(1);
    this.load();
  }

  setCategory(categoryId: string): void {
    this._categoryFilter.set(categoryId);
    this._page.set(1);
    this.load();
  }

  setSort(sort: SortOption): void {
    this._sortBy.set(sort);
    this._page.set(1);
    this.load();
  }

  setPage(page: number): void {
    this._page.set(page);
    this.load();
  }

  // ─── Selection ────────────────────────────────────────────────────────────
  toggleSelect(id: string): void {
    const current = new Set(this._selectedIds());
    if (current.has(id)) {
      current.delete(id);
    } else {
      current.add(id);
    }
    this._selectedIds.set(current);
  }

  selectAll(): void {
    const ids = new Set(this._items().map((p) => p.id));
    this._selectedIds.set(ids);
  }

  clearSelection(): void {
    this._selectedIds.set(new Set());
  }

  // ─── Bulk actions ─────────────────────────────────────────────────────────
  bulkDelete(): void {
    const ids = Array.from(this._selectedIds());
    if (ids.length === 0) return;

    this._isLoading.set(true);
    const deletes$ = ids.map((id) => this.api.deleteProduct(id));

    forkJoin(deletes$).subscribe({
      next: () => {
        this.clearSelection();
        this.load();
      },
      error: (err: Error) => {
        this._error.set(err.message ?? 'Bulk delete failed');
        this._isLoading.set(false);
      },
    });
  }

  /**
   * Bulk set status — ApiService has no dedicated bulk endpoint.
   * We call updateProduct per item individually.
   * FLAG: If a `bulkUpdateProducts` endpoint is added to ApiService, replace forkJoin here.
   */
  bulkSetStatus(status: ProductStatus): void {
    const ids = Array.from(this._selectedIds());
    if (ids.length === 0) return;

    this._isLoading.set(true);
    const updates$ = ids.map((id) => this.api.updateProduct(id, { status }));

    forkJoin(updates$).subscribe({
      next: () => {
        this.clearSelection();
        this.load();
      },
      error: (err: Error) => {
        this._error.set(err.message ?? 'Bulk status update failed');
        this._isLoading.set(false);
      },
    });
  }

  deleteSingle(id: string): void {
    this.api.deleteProduct(id).subscribe({
      next: () => {
        this.clearSelection();
        this.load();
      },
      error: (err: Error) => {
        this._error.set(err.message ?? 'Delete failed');
      },
    });
  }
}
