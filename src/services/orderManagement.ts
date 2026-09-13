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

  const userId = await getCurrentUserId();
  const { error: updateError } = await supabase
    .from('orders')
    .update({ status: next, updated_at: new Date().toISOString() })
    .eq('id', order.id)
    .eq('dairywala_id', order.dairywala_id);
  if (updateError) throw updateError;

  const { error: historyError } = await supabase.from('order_status_history').insert({
    order_id: order.id,
    from_status: order.status,
    to_status: next,
    actor_user_id: userId,
  });
  if (historyError) throw historyError;

  const { error: notificationError } = await supabase.from('notifications').insert({
    user_id: order.customer_id,
    type: 'ORDER_STATUS',
    title: `Order ${next.toLowerCase().replaceAll('_', ' ')}`,
    body: `Your Gwalawala order is now ${next.toLowerCase().replaceAll('_', ' ')}.`,
    data: { orderId: order.id, status: next },
  });
  if (notificationError) throw notificationError;

  return next;
}
