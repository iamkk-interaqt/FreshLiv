import { supabase } from '../lib/supabase';

export type CustomerProduct = {
  id: string;
  dairywalaId: string;
  name: string;
  description: string | null;
  productType: string | null;
  quantityValue: number | null;
  quantityUnit: string | null;
  price: number;
};

export async function findActiveProducts(dairywalaId: string): Promise<CustomerProduct[]> {
  const id = dairywalaId.trim();
  if (!id) return [];

  const { data, error } = await supabase
    .from('products')
    .select('id, dairywala_id, name, description, product_type, quantity_value, quantity_unit, price')
    .eq('dairywala_id', id)
    .eq('status', 'ACTIVE')
    .order('name', { ascending: true });

  if (error) throw error;

  return (data ?? []).map((product) => ({
    id: product.id,
    dairywalaId: product.dairywala_id,
    name: product.name,
    description: product.description,
    productType: product.product_type,
    quantityValue: product.quantity_value,
    quantityUnit: product.quantity_unit,
    price: Number(product.price),
  }));
}
