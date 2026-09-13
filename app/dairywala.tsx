import { StyleSheet, Text, View } from 'react-native';

export default function DairywalaScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>DAIRYWALA / BUSINESS</Text>
      <Text style={styles.title}>Grow your local dairy business</Text>
      <Text style={styles.body}>Registration will capture your business, location, service area, products, pricing, delivery slots and settlement details.</Text>
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>Business onboarding comes next</Text>
        <Text style={styles.emptyBody}>Applications will enter verification before a Dairywala can become ACTIVE and visible to customers.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 72, backgroundColor: '#fff' },
  eyebrow: { fontSize: 12, fontWeight: '800', letterSpacing: 1.5, color: '#777' },
  title: { marginTop: 10, fontSize: 32, lineHeight: 38, fontWeight: '800' },
  body: { marginTop: 12, fontSize: 16, lineHeight: 24, color: '#666' },
  emptyState: { marginTop: 32, padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#e5e5e5' },
  emptyTitle: { fontSize: 17, fontWeight: '700' },
  emptyBody: { marginTop: 7, fontSize: 14, lineHeight: 21, color: '#777' }
});
