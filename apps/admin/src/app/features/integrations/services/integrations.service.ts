import { Injectable, signal } from '@angular/core';
import type { Integration } from '../models/integration.model';

const MOCK_INTEGRATIONS: Integration[] = [
  {
    id: 'google-analytics',
    name: 'Google Analytics',
    description: 'Track visits, conversions, and customer behaviour with GA4.',
    iconBg: '#F59E0B',
    iconLabel: 'GA',
    connected: true,
    category: 'analytics',
  },
  {
    id: 'meta-pixel',
    name: 'Meta Pixel',
    description: 'Measure ad performance and build retargeting audiences on Facebook & Instagram.',
    iconBg: '#2563EB',
    iconLabel: 'MP',
    connected: true,
    category: 'analytics',
  },
  {
    id: 'tiktok-pixel',
    name: 'TikTok Pixel',
    description: 'Optimise TikTok ads and track events on your storefront.',
    iconBg: '#0F172A',
    iconLabel: 'TT',
    connected: false,
    category: 'analytics',
  },
  {
    id: 'mailchimp',
    name: 'Mailchimp',
    description: 'Sync customers and automate email marketing campaigns.',
    iconBg: '#F59E0B',
    iconLabel: 'MC',
    connected: false,
    category: 'marketing',
  },
  {
    id: 'klaviyo',
    name: 'Klaviyo',
    description: 'Advanced email & SMS flows powered by real-time order data.',
    iconBg: '#7C3AED',
    iconLabel: 'KL',
    connected: false,
    category: 'marketing',
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp Business',
    description: 'Send order confirmations and support messages via WhatsApp.',
    iconBg: '#16A34A',
    iconLabel: 'WA',
    connected: false,
    category: 'messaging',
  },
  {
    id: 'zapier',
    name: 'Zapier',
    description: 'Connect your store to 6,000+ apps with no-code automations.',
    iconBg: '#DC2626',
    iconLabel: 'ZP',
    connected: false,
    category: 'automation',
  },
];

@Injectable()
export class IntegrationsService {
  private readonly _integrations = signal<Integration[]>(MOCK_INTEGRATIONS);

  readonly integrations = this._integrations.asReadonly();

  toggle(id: string): void {
    this._integrations.update((list) =>
      list.map((item) => (item.id === id ? { ...item, connected: !item.connected } : item)),
    );
  }
}
