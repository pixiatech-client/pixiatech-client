'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Loader2, ShieldCheck, ShoppingBag, Star, Store, Truck, X } from 'lucide-react';
import { getDocs, collection } from 'firebase/firestore';
import { firestore } from '@/firebase/config';
import { staticProducts } from '@/lib/boutique-data';
import type { ClientProduct } from '../../types';

interface BoutiqueModalProps {
  open: boolean;
  onClose: () => void;
  onOrderProduct?: (product: ClientProduct) => void;
}

function toClientProduct(doc: { id: string; data: () => Record<string, unknown> }): ClientProduct {
  const d = doc.data();
  return {
    id: doc.id,
    name: String(d.name || 'Produit'),
    price: Number(d.price) || 0,
    image: typeof d.image === 'string' ? d.image : '',
    badge: typeof d.badge === 'string' ? d.badge : undefined,
    description: typeof d.description === 'string' ? d.description : undefined,
    category: typeof d.category === 'string' ? d.category : undefined,
    rating: typeof d.rating === 'number' ? d.rating : undefined,
    reviews: typeof d.reviews === 'number' ? d.reviews : undefined,
  };
}

function toClientProductFromStatic(p: (typeof staticProducts)[number]): ClientProduct {
  return {
    id: p.id,
    name: p.name,
    price: p.price,
    image: p.image || '',
    description: p.description || undefined,
    category: p.category,
    rating: p.rating,
    reviews: p.reviews,
  };
}

