/**
 * Current sort state of an sc-data-table.
 *
 * The table emits sort changes via `[(sort)]` but does not actually
 * reorder the data — the page does the sort (works for both
 * client-side and server-side data sources).
 */
export interface DataTableSort {
  /** Column `key` of the sorted column. */
  key: string;
  /** Sort direction. Two-state cycle: clicking a sorted column flips between asc and desc. */
  direction: 'asc' | 'desc';
}

/** Per-column horizontal alignment. Uses CSS logical values (start/end) for RTL safety. */
export type DataTableAlign = 'start' | 'center' | 'end';
