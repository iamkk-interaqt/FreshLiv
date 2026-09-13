import React, { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { getDairywalaEarnings, getDairywalaSettlementProfile, EarningsSummary } from '../src/services/dairywalaEarnings';

export default function DairywalaEarningsScreen() {
  const [summary, setSummary] = useState<EarningsSummary | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const [earnings, settlement] = await Promise.all([getDairywalaEarnings(), getDairywalaSettlementProfile()]);
      setSummary(earnings);
      setProfile(settlement);
    } catch (e: any) { setError(e?.message ?? 'Unable to load earnings.'); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading) return <View style={styles.center}><ActivityIndicator /></View>;
  if (error) return <View style={styles.center}><Text style={styles.error}>{error}</Text></View>;

  return <ScrollView style={styles.page} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}>
    <Text style={styles.title}>Earnings</Text>
    <Text style={styles.subtitle}>Your real marketplace earnings and settlement status</Text>
    <View style={styles.hero}><Text style={styles.heroLabel}>Total Dairywala sales</Text><Text style={styles.heroValue}>₹{(summary?.gross ?? 0).toFixed(2)}</Text></View>
    <View style={styles.grid}>
      <Card title="Completed" value={String(summary?.completed ?? 0)} />
      <Card title="Eligible" value={`₹${(summary?.eligible ?? 0).toFixed(2)}`} />
      <Card title="Processing" value={`₹${(summary?.processing ?? 0).toFixed(2)}`} />
      <Card title="Settled" value={`₹${(summary?.settled ?? 0).toFixed(2)}`} />
    </View>
    <View style={styles.section}><Text style={styles.sectionTitle}>Settlement account</Text>
      {profile ? <>
        <Text style={styles.row}>Provider: {profile.provider ?? '—'}</Text>
        <Text style={styles.row}>Status: {profile.status ?? 'Not configured'}</Text>
        <Text style={styles.row}>Cycle: {profile.settlement_cycle ?? '—'}</Text>
        <Text style={styles.row}>Vendor ID: {profile.provider_vendor_id ? 'Configured' : 'Not configured'}</Text>
      </> : <Text style={styles.muted}>Settlement account is not configured yet.</Text>}
    </View>
  </ScrollView>;
}

function Card({ title, value }: { title: string; value: string }) { return <View style={styles.card}><Text style={styles.cardTitle}>{title}</Text><Text style={styles.cardValue}>{value}</Text></View>; }

const styles = StyleSheet.create({ page:{flex:1,padding:20}, center:{flex:1,alignItems:'center',justifyContent:'center',padding:24}, title:{fontSize:30,fontWeight:'700'}, subtitle:{marginTop:6,marginBottom:20}, hero:{padding:22,borderRadius:16,borderWidth:1,marginBottom:14}, heroLabel:{fontSize:14}, heroValue:{fontSize:32,fontWeight:'700',marginTop:8}, grid:{flexDirection:'row',flexWrap:'wrap',gap:10}, card:{width:'48%',padding:16,borderRadius:14,borderWidth:1}, cardTitle:{fontSize:13}, cardValue:{fontSize:20,fontWeight:'700',marginTop:7}, section:{marginTop:18,padding:18,borderRadius:14,borderWidth:1}, sectionTitle:{fontSize:18,fontWeight:'700',marginBottom:12}, row:{marginTop:8}, muted:{opacity:.65}, error:{textAlign:'center'} });
