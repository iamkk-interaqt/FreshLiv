import { supabase } from '../lib/supabase';
import type { CustomerLocation, DairywalaSummary, DairywalaProductMatch } from '../types/marketplace';

type ServiceAreaRow = { dairywala_id: string };
type ProfileRow = {
  id: string;
  business_name: string;
  phone: string | null;
  locality: string | null;
  families_served: number | null;
  years_in_business: number | null;
  profile_avatar: string | null;
};
type DeliverySlotRow = { dairywala_id: string; slot_code: string; active: boolean };
type ProductRow = {
  id: string;
  dairywala_id: string;
  name: string | null;
  description: string | null;
  product_category: string | null;
  product_variant: string | null;
  product_type: string | null;
  usage_types: string[] | null;
  milk_breed: string | null;
  bulk_order_enabled: boolean;
  quantity_value: number | null;
  quantity_unit: string | null;
  price: number;
  status: string;
};

function normalize(value: string | null | undefined) {
  return String(value ?? '').trim().toLowerCase().replace(/[_-]+/g, ' ');
}

function upper(value: string | null | undefined) {
  return String(value ?? '').trim().toUpperCase();
}

/**
 * Customer discovery rules:
 * - MILK: source COW/BUFFALO/MIXED is a customer filter.
 * - PREMIUM_MILK: source is required; breed is an additional filter.
 * - Non-milk products: ORIGINAL is for HOME/GYM; MIXED is for SHOP.
 * - Only explicitly listed/active products match. No demo or inferred inventory.
 */
function matchesProduct(
  product: ProductRow,
  requestedCategory?: string,
  requestedUsage?: string,
  requestedSource?: string,
  requestedVariant?: string,
  requestedBreed?: string,
) {
  const category = upper(product.product_category);
  const requested = upper(requestedCategory);
  const usage = upper(requestedUsage).replace(/\s+/g, '_');
  const source = upper(requestedSource);
  const variant = upper(requestedVariant);
  const breed = normalize(requestedBreed);

  // Backward compatibility while legacy products are being classified in Admin.
  const legacyName = normalize(product.name);
  const effectiveCategory = category || (legacyName.includes('milk') ? 'MILK' : '');
  if (requested && effectiveCategory !== requested) return false;

  if (usage && !((product.usage_types ?? []).map(upper)).includes(usage)) return false;

  if (source) {
    if (upper(product.product_type) !== source) return false;
  }

  if (variant && upper(product.product_variant) !== variant) return false;

  if (breed && normalize(product.milk_breed) !== breed) return false;

  return true;
}

export async function findActiveDairywalas(
  location: CustomerLocation,
  requestedCategory?: string,
  requestedUsage?: string,
  requestedSource?: string,
  requestedVariant?: string,
  requestedBreed?: string,
): Promise<DairywalaSummary[]> {
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

  const { data: profiles, error: profileError } = await supabase
    .from('dairywala_profiles')
    .select('id,business_name,phone,locality,families_served,years_in_business,profile_avatar')
    .in('id', ids)
    .eq('status', 'ACTIVE');
  if (profileError) throw profileError;
  if (!profiles?.length) return [];

  const activeIds = profiles.map((profile) => profile.id);

  const { data: slots, error: slotError } = await supabase
    .from('dairywala_delivery_slots')
    .select('dairywala_id,slot_code,active')
    .in('dairywala_id', activeIds)
    .eq('active', true);
  if (slotError) throw slotError;

  const { data: products, error: productError } = await supabase
    .from('products')
    .select('id,dairywala_id,name,description,product_category,product_variant,product_type,usage_types,milk_breed,bulk_order_enabled,quantity_value,quantity_unit,price,status')
    .in('dairywala_id', activeIds)
    .eq('status', 'ACTIVE');
  if (productError) throw productError;

  const productRows = (products ?? []) as ProductRow[];
  const productFilteredIds = new Set(
    activeIds.filter((id) =>
      productRows.some((product) =>
        product.dairywala_id === id &&
        matchesProduct(product, requestedCategory, requestedUsage, requestedSource, requestedVariant, requestedBreed)
      )
    )
  );

  return (profiles as ProfileRow[])
    .filter((profile) => productFilteredIds.has(profile.id))
    .map((profile) => {
      const dairywalaSlots = (slots ?? []).filter((slot) => slot.dairywala_id === profile.id);
      const normalizedSlots = dairywalaSlots.map((slot) => upper(slot.slot_code));
      return {
        id: profile.id,
        businessName: profile.business_name,
        locality: profile.locality ?? '',
        phone: profile.phone,
        familiesServed: profile.families_served,
        yearsInBusiness: profile.years_in_business,
        profileAvatar: profile.profile_avatar || '👨',
        morningSlotAvailable: normalizedSlots.includes('MORNING'),
        eveningSlotAvailable: normalizedSlots.includes('EVENING'),
      };
    });
}

export async function findMatchingProducts(
  dairywalaId: string,
  requestedCategory?: string,
  requestedUsage?: string,
  requestedSource?: string,
  requestedVariant?: string,
  requestedBreed?: string,
): Promise<DairywalaProductMatch[]> {
  const { data, error } = await supabase
    .from('products')
    .select('id,dairywala_id,name,description,product_category,product_variant,product_type,usage_types,milk_breed,bulk_order_enabled,quantity_value,quantity_unit,price')
    .eq('dairywala_id', dairywalaId)
    .eq('status', 'ACTIVE');
  if (error) throw error;
  return ((data ?? []) as ProductRow[])
    .filter((p) => matchesProduct(p, requestedCategory, requestedUsage, requestedSource, requestedVariant, requestedBreed))
    .map((p) => ({
      id: p.id,
      dairywalaId: p.dairywala_id,
      name: p.name ?? '',
      description: p.description,
      productCategory: p.product_category,
      productVariant: upper(p.product_variant) || null,
      productType: p.product_type,
      usageTypes: p.usage_types ?? [],
      milkBreed: p.milk_breed,
      bulkOrderEnabled: p.bulk_order_enabled,
      quantityValue: p.quantity_value,
      quantityUnit: p.quantity_unit,
      price: Number(p.price),
    }));
}
