import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  booleanAttribute,
  contentChild,
  input,
} from '@angular/core';
import type { DataTableAlign } from './data-table.types';

/**
 * Column definition for `<sc-data-table>`. Place one or more inside
 * the table; the table queries them via `contentChildren`.
 *
 * The component itself renders nothing (`:host { display: none }`) —
 * it acts as a typed config holder + optional cell template provider.
 *
 * @example Default text rendering
 * ```html
 * <sc-data-column key="name" label="Product" sortable />
 * ```
 *
 * @example Custom cell rendering via projected ng-template
 * ```html
 * <sc-data-column key="status" label="Status">
 *   <ng-template let-row>
 *     <admin-product-status-badge [status]="row.status" />
 *   </ng-template>
 * </sc-data-column>
 * ```
 */
@Component({
  selector: 'sc-data-column',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
  styles: [':host { display: none; }'],
})
export class DataColumnComponent {
  /** Field accessor on the row. Used as default cell value `{{ row[key] }}` and as the sort key. */
  readonly key = input.required<string>();

  /** Header label. Already-translated by caller. */
  readonly label = input.required<string>();

  /** When true, the header is clickable and emits sort changes. */
  readonly sortable = input(false, { transform: booleanAttribute });

  /** Cell + header alignment. Maps to text-align + justify-content using CSS logical values. */
  readonly align = input<DataTableAlign>('start');

  /**
   * CSS width for the column. When undefined, the column flexes via
   * `minmax(min-content, 1fr)` — never collapses below content width
   * but shares remaining space with other unspecified columns.
   *
   * Examples: `'120px'`, `'25%'`, `'minmax(160px, 2fr)'`.
   */
  readonly width = input<string>();

  /** Prevents wrap on the cell content; combined with overflow-ellipsis. */
  readonly nowrap = input(false, { transform: booleanAttribute });

  /**
   * Optional cell renderer projected as `<ng-template>`. The implicit
   * context is the row. When omitted, the table renders the cell as
   * plain text via `{{ row[key] }}`.
   */
  readonly cellTemplate = contentChild(TemplateRef);
}
