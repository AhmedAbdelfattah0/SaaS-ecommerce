import { ChangeDetectionStrategy, Component, computed, output, signal } from '@angular/core';
import { AdminIconComponent, type IconName } from '../admin-icon/admin-icon.component';

interface NotificationItem {
  category: 'orders' | 'stock' | 'system';
  icon: IconName;
  iconColor: string;
  iconBg: string;
  title: string;
  body: string;
  time: string;
  link: string;
  unread: boolean;
}

type Tab = 'all' | 'orders' | 'stock' | 'system';

const SAMPLE: NotificationItem[] = [
  {
    category: 'orders',
    icon: 'cart',
    iconColor: '#2563EB',
    iconBg: '#EFF6FF',
    title: 'New order #1048',
    body: 'from Ahmed Mohamed — EGP 2,340',
    time: '2 min ago',
    link: 'View order',
    unread: true,
  },
  {
    category: 'stock',
    icon: 'warning',
    iconColor: '#D97706',
    iconBg: '#FEF3C7',
    title: 'Low stock:',
    body: 'Silk Scarf — Nile Pattern (2 remaining)',
    time: '18 min ago',
    link: 'Restock',
    unread: true,
  },
  {
    category: 'system',
    icon: 'userplus',
    iconColor: '#7C3AED',
    iconBg: '#EDE9FE',
    title: 'New customer:',
    body: 'Sara Hassan registered',
    time: '1 hr ago',
    link: 'View profile',
    unread: true,
  },
  {
    category: 'orders',
    icon: 'check',
    iconColor: '#16A34A',
    iconBg: '#DCFCE7',
    title: 'Order #1043',
    body: 'delivered successfully',
    time: '3 hr ago',
    link: 'Details',
    unread: true,
  },
  {
    category: 'stock',
    icon: 'warning',
    iconColor: '#D97706',
    iconBg: '#FEF3C7',
    title: 'Low stock:',
    body: 'Copper Tea Set (3 remaining)',
    time: '6 hr ago',
    link: 'Restock',
    unread: false,
  },
  {
    category: 'orders',
    icon: 'cart',
    iconColor: '#2563EB',
    iconBg: '#EFF6FF',
    title: 'New order #1041',
    body: 'from Layla Fouad — EGP 680',
    time: 'Yesterday',
    link: 'View order',
    unread: false,
  },
];

@Component({
  selector: 'admin-notifications-panel',
  standalone: true,
  imports: [AdminIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './admin-notifications-panel.component.scss',
  template: `
    <div
      class="notif-backdrop"
      role="button"
      tabindex="0"
      aria-label="Close notifications"
      (click)="panelClose.emit()"
      (keydown.enter)="panelClose.emit()"
      (keydown.escape)="panelClose.emit()"
    ></div>
    <div class="notif-panel" role="dialog" aria-label="Notifications">
      <div class="notif-head">
        <h3>Notifications</h3>
        <button type="button" class="notif-mark" (click)="markAll()">Mark all read</button>
      </div>
      <div class="notif-tabs">
        @for (tab of tabs; track tab) {
          <button
            type="button"
            [class.active]="activeTab() === tab"
            (click)="setTab(tab)"
          >
            {{ tabLabel(tab) }}
          </button>
        }
      </div>
      <div class="notif-list">
        @for (n of filtered(); track n.title + n.time) {
          <div class="notif" [class.unread]="n.unread">
            <div class="notif-icon" [style.background]="n.iconBg" [style.color]="n.iconColor">
              <admin-icon [name]="n.icon" [size]="15" />
            </div>
            <div class="notif-body">
              <div class="notif-msg">
                <strong>{{ n.title }}</strong>
                {{ ' ' + n.body }}
              </div>
              <div class="notif-meta">
                <span class="notif-time">{{ n.time }}</span>
                <button type="button" class="notif-link">{{ n.link }}</button>
              </div>
            </div>
          </div>
        } @empty {
          <div style="padding: 24px; text-align: center; color: var(--color-text-muted)">
            No notifications
          </div>
        }
      </div>
    </div>
  `,
})
export class AdminNotificationsPanelComponent {
  readonly panelClose = output<void>();

  readonly tabs: Tab[] = ['all', 'orders', 'stock', 'system'];
  readonly activeTab = signal<Tab>('all');
  private readonly _items = signal<NotificationItem[]>(SAMPLE);

  readonly filtered = computed(() => {
    const tab = this.activeTab();
    const items = this._items();
    return tab === 'all' ? items : items.filter((i) => i.category === tab);
  });

  setTab(tab: Tab): void {
    this.activeTab.set(tab);
  }

  markAll(): void {
    this._items.update((items) => items.map((i) => ({ ...i, unread: false })));
  }

  tabLabel(tab: Tab): string {
    return tab.charAt(0).toUpperCase() + tab.slice(1);
  }
}
