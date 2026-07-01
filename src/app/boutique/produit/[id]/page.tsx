'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Star, ShoppingBag, Store, Minus, Plus, Copy, CalendarDays, FileText, Download, Play, Maximize2, Monitor, Cpu, Zap, Eye, LayoutGrid, Sun, Truck, Layers, Settings2, X, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Info, User, Building2, Calculator, Package } from 'lucide-react';
import { toast } from 'sonner';
import { useCart } from '@/contexts/CartContext';
import { fetchBoutiqueProduct, formatPrice } from '@/lib/boutique-data';
import { firestore } from '@/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import type { Product, ProductVariant, GalleryItem } from '@/lib/boutique-data';
import BoutiqueRentalFlow from '@/components/BoutiqueRentalFlow';
import { useProfile } from '@/contexts/ProfileContext';
import { PriceLabel } from '@/components/B2BProfileSelector';
import { useI18n } from '@/lib/i18n';

const specIcons: Record<string, { icon: typeof Maximize2; color: string }> = {
  'surface': { icon: Maximize2, color: 'blue' },
  'résolution': { icon: Monitor, color: 'violet' },
  'résolution native': { icon: Monitor, color: 'violet' },
  'nom de modules led': { icon: Cpu, color: 'fuchsia' },
  'nombre de modules led': { icon: Cpu, color: 'fuchsia' },
  'puissance max': { icon: Zap, color: 'emerald' },
  'puissance maximale': { icon: Zap, color: 'emerald' },
  'puissance moy': { icon: Zap, color: 'sky' },
  'disjoncteur recommandé': { icon: Settings2, color: 'orange' },
  'type de projet': { icon: Truck, color: 'orange' },
  'environnement': { icon: Sun, color: 'teal' },
  'distance de visualisation': { icon: Eye, color: 'cyan' },
  'pas de pixel': { icon: LayoutGrid, color: 'red' },
  'pixel pitch': { icon: LayoutGrid, color: 'red' },
  'puissance maximale (w/m²)': { icon: Zap, color: 'green' },
  'tension d\'entrée': { icon: Settings2, color: 'green' },
  'épaisseur mm': { icon: Layers, color: 'orange' },
  'dimensions du module': { icon: Maximize2, color: 'blue' },
  'poids': { icon: Monitor, color: 'violet' },
  'matériau': { icon: Layers, color: 'fuchsia' },
  'compatibilité': { icon: Monitor, color: 'emerald' },
  'garantie': { icon: Zap, color: 'sky' },
  'licence': { icon: FileText, color: 'teal' },
  'origine': { icon: Truck, color: 'cyan' },
};

const colorClasses: Record<string, { bg: string; text: string }> = {
  blue: { bg: 'bg-blue-400/10', text: 'text-blue-400' },
  violet: { bg: 'bg-violet-400/10', text: 'text-violet-400' },
  fuchsia: { bg: 'bg-fuchsia-400/10', text: 'text-fuchsia-400' },
  emerald: { bg: 'bg-emerald-400/10', text: 'text-emerald-400' },
  sky: { bg: 'bg-sky-400/10', text: 'text-sky-400' },
  orange: { bg: 'bg-orange-400/10', text: 'text-orange-400' },
  teal: { bg: 'bg-teal-400/10', text: 'text-teal-400' },
  cyan: { bg: 'bg-cyan-400/10', text: 'text-cyan-400' },
  red: { bg: 'bg-red-400/10', text: 'text-red-400' },
  green: { bg: 'bg-green-400/10', text: 'text-green-400' },
};
const specColors = ['blue', 'violet', 'fuchsia', 'emerald', 'sky', 'orange', 'teal', 'cyan', 'red', 'green'];

type MediaItem = { type: 'image'; url: string } | { type: 'video'; url: string };

