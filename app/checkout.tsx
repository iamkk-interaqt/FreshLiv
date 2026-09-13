import { useRouter } from 'expo-router';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { getCartItems, getCartTotal } from '../src/services/cart';

export default function CheckoutScreen() {
  const router = useRouter();
  const items = getCartItems();
  const total = getCartTotal();

  return (
    <View style={styles.container}>
      <Pressable onPress={() => router.back()}><Text style={styles.back}>← Back</Text></Pressable>
      <Text style={styles.eyebrow}>CHECKOUT</Text>
      <Text style={styles.title}>Almost there</Text>
      <Text style={styles.body}>Your cart is ready. Customer sign-in, delivery address, morning/evening slot selection and payment will be completed here before an order is created.</Text>
      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>{items.length} {items.length === 1 ? 'item' : 'items'}</Text>
        <Text style={styles.total}>₹{total.toFixed(2)}</Text>
      </View>
      <View style={styles.notice}>
        <Text style={styles.noticeTitle}>Next implementation step</Text>
        <Text style={styles.noticeBody}>Customer OTP authentication → address → delivery slot → payment → real order creation.</Text>
      </View>
      <Pressable style={styles.button} onPress={() => router.back()}><Text style={styles.buttonText}>Back to cart</Text></Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 56, backgroundColor: '#fff' },
  back: { fontSize: 15, fontWeight: '700', marginBottom: 30 },
  eyebrow: { fontSize: 12, fontWeight: '800', letterSpacing: 1.5, color: '#777' },
  title: { marginTop: 9, fontSize: 32, fontWeight: '800' },
  body: { marginTop: 14, color: '#666', fontSize: 16, lineHeight: 24 },
  summary: { marginTop: 30, padding: 18, borderWidth: 1, borderColor: '#e5e5e5', borderRadius: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryTitle: { fontSize: 16, fontWeight: '700' },
  total: { fontSize: 22, fontWeight: '800' },
  notice: { marginTop: 16, padding: 18, borderRadius: 15, backgroundColor: '#f7f7f7' },
  noticeTitle: { fontSize: 15, fontWeight: '800' },
  noticeBody: { marginTop: 7, color: '#666', lineHeight: 21 },
  button: { marginTop: 'auto', marginBottom: 24, minHeight: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#111' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' }
});
