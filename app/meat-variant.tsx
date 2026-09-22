import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const OPTIONS: Record<string, { key: string; label: string; emoji: string }[]> = {
  CHICKEN: [
    { key: 'LEG_PIECE', label: 'Leg Piece', emoji: '🍗' },
    { key: 'BREAST_PIECE', label: 'Breast Piece', emoji: '🍗' },
    { key: 'LIVER', label: 'Liver', emoji: '🍖' },
    { key: 'WINGS', label: 'Wings', emoji: '🍗' },
    { key: 'MIX_OF_EVERYTHING', label: 'Mix of Everything', emoji: '🍗' },
  ],
  MUTTON: [
    { key: 'LEG_PIECE', label: 'Leg Piece', emoji: '🍖' },
    { key: 'CURRY_CUT', label: 'Curry Cut', emoji: '🍖' },
    { key: 'KEEMA', label: 'Keema', emoji: '🥩' },
    { key: 'LIVER', label: 'Liver', emoji: '🍖' },
    { key: 'MIX_OF_EVERYTHING', label: 'Mix of Everything', emoji: '🍖' },
  ],
  FISH: [
    { key: 'ROHU', label: 'Rohu', emoji: '🐟' },
    { key: 'KATLA', label: 'Katla', emoji: '🐟' },
    { key: 'CURRY_CUT', label: 'Curry Cut', emoji: '🐟' },
    { key: 'FILLET', label: 'Fillet', emoji: '🐟' },
    { key: 'MIX_OF_EVERYTHING', label: 'Mixed Fish', emoji: '🐟' },
  ],
  EGG: [
    { key: 'REGULAR', label: 'Regular Eggs', emoji: '🥚' },
    { key: 'COUNTRY', label: 'Country Eggs', emoji: '🥚' },
    { key: 'PREMIUM', label: 'Premium Eggs', emoji: '🥚' },
  ],
};

export default function MeatVariantScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ locality?: string; postalCode?: string; category?: string }>();
  const category = String(params.category || 'CHICKEN').toUpperCase();
  const options = OPTIONS[category] || OPTIONS.CHICKEN;

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>MEAT & EGGS</Text>
      <Text style={styles.title}>Choose your {category.toLowerCase()} option</Text>
      <Text style={styles.body}>Select the cut or type you want. Availability comes from real local sellers.</Text>
      <View style={styles.list}>
        {options.map((option) => (
          <Pressable
            key={option.key}
            style={styles.card}
            onPress={() => router.push({
              pathname: '/meat-usage',
              params: { ...params, variant: option.key, category },
            })}
          >
            <Text style={styles.emoji}>{option.emoji}</Text>
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
  title: { marginTop: 10, fontSize: 30, lineHeight: 37, fontWeight: '800' },
  body: { marginTop: 10, color: '#666', lineHeight: 22 },
  list: { marginTop: 24, gap: 11 },
  card: { minHeight: 68, paddingHorizontal: 16, borderWidth: 1, borderColor: '#e5e5e5', borderRadius: 15, flexDirection: 'row', alignItems: 'center' },
  emoji: { fontSize: 26, width: 45 },
  label: { flex: 1, fontSize: 17, fontWeight: '750' },
  arrow: { fontSize: 28, color: '#777' }
});