import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import {
  CFCallback,
  CFErrorResponse,
  CFPaymentGatewayService,
} from 'react-native-cashfree-pg-sdk';
import { CFEnvironment, CFSession } from 'cashfree-pg-api-contract';
import { createCashfreePaymentOrder, verifyCashfreePayment } from '../src/services/cashfree';
import { clearCart } from '../src/services/cart';

export default function CashfreePaymentScreen() {
  const router = useRouter();
  const { orderId = '' } = useLocalSearchParams<{ orderId?: string }>();
  const [starting, setStarting] = useState(true);

  useEffect(() => {
    const callback: CFCallback = {
      onVerify: async (cashfreeOrderId: string) => {
        try {
          await verifyCashfreePayment(String(orderId), cashfreeOrderId);
          clearCart();
          router.replace({
            pathname: '/order-confirmed',
            params: { id: String(orderId) },
          });
        } catch (error) {
          Alert.alert(
            'Payment verification failed',
            error instanceof Error ? error.message : 'We could not verify the payment.'
          );
          setStarting(false);
        }
      },
      onError: (error: CFErrorResponse, cashfreeOrderId: string) => {
        console.warn('[cashfree] payment error', {
          orderId: cashfreeOrderId,
          message: error?.getMessage?.(),
        });
        Alert.alert(
          'Payment not completed',
          error?.getMessage?.() || 'The payment was not completed. You can try again.'
        );
        setStarting(false);
      },
    };

    CFPaymentGatewayService.setCallback(callback);

    let cancelled = false;

    async function startPayment() {
      try {
        if (!orderId) throw new Error('Missing order reference.');

        const sessionData = await createCashfreePaymentOrder(String(orderId));
        if (cancelled) return;

        const session = new CFSession(
          sessionData.paymentSessionId,
          sessionData.cashfreeOrderId,
          sessionData.environment === 'PRODUCTION'
            ? CFEnvironment.PRODUCTION
            : CFEnvironment.SANDBOX
        );

        CFPaymentGatewayService.doWebPayment(session);
      } catch (error) {
        if (cancelled) return;
        setStarting(false);
        Alert.alert(
          'Unable to open payment',
          error instanceof Error ? error.message : 'Cashfree checkout could not be started.'
        );
      }
    }

    startPayment();

    return () => {
      cancelled = true;
      CFPaymentGatewayService.removeCallback();
    };
  }, [orderId, router]);

  return (
    <View style={styles.container}>
      <View style={styles.icon}>
        <Text style={styles.iconText}>₹</Text>
      </View>
      <Text style={styles.eyebrow}>SECURE PAYMENT</Text>
      <Text style={styles.title}>Opening Cashfree checkout</Text>
      <Text style={styles.body}>
        You will be able to choose a supported payment method inside Cashfree.
      </Text>
      {starting ? (
        <View style={styles.loading}>
          <ActivityIndicator />
          <Text style={styles.muted}>Preparing your payment session…</Text>
        </View>
      ) : (
        <Text style={styles.muted}>If checkout did not open, go back and try again.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  icon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },
  iconText: { color: '#fff', fontSize: 27, fontWeight: '900' },
  eyebrow: { fontSize: 12, fontWeight: '800', letterSpacing: 1.5, color: '#777' },
  title: { marginTop: 10, fontSize: 28, fontWeight: '800', textAlign: 'center' },
  body: { marginTop: 12, color: '#666', lineHeight: 22, textAlign: 'center', maxWidth: 340 },
  loading: { marginTop: 24, alignItems: 'center', gap: 10 },
  muted: { marginTop: 20, color: '#777', textAlign: 'center' },
});
