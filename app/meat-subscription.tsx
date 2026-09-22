import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const PLANS = [
  { key: 'DAILY', label: 'Daily supply', body: 'Fresh supply on your selected delivery slot.' },
  { key: 'ALTERNATE_DAYS', label: 'Alternate days', body: 'Supply every other day.' },
  { key: 'WEEKLY', label: 'Weekly plan', body: 'Recurring weekly bulk supply.' },
];

export default function MeatSubscriptionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string; variant?: string; locality?: string; postalCode?: string }>();

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>SHOP / RESTAURANT</Text>
      <Text style={styles.title}>Choose your supply plan</Text>
      <Text style={styles.body}>Subscription options are shown only for sellers who support recurring bulk supply.</Text>
      <View style={styles.list}>
        {PLANS.map((plan) => (
          <Pressable key={plan.key} style={styles.card} onPress={() => router.push({
            pathname: '/discovery',
            params: { ...params, productCategory: params.category, usage: 'BUSINESS', variant: params.variant, bulkOnly: 'true', subscriptionPlan: plan.key, vertical: 'MEAT' },
          })}>
            <Text style={styles.cardTitle}>{plan.label}</Text>
            <Text style={styles.cardBody}>{plan.body}</Text>
            <Text style={styles.arrow}>Find suppliers ›</Text>
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
  list: { marginTop: 24, gap: 12 },
  card: { padding: 18, borderWidth: 1, borderColor: '#e5e5e5', borderRadius: 16 },
  cardTitle: { fontSize: 18, fontWeight: '800' },
  cardBody: { marginTop: 6, color: '#777', lineHeight: 20 },
  arrow: { marginTop: 12, fontWeight: '800' }
});