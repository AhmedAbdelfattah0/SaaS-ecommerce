import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { AdminI18nService } from '../../../../shared/services/admin-i18n.service';
import { AdminIconComponent } from '../../../../shared/components/admin-icon/admin-icon.component';
import { ThemeEditorService } from '../../services/theme-editor.service';
import { ColorPickerComponent } from '../../components/color-picker/color-picker.component';
import { FontSelectorComponent } from '../../components/font-selector/font-selector.component';
import { LogoUploadComponent } from '../../components/logo-upload/logo-upload.component';
import { LayoutPreviewComponent } from '../../components/layout-preview/layout-preview.component';
import { LayoutSelectorComponent } from '../../components/layout-selector/layout-selector.component';
import type { ThemeUpdateDto } from '@storecraft/models';

@Component({
  selector: 'admin-theme-editor-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    AdminIconComponent,
    ColorPickerComponent,
    FontSelectorComponent,
    LogoUploadComponent,
    LayoutPreviewComponent,
    LayoutSelectorComponent,
  ],
  providers: [ThemeEditorService],
  templateUrl: './theme-editor-page.component.html',
  styleUrl: './theme-editor-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemeEditorPageComponent implements OnInit {
  protected readonly svc = inject(ThemeEditorService);
  protected readonly i18n = inject(AdminI18nService);

  readonly storeNameControl = new FormControl<string>('', { nonNullable: true });

  ngOnInit(): void {
    this.svc.load();
    // Sync store name from theme once loaded — handled via effect via signal read in template
  }

  onStoreNameInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.svc.update({ storeName: value });
  }

  onColorChange(field: keyof Pick<ThemeUpdateDto, 'primaryColor' | 'secondaryColor' | 'backgroundColor' | 'textColor'>, value: string): void {
    this.svc.update({ [field]: value } as ThemeUpdateDto);
  }

  onFontChange(value: string): void {
    this.svc.update({ fontFamily: value });
  }

  onLogoChange(dataUrl: string): void {
    this.svc.update({ logoUrl: dataUrl });
  }

  onLayoutChange(value: ThemeUpdateDto['layoutType']): void {
    this.svc.update({ layoutType: value });
  }

  save(): void {
    this.svc.save();
  }

  discard(): void {
    this.svc.discard();
  }
}
