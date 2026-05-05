import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
  output,
} from '@angular/core';

/** Visual + ARIA-role variant for `<sc-banner>`. */
export type BannerVariant = 'info' | 'success' | 'warning' | 'error';

/**
 * Inline status banner — page-level info / success / warning / error
 * message that's part of layout. NOT a transient toast (auto-dismiss
 * + queueing belongs to a future sc-toast).
 *
 * Visibility is caller-controlled via `@if`; the banner does not
 * self-hide. The `(dismiss)` output emits intent on X click — caller
 * toggles its own flag.
 *
 * ## Variant → ARIA role
 *
 * - `error`, `warning` → `role="alert"` (assertive; interrupts SR)
 * - `info`, `success` → `role="status"` (polite)
 *
 * ## Slots
 *
 * - default          — body text
 * - `[banner-icon]`  — overrides the variant's default icon (use `[icon]="false"` to suppress entirely)
 * - `[banner-actions]` — trailing actions cluster (sc-button etc.)
 *
 * ## Mobile
 *
 * At viewport ≤640px, `[banner-actions]` wraps to its own row beneath
 * the body. Icon stays inline at the start; dismiss X stays at the end.
 *
 * @example Persistent info
 * ```html
 * <sc-banner variant="info">
 *   Your API credentials are encrypted and stored securely.
 * </sc-banner>
 * ```
 *
 * @example Live, with actions, dismissible
 * ```html
 * @if (newOrdersBannerOpen()) {
 *   <sc-banner variant="info" dismissible (dismiss)="newOrdersBannerOpen.set(false)">
 *     <strong>3 new orders</strong> received in the last hour.
 *     <sc-button banner-actions size="sm" variant="ghost" (click)="refresh()">Refresh</sc-button>
 *   </sc-banner>
 * }
 * ```
 *
 * @example Inline error
 * ```html
 * @if (loginError()) {
 *   <sc-banner variant="error">{{ loginError() }}</sc-banner>
 * }
 * ```
 */
@Component({
  selector: 'sc-banner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './banner.component.html',
  styleUrl: './banner.component.scss',
})
export class BannerComponent {
  readonly variant = input<BannerVariant>('info');
  readonly dismissible = input(false, { transform: booleanAttribute });
  readonly icon = input(true, { transform: booleanAttribute });

  readonly dismiss = output<void>();

  /** ARIA role mapped from variant — alert for error/warning, status for info/success. */
  readonly ariaRole = computed<'alert' | 'status'>(() => {
    const v = this.variant();
    return v === 'error' || v === 'warning' ? 'alert' : 'status';
  });
}
