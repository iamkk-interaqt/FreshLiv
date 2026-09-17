import { supabase } from '../lib/supabase';
import type { CustomerLocation, DairywalaSummary } from '../types/marketplace';

type ServiceAreaRow = { dairywala_id: string };
type ProfileRow = { id: string; business_name: string; locality: string | null };
type DeliverySlotRow = { dairywala_id: string; slot_code: string; active: boolean };
type ProductRow = { dairywala_id: string; name: string | null; product_type: string | null; status: string };

function normalize(value: string | null | undefined) {
  return String(value ?? '').trim().toLowerCase().replace(/[_-]+/g, ' ');
}

function matchesProduct(product: ProductRow, requestedProduct?: string, requestedSource?: string) {
  if (!requestedProduct && !requestedSource) return true;
  const name = normalize(product.name);
  const type = normalize(product.product_type);
  const productRequested = normalize(requestedProduct);
  const sourceRequested = normalize(requestedSource);
  const isMilkRequest = !productRequested || productRequested === 'milk' || name.includes('milk');
  const productMatches = !productRequested || name === productRequested || type === productRequested || name.includes(productRequested);
  if (!productMatches && !(isMilkRequest && name.includes('milk'))) return false;
  if (!sourceRequested) return true;
  // Source-filtered discovery is exact: unclassified Milk is not presented as Cow or Buffalo.
  return type === sourceRequested || type.includes(sourceRequested);
}

/** Only ACTIVE Dairywalas with a matching service area, active delivery slot, and active matching product are returned. */
export async function findActiveDairywalas(location: CustomerLocation, requestedProduct?: string, requestedSource?: string): Promise<DairywalaSummary[]> {
  const postalCode = location.postalCode?.trim();
  const locality = location.locality?.trim();
  if (!postalCode && !locality) return [];

  let areas: ServiceAreaRow[] = [];
  if (postalCode) {
    const { data, error } = await supabase.from('dairywala_service_areas').select('dairywala_id').eq('postal_code', postalCode);
    if (error) throw error;
    areas = data ?? [];
  }
  if (!areas.length && locality) {
    const { data, error } = await supabase.from('dairywala_service_areas').select('dairywala_id').ilike('locality', locality);
    if (error) throw error;
    areas = data ?? [];
  }

  const ids = [...new Set(areas.map((row) => row.dairywala_id))];
  if (!ids.length) return [];
  const { data: profiles, error: profileError } = await supabase.from('dairywala_profiles').select('id, business_name, locality').in('id', ids).eq('status', 'ACTIVE');
  if (profileError) throw profileError;
  if (!profiles?.length) return [];
  const activeIds = profiles.map((profile) => profile.id);

  const { data: slots, error: slotError } = await supabase.from('dairywala_delivery_slots').select('dairywala_id, slot_code, active').in('dairywala_id', activeIds).eq('active', true);
  if (slotError) throw slotError;
  const slotRows = (slots ?? []) as DeliverySlotRow[];

  const { data: products, error: productError } = await supabase.from('products').select('dairywala_id, name, product_type, status').in('dairywala_id', activeIds).eq('status', 'ACTIVE');
  if (productError) throw productError;
  const productRows = (products ?? []) as ProductRow[];
  const productFilteredIds = new Set(activeIds.filter((id) => productRows.some((product) => product.dairywala_id === id && matchesProduct(product, requestedProduct, requestedSource))));

  return (profiles as ProfileRow[]).filter((profile) => productFilteredIds.has(profile.id)).map((profile) => {
    const dairywalaSlots = slotRows.filter((slot) => slot.dairywala_id === profile.id);
    const normalizedSlots = dairywalaSlots.map((slot) => slot.slot_code.toUpperCase());
    return { id: profile.id, businessName: profile.business_name, locality: profile.locality ?? '', morningSlotAvailable: normalizedSlots.includes('MORNING'), eveningSlotAvailable: normalizedSlots.includes('EVENING') };
  });
}
