import { Injectable, signal, computed, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type Language = 'en' | 'ar';

const LANG_STORAGE_KEY = 'storecraft_lang';

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly platformId = inject(PLATFORM_ID);

  /** Current language signal — the single source of truth */
  readonly currentLang = signal<Language>(this.getInitialLanguage());

  /** Direction derived signal */
  readonly dir = computed<'ltr' | 'rtl'>(() =>
    this.currentLang() === 'ar' ? 'rtl' : 'ltr'
  );

  /** Human-readable label for the current language */
  readonly langLabel = computed(() => (this.currentLang() === 'ar' ? 'ع' : 'EN'));

  constructor() {
    this.applyDirectionToDocument(this.currentLang());
  }

  setLanguage(lang: Language): void {
    this.currentLang.set(lang);
    this.applyDirectionToDocument(lang);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(LANG_STORAGE_KEY, lang);
    }
  }

  toggleLanguage(): void {
    this.setLanguage(this.currentLang() === 'en' ? 'ar' : 'en');
  }

  private getInitialLanguage(): Language {
    if (isPlatformBrowser(this.platformId)) {
      const stored = localStorage.getItem(LANG_STORAGE_KEY) as Language | null;
      if (stored === 'ar' || stored === 'en') return stored;
    }
    return 'en';
  }

  private applyDirectionToDocument(lang: Language): void {
    if (isPlatformBrowser(this.platformId)) {
      const dir = lang === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.setAttribute('dir', dir);
      document.documentElement.setAttribute('lang', lang);
    }
  }
}
