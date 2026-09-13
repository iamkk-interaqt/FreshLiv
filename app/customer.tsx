import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function CustomerScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>CUSTOMER</Text>
      <Text style={styles.title}>Find your local dairywala</Text>
      <Text style={styles.body}>
        Tell us where you live. We’ll use your locality or PIN code to find active Dairywalas who actually serve your area.
      </Text>

      <Pressable style={styles.primaryButton} onPress={() => router.push('/location')}>
        <Text style={styles.primaryText}>Set my location</Text>
      </Pressable>

      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>Looking for your local supply</Text>
        <Text style={styles.emptyBody}>
          Gwalawala does not preload fake Dairywalas or products. Results come from real approved and active supply.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 72, backgroundColor: '#fff' },
  eyebrow: { fontSize: 12, fontWeight: '800', letterSpacing: 1.5, color: '#777' },
  title: { marginTop: 10, fontSize: 32, lineHeight: 38, fontWeight: '800' },
  body: { marginTop: 12, fontSize: 16, lineHeight: 24, color: '#666' },
  primaryButton: { marginTop: 28, minHeight: 54, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#111' },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  emptyState: { marginTop: 32, padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#e5e5e5' },
  emptyTitle: { fontSize: 17, fontWeight: '700' },
  emptyBody: { marginTop: 7, fontSize: 14, lineHeight: 21, color: '#777' }
});
