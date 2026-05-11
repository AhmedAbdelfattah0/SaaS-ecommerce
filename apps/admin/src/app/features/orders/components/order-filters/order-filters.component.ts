import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  OnDestroy,
  inject,
  output,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { AdminIconComponent } from '../../../../shared/components/admin-icon/admin-icon.component';
import type { SortOption } from '../../models/order.model';

export interface FiltersChangeEvent {
  search: string;
  sortBy: SortOption;
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'created_desc', label: 'Newest First' },
  { value: 'created_asc',  label: 'Oldest First' },
  { value: 'total_desc',   label: 'Total: High to Low' },
  { value: 'total_asc',    label: 'Total: Low to High' },
];

@Component({
  selector: 'admin-order-filters',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, AdminIconComponent],
  templateUrl: './order-filters.component.html',
  styleUrl: './order-filters.component.scss',
})
export class OrderFiltersComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly destroy$ = new Subject<void>();

  readonly filtersChange = output<FiltersChangeEvent>();

  readonly sortOptions = SORT_OPTIONS;

  form!: FormGroup;

  ngOnInit(): void {
    this.form = this.fb.group({
      search: [''],
      sortBy: ['created_desc' as SortOption],
    });

    this.form.get('search')!.valueChanges
      .pipe(
        debounceTime(350),
        distinctUntilChanged(),
        takeUntil(this.destroy$),
      )
      .subscribe(() => this.emit());

    this.form.get('sortBy')!.valueChanges
      .pipe(
        distinctUntilChanged(),
        takeUntil(this.destroy$),
      )
      .subscribe(() => this.emit());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private emit(): void {
    const { search, sortBy } = this.form.getRawValue() as { search: string; sortBy: SortOption };
    this.filtersChange.emit({ search, sortBy });
  }
}
