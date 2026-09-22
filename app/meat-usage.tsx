import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function MeatUsageScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ locality?: string; postalCode?: string; category?: string; variant?: string }>();

  function select(mode: 'HOME' | 'BUSINESS') {
    router.push({
      pathname: mode === 'HOME' ? '/meat-quantity' : '/meat-subscription',
      params: { ...params, usage: mode },
    });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>MEAT & EGGS</Text>
      <Text style={styles.title}>How are you buying?</Text>
      <Text style={styles.body}>Choose the order type that matches how you will use it.</Text>

      <Pressable style={styles.card} onPress={() => select('HOME')}>
        <Text style={styles.emoji}>🏠</Text>
        <View style={styles.copy}><Text style={styles.cardTitle}>Home</Text><Text style={styles.cardBody}>For your household</Text></View>
        <Text style={styles.arrow}>›</Text>
      </Pressable>

      <Pressable style={styles.card} onPress={() => select('BUSINESS')}>
        <Text style={styles.emoji}>🍽️</Text>
        <View style={styles.copy}><Text style={styles.cardTitle}>Shop / Restaurant</Text><Text style={styles.cardBody}>Bulk supply and recurring orders</Text></View>
        <Text style={styles.arrow}>›</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 64, backgroundColor: '#fff' },
  eyebrow: { fontSize: 12, fontWeight: '800', letterSpacing: 1.5, color: '#777' },
  title: { marginTop: 10, fontSize: 30, fontWeight: '800' },
  body: { marginTop: 10, color: '#666', lineHeight: 22 },
  card: { marginTop: 18, minHeight: 92, padding: 18, borderWidth: 1, borderColor: '#e5e5e5', borderRadius: 16, flexDirection: 'row', alignItems: 'center' },
  emoji: { fontSize: 32, width: 52 },
  copy: { flex: 1 },
  cardTitle: { fontSize: 18, fontWeight: '800' },
  cardBody: { marginTop: 5, color: '#777' },
  arrow: { fontSize: 30, color: '#777' }
});