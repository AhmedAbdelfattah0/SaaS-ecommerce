import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { Router } from '@angular/router';
import { AdminIconComponent } from '../../../../shared/components/admin-icon/admin-icon.component';
import { CustomerFiltersComponent } from '../../components/customer-filters/customer-filters.component';
import { CustomersService } from '../../services/customers.service';
import type { CustomerFilterChange } from '../../components/customer-filters/customer-filters.component';
import type { Customer } from '../../models/customer.model';
import { fmtDate } from '../../models/customer.model';
import {
  PageHeaderComponent,
  DataTableComponent,
  DataColumnComponent,
  BannerComponent,
  EmptyStateComponent,
} from '@storecraft/ui';
import { avatarColorForName as avatarColor, initials } from '@storecraft/utils';

@Component({
  selector: 'admin-customers-list-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AdminIconComponent,
    CustomerFiltersComponent,
    PageHeaderComponent,
    DataTableComponent,
    DataColumnComponent,
    BannerComponent,
    EmptyStateComponent,
  ],
  providers: [CustomersService],
  templateUrl: './customers-list-page.component.html',
  styleUrl: './customers-list-page.component.scss',
})
export class CustomersListPageComponent implements OnInit {
  private readonly router = inject(Router);
  readonly service = inject(CustomersService);

  /** Expose helpers to template. */
  readonly avatarColor = avatarColor;
  readonly initials = initials;
  readonly fmtDate = fmtDate;

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

  onRowClick(customer: Customer): void {
    this.router.navigate(['/customers', customer.id]);
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
