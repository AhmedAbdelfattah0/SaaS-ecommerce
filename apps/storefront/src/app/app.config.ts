import {
  ApplicationConfig,
  APP_INITIALIZER,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { appRoutes } from './app.routes';
import { ThemeService } from './core/services/theme.service';
import { TenantService } from './core/services/tenant.service';

/**
 * APP_INITIALIZER factory:
 * 1. Resolve tenant from Host header
 * 2. Load theme and apply CSS variables before first render
 */
function initializeApp(
  tenantService: TenantService,
  themeService: ThemeService
) {
  return async () => {
    await tenantService.resolveTenant();
    await themeService.loadTheme();
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(appRoutes),
    provideHttpClient(),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [TenantService, ThemeService],
      multi: true,
    },
  ],
};
