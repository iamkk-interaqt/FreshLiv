import { useEffect, useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { findAvailableCustomerProducts, type CatalogProduct } from '../src/services/catalog';

export default function CustomerHomeScreen() {
  const router = useRouter();
  const { locality = '', postalCode = '' } = useLocalSearchParams<{ locality?: string; postalCode?: string }>();
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    findAvailableCustomerProducts({ locality: String(locality), postalCode: String(postalCode) })
      .then((items) => { if (mounted) setProducts(items); })
      .catch((e) => { if (mounted) setError(e instanceof Error ? e.message : 'Unable to load products.'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [locality, postalCode]);

  function selectProduct(product: CatalogProduct) {
    const isMilk = product.label.toLowerCase().includes('milk');
    if (isMilk) return;
    router.push({ pathname: '/discovery', params: { locality, postalCode, product: product.label } });
  }

  function selectMilkSource(source: string) {
    router.push({ pathname: '/discovery', params: { locality, postalCode, product: 'milk', source } });
  }

  const hasMilk = products.some((item) => item.label.toLowerCase().includes('milk'));

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>GWALAWALA</Text>
      <Text style={styles.title}>What are you looking for?</Text>
      <Text style={styles.subtitle}>Only products currently listed by active Dairywalas serving your area are shown.</Text>

      {loading ? <View style={styles.center}><ActivityIndicator /><Text style={styles.muted}>Loading local products…</Text></View> : null}
      {error ? <View style={styles.error}><Text style={styles.errorText}>{error}</Text></View> : null}
      {!loading && !error && !products.length ? <View style={styles.empty}><Text style={styles.emptyTitle}>No products available yet</Text><Text style={styles.emptyBody}>There are no active products from Dairywalas serving this location yet.</Text></View> : null}

      {!loading && !error && products.length ? (
        <View style={styles.grid}>
          {products.map((item) => (
            <Pressable key={item.key} style={styles.productCard} onPress={() => selectProduct(item)}>
              <Text style={styles.emoji}>{item.emoji}</Text>
              <Text style={styles.productLabel}>{item.label}</Text>
              {item.label.toLowerCase().includes('milk') ? <Text style={styles.tapHint}>Choose source below</Text> : null}
            </Pressable>
          ))}
        </View>
      ) : null}

      {hasMilk ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Milk source</Text>
          <Text style={styles.sectionSubtitle}>Choose your preferred milk source.</Text>
          <View style={styles.sourceRow}>
            <Pressable style={styles.sourceCard} onPress={() => selectMilkSource('cow')}>
              <Text style={styles.sourceEmoji}>🐄</Text>
              <Text style={styles.sourceTitle}>Cow Milk</Text>
            </Pressable>
            <Pressable style={styles.sourceCard} onPress={() => selectMilkSource('buffalo')}>
              <Text style={styles.sourceEmoji}>🐃</Text>
              <Text style={styles.sourceTitle}>Buffalo Milk</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 24, paddingTop: 62, paddingBottom: 48 },
  center: { paddingVertical: 32, alignItems: 'center', gap: 10 },
  muted: { color: '#777' },
  eyebrow: { fontSize: 12, fontWeight: '800', letterSpacing: 1.5, color: '#777' },
  title: { marginTop: 9, fontSize: 31, lineHeight: 38, fontWeight: '800' },
  subtitle: { marginTop: 9, fontSize: 15, lineHeight: 22, color: '#666' },
  grid: { marginTop: 24, flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  productCard: { width: '47%', minHeight: 112, padding: 18, borderRadius: 16, borderWidth: 1, borderColor: '#e5e5e5', justifyContent: 'center' },
  emoji: { fontSize: 31 },
  productLabel: { marginTop: 10, fontSize: 16, fontWeight: '750' },
  tapHint: { marginTop: 6, color: '#777', fontSize: 11 },
  section: { marginTop: 30, padding: 18, borderRadius: 18, backgroundColor: '#f7f7f7' },
  sectionTitle: { fontSize: 21, fontWeight: '800' },
  sectionSubtitle: { marginTop: 5, color: '#666' },
  sourceRow: { flexDirection: 'row', gap: 10, marginTop: 15 },
  sourceCard: { flex: 1, minHeight: 105, padding: 14, borderRadius: 14, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e5e5', justifyContent: 'center' },
  sourceEmoji: { fontSize: 28 },
  sourceTitle: { marginTop: 7, fontSize: 14, fontWeight: '800' },
  empty: { marginTop: 24, padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#e5e5e5' },
  emptyTitle: { fontSize: 18, fontWeight: '800' },
  emptyBody: { marginTop: 7, color: '#777', lineHeight: 21 },
  error: { marginTop: 20, padding: 14, borderRadius: 12, backgroundColor: '#fff0f0' },
  errorText: { color: '#9b1c1c' },
});
