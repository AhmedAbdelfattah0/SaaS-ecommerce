import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Centred empty state with optional icon, optional description, and
 * optional action(s). The caller passes already-translated strings —
 * the component does not import an i18n service, so it stays reusable
 * across admin, storefront, and superadmin apps.
 *
 * Both projection slots use CSS `:empty` to collapse cleanly when the
 * caller omits them (no awkward gaps in the centred stack).
 *
 * The page composes this component alongside its list/table
 * (`@if (data().length > 0) ... @else <sc-empty-state>...`); list and
 * table components in libs/ui do NOT accept empty-state inputs.
 *
 * @example Filtered empty (data exists, filters excluded all)
 * ```html
 * <sc-empty-state
 *   title="No products match your filters"
 *   description="Try adjusting your search or filters."
 * >
 *   <admin-icon icon name="search" [size]="32" />
 *   <sc-button variant="secondary" (click)="clearFilters()">Clear filters</sc-button>
 * </sc-empty-state>
 * ```
 *
 * @example First-time empty (no data yet)
 * ```html
 * <sc-empty-state
 *   title="No products yet"
 *   description="Add your first product to start selling."
 * >
 *   <admin-icon icon name="package" [size]="32" />
 *   <sc-button variant="primary" (click)="addProduct()">Add Product</sc-button>
 * </sc-empty-state>
 * ```
 *
 * @example Bare minimum (no icon, no description, no actions)
 * ```html
 * <sc-empty-state title="No results" />
 * ```
 */
@Component({
  selector: 'sc-empty-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './empty-state.component.html',
  styleUrl: './empty-state.component.scss',
})
export class EmptyStateComponent {
  /** Heading text. Already translated by caller. Required. */
  readonly title = input.required<string>();

  /** Optional explanatory line below the title. Hidden when undefined or empty. */
  readonly description = input<string>();
}
