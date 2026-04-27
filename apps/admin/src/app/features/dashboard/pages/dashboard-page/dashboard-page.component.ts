import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
} from '@angular/core';
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

const RANGE_LABELS: Record<DashboardRange, string> = {
  '7d': '7D',
  '30d': '30D',
  '90d': '90D',
};

@Component({
  selector: 'admin-dashboard-page',
  standalone: true,
  imports: [
    AdminIconComponent,
    KpiCardComponent,
    StatusBadgeComponent,
    ProductSwatchComponent,
    RevenueChartComponent,
    DonutChartComponent,
  ],
  providers: [DashboardService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.css',
})
export class DashboardPageComponent implements OnInit {
  protected readonly i18n   = inject(AdminI18nService);
  protected readonly svc    = inject(DashboardService);

  readonly storeName   = STORE_NAME;
  readonly rangeLabels = RANGE_LABELS;
  readonly ranges: DashboardRange[] = ['7d', '30d', '90d'];

  ngOnInit(): void {
    this.svc.load();
  }

  setRange(r: DashboardRange): void {
    this.svc.setRange(r);
  }
}
