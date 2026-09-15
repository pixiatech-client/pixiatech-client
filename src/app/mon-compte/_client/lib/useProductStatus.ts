'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchBoutiqueProducts, type Product } from '@/lib/boutique-data';
import { isProductOutOfStockForSale, isProductAvailable } from '@/lib/product-status';

export type ProductStatusType =
  | 'available'
  | 'sur_commande'
  | 'out_of_stock'
  | 'unavailable'
  | 'not_found'
  | 'loading';

export interface ProductStatusInfo {
  type: ProductStatusType;
  label?: string;
  badgeClass?: string;
  href?: string;
  isClickable: boolean;
  product?: Product | null;
}

// Global in-memory cache to avoid duplicate network fetches between tabs
let cachedCatalog: Product[] | null = null;
let fetchPromise: Promise<Product[]> | null = null;

export function useProductCatalog() {
  const [catalog, setCatalog] = useState<Product[]>(cachedCatalog || []);
  const [loading, setLoading] = useState<boolean>(!cachedCatalog);

  useEffect(() => {
    let isMounted = true;

    if (cachedCatalog) {
      setCatalog(cachedCatalog);
      setLoading(false);
      return;
    }

    if (!fetchPromise) {
      fetchPromise = fetchBoutiqueProducts(true)
        .then((prods) => {
          cachedCatalog = prods;
          return prods;
        })
        .catch((err) => {
          console.warn('[useProductCatalog] Failed to fetch boutique products:', err);
          return [];
        });
    }

    fetchPromise.then((prods) => {
      if (isMounted) {
        setCatalog(prods);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const getProductStatus = useCallback(
    (productId?: string, productName?: string): ProductStatusInfo => {
      if (loading && (!catalog || catalog.length === 0)) {
        return {
          type: 'loading',
          isClickable: Boolean(productId),
          href: productId ? `/boutique/produit/${productId}` : '/boutique',
        };
      }

      const cleanId = (productId || '').trim();
      const cleanName = (productName || '').trim().toLowerCase();

      // 1. Match by exact ID
      let matched = catalog.find((p) => p.id === cleanId);

      // 2. Match by case-insensitive ID
      if (!matched && cleanId) {
        matched = catalog.find((p) => p.id.toLowerCase() === cleanId.toLowerCase());
      }

      // 3. Match by name
      if (!matched && cleanName) {
        matched = catalog.find((p) => (p.name || '').trim().toLowerCase() === cleanName);
      }

      // 4. Fuzzy / substring matching for long names
      if (!matched && cleanName && cleanName.length >= 4) {
        matched = catalog.find((p) => {
          const pName = (p.name || '').trim().toLowerCase();
          return pName.length >= 4 && (cleanName.includes(pName) || pName.includes(cleanName));
        });
      }

      // Product was not found in catalog -> "Le produit n'existe plus"
      if (!matched) {
        return {
          type: 'not_found',
          label: "Le produit n'existe plus",
          badgeClass: 'bg-red-50 text-red-600 border border-red-200',
          isClickable: false,
          product: null,
        };
      }

      const href = `/boutique/produit/${matched.id}`;

      // Hidden product -> "Produit non disponible"
      if (matched.isHidden) {
        return {
          type: 'unavailable',
          label: 'Produit non disponible',
          badgeClass: 'bg-red-50 text-red-600 border border-red-200',
          href,
          isClickable: true,
          product: matched,
        };
      }

      // Out of stock
      const outOfStock = isProductOutOfStockForSale(matched) || !isProductAvailable(matched);
      if (outOfStock) {
        return {
          type: 'out_of_stock',
          label: 'Rupture de stock',
          badgeClass: 'bg-red-50 text-red-600 border border-red-200',
          href,
          isClickable: true,
          product: matched,
        };
      }

      // Sur commande
      const avail = matched.availableFor || [];
      if (avail.includes('sur-commande')) {
        return {
          type: 'sur_commande',
          label: 'Sur commande',
          badgeClass: 'bg-amber-50 text-amber-700 border border-amber-200',
          href,
          isClickable: true,
          product: matched,
        };
      }

      // In stock / Available
      return {
        type: 'available',
        label: 'En stock',
        badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
        href,
        isClickable: true,
        product: matched,
      };
    },
    [catalog, loading]
  );

  return useMemo(
    () => ({
      catalog,
      loading,
      getProductStatus,
    }),
    [catalog, loading, getProductStatus]
  );
}
