import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { setPurchaseContext } from '../src/services/cart';

const HOME_OPTIONS: Record<string,string[]> = {
  MILK: ['Everyday Drinking','Tea','Coffee','Cooking','Paneer / Curd Making','Rich Milk Preference'],
  PANEER: ['Home Cooking','Snacks / Meals','Regular Home Requirement'],
  CURD: ['Everyday Eating','Cooking','Regular Home Requirement'],
  BUTTER: ['Breakfast','Baking / Cooking','Regular Home Requirement'],
  GHEE: ['Cooking','Puja / Traditional Use','Regular Home Requirement'],
  KHOYA_MAWA: ['Sweets','Home Cooking','Occasional Requirement'],
};

const BUSINESS_OPTIONS: Record<string,string[]> = {
  MILK: ['Tea / Coffee','Cooking','Daily Milk Requirement','Regular Bulk Requirement'],
  PANEER: ['Daily Kitchen Requirement','Restaurant / Food Preparation','Regular Bulk Requirement'],
  CURD: ['Daily Restaurant Requirement','Kitchen / Food Preparation','Regular Bulk Requirement'],
  BUTTER: ['Bakery / Kitchen','Restaurant Requirement','Regular Bulk Requirement'],
  GHEE: ['Cooking','Sweet / Food Preparation','Regular Bulk Requirement'],
  KHOYA_MAWA: ['Sweets / Mithai','Food Preparation','Regular Bulk Requirement'],
};

function keyFor(value:string) {
  const v=value.toUpperCase();
  if(v.includes('MILK')) return 'MILK';
  if(v.includes('PANEER')) return 'PANEER';
  if(v.includes('CURD')) return 'CURD';
  if(v.includes('BUTTER')) return 'BUTTER';
  if(v.includes('GHEE')) return 'GHEE';
  if(v.includes('KHOYA')||v.includes('MAWA')) return 'KHOYA_MAWA';
  return v;
}

