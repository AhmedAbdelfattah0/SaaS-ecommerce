import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { STATUS_MAP } from '../../services/dashboard.service';

@Component({
  selector: 'admin-status-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './status-badge.component.scss',
  template: `
    <span [class]="badgeCls()">
      <span class="badge-dot"></span>
      {{ badgeLabel() }}
    </span>
  `,
})
export class StatusBadgeComponent {
  readonly status = input.required<string>();

  readonly badgeCls = computed(() => {
    return STATUS_MAP[this.status()]?.cls ?? 'badge badge-gray';
  });

  readonly badgeLabel = computed(() => {
    return STATUS_MAP[this.status()]?.label ?? this.status();
  });
}
