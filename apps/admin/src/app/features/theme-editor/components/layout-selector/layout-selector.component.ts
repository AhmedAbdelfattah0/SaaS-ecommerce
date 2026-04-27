import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import type { LayoutType } from '@storecraft/models';
import { LAYOUT_OPTIONS, type LayoutOption } from '../../models/theme-editor.model';

@Component({
  selector: 'admin-layout-selector',
  standalone: true,
  templateUrl: './layout-selector.component.html',
  styleUrl: './layout-selector.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutSelectorComponent {
  readonly value = input<LayoutType>('classic');
  readonly valueChange = output<LayoutType>();

  readonly layouts: LayoutOption[] = LAYOUT_OPTIONS;

  select(layout: LayoutOption): void {
    this.valueChange.emit(layout.value);
  }

  isSelected(layout: LayoutOption): boolean {
    return this.value() === layout.value;
  }
}
