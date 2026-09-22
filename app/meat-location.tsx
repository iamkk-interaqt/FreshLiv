import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
export default function MeatLocationScreen(){
 const router=useRouter(); const[locality,setLocality]=useState(''); const[postalCode,setPostalCode]=useState('');
 const canContinue=locality.trim().length>0||postalCode.trim().length>0;
 return <View style={styles.container}><Text style={styles.eyebrow}>MEAT & EGGS · LOCATION</Text><Text style={styles.title}>Where should we find your local meat supply?</Text><Text style={styles.body}>We use your area to find active chicken, mutton, fish and egg sellers who actually serve your locality.</Text>
 <Text style={styles.label}>Locality / Area</Text><TextInput value={locality} onChangeText={setLocality} placeholder="e.g. Indirapuram" placeholderTextColor="#999" style={styles.input} autoCapitalize="words"/>
 <Text style={styles.label}>PIN code</Text><TextInput value={postalCode} onChangeText={setPostalCode} placeholder="e.g. 201014" placeholderTextColor="#999" keyboardType="number-pad" maxLength={6} style={styles.input}/>
 <Pressable disabled={!canContinue} onPress={()=>router.push({pathname:'/meat-category',params:{locality,postalCode}})} style={[styles.button,!canContinue&&styles.disabled]}><Text style={styles.buttonText}>Continue</Text></Pressable>
 <Text style={styles.note}>Only real seller inventory will be shown.</Text></View>;
}
const styles=StyleSheet.create({container:{flex:1,padding:24,paddingTop:68,backgroundColor:'#fff'},eyebrow:{fontSize:12,fontWeight:'800',letterSpacing:1.5,color:'#777'},title:{marginTop:10,fontSize:30,lineHeight:37,fontWeight:'800'},body:{marginTop:12,fontSize:16,lineHeight:24,color:'#666'},label:{marginTop:25,marginBottom:8,fontSize:14,fontWeight:'700'},input:{height:52,borderWidth:1,borderColor:'#ddd',borderRadius:13,paddingHorizontal:15,fontSize:16},button:{marginTop:24,height:54,borderRadius:14,alignItems:'center',justifyContent:'center',backgroundColor:'#111'},disabled:{opacity:.35},buttonText:{color:'#fff',fontSize:16,fontWeight:'700'},note:{marginTop:16,textAlign:'center',color:'#888',fontSize:12}});
