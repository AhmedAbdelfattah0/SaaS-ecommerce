import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import type { AbstractControl, ValidationErrors } from '@angular/forms';
import { startWith, switchMap } from 'rxjs/operators';

/**
 * Inline validation message for a single FormControl / AbstractControl.
 *
 * Renders nothing until the control is touched AND invalid, then shows
 * the most actionable error in priority order:
 *   required > email > minlength > maxlength > min > max > pattern
 *
 * Custom validators are matched by error-key against the optional
 * [messages] override map.
 *
 * Usage:
 *   <input class="input" [class.is-invalid]="ctrl.touched && ctrl.invalid"
 *          [formControl]="ctrl" />
 *   <sc-field-error [control]="ctrl" fieldLabel="Email" />
 *
 *   <!-- Custom / localized messages -->
 *   <sc-field-error
 *     [control]="ctrl"
 *     fieldLabel="Email"
 *     [messages]="{
 *       required: t('validation.email.required'),
 *       email: t('validation.email.invalid')
 *     }"
 *   />
 */
@Component({
  selector: 'sc-field-error',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (message(); as msg) {
      <p class="sc-field-error" role="alert">{{ msg }}</p>
    }
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .sc-field-error {
        margin: 6px 0 0;
        font-size: 12px;
        line-height: 1.4;
        color: var(--color-danger);
        font-weight: 500;
        text-align: start;
      }
    `,
  ],
})
export class FieldErrorComponent {
  /** The control to watch. Required. */
  readonly control = input.required<AbstractControl>();

  /**
   * Human-readable label injected into the default `required` message
   * ("{label} is required"). Defaults to "This field".
   */
  readonly fieldLabel = input<string>();

  /**
   * Per-instance message overrides, keyed by validator error name.
   * Pass localized strings here when the default English text isn't enough.
   *   { required: 'Email is required', email: 'Please enter a valid email' }
   */
  readonly messages = input<Partial<Record<string, string>>>({});

  // Re-evaluate `message()` on every touch / value / status change.
  private readonly _events = toSignal(
    toObservable(this.control).pipe(
      switchMap((c) => c.events.pipe(startWith(null))),
    ),
    { initialValue: null },
  );

  readonly message = computed<string | null>(() => {
    this._events();
    const c = this.control();
    if (!c.touched || c.valid || !c.errors) return null;
    return this.buildMessage(c.errors, this.fieldLabel() ?? 'This field', this.messages());
  });

  private buildMessage(
    errors: ValidationErrors,
    label: string,
    overrides: Partial<Record<string, string>>,
  ): string {
    const priority = ['required', 'email', 'minlength', 'maxlength', 'min', 'max', 'pattern'];
    for (const key of priority) {
      if (errors[key] !== undefined) {
        return overrides[key] ?? this.defaultMessage(key, errors[key], label);
      }
    }
    for (const key of Object.keys(errors)) {
      if (overrides[key]) return overrides[key]!;
    }
    return overrides['unknown'] ?? 'Invalid value';
  }

  private defaultMessage(key: string, params: unknown, label: string): string {
    const p = params as Record<string, unknown>;
    switch (key) {
      case 'required':
        return `${label} is required`;
      case 'email':
        return 'Please enter a valid email address';
      case 'minlength':
        return `Must be at least ${p['requiredLength']} characters`;
      case 'maxlength':
        return `Must be at most ${p['requiredLength']} characters`;
      case 'min':
        return `Must be at least ${p['min']}`;
      case 'max':
        return `Must be at most ${p['max']}`;
      case 'pattern':
        return 'Invalid format';
      default:
        return 'Invalid value';
    }
  }
}
