import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../../core/api/api.service';
import type { Customer, Order } from '@storecraft/models';
import type {
  Kpi,
  DonutSegment,
  RevenuePoint,
  TopProduct,
  LowStockItem,
  RecentOrder,
  RecentCustomer,
  DashboardRange,
} from '../models/dashboard.model';

// ─── Helpers (ported from design/data.jsx) ────────────────────────────────────

const AVATAR_COLORS = [
  '#2563EB', '#7C3AED', '#DC2626', '#D97706', '#16A34A', '#0891B2',
];

function fmt(n: number): string {
  return new Intl.NumberFormat('en-EG').format(n);
}

function fmtMoney(n: number): string {
  return `EGP ${new Intl.NumberFormat('en-EG').format(n)}`;
}

function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase();
}

function avatarColor(index: number): string {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

function relativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── Status badge mapping (ported from design/data.jsx STATUS_MAP) ────────────

export const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  pending:    { label: 'Pending',    cls: 'badge badge-amber' },
  processing: { label: 'Processing', cls: 'badge badge-blue' },
  shipped:    { label: 'Shipped',    cls: 'badge badge-purple' },
  delivered:  { label: 'Delivered',  cls: 'badge badge-green' },
  cancelled:  { label: 'Cancelled',  cls: 'badge badge-red' },
  active:     { label: 'Active',     cls: 'badge badge-green' },
  draft:      { label: 'Draft',      cls: 'badge badge-gray' },
  deleted:    { label: 'Deleted',    cls: 'badge badge-red' },
};

// ─── Mock data (KPIs, charts — no analytics endpoint yet) ───────────────────
// TODO(stage-10): replace with real /api/analytics/dashboard?range=... once
// the analytics endpoint exists. Numbers below are deterministic per range so
// users can verify the date-range toggle has an effect; multipliers approximate
// what 7-day vs 30-day vs 90-day periods would look like.

const RANGE_DAYS: Record<DashboardRange, number> = { '7d': 7, '30d': 30, '90d': 90 };

const MOCK_SPARK_REVENUE = [4200, 3800, 5100, 4700, 6200, 5800, 7100];
const MOCK_SPARK_ORDERS  = [18, 14, 22, 19, 27, 24, 31];
const MOCK_SPARK_CUST    = [3, 5, 2, 7, 4, 6, 8];
const MOCK_SPARK_AOV     = [210, 195, 230, 220, 245, 238, 260];

function scaleForRange(range: DashboardRange): number {
  // 7d = 1×, 30d ≈ 4×, 90d ≈ 12× — revenue / orders / new-customers scale
  // roughly linearly with the time window.
  return RANGE_DAYS[range] / 7;
}

function buildKpis(range: DashboardRange): Kpi[] {
  const scale = scaleForRange(range);
  return [
    {
      id: 'revenue',
      label: 'Total Revenue',
      value: fmtMoney(Math.round(84_230 * scale)),
      delta: range === '7d' ? '+12.5%' : range === '30d' ? '+8.2%' : '+5.4%',
      up: true,
      color: 'var(--color-primary)',
      bg: 'var(--color-primary-light)',
      icon: 'dollar',
      spark: MOCK_SPARK_REVENUE,
    },
    {
      id: 'orders',
      label: 'Total Orders',
      value: fmt(Math.round(1_284 * scale)),
      delta: range === '7d' ? '+8.2%' : range === '30d' ? '+6.4%' : '+4.1%',
      up: true,
      color: 'var(--color-purple)',
      bg: 'var(--color-purple-light)',
      icon: 'cart',
      spark: MOCK_SPARK_ORDERS,
    },
    {
      id: 'customers',
      label: 'New Customers',
      value: fmt(Math.round(342 * scale)),
      delta: range === '7d' ? '+5.1%' : range === '30d' ? '+9.7%' : '+11.2%',
      up: true,
      color: 'var(--color-success)',
      bg: 'var(--color-success-light)',
      icon: 'userplus',
      spark: MOCK_SPARK_CUST,
    },
    {
      // AOV is a per-order average — doesn't scale with window; mock drift
      id: 'aov',
      label: 'Avg. Order Value',
      value: fmtMoney(range === '7d' ? 246 : range === '30d' ? 238 : 232),
      delta: range === '7d' ? '-2.3%' : range === '30d' ? '-3.1%' : '-4.0%',
      up: false,
      color: 'var(--color-warning)',
      bg: 'var(--color-warning-light)',
      icon: 'trendingup',
      spark: MOCK_SPARK_AOV,
    },
  ];
}

function buildRevenuePoints(): RevenuePoint[] {
  return [
    { label: 'Mon', current: 4200, previous: 3100 },
    { label: 'Tue', current: 3800, previous: 2900 },
    { label: 'Wed', current: 5100, previous: 4200 },
    { label: 'Thu', current: 4700, previous: 3800 },
    { label: 'Fri', current: 6200, previous: 5100 },
    { label: 'Sat', current: 5800, previous: 4700 },
    { label: 'Sun', current: 7100, previous: 5900 },
  ];
}

function buildDonutSegments(): DonutSegment[] {
  const data = [
    { label: 'Delivered',  value: 612, color: 'var(--color-success)' },
    { label: 'Processing', value: 318, color: 'var(--color-primary)' },
    { label: 'Shipped',    value: 204, color: 'var(--color-purple)' },
    { label: 'Pending',    value: 102, color: 'var(--color-warning)' },
    { label: 'Cancelled',  value: 48,  color: 'var(--color-danger)' },
  ];
  const total = data.reduce((s, d) => s + d.value, 0);
  return data.map((d) => ({ ...d, pct: Math.round((d.value / total) * 100) }));
}

