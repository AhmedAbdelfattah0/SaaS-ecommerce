import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import {
  DropdownDividerComponent,
  DropdownItemComponent,
  DropdownMenuComponent,
} from '@storecraft/ui';
import { AuthService } from '../../../core/auth/auth.service';
import { AdminI18nService } from '../../services/admin-i18n.service';
import { ShellMenuActionsService } from '../../services/shell-menu-actions.service';
import { AdminIconComponent } from '../admin-icon/admin-icon.component';
import { AdminNotificationsPanelComponent } from '../admin-notifications-panel/admin-notifications-panel.component';

interface PageMeta {
  title: string;
  crumb: string[];
}

const PAGE_TITLES: Record<string, PageMeta> = {
  dashboard: { title: 'Dashboard', crumb: ['Home', 'Dashboard'] },
  products: { title: 'Products', crumb: ['Catalog', 'Products'] },
  orders: { title: 'Orders', crumb: ['Sales', 'Orders'] },
  customers: { title: 'Customers', crumb: ['People', 'Customers'] },
  theme: { title: 'Theme Editor', crumb: ['Storefront', 'Theme'] },
  integrations: { title: 'Integrations', crumb: ['Storefront', 'Integrations'] },
  shipping: { title: 'Shipping', crumb: ['Settings', 'Shipping'] },
  payments: { title: 'Payments', crumb: ['Storefront', 'Payments'] },
  team: { title: 'Team & Roles', crumb: ['Settings', 'Team'] },
  settings: { title: 'Settings', crumb: ['Store', 'Settings'] },
};

@Component({
  selector: 'admin-topbar',
  standalone: true,
  imports: [
    AdminIconComponent,
    AdminNotificationsPanelComponent,
    DropdownMenuComponent,
    DropdownItemComponent,
    DropdownDividerComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-topbar.component.html',
  styleUrl: './admin-topbar.component.scss',
})
export class AdminTopbarComponent {
  private readonly router = inject(Router);
  private readonly i18n = inject(AdminI18nService);
  private readonly auth = inject(AuthService);
  protected readonly menu = inject(ShellMenuActionsService);

  readonly currentLang = this.i18n.currentLang;
  readonly user = this.auth.user;
  readonly notifOpen = signal(false);
  readonly unread = signal(4);

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

  readonly storeName = computed(() => 'Maison Cairo');

  private readonly currentSegment = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => this.detectSegment()),
      startWith(this.detectSegment()),
    ),
    { initialValue: this.detectSegment() },
  );

  readonly meta = computed<PageMeta>(() => {
    const seg = this.currentSegment();
    const fallback = PAGE_TITLES['dashboard'];
    return PAGE_TITLES[seg] ?? fallback;
  });

  readonly translatedTitle = computed(() => {
    const seg = this.currentSegment();
    return this.i18n.t('nav.' + seg, this.meta().title);
  });

  toggleLang(): void {
    this.i18n.toggleLanguage();
  }

  toggleNotifications(): void {
    const next = !this.notifOpen();
    this.notifOpen.set(next);
    if (next) this.unread.set(0);
  }

  closeNotifications(): void {
    this.notifOpen.set(false);
  }

  t(key: string, fallback?: string): string {
    return this.i18n.t(key, fallback);
  }

  private detectSegment(): string {
    const url = this.router.url.split('?')[0].split('#')[0];
    const parts = url.split('/').filter(Boolean);
    return parts[0] ?? 'dashboard';
  }
}
