/**
 * Feature-local types for the Orders feature.
 * Order, OrderItem, OrderStatus, OrderStatusHistory are imported from @storecraft/models.
 */
export type {
  Order,
  OrderItem,
  OrderStatus,
  OrderStatusHistory,
} from '@storecraft/models';

export type SortOption =
  | 'created_desc'
  | 'created_asc'
  | 'total_desc'
  | 'total_asc';

export interface FilterState {
  search: string;
  status: 'all' | 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  sortBy: SortOption;
  page: number;
  limit: number;
}
