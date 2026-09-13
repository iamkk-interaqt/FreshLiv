import { StyleSheet, Text, View } from 'react-native';

export default function CustomerScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>CUSTOMER</Text>
      <Text style={styles.title}>Find your local dairywala</Text>
      <Text style={styles.body}>Your next step will be location and service-area discovery. No Dairywalas are preloaded or fabricated.</Text>
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>Location discovery coming next</Text>
        <Text style={styles.emptyBody}>We will connect this screen to real service-area data from the backend.</Text>
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
