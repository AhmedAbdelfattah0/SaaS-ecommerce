export interface Tenant {
  id: string;
  name: string;
  email: string;
  customDomain: string;
  status: 'pending' | 'active' | 'suspended' | 'cancelled';
  plan: 'starter' | 'pro';
  lemonSqueezySubscriptionId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TenantResolution {
  tenantId: string;
  storeName: string;
  plan: 'starter' | 'pro';
  status: 'pending' | 'active' | 'suspended' | 'cancelled';
}
