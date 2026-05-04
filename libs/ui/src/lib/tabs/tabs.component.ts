import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  inject,
  input,
  isDevMode,
  model,
  viewChildren,
} from '@angular/core';
import type { Tab, TabsSize, TabsVariant } from './tabs.types';

/**
 * Tabs with two visual variants — pill (default, used for filter
 * selectors) and underline (used for primary section navigation).
 *
 * Two-way `[(active)]` model holds the current tab key. The component
 * does not render panels — consumers render their own panels keyed by
 * the same value via `@switch (active())` or `@if (active() === ...)`.
 *
 * ## ARIA panel wiring (one-sided contract)
 *
 * sc-tabs adds the following on each tab button:
 *
 * - `id="tab-{key}"`
 * - `aria-controls="tabpanel-{key}"`
 * - `role="tab"`, `aria-selected`, roving `tabindex`
 *
 * Consumers should render their panel containers with the matching ids:
 *
 * ```html
 * <div role="tabpanel" id="tabpanel-general" aria-labelledby="tab-general">…</div>
 * ```
 *
 * Note: tab `key` values must be unique within a single page if
 * multiple `<sc-tabs>` instances are mounted, since panel ids are
 * derived directly from `key`.
 *
 * ## Keyboard
 *
 * - `ArrowLeft` / `ArrowRight` — previous / next enabled tab (wraps); flipped in RTL
 * - `Home` — first enabled tab
 * - `End` — last enabled tab
 *
 * @example Pill filter (default variant)
 * ```html
 * <sc-tabs size="sm" [tabs]="statusTabs()" [(active)]="statusFilter" />
 * ```
 *
 * @example Underline section navigation
 * ```html
 * <sc-tabs variant="underline" [tabs]="sections" [(active)]="activeSection" />
 * ```
 */
@Component({
  selector: 'sc-tabs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tabs.component.html',
  styleUrl: './tabs.component.scss',
})
export class TabsComponent {
  private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly tabs = input.required<Tab[]>();
  readonly variant = input<TabsVariant>('pill');
  readonly size = input<TabsSize>('md');
  readonly active = model<string>('');

  private readonly tabButtons = viewChildren<ElementRef<HTMLButtonElement>>('tabButton');

  constructor() {
    // Dev-mode warning when active() doesn't match any tab.key — fails loud,
    // doesn't auto-fallback to first tab (that would hide the bug).
    effect(() => {
      if (!isDevMode()) return;
      const active = this.active();
      const tabs = this.tabs();
      if (!active || !tabs.length) return;
      if (!tabs.some((t) => t.key === active)) {
        // eslint-disable-next-line no-console
        console.warn(
          `[sc-tabs] active key "${active}" does not match any tab. ` +
            `Available keys: [${tabs.map((t) => t.key).join(', ')}]`,
        );
      }
    });
  }

  selectTab(tab: Tab): void {
    if (tab.disabled) return;
    this.active.set(tab.key);
  }

  onKeyDown(event: KeyboardEvent, currentIndex: number): void {
    const tabs = this.tabs();
    if (!tabs.length) return;

    const rtl = this.isRtl();
    let nextIndex: number | null = null;

    switch (event.key) {
      case 'ArrowRight':
        nextIndex = this.nextEnabledIndex(currentIndex, rtl ? -1 : 1);
        break;
      case 'ArrowLeft':
        nextIndex = this.nextEnabledIndex(currentIndex, rtl ? 1 : -1);
        break;
      case 'Home':
        nextIndex = this.nextEnabledIndex(-1, 1);
        break;
      case 'End':
        nextIndex = this.nextEnabledIndex(tabs.length, -1);
        break;
      default:
        return;
    }

    if (nextIndex === null || nextIndex === currentIndex) return;

    event.preventDefault();
    this.active.set(tabs[nextIndex].key);
    queueMicrotask(() => {
      // queueMicrotask — wait for OnPush refresh so the new active button exists in DOM
      this.tabButtons()[nextIndex]?.nativeElement.focus();
    });
  }

  private nextEnabledIndex(from: number, step: number): number | null {
    const tabs = this.tabs();
    const count = tabs.length;
    if (!count) return null;
    let i = from + step;
    for (let attempts = 0; attempts < count; attempts++) {
      if (i < 0) i = count - 1;
      else if (i >= count) i = 0;
      if (!tabs[i].disabled) return i;
      i += step;
    }
    return null;
  }

  private isRtl(): boolean {
    if (typeof window === 'undefined') return false;
    return window.getComputedStyle(this.hostRef.nativeElement).direction === 'rtl';
  }
}
