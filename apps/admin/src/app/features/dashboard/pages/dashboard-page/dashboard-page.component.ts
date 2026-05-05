import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
} from '@angular/core';
import { PageHeaderComponent, TabsComponent, type Tab } from '@storecraft/ui';
import { AdminI18nService } from '../../../../shared/services/admin-i18n.service';
import { AdminIconComponent } from '../../../../shared/components/admin-icon/admin-icon.component';
import { DashboardService } from '../../services/dashboard.service';
import { KpiCardComponent } from '../../components/kpi-card/kpi-card.component';
import { StatusBadgeComponent } from '../../components/status-badge/status-badge.component';
import { ProductSwatchComponent } from '../../components/product-swatch/product-swatch.component';
import { RevenueChartComponent } from '../../components/revenue-chart/revenue-chart.component';
import { DonutChartComponent } from '../../components/donut-chart/donut-chart.component';
import type { DashboardRange } from '../../models/dashboard.model';

const STORE_NAME = 'StoreCraft';

const RANGE_TABS: Tab[] = [
  { key: '7d', label: '7D' },
  { key: '30d', label: '30D' },
  { key: '90d', label: '90D' },
];

@Component({
  selector: 'admin-dashboard-page',
  standalone: true,
  imports: [
    AdminIconComponent,
    PageHeaderComponent,
    TabsComponent,
    KpiCardComponent,
    StatusBadgeComponent,
    ProductSwatchComponent,
    RevenueChartComponent,
    DonutChartComponent,
  ],
  providers: [DashboardService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.scss',
})
export class DashboardPageComponent implements OnInit {
  protected readonly i18n = inject(AdminI18nService);
  protected readonly svc = inject(DashboardService);

  readonly storeName = STORE_NAME;
  readonly rangeTabs = RANGE_TABS;

  readonly subtitle = computed(
    () => `Here’s what’s happening with ${this.storeName} today`,
  );

  ngOnInit(): void {
    this.svc.load();
  }

  setRange(key: string): void {
    this.svc.setRange(key as DashboardRange);
  }
}
