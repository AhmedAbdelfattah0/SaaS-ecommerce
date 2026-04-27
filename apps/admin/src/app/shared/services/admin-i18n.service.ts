import { Injectable, inject } from '@angular/core';
import { I18nService, type Language } from '@storecraft/utils';

const TRANSLATIONS: Record<Language, Record<string, string>> = {
  en: {
    'nav.workspace': 'Workspace',
    'nav.storefront': 'Storefront',
    'nav.account': 'Account',
    'nav.dashboard': 'Dashboard',
    'nav.products': 'Products',
    'nav.orders': 'Orders',
    'nav.customers': 'Customers',
    'nav.theme': 'Theme Editor',
    'nav.integrations': 'Integrations',
    'nav.shipping': 'Shipping',
    'nav.payments': 'Payments',
    'nav.team': 'Team & Roles',
    'nav.settings': 'Settings',
    'tb.search': 'Search orders, products, customers...',
    'tb.live': 'Live',
    'common.viewAll': 'View all',
    'common.save': 'Save Changes',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.add': 'Add',
    'common.search': 'Search',
    'common.loading': 'Loading...',
    'common.empty': 'No results',
    'common.error': 'Something went wrong',
    'common.retry': 'Retry',
    'common.confirm': 'Confirm',
    'common.online': 'Online',
    'common.signout': 'Sign out',
    'common.viewStore': 'View store',
    'login.heading': 'Welcome back',
    'login.sub': 'Sign in to manage your store',
    'login.email': 'Email',
    'login.emailPh': 'you@store.com',
    'login.password': 'Password',
    'login.passwordPh': 'Enter your password',
    'login.remember': 'Remember me',
    'login.forgot': 'Forgot password?',
    'login.signIn': 'Sign In',
    'login.signingIn': 'Signing in...',
    'login.adminLabel': 'Admin Dashboard',
    'login.invalid': 'Invalid email or password. Please try again.',
    'login.protected': 'Protected by StoreCraft Security',
    'login.footer': '© 2026 StoreCraft',
  },
  ar: {
    'nav.workspace': 'مساحة العمل',
    'nav.storefront': 'المتجر',
    'nav.account': 'الحساب',
    'nav.dashboard': 'لوحة التحكم',
    'nav.products': 'المنتجات',
    'nav.orders': 'الطلبات',
    'nav.customers': 'العملاء',
    'nav.theme': 'محرر المظهر',
    'nav.integrations': 'التكاملات',
    'nav.shipping': 'الشحن',
    'nav.payments': 'المدفوعات',
    'nav.team': 'الفريق',
    'nav.settings': 'الإعدادات',
    'tb.search': 'ابحث عن الطلبات والمنتجات والعملاء...',
    'tb.live': 'مباشر',
    'common.viewAll': 'عرض الكل',
    'common.save': 'حفظ التغييرات',
    'common.cancel': 'إلغاء',
    'common.delete': 'حذف',
    'common.edit': 'تعديل',
    'common.add': 'إضافة',
    'common.search': 'بحث',
    'common.loading': 'جارٍ التحميل...',
    'common.empty': 'لا توجد نتائج',
    'common.error': 'حدث خطأ',
    'common.retry': 'إعادة المحاولة',
    'common.confirm': 'تأكيد',
    'common.online': 'متصل',
    'common.signout': 'تسجيل الخروج',
    'common.viewStore': 'عرض المتجر',
    'login.heading': 'مرحباً بعودتك',
    'login.sub': 'تسجيل الدخول لإدارة متجرك',
    'login.email': 'البريد الإلكتروني',
    'login.emailPh': 'you@store.com',
    'login.password': 'كلمة المرور',
    'login.passwordPh': 'أدخل كلمة المرور',
    'login.remember': 'تذكرني',
    'login.forgot': 'هل نسيت كلمة المرور؟',
    'login.signIn': 'تسجيل الدخول',
    'login.signingIn': 'جارٍ تسجيل الدخول...',
    'login.adminLabel': 'لوحة الإدارة',
    'login.invalid': 'البريد الإلكتروني أو كلمة المرور غير صحيحة. حاول مرة أخرى.',
    'login.protected': 'محمي بواسطة StoreCraft Security',
    'login.footer': '© 2026 StoreCraft',
  },
};

/**
 * Translation lookup for the Admin app.
 * Direction + language toggle live in libs/utils I18nService — this just adds the dictionary.
 */
@Injectable({ providedIn: 'root' })
export class AdminI18nService {
  private readonly i18n = inject(I18nService);

  readonly currentLang = this.i18n.currentLang;
  readonly dir = this.i18n.dir;

  setLanguage(lang: Language): void {
    this.i18n.setLanguage(lang);
  }

  toggleLanguage(): void {
    this.i18n.toggleLanguage();
  }

  /** Translate a key. Falls back to English, then to the provided fallback or the key itself. */
  t(key: string, fallback?: string): string {
    const lang = this.i18n.currentLang();
    const dict = TRANSLATIONS[lang];
    if (dict[key]) return dict[key];
    if (lang !== 'en' && TRANSLATIONS.en[key]) return TRANSLATIONS.en[key];
    return fallback ?? key;
  }
}
