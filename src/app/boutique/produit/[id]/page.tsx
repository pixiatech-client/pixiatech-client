'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import { Star, ShoppingBag, Store, Minus, Plus, Copy, CalendarDays, FileText, Download, Play, Maximize2, Monitor, Cpu, Zap, Eye, LayoutGrid, Sun, Truck, Layers, Settings2, X, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Info, User, Mail, Phone, Building2, Calculator, Package, Activity, Smartphone, Tv, Grid, Maximize, SunMedium, Upload, File, Folder, Image as ImageIcon, Video, Music, Printer, Bluetooth, Wifi, Tablet, Laptop, Mouse, Keyboard, Headphones, Speaker, Mic, Camera, Settings, Heart, Bell, Home, Search, MessageSquare, Calendar, Clock, MapPin, Globe, Lock, HelpCircle, AlertTriangle, CheckCircle, XCircle, Edit, Trash2, Share2, Link as LinkIcon, Gift, ShieldCheck, CreditCard, Award, BookOpen, ShoppingCart, Users, RefreshCw, Menu, Send, Navigation, ZoomIn, ZoomOut, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useCart } from '@/contexts/CartContext';
import { fetchBoutiqueProduct, fetchUpsellProducts, formatPrice, getModeBadge } from '@/lib/boutique-data';
import { firestore } from '@/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import type { Product, ProductVariant, GalleryItem } from '@/lib/boutique-data';
import BoutiqueRentalFlow from '@/components/BoutiqueRentalFlow';
import CityInput from '@/components/CityInput';
import { useProfile } from '@/contexts/ProfileContext';
import { PriceLabel } from '@/components/B2BProfileSelector';
import { useI18n } from '@/lib/i18n';
import { useVatValidation } from '@/hooks/useVatValidation';

