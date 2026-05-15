import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  output,
} from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { FieldErrorComponent } from '@storecraft/ui';

let _colorPickerIdx = 0;

const HEX_PATTERN = /^#[0-9A-Fa-f]{6}$/;

@Component({
  selector: 'admin-color-picker',
  standalone: true,
  imports: [ReactiveFormsModule, FieldErrorComponent],
  templateUrl: './color-picker.component.html',
  styleUrl: './color-picker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColorPickerComponent {
  readonly label = input.required<string>();
  /** Current hex value, e.g. "#2563EB" */
  readonly value = input<string>('#000000');
  readonly valueChange = output<string>();

  /** Unique id for label–input association. */
  private readonly _uid = ++_colorPickerIdx;
  readonly inputId = computed(() => `color-picker-${this._uid}`);

  /**
   * Validation is on the FormControl itself — Validators.pattern matches a
   * 6-digit hex prefixed with `#`. sc-field-error renders the inline message
   * once the control is touched + invalid (consistent with login / product
   * forms). Manual _isValidHex signal pattern removed.
   */
  readonly hexControl = new FormControl<string>('', {
    nonNullable: true,
    validators: [Validators.required, Validators.pattern(HEX_PATTERN)],
  });

  readonly hexMessages = {
    required: 'Enter a hex color',
    pattern: 'Enter a valid hex color (e.g. #2563EB)',
  };

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
    this.hexControl.setValue(normalized, { emitEvent: false });
    this.hexControl.markAsTouched();
    if (HEX_PATTERN.test(normalized)) {
      this.emit(normalized);
    }
  }

  private emit(value: string): void {
    this.valueChange.emit(value);
  }
}
