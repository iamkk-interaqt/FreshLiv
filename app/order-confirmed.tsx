import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function OrderConfirmedScreen() {
  const router = useRouter();
  const { id = '' } = useLocalSearchParams<{ id?: string }>();
  return <View style={styles.container}>
    <Text style={styles.icon}>✓</Text>
    <Text style={styles.eyebrow}>ORDER CREATED</Text>
    <Text style={styles.title}>Your order is ready for payment</Text>
    <Text style={styles.body}>Order reference: {String(id)}</Text>
    <Text style={styles.note}>Payment gateway integration is the next step. This order has not been marked as paid.</Text>
    <Pressable style={styles.button} onPress={() => router.replace('/customer')}><Text style={styles.buttonText}>Continue shopping</Text></Pressable>
  </View>;
}
const styles = StyleSheet.create({ container: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }, icon: { width: 68, height: 68, borderRadius: 34, backgroundColor: '#111', color: '#fff', textAlign: 'center', paddingTop: 17, fontSize: 30, fontWeight: '800', marginBottom: 24 }, eyebrow: { fontSize: 12, fontWeight: '800', letterSpacing: 1.5, color: '#777' }, title: { marginTop: 10, fontSize: 30, lineHeight: 36, fontWeight: '800', textAlign: 'center' }, body: { marginTop: 14, color: '#555', textAlign: 'center' }, note: { marginTop: 16, color: '#777', lineHeight: 21, textAlign: 'center' }, button: { marginTop: 28, minHeight: 54, width: '100%', borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#111' }, buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 } });