const ICON_MAP: Record<string, any> = {
  screen: Monitor, distance: Eye, puissance: Zap, brightness: SunMedium,
  pixel: Grid, resolution: Maximize, settings: Settings2,
  activity: Activity, processeur: Cpu, couches: Layers, mobile: Smartphone, television: Tv,
  'Télécharger': Download, 'Téléverser': Upload, 'Document': FileText, 'Fichier': File,
  'Dossier': Folder, 'Image': ImageIcon, 'Vidéo': Video, 'Musique': Music,
  'Imprimante': Printer, 'Bluetooth': Bluetooth, 'Wi-Fi': Wifi, 'Écran': Monitor,
  'Mobile': Smartphone, 'Tablette': Tablet, 'Portable': Laptop, 'Souris': Mouse,
  'Clavier': Keyboard, 'Casque': Headphones, 'Haut-parleur': Speaker, 'Micro': Mic,
  'Caméra': Camera, 'Réglages': Settings, 'Utilisateur': User, 'Favoris': Heart,
  'Étoile': Star, 'Notification': Bell, 'Accueil': Home, 'Recherche': Search,
  'Email': Mail, 'Téléphone': Phone, 'Chat': MessageSquare, 'Calendrier': Calendar,
  'Horloge': Clock, 'Localisation': MapPin, 'Langue': Globe, 'Verrouiller': Lock,
  'Infos': Info, 'Aide': HelpCircle, 'Alerte': AlertTriangle, 'Validé': CheckCircle,
  'Refusé': XCircle, 'Ajouter': Plus, 'Retirer': Minus, 'Modifier': Edit,
  'Supprimer': Trash2, 'Copier': Copy, 'Partager': Share2, 'Lien': LinkIcon,
  'Cadeau': Gift, 'Sécurité': ShieldCheck, 'Carte bancaire': CreditCard,
  'Récompense': Award, 'Livre': BookOpen, 'Panier': ShoppingCart, 'Sac': ShoppingBag,
  'Équipe': Users, 'Rafraîchir': RefreshCw, 'Menu': Menu, 'Envoyer': Send,
  'Navigation': Navigation, 'Zoom avant': ZoomIn, 'Zoom arrière': ZoomOut,
};

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
  const [showRentalContent, setShowRentalContent] = useState(false);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [upsellProducts, setUpsellProducts] = useState<Product[]>([]);
  const [quoteFormData, setQuoteFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    postcode: '',
    country: 'FR',
    companyName: '',
    siren: '',
    vatNumber: '',
    comment: '',
  });
  const { vatValidated, vatValidating, vatStatus, vatErrorMessage, validate: validateVat, reset: resetVat } = useVatValidation();
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteDone, setQuoteDone] = useState(false);
  const [stickyTop, setStickyTop] = useState(194);
  const [budgetOpen, setBudgetOpen] = useState(false);
  const committedVariantRef = useRef<ProductVariant | null>(null);
  const comboboxRef1 = useRef<HTMLDivElement>(null);
  const comboboxRef2 = useRef<HTMLDivElement>(null);
  const comboboxBtn1Ref = useRef<HTMLButtonElement>(null);
  const comboboxBtn2Ref = useRef<HTMLButtonElement>(null);
  const [comboboxOpen1, setComboboxOpen1] = useState(false);
  const [comboboxOpen2, setComboboxOpen2] = useState(false);
  const [dropdownRect1, setDropdownRect1] = useState<DOMRect | null>(null);
  const [dropdownRect2, setDropdownRect2] = useState<DOMRect | null>(null);
  const variantWrapRef1 = useRef<HTMLDivElement>(null);
  const variantWrapRef2 = useRef<HTMLDivElement>(null);
  const [variantOverflow1, setVariantOverflow1] = useState(false);
  const [variantOverflow2, setVariantOverflow2] = useState(false);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (comboboxRef1.current && !comboboxRef1.current.contains(e.target as Node)) setComboboxOpen1(false);
      if (comboboxRef2.current && !comboboxRef2.current.contains(e.target as Node)) setComboboxOpen2(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  useLayoutEffect(() => {
    const el1 = variantWrapRef1.current;
    const el2 = variantWrapRef2.current;
    if (el1) setVariantOverflow1(el1.scrollHeight > el1.clientHeight);
    if (el2) setVariantOverflow2(el2.scrollHeight > el2.clientHeight);
  });

  useEffect(() => {
    if (selectedMedia < thumbStart) {
      setThumbStart(selectedMedia);
    } else if (selectedMedia >= thumbStart + maxVisibleThumbs) {
      setThumbStart(Math.max(0, selectedMedia - maxVisibleThumbs + 1));
    }
  }, [selectedMedia, thumbStart, maxVisibleThumbs]);
  const [surfaceW, setSurfaceW] = useState(0);
  const [surfaceH, setSurfaceH] = useState(0);
  const [panelW, setPanelW] = useState(0);
  const [panelH, setPanelH] = useState(0);
  const [budgetResult, setBudgetResult] = useState<{ totalSurface: number; panelSurface: number; panelCount: number; unitPrice: number; totalPrice: number } | null>(null);
  const activeThumbRef = useRef<HTMLButtonElement>(null);
  const { addItem, itemCount } = useCart();
  const { showHT, showTTC, setProfileType, profileType, forceB2B } = useProfile();
  const isB2B = profileType === 'entreprise';
  const { t } = useI18n();

  const [deliveryErrors, setDeliveryErrors] = useState<Record<string, string>>({});
  const [deliveryTouched, setDeliveryTouched] = useState<Record<string, boolean>>({});

  const NAME_RE = /^[\p{L}\s'-]{2,}$/u;
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const PHONE_RE = /^[\d\s+()]{8,}$/;
  const POSTCODE_RE = /^\d{5}$/;

  function validateField(field: string, value: string): string {
    switch (field) {
      case 'firstName':
      case 'lastName':
        if (!value.trim()) return '';
        if (!NAME_RE.test(value.trim())) return 'Veuillez saisir un prénom valide.';
        return '';
      case 'email':
        if (!value.trim()) return '';
        if (!EMAIL_RE.test(value.trim())) return 'Veuillez saisir une adresse e-mail valide.';
        return '';
      case 'phone':
        if (!value.trim()) return '';
        const digits = value.replace(/[^0-9]/g, '');
        if (digits.length < 8 || !PHONE_RE.test(value.trim())) return 'Veuillez saisir un numéro de téléphone valide.';
        return '';
      case 'addressLine1':
        if (!value.trim()) return '';
        if (value.trim().length < 6) return 'Merci de saisir une adresse complète.';
        if (!/\d/.test(value)) return 'Merci de saisir une adresse complète.';
        if (!/[a-zA-Z\u00C0-\u024F]{2,}/.test(value)) return 'Merci de saisir une adresse complète.';
        return '';
      case 'city':
        if (!value.trim()) return '';
        if (value.trim().length < 2) return 'Veuillez saisir une ville valide.';
        if (/^\d+$/.test(value.trim())) return 'Veuillez saisir une ville valide.';
        return '';
      case 'postcode':
        if (!value.trim()) return '';
        if (!POSTCODE_RE.test(value.trim())) return 'Veuillez saisir un code postal valide.';
        return '';
      case 'companyName':
        if (!value.trim()) return '';
        if (value.trim().length < 2) return 'Veuillez saisir une raison sociale valide.';
        return '';
      case 'siren':
        if (!value.trim()) return '';
        const sirenDigits = value.replace(/[^0-9]/g, '');
        if (sirenDigits.length < 9) return 'Le SIREN doit contenir au moins 9 chiffres.';
        return '';
      default:
        return '';
    }
  }

  function handleDeliveryChange(field: string, value: string) {
    setQuoteFormData(d => ({ ...d, [field]: value }));
    if (deliveryTouched[field]) {
      const err = validateField(field, value);
      setDeliveryErrors(prev => err ? { ...prev, [field]: err } : { ...prev, [field]: '' });
    }
  }

  function handleDeliveryBlur(field: string, value: string) {
    setDeliveryTouched(prev => ({ ...prev, [field]: true }));
    const err = validateField(field, value);
    setDeliveryErrors(prev => err ? { ...prev, [field]: err } : { ...prev, [field]: '' });
  }

  const fieldMeta = (field: string, value: string) => {
    const error = deliveryErrors[field] || '';
    const touched = deliveryTouched[field];
    const hasError = touched && !!error;
    const isValid = touched && !error && value.trim().length > 0;
    return { error, hasError, isValid };
  };

  function inputCls(field: string, value: string, withIcon = true) {
    const meta = fieldMeta(field, value);
    return `${withIcon ? 'pl-9' : 'px-3'} pr-3 py-2.5 border rounded-xl text-xs focus:outline-none focus:ring-2 transition-all bg-white placeholder:text-gray-300 w-full ${
      meta.hasError
        ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
        : meta.isValid
          ? 'border-emerald-300 focus:border-emerald-400 focus:ring-emerald-100'
          : 'border-gray-200 focus:ring-gray-900/20 focus:border-gray-400'
    }`;
  }

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
    if (active.length > 0) { setSelectedVariant(active[0]); committedVariantRef.current = active[0]; }
  }, [product]);

  useEffect(() => {
    if (!product) return;
    fetchUpsellProducts([product.id]).then(setUpsellProducts);
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

  useEffect(() => {
    if (canRent && !canBuy && purchaseType !== 'location') {
      setPurchaseType('location');
    }
    if (canBuy && !canRent && purchaseType !== 'achat') {
      setPurchaseType('achat');
    }
  }, [canRent, canBuy, product?.id]);

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
    addItem({
      productId: product.id,
      name: selectedVariant ? `${product.name} - ${selectedVariant.name}` : product.name,
      price: effectivePrice,
      image: selectedVariant?.image || product.image,
      category: product.category,
      type: 'purchase',
      variantName: selectedVariant?.name,
      variantReference: selectedVariant?.reference,
      variantImage: selectedVariant?.image,
      variantPrice: selectedVariant?.price,
    }, quantity);
    toast.success(t('product.addedToCart', { name: product.name }));
  };

  const handleBuyNow = () => {
    if (!product || isOutOfStock) return;
    addItem({
      productId: product.id,
      name: selectedVariant ? `${product.name} - ${selectedVariant.name}` : product.name,
      price: effectivePrice,
      image: selectedVariant?.image || product.image,
      category: product.category,
      type: 'purchase',
      variantName: selectedVariant?.name,
      variantReference: selectedVariant?.reference,
      variantImage: selectedVariant?.image,
      variantPrice: selectedVariant?.price,
    }, quantity);
    router.push('/boutique/paiement');
  };

  const handleRequestQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    // Validate all fields on submit
    const fieldsToValidate = ['firstName', 'lastName', 'email', 'phone', 'addressLine1'];
    if (isB2B) {
      fieldsToValidate.push('companyName', 'siren');
    }
    const newErrors: Record<string, string> = {};
    const newTouched: Record<string, boolean> = {};
    let hasValidationError = false;

    for (const f of fieldsToValidate) {
      const val = (quoteFormData as any)[f] || '';
      const err = validateField(f, val);
      newTouched[f] = true;
      if (err || !val.trim()) {
        newErrors[f] = err || 'Ce champ est obligatoire';
        hasValidationError = true;
      }
    }

    // Also validate city / postcode
    if (!quoteFormData.city || !quoteFormData.postcode) {
      newTouched['city'] = true;
      newErrors['city'] = 'Veuillez sélectionner une ville';
      hasValidationError = true;
    }

    setDeliveryTouched(newTouched);
    setDeliveryErrors(newErrors);

    if (hasValidationError) {
      toast.error('Veuillez corriger les erreurs dans le formulaire');
      return;
    }

    setQuoteLoading(true);
    try {
      const customerName = `${quoteFormData.firstName} ${quoteFormData.lastName}`.trim();
      const customerAddress = `${quoteFormData.addressLine1}${quoteFormData.addressLine2 ? ', ' + quoteFormData.addressLine2 : ''}, ${quoteFormData.postcode} ${quoteFormData.city}`.trim();

      const res = await fetch('/api/quote-requests/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          productName: product.name,
          productImage: product.image || '',
          quantity,
          customerName,
          customerEmail: quoteFormData.email,
          customerPhone: quoteFormData.phone,
          customerCompany: isB2B ? quoteFormData.companyName : '',
          customerSiren: isB2B ? quoteFormData.siren : '',
          customerVat: isB2B ? quoteFormData.vatNumber : '',
          customerCountry: quoteFormData.country,
          customerAddress,
          comment: quoteFormData.comment,
        }),
      });
      if (!res.ok) throw new Error('Erreur');
      setQuoteDone(true);
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
            {showRentalContent ? (
            <div className="max-w-2xl">
              <button onClick={() => setShowRentalContent(false)}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 transition-colors cursor-pointer mb-6"
              >
                <ChevronLeft size={14} />
                Retour au produit
              </button>
              <BoutiqueRentalFlow
                product={product}
                onComplete={() => {
                  setShowRentalContent(false);
                  setLocationCompleted(true);
                }}
              />
            </div>
            ) : canQuote && !canBuy && !canRent && showQuoteForm ? (
            <div className="max-w-2xl">
              <button onClick={() => setShowQuoteForm(false)}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 transition-colors cursor-pointer mb-6"
              >
                <ChevronLeft size={14} />
                Retour au produit
              </button>

              <div className="bg-gray-50/50 rounded-xl border border-gray-100">
                {quoteDone ? (
                  <>
                    {/* Confirmation Header */}
                    <div className="p-8 text-center border-b border-emerald-200">
                      <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                        <CheckCircle size={32} className="text-emerald-600" />
                      </div>
                      <h2 className="text-xl font-extrabold text-gray-900">Félicitations !</h2>
                      <p className="text-sm text-gray-600 mt-2 max-w-sm mx-auto">
                        Nous avons bien envoyé un email à <strong className="text-emerald-700">{quoteFormData.email}</strong>.
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Nous vous contacterons sous 48h maximum.</p>
                    </div>

                    {/* Summary of submitted info */}
                    <div className="p-6 space-y-3">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Récapitulatif de votre demande</p>
                      <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50 text-xs">
                        <div className="flex justify-between px-4 py-2.5">
                          <span className="text-gray-500">Produit</span>
                          <span className="font-semibold text-gray-900 text-right max-w-[60%]">{product?.name}</span>
                        </div>
                        <div className="flex justify-between px-4 py-2.5">
                          <span className="text-gray-500">Quantité</span>
                          <span className="font-semibold text-gray-900">{quantity}</span>
                        </div>
                        <div className="flex justify-between px-4 py-2.5">
                          <span className="text-gray-500">Nom</span>
                          <span className="font-semibold text-gray-900">{quoteFormData.firstName} {quoteFormData.lastName}</span>
                        </div>
                        <div className="flex justify-between px-4 py-2.5">
                          <span className="text-gray-500">Email</span>
                          <span className="font-semibold text-gray-900">{quoteFormData.email}</span>
                        </div>
                        <div className="flex justify-between px-4 py-2.5">
                          <span className="text-gray-500">Téléphone</span>
                          <span className="font-semibold text-gray-900">{quoteFormData.phone}</span>
                        </div>
                        <div className="flex justify-between px-4 py-2.5">
                          <span className="text-gray-500">Adresse</span>
                          <span className="font-semibold text-gray-900 text-right max-w-[60%]">
                            {quoteFormData.addressLine1}{quoteFormData.addressLine2 ? ', ' + quoteFormData.addressLine2 : ''}
                            <br />{quoteFormData.postcode} {quoteFormData.city}
                          </span>
                        </div>
                        <div className="flex justify-between px-4 py-2.5">
                          <span className="text-gray-500">Pays</span>
                          <span className="font-semibold text-gray-900">{quoteFormData.country}</span>
                        </div>
                        {isB2B && quoteFormData.companyName && (
                        <div className="flex justify-between px-4 py-2.5">
                          <span className="text-gray-500">Entreprise</span>
                          <span className="font-semibold text-gray-900">{quoteFormData.companyName}</span>
                        </div>
                        )}
                        {isB2B && quoteFormData.siren && (
                        <div className="flex justify-between px-4 py-2.5">
                          <span className="text-gray-500">SIREN</span>
                          <span className="font-semibold text-gray-900">{quoteFormData.siren}</span>
                        </div>
                        )}
                        {isB2B && quoteFormData.vatNumber && (
                        <div className="flex justify-between px-4 py-2.5">
                          <span className="text-gray-500">TVA</span>
                          <span className="font-semibold text-gray-900">{quoteFormData.vatNumber}</span>
                        </div>
                        )}
                        {quoteFormData.comment && (
                        <div className="flex justify-between px-4 py-2.5">
                          <span className="text-gray-500">Commentaire</span>
                          <span className="font-semibold text-gray-900 text-right max-w-[60%]">{quoteFormData.comment}</span>
                        </div>
                        )}
                      </div>
                    </div>

                    {/* Thank you + actions */}
                    <div className="px-6 pb-6 text-center">
                      <p className="text-xs text-gray-500 mb-4">Merci de votre confiance ! Notre équipe traitera votre demande dans les plus brefs délais.</p>
                      <div className="flex flex-col gap-2">
                        <button onClick={() => router.push('/boutique')}
                          className="w-full bg-gray-900 hover:bg-gray-800 text-white py-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 shadow-sm">
                          <Store size={15} />
                          Continuer mes achats
                        </button>
                        <button onClick={() => router.push('/mon-compte/commandes')}
                          className="w-full border-2 border-gray-200 text-gray-600 hover:border-gray-400 hover:text-gray-900 py-3 rounded-xl text-xs font-semibold transition-all">
                          Suivre mes demandes
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Header */}
                    <div className="flex items-center gap-3 p-4 border-b border-gray-100">
                      <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                        <FileText size={15} className="text-amber-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{t('product.requestQuote')}</p>
                        <p className="text-[11px] text-gray-400">{t('product.quoteInfo')}</p>
                      </div>
                    </div>

                    {/* Fields */}
                    <div className="px-4 pb-4 pt-3">
                      <form onSubmit={handleRequestQuote} className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Prénom */}
                          <div>
                            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Prénom *</label>
                            <div className="relative">
                              <User size={14} className="absolute left-3 top-3 pointer-events-none text-gray-400" />
                              <input type="text" placeholder="Jean" required value={quoteFormData.firstName}
                                onChange={e => handleDeliveryChange('firstName', e.target.value)}
                                onBlur={e => handleDeliveryBlur('firstName', e.target.value)}
                                aria-invalid={fieldMeta('firstName', quoteFormData.firstName).hasError}
                                aria-describedby={fieldMeta('firstName', quoteFormData.firstName).error ? 'err-firstName' : undefined}
                                className={inputCls('firstName', quoteFormData.firstName)} />
                            </div>
                            <div className="h-5 mt-1" aria-live="polite" aria-atomic="true">
                              {fieldMeta('firstName', quoteFormData.firstName).error && (
                                <p id="err-firstName" className="text-[10px] text-red-500 flex items-center gap-1">
                                  <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                                  {deliveryErrors.firstName}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Nom */}
                          <div>
                            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Nom *</label>
                            <div className="relative">
                              <User size={14} className="absolute left-3 top-3 pointer-events-none text-gray-400" />
                              <input type="text" placeholder="Dupont" required value={quoteFormData.lastName}
                                onChange={e => handleDeliveryChange('lastName', e.target.value)}
                                onBlur={e => handleDeliveryBlur('lastName', e.target.value)}
                                aria-invalid={fieldMeta('lastName', quoteFormData.lastName).hasError}
                                aria-describedby={fieldMeta('lastName', quoteFormData.lastName).error ? 'err-lastName' : undefined}
                                className={inputCls('lastName', quoteFormData.lastName)} />
                            </div>
                            <div className="h-5 mt-1" aria-live="polite" aria-atomic="true">
                              {fieldMeta('lastName', quoteFormData.lastName).error && (
                                <p id="err-lastName" className="text-[10px] text-red-500 flex items-center gap-1">
                                  <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                                  {deliveryErrors.lastName}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Email */}
                          <div>
                            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Email *</label>
                            <div className="relative">
                              <Mail size={14} className="absolute left-3 top-3 pointer-events-none text-gray-400" />
                              <input type="email" placeholder="email@exemple.com" required value={quoteFormData.email}
                                onChange={e => handleDeliveryChange('email', e.target.value)}
                                onBlur={e => handleDeliveryBlur('email', e.target.value)}
                                aria-invalid={fieldMeta('email', quoteFormData.email).hasError}
                                aria-describedby={fieldMeta('email', quoteFormData.email).error ? 'err-email' : undefined}
                                className={inputCls('email', quoteFormData.email)} />
                            </div>
                            <div className="h-5 mt-1" aria-live="polite" aria-atomic="true">
                              {fieldMeta('email', quoteFormData.email).error && (
                                <p id="err-email" className="text-[10px] text-red-500 flex items-center gap-1">
                                  <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                                  {deliveryErrors.email}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Téléphone mobile */}
                          <div>
                            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Téléphone mobile *</label>
                            <div className="relative">
                              <Phone size={14} className="absolute left-3 top-3 pointer-events-none text-gray-400" />
                              <input type="tel" placeholder="06 12 34 56 78" required value={quoteFormData.phone}
                                onChange={e => handleDeliveryChange('phone', e.target.value)}
                                onBlur={e => handleDeliveryBlur('phone', e.target.value)}
                                aria-invalid={fieldMeta('phone', quoteFormData.phone).hasError}
                                aria-describedby={fieldMeta('phone', quoteFormData.phone).error ? 'err-phone' : undefined}
                                className={inputCls('phone', quoteFormData.phone)} />
                            </div>
                            <div className="h-5 mt-1" aria-live="polite" aria-atomic="true">
                              {fieldMeta('phone', quoteFormData.phone).error && (
                                <p id="err-phone" className="text-[10px] text-red-500 flex items-center gap-1">
                                  <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                                  {deliveryErrors.phone}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Ligne d'adresse 1 */}
                          <div className="sm:col-span-2">
                            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Ligne d'adresse 1 *</label>
                            <div className="relative">
                              <MapPin size={14} className="absolute left-3 top-3 pointer-events-none text-gray-400" />
                              <input type="text" placeholder="123 Rue de l'Exemple" required value={quoteFormData.addressLine1}
                                onChange={e => handleDeliveryChange('addressLine1', e.target.value)}
                                onBlur={e => handleDeliveryBlur('addressLine1', e.target.value)}
                                aria-invalid={fieldMeta('addressLine1', quoteFormData.addressLine1).hasError}
                                aria-describedby={fieldMeta('addressLine1', quoteFormData.addressLine1).error ? 'err-addressLine1' : undefined}
                                className={inputCls('addressLine1', quoteFormData.addressLine1)} />
                            </div>
                            <div className="h-5 mt-1" aria-live="polite" aria-atomic="true">
                              {fieldMeta('addressLine1', quoteFormData.addressLine1).error && (
                                <p id="err-addressLine1" className="text-[10px] text-red-500 flex items-center gap-1">
                                  <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                                  {deliveryErrors.addressLine1}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Ligne d'adresse 2 */}
                          <div className="sm:col-span-2">
                            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Ligne d'adresse 2</label>
                            <div className="relative">
                              <MapPin size={14} className="absolute left-3 top-3 pointer-events-none text-gray-400" />
                              <input type="text" placeholder="Appartement, Bâtiment, etc." value={quoteFormData.addressLine2} onChange={e => setQuoteFormData(d => ({ ...d, addressLine2: e.target.value }))}
                                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-400 transition-all bg-white placeholder:text-gray-300" />
                            </div>
                            <div className="h-5 mt-1" />
                          </div>

                          {/* Ville & Code Postal (CityInput) */}
                          <div className="sm:col-span-2">
                            <CityInput
                              value={quoteFormData.city ? `${quoteFormData.city} (${quoteFormData.postcode})` : ''}
                              onChange={(cityName, postcode) => {
                                setQuoteFormData(d => ({ ...d, city: cityName, postcode }));
                                setDeliveryErrors(prev => ({ ...prev, city: '', postcode: '' }));
                                if (!deliveryTouched.city) setDeliveryTouched(prev => ({ ...prev, city: true }));
                                if (!deliveryTouched.postcode) setDeliveryTouched(prev => ({ ...prev, postcode: true }));
                              }}
                              error={!!(deliveryErrors.city || deliveryErrors.postcode)}
                              errorMessage={deliveryErrors.city || deliveryErrors.postcode}
                            />
                            <div className="h-5 mt-1" />
                          </div>

                          {/* Pays */}
                          <div className="sm:col-span-2">
                            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Pays</label>
                            <select
                              value={quoteFormData.country}
                              onChange={e => setQuoteFormData(d => ({ ...d, country: e.target.value }))}
                              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-400 transition-all bg-white"
                            >
                              <option value="FR">France</option>
                              <option value="BE">Belgique</option>
                              <option value="CH">Suisse</option>
                              <option value="LU">Luxembourg</option>
                              <option value="DE">Allemagne</option>
                              <option value="ES">Espagne</option>
                              <option value="IT">Italie</option>
                              <option value="NL">Pays-Bas</option>
                              <option value="PT">Portugal</option>
                              <option value="GB">Royaume-Uni</option>
                              <option value="AT">Autriche</option>
                              <option value="IE">Irlande</option>
                              <option value="DK">Danemark</option>
                              <option value="SE">Suède</option>
                              <option value="FI">Finlande</option>
                              <option value="PL">Pologne</option>
                              <option value="CZ">République Tchèque</option>
                              <option value="SK">Slovaquie</option>
                              <option value="HU">Hongrie</option>
                              <option value="GR">Grèce</option>
                              <option value="RO">Roumanie</option>
                              <option value="BG">Bulgarie</option>
                              <option value="HR">Croatie</option>
                              <option value="SI">Slovénie</option>
                              <option value="LT">Lituanie</option>
                              <option value="LV">Lettonie</option>
                              <option value="EE">Estonie</option>
                              <option value="CY">Chypre</option>
                              <option value="MT">Malte</option>
                            </select>
                            <div className="h-5 mt-1" />
                          </div>
                        </div>

                        {isB2B && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 border-t border-gray-100 pt-3">
                            {/* Raison sociale */}
                            <div>
                              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Raison sociale *</label>
                              <input
                                type="text"
                                placeholder="Nom de l'entreprise"
                                required
                                value={quoteFormData.companyName}
                                onChange={e => handleDeliveryChange('companyName', e.target.value)}
                                onBlur={e => handleDeliveryBlur('companyName', e.target.value)}
                                className={inputCls('companyName', quoteFormData.companyName, false)}
                              />
                              <div className="h-5 mt-1" aria-live="polite" aria-atomic="true">
                                {fieldMeta('companyName', quoteFormData.companyName).error && (
                                  <p className="text-[10px] text-red-500 flex items-center gap-1">
                                    <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                                    {deliveryErrors.companyName}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* SIREN / SIRET */}
                            <div>
                              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">SIREN / SIRET *</label>
                              <input
                                type="text"
                                placeholder="123 456 789"
                                required
                                value={quoteFormData.siren}
                                onChange={e => handleDeliveryChange('siren', e.target.value)}
                                onBlur={e => handleDeliveryBlur('siren', e.target.value)}
                                className={inputCls('siren', quoteFormData.siren, false)}
                              />
                              <div className="h-5 mt-1" aria-live="polite" aria-atomic="true">
                                {fieldMeta('siren', quoteFormData.siren).error && (
                                  <p className="text-[10px] text-red-500 flex items-center gap-1">
                                    <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                                    {deliveryErrors.siren}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* TVA */}
                            <div className="sm:col-span-2">
                              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Numéro de TVA intracommunautaire</label>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  placeholder="FRXX999999999"
                                  value={quoteFormData.vatNumber}
                                  onChange={e => {
                                    setQuoteFormData(d => ({ ...d, vatNumber: e.target.value }));
                                    if (vatStatus !== 'idle') resetVat();
                                  }}
                                  className={`flex-1 px-3 py-2.5 border rounded-xl text-xs focus:outline-none focus:ring-2 transition-all bg-white ${
                                    vatStatus === 'valid'
                                      ? 'border-emerald-300 bg-emerald-50/30'
                                      : vatStatus === 'invalid'
                                        ? 'border-red-300 bg-red-50/30'
                                        : 'border-gray-200 focus:ring-gray-900/20 focus:border-gray-400'
                                  }`}
                                />
                                <button
                                  type="button"
                                  disabled={vatValidating || !quoteFormData.vatNumber}
                                  onClick={() => validateVat(quoteFormData.vatNumber)}
                                  className={`shrink-0 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                                    vatStatus === 'valid'
                                      ? 'bg-emerald-500 text-white'
                                      : vatStatus === 'invalid'
                                        ? 'bg-red-500 text-white'
                                        : 'bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50'
                                  }`}
                                >
                                  {vatValidating ? '...' : vatStatus === 'valid' ? '✓ Valide' : vatStatus === 'invalid' ? '✗ Invalide' : 'Valider'}
                                </button>
                              </div>
                              {vatStatus === 'valid' && (
                                <p className="text-[10px] text-emerald-600 font-semibold mt-1">Numéro de TVA valide — TVA autoliquidée</p>
                              )}
                              {vatStatus === 'invalid' && (
                                <p className="text-[10px] text-red-500 font-semibold mt-1">{vatErrorMessage}</p>
                              )}
                              {vatStatus === 'error' && (
                                <p className="text-[10px] text-amber-600 font-semibold mt-1">{vatErrorMessage}</p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Commentaire */}
                        <div className="pt-2">
                          <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Commentaire</label>
                          <textarea placeholder="Décrivez votre projet, vos besoins spécifiques..." rows={3} value={quoteFormData.comment} onChange={e => setQuoteFormData(d => ({ ...d, comment: e.target.value }))}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-400 transition-all bg-white resize-none placeholder:text-gray-300" />
                        </div>

                        <div className="pt-2">
                          <button type="submit" disabled={quoteLoading}
                            className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-40 shadow-sm">
                            {quoteLoading ? 'Envoi en cours...' : 'Envoyer la demande'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </>
                )}
              </div>
            </div>
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
              <div className="bg-white rounded-2xl shadow-sm w-full mt-[15px] mr-5 p-5 relative">
                {(() => {
                  const modeBadge = getModeBadge(product);
                  return modeBadge ? (
                    <div className="absolute top-7 right-7 z-10 flex flex-col gap-1 items-end">
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider shadow-sm ${modeBadge.colors}`}>
                        {modeBadge.label}
                      </span>
                    </div>
                  ) : null;
                })()}
                <div className="cursor-pointer w-full aspect-[4/3] overflow-hidden rounded-xl" onClick={() => { setSelectedVariant(null); openLightbox(selectedMedia); }}>
                  {effectiveMedia ? (
                    effectiveMedia.type === 'video' ? (
                      <video
                        src={effectiveMedia.url}
                        className="w-full h-full object-contain"
                        autoPlay
                        muted
                        playsInline
                        preload="metadata"
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
                  <div className="relative mt-3 overflow-x-auto scrollbar-hide">
                    <div className="flex gap-3 justify-start sm:justify-center">
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

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button onClick={() => window.open(product.pdfUrl || '', '_blank')} disabled={!product.pdfUrl} className="flex items-center gap-2 px-3 py-2.5 bg-white border border-gray-200/70 rounded-xl hover:border-gray-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed group">
                  <FileText size={14} className="text-gray-500 group-hover:text-gray-700 transition-colors" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 group-hover:text-gray-600 transition-colors">{t('product.datasheet')}</span>
                </button>
                {product.playStoreUrl && (
                  <button onClick={() => window.open(product.playStoreUrl, '_blank')} className="h-[44px] w-[118px] sm:h-[52px] sm:w-[174px] hover:opacity-90 active:scale-95 transition-all shrink-0">
                    <img src="/google.svg" alt="Google Play" className="h-full w-full object-contain rounded-lg" />
                  </button>
                )}
                {product.appStoreUrl && (
                  <button onClick={() => window.open(product.appStoreUrl, '_blank')} className="h-[38px] w-[100px] sm:h-[44px] sm:w-[118px] hover:opacity-90 active:scale-95 transition-all shrink-0">
                    <img src="/appele.svg" alt="App Store" className="h-full w-full object-contain rounded-[6px]" />
                  </button>
                )}
                {product.downloadUrl2 && (
                  <button onClick={() => window.open(product.downloadUrl2, '_blank')} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200/70 rounded-xl hover:border-gray-400 transition-colors group">
                    {(() => {
                      const Icon = product.downloadCustomIcon2 ? null : (product.downloadIcon2 ? ICON_MAP[product.downloadIcon2] : null) || Download;
                      return product.downloadCustomIcon2 ? <img src={product.downloadCustomIcon2} className="w-3.5 h-3.5 object-contain text-gray-500 group-hover:text-gray-700 transition-colors" /> : <Icon size={14} className="text-gray-500 group-hover:text-gray-700 transition-colors" />;
                    })()}
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 group-hover:text-gray-600 transition-colors">
                      {product.downloadLabel2 || 'Télécharger'}
                    </span>
                  </button>
                )}
                {product.downloadUrl3 && (
                  <button onClick={() => window.open(product.downloadUrl3, '_blank')} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200/70 rounded-xl hover:border-gray-400 transition-colors group">
                    {(() => {
                      const Icon = product.downloadCustomIcon3 ? null : (product.downloadIcon3 ? ICON_MAP[product.downloadIcon3] : null) || Download;
                      return product.downloadCustomIcon3 ? <img src={product.downloadCustomIcon3} className="w-3.5 h-3.5 object-contain text-gray-500 group-hover:text-gray-700 transition-colors" /> : <Icon size={14} className="text-gray-500 group-hover:text-gray-700 transition-colors" />;
                    })()}
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 group-hover:text-gray-600 transition-colors">
                      {product.downloadLabel3 || 'Télécharger'}
                    </span>
                  </button>
                )}
              </div>
            </section>

            {/* Mobile purchase info */}
            <div className="lg:hidden flex flex-col mb-6 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <span className="text-xs font-bold uppercase tracking-widest text-blue-500 mb-2">{product.category}</span>
              <h1 className="text-xl font-bold text-gray-900 mb-2">{product.name}</h1>
              {product.showRating !== false && (
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center gap-0.5">
                    {renderStars(product.rating ?? 5.0, 16)}
                  </div>
                  <span className="text-xs text-gray-400">({product.reviews ?? 0})</span>
                </div>
              )}
              <div className="mb-4">
                <div className="flex items-center gap-3 flex-wrap">
                  {effectiveOldPrice && effectiveOldPrice > effectivePrice && (
                    <span className="text-base text-gray-400 line-through font-medium">{formatPrice(effectiveOldPrice)}</span>
                  )}
                  {product?.priceDisplay === 'free' ? (
                    <div className="text-2xl font-bold text-emerald-600">Gratuit</div>
                  ) : product?.priceDisplay === 'multiprice' && !selectedVariant ? (
                    <div className="text-2xl font-bold text-gray-900">Tarifs multiples</div>
                  ) : product?.priceDisplay === 'quote' ? (
                    <div className="text-2xl font-bold text-gray-900">Sur devis</div>
                  ) : product && product.price > 0 ? (
                    <div className="text-2xl font-bold text-gray-900">{formatPrice(effectivePrice)}</div>
                  ) : (
                    <div className="text-2xl font-bold text-gray-900">{formatPrice(effectivePrice)}</div>
                  )}
                  <span className="text-[10px] font-bold text-gray-400 bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded-md tracking-wider">Hors taxes</span>
                  {effectiveOldPrice && effectiveOldPrice > effectivePrice && (
                    <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">-{Math.round((1 - effectivePrice / effectiveOldPrice) * 100)}%</span>
                  )}
                </div>

                <div className="relative mt-2">
                  {!forceB2B && (
                    <>
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
                    </>
                  )}
                </div>
              </div>
              {displayVariants.length > 0 && (
                <div className="mb-4">
                  {variantOverflow1 ? (
                    <div ref={comboboxRef1}>
                      <button
                        ref={comboboxBtn1Ref}
                        onClick={() => {
                          const rect = comboboxBtn1Ref.current?.getBoundingClientRect() ?? null;
                          setDropdownRect1(rect);
                          setComboboxOpen1(o => !o);
                        }}
                        className="inline-flex items-center justify-between w-full text-sm font-bold text-gray-600 bg-white border-2 border-gray-200 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900 rounded-2xl px-4 py-3.5 transition-all"
                      >
                        <span>{selectedVariant?.name || "Choisir une variante"}</span>
                        <ChevronDown size={16} className={`transition-transform duration-200 ${comboboxOpen1 ? 'rotate-180' : ''}`} />
                      </button>
                      {comboboxOpen1 && dropdownRect1 && (
                        <div
                          className="bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-y-auto"
                          style={{
                            position: 'fixed',
                            zIndex: 9999,
                            top: dropdownRect1.bottom + 6,
                            left: dropdownRect1.left,
                            width: dropdownRect1.width,
                            maxHeight: 320,
                            scrollbarWidth: 'thin',
                            scrollbarColor: '#e5e7eb transparent',
                          }}
                        >
                          <ul className="py-1">
                            {displayVariants.map((v) => (
                              <li key={v.name}>
                                <button
                                  onMouseEnter={() => { setSelectedVariant(v); const imgIdx = mediaItems.findIndex(m => m.type === 'image' && m.url === v.image); if (imgIdx >= 0) setSelectedMedia(imgIdx); }}
                                  onClick={() => { setSelectedVariant(v); committedVariantRef.current = v; const imgIdx = mediaItems.findIndex(m => m.type === 'image' && m.url === v.image); if (imgIdx >= 0) setSelectedMedia(imgIdx); setComboboxOpen1(false); }}
                                  className="inline-flex items-center justify-between w-full px-4 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-900 hover:text-white transition-colors"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold uppercase shrink-0 bg-gray-100 text-gray-400">{v.name?.charAt(0)}</div>
                                    <div className="text-left">
                                      <div className="text-sm font-bold">{v.name}</div>
                                      {v.reference && <div className="text-[10px] text-gray-400 font-mono">{v.reference}</div>}
                                    </div>
                                  </div>
                                  {v.price && <div className="text-xs font-bold text-gray-600">{formatPrice(v.price)}</div>}
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div ref={variantWrapRef1} className="flex flex-wrap gap-2">
                      {displayVariants.map((v) => (
                        <button key={v.name} onClick={() => { setSelectedVariant(v); committedVariantRef.current = v; const imgIdx = mediaItems.findIndex(m => m.type === 'image' && m.url === v.image); if (imgIdx >= 0) setSelectedMedia(imgIdx); }}
                          className={`shrink-0 px-4 py-2.5 text-sm font-bold rounded-2xl border-2 transition-all ${selectedVariant?.image === v.image ? 'border-gray-900 bg-gray-900 text-white shadow-md' : 'border-gray-200/70 text-gray-600 hover:border-gray-400 hover:shadow-sm'}`}>
                          {v.name}
                        </button>
                      ))}
                    </div>
                  )}
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
                  <div className="absolute right-1 top-1/2 -translate-y-1/2 flex flex-col">
                    <button onClick={() => setQuantity(Math.min(availableStock, quantity + 1))} className="p-2 transition-colors text-slate-500 hover:text-slate-300">
                      <ChevronUp size={14} />
                    </button>
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2 transition-colors text-slate-500 hover:text-slate-300">
                      <ChevronDown size={14} />
                    </button>
                  </div>
                  )}
                </div>
              </div>
              {(canBuy || canRent) && (
                <div className="flex border-b border-gray-200/40 mb-3 mt-2">
                  {canBuy && (
                    <button onClick={() => setPurchaseType('achat')}
                      className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${purchaseType === 'achat' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                      {t('product.purchase')}
                    </button>
                  )}
                  {canRent && (
                    <button onClick={() => setPurchaseType('location')}
                      className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${purchaseType === 'location' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                      {t('product.rental')}
                    </button>
                  )}
                </div>
              )}
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
                ) : (
                  <button onClick={() => setShowQuoteForm(true)}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white py-2.5 px-4 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    <FileText size={15} /> {t('product.requestQuote')}
                  </button>
                )
              ) : purchaseType === 'location' && locationCompleted ? (
                <div className="flex flex-col gap-3 mt-2">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                    <p className="text-sm font-semibold text-emerald-800">{t('product.readyForRental')}</p>
                    <p className="text-xs text-emerald-600 mt-1">{t('product.rentalInfoAdded')}</p>
                  </div>
                  <button onClick={() => router.push('/boutique/panier')} className="w-full bg-gray-900 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-800 transition-all flex items-center justify-center gap-2">
                    <ShoppingBag size={15} /> {t('product.viewCart')}
                  </button>
                  <button onClick={() => router.push('/boutique')} className="w-full border-2 border-gray-900 text-gray-900 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-900 hover:text-white transition-all flex items-center justify-center gap-2">
                    <Store size={15} /> {t('product.continueShopping')}
                  </button>
                </div>
              ) : purchaseType === 'location' ? (
                <button onClick={() => setShowRentalContent(true)}
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white py-2.5 px-4 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <CalendarDays size={15} /> {t('product.rental')}
                </button>
              ) : (
                <>
              <button onClick={handleAddToCart} disabled={isOutOfStock} className="w-full bg-gray-900 text-white py-2.5 px-4 rounded-xl text-sm font-semibold hover:bg-gray-800 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
                  <ShoppingBag size={15} /> {isOutOfStock ? 'Indisponible' : t('product.addToCart')}
                </button>
              <button onClick={handleBuyNow} disabled={isOutOfStock} className="w-full mt-2 border-2 border-gray-900 text-gray-900 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-900 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed">{isOutOfStock ? 'Indisponible' : t('product.buyNow')}</button>
                </>
              )}
            </div>

            <div className="mt-28 border-t border-gray-200/40 pt-16 space-y-24">
              {product?.description && product.description.length > 60 && (
                <div className="bg-white rounded-2xl border border-gray-200/70 p-5">
                  <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
                </div>
              )}

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
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
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
              {upsellProducts.length > 0 && (
                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Complétez votre installation</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {upsellProducts.map((p) => (
                      <div key={p.id} className="bg-white rounded-2xl border border-gray-200/70 p-4 group hover:shadow-md transition-all duration-300">
                        <div onClick={() => router.push(`/boutique/produit/${p.id}`)} className="aspect-square bg-gray-50 rounded-xl overflow-hidden mb-4 cursor-pointer relative">
                          <div className="w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-110" style={{ backgroundImage: `url(${p.image})` }} />
                          {(() => {
                            const b = getModeBadge(p);
                            return b ? (
                              <div className="absolute top-1.5 right-1.5 z-10">
                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider shadow-sm ${b.colors}`}>{b.label}</span>
                              </div>
                            ) : null;
                          })()}
                        </div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-1">{p.name}</h3>
                        <p className="text-sm font-bold text-gray-900 mb-3">{p.priceDisplay === 'free' ? 'Gratuit' : p.priceDisplay === 'multiprice' ? 'Tarifs multiples' : p.priceDisplay === 'quote' ? 'Sur devis' : p.price > 0 ? formatPrice(p.price) : formatPrice(p.price)}</p>
                        <button onClick={() => { addItem({ productId: p.id, name: p.name, price: p.price, image: p.image, category: p.category, type: 'purchase' }); toast.success(`${p.name} ajouté au panier`); }} className="w-full border border-gray-200/70 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-all">
                          Ajouter
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>
          )}
        </div>

        <aside
          className="hidden lg:flex flex-col fixed z-10 w-[420px] max-h-[calc(100vh-9rem)]"
          style={{ top: stickyTop, right: 'max(16px, calc((100vw - 1280px) / 2 + 64px))', transition: 'top 0.35s ease', overflow: 'visible' }}
        >
          <div className="flex-1 min-h-0 pr-1 overflow-visible">
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

            {product.description && product.description.length <= 60 && (
              <p className="text-gray-500 text-sm leading-relaxed mb-4">{product.description}</p>
            )}

            {product.showRating !== false && (
              <div className="flex items-center gap-2 mb-6">
                <div className="flex items-center gap-0.5">
                  {renderStars(product.rating ?? 5.0, 18)}
                </div>
                <span className="text-sm text-gray-400">{t('product.reviews', { count: product.reviews ?? 0 })}</span>
              </div>
            )}

            <div className="mb-6">
              <div className="flex items-center gap-3 flex-wrap">
                {effectiveOldPrice && effectiveOldPrice > effectivePrice && (
                  <span className="text-lg text-gray-400 line-through font-medium">{formatPrice(effectiveOldPrice)}</span>
                )}
                {product?.priceDisplay === 'free' ? (
                  <div className="text-3xl font-bold text-emerald-600">Gratuit</div>
                ) : product?.priceDisplay === 'multiprice' && !selectedVariant ? (
                  <div className="text-3xl font-bold text-gray-900">Tarifs multiples</div>
                ) : product?.priceDisplay === 'quote' ? (
                  <div className="text-3xl font-bold text-gray-900">Sur devis</div>
                ) : product && product.price > 0 ? (
                  <div className="text-3xl font-bold text-gray-900">{formatPrice(effectivePrice)}</div>
                ) : (
                  <div className="text-3xl font-bold text-gray-900">{formatPrice(effectivePrice)}</div>
                )}
                {effectiveOldPrice && effectiveOldPrice > effectivePrice && (
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    -{Math.round((1 - effectivePrice / effectiveOldPrice) * 100)}%
                  </span>
                )}
              </div>
              <div className="relative mt-1">
                {!forceB2B && (
                  <>
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
                  </>
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
                      <span className="text-xs text-gray-400 font-mono font-medium bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200/50">{selectedVariant.reference}</span>
                    )}
                  </div>
                )}
                {variantOverflow2 ? (
                  <div ref={comboboxRef2}>
                    <button
                      ref={comboboxBtn2Ref}
                      onClick={() => {
                        const rect = comboboxBtn2Ref.current?.getBoundingClientRect() ?? null;
                        setDropdownRect2(rect);
                        setComboboxOpen2(o => !o);
                      }}
                      className="inline-flex items-center justify-between w-full text-sm font-bold text-gray-600 bg-white border-2 border-gray-200 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900 rounded-2xl px-4 py-3.5 transition-all"
                    >
                      <span>{selectedVariant?.name || "Choisir une variante"}</span>
                      <ChevronDown size={16} className={`transition-transform duration-200 ${comboboxOpen2 ? 'rotate-180' : ''}`} />
                    </button>
                    {comboboxOpen2 && dropdownRect2 && (
                      <div
                        className="bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-y-auto"
                        style={{
                          position: 'fixed',
                          zIndex: 9999,
                          top: dropdownRect2.bottom + 6,
                          left: dropdownRect2.left,
                          width: dropdownRect2.width,
                          maxHeight: 320,
                          scrollbarWidth: 'thin',
                          scrollbarColor: '#e5e7eb transparent',
                        }}
                      >
                        <ul className="py-1">
                          {displayVariants.map((v) => (
                            <li key={v.name}>
                              <button
                                onMouseEnter={() => { setSelectedVariant(v); const imgIdx = mediaItems.findIndex(m => m.type === 'image' && m.url === v.image); if (imgIdx >= 0) setSelectedMedia(imgIdx); }}
                                onClick={() => { setSelectedVariant(v); committedVariantRef.current = v; const imgIdx = mediaItems.findIndex(m => m.type === 'image' && m.url === v.image); if (imgIdx >= 0) setSelectedMedia(imgIdx); setComboboxOpen2(false); }}
                                className="inline-flex items-center justify-between w-full px-4 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold uppercase shrink-0 bg-gray-100 text-gray-400">{v.name?.charAt(0)}</div>
                                  <div className="text-left">
                                    <div className="text-sm font-bold">{v.name}</div>
                                    {v.reference && <div className="text-[10px] text-gray-400 font-mono">{v.reference}</div>}
                                  </div>
                                </div>
                                {v.price && <div className="text-xs font-bold text-gray-600">{formatPrice(v.price)}</div>}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div ref={variantWrapRef2} className="flex flex-wrap gap-2">
                    {displayVariants.map((v) => (
                      <button
                        key={v.name}
                        onClick={() => {
                          setSelectedVariant(v);
                          committedVariantRef.current = v;
                          const imgIdx = mediaItems.findIndex(m => m.type === 'image' && m.url === v.image);
                          if (imgIdx >= 0) setSelectedMedia(imgIdx);
                        }}
                        className={`shrink-0 px-4 py-2.5 text-sm font-bold rounded-2xl border-2 transition-all ${selectedVariant?.image === v.image ? 'border-gray-900 bg-gray-900 text-white shadow-md' : 'border-gray-200/70 text-gray-600 hover:border-gray-400 hover:shadow-sm'}`}
                      >
                        {v.name}
                      </button>
                    ))}
                  </div>
                )}
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

              return canQuote && (
                <div className="mb-6 bg-white rounded-2xl border border-gray-200/70 shadow-sm">
                  <button type="button" onClick={() => setBudgetOpen(prev => !prev)} className="w-full flex items-center justify-between p-5 hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                        <Calculator size={16} className="text-emerald-600" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-sm font-bold text-gray-900">Calculer le budget</h3>
                        <p className="text-xs text-gray-400 font-medium">Estimez le coût de votre projet</p>
                      </div>
                    </div>
                    <ChevronDown size={16} className={`text-gray-400 transition-transform duration-200 ${budgetOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {budgetOpen && (
                  <div className="px-5 pb-5 border-t border-gray-100 pt-4">

                  {dims && (
                    <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-blue-50 border border-blue-100 rounded-xl">
                      <Package size={13} className="text-blue-500 shrink-0" />
                      <p className="text-xs text-blue-700 font-medium">
                        Dalle détectée : <span className="font-bold">{dims.w} × {dims.h} cm</span>
                      </p>
                    </div>
                  )}

                  {!dims && (
                    <div className="mb-4 space-y-3">
                      <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 font-medium">
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
                    <p className="text-xs text-amber-600 mt-2">Veuillez renseigner les dimensions de la dalle.</p>
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
              ) : (
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
              )}
            </div>
            ) : (
            <>
            <div className="flex border-b border-gray-200/40 mb-6">
              {canBuy && (
                <button
                  onClick={() => setPurchaseType('achat')}
                  className={`px-6 py-3 text-sm font-semibold border-b-2 transition-colors ${purchaseType === 'achat' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                >
                  {t('product.purchase')}
                </button>
              )}
              {canRent && (
                <button
                  onClick={() => setPurchaseType('location')}
                  className={`px-6 py-3 text-sm font-semibold border-b-2 transition-colors ${purchaseType === 'location' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                >
                  {t('product.rental')}
                </button>
              )}
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
                  <button onClick={() => setShowRentalContent(true)}
                    className="w-full bg-gray-900 hover:bg-gray-800 text-white py-3 px-6 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    <CalendarDays size={18} /> {t('product.rental')}
                  </button>
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
                        className="w-10 h-10 flex items-center justify-center bg-[#1a1f2e] rounded-l-lg border border-blue-500/30 border-r-0 text-slate-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Minus size={13} />
                      </button>
                      <input
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(Math.min(availableStock, Math.max(1, parseInt(e.target.value) || 1)))}
                        disabled={isOutOfStock}
                        className="w-12 h-10 text-center text-sm font-bold bg-[#1a1f2e] text-white border border-blue-500/30 focus:outline-none appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none disabled:opacity-40 disabled:cursor-not-allowed"
                      />
                      <button
                        onClick={() => setQuantity(Math.min(availableStock, quantity + 1))}
                        disabled={isOutOfStock || quantity >= availableStock}
                        className="w-10 h-10 flex items-center justify-center bg-[#1a1f2e] rounded-r-lg border border-blue-500/30 border-l-0 text-slate-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Plus size={13} />
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
