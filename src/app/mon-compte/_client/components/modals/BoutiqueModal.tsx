'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ExternalLink, Loader2, ShoppingBag, Store, X } from 'lucide-react';
import { getDocs, collection } from 'firebase/firestore';
import { firestore } from '@/firebase/config';
import { staticProducts } from '@/lib/boutique-data';
import type { ClientProduct } from '../../types';

interface BoutiqueModalProps {
  open: boolean;
  onClose: () => void;
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
  };
}

function formatPrice(price: number): string {
  return `${price.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} € HT`;
}

export function BoutiqueModal({ open, onClose }: BoutiqueModalProps) {
  const [products, setProducts] = useState<ClientProduct[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setProducts(null);
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
          setProducts(
            staticProducts.map((p) => ({
              id: p.id,
              name: p.name,
              price: p.price,
              image: p.image || '',
              description: p.description,
              category: p.category,
            }))
          );
        }
      } catch {
        if (cancelled) return;
        setProducts(
          staticProducts.map((p) => ({
            id: p.id,
            name: p.name,
            price: p.price,
            image: p.image || '',
            description: p.description,
            category: p.category,
          }))
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open]);

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
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {products.map((p) => (
                    <a
                      key={p.id}
                      href="/boutique"
                      className="group overflow-hidden rounded-2xl border border-neutral-200/80 bg-white transition hover:border-neutral-300"
                    >
                      <div className="aspect-[4/3] w-full overflow-hidden bg-neutral-100">
                        {p.image ? (
                          <img src={p.image} alt={p.name} className="size-full object-cover transition duration-300 group-hover:scale-105" />
                        ) : (
                          <div className="flex size-full items-center justify-center text-neutral-300">
                            <Store size={28} />
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        {p.category && <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">{p.category}</p>}
                        <p className="mt-0.5 line-clamp-1 text-sm font-bold text-neutral-900">{p.name}</p>
                        <p className="mt-1 text-sm font-extrabold text-neutral-900">{formatPrice(p.price)}</p>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-neutral-100 p-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-neutral-600 transition hover:bg-neutral-100"
              >
                Fermer la boutique
              </button>
              <a
                href="/boutique"
                className="flex items-center gap-2 rounded-xl bg-[#0A0D0E] px-5 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-neutral-800"
              >
                <Store className="size-3.5 text-[#38E044]" />
                <span>Voir toute la boutique</span>
                <ExternalLink className="size-3.5 text-neutral-400" />
              </a>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}