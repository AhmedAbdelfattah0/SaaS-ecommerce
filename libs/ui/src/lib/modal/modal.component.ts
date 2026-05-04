import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  booleanAttribute,
  input,
  output,
  viewChild,
} from '@angular/core';

/** Size variants for `<sc-modal>`. */
export type ModalSize = 'sm' | 'md' | 'lg' | 'fullscreen';

/**
 * Modal dialog built on the native `<dialog>` element. The browser
 * gives us focus trap, focus restoration, body scroll lock, Esc
 * handling, top-layer rendering, and `::backdrop` styling for free —
 * no Angular CDK, no custom focus management.
 *
 * ## Visibility model — caller-controlled via `@if`
 *
 * The component does NOT have an `[open]` input. Mounting controls
 * visibility: `@if (open) { <sc-modal>…</sc-modal> }`. When the
 * component mounts, `dialog.showModal()` runs in `ngAfterViewInit`;
 * when it unmounts, `dialog.close()` runs in `ngOnDestroy`.
 *
 * The `(close)` output emits **intent**, not a fait accompli — the
 * caller decides whether to actually close (typically by toggling the
 * `@if` flag). This allows confirm-on-close flows.
 *
 * ## Body scroll behaviour
 *
 * Header and footer stay sticky; body scrolls internally so action
 * buttons remain visible during long forms.
 *
 * ## Mobile
 *
 * At viewport ≤640px, `sm`/`md`/`lg` all collapse to `100vw - 32px`.
 * `fullscreen` is unaffected.
 *
 * @example Confirmation
 * ```html
 * @if (deleteConfirmOpen()) {
 *   <sc-modal title="Delete product?" size="sm" (close)="deleteConfirmOpen.set(false)">
 *     <p>Are you sure? This action cannot be undone.</p>
 *     <div modal-footer>
 *       <sc-button variant="ghost" (click)="deleteConfirmOpen.set(false)">Cancel</sc-button>
 *       <sc-button variant="danger" (click)="confirmDelete()">Delete</sc-button>
 *     </div>
 *   </sc-modal>
 * }
 * ```
 *
 * @example Form modal with backdrop guard
 * ```html
 * @if (newProductOpen()) {
 *   <sc-modal
 *     title="New Product"
 *     size="lg"
 *     [closeOnBackdrop]="false"
 *     (close)="confirmDiscardOrClose()"
 *   >
 *     <admin-product-form />
 *     <div modal-footer>
 *       <sc-button variant="ghost" (click)="confirmDiscardOrClose()">Cancel</sc-button>
 *       <sc-button variant="primary" (click)="save()">Save</sc-button>
 *     </div>
 *   </sc-modal>
 * }
 * ```
 *
 * @example Custom header (replaces title with projected content)
 * ```html
 * <sc-modal size="lg" (close)="open.set(false)">
 *   <div modal-header>
 *     <sc-tabs variant="underline" [tabs]="modalTabs" [(active)]="activeTab" />
 *   </div>
 *   …body…
 * </sc-modal>
 * ```
 */
@Component({
  selector: 'sc-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.scss',
})
export class ModalComponent implements AfterViewInit, OnDestroy {
  private readonly dialogRef = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  readonly title = input<string>();
  readonly size = input<ModalSize>('md');
  readonly closeOnBackdrop = input(true, { transform: booleanAttribute });
  readonly closeOnEscape = input(true, { transform: booleanAttribute });
  readonly dismissible = input(true, { transform: booleanAttribute });

  readonly close = output<void>();

  /** Unique id for the title heading so dialog has aria-labelledby. */
  protected readonly titleId = `sc-modal-title-${Math.random().toString(36).slice(2, 9)}`;

  ngAfterViewInit(): void {
    const dialog = this.dialogRef().nativeElement;
    if (!dialog.open) {
      dialog.showModal();
    }
  }

  ngOnDestroy(): void {
    const dialog = this.dialogRef().nativeElement;
    if (dialog.open) {
      dialog.close();
    }
  }

  /** Click on the dialog element itself (backdrop area). Inner content stops propagation via target check. */
  onBackdropClick(event: MouseEvent): void {
    if (!this.closeOnBackdrop()) return;
    if (event.target === this.dialogRef().nativeElement) {
      this.close.emit();
    }
  }

  /** Native cancel event fires on Esc. Always preventDefault — caller decides whether to close via @if. */
  onCancel(event: Event): void {
    event.preventDefault();
    if (!this.closeOnEscape()) return;
    this.close.emit();
  }

  /** X-button click handler. */
  requestClose(): void {
    this.close.emit();
  }
}
