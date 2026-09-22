import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { setPurchaseContext } from '../src/services/cart';

export default function MeatSubscriptionScreen(){
 const router=useRouter();
 const params=useLocalSearchParams<{category?:string;variant?:string;locality?:string;postalCode?:string}>();

 function chooseOneTime(){
  setPurchaseContext({
   customerType:'BUSINESS',
   orderType:'ONE_TIME_BULK',
   category:params.category,
   requirement:'One-Time Bulk Order',
  });
  router.push({
   pathname:'/meat-discovery',
   params:{
    ...params,
    productCategory:params.category,
    usage:'SHOP',
    variant:params.variant,
    bulkOnly:'true',
    orderType:'ONE_TIME_BULK',
    bulkConvenienceFee:'99',
    vertical:'MEAT',
   },
  });
 }

 function choosePlus(){
  router.push({
   pathname:'/gwalawala-plus',
   params:{
    ...params,
    category:params.category,
    requirement:'Recurring Bulk Supply',
    vertical:'MEAT',
   },
  });
 }

 return <View style={styles.container}>
  <Text style={styles.eyebrow}>SHOP / RESTAURANT</Text>
  <Text style={styles.title}>Choose how you want to buy</Text>
  <Text style={styles.body}>For business orders, choose a one-time bulk order or activate FreshLiv Plus for recurring supply.</Text>

  <Pressable style={styles.card} onPress={chooseOneTime}>
   <View style={styles.badgeRow}>
    <Text style={styles.cardTitle}>One-Time Bulk Order</Text>
    <Text style={styles.feeBadge}>₹99</Text>
   </View>
   <Text style={styles.cardBody}>Place a single bulk order without a subscription.</Text>
   <Text style={styles.fee}>One-time bulk convenience fee · ₹99</Text>
   <Text style={styles.action}>Continue with One-Time Bulk ›</Text>
  </Pressable>

  <Pressable style={[styles.card,styles.plusCard]} onPress={choosePlus}>
   <View style={styles.badgeRow}>
    <Text style={styles.cardTitle}>FreshLiv Plus</Text>
    <Text style={styles.plusBadge}>⭐ PLUS</Text>
   </View>
   <Text style={styles.cardBody}>For restaurants, hotels, cafés & shops with recurring bulk requirements.</Text>
   <Text style={styles.fee}>Monthly subscription · ₹499/month</Text>
   <Text style={styles.benefit}>✓ No ₹99 one-time bulk convenience fee on eligible recurring bulk orders</Text>
   <Text style={styles.action}>View FreshLiv Plus ›</Text>
  </Pressable>
 </View>;
}

const styles=StyleSheet.create({
 container:{flex:1,padding:24,paddingTop:64,backgroundColor:'#fff'},
 eyebrow:{fontSize:12,fontWeight:'800',letterSpacing:1.5,color:'#777'},
 title:{marginTop:10,fontSize:30,fontWeight:'800',lineHeight:37},
 body:{marginTop:10,color:'#666',lineHeight:22},
 card:{marginTop:22,padding:19,borderWidth:1,borderColor:'#e1e1e1',borderRadius:17},
 plusCard:{marginTop:13},
 badgeRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:10},
 cardTitle:{fontSize:18,fontWeight:'800',flex:1},
 feeBadge:{paddingHorizontal:10,paddingVertical:6,borderRadius:999,backgroundColor:'#f1f1f1',fontSize:13,fontWeight:'900'},
 plusBadge:{fontSize:11,fontWeight:'900'},
 cardBody:{marginTop:8,color:'#666',lineHeight:21},
 fee:{marginTop:11,fontSize:14,fontWeight:'800'},
 benefit:{marginTop:8,color:'#555',lineHeight:20,fontSize:13},
 action:{marginTop:15,fontWeight:'900'}
});
