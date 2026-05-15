import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

/**
 * Shared action handlers for the workspace + user-account dropdown menus
 * that render in BOTH the sidebar (tenant card at top, user card at bottom)
 * and the topbar (workspace switcher, avatar button).
 *
 * sc-dropdown-menu's `contentChildren(DropdownItemComponent)` uses the
 * default `descendants: false`, which means wrapping the menu's items
 * inside a shared component would hide them from the wrapper. So both
 * surfaces inline the same <sc-dropdown-item> markup, but ALL handlers
 * (navigate / view store / sign out) live here so behavior stays in sync.
 *
 * If the items themselves drift between surfaces in the future, factor
 * them into a typed `MenuConfig` constant exported from this service
 * and have both templates render them via @for.
 */
@Injectable({ providedIn: 'root' })
export class ShellMenuActionsService {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  // TODO: pull live storefront URL from the resolved tenant when the
  // /api/tenant endpoint is wired into AuthService. Hardcoded for now.
  private readonly STORE_DOMAIN = 'maisoncairo.store';

  /** Workspace settings → /settings */
  workspaceSettings(): void {
    void this.router.navigate(['/settings']);
  }

  /** Opens the storefront in a new tab. */
  viewStore(): void {
    const url = `https://${this.STORE_DOMAIN}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  /**
   * Account / profile settings. /settings/profile doesn't exist yet —
   * falls through to /settings until that route lands.
   */
  accountSettings(): void {
    void this.router.navigate(['/settings']);
  }

  /** Sign the user out — clears Supabase session + redirects to /login. */
  async signOut(): Promise<void> {
    await this.auth.logout();
  }
}
