export type ProductStatus = 'active' | 'draft' | 'deleted';

export interface ProductVariant {
  id: string;
  productId: string;
  tenantId: string;
  name: string;
  value: string;
  priceModifier: number;
  stock: number;
}

export interface Product {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  comparePrice: number | null;
  stock: number;
  categoryId: string | null;
  images: string[];
  status: ProductStatus;
  variants: ProductVariant[];
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  createdAt: string;
}

export interface ProductCreateDto {
  name: string;
  description: string;
  price: number;
  comparePrice?: number;
  stock: number;
  categoryId?: string;
  images?: string[];
  status?: ProductStatus;
}

export interface ProductUpdateDto extends Partial<ProductCreateDto> {}
