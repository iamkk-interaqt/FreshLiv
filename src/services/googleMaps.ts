import { supabase } from '../lib/supabase';

export type PlaceSuggestion = {
  id: string;
  name: string;
  formattedAddress: string;
  location: { latitude: number; longitude: number };
};

export type RouteResult = {
  distanceMeters: number;
  durationSeconds: number;
  encodedPolyline?: string;
};

async function invoke<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke('google-maps', { body });
  if (error) throw error;
  return data as T;
}

export const mapsApi = {
  searchPlaces: (textQuery: string) => invoke<PlaceSuggestion[]>({ action: 'search_places', textQuery }),
  reverseGeocode: (latitude: number, longitude: number) =>
    invoke<{ formattedAddress: string | null }>({ action: 'reverse_geocode', latitude, longitude }),
  route: (origin: { latitude: number; longitude: number }, destination: { latitude: number; longitude: number }) =>
    invoke<RouteResult>({ action: 'route', origin, destination }),
};