function formatMoney(price: number): string {
  return `${price.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}

function RatingStars({ product, showLabel }: { product: ClientProduct; showLabel: boolean }) {
  const rating = typeof product.rating === 'number' ? Math.round(product.rating) : 0;
  const hasRating = typeof product.rating === 'number';
  const reviews = typeof product.reviews === 'number' ? product.reviews : 0;
  if (!hasRating) return null;
  return (
    <div className="mb-1 flex items-center gap-1 text-xs text-amber-500">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`size-3.5 ${n <= rating ? 'fill-current' : 'text-neutral-300'}`} />
      ))}
      {showLabel && (
        <span className="ml-1 text-[11px] text-neutral-400">
          ({Number(product.rating).toFixed(1)}/5{reviews > 0 ? ` - ${reviews} avis` : ''})
        </span>
      )}
    </div>
  );
}

export function BoutiqueModal({ open, onClose, onOrderProduct }: BoutiqueModalProps) {
  const [products, setProducts] = useState<ClientProduct[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string>('');

  useEffect(() => {
    if (!open) return;
    setProducts(null);
    setSelectedId('');
    setLoading(true);
    let cancelled = false;

    (async () => {
      try {
        const snap = await getDocs(collection(firestore, 'boutique_products'));
        const list = snap.docs.map((d) =>
          toClientProduct({ id: d.id, data: () => (d.data() as Record<string, unknown>) })
        );
        if (cancelled) return;
        if (list.length > 0) {
          setProducts(list.filter((p) => p.image));
        } else {
          setProducts(staticProducts.map(toClientProductFromStatic));
        }
      } catch {
        if (cancelled) return;
        setProducts(staticProducts.map(toClientProductFromStatic));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open]);

  const activeProduct = (products && (products.find((p) => p.id === selectedId) || products[0] || null)) || null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-xs sm:items-center sm:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl border border-neutral-200 bg-white shadow-2xl sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-neutral-100 p-5 pb-3">
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[#0A0D0E] text-white">
                  <ShoppingBag className="size-5 text-[#38E044]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-neutral-900">Solutions & Murs LED PIXIATECH</h2>
                    <span className="rounded-full bg-[#38E044] px-2 py-0.5 text-[10px] font-bold text-black shadow-xs">
                      CATALOGUE LED OFFICIEL
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500">
                    Spécialiste français : écrans LED, murs LED, affichage dynamique & solutions événementielles
                  </p>
                </div>
              </div>
              <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-neutral-400 transition hover:bg-neutral-100 hover:text-black" aria-label="Fermer">
                <X className="size-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {loading ? (
                <div className="flex items-center justify-center gap-3 py-16 text-sm text-neutral-500">
                  <Loader2 className="size-4 animate-spin" /> Chargement de la boutique…
                </div>
              ) : !products || products.length === 0 ? (
                <div className="flex flex-col items-center py-16 text-center">
                  <Store className="size-9 text-neutral-300" />
                  <p className="mt-3 text-sm font-bold text-neutral-700">La boutique est en cours de réapprovisionnement</p>
                  <a href="/boutique" className="mt-4 rounded-xl bg-[#0A0D0E] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90">
                    Découvrir le catalogue complet
                  </a>
                </div>
              ) : !activeProduct ? (
                <div className="py-16 text-center text-sm text-neutral-500">Aucun produit disponible.</div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 rounded-2xl border border-neutral-200 bg-neutral-50 p-5 md:grid-cols-2">
                    <div className="relative">
                      {activeProduct.image ? (
                        <img
                          src={activeProduct.image}
                          alt={activeProduct.name}
                          className="h-56 w-full rounded-2xl border border-neutral-200 object-cover shadow-xs"
                        />
                      ) : (
                        <div className="flex h-56 w-full items-center justify-center rounded-2xl border border-neutral-200 bg-neutral-100 text-neutral-300">
                          <Store size={36} />
                        </div>
                      )}
                      {activeProduct.category && (
                        <span className="absolute left-2.5 top-2.5 rounded-md bg-black/80 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-xs">
                          {activeProduct.category}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col justify-between space-y-3">
                      <div>
                        <RatingStars product={activeProduct} showLabel />
                        <h3 className="text-base font-extrabold leading-snug text-neutral-900">{activeProduct.name}</h3>
                        {activeProduct.description && (
                          <p className="mt-2 text-xs leading-relaxed text-neutral-600">{activeProduct.description}</p>
                        )}
                      </div>

                      <div className="border-t border-neutral-200/80 pt-2">
                        <div className="flex items-baseline justify-between">
                          <div>
                            <span className="font-mono text-2xl font-extrabold text-neutral-900">{formatMoney(activeProduct.price)}</span>
                            <span className="ml-1.5 text-xs text-neutral-500">HT</span>
                          </div>
                          <div className="text-right text-xs text-neutral-500">
                            <span>Prix public hors taxes</span>
                            <span className="block text-[10px] text-neutral-400">TVA appliquée au paiement</span>
                          </div>
                        </div>

                        <button
                          id="btn-order-product-store"
                          type="button"
                          onClick={() => onOrderProduct?.(activeProduct)}
                          className="mt-3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-black px-5 py-3 text-xs font-bold text-white shadow-md transition-all hover:bg-neutral-900 active:scale-[0.99]"
                        >
                          <ShoppingBag className="size-4 text-[#38E044]" />
                          <span>Commander ce produit</span>
                          <ArrowRight className="ml-0.5 size-3.5 text-white" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-neutral-400">
                      Autres modules & écrans LED du catalogue PIXIATECH
                    </h4>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      {products.map((p) => {
                        const isSelected = activeProduct.id === p.id;
                        return (
                          <div
                            key={p.id}
                            onClick={() => setSelectedId(p.id)}
                            className={`cursor-pointer space-y-2.5 rounded-2xl border bg-white p-3 transition-all ${
                              isSelected
                                ? 'border-neutral-900 shadow-sm ring-2 ring-neutral-900/10'
                                : 'border-neutral-200 hover:border-neutral-400 hover:shadow-xs'
                            }`}
                          >
                            <div className="relative">
                              {p.image ? (
                                <img
                                  src={p.image}
                                  alt={p.name}
                                  className="h-24 w-full rounded-xl border border-neutral-100 object-cover"
                                />
                              ) : (
                                <div className="flex h-24 w-full items-center justify-center rounded-xl border border-neutral-100 bg-neutral-100 text-neutral-300">
                                  <Store size={24} />
                                </div>
                              )}
                              {isSelected && (
                                <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-black px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                                  <span className="size-1.5 rounded-full bg-[#38E044]" />
                                  Sélectionné
                                </span>
                              )}
                            </div>
                            <div className="line-clamp-1 text-xs font-bold text-neutral-900">{p.name}</div>
                            <div className="flex items-center justify-between border-t border-neutral-100 pt-1 text-xs">
                              <span className="font-mono font-bold text-neutral-900">{formatMoney(p.price)}</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedId(p.id);
                                }}
                                className={`rounded-lg px-2 py-1 text-[11px] font-bold transition-colors ${
                                  isSelected
                                    ? 'bg-black text-white'
                                    : 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200'
                                }`}
                              >
                                {isSelected ? 'Actif' : 'Sélectionner'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-neutral-100 px-5 py-4 text-xs text-neutral-400">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="size-3.5 text-emerald-600" />
                  Paiement 100% sécurisé
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Truck className="size-3.5 text-sky-600" />
                  Livraison Express 24/48h
                </span>
              </div>
              <button type="button" onClick={onClose} className="cursor-pointer px-4 py-2 text-xs font-semibold text-neutral-600 hover:text-black">
                Fermer la boutique
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}