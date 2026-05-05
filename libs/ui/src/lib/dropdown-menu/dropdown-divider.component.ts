import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Horizontal separator inside `<sc-dropdown-menu>`. Renders an
 * `<hr role="separator">` styled to match the menu.
 *
 * @example
 * ```html
 * <sc-dropdown-item (select)="edit()">Edit</sc-dropdown-item>
 * <sc-dropdown-divider />
 * <sc-dropdown-item variant="danger" (select)="delete()">Delete</sc-dropdown-item>
 * ```
 */
@Component({
  selector: 'sc-dropdown-divider',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<hr class="sc-dropdown-divider" role="separator" />',
  styles: [
    `
      :host {
        display: block;
      }
      .sc-dropdown-divider {
        border: 0;
        border-block-start: 1px solid var(--color-border);
        margin-block: var(--sp-1);
        margin-inline: 0;
      }
    `,
  ],
})
export class DropdownDividerComponent {}
