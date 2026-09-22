import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { CFPaymentGatewayService } from 'react-native-cashfree-pg-sdk';
import { CFEnvironment, CFSession } from 'cashfree-pg-api-contract';
import { getCartItems, getCartTotal, clearCart, getPurchaseContext } from '../src/services/cart';
import { saveCustomerAddress, createPendingOrder } from '../src/services/checkout';
import { createCashfreePaymentOrder, verifyCashfreePayment } from '../src/services/cashfree';
import { supabase } from '../src/lib/supabase';
import { useAuth } from '../src/auth/AuthProvider';

type DeliverySlot = { id: string; code: string };
type PendingPayment = { orderId: string; cashfreeOrderId: string };

export default function CheckoutScreen() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const items = getCartItems();
  const total = getCartTotal();
  const purchaseContext = getPurchaseContext();
  const businessBulkFee = purchaseContext.customerType==='BUSINESS' && purchaseContext.orderType==='ONE_TIME_BULK' ? 99 : 0;
  const dairywalaIds = [...new Set(items.map((item) => item.dairywalaId).filter(Boolean))];
  const dairywalaId = dairywalaIds[0] ?? '';
  const pendingPayment = useRef<PendingPayment | null>(null);

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [addressId, setAddressId] = useState('');
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [slots, setSlots] = useState<DeliverySlot[]>([]);
  const [addressLine1, setAddressLine1] = useState('');
  const [locality, setLocality] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [plusActive, setPlusActive] = useState(false);
  const [bulkFee, setBulkFee] = useState(99);

  useEffect(() => {
    CFPaymentGatewayService.setCallback({
      onVerify: async (orderID: string) => {
        const payment = pendingPayment.current;
        if (!payment || payment.cashfreeOrderId !== orderID) return;
        try {
          setLoading(true);
          await verifyCashfreePayment(payment.orderId, payment.cashfreeOrderId);
          clearCart();
          pendingPayment.current = null;
          router.replace({ pathname: '/order-confirmed', params: { id: payment.orderId } });
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Payment verification failed. Your order remains pending until payment is verified.');
        } finally {
          setLoading(false);
        }
      },
      onError: (_paymentError: unknown, orderID: string) => {
        if (pendingPayment.current?.cashfreeOrderId === orderID) {
          setError(`Payment was not completed for order ${pendingPayment.current.orderId.slice(0, 8)}. You can try again.`);
        }
        pendingPayment.current = null;
        setLoading(false);
      },
    });
    return () => CFPaymentGatewayService.removeCallback();
  }, [router]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setCheckingAuth(false); return; }
    let cancelled = false;
    (async () => {
      try {
        const { data: address } = await supabase
          .from('customer_addresses')
          .select('id,address_line1,locality,city,state,postal_code')
          .eq('customer_id', user.id)
          .eq('is_default', true)
          .maybeSingle();
        if (cancelled) return;
        const [{ data: plus }, { data: fee }] = await Promise.all([
          supabase.from('business_subscriptions').select('status,expires_at').eq('customer_id', user.id).eq('status','ACTIVE').maybeSingle(),
          supabase.rpc('get_monetization_amount',{p_key:'bulk_one_time_fee'}),
        ]);
        if (plus?.status === 'ACTIVE' && (!plus.expires_at || new Date(plus.expires_at) > new Date())) setPlusActive(true);
        setBulkFee(Number(fee ?? 99));
        if (address) {
          setAddressId(address.id); setAddressLine1(address.address_line1); setLocality(address.locality);
          setCity(address.city); setState(address.state); setPostalCode(address.postal_code);
        }
        if (dairywalaIds.length > 1) setError('Your cart contains products from different Dairywalas. Please checkout one Dairywala at a time.');
        else if (dairywalaId) {
          const { data: deliverySlots } = await supabase
            .from('dairywala_delivery_slots')
            .select('id,slot_code')
            .eq('dairywala_id', dairywalaId)
            .eq('active', true)
            .order('slot_code');
          if (!cancelled) setSlots((deliverySlots ?? []).map((row) => ({ id: row.id, code: row.slot_code })));
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Unable to load checkout.');
      } finally {
        if (!cancelled) setCheckingAuth(false);
      }
    })();
    return () => { cancelled = true; };
  }, [authLoading, user, dairywalaId, dairywalaIds.length]);

  if (authLoading || checkingAuth) return <View style={styles.center}><ActivityIndicator /><Text style={styles.muted}>Checking sign in…</Text></View>;
  if (!user) return <View style={styles.container}><Text style={styles.eyebrow}>CHECKOUT</Text><Text style={styles.title}>Sign in required</Text><Text style={styles.body}>Sign in with your mobile number before adding your delivery address and placing an order.</Text><Pressable style={styles.button} onPress={() => router.push('/customer-auth')}><Text style={styles.buttonText}>Sign in with OTP</Text></Pressable></View>;
  if (!items.length) return <View style={styles.container}><Text style={styles.title}>Your cart is empty</Text><Pressable style={styles.button} onPress={() => router.back()}><Text style={styles.buttonText}>Back</Text></Pressable></View>;

  async function placeOrder() {
    if (dairywalaIds.length !== 1) { setError('Checkout requires products from one Dairywala only.'); return; }
    setLoading(true); setError('');
    try {
      if (!selectedSlotId) throw new Error('Select a delivery slot.');
      let savedAddressId = addressId;
      if (!savedAddressId) {
        if (!addressLine1 || !locality || !city || !state || !postalCode) throw new Error('Complete your delivery address.');
        savedAddressId = await saveCustomerAddress({ label: 'Home', addressLine1, locality, city, state, postalCode });
      }
      const orderId = await createPendingOrder(dairywalaId, savedAddressId, selectedSlotId, items);
      const payment = await createCashfreePaymentOrder(orderId);
      pendingPayment.current = { orderId, cashfreeOrderId: payment.cashfreeOrderId };
      const environment = payment.environment === 'PRODUCTION' ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX;
      CFPaymentGatewayService.doWebPayment(new CFSession(payment.paymentSessionId, payment.cashfreeOrderId, environment));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to start payment.');
      pendingPayment.current = null;
      setLoading(false);
    }
  }

  return <ScrollView contentContainerStyle={styles.container}>
    <Pressable onPress={() => router.back()}><Text style={styles.back}>← Back</Text></Pressable>
    <Text style={styles.eyebrow}>CHECKOUT</Text><Text style={styles.title}>Delivery details</Text>
    <Text style={styles.section}>Address</Text>
    <TextInput style={styles.input} placeholder="Address line" value={addressLine1} onChangeText={setAddressLine1}/>
    <TextInput style={styles.input} placeholder="Locality" value={locality} onChangeText={setLocality}/>
    <TextInput style={styles.input} placeholder="City" value={city} onChangeText={setCity}/>
    <TextInput style={styles.input} placeholder="State" value={state} onChangeText={setState}/>
    <TextInput style={styles.input} placeholder="PIN code" keyboardType="number-pad" value={postalCode} onChangeText={setPostalCode}/>
    <Text style={styles.section}>Delivery slot</Text>
    <View style={styles.slotRow}>{slots.map((entry) => <Pressable key={entry.id} onPress={() => setSelectedSlotId(entry.id)} style={[styles.slot, selectedSlotId === entry.id && styles.slotSelected]}><Text style={selectedSlotId === entry.id ? styles.slotSelectedText : styles.slotText}>{entry.code}</Text></Pressable>)}</View>
    {!slots.length ? <Text style={styles.muted}>No delivery slot is currently available for this Dairywala.</Text> : null}
    {error ? <Text style={styles.error}>{error}</Text> : null}
    <View style={styles.summary}>
      <View>
        <Text style={styles.summaryTitle}>Order summary</Text>
        {purchaseContext.customerType==='BUSINESS' ? <Text style={styles.fee}>{purchaseContext.orderType==='RECURRING_BULK' && plusActive ? '⭐ FreshLiv Plus · Service fee ₹0' : `Bulk convenience fee · ₹${purchaseContext.orderType==='ONE_TIME_BULK' ? bulkFee : bulkFee}`}</Text> : null}
        <Text style={styles.totalLabel}>Products</Text>
        <Text style={styles.total}>₹{total.toFixed(2)}</Text>
      </View>
      <View><Text style={styles.totalLabel}>Service fee</Text><Text style={styles.total}>{purchaseContext.customerType==='BUSINESS' && purchaseContext.orderType==='RECURRING_BULK' && plusActive ? '₹0' : purchaseContext.customerType==='BUSINESS' ? `₹${purchaseContext.orderType==='ONE_TIME_BULK' ? bulkFee : bulkFee}` : '₹0'}</Text></View>
    </View>
    <Pressable style={styles.button} disabled={loading || !selectedSlotId || dairywalaIds.length !== 1} onPress={placeOrder}>{loading ? <ActivityIndicator color="#fff"/> : <Text style={styles.buttonText}>Continue to payment</Text>}</Pressable>
  </ScrollView>;
}

