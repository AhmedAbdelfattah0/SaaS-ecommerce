import {
  Component,
  ChangeDetectionStrategy,
  input,
  computed,
} from '@angular/core';

export type CardVariant = 'default' | 'elevated' | 'bordered';

@Component({
  selector: 'sc-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div [class]="classes()">
      <ng-content />
    </div>
  `,
})
export class CardComponent {
  readonly variant = input<CardVariant>('default');

  readonly classes = computed(() => {
    const base = 'rounded-lg bg-[var(--color-bg,#fff)] p-4';

    const variants: Record<CardVariant, string> = {
      default: '',
      elevated: 'shadow-md',
      bordered: 'border border-gray-200',
    };

    return `${base} ${variants[this.variant()]}`;
  });
}
