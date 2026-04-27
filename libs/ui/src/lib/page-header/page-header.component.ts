import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Page-level header with title, optional subtitle, optional count
 * pill, and a single content-projection slot for actions.
 *
 * The caller passes already-translated strings — the component does
 * not import an i18n service, so it stays reusable across admin,
 * storefront, and superadmin apps.
 *
 * The actions slot uses CSS `:empty` to collapse when no content is
 * projected (e.g. a login page with no header actions).
 *
 * @example Dashboard
 * ```html
 * <sc-page-header
 *   title="Dashboard"
 *   subtitle="Here's what's happening today."
 * >
 *   <sc-button variant="secondary">Export</sc-button>
 * </sc-page-header>
 * ```
 *
 * @example Products with count
 * ```html
 * <sc-page-header
 *   title="Products"
 *   subtitle="Manage your catalog"
 *   [count]="totalProducts()"
 * >
 *   <sc-button variant="secondary">Export</sc-button>
 *   <sc-button variant="primary">Add Product</sc-button>
 * </sc-page-header>
 * ```
 */
@Component({
  selector: 'sc-page-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './page-header.component.html',
  styleUrl: './page-header.component.scss',
})
export class PageHeaderComponent {
  /** Page title text. Already translated by caller. Required. */
  readonly title = input.required<string>();

  /** Optional subtitle line. Hidden when undefined or empty. */
  readonly subtitle = input<string>();

  /**
   * Optional count pill rendered next to the title.
   * `0` is shown (confirms data loaded); only `undefined` hides it.
   */
  readonly count = input<string | number>();
}
