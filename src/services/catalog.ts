import { supabase } from '../lib/supabase';
import type { CustomerLocation } from '../types/marketplace';

export type CatalogProduct = {
  key: string;
  label: string;
  emoji: string;
};

const EMOJI_BY_KEY: Record<string, string> = {
  milk: '🥛',
  paneer: '🧀',
  curd: '🥣',
  butter: '🧈',
  ghee: '🫙',
  khoya: '🍬',
  mawa: '🍬',
};

function normalize(value: string | null | undefined) {
  return String(value ?? '').trim().toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ');
}

function toKey(name: string) {
  return normalize(name).replace(/\s*\/\s*/g, '-').replace(/\s+/g, '-');
}

function toLabel(name: string) {
  return name.trim().replace(/\s+/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

export async function findAvailableCustomerProducts(location: CustomerLocation): Promise<CatalogProduct[]> {
  const postalCode = location.postalCode?.trim();
  const locality = location.locality?.trim();
  if (!postalCode && !locality) return [];

  let areas: { dairywala_id: string }[] = [];
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

  const dairywalaIds = [...new Set(areas.map((row) => row.dairywala_id))];
  if (!dairywalaIds.length) return [];

  const { data: activeDairywalas, error: dairywalaError } = await supabase
    .from('dairywala_profiles')
    .select('id')
    .in('id', dairywalaIds)
    .eq('status', 'ACTIVE');
  if (dairywalaError) throw dairywalaError;
  const activeIds = (activeDairywalas ?? []).map((row) => row.id);
  if (!activeIds.length) return [];

  const { data, error } = await supabase
    .from('products')
    .select('name')
    .in('dairywala_id', activeIds)
    .eq('status', 'ACTIVE')
    .not('name', 'is', null)
    .order('name');
  if (error) throw error;

  const seen = new Set<string>();
  const result: CatalogProduct[] = [];
  for (const row of data ?? []) {
    const rawName = String(row.name ?? '').trim();
    const key = toKey(rawName);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    const normalized = normalize(rawName);
    const emojiKey = Object.keys(EMOJI_BY_KEY).find((candidate) => normalized === candidate || normalized.includes(candidate));
    result.push({ key, label: toLabel(rawName), emoji: emojiKey ? EMOJI_BY_KEY[emojiKey] : '🛒' });
  }
  return result;
}