const styles = StyleSheet.create({
  container: { padding:24, paddingTop:56, paddingBottom:48, backgroundColor:'#fff', flexGrow:1 },
  center: { flex:1, alignItems:'center', justifyContent:'center', gap:12, backgroundColor:'#fff' },
  muted: { color:'#777', marginTop:8 }, back: { fontSize:15, fontWeight:'700', marginBottom:28 },
  eyebrow: { fontSize:12, fontWeight:'800', letterSpacing:1.5, color:'#777' }, title: { marginTop:9, fontSize:31, fontWeight:'800' }, body:{marginTop:12,color:'#666',fontSize:16,lineHeight:23},
  section:{marginTop:25,marginBottom:9,fontSize:18,fontWeight:'800'}, input:{height:52,borderWidth:1,borderColor:'#ddd',borderRadius:13,paddingHorizontal:15,fontSize:15,marginBottom:10},
  slotRow:{flexDirection:'row',gap:10,flexWrap:'wrap'}, slot:{paddingVertical:13,paddingHorizontal:18,borderRadius:13,borderWidth:1,borderColor:'#ddd'}, slotSelected:{backgroundColor:'#111',borderColor:'#111'}, slotText:{fontWeight:'700'}, slotSelectedText:{color:'#fff',fontWeight:'700'},
  error:{marginTop:14,color:'#b00020',lineHeight:20}, summary:{marginTop:24,padding:18,borderWidth:1,borderColor:'#e5e5e5',borderRadius:15,flexDirection:'row',justifyContent:'space-between',gap:20}, summaryTitle:{fontWeight:'700'}, totalLabel:{marginTop:8,color:'#777',fontSize:12}, total:{fontSize:21,fontWeight:'800'}, fee:{marginTop:7,color:'#555',fontSize:13},
  button:{marginTop:18,minHeight:54,borderRadius:14,alignItems:'center',justifyContent:'center',backgroundColor:'#111'}, buttonText:{color:'#fff',fontSize:16,fontWeight:'700'}
});
