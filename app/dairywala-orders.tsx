import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { advanceSellerOrder, getSellerOrders, type OrderRow } from '../src/services/orderManagement';

const ACTION_LABEL: Record<string, string> = {
  CONFIRMED: 'Accept order',
  ACCEPTED: 'Start fulfilling',
  FULFILLING: 'Mark out for delivery',
  OUT_FOR_DELIVERY: 'Mark delivered',
  DELIVERED: 'Complete order',
};

export default function SellerOrdersScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setError('');
      setOrders(await getSellerOrders());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load orders.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function advance(order: OrderRow) {
    try {
      setBusyId(order.id);
      await advanceSellerOrder(order);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update the order.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>SELLER</Text>
          <Text style={styles.title}>Orders</Text>
        </View>
        <Pressable onPress={() => router.back()}><Text style={styles.back}>Back</Text></Pressable>
      </View>

      {loading ? <View style={styles.center}><ActivityIndicator /></View> : null}
      {error ? <View style={styles.error}><Text style={styles.errorText}>{error}</Text></View> : null}
      {!loading && !error && orders.length === 0 ? (
        <View style={styles.empty}><Text style={styles.emptyTitle}>No orders yet</Text><Text style={styles.muted}>New customer orders will appear here.</Text></View>
      ) : null}

      {orders.map((order) => (
        <View key={order.id} style={styles.card}>
          <View style={styles.row}>
            <View style={styles.grow}>
              <Text style={styles.orderId}>Order {order.id.slice(0, 8)}</Text>
              <Text style={styles.muted}>{new Date(order.created_at).toLocaleString()}</Text>
            </View>
            <Text style={styles.status}>{order.status.replaceAll('_', ' ')}</Text>
          </View>
          <Text style={styles.amount}>₹{Number(order.total_amount).toFixed(2)}</Text>
          <Text style={styles.muted}>Subtotal ₹{Number(order.subtotal).toFixed(2)} · Delivery ₹{Number(order.delivery_fee).toFixed(2)}</Text>
          {ACTION_LABEL[order.status] ? (
            <Pressable disabled={busyId === order.id} style={styles.button} onPress={() => advance(order)}>
              {busyId === order.id ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{ACTION_LABEL[order.status]}</Text>}
            </Pressable>
          ) : null}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 24, paddingTop: 64, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5, color: '#777' },
  title: { marginTop: 5, fontSize: 32, fontWeight: '800' },
  back: { fontWeight: '700' },
  center: { padding: 40, alignItems: 'center' },
  error: { padding: 14, borderRadius: 12, backgroundColor: '#fff0f0', marginBottom: 14 },
  errorText: { color: '#9b1c1c' },
  empty: { padding: 24, borderWidth: 1, borderColor: '#e5e5e5', borderRadius: 16 },
  emptyTitle: { fontSize: 19, fontWeight: '750' },
  muted: { marginTop: 5, color: '#777' },
  card: { padding: 18, borderWidth: 1, borderColor: '#e5e5e5', borderRadius: 16, marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  grow: { flex: 1 },
  orderId: { fontSize: 16, fontWeight: '750' },
  status: { fontSize: 11, fontWeight: '800', paddingHorizontal: 9, paddingVertical: 6, borderRadius: 9, backgroundColor: '#f2f2f2' },
  amount: { marginTop: 16, fontSize: 23, fontWeight: '800' },
  button: { marginTop: 16, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#111' },
  buttonText: { color: '#fff', fontWeight: '750' },
});
