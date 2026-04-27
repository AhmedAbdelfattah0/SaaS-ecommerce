import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { Router } from '@angular/router';
import { inject } from '@angular/core';
import { AdminIconComponent } from '../../../../shared/components/admin-icon/admin-icon.component';
import { ProductStatusBadgeComponent } from '../product-status-badge/product-status-badge.component';
import type { Product } from '../../models/product.model';

@Component({
  selector: '[admin-product-row]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AdminIconComponent, ProductStatusBadgeComponent],
  templateUrl: './product-row.component.html',
})
export class ProductRowComponent {
  private readonly router = inject(Router);

  readonly product = input.required<Product>();
  readonly isSelected = input<boolean>(false);
  readonly categoryName = input<string>('');

  readonly toggleSelect = output<string>();
  readonly deleteProduct = output<string>();

  readonly stockClass = computed(() => {
    const stock = this.product().stock;
    if (stock < 5) return 'stock-low';
    if (stock <= 20) return 'stock-medium';
    return 'stock-ok';
  });

  readonly formattedPrice = computed(() => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(this.product().price);
  });

  readonly hasImage = computed(() => (this.product().images?.length ?? 0) > 0);

  navigateToDetail(event: MouseEvent): void {
    // Prevent navigation if clicking on checkbox or action buttons
    const target = event.target as HTMLElement;
    if (target.closest('.no-nav')) return;
    this.router.navigate(['/products', this.product().id]);
  }

  onToggleSelect(event: Event): void {
    event.stopPropagation();
    this.toggleSelect.emit(this.product().id);
  }

  onDelete(event: Event): void {
    event.stopPropagation();
    this.deleteProduct.emit(this.product().id);
  }

  onEdit(event: Event): void {
    event.stopPropagation();
    this.router.navigate(['/products', this.product().id]);
  }
}
