export type LayoutType = 'classic' | 'boutique' | 'catalog';

export interface ThemeConfig {
  tenantId: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  logoUrl: string;
  storeName: string;
  layoutType: LayoutType;
}

export interface ThemeUpdateDto {
  primaryColor?: string;
  secondaryColor?: string;
  backgroundColor?: string;
  textColor?: string;
  fontFamily?: string;
  logoUrl?: string;
  storeName?: string;
  layoutType?: LayoutType;
}
