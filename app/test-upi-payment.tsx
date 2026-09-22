import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { supabase } from '../src/lib/supabase';
import { clearCart } from '../src/services/cart';

const TEST_UPI_ID = '7978388706@upi';

export default function TestUpiPaymentScreen() {
  const router = useRouter();
  const { orderId = '', amount = '' } = useLocalSearchParams<{ orderId?: string; amount?: string }>();
  const value = Number(amount || 0);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=700x700&data=${encodeURIComponent(`upi://pay?pa=${TEST_UPI_ID}&pn=FreshLiv&am=${value.toFixed(2)}&cu=INR`)}`;

  async function markPaid() {
    try {
      const { data, error } = await supabase.rpc('confirm_test_upi_payment', { p_order_id: String(orderId) });
      if (error) throw error;
      if (!data) throw new Error('Test payment could not be confirmed.');
      clearCart();
      router.replace({ pathname: '/order-confirmed', params: { id: String(orderId) } });
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Unable to confirm test payment.');
    }
  }

  return <ScrollView contentContainerStyle={styles.container}>
    <Text style={styles.eyebrow}>TEST PAYMENT</Text>
    <Text style={styles.title}>Pay with UPI</Text>
    <Text style={styles.body}>Testing mode only. Scan this QR using any UPI app.</Text>
    <View style={styles.amount}><Text style={styles.amountLabel}>Amount to pay</Text><Text style={styles.amountValue}>₹{value.toFixed(2)}</Text></View>
    <View style={styles.qrCard}><Image source={{ uri: qrUrl }} style={styles.qr} /></View>
    <Text style={styles.upi}>{TEST_UPI_ID}</Text>
    <Pressable style={styles.button} onPress={() => Linking.openURL(qrUrl)}><Text style={styles.buttonText}>Open / Save QR</Text></Pressable>
    <Pressable style={styles.secondary} onPress={() => Linking.openURL(`upi://pay?pa=${TEST_UPI_ID}&pn=FreshLiv&am=${value.toFixed(2)}&cu=INR`)}><Text style={styles.secondaryText}>Open UPI App</Text></Pressable>
    <Text style={styles.note}>After completing the test payment, use the button below to confirm the test order.</Text>
    <Pressable style={styles.confirm} onPress={markPaid}><Text style={styles.confirmText}>I Have Paid — Test Confirmation</Text></Pressable>
    <ActivityIndicator style={styles.hidden} />
  </ScrollView>;
}
const styles=StyleSheet.create({
 container:{padding:24,paddingTop:58,paddingBottom:48,backgroundColor:'#fff',alignItems:'center'},
 eyebrow:{fontSize:12,fontWeight:'800',letterSpacing:1.5,color:'#777'},title:{marginTop:9,fontSize:31,fontWeight:'800'},body:{marginTop:9,color:'#666',textAlign:'center',lineHeight:21},
 amount:{marginTop:20,alignItems:'center'},amountLabel:{color:'#777',fontSize:13},amountValue:{marginTop:4,fontSize:30,fontWeight:'900'},
 qrCard:{marginTop:20,padding:14,borderWidth:1,borderColor:'#e5e5e5',borderRadius:18,backgroundColor:'#fff'},qr:{width:270,height:270},
 upi:{marginTop:14,fontSize:16,fontWeight:'800',letterSpacing:.3},button:{marginTop:18,width:'100%',minHeight:52,borderRadius:14,alignItems:'center',justifyContent:'center',backgroundColor:'#111'},buttonText:{color:'#fff',fontWeight:'800',fontSize:15},
 secondary:{marginTop:10,width:'100%',minHeight:52,borderRadius:14,borderWidth:1,borderColor:'#ddd',alignItems:'center',justifyContent:'center'},secondaryText:{fontWeight:'800'},
 note:{marginTop:20,color:'#777',fontSize:12,lineHeight:18,textAlign:'center'},confirm:{marginTop:12,width:'100%',minHeight:52,borderRadius:14,alignItems:'center',justifyContent:'center',backgroundColor:'#eee'},confirmText:{fontWeight:'800'},hidden:{opacity:0,height:0}
});
