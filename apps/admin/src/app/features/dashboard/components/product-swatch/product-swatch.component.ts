import {
  ChangeDetectionStrategy,
  Component,
  input,
} from '@angular/core';

@Component({
  selector: 'admin-product-swatch',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="swatch"
      [style.background]="color()"
      [style.width.px]="size()"
      [style.height.px]="size()"
      aria-hidden="true"
    ></span>
  `,
})
export class ProductSwatchComponent {
  readonly color = input.required<string>();
  readonly size  = input<number>(20);
}
