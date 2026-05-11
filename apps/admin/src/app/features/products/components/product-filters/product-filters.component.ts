import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  OnInit,
  inject,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { AdminIconComponent } from '../../../../shared/components/admin-icon/admin-icon.component';
import type { Category, SortOption } from '../../models/product.model';

@Component({
  selector: 'admin-product-filters',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, AdminIconComponent],
  templateUrl: './product-filters.component.html',
  styleUrl: './product-filters.component.scss',
})
export class ProductFiltersComponent implements OnInit {
  private readonly fb = inject(FormBuilder);

  readonly categories = input<Category[]>([]);
  readonly currentSort = input<SortOption>('created_desc');
  readonly currentCategory = input<string>('');
  readonly currentSearch = input<string>('');

  readonly searchChanged = output<string>();
  readonly categoryChanged = output<string>();
  readonly sortChanged = output<SortOption>();

  readonly sortOptions: { value: SortOption; label: string }[] = [
    { value: 'created_desc', label: 'Newest first' },
    { value: 'created_asc', label: 'Oldest first' },
    { value: 'name_asc', label: 'Name A–Z' },
    { value: 'name_desc', label: 'Name Z–A' },
    { value: 'price_asc', label: 'Price: Low–High' },
    { value: 'price_desc', label: 'Price: High–Low' },
    { value: 'stock_asc', label: 'Stock: Low–High' },
    { value: 'stock_desc', label: 'Stock: High–Low' },
  ];

  readonly searchForm = this.fb.group({
    search: [''],
  });

  ngOnInit(): void {
    this.searchForm.controls.search.setValue(this.currentSearch());
  }

  onSearchSubmit(): void {
    const value = this.searchForm.controls.search.value ?? '';
    this.searchChanged.emit(value);
  }

  onSearchKeyup(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.value === '') {
      this.searchChanged.emit('');
    }
  }

  onCategoryChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.categoryChanged.emit(select.value);
  }

  onSortChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.sortChanged.emit(select.value as SortOption);
  }
}
