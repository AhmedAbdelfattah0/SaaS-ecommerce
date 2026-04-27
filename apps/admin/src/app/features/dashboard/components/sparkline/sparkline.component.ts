import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

@Component({
  selector: 'admin-sparkline',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      [attr.viewBox]="viewBox()"
      preserveAspectRatio="none"
      aria-hidden="true"
      style="display:block;width:100%;height:100%"
    >
      <defs>
        <linearGradient [attr.id]="gradId()" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" [attr.stop-color]="color()" stop-opacity="0.25" />
          <stop offset="100%" [attr.stop-color]="color()" stop-opacity="0.02" />
        </linearGradient>
      </defs>
      @if (areaPath()) {
        <path
          [attr.d]="areaPath()"
          [attr.fill]="'url(#' + gradId() + ')'"
          stroke="none"
        />
      }
      @if (linePath()) {
        <path
          [attr.d]="linePath()"
          fill="none"
          [attr.stroke]="color()"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      }
    </svg>
  `,
})
export class SparklineComponent {
  readonly data  = input.required<number[]>();
  readonly color = input<string>('var(--color-primary)');

  private readonly W = 90;
  private readonly H = 36;
  private readonly PAD = 2;

  readonly viewBox = computed(() => `0 0 ${this.W} ${this.H}`);

  readonly gradId = computed(() => `spark-grad-${this.color().replace(/[^a-zA-Z0-9]/g, '')}`);

  private readonly points = computed<[number, number][]>(() => {
    const d = this.data();
    if (!d || d.length < 2) return [];
    const min = Math.min(...d);
    const max = Math.max(...d);
    const range = max - min || 1;
    const w = this.W;
    const h = this.H - this.PAD * 2;
    return d.map((v, i) => [
      (i / (d.length - 1)) * w,
      this.PAD + h - ((v - min) / range) * h,
    ]);
  });

  readonly linePath = computed<string>(() => {
    const pts = this.points();
    if (!pts.length) return '';
    return pts
      .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`)
      .join(' ');
  });

  readonly areaPath = computed<string>(() => {
    const pts = this.points();
    if (!pts.length) return '';
    const line = pts
      .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`)
      .join(' ');
    const lastX = pts[pts.length - 1][0].toFixed(1);
    const firstX = pts[0][0].toFixed(1);
    const bottom = (this.H + this.PAD).toFixed(1);
    return `${line} L${lastX},${bottom} L${firstX},${bottom} Z`;
  });
}
