import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { BannerComponent } from '@storecraft/ui';

const MAX_LOGO_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'];

@Component({
  selector: 'admin-logo-upload',
  standalone: true,
  imports: [BannerComponent],
  templateUrl: './logo-upload.component.html',
  styleUrl: './logo-upload.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogoUploadComponent {
  /** Currently saved logo URL */
  readonly currentUrl = input<string>('');
  /** Emits a data URL from FileReader — does NOT upload to server */
  readonly fileChange = output<string>();

  private readonly _previewUrl = signal<string | null>(null);
  readonly previewUrl = this._previewUrl.asReadonly();

  private readonly _isDragging = signal(false);
  readonly isDragging = this._isDragging.asReadonly();

  /**
   * Surfaced inline via <sc-banner variant="error"> instead of swallowing
   * bad files silently. Cleared on next valid upload or on dismiss.
   */
  private readonly _uploadError = signal<string | null>(null);
  readonly uploadError = this._uploadError.asReadonly();

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

  dismissError(): void {
    this._uploadError.set(null);
  }

  private readFile(file: File): void {
    // Validate type — accept PNG / JPG / SVG / WebP
    if (!ACCEPTED_TYPES.includes(file.type)) {
      this._uploadError.set(
        `Unsupported file type. Use PNG, JPG, SVG, or WebP. (Received: ${file.type || 'unknown'})`,
      );
      return;
    }

    // Validate size — surface a real error instead of silently dropping
    if (file.size > MAX_LOGO_SIZE_BYTES) {
      const mb = (file.size / 1024 / 1024).toFixed(2);
      this._uploadError.set(`File is ${mb} MB — max is 2 MB.`);
      return;
    }

    this._uploadError.set(null);
    const reader = new FileReader();
    reader.onerror = () => {
      this._uploadError.set('Could not read the file. Try a different image.');
    };
    reader.onload = (e) => {
      const result = e.target?.result as string;
      this._previewUrl.set(result);
      this.fileChange.emit(result);
    };
    reader.readAsDataURL(file);
  }

  get displayUrl(): string {
    return this._previewUrl() ?? this.currentUrl();
  }

  clearPreview(): void {
    this._previewUrl.set(null);
    this._uploadError.set(null);
    this.fileChange.emit('');
  }
}
