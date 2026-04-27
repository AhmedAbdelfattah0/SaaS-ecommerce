import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import type {
  Product,
  ProductCreateDto,
  ProductUpdateDto,
  Category,
  Order,
  OrderStatus,
  Customer,
  ThemeConfig,
  ThemeUpdateDto,
} from '@storecraft/models';
import type { ApiResponse } from '@storecraft/utils';
import { environment } from '../../../environments/environment';

export interface ProductListParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  status?: 'active' | 'draft' | 'deleted';
}

export interface OrderListParams {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  search?: string;
}

export interface CustomerListParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: 'owner' | 'admin' | 'staff';
  tenantId: string;
}

/**
 * Single central HTTP client for the Admin app.
 *
 * MVVM rule: HttpClient lives ONLY here.
 * Feature services consume typed methods from this service — never inject HttpClient directly.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  // ─── Auth ─────────────────────────────────────────────
  getCurrentAdmin(): Observable<AdminUser> {
    return this.unwrap(this.http.get<ApiResponse<AdminUser>>(`${this.base}/auth/me`));
  }

  // ─── Products ─────────────────────────────────────────
  listProducts(params: ProductListParams = {}): Observable<{ items: Product[]; total: number }> {
    return this.http
      .get<ApiResponse<Product[]>>(`${this.base}/products`, { params: this.toHttpParams(params) })
      .pipe(
        map((res) => ({
          items: res.data ?? [],
          total: res.meta?.total ?? res.data?.length ?? 0,
        })),
      );
  }

  getProduct(id: string): Observable<Product> {
    return this.unwrap(this.http.get<ApiResponse<Product>>(`${this.base}/products/${id}`));
  }

  createProduct(dto: ProductCreateDto): Observable<Product> {
    return this.unwrap(this.http.post<ApiResponse<Product>>(`${this.base}/products`, dto));
  }

  updateProduct(id: string, dto: ProductUpdateDto): Observable<Product> {
    return this.unwrap(this.http.patch<ApiResponse<Product>>(`${this.base}/products/${id}`, dto));
  }

  deleteProduct(id: string): Observable<void> {
    return this.http
      .delete<ApiResponse<null>>(`${this.base}/products/${id}`)
      .pipe(map(() => undefined));
  }

  // ─── Categories ───────────────────────────────────────
  listCategories(): Observable<Category[]> {
    return this.http
      .get<ApiResponse<Category[]>>(`${this.base}/categories`)
      .pipe(map((res) => res.data ?? []));
  }

  createCategory(dto: { name: string; slug?: string }): Observable<Category> {
    return this.unwrap(this.http.post<ApiResponse<Category>>(`${this.base}/categories`, dto));
  }

  // ─── Orders ───────────────────────────────────────────
  listOrders(params: OrderListParams = {}): Observable<{ items: Order[]; total: number }> {
    return this.http
      .get<ApiResponse<Order[]>>(`${this.base}/orders`, { params: this.toHttpParams(params) })
      .pipe(
        map((res) => ({
          items: res.data ?? [],
          total: res.meta?.total ?? res.data?.length ?? 0,
        })),
      );
  }

  getOrder(id: string): Observable<Order> {
    return this.unwrap(this.http.get<ApiResponse<Order>>(`${this.base}/orders/${id}`));
  }

  updateOrderStatus(id: string, status: OrderStatus, note?: string): Observable<Order> {
    return this.unwrap(
      this.http.patch<ApiResponse<Order>>(`${this.base}/orders/${id}`, { status, note }),
    );
  }

  // ─── Customers ────────────────────────────────────────
  listCustomers(
    params: CustomerListParams = {},
  ): Observable<{ items: Customer[]; total: number }> {
    return this.http
      .get<ApiResponse<Customer[]>>(`${this.base}/customers`, {
        params: this.toHttpParams(params),
      })
      .pipe(
        map((res) => ({
          items: res.data ?? [],
          total: res.meta?.total ?? res.data?.length ?? 0,
        })),
      );
  }

  getCustomer(id: string): Observable<Customer> {
    return this.unwrap(this.http.get<ApiResponse<Customer>>(`${this.base}/customers/${id}`));
  }

  // ─── Theme ────────────────────────────────────────────
  getTheme(): Observable<ThemeConfig> {
    return this.unwrap(this.http.get<ApiResponse<ThemeConfig>>(`${this.base}/theme`));
  }

  updateTheme(dto: ThemeUpdateDto): Observable<ThemeConfig> {
    return this.unwrap(this.http.patch<ApiResponse<ThemeConfig>>(`${this.base}/theme`, dto));
  }

  // ─── Internal ─────────────────────────────────────────
  private unwrap<T>(source$: Observable<ApiResponse<T>>): Observable<T> {
    return source$.pipe(
      map((res) => {
        if (res.error || res.data == null) {
          throw new Error(res.error ?? 'Empty response');
        }
        return res.data;
      }),
    );
  }

  private toHttpParams(obj: Record<string, unknown> | object): HttpParams {
    let params = new HttpParams();
    for (const [k, v] of Object.entries(obj)) {
      if (v !== undefined && v !== null && v !== '') {
        params = params.set(k, String(v));
      }
    }
    return params;
  }
}
