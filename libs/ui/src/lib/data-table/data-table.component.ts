import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  booleanAttribute,
  computed,
  contentChildren,
  input,
  model,
  output,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { DataColumnComponent } from './data-column.component';
import type { DataTableSort } from './data-table.types';

/**
 * Generic sortable / selectable / loadable data table built around
 * directive-style column definitions.
 *
 * The table renders semantic `<table>` / `<thead>` / `<tbody>` /
 * `<th>` / `<td>` elements with `display: grid` on the table and
 * `display: contents` on the row group elements so that columns flex
 * via `grid-template-columns` while screen readers still see proper
 * table semantics.
 *
 * Empty state is composed at the page level — wrap the table in
 * `@if (data().length > 0)` and render `<sc-empty-state>` in the
 * else branch.
 *
 * @example
 * ```html
 * <sc-data-table
 *   [data]="products()"
 *   [loading]="isLoading()"
 *   selectable
 *   selectionKey="id"
 *   [(selection)]="selectedIds"
 *   [(sort)]="sortState"
 *   (rowClick)="goToProduct($event)"
 * >
 *   <sc-data-column key="name"  label="Product" sortable />
 *   <sc-data-column key="price" label="Price"   sortable align="end" />
 *   <sc-data-column key="status" label="Status">
 *     <ng-template let-row>
 *       <admin-product-status-badge [status]="row.status" />
 *     </ng-template>
 *   </sc-data-column>
 * </sc-data-table>
 * ```
 */
@Component({
  selector: 'sc-data-table',
  standalone: true,
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './data-table.component.html',
  styleUrl: './data-table.component.scss',
})
export class DataTableComponent<TRow extends object> implements OnInit {
  /** Rows to render. Required. */
  readonly data = input.required<TRow[]>();

  /** Renders skeleton placeholder rows when true and data is empty. */
  readonly loading = input(false, { transform: booleanAttribute });

  /** Adds a checkbox column at the start when true. */
  readonly selectable = input(false, { transform: booleanAttribute });

  /**
   * Field on the row used as the unique key for selection (e.g. `'id'`).
   * Required when `selectable=true`. Misconfiguration throws on init.
   */
  readonly selectionKey = input<keyof TRow & string>();

  /** Opt-in `position: sticky` on the header row for long tables. */
  readonly stickyHeader = input(false, { transform: booleanAttribute });

  /**
   * Set of selected row keys (values of `row[selectionKey]`).
   * Two-way: `[(selection)]="selectedIds"`.
   */
  readonly selection = model<Set<string>>(new Set());

  /**
   * Current sort state. Two-way: `[(sort)]="sortState"`. The table
   * emits changes; the caller reorders / refetches the data.
   * Two-state cycle: clicking a sorted column flips asc <-> desc.
   */
  readonly sort = model<DataTableSort | undefined>(undefined);

  /** Fires when a non-checkbox cell of a row is clicked. */
  readonly rowClick = output<TRow>();

  /** Column directives projected as content children. */
  readonly columns = contentChildren(DataColumnComponent);

  /** CSS grid-template-columns string built from the column widths. */
  readonly gridTemplateColumns = computed(() => {
    const cols = this.columns();
    const selectableCol = this.selectable() ? '40px ' : '';
    const colWidths = cols
      .map((c) => c.width() ?? 'minmax(min-content, 1fr)')
      .join(' ');
    return selectableCol + colWidths;
  });

  /** Header checkbox tri-state derived from selection vs data. */
  readonly headerCheckboxState = computed<'none' | 'some' | 'all'>(() => {
    const data = this.data();
    const sel = this.selection();
    if (!data.length || !sel.size) return 'none';
    const key = this.selectionKey();
    if (!key) return 'none';
    const allSelected = data.every((row) =>
      sel.has(String((row as Record<string, unknown>)[key])),
    );
    return allSelected ? 'all' : 'some';
  });

  /** Number of skeleton rows to render while loading. */
  readonly skeletonRows = [0, 1, 2, 3, 4];

  ngOnInit(): void {
    if (this.selectable() && !this.selectionKey()) {
      throw new Error(
        'sc-data-table: selectionKey is required when selectable=true',
      );
    }
  }

  /** Track-by — uses selectionKey when available, falls back to index. */
  trackBy = (index: number, row: TRow): unknown => {
    const key = this.selectionKey();
    return key ? (row as Record<string, unknown>)[key] : index;
  };

  cellValue(row: TRow, key: string): unknown {
    return (row as Record<string, unknown>)[key];
  }

  rowKey(row: TRow): string {
    const key = this.selectionKey();
    if (!key) return '';
    return String((row as Record<string, unknown>)[key]);
  }

  isRowSelected(row: TRow): boolean {
    return this.selection().has(this.rowKey(row));
  }

  toggleRow(row: TRow, event: Event): void {
    event.stopPropagation();
    const key = this.rowKey(row);
    const next = new Set(this.selection());
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    this.selection.set(next);
  }

  toggleAll(): void {
    if (this.headerCheckboxState() === 'all') {
      this.selection.set(new Set());
      return;
    }
    const key = this.selectionKey();
    if (!key) return;
    const all = new Set<string>(
      this.data().map((row) => String((row as Record<string, unknown>)[key])),
    );
    this.selection.set(all);
  }

  onHeaderClick(col: DataColumnComponent): void {
    if (!col.sortable()) return;
    const current = this.sort();
    if (current && current.key === col.key()) {
      this.sort.set({
        key: col.key(),
        direction: current.direction === 'asc' ? 'desc' : 'asc',
      });
      return;
    }
    this.sort.set({ key: col.key(), direction: 'asc' });
  }

  /**
   * Returns the WAI-ARIA `aria-sort` value for a header cell.
   * Returns `null` for non-sortable columns so the attribute is omitted.
   */
  ariaSortFor(col: DataColumnComponent): 'ascending' | 'descending' | 'none' | null {
    if (!col.sortable()) return null;
    const current = this.sort();
    if (current?.key === col.key()) {
      return current.direction === 'asc' ? 'ascending' : 'descending';
    }
    return 'none';
  }

  onRowClick(row: TRow, event: Event): void {
    // Suppress when the click originated inside the checkbox cell
    if ((event.target as HTMLElement | null)?.closest('.sc-data-table-checkbox-cell')) {
      return;
    }
    this.rowClick.emit(row);
  }
}