function Lightbox({ items, index, onClose, onPrev, onNext }: { items: MediaItem[]; index: number; onClose: () => void; onPrev: () => void; onNext: () => void }) {
  const dragStartX = useRef(0);
  const dragOffset = useRef(0);
  const [dragging, setDragging] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => { dragStartX.current = e.clientX; setDragging(true); };
  const handleMouseMove = (e: React.MouseEvent) => { if (dragging) dragOffset.current = e.clientX - dragStartX.current; };
  const handleMouseUp = () => {
    setDragging(false);
    if (Math.abs(dragOffset.current) > 60) {
      dragOffset.current > 0 ? onPrev() : onNext();
    }
    dragOffset.current = 0;
  };
  const handleTouchStart = (e: React.TouchEvent) => { dragStartX.current = e.touches[0].clientX; setDragging(true); };
  const handleTouchMove = (e: React.TouchEvent) => { if (dragging) dragOffset.current = e.touches[0].clientX - dragStartX.current; };
  const handleTouchEnd = () => {
    setDragging(false);
    if (Math.abs(dragOffset.current) > 60) {
      dragOffset.current > 0 ? onPrev() : onNext();
    }
    dragOffset.current = 0;
  };

  const current = items[index];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl"
      onClick={onClose}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ cursor: dragging ? 'grabbing' : 'grab' }}
    >
      <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all z-10">
        <X size={20} />
      </button>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-white text-xs font-semibold">
        {index + 1} / {items.length}
      </div>

      {index > 0 && (
        <button onClick={(e) => { e.stopPropagation(); onPrev(); }} className="absolute left-4 md:left-8 w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all z-10">
          <ChevronLeft size={24} />
        </button>
      )}
      {index < items.length - 1 && (
        <button onClick={(e) => { e.stopPropagation(); onNext(); }} className="absolute right-4 md:right-8 w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all z-10">
          <ChevronRight size={24} />
        </button>
      )}

      {current ? (
        current.type === 'video' ? (
          <video
            ref={videoRef}
            src={current.url}
            controls
            autoPlay
            className="max-w-[90vw] max-h-[85vh] rounded-2xl select-none"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <img
            src={current.url}
            alt=""
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-2xl select-none"
            onClick={(e) => e.stopPropagation()}
            draggable={false}
          />
        )
      ) : (
        <div className="max-w-[90vw] max-h-[85vh] flex items-center justify-center text-white/50">
          <ShoppingBag size={64} />
        </div>
      )}
    </div>
  );
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [purchaseType, setPurchaseType] = useState<'achat' | 'location'>('achat');
  const [selectedMedia, setSelectedMedia] = useState(0);
  const [thumbStart, setThumbStart] = useState(0);
  const maxVisibleThumbs = 4;
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [taxRate, setTaxRate] = useState(20);
  const [showInfo, setShowInfo] = useState(false);
  const [locationCompleted, setLocationCompleted] = useState(false);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [quoteFormData, setQuoteFormData] = useState({ name: '', email: '', phone: '', company: '', comment: '' });
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteDone, setQuoteDone] = useState(false);
  const [stickyTop, setStickyTop] = useState(194);
  const [budgetOpen, setBudgetOpen] = useState(false);
  const [surfaceW, setSurfaceW] = useState(0);
  const [surfaceH, setSurfaceH] = useState(0);
  const [panelW, setPanelW] = useState(0);
  const [panelH, setPanelH] = useState(0);
  const [budgetResult, setBudgetResult] = useState<{ totalSurface: number; panelSurface: number; panelCount: number; unitPrice: number; totalPrice: number } | null>(null);
  const activeThumbRef = useRef<HTMLButtonElement>(null);
  const { addItem, itemCount } = useCart();
  const { showHT, showTTC, setProfileType, profileType } = useProfile();
  const { t } = useI18n();

  useEffect(() => {
    if (!params.id) return;
    setSelectedMedia(0);
    setShowInfo(false);
    fetchBoutiqueProduct(params.id as string).then((p) => {
      setProduct(p);
      setLoading(false);
    });
  }, [params.id]);

  useEffect(() => {
    getDoc(doc(firestore, 'settings', 'wizard')).then((snap) => {
      if (snap.exists()) {
        const data = snap.data() as any;
        const rate = data?.estimationFlow?.taxRate;
        if (typeof rate === 'number' && rate > 0) setTaxRate(rate);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!product) return;
    const active = (product.variants || []).filter(v => v.active && v.name);
    if (active.length > 0) setSelectedVariant(active[0]);
  }, [product]);

  const galleryImages: MediaItem[] = product?.gallery && product.gallery.length > 0
    ? [product.image, ...product.gallery].filter((x): x is string | GalleryItem => x != null).map(x => {
        if (typeof x === 'string') return { type: 'image' as const, url: x };
        return { type: x.type, url: x.url };
      })
    : product?.image ? [{ type: 'image' as const, url: product.image }] : [];

  const mediaItems: MediaItem[] = [
    ...galleryImages,
    ...(product?.videoUrl ? [{ type: 'video' as const, url: product.videoUrl }] : []),
  ];

  const canRent = product?.availableFor?.includes('rental') ?? false;
  const canBuy = product?.availableFor?.includes('sale') ?? true;
  const canQuote = product?.availableFor?.includes('sur-commande') ?? false;

  const effectivePrice = selectedVariant?.price ?? product?.price ?? 0;
  const effectiveMedia = selectedVariant?.image
    ? { type: 'image' as const, url: selectedVariant.image }
    : mediaItems[selectedMedia];
  const effectiveOldPrice = product?.oldPrice && (!selectedVariant || selectedVariant.price < product.oldPrice) ? product.oldPrice : undefined;
  const displayVariants = (product?.variants || []).filter(v => v.active && v.name);
  const availableStock = product?.stock ?? 10;
  const isOutOfStock = availableStock <= 0;

  useEffect(() => {
    if (!lightboxOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false);
      if (e.key === 'ArrowLeft') setLightboxIndex((i) => Math.max(0, i - 1));
      if (e.key === 'ArrowRight') setLightboxIndex((i) => Math.min(mediaItems.length - 1, i + 1));
    };
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [lightboxOpen, mediaItems.length]);

  useEffect(() => {
    activeThumbRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [selectedMedia]);

  useEffect(() => {
    const bannerEl = document.querySelector<HTMLElement>('[data-banners="root"]');
    if (!bannerEl) return;

    const HEADER_PT = 72;
    const CONTENT_OFFSET = 38;

    const updateTop = () => {
      const h = bannerEl.offsetHeight;
      setStickyTop(HEADER_PT + h + CONTENT_OFFSET);
    };

    updateTop();
    const observer = new ResizeObserver(updateTop);
    observer.observe(bannerEl);

    return () => observer.disconnect();
  }, []);

  const handleAddToCart = () => {
    if (!product || isOutOfStock) return;
    addItem({ productId: product.id, name: product.name, price: product.price, image: product.image, category: product.category, type: 'purchase' }, quantity);
    toast.success(t('product.addedToCart', { name: product.name }));
  };

  const handleBuyNow = () => {
    if (!product || isOutOfStock) return;
    addItem({ productId: product.id, name: product.name, price: product.price, image: product.image, category: product.category, type: 'purchase' }, quantity);
    router.push('/boutique/paiement');
  };

  const handleRequestQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    setQuoteLoading(true);
    try {
      const res = await fetch('/api/quote-requests/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          productName: product.name,
          productImage: product.image || '',
          quantity,
          customerName: quoteFormData.name,
          customerEmail: quoteFormData.email,
          customerPhone: quoteFormData.phone,
          customerCompany: quoteFormData.company,
          customerCountry: 'FR',
          customerAddress: '',
          comment: quoteFormData.comment,
        }),
      });
      if (!res.ok) throw new Error('Erreur');
      setQuoteDone(true);
      toast.success('Demande de devis envoyée avec succès');
    } catch {
      toast.error("Erreur lors de l'envoi de la demande");
    }
    setQuoteLoading(false);
  };

  const openLightbox = (idx: number) => {
    setLightboxIndex(idx);
    setLightboxOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F5F5' }}>
        <div className="size-10 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F5F5' }}>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{t('product.notFound')}</h1>
          <button onClick={() => router.push('/boutique')} className="text-blue-600 hover:underline">{t('product.backToShop')}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F5F5' }}>
      {lightboxOpen && (
        <Lightbox
          items={mediaItems}
          index={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
          onPrev={() => setLightboxIndex((i) => Math.max(0, i - 1))}
          onNext={() => setLightboxIndex((i) => Math.min(mediaItems.length - 1, i + 1))}
        />
      )}

      <main className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16 pt-24 pb-16">
        <div className="lg:mr-[450px]">
          {purchaseType === 'location' && !locationCompleted ? (
            <BoutiqueRentalFlow product={product} onComplete={() => setLocationCompleted(true)} />
          ) : (
          <div className="flex flex-col">
            <section>
              <button
                onClick={() => router.push('/boutique')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-gray-900 text-white border border-white/20 text-xs font-semibold hover:bg-gray-800 hover:shadow-md transition-all cursor-pointer -mt-[60px] mb-0"
              >
                <ChevronLeft size={14} />
                Retour
              </button>
              <div className="bg-white rounded-2xl shadow-sm w-full overflow-hidden mt-[15px] mr-5 p-5">
                <div className="cursor-pointer w-full aspect-[4/3] overflow-hidden rounded-xl" onClick={() => { setSelectedVariant(null); openLightbox(selectedMedia); }}>
                  {effectiveMedia ? (
                    effectiveMedia.type === 'video' ? (
                      <video
                        src={effectiveMedia.url}
                        controls
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src={effectiveMedia.url}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                      />
                    )
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-300">
                      <ShoppingBag size={48} />
                    </div>
                  )}
                </div>
              </div>

              {/* Carte sous la photo */}
              {product?.description && (
                <div className="mt-4 bg-white rounded-2xl border border-gray-200/70 p-5">
                  <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
                </div>
              )}

              {mediaItems.length > 1 && (
                <>
                  <div className="flex items-center justify-between mt-4">
                    <button
                      onClick={() => setSelectedMedia((i) => Math.max(0, i - 1))}
                      disabled={selectedMedia === 0}
                      className="w-9 h-9 flex items-center justify-center bg-white border border-gray-200/70 hover:border-gray-400 rounded-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft size={16} className="text-gray-600" />
                    </button>
                    <span className="text-xs font-semibold text-gray-500">
                      {selectedMedia + 1} / {mediaItems.length}
                    </span>
                    <button
                      onClick={() => setSelectedMedia((i) => Math.min(mediaItems.length - 1, i + 1))}
                      disabled={selectedMedia === mediaItems.length - 1}
                      className="w-9 h-9 flex items-center justify-center bg-white border border-gray-200/70 hover:border-gray-400 rounded-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronRight size={16} className="text-gray-600" />
                    </button>
                  </div>
                  <div className="relative mt-3">
                    <div className="flex gap-3 justify-center">
                      {mediaItems.slice(thumbStart, thumbStart + maxVisibleThumbs).map((item, idx) => {
                        const realIdx = thumbStart + idx;
                        const isVideo = item.type === 'video';
                        return (
                          <button
                            key={`${realIdx}-${item.type}`}
                            onClick={() => { setSelectedMedia(realIdx); setSelectedVariant(null); openLightbox(realIdx); }}
                            ref={realIdx === selectedMedia ? activeThumbRef : null}
                            className={`flex-shrink-0 w-24 aspect-square bg-white rounded-xl overflow-hidden border-2 transition-all duration-200 relative ${selectedMedia === realIdx ? 'border-gray-900' : 'border-gray-200/70 hover:border-gray-400'}`}
                            onMouseEnter={() => setSelectedMedia(realIdx)}
                          >
                            {item.url ? (
                              <>
                                {isVideo ? (
                                  <div className="relative w-full h-full">
                                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-10">
                                      <Play size={20} className="text-white fill-white" />
                                    </div>
                                    <video
                                      src={item.url}
                                      className={`w-full h-full object-cover ${selectedMedia !== realIdx ? 'opacity-50' : ''}`}
                                      muted
                                      playsInline
                                      preload="metadata"
                                    />
                                  </div>
                                ) : (
                                  <img
                                    src={item.url}
                                    alt={`${product.name} - Vue ${realIdx + 1}`}
                                    className={`w-full h-full object-cover ${selectedMedia !== realIdx ? 'opacity-50' : ''}`}
                                  />
                                )}
                              </>
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-200">
                                <ShoppingBag size={16} />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              <div className="mt-4 flex items-center gap-3">
                <button onClick={() => window.open(product.pdfUrl || '', '_blank')} disabled={!product.pdfUrl} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200/70 rounded-xl hover:border-gray-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed group">
                  <FileText size={14} className="text-gray-500 group-hover:text-gray-700 transition-colors" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 group-hover:text-gray-600 transition-colors">{t('product.datasheet')}</span>
                </button>
                <button onClick={() => { const a = document.createElement('a'); a.href = product.image; a.download = product.name; a.click(); }} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200/70 rounded-xl hover:border-gray-400 transition-colors group">
                  <Download size={14} className="text-gray-500 group-hover:text-gray-700 transition-colors" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 group-hover:text-gray-600 transition-colors">{t('product.download')}</span>
                </button>
              </div>
            </section>

            {/* Mobile purchase info */}
            <div className="lg:hidden flex flex-col mb-6 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <span className="text-xs font-bold uppercase tracking-widest text-blue-500 mb-2">{product.category}</span>
              <h1 className="text-xl font-bold text-gray-900 mb-2">{product.name}</h1>
              <div className="flex items-center gap-2 mb-3">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} size={16} className={star <= Math.round(product.rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-300 fill-gray-300'} />
                  ))}
                </div>
                <span className="text-xs text-gray-400">({product.reviews})</span>
              </div>
              <div className="mb-4">
                <div className="flex items-center gap-3 flex-wrap">
                  {effectiveOldPrice && effectiveOldPrice > effectivePrice && (
                    <span className="text-base text-gray-400 line-through font-medium">{formatPrice(effectiveOldPrice)}</span>
                  )}
                  <div className="text-2xl font-bold text-gray-900">{formatPrice(effectivePrice)}</div>
                  {effectiveOldPrice && effectiveOldPrice > effectivePrice && (
                    <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">-{Math.round((1 - effectivePrice / effectiveOldPrice) * 100)}%</span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  {(!showHT && !showTTC) && (
                    <><span>HT: {formatPrice(effectivePrice / (1 + taxRate / 100))}</span><span>TTC: {formatPrice(effectivePrice)}</span></>
                  )}
                  {showHT && <span>Prix HT: {formatPrice(effectivePrice / (1 + taxRate / 100))}</span>}
                  {showTTC && <span>TTC: {formatPrice(effectivePrice)}</span>}
                </div>
                <div className="relative mt-2">
                  <button
                    onClick={() => setShowInfo(!showInfo)}
                    className="relative flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 transition-colors font-medium group"
                  >
                    <span className="relative flex items-center justify-center">
                      <Info size={13} className="relative z-10" />
                      <span className="absolute inset-0 z-0 animate-ping rounded-full bg-blue-400/40 group-hover:bg-blue-400/60" style={{ animationDuration: '2.5s' }} />
                    </span>
                    {profileType ? (profileType === 'entreprise' ? ' Profil entreprise ' : ' Profil particulier ') : 'Informations'}
                  </button>
                  {showInfo && (
                    <div className="absolute z-20 left-0 top-full mt-1 w-80 bg-white border border-gray-200 rounded-2xl shadow-xl p-4">
                      <p className="text-xs text-gray-500 leading-relaxed">{t('product.infoText')}</p>
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-xs font-semibold text-gray-800 mb-3">Vous êtes ?</p>
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => { setProfileType('particulier'); setShowInfo(false); }}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all border-2 ${profileType === 'particulier' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                          >
                            <User size={16} />
                            Je suis un particulier
                          </button>
                          <button
                            onClick={() => { setProfileType('entreprise'); setShowInfo(false); }}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all border-2 ${profileType === 'entreprise' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                          >
                            <Building2 size={16} />
                            Je suis une entreprise
                          </button>
                        </div>
                      </div>
                      <button onClick={() => setShowInfo(false)} className="absolute top-2 right-2 text-gray-300 hover:text-gray-500 transition-colors">
                        <X size={12} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              {displayVariants.length > 0 && (
                <div className="flex flex-nowrap gap-2 overflow-x-auto scrollbar-hide mb-4">
                  {displayVariants.map((v) => (
                    <button key={v.name} onClick={() => { setSelectedVariant(v); const imgIdx = mediaItems.findIndex(m => m.type === 'image' && m.url === v.image); if (imgIdx >= 0) setSelectedMedia(imgIdx); }}
                      className={`shrink-0 px-3 py-2 text-xs font-bold rounded-xl border-2 transition-all ${selectedVariant?.image === v.image ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200/70 text-gray-600 hover:border-gray-400'}`}>
                      {v.name}
                    </button>
                  ))}
                </div>
              )}
              <div className={`bg-violet-500/10 p-4 rounded-2xl border relative group overflow-hidden shadow-[0_0_20px_rgba(139,92,246,0.08)] ring-1 ${isOutOfStock ? 'border-red-400/40 ring-red-500/20' : 'border-violet-500/40 ring-violet-500/20'}`}>
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent"></div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-black text-violet-400 uppercase tracking-widest flex items-center gap-2">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-violet-400 shadow-[0_0_6px_rgba(139,92,246,0.8)]"></span>
                    Quantité
                  </label>
                  <div className="flex items-center gap-1.5">
                    {isOutOfStock ? (
                      <span className="inline-block w-2 h-2 rounded-full bg-red-500"></span>
                    ) : availableStock <= 3 ? (
                      <span className="inline-block w-2 h-2 rounded-full bg-orange-500"></span>
                    ) : (
                      <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                    )}
                    {isOutOfStock ? (
                      <span className="text-xs font-medium text-red-500">Rupture</span>
                    ) : availableStock <= 3 ? (
                      <span className="text-xs font-medium text-orange-500">Plus que {availableStock}</span>
                    ) : (
                      <span className="text-xs font-medium text-green-600">{availableStock} en stock</span>
                    )}
                  </div>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.min(availableStock, Math.max(1, parseInt(e.target.value) || 1)))}
                    placeholder="Ex : 10"
                    disabled={isOutOfStock}
                    className="w-full rounded-xl font-bold focus:outline-none transition-colors appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none bg-[#1a1f2e] text-white border border-blue-500/30 focus:border-cyan-400 px-4 py-3 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                  />
                  {!isOutOfStock && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-0.5">
                    <button onClick={() => setQuantity(Math.min(availableStock, quantity + 1))} className="transition-colors text-slate-500 hover:text-slate-300">
                      <ChevronUp size={12} />
                    </button>
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="transition-colors text-slate-500 hover:text-slate-300">
                      <ChevronDown size={12} />
                    </button>
                  </div>
                  )}
                </div>
              </div>
              {canQuote && !canBuy && !canRent ? (
                quoteDone ? (
                  <div className="flex flex-col gap-3 mt-2">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                      <p className="text-sm font-semibold text-emerald-800">Demande envoyée</p>
                      <p className="text-xs text-emerald-600 mt-1">Nous vous contacterons sous 48h maximum.</p>
                    </div>
                    <button onClick={() => router.push('/boutique')} className="w-full border-2 border-gray-900 text-gray-900 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-900 hover:text-white transition-all">
                      Continuer mes achats
                    </button>
                  </div>
                ) : !showQuoteForm ? (
                  <button onClick={() => setShowQuoteForm(true)}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white py-2.5 px-4 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    <FileText size={15} /> {t('product.requestQuote')}
                  </button>
                ) : (
                  <form onSubmit={handleRequestQuote} className="flex flex-col gap-3 mt-2">
                    <p className="text-xs text-gray-500 leading-relaxed">{t('product.quoteInfo')}</p>
                    <input type="text" placeholder="Votre nom *" required value={quoteFormData.name} onChange={e => setQuoteFormData(d => ({ ...d, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-gray-900/20" />
                    <input type="email" placeholder="Votre email *" required value={quoteFormData.email} onChange={e => setQuoteFormData(d => ({ ...d, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-gray-900/20" />
                    <input type="tel" placeholder="Votre téléphone *" required value={quoteFormData.phone} onChange={e => setQuoteFormData(d => ({ ...d, phone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-gray-900/20" />
                    <input type="text" placeholder="Société (optionnel)" value={quoteFormData.company} onChange={e => setQuoteFormData(d => ({ ...d, company: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-gray-900/20" />
                    <textarea placeholder="Commentaire (optionnel)" rows={2} value={quoteFormData.comment} onChange={e => setQuoteFormData(d => ({ ...d, comment: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-gray-900/20 resize-none" />
                    <button type="submit" disabled={quoteLoading}
                      className="w-full bg-amber-500 hover:bg-amber-600 text-white py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-40">
                      {quoteLoading ? 'Envoi...' : 'Envoyer la demande'}
                    </button>
                    <button type="button" onClick={() => setShowQuoteForm(false)}
                      className="w-full text-xs text-gray-400 hover:text-gray-600 transition-colors">Annuler</button>
                  </form>
                )
              ) : (
                <>
              <button onClick={handleAddToCart} disabled={isOutOfStock} className="w-full bg-gray-900 text-white py-2.5 px-4 rounded-xl text-sm font-semibold hover:bg-gray-800 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
                  <ShoppingBag size={15} /> {isOutOfStock ? 'Indisponible' : t('product.addToCart')}
                </button>
              <button onClick={handleBuyNow} disabled={isOutOfStock} className="w-full mt-2 border-2 border-gray-900 text-gray-900 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-900 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed">{isOutOfStock ? 'Indisponible' : t('product.buyNow')}</button>
                </>
              )}
            </div>

            <div className="mt-20 border-t border-gray-200/40 pt-12 space-y-16">
              {(product.descriptionDetaillee || product.longDescription) && (
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('product.description')}</h2>
                {product.descriptionDetaillee?.includes('<') ? (
                  <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed overflow-x-auto" dangerouslySetInnerHTML={{ __html: product.descriptionDetaillee }} />
                ) : (
                  <p className="text-gray-600 leading-relaxed">{product.descriptionDetaillee || product.longDescription}</p>
                )}
              </section>
              )}

              <section>
                <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="p-8 pb-0 flex items-center justify-between mb-8">
                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
                      <Settings2 size={16} className="text-slate-400" />
                      {t('product.technicalSpecs')}
                    </h4>
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(34,197,94,0.6)]" />
                  </div>
                  <div className="p-8 pt-0 grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-8">
                    {Object.entries(product.specs).map(([key, value], idx) => {
                      const mapping = specIcons[key.toLowerCase()];
                      const Icon = mapping?.icon || Settings2;
                      const colorKey = mapping?.color || specColors[idx % specColors.length];
                      const colors = colorClasses[colorKey];
                      return (
                        <div key={key} className="flex items-center gap-4 group">
                          <div className={`w-12 h-12 rounded-2xl ${colors.bg} flex items-center justify-center ${colors.text} transition-all duration-500 group-hover:scale-110 shadow-sm border border-slate-200`}>
                            <Icon size={16} />
                          </div>
                          <div className="flex flex-col">
                            <div className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-0.5">{key}</div>
                            <div className="text-sm font-display font-black text-slate-800 uppercase tracking-tight">{value}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            </div>
          </div>
          )}
        </div>

        <aside
          className="hidden lg:flex flex-col fixed z-10 w-[420px] max-h-[calc(100vh-9rem)]"
          style={{ top: stickyTop, right: 'max(16px, calc((100vw - 1280px) / 2 + 64px))', transition: 'top 0.35s ease' }}
        >
          <div className="flex-1 min-h-0 overflow-y-auto pr-1">
            <nav className="text-sm text-gray-400 mb-4">
              <ol className="flex list-none p-0">
                <li className="flex items-center">
                  <button onClick={() => router.push('/')} className="hover:text-gray-700 transition-colors">{t('product.breadcrumbHome')}</button>
                  <span className="mx-2">/</span>
                </li>
                <li className="flex items-center">
                  <button onClick={() => router.push('/boutique')} className="hover:text-gray-700 transition-colors">{t('product.breadcrumbProducts')}</button>
                  <span className="mx-2">/</span>
                </li>
                <li className="text-gray-900 font-medium truncate">{product.name}</li>
              </ol>
            </nav>

            <span className="text-xs font-bold uppercase tracking-widest text-blue-500 mb-3">{product.category}</span>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">{product.name}</h1>

            {product.description && (
              <p className="text-gray-500 text-sm leading-relaxed mb-4">{product.description}</p>
            )}

            <div className="flex items-center gap-2 mb-6">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={18}
                    className={star <= Math.round(product.rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-300 fill-gray-300'}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-400">{t('product.reviews', { count: product.reviews })}</span>
            </div>

            <div className="mb-6">
              <div className="flex items-center gap-3 flex-wrap">
                {effectiveOldPrice && effectiveOldPrice > effectivePrice && (
                  <span className="text-lg text-gray-400 line-through font-medium">{formatPrice(effectiveOldPrice)}</span>
                )}
                <div className="text-3xl font-bold text-gray-900">{formatPrice(effectivePrice)}</div>
                {effectiveOldPrice && effectiveOldPrice > effectivePrice && (
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    -{Math.round((1 - effectivePrice / effectiveOldPrice) * 100)}%
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 mt-2">
                {(!showHT && !showTTC) && (
                  <>
                    <span className="text-sm text-gray-500 font-medium">{t('product.priceHT')} : <span className="text-gray-700 font-semibold">{formatPrice(effectivePrice / (1 + taxRate / 100))}</span></span>
                    <span className="text-sm text-gray-500 font-medium">{t('product.priceTTC')} : <span className="text-gray-700 font-semibold">{formatPrice(effectivePrice)}</span></span>
                  </>
                )}
                {showHT && (
                  <span className="text-sm text-gray-500 font-medium">{t('product.priceExclTax')} : <span className="text-gray-700 font-semibold">{formatPrice(effectivePrice / (1 + taxRate / 100))}</span></span>
                )}
                {showTTC && (
                  <span className="text-sm text-gray-500 font-medium">{t('product.inclTax')} : <span className="text-gray-700 font-semibold">{formatPrice(effectivePrice)}</span></span>
                )}
              </div>
              <div className="relative mt-1">
                <button
                  onClick={() => setShowInfo(!showInfo)}
                  className="relative flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 transition-colors font-medium group"
                >
                  <span className="relative flex items-center justify-center">
                    <Info size={13} className="relative z-10" />
                    <span className="absolute inset-0 z-0 animate-ping rounded-full bg-blue-400/40 group-hover:bg-blue-400/60" style={{ animationDuration: '2.5s' }} />
                  </span>
                  {profileType ? (profileType === 'entreprise' ? ' Profil entreprise ' : ' Profil particulier ') : t('product.info')}
                </button>
                  {showInfo && (
                    <div className="absolute z-20 left-0 top-full mt-1 w-80 bg-white border border-gray-200 rounded-2xl shadow-xl p-4">
                      <p className="text-xs text-gray-500 leading-relaxed">{t('product.infoText')}</p>
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-xs font-semibold text-gray-800 mb-3">Vous êtes ?</p>
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => { setProfileType('particulier'); setShowInfo(false); }}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all border-2 ${profileType === 'particulier' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                          >
                            <User size={16} />
                            Je suis un particulier
                          </button>
                          <button
                            onClick={() => { setProfileType('entreprise'); setShowInfo(false); }}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all border-2 ${profileType === 'entreprise' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                          >
                            <Building2 size={16} />
                            Je suis une entreprise
                          </button>
                        </div>
                      </div>
                      <button onClick={() => setShowInfo(false)} className="absolute top-2 right-2 text-gray-300 hover:text-gray-500 transition-colors">
                        <X size={12} />
                      </button>
                    </div>
                  )}
              </div>
            </div>

            {/* Variants */}
            {displayVariants.length > 0 && (
              <div className="space-y-3 mb-4">
                {selectedVariant?.description && (
                  <div className="flex items-center gap-2">
                    <span className="bg-gray-900 text-white px-2.5 py-1 rounded-lg text-xs font-bold tracking-tight shadow-sm">{selectedVariant.description}</span>
                    {selectedVariant?.reference && (
                      <span className="text-[11px] text-gray-400 font-mono font-medium bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200/50">{selectedVariant.reference}</span>
                    )}
                  </div>
                )}
                <div className="flex flex-nowrap gap-2 overflow-x-auto scrollbar-hide">
                  {displayVariants.map((v) => (
                    <button
                      key={v.name}
                      onClick={() => {
                        setSelectedVariant(v);
                        const imgIdx = mediaItems.findIndex(m => m.type === 'image' && m.url === v.image);
                        if (imgIdx >= 0) setSelectedMedia(imgIdx);
                      }}
                      className={`shrink-0 px-3 py-2 text-xs font-bold rounded-xl border-2 transition-all ${selectedVariant?.image === v.image ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200/70 text-gray-600 hover:border-gray-400'}`}
                    >
                      {v.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Calculateur de budget */}
            {(() => {
              const parsePanelDimensions = (source?: string): { w: number; h: number } | null => {
                const dimKeys = ['dimensions du module', 'dimensions', 'dimension', 'taille', 'format', 'dalle', 'module'];
                if (source) {
                  const match = source.match(/(\d+(?:[.,]\d+)?)\s*[×xX*]\s*(\d+(?:[.,]\d+)?)\s*(mm|cm|m)?/i);
                  if (match) {
                    const w = parseFloat(match[1].replace(',', '.'));
                    const h = parseFloat(match[2].replace(',', '.'));
                    const unit = (match[3] || 'cm').toLowerCase();
                    const factor = unit === 'mm' ? 0.1 : unit === 'm' ? 100 : 1;
                    return { w: w * factor, h: h * factor };
                  }
                }
                const specsLower = Object.fromEntries(
                  Object.entries(product.specs).map(([k, v]) => [k.toLowerCase().trim(), v])
                );
                for (const key of dimKeys) {
                  const val = specsLower[key];
                  if (!val) continue;
                  const match = val.match(/(\d+(?:[.,]\d+)?)\s*[×xX*]\s*(\d+(?:[.,]\d+)?)\s*(mm|cm|m)?/i);
                  if (match) {
                    const w = parseFloat(match[1].replace(',', '.'));
                    const h = parseFloat(match[2].replace(',', '.'));
                    const unit = (match[3] || 'cm').toLowerCase();
                    const factor = unit === 'mm' ? 0.1 : unit === 'm' ? 100 : 1;
                    return { w: w * factor, h: h * factor };
                  }
                }
                return null;
              };

              const dims = parsePanelDimensions(selectedVariant?.description) ?? parsePanelDimensions();
              const unitPrice = effectivePrice;
              const pW = dims?.w ?? panelW;
              const pH = dims?.h ?? panelH;
              const canAutoCalc = surfaceW > 0 && surfaceH > 0 && pW > 0 && pH > 0;
              const autoResult = canAutoCalc ? (() => {
                const totalSurface = surfaceW * surfaceH;
                const panelSurfaceM2 = (pW * pH) / 10000;
                const panelCount = Math.ceil(totalSurface / panelSurfaceM2);
                const totalPrice = panelCount * unitPrice;
                return { totalSurface, panelSurface: panelSurfaceM2, panelCount, unitPrice, totalPrice };
              })() : null;

              return (
                <div className="mb-6 bg-white rounded-2xl border border-gray-200/70 shadow-sm">
                  <button type="button" onClick={() => setBudgetOpen(prev => !prev)} className="w-full flex items-center justify-between p-5 hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                        <Calculator size={16} className="text-emerald-600" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-sm font-bold text-gray-900">Calculer le budget</h3>
                        <p className="text-[11px] text-gray-400 font-medium">Estimez le coût de votre projet</p>
                      </div>
                    </div>
                    <ChevronDown size={16} className={`text-gray-400 transition-transform duration-200 ${budgetOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {budgetOpen && (
                  <div className="px-5 pb-5 border-t border-gray-100 pt-4">

                  {dims && (
                    <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-blue-50 border border-blue-100 rounded-xl">
                      <Package size={13} className="text-blue-500 shrink-0" />
                      <p className="text-[11px] text-blue-700 font-medium">
                        Dalle détectée : <span className="font-bold">{dims.w} × {dims.h} cm</span>
                      </p>
                    </div>
                  )}

                  {!dims && (
                    <div className="mb-4 space-y-3">
                      <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 font-medium">
                        Dimensions de dalle non trouvées. Saisissez-les :
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Largeur dalle (cm)</label>
                          <input type="number" value={panelW || ''} min={1} onChange={e => setPanelW(parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 text-sm font-semibold border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 bg-gray-50" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Hauteur dalle (cm)</label>
                          <input type="number" value={panelH || ''} min={1} onChange={e => setPanelH(parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 text-sm font-semibold border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 bg-gray-50" />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">
                        Largeur surface (m)
                      </label>
                      <input type="number" value={surfaceW || ''} min={0.1} step={0.1} placeholder="ex: 10"
                        onChange={e => setSurfaceW(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2.5 text-sm font-semibold border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 bg-gray-50 transition-colors" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">
                        Hauteur surface (m)
                      </label>
                      <input type="number" value={surfaceH || ''} min={0.1} step={0.1} placeholder="ex: 3"
                        onChange={e => setSurfaceH(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2.5 text-sm font-semibold border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 bg-gray-50 transition-colors" />
                    </div>
                  </div>

                  {!canAutoCalc && surfaceW > 0 && surfaceH > 0 && (!dims && (panelW <= 0 || panelH <= 0)) && (
                    <p className="text-[11px] text-amber-600 mt-2">Veuillez renseigner les dimensions de la dalle.</p>
                  )}

                  {autoResult && (
                    <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 overflow-hidden animate-fadeIn">
                      <div className="px-4 py-3 border-b border-emerald-100 bg-emerald-50">
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Résultat de l&apos;estimation</p>
                      </div>
                      <div className="px-4 py-3 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Surface totale</span>
                          <span className="text-xs font-bold text-gray-800">{autoResult.totalSurface.toFixed(2)} m²</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Surface d&apos;une dalle</span>
                          <span className="text-xs font-bold text-gray-800">{autoResult.panelSurface.toFixed(4)} m²</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Nombre de dalles</span>
                          <span className="text-xs font-bold text-gray-800">{autoResult.panelCount} dalles</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Prix unitaire</span>
                          <span className="text-xs font-bold text-gray-800">{formatPrice(autoResult.unitPrice)}</span>
                        </div>
                        <div className="h-px bg-emerald-200/50 my-1" />
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-gray-900">Prix total estimé</span>
                          <span className="text-lg font-black text-emerald-700 tracking-tight">{formatPrice(autoResult.totalPrice)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  </div>
                  )}
                </div>
              );
            })()}

            {canQuote && !canBuy && !canRent ? (
            <div className="flex flex-col gap-3 mb-6">
              {quoteDone ? (
                <div className="flex flex-col gap-3">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                    <p className="text-sm font-semibold text-emerald-800">Demande envoyée</p>
                    <p className="text-xs text-emerald-600 mt-1">Nous vous contacterons sous 48h maximum.</p>
                  </div>
                  <button onClick={() => router.push('/boutique')} className="w-full border-2 border-gray-900 text-gray-900 py-3 px-6 rounded-xl font-semibold hover:bg-gray-900 hover:text-white transition-all">
                    <Store size={16} className="inline mr-2 -mt-0.5" />
                    Continuer mes achats
                  </button>
                </div>
              ) : !showQuoteForm ? (
                <>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <p className="text-xs text-amber-800 font-semibold">{t('product.priceOnRequest')}</p>
                    <p className="text-xs text-amber-600 mt-1">{t('product.quoteInfo')}</p>
                  </div>
                  <button onClick={() => setShowQuoteForm(true)}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 px-6 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-sm">
                    <FileText size={16} />
                    {t('product.requestQuote')}
                  </button>
                </>
              ) : (
                <form onSubmit={handleRequestQuote} className="flex flex-col gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-xs font-semibold text-amber-800">{t('product.requestQuote')}</p>
                  <input type="text" placeholder="Votre nom *" required value={quoteFormData.name} onChange={e => setQuoteFormData(d => ({ ...d, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-amber-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/30 bg-white" />
                  <input type="email" placeholder="Votre email *" required value={quoteFormData.email} onChange={e => setQuoteFormData(d => ({ ...d, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-amber-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/30 bg-white" />
                  <input type="tel" placeholder="Votre téléphone *" required value={quoteFormData.phone} onChange={e => setQuoteFormData(d => ({ ...d, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-amber-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/30 bg-white" />
                  <input type="text" placeholder="Société (optionnel)" value={quoteFormData.company} onChange={e => setQuoteFormData(d => ({ ...d, company: e.target.value }))}
                    className="w-full px-3 py-2 border border-amber-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/30 bg-white" />
                  <textarea placeholder="Commentaire (optionnel)" rows={2} value={quoteFormData.comment} onChange={e => setQuoteFormData(d => ({ ...d, comment: e.target.value }))}
                    className="w-full px-3 py-2 border border-amber-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/30 bg-white resize-none" />
                  <div className="flex gap-2">
                    <button type="submit" disabled={quoteLoading}
                      className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-2.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-40">
                      {quoteLoading ? 'Envoi...' : 'Envoyer'}
                    </button>
                    <button type="button" onClick={() => setShowQuoteForm(false)}
                      className="px-4 py-2.5 text-xs text-amber-700 hover:text-amber-900 transition-colors">Annuler</button>
                  </div>
                </form>
              )}
            </div>
            ) : (
            <>
            <div className="flex border-b border-gray-200/40 mb-6">
              <button
                onClick={() => setPurchaseType('achat')}
                className={`px-6 py-3 text-sm font-semibold border-b-2 transition-colors ${purchaseType === 'achat' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
              >
                {t('product.purchase')}
              </button>
              <button
                onClick={() => canRent ? setPurchaseType('location') : undefined}
                disabled={!canRent}
                className={`px-6 py-3 text-sm font-semibold border-b-2 transition-colors ${purchaseType === 'location' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-600'} ${!canRent ? 'opacity-40 cursor-not-allowed line-through' : ''}`}
              >
                {t('product.rental')}
              </button>
            </div>

            <div className="flex flex-col gap-3 mb-6">
              {purchaseType === 'location' ? (
                locationCompleted ? (
                  <div className="flex flex-col gap-3">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                      <p className="text-sm font-semibold text-emerald-800">{t('product.readyForRental')}</p>
                      <p className="text-xs text-emerald-600 mt-1">{t('product.rentalInfoAdded')}</p>
                    </div>
                    <button onClick={() => router.push('/boutique/panier')} className="w-full bg-gray-900 text-white py-3 px-6 rounded-xl font-semibold hover:bg-gray-800 transition-all flex items-center justify-center gap-2">
                      <ShoppingBag size={16} />
                      {t('product.viewCart')}
                    </button>
                    <button onClick={() => router.push('/boutique')} className="w-full border-2 border-gray-900 text-gray-900 py-3 px-6 rounded-xl font-semibold hover:bg-gray-900 hover:text-white transition-all flex items-center justify-center gap-2">
                      <Store size={16} />
                      {t('product.continueShopping')}
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 py-6 px-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <CalendarDays size={24} className="text-gray-400" />
                    <p className="text-sm text-gray-500 text-center">{t('product.fillRentalForm')}</p>
                  </div>
                )
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    {isOutOfStock ? (
                      <span className="inline-block w-2 h-2 rounded-full bg-red-500 shrink-0"></span>
                    ) : availableStock <= 3 ? (
                      <span className="inline-block w-2 h-2 rounded-full bg-orange-500 shrink-0"></span>
                    ) : (
                      <span className="inline-block w-2 h-2 rounded-full bg-green-500 shrink-0"></span>
                    )}
                    {isOutOfStock ? (
                      <span className="text-xs font-medium text-red-500">Rupture de stock</span>
                    ) : availableStock <= 3 ? (
                      <span className="text-xs font-medium text-orange-500">Plus que {availableStock} en stock</span>
                    ) : (
                      <span className="text-xs font-medium text-green-600">En stock</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center shrink-0">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={isOutOfStock || quantity <= 1}
                        className="w-8 h-8 flex items-center justify-center bg-[#1a1f2e] rounded-l-lg border border-blue-500/30 border-r-0 text-slate-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Minus size={11} />
                      </button>
                      <input
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(Math.min(availableStock, Math.max(1, parseInt(e.target.value) || 1)))}
                        disabled={isOutOfStock}
                        className="w-11 h-8 text-center text-xs font-bold bg-[#1a1f2e] text-white border border-blue-500/30 focus:outline-none appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none disabled:opacity-40 disabled:cursor-not-allowed"
                      />
                      <button
                        onClick={() => setQuantity(Math.min(availableStock, quantity + 1))}
                        disabled={isOutOfStock || quantity >= availableStock}
                        className="w-8 h-8 flex items-center justify-center bg-[#1a1f2e] rounded-r-lg border border-blue-500/30 border-l-0 text-slate-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Plus size={11} />
                      </button>
                    </div>
                    <button onClick={handleAddToCart} disabled={isOutOfStock} className="flex-1 bg-gray-900 text-white py-3 px-6 rounded-xl font-semibold hover:bg-gray-800 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
                      <ShoppingBag size={16} />
                      {isOutOfStock ? 'Indisponible' : t('product.addToCart')}
                    </button>
                  </div>
                  <button onClick={handleBuyNow} disabled={isOutOfStock} className="w-full border-2 border-gray-900 text-gray-900 py-3 px-6 rounded-xl font-semibold hover:bg-gray-900 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                    {isOutOfStock ? 'Indisponible' : t('product.buyNow')}
                  </button>
                </>
              )}
            </div>
            </>
            )}


          </div>
          </aside>
      </main>

    </div>
  );
}
