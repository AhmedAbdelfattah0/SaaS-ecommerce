export interface PaymobConfig {
  enabled: boolean;
  apiKey: string;
  integrationIdCard: string;
  integrationIdFawry: string;
  integrationIdWallet: string;
  integrationIdInstallments: string;
  iframeId: string;
}

export interface FawryConfig {
  enabled: boolean;
  merchantCode: string;
  securityKey: string;
}

export interface ValuConfig {
  enabled: boolean;
  merchantId: string;
}

export interface CodConfig {
  enabled: boolean;
  fee: number;
  feeType: 'fixed' | 'percent';
}

export interface PaymentProvider {
  paymob: PaymobConfig;
  fawry: FawryConfig;
  valu: ValuConfig;
  cod: CodConfig;
}
