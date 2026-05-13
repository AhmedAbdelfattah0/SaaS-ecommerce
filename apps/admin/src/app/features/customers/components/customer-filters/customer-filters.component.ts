import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  output,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime } from 'rxjs/operators';
import { AdminIconComponent } from '../../../../shared/components/admin-icon/admin-icon.component';
import type { SortOption } from '../../models/customer.model';

export interface CustomerFilterChange {
  search: string;
  sortBy: SortOption;
}

@Component({
  selector: 'admin-customer-filters',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, AdminIconComponent],
  templateUrl: './customer-filters.component.html',
  styleUrl: './customer-filters.component.scss',
})
export class CustomerFiltersComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly destroyed = takeUntilDestroyed();

  readonly filterChange = output<CustomerFilterChange>();

  readonly form: FormGroup<{ search: FormControl<string>; sortBy: FormControl<SortOption> }> =
    this.fb.nonNullable.group({
      search: [''],
      sortBy: ['recent' as SortOption],
    });

  ngOnInit(): void {
    this.form.valueChanges
      .pipe(debounceTime(300), this.destroyed)
      .subscribe(() => {
        const val = this.form.getRawValue();
        this.filterChange.emit({
          search: val.search,
          sortBy: val.sortBy,
        });
      });
  }
}
