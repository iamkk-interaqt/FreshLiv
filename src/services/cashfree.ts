import { supabase } from '../lib/supabase';

export type CashfreePaymentSession = {
  orderId: string;
  cashfreeOrderId: string;
  paymentSessionId: string;
  environment: 'SANDBOX' | 'PRODUCTION';
};

export async function createCashfreePaymentOrder(orderId: string): Promise<CashfreePaymentSession> {
  const { data, error } = await supabase.functions.invoke('create-cashfree-payment-order', {
    body: { orderId },
  });

  if (error) throw error;
  if (!data?.paymentSessionId || !data?.cashfreeOrderId) {
    throw new Error(data?.error || 'Unable to create Cashfree payment session');
  }

  return data as CashfreePaymentSession;
}

export async function verifyCashfreePayment(orderId: string, cashfreeOrderId: string) {
  const { data, error } = await supabase.functions.invoke('verify-cashfree-payment', {
    body: { orderId, cashfreeOrderId },
  });

  if (error) throw error;
  if (!data?.success) throw new Error(data?.error || 'Cashfree payment could not be verified');
  return data;
}
