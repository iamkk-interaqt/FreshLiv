import { useEffect, useRef, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CFPaymentGatewayService } from 'react-native-cashfree-pg-sdk';
import { CFEnvironment, CFSession } from 'cashfree-pg-api-contract';
import { supabase } from '../src/lib/supabase';
import { setPurchaseContext } from '../src/services/cart';
import { useAuth } from '../src/auth/AuthProvider';

export default function GwalawalaPlusScreen(){
 const router=useRouter(); const {user}=useAuth();
 const params=useLocalSearchParams<{category?:string;requirement?:string;product?:string;source?:string;locality?:string;postalCode?:string}>();
 const [price,setPrice]=useState(499); const [active,setActive]=useState(false); const [loading,setLoading]=useState(true); const [paying,setPaying]=useState(false); const [error,setError]=useState('');
 const pending=useRef<{subscriptionId:string;cashfreeOrderId:string}|null>(null);
 useEffect(()=>{
   CFPaymentGatewayService.setCallback({
    onVerify: async (orderID:string)=>{
      const p=pending.current; if(!p||p.cashfreeOrderId!==orderID)return;
      try{
       const verified=await supabase.functions.invoke('verify-gwalawala-plus-payment',{body:{subscriptionId:p.subscriptionId,cashfreeOrderId:p.cashfreeOrderId}});
       if(verified.error) throw verified.error;
       if(!verified.data?.success){setError('Payment is still being confirmed. Please check your Plus status again shortly.');return;}
       setActive(true); setPurchaseContext({customerType:'BUSINESS',orderType:'RECURRING_BULK',category:params.category,requirement:params.requirement});
       pending.current=null;
       router.replace({pathname:'/discovery',params:{...params,customerType:'BUSINESS',orderType:'RECURRING_BULK'}});
      }catch(e){setError(e instanceof Error?e.message:'Subscription payment verification failed.')}
      finally{setPaying(false);}
    },
    onError: (_e:unknown,orderID:string)=>{if(pending.current?.cashfreeOrderId===orderID){pending.current=null;setError('Payment was not completed. You can try again.');setPaying(false);}}
   });
   return ()=>CFPaymentGatewayService.removeCallback();
 },[router,params.category,params.requirement]);

 useEffect(()=>{(async()=>{if(!user){setLoading(false);return} try{
   const [{data:p},{data:s}]=await Promise.all([
    supabase.rpc('get_monetization_amount',{p_key:'business_monthly_price'}),
    supabase.from('business_subscriptions').select('status,expires_at').eq('customer_id',user.id).eq('status','ACTIVE').maybeSingle()
   ]);
   setPrice(Number(p??499)); setActive(Boolean(s&&(!s.expires_at||new Date(s.expires_at)>new Date())));
 }catch(e){setError(e instanceof Error?e.message:'Unable to load Plus status.')}finally{setLoading(false)}})()},[user]);
 async function subscribe(){
   if(!user){router.push('/customer-auth');return}
   setPaying(true);setError('');
   try{
    const {data,error:e}=await supabase.functions.invoke('create-gwalawala-plus-payment');
    if(e) throw e;
    if(!data?.paymentSessionId) throw new Error(data?.error||'Unable to start subscription payment.');
    const env=data.environment==='PRODUCTION'?CFEnvironment.PRODUCTION:CFEnvironment.SANDBOX;
    pending.current={subscriptionId:data.subscriptionId,cashfreeOrderId:data.cashfreeOrderId};
    CFPaymentGatewayService.doWebPayment(new CFSession(data.paymentSessionId,data.cashfreeOrderId,env));
   }catch(e){setError(e instanceof Error?e.message:'Subscription could not be completed.')}finally{setPaying(false)}
 }
 if(loading)return <View style={styles.center}><ActivityIndicator/><Text style={styles.muted}>Checking Gwalawala Plus…</Text></View>;
 return <ScrollView contentContainerStyle={styles.container}>
  <Pressable onPress={()=>router.back()}><Text style={styles.back}>← Back</Text></Pressable>
  <Text style={styles.eyebrow}>GWALAWALA PLUS</Text>
  <View style={styles.hero}><Text style={styles.icon}>⭐</Text><Text style={styles.title}>Gwalawala Plus</Text><Text style={styles.subtitle}>Built for restaurants, hotels, cafés & shops.</Text></View>
  {active?<><View style={styles.active}><Text style={styles.activeTitle}>⭐ Gwalawala Plus is active</Text><Text style={styles.activeBody}>Eligible recurring bulk orders have a ₹0 Gwalawala bulk service fee.</Text></View><Pressable style={styles.button} onPress={()=>{setPurchaseContext({customerType:'BUSINESS',orderType:'RECURRING_BULK',category:params.category,requirement:params.requirement});router.replace({pathname:'/discovery',params:{...params,customerType:'BUSINESS',orderType:'RECURRING_BULK'}})}}><Text style={styles.buttonText}>Continue with Gwalawala Plus</Text></Pressable></>:<><Text style={styles.price}>₹{price}<Text style={styles.month}>/month</Text></Text><View style={styles.list}>{['Recurring bulk orders','No ₹99 one-time bulk-order service fee on eligible recurring bulk orders','Set daily/weekly requirements','Compare Dairywalas and prices','Monthly purchase reports','Dairy expense tracking','AI usage insights','Easy reorder'].map(x=><Text key={x} style={styles.benefit}>✓ {x}</Text>)}</View>{error?<Text style={styles.error}>{error}</Text>:null}<Pressable disabled={paying} style={styles.button} onPress={subscribe}>{paying?<ActivityIndicator color="#fff"/>:<Text style={styles.buttonText}>Start Gwalawala Plus — ₹{price}/month</Text>}</Pressable></>}
 </ScrollView>
}
const styles=StyleSheet.create({container:{padding:24,paddingTop:56,paddingBottom:48,backgroundColor:'#fff',flexGrow:1},center:{flex:1,alignItems:'center',justifyContent:'center',gap:12,backgroundColor:'#fff'},back:{fontSize:15,fontWeight:'700',marginBottom:28},eyebrow:{fontSize:12,fontWeight:'800',letterSpacing:1.5,color:'#777'},hero:{marginTop:18,padding:24,borderRadius:20,backgroundColor:'#f7f7f7'},icon:{fontSize:30},title:{marginTop:8,fontSize:32,fontWeight:'800'},subtitle:{marginTop:7,color:'#666',fontSize:15,lineHeight:22},price:{marginTop:28,fontSize:38,fontWeight:'900'},month:{fontSize:16,fontWeight:'600',color:'#666'},list:{marginTop:18,gap:12},benefit:{fontSize:15,lineHeight:22,color:'#333'},button:{marginTop:28,minHeight:56,borderRadius:15,alignItems:'center',justifyContent:'center',backgroundColor:'#111'},buttonText:{color:'#fff',fontSize:15,fontWeight:'800'},error:{marginTop:14,color:'#b00020',lineHeight:20},active:{marginTop:28,padding:18,borderRadius:16,borderWidth:1,borderColor:'#ddd'},activeTitle:{fontSize:18,fontWeight:'800'},activeBody:{marginTop:7,color:'#666',lineHeight:21},muted:{color:'#777'}});
