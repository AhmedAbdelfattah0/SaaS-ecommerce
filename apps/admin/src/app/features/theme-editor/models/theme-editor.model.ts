import type { LayoutType } from '@storecraft/models';

export interface FontOption {
  label: string;
  value: string;
  /** CSS stack used in the live preview */
  stack: string;
}

export interface LayoutOption {
  label: string;
  value: LayoutType;
  description: string;
}

export const FONT_OPTIONS: FontOption[] = [
  { label: 'Inter', value: 'Inter', stack: "'Inter', system-ui, -apple-system, sans-serif" },
  { label: 'Cairo', value: 'Cairo', stack: "'Cairo', system-ui, sans-serif" },
  {
    label: 'Playfair Display',
    value: 'Playfair Display',
    stack: "'Playfair Display', Georgia, serif",
  },
  { label: 'Roboto', value: 'Roboto', stack: "'Roboto', Arial, sans-serif" },
  { label: 'Manrope', value: 'Manrope', stack: "'Manrope', system-ui, sans-serif" },
];

export const LAYOUT_OPTIONS: LayoutOption[] = [
  {
    label: 'Classic',
    value: 'classic',
    description: 'Traditional grid layout with sidebar navigation',
  },
  {
    label: 'Boutique',
    value: 'boutique',
    description: 'Elegant full-width layout ideal for fashion',
  },
  {
    label: 'Catalog',
    value: 'catalog',
    description: 'Dense product catalog for large inventories',
  },
];
