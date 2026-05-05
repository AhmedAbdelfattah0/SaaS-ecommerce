import {
  ChangeDetectionStrategy,
  Component,
  input,
} from '@angular/core';
import type { IconName } from '../../../../shared/components/admin-icon/admin-icon.component';
import { AdminIconComponent } from '../../../../shared/components/admin-icon/admin-icon.component';
import { SparklineComponent } from '../sparkline/sparkline.component';

@Component({
  selector: 'admin-kpi-card',
  standalone: true,
  imports: [AdminIconComponent, SparklineComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './kpi-card.component.html',
  styleUrl: './kpi-card.component.scss',
})
export class KpiCardComponent {
  readonly label = input.required<string>();
  readonly value = input.required<string>();
  readonly delta = input.required<string>();
  readonly up    = input.required<boolean>();
  readonly color = input.required<string>();
  readonly bg    = input.required<string>();
  readonly icon  = input.required<IconName>();
  readonly spark = input<number[]>([]);
}
