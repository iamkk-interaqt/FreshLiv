import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { setPurchaseContext } from '../src/services/cart';
import { supabase } from '../src/lib/supabase';
import { useEffect, useState } from 'react';

export default function MeatSubscriptionScreen(){
 const router=useRouter();
 const p=useLocalSearchParams<{category?:string;variant?:string;locality?:string;postalCode?:string}>();
 const[checking,setChecking]=useState(true); const[plusActive,setPlusActive]=useState(false);
 useEffect(()=>{let mounted=true;(async()=>{try{
  const {data:{user}}=await supabase.auth.getUser();
  if(user){const {data}=await supabase.from('business_subscriptions').select('status,expires_at').eq('customer_id',user.id).eq('status','ACTIVE').maybeSingle(); if(mounted&&data?.status==='ACTIVE'&&(!data.expires_at||new Date(data.expires_at)>new Date()))setPlusActive(true);}
 }finally{if(mounted)setChecking(false)}})();return()=>{mounted=false}},[]);
 const oneTime=()=>{setPurchaseContext({customerType:'BUSINESS',orderType:'ONE_TIME_BULK',category:p.category,requirement:'One-Time Bulk Order'});router.push({pathname:'/meat-discovery',params:{...p,productCategory:p.category,usage:'SHOP',variant:p.variant,bulkOnly:'true',orderType:'ONE_TIME_BULK',bulkConvenienceFee:'99'}})};
 const plus=()=>router.push({pathname:'/gwalawala-plus',params:{...p,category:p.category,requirement:'Recurring Bulk Supply',vertical:'MEAT'}});
 if(checking)return <View style={styles.center}><Text>Checking FreshLiv Plus…</Text></View>;
 return <View style={styles.container}><Text style={styles.eyebrow}>RESTAURANT / SHOP</Text><Text style={styles.title}>Choose your business order</Text><Text style={styles.body}>One-time bulk orders have a ₹99 convenience fee. FreshLiv Plus is for recurring supply.</Text>
 <Pressable style={styles.card} onPress={oneTime}><Text style={styles.title2}>One-Time Bulk Order</Text><Text style={styles.fee}>₹99 one-time convenience fee</Text><Text style={styles.link}>Continue →</Text></Pressable>
 <Pressable style={styles.card} onPress={plus}><View style={styles.row}><Text style={styles.title2}>FreshLiv Plus</Text><Text style={styles.badge}>⭐ PLUS</Text></View><Text style={styles.fee}>₹499/month · ₹0 service fee on eligible recurring bulk orders</Text><Text style={styles.link}>{plusActive?'Manage / Continue with Plus':'Subscribe to FreshLiv Plus →'}</Text></Pressable>
 </View>;
}
const styles=StyleSheet.create({container:{flex:1,padding:24,paddingTop:64,backgroundColor:'#fff'},center:{flex:1,alignItems:'center',justifyContent:'center'},eyebrow:{fontSize:12,fontWeight:'800',letterSpacing:1.5,color:'#777'},title:{marginTop:10,fontSize:30,lineHeight:37,fontWeight:'800'},body:{marginTop:10,color:'#666',lineHeight:22},card:{marginTop:20,padding:19,borderWidth:1,borderColor:'#e2e2e2',borderRadius:17},title2:{fontSize:18,fontWeight:'800'},fee:{marginTop:8,color:'#555',lineHeight:21},link:{marginTop:14,fontWeight:'900'},row:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},badge:{fontSize:11,fontWeight:'900'}});