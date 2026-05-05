import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import type { RevenuePoint } from '../../models/dashboard.model';

interface PathData {
  linePath: string;
  areaPath: string;
}

@Component({
  selector: 'admin-revenue-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './revenue-chart.component.html',
  styleUrl: './revenue-chart.component.scss',
})
export class RevenueChartComponent {
  readonly series = input.required<RevenuePoint[]>();

  private readonly W = 480;
  private readonly H = 180;
  private readonly PAD_X = 40;
  private readonly PAD_Y = 16;

  readonly viewBox = computed(() => `0 0 ${this.W} ${this.H + this.PAD_Y * 2}`);

  private readonly allValues = computed(() => {
    const s = this.series();
    return s.flatMap((p) => [p.current, p.previous]);
  });

  private readonly yMax = computed(() => Math.max(...this.allValues()) * 1.1 || 1);
  private readonly yMin = computed(() => 0);

  private toX(i: number, len: number): number {
    return this.PAD_X + (i / (len - 1)) * (this.W - this.PAD_X * 2);
  }

  private toY(v: number): number {
    const range = this.yMax() - this.yMin();
    return this.PAD_Y + this.H - ((v - this.yMin()) / range) * this.H;
  }

  private buildPaths(values: number[]): PathData {
    if (values.length < 2) return { linePath: '', areaPath: '' };
    const pts = values.map((v, i) => [this.toX(i, values.length), this.toY(v)] as [number, number]);
    const linePath = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
    const bottomY = (this.PAD_Y + this.H + 2).toFixed(1);
    const areaPath = `${linePath} L${pts[pts.length - 1][0].toFixed(1)},${bottomY} L${pts[0][0].toFixed(1)},${bottomY} Z`;
    return { linePath, areaPath };
  }

  readonly currentPaths = computed(() =>
    this.buildPaths(this.series().map((p) => p.current)),
  );

  readonly previousPaths = computed(() =>
    this.buildPaths(this.series().map((p) => p.previous)),
  );

  readonly yTicks = computed(() => {
    const max = this.yMax();
    const step = Math.ceil(max / 4 / 1000) * 1000 || 1000;
    const ticks: Array<{ value: number; y: number; label: string }> = [];
    for (let v = 0; v <= max; v += step) {
      ticks.push({
        value: v,
        y: this.toY(v),
        label: v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`,
      });
    }
    return ticks.reverse();
  });

  readonly xLabels = computed(() => {
    const s = this.series();
    return s.map((p, i) => ({
      label: p.label,
      x: this.toX(i, s.length),
    }));
  });
}
