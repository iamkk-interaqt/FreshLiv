import type { CustomerProduct } from './products';

export type CartItem = CustomerProduct & { quantity: number };

let items: CartItem[] = [];
let listeners: Array<() => void> = [];

export function getCartItems(): CartItem[] {
  return [...items];
}

export function addToCart(product: CustomerProduct, quantity = 1) {
  const existing = items.find((item) => item.id === product.id);
  if (existing) existing.quantity += quantity;
  else items.push({ ...product, quantity });
  notify();
}

export function updateCartQuantity(productId: string, quantity: number) {
  if (quantity <= 0) items = items.filter((item) => item.id !== productId);
  else items = items.map((item) => item.id === productId ? { ...item, quantity } : item);
  notify();
}

export function clearCart() {
  items = [];
  notify();
}

export function getCartTotal(): number {
  return items.reduce((total, item) => total + item.price * item.quantity, 0);
}

export function subscribeToCart(listener: () => void) {
  listeners.push(listener);
  return () => { listeners = listeners.filter((entry) => entry !== listener); };
}

function notify() {
  listeners.forEach((listener) => listener());
}
