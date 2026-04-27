import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  input,
  output,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { AdminIconComponent } from '../../../../shared/components/admin-icon/admin-icon.component';
import type { OrderStatus } from '@storecraft/models';

export interface StatusChangeEvent {
  status: OrderStatus;
  note: string | undefined;
}

const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: 'pending',    label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped',    label: 'Shipped' },
  { value: 'delivered',  label: 'Delivered' },
  { value: 'cancelled',  label: 'Cancelled' },
];

@Component({
  selector: 'admin-order-status-update',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, AdminIconComponent],
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="status-form">
      <div class="field">
        <label for="status-select">New Status</label>
        <select id="status-select" class="select" formControlName="status">
          @for (opt of statusOptions; track opt.value) {
            <option [value]="opt.value">{{ opt.label }}</option>
          }
        </select>
      </div>

      <div class="field" style="margin-top: var(--sp-3)">
        <label for="status-note">Note (optional)</label>
        <textarea
          id="status-note"
          class="textarea"
          formControlName="note"
          placeholder="Add a note about this status change..."
          rows="3"
        ></textarea>
      </div>

      <button
        type="submit"
        class="btn btn-primary btn-full"
        style="margin-top: var(--sp-4)"
        [disabled]="isStatusUnchanged() || isUpdating()"
      >
        @if (isUpdating()) {
          <admin-icon name="refresh" [size]="14" />
          Updating...
        } @else {
          Update Status
        }
      </button>
    </form>
  `,
  styles: [`
    .status-form { display: flex; flex-direction: column; }
  `],
})
export class OrderStatusUpdateComponent implements OnInit {
  private readonly fb = inject(FormBuilder);

  readonly currentStatus = input.required<OrderStatus>();
  readonly isUpdating = input<boolean>(false);
  readonly statusChange = output<StatusChangeEvent>();

  readonly statusOptions = STATUS_OPTIONS;

  form!: FormGroup;

  ngOnInit(): void {
    this.form = this.fb.group({
      status: [this.currentStatus()],
      note: [''],
    });
  }

  isStatusUnchanged(): boolean {
    return this.form?.get('status')?.value === this.currentStatus();
  }

  onSubmit(): void {
    if (this.form.invalid || this.isStatusUnchanged()) return;

    const { status, note } = this.form.getRawValue() as { status: OrderStatus; note: string };
    this.statusChange.emit({
      status,
      note: note?.trim() || undefined,
    });
  }

  resetForm(): void {
    this.form.patchValue({ status: this.currentStatus(), note: '' });
  }
}