function buildTopProducts(): TopProduct[] {
  return [
    { id: '1', name: 'Wireless Headphones Pro', category: 'Electronics', revenue: fmtMoney(18_400), units: 92, pct: 88, color: '#2563EB' },
    { id: '2', name: 'Smart Watch Series X',    category: 'Electronics', revenue: fmtMoney(14_700), units: 73, pct: 70, color: '#7C3AED' },
    { id: '3', name: 'Premium Leather Bag',     category: 'Fashion',     revenue: fmtMoney(11_200), units: 56, pct: 54, color: '#16A34A' },
    { id: '4', name: 'Running Shoes Elite',     category: 'Sports',      revenue: fmtMoney(9_600),  units: 48, pct: 46, color: '#D97706' },
    { id: '5', name: 'Coffee Maker Deluxe',     category: 'Home',        revenue: fmtMoney(7_800),  units: 39, pct: 37, color: '#DC2626' },
  ];
}

function buildLowStock(): LowStockItem[] {
  return [
    { id: '1', name: 'Limited Edition Sneakers', stock: 3,  threshold: 10, color: '#2563EB' },
    { id: '2', name: 'Vintage Denim Jacket',      stock: 5,  threshold: 10, color: '#7C3AED' },
    { id: '3', name: 'Organic Face Serum',        stock: 7,  threshold: 15, color: '#DC2626' },
    { id: '4', name: 'Bluetooth Speaker Mini',    stock: 8,  threshold: 15, color: '#D97706' },
    { id: '5', name: 'Yoga Mat Premium',          stock: 12, threshold: 20, color: '#16A34A' },
  ];
}

function mapOrder(o: Order): RecentOrder {
  return {
    id: o.id.slice(0, 8).toUpperCase(),
    customerName: o.items[0]?.name ?? 'Customer',
    customerEmail: '',
    total: fmtMoney(o.total),
    status: o.status,
    createdAt: relativeDate(o.createdAt),
    itemCount: o.items.length,
  };
}

function mapCustomer(c: Customer, idx: number): RecentCustomer {
  return {
    id: c.id,
    name: c.name,
    email: c.email,
    initials: initials(c.name),
    avatarColor: avatarColor(idx),
    joinedAt: relativeDate(c.createdAt),
    orderCount: 0,
  };
}

// ─── Service ─────────────────────────────────────────────────────────────────

@Injectable()
export class DashboardService {
  private readonly api        = inject(ApiService);
  private readonly destroyRef = inject(DestroyRef);

  // ── private writeable signals
  private readonly _isLoading   = signal(false);
  private readonly _error       = signal<string | null>(null);
  private readonly _range       = signal<DashboardRange>('30d');
  private readonly _kpis        = signal<Kpi[]>(buildKpis('30d'));
  private readonly _revenuePts  = signal<RevenuePoint[]>(buildRevenuePoints());
  private readonly _donutSegs   = signal<DonutSegment[]>(buildDonutSegments());
  private readonly _topProducts = signal<TopProduct[]>(buildTopProducts());
  private readonly _lowStock    = signal<LowStockItem[]>(buildLowStock());
  private readonly _recentOrders    = signal<RecentOrder[]>([]);
  private readonly _recentCustomers = signal<RecentCustomer[]>([]);

  // ── public readonly signals
  readonly isLoading        = this._isLoading.asReadonly();
  readonly error            = this._error.asReadonly();
  readonly range            = this._range.asReadonly();
  readonly kpis             = this._kpis.asReadonly();
  readonly revenuePoints    = this._revenuePts.asReadonly();
  readonly donutSegments    = this._donutSegs.asReadonly();
  readonly topProducts      = this._topProducts.asReadonly();
  readonly lowStock         = this._lowStock.asReadonly();
  readonly recentOrders     = this._recentOrders.asReadonly();
  readonly recentCustomers  = this._recentCustomers.asReadonly();

  // ── derived
  readonly totalOrders = computed(() =>
    this._donutSegs().reduce((s, d) => s + d.value, 0),
  );

  /**
   * Human-readable date range label, e.g. "Apr 19 – Apr 26, 2026" for 7d.
   * Shown next to the pill toggle so users see what range is active.
   * Recomputes whenever _range changes (signal dependency).
   */
  readonly dateRangeLabel = computed(() => {
    const days = RANGE_DAYS[this._range()];
    const end = new Date();
    const start = new Date(end.getTime() - (days - 1) * 86_400_000);
    const fmt = (d: Date): string =>
      d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endYear = end.getFullYear();
    return `${fmt(start)} – ${fmt(end)}, ${endYear}`;
  });

  setRange(r: DashboardRange): void {
    if (r === this._range()) return;
    this._range.set(r);
    // Rebuild range-sensitive KPIs. (Revenue/donut/top/low-stock are not yet
    // range-sensitive — see TODO above buildKpis.)
    this._kpis.set(buildKpis(r));
  }

  load(): void {
    this._isLoading.set(true);
    this._error.set(null);

    forkJoin([
      this.api.listOrders({ limit: 6 }),
      this.api.listCustomers({ limit: 5 }),
    ])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ([orderRes, customerRes]) => {
          this._recentOrders.set(orderRes.items.map((o: Order) => mapOrder(o)));
          this._recentCustomers.set(
            customerRes.items.map((c: Customer, i: number) => mapCustomer(c, i)),
          );
          this._isLoading.set(false);
        },
        error: (err: unknown) => {
          const msg = err instanceof Error ? err.message : 'Failed to load dashboard data';
          this._error.set(msg);
          this._isLoading.set(false);
        },
      });
  }
}
