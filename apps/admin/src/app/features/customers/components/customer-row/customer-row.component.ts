import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { Router } from '@angular/router';
import { AdminIconComponent } from '../../../../shared/components/admin-icon/admin-icon.component';
import type { Customer } from '../../models/customer.model';
import { avatarColor, initials, fmtDate } from '../../models/customer.model';

@Component({
  selector: 'admin-customer-row',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AdminIconComponent],
  templateUrl: './customer-row.component.html',
})
export class CustomerRowComponent {
  private readonly router = inject(Router);

  readonly customer = input.required<Customer>();

  readonly avatarBg = computed(() => avatarColor(this.customer().name));
  readonly initials_ = computed(() => initials(this.customer().name));
  readonly joinedDate = computed(() => fmtDate(this.customer().createdAt));

  navigateToDetail(): void {
    this.router.navigate(['/customers', this.customer().id]);
  }
}
