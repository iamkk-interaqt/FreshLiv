import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const HOME_WEIGHTS = [
  { value: '250', unit: 'G', label: '250 g' },
  { value: '500', unit: 'G', label: '500 g' },
  { value: '1', unit: 'KG', label: '1 kg' },
  { value: '2', unit: 'KG', label: '2 kg' },
];

const EGG_COUNTS = [
  { value: '6', unit: 'PCS', label: '6 eggs' },
  { value: '12', unit: 'PCS', label: '12 eggs' },
  { value: '18', unit: 'PCS', label: '18 eggs' },
  { value: '30', unit: 'PCS', label: '30 eggs' },
];

export default function MeatQuantityScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string; variant?: string }>();
  const isEgg = String(params.category).toUpperCase() === 'EGG';
  const options = isEgg ? EGG_COUNTS : HOME_WEIGHTS;

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>HOME ORDER</Text>
      <Text style={styles.title}>Select {isEgg ? 'quantity' : 'weight'}</Text>
      <Text style={styles.body}>Only packages actually listed by local sellers will appear after this selection.</Text>
      <View style={styles.grid}>
        {options.map((option) => (
          <Pressable key={option.label} style={styles.card} onPress={() => router.push({
            pathname: '/discovery',
            params: { ...params, productCategory: params.category, usage: 'HOME', variant: params.variant, quantityValue: option.value, quantityUnit: option.unit, vertical: 'MEAT' },
          })}>
            <Text style={styles.label}>{option.label}</Text>
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
  title: { marginTop: 10, fontSize: 30, fontWeight: '800' },
  body: { marginTop: 10, color: '#666', lineHeight: 22 },
  grid: { marginTop: 24, flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: { width: '47%', minHeight: 72, padding: 16, borderWidth: 1, borderColor: '#e5e5e5', borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { fontSize: 17, fontWeight: '800' },
  arrow: { fontSize: 27, color: '#777' }
});