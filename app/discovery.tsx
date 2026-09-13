import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { findActiveDairywalas } from '../src/services/dairywalas';
import type { DairywalaSummary } from '../src/types/marketplace';

export default function DiscoveryScreen() {
  const router = useRouter();
  const { locality = '', postalCode = '' } = useLocalSearchParams<{ locality?: string; postalCode?: string }>();
  const [loading, setLoading] = useState(true);
  const [dairywalas, setDairywalas] = useState<DairywalaSummary[]>([]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    findActiveDairywalas({ latitude: 0, longitude: 0, locality: String(locality), postalCode: String(postalCode) })
      .then((results) => {
        if (mounted) setDairywalas(results);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, [locality, postalCode]);

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>DAIRYWALAS NEAR YOU</Text>
      <Text style={styles.title}>{locality || postalCode || 'Your area'}</Text>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator />
          <Text style={styles.muted}>Checking available Dairywalas…</Text>
        </View>
      ) : dairywalas.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No Dairywalas available here yet</Text>
          <Text style={styles.emptyBody}>
            We do not have an active Dairywala serving this area yet. You can refer your local Dairywala to Gwalawala.
          </Text>
          <Pressable style={styles.button} onPress={() => router.push('/customer')}>
            <Text style={styles.buttonText}>Change location</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.list}>
          {dairywalas.map((dairywala) => (
            <View key={dairywala.id} style={styles.card}>
              <Text style={styles.cardTitle}>{dairywala.businessName}</Text>
              <Text style={styles.cardBody}>{dairywala.locality}</Text>
            </View>
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
  cardTitle: { fontSize: 17, fontWeight: '700' },
  cardBody: { marginTop: 5, color: '#777' }
});
