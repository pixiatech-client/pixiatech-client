'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useMemo, useRef } from 'react';
import { ArrowLeft, Store, ShoppingBag, SlidersHorizontal, ChevronDown, Star, Home, X, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useCart } from '@/contexts/CartContext';
import { fetchBoutiqueProducts } from '@/lib/boutique-data';
import type { Product } from '@/lib/boutique-data';

function FilterDrawer({ open, onClose, categories, selectedCategories, onCategoriesChange, minRating, onMinRatingChange, onReset, activeCount }: {
  open: boolean; onClose: () => void;
  categories: string[]; selectedCategories: string[]; onCategoriesChange: (c: string[]) => void;
  minRating: number; onMinRatingChange: (r: number) => void;
  onReset: () => void; activeCount: number;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, x: 120 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 120 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-end pointer-events-none"
          >
            <div className="pointer-events-auto w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-gray-200/70 overflow-hidden flex flex-col h-[760px]" onClick={(e) => e.stopPropagation()}>
              <div className="px-6 py-5 flex items-center justify-between border-b border-gray-100">
                <h2 className="font-bold text-gray-900">Filtres</h2>
                <button onClick={onClose} className="size-8 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors">
                  <X size={16} className="text-gray-500" />
                </button>
              </div>

              <div className="p-6 space-y-7 max-h-[60vh] overflow-y-auto">
                <div>
                  <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4">Catégories</h3>
                  <div className="space-y-2">
                    {categories.map((cat) => (
                      <label key={cat} className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(cat)}
                          onChange={() => {
                            onCategoriesChange(
                              selectedCategories.includes(cat)
                                ? selectedCategories.filter(c => c !== cat)
                                : [...selectedCategories, cat]
                            );
                          }}
                          className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                        />
                        <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">{cat}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4">Note minimale</h3>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => onMinRatingChange(minRating === star ? 0 : star)}
                        className={`p-1 transition-all duration-200 ${star <= minRating ? 'scale-110' : ''}`}
                      >
                        <Star
                          size={22}
                          className={star <= minRating ? 'text-amber-400 fill-amber-400' : 'text-gray-300 fill-gray-300'}
                        />
                      </button>
                    ))}
                    {minRating > 0 && (
                      <span className="text-xs text-gray-400 ml-2">({minRating}+)</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 flex gap-3 border-t border-gray-100">
                {activeCount > 0 && (
                  <button onClick={onReset} className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-all">
                    <RotateCcw size={13} />
                    Réinitialiser
                  </button>
                )}
                <button onClick={onClose} className={`${activeCount > 0 ? 'flex-1' : 'w-full'} bg-gray-900 text-white py-2.5 rounded-xl text-xs font-semibold hover:bg-gray-800 transition-all`}>
                  Voir les résultats
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default function BoutiquePage() {
  const router = useRouter();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { addItem, itemCount } = useCart();

  const [filterOpen, setFilterOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'populaires' | 'nouveautes'>('all');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState<'recent' | 'price-asc' | 'price-desc'>('recent');

  useEffect(() => {
    fetchBoutiqueProducts().then(setProducts).finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    const set = new Set(products.map(p => p.category).filter(Boolean));
    return Array.from(set).sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (activeTab === 'populaires') {
      result = result.filter(p => p.rating >= 4);
    } else if (activeTab === 'nouveautes') {
      result = result.filter(p => p.rating >= 4.5);
    }

    if (selectedCategories.length > 0) {
      result = result.filter(p => selectedCategories.includes(p.category));
    }

    if (minRating > 0) {
      result = result.filter(p => p.rating >= minRating);
    }

    if (sortBy === 'price-asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => b.price - a.price);
    } else {
      result.sort((a, b) => (b.rating * b.reviews) - (a.rating * a.reviews));
    }

    return result;
  }, [products, activeTab, selectedCategories, minRating, sortBy]);

  const activeFilterCount = selectedCategories.length + (minRating > 0 ? 1 : 0);

  const handleQuickAdd = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    addItem({ productId: product.id, name: product.name, price: product.price, image: product.image, category: product.category });
    toast.success(`${product.name} ajouté au panier`);
  };

  const resetFilters = () => {
    setSelectedCategories([]);
    setMinRating(0);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F5F5' }}>
      <FilterDrawer
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        categories={categories}
        selectedCategories={selectedCategories}
        onCategoriesChange={setSelectedCategories}
        minRating={minRating}
        onMinRatingChange={setMinRating}
        onReset={resetFilters}
        activeCount={activeFilterCount}
      />

      <header className="flex items-center justify-between px-6 md:px-10 lg:px-14 h-16 border-b border-gray-200/60">
        <nav className="flex items-center gap-2">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200/70 hover:border-gray-300 rounded-xl text-xs font-semibold text-gray-600 hover:text-gray-900 shadow-sm hover:shadow transition-all duration-200"
          >
            <Home size={14} />
            Accueil
          </button>
          <button
            onClick={() => router.push('/boutique')}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200/70 hover:border-gray-300 rounded-xl text-xs font-semibold text-gray-600 hover:text-gray-900 shadow-sm hover:shadow transition-all duration-200"
          >
            <Store size={14} />
            Boutique
          </button>
        </nav>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/boutique/panier')} className="relative flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200/70 hover:border-gray-300 rounded-xl text-xs font-medium text-gray-500 hover:text-gray-800 shadow-sm hover:shadow transition-all duration-200">
            <ShoppingBag size={14} />
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-gray-900 text-white text-[9px] font-bold min-w-[16px] h-[16px] flex items-center justify-center rounded-full">{itemCount}</span>
            )}
            Panier
          </button>
        </div>
      </header>

      <div className="flex items-center justify-between px-6 md:px-10 lg:px-14 py-4 border-b border-gray-200/40">
        <nav className="relative flex items-center space-x-1 bg-gray-200/40 p-1.5 rounded-full">
          {[
            { id: 'all', label: 'Produits' },
            { id: 'populaires', label: 'Populaires' },
            { id: 'nouveautes', label: 'Nouveautés' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className="relative px-6 py-2 rounded-full text-xs font-medium transition-colors duration-300"
            >
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-gray-900 rounded-full shadow-sm"
                  transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                />
              )}
              <span className={`relative z-10 transition-colors duration-300 ${activeTab === tab.id ? 'text-white' : 'text-gray-500'}`}>
                {tab.label}
              </span>
            </button>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <div className="relative group">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="appearance-none bg-white border border-transparent hover:border-gray-200 rounded-full px-4 py-2 pr-8 text-xs font-medium text-gray-700 shadow-sm focus:ring-4 focus:ring-gray-100 transition-all duration-300 cursor-pointer"
            >
              <option value="recent">Populaires</option>
              <option value="price-asc">Prix : croissant</option>
              <option value="price-desc">Prix : décroissant</option>
            </select>
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none group-hover:translate-y-0.5 transition-transform">
              <ChevronDown size={13} className="text-gray-400" />
            </div>
          </div>
          <button
            onClick={() => setFilterOpen(true)}
            className="relative flex items-center justify-center size-9 rounded-full border border-transparent hover:border-gray-200 bg-white shadow-sm text-gray-400 hover:text-gray-600 hover:scale-110 active:scale-95 transition-all duration-300"
          >
            <SlidersHorizontal size={14} />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 size-4 bg-gray-900 text-white text-[9px] font-bold flex items-center justify-center rounded-full">{activeFilterCount}</span>
            )}
          </button>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-6 md:px-10 lg:px-14 py-6">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="size-8 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-sm font-medium mb-2">Aucun produit trouvé</p>
            {activeFilterCount > 0 && (
              <button onClick={resetFilters} className="text-xs text-gray-500 underline hover:text-gray-900 transition-colors">
                Réinitialiser les filtres
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProducts.map((product, idx) => (
              <article
                key={product.id}
                onClick={() => router.push(`/boutique/produit/${product.id}`)}
                onMouseEnter={() => setHoveredId(product.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{ animationDelay: `${idx * 0.08}s` }}
                className="product-card-entry bg-white rounded-2xl border border-gray-200/70 cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
              >
                <div className="p-3 pb-0">
                  <div className="relative aspect-[3/2] bg-gray-50 rounded-xl overflow-hidden">
                    <img
                      alt={product.name}
                      src={product.image}
                      className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105 bg-gray-100"
                    />
                    <div className={`absolute inset-0 bg-black/5 transition-opacity duration-200 ${hoveredId === product.id ? 'opacity-100' : 'opacity-0'}`} />
                    <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-3 transition-all duration-200 ${hoveredId === product.id ? 'opacity-100 translate-y-[-50%]' : 'opacity-0 translate-y-[-40%]'}`}>
                      <span className="flex items-center justify-center size-9 bg-white rounded-full shadow-md text-gray-700 hover:text-gray-900 transition-colors -rotate-45">
                        <ArrowLeft size={16} className="rotate-45" />
                      </span>
                      <span onClick={(e) => handleQuickAdd(e, product)} className="flex items-center justify-center size-9 bg-white rounded-full shadow-md text-gray-700 hover:text-gray-900 transition-colors">
                        <ShoppingBag size={16} />
                      </span>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-gray-900 leading-tight mb-3">{product.name}</h3>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">{product.price}{'\u20AC'}</span>
                      {product.oldPrice && product.oldPrice > product.price && (
                        <>
                          <span className="text-xs text-gray-400 line-through">{product.oldPrice}{'\u20AC'}</span>
                          <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                            -{Math.round((1 - product.price / product.oldPrice) * 100)}%
                          </span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-[11px] text-gray-400">
                    <span className="flex items-center gap-1">
                      <Star size={12} className="text-amber-400 fill-amber-400" />
                      {product.rating}
                    </span>
                    <span className="flex items-center gap-1">
                      <ShoppingBag size={12} className="text-gray-300" />
                      {product.category}
                    </span>
                  </div>
                </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      <style>{`
        @keyframes cascadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .product-card-entry {
          opacity: 0;
          animation: cascadeIn 0.4s ease-out forwards;
        }
        .nav-underline {
          position: relative;
        }
        .nav-underline::after {
          content: '';
          position: absolute;
          bottom: 2px;
          left: 50%;
          width: 0;
          height: 2px;
          background: currentColor;
          transition: all 0.3s ease-out;
          transform: translateX(-50%);
        }
        .nav-underline:hover::after {
          width: 50%;
        }
      `}</style>
    </div>
  );
}
