import {
  Component,
  ChangeDetectionStrategy,
  input,
  computed,
} from '@angular/core';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'error';

@Component({
  selector: 'sc-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span [class]="classes()">
      <ng-content />
    </span>
  `,
})
export class BadgeComponent {
  readonly variant = input<BadgeVariant>('default');

  readonly classes = computed(() => {
    const base =
      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium';

    const variants: Record<BadgeVariant, string> = {
      default: 'bg-gray-100 text-gray-700',
      success: 'bg-green-100 text-green-700',
      warning: 'bg-yellow-100 text-yellow-700',
      error: 'bg-red-100 text-red-700',
    };

    return `${base} ${variants[this.variant()]}`;
  });
}
