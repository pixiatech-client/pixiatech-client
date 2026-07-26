'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { ArrowLeft, ShoppingBag, SlidersHorizontal, ChevronDown, Star, Sparkles, Tag, X, RotateCcw, Search, Check, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useCart } from '@/contexts/CartContext';
import { fetchBoutiqueProducts, getModeBadge } from '@/lib/boutique-data';
import type { Product } from '@/lib/boutique-data';
import { PriceDisplay, ActionButton } from '@/components/boutique/ProductActionButton';
import { useProfile } from '@/contexts/ProfileContext';
import { useI18n } from '@/lib/i18n';
import { calculatePromotionPercent } from '@/lib/pricing-engine';
import { normalizeSearchText } from '@/lib/utils';
import { useMediaQuery } from 'usehooks-ts';

const renderStars = (rating: number, size: number) => {
  const stars = [];
  const floorRating = Math.floor(rating);
  for (let i = 1; i <= 5; i++) {
    if (i <= floorRating) {
      stars.push(<Star key={i} size={size} className="text-amber-400 fill-amber-400" />);
    } else if (i - 0.5 <= rating) {
      stars.push(
        <div key={i} className="relative inline-block" style={{ width: size, height: size }}>
          <Star size={size} className="text-gray-200 fill-gray-200 absolute top-0 left-0" />
          <div className="absolute top-0 left-0 overflow-hidden" style={{ width: '50%' }}>
            <Star size={size} className="text-amber-400 fill-amber-400 max-w-none" />
          </div>
        </div>
      );
    } else {
      stars.push(<Star key={i} size={size} className="text-gray-200 fill-gray-200" />);
    }
  }
  return stars;
};

