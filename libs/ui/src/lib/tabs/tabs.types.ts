/** A single tab definition consumed by `<sc-tabs>`. */
export interface Tab {
  /** Unique identifier — used as the `active` model value and as the @for track key. */
  key: string;
  /** Already-translated tab label. */
  label: string;
  /** Optional badge after the label. `0` is shown (confirms data loaded); only `undefined` hides it. */
  count?: string | number;
  /** Disabled tabs are non-interactive and skipped by arrow-key navigation. */
  disabled?: boolean;
}

/** Visual variant of `<sc-tabs>`. */
export type TabsVariant = 'underline' | 'pill';

/** Sizing variant of `<sc-tabs>`. */
export type TabsSize = 'sm' | 'md';
