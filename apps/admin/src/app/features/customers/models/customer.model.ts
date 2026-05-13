/**
 * Feature-local types for the Customers feature.
 * Customer and CustomerAddress are imported from @storecraft/models — never redefined here.
 */
export type { Customer, CustomerAddress } from '@storecraft/models';

export type SortOption = 'recent' | 'orders_desc' | 'spent_desc' | 'name_asc';

export interface FilterState {
  search: string;
  sortBy: SortOption;
  page: number;
  limit: number;
}

/** Format a number as EGP currency. */
export function fmtMoney(n: number): string {
  return `EGP ${new Intl.NumberFormat('en-EG').format(n)}`;
}

/** Format a date string as locale-short date. */
export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-EG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
