import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { getCustomerOrders, type OrderRow } from '../src/services/orderManagement';

export default function CustomerOrdersScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try { setError(''); setOrders(await getCustomerOrders()); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not load orders.'); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}>
      <Text style={styles.eyebrow}>GWALAWALA</Text><Text style={styles.title}>My orders</Text>
      {loading ? <View style={styles.center}><ActivityIndicator /></View> : null}
      {error ? <View style={styles.error}><Text style={styles.errorText}>{error}</Text></View> : null}
      {!loading && !error && orders.length === 0 ? <View style={styles.empty}><Text style={styles.emptyTitle}>No orders yet</Text><Text style={styles.muted}>Your completed and active orders will appear here.</Text></View> : null}
      {orders.map((order) => (
        <Pressable key={order.id} style={styles.card} onPress={() => router.push({ pathname: '/order-tracking', params: { id: order.id } })}>
          <View style={styles.row}><Text style={styles.orderId}>Order {order.id.slice(0, 8)}</Text><Text style={styles.status}>{order.status.replaceAll('_', ' ')}</Text></View>
          <Text style={styles.amount}>₹{Number(order.total_amount).toFixed(2)}</Text>
          <Text style={styles.muted}>{new Date(order.created_at).toLocaleString()}</Text>
          <Text style={styles.timeline}>Tap to track this order →</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:{flex:1,backgroundColor:'#fff'},content:{padding:24,paddingTop:64,paddingBottom:40},eyebrow:{fontSize:11,fontWeight:'800',letterSpacing:1.5,color:'#777'},title:{marginTop:6,marginBottom:24,fontSize:32,fontWeight:'800'},center:{padding:40,alignItems:'center'},error:{padding:14,borderRadius:12,backgroundColor:'#fff0f0',marginBottom:14},errorText:{color:'#9b1c1c'},empty:{padding:24,borderWidth:1,borderColor:'#e5e5e5',borderRadius:16},emptyTitle:{fontSize:19,fontWeight:'750'},muted:{marginTop:5,color:'#777'},card:{padding:18,borderWidth:1,borderColor:'#e5e5e5',borderRadius:16,marginBottom:12},row:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},orderId:{fontSize:16,fontWeight:'750'},status:{fontSize:11,fontWeight:'800',paddingHorizontal:9,paddingVertical:6,borderRadius:9,backgroundColor:'#f2f2f2'},amount:{marginTop:16,fontSize:23,fontWeight:'800'},timeline:{marginTop:14,fontSize:13,color:'#555',fontWeight:'700'}
});
