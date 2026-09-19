import { supabase } from '../lib/supabase';
import type { CartItem } from './cart';
import { getPurchaseContext } from './cart';

export type CheckoutAddress = {
  label: string;
  addressLine1: string;
  addressLine2?: string;
  locality: string;
  city: string;
  state: string;
  postalCode: string;
  latitude?: number;
  longitude?: number;
};

export async function saveCustomerAddress(address: CheckoutAddress) {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user) throw new Error('Please sign in before adding an address.');

  const { data, error } = await supabase
    .from('customer_addresses')
    .insert({
      customer_id: user.id,
      label: address.label,
      address_line1: address.addressLine1,
      address_line2: address.addressLine2 || null,
      locality: address.locality,
      city: address.city,
      state: address.state,
      postal_code: address.postalCode,
      latitude: address.latitude ?? null,
      longitude: address.longitude ?? null,
      is_default: false,
    })
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}

export async function createPendingOrder(
  dairywalaId: string,
  addressId: string,
  slotId: string,
  items: CartItem[],
) {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user) throw new Error('Please sign in before placing an order.');
  if (!items.length) throw new Error('Your cart is empty.');

  const context = getPurchaseContext();
  const { data, error } = await supabase.rpc('create_customer_order', {
    p_dairywala_id: dairywalaId,
    p_address_id: addressId,
    p_delivery_slot_id: slotId,
    p_items: items.map((item) => ({ product_id: item.id, quantity: item.quantity })),
    p_customer_type: context.customerType,
    p_order_type: context.orderType,
    p_purchase_category: context.category ?? null,
    p_purchase_requirement: context.requirement ?? null,
  });

  if (error) throw error;
  return String(data);
}
