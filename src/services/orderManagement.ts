import { supabase } from '../lib/supabase';

export type OrderRow = {
  id: string;
  customer_id: string;
  dairywala_id: string;
  delivery_slot_id: string | null;
  status: string;
  subtotal: number;
  delivery_fee: number;
  total_amount: number;
  created_at: string;
  updated_at: string;
};

export async function getCurrentUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error('Please sign in to continue.');
  return data.user.id;
}

export async function getCustomerOrders() {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from('orders')
    .select('id,customer_id,dairywala_id,delivery_slot_id,status,subtotal,delivery_fee,total_amount,created_at,updated_at')
    .eq('customer_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as OrderRow[];
}

export async function getDairywalaOrders() {
  const userId = await getCurrentUserId();
  const { data: profile, error: profileError } = await supabase
    .from('dairywala_profiles')
    .select('id')
    .eq('owner_user_id', userId)
    .maybeSingle();
  if (profileError) throw profileError;
  if (!profile) throw new Error('Dairywala profile not found.');

  const { data, error } = await supabase
    .from('orders')
    .select('id,customer_id,dairywala_id,delivery_slot_id,status,subtotal,delivery_fee,total_amount,created_at,updated_at')
    .eq('dairywala_id', profile.id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as OrderRow[];
}

const NEXT_STATUS: Record<string, string[]> = {
  CONFIRMED: ['ACCEPTED'],
  ACCEPTED: ['FULFILLING'],
  FULFILLING: ['OUT_FOR_DELIVERY'],
  OUT_FOR_DELIVERY: ['DELIVERED'],
  DELIVERED: ['COMPLETED'],
};

export async function advanceDairywalaOrder(order: OrderRow) {
  const allowed = NEXT_STATUS[order.status] ?? [];
  const next = allowed[0];
  if (!next) throw new Error(`Order cannot move forward from ${order.status}.`);

  const { data, error } = await supabase.rpc('transition_order_status', {
    p_order_id: order.id,
    p_to_status: next,
    p_note: null,
  });
  if (error) throw error;
  return String(data || next);
}
