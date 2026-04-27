import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { NgStyle } from '@angular/common';
import type { ThemeConfig } from '@storecraft/models';

@Component({
  selector: 'admin-layout-preview',
  standalone: true,
  imports: [NgStyle],
  templateUrl: './layout-preview.component.html',
  styleUrl: './layout-preview.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutPreviewComponent {
  readonly theme = input.required<ThemeConfig>();

  readonly headerStyle = computed(() => {
    const t = this.theme();
    return {
      background: t.primaryColor,
      color: '#ffffff',
      'font-family': t.fontFamily,
    };
  });

  readonly bodyStyle = computed(() => {
    const t = this.theme();
    return {
      background: t.backgroundColor,
      color: t.textColor,
      'font-family': t.fontFamily,
    };
  });

  readonly buttonStyle = computed(() => ({
    background: this.theme().primaryColor,
    color: '#ffffff',
  }));

  readonly accentStyle = computed(() => ({
    background: this.theme().secondaryColor,
  }));

  readonly isBoutique = computed(() => this.theme().layoutType === 'boutique');
  readonly isCatalog = computed(() => this.theme().layoutType === 'catalog');
  readonly isClassic = computed(() => this.theme().layoutType === 'classic');
}
