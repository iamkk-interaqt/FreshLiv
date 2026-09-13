import type { CustomerLocation, DairywalaSummary } from '../types/marketplace';

/**
 * Backend boundary for customer discovery.
 *
 * This intentionally returns no local/demo records. Once Supabase is provisioned,
 * this function will query only Dairywalas that are ACTIVE and serve the location.
 */
export async function findActiveDairywalas(
  _location: CustomerLocation,
): Promise<DairywalaSummary[]> {
  return [];
}
