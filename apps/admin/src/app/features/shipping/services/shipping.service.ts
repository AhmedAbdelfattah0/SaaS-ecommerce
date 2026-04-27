import { Injectable, signal } from '@angular/core';
import type { ShippingZone, Carrier } from '../models/shipping.model';

const MOCK_ZONES: ShippingZone[] = [
  {
    id: 'zone-egypt',
    name: 'Egypt — Domestic',
    countries: ['Egypt'],
    rate: { type: 'flat', price: 35 },
    estimatedDays: '2–4 days',
    active: true,
  },
  {
    id: 'zone-gcc',
    name: 'GCC Countries',
    countries: ['Saudi Arabia', 'UAE', 'Kuwait', 'Qatar', 'Bahrain', 'Oman'],
    rate: { type: 'flat', price: 120 },
    estimatedDays: '5–7 days',
    active: true,
  },
  {
    id: 'zone-international',
    name: 'Rest of World',
    countries: ['All other countries'],
    rate: { type: 'flat', price: 250 },
    estimatedDays: '10–14 days',
    active: false,
  },
];

const MOCK_CARRIERS: Carrier[] = [
  {
    id: 'bosta',
    name: 'Bosta',
    logoLabel: 'BO',
    logoBg: '#F59E0B',
    connected: true,
    description: 'Same-day & next-day delivery across Egypt.',
  },
  {
    id: 'aramex',
    name: 'Aramex',
    logoLabel: 'AR',
    logoBg: '#DC2626',
    connected: false,
    description: 'Regional and international courier network.',
  },
  {
    id: 'dhl',
    name: 'DHL Express',
    logoLabel: 'DHL',
    logoBg: '#F59E0B',
    connected: false,
    description: 'Global express delivery in 220+ countries.',
  },
  {
    id: 'fedex',
    name: 'FedEx',
    logoLabel: 'FX',
    logoBg: '#7C3AED',
    connected: false,
    description: 'Reliable international shipping & tracking.',
  },
];

@Injectable()
export class ShippingService {
  private readonly _zones = signal<ShippingZone[]>(MOCK_ZONES);
  private readonly _carriers = signal<Carrier[]>(MOCK_CARRIERS);

  readonly zones = this._zones.asReadonly();
  readonly carriers = this._carriers.asReadonly();

  toggleZone(id: string): void {
    this._zones.update((list) =>
      list.map((z) => (z.id === id ? { ...z, active: !z.active } : z)),
    );
  }

  toggleCarrier(id: string): void {
    this._carriers.update((list) =>
      list.map((c) => (c.id === id ? { ...c, connected: !c.connected } : c)),
    );
  }
}
