'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { RenterDetails } from '@/lib/signature-types';

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  image: string | null;
  quantity: number;
  category: string;
  type: 'purchase' | 'rental';
  variantName?: string;
  variantReference?: string;
  variantImage?: string | null;
  variantPrice?: number;
  rentalStartDate?: string;
  rentalEndDate?: string;
  rentalStartTime?: string;
  rentalEndTime?: string;
  renterDetails?: RenterDetails;
  additionalNotes?: string;
  contractSignedAt?: string;
  rentalFlowCompleted?: boolean;
}

interface PromoInfo {
  code: string;
  discount: number;
  type: 'percentage' | 'fixed';
  value: number;
  promoDocId: string;
}

interface CartContextType {
  items: CartItem[];
  savedItems: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>, qty?: number) => void;
  removeItem: (productId: string, type?: 'purchase' | 'rental', variantName?: string) => void;
  updateQuantity: (productId: string, qty: number, type?: 'purchase' | 'rental', variantName?: string) => void;
  clearCart: () => void;
  saveItem: (item: CartItem) => void;
  unsaveItem: (productId: string, type?: 'purchase' | 'rental', variantName?: string) => void;
  moveToCart: (item: CartItem) => void;
  isSaved: (productId: string, variantName?: string) => boolean;
  itemCount: number;
  subtotal: number;
  promo: PromoInfo | null;
  promoError: string;
  applyPromo: (code: string) => Promise<void>;
  removePromo: () => void;
  totalAfterDiscount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const STORAGE_KEY = 'boutique-cart';
const SAVED_KEY = 'boutique-saved';

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [savedItems, setSavedItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [promo, setPromo] = useState<PromoInfo | null>(null);
  const [promoError, setPromoError] = useState('');

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: CartItem[] = JSON.parse(stored);
        const migrated = parsed.map(i => i.type ? i : { ...i, type: 'purchase' as const });
        setItems(migrated);
      }
    } catch {}
    try {
      const stored = localStorage.getItem(SAVED_KEY);
      if (stored) {
        const parsed: CartItem[] = JSON.parse(stored);
        const migrated = parsed.map(i => i.type ? i : { ...i, type: 'purchase' as const });
        setSavedItems(migrated);
      }
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  useEffect(() => {
    if (hydrated) localStorage.setItem(SAVED_KEY, JSON.stringify(savedItems));
  }, [savedItems, hydrated]);

  useEffect(() => {
    setPromo(null);
    setPromoError('');
  }, [items]);

  const addItem = useCallback((product: Omit<CartItem, 'quantity'>, qty = 1) => {
    setItems(prev => {
      const existing = prev.find(i =>
        i.productId === product.productId &&
        i.type === product.type &&
        i.variantName === product.variantName
      );
      if (existing) {
        return prev.map(i =>
          i.productId === product.productId && i.type === product.type && i.variantName === product.variantName
            ? { ...i, quantity: i.quantity + qty }
            : i
        );
      }
      return [...prev, { ...product, quantity: qty }];
    });
  }, []);

  const removeItem = useCallback((productId: string, type?: 'purchase' | 'rental', variantName?: string) => {
    setItems(prev =>
      type !== undefined
        ? prev.filter(i => !(i.productId === productId && i.type === type && (variantName === undefined || i.variantName === variantName)))
        : prev.filter(i => i.productId !== productId)
    );
  }, []);

  const updateQuantity = useCallback((productId: string, qty: number, type?: 'purchase' | 'rental', variantName?: string) => {
    if (qty < 1) return;
    setItems(prev =>
      prev.map(i =>
        type !== undefined
          ? i.productId === productId && i.type === type && (variantName === undefined || i.variantName === variantName) ? { ...i, quantity: qty } : i
          : i.productId === productId ? { ...i, quantity: qty } : i
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const saveItem = useCallback((item: CartItem) => {
    setSavedItems(prev => {
      const exists = prev.find(i =>
        i.productId === item.productId &&
        i.type === item.type &&
        i.variantName === item.variantName
      );
      if (exists) return prev;
      return [...prev, { ...item, quantity: 1 }];
    });
  }, []);

  const unsaveItem = useCallback((productId: string, type?: 'purchase' | 'rental', variantName?: string) => {
    setSavedItems(prev =>
      prev.filter(i => !(
        i.productId === productId &&
        (type === undefined || i.type === type) &&
        (variantName === undefined || i.variantName === variantName)
      ))
    );
  }, []);

  const moveToCart = useCallback((item: CartItem) => {
    setItems(prev => {
      const base = { productId: item.productId, name: item.name, price: item.price, image: item.image, category: item.category, type: item.type, variantName: item.variantName, variantReference: item.variantReference, variantImage: item.variantImage, variantPrice: item.variantPrice };
      const existing = prev.find(i =>
        i.productId === item.productId &&
        i.type === item.type &&
        i.variantName === item.variantName
      );
      if (existing) {
        return prev.map(i =>
          i.productId === item.productId && i.type === item.type && i.variantName === item.variantName
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        );
      }
      return [...prev, { ...base, quantity: item.quantity }];
    });
    setSavedItems(prev =>
      prev.filter(i => !(
        i.productId === item.productId &&
        i.type === item.type &&
        i.variantName === item.variantName
      ))
    );
  }, []);

  const isSaved = useCallback((productId: string, variantName?: string): boolean => {
    return savedItems.some(i =>
      i.productId === productId &&
      (variantName === undefined || i.variantName === variantName)
    );
  }, [savedItems]);

  const applyPromo = useCallback(async (code: string) => {
    setPromoError('');
    try {
      const cartTotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
      const res = await fetch('/api/promo/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, cartTotal }),
      });
      const data = await res.json();
      if (!data.valid) {
        setPromoError(data.error || 'Code invalide');
        setPromo(null);
        return;
      }
      setPromo({ code: code.toUpperCase(), discount: data.discount, type: data.type, value: data.value, promoDocId: data.promoDocId });
    } catch {
      setPromoError('Erreur lors de la validation du code');
      setPromo(null);
    }
  }, [items]);

  const removePromo = useCallback(() => {
    setPromo(null);
    setPromoError('');
  }, []);

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const totalAfterDiscount = promo ? Math.max(0, subtotal - promo.discount) : subtotal;

  return (
    <CartContext.Provider value={{ items, savedItems, addItem, removeItem, updateQuantity, clearCart, saveItem, unsaveItem, moveToCart, isSaved, itemCount, subtotal, promo, promoError, applyPromo, removePromo, totalAfterDiscount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
