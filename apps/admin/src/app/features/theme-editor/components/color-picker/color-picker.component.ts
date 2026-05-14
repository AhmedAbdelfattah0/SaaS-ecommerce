import {
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
  output,
  signal,
} from '@angular/core';
import { ReactiveFormsModule, FormControl } from '@angular/forms';

@Component({
  selector: 'admin-color-picker',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './color-picker.component.html',
  styleUrl: './color-picker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColorPickerComponent {
  readonly label = input.required<string>();
  /** Current hex value, e.g. "#2563EB" */
  readonly value = input<string>('#000000');
  readonly valueChange = output<string>();

  readonly hexControl = new FormControl<string>('', { nonNullable: true });

  private readonly _isValidHex = signal(true);
  readonly isValidHex = this._isValidHex.asReadonly();

  constructor() {
    // Sync incoming value → form control
    effect(() => {
      const val = this.value();
      if (this.hexControl.value !== val) {
        this.hexControl.setValue(val, { emitEvent: false });
      }
    });
  }

  onColorInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.hexControl.setValue(input.value, { emitEvent: false });
    this.emit(input.value);
  }

  onHexInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const raw = input.value.trim();
    const normalized = raw.startsWith('#') ? raw : `#${raw}`;
    const valid = /^#[0-9A-Fa-f]{6}$/.test(normalized);
    this._isValidHex.set(valid);
    if (valid) {
      this.emit(normalized);
    }
  }

  private emit(value: string): void {
    this.valueChange.emit(value);
  }
}
