import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { getCartItems, getCartTotal } from '../src/services/cart';
import { saveCustomerAddress, createPendingOrder } from '../src/services/checkout';
import { supabase } from '../src/lib/supabase';

export default function CheckoutScreen() {
  const router = useRouter();
  const items = getCartItems();
  const total = getCartTotal();
  const dairywalaId = items[0]?.dairywalaId ?? '';
  const [signedIn, setSignedIn] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [addressId, setAddressId] = useState('');
  const [slot, setSlot] = useState('');
  const [slots, setSlots] = useState<string[]>([]);
  const [addressLine1, setAddressLine1] = useState('');
  const [locality, setLocality] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { setCheckingAuth(false); return; }
      setSignedIn(true);
      const { data: address } = await supabase.from('customer_addresses').select('id,address_line1,locality,city,state,postal_code').eq('customer_id', data.user.id).eq('is_default', true).maybeSingle();
      if (address) {
        setAddressId(address.id); setAddressLine1(address.address_line1); setLocality(address.locality); setCity(address.city); setState(address.state); setPostalCode(address.postal_code);
      }
      if (dairywalaId) {
        const { data: deliverySlots } = await supabase.from('dairywala_delivery_slots').select('slot_code').eq('dairywala_id', dairywalaId).eq('active', true).order('slot_code');
        setSlots((deliverySlots ?? []).map((row) => row.slot_code));
      }
      setCheckingAuth(false);
    });
  }, [dairywalaId]);

  if (checkingAuth) return <View style={styles.center}><ActivityIndicator /><Text style={styles.muted}>Checking sign in…</Text></View>;
  if (!signedIn) return <View style={styles.container}><Text style={styles.eyebrow}>CHECKOUT</Text><Text style={styles.title}>Sign in required</Text><Text style={styles.body}>Sign in with your mobile number before adding your delivery address and placing an order.</Text><Pressable style={styles.button} onPress={() => router.push('/customer-auth')}><Text style={styles.buttonText}>Sign in with OTP</Text></Pressable></View>;
  if (!items.length) return <View style={styles.container}><Text style={styles.title}>Your cart is empty</Text><Pressable style={styles.button} onPress={() => router.back()}><Text style={styles.buttonText}>Back</Text></Pressable></View>;

  async function placeOrder() {
    setLoading(true); setError('');
    try {
      let savedAddressId = addressId;
      if (!savedAddressId) {
        savedAddressId = await saveCustomerAddress({ label: 'Home', addressLine1, locality, city, state, postalCode });
      }
      if (!slot) throw new Error('Select a delivery slot.');
      const orderId = await createPendingOrder(dairywalaId, savedAddressId, slot, items);
      router.replace({ pathname: '/order-confirmed', params: { id: orderId } });
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to create your order.'); }
    finally { setLoading(false); }
  }

  return <ScrollView contentContainerStyle={styles.container}>
    <Pressable onPress={() => router.back()}><Text style={styles.back}>← Back</Text></Pressable>
    <Text style={styles.eyebrow}>CHECKOUT</Text><Text style={styles.title}>Delivery details</Text>
    <Text style={styles.section}>Address</Text>
    <TextInput style={styles.input} placeholder="Address line" value={addressLine1} onChangeText={setAddressLine1} />
    <TextInput style={styles.input} placeholder="Locality" value={locality} onChangeText={setLocality} />
    <TextInput style={styles.input} placeholder="City" value={city} onChangeText={setCity} />
    <TextInput style={styles.input} placeholder="State" value={state} onChangeText={setState} />
    <TextInput style={styles.input} placeholder="PIN code" keyboardType="number-pad" value={postalCode} onChangeText={setPostalCode} />
    <Text style={styles.section}>Delivery slot</Text>
    <View style={styles.slotRow}>{slots.map((code) => <Pressable key={code} onPress={() => setSlot(code)} style={[styles.slot, slot === code && styles.slotSelected]}><Text style={slot === code ? styles.slotSelectedText : styles.slotText}>{code}</Text></Pressable>)}</View>
    {!slots.length ? <Text style={styles.muted}>No delivery slot is currently available for this Dairywala.</Text> : null}
    {error ? <Text style={styles.error}>{error}</Text> : null}
    <View style={styles.summary}><Text style={styles.summaryTitle}>Order total</Text><Text style={styles.total}>₹{total.toFixed(2)}</Text></View>
    <Pressable style={styles.button} disabled={loading || !slot} onPress={placeOrder}>{loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Continue to payment</Text>}</Pressable>
  </ScrollView>;
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingTop: 56, paddingBottom: 48, backgroundColor: '#fff', flexGrow: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: '#fff' }, muted: { color: '#777', marginTop: 8 },
  back: { fontSize: 15, fontWeight: '700', marginBottom: 28 }, eyebrow: { fontSize: 12, fontWeight: '800', letterSpacing: 1.5, color: '#777' }, title: { marginTop: 9, fontSize: 31, fontWeight: '800' }, body: { marginTop: 12, color: '#666', fontSize: 16, lineHeight: 23 },
  section: { marginTop: 25, marginBottom: 9, fontSize: 18, fontWeight: '800' }, input: { height: 52, borderWidth: 1, borderColor: '#ddd', borderRadius: 13, paddingHorizontal: 15, fontSize: 15, marginBottom: 10 }, slotRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' }, slot: { paddingVertical: 13, paddingHorizontal: 18, borderRadius: 13, borderWidth: 1, borderColor: '#ddd' }, slotSelected: { backgroundColor: '#111', borderColor: '#111' }, slotText: { fontWeight: '700' }, slotSelectedText: { color: '#fff', fontWeight: '700' }, error: { marginTop: 14, color: '#b00020', lineHeight: 20 }, summary: { marginTop: 24, padding: 18, borderWidth: 1, borderColor: '#e5e5e5', borderRadius: 15, flexDirection: 'row', justifyContent: 'space-between' }, summaryTitle: { fontWeight: '700' }, total: { fontSize: 21, fontWeight: '800' }, button: { marginTop: 18, minHeight: 54, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#111' }, buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' }
});
