import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import type { ThemeConfig } from '@storecraft/models';

interface ThemeApiResponse {
  data: ThemeConfig | null;
  error: string | null;
}

const DEFAULT_THEME: ThemeConfig = {
  tenantId: '',
  primaryColor: '#000000',
  secondaryColor: '#ffffff',
  backgroundColor: '#ffffff',
  textColor: '#000000',
  fontFamily: 'Inter',
  logoUrl: '',
  storeName: 'StoreCraft',
  layoutType: 'classic',
};

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);

  /** Current theme signal — drives live preview reactivity */
  readonly currentTheme = signal<ThemeConfig>(DEFAULT_THEME);

  /** Load theme from API and apply to document — used in APP_INITIALIZER */
  async loadTheme(): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.http.get<ThemeApiResponse>('/api/theme')
      );
      if (response.data) {
        this.applyTheme(response.data);
      }
    } catch {
      // Use default theme on failure — storefront still renders
    }
  }

  /** Apply a theme config as CSS variables on :root */
  applyTheme(theme: ThemeConfig): void {
    this.currentTheme.set(theme);

    if (isPlatformBrowser(this.platformId)) {
      const root = document.documentElement;
      root.style.setProperty('--color-primary', theme.primaryColor);
      root.style.setProperty('--color-secondary', theme.secondaryColor);
      root.style.setProperty('--color-bg', theme.backgroundColor);
      root.style.setProperty('--color-text', theme.textColor);
      root.style.setProperty('--font-family', `${theme.fontFamily}, sans-serif`);
    }
  }
}
