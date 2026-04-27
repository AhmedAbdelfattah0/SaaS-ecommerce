import { Injectable, computed, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../../../core/api/api.service';
import type { Customer } from '../models/customer.model';
import type { Order } from '@storecraft/models';
import { fmtMoney } from '../models/customer.model';

export interface CustomerStats {
  ordersCount: number;
  totalSpent: number;
  totalSpentFormatted: string;
  avgOrderValue: number;
  avgOrderValueFormatted: string;
  lastOrderDate: string | null;
}

/**
 * ViewModel for the Customer Detail page.
 * NOT provided at root — the page component provides it so state is
 * fresh per customer navigation.
 *
 * NOTE: api.listOrders() does not currently accept a customerId filter.
 * We fetch all orders and filter client-side by customerId === customer.id.
 * FLAG FOR BACKEND: Add `customerId` param to GET /orders so we can avoid
 * loading the full order list.
 */
@Injectable()
export class CustomerDetailService {
  private readonly api = inject(ApiService);

  // ─── Private mutable state ───────────────────────────────────────────────
  private readonly _customer = signal<Customer | null>(null);
  private readonly _orders = signal<Order[]>([]);
  private readonly _isLoading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  // ─── Public readonly signals ─────────────────────────────────────────────
  readonly customer = this._customer.asReadonly();
  readonly orders = this._orders.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();

  // ─── Computed stats ───────────────────────────────────────────────────────
  readonly stats = computed<CustomerStats>(() => {
    const orders = this._orders();
    const ordersCount = orders.length;
    const totalSpent = orders.reduce((sum, o) => sum + o.total, 0);
    const avgOrderValue = ordersCount > 0 ? totalSpent / ordersCount : 0;

    const sorted = [...orders].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    const lastOrderDate = sorted[0]?.createdAt ?? null;

    return {
      ordersCount,
      totalSpent,
      totalSpentFormatted: fmtMoney(totalSpent),
      avgOrderValue,
      avgOrderValueFormatted: fmtMoney(Math.round(avgOrderValue)),
      lastOrderDate,
    };
  });

  /** Most recent 10 orders for the order history table. */
  readonly recentOrders = computed<Order[]>(() =>
    [...this._orders()]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10),
  );

  // ─── Load ─────────────────────────────────────────────────────────────────
  load(id: string): void {
    this._isLoading.set(true);
    this._error.set(null);

    forkJoin({
      customer: this.api.getCustomer(id),
      // FLAG FOR BACKEND: Replace with api.listOrders({ customerId: id }) once supported.
      allOrders: this.api.listOrders({ limit: 100 }).pipe(map((res) => res.items)),
    }).subscribe({
      next: ({ customer, allOrders }) => {
        this._customer.set(customer);
        const customerOrders = allOrders.filter((o) => o.customerId === id);
        this._orders.set(customerOrders);
        this._isLoading.set(false);
      },
      error: (err: Error) => {
        this._error.set(err.message ?? 'Failed to load customer');
        this._isLoading.set(false);
      },
    });
  }

  clearError(): void {
    this._error.set(null);
  }
}
