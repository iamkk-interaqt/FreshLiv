import { supabase } from '../lib/supabase';

export type SubscriptionRow = {
  id: string;
  customer_id: string;
  dairywala_id: string;
  status: string;
  frequency: string;
  delivery_slot_id: string | null;
  start_date: string;
  end_date: string | null;
  created_at: string;
  updated_at: string;
};

async function userId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error('Please sign in to continue.');
  return data.user.id;
}

export async function getMySubscriptions() {
  const id = await userId();
  const { data, error } = await supabase.from('subscriptions').select('*').eq('customer_id', id).order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as SubscriptionRow[];
}

export async function setSubscriptionStatus(subscriptionId: string, status: 'ACTIVE' | 'PAUSED' | 'SKIPPED' | 'CANCELLED') {
  await userId();
  const { data, error } = await supabase.rpc('set_customer_subscription_status', {
    p_subscription_id: subscriptionId,
    p_status: status,
  });
  if (error) throw error;
  return data as SubscriptionRow;
}
