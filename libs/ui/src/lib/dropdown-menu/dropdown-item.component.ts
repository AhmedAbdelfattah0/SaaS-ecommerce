import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  booleanAttribute,
  computed,
  forwardRef,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import { DropdownMenuComponent } from './dropdown-menu.component';

/**
 * Single menu item inside `<sc-dropdown-menu>`. Emits `(select)` on
 * click / Enter / Space, and tells the parent menu to close itself
 * via DI — caller doesn't need to wire close logic per item.
 *
 * @example
 * ```html
 * <sc-dropdown-item (select)="edit(row)">
 *   <admin-icon name="edit" />
 *   Edit
 * </sc-dropdown-item>
 *
 * <sc-dropdown-item variant="danger" (select)="delete(row)">
 *   <admin-icon name="trash" />
 *   Delete
 * </sc-dropdown-item>
 * ```
 */
@Component({
  selector: 'sc-dropdown-item',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      #button
      type="button"
      class="sc-dropdown-item"
      [class.sc-dropdown-item-danger]="variant() === 'danger'"
      [disabled]="disabled()"
      [tabindex]="tabindex()"
      role="menuitem"
      [attr.aria-disabled]="disabled() || null"
      (click)="onClick()"
    >
      <ng-content />
    </button>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .sc-dropdown-item {
        display: flex;
        align-items: center;
        gap: var(--sp-2);
        width: 100%;
        padding-block: var(--sp-2);
        padding-inline: var(--sp-3);
        font-family: inherit;
        font-size: 13.5px;
        color: var(--color-text);
        background: transparent;
        border: 0;
        cursor: pointer;
        text-align: start;
        transition: background 0.12s, color 0.12s;
      }

      .sc-dropdown-item:hover:not(:disabled),
      .sc-dropdown-item:focus-visible:not(:disabled) {
        background: var(--color-bg);
        outline: none;
      }

      .sc-dropdown-item:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .sc-dropdown-item-danger {
        color: var(--color-danger);
      }
      .sc-dropdown-item-danger:hover:not(:disabled),
      .sc-dropdown-item-danger:focus-visible:not(:disabled) {
        background: var(--color-danger-light);
      }

      @media (max-width: 640px) {
        .sc-dropdown-item {
          min-block-size: 44px;
        }
      }
    `,
  ],
})
export class DropdownItemComponent {
  private readonly menu = inject<DropdownMenuComponent | null>(
    forwardRef(() => DropdownMenuComponent),
    { optional: true },
  );

  private readonly buttonRef =
    viewChild.required<ElementRef<HTMLButtonElement>>('button');

  readonly disabled = input(false, { transform: booleanAttribute });
  readonly variant = input<'default' | 'danger'>('default');

  readonly select = output<void>();

  /** Roving tabindex — only the active item in the parent menu is in tab order. */
  readonly tabindex = computed(() =>
    this.menu?.isActive(this) ? 0 : -1,
  );

  onClick(): void {
    if (this.disabled()) return;
    this.select.emit();
    this.menu?.closeMenu();
  }

  /** Programmatic focus — called by the parent menu during arrow-key navigation. */
  focus(): void {
    this.buttonRef().nativeElement.focus();
  }
}
