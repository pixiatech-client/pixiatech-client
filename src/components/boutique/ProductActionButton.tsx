'use client';

import { useRouter } from 'next/navigation';
import { ShoppingBag } from 'lucide-react';
import { formatPrice } from '@/lib/boutique-data';
import type { Product } from '@/lib/boutique-data';

export function formatProductPriceLabel(product: Product): string {
  if (product.priceDisplay === 'free') return 'Gratuit';
  if (product.priceDisplay === 'multiprice') return 'Tarifs multiples';
  if (product.priceDisplay === 'quote') return 'Sur devis';
  return formatPrice(product.price);
}

export function isProductMoreInfo(product: Product): boolean {
  return !(product.price > 0) && (product.priceDisplay === 'multiprice' || product.priceDisplay === 'quote');
}

export function PriceDisplay({ product, className }: { product: Product; className?: string }) {
  return <span className={className ?? 'text-xl font-extrabold text-gray-900'}>{formatProductPriceLabel(product)}</span>;
}

export function ActionButton({ product, onAddToCart }: { product: Product; onAddToCart: () => void }) {
  const router = useRouter();

  if (isProductMoreInfo(product)) {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          router.push(`/boutique/produit/${product.id}`);
        }}
        type="button"
        className="inline-flex items-center justify-center gap-1.5 text-white bg-gray-900 hover:bg-gray-800 border border-transparent focus:ring-4 focus:ring-gray-300 shadow-sm font-medium rounded-xl text-xs px-3.5 py-2 transition-all cursor-pointer w-full md:w-auto"
      >
        Plus d'infos
      </button>
    );
  }

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        onAddToCart();
      }}
      type="button"
      className="inline-flex items-center justify-center gap-1.5 text-white bg-gray-900 hover:bg-gray-800 border border-transparent focus:ring-4 focus:ring-gray-300 shadow-sm font-medium rounded-xl text-xs px-3.5 py-2 transition-all cursor-pointer w-full md:w-auto"
    >
      <ShoppingBag size={14} />
      Ajouter
    </button>
  );
}
