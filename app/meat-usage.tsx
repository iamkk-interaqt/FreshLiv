import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function MeatUsageScreen() {
 const router=useRouter();
 const params=useLocalSearchParams<{locality?:string;postalCode?:string;category?:string;variant?:string}>();
 const category=String(params.category||'CHICKEN').toUpperCase();
 const choose=(mode:'HOME'|'BUSINESS')=>{
  if(mode==='HOME') router.push({pathname:'/meat-quantity',params:{...params,usage:'HOME'}});
  else router.push({pathname:'/meat-subscription',params:{...params,category,variant,usage:'SHOP',vertical:'MEAT'}});
 };
 return <View style={styles.container}>
  <Text style={styles.eyebrow}>MEAT & EGGS</Text>
  <Text style={styles.title}>How are you buying?</Text>
  <Text style={styles.body}>Choose home use or business supply.</Text>
  <Pressable style={styles.card} onPress={()=>choose('HOME')}><Text style={styles.emoji}>🏠</Text><View style={styles.copy}><Text style={styles.cardTitle}>Home</Text><Text style={styles.cardBody}>For your household</Text></View><Text style={styles.arrow}>›</Text></Pressable>
  <Pressable style={styles.card} onPress={()=>choose('BUSINESS')}><Text style={styles.emoji}>🏪</Text><View style={styles.copy}><Text style={styles.cardTitle}>Restaurant / Shop</Text><Text style={styles.cardBody}>One-time bulk or FreshLiv Plus recurring supply</Text></View><Text style={styles.arrow}>›</Text></Pressable>
 </View>;
}
const styles=StyleSheet.create({container:{flex:1,padding:24,paddingTop:64,backgroundColor:'#fff'},eyebrow:{fontSize:12,fontWeight:'800',letterSpacing:1.5,color:'#777'},title:{marginTop:10,fontSize:30,fontWeight:'800'},body:{marginTop:10,color:'#666',lineHeight:22},card:{marginTop:18,minHeight:92,padding:18,borderWidth:1,borderColor:'#e5e5e5',borderRadius:16,flexDirection:'row',alignItems:'center'},emoji:{fontSize:32,width:52},copy:{flex:1},cardTitle:{fontSize:18,fontWeight:'800'},cardBody:{marginTop:5,color:'#777',lineHeight:20},arrow:{fontSize:30,color:'#777'}});