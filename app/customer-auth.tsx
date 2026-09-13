import { useState } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { supabase } from '../src/lib/supabase';

export default function CustomerAuthScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function sendOtp() {
    setLoading(true); setError('');
    const normalized = phone.replace(/\D/g, '');
    const formatted = normalized.length === 10 ? `+91${normalized}` : phone.trim();
    const { error: sendError } = await supabase.auth.signInWithOtp({ phone: formatted });
    if (sendError) setError(sendError.message);
    else setSent(true);
    setLoading(false);
  }

  async function verifyOtp() {
    setLoading(true); setError('');
    const normalized = phone.replace(/\D/g, '');
    const formatted = normalized.length === 10 ? `+91${normalized}` : phone.trim();
    const { error: verifyError } = await supabase.auth.verifyOtp({ phone: formatted, token: otp.trim(), type: 'sms' });
    if (verifyError) { setError(verifyError.message); setLoading(false); return; }
    router.replace('/checkout');
    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <Pressable onPress={() => router.back()}><Text style={styles.back}>← Back</Text></Pressable>
      <Text style={styles.eyebrow}>CUSTOMER SIGN IN</Text>
      <Text style={styles.title}>{sent ? 'Enter your OTP' : 'Sign in to continue'}</Text>
      <Text style={styles.body}>{sent ? 'We sent a verification code to your mobile number.' : 'Use your mobile number to continue to delivery and payment.'}</Text>
      <TextInput style={styles.input} placeholder="Mobile number" keyboardType="phone-pad" value={phone} onChangeText={setPhone} editable={!sent} />
      {sent ? <TextInput style={styles.input} placeholder="6-digit OTP" keyboardType="number-pad" value={otp} onChangeText={setOtp} maxLength={6} /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable style={styles.button} disabled={loading} onPress={sent ? verifyOtp : sendOtp}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{sent ? 'Verify & continue' : 'Send OTP'}</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 56, backgroundColor: '#fff' },
  back: { fontSize: 15, fontWeight: '700', marginBottom: 30 },
  eyebrow: { fontSize: 12, fontWeight: '800', letterSpacing: 1.5, color: '#777' },
  title: { marginTop: 9, fontSize: 30, fontWeight: '800' },
  body: { marginTop: 12, color: '#666', fontSize: 16, lineHeight: 23 },
  input: { marginTop: 18, height: 54, borderWidth: 1, borderColor: '#ddd', borderRadius: 13, paddingHorizontal: 16, fontSize: 16 },
  error: { marginTop: 12, color: '#b00020', lineHeight: 20 },
  button: { marginTop: 22, minHeight: 54, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#111' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
