'use client';

import { createContext, useContext, useState, useSyncExternalStore } from 'react';

const emptySubscribe = () => () => {};

export function useIsHydrated() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

export interface CartItem {
  productId: number;
  name: string;
  slug: string;
  image: string | null;
  mrp: number;
  sellingPrice: number;
  quantity: number;
  maxStock: number;
}

interface CartState {
  items: CartItem[];
}

interface CartStore {
  getState: () => CartState;
  subscribe: (listener: () => void) => () => void;
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  getItemCount: () => number;
  getSubtotal: () => number;
  getTotalMrp: () => number;
  getTotalSavings: () => number;
}

function parseCartState(raw: string | null): CartState {
  if (!raw) return { items: [] };
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return { items: parsed };
    }
    if (parsed && Array.isArray(parsed.items)) {
      return { items: parsed.items };
    }
  } catch {}
  return { items: [] };
}

function createCartStore(): CartStore {
  let state: CartState = { items: [] };
  const listeners = new Set<() => void>();

  // Load from localStorage on init
  if (typeof window !== 'undefined') {
    state = parseCartState(localStorage.getItem('cart'));

    window.addEventListener('storage', (e) => {
      if (e.key === 'cart') {
        state = parseCartState(e.newValue);
        for (const listener of listeners) listener();
      }
    });

    window.addEventListener('cart_sync', () => {
      state = parseCartState(localStorage.getItem('cart'));
      for (const listener of listeners) listener();
    });
  }

  function persist() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cart', JSON.stringify(state));
    }
  }

  function emit() {
    persist();
    for (const listener of listeners) {
      listener();
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cart_sync'));
    }
  }

  return {
    getState: () => state,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    addItem: (item) => {
      const items = Array.isArray(state.items) ? state.items : [];
      const maxLimit = typeof item.maxStock === 'number' && item.maxStock > 0 ? item.maxStock : 999;
      const existing = items.find((i) => i.productId === item.productId);
      if (existing) {
        const newQty = Math.min(existing.quantity + (item.quantity || 1), maxLimit);
        state = {
          items: items.map((i) =>
            i.productId === item.productId ? { ...i, quantity: newQty } : i
          ),
        };
      } else {
        const qty = Math.min(item.quantity || 1, maxLimit);
        state = {
          items: [...items, { ...item, quantity: qty, maxStock: maxLimit }],
        };
      }
      emit();
    },
    removeItem: (productId) => {
      const items = Array.isArray(state.items) ? state.items : [];
      state = { items: items.filter((i) => i.productId !== productId) };
      emit();
    },
    updateQuantity: (productId, quantity) => {
      const items = Array.isArray(state.items) ? state.items : [];
      if (quantity <= 0) {
        state = { items: items.filter((i) => i.productId !== productId) };
      } else {
        state = {
          items: items.map((i) => {
            if (i.productId !== productId) return i;
            const maxLimit = typeof i.maxStock === 'number' && i.maxStock > 0 ? i.maxStock : 999;
            return { ...i, quantity: Math.min(quantity, maxLimit) };
          }),
        };
      }
      emit();
    },
    clearCart: () => {
      state = { items: [] };
      emit();
    },
    getItemCount: () => (state.items || []).reduce((sum, i) => sum + i.quantity, 0),
    getSubtotal: () =>
      (state.items || []).reduce((sum, i) => sum + i.sellingPrice * i.quantity, 0),
    getTotalMrp: () =>
      (state.items || []).reduce((sum, i) => sum + i.mrp * i.quantity, 0),
    getTotalSavings: () =>
      (state.items || []).reduce(
        (sum, i) => sum + (i.mrp - i.sellingPrice) * i.quantity,
        0
      ),
  };
}

const EMPTY_CART: CartState = { items: [] };
const getServerSnapshot = () => EMPTY_CART;

let defaultCartStore: CartStore | null = null;
function getDefaultCartStore(): CartStore {
  if (typeof window !== 'undefined') {
    const win = window as any;
    if (!win.__rajalakshmi_cart_store__) {
      win.__rajalakshmi_cart_store__ = createCartStore();
    }
    return win.__rajalakshmi_cart_store__;
  }
  if (!defaultCartStore) {
    defaultCartStore = createCartStore();
  }
  return defaultCartStore;
}

const CartContext = createContext<CartStore | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [store] = useState(() => getDefaultCartStore());
  return (
    <CartContext.Provider value={store}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const store = useContext(CartContext) ?? getDefaultCartStore();

  const state = useSyncExternalStore(
    store.subscribe,
    store.getState,
    getServerSnapshot
  );

  const items = state.items;
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.sellingPrice * i.quantity, 0);
  const totalMrp = items.reduce((sum, i) => sum + i.mrp * i.quantity, 0);
  const totalSavings = items.reduce(
    (sum, i) => sum + (i.mrp - i.sellingPrice) * i.quantity,
    0
  );

  return {
    items,
    addItem: store.addItem,
    removeItem: store.removeItem,
    updateQuantity: store.updateQuantity,
    clearCart: store.clearCart,
    itemCount,
    subtotal,
    totalMrp,
    totalSavings,
  };
}

export function useCartItemQuantity(productId: number) {
  const store = useContext(CartContext) ?? getDefaultCartStore();

  const state = useSyncExternalStore(
    store.subscribe,
    store.getState,
    getServerSnapshot
  );

  return state.items.find((i) => i.productId === productId)?.quantity ?? 0;
}
