import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { AdminIconComponent } from '../../../../shared/components/admin-icon/admin-icon.component';

@Component({
  selector: 'admin-product-image-grid',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AdminIconComponent],
  templateUrl: './product-image-grid.component.html',
})
export class ProductImageGridComponent {
  readonly images = input<string[]>([]);
  readonly readonly = input<boolean>(false);

  readonly addImage = output<string>();
  readonly removeImage = output<number>();

  onAddUrl(input: HTMLInputElement): void {
    const url = input.value.trim();
    if (url) {
      this.addImage.emit(url);
      input.value = '';
    }
  }

  onRemove(index: number): void {
    this.removeImage.emit(index);
  }
}
