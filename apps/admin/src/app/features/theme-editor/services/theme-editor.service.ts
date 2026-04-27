import { Injectable, inject, signal, computed } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import type { ThemeConfig, ThemeUpdateDto } from '@storecraft/models';
import { ApiService } from '../../../core/api/api.service';

/** CSS variable names keyed by ThemeConfig property */
const CSS_VAR_MAP: Partial<Record<keyof ThemeUpdateDto, string>> = {
  primaryColor: '--color-primary',
  secondaryColor: '--color-secondary',
  backgroundColor: '--color-bg',
  textColor: '--color-text',
};

@Injectable({ providedIn: 'root' })
export class ThemeEditorService {
  private readonly api = inject(ApiService);
  private readonly document = inject(DOCUMENT);

  private readonly _theme = signal<ThemeConfig | null>(null);
  private readonly _isLoading = signal(false);
  private readonly _isSaving = signal(false);
  private readonly _isDirty = signal(false);
  private readonly _saveError = signal<string | null>(null);

  readonly theme = this._theme.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly isSaving = this._isSaving.asReadonly();
  readonly isDirty = this._isDirty.asReadonly();
  readonly saveError = this._saveError.asReadonly();

  /** True when the service has loaded at least once */
  readonly isReady = computed(() => this._theme() !== null);

  load(): void {
    if (this._isLoading()) return;
    this._isLoading.set(true);
    this._saveError.set(null);

    this.api.getTheme().subscribe({
      next: (theme) => {
        this._theme.set(theme);
        this._isDirty.set(false);
        this._isLoading.set(false);
        this.applyAllCssVars(theme);
      },
      error: (err: Error) => {
        this._saveError.set(err.message ?? 'Failed to load theme');
        this._isLoading.set(false);
      },
    });
  }

  /**
   * Patch the in-memory theme signal and immediately apply CSS variables
   * to document.documentElement for instant live preview.
   */
  update(partial: ThemeUpdateDto): void {
    const current = this._theme();
    if (current === null) return;

    const next: ThemeConfig = { ...current, ...partial };
    this._theme.set(next);
    this._isDirty.set(true);
    this._saveError.set(null);

    // Apply CSS variables for live preview
    const root = this.document.documentElement;
    for (const [key, cssVar] of Object.entries(CSS_VAR_MAP) as [
      keyof ThemeUpdateDto,
      string,
    ][]) {
      const value = partial[key];
      if (typeof value === 'string' && cssVar) {
        root.style.setProperty(cssVar, value);
      }
    }

    // Apply font family
    if (partial.fontFamily) {
      root.style.setProperty('--font-sans', partial.fontFamily);
    }
  }

  /** Persist the current theme state to the backend. */
  save(): void {
    const theme = this._theme();
    if (theme === null || !this._isDirty() || this._isSaving()) return;

    this._isSaving.set(true);
    this._saveError.set(null);

    const dto: ThemeUpdateDto = {
      primaryColor: theme.primaryColor,
      secondaryColor: theme.secondaryColor,
      backgroundColor: theme.backgroundColor,
      textColor: theme.textColor,
      fontFamily: theme.fontFamily,
      logoUrl: theme.logoUrl,
      storeName: theme.storeName,
      layoutType: theme.layoutType,
    };

    this.api.updateTheme(dto).subscribe({
      next: (saved) => {
        this._theme.set(saved);
        this._isDirty.set(false);
        this._isSaving.set(false);
      },
      error: (err: Error) => {
        this._saveError.set(err.message ?? 'Failed to save theme');
        this._isSaving.set(false);
      },
    });
  }

  /** Revert in-memory changes and re-apply persisted CSS vars. */
  discard(): void {
    this._isDirty.set(false);
    this._saveError.set(null);
    this.load();
  }

  private applyAllCssVars(theme: ThemeConfig): void {
    const root = this.document.documentElement;
    root.style.setProperty('--color-primary', theme.primaryColor);
    root.style.setProperty('--color-secondary', theme.secondaryColor);
    root.style.setProperty('--color-bg', theme.backgroundColor);
    root.style.setProperty('--color-text', theme.textColor);
    root.style.setProperty('--font-sans', theme.fontFamily);
  }
}
