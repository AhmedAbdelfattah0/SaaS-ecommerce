export interface StoreSettings {
  // General
  storeName: string;
  storeEmail: string;
  storePhone: string;
  currency: string;
  timezone: string;
  language: string;
  // Branding
  primaryColor: string;
  logoUrl: string;
  faviconUrl: string;
  // Domain
  customDomain: string;
  subdomain: string;
  // Notifications
  orderNotifications: boolean;
  lowStockAlerts: boolean;
  weeklyReport: boolean;
  marketingEmails: boolean;
}
