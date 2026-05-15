import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService, type InviteTeamMemberDto } from '../../../core/api/api.service';
import type { TeamMember, Role } from '../models/team-member.model';

const MOCK_MEMBERS: TeamMember[] = [
  {
    id: 'mem-1',
    fullName: 'Ahmed Hassan',
    email: 'ahmed@storecraft.io',
    role: 'owner',
    status: 'active',
    avatarBg: 'linear-gradient(135deg, #F59E0B, #DC2626)',
    initials: 'AH',
    joinedAt: 'Jan 12, 2025',
    lastActiveAt: '2 min ago',
  },
  {
    id: 'mem-2',
    fullName: 'Sara Ali',
    email: 'sara@storecraft.io',
    role: 'admin',
    status: 'active',
    avatarBg: 'linear-gradient(135deg, #7C3AED, #2563EB)',
    initials: 'SA',
    joinedAt: 'Feb 3, 2025',
    lastActiveAt: '1 hour ago',
  },
  {
    id: 'mem-3',
    fullName: 'Mohamed Youssef',
    email: 'mo.youssef@storecraft.io',
    role: 'staff',
    status: 'active',
    avatarBg: 'linear-gradient(135deg, #16A34A, #0D9488)',
    initials: 'MY',
    joinedAt: 'Mar 18, 2025',
    lastActiveAt: 'Yesterday',
  },
  {
    id: 'mem-4',
    fullName: 'Nour Elsayed',
    email: 'nour@external.com',
    role: 'viewer',
    status: 'invited',
    avatarBg: 'linear-gradient(135deg, #64748B, #94A3B8)',
    initials: 'NE',
    joinedAt: '—',
    lastActiveAt: '—',
  },
];

const MOCK_ROLES: Role[] = [
  {
    id: 'owner',
    name: 'Owner',
    description: 'Full access to all settings, billing, and team management.',
    permissions: ['All permissions'],
  },
  {
    id: 'admin',
    name: 'Admin',
    description: 'Can manage products, orders, customers and theme — not billing.',
    permissions: ['Products', 'Orders', 'Customers', 'Theme', 'Integrations'],
  },
  {
    id: 'staff',
    name: 'Staff',
    description: 'Can view and process orders; limited product editing.',
    permissions: ['Orders (edit)', 'Products (view)', 'Customers (view)'],
  },
  {
    id: 'viewer',
    name: 'Viewer',
    description: 'Read-only access to dashboard and reports.',
    permissions: ['Dashboard (view)', 'Reports (view)'],
  },
];

@Injectable()
export class TeamService {
  private readonly api = inject(ApiService);

  private readonly _members = signal<TeamMember[]>(MOCK_MEMBERS);
  private readonly _roles = signal<Role[]>(MOCK_ROLES);

  readonly members = this._members.asReadonly();
  readonly roles = this._roles.asReadonly();

  // ─── Invite flow state ───────────────────────────────────
  private readonly _isInviting = signal(false);
  private readonly _inviteError = signal<string | null>(null);
  private readonly _lastInvitedEmail = signal<string | null>(null);

  readonly isInviting = this._isInviting.asReadonly();
  readonly inviteError = this._inviteError.asReadonly();
  readonly lastInvitedEmail = this._lastInvitedEmail.asReadonly();

  removeMember(id: string): void {
    this._members.update((list) => list.filter((m) => m.id !== id));
  }

  /**
   * Send an invite via POST /api/team/invite. On success, surfaces the
   * invited email via `lastInvitedEmail` so the page can render an
   * inline success banner.
   */
  async inviteMember(dto: InviteTeamMemberDto): Promise<{ ok: boolean }> {
    this._isInviting.set(true);
    this._inviteError.set(null);
    try {
      await firstValueFrom(this.api.inviteTeamMember(dto));
      this._lastInvitedEmail.set(dto.email);
      return { ok: true };
    } catch (err) {
      this._inviteError.set(err instanceof Error ? err.message : 'Invite failed');
      return { ok: false };
    } finally {
      this._isInviting.set(false);
    }
  }

  dismissInviteSuccess(): void {
    this._lastInvitedEmail.set(null);
  }

  dismissInviteError(): void {
    this._inviteError.set(null);
  }
}
