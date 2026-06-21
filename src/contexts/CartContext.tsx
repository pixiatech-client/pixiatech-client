'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { RenterDetails } from '@/lib/signature-types';

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  category: string;
  type: 'purchase' | 'rental';
  rentalStartDate?: string;
  rentalEndDate?: string;
  rentalStartTime?: string;
  rentalEndTime?: string;
  renterDetails?: RenterDetails;
  additionalNotes?: string;
  contractSignedAt?: string;
  rentalFlowCompleted?: boolean;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>, qty?: number) => void;
  removeItem: (productId: string, type?: 'purchase' | 'rental') => void;
  updateQuantity: (productId: string, qty: number, type?: 'purchase' | 'rental') => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const STORAGE_KEY = 'boutique-cart';

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: CartItem[] = JSON.parse(stored);
        const migrated = parsed.map(i => i.type ? i : { ...i, type: 'purchase' as const });
        setItems(migrated);
      }
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const addItem = useCallback((product: Omit<CartItem, 'quantity'>, qty = 1) => {
    setItems(prev => {
      const existing = prev.find(i => i.productId === product.productId && i.type === product.type);
      if (existing) {
        return prev.map(i =>
          i.productId === product.productId && i.type === product.type
            ? { ...i, quantity: i.quantity + qty }
            : i
        );
      }
      return [...prev, { ...product, quantity: qty }];
    });
  }, []);

  const removeItem = useCallback((productId: string, type?: 'purchase' | 'rental') => {
    setItems(prev =>
      type !== undefined
        ? prev.filter(i => !(i.productId === productId && i.type === type))
        : prev.filter(i => i.productId !== productId)
    );
  }, []);

  const updateQuantity = useCallback((productId: string, qty: number, type?: 'purchase' | 'rental') => {
    if (qty < 1) return;
    setItems(prev =>
      prev.map(i =>
        type !== undefined
          ? i.productId === productId && i.type === type ? { ...i, quantity: qty } : i
          : i.productId === productId ? { ...i, quantity: qty } : i
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, itemCount, subtotal }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
