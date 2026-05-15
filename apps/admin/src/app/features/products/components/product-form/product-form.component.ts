import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FieldErrorComponent } from '@storecraft/ui';
import { AdminIconComponent } from '../../../../shared/components/admin-icon/admin-icon.component';
import { ProductImageGridComponent } from '../product-image-grid/product-image-grid.component';
import type { Category, Product, ProductCreateDto, ProductUpdateDto } from '../../models/product.model';

export type ProductFormValue = ProductCreateDto | ProductUpdateDto;

@Component({
  selector: 'admin-product-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, AdminIconComponent, ProductImageGridComponent, FieldErrorComponent],
  templateUrl: './product-form.component.html',
  styleUrl: './product-form.component.scss',
})
export class ProductFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);

  readonly product = input<Product | null>(null);
  readonly categories = input<Category[]>([]);
  readonly isSaving = input<boolean>(false);

  readonly saved = output<ProductFormValue>();
  readonly cancelled = output<void>();

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    slug: ['', Validators.required],
    description: [''],
    price: [0, [Validators.required, Validators.min(0)]],
    comparePrice: [null as number | null],
    stock: [0, [Validators.required, Validators.min(0)]],
    categoryId: [null as string | null],
    status: ['draft' as 'active' | 'draft' | 'deleted'],
    featured: [false],
    searchable: [true],
  });

  private readonly _images = signal<string[]>([]);
  readonly images = this._images.asReadonly();

  readonly isNew = computed(() => this.product() === null);

  ngOnInit(): void {
    const p = this.product();
    if (p) {
      this.form.patchValue({
        name: p.name,
        slug: p.slug,
        description: p.description ?? '',
        price: p.price,
        comparePrice: p.comparePrice ?? null,
        stock: p.stock,
        categoryId: p.categoryId ?? null,
        status: p.status,
      });
      this._images.set([...(p.images ?? [])]);
    }

    // Auto-generate slug from name when creating
    if (!p) {
      this.form.controls.name.valueChanges.subscribe((name) => {
        if (name && this.form.controls.slug.pristine) {
          this.form.controls.slug.setValue(
            name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
            { emitEvent: false },
          );
        }
      });
    }
  }

  onAddImage(url: string): void {
    this._images.set([...this._images(), url]);
  }

  onRemoveImage(index: number): void {
    const imgs = [...this._images()];
    imgs.splice(index, 1);
    this._images.set(imgs);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const formValue: ProductFormValue = {
      name: raw.name!,
      slug: raw.slug ?? undefined,
      description: raw.description ?? '',
      price: raw.price!,
      comparePrice: raw.comparePrice ?? undefined,
      stock: raw.stock!,
      categoryId: raw.categoryId ?? undefined,
      status: raw.status ?? 'draft',
      images: this._images(),
    } as ProductFormValue;

    this.saved.emit(formValue);
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  hasError(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl && ctrl.invalid && ctrl.touched);
  }
}
