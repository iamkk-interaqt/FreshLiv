import { supabase } from '../lib/supabase';
import { getCurrentUserId } from './orderManagement';

export type RouteRow = {
  id: string;
  dairywala_id: string;
  delivery_slot_id: string | null;
  route_date: string;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  created_at: string;
  updated_at: string;
};

export type RouteStopRow = {
  id: string;
  route_id: string;
  order_id: string;
  stop_sequence: number;
  status: 'PENDING' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'FAILED' | 'SKIPPED';
  delivered_at: string | null;
  note: string | null;
};

async function getDairywalaId() {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from('dairywala_profiles')
    .select('id')
    .eq('owner_user_id', userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('Dairywala profile not found.');
  return data.id as string;
}

export async function getDairywalaRoutes(date?: string) {
  const dairywalaId = await getDairywalaId();
  let query = supabase
    .from('routes')
    .select('id,dairywala_id,delivery_slot_id,route_date,status,created_at,updated_at')
    .eq('dairywala_id', dairywalaId)
    .order('route_date', { ascending: false });
  if (date) query = query.eq('route_date', date);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as RouteRow[];
}

export async function getRouteStops(routeId: string) {
  const { data, error } = await supabase
    .from('route_stops')
    .select('id,route_id,order_id,stop_sequence,status,delivered_at,note')
    .eq('route_id', routeId)
    .order('stop_sequence', { ascending: true });
  if (error) throw error;
  return (data ?? []) as RouteStopRow[];
}

export async function generateRoute(deliverySlotId: string, routeDate: string) {
  const dairywalaId = await getDairywalaId();
  const { data, error } = await supabase.rpc('generate_dairywala_route', {
    p_dairywala_id: dairywalaId,
    p_delivery_slot_id: deliverySlotId,
    p_route_date: routeDate,
  });
  if (error) throw error;
  return data as string;
}

export async function setRouteStatus(routeId: string, status: RouteRow['status']) {
  const { data, error } = await supabase.rpc('set_route_status', {
    p_route_id: routeId,
    p_status: status,
  });
  if (error) throw error;
  return data as string;
}

export async function markStopOutForDelivery(stopId: string) {
  const { data, error } = await supabase.rpc('mark_route_stop_out_for_delivery', {
    p_stop_id: stopId,
  });
  if (error) throw error;
  return data as string;
}

export async function markStopDelivered(stopId: string, note?: string) {
  const { data, error } = await supabase.rpc('mark_route_stop_delivered', {
    p_stop_id: stopId,
    p_note: note ?? null,
  });
  if (error) throw error;
  return data as string;
}
