import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { AdminI18nService } from '../../services/admin-i18n.service';
import { AdminIconComponent, type IconName } from '../admin-icon/admin-icon.component';

interface NavGroup {
  labelKey: string;
  fallback: string;
  items: NavItem[];
}

interface NavItem {
  id: string;
  route: string;
  labelKey: string;
  fallback: string;
  icon: IconName;
  badge?: string;
}

const NAV_GROUPS: NavGroup[] = [
  {
    labelKey: 'nav.workspace',
    fallback: 'Workspace',
    items: [
      {
        id: 'dashboard',
        route: '/dashboard',
        labelKey: 'nav.dashboard',
        fallback: 'Dashboard',
        icon: 'dashboard',
      },
      {
        id: 'products',
        route: '/products',
        labelKey: 'nav.products',
        fallback: 'Products',
        icon: 'package',
      },
      {
        id: 'orders',
        route: '/orders',
        labelKey: 'nav.orders',
        fallback: 'Orders',
        icon: 'cart',
      },
      {
        id: 'customers',
        route: '/customers',
        labelKey: 'nav.customers',
        fallback: 'Customers',
        icon: 'users',
      },
    ],
  },
  {
    labelKey: 'nav.storefront',
    fallback: 'Storefront',
    items: [
      {
        id: 'theme',
        route: '/theme',
        labelKey: 'nav.theme',
        fallback: 'Theme Editor',
        icon: 'palette',
      },
      {
        id: 'integrations',
        route: '/integrations',
        labelKey: 'nav.integrations',
        fallback: 'Integrations',
        icon: 'trendingup',
      },
      {
        id: 'shipping',
        route: '/shipping',
        labelKey: 'nav.shipping',
        fallback: 'Shipping',
        icon: 'truck',
      },
      {
        id: 'payments',
        route: '/payments',
        labelKey: 'nav.payments',
        fallback: 'Payments',
        icon: 'dollar',
      },
    ],
  },
  {
    labelKey: 'nav.account',
    fallback: 'Account',
    items: [
      {
        id: 'team',
        route: '/team',
        labelKey: 'nav.team',
        fallback: 'Team & Roles',
        icon: 'userplus',
      },
      {
        id: 'settings',
        route: '/settings',
        labelKey: 'nav.settings',
        fallback: 'Settings',
        icon: 'settings',
      },
    ],
  },
];

@Component({
  selector: 'admin-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, AdminIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-sidebar.component.html',
  styleUrl: './admin-sidebar.component.scss',
})
export class AdminSidebarComponent {
  private readonly i18n = inject(AdminI18nService);
  private readonly auth = inject(AuthService);

  readonly navGroups = NAV_GROUPS;
  readonly user = this.auth.user;

  readonly storeName = computed(() => 'Maison Cairo');
  readonly storeDomain = computed(() => 'maisoncairo.store');
  readonly userInitials = computed(() => {
    const name = this.user()?.fullName ?? '';
    const parts = name.split(' ').filter(Boolean);
    if (!parts.length) return 'A';
    return parts
      .slice(0, 2)
      .map((p) => p[0])
      .join('')
      .toUpperCase();
  });

  t(key: string, fallback?: string): string {
    return this.i18n.t(key, fallback);
  }
}
