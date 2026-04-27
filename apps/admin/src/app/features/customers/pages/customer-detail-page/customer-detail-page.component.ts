import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminIconComponent } from '../../../../shared/components/admin-icon/admin-icon.component';
import { CustomerCardComponent } from '../../components/customer-card/customer-card.component';
import { CustomerStatsComponent } from '../../components/customer-stats/customer-stats.component';
import { CustomerOrdersComponent } from '../../components/customer-orders/customer-orders.component';
import { CustomerDetailService } from '../../services/customer-detail.service';
import { avatarColor, initials } from '../../models/customer.model';

@Component({
  selector: 'admin-customer-detail-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AdminIconComponent,
    CustomerCardComponent,
    CustomerStatsComponent,
    CustomerOrdersComponent,
  ],
  providers: [CustomerDetailService],
  templateUrl: './customer-detail-page.component.html',
  styleUrl: './customer-detail-page.component.css',
})
export class CustomerDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly service = inject(CustomerDetailService);

  /** Expose helpers to the template. */
  readonly avatarColor = avatarColor;
  readonly initials = initials;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.service.load(id);
    }
  }

  goBack(): void {
    this.router.navigate(['/customers']);
  }
}
