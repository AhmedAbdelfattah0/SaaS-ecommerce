import type { IconName } from '../../../shared/components/admin-icon/admin-icon.component';

export type DashboardRange = '7d' | '30d' | '90d';

export interface Kpi {
  id: string;
  label: string;
  value: string;
  delta: string;
  up: boolean;
  color: string;
  bg: string;
  icon: IconName;
  spark: number[];
}

export interface DonutSegment {
  label: string;
  value: number;
  pct: number;
  color: string;
}

export interface RevenuePoint {
  label: string;
  current: number;
  previous: number;
}

export interface TopProduct {
  id: string;
  name: string;
  category: string;
  revenue: string;
  units: number;
  pct: number;
  color: string;
}

export interface LowStockItem {
  id: string;
  name: string;
  stock: number;
  threshold: number;
  color: string;
}

export interface RecentOrder {
  id: string;
  customerName: string;
  customerEmail: string;
  total: string;
  status: string;
  createdAt: string;
  itemCount: number;
}

export interface RecentCustomer {
  id: string;
  name: string;
  email: string;
  initials: string;
  avatarColor: string;
  joinedAt: string;
  orderCount: number;
}
