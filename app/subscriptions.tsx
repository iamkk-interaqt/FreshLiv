import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getMySubscriptions, setSubscriptionStatus, type SubscriptionRow } from '../src/services/subscriptions';

export default function SubscriptionsScreen() {
  const [items, setItems] = useState<SubscriptionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try { setError(''); setItems(await getMySubscriptions()); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not load subscriptions.'); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const change = async (id: string, status: 'ACTIVE' | 'PAUSED' | 'SKIPPED' | 'CANCELLED') => {
    try { setBusy(id); await setSubscriptionStatus(id, status); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not update subscription.'); }
    finally { setBusy(null); }
  };

  return <ScrollView style={styles.container} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}>
    <Text style={styles.eyebrow}>GWALAWALA</Text><Text style={styles.title}>My subscriptions</Text>
    {loading ? <ActivityIndicator /> : null}
    {error ? <View style={styles.error}><Text>{error}</Text></View> : null}
    {!loading && items.length === 0 && !error ? <View style={styles.empty}><Text style={styles.emptyTitle}>No subscriptions yet</Text><Text style={styles.muted}>Choose a Dairywala and product to start recurring delivery.</Text></View> : null}
    {items.map(s => <View key={s.id} style={styles.card}>
      <View style={styles.row}><Text style={styles.id}>Subscription {s.id.slice(0, 8)}</Text><Text style={styles.status}>{s.status}</Text></View>
      <Text style={styles.muted}>Frequency: {s.frequency}</Text><Text style={styles.muted}>Starts: {s.start_date}</Text>
      <View style={styles.actions}>
        {s.status === 'ACTIVE' ? <TouchableOpacity disabled={busy === s.id} style={styles.button} onPress={() => change(s.id, 'PAUSED')}><Text>Pause</Text></TouchableOpacity> : null}
        {s.status === 'PAUSED' ? <TouchableOpacity disabled={busy === s.id} style={styles.button} onPress={() => change(s.id, 'ACTIVE')}><Text>Resume</Text></TouchableOpacity> : null}
        {s.status === 'ACTIVE' ? <TouchableOpacity disabled={busy === s.id} style={styles.button} onPress={() => change(s.id, 'SKIPPED')}><Text>Skip</Text></TouchableOpacity> : null}
        {s.status !== 'CANCELLED' ? <TouchableOpacity disabled={busy === s.id} style={styles.danger} onPress={() => change(s.id, 'CANCELLED')}><Text>Cancel</Text></TouchableOpacity> : null}
      </View>
    </View>)}
  </ScrollView>;
}

const styles = StyleSheet.create({ container:{flex:1,backgroundColor:'#fff'}, content:{padding:24,paddingTop:64,paddingBottom:40}, eyebrow:{fontSize:11,fontWeight:'800',letterSpacing:1.5,color:'#777'}, title:{marginTop:6,marginBottom:24,fontSize:32,fontWeight:'800'}, empty:{padding:24,borderWidth:1,borderColor:'#e5e5e5',borderRadius:16}, emptyTitle:{fontSize:19,fontWeight:'800'}, muted:{marginTop:6,color:'#777'}, error:{padding:14,backgroundColor:'#fff0f0',borderRadius:12,marginBottom:14}, card:{padding:18,borderWidth:1,borderColor:'#e5e5e5',borderRadius:16,marginBottom:12}, row:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}, id:{fontSize:16,fontWeight:'800'}, status:{fontSize:11,fontWeight:'800'}, actions:{flexDirection:'row',gap:8,marginTop:16}, button:{paddingHorizontal:14,paddingVertical:10,borderWidth:1,borderColor:'#ddd',borderRadius:10}, danger:{paddingHorizontal:14,paddingVertical:10,borderWidth:1,borderColor:'#e4aaaa',borderRadius:10}
});
