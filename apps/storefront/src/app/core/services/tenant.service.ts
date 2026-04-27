import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import type { TenantResolution } from '@storecraft/models';

interface TenantApiResponse {
  data: TenantResolution | null;
  error: string | null;
}

@Injectable({ providedIn: 'root' })
export class TenantService {
  private readonly http = inject(HttpClient);

  readonly currentTenant = signal<TenantResolution | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  /** Resolve tenant from Host header — called in APP_INITIALIZER */
  async resolveTenant(): Promise<void> {
    this.isLoading.set(true);
    try {
      const response = await firstValueFrom(
        this.http.get<TenantApiResponse>('/api/tenant/resolve')
      );
      if (response.data) {
        this.currentTenant.set(response.data);
      } else {
        this.error.set(response.error ?? 'Tenant not found');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to resolve tenant';
      this.error.set(message);
    } finally {
      this.isLoading.set(false);
    }
  }
}
