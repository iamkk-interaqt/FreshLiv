import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { findActiveDairywalas } from '../src/services/dairywalas';
import type { DairywalaSummary } from '../src/types/marketplace';

export default function DiscoveryScreen() {
  const router = useRouter();
  const {
    locality = '',
    postalCode = '',
    product = '',
    productCategory = '',
    source = '',
    usage = '',
    variant = '',
    breed = '',
    orderType = '',
    bulkOnly = '',
  } = useLocalSearchParams<{ locality?: string; postalCode?: string; product?: string; source?: string }>();
  const [loading, setLoading] = useState(true);
  const [dairywalas, setDairywalas] = useState<DairywalaSummary[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError('');
    findActiveDairywalas(
      { locality: String(locality), postalCode: String(postalCode) },
      String(productCategory || product),
      String(usage),
      String(source),
      String(variant),
      String(breed),
      String(bulkOnly).toLowerCase() === 'true' || String(orderType).toUpperCase() !== 'STANDARD' && Boolean(orderType),
    )
      .then((results) => {
        if (mounted) setDairywalas(results);
      })
      .catch(() => {
        if (mounted) setError('We could not load Dairywalas right now. Please try again.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, [locality, postalCode, product, productCategory, source, usage, variant, breed, orderType, bulkOnly]);

  const discoveryLabel = [source, product].filter(Boolean).join(' ');

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>LOCAL SELLERS NEAR YOU</Text>
      <Text style={styles.title}>{discoveryLabel || locality || postalCode || 'Your area'}</Text>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator />
          <Text style={styles.muted}>Checking available local sellers…</Text>
        </View>
      ) : error ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Something went wrong</Text>
          <Text style={styles.emptyBody}>{error}</Text>
          <Pressable
            style={styles.button}
            onPress={() => router.replace({ pathname: '/discovery', params: { locality, postalCode, product, productCategory, source, usage, variant, breed, orderType, bulkOnly } })}
          >
            <Text style={styles.buttonText}>Try again</Text>
          </Pressable>
        </View>
      ) : dairywalas.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No local sellers available here yet</Text>
          <Text style={styles.emptyBody}>
            We do not have an active local seller serving this area with the selected product yet. You can refer a local business to FreshLiv.
          </Text>
          <Pressable style={styles.button} onPress={() => router.push('/customer')}>
            <Text style={styles.buttonText}>Change location</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.list}>
          {dairywalas.map((dairywala) => (
            <Pressable
              key={dairywala.id}
              style={styles.card}
              onPress={() => router.push({ pathname: '/dairywala-profile', params: { id: dairywala.id } })}
            >
              <View style={styles.cardTop}>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle}>{dairywala.businessName}</Text>
                  <Text style={styles.cardBody}>{dairywala.locality || 'Local Dairywala'}</Text>
                </View>
                <Text style={styles.arrow}>›</Text>
              </View>
              <View style={styles.slots}>
                {dairywala.morningSlotAvailable ? <Text style={styles.slot}>Morning</Text> : null}
                {dairywala.eveningSlotAvailable ? <Text style={styles.slot}>Evening</Text> : null}
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 68, backgroundColor: '#fff' },
  eyebrow: { fontSize: 12, fontWeight: '800', letterSpacing: 1.5, color: '#777' },
  title: { marginTop: 8, fontSize: 32, fontWeight: '800' },
  center: { marginTop: 48, alignItems: 'center', gap: 12 },
  muted: { color: '#777' },
  emptyState: { marginTop: 32, padding: 22, borderWidth: 1, borderColor: '#e5e5e5', borderRadius: 16 },
  emptyTitle: { fontSize: 19, fontWeight: '750' },
  emptyBody: { marginTop: 8, fontSize: 14, lineHeight: 21, color: '#777' },
  button: { marginTop: 18, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#111' },
  buttonText: { color: '#fff', fontWeight: '700' },
  list: { marginTop: 24, gap: 12 },
  card: { padding: 18, borderRadius: 15, borderWidth: 1, borderColor: '#e5e5e5' },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 17, fontWeight: '700' },
  cardBody: { marginTop: 5, color: '#777' },
  arrow: { fontSize: 30, color: '#777', marginLeft: 12 },
  slots: { flexDirection: 'row', gap: 8, marginTop: 13 },
  slot: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: '#f3f3f3', fontSize: 12, fontWeight: '700' }
});
