export type DairywalaStatus = 'DRAFT' | 'APPLICATION_SUBMITTED' | 'VERIFICATION_PENDING' | 'VERIFIED' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'REJECTED';
export type ProductStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE';

export interface DairywalaProfile {
  id: string;
  business_name: string;
  contact_name: string | null;
  phone: string | null;
  whatsapp: string | null;
  base_address: string | null;
  locality: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  owner_user_id: string | null;
  status: DairywalaStatus;
  created_at: string;
  updated_at: string;
}

export interface DairywalaServiceArea {
  id: string;
  dairywala_id: string;
  locality: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  created_at: string;
}

export interface Product {
  id: string;
  dairywala_id: string;
  name: string;
  description: string | null;
  product_type: string | null;
  quantity_value: number | null;
  quantity_unit: string | null;
  price: number;
  status: ProductStatus;
  created_at: string;
  updated_at: string;
}
