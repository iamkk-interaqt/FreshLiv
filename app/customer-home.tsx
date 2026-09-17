import { useRouter, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

const products = [
  { key: 'milk', emoji: '🥛', label: 'Milk' },
  { key: 'paneer', emoji: '🧀', label: 'Paneer' },
  { key: 'curd', emoji: '🥣', label: 'Curd' },
  { key: 'butter', emoji: '🧈', label: 'Butter' },
  { key: 'ghee', emoji: '🫙', label: 'Ghee' },
  { key: 'khoya', emoji: '🍬', label: 'Khoya / Mawa' },
];

export default function CustomerHomeScreen() {
  const router = useRouter();
  const { locality = '', postalCode = '' } = useLocalSearchParams<{ locality?: string; postalCode?: string }>();

  function selectProduct(product: string) {
    if (product === 'milk') return;
    router.push({ pathname: '/discovery', params: { locality, postalCode, product } });
  }

  function selectMilkSource(source: string) {
    router.push({ pathname: '/discovery', params: { locality, postalCode, product: 'milk', source } });
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>GWALAWALA</Text>
      <Text style={styles.title}>What are you looking for?</Text>
      <Text style={styles.subtitle}>Choose a product to find real, active Dairywalas serving your area.</Text>

      <View style={styles.grid}>
        {products.map(item => (
          <Pressable key={item.key} style={styles.productCard} onPress={() => selectProduct(item.key)}>
            <Text style={styles.emoji}>{item.emoji}</Text>
            <Text style={styles.productLabel}>{item.label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Milk</Text>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 24, paddingTop: 62, paddingBottom: 48 },
  eyebrow: { fontSize: 12, fontWeight: '800', letterSpacing: 1.5, color: '#777' },
  title: { marginTop: 9, fontSize: 31, lineHeight: 38, fontWeight: '800' },
  subtitle: { marginTop: 9, fontSize: 15, lineHeight: 22, color: '#666' },
  grid: { marginTop: 24, flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  productCard: { width: '47%', minHeight: 112, padding: 18, borderRadius: 16, borderWidth: 1, borderColor: '#e5e5e5', justifyContent: 'center' },
  emoji: { fontSize: 31 },
  productLabel: { marginTop: 10, fontSize: 16, fontWeight: '750' },
  section: { marginTop: 30, padding: 18, borderRadius: 18, backgroundColor: '#f7f7f7' },
  sectionTitle: { fontSize: 21, fontWeight: '800' },
  sectionSubtitle: { marginTop: 5, color: '#666' },
  sourceRow: { flexDirection: 'row', gap: 10, marginTop: 15 },
  sourceCard: { flex: 1, minHeight: 105, padding: 14, borderRadius: 14, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e5e5', justifyContent: 'center' },
  sourceEmoji: { fontSize: 28 },
  sourceTitle: { marginTop: 7, fontSize: 14, fontWeight: '800' },
});
