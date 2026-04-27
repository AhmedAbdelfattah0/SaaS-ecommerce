import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import type { DonutSegment } from '../../models/dashboard.model';

interface ArcSlice {
  d: string;
  color: string;
  label: string;
  pct: number;
}

@Component({
  selector: 'admin-donut-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './donut-chart.component.html',
})
export class DonutChartComponent {
  readonly segments = input.required<DonutSegment[]>();
  readonly total    = input<number>(0);
  readonly label    = input<string>('Orders');

  private readonly CX = 80;
  private readonly CY = 80;
  private readonly R  = 62;
  private readonly INNER_R = 42;

  readonly arcs = computed<ArcSlice[]>(() => {
    const segs = this.segments();
    if (!segs.length) return [];
    const totalVal = segs.reduce((s, sg) => s + sg.value, 0);
    if (!totalVal) return [];

    let startAngle = -Math.PI / 2; // start from top
    return segs.map((sg) => {
      const sweep = (sg.value / totalVal) * (2 * Math.PI);
      const endAngle = startAngle + sweep;

      const x1 = this.CX + this.R * Math.cos(startAngle);
      const y1 = this.CY + this.R * Math.sin(startAngle);
      const x2 = this.CX + this.R * Math.cos(endAngle);
      const y2 = this.CY + this.R * Math.sin(endAngle);
      const xi1 = this.CX + this.INNER_R * Math.cos(endAngle);
      const yi1 = this.CY + this.INNER_R * Math.sin(endAngle);
      const xi2 = this.CX + this.INNER_R * Math.cos(startAngle);
      const yi2 = this.CY + this.INNER_R * Math.sin(startAngle);
      const largeArc = sweep > Math.PI ? 1 : 0;

      const d = [
        `M ${x1.toFixed(2)} ${y1.toFixed(2)}`,
        `A ${this.R} ${this.R} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`,
        `L ${xi1.toFixed(2)} ${yi1.toFixed(2)}`,
        `A ${this.INNER_R} ${this.INNER_R} 0 ${largeArc} 0 ${xi2.toFixed(2)} ${yi2.toFixed(2)}`,
        'Z',
      ].join(' ');

      const slice: ArcSlice = {
        d,
        color: sg.color,
        label: sg.label,
        pct: sg.pct,
      };
      startAngle = endAngle;
      return slice;
    });
  });
}
