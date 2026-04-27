export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export interface OrderItem {
  id: string;
  orderId: string;
  tenantId: string;
  productId: string;
  variantId: string | null;
  name: string;
  price: number;
  quantity: number;
}

export interface OrderStatusHistory {
  id: string;
  orderId: string;
  tenantId: string;
  status: OrderStatus;
  changedAt: string;
  note: string | null;
}

export interface Order {
  id: string;
  tenantId: string;
  customerId: string;
  status: OrderStatus;
  subtotal: number;
  shipping: number;
  total: number;
  items: OrderItem[];
  statusHistory: OrderStatusHistory[];
  createdAt: string;
  updatedAt: string;
}

export interface CheckoutDto {
  customerId?: string;
  customerEmail: string;
  customerName: string;
  items: Array<{
    productId: string;
    variantId?: string;
    quantity: number;
  }>;
  shippingAddress: {
    line1: string;
    city: string;
    country: string;
    postalCode: string;
  };
}
