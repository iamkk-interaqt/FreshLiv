export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type DairywalaStatus = 'DRAFT' | 'APPLICATION_SUBMITTED' | 'VERIFICATION_PENDING' | 'VERIFIED' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'REJECTED';
export type ProductStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE';
export type ApplicationSource = 'ADMIN_DIRECT' | 'CSV_IMPORT' | 'CUSTOMER_REFERRAL' | 'SELF_REGISTRATION';
export type UserRole = 'CUSTOMER' | 'DAIRYWALA' | 'ADMIN';

type Table<R> = { Row: R; Insert: Partial<R>; Update: Partial<R>; Relationships: [] };

type UUID = string;
type Timestamp = string;
type Numeric = number;

export interface Database {
  public: {
    Tables: {
      audit_logs: Table<{ id: UUID; actor_user_id: UUID | null; action: string; entity_type: string; entity_id: UUID | null; metadata: Json; created_at: Timestamp }>;
      customer_addresses: Table<{ id: UUID; customer_id: UUID; label: string | null; address_line1: string; address_line2: string | null; locality: string | null; city: string | null; state: string | null; postal_code: string | null; latitude: number | null; longitude: number | null; is_default: boolean; created_at: Timestamp }>;
      customer_profiles: Table<{ user_id: UUID; created_at: Timestamp; updated_at: Timestamp }>;
      dairywala_applications: Table<{ id: UUID; dairywala_id: UUID | null; source: ApplicationSource; referred_by_customer_id: UUID | null; submitted_at: Timestamp | null; reviewed_at: Timestamp | null; rejection_reason: string | null; created_at: Timestamp }>;
      dairywala_delivery_slots: Table<{ id: UUID; dairywala_id: UUID; slot_code: string; start_time: string | null; end_time: string | null; active: boolean; created_at: Timestamp }>;
      dairywala_profiles: Table<{ id: UUID; owner_user_id: UUID | null; business_name: string; contact_name: string | null; phone: string | null; whatsapp: string | null; base_address: string | null; locality: string | null; city: string | null; state: string | null; postal_code: string | null; latitude: number | null; longitude: number | null; status: DairywalaStatus; created_at: Timestamp; updated_at: Timestamp }>;
      dairywala_service_areas: Table<{ id: UUID; dairywala_id: UUID; locality: string | null; city: string | null; state: string | null; postal_code: string | null; created_at: Timestamp }>;
      dairywala_settlement_profiles: Table<{ dairywala_id: UUID; provider: string; provider_vendor_id: string | null; status: string; settlement_cycle: string | null; created_at: Timestamp; updated_at: Timestamp }>;
      marketplace_commission_rules: Table<{ id: UUID; dairywala_id: UUID | null; commission_type: string; commission_value: Numeric; active: boolean; created_at: Timestamp; updated_at: Timestamp }>;
      marketplace_order_splits: Table<{ id: UUID; order_id: UUID; dairywala_id: UUID; gross_amount: Numeric; commission_amount: Numeric; dairywala_amount: Numeric; provider: string; provider_status: string; provider_reference: string | null; created_at: Timestamp; updated_at: Timestamp }>;
      marketplace_settlement_events: Table<{ id: UUID; order_id: UUID | null; dairywala_id: UUID | null; provider: string; provider_event_id: string | null; event_type: string; amount: Numeric | null; status: string | null; payload: Json | null; created_at: Timestamp }>;
      notification_devices: Table<{ id: UUID; user_id: UUID; expo_push_token: string; platform: 'android' | 'ios' | 'web'; enabled: boolean; created_at: Timestamp; updated_at: Timestamp }>;
      notifications: Table<{ id: UUID; user_id: UUID; type: string; title: string; body: string; data: Json; read_at: Timestamp | null; created_at: Timestamp }>;
      order_items: Table<{ id: UUID; order_id: UUID; product_id: UUID; quantity: number; unit_price: Numeric; line_total: Numeric; created_at: Timestamp }>;
      order_status_history: Table<{ id: UUID; order_id: UUID; from_status: string | null; to_status: string; actor_user_id: UUID | null; note: string | null; created_at: Timestamp }>;
      orders: Table<{ id: UUID; customer_id: UUID; dairywala_id: UUID; address_id: UUID; delivery_slot_id: UUID; status: string; subtotal: Numeric; delivery_fee: Numeric; total_amount: Numeric; created_at: Timestamp; updated_at: Timestamp }>;
      payment_transactions: Table<{ id: UUID; order_id: UUID; provider: string; provider_order_id: string | null; provider_payment_id: string | null; amount: Numeric; currency: string; status: string; failure_reason: string | null; created_at: Timestamp; updated_at: Timestamp }>;
      products: Table<{ id: UUID; dairywala_id: UUID; name: string; description: string | null; product_type: string | null; quantity_value: Numeric | null; quantity_unit: string | null; price: Numeric; status: ProductStatus; created_at: Timestamp; updated_at: Timestamp }>;
      profiles: Table<{ id: UUID; full_name: string | null; phone: string | null; created_at: Timestamp; updated_at: Timestamp }>;
      reviews: Table<{ id: UUID; order_id: UUID; customer_id: UUID; dairywala_id: UUID; rating: number; comment: string | null; created_at: Timestamp }>;
      route_stops: Table<{ id: UUID; route_id: UUID; order_id: UUID; stop_sequence: number; status: string; delivered_at: Timestamp | null; note: string | null }>;
      routes: Table<{ id: UUID; dairywala_id: UUID; delivery_slot_id: UUID | null; route_date: string; status: string; created_at: Timestamp; updated_at: Timestamp }>;
      subscription_items: Table<{ id: UUID; subscription_id: UUID; product_id: UUID; quantity: number; created_at: Timestamp }>;
      subscription_schedule: Table<{ id: UUID; subscription_id: UUID; scheduled_for: string; status: string; order_id: UUID | null; created_at: Timestamp }>;
      subscriptions: Table<{ id: UUID; customer_id: UUID; dairywala_id: UUID; delivery_slot_id: UUID; status: string; start_date: string; quantity: number; frequency_days: number[]; created_at: Timestamp; updated_at: Timestamp }>;
      user_roles: Table<{ user_id: UUID; role: UserRole; created_at: Timestamp }>;
    };
    Views: {};
    Functions: {
      [key: string]: { Args: Record<string, unknown>; Returns: unknown };
    };
    Enums: {
      application_source: ApplicationSource;
      dairywala_status: DairywalaStatus;
      product_status: ProductStatus;
      user_role: UserRole;
    };
    CompositeTypes: {};
  };
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T];
