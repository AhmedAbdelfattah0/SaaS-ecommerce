import { Injectable, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiService } from '../../../core/api/api.service';
import type { Order, OrderStatus } from '@storecraft/models';

@Injectable()
export class OrderDetailService {
  private readonly api = inject(ApiService);
  private readonly destroyRef = inject(DestroyRef);

  // ── private writeable signals
  private readonly _order = signal<Order | null>(null);
  private readonly _isLoading = signal(false);
  private readonly _isUpdating = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _updateError = signal<string | null>(null);
  private readonly _updateSuccess = signal(false);

  // ── public readonly signals
  readonly order = this._order.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly isUpdating = this._isUpdating.asReadonly();
  readonly error = this._error.asReadonly();
  readonly updateError = this._updateError.asReadonly();
  readonly updateSuccess = this._updateSuccess.asReadonly();

  load(id: string): void {
    this._isLoading.set(true);
    this._error.set(null);

    this.api
      .getOrder(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (order: Order) => {
          this._order.set(order);
          this._isLoading.set(false);
        },
        error: (err: unknown) => {
          const msg = err instanceof Error ? err.message : 'Failed to load order';
          this._error.set(msg);
          this._isLoading.set(false);
        },
      });
  }

  updateStatus(id: string, status: OrderStatus, note?: string): void {
    this._isUpdating.set(true);
    this._updateError.set(null);
    this._updateSuccess.set(false);

    this.api
      .updateOrderStatus(id, status, note)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated: Order) => {
          this._order.set(updated);
          this._isUpdating.set(false);
          this._updateSuccess.set(true);
          // Reset success flag after a short delay
          setTimeout(() => this._updateSuccess.set(false), 3000);
        },
        error: (err: unknown) => {
          const msg = err instanceof Error ? err.message : 'Failed to update order status';
          this._updateError.set(msg);
          this._isUpdating.set(false);
        },
      });
  }
}
