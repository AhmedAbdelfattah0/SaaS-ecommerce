import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { AdminIconComponent } from '../../../../shared/components/admin-icon/admin-icon.component';
import { CustomerRowComponent } from '../../components/customer-row/customer-row.component';
import { CustomerFiltersComponent } from '../../components/customer-filters/customer-filters.component';
import { CustomersService } from '../../services/customers.service';
import type { CustomerFilterChange } from '../../components/customer-filters/customer-filters.component';

@Component({
  selector: 'admin-customers-list-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AdminIconComponent, CustomerRowComponent, CustomerFiltersComponent],
  providers: [CustomersService],
  templateUrl: './customers-list-page.component.html',
  styleUrl: './customers-list-page.component.css',
})
export class CustomersListPageComponent implements OnInit {
  readonly service = inject(CustomersService);

  ngOnInit(): void {
    this.service.load();
  }

  onFilterChange(change: CustomerFilterChange): void {
    if (change.search !== this.service.search()) {
      this.service.setSearch(change.search);
    } else if (change.sortBy !== this.service.sortBy()) {
      this.service.setSort(change.sortBy);
    }
  }

  prevPage(): void {
    const current = this.service.page();
    if (current > 1) {
      this.service.setPage(current - 1);
    }
  }

  nextPage(): void {
    const current = this.service.page();
    if (current < this.service.totalPages()) {
      this.service.setPage(current + 1);
    }
  }
}
