import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { AdminIconComponent } from '../../../../shared/components/admin-icon/admin-icon.component';
import type { Customer } from '../../models/customer.model';
import { avatarColor, initials, fmtDate } from '../../models/customer.model';

@Component({
  selector: 'admin-customer-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AdminIconComponent],
  templateUrl: './customer-card.component.html',
})
export class CustomerCardComponent {
  readonly customer = input.required<Customer>();

  readonly avatarBg = computed(() => avatarColor(this.customer().name));
  readonly initials_ = computed(() => initials(this.customer().name));
  readonly joinedDate = computed(() => fmtDate(this.customer().createdAt));

  readonly fullAddress = computed<string | null>(() => {
    const addr = this.customer().address;
    if (!addr) return null;
    const parts = [addr.line1, addr.line2, addr.city, addr.state, addr.country, addr.postalCode];
    return parts.filter(Boolean).join(', ');
  });
}
