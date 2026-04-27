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
  template: `
    <form [formGroup]="form" class="filters-row">
      <div class="search-wrap">
        <admin-icon name="search" [size]="16" class="search-icon" />
        <input
          type="text"
          class="input search-input"
          formControlName="search"
          placeholder="Search by order ID, customer, email..."
        />
      </div>
      <div class="sort-wrap">
        <select class="select" formControlName="sortBy" style="width: 200px">
          @for (opt of sortOptions; track opt.value) {
            <option [value]="opt.value">{{ opt.label }}</option>
          }
        </select>
      </div>
    </form>
  `,
  styles: [`
    .filters-row {
      display: flex;
      align-items: center;
      gap: var(--sp-3);
      flex-wrap: wrap;
    }
    .search-wrap {
      position: relative;
      flex: 1;
      min-width: 240px;
    }
    .search-icon {
      position: absolute;
      left: 10px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--color-text-subtle);
      pointer-events: none;
    }
    .search-input {
      padding-left: 34px;
    }
    .sort-wrap {
      flex-shrink: 0;
    }
  `],
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
