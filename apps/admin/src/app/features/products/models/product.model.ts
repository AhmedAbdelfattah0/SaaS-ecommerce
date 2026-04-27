/**
 * Feature-local types for the Products feature.
 * Product, Category, ProductCreateDto, ProductUpdateDto, ProductStatus, ProductVariant
 * are all imported from @storecraft/models — never redefined here.
 */
export type {
  Product,
  Category,
  ProductCreateDto,
  ProductUpdateDto,
  ProductStatus,
  ProductVariant,
} from '@storecraft/models';

export type SortOption = 'name_asc' | 'name_desc' | 'price_asc' | 'price_desc' | 'stock_asc' | 'stock_desc' | 'created_desc' | 'created_asc';

export interface FilterState {
  search: string;
  categoryId: string;
  status: 'all' | 'active' | 'draft' | 'deleted';
  sortBy: SortOption;
  page: number;
  limit: number;
}
