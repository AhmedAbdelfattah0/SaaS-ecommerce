import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/api/api.service';
import type { Product, ProductCreateDto, ProductUpdateDto } from '../models/product.model';

/**
 * ViewModel for the product detail / create page.
 * Provided at the page level (not root) so state is fresh per navigation.
 */
@Injectable()
export class ProductDetailService {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  // ─── Private mutable state ───────────────────────────────────────────────
  private readonly _product = signal<Product | null>(null);
  private readonly _isLoading = signal<boolean>(false);
  private readonly _isSaving = signal<boolean>(false);
  private readonly _isDeleting = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  // ─── Public readonly signals ─────────────────────────────────────────────
  readonly product = this._product.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly isSaving = this._isSaving.asReadonly();
  readonly isDeleting = this._isDeleting.asReadonly();
  readonly error = this._error.asReadonly();

  // ─── Load ─────────────────────────────────────────────────────────────────
  load(id: string): void {
    this._isLoading.set(true);
    this._error.set(null);
    this.api.getProduct(id).subscribe({
      next: (product) => {
        this._product.set(product);
        this._isLoading.set(false);
      },
      error: (err: Error) => {
        this._error.set(err.message ?? 'Failed to load product');
        this._isLoading.set(false);
      },
    });
  }

  // ─── Save (create or update) ──────────────────────────────────────────────
  save(formValue: ProductCreateDto | ProductUpdateDto, existingId: string | null): void {
    this._isSaving.set(true);
    this._error.set(null);

    const request$ =
      existingId === null
        ? this.api.createProduct(formValue as ProductCreateDto)
        : this.api.updateProduct(existingId, formValue as ProductUpdateDto);

    request$.subscribe({
      next: (product) => {
        this._product.set(product);
        this._isSaving.set(false);
        if (existingId === null) {
          // Navigate to the created product's detail page
          this.router.navigate(['/products', product.id]);
        }
      },
      error: (err: Error) => {
        this._error.set(err.message ?? 'Save failed');
        this._isSaving.set(false);
      },
    });
  }

  // ─── Delete ───────────────────────────────────────────────────────────────
  delete(id: string): void {
    this._isDeleting.set(true);
    this._error.set(null);
    this.api.deleteProduct(id).subscribe({
      next: () => {
        this._isDeleting.set(false);
        this.router.navigate(['/products']);
      },
      error: (err: Error) => {
        this._error.set(err.message ?? 'Delete failed');
        this._isDeleting.set(false);
      },
    });
  }

  clearError(): void {
    this._error.set(null);
  }
}
