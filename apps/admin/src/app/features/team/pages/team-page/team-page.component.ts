import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AdminI18nService } from '../../../../shared/services/admin-i18n.service';
import { AdminIconComponent } from '../../../../shared/components/admin-icon/admin-icon.component';
import { TeamService } from '../../services/team.service';

@Component({
  selector: 'admin-team-page',
  standalone: true,
  imports: [AdminIconComponent],
  providers: [TeamService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './team-page.component.html',
  styleUrl: './team-page.component.css',
})
export class TeamPageComponent {
  protected readonly i18n = inject(AdminI18nService);
  protected readonly svc = inject(TeamService);

  remove(id: string): void {
    this.svc.removeMember(id);
  }
}
