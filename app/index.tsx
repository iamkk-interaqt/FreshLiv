import { useRouter } from 'expo-router';
import { StyleSheet, Text, View, Pressable } from 'react-native';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.brandBlock}>
        <Text style={styles.brand}>gwalawala</Text>
        <Text style={styles.tagline}>Choose your milk. Choose your dairywala.</Text>
      </View>

      <View style={styles.actionBlock}>
        <Text style={styles.title}>How are you joining?</Text>
        <Text style={styles.subtitle}>You can browse as a customer or manage your dairy business.</Text>

        <Pressable style={styles.primaryButton} onPress={() => router.push('/customer')}>
          <Text style={styles.primaryText}>Customer</Text>
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={() => router.push('/dairywala')}>
          <Text style={styles.secondaryText}>Dairywala / Business</Text>
        </Pressable>
      </View>

      <Text style={styles.note}>Admin access is provided separately through the private web portal.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'space-between', backgroundColor: '#fff' },
  brandBlock: { marginTop: 90 },
  brand: { fontSize: 42, fontWeight: '800', letterSpacing: -1.5 },
  tagline: { marginTop: 10, fontSize: 16, color: '#666', lineHeight: 23 },
  actionBlock: { gap: 12 },
  title: { fontSize: 26, fontWeight: '700' },
  subtitle: { fontSize: 15, color: '#666', lineHeight: 21, marginBottom: 8 },
  primaryButton: { minHeight: 54, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#111' },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  secondaryButton: { minHeight: 54, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#ddd' },
  secondaryText: { color: '#111', fontSize: 16, fontWeight: '700' },
  note: { textAlign: 'center', color: '#888', fontSize: 12, lineHeight: 18, marginBottom: 12 }
});
