import { Injectable, signal } from '@angular/core';
import type { StoreSettings } from '../models/settings.model';

const MOCK_SETTINGS: StoreSettings = {
  storeName: 'StoreCraft Demo Store',
  storeEmail: 'hello@storecraft.io',
  storePhone: '+20 100 000 0000',
  currency: 'EGP',
  timezone: 'Africa/Cairo',
  language: 'en',
  primaryColor: '#2563EB',
  logoUrl: '',
  faviconUrl: '',
  customDomain: '',
  subdomain: 'demo',
  orderNotifications: true,
  lowStockAlerts: true,
  weeklyReport: false,
  marketingEmails: false,
};

@Injectable()
export class SettingsService {
  private readonly _settings = signal<StoreSettings>(MOCK_SETTINGS);

  readonly settings = this._settings.asReadonly();

  patch(partial: Partial<StoreSettings>): void {
    this._settings.update((s) => ({ ...s, ...partial }));
  }
}
