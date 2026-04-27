import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  computed,
  forwardRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

export type InputType = 'text' | 'email' | 'password' | 'number';

@Component({
  selector: 'sc-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true,
    },
  ],
  template: `
    <div class="flex flex-col gap-1.5">
      @if (label()) {
        <label [for]="inputId()" class="text-sm font-medium text-[var(--color-text)]">
          {{ label() }}
          @if (required()) {
            <span class="text-red-500 ms-1" aria-hidden="true">*</span>
          }
        </label>
      }

      <input
        [id]="inputId()"
        [type]="type()"
        [placeholder]="placeholder()"
        [disabled]="isDisabled()"
        [value]="internalValue()"
        [class]="inputClasses()"
        [attr.aria-invalid]="errorMessage() ? 'true' : null"
        [attr.aria-describedby]="errorMessage() ? errorId() : null"
        (input)="handleInput($event)"
        (blur)="handleBlur()"
        (focus)="isFocused.set(true)"
      />

      @if (errorMessage()) {
        <p [id]="errorId()" class="text-xs text-red-500 mt-0.5" role="alert">
          {{ errorMessage() }}
        </p>
      }
    </div>
  `,
})
export class InputComponent implements ControlValueAccessor {
  readonly label = input<string>('');
  readonly type = input<InputType>('text');
  readonly placeholder = input<string>('');
  readonly errorMessage = input<string>('');
  readonly required = input<boolean>(false);

  // Internal state signals
  readonly internalValue = signal<string>('');
  readonly isDisabled = signal<boolean>(false);
  readonly isFocused = signal<boolean>(false);

  // Unique IDs for accessibility
  private readonly uid = Math.random().toString(36).slice(2, 9);
  readonly inputId = computed(() => `sc-input-${this.uid}`);
  readonly errorId = computed(() => `sc-input-error-${this.uid}`);

  readonly inputClasses = computed(() => {
    const base =
      'w-full rounded-md border px-3 py-2 text-sm text-[var(--color-text)] bg-[var(--color-bg,#fff)] outline-none transition-colors placeholder:text-gray-400 rtl:text-right';
    const stateClasses = this.errorMessage()
      ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500'
      : 'border-gray-300 focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]';
    const disabledClasses = this.isDisabled() ? 'opacity-50 cursor-not-allowed' : '';
    return `${base} ${stateClasses} ${disabledClasses}`;
  });

  // CVA callbacks
  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  writeValue(value: string): void {
    this.internalValue.set(value ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }

  handleInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.internalValue.set(value);
    this.onChange(value);
  }

  handleBlur(): void {
    this.isFocused.set(false);
    this.onTouched();
  }
}
