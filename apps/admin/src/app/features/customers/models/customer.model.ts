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

// ─── Avatar helpers (deterministic color seeding from name hash) ──────────────

const AVATAR_PALETTE = [
  '#2563EB',
  '#7C3AED',
  '#DC2626',
  '#D97706',
  '#16A34A',
  '#0891B2',
  '#DB2777',
  '#EA580C',
];

/**
 * Compute a deterministic integer hash from a string.
 * Used to pick a stable avatar background color per customer name.
 */
function nameHash(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = (Math.imul(31, h) + name.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/** Returns a deterministic avatar background color for the given name. */
export function avatarColor(name: string): string {
  return AVATAR_PALETTE[nameHash(name) % AVATAR_PALETTE.length];
}

/** Returns up-to-2-letter initials for a customer name. */
export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase();
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
