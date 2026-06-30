'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { ArrowLeft, ShoppingBag, SlidersHorizontal, ChevronDown, Star, Sparkles, Tag, X, RotateCcw, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useCart } from '@/contexts/CartContext';
import { fetchBoutiqueProducts } from '@/lib/boutique-data';
import type { Product } from '@/lib/boutique-data';
import { useProfile } from '@/contexts/ProfileContext';
import { useI18n } from '@/lib/i18n';
import { calculatePromotionPercent } from '@/lib/pricing-engine';
import { normalizeSearchText } from '@/lib/utils';

function FilterDrawer({ open, onClose, categories, selectedCategories, onCategoriesChange, minRating, onMinRatingChange, transactionType, onTransactionTypeChange, onReset, activeCount }: {
  open: boolean; onClose: () => void;
  categories: string[]; selectedCategories: string[]; onCategoriesChange: (c: string[]) => void;
  minRating: number; onMinRatingChange: (r: number) => void;
  transactionType: 'all' | 'sale' | 'rental'; onTransactionTypeChange: (t: 'all' | 'sale' | 'rental') => void;
  onReset: () => void; activeCount: number;
}) {
  const { t } = useI18n();
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
            <div className="pointer-events-auto w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-gray-200/70 overflow-hidden flex flex-col max-h-[85dvh] h-auto" onClick={(e) => e.stopPropagation()}>
              <div className="px-6 py-5 flex items-center justify-between border-b border-gray-100">
                <h2 className="font-bold text-gray-900">{t('boutique.filters')}</h2>
                <button onClick={onClose} className="size-8 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors">
                  <X size={16} className="text-gray-500" />
                </button>
              </div>

              <div className="p-6 space-y-7 max-h-[60vh] overflow-y-auto">
                <div>
                  <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4">{t('boutique.categories')}</h3>
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
                  <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4">{t('boutique.type')}</h3>
                  <div className="flex gap-2">
                    {[
                      { value: 'all' as const, label: t('boutique.all') },
                      { value: 'sale' as const, label: t('boutique.sale') },
                      { value: 'rental' as const, label: t('boutique.rental') },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => onTransactionTypeChange(opt.value)}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                          transactionType === opt.value
                            ? 'bg-gray-900 text-white shadow-sm'
                            : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4">{t('boutique.minRating')}</h3>
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
                    {t('boutique.reset')}
                  </button>
                )}
                <button onClick={onClose} className={`${activeCount > 0 ? 'flex-1' : 'w-full'} bg-gray-900 text-white py-2.5 rounded-xl text-xs font-semibold hover:bg-gray-800 transition-all`}>
                  {t('boutique.viewResults')}
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
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCart();
  const { showHT, showTTC } = useProfile();
  const { t } = useI18n();

  const [filterOpen, setFilterOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'populaires' | 'nouveautes'>('all');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [minRating, setMinRating] = useState(0);
  const [transactionType, setTransactionType] = useState<'all' | 'sale' | 'rental'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'price-asc' | 'price-desc'>('recent');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [displayCount, setDisplayCount] = useState(12);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useCallback((node: HTMLDivElement | null) => {
    if (observerRef.current) observerRef.current.disconnect();
    if (!node) return;
    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setDisplayCount((prev) => prev + 12);
      }
    }, { rootMargin: '200px' });
    observerRef.current.observe(node);
  }, []);

  useEffect(() => {
    fetchBoutiqueProducts().then(setProducts).finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    const set = new Set(products.map(p => p.category).filter(Boolean));
    return Array.from(set).sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (searchQuery.trim()) {
      const q = normalizeSearchText(searchQuery);
      result = result.filter(p =>
        normalizeSearchText(p.name).includes(q) ||
        normalizeSearchText(p.category).includes(q) ||
        normalizeSearchText(p.description).includes(q)
      );
    }

    if (activeTab === 'populaires') {
      result = result.filter(p => p.badges?.includes('populaire'));
    } else if (activeTab === 'nouveautes') {
      result = result.filter(p => p.badges?.includes('nouveaute'));
    }

    if (transactionType !== 'all') {
      result = result.filter(p => p.availableFor?.includes(transactionType));
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
  }, [products, activeTab, selectedCategories, minRating, sortBy, transactionType, searchQuery]);

  const activeFilterCount = selectedCategories.length + (minRating > 0 ? 1 : 0) + (transactionType !== 'all' ? 1 : 0);

  const handleQuickAdd = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    addItem({ productId: product.id, name: product.name, price: product.price, image: product.image, category: product.category, type: 'purchase' });
    toast.success(t('boutique.addedToCart', { name: product.name }));
  };

  const resetFilters = () => {
    setSelectedCategories([]);
    setMinRating(0);
    setTransactionType('all');
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
        transactionType={transactionType}
        onTransactionTypeChange={setTransactionType}
        onReset={resetFilters}
        activeCount={activeFilterCount}
      />

      <div className="flex items-center justify-between px-6 md:px-10 lg:px-14 py-4 border-b border-gray-200/40">
        <nav className="relative flex items-center space-x-1 bg-gray-200/40 p-1.5 rounded-full">
          {[
            { id: 'all', label: t('boutique.products') },
            { id: 'populaires', label: t('boutique.popular') },
            { id: 'nouveautes', label: t('boutique.newArrivals') },
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
              <option value="recent">{t('boutique.sortPopular')}</option>
              <option value="price-asc">{t('boutique.sortPriceAsc')}</option>
              <option value="price-desc">{t('boutique.sortPriceDesc')}</option>
            </select>
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none group-hover:translate-y-0.5 transition-transform">
              <ChevronDown size={13} className="text-gray-400" />
            </div>
          </div>
          <button
            onClick={() => {
              setSearchOpen(true);
              setTimeout(() => searchInputRef.current?.focus(), 100);
            }}
            className={`relative flex items-center justify-center size-9 rounded-full border border-transparent hover:border-gray-200 bg-white shadow-sm transition-all duration-300 ${
              searchQuery ? 'text-gray-900 border-gray-300 scale-110' : 'text-gray-400 hover:text-gray-600 hover:scale-110'
            } active:scale-95`}
          >
            <Search size={14} />
            {searchQuery && (
              <span className="absolute -top-1 -right-1 size-4 bg-gray-900 text-white text-[9px] font-bold flex items-center justify-center rounded-full">!</span>
            )}
          </button>
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

      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="max-w-6xl mx-auto px-6 md:px-10 lg:px-14 pt-4"
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un produit..."
                className="w-full bg-white border border-gray-200/70 rounded-full pl-10 pr-10 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-300 transition-all shadow-sm"
              />
              <button
                onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 size-5 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 text-gray-500 transition-colors"
              >
                <X size={12} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-6xl mx-auto px-6 md:px-10 lg:px-14 py-6">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="size-8 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-sm font-medium mb-2">{t('boutique.noProductsFound')}</p>
            {activeFilterCount > 0 && (
              <button onClick={resetFilters} className="text-xs text-gray-500 underline hover:text-gray-900 transition-colors">
                {t('boutique.resetFilters')}
              </button>
            )}
          </div>
        ) : (
          <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.slice(0, displayCount).map((product, idx) => (
              <article
                key={product.id}
                style={{ animationDelay: `${idx * 0.08}s` }}
                className="product-card-entry w-full bg-white p-4 border border-gray-200/70 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-200 relative"
              >
                <a href={`/boutique/produit/${product.id}`} onClick={(e) => { e.preventDefault(); router.push(`/boutique/produit/${product.id}`); }} className="block relative mb-3">
                  {product.image ? (
                    <img
                      alt={product.name}
                      src={product.image}
                      className="rounded-xl w-full aspect-[1/1] object-cover bg-gray-50"
                    />
                  ) : (
                    <div className="rounded-xl w-full aspect-[1/1] flex items-center justify-center bg-gray-100 text-gray-300">
                      <ShoppingBag size={32} />
                    </div>
                  )}
                  {product.badges && product.badges.length > 0 && (
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      {product.badges.map((badge) => (
                        <span key={badge} className={`badge-etoile ${
                          badge === 'populaire' ? 'emerald' :
                          badge === 'nouveaute' ? 'blue' : 'red'
                        }`}>
                          <span className="etoile-icon">
                            {badge === 'populaire' ? <Star size={10} className="text-emerald-400" fill="currentColor" /> :
                             badge === 'nouveaute' ? <Sparkles size={10} className="text-blue-400" /> :
                             <Tag size={10} className="text-red-400" />}
                          </span>
                          <span className={`etoile-text ${
                            badge === 'populaire' ? 'text-emerald-400' :
                            badge === 'nouveaute' ? 'text-blue-400' :
                            'text-red-400'
                          }`}>
                            {badge === 'populaire' ? t('boutique.badgePopular') : badge === 'nouveaute' ? t('boutique.badgeNew') : t('boutique.badgePromotion')}
                          </span>
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex items-center bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1 shadow-xs">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} size={12} className={star <= Math.round(product.rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'} />
                      ))}
                    </div>
                  </div>
                </a>
                <div>
                  <a href={`/boutique/produit/${product.id}`} onClick={(e) => { e.preventDefault(); router.push(`/boutique/produit/${product.id}`); }}>
                    <h5 className="text-base font-semibold text-gray-900 tracking-tight leading-tight">{product.name}</h5>
                  </a>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-extrabold text-gray-900">{product.price}{'\u20AC'}</span>
                      {product.oldPrice && product.oldPrice > product.price && (
                        <>
                          <span className="text-[11px] text-gray-400 line-through">{product.oldPrice}{'\u20AC'}</span>
                          <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                            -{calculatePromotionPercent(product.oldPrice, product.price)}%
                          </span>
                        </>
                      )}
                    </div>
                    <button
                      onClick={(e) => handleQuickAdd(e, product)}
                      type="button"
                      className="inline-flex items-center gap-1.5 text-white bg-gray-900 hover:bg-gray-800 border border-transparent focus:ring-4 focus:ring-gray-300 shadow-sm font-medium rounded-xl text-xs px-3.5 py-2 transition-all cursor-pointer"
                    >
                      <ShoppingBag size={14} />
                      Ajouter
                    </button>
                  </div>
                </div>

              </article>
            ))}
          </div>
          {filteredProducts.length > displayCount && (
            <div ref={sentinelRef} className="h-10" />
          )}
          </>
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
