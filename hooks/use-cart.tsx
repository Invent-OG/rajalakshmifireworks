'use client';

import { createContext, useContext, useState, useSyncExternalStore } from 'react';

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

function createCartStore(): CartStore {
  let state: CartState = { items: [] };
  const listeners = new Set<() => void>();

  // Load from localStorage on init
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('cart');
      if (saved) {
        state = JSON.parse(saved);
      }
    } catch {
      // Ignore invalid data
    }
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
  }

  return {
    getState: () => state,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    addItem: (item) => {
      const existing = state.items.find((i) => i.productId === item.productId);
      if (existing) {
        const newQty = Math.min(existing.quantity + (item.quantity || 1), item.maxStock);
        state = {
          items: state.items.map((i) =>
            i.productId === item.productId ? { ...i, quantity: newQty } : i
          ),
        };
      } else {
        state = {
          items: [...state.items, { ...item, quantity: item.quantity || 1 }],
        };
      }
      emit();
    },
    removeItem: (productId) => {
      state = { items: state.items.filter((i) => i.productId !== productId) };
      emit();
    },
    updateQuantity: (productId, quantity) => {
      if (quantity <= 0) {
        state = { items: state.items.filter((i) => i.productId !== productId) };
      } else {
        state = {
          items: state.items.map((i) =>
            i.productId === productId
              ? { ...i, quantity: Math.min(quantity, i.maxStock) }
              : i
          ),
        };
      }
      emit();
    },
    clearCart: () => {
      state = { items: [] };
      emit();
    },
    getItemCount: () => state.items.reduce((sum, i) => sum + i.quantity, 0),
    getSubtotal: () =>
      state.items.reduce((sum, i) => sum + i.sellingPrice * i.quantity, 0),
    getTotalMrp: () =>
      state.items.reduce((sum, i) => sum + i.mrp * i.quantity, 0),
    getTotalSavings: () =>
      state.items.reduce(
        (sum, i) => sum + (i.mrp - i.sellingPrice) * i.quantity,
        0
      ),
  };
}

const EMPTY_CART: CartState = { items: [] };
const getServerSnapshot = () => EMPTY_CART;

const CartContext = createContext<CartStore | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [store] = useState(() => createCartStore());
  return (
    <CartContext.Provider value={store}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const store = useContext(CartContext);
  if (!store) throw new Error('useCart must be used within CartProvider');

  const state = useSyncExternalStore(
    store.subscribe,
    store.getState,
    getServerSnapshot
  );

  return {
    items: state.items,
    addItem: store.addItem,
    removeItem: store.removeItem,
    updateQuantity: store.updateQuantity,
    clearCart: store.clearCart,
    itemCount: store.getItemCount(),
    subtotal: store.getSubtotal(),
    totalMrp: store.getTotalMrp(),
    totalSavings: store.getTotalSavings(),
  };
}

export function useCartItemQuantity(productId: number) {
  const store = useContext(CartContext);
  if (!store) throw new Error('useCartItemQuantity must be used within CartProvider');

  const state = useSyncExternalStore(
    store.subscribe,
    store.getState,
    getServerSnapshot
  );

  return state.items.find((i) => i.productId === productId)?.quantity ?? 0;
}
