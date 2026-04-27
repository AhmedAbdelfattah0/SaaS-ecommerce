import { Injectable, signal } from '@angular/core';
import type { PaymentProvider } from '../models/payment-provider.model';

const MOCK_CONFIG: PaymentProvider = {
  paymob: {
    enabled: true,
    apiKey: 'ZXhhbXBsZS1hcGkta2V5LXBheW1vYg==',
    integrationIdCard: '123456',
    integrationIdFawry: '234567',
    integrationIdWallet: '345678',
    integrationIdInstallments: '456789',
    iframeId: '789012',
  },
  fawry: {
    enabled: false,
    merchantCode: '',
    securityKey: '',
  },
  valu: {
    enabled: false,
    merchantId: '',
  },
  cod: {
    enabled: true,
    fee: 15,
    feeType: 'fixed',
  },
};

@Injectable()
export class PaymentsService {
  private readonly _config = signal<PaymentProvider>(MOCK_CONFIG);

  readonly config = this._config.asReadonly();

  toggleProvider(provider: keyof PaymentProvider): void {
    this._config.update((c) => ({
      ...c,
      [provider]: { ...c[provider], enabled: !c[provider].enabled },
    }));
  }
}
