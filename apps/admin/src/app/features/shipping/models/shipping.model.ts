export type ShippingRateType = 'flat' | 'weight' | 'free';

export interface ShippingRate {
  type: ShippingRateType;
  price: number;
  minOrderValue?: number;
}

export interface ShippingZone {
  id: string;
  name: string;
  countries: string[];
  rate: ShippingRate;
  estimatedDays: string;
  active: boolean;
}

export interface Carrier {
  id: string;
  name: string;
  logoLabel: string;
  logoBg: string;
  connected: boolean;
  description: string;
}
