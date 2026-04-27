import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';

@Component({
  selector: 'admin-logo-upload',
  standalone: true,
  templateUrl: './logo-upload.component.html',
  styleUrl: './logo-upload.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogoUploadComponent {
  /** Currently saved logo URL */
  readonly currentUrl = input<string>('');
  /** Emits a data URL from FileReader — does NOT upload to server */
  readonly change = output<string>();

  private readonly _previewUrl = signal<string | null>(null);
  readonly previewUrl = this._previewUrl.asReadonly();

  private readonly _isDragging = signal(false);
  readonly isDragging = this._isDragging.asReadonly();

  readonly fileInput = viewChild.required<ElementRef<HTMLInputElement>>('fileInput');

  openPicker(): void {
    this.fileInput().nativeElement.click();
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this._isDragging.set(true);
  }

  onDragLeave(): void {
    this._isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this._isDragging.set(false);
    const file = event.dataTransfer?.files[0];
    if (file) this.readFile(file);
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.readFile(file);
  }

  private readFile(file: File): void {
    if (!file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      this._previewUrl.set(result);
      this.change.emit(result);
    };
    reader.readAsDataURL(file);
  }

  get displayUrl(): string {
    return this._previewUrl() ?? this.currentUrl();
  }

  clearPreview(): void {
    this._previewUrl.set(null);
    this.change.emit('');
  }
}
