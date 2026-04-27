import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { AdminIconComponent } from '../../../../shared/components/admin-icon/admin-icon.component';
import type { ProductStatus } from '../../models/product.model';

@Component({
  selector: 'admin-product-bulk-actions',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AdminIconComponent],
  templateUrl: './product-bulk-actions.component.html',
})
export class ProductBulkActionsComponent {
  readonly selectedCount = input.required<number>();

  readonly deleteRequested = output<void>();
  readonly setStatusRequested = output<ProductStatus>();
  readonly clearRequested = output<void>();

  onDelete(): void {
    this.deleteRequested.emit();
  }

  onSetStatus(status: ProductStatus): void {
    this.setStatusRequested.emit(status);
  }

  onClear(): void {
    this.clearRequested.emit();
  }
}
