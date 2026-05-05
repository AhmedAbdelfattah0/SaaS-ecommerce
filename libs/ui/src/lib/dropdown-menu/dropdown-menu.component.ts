import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  contentChildren,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { DropdownItemComponent } from './dropdown-item.component';
import type { DropdownPlacement } from './dropdown-menu.types';

/**
 * Click-to-open dropdown menu with keyboard navigation, click-outside
 * dismiss, Esc to close, focus restoration to the trigger, and four
 * placement options. Composed of `<sc-dropdown-menu>` (this wrapper),
 * `<sc-dropdown-item>` for clickable options, and
 * `<sc-dropdown-divider>` for separators.
 *
 * The wrapper owns its own `isOpen` state — different from `sc-modal`
 * because dropdowns are inherently ephemeral (open on trigger click,
 * close on item select / outside click / Esc).
 *
 * ## ARIA on the trigger (caller responsibility)
 *
 * The component does NOT reach into your projected trigger element to
 * set ARIA attributes. Add `aria-haspopup="menu"` and bind
 * `[attr.aria-expanded]` to the menu's `isOpen` if you want full
 * a11y. The popup itself gets `role="menu"`; items get `role="menuitem"`;
 * dividers get `role="separator"`.
 *
 * ```html
 * <sc-dropdown-menu #menu>
 *   <button trigger
 *           aria-haspopup="menu"
 *           [attr.aria-expanded]="menu.isOpen()">
 *     Actions
 *   </button>
 *   <sc-dropdown-item …>…</sc-dropdown-item>
 * </sc-dropdown-menu>
 * ```
 *
 * ## Keyboard
 *
 * - Click trigger → toggle open
 * - `ArrowDown` / `ArrowUp` — cycle focus through enabled items (with wrap)
 * - `Home` / `End` — first / last enabled item
 * - `Esc` — close + return focus to trigger
 * - `Enter` / `Space` on item — activate select (native button behaviour)
 * - Tab out → menu closes (focus has already moved)
 *
 * @example Row actions menu
 * ```html
 * <sc-dropdown-menu>
 *   <sc-button trigger variant="ghost" size="sm">
 *     <admin-icon name="more" />
 *   </sc-button>
 *
 *   <sc-dropdown-item (select)="edit(row)">
 *     <admin-icon name="edit" /> Edit
 *   </sc-dropdown-item>
 *   <sc-dropdown-divider />
 *   <sc-dropdown-item variant="danger" (select)="delete(row)">
 *     <admin-icon name="trash" /> Delete
 *   </sc-dropdown-item>
 * </sc-dropdown-menu>
 * ```
 */
@Component({
  selector: 'sc-dropdown-menu',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dropdown-menu.component.html',
  styleUrl: './dropdown-menu.component.scss',
})
export class DropdownMenuComponent {
  private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly placement = input<DropdownPlacement>('bottom-end');

  readonly open = output<void>();
  readonly close = output<void>();

  readonly isOpen = signal(false);

  private readonly items = contentChildren(DropdownItemComponent);
  private readonly activeItem = signal<DropdownItemComponent | null>(null);
  private triggerEl: HTMLElement | null = null;

  /** True when this is the currently-focused / roving-tabindex item. */
  isActive(item: DropdownItemComponent): boolean {
    return this.activeItem() === item;
  }

  // =========================================================
  // Trigger click — toggle
  // =========================================================
  @HostListener('click', ['$event'])
  onHostClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (!target) return;
    const triggerEl = target.closest<HTMLElement>('[trigger]');
    if (!triggerEl) return;
    if (!this.hostRef.nativeElement.contains(triggerEl)) return;
    this.triggerEl = triggerEl;
    this.toggle();
  }

  // =========================================================
  // Click outside — dismiss
  // =========================================================
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.isOpen()) return;
    const target = event.target as HTMLElement | null;
    if (!target) return;
    if (this.hostRef.nativeElement.contains(target)) return;
    this.closeInternal(false);
  }

  // =========================================================
  // Esc — close + restore focus to trigger
  // =========================================================
  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (!this.isOpen()) return;
    this.closeMenu();
  }

  // =========================================================
  // Arrow keys / Home / End — navigate items
  // =========================================================
  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (!this.isOpen()) return;
    const items = this.enabledItems();
    if (!items.length) return;

    const current = this.activeItem();
    const currentIdx = current ? items.indexOf(current) : -1;

    let next: number | null = null;
    switch (event.key) {
      case 'ArrowDown':
        next = currentIdx < 0 ? 0 : (currentIdx + 1) % items.length;
        break;
      case 'ArrowUp':
        next =
          currentIdx < 0
            ? items.length - 1
            : (currentIdx - 1 + items.length) % items.length;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = items.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    this.activeItem.set(items[next]);
    items[next].focus();
  }

  // =========================================================
  // Tab out — close (focus already moved)
  // =========================================================
  @HostListener('focusout', ['$event'])
  onFocusOut(event: FocusEvent): void {
    if (!this.isOpen()) return;
    const next = event.relatedTarget as HTMLElement | null;
    if (next && this.hostRef.nativeElement.contains(next)) return;
    this.closeInternal(false);
  }

  toggle(): void {
    if (this.isOpen()) {
      this.closeMenu();
    } else {
      this.openMenu();
    }
  }

  /** Public API — items call this on click. */
  closeMenu(): void {
    this.closeInternal(true);
  }

  private openMenu(): void {
    this.isOpen.set(true);
    this.open.emit();
    queueMicrotask(() => {
      // queueMicrotask — wait for the popup to mount before focusing
      const first = this.enabledItems()[0] ?? null;
      this.activeItem.set(first);
      first?.focus();
    });
  }

  private closeInternal(restoreFocus: boolean): void {
    if (!this.isOpen()) return;
    this.isOpen.set(false);
    this.activeItem.set(null);
    this.close.emit();
    if (restoreFocus) {
      queueMicrotask(() => this.triggerEl?.focus());
    }
  }

  private enabledItems(): DropdownItemComponent[] {
    return this.items().filter((i) => !i.disabled());
  }
}
