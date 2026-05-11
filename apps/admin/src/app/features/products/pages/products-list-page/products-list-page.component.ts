/**
 * SELECTION STRATEGY:
 * sc-data-table.selection is a model<Set<string>>. The service owns
 * selection state via _selectedIds signal. These two-way bindings would
 * fight each other, so we break the two-way and use separate
 * [selection] + (selectionChange) to route all mutations through the
 * service. The selectionSet computed() re-reads service.selectedIds()
 * each time the service changes it, keeping the table in sync.
 *
 * SORT STRATEGY:
 * sc-data-table emits DataTableSort { key, direction }. The service
 * uses SortOption strings (e.g. 'name_asc'). We translate in
 * onSortChange() and store sortState locally for the table's [(sort)].
 */
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { AdminIconComponent } from '../../../../shared/components/admin-icon/admin-icon.component';
import { ProductFiltersComponent } from '../../components/product-filters/product-filters.component';
import { ProductBulkActionsComponent } from '../../components/product-bulk-actions/product-bulk-actions.component';
import { ProductStatusBadgeComponent } from '../../components/product-status-badge/product-status-badge.component';
import { ProductsService } from '../../services/products.service';
import {
  PageHeaderComponent,
  TabsComponent,
  DataTableComponent,
  DataColumnComponent,
  ModalComponent,
  BannerComponent,
  EmptyStateComponent,
  DropdownMenuComponent,
  DropdownItemComponent,
  type Tab,
  type DataTableSort,
} from '@storecraft/ui';
import type { FilterState, Product, ProductStatus, SortOption } from '../../models/product.model';

const STATUS_TABS: Tab[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'draft', label: 'Draft' },
  { key: 'deleted', label: 'Out of Stock' },
];

@Component({
  selector: 'admin-products-list-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AdminIconComponent,
    ProductFiltersComponent,
    ProductBulkActionsComponent,
    ProductStatusBadgeComponent,
    PageHeaderComponent,
    TabsComponent,
    DataTableComponent,
    DataColumnComponent,
    ModalComponent,
    BannerComponent,
    EmptyStateComponent,
    DropdownMenuComponent,
    DropdownItemComponent,
  ],
  templateUrl: './products-list-page.component.html',
  styleUrl: './products-list-page.component.scss',
})
export class ProductsListPageComponent implements OnInit {
  private readonly router = inject(Router);
  readonly service = inject(ProductsService);

  // ─── Status tabs definition ───────────────────────────────────────────────
  readonly statusTabs: Tab[] = STATUS_TABS;

  // ─── Single-delete modal ──────────────────────────────────────────────────
  readonly deleteConfirmId = signal<string | null>(null);

  // ─── Bulk-delete modal ────────────────────────────────────────────────────
  readonly bulkDeleteConfirmOpen = signal(false);

  // ─── sc-data-table selection bridge ──────────────────────────────────────
  // Reads from service; mutations route back through the service.
  // See SELECTION STRATEGY comment at top.
  readonly selectionSet = computed(() => this.service.selectedIds());

  // ─── sc-data-table sort state ─────────────────────────────────────────────
  // Local signal mirrors what the table emits. Translated to SortOption
  // for the service in onSortChange().
  readonly sortState = signal<DataTableSort | undefined>(undefined);

  ngOnInit(): void {
    this.service.loadCategories();
    this.service.load();
  }

  // ─── Category helper ──────────────────────────────────────────────────────
  getCategoryName(categoryId: string | null | undefined): string {
    if (!categoryId) return '';
    const cat = this.service.categories().find((c) => c.id === categoryId);
    return cat?.name ?? '';
  }

  // ─── Price formatting ─────────────────────────────────────────────────────
  formatPrice(price: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  }

  // ─── Stock badge class ────────────────────────────────────────────────────
  stockClass(stock: number): string {
    if (stock < 5) return 'stock-badge stock-low';
    if (stock <= 20) return 'stock-badge stock-medium';
    return 'stock-badge stock-ok';
  }

  // ─── Filter: status tab ───────────────────────────────────────────────────
  onStatusChange(key: string): void {
    this.service.setStatus(key as FilterState['status']);
  }

  // ─── Filter: search ───────────────────────────────────────────────────────
  onSearch(value: string): void {
    this.service.setSearch(value);
  }

  // ─── Filter: category ────────────────────────────────────────────────────
  onCategoryChange(categoryId: string): void {
    this.service.setCategory(categoryId);
  }

  // ─── Filter: sort ─────────────────────────────────────────────────────────
  onSortChange(sort: SortOption): void {
    this.service.setSort(sort);
  }

  // ─── sc-data-table sort ───────────────────────────────────────────────────
  onTableSort(tableSort: DataTableSort | undefined): void {
    this.sortState.set(tableSort);
    if (!tableSort) return;
    // Translate DataTableSort to SortOption
    const { key, direction } = tableSort;
    const sortOption = `${key}_${direction}` as SortOption;
    if (['name_asc','name_desc','price_asc','price_desc','stock_asc','stock_desc','created_asc','created_desc'].includes(sortOption)) {
      this.service.setSort(sortOption);
    }
  }

  // ─── sc-data-table selection ──────────────────────────────────────────────
  onSelectionChange(newSelection: Set<string>): void {
    // Reconcile service selection state with what the table emitted.
    // 1. Items in newSelection but not in service → add
    // 2. Items in service but not in newSelection → remove
    const current = this.service.selectedIds();
    newSelection.forEach((id) => {
      if (!current.has(id)) this.service.toggleSelect(id);
    });
    current.forEach((id) => {
      if (!newSelection.has(id)) this.service.toggleSelect(id);
    });
  }

  // ─── Row click → navigate to detail ──────────────────────────────────────
  onRowClick(product: Product): void {
    this.router.navigate(['/products', product.id]);
  }

  // ─── Edit (from dropdown) ─────────────────────────────────────────────────
  onEditProduct(id: string): void {
    this.router.navigate(['/products', id]);
  }

  // ─── Add product ──────────────────────────────────────────────────────────
  onAddProduct(): void {
    this.router.navigate(['/products', 'new']);
  }

  // ─── Single delete ────────────────────────────────────────────────────────
  askDelete(id: string): void {
    this.deleteConfirmId.set(id);
  }

  confirmDelete(): void {
    const id = this.deleteConfirmId();
    if (!id) return;
    this.service.deleteSingle(id);
    this.deleteConfirmId.set(null);
  }

  // ─── Bulk delete ──────────────────────────────────────────────────────────
  onBulkDelete(): void {
    this.bulkDeleteConfirmOpen.set(true);
  }

  confirmBulkDelete(): void {
    this.service.bulkDelete();
    this.bulkDeleteConfirmOpen.set(false);
  }

  // ─── Bulk set status ──────────────────────────────────────────────────────
  onBulkSetStatus(status: ProductStatus): void {
    this.service.bulkSetStatus(status);
  }

  // ─── Clear selection ──────────────────────────────────────────────────────
  onClearSelection(): void {
    this.service.clearSelection();
  }

  // ─── Pagination ───────────────────────────────────────────────────────────
  onPageChange(page: number): void {
    this.service.setPage(page);
  }

  getPaginationPages(): number[] {
    const total = this.service.totalPages();
    const current = this.service.page();
    const pages: number[] = [];
    const start = Math.max(1, current - 2);
    const end = Math.min(total, current + 2);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }
}
