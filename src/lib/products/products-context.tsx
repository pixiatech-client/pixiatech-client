'use client';

// ============================================================================
// Contexte global des produits du site web (Phase A)
// Calqué sur src/lib/site-web/cms-context.tsx : à la fois publié dans l'app
// /web et partagé avec l'admin. Aucun rendu visuel à ce stade.
// ============================================================================

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';

import { type MegaMenu, type ProductCategory, type ProductCategoryGroup, type ProductRecord } from './types';
import { subscribeProducts, subscribeMegaMenu } from './products-service';
import { subscribeCategories, subscribeGroups } from './categories-service';

interface ProductsContextType {
  products: ProductRecord[];
  categories: ProductCategory[];
  groups: ProductCategoryGroup[];
  menu: MegaMenu | null;
  loading: boolean;
  error: string | null;
  getBySlug: (slug: string) => ProductRecord | null;
  refresh: () => Promise<void>;
}

const ProductsContext = createContext<ProductsContextType | null>(null);

export const ProductsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [groups, setGroups] = useState<ProductCategoryGroup[]>([]);
  const [menu, setMenu] = useState<MegaMenu | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const unsubProducts = subscribeProducts(
      (records) => {
        if (!mounted) return;
        setProducts(records);
        setError(null);
        setLoading(false);
      },
      (err) => {
        if (!mounted) return;
        console.warn('[Products] Error loading products:', err);
        setError(err instanceof Error ? err.message : 'Impossible de charger les produits.');
        setLoading(false);
      }
    );
    const unsubCategories = subscribeCategories(
      (cats) => {
        if (mounted) setCategories(cats);
      },
      (err) => {
        if (mounted) console.warn('[Products] Error loading categories:', err);
      }
    );
    const unsubGroups = subscribeGroups(
      (grps) => {
        if (mounted) setGroups(grps);
      },
      (err) => {
        if (mounted) console.warn('[Products] Error loading category groups:', err);
      }
    );
    const unsubMenu = subscribeMegaMenu(
      (m) => {
        if (mounted) setMenu(m);
      },
      (err) => {
        if (mounted) console.warn('[Products] Error loading mega menu:', err);
      }
    );
    return () => {
      mounted = false;
      unsubProducts();
      unsubCategories();
      unsubGroups();
      unsubMenu();
    };
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const { listProducts, getMegaMenu } = await import('./products-service');
      const { listCategories, listGroups } = await import('./categories-service');
      const [records, nextMenu, nextCategories, nextGroups] = await Promise.all([
        listProducts(),
        getMegaMenu(),
        listCategories(),
        listGroups(),
      ]);
      setProducts(records);
      setMenu(nextMenu);
      setCategories(nextCategories);
      setGroups(nextGroups);
      setError(null);
    } catch (err) {
      console.warn('[Products] Refresh failed:', err);
      setError(err instanceof Error ? err.message : 'Impossible de rafraîchir les produits.');
    } finally {
      setLoading(false);
    }
  }, []);

  const bySlug = useMemo(
    () => new Map(products.map((p) => [p.slug, p])),
    [products]
  );

  const getBySlug = useCallback(
    (slug: string) => bySlug.get(slug) ?? null,
    [bySlug]
  );

  const value = useMemo<ProductsContextType>(
    () => ({ products, categories, groups, menu, loading, error, getBySlug, refresh }),
    [products, categories, groups, menu, loading, error, getBySlug, refresh]
  );

  return <ProductsContext.Provider value={value}>{children}</ProductsContext.Provider>;
};

export function useProducts(): ProductsContextType {
  const ctx = useContext(ProductsContext);
  if (!ctx) {
    throw new Error('useProducts doit être utilisé à l’intérieur de <ProductsProvider>.');
  }
  return ctx;
}
