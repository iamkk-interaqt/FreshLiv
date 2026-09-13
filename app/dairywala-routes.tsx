import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getDairywalaRoutes, getRouteStops, markStopDelivered, markStopOutForDelivery, setRouteStatus, RouteRow, RouteStopRow } from '../src/services/routeManagement';

export default function DairywalaRoutesScreen() {
  const [routes, setRoutes] = useState<RouteRow[]>([]);
  const [selected, setSelected] = useState<RouteRow | null>(null);
  const [stops, setStops] = useState<RouteStopRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const rows = await getDairywalaRoutes();
      setRoutes(rows);
      if (selected) {
        const current = rows.find(r => r.id === selected.id) ?? null;
        setSelected(current);
        if (current) setStops(await getRouteStops(current.id));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load routes.');
    } finally { setLoading(false); }
  }, [selected]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function openRoute(route: RouteRow) {
    setSelected(route);
    try { setStops(await getRouteStops(route.id)); }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to load stops.'); }
  }

  async function action(key: string, fn: () => Promise<unknown>) {
    try { setWorking(key); setError(null); await fn(); await load(); if (selected) setStops(await getRouteStops(selected.id)); }
    catch (e) { setError(e instanceof Error ? e.message : 'Action failed.'); }
    finally { setWorking(null); }
  }

  if (loading) return <View style={styles.center}><ActivityIndicator /></View>;

  if (selected) return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={false} onRefresh={load} />}>
      <Pressable onPress={() => setSelected(null)}><Text style={styles.back}>‹ Routes</Text></Pressable>
      <Text style={styles.title}>Delivery Route</Text>
      <Text style={styles.muted}>{selected.route_date} · {selected.status}</Text>
      {error && <Text style={styles.error}>{error}</Text>}
      <View style={styles.actions}>
        {selected.status === 'PLANNED' && <Pressable style={styles.primary} onPress={() => action('start', () => setRouteStatus(selected.id, 'IN_PROGRESS'))}><Text style={styles.primaryText}>{working === 'start' ? 'Starting…' : 'Start route'}</Text></Pressable>}
        {selected.status === 'IN_PROGRESS' && <Pressable style={styles.primary} onPress={() => action('complete', () => setRouteStatus(selected.id, 'COMPLETED'))}><Text style={styles.primaryText}>{working === 'complete' ? 'Completing…' : 'Complete route'}</Text></Pressable>}
      </View>
      {stops.length === 0 ? <View style={styles.empty}><Text>No stops on this route yet.</Text><Text style={styles.muted}>Generate a route after eligible orders are available.</Text></View> : stops.map(stop => (
        <View key={stop.id} style={styles.card}>
          <View style={styles.row}><Text style={styles.sequence}>#{stop.stop_sequence}</Text><View style={{flex:1}}><Text style={styles.order}>Order {stop.order_id.slice(0, 8)}</Text><Text style={styles.muted}>{stop.status.replaceAll('_', ' ')}</Text></View></View>
          {stop.status === 'PENDING' && selected.status === 'IN_PROGRESS' && <Pressable style={styles.secondary} onPress={() => action(stop.id, () => markStopOutForDelivery(stop.id))}><Text>Start delivery</Text></Pressable>}
          {stop.status === 'OUT_FOR_DELIVERY' && <Pressable style={styles.primary} onPress={() => action(stop.id, () => markStopDelivered(stop.id))}><Text style={styles.primaryText}>{working === stop.id ? 'Saving…' : 'Mark delivered'}</Text></Pressable>}
          {stop.status === 'DELIVERED' && <Text style={styles.success}>✓ Delivered</Text>}
        </View>
      ))}
    </ScrollView>
  );

  return <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={false} onRefresh={load} />}>
    <Text style={styles.title}>Routes</Text>
    <Text style={styles.muted}>Your real delivery routes and stops</Text>
    {error && <Text style={styles.error}>{error}</Text>}
    {routes.length === 0 ? <View style={styles.empty}><Text>No routes yet.</Text><Text style={styles.muted}>Routes are generated from your eligible orders.</Text></View> : routes.map(route => (
      <Pressable key={route.id} style={styles.card} onPress={() => openRoute(route)}>
        <View style={styles.row}><View style={{flex:1}}><Text style={styles.order}>{route.route_date}</Text><Text style={styles.muted}>Slot: {route.delivery_slot_id ? route.delivery_slot_id.slice(0,8) : '—'}</Text></View><Text style={styles.badge}>{route.status}</Text></View>
      </Pressable>
    ))}
  </ScrollView>;
}

const styles = StyleSheet.create({container:{flex:1,padding:20,backgroundColor:'#fff'},center:{flex:1,alignItems:'center',justifyContent:'center'},title:{fontSize:28,fontWeight:'700',marginBottom:6},muted:{color:'#6b7280',marginTop:3},back:{fontSize:17,marginBottom:18},error:{color:'#b91c1c',marginVertical:12},actions:{marginVertical:16},card:{padding:16,borderWidth:1,borderColor:'#e5e7eb',borderRadius:14,marginTop:12,gap:12},row:{flexDirection:'row',alignItems:'center',gap:12},order:{fontSize:16,fontWeight:'600'},sequence:{fontSize:18,fontWeight:'700',width:36},badge:{fontSize:12,fontWeight:'700'},primary:{backgroundColor:'#111827',padding:13,borderRadius:10,alignItems:'center',marginTop:10},primaryText:{color:'#fff',fontWeight:'700'},secondary:{borderWidth:1,borderColor:'#d1d5db',padding:12,borderRadius:10,alignItems:'center',marginTop:10},success:{color:'#15803d',fontWeight:'700',marginTop:8},empty:{paddingVertical:50,alignItems:'center',gap:8}});
