import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { findActiveProducts, type CustomerProduct } from '../src/services/products';
import { addToCart } from '../src/services/cart';

export default function ProductScreen() {
  const router = useRouter();
  const { id = '' } = useLocalSearchParams<{ id?: string }>();
  const [product, setProduct] = useState<CustomerProduct | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const rows = await findActiveProductsById(String(id));
        if (!rows) throw new Error('This product is no longer available.');
        if (mounted) setProduct(rows);
      } catch (loadError) {
        if (mounted) setError(loadError instanceof Error ? loadError.message : 'Unable to load this product.');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [id]);

  if (loading) return <View style={styles.center}><ActivityIndicator /><Text style={styles.muted}>Loading product…</Text></View>;
  if (error || !product) return <View style={styles.container}><Text style={styles.title}>Unavailable</Text><Text style={styles.body}>{error || 'This product is no longer available.'}</Text><Pressable style={styles.button} onPress={() => router.back()}><Text style={styles.buttonText}>Go back</Text></Pressable></View>;

  const total = product.price * quantity;
  return (
    <View style={styles.container}>
      <Pressable onPress={() => router.back()}><Text style={styles.back}>← Back</Text></Pressable>
      <Text style={styles.eyebrow}>PRODUCT</Text>
      <Text style={styles.title}>{product.name}</Text>
      {product.description ? <Text style={styles.body}>{product.description}</Text> : null}
      {product.quantityValue && product.quantityUnit ? <Text style={styles.package}>{product.quantityValue} {product.quantityUnit} per item</Text> : null}
      <Text style={styles.price}>₹{product.price.toFixed(2)}</Text>

      <View style={styles.quantityRow}>
        <Text style={styles.quantityLabel}>Quantity</Text>
        <View style={styles.stepper}>
          <Pressable onPress={() => setQuantity((value) => Math.max(1, value - 1))} style={styles.step}><Text style={styles.stepText}>−</Text></Pressable>
          <Text style={styles.quantity}>{quantity}</Text>
          <Pressable onPress={() => setQuantity((value) => value + 1)} style={styles.step}><Text style={styles.stepText}>+</Text></Pressable>
        </View>
      </View>

      <View style={styles.bottom}>
        <View><Text style={styles.totalLabel}>Total</Text><Text style={styles.total}>₹{total.toFixed(2)}</Text></View>
        <Pressable style={styles.button} onPress={() => { addToCart(product, quantity); router.push('/cart'); }}><Text style={styles.buttonText}>Add to cart</Text></Pressable>
      </View>
    </View>
  );
}

async function findActiveProductsById(productId: string): Promise<CustomerProduct | null> {
  if (!productId) return null;
  const { supabase } = await import('../src/lib/supabase');
  const { data, error } = await supabase.from('products').select('id, dairywala_id, name, description, product_type, quantity_value, quantity_unit, price').eq('id', productId).eq('status', 'ACTIVE').maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return { id: data.id, dairywalaId: data.dairywala_id, name: data.name, description: data.description, productType: data.product_type, quantityValue: data.quantity_value, quantityUnit: data.quantity_unit, price: Number(data.price) };
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 56, backgroundColor: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: '#fff' },
  muted: { color: '#777' },
  back: { fontSize: 15, fontWeight: '700', marginBottom: 30 },
  eyebrow: { fontSize: 12, fontWeight: '800', letterSpacing: 1.5, color: '#777' },
  title: { marginTop: 9, fontSize: 32, lineHeight: 38, fontWeight: '800' },
  body: { marginTop: 12, color: '#666', fontSize: 16, lineHeight: 24 },
  package: { marginTop: 14, color: '#777' },
  price: { marginTop: 24, fontSize: 25, fontWeight: '800' },
  quantityRow: { marginTop: 34, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  quantityLabel: { fontSize: 17, fontWeight: '700' },
  stepper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#ddd', borderRadius: 12 },
  step: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  stepText: { fontSize: 24 },
  quantity: { width: 38, textAlign: 'center', fontSize: 17, fontWeight: '700' },
  bottom: { marginTop: 'auto', paddingTop: 28, paddingBottom: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  totalLabel: { color: '#777', fontSize: 13 },
  total: { marginTop: 3, fontSize: 23, fontWeight: '800' },
  button: { minHeight: 52, paddingHorizontal: 22, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#111' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' }
});
