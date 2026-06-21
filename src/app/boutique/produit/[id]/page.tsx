'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, Star, ShoppingBag, Store, Minus, Plus, Copy, FileText, Download, Play, Maximize2, Monitor, Cpu, Zap, Eye, LayoutGrid, Sun, Truck, Layers, Settings2, X, ChevronLeft, ChevronRight, Home, Info } from 'lucide-react';
import { toast } from 'sonner';
import { useCart } from '@/contexts/CartContext';
import { fetchBoutiqueProduct, formatPrice } from '@/lib/boutique-data';
import { firestore } from '@/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import type { Product, ProductVariant } from '@/lib/boutique-data';

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

function Lightbox({ images, index, onClose, onPrev, onNext }: { images: string[]; index: number; onClose: () => void; onPrev: () => void; onNext: () => void }) {
  const dragStartX = useRef(0);
  const dragOffset = useRef(0);
  const [dragging, setDragging] = useState(false);

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
        {index + 1} / {images.length}
      </div>

      {index > 0 && (
        <button onClick={(e) => { e.stopPropagation(); onPrev(); }} className="absolute left-4 md:left-8 w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all z-10">
          <ChevronLeft size={24} />
        </button>
      )}
      {index < images.length - 1 && (
        <button onClick={(e) => { e.stopPropagation(); onNext(); }} className="absolute right-4 md:right-8 w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all z-10">
          <ChevronRight size={24} />
        </button>
      )}

      <img
        src={images[index]}
        alt=""
        className="max-w-[90vw] max-h-[85vh] object-contain rounded-2xl select-none"
        onClick={(e) => e.stopPropagation()}
        draggable={false}
      />
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
  const [selectedImage, setSelectedImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [taxRate, setTaxRate] = useState(20);
  const [showInfo, setShowInfo] = useState(false);
  const thumbScrollRef = useRef<HTMLDivElement>(null);
  const activeThumbRef = useRef<HTMLButtonElement>(null);
  const { addItem, itemCount } = useCart();

  useEffect(() => {
    if (!params.id) return;
    setSelectedImage(0);
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

  const galleryImages = product?.gallery && product.gallery.length > 0
    ? [product.image, ...product.gallery]
    : [product?.image || ''];
  const images = galleryImages;
  const canRent = product?.availableFor?.includes('rental') ?? false;
  const canBuy = product?.availableFor?.includes('sale') ?? true;

  const effectivePrice = selectedVariant?.price ?? product?.price ?? 0;
  const effectiveImage = selectedVariant?.image || galleryImages[selectedImage];
  const effectiveOldPrice = product?.oldPrice && (!selectedVariant || selectedVariant.price < product.oldPrice) ? product.oldPrice : undefined;
  const displayVariants = (product?.variants || []).filter(v => v.active && v.name);

  useEffect(() => {
    if (!lightboxOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false);
      if (e.key === 'ArrowLeft') setLightboxIndex((i) => Math.max(0, i - 1));
      if (e.key === 'ArrowRight') setLightboxIndex((i) => Math.min(images.length - 1, i + 1));
    };
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [lightboxOpen, images.length]);

  useEffect(() => {
    activeThumbRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [selectedImage]);

  const handleAddToCart = () => {
    if (!product) return;
    addItem({ productId: product.id, name: product.name, price: product.price, image: product.image, category: product.category }, quantity);
    toast.success(`${product.name} ajouté au panier`);
  };

  const handleBuyNow = () => {
    if (!product) return;
    addItem({ productId: product.id, name: product.name, price: product.price, image: product.image, category: product.category }, quantity);
    router.push('/boutique/paiement');
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
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Produit non trouvé</h1>
          <button onClick={() => router.push('/boutique')} className="text-blue-600 hover:underline">Retour à la boutique</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F5F5' }}>
      {lightboxOpen && (
        <Lightbox
          images={images}
          index={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
          onPrev={() => setLightboxIndex((i) => Math.max(0, i - 1))}
          onNext={() => setLightboxIndex((i) => Math.min(images.length - 1, i + 1))}
        />
      )}

      <div className="fixed top-[56px] z-30 left-0 right-0 flex items-center justify-center gap-x-[732px] px-6 md:px-10 lg:px-14 h-16 border-b border-gray-200/60" style={{ backgroundColor: '#F5F5F5' }}>
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
            <ArrowLeft size={14} />
            Boutique
          </button>
        </nav>
        <div className="flex items-center">
          <button onClick={() => router.push('/boutique/panier')} className="relative flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200/70 hover:border-gray-300 rounded-xl text-xs font-medium text-gray-500 hover:text-gray-800 shadow-sm hover:shadow transition-all duration-200">
            <ShoppingBag size={14} />
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-gray-900 text-white text-[9px] font-bold min-w-[16px] h-[16px] flex items-center justify-center rounded-full">{itemCount}</span>
            )}
            Panier
          </button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16 pt-24 pb-16">
        <div className="lg:mr-[430px]">
          <div className="flex flex-col">
            <section className="max-w-xl mx-auto">
              <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
                <div className="cursor-pointer overflow-hidden" onClick={() => { setSelectedVariant(null); openLightbox(selectedImage); }}>
                  <img
                    src={effectiveImage}
                    alt={product.name}
                    className="w-full h-auto max-h-[450px] object-cover bg-slate-50 transition-transform duration-500 hover:scale-110"
                  />
                </div>
              </div>
              {images.length > 1 && (
                <>
                  <div className="flex items-center justify-between mt-4">
                    <button
                      onClick={() => setSelectedImage((i) => Math.max(0, i - 1))}
                      disabled={selectedImage === 0}
                      className="w-9 h-9 flex items-center justify-center bg-white border border-gray-200/70 hover:border-gray-400 rounded-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft size={16} className="text-gray-600" />
                    </button>
                    <span className="text-xs font-semibold text-gray-500">
                      {selectedImage + 1} / {images.length}
                    </span>
                    <button
                      onClick={() => setSelectedImage((i) => Math.min(images.length - 1, i + 1))}
                      disabled={selectedImage === images.length - 1}
                      className="w-9 h-9 flex items-center justify-center bg-white border border-gray-200/70 hover:border-gray-400 rounded-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronRight size={16} className="text-gray-600" />
                    </button>
                  </div>
                  <div className="relative mt-3">
                    <div ref={thumbScrollRef} className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth pb-1">
                      {images.map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => { setSelectedImage(idx); setSelectedVariant(null); openLightbox(idx); }}
                          ref={idx === selectedImage ? activeThumbRef : null}
                          className={`flex-shrink-0 w-24 aspect-square bg-white rounded-xl overflow-hidden border-2 transition-all duration-200 ${selectedImage === idx ? 'border-gray-900' : 'border-gray-200/70 hover:border-gray-400'}`}
                          onMouseEnter={() => setSelectedImage(idx)}
                        >
                          <img
                            src={img}
                            alt={`${product.name} - Vue ${idx + 1}`}
                            className={`w-full h-full object-cover ${selectedImage !== idx ? 'opacity-50' : ''}`}
                          />
                        </button>
                      ))}
                    </div>
                    {images.length > 4 && (
                      <>
                        <button onClick={() => thumbScrollRef.current?.scrollBy({ left: -160, behavior: 'smooth' })} className="absolute left-0 top-0 bottom-0 w-8 flex items-center justify-center bg-gradient-to-r from-white to-transparent">
                          <ChevronLeft size={14} className="text-gray-500" />
                        </button>
                        <button onClick={() => thumbScrollRef.current?.scrollBy({ left: 160, behavior: 'smooth' })} className="absolute right-0 top-0 bottom-0 w-8 flex items-center justify-center bg-gradient-to-l from-white to-transparent">
                          <ChevronRight size={14} className="text-gray-500" />
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </section>

            <div className="mt-20 border-t border-gray-200/40 pt-12 space-y-16">
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Description D&eacute;taill&eacute;e</h2>
                {product.descriptionDetaillee?.includes('<') ? (
                  <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: product.descriptionDetaillee }} />
                ) : (
                  <p className="text-gray-600 leading-relaxed">{product.descriptionDetaillee || product.longDescription}</p>
                )}
              </section>

              <section>
                <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="p-8 pb-0 flex items-center justify-between mb-8">
                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
                      <Settings2 size={16} className="text-slate-400" />
                      Sp&eacute;cifications Techniques
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

        </div>

        <aside className="hidden lg:flex flex-col fixed top-36 z-10 w-[420px] max-h-[calc(100vh-9rem)] overflow-y-auto" style={{ right: 'max(16px, calc((100vw - 1280px) / 2 + 64px))' }}>
            <nav className="text-sm text-gray-400 mb-4">
              <ol className="flex list-none p-0">
                <li className="flex items-center">
                  <button onClick={() => router.push('/')} className="hover:text-gray-700 transition-colors">Accueil</button>
                  <span className="mx-2">/</span>
                </li>
                <li className="flex items-center">
                  <button onClick={() => router.push('/boutique')} className="hover:text-gray-700 transition-colors">Produits</button>
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
              <span className="text-sm text-gray-400">({product.reviews} avis clients)</span>
            </div>

            <div className="mb-6">
              <div className="flex items-center gap-3">
                <div className="text-3xl font-bold text-gray-900">{formatPrice(effectivePrice)}</div>
                {effectiveOldPrice && effectiveOldPrice > effectivePrice && (
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    -{Math.round((1 - effectivePrice / effectiveOldPrice) * 100)}%
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-sm text-gray-500 font-medium">HT : <span className="text-gray-700 font-semibold">{formatPrice(effectivePrice / (1 + taxRate / 100))}</span></span>
                <span className="text-sm text-gray-500 font-medium">TTC : <span className="text-gray-700 font-semibold">{formatPrice(effectivePrice)}</span></span>
              </div>
              <div className="relative mt-1">
                <button onClick={() => setShowInfo(!showInfo)} className="flex items-center gap-1.5 text-xs text-blue-500 hover:text-blue-700 transition-colors font-medium">
                  <Info size={13} />
                  Informations
                </button>
                {showInfo && (
                  <div className="absolute z-20 left-0 top-full mt-1 w-72 bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-xs text-gray-500 leading-relaxed">
                    Nos produits sont principalement destinés aux professionnels, entreprises, collectivités et revendeurs.<br /><br />
                    Les particuliers peuvent également commander directement depuis notre boutique.
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
                  <div className="flex items-end justify-between gap-3">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-gray-400 mb-0.5">Format</span>
                      <span className="text-sm font-bold text-gray-900">{selectedVariant.description}</span>
                    </div>
                    {selectedVariant?.reference && (
                      <div className="flex flex-col items-end">
                        <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-gray-400 mb-0.5">Réf.</span>
                        <span className="text-[11px] font-mono font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">{selectedVariant.reference}</span>
                      </div>
                    )}
                  </div>
                )}
                <div className="flex flex-nowrap gap-2 overflow-x-auto scrollbar-hide">
                  {displayVariants.map((v) => (
                    <button
                      key={v.name}
                      onClick={() => {
                        setSelectedVariant(v);
                        const imgIdx = images.indexOf(v.image);
                        if (imgIdx >= 0) setSelectedImage(imgIdx);
                      }}
                      className={`shrink-0 px-3 py-2 text-xs font-bold rounded-xl border-2 transition-all ${selectedVariant?.image === v.image ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200/70 text-gray-600 hover:border-gray-400'}`}
                    >
                      {v.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex border-b border-gray-200/40 mb-6">
              <button
                onClick={() => setPurchaseType('achat')}
                className={`px-6 py-3 text-sm font-semibold border-b-2 transition-colors ${purchaseType === 'achat' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
              >
                Achat
              </button>
              <button
                onClick={() => canRent ? setPurchaseType('location') : undefined}
                disabled={!canRent}
                className={`px-6 py-3 text-sm font-semibold border-b-2 transition-colors ${purchaseType === 'location' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-600'} ${!canRent ? 'opacity-40 cursor-not-allowed line-through' : ''}`}
              >
                Location
              </button>
            </div>

            <div className="flex flex-col gap-3 mb-6">
              {purchaseType === 'location' ? (
                <div className="flex flex-col gap-3">
                  <button onClick={() => router.push(`/boutique/louer/${product.id}`)} className="w-full bg-gray-900 text-white py-3 px-6 rounded-xl font-semibold hover:bg-gray-800 transition-all flex items-center justify-center gap-2">
                    <FileText size={16} />
                    Louer ce produit
                  </button>
                  <p className="text-[11px] text-gray-400 text-center">Contrat & signature · Vérification de sécurité</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center border border-gray-200/70 rounded-xl bg-white">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="px-4 py-3 hover:bg-gray-50 transition-colors rounded-xl"
                      >
                        <Minus size={16} className="text-gray-500" />
                      </button>
                      <span className="w-12 text-center text-sm font-semibold text-gray-900">{quantity}</span>
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="px-4 py-3 hover:bg-gray-50 transition-colors rounded-xl"
                      >
                        <Plus size={16} className="text-gray-500" />
                      </button>
                    </div>
                    <button onClick={handleAddToCart} className="flex-1 bg-gray-900 text-white py-3 px-6 rounded-xl font-semibold hover:bg-gray-800 transition-all flex items-center justify-center gap-2">
                      <ShoppingBag size={16} />
                      Ajouter au panier
                    </button>
                  </div>
                  <button onClick={handleBuyNow} className="w-full border-2 border-gray-900 text-gray-900 py-3 px-6 rounded-xl font-semibold hover:bg-gray-900 hover:text-white transition-all">
                    Acheter maintenant
                  </button>
                </>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-200/40">
              <button onClick={() => window.open(product.pdfUrl || '', '_blank')} disabled={!product.pdfUrl} className="flex flex-col items-center gap-2 group disabled:opacity-30 disabled:cursor-not-allowed">
                <div className="w-10 h-10 flex items-center justify-center bg-white rounded-full border border-gray-200/70 group-hover:border-gray-400 transition-colors">
                  <FileText size={16} className="text-gray-500" />
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Fiche technique</span>
              </button>
              <button onClick={() => { const a = document.createElement('a'); a.href = product.image; a.download = product.name; a.click(); }} className="flex flex-col items-center gap-2 group">
                <div className="w-10 h-10 flex items-center justify-center bg-white rounded-full border border-gray-200/70 group-hover:border-gray-400 transition-colors">
                  <Download size={16} className="text-gray-500" />
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Télécharger</span>
              </button>
              <button onClick={() => window.open(product.videoUrl || '', '_blank')} disabled={!product.videoUrl} className="flex flex-col items-center gap-2 group disabled:opacity-30 disabled:cursor-not-allowed">
                <div className="w-10 h-10 flex items-center justify-center bg-white rounded-full border border-gray-200/70 group-hover:border-gray-400 transition-colors">
                  <Play size={16} className="text-gray-500" />
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Voir la vidéo</span>
              </button>
            </div>
          </aside>
      </main>
    </div>
  );
}
