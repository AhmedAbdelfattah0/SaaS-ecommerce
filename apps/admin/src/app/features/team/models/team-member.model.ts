export type RoleId = 'owner' | 'admin' | 'staff' | 'viewer';

export interface Role {
  id: RoleId;
  name: string;
  description: string;
  permissions: string[];
}

export type MemberStatus = 'active' | 'invited' | 'suspended';

export interface TeamMember {
  id: string;
  fullName: string;
  email: string;
  role: RoleId;
  status: MemberStatus;
  avatarBg: string;
  initials: string;
  joinedAt: string;
  lastActiveAt: string;
}
