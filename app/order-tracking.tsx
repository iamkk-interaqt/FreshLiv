import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../src/lib/supabase';

type Order = { id:string; status:string; total_amount:number; created_at:string; updated_at:string; delivery_slot_id:string };
type History = { id:string; from_status:string|null; to_status:string; created_at:string; note:string|null };

const STEPS = [
  ['PAYMENT_PENDING', 'Payment pending', 'Complete payment to confirm the order.'],
  ['CONFIRMED', 'Order confirmed', 'Payment is verified and your Dairywala has been notified.'],
  ['ACCEPTED', 'Accepted', 'Your Dairywala has accepted the order.'],
  ['FULFILLING', 'Being prepared', 'Your order is being prepared.'],
  ['OUT_FOR_DELIVERY', 'Out for delivery', 'Your Dairywala is on the delivery route.'],
  ['DELIVERED', 'Delivered', 'The order has been delivered.'],
  ['COMPLETED', 'Completed', 'Order completed.'],
];

function stepIndex(status: string) { return STEPS.findIndex(([key]) => key === status); }

export default function OrderTrackingScreen() {
  const router = useRouter();
  const { id = '' } = useLocalSearchParams<{ id?: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [history, setHistory] = useState<History[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!id) { setError('Order reference is missing.'); setLoading(false); return; }
    try {
      const { data: current, error: orderError } = await supabase
        .from('orders')
        .select('id,status,total_amount,created_at,updated_at,delivery_slot_id')
        .eq('id', String(id))
        .maybeSingle();
      if (orderError) throw orderError;
      if (!current) throw new Error('Order not found.');
      const { data: events, error: historyError } = await supabase
        .from('order_status_history')
        .select('id,from_status,to_status,created_at,note')
        .eq('order_id', String(id))
        .order('created_at', { ascending: true });
      if (historyError) throw historyError;
      setOrder(current as Order);
      setHistory((events ?? []) as History[]);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load order tracking.');
    } finally { setLoading(false); }
  }, [id]);

  useEffect(() => {
    load();
    const timer = setInterval(load, 5000);
    return () => clearInterval(timer);
  }, [load]);

  if (loading) return <View style={styles.center}><ActivityIndicator/><Text style={styles.muted}>Loading tracking…</Text></View>;
  if (error || !order) return <View style={styles.container}><Text style={styles.eyebrow}>ORDER TRACKING</Text><Text style={styles.title}>Unable to load</Text><Text style={styles.body}>{error || 'Order not found.'}</Text><Pressable style={styles.button} onPress={() => router.back()}><Text style={styles.buttonText}>Go back</Text></Pressable></View>;

  const currentIndex = stepIndex(order.status);
  const cancelled = order.status === 'CANCELLED';
  return <ScrollView contentContainerStyle={styles.container}>
    <Pressable onPress={() => router.back()}><Text style={styles.back}>← Back</Text></Pressable>
    <Text style={styles.eyebrow}>ORDER TRACKING</Text>
    <Text style={styles.title}>Order {order.id.slice(0,8)}</Text>
    <View style={styles.summary}><Text style={styles.status}>{order.status.replaceAll('_',' ')}</Text><Text style={styles.total}>₹{Number(order.total_amount).toFixed(2)}</Text></View>
    {cancelled ? <View style={styles.cancelled}><Text style={styles.cancelTitle}>Order cancelled</Text><Text style={styles.muted}>If payment was captured, refund handling will follow the marketplace payment process.</Text></View> : null}
    {!cancelled ? <View style={styles.timeline}>{STEPS.map(([key,label,description], index) => {
      const reached = currentIndex >= index;
      const event = history.find((item) => item.to_status === key);
      return <View key={key} style={styles.stepRow}>
        <View style={[styles.dot, reached && styles.dotReached]}><Text style={styles.dotText}>{reached ? '✓' : ''}</Text></View>
        <View style={styles.stepContent}><Text style={[styles.stepTitle, reached && styles.stepTitleReached]}>{label}</Text><Text style={styles.stepDescription}>{description}</Text>{event ? <Text style={styles.time}>{new Date(event.created_at).toLocaleString()}</Text> : null}</View>
      </View>;
    })}</View> : null}
    <View style={styles.note}><Text style={styles.noteTitle}>Delivery model</Text><Text style={styles.noteBody}>Your Dairywala handles the delivery route directly. There is no separate delivery rider in Gwalawala.</Text></View>
    <Pressable style={styles.button} onPress={() => router.replace('/customer-orders')}><Text style={styles.buttonText}>My orders</Text></Pressable>
  </ScrollView>;
}

const styles=StyleSheet.create({
  container:{padding:24,paddingTop:56,paddingBottom:48,backgroundColor:'#fff',flexGrow:1}, center:{flex:1,alignItems:'center',justifyContent:'center',gap:10,backgroundColor:'#fff'}, muted:{color:'#777',lineHeight:20},
  back:{fontSize:15,fontWeight:'700',marginBottom:28}, eyebrow:{fontSize:12,fontWeight:'800',letterSpacing:1.5,color:'#777'}, title:{marginTop:9,fontSize:31,fontWeight:'800'}, body:{marginTop:12,color:'#666',fontSize:16,lineHeight:23},
  summary:{marginTop:22,padding:18,borderRadius:16,borderWidth:1,borderColor:'#e5e5e5',flexDirection:'row',justifyContent:'space-between',alignItems:'center'}, status:{fontSize:12,fontWeight:'800'}, total:{fontSize:22,fontWeight:'800'},
  timeline:{marginTop:28}, stepRow:{flexDirection:'row',minHeight:88}, dot:{width:28,height:28,borderRadius:14,borderWidth:2,borderColor:'#ddd',alignItems:'center',justifyContent:'center',marginRight:14}, dotReached:{backgroundColor:'#111',borderColor:'#111'}, dotText:{color:'#fff',fontSize:13,fontWeight:'800'}, stepContent:{flex:1,paddingBottom:18}, stepTitle:{fontSize:16,fontWeight:'700',color:'#888'}, stepTitleReached:{color:'#111'}, stepDescription:{marginTop:4,color:'#777',lineHeight:19}, time:{marginTop:5,fontSize:11,color:'#999'},
  note:{marginTop:12,padding:17,borderRadius:15,backgroundColor:'#f7f7f7'}, noteTitle:{fontWeight:'800'}, noteBody:{marginTop:5,color:'#666',lineHeight:20}, cancelled:{marginTop:22,padding:17,borderRadius:15,borderWidth:1,borderColor:'#eee'},cancelTitle:{fontWeight:'800',marginBottom:5},
  button:{marginTop:22,minHeight:54,borderRadius:14,alignItems:'center',justifyContent:'center',backgroundColor:'#111'},buttonText:{color:'#fff',fontSize:16,fontWeight:'700'}
});
