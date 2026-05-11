import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { AdminIconComponent } from '../../../../shared/components/admin-icon/admin-icon.component';
import { ProductStatusBadgeComponent } from '../../components/product-status-badge/product-status-badge.component';
import { ProductFormComponent } from '../../components/product-form/product-form.component';
import type { ProductFormValue } from '../../components/product-form/product-form.component';
import { ProductDetailService } from '../../services/product-detail.service';
import { ProductsService } from '../../services/products.service';
import { ModalComponent, BannerComponent } from '@storecraft/ui';
import type { ProductStatus } from '../../models/product.model';

@Component({
  selector: 'admin-product-detail-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ProductDetailService],
  imports: [
    DatePipe,
    AdminIconComponent,
    ProductStatusBadgeComponent,
    ProductFormComponent,
    ModalComponent,
    BannerComponent,
  ],
  templateUrl: './product-detail-page.component.html',
  styleUrl: './product-detail-page.component.scss',
})
export class ProductDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  @ViewChild(ProductFormComponent) private productForm?: ProductFormComponent;

  readonly detailService = inject(ProductDetailService);
  readonly productsService = inject(ProductsService);

  /** Route param as signal — null means new product */
  readonly routeId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('id'))),
    { initialValue: null },
  );

  readonly isNew = computed(() => this.routeId() === 'new');

  readonly pageTitle = computed(() => {
    if (this.isNew()) return 'New Product';
    const product = this.detailService.product();
    return product?.name ?? 'Edit Product';
  });

  /** Controls the delete-confirmation modal. */
  readonly deleteConfirmOpen = signal(false);

  ngOnInit(): void {
    this.productsService.loadCategories();
    const id = this.routeId();
    if (id && id !== 'new') {
      this.detailService.load(id);
    }
  }

  /** Called from the header Save button — delegates to the embedded form */
  triggerSave(): void {
    this.productForm?.onSubmit();
  }

  onSave(formValue: ProductFormValue): void {
    const id = this.routeId();
    const existingId = id === 'new' ? null : (id ?? null);
    this.detailService.save(formValue, existingId);
  }

  onCancel(): void {
    this.router.navigate(['/products']);
  }

  /** Opens the delete confirmation modal. */
  askDelete(): void {
    this.deleteConfirmOpen.set(true);
  }

  /** Called when user confirms deletion in the modal. */
  confirmDelete(): void {
    const id = this.routeId();
    if (!id || id === 'new') return;
    this.deleteConfirmOpen.set(false);
    this.detailService.delete(id);
  }

  onBack(): void {
    this.router.navigate(['/products']);
  }

  onStatusChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const product = this.detailService.product();
    const id = this.routeId();
    if (product && id && id !== 'new') {
      this.detailService.save({ status: select.value as ProductStatus }, id);
    }
  }
}
