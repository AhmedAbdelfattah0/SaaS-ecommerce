import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { Router } from '@angular/router';
import { AdminIconComponent } from '../../../../shared/components/admin-icon/admin-icon.component';
import { ProductFiltersComponent } from '../../components/product-filters/product-filters.component';
import { ProductBulkActionsComponent } from '../../components/product-bulk-actions/product-bulk-actions.component';
import { ProductRowComponent } from '../../components/product-row/product-row.component';
import { ProductsService } from '../../services/products.service';
import type { FilterState, ProductStatus, SortOption } from '../../models/product.model';

@Component({
  selector: 'admin-products-list-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AdminIconComponent,
    ProductFiltersComponent,
    ProductBulkActionsComponent,
    ProductRowComponent,
  ],
  templateUrl: './products-list-page.component.html',
  styleUrl: './products-list-page.component.css',
})
export class ProductsListPageComponent implements OnInit {
  private readonly router = inject(Router);
  readonly service = inject(ProductsService);

  ngOnInit(): void {
    this.service.loadCategories();
    this.service.load();
  }

  getCategoryName(categoryId: string | null): string {
    if (!categoryId) return '';
    const cat = this.service.categories().find((c) => c.id === categoryId);
    return cat?.name ?? '';
  }

  onSearch(value: string): void {
    this.service.setSearch(value);
  }

  onStatusChange(status: FilterState['status']): void {
    this.service.setStatus(status);
  }

  onCategoryChange(categoryId: string): void {
    this.service.setCategory(categoryId);
  }

  onSortChange(sort: SortOption): void {
    this.service.setSort(sort);
  }

  onToggleSelect(id: string): void {
    this.service.toggleSelect(id);
  }

  onSelectAll(): void {
    if (this.service.allSelected()) {
      this.service.clearSelection();
    } else {
      this.service.selectAll();
    }
  }

  onDeleteProduct(id: string): void {
    if (confirm('Delete this product? This cannot be undone.')) {
      this.service.deleteSingle(id);
    }
  }

  onBulkDelete(): void {
    if (confirm(`Delete ${this.service.selectedCount()} products? This cannot be undone.`)) {
      this.service.bulkDelete();
    }
  }

  onBulkSetStatus(status: ProductStatus): void {
    this.service.bulkSetStatus(status);
  }

  onClearSelection(): void {
    this.service.clearSelection();
  }

  onAddProduct(): void {
    this.router.navigate(['/products', 'new']);
  }

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
