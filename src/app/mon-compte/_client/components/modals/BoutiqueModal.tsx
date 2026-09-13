'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, Store, X } from 'lucide-react';
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
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-xs sm:items-center sm:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-neutral-900">La boutique</h2>
                <p className="mt-0.5 text-sm text-neutral-500">Nos Ã©crans LED et solutions d'affichage professionnelles.</p>
              </div>
              <button type="button" onClick={onClose} className="rounded-xl p-2 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700" aria-label="Fermer">
                <X size={20} />
              </button>
            </div>

            <div className="mt-5">
              {loading ? (
                <div className="flex items-center justify-center gap-3 py-16 text-sm text-neutral-500">
                  <Loader2 size={18} className="animate-spin" /> Chargement de la boutiqueâ€¦
                </div>
              ) : !products || products.length === 0 ? (
                <div className="flex flex-col items-center py-16 text-center">
                  <Store size={34} className="text-neutral-300" />
                  <p className="mt-3 text-sm font-bold text-neutral-700">La boutique est en cours de rÃ©approvisionnement</p>
                  <a href="/boutique" className="mt-4 rounded-xl bg-[#0A0D0E] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90">
                    DÃ©couvrir le catalogue complet
                  </a>
                </div>
              ) : (
                <>
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
                          <p className="mt-1 text-sm font-extrabold text-neutral-900">
                            {p.price.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}â‚¬ HT
                          </p>
                        </div>
                      </a>
                    ))}
                  </div>
                  <a
                    href="/boutique"
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0A0D0E] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                  >
                    <Store size={16} /> Voir toute la boutique
                  </a>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}