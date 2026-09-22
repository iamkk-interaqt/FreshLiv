import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const CATEGORIES = [
  { key: 'CHICKEN', label: 'Chicken', emoji: '🍗' },
  { key: 'MUTTON', label: 'Mutton', emoji: '🍖' },
  { key: 'FISH', label: 'Fish', emoji: '🐟' },
  { key: 'EGG', label: 'Egg', emoji: '🥚' },
];

export default function MeatCategoryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ locality?: string; postalCode?: string }>();

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>MEAT & EGGS</Text>
      <Text style={styles.title}>What would you like?</Text>
      <Text style={styles.body}>Choose a fresh category to continue.</Text>
      <View style={styles.grid}>
        {CATEGORIES.map((item) => (
          <Pressable key={item.key} style={styles.card} onPress={() => router.push({
            pathname: '/meat-variant',
            params: { ...params, category: item.key },
          })}>
            <Text style={styles.emoji}>{item.emoji}</Text>
            <Text style={styles.label}>{item.label}</Text>
            <Text style={styles.arrow}>›</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 64, backgroundColor: '#fff' },
  eyebrow: { fontSize: 12, fontWeight: '800', letterSpacing: 1.5, color: '#777' },
  title: { marginTop: 10, fontSize: 31, fontWeight: '800' },
  body: { marginTop: 10, color: '#666', lineHeight: 22 },
  grid: { marginTop: 25, gap: 12 },
  card: { minHeight: 84, padding: 18, borderWidth: 1, borderColor: '#e5e5e5', borderRadius: 16, flexDirection: 'row', alignItems: 'center' },
  emoji: { fontSize: 34, width: 54 },
  label: { flex: 1, fontSize: 19, fontWeight: '800' },
  arrow: { fontSize: 30, color: '#777' }
});