function FilterDrawer({ open, onClose, categories, selectedCategories, onCategoriesChange, minRating, onMinRatingChange, transactionType, onTransactionTypeChange, onReset, activeCount }: {
  open: boolean; onClose: () => void;
  categories: string[]; selectedCategories: string[]; onCategoriesChange: (c: string[]) => void;
  minRating: number; onMinRatingChange: (r: number) => void;
  transactionType: 'all' | 'sale' | 'rental' | 'sur-commande'; onTransactionTypeChange: (t: 'all' | 'sale' | 'rental' | 'sur-commande') => void;
  onReset: () => void; activeCount: number;
}) {
  const { t } = useI18n();
  const isMobile = useMediaQuery('(max-width: 767px)');
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" onClick={onClose}
          />
          {isMobile ? (
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none"
            >
              <div className="pointer-events-auto w-full bg-white rounded-t-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90dvh]" onClick={(e) => e.stopPropagation()}>
                <div className="px-5 py-4 flex items-center justify-between border-b border-gray-100">
                  <h2 className="font-bold text-gray-900">{t('boutique.filters')}</h2>
                  <button onClick={onClose} aria-label={t('boutique.closeFilters')} className="size-11 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors">
                    <X size={16} className="text-gray-500" />
                  </button>
                </div>

                <div className="p-5 space-y-5 max-h-[55vh] overflow-y-auto">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-3">{t('boutique.categories')}</h3>
                    <div className="space-y-1">
                      {categories.map((cat) => (
                        <label key={cat} className="flex items-center gap-3 cursor-pointer group py-0.5">
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
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-3">{t('boutique.type')}</h3>
                    <div className="flex flex-col gap-1.5">
                      {[
                        { value: 'all' as const, label: t('boutique.all') },
                        { value: 'sale' as const, label: t('boutique.sale') },
                        { value: 'rental' as const, label: t('boutique.rental') },
                        { value: 'sur-commande' as const, label: t('boutique.surCommande') },
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => onTransactionTypeChange(opt.value)}
                          className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
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
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-3">{t('boutique.minRating')}</h3>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => onMinRatingChange(minRating === star ? 0 : star)}
                          className={`p-2 transition-all duration-200 ${star <= minRating ? 'scale-110' : ''}`}
                        >
                          <Star
                            size={20}
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

                <div className="px-5 py-3 flex gap-3 border-t border-gray-100">
                  {activeCount > 0 && (
                    <button onClick={onReset} className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-all">
                      <RotateCcw size={12} />
                      {t('boutique.reset')}
                    </button>
                  )}
                  <button onClick={onClose} className={`${activeCount > 0 ? 'flex-1' : 'w-full'} bg-gray-900 text-white py-2.5 rounded-xl text-xs font-semibold hover:bg-gray-800 transition-all`}>
                    {t('boutique.viewResults')}
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, x: 120 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 120 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-0 z-50 flex items-center justify-end pointer-events-none"
            >
              <div className="pointer-events-auto w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-gray-200/70 overflow-hidden flex flex-col max-h-[85dvh] h-auto" onClick={(e) => e.stopPropagation()}>
                <div className="px-5 py-4 flex items-center justify-between border-b border-gray-100">
                  <h2 className="font-bold text-gray-900">{t('boutique.filters')}</h2>
                  <button onClick={onClose} aria-label={t('boutique.closeFilters')} className="size-11 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors">
                    <X size={16} className="text-gray-500" />
                  </button>
                </div>

                <div className="p-5 space-y-5 max-h-[55vh] overflow-y-auto">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-3">{t('boutique.categories')}</h3>
                    <div className="space-y-1">
                      {categories.map((cat) => (
                        <label key={cat} className="flex items-center gap-3 cursor-pointer group py-0.5">
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
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-3">{t('boutique.type')}</h3>
                    <div className="flex flex-col gap-1.5">
                      {[
                        { value: 'all' as const, label: t('boutique.all') },
                        { value: 'sale' as const, label: t('boutique.sale') },
                        { value: 'rental' as const, label: t('boutique.rental') },
                        { value: 'sur-commande' as const, label: t('boutique.surCommande') },
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => onTransactionTypeChange(opt.value)}
                          className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
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
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-3">{t('boutique.minRating')}</h3>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => onMinRatingChange(minRating === star ? 0 : star)}
                          className={`p-2 transition-all duration-200 ${star <= minRating ? 'scale-110' : ''}`}
                        >
                          <Star
                            size={20}
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

                <div className="px-5 py-3 flex gap-3 border-t border-gray-100">
                  {activeCount > 0 && (
                    <button onClick={onReset} className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-all">
                      <RotateCcw size={12} />
                      {t('boutique.reset')}
                    </button>
                  )}
                  <button onClick={onClose} className={`${activeCount > 0 ? 'flex-1' : 'w-full'} bg-gray-900 text-white py-2 rounded-xl text-xs font-semibold hover:bg-gray-800 transition-all`}>
                    {t('boutique.viewResults')}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );
}

export default function BoutiquePage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { addItem, savedItems, saveItem, unsaveItem, isSaved } = useCart();
  const { showHT, showTTC } = useProfile();
  const { t } = useI18n();

  const [filterOpen, setFilterOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'populaires' | 'nouveautes' | 'saved'>('all');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [minRating, setMinRating] = useState(0);
  const [transactionType, setTransactionType] = useState<'all' | 'sale' | 'rental' | 'sur-commande'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'price-asc' | 'price-desc'>('recent');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [displayCount, setDisplayCount] = useState(12);
  const [quoteDeclinedId, setQuoteDeclinedId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Product[]>([]);
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
    fetchBoutiqueProducts().then((all) => {
      setProducts(all);
      const params = new URLSearchParams(window.location.search);
      const declined = params.get('quote_declined');
      if (declined) {
        setQuoteDeclinedId(declined);
        const others = all.filter(p => !p.availableFor?.includes('sur-commande'));
        const shuffled = others.sort(() => Math.random() - 0.5).slice(0, 2);
        setSuggestions(shuffled);
        window.history.replaceState({}, '', '/boutique');
      }
    }).finally(() => setLoading(false));
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
    } else if (activeTab === 'saved') {
      const savedIds = savedItems.map(i => i.productId);
      result = result.filter(p => savedIds.includes(p.id));
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
  }, [products, activeTab, selectedCategories, minRating, sortBy, transactionType, searchQuery, savedItems]);

  const activeFilterCount = selectedCategories.length + (minRating > 0 ? 1 : 0) + (transactionType !== 'all' ? 1 : 0);

  const handleQuickAdd = (e: React.MouseEvent | Product, product?: Product) => {
    const p = product ?? (e as Product);
    const evt = 'stopPropagation' in e ? e as React.MouseEvent : null;
    if (evt) evt.stopPropagation();
    if (p.stock !== undefined && p.stock <= 0 && p.availableFor?.includes('sale')) {
      toast.error(t('boutique.outOfStock'));
      return;
    }
    addItem({ productId: p.id, name: p.name, price: p.price, image: p.image, category: p.category, type: 'purchase' });
    toast.success(t('boutique.addedToCart', { name: p.name }));
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

      {quoteDeclinedId && (
        <div className="mx-6 md:mx-10 lg:mx-14 mt-4 p-6 bg-white rounded-2xl border border-gray-200/70 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
              <ShoppingBag className="w-6 h-6 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-gray-900">{t('boutique.declinedTitle')}</h3>
              <p className="text-sm text-gray-500 mt-1">{t('boutique.declinedDesc')}</p>
              {suggestions.length > 0 && (
                <div className="flex gap-3 mt-4">
                  {suggestions.map((p) => (
                    <a key={p.id} href={`/boutique/produit/${p.id}`}
                      className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group flex-1 min-w-0">
                      {p.image ? (
                        <img src={p.image} alt={p.name} className="w-12 h-12 rounded-lg object-cover bg-gray-200 flex-shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                          <ShoppingBag className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-gray-600 transition-colors">{p.name}</p>
                        <p className="text-xs font-bold text-gray-700 mt-0.5">
                          {p.price > 0 ? (
                            `${p.price} €`
                          ) : (
                            p.priceDisplay === 'free' ? t('boutique.free') :
                            p.priceDisplay === 'multiprice' ? t('boutique.multipleRates') :
                            p.priceDisplay === 'quote' ? t('boutique.onQuote') :
                            '0 €'
                          )}
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => setQuoteDeclinedId(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 md:gap-3 px-4 md:px-10 lg:px-14 py-2 md:py-4 border-b border-gray-200/40">
        <nav className="relative flex items-center space-x-1 bg-gray-200/40 p-1 sm:p-1.5 rounded-full overflow-x-auto scrollbar-hide">
          {[
            { id: 'all', label: t('boutique.products') },
            { id: 'populaires', label: t('boutique.popular') },
            { id: 'nouveautes', label: t('boutique.newArrivals') },
            { id: 'saved', label: t('boutique.myFavorites') },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className="relative px-3 sm:px-6 py-1.5 md:py-2 rounded-full text-xs font-medium transition-colors duration-300 shrink-0"
            >
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-gray-900 rounded-full shadow-sm"
                  transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                />
              )}
              <span className={`relative z-10 transition-colors duration-300 whitespace-nowrap ${activeTab === tab.id ? 'text-white' : 'text-gray-500'}`}>
                {tab.label}
              </span>
            </button>
          ))}
        </nav>
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative">
            <button
              onClick={() => setSortOpen(!sortOpen)}
              className="flex items-center gap-1.5 bg-white border border-transparent hover:border-gray-200 rounded-full px-3 sm:px-4 py-2 text-xs font-medium text-gray-700 shadow-sm transition-all duration-300 cursor-pointer"
            >
              {sortBy === 'recent' ? t('boutique.sortPopular') : sortBy === 'price-asc' ? t('boutique.sortPriceAsc') : t('boutique.sortPriceDesc')}
              <ChevronDown size={13} className="text-gray-400 transition-transform duration-300" style={{ transform: sortOpen ? 'rotate(180deg)' : undefined }} />
            </button>
            {/* Desktop dropdown */}
            <AnimatePresence>
              {sortOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 4, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  className="hidden md:block absolute right-0 top-full mt-1 z-50 w-48 bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden"
                >
                  {[
                    { value: 'recent', label: t('boutique.sortPopular') },
                    { value: 'price-asc', label: t('boutique.sortPriceAsc') },
                    { value: 'price-desc', label: t('boutique.sortPriceDesc') },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => { setSortBy(opt.value as typeof sortBy); setSortOpen(false); }}
                      className={`w-full flex items-center justify-between px-4 py-3 text-xs font-semibold transition-colors ${
                        sortBy === opt.value ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      {opt.label}
                      {sortBy === opt.value && <Check className="w-3.5 h-3.5 text-blue-500" />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {/* Mobile bottom sheet */}
          <AnimatePresence>
            {sortOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 md:hidden" onClick={() => setSortOpen(false)}
                />
                <motion.div
                  initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                  className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none md:hidden"
                >
                  <div className="pointer-events-auto w-full bg-white rounded-t-3xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
                    <div className="px-6 py-5 flex items-center justify-between border-b border-gray-100">
                      <h2 className="font-bold text-gray-900">{t('boutique.sortBy')}</h2>
                      <button onClick={() => setSortOpen(false)} className="size-8 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors">
                        <X size={16} className="text-gray-500" />
                      </button>
                    </div>
                    <div className="p-3">
                      {[
                        { value: 'recent', label: t('boutique.sortPopular') },
                        { value: 'price-asc', label: t('boutique.sortPriceAsc') },
                        { value: 'price-desc', label: t('boutique.sortPriceDesc') },
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => { setSortBy(opt.value as typeof sortBy); setSortOpen(false); }}
                          className={`w-full flex items-center justify-between px-4 py-4 rounded-2xl text-left text-base font-bold transition-all ${
                            sortBy === opt.value ? 'bg-blue-50 ring-1 ring-blue-500/20 text-blue-700' : 'text-gray-900 hover:bg-gray-50'
                          }`}
                        >
                          {opt.label}
                          {sortBy === opt.value && (
                            <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
          <button
            onClick={() => {
              setSearchOpen(true);
              setTimeout(() => searchInputRef.current?.focus(), 100);
            }}
            className={`relative flex items-center justify-center size-9 rounded-full border border-transparent hover:border-gray-200 bg-white shadow-sm transition-all duration-300 ${
              searchQuery ? 'text-gray-900 border-gray-300 scale-110' : 'text-gray-400 hover:text-gray-600 hover:scale-110'
            } active:scale-95 shrink-0`}
          >
            <Search size={14} />
            {searchQuery && (
              <span className="absolute -top-1 -right-1 size-4 bg-gray-900 text-white text-[9px] font-bold flex items-center justify-center rounded-full">!</span>
            )}
          </button>
          <button
            onClick={() => setFilterOpen(true)}
            className="relative flex items-center justify-center size-9 rounded-full border border-transparent hover:border-gray-200 bg-white shadow-sm text-gray-400 hover:text-gray-600 hover:scale-110 active:scale-95 transition-all duration-300 shrink-0"
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
            className="max-w-6xl mx-auto px-4 sm:px-6 md:px-10 lg:px-14 pt-4"
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('boutique.searchPlaceholder')}
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

      <main className="max-w-6xl mx-auto px-4 sm:px-6 md:px-10 lg:px-14 py-6">
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
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {filteredProducts.slice(0, displayCount).map((product, idx) => (
              <article
                key={product.id}
                style={{ animationDelay: `${idx * 0.08}s` }}
                className={`product-card-entry w-full bg-white p-3 sm:p-4 border border-gray-200/70 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-200 relative flex flex-col ${product.stock !== undefined && product.stock <= 0 && product.availableFor?.includes('sale') ? 'opacity-70' : ''}`}
              >
                <a href={`/boutique/produit/${product.id}`} onClick={(e) => { e.preventDefault(); router.push(`/boutique/produit/${product.id}`); }} className="block relative mb-3 group">
                  {product.stock !== undefined && product.stock <= 0 && product.availableFor?.includes('sale') && (
                    <div className="absolute inset-0 rounded-xl border border-red-500 pointer-events-none z-10" />
                  )}
                  {product.image ? (
                    <img
                      alt={product.name}
                      src={product.image}
                      className={`rounded-xl w-full aspect-[1/1] object-cover bg-gray-50 ${product.stock !== undefined && product.stock <= 0 && product.availableFor?.includes('sale') ? 'grayscale' : ''}`}
                    />
                  ) : (
                    <div className={`rounded-xl w-full aspect-[1/1] flex items-center justify-center bg-gray-100 text-gray-300 ${product.stock !== undefined && product.stock <= 0 && product.availableFor?.includes('sale') ? 'grayscale' : ''}`}>
                      <ShoppingBag size={32} />
                    </div>
                  )}
                  {(() => {
                    const modeBadge = getModeBadge(product);
                    return modeBadge ? (
                      <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider shadow-sm ${modeBadge.colors}`}>
                          {modeBadge.label}
                        </span>
                      </div>
                    ) : null;
                  })()}
                  {!isSaved(product.id) && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); e.preventDefault(); saveItem({ productId: product.id, name: product.name, price: product.price, image: product.image, category: product.category, type: 'purchase', quantity: 1 }); }}
                    className="absolute inset-0 m-auto w-10 h-10 flex items-center justify-center rounded-full transition-all z-20 bg-white/70 hover:bg-white/90 hover:shadow-sm opacity-0 group-hover:opacity-100"
                  >
                    <Heart size={20} className="text-gray-500" />
                  </button>
                  )}
                  {isSaved(product.id) && (
                    <div className="absolute top-2 left-2 flex flex-col gap-1 z-20">
                      <button type="button" onClick={(e) => { e.stopPropagation(); e.preventDefault(); unsaveItem(product.id); }} className="badge-etoile cursor-pointer">
                        <span className="etoile-icon">
                          <Heart size={10} className="text-red-500" fill="currentColor" />
                        </span>
                        <span className="etoile-text">{t('boutique.saved')}</span>
                      </button>
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
                  {product.showRating !== false && (
                    <div className="absolute bottom-2 left-2 flex items-center">
                      <div className="flex items-center gap-0.5">
                        {renderStars(product.rating ?? 5.0, 12)}
                      </div>
                    </div>
                  )}
                </a>
                <div className="flex flex-col flex-1">
                  <a href={`/boutique/produit/${product.id}`} onClick={(e) => { e.preventDefault(); router.push(`/boutique/produit/${product.id}`); }}>
                    <h5 className="text-base font-semibold text-gray-900 tracking-tight leading-tight">{product.name}</h5>
                  </a>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between mt-auto gap-2 pt-3">
                    <div className="flex items-center gap-2">
                      <PriceDisplay product={product} />
                      {product.oldPrice && product.oldPrice > product.price && (
                        <>
                          <span className="text-xs text-gray-400 line-through">{product.oldPrice}{'\u20AC'}</span>
                          <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                            -{calculatePromotionPercent(product.oldPrice, product.price)}%
                          </span>
                        </>
                      )}
                    </div>
                    {!(product.price > 0) && (product.priceDisplay === 'multiprice' || product.priceDisplay === 'quote') ? (
                      <ActionButton product={product} onAddToCart={() => handleQuickAdd(product)} />
                    ) : (
                      <button
                        onClick={(e) => handleQuickAdd(e, product)}
                        type="button"
                        className="inline-flex items-center justify-center gap-1.5 text-white bg-gray-900 hover:bg-gray-800 border border-transparent focus:ring-4 focus:ring-gray-300 shadow-sm font-medium rounded-xl text-xs px-3.5 py-2 transition-all cursor-pointer w-full md:w-auto"
                      >
                        <ShoppingBag size={14} />
                        {t('boutique.add')}
                      </button>
                    )}
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
