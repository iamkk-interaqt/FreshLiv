import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getCartItems, getCartTotal, subscribeToCart, updateCartQuantity, type CartItem } from '../src/services/cart';

export default function CartScreen() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>(getCartItems());

  useEffect(() => subscribeToCart(() => setItems(getCartItems())), []);

  const total = getCartTotal();
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Pressable onPress={() => router.back()}><Text style={styles.back}>← Back</Text></Pressable>
      <Text style={styles.eyebrow}>YOUR CART</Text>
      <Text style={styles.title}>Cart</Text>

      {items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.body}>Choose a product from a Dairywala to add it here.</Text>
          <Pressable style={styles.button} onPress={() => router.replace('/customer')}><Text style={styles.buttonText}>Browse Dairywalas</Text></Pressable>
        </View>
      ) : (
        <>
          <View style={styles.list}>
            {items.map((item) => (
              <View key={item.id} style={styles.card}>
                <View style={styles.info}>
                  <Text style={styles.name}>{item.name}</Text>
                  {item.quantityValue && item.quantityUnit ? <Text style={styles.meta}>{item.quantityValue} {item.quantityUnit} · ₹{item.price.toFixed(2)}</Text> : <Text style={styles.meta}>₹{item.price.toFixed(2)}</Text>}
                </View>
                <View style={styles.stepper}>
                  <Pressable onPress={() => updateCartQuantity(item.id, item.quantity - 1)} style={styles.step}><Text style={styles.stepText}>−</Text></Pressable>
                  <Text style={styles.quantity}>{item.quantity}</Text>
                  <Pressable onPress={() => updateCartQuantity(item.id, item.quantity + 1)} style={styles.step}><Text style={styles.stepText}>+</Text></Pressable>
                </View>
              </View>
            ))}
          </View>
          <View style={styles.summary}>
            <View><Text style={styles.totalLabel}>Total</Text><Text style={styles.total}>₹{total.toFixed(2)}</Text></View>
            <Pressable style={styles.button} onPress={() => router.push('/checkout')}><Text style={styles.buttonText}>Continue</Text></Pressable>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingTop: 56, paddingBottom: 48, backgroundColor: '#fff', flexGrow: 1 },
  back: { fontSize: 15, fontWeight: '700', marginBottom: 30 },
  eyebrow: { fontSize: 12, fontWeight: '800', letterSpacing: 1.5, color: '#777' },
  title: { marginTop: 9, fontSize: 32, fontWeight: '800' },
  list: { marginTop: 28 },
  card: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderWidth: 1, borderColor: '#e5e5e5', borderRadius: 15, marginBottom: 10 },
  info: { flex: 1, paddingRight: 10 },
  name: { fontSize: 17, fontWeight: '700' },
  meta: { marginTop: 5, color: '#777', fontSize: 13 },
  stepper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#ddd', borderRadius: 10 },
  step: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  stepText: { fontSize: 21 },
  quantity: { width: 30, textAlign: 'center', fontWeight: '700' },
  summary: { marginTop: 'auto', paddingTop: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  totalLabel: { color: '#777', fontSize: 13 },
  total: { marginTop: 3, fontSize: 23, fontWeight: '800' },
  empty: { marginTop: 32, padding: 20, borderWidth: 1, borderColor: '#e5e5e5', borderRadius: 16 },
  emptyTitle: { fontSize: 19, fontWeight: '800' },
  body: { marginTop: 8, color: '#666', lineHeight: 22 },
  button: { marginTop: 22, minHeight: 52, paddingHorizontal: 22, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#111' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' }
});
