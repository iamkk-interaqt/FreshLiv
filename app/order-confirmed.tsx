import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function OrderConfirmedScreen() {
  const router = useRouter();
  const { id = '' } = useLocalSearchParams<{ id?: string }>();
  return <View style={styles.container}>
    <Text style={styles.icon}>✓</Text>
    <Text style={styles.eyebrow}>PAYMENT CONFIRMED</Text>
    <Text style={styles.title}>Order placed successfully</Text>
    <Text style={styles.body}>Order reference: {String(id)}</Text>
    <Text style={styles.note}>Your Dairywala has been notified. You can follow the order status from tracking.</Text>
    <Pressable style={styles.button} onPress={() => router.replace({ pathname: '/order-tracking', params: { id: String(id) } })}><Text style={styles.buttonText}>Track order</Text></Pressable>
    <Pressable style={styles.secondaryButton} onPress={() => router.replace('/customer')}><Text style={styles.secondaryText}>Continue shopping</Text></Pressable>
  </View>;
}
const styles = StyleSheet.create({
  container: { flex:1, padding:24, alignItems:'center', justifyContent:'center', backgroundColor:'#fff' },
  icon: { width:68, height:68, borderRadius:34, backgroundColor:'#111', color:'#fff', textAlign:'center', paddingTop:17, fontSize:30, fontWeight:'800', marginBottom:24 },
  eyebrow: { fontSize:12, fontWeight:'800', letterSpacing:1.5, color:'#777' }, title: { marginTop:10, fontSize:30, lineHeight:36, fontWeight:'800', textAlign:'center' },
  body: { marginTop:14, color:'#555', textAlign:'center' }, note: { marginTop:16, color:'#777', lineHeight:21, textAlign:'center' },
  button: { marginTop:28, minHeight:54, width:'100%', borderRadius:14, alignItems:'center', justifyContent:'center', backgroundColor:'#111' }, buttonText:{color:'#fff',fontWeight:'700',fontSize:16},
  secondaryButton:{marginTop:10,minHeight:52,width:'100%',borderRadius:14,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:'#ddd'},secondaryText:{fontWeight:'700'}
});
