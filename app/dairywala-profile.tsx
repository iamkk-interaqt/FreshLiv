import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { supabase } from '../src/lib/supabase';
import { findActiveProducts, type CustomerProduct } from '../src/services/products';

export default function DairywalaProfileScreen() {
  const router = useRouter();
  const { id = '' } = useLocalSearchParams<{ id?: string }>();
  const [loading, setLoading] = useState(true);
  const [businessName, setBusinessName] = useState('');
  const [locality, setLocality] = useState('');
  const [products, setProducts] = useState<CustomerProduct[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const dairywalaId = String(id);

    async function load() {
      setLoading(true);
      setError('');
      try {
        const [{ data: profile, error: profileError }, productRows] = await Promise.all([
          supabase
            .from('dairywala_profiles')
            .select('business_name, locality')
            .eq('id', dairywalaId)
            .eq('status', 'ACTIVE')
            .maybeSingle(),
          findActiveProducts(dairywalaId),
        ]);

        if (profileError) throw profileError;
        if (!profile) throw new Error('This Dairywala is no longer available.');

        if (mounted) {
          setBusinessName(profile.business_name);
          setLocality(profile.locality ?? '');
          setProducts(productRows);
        }
      } catch (loadError) {
        if (mounted) setError(loadError instanceof Error ? loadError.message : 'Unable to load this Dairywala.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => { mounted = false; };
  }, [id]);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator /><Text style={styles.muted}>Loading Dairywala…</Text></View>;
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.eyebrow}>DAIRYWALA</Text>
        <Text style={styles.title}>Unavailable</Text>
        <Text style={styles.body}>{error}</Text>
        <Pressable style={styles.button} onPress={() => router.back()}><Text style={styles.buttonText}>Go back</Text></Pressable>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Pressable onPress={() => router.back()}><Text style={styles.back}>← Back</Text></Pressable>
      <Text style={styles.eyebrow}>DAIRYWALA</Text>
      <Text style={styles.title}>{businessName}</Text>
      {locality ? <Text style={styles.location}>{locality}</Text> : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Available products</Text>
        {products.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No products available yet</Text>
            <Text style={styles.emptyBody}>This Dairywala is active, but no active products are currently listed.</Text>
          </View>
        ) : (
          products.map((product) => (
            <View key={product.id} style={styles.productCard}>
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{product.name}</Text>
                {product.description ? <Text style={styles.productDescription}>{product.description}</Text> : null}
                {product.quantityValue && product.quantityUnit ? (
                  <Text style={styles.productQuantity}>{product.quantityValue} {product.quantityUnit}</Text>
                ) : null}
              </View>
              <Text style={styles.price}>₹{product.price.toFixed(2)}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingTop: 56, paddingBottom: 48, backgroundColor: '#fff', flexGrow: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: '#fff' },
  muted: { color: '#777' },
  back: { fontSize: 15, fontWeight: '700', marginBottom: 28 },
  eyebrow: { fontSize: 12, fontWeight: '800', letterSpacing: 1.5, color: '#777' },
  title: { marginTop: 9, fontSize: 32, lineHeight: 38, fontWeight: '800' },
  location: { marginTop: 7, color: '#666', fontSize: 16 },
  body: { marginTop: 12, fontSize: 16, lineHeight: 24, color: '#666' },
  section: { marginTop: 32 },
  sectionTitle: { fontSize: 21, fontWeight: '800', marginBottom: 12 },
  productCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 17, borderRadius: 15, borderWidth: 1, borderColor: '#e5e5e5', marginBottom: 10 },
  productInfo: { flex: 1, paddingRight: 12 },
  productName: { fontSize: 17, fontWeight: '750' },
  productDescription: { marginTop: 4, color: '#666', lineHeight: 19 },
  productQuantity: { marginTop: 5, color: '#888', fontSize: 13 },
  price: { fontSize: 16, fontWeight: '800' },
  emptyState: { padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#e5e5e5' },
  emptyTitle: { fontSize: 17, fontWeight: '700' },
  emptyBody: { marginTop: 7, color: '#777', lineHeight: 21 },
  button: { marginTop: 24, height: 50, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: '#111' },
  buttonText: { color: '#fff', fontWeight: '700' }
});
