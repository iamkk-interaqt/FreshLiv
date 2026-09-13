import { supabase } from '../lib/supabase';
import type { CustomerLocation, DairywalaSummary } from '../types/marketplace';

type ServiceAreaRow = {
  dairywala_id: string;
};

type ProfileRow = {
  id: string;
  business_name: string;
  locality: string | null;
};

type DeliverySlotRow = {
  dairywala_id: string;
  slot_code: string;
  active: boolean;
};

/**
 * Customer discovery boundary.
 *
 * Only ACTIVE Dairywalas with a matching service area are returned.
 * No demo/fallback records are ever added here.
 */
export async function findActiveDairywalas(
  location: CustomerLocation,
): Promise<DairywalaSummary[]> {
  const postalCode = location.postalCode?.trim();
  const locality = location.locality?.trim();

  if (!postalCode && !locality) return [];

  let areas: ServiceAreaRow[] = [];

  if (postalCode) {
    const { data, error } = await supabase
      .from('dairywala_service_areas')
      .select('dairywala_id')
      .eq('postal_code', postalCode);

    if (error) throw error;
    areas = data ?? [];
  }

  // If PIN did not match, locality is the next real-data matching path.
  if (!areas.length && locality) {
    const { data, error } = await supabase
      .from('dairywala_service_areas')
      .select('dairywala_id')
      .ilike('locality', locality);

    if (error) throw error;
    areas = data ?? [];
  }

  const ids = [...new Set(areas.map((row) => row.dairywala_id))];
  if (!ids.length) return [];

  const { data: profiles, error: profileError } = await supabase
    .from('dairywala_profiles')
    .select('id, business_name, locality')
    .in('id', ids)
    .eq('status', 'ACTIVE');

  if (profileError) throw profileError;
  if (!profiles?.length) return [];

  const activeIds = profiles.map((profile) => profile.id);
  const { data: slots, error: slotError } = await supabase
    .from('dairywala_delivery_slots')
    .select('dairywala_id, slot_code, active')
    .in('dairywala_id', activeIds)
    .eq('active', true);

  if (slotError) throw slotError;

  const slotRows = (slots ?? []) as DeliverySlotRow[];

  return (profiles as ProfileRow[]).map((profile) => {
    const dairywalaSlots = slotRows.filter((slot) => slot.dairywala_id === profile.id);
    const normalizedSlots = dairywalaSlots.map((slot) => slot.slot_code.toUpperCase());

    return {
      id: profile.id,
      businessName: profile.business_name,
      locality: profile.locality ?? '',
      morningSlotAvailable: normalizedSlots.includes('MORNING'),
      eveningSlotAvailable: normalizedSlots.includes('EVENING'),
    };
  });
}
