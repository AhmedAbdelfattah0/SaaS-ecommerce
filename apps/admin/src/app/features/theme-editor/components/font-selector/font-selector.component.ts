import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { FONT_OPTIONS, type FontOption } from '../../models/theme-editor.model';

@Component({
  selector: 'admin-font-selector',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './font-selector.component.html',
  styleUrl: './font-selector.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FontSelectorComponent {
  readonly value = input<string>('Inter');
  readonly valueChange = output<string>();

  readonly fonts: FontOption[] = FONT_OPTIONS;

  select(font: FontOption): void {
    this.valueChange.emit(font.value);
  }

  isSelected(font: FontOption): boolean {
    return this.value() === font.value;
  }
}
