import { supabase } from '../lib/supabase';

export async function discoverActiveDairywalas(postalCode: string) {
  const normalizedPostalCode = postalCode.trim();
  if (!normalizedPostalCode) return [];

  const { data: areas, error: areaError } = await supabase
    .from('dairywala_service_areas')
    .select('dairywala_id')
    .eq('postal_code', normalizedPostalCode);

  if (areaError) throw areaError;
  const ids = [...new Set((areas ?? []).map((row) => row.dairywala_id))];
  if (!ids.length) return [];

  const { data, error } = await supabase
    .from('dairywala_profiles')
    .select('id, business_name, contact_name, locality, city, state, postal_code, status')
    .in('id', ids)
    .eq('status', 'ACTIVE');

  if (error) throw error;
  return data ?? [];
}
