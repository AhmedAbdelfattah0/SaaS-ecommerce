export type IntegrationCategory = 'analytics' | 'marketing' | 'messaging' | 'automation';

export interface Integration {
  id: string;
  name: string;
  description: string;
  /** Short color string used for the icon background (CSS color value) */
  iconBg: string;
  /** Two-letter abbreviation shown in the icon */
  iconLabel: string;
  connected: boolean;
  category: IntegrationCategory;
}
