import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { ProductStatus } from '../../models/product.model';

@Component({
  selector: 'admin-product-status-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="badge" [class]="badgeClass()">
      <span class="badge-dot"></span>
      {{ label() }}
    </span>
  `,
})
export class ProductStatusBadgeComponent {
  readonly status = input.required<ProductStatus>();

  readonly badgeClass = computed(() => {
    switch (this.status()) {
      case 'active':
        return 'badge badge-green';
      case 'draft':
        return 'badge badge-amber';
      case 'deleted':
        return 'badge badge-red';
      default:
        return 'badge badge-gray';
    }
  });

  readonly label = computed(() => {
    switch (this.status()) {
      case 'active':
        return 'Active';
      case 'draft':
        return 'Draft';
      case 'deleted':
        return 'Deleted';
      default:
        return this.status();
    }
  });
}
