import { supabase } from '../lib/supabase';

export type EarningsSummary = {
  gross: number;
  completed: number;
  eligible: number;
  processing: number;
  settled: number;
};

export async function getDairywalaEarnings(): Promise<EarningsSummary> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Please sign in to continue.');

  const { data: profile, error: profileError } = await supabase
    .from('dairywala_profiles')
    .select('id')
    .eq('owner_user_id', user.user.id)
    .maybeSingle();
  if (profileError) throw profileError;
  if (!profile) throw new Error('Dairywala profile not found.');

  const { data, error } = await supabase
    .from('marketplace_order_splits')
    .select('gross_amount,dairywala_amount,provider_status,order_id')
    .eq('dairywala_id', profile.id);
  if (error) throw error;

  const rows = data ?? [];
  const amount = (key: string) => rows.filter(r => String(r.provider_status ?? '').toUpperCase() === key).reduce((s, r) => s + Number(r.dairywala_amount ?? 0), 0);
  return {
    gross: rows.reduce((s, r) => s + Number(r.gross_amount ?? 0), 0),
    completed: rows.length,
    eligible: amount('ELIGIBLE'),
    processing: amount('PROCESSING') + amount('SETTLEMENT_INITIATED'),
    settled: amount('SETTLED'),
  };
}

export async function getDairywalaSettlementProfile() {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Please sign in to continue.');
  const { data: profile, error: profileError } = await supabase
    .from('dairywala_profiles').select('id').eq('owner_user_id', user.user.id).maybeSingle();
  if (profileError) throw profileError;
  if (!profile) throw new Error('Dairywala profile not found.');
  const { data, error } = await supabase
    .from('dairywala_settlement_profiles')
    .select('provider,status,settlement_cycle,provider_vendor_id,updated_at')
    .eq('dairywala_id', profile.id).maybeSingle();
  if (error) throw error;
  return data;
}
