import {
  Component,
  ChangeDetectionStrategy,
  input,
  computed,
} from '@angular/core';

export type SpinnerSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'sc-loading-spinner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      role="status"
      [attr.aria-label]="ariaLabel()"
      [class]="classes()"
    >
      <span class="sr-only">{{ ariaLabel() }}</span>
    </span>
  `,
})
export class LoadingSpinnerComponent {
  readonly size = input<SpinnerSize>('md');
  readonly ariaLabel = input<string>('Loading...');

  readonly classes = computed(() => {
    const base =
      'inline-block rounded-full border-2 border-t-transparent animate-spin';
    // Uses --color-primary CSS variable for the spinner color
    const colorClasses = 'border-[var(--color-primary)]';

    const sizes: Record<SpinnerSize, string> = {
      sm: 'w-4 h-4',
      md: 'w-6 h-6',
      lg: 'w-10 h-10',
    };

    return `${base} ${colorClasses} ${sizes[this.size()]}`;
  });
}