export default function PurchaseIntentScreen(){
 const router=useRouter();
 const {product='',locality='',postalCode='',source=''}=useLocalSearchParams<{product?:string;locality?:string;postalCode?:string;source?:string}>();
 const category=keyFor(String(product)); const [customerType,setCustomerType]=useState<'HOME'|'BUSINESS'|null>(null);
 const [requirement,setRequirement]=useState(''); const [source,setSource]=useState(''); const [orderType,setOrderType]=useState<'STANDARD'|'ONE_TIME_BULK'|'RECURRING_BULK'|null>(null);
 const options=customerType==='HOME'?HOME_OPTIONS[category]??['Everyday Home Requirement']:customerType==='BUSINESS'?BUSINESS_OPTIONS[category]??['Regular Business Requirement']:[];
 function continueFlow(){
   if(!customerType||!requirement) return;
   if(category==='MILK' && !source) return;
   if(customerType==='HOME'){
     setPurchaseContext({customerType:'HOME',orderType:'STANDARD',category,requirement});
     router.push({pathname:'/discovery',params:{locality,postalCode,product,source,customerType:'HOME',requirement}});
     return;
   }
   if(!orderType) return;
   if(orderType==='RECURRING_BULK'){
     router.push({pathname:'/gwalawala-plus',params:{locality,postalCode,product,source,category,requirement}});
     return;
   }
   setPurchaseContext({customerType:'BUSINESS',orderType,category,requirement});
   router.push({pathname:'/discovery',params:{locality,postalCode,product,source,customerType:'BUSINESS',requirement,orderType}});
 }
 return <ScrollView contentContainerStyle={styles.container}>
   <Pressable onPress={()=>router.back()}><Text style={styles.back}>← Back</Text></Pressable>
   <Text style={styles.eyebrow}>{String(product).toUpperCase()}</Text>
   <Text style={styles.title}>Who are you buying for?</Text>
   <Text style={styles.subtitle}>We’ll tailor the buying experience to what you need.</Text>
   <View style={styles.row}>
    <Choice title="🏠 Home" body="For your household" selected={customerType==='HOME'} onPress={()=>{setCustomerType('HOME');setRequirement('');setSource('');setOrderType(null)}}/>
    <Choice title="🏪 Business" body="Shop / Restaurant / Hotel" selected={customerType==='BUSINESS'} onPress={()=>{setCustomerType('BUSINESS');setRequirement('');setSource('');setOrderType(null)}}/>
   </View>
   {customerType&&requirement&&category==='MILK'?<View style={styles.section}>
    <Text style={styles.sectionTitle}>Choose your milk source</Text>
    <View style={styles.options}>
      {['Cow','Buffalo','Mixed'].map(o=><Pressable key={o} onPress={()=>setSource(o.toLowerCase())} style={[styles.option,source===o.toLowerCase()&&styles.selected]}><Text style={source===o.toLowerCase()?styles.selectedText:styles.optionText}>{o} Milk</Text></Pressable>)}
    </View>
   </View>:null}
   {customerType?<View style={styles.section}>
    <Text style={styles.sectionTitle}>{customerType==='HOME'?'What do you use it for?':'What is your business requirement?'}</Text>
    <View style={styles.options}>{options.map(o=><Pressable key={o} onPress={()=>setRequirement(o)} style={[styles.option,requirement===o&&styles.selected]}><Text style={requirement===o?styles.selectedText:styles.optionText}>{o}</Text></Pressable>)}</View>
   </View>:null}
   {customerType==='BUSINESS'&&requirement?<View style={styles.section}>
     <Text style={styles.sectionTitle}>How do you want to buy?</Text>
     <Pressable style={[styles.orderCard,orderType==='ONE_TIME_BULK'&&styles.selected]} onPress={()=>setOrderType('ONE_TIME_BULK')}><Text style={styles.orderTitle}>One-Time Bulk Order</Text><Text style={styles.orderBody}>₹99 bulk order service fee</Text></Pressable>
     <Pressable style={[styles.orderCard,orderType==='RECURRING_BULK'&&styles.selected]} onPress={()=>setOrderType('RECURRING_BULK')}><View style={styles.plusRow}><Text style={styles.orderTitle}>Daily / Regular Bulk</Text><Text style={styles.plusPill}>⭐ Plus</Text></View><Text style={styles.orderBody}>Gwalawala Business · ₹499/month</Text><Text style={styles.link}>See benefits</Text></Pressable>
   </View>:null}
   {customerType&&requirement&&(customerType==='HOME'||orderType)?<Pressable style={styles.button} onPress={continueFlow}><Text style={styles.buttonText}>{customerType==='BUSINESS'&&orderType==='RECURRING_BULK'?'Continue to Gwalawala Plus':'Continue'}</Text></Pressable>:null}
 </ScrollView>;
}
function Choice({title,body,selected,onPress}:{title:string;body:string;selected:boolean;onPress:()=>void}){return <Pressable onPress={onPress} style={[styles.choice,selected&&styles.selected]}><Text style={styles.choiceTitle}>{title}</Text><Text style={styles.choiceBody}>{body}</Text></Pressable>}
const styles=StyleSheet.create({container:{padding:24,paddingTop:56,paddingBottom:48,backgroundColor:'#fff',flexGrow:1},back:{fontSize:15,fontWeight:'700',marginBottom:28},eyebrow:{fontSize:12,fontWeight:'800',letterSpacing:1.5,color:'#777'},title:{marginTop:9,fontSize:31,lineHeight:38,fontWeight:'800'},subtitle:{marginTop:9,color:'#666',fontSize:15,lineHeight:22},row:{flexDirection:'row',gap:10,marginTop:24},choice:{flex:1,minHeight:115,padding:16,borderWidth:1,borderColor:'#e2e2e2',borderRadius:17,justifyContent:'center'},selected:{borderColor:'#111',backgroundColor:'#f4f4f4'},choiceTitle:{fontSize:17,fontWeight:'800'},choiceBody:{marginTop:7,color:'#777',fontSize:12,lineHeight:18},section:{marginTop:28},sectionTitle:{fontSize:19,fontWeight:'800'},options:{gap:10,marginTop:14},option:{padding:16,borderWidth:1,borderColor:'#e2e2e2',borderRadius:14},optionText:{fontSize:15,fontWeight:'700'},selectedText:{fontSize:15,fontWeight:'800'},orderCard:{marginTop:12,padding:17,borderWidth:1,borderColor:'#e2e2e2',borderRadius:15},orderTitle:{fontSize:16,fontWeight:'800'},orderBody:{marginTop:6,color:'#666'},plusRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},plusPill:{fontSize:12,fontWeight:'800'},link:{marginTop:9,fontWeight:'800',fontSize:13},button:{marginTop:28,minHeight:54,borderRadius:14,alignItems:'center',justifyContent:'center',backgroundColor:'#111'},buttonText:{color:'#fff',fontSize:16,fontWeight:'700'}});
