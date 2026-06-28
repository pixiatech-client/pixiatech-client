"use client";
import { GoogleGenAI } from "@google/genai";
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useToast } from '@/hooks/use-toast';
import {
  Activity, Cpu, Layers, Smartphone, Tv,
  Package, FileText, Search, Plus, ShoppingCart, Calendar,
  Monitor, Sun, Store, Eye, Grid, ChevronLeft, ChevronDown, ChevronUp,
  ChevronRight, Zap, Maximize, SunMedium, PlusCircle, Camera, Image as ImageIcon,
  Video, Play, Upload, Trash2, ArrowLeft, ArrowRight, Link as LinkIcon, Tag, ChevronsUpDown, AlertTriangle, TrendingUp,
  Settings2, Info, Save, Check, X, MoreVertical, Edit2, Copy, GripVertical, Filter, ArrowUpDown, Sparkles, Brain, Globe, ShieldCheck, Zap as ZapIcon, LogOut, LogIn, RefreshCw,
  Mail, Lock, Unlock, Phone, UserPlus, EyeOff, Users, Truck, Wrench, History, User as UserIcon, List, Settings, Hammer, Pin
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { normalizePrice } from '@/lib/pricing-engine';
import { useI18n } from '@/lib/i18n';
import { Pagination } from '@/components/ui/Pagination';
import { CustomSelect } from '@/components/ui/custom-select';
import useEmblaCarousel from 'embla-carousel-react';
import {
  auth, db, storage, googleProvider, signInWithPopup, signOut, onAuthStateChanged, User,
  signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, setPersistence, browserLocalPersistence, browserSessionPersistence,
  collection, doc, setDoc, getDoc, getDocs, deleteDoc, onSnapshot, query, where, orderBy, addDoc, updateDoc,
  ref, uploadBytes, getDownloadURL, deleteObject
} from './firebase';
import TipTapEditor from '@/components/TipTapEditor';

// --- Variant type ---
interface ProductVariant {
  name: string;
  description?: string;
  price: number;
  reference?: string;
  image: string;
  order: number;
  active: boolean;
}

// --- Helper to identify if a URL is a video ---
const isVideoUrl = (url: string | undefined | null): boolean => {
  if (!url) return false;
  if (url.startsWith('data:video/') || url.startsWith('blob:')) return true;
  const cleanUrl = url.split('?')[0];
  const isDirectVideo = /\.(mp4|webm|mov|ogg|ogv)/i.test(cleanUrl);
  const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');
  return isDirectVideo || isYouTube;
};

const getYouTubeId = (url: string | undefined | null): string | null => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

// --- Helper to safely get image URL (Prioritize pure images for thumbnails) ---
const getSafeImageUrl = (product: any) => {
  if (!product) return null;

  // 1. Check common pure image fields first
  const fields = ['image', 'imageUrl', 'photo', 'photoUrl'];
  for (const field of fields) {
    const val = product[field];
    if (typeof val === 'string' && val.startsWith('http') && !isVideoUrl(val)) return val;
    if (val && typeof val === 'object' && val.url && typeof val.url === 'string' && !isVideoUrl(val.url)) return val.url;
  }

  // 2. Fallback to 'videoUrl' if it's actually an image (legacy/compatibility)
  if (product.videoUrl && !isVideoUrl(product.videoUrl)) {
    return product.videoUrl;
  }

  // 3. Fallback to official media structure
  if (product.media && Array.isArray(product.media.images) && product.media.images.length > 0) {
    const img = product.media.images[0];
    if (typeof img === 'string') return img;
    if (img && typeof img === 'object' && img.url) return img.url;
  }

  return null;
};

// --- Sortable image component for gallery drag & drop ---
const GalleryImage = ({ url, onRemove, idx }: { url: string; onRemove: () => void; idx: number }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: url });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 'auto' as any,
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="relative w-[calc(33.333%-6px)] aspect-square rounded-xl overflow-hidden border border-slate-200 cursor-grab active:cursor-grabbing select-none touch-none">
      <img src={url} alt="" className="w-full h-full object-cover pointer-events-none" />
      <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors pointer-events-none" />
      <button onPointerDown={(e) => { e.stopPropagation(); }} onClick={(e) => { e.stopPropagation(); onRemove(); }} className="absolute top-1 right-1 p-2 bg-red-500 text-white rounded-xl opacity-90 hover:opacity-100 active:opacity-100 transition-opacity shadow-lg shadow-red-500/30 z-10">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

// --- VariantItem for drag-and-drop reordering ---
const VariantItem = ({ variant, updateVariant, removeVariant, handleImageUpload, t, isOnly }: {
  variant: { id: number; value: string; image: { file: File; url: string } | null };
  updateVariant: (id: number, field: string, value: any) => void;
  removeVariant: (id: number) => void;
  handleImageUpload: (id: number, e: React.ChangeEvent<HTMLInputElement>) => void;
  t: (key: string) => string;
  isOnly: boolean;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: String(variant.id) });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : 'auto' as any,
  };
  return (
    <div ref={setNodeRef} style={style} className={cn("flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100", isDragging && "shadow-lg ring-2 ring-slate-300")}>
      <button className="shrink-0 p-1 text-slate-400 hover:text-slate-600 cursor-grab active:cursor-grabbing touch-none" {...attributes} {...listeners}>
        <GripVertical className="w-4 h-4" />
      </button>
      <div className="flex-1">
        <input
          type="text"
          value={variant.value}
          onChange={(e) => updateVariant(variant.id, 'value', e.target.value)}
          placeholder={t('admin.productManagement.variantPlaceholder')}
          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
        />
      </div>
      <div className="shrink-0 relative group">
        <input type="file" id={`variant-image-${variant.id}`} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(variant.id, e)} />
        <label htmlFor={`variant-image-${variant.id}`} className={cn("flex items-center justify-center w-10 h-10 rounded-lg border border-dashed cursor-pointer transition-colors overflow-hidden", variant.image ? "border-slate-300 bg-slate-100" : "border-slate-300 hover:border-slate-400 hover:bg-slate-100 text-slate-400")} title={t('admin.productManagement.addImageIcon')}>
          {variant.image ? <img src={variant.image.url} alt="Variant" className="w-full h-full object-cover" /> : <Camera className="w-4 h-4" />}
        </label>
        {variant.image && (
          <button onClick={(e) => { e.preventDefault(); updateVariant(variant.id, 'image', null); }} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>
      <button onClick={() => removeVariant(variant.id)} disabled={isOnly} className="shrink-0 p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-slate-400">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
};

// --- Distance and Pitch columns for ProductListItem ---
function DistanceColumn({ product, t }: { product: any, t: (key: string) => string }) {
  const { distance } = getPrimaryDistanceInfo(product);
  return (
    <div className="hidden md:flex flex-col gap-1">
      <span className="text-[10px] font-bold text-slate-400 uppercase group-hover/product:text-white/60">{t('admin.productManagement.distance')}</span>
      <span className="text-sm font-medium text-slate-700 dark:text-zinc-300 group-hover/product:text-white">{distance}</span>
    </div>
  );
}

function PitchColumn({ product, t }: { product: any, t: (key: string) => string }) {
  const { pitches } = getPrimaryDistanceInfo(product);
  return (
    <div className="hidden md:flex flex-col gap-1">
      <span className="text-[10px] font-bold text-slate-400 uppercase group-hover/product:text-white/60">{t('admin.productManagement.pitch')}</span>
      {pitches.length > 0 ? (
        <PitchBadge pitches={pitches} t={t} />
      ) : (
        <span className="text-sm font-medium text-slate-700 dark:text-zinc-300 group-hover/product:text-white">—</span>
      )}
    </div>
  );
}

// --- Helper: extract primary distance and its pitches from product ---
function getPrimaryDistanceInfo(product: any): { distance: string, pitches: string[] } {
  const mapping = product.distancePitches || {};
  const keys = Object.keys(mapping).filter(k => (mapping[k] || []).length > 0);
  if (keys.length > 0) {
    return { distance: keys[0], pitches: mapping[keys[0]] || [] };
  }
  return { distance: product.distance || '—', pitches: product.pitch ? [product.pitch] : [] };
}

// --- Pitch Badge Dropdown on Product Cards ---
function PitchBadge({ pitches, t }: { pitches: string[], t: (key: string) => string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  const updatePosition = useCallback(() => {
    if (!open || !buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setDropdownStyle({
      position: 'fixed',
      left: rect.left + 'px',
      top: (rect.bottom + 4) + 'px',
      minWidth: '160px',
      zIndex: 9999,
    });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (ref.current && !ref.current.contains(target) && !(document.getElementById('pitch-portal')?.contains(target))) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (pitches.length === 0) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(!open)}
        className="bg-white px-3 py-1.5 rounded-xl text-[9px] font-black text-slate-900 border border-white/20 flex items-center gap-1.5 hover:bg-[#131E3F] hover:text-blue-400 transition-colors"
      >
        <Grid className="w-3 h-3" />
        <span>{pitches.length}</span>
        <ChevronDown className={cn("w-3 h-3 transition-transform", open && "rotate-180")} />
      </button>

      {createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              key="pitch-dropdown"
              initial={{ opacity: 0, y: 6, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              style={dropdownStyle}
              className="bg-[#0f172a] rounded-2xl border border-slate-800 shadow-2xl overflow-hidden"
            >
              <div className="p-3 space-y-1.5">
                {pitches.map((p) => (
                  <div key={p} className="text-[11px] font-bold text-white bg-white/10 px-3 py-2 rounded-xl">
                    {p}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}

// --- Mobile Product Card Component ---
// --- Optimized Mobile Product Card ---
const MobileProductCard = React.memo(({
  product,
  onEdit,
  onDuplicate,
  onDelete,
  isDeleting,
  setDeletingId,
  onOpenActions,
  isActive
}: any) => {
  const { t } = useI18n();
  const imageUrl = getSafeImageUrl(product);

  // Extract key chars for badges
  const pitchChar = product.selectedChars?.find((c: any) => c.name === 'Pixel pitch' || c.id === 'char-1');
  const distanceChar = product.selectedChars?.find((c: any) => c.name === 'Distance de visionnage' || c.id === 'char-0');

  return (
    <div className="w-full bg-transparent flex flex-col gap-6 relative transition-all duration-300">
      {/* Image Section - Only this part scales */}
      <motion.div
        onClick={() => onEdit(product)}
        animate={{
          scale: isActive ? 1 : 0.85,
          opacity: isActive ? 1 : 0.6
        }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        style={{ willChange: 'transform' }}
        className="relative aspect-square w-full rounded-xl overflow-hidden bg-slate-100/50 shadow-2xl shadow-slate-200/50 cursor-pointer group"
      >
        <AnimatePresence mode="wait">
          {isDeleting ? (
            <motion.div
              key="delete-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-red-600 z-20 flex flex-col items-center justify-center p-6 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-white font-black text-lg mb-1 leading-tight uppercase">{t('admin.productManagement.deleteConfirmTitle')}</h4>

              <div className="flex items-center gap-4 w-full mt-8">
                <button
                  onClick={(e) => { e.stopPropagation(); setDeletingId(null); }}
                  className="flex-1 py-4 text-[10px] font-black text-white bg-white/10 rounded-2xl uppercase tracking-widest active:bg-white/20"
                >
                  {t('admin.productManagement.no')}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log("Mobile Delete Triggered for", product.id);
                    onDelete(product.id);
                    setDeletingId(null);
                  }}
                  className="flex-1 py-4 text-[10px] font-black text-red-600 bg-white rounded-2xl shadow-xl uppercase tracking-widest active:scale-95 transition-transform"
                >
                  {t('admin.productManagement.yes')}
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="image-content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full"
            >
              {imageUrl ? (
                <img src={imageUrl} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-100">
                  <Package className="w-16 h-16 text-slate-300" />
                </div>
              )}

              {/* Tap to Edit Overlay for Mobile */}
              <div className="absolute inset-0 bg-black/20 opacity-0 group-active:opacity-100 transition-opacity flex items-center justify-center md:hidden">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center">
                  <Edit2 className="w-5 h-5 text-white" />
                </div>
              </div>

              {/* Badges Overlay */}
              <div className="absolute bottom-6 left-6 right-6 flex flex-wrap gap-2">
                {(() => {
                  const { distance, pitches } = getPrimaryDistanceInfo(product);
                  return (
                    <>
                      <div className="bg-[#c6ff00] px-3 py-1.5 rounded-xl text-[9px] font-black text-slate-900 shadow-lg border border-white/20">
                        <p className="opacity-50 uppercase leading-none mb-0.5">{t('admin.productManagement.distance')}</p>
                        <p className="leading-none">{distance}</p>
                      </div>
                      {pitches.length > 0 ? (
                        <PitchBadge pitches={pitches} t={t} />
                      ) : (
                        <div className="bg-[#c6ff00] px-3 py-1.5 rounded-lg text-[9px] font-black text-slate-900 shadow-lg border border-white/20">
                          <p className="opacity-50 uppercase leading-none mb-0.5">{t('admin.productManagement.pitch')}</p>
                          <p className="leading-none">—</p>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>

              {/* Media Icons */}
              <div className="absolute top-6 right-6 flex flex-col gap-3">
                {product.videoUrl && (
                  <button
                    onClick={(e) => { e.stopPropagation(); window.open(product.videoUrl, '_blank'); }}
                    className="w-10 h-10 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-slate-900 shadow-xl border border-white/20 active:scale-90 transition-all"
                  >
                    <Play className="w-5 h-5 fill-slate-900" />
                  </button>
                )}
                {product.pdfUrl && (
                  <button
                    onClick={(e) => { e.stopPropagation(); window.open(product.pdfUrl, '_blank'); }}
                    className="w-10 h-10 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-slate-900 shadow-xl border border-white/20 active:scale-90 transition-all"
                  >
                    <Info className="w-5 h-5" />
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Info Section */}
      <div className="space-y-4 px-2 text-center">
        <h3 className="text-xl font-black text-slate-900 uppercase leading-none tracking-tighter line-clamp-2 min-h-[2.5rem]">
          {product.name}
        </h3>

        <div className="flex flex-col items-center gap-2">
          <div className="flex flex-wrap justify-center gap-1.5">
            {/* Mode Badges */}
            {Array.from(new Set((Array.isArray(product.mode) ? product.mode : [product.mode]).filter(Boolean))).map((m: any, idx: number) => {
              const val = String(m).toLowerCase();
              let label = m;
              let colors = "bg-emerald-50 text-emerald-700 border-emerald-100";
              if (val.includes('vente') || val.includes('sale')) { label = 'Purchase'; colors = "bg-emerald-50 text-emerald-700 border-emerald-100"; }
              else if (val.includes('location') || val.includes('rental')) { label = 'Rental'; colors = "bg-violet-50 text-violet-700 border-violet-100"; }
              return (
                <div key={`mode-${idx}`} className={cn("px-3 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-widest", colors)}>
                  {label}
                </div>
              );
            })}

            {/* Badges */}
            {product.badges?.map((badge: string) => (
              <div key={badge} className={cn(
                "px-3 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-widest",
                badge === 'populaire' ? "bg-orange-50 text-orange-700 border-orange-100" :
                badge === 'nouveaute' ? "bg-blue-50 text-blue-700 border-blue-100" : "bg-red-50 text-red-700 border-red-100"
              )}>
                {badge === 'populaire' ? 'Populaire' : badge === 'nouveaute' ? 'Nouveauté' : 'Promotion'}
              </div>
            ))}
          </div>

          <div className="flex flex-wrap justify-center gap-1.5">
            {/* Environment Badges */}
            {Array.from(new Set((Array.isArray(product.type) ? product.type : [product.type]).filter(Boolean))).map((typeVal: any, idx: number) => {
              const val = String(typeVal).toLowerCase();
              let label = typeVal;
              let colors = "bg-slate-50 text-slate-500 border-slate-100";

              if (val.includes('interieur') || val.includes('indoor')) { label = t('admin.productManagement.indoor'); colors = "bg-purple-50 text-purple-700 border-purple-100"; }
              else if (val.includes('exterieur') || val.includes('outdoor')) { label = t('admin.productManagement.outdoor'); colors = "bg-orange-50 text-orange-700 border-orange-100"; }
              else if (val.includes('vitrine') || val.includes('showcase') || val.includes('semi')) { label = t('admin.productManagement.semiOutdoor'); colors = "bg-cyan-50 text-cyan-700 border-cyan-100"; }

              return (
                <div key={`type-${idx}`} className={cn("px-3 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-widest", colors)}>
                  {label}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-baseline gap-2 mt-2">
          {product.oldPrice && (
            <span className="text-sm font-semibold text-orange-500 line-through">
              {product.oldPrice} {'\u20AC'}
            </span>
          )}
          <span className="text-3xl font-black text-slate-900 tracking-tighter">
            {product.hasDimensions || product.dimensionsEnabled
              ? String(normalizePrice(product.pricePerTile || 0)) + ' \u20AC / ' + t('admin.productManagement.tile')
              : (product.salePricePerSqM || (product.price ? String(normalizePrice(product.price)) : '—')) + ' \u20AC'
            }
          </span>
        </div>
      </div>
    </div>
  );
});




const ProductActionsDrawer = ({ isOpen, onClose, product, onEdit, onDuplicate, onDelete, children, title }: any) => {
  const { t } = useI18n();
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] md:hidden"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 20, stiffness: 400 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.1}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100) onClose();
            }}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[3rem] z-[160] pb-12 md:hidden shadow-[0_-20px_50px_rgba(0,0,0,0.1)]"
          >
            {/* Drag Handle */}
            <div className="w-full flex justify-center py-4">
              <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
            </div>

            <div className="px-8 pt-2">
              {title && (
                <div className="mb-6">
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter leading-none">{title}</h3>
                  <div className="w-8 h-1 bg-[#c6ff00] mt-2" />
                </div>
              )}

              {children || (
                <div className="grid grid-cols-1 gap-3">
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => { onEdit(product); onClose(); }} className="w-full flex items-center gap-4 p-4 bg-slate-50 rounded-xl text-slate-900 active:bg-black active:text-white transition-all">
                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center"><Edit2 className="w-4 h-4" /></div>
                    <span className="font-black text-xs uppercase tracking-widest">{t('admin.productManagement.edit')}</span>
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => { onDuplicate(product); onClose(); }} className="w-full flex items-center gap-4 p-4 bg-slate-50 rounded-xl text-slate-900 active:bg-black active:text-white transition-all">
                    <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center"><Copy className="w-4 h-4" /></div>
                    <span className="font-black text-xs uppercase tracking-widest">{t('admin.productManagement.duplicate')}</span>
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => { onDelete(product.id); onClose(); }} className="w-full flex items-center gap-4 p-4 bg-red-50 rounded-xl text-red-600 active:bg-red-600 active:text-white transition-all">
                    <div className="w-8 h-8 bg-red-100 text-red-600 rounded-lg flex items-center justify-center"><Trash2 className="w-4 h-4" /></div>
                    <span className="font-black text-xs uppercase tracking-widest">{t('admin.productManagement.delete')}</span>
                  </motion.button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const ProductListItem = ({
  product,
  selectedIds,
  toggleSelect,
  onEditProduct,
  onDuplicateProduct,
  onDeleteProduct,
  setDeletingId,
  deletingId
}: any) => {
  const { t } = useI18n();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: product.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : 'auto' as any,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "bg-theme-card rounded-2xl p-4 flex items-center gap-4 shadow-sm transition-all group/product relative overflow-hidden",
        isDragging ? "shadow-2xl scale-[1.02] ring-1 ring-black/10" : "hover:bg-[#131E3F] dark:bg-theme-card/5 dark:border-theme-card-border",
        selectedIds.includes(product.id) ? "ring-1 ring-theme-sidebar-active-bg" : ""
      )}
    >
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleSelect(product.id);
          }}
          className={cn(
            "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
            selectedIds.includes(product.id)
              ? "bg-blue-600 border-blue-600 text-white"
              : "border-slate-200 hover:border-blue-400"
          )}
        >
          {selectedIds.includes(product.id) && <Check className="w-3 h-3" />}
        </button>
        <div
          className="text-slate-300 transition-colors cursor-grab active:cursor-grabbing p-1 touch-none"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-5 h-5" />
        </div>
      </div>

      <div className="w-16 h-16 rounded-xl overflow-hidden bg-white shrink-0 shadow-sm border border-slate-100 flex items-center justify-center relative transition-colors">
        {getSafeImageUrl(product) ? (
          <img
            src={getSafeImageUrl(product)!}
            alt={product.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        ) : isVideoUrl(product.videoUrl) ? (
          <Video className="w-6 h-6 text-slate-400" />
        ) : (
          <Package className="w-6 h-6 text-slate-300" />
        )}
        {isVideoUrl(product.videoUrl) && getSafeImageUrl(product) && (
          <div className="absolute bottom-1 right-1 bg-black/60 rounded-md p-0.5 backdrop-blur-sm">
            <Video className="w-3 h-3 text-white" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
        <div className="md:col-span-2">
          <h3 className="font-bold text-slate-900 dark:text-zinc-100 group-hover/product:text-white transition-colors truncate flex items-center gap-1.5">
            {product.name}
            {product.isHidden && (
              <span title={t('admin.productManagement.hiddenProduct')} className="text-orange-500 shrink-0">
                <EyeOff className="w-3.5 h-3.5 animate-pulse" />
              </span>
            )}
          </h3>
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            {/* Environment Badges */}
            {Array.from(new Set((Array.isArray(product.type) ? product.type : [product.type]).filter(Boolean))).map((typeVal: any, idx: number) => {
              const val = String(typeVal).toLowerCase();
              let label = typeVal;
              let colors = "bg-slate-100 text-slate-600";

              if (val.includes('interieur') || val.includes('indoor')) { label = t('admin.productManagement.indoor'); colors = "bg-purple-100 text-purple-700 border-purple-200"; }
              else if (val.includes('exterieur') || val.includes('outdoor')) { label = t('admin.productManagement.outdoor'); colors = "bg-orange-100 text-orange-700 border-orange-200"; }
              else if (val.includes('vitrine') || val.includes('showcase') || val.includes('semi')) { label = t('admin.productManagement.semiOutdoor'); colors = "bg-cyan-100 text-cyan-700 border-cyan-200"; }

              return (
                <span key={`type-${idx}`} className={cn("text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border transition-colors", colors)}>
                  {label}
                </span>
              );
            })}

            {/* Mode Badges */}
            {Array.from(new Set((Array.isArray(product.mode) ? product.mode : [product.mode]).filter(Boolean))).map((m: any, idx: number) => {
              const val = String(m).toLowerCase();
              let label = m;
              let colors = "bg-slate-100 text-slate-600";

              if (val.includes('vente') || val.includes('sale')) { label = t('admin.productManagement.sale'); colors = "bg-emerald-100 text-emerald-700 border-emerald-200"; }
              else if (val.includes('location') || val.includes('rental')) { label = t('admin.productManagement.rental'); colors = "bg-violet-100 text-violet-700 border-violet-200"; }

              return (
                <span key={`mode-${idx}`} className={cn("text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border transition-colors", colors)}>
                  {label}
                </span>
              );
            })}

            {/* Badges */}
            {product.badges?.map((badge: string) => (
              <span key={badge} className={cn(
                "text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border transition-colors",
                badge === 'populaire' ? "bg-orange-100 text-orange-700 border-orange-200" :
                badge === 'nouveaute' ? "bg-blue-100 text-blue-700 border-blue-200" : "bg-red-100 text-red-700 border-red-200"
              )}>
                {badge === 'populaire' ? 'Populaire' : badge === 'nouveaute' ? 'Nouveauté' : 'Promotion'}
              </span>
            ))}
          </div>
        </div>

        <DistanceColumn product={product} t={t} />
        <PitchColumn product={product} t={t} />

        <div className="hidden md:flex flex-col gap-1 items-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase group-hover/product:text-white/60">{t('admin.productManagement.salePerM2')}</span>
          <span className="text-sm font-bold text-slate-900 dark:text-zinc-100 group-hover/product:text-white transition-colors duration-300">
            {product.oldPrice && (
              <span className="text-xs font-semibold text-orange-500 line-through mr-1.5">{product.oldPrice} {'\u20AC'}</span>
            )}
            {product.hasDimensions || product.dimensionsEnabled
              ? String(normalizePrice(product.pricePerTile || 0)) + ' \u20AC / ' + t('admin.productManagement.tile')
              : (product.salePricePerSqM || (product.price ? String(normalizePrice(product.price)) : '—')) + ' \u20AC'
            }
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={(e) => { e.stopPropagation(); onEditProduct(product); }}
          className="p-2 text-slate-400 hover:text-[#a3e635] transition-colors"
          title={t('admin.productManagement.edit')}
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDuplicateProduct(product); }}
          className="p-2 text-blue-500 hover:text-blue-400 transition-colors"
          title={t('admin.productManagement.duplicate')}
        >
          <Copy className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); setDeletingId(product.id); }}
          className="p-2 text-slate-400 hover:text-red-500 transition-colors"
          title={t('admin.productManagement.delete')}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <AnimatePresence>
        {deletingId === product.id && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute inset-0 bg-red-600 rounded-2xl flex items-center justify-between px-6 z-10"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="text-white font-bold text-sm">{t('admin.productManagement.deleteConfirmHeading')}</h4>
                <p className="text-red-100 text-[10px] uppercase font-bold tracking-wider">{t('admin.productManagement.deleteConfirmSubtext')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 text-xs font-bold text-white hover:bg-white/10 rounded-xl transition-colors"
              >
                {t('admin.productManagement.cancel')}
              </button>
              <button
                onClick={() => {
                  onDeleteProduct(product.id);
                  setDeletingId(null);
                }}
                className="px-4 py-2 text-xs font-bold bg-white text-red-600 rounded-xl hover:bg-red-50 transition-all shadow-lg"
              >
                {t('admin.productManagement.delete')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

type AIProvider = 'gemini' | 'openai' | 'anthropic';

interface AISettings {
  enabled: boolean;
  provider: AIProvider;
  apiKey: string;
  model: string;
  maxTokens: number;
  pdfMaxSize: number; // in MB
  language: string;
  autoCreateCharacteristics: boolean;
}

const DEFAULT_AI_SETTINGS: AISettings = {
  enabled: true,
  provider: 'gemini',
  apiKey: process.env.GEMINI_API_KEY || '',
  model: 'gemini-3-flash-preview',
  maxTokens: 2048,
  pdfMaxSize: 10,
  language: 'fr',
  autoCreateCharacteristics: false,
};


// --- Custom NumberInput Component ---
const NumberInput = ({ value, onChange, placeholder, className, isDark, compact, colorTheme = 'default' }: { value: string, onChange: (val: string) => void, placeholder?: string, className?: string, isDark?: boolean, compact?: boolean, colorTheme?: 'default' | 'orange' | 'cyan' }) => {
  const handleIncrement = () => {
    const val = normalizePrice(value);
    onChange(String(val + 1));
  };
  const handleDecrement = () => {
    const val = normalizePrice(value);
    onChange(String(Math.max(0, val - 1)));
  };

  return (
    <div className="relative">
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "w-full rounded-xl font-bold focus:outline-none transition-colors appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
          isDark
            ? cn(
                "bg-[#1a1f2e] text-white",
                colorTheme === 'orange' ? "border border-orange-500/30 focus:border-orange-400 placeholder:text-orange-500/40" :
                colorTheme === 'cyan' ? "border border-cyan-500/30 focus:border-cyan-400 placeholder:text-cyan-500/40" :
                "border border-blue-500/30 focus:border-cyan-400"
              )
            : "bg-slate-50 border border-slate-200 text-slate-900 focus:ring-2 focus:ring-slate-900 focus:bg-white",
          compact ? "px-3 py-2 text-xs" : "px-4 py-3 text-sm",
          className
        )}
        placeholder={placeholder}
      />
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-0.5">
        <button onClick={handleIncrement} className={cn("transition-colors", isDark ? (colorTheme === 'orange' ? "text-orange-500/50 hover:text-orange-400" : colorTheme === 'cyan' ? "text-cyan-500/50 hover:text-cyan-400" : "text-slate-500 hover:text-slate-300") : "text-slate-400 hover:text-slate-600")}>
          <ChevronUp className={cn(compact ? "w-2.5 h-2.5" : "w-3 h-3")} />
        </button>
        <button onClick={handleDecrement} className={cn("transition-colors", isDark ? (colorTheme === 'orange' ? "text-orange-500/50 hover:text-orange-400" : colorTheme === 'cyan' ? "text-cyan-500/50 hover:text-cyan-400" : "text-slate-500 hover:text-slate-300") : "text-slate-400 hover:text-slate-600")}>
          <ChevronDown className={cn(compact ? "w-2.5 h-2.5" : "w-3 h-3")} />
        </button>
      </div>
    </div>
  );
};

// --- AI Settings Component ---
const AISettingsSheet = ({
  isOpen,
  onClose,
  settings,
  onSave
}: {
  isOpen: boolean,
  onClose: () => void,
  settings: AISettings,
  onSave: (s: AISettings) => void
}) => {
  const [localSettings, setLocalSettings] = useState<AISettings>(settings);
  const [models, setModels] = useState<string[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [showApiKey, setShowApiKey] = useState(false);
  const { t } = useI18n();

  useEffect(() => {
    if (isOpen) {
      setLocalSettings(settings);
      if (settings.apiKey) {
        fetchModels(settings.provider, settings.apiKey);
      }
    }
  }, [isOpen, settings]);

  const fetchModels = async (provider: AIProvider, apiKey: string) => {
    if (!apiKey) return;
    setIsLoadingModels(true);
    try {
      if (provider === 'openai') {
        const res = await fetch('https://api.openai.com/v1/models', {
          headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        if (res.ok) {
          const data = await res.json();
          setModels(data.data.map((m: any) => m.id).sort());
        }
      } else if (provider === 'gemini') {
        setModels(['gemini-3-flash-preview', 'gemini-3.1-pro-preview', 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.5-flash-preview-tts', 'gemini-2.5-flash-image'].sort());
      } else if (provider === 'anthropic') {
        setModels(['claude-3-5-sonnet-20240620', 'claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'].sort());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingModels(false);
    }
  };

  const handleProviderChange = (p: AIProvider) => {
    const newSettings = { ...localSettings, provider: p, model: '' };
    setLocalSettings(newSettings);
    fetchModels(p, localSettings.apiKey);
  };

  const handleTest = async () => {
    if (!localSettings.apiKey) {
      setTestStatus('error');
      setTimeout(() => setTestStatus('idle'), 3000);
      return;
    }
    setTestStatus('testing');
    try {
      if (localSettings.provider === 'gemini') {
        const ai = new GoogleGenAI({ apiKey: localSettings.apiKey });
        // Simple test call to verify key
        await ai.models.generateContent({
          model: localSettings.model || "gemini-3-flash-preview",
          contents: [{ parts: [{ text: "test" }] }],
          config: { maxOutputTokens: 1 }
        });
      } else {
        // For OpenAI/Anthropic, we try to fetch models as a test
        await fetchModels(localSettings.provider, localSettings.apiKey);
      }
      setTestStatus('success');
      setTimeout(() => setTestStatus('idle'), 3000);
    } catch (e) {
      setTestStatus('error');
      setTimeout(() => setTestStatus('idle'), 3000);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60]"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-[70] flex flex-col overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center shadow-lg shadow-slate-200">
                  <Brain className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{t('admin.productManagement.aiConfigTitle')}</h2>
                  <p className="text-xs text-slate-500">{t('admin.productManagement.aiConfigSubtitle')}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
              {/* Toggle On/Off */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-lg transition-colors", localSettings.enabled ? "bg-green-100 text-green-600" : "bg-slate-200 text-slate-500")}>
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">{t('admin.productManagement.enableAi')}</div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">{t('admin.productManagement.autoAnalysis')}</div>
                  </div>
                </div>
                <button
                  onClick={() => setLocalSettings(prev => ({ ...prev, enabled: !prev.enabled }))}
                  className={cn(
                    "w-12 h-6 rounded-full transition-all relative",
                    localSettings.enabled ? "bg-green-500" : "bg-slate-300"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm",
                    localSettings.enabled ? "right-1" : "left-1"
                  )} />
                </button>
              </div>

              <div className={cn("space-y-6 transition-opacity duration-300", !localSettings.enabled && "opacity-40 pointer-events-none grayscale")}>
                {/* Fournisseur */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    <Globe className="w-3 h-3" /> {t('admin.productManagement.provider')}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['gemini', 'openai', 'anthropic'] as AIProvider[]).map(p => (
                      <button
                        key={p}
                        onClick={() => handleProviderChange(p)}
                        className={cn(
                          "py-2.5 rounded-xl text-xs font-bold border transition-all capitalize",
                          localSettings.provider === p
                            ? "bg-slate-900 text-white border-slate-900 shadow-md"
                            : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                        )}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* API Key */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck className="w-3 h-3" /> {t('admin.productManagement.apiKey')}
                  </label>
                  <div className="relative">
                    <input
                      type={showApiKey ? "text" : "password"}
                      value={localSettings.apiKey}
                      onChange={e => setLocalSettings(prev => ({ ...prev, apiKey: e.target.value }))}
                      onBlur={() => fetchModels(localSettings.provider, localSettings.apiKey)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pr-12 text-sm font-medium focus:outline-none focus:border-slate-900 transition-colors"
                      placeholder={t('admin.productManagement.apiKeyPlaceholder', { provider: localSettings.provider })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showApiKey ? <Eye className="w-4 h-4" /> : <Eye className="w-4 h-4 opacity-40" />}
                    </button>
                  </div>
                </div>

                {/* Model */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    <ZapIcon className="w-3 h-3" /> {t('admin.productManagement.modelLabel')}
                  </label>
                  <div className="relative">
                    <CustomSelect
                      options={models.map(m => ({ value: m, label: m }))}
                      value={localSettings.model}
                      onChange={val => setLocalSettings(prev => ({ ...prev, model: val }))}
                      placeholder={t('admin.productManagement.selectModel')}
                      className="w-full"
                    />
                    {isLoadingModels && (
                      <div className="absolute right-12 top-1/2 -translate-y-1/2 pointer-events-none">
                        <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Advanced Settings */}
                <div className="pt-4 border-t border-slate-100 space-y-6">
                  <h3 className="text-sm font-bold text-slate-900">{t('admin.productManagement.advancedSettings')}</h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('admin.productManagement.maxTokens')}</label>
                      <input
                        type="number"
                        value={localSettings.maxTokens}
                        onChange={e => setLocalSettings(prev => ({ ...prev, maxTokens: parseInt(e.target.value) }))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('admin.productManagement.pdfSize')}</label>
                      <input
                        type="number"
                        value={localSettings.pdfMaxSize}
                        onChange={e => setLocalSettings(prev => ({ ...prev, pdfMaxSize: parseInt(e.target.value) }))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-purple-50 rounded-2xl border border-purple-100">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                        <PlusCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">{t('admin.productManagement.autoCreation')}</div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">{t('admin.productManagement.characteristicsToggle')}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => setLocalSettings(prev => ({ ...prev, autoCreateCharacteristics: !prev.autoCreateCharacteristics }))}
                      className={cn(
                        "w-12 h-6 rounded-full transition-all relative",
                        localSettings.autoCreateCharacteristics ? "bg-purple-500" : "bg-slate-300"
                      )}
                    >
                      <div className={cn(
                        "absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm",
                        localSettings.autoCreateCharacteristics ? "right-1" : "left-1"
                      )} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex gap-3">
              <button
                onClick={handleTest}
                disabled={!localSettings.enabled || !localSettings.apiKey || testStatus === 'testing'}
                className={cn(
                  "flex-1 py-3.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2",
                  testStatus === 'success' ? "bg-green-100 text-green-700" :
                    testStatus === 'error' ? "bg-red-100 text-red-700" :
                      "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                )}
              >
                {testStatus === 'testing' ? (
                  <div className="w-4 h-4 border-2 border-slate-400 border-t-slate-700 rounded-full animate-spin" />
                ) : testStatus === 'success' ? (
                  <Check className="w-4 h-4" />
                ) : testStatus === 'error' ? (
                  <X className="w-4 h-4" />
                ) : (
                  <Activity className="w-4 h-4" />
                )}
                {testStatus === 'testing' ? t('admin.productManagement.testing') : testStatus === 'success' ? t('admin.productManagement.connectionOk') : testStatus === 'error' ? t('admin.productManagement.errorLabel') : t('admin.productManagement.testAi')}
              </button>
              <button
                onClick={() => { onSave(localSettings); onClose(); }}
                className="flex-[2] bg-slate-900 text-white py-3.5 rounded-xl text-sm font-bold hover:bg-[#131E3F] hover:text-white transition-all shadow-lg shadow-slate-200 flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" /> {t('admin.productManagement.save')}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Minus icon missing from imports, recreated here
const Minus = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14" /></svg>
);

const ICON_LIBRARY = [
  { name: 'screen', icon: Monitor },
  { name: 'distance', icon: Eye },
  { name: 'puissance', icon: Zap },
  { name: 'brightness', icon: SunMedium },
  { name: 'pixel', icon: Grid },
  { name: 'resolution', icon: Maximize },
  { name: 'settings', icon: Settings2 },
  { name: 'activity', icon: Activity },
  { name: 'processeur', icon: Cpu },
  { name: 'couches', icon: Layers },
  { name: 'mobile', icon: Smartphone },
  { name: 'television', icon: Tv },
];

const getIcon = (iconName: string) => {
  return ICON_LIBRARY.find(i => i.name === iconName)?.icon || Settings2;
};

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 100 : -100,
    opacity: 0
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction > 0 ? -100 : 100,
    opacity: 0
  })
};

// --- Composant CaracteristiquesPage ---
const CaracteristiquesPage = ({
  onBack,
  characteristics,
  setCharacteristics,
  user,
  collectionName = "characteristics"
}: {
  onBack: () => void,
  characteristics: any[],
  setCharacteristics: React.Dispatch<React.SetStateAction<any[]>>,
  user: any
  collectionName?: string;
}) => {
  const { t } = useI18n();
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState<any>(Settings2);
  const [customIcon, setCustomIcon] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState('text-blue-400');
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [variants, setVariants] = useState([{ id: 1, value: '', image: null as { file: File, url: string } | null }]);
  const [isLocked, setIsLocked] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [charPage, setCharPage] = useState(1);
  const variantSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const [prevCharPage, setPrevCharPage] = useState(1);
  const [charSearch, setCharSearch] = useState('');
  const charItemsPerPage = 6;

  const filteredCharacteristics = React.useMemo(() => {
    if (!charSearch.trim()) return characteristics;
    return characteristics.filter(c => 
      c.name.toLowerCase().includes(charSearch.toLowerCase().trim()) ||
      c.options.some((opt: string) => opt.toLowerCase().includes(charSearch.toLowerCase().trim()))
    );
  }, [characteristics, charSearch]);

  const totalCharPages = Math.ceil(filteredCharacteristics.length / charItemsPerPage);
  const paginatedChars = filteredCharacteristics.slice((charPage - 1) * charItemsPerPage, charPage * charItemsPerPage);
  const charDirection = charPage >= prevCharPage ? 1 : -1;

  useEffect(() => {
    setCharPage(1);
  }, [charSearch]);

  const colors = [
    { name: 'Blue', class: 'text-blue-400', bg: 'bg-blue-400' },
    { name: 'Purple', class: 'text-purple-400', bg: 'bg-purple-400' },
    { name: 'Orange', class: 'text-orange-400', bg: 'bg-orange-400' },
    { name: 'Yellow', class: 'text-yellow-400', bg: 'bg-yellow-400' },
    { name: 'Red', class: 'text-red-400', bg: 'bg-red-400' },
    { name: 'Green', class: 'text-green-400', bg: 'bg-green-400' },
    { name: 'Cyan', class: 'text-cyan-400', bg: 'bg-cyan-400' },
    { name: 'Pink', class: 'text-pink-400', bg: 'bg-pink-400' },
  ];

  const handleEdit = (char: any) => {
    setName(char.name);
    setSelectedIcon(getIcon(char.iconName));
    setCustomIcon(char.customIcon || null);
    setSelectedColor(char.color || 'text-blue-400');
    if (char.variants && char.variants.length > 0) {
      setVariants(char.variants.map((v: any) => ({
        id: parseInt(v.id) || Math.random(),
        value: v.value,
        image: v.image || null
      })));
    } else {
      setVariants(char.options.map((opt: string, i: number) => ({ id: i + 1, value: opt, image: null })));
    }
    setIsLocked(char.locked || false);
    setIsPinned(char.isPinned || false);
    setEditingId(char.id);
    setIsSaved(false);
  };

  const handleDelete = async (id: string) => {
    const char = characteristics.find(c => c.id === id);
    if (char?.locked) {
      alert(t('admin.productManagement.characteristicLocked'));
      return;
    }
    if (char?.name === 'Distance de visionnage' || char?.name === 'Pixel pitch') {
      alert(t('admin.productManagement.characteristicLockedRequired'));
      return;
    }
    await deleteDoc(doc(db, collectionName, id));
    if (editingId === id) {
      handleReset();
    }
  };

  const handleCustomIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomIcon(reader.result as string);
        setSelectedIcon(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const addVariant = () => {
    setVariants([...variants, { id: Date.now(), value: '', image: null }]);
  };

  const updateVariant = (id: number, field: string, value: any) => {
    setVariants(variants.map(v => v.id === id ? { ...v, [field]: value } : v));
  };

  const removeVariant = (id: number) => {
    setVariants(variants.filter(v => v.id !== id));
  };

  const handleVariantDragEnd = (e: any) => {
    if (e.active && e.over && e.active.id !== e.over.id) {
      const oldIdx = variants.findIndex((v) => String(v.id) === e.active.id);
      const newIdx = variants.findIndex((v) => String(v.id) === e.over.id);
      if (oldIdx !== -1 && newIdx !== -1) {
        setVariants(arrayMove([...variants], oldIdx, newIdx));
      }
    }
  };

  const handleImageUpload = (id: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateVariant(id, 'image', { file, url: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!name.trim() || variants.every(v => !v.value.trim())) return;
    if (!user) {
      toast({
        title: t('admin.productManagement.loginRequiredToast'),
        description: t('admin.productManagement.loginRequiredDesc'),
        variant: "destructive"
      });
      return;
    }
    setIsSaving(true);

    try {
      const processedVariants = variants.map((v) => {
        return {
          id: v.id.toString(),
          value: v.value,
          image: v.image ? { url: v.image.url, name: v.value } : null
        };
      });

      const charData: any = {
        name,
        iconName: ICON_LIBRARY.find(i => i.icon === selectedIcon)?.name || 'settings',
        customIcon,
        color: selectedColor,
        border: (selectedColor || 'text-blue-400').replace('text-', 'focus:border-'),
        options: processedVariants.map(v => v.value).filter(v => v.trim() !== ''),
        variants: processedVariants.filter(v => v.value.trim() !== ''),
        locked: isLocked,
        isPinned: isPinned,
        uid: user?.uid || 'system'
      };

      console.log("Debug: Saving with user", user?.email, user?.uid);
      if (editingId) {
        await updateDoc(doc(db, collectionName, editingId), charData);
      } else {
        await addDoc(collection(db, collectionName), charData);
      }

      // --- WIZARD SYNC BRIDGE ---
      // Automatically update the official Wizard settings if these core specs change
      if (name === 'Pixel pitch' || name === 'Distance de visionnage') {
        try {
          const wizardRef = doc(db, "settings", "wizard");
          const wizardSnap = await getDoc(wizardRef);

          if (wizardSnap.exists()) {
            if (name === 'Pixel pitch') {
              const pixelPitches = processedVariants.map(v => ({
                id: v.id ? String(v.id) : Math.random().toString(36).substr(2, 9),
                value: v.value,
                recommended: (v as any).recommended || false
              }));
              await updateDoc(wizardRef, { pixelPitches });
              console.log("Wizard Sync: Pixel Pitches updated");
            } else if (name === 'Distance de visionnage') {
              const viewingDistances = processedVariants.map(v => ({
                id: v.id ? String(v.id) : Math.random().toString(36).substr(2, 9),
                value: v.value
              }));
              await updateDoc(wizardRef, { viewingDistances });
              console.log("Wizard Sync: Viewing Distances updated");
            }
          }
        } catch (syncError) {
          console.error("Wizard sync failed:", syncError);
          // Non-blocking for the local save, but logged
        }
      }
      // -------------------------

      setIsSaved(true);
    } catch (error) {
      console.error("Error saving characteristic", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSeedExamples = async () => {
    setIsSaving(true);

    const examples = [
      {
        id: 'char-luminosite',
        name: "Luminosité",
        iconName: "luminosité",
        color: "text-yellow-400",
        variants: [
          { id: "1", value: "800 nits", image: null },
          { id: "2", value: "1200 nits", image: null },
          { id: "3", value: "5000 nits", image: null }
        ],
        options: ["800 nits", "1200 nits", "5000 nits"],
        locked: false,
        uid: user.uid
      },
      {
        id: 'char-refresh',
        name: "Fréquence de rafraîchissement",
        iconName: "activité",
        color: "text-blue-400",
        variants: [
          { id: "1", value: "1920 Hz", image: null },
          { id: "2", value: "3840 Hz", image: null },
          { id: "3", value: "7680 Hz", image: null }
        ],
        options: ["1920 Hz", "3840 Hz", "7680 Hz"],
        locked: false,
        uid: user.uid
      },
      {
        id: 'char-protection',
        name: "Indice de protection",
        iconName: "couches",
        color: "text-green-400",
        variants: [
          { id: "1", value: "IP20", image: null },
          { id: "2", value: "IP65", image: null }
        ],
        options: ["IP20", "IP65"],
        locked: false,
        uid: user.uid
      },
      {
        id: 'char-resolution',
        name: "Résolution",
        iconName: "monitor",
        color: "text-purple-400",
        variants: [
          { id: "1", value: "1920x1080", image: null },
          { id: "2", value: "3840x2160", image: null }
        ],
        options: ["1920x1080", "3840x2160"],
        locked: false,
        uid: user.uid
      },
      {
        id: 'char-conso-max',
        name: "Consommation Max",
        iconName: "zap",
        color: "text-red-400",
        variants: [
          { id: "1", value: "600W/m²", image: null },
          { id: "2", value: "800W/m²", image: null }
        ],
        options: ["600W/m²", "800W/m²"],
        locked: false,
        uid: user.uid
      },
      {
        id: 'char-conso-moy',
        name: "Consommation Moyenne",
        iconName: "zap",
        color: "text-orange-400",
        variants: [
          { id: "1", value: "200W/m²", image: null },
          { id: "2", value: "300W/m²", image: null }
        ],
        options: ["200W/m²", "300W/m²"],
        locked: false,
        uid: user.uid
      }
    ];

    // Save to Firestore
    for (const ex of examples) {
      if (!characteristics.some(c => c.name === ex.name)) {
        try {
          const { id: exId, ...data } = ex;
          const finalId = exId || `char-${ex.name.replace(/\s+/g, '-').toLowerCase()}`;
          await setDoc(doc(db, collectionName, finalId), {
            ...data,
            border: ex.color.replace('text-', 'focus:border-'),
            uid: user?.uid || 'system'
          });
        } catch (e) {
          console.error("Seed failed for", ex.name, e);
        }
      }
    }

    setCharacteristics(prev => {
      let newList = [...prev];
      examples.forEach(ex => {
        if (!newList.some(c => c.name === ex.name)) {
          newList.push({
            ...ex,
            border: ex.color.replace('text-', 'focus:border-')
          });
        }
      });
      return newList;
    });

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
    setIsSaving(false);
  };

  const handleReset = () => {
    setName('');
    setSelectedIcon(Settings2);
    setCustomIcon(null);
    setSelectedColor('text-blue-400');
    setVariants([{ id: 1, value: '', image: null }]);
    setIsLocked(false);
    setIsSaved(false);
    setEditingId(null);
  };

  return (
    <div className="w-full pb-32 md:pb-0">
      <div className="bg-transparent md:bg-theme-card md:border md:border-theme-card-border md:rounded-[3rem] p-0 md:p-10 md:shadow-xl md:max-w-[1400px] mx-auto transition-all duration-500">
        <AnimatePresence>
          {showIconPicker && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowIconPicker(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white rounded-3xl p-6 w-full max-w-md relative z-10 shadow-2xl border border-slate-200"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-slate-900">{t('admin.productManagement.chooseIcon')}</h3>
                  <button onClick={() => setShowIconPicker(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <X className="w-5 h-5 text-slate-500" />
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  {ICON_LIBRARY.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.name}
                        onClick={() => {
                          setSelectedIcon(Icon);
                          setCustomIcon(null);
                          setShowIconPicker(false);
                        }}
                        className={cn(
                          "flex flex-col items-center gap-2 p-4 rounded-2xl transition-all border-2",
                          selectedIcon === Icon
                            ? "bg-blue-50 border-blue-500 text-blue-600"
                            : "bg-slate-50 border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-100"
                        )}
                      >
                        <Icon className="w-6 h-6" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">{item.name}</span>
                      </button>
                    );
                  })}
                  {/* Upload Custom Icon Option */}
                  <div className="col-span-4 mt-4 pt-4 border-t border-slate-100">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">{t('admin.productManagement.uploadCustomIcon')}</label>
                    <input
                      type="file"
                      id="custom-icon-upload"
                      className="hidden"
                      accept="image/*"
                      onChange={handleCustomIconUpload}
                    />
                    <label
                      htmlFor="custom-icon-upload"
                      className="flex items-center justify-center gap-2 w-full py-3 bg-slate-50 border border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-[#131E3F] hover:text-white transition-all text-sm font-bold text-slate-600 group"
                    >
                      <Upload className="w-4 h-4 group-hover:text-[#a3e635] transition-colors" /> {t('admin.productManagement.uploadIcon')}
                    </label>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left column: List of characteristics */}
          <div className="lg:col-span-5 flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Tag className="w-4 h-4 text-slate-500" /> {t('admin.productManagement.availableCharacteristics')} ({filteredCharacteristics.length})
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    setIsSaving(true);
                    const coreNames = ['Pixel pitch', 'Distance de visionnage', 'Puissance maximale'];
                    for (const name of coreNames) {
                      if (!characteristics.some(c => c.name === name)) {
                        const defaultChar = MOCK_CHARACTERISTICS.find(c => c.name === name);
                        if (defaultChar) {
                          const { id: charId, ...data } = defaultChar;
                          const finalId = charId || `char-${name.replace(/\s+/g, '-').toLowerCase()}`;

                          // Seed characteristic collection
                          await setDoc(doc(db, collectionName, finalId), {
                            ...data,
                            uid: user?.uid || 'system',
                            locked: true,
                            isPinned: true
                          });

                          // --- BRIDGE SYNC ON SEED ---
                          if (name === 'Pixel pitch' || name === 'Distance de visionnage') {
                            const wizardRef = doc(db, "settings", "wizard");
                            if (name === 'Pixel pitch') {
                              await updateDoc(wizardRef, {
                                pixelPitches: data.variants.map((v: any) => ({ ...v, id: String(v.id) }))
                              });
                            } else {
                              await updateDoc(wizardRef, {
                                viewingDistances: data.variants.map((v: any) => ({ ...v, id: String(v.id) }))
                              });
                            }
                          }
                        }
                      }
                    }
                    setIsSaving(false);
                    toast({ title: t('admin.productManagement.syncTitle'), description: t('admin.productManagement.syncDesc') });
                  }}
                  className="w-10 h-10 flex items-center justify-center bg-blue-50 text-blue-600 rounded-full hover:bg-[#131E3F] hover:text-white transition-all shadow-sm group mr-2"
                  title={t('admin.productManagement.restoreTitle')}
                >
                  <RefreshCw className="w-5 h-5 transition-colors group-hover:text-[#a3e635]" />
                </button>
                <button
                  onClick={() => {
                    setPrevCharPage(charPage);
                    setCharPage(prev => Math.max(prev - 1, 1));
                  }}
                  disabled={charPage === 1}
                  className="w-10 h-10 flex items-center justify-center bg-slate-100 text-slate-500 rounded-full hover:bg-[#131E3F] hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm group"
                >
                  <ChevronLeft className="w-5 h-5 transition-colors group-hover:text-[#0078ff]" />
                </button>
                <button
                  onClick={() => {
                    setPrevCharPage(charPage);
                    setCharPage(prev => Math.min(prev + 1, totalCharPages));
                  }}
                  disabled={charPage === totalCharPages || totalCharPages === 0}
                  className="w-10 h-10 flex items-center justify-center bg-slate-100 text-slate-500 rounded-full hover:bg-[#131E3F] hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm group"
                >
                  <ChevronRight className="w-5 h-5 transition-colors group-hover:text-[#0078ff]" />
                </button>
              </div>
            </div>

            {/* Search Input Bar */}
            <div className="relative">
              <input
                type="text"
                placeholder={t('admin.productManagement.searchCharacteristic')}
                value={charSearch}
                onChange={(e) => setCharSearch(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 text-sm border-2 border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white transition-all text-slate-800 placeholder:text-slate-400 font-bold"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              {charSearch && (
                <button
                  onClick={() => setCharSearch('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 active:scale-95 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="relative overflow-hidden min-h-[400px]">
              <AnimatePresence mode="popLayout" initial={false} custom={charDirection}>
                <motion.div
                  key={charPage}
                  custom={charDirection}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                  className="space-y-3"
                >
                  {paginatedChars.map(char => {
                    const Icon = getIcon(char.iconName);
                    return (
                      <div
                        key={char.id}
                        className={cn(
                          "bg-theme-card border rounded-2xl p-4 flex items-center justify-between shadow-sm transition-all cursor-pointer group relative overflow-hidden",
                          editingId === char.id
                            ? "border-theme-sidebar-active-bg ring-1 ring-theme-sidebar-active-bg"
                            : "border-theme-card-border hover:bg-[#131E3F] hover:border-[#131E3F]",
                          (char.locked || ['Pixel pitch', 'Distance de visionnage'].includes(char.name)) && !editingId && "bg-orange-50/50 border-orange-100"
                        )}
                        onClick={() => handleEdit(char)}
                      >
                        {char.locked && (
                          <div className="absolute top-0 right-0 p-1 bg-orange-500 text-white rounded-bl-xl z-10">
                            <Lock className="w-3 h-3" />
                          </div>
                        )}
                        <div className="flex items-center gap-4">
                          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center bg-slate-50 transition-colors group-hover:bg-white/10", char.color)}>
                            {char.customIcon ? (
                              <img src={char.customIcon} alt={char.name} className="w-6 h-6 object-contain" />
                            ) : (
                              Icon && <Icon className="w-5 h-5" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-slate-900 group-hover:text-white transition-colors">{char.name}</h3>
                              {char.locked && <Lock className="w-3 h-3 text-orange-500 group-hover:text-orange-400" />}
                            </div>
                            <p className="text-xs text-slate-500 group-hover:text-slate-400 transition-colors truncate max-w-[150px]">{char.options.join(', ')}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {!char.locked && !['Pixel pitch', 'Distance de visionnage'].includes(char.name) && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDelete(char.id); }}
                              className="p-2 text-slate-400 group-hover:text-white hover:!text-red-500 hover:bg-white/10 rounded-lg transition-colors"
                              title={t('admin.productManagement.delete')}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                          {(char.locked || ['Pixel pitch', 'Distance de visionnage'].includes(char.name)) && (
                            <div className="p-2 text-slate-300 group-hover:text-white/20 cursor-not-allowed" title={t('admin.productManagement.systemCharLocked')}>
                              <Trash2 className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Right column: Form */}
          <div className="lg:col-span-7 flex flex-col space-y-6">
            <div className="bg-transparent md:bg-theme-card border-none md:border border-theme-card-border rounded-2xl p-0 md:p-6 shadow-none md:shadow-sm relative overflow-hidden">
              <AnimatePresence>
                {isSaved && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute inset-0 bg-white/90 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-6 text-center"
                  >
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                      <Check className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">{t('admin.productManagement.characteristicSaved')}</h3>
                    <p className="text-slate-500 text-sm mb-8 max-w-sm">
                      {t('admin.productManagement.characteristicSavedDesc', { name })}
                    </p>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={handleReset}
                        className="px-6 h-10 bg-white border border-slate-200 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4" /> {t('admin.productManagement.createNew')}
                      </button>
                      <button
                        onClick={() => setIsSaved(false)}
                        className="px-6 h-10 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg flex items-center justify-center gap-2 group"
                      >
                        <Edit2 className="w-4 h-4 group-hover:text-[#a3e635] transition-colors" /> {t('admin.productManagement.continueEditing')}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <h3 className="text-sm font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-slate-500" />
                {editingId ? t('admin.productManagement.editCharacteristic') : t('admin.productManagement.createCharacteristic')}
              </h3>

              <div className="space-y-6">
                {/* Icon and Name */}
                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="shrink-0">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">{t('admin.productManagement.icon')}</label>
                    <button
                      onClick={() => setShowIconPicker(true)}
                      className={cn(
                        "w-16 h-16 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center hover:bg-slate-100 hover:border-slate-300 transition-all shadow-sm",
                        selectedColor
                      )}
                    >
                      {customIcon ? (
                        <img src={customIcon} alt="Custom Icon" className="w-8 h-8 object-contain" />
                      ) : (
                        selectedIcon && React.createElement(selectedIcon, { className: "w-8 h-8" })
                      )}
                    </button>
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">{t('admin.productManagement.characteristicName')}</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={editingId && ['Pixel pitch', 'Distance de visionnage'].includes(characteristics.find(c => c.id === editingId)?.name)}
                      placeholder={t('admin.productManagement.charNamePlaceholder')}
                      className={cn(
                        "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all",
                        editingId && ['Pixel pitch', 'Distance de visionnage'].includes(characteristics.find(c => c.id === editingId)?.name) && "opacity-60 cursor-not-allowed"
                      )}
                    />
                  </div>
                </div>

                {/* Additional Options: Locking & Pinning */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2 rounded-xl bg-white shadow-sm border border-slate-200", isLocked ? "text-orange-500" : "text-slate-400")}>
                        {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900">{t('admin.productManagement.lockToggle')}</div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider">{t('admin.productManagement.preventDeletion')}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsLocked(!isLocked)}
                      className={cn(
                        "w-10 h-5 rounded-full transition-all relative shrink-0",
                        isLocked ? "bg-orange-500" : "bg-slate-200"
                      )}
                    >
                      <div className={cn(
                        "absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all shadow-sm",
                        isLocked ? "left-[22px]" : "left-0.5"
                      )} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2 rounded-xl bg-white shadow-sm border border-slate-200", isPinned ? "text-[#a3e635]" : "text-slate-400")}>
                        <Pin className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900">{t('admin.productManagement.pinToggle')}</div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider">{t('admin.productManagement.addByDefault')}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsPinned(!isPinned)}
                      className={cn(
                        "w-10 h-5 rounded-full transition-all relative shrink-0",
                        isPinned ? "bg-[#a3e635]" : "bg-slate-200"
                      )}
                    >
                      <div className={cn(
                        "absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all shadow-sm",
                        isPinned ? "left-[22px]" : "left-0.5"
                      )} />
                    </button>
                  </div>
                </div>

                {/* Palette de couleurs */}
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3 block">{t('admin.productManagement.iconColor')}</label>
                  <div className="flex flex-wrap gap-3">
                    {colors.map((color) => (
                      <button
                        key={color.class}
                        onClick={() => setSelectedColor(color.class)}
                        className={cn(
                          "w-8 h-8 rounded-full transition-all border-2 flex items-center justify-center",
                          selectedColor === color.class ? "border-slate-900 scale-110" : "border-transparent hover:scale-105"
                        )}
                        title={color.name}
                      >
                        <div className={cn("w-5 h-5 rounded-full shadow-inner", color.bg)} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Variantes */}
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3 block">{t('admin.productManagement.charVariants')}</label>

                  <DndContext sensors={variantSensors} collisionDetection={closestCenter} onDragEnd={handleVariantDragEnd}>
                    <SortableContext items={variants.map(v => String(v.id))}>
                      <div className="space-y-3">
                        {variants.map((variant) => (
                          <VariantItem key={variant.id} variant={variant} updateVariant={updateVariant} removeVariant={removeVariant} handleImageUpload={handleImageUpload} t={t} isOnly={variants.length === 1} />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>

                  <button
                    onClick={addVariant}
                    className="mt-4 w-full h-10 bg-white border border-slate-200 border-dashed rounded-xl text-slate-600 font-black text-[10px] uppercase tracking-widest hover:border-slate-400 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> {t('admin.productManagement.addVariant')}
                  </button>
                </div>
              </div>

              {/* Desktop Action Buttons */}
              <div className="hidden md:flex mt-8 pt-6 border-t border-slate-100 items-center gap-3">
                <button
                  onClick={handleReset}
                  className="px-6 h-10 bg-white border border-transparent text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:text-slate-900 hover:border-slate-200 transition-all flex items-center gap-2"
                >
                  <PlusCircle className="w-4 h-4" /> {t('admin.productManagement.newLabel')}
                </button>
                <div className="flex-1" />
                <button
                  onClick={handleSave}
                  disabled={!name.trim() || variants.every(v => !v.value.trim()) || !user || isSaving}
                  className="bg-theme-sidebar-active-bg text-theme-sidebar-active-text px-8 h-10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-lg flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed min-w-[160px]"
                >
                  {isSaving ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 group-hover:text-[#a3e635] group-hover:drop-shadow-[0_0_8px_rgba(163,230,53,0.8)] transition-all" />
                  )}
                  <span>{isSaving ? t('admin.productManagement.saving') : (editingId ? t('admin.productManagement.update') : t('admin.productManagement.save'))}</span>
                </button>
              </div>

              {/* Mobile Action Buttons (Style FloatingFooterNav) */}
              <div className="md:hidden fixed bottom-0 left-0 right-0 z-[90] p-4 pointer-events-none">
                <div className="relative p-1.5 bg-black/20 backdrop-blur-md border border-white/50 rounded-[24px] shadow-2xl pointer-events-auto">
                  <div className="relative z-10 flex items-center gap-2 w-full">
                    <button
                      onClick={onBack}
                      className="w-12 h-12 rounded-[16px] bg-black text-white flex items-center justify-center transition-all hover:bg-[#c6ff00] hover:text-black shadow-lg shrink-0"
                    >
                      <ChevronLeft size={20} strokeWidth={3} />
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isSaving || !name.trim() || variants.every(v => !v.value.trim()) || !user}
                      className="flex-1 h-12 bg-theme-sidebar-active-bg text-theme-sidebar-active-text rounded-[18px] flex items-center px-6 transition-all group shadow-lg overflow-hidden relative disabled:opacity-50"
                    >
                      <span className="relative z-10 font-black uppercase tracking-[0.3em] text-[10px] ml-2">
                        {editingId ? t('admin.productManagement.save') : t('admin.productManagement.add')}
                      </span>
                      <div className="relative z-10 ml-auto w-8 h-8 rounded-[12px] bg-white/10 flex items-center justify-center">
                        {isSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={14} strokeWidth={3} className="text-current" />}
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface DistancePitchSelectorProps {
  availableDistances: string[];
  availablePitches: string[];
  distancePitches: Record<string, string[]>;
  setDistancePitches: (val: Record<string, string[]>) => void;
}

function DistancePitchSelector({
  availableDistances,
  availablePitches,
  distancePitches = {},
  setDistancePitches,
}: DistancePitchSelectorProps) {
  const { t } = useI18n();
  const [selectedDistance, setSelectedDistance] = useState<string>('');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Initialize selectedDistance to first mapped distance or first available
  useEffect(() => {
    const firstMapped = Object.keys(distancePitches || {}).find(
      (d) => (distancePitches[d] || []).length > 0
    );
    if (firstMapped && availableDistances.includes(firstMapped)) {
      if (selectedDistance !== firstMapped) {
        setSelectedDistance(firstMapped);
      }
    } else if (!selectedDistance && availableDistances.length > 0) {
      setSelectedDistance(availableDistances[0]);
    }
  }, [availableDistances, distancePitches, selectedDistance]);

  // Handle outside click to close the dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const currentPitches = selectedDistance ? (distancePitches[selectedDistance] || []) : [];

  const togglePitch = (pitch: string) => {
    if (!selectedDistance) return;
    const current = distancePitches[selectedDistance] || [];
    const updated = current.includes(pitch)
      ? current.filter((p) => p !== pitch)
      : [...current, pitch];
    setDistancePitches({
      ...distancePitches,
      [selectedDistance]: updated,
    });
  };

  if (availableDistances.length === 0 || availablePitches.length === 0) {
    return (
      <div className="bg-[#0f172a] text-white rounded-[2.5rem] p-6 shadow-xl border border-slate-800 mt-4">
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-2">
          {t('admin.productManagement.distancePixelMapping')}
        </span>
        <div className="text-xs text-orange-400 font-bold bg-orange-500/10 p-3 rounded-xl border border-orange-500/20">
          {t('admin.productManagement.noMappingConfig')}
        </div>
      </div>
    );
  }

  const buttonText = currentPitches.length > 0 ? currentPitches.join(', ') : t('admin.productManagement.selectLabel');

  return (
    <div className="pt-4 border-t border-slate-800/50 mt-4">
      <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1 block mb-3">
        {t('admin.productManagement.distancePixelMapping')}
      </span>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Distance de visionnage */}
        <div className="bg-[#0f172a] text-white rounded-2xl p-4 flex flex-col justify-between shadow-xl relative border border-slate-800">
          <div className="flex items-center gap-2 mb-2 pr-6">
            <div className="p-1.5 rounded-lg bg-white/5 text-blue-400">
              <Eye className="w-4 h-4" />
            </div>
            <span className="text-slate-300 text-[11px] font-bold uppercase tracking-tight">
              {t('admin.productManagement.distanceLabel')}
            </span>
          </div>
          <CustomSelect
            options={availableDistances.map((d) => ({ value: d, label: d }))}
            value={selectedDistance}
            onChange={(val) => setSelectedDistance(val)}
            isDark={true}
            className="w-full"
          />
        </div>

        {/* Card 2: Pixel Pitch (Multi-Select) */}
        <div className="bg-[#0f172a] text-white rounded-2xl p-4 flex flex-col justify-between shadow-xl relative border border-slate-800">
          <div className="flex items-center gap-2 mb-2 pr-6">
            <div className="p-1.5 rounded-lg bg-white/5 text-purple-400">
              <Grid className="w-4 h-4" />
            </div>
            <span className="text-slate-300 text-[11px] font-bold uppercase tracking-tight">
              {t('admin.productManagement.pitchLabel')}
            </span>
          </div>

          <div className="relative w-full" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className={cn(
                "w-full flex items-center justify-between px-4 py-2 rounded-xl border text-xs font-bold transition-all duration-200 outline-none",
                "bg-blue-950/50 border-blue-800 text-blue-400 hover:bg-blue-900/50 hover:border-blue-700"
              )}
            >
              <span className="truncate font-medium text-left">
                {buttonText}
              </span>
              <ChevronDown className={cn("w-4 h-4 ml-2 transition-transform duration-300", isOpen ? "rotate-180" : "")} />
            </button>

            {/* Desktop Dropdown */}
            <AnimatePresence>
              {isOpen && (
                <div className="hidden md:block">
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 5, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
                    className="absolute left-0 right-0 z-50 rounded-2xl border shadow-2xl overflow-hidden bg-zinc-900 border-blue-800/30"
                  >
                    <div className="p-1 max-h-[200px] overflow-y-auto custom-scrollbar">
                      {availablePitches.map((pitch) => {
                        const isChecked = currentPitches.includes(pitch);
                        return (
                          <button
                            key={pitch}
                            type="button"
                            onClick={() => togglePitch(pitch)}
                            className={cn(
                              "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all duration-150 active:scale-[0.97]",
                              isChecked
                                ? "bg-blue-900/30 text-blue-300 font-medium"
                                : "text-gray-400 hover:bg-blue-900/20 hover:text-blue-300"
                            )}
                          >
                            <span className="font-medium">{pitch}</span>
                            <div className={cn(
                              "w-4 h-4 rounded border flex items-center justify-center transition-all duration-150",
                              isChecked
                                ? "border-blue-500 bg-blue-500 text-white"
                                : "border-white/20 bg-white/5"
                            )}>
                              {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* Mobile Bottom Sheet */}
            <AnimatePresence>
              {isOpen && (
                <div className="md:hidden">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsOpen(false)}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                  />
                  <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="fixed left-0 right-0 bottom-0 z-[101] rounded-t-[32px] shadow-2xl flex flex-col max-h-[75vh] bg-[#141414] border-t border-white/5"
                  >
                    <div className="shrink-0 flex items-center justify-between px-6 pt-6 pb-4">
                      <div>
                        <h3 className="text-lg font-bold text-white">
                          {t('admin.productManagement.pitchLabel')}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">{t('admin.productManagement.selectForDistance', { distance: selectedDistance })}</p>
                      </div>
                      <button
                        onClick={() => setIsOpen(false)}
                        className="p-2 rounded-full transition-colors bg-white/5 hover:bg-white/10 text-gray-400"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <div
                      className="flex-1 overflow-y-auto overscroll-contain px-6 pb-10 space-y-2"
                      style={{ WebkitOverflowScrolling: 'touch' }}
                    >
                      {availablePitches.map((pitch) => {
                        const isChecked = currentPitches.includes(pitch);
                        return (
                          <button
                            key={pitch}
                            type="button"
                            onClick={() => togglePitch(pitch)}
                            className={cn(
                              "w-full flex items-center justify-between p-5 rounded-2xl text-left transition-all active:scale-[0.97]",
                              isChecked
                                ? "bg-white/10 ring-1 ring-white/20"
                                : "bg-white/5 hover:bg-white/10"
                            )}
                          >
                            <span className="text-base font-bold text-white">
                              {pitch}
                            </span>
                            <div className={cn(
                              "w-6 h-6 rounded-full flex items-center justify-center transition-all",
                              isChecked ? "bg-[#a3e635] text-black" : "bg-white/5 border border-white/20"
                            )}>
                              {isChecked && <Check className="w-4 h-4 stroke-[3]" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

const ProduitPage = ({
  editingProduct,
  setEditingProduct,
  productName,
  setProductName,
  mode,
  setMode,
  environment,
  setEnvironment,
  surface,
  setSurface,
  selectedChars,
  setSelectedChars,
  characteristics,
  setCharacteristics,
  prixVente,
  setPrixVente,
  prixLocationHeure,
  setPrixLocationHeure,
  prixLocationJour,
  setPrixLocationJour,
  surfaceMaxLocation,
  setSurfaceMaxLocation,
  surfaceMinRequise,
  setSurfaceMinRequise,
  dimensionsEnabled,
  setDimensionsEnabled,
  largeurDalle,
  setLargeurDalle,
  hauteurDalle,
  setHauteurDalle,
  prixDalle,
  setPrixDalle,
  mediaType,
  setMediaType,
  previewSrc,
  uploadedPhoto,
  setUploadedPhoto,
  photoUrl,
  setPhotoUrl,
  uploadedVideo,
  setUploadedVideo,
  videoUrl,
  setVideoUrl,
  currentMediaUrl,
  uploadedPdf,
  setUploadedPdf,
  pdfUrl,
  setPdfUrl,
  handleSaveProduct,
  setActivePage,
  user,
  isSaving,
  aiSettings,
  setAiSettings,
  handleFileChange,
  handleUrlChange,
  triggerUpload,
  handleGalleryUpload,
  removeGalleryImage,
  triggerGalleryUpload,
  galleryUrls,
  setGalleryUrls,
  galleryFileInputRef,
  handlePdfChange,
  triggerPdfUpload,
  handleSurfaceChange,
  adjustSurface,
  fileInputRef,
  pdfInputRef,
  showCharPanel,
  setShowCharPanel,
  tempSelectedChars,
  setTempSelectedChars,
  availableChars,
  setCharPanelSearch,
  handleAIAnalysis,
  isAnalyzing,
  analysisProgress,
  pdfError,
  setIsAISettingsOpen,
  screenType,
  setScreenType,
  badges,
  setBadges,
  description,
  setDescription,
  descriptionDetaillee,
  setDescriptionDetaillee,
  ficheTab,
  setFicheTab,
  activeSpace,
  variants,
  setVariants,
  oldPrice,
  setOldPrice,
  isHidden,
  setIsHidden,
  rentalStock,
  setRentalStock,
  stock,
  setStock,
  distancePitches = {},
  setDistancePitches,
  wizardSettings
}: any) => {
  const { t } = useI18n();
  const [specPage, setSpecPage] = useState(1);
  const [prevSpecPage, setPrevSpecPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [openVariantIdx, setOpenVariantIdx] = useState<number | null>(0);
  const specItemsPerPage = 6;

  // Use wizard settings as the authoritative source for distance/pitch options.
  // This prevents stale data from the characteristics collection options (which may have old seeded values)
  // from overriding the live options configured in the wizard settings.
  const distanceCharDef = (characteristics || []).find((c: any) => c.name === 'Distance de visionnage');
  const pitchCharDef = (characteristics || []).find((c: any) => c.name === 'Pixel pitch');
  const availableDistances = (wizardSettings?.viewingDistances?.length ?? 0) > 0
    ? wizardSettings.viewingDistances
    : (distanceCharDef?.options || []);
  const availablePitches = (wizardSettings?.pixelPitches?.length ?? 0) > 0
    ? wizardSettings.pixelPitches
    : (pitchCharDef?.options || []);

  const filteredSpecs = React.useMemo(() => {
    // Filter out core mapping characteristics from this generic grid
    const list = (selectedChars || []).filter((sc: any) => {
      const charDef = characteristics.find((c: any) => c.id === sc.id);
      if (!charDef) return false;
      return charDef.name !== 'Distance de visionnage' && charDef.name !== 'Pixel pitch';
    });
    if (!searchTerm.trim()) return list;
    return list.filter((sc: any) => {
      const charDef = characteristics.find((c: any) => c.id === sc.id);
      if (!charDef) return false;
      return charDef.name.toLowerCase().includes(searchTerm.toLowerCase().trim());
    });
  }, [selectedChars, searchTerm, characteristics]);

  const totalSpecPages = Math.ceil(filteredSpecs.length / specItemsPerPage);
  const paginatedSpecs = filteredSpecs.slice((specPage - 1) * specItemsPerPage, specPage * specItemsPerPage);
  const specDirection = specPage >= prevSpecPage ? 1 : -1;

  // Reset specPage if items are removed or filtered out
  useEffect(() => {
    if (specPage > 1 && (specPage - 1) * specItemsPerPage >= filteredSpecs.length) {
      setSpecPage(prev => Math.max(prev - 1, 1));
    }
  }, [filteredSpecs.length, specPage]);

  const [isPricingMediaOpen, setIsPricingMediaOpen] = useState(false);

  return (
    <div className="w-full pb-32 md:pb-0">
      <div className="bg-transparent md:bg-theme-card md:border md:border-theme-card-border md:rounded-[3rem] p-0 md:p-6 md:shadow-xl md:max-w-[1400px] mx-auto transition-all duration-500">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          {/* Left Column: Technical Specs & Core Settings */}
          <div className="lg:col-span-5 flex flex-col space-y-3 lg:border-r lg:border-slate-100 lg:pr-8">

            {/* 1. Nom du produit */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">{t('admin.productManagement.productName')}</label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder={t('admin.productManagement.productNamePlaceholder')}
                className="w-full border-2 border-slate-100 rounded-2xl px-5 py-3.5 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white transition-all"
              />
            </div>

            {/* Mobile Only: Premium Config Trigger */}
            <div className="md:hidden space-y-2">
              <button
                onClick={() => setIsPricingMediaOpen(true)}
                className="w-full py-6 bg-[#f8fafc] text-slate-900 rounded-[2.5rem] flex flex-col items-center justify-center gap-3 border-2 border-slate-200 shadow-sm active:scale-95 transition-all group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent opacity-50" />
                <div className="flex -space-x-3 relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-black shadow-xl flex items-center justify-center z-30 border border-white/10">
                    <Settings2 className="w-6 h-6 text-[#c6ff00]" />
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-slate-800 shadow-xl flex items-center justify-center z-20 border border-white/10 -rotate-12 translate-y-1">
                    <ShoppingCart className="w-5 h-5 text-white/50" />
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-slate-700 shadow-xl flex items-center justify-center z-10 border border-white/10 rotate-12 translate-y-1">
                    <ImageIcon className="w-5 h-5 text-white/30" />
                  </div>
                </div>
                <div className="relative z-10 text-center">
                  <span className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-900 block mb-0.5">{t('admin.productManagement.modeEnvironment')}</span>
                  <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{t('admin.productManagement.modeEnvironmentSub')}</div>
                </div>
              </button>
            </div>

            {/* Desktop Only: Mode de commercialisation */}
            <div className="hidden md:block space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">{t('admin.productManagement.salesMode')}</label>
              <div className="relative flex bg-slate-100/80 p-1 gap-2 rounded-2xl border border-slate-200 w-full overflow-hidden shadow-sm">
                <button
                  onClick={() => {
                    setMode((prev: string[]) =>
                      prev.includes('vente')
                        ? (prev.length > 1 ? prev.filter(m => m !== 'vente') : prev)
                        : [...prev, 'vente']
                    );
                  }}
                  className={cn(
                    "relative flex-1 flex items-center justify-center gap-1.5 px-3 h-10 text-[10px] md:text-xs font-bold transition-all z-20 uppercase tracking-widest",
                    mode.includes('vente') ? "text-white" : "text-slate-400 hover:text-slate-700"
                  )}
                >
                  {mode.includes('vente') && (
                    <motion.span
                      layoutId="mode-bubble-vente"
                      className="absolute inset-0 z-10 bg-[#18181B] rounded-xl shadow-lg border border-[#18181B]"
                      transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                    />
                  )}
                  <ShoppingCart className={cn("w-3.5 h-3.5 z-20 transition-colors", mode.includes('vente') ? "text-[#c6ff00]" : "text-slate-400")} />
                  <span className="z-20 whitespace-nowrap">{t('admin.productManagement.sale')}</span>
                </button>
                <button
                  onClick={() => {
                    setMode((prev: string[]) =>
                      prev.includes('location')
                        ? (prev.length > 1 ? prev.filter(m => m !== 'location') : prev)
                        : [...prev, 'location']
                    );
                  }}
                  className={cn(
                    "relative flex-1 flex items-center justify-center gap-1.5 px-3 h-10 text-[10px] md:text-xs font-bold transition-all z-20 uppercase tracking-widest",
                    mode.includes('location') ? "text-white" : "text-slate-400 hover:text-slate-700"
                  )}
                >
                  {mode.includes('location') && (
                    <motion.span
                      layoutId="mode-bubble-location"
                      className="absolute inset-0 z-10 bg-[#18181B] rounded-xl shadow-lg border border-[#18181B]"
                      transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                    />
                  )}
                  <Calendar className={cn("w-3.5 h-3.5 z-20 transition-colors", mode.includes('location') ? "text-[#4fc3f7]" : "text-slate-400")} />
                  <span className="z-20 whitespace-nowrap">{t('admin.productManagement.rental')}</span>
                </button>
              </div>
            </div>

            {/* Desktop Only: Screen type / Badges */}
            <div className="hidden md:block space-y-1.5">
              {activeSpace === 'configuration' ? (
                <>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">{t('admin.productManagement.screenType')}</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button onClick={() => setScreenType('flat')} className={cn("h-10 rounded-xl flex items-center justify-center gap-2 text-[11px] font-bold transition-all border", screenType === 'flat' ? "bg-[#18181B] text-white border-[#18181B] shadow-lg" : "bg-white text-slate-400 border-slate-200 hover:border-slate-300")}>
                      <Monitor className={cn("w-4 h-4", screenType === 'flat' ? "text-[#c6ff00]" : "text-slate-300")} />
                      <span>{t('admin.productManagement.flat')}</span>
                    </button>
                    <button onClick={() => setScreenType('curved')} className={cn("h-10 rounded-xl flex items-center justify-center gap-2 text-[11px] font-bold transition-all border", screenType === 'curved' ? "bg-[#18181B] text-white border-[#18181B] shadow-lg" : "bg-white text-slate-400 border-slate-200 hover:border-slate-300")}>
                      <svg className={cn("w-4 h-4", screenType === 'curved' ? "text-blue-400" : "text-slate-300")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 17C2 17 4 15 12 15C20 15 22 17 22 17V7C22 7 20 5 12 5C4 5 2 7 2 7V17Z" /><path d="M12 15V19M10 19H14" /></svg>
                      <span>{t('admin.productManagement.curved')}</span>
                    </button>
                    <button onClick={() => setScreenType('360')} className={cn("h-10 rounded-xl flex items-center justify-center gap-2 text-[11px] font-bold transition-all border", screenType === '360' ? "bg-[#18181B] text-white border-[#18181B] shadow-lg" : "bg-white text-slate-400 border-slate-200 hover:border-slate-300")}>
                      <svg className={cn("w-4 h-4", screenType === '360' ? "text-purple-400" : "text-slate-300")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5" /></svg>
                      <span>360{'\u00B0'}</span>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Badges</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'populaire', label: 'Populaires', icon: TrendingUp, activeColor: 'text-orange-400' },
                      { id: 'nouveaute', label: 'Nouveautés', icon: Sparkles, activeColor: 'text-blue-400' },
                      { id: 'promotion', label: 'Promotion', icon: Tag, activeColor: 'text-red-400' },
                    ].map((badge) => {
                      const isActive = badges.includes(badge.id);
                      return (
                        <button
                          key={badge.id}
                          onClick={() => setBadges((prev: string[]) => isActive ? prev.filter((b: string) => b !== badge.id) : [...prev, badge.id])}
                          className={cn("h-10 rounded-xl flex items-center justify-center gap-2 text-[11px] font-bold transition-all border", isActive ? "bg-[#18181B] text-white border-[#18181B] shadow-lg" : "bg-white text-slate-400 border-slate-200 hover:border-slate-300")}
                        >
                          <badge.icon className={cn("w-4 h-4", isActive ? badge.activeColor : "text-slate-300")} />
                          <span>{badge.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Desktop Only: Environnement */}
            <div className="hidden md:block space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">{t('admin.productManagement.environment')}</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'interieur', label: t('admin.productManagement.indoor'), icon: Monitor, color: 'text-blue-400' },
                  { id: 'semi-exterieur', label: t('admin.productManagement.semiOutdoor'), icon: Store, color: 'text-purple-400' },
                  { id: 'exterieur', label: t('admin.productManagement.outdoor'), icon: Sun, color: 'text-yellow-400' }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setEnvironment((prev: string[]) =>
                        prev.includes(item.id as any)
                          ? (prev.length > 1 ? prev.filter(e => e !== item.id) : prev)
                          : [...prev, item.id]
                      );
                    }}
                    className={cn(
                      "h-10 rounded-xl flex items-center justify-center gap-2 text-[11px] font-bold transition-all border",
                      environment.includes(item.id as any) ? "bg-[#18181B] text-white border-[#18181B] shadow-lg" : "bg-white text-slate-400 border-slate-200 hover:border-slate-300"
                    )}
                  >
                    <item.icon className={cn("w-4 h-4", environment.includes(item.id as any) ? item.color : "text-slate-300")} />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Distance → Pixel Pitch Mapping */}
            <DistancePitchSelector
              availableDistances={availableDistances}
              availablePitches={availablePitches}
              distancePitches={distancePitches || {}}
              setDistancePitches={setDistancePitches}
            />

            {/* Technical Specs Grid */}
            <div className="space-y-3 pt-4 border-t border-slate-100 mt-4">
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">{t('admin.productManagement.technicalSpecifications')}</label>
                {totalSpecPages > 1 && (
                  <div className="flex items-center gap-2">
                    <button onClick={() => { setPrevSpecPage(specPage); setSpecPage(prev => Math.max(prev - 1, 1)); }} disabled={specPage === 1} className="w-8 h-8 flex items-center justify-center bg-slate-100 text-slate-500 rounded-full hover:bg-[#131E3F] hover:text-white disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
                    <button onClick={() => { setPrevSpecPage(specPage); setSpecPage(prev => Math.min(prev + 1, totalSpecPages)); }} disabled={specPage === totalSpecPages} className="w-8 h-8 flex items-center justify-center bg-slate-100 text-slate-500 rounded-full hover:bg-[#131E3F] hover:text-white disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
                  </div>
                )}
              </div>

              <div className="relative mb-2">
                <input
                  type="text"
                  placeholder={t('admin.productManagement.searchSpecification')}
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setSpecPage(1);
                  }}
                  className="w-full pl-9 pr-8 py-2 text-xs font-bold border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white transition-all text-slate-800 placeholder:text-slate-400"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="relative min-h-[200px]">
                <AnimatePresence mode="popLayout" initial={false} custom={specDirection}>
                  <motion.div
                    key={specPage}
                    custom={specDirection}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  >
                    {paginatedSpecs.map((sc: any) => {
                      const charDef = characteristics.find((c: any) => c.id === sc.id);
                      if (!charDef) return null;
                      const Icon = getIcon(charDef.iconName);
                      return (
                        <div key={sc.id} className="bg-[#0f172a] text-white rounded-2xl p-4 flex flex-col justify-between shadow-xl relative group border border-slate-800">
                          <div className="absolute top-1.5 right-1.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                            <button onClick={(e) => { e.stopPropagation(); setCharacteristics(characteristics.map((c: any) => c.id === sc.id ? { ...c, isPinned: !c.isPinned } : c)); }} className={cn("p-1.5 rounded-lg transition-colors", charDef.isPinned ? "text-[#a3e635] bg-[#a3e635]/10" : "text-slate-500 hover:text-[#a3e635]")}>
                              <Pin className="w-4 h-4" />
                            </button>
                            {!['Distance de visionnage', 'Pixel pitch'].includes(charDef.name) && (
                              <button onClick={() => setSelectedChars((prev: any[]) => prev.filter(c => c.id !== sc.id))} className="p-1 text-slate-500 hover:text-red-500 rounded-lg"><X className="w-4 h-4" /></button>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mb-2 pr-6 cursor-pointer active:opacity-60 transition-opacity" onClick={() => {
                            // If we want to open the select, we would need a way to trigger CustomSelect.
                            // Since CustomSelect doesn't expose a ref, we'll just make the area look interactive.
                            // Most users will naturally click the select box below if the header feels like part of it.
                          }}>
                            <div className={cn("p-1.5 rounded-lg bg-white/5", charDef.color)}>
                              {charDef.customIcon ? (
                                <img src={charDef.customIcon} alt={charDef.name} className="w-4 h-4 object-contain" />
                              ) : (
                                <Icon className="w-4 h-4" />
                              )}
                            </div>
                            <span className="text-slate-300 text-[11px] font-bold uppercase tracking-tight">{charDef.name}</span>
                          </div>
                          <CustomSelect
                            options={charDef.options.map((opt: string) => ({ value: opt, label: opt }))}
                            value={sc.value}
                            onChange={(val) => setSelectedChars((prev: any[]) => prev.map(c => c.id === sc.id ? { ...c, value: val } : c))}
                            isDark={true}
                            className="w-full"
                          />
                        </div>
                      );
                    })}
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="relative mt-3">
                <button
                  onClick={() => { setTempSelectedChars([]); setCharPanelSearch(''); setShowCharPanel(true); }}
                  className="w-full h-10 bg-white hover:bg-slate-50 text-slate-600 rounded-xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest transition-all border border-slate-200 border-dashed hover:border-slate-400"
                >
                  <PlusCircle className="w-4 h-4 text-[#a3e635]" />
                  <span>{t('admin.productManagement.addCharacteristic')}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Middle Column: Tarification */}
          <div className="lg:col-span-3 flex flex-col space-y-6">
            <div className="bg-[#0f172a] md:border-2 md:border-cyan-400/30 rounded-[2.5rem] p-8 md:shadow-[0_15px_40px_rgba(0,0,0,0.3),0_0_20px_rgba(34,211,238,0.1)] relative overflow-hidden h-full flex flex-col">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Tag className="w-24 h-24 text-white transform -rotate-12" />
              </div>

              <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-cyan-400/10 rounded-xl flex items-center justify-center border border-cyan-400/20">
                    <Tag className="w-5 h-5 text-cyan-400 transform -rotate-90" />
                  </div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tight">{t('admin.productManagement.pricing')}</h3>
                </div>

                <div className="space-y-4 flex-1">

                  {/* Prix de Vente (Teal Box like screenshot) */}
                  <div className="bg-cyan-950/40 p-4 rounded-2xl border border-cyan-500/20 relative group overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/5 to-transparent pointer-events-none" />
                    <label className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-1.5 block">{t('admin.productManagement.sellingPrice')}</label>
                    <NumberInput
                      value={prixVente}
                      onChange={setPrixVente}
                      placeholder={t('admin.productManagement.sellingPricePlaceholder')}
                      isDark
                    />
                    <div className="text-[9px] text-cyan-400/40 mt-1 font-medium italic tracking-tight">{t('admin.productManagement.sellingPriceHelp')}</div>
                  </div>

                  {/* Ancien Prix de Vente (Optionnel) */}
                  <div className="bg-orange-500/10 p-4 rounded-2xl border border-orange-500/40 relative group overflow-hidden shadow-[0_0_20px_rgba(249,115,22,0.08)] ring-1 ring-orange-500/20">
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-500/50 to-transparent" />
                    <label className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-1.5 block flex items-center gap-2">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-orange-400 shadow-[0_0_6px_rgba(249,115,22,0.8)]" />
                      {t('admin.productManagement.oldSellingPrice')}
                    </label>
                    <NumberInput
                      value={oldPrice}
                      onChange={setOldPrice}
                      placeholder={t('admin.productManagement.oldSellingPricePlaceholder')}
                      isDark
                      colorTheme="orange"
                    />
                    <div className="text-[9px] text-orange-400 mt-1 font-medium italic tracking-tight">{t('admin.productManagement.oldSellingPriceHelp')}</div>
                  </div>

                  {Array.isArray(mode) && mode.includes('vente') && (
                    <div className="bg-white/[0.03] p-4 rounded-2xl border border-white/[0.06] relative group overflow-hidden shadow-sm">
                      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                      <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5 block flex items-center gap-2">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-400" />
                        {t('admin.productManagement.stock')}
                      </label>
                      <NumberInput
                        value={stock}
                        onChange={(val) => setStock(String(val ?? ''))}
                        placeholder="Ex : 250"
                        isDark
                      />
                    </div>
                  )}

                  {Array.isArray(mode) && mode.includes('location') && (
                    <div className="bg-white/[0.03] p-4 rounded-2xl border border-white/[0.06] relative group overflow-hidden shadow-sm">
                      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                      <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5 block flex items-center gap-2">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-400" />
                        {t('admin.productManagement.availableQuantity')}
                      </label>
                      <NumberInput
                        value={rentalStock}
                        onChange={(val) => setRentalStock(String(val ?? ''))}
                        placeholder={t('admin.productManagement.availableQuantityPlaceholder')}
                        isDark
                      />
                    </div>
                  )}

                  {/* Masquer le produit (Visibility Toggle) */}
                  <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800 flex items-center justify-between shadow-[0_0_15px_rgba(0,0,0,0.15)]">
                    <div className="pr-4">
                      <div className="text-xs font-black text-white uppercase tracking-tight flex items-center gap-1.5">
                        <EyeOff className="w-4 h-4 text-orange-400" />
                        {t('admin.productManagement.hideProduct')}
                      </div>
                      <div className="text-[9px] text-slate-400 mt-1 leading-tight">
                        {t('admin.productManagement.hideProductHelp')}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsHidden(!isHidden)}
                      className={cn("w-12 h-6 rounded-full relative transition-all duration-300 shrink-0", isHidden ? "bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.4)]" : "bg-slate-700")}
                    >
                      <div className={cn("absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-sm", isHidden ? "left-[28px]" : "left-1")} />
                    </button>
                  </div>

                  {/* Surface Minimum */}
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">{t('admin.productManagement.minimumArea')}</label>
                    <NumberInput
                      value={surfaceMinRequise || surface.toString()}
                      onChange={(val) => { setSurfaceMinRequise(val); setSurface(parseFloat(val) || 0); }}
                      isDark
                    />
                    <p className="text-[9px] text-slate-500 mt-1 px-1 leading-relaxed">{t('admin.productManagement.minimumAreaHelp')}</p>
                  </div>

                  <div className="h-px bg-slate-800/50 my-0.5" />

                  {/* Dalles Management */}
                  <div className="space-y-3">
                    <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-700/50">
                      <div className="flex justify-between items-center mb-4">
                        <div className="pr-4">
                          <div className="text-xs font-black text-white uppercase tracking-tight">{t('admin.productManagement.tileDimensions')}</div>
                          <div className="text-[9px] text-slate-500 mt-1 leading-tight">{t('admin.productManagement.tileDimensionsHelp')}</div>
                        </div>
                        <button
                          onClick={() => setDimensionsEnabled(!dimensionsEnabled)}
                          className={cn("w-12 h-6 rounded-full relative transition-all duration-300 shrink-0", dimensionsEnabled ? "bg-[#c6ff00]" : "bg-slate-700")}
                        >
                          <div className={cn("absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-sm", dimensionsEnabled ? "left-[28px]" : "left-1")} />
                        </button>
                      </div>

                      {dimensionsEnabled && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4 pt-2 overflow-hidden">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{t('admin.productManagement.tileWidth')}</label>
                              <NumberInput value={largeurDalle} onChange={setLargeurDalle} isDark compact />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{t('admin.productManagement.tileHeight')}</label>
                              <NumberInput value={hauteurDalle} onChange={setHauteurDalle} isDark compact />
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{t('admin.productManagement.pricePerTile')}</label>
                            <NumberInput value={prixDalle} onChange={setPrixDalle} isDark compact />
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>

                  {/* Prices grid (Visible only if location mode) */}
                  {mode.includes('location') && (
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800/50">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">{t('admin.productManagement.pricePerHour')}</label>
                        <NumberInput value={prixLocationHeure} onChange={setPrixLocationHeure} placeholder={t('admin.productManagement.pricePerHourPlaceholder')} isDark compact />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">{t('admin.productManagement.pricePerDay')}</label>
                        <NumberInput value={prixLocationJour} onChange={setPrixLocationJour} placeholder={t('admin.productManagement.pricePerDayPlaceholder')} isDark compact />
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Media & Actions */}
          <div className="lg:col-span-4 flex flex-col space-y-3">

            {/* Media Preview Box */}
            <div className="space-y-2">
              <div
                className="w-full h-72 bg-slate-50 rounded-[2.5rem] overflow-hidden relative shadow-inner border-2 border-slate-100 group"
              >
                {mediaType === 'photo' ? (
                  <div className="w-full h-full cursor-pointer" onClick={triggerUpload}>
                    <img src={previewSrc} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="px-6 py-3 bg-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl">{t('admin.productManagement.replacePhoto')}</div>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full bg-slate-900 flex items-center justify-center relative">
                    {getYouTubeId(previewSrc) ? (
                      <iframe
                        className="w-full h-full"
                        src={`https://www.youtube.com/embed/${getYouTubeId(previewSrc)}`}
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    ) : (previewSrc && isVideoUrl(previewSrc)) ? (
                      <video
                        key={previewSrc}
                        src={previewSrc}
                        controls
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <Video className="w-16 h-16 text-white/20" />
                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{t('admin.productManagement.noVideo')}</p>
                      </div>
                    )}

                    {/* Floating Replace Button for Video (so it doesn't block controls) */}
                    <button
                      onClick={triggerUpload}
                      className="absolute top-4 right-4 p-3 bg-white/90 backdrop-blur-md text-slate-900 rounded-xl shadow-xl border border-white/20 opacity-0 group-hover:opacity-100 transition-all active:scale-95 flex items-center gap-2 z-30"
                    >
                      <RefreshCw className="w-4 h-4 text-blue-500" />
                      <span className="text-[10px] font-black uppercase tracking-widest">{t('admin.productManagement.replaceVideo')}</span>
                    </button>
                  </div>
                )}
                <div className="absolute top-4 left-4 px-4 py-2 bg-black/60 backdrop-blur-md text-white rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10 z-20 pointer-events-none">{t('admin.productManagement.mediaPreview')}</div>
              </div>

              {/* Media Settings Card */}
              <div className="bg-transparent md:bg-white border-none md:border-2 border-slate-100 rounded-[2rem] p-0 md:p-4 space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">{t('admin.productManagement.mediaType')}</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => setMediaType('photo')} className={cn("h-10 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all border", mediaType === 'photo' ? "bg-black text-white border-black" : "bg-slate-50 text-slate-500 border-slate-200")}>
                      <Camera className={cn("w-4 h-4", mediaType === 'photo' ? "text-cyan-400" : "")} /> {t('admin.productManagement.photo')}
                    </button>
                    <button onClick={() => setMediaType('video')} className={cn("h-10 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all border", mediaType === 'video' ? "bg-black text-white border-black" : "bg-slate-50 text-slate-500 border-slate-200")}>
                      <Video className={cn("w-4 h-4", mediaType === 'video' ? "text-blue-400" : "")} /> {t('admin.productManagement.video')}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">{t('admin.productManagement.mediaLink')}</label>
                  <div className="flex gap-2">
                    <input type="text" value={currentMediaUrl} onChange={handleUrlChange} placeholder="data:image/..." className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900" />
                    <button onClick={triggerUpload} className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 shadow-sm active:scale-95 transition-all"><Upload className="w-4 h-4" /></button>
                    <button onClick={() => { if (mediaType === 'photo') { setPhotoUrl(''); setUploadedPhoto(null); } else { setVideoUrl(''); setUploadedVideo(null); } }} className="p-3 bg-red-50 text-red-600 rounded-xl border border-red-100 shadow-sm active:scale-95 transition-all"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            </div>

            {/* Galerie photos (Boutique only) */}
            {activeSpace === 'boutique' && (
              <div className="bg-transparent md:bg-white border-none md:border-2 border-slate-100 rounded-[2rem] p-0 md:p-4 space-y-3 shadow-none md:shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100">
                      <ImageIcon className="w-5 h-5 text-slate-400" />
                    </div>
                    <div className="flex flex-col">
                      <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">Galerie photos</h4>
                      <span className="text-[9px] text-slate-400 font-medium">Photos suppl\u00E9mentaires</span>
                    </div>
                  </div>
                </div>
                <input type="file" ref={galleryFileInputRef} onChange={handleGalleryUpload} className="hidden" accept="image/*" multiple />
                <DndContext collisionDetection={closestCenter} onDragEnd={(e) => { if (e.active && e.over && e.active.id !== e.over.id) { setGalleryUrls((items) => { const oldIdx = items.indexOf(String(e.active.id)); const newIdx = items.indexOf(String(e.over.id)); return arrayMove(items, oldIdx, newIdx); }); } }}>
                  <SortableContext items={galleryUrls}>
                    <div className="flex flex-wrap gap-2">
                      {galleryUrls.map((url, idx) => (
                        <GalleryImage key={url} url={url} idx={idx} onRemove={() => removeGalleryImage(idx)} />
                      ))}
                      <button onClick={triggerGalleryUpload} className="w-[calc(33.333%-6px)] aspect-square rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-1 hover:border-slate-400 transition-colors">
                        <Plus className="w-5 h-5 text-slate-300" />
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Ajouter</span>
                      </button>
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            )}

            {/* Variantes simples */}
            {activeSpace === 'boutique' && (
              <div className="bg-transparent md:bg-white border-none md:border-2 border-slate-100 rounded-[2rem] p-0 md:p-4 space-y-3 shadow-none md:shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100">
                    <Tag className="w-5 h-5 text-slate-400" />
                  </div>
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">Variantes</h4>
                </div>
                {variants.length > 0 && (
                  <div className="space-y-2">
                    {variants.map((v, i) => {
                      const isOpen = openVariantIdx === i;
                      return (
                        <div key={i} className="bg-slate-50 rounded-xl border border-slate-100 overflow-hidden">
                          <button onClick={() => setOpenVariantIdx(isOpen ? null : i)} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-100/50 transition-colors">
                            <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-200 bg-white flex-shrink-0">
                              {v.image ? (
                                <img src={v.image} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                  <ImageIcon className="w-4 h-4" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 text-left min-w-0">
                              <div className="text-xs font-bold text-slate-800 truncate">{v.name || '(sans nom)'}</div>
                              {v.price > 0 && <div className="text-[10px] font-semibold text-slate-400">{v.price.toFixed(2)} €</div>}
                            </div>
                            {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />}
                          </button>
                          {isOpen && (
                            <div className="px-3 pb-3 space-y-2 border-t border-slate-100 pt-2">
                              <div className="grid grid-cols-[1fr_80px] gap-2 items-end">
                                <div>
                                  <label className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Nom du bouton</label>
                                  <input value={v.name} onChange={(e) => { const n = [...variants]; n[i] = { ...n[i], name: e.target.value }; setVariants(n); }} placeholder="ex: L, XL, XXL" className="w-full h-8 bg-white border border-slate-200 rounded-lg px-2 text-xs font-semibold outline-none focus:border-slate-400" />
                                </div>
                                <div>
                                  <label className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Prix (€)</label>
                                  <input type="number" value={v.price || ''} onChange={(e) => { const n = [...variants]; n[i] = { ...n[i], price: Number(e.target.value) }; setVariants(n); }} className="w-full h-8 bg-white border border-slate-200 rounded-lg px-2 text-xs font-semibold outline-none focus:border-slate-400" />
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Valeur affichée</label>
                                  <input value={v.description || ''} onChange={(e) => { const n = [...variants]; n[i] = { ...n[i], description: e.target.value }; setVariants(n); }} placeholder="ex: 80x100 cm" className="w-full h-8 bg-white border border-slate-200 rounded-lg px-2 text-xs font-semibold outline-none focus:border-slate-400" />
                                </div>
                                <div>
                                  <label className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Référence</label>
                                  <input value={v.reference || ''} onChange={(e) => { const n = [...variants]; n[i] = { ...n[i], reference: e.target.value }; setVariants(n); }} placeholder="ex: REF-L" className="w-full h-8 bg-white border border-slate-200 rounded-lg px-2 text-xs font-semibold outline-none focus:border-slate-400" />
                                </div>
                              </div>
                              <div>
                                <label className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Photo associée</label>
                                <select value={v.image} onChange={(e) => { const n = [...variants]; n[i] = { ...n[i], image: e.target.value }; setVariants(n); }} className="w-full h-8 bg-white border border-slate-200 rounded-lg px-2 text-xs font-semibold outline-none focus:border-slate-400">
                                  <option value="">Aucune</option>
                                  {galleryUrls.map((u, gi) => (
                                    <option key={u} value={u}>Photo {gi + 1}</option>
                                  ))}
                                </select>
                              </div>
                              <button onClick={() => setVariants(prev => prev.filter((_, j) => j !== i))} className="w-full h-8 bg-red-50 text-red-500 rounded-lg text-[10px] font-bold hover:bg-red-100 transition-colors flex items-center justify-center gap-1">
                                <Trash2 className="w-3 h-3" /> Supprimer cette variante
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                <button onClick={() => setVariants(prev => [...prev, { name: '', description: '', price: 0, reference: '', image: '', order: prev.length, active: true }])} className="w-full h-10 bg-white border border-slate-200 border-dashed rounded-xl text-slate-600 font-black text-[10px] uppercase tracking-widest hover:border-slate-400 hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" /> Ajouter une variante
                </button>
              </div>
            )}

            {/* Fiche Technique Card */}
            <div className="bg-transparent md:bg-white border-none md:border-2 border-slate-100 rounded-[2rem] p-0 md:p-4 space-y-3 flex-1 flex flex-col shadow-none md:shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100">
                    <LinkIcon className="w-5 h-5 text-slate-400" />
                  </div>
                  <div className="flex flex-col">
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">{t('admin.productManagement.productSheet')}</h4>
                  </div>
                </div>
              </div>

              {/* Tab buttons */}
              <div className="flex gap-1 bg-slate-50 p-1 rounded-xl">
                {(['pdf', ...(activeSpace === 'boutique' ? ['description', 'detail'] as const : [])] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setFicheTab(tab)}
                    className={cn(
                      "flex-1 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all",
                      ficheTab === tab
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    {tab === 'pdf' ? 'PDF' : tab === 'description' ? 'Description' : 'Description détaillée'}
                  </button>
                ))}
              </div>

              {ficheTab === 'pdf' && (
                <div className="flex-1 flex flex-col justify-center">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept={mediaType === 'photo' ? 'image/*' : 'video/*'}
                  />
                  <input type="file" ref={pdfInputRef} onChange={handlePdfChange} className="hidden" accept="application/pdf" />
                  <div onClick={triggerPdfUpload} className={cn(
                    "border-2 border-dashed rounded-[2rem] p-6 md:p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer group",
                    (pdfUrl || uploadedPdf)
                      ? "border-emerald-200 bg-emerald-50/30 hover:bg-emerald-50"
                      : "border-slate-200 hover:bg-slate-50"
                  )}>
                    <div className={cn(
                      "w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors",
                      (pdfUrl || uploadedPdf) ? "bg-emerald-100" : "bg-slate-50 group-hover:bg-blue-50"
                    )}>
                      {(pdfUrl || uploadedPdf) ? (
                        <Check className="w-8 h-8 text-emerald-600" />
                      ) : (
                        <Plus className="w-8 h-8 text-slate-300 group-hover:text-blue-500" />
                      )}
                    </div>
                    <span className="text-xs font-black text-slate-900 uppercase tracking-widest mb-1">
                      {(pdfUrl || uploadedPdf) ? t('admin.productManagement.techSheetAdded') : t('admin.productManagement.addProductSheet')}
                    </span>
                    <span className="text-[9px] text-slate-400 uppercase tracking-widest">
                      {(pdfUrl || uploadedPdf) ? (uploadedPdf ? uploadedPdf.name : t('admin.productManagement.fileSaved')) : t('admin.productManagement.officialTechSheet')}
                    </span>

                    {(pdfUrl || uploadedPdf) && (
                      <div className="flex gap-2 mt-4" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => window.open(uploadedPdf ? URL.createObjectURL(uploadedPdf) : pdfUrl, '_blank')}
                          className="px-3 py-1.5 bg-white border border-emerald-200 text-emerald-600 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-emerald-600 hover:text-white transition-all"
                        >
                          {t('admin.productManagement.viewPdf')}
                        </button>
                        <button
                          onClick={() => { setPdfUrl(''); setUploadedPdf(null); }}
                          className="px-3 py-1.5 bg-white border border-red-200 text-red-600 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-red-600 hover:text-white transition-all"
                        >
                          {t('admin.productManagement.delete')}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeSpace === 'boutique' && ficheTab === 'description' && (
                <div className="flex-1">
                  <input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Courte description du produit..."
                    className="w-full h-12 bg-slate-50 border-2 border-slate-100 rounded-xl px-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-300 transition-colors"
                  />
                </div>
              )}

              {activeSpace === 'boutique' && ficheTab === 'detail' && (
                <div className="flex-1">
                  <TipTapEditor value={descriptionDetaillee} onChange={setDescriptionDetaillee} placeholder="Description détaillée du produit..." />
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-6 space-y-3 mt-auto">
                <button
                  onClick={handleSaveProduct}
                  disabled={isSaving || !productName}
                  className="w-full h-10 bg-theme-sidebar-active-bg text-theme-sidebar-active-text rounded-xl font-black uppercase tracking-[0.2em] text-xs hover:shadow-2xl hover:shadow-black/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isSaving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus className="w-5 h-5 text-theme-sidebar-active-text" />}
                  {editingProduct ? t('admin.productManagement.saveChanges') : t('admin.productManagement.addToCatalog')}
                </button>
                <button
                  onClick={() => { setEditingProduct(null); setActivePage('gestion'); }}
                  className="w-full h-10 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] hover:text-slate-900 transition-colors border border-transparent hover:border-slate-200 rounded-xl"
                >
                  {t('admin.productManagement.cancel')}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Bottom Sheet Drawer */}
        <AnimatePresence>
          {isPricingMediaOpen && (
            <div className="md:hidden">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsPricingMediaOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-md z-[110]"
              />
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed left-0 right-0 bottom-0 z-[111] bg-slate-50 rounded-t-[3rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
              >
                {/* Header */}
                <div className="shrink-0 flex items-center justify-between p-5 border-b border-slate-100 bg-white">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-cyan-50 rounded-xl flex items-center justify-center shadow-sm">
                      <Settings className="w-5 h-5 text-cyan-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">{t('admin.productManagement.advancedSettings')}</h3>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{t('admin.productManagement.modeEnvironment')}</p>
                    </div>
                  </div>
                  <button onClick={() => setIsPricingMediaOpen(false)} className="p-2 bg-slate-100 text-slate-500 rounded-xl"><X className="w-5 h-5" /></button>
                </div>
                {/* Content */}
                <div className="flex-1 overflow-y-auto p-5 space-y-6 pb-20">

                    {/* Mode de commercialisation */}
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">{t('admin.productManagement.salesMode')}</label>
                      <div className="relative flex bg-slate-100/80 p-1 gap-2 rounded-2xl border border-slate-200 w-full overflow-hidden shadow-sm">
                        <button
                          onClick={() => {
                            setMode((prev: string[]) =>
                              prev.includes('vente')
                                ? (prev.length > 1 ? prev.filter(m => m !== 'vente') : prev)
                                : [...prev, 'vente']
                            );
                          }}
                          className={cn(
                            "relative flex-1 flex items-center justify-center gap-1.5 px-2 h-10 text-xs font-bold transition-all z-20 uppercase tracking-widest",
                            mode.includes('vente') ? "text-white" : "text-slate-400 hover:text-slate-700"
                          )}
                        >
                          {mode.includes('vente') && (
                            <motion.span
                              layoutId="mode-bubble-mobile-vente"
                              className="absolute inset-0 z-10 bg-[#18181B] rounded-xl shadow-lg border border-[#18181B]"
                              transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                            />
                          )}
                          <ShoppingCart className={cn("w-3.5 h-3.5 z-20 transition-colors", mode.includes('vente') ? "text-[#c6ff00]" : "text-slate-400")} />
                          <span className="z-20 whitespace-nowrap">{t('admin.productManagement.sale')}</span>
                        </button>

                        <button
                          onClick={() => {
                            setMode((prev: string[]) =>
                              prev.includes('location')
                                ? (prev.length > 1 ? prev.filter(m => m !== 'location') : prev)
                                : [...prev, 'location']
                            );
                          }}
                          className={cn(
                            "relative flex-1 flex items-center justify-center gap-1.5 px-2 h-10 text-xs font-bold transition-all z-20 uppercase tracking-widest",
                            mode.includes('location') ? "text-white" : "text-slate-400 hover:text-slate-700"
                          )}
                        >
                          {mode.includes('location') && (
                            <motion.span
                              layoutId="mode-bubble-mobile-location"
                              className="absolute inset-0 z-10 bg-[#18181B] rounded-xl shadow-lg border border-[#18181B]"
                              transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                            />
                          )}
                          <Calendar className={cn("w-3.5 h-3.5 z-20 transition-colors", mode.includes('location') ? "text-[#4fc3f7]" : "text-slate-400")} />
                          <span className="z-20 whitespace-nowrap">{t('admin.productManagement.rental')}</span>
                        </button>
                      </div>
                    </div>

                  {/* Screen Type / Badges (Mobile) */}
                  <div className="space-y-3">
                    {activeSpace === 'configuration' ? (
                      <>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">{t('admin.productManagement.screenType')}</label>
                        <div className="grid grid-cols-3 gap-2">
                          <button onClick={() => setScreenType('flat')} className={cn("w-full h-12 rounded-xl flex items-center px-2 gap-2 transition-all duration-300 relative overflow-hidden group", screenType === 'flat' ? "bg-[#18181B] text-white" : "bg-slate-100 text-slate-400")}>
                            <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center shrink-0", screenType === 'flat' ? "bg-white/10" : "bg-slate-200")}>
                              <Monitor className={cn("w-3.5 h-3.5", screenType === 'flat' ? "text-[#c6ff00]" : "text-slate-400")} />
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-widest truncate">{t('admin.productManagement.flat')}</span>
                          </button>
                          <button onClick={() => setScreenType('curved')} className={cn("w-full h-12 rounded-xl flex items-center px-2 gap-2 transition-all duration-300 relative overflow-hidden group", screenType === 'curved' ? "bg-[#18181B] text-white" : "bg-slate-100 text-slate-400")}>
                            <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center shrink-0", screenType === 'curved' ? "bg-white/10" : "bg-slate-200")}>
                              <svg className={cn("w-3.5 h-3.5", screenType === 'curved' ? "text-blue-400" : "text-slate-400")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 17C2 17 4 15 12 15C20 15 22 17 22 17V7C22 7 20 5 12 5C4 5 2 7 2 7V17Z" /><path d="M12 15V19M10 19H14" /></svg>
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-widest truncate">{t('admin.productManagement.curved')}</span>
                          </button>
                          <button onClick={() => setScreenType('360')} className={cn("w-full h-12 rounded-xl flex items-center px-2 gap-2 transition-all duration-300 relative overflow-hidden group", screenType === '360' ? "bg-[#18181B] text-white" : "bg-slate-100 text-slate-400")}>
                            <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center shrink-0", screenType === '360' ? "bg-white/10" : "bg-slate-200")}>
                              <svg className={cn("w-3.5 h-3.5", screenType === '360' ? "text-purple-400" : "text-slate-400")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5" /></svg>
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-widest truncate">360{'\u00B0'}</span>
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Badges</label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { id: 'populaire', label: 'Populaires', icon: TrendingUp, activeColor: 'text-orange-400' },
                            { id: 'nouveaute', label: 'Nouveautés', icon: Sparkles, activeColor: 'text-blue-400' },
                            { id: 'promotion', label: 'Promotion', icon: Tag, activeColor: 'text-red-400' },
                          ].map((badge) => {
                            const isActive = badges.includes(badge.id);
                            return (
                              <button
                                key={badge.id}
                                onClick={() => setBadges((prev: string[]) => isActive ? prev.filter((b: string) => b !== badge.id) : [...prev, badge.id])}
                                className={cn("w-full h-12 rounded-xl flex items-center px-2 gap-2 transition-all duration-300 relative overflow-hidden group", isActive ? "bg-[#18181B] text-white" : "bg-slate-100 text-slate-400")}
                              >
                                <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center shrink-0", isActive ? "bg-white/10" : "bg-slate-200")}>
                                  <badge.icon className={cn("w-3.5 h-3.5", isActive ? badge.activeColor : "text-slate-400")} />
                                </div>
                                <span className="text-[9px] font-black uppercase tracking-widest truncate">{badge.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Environnement */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">{t('admin.productManagement.environment')}</label>
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        { id: 'interieur', label: t('admin.productManagement.indoor'), icon: Monitor, color: 'text-blue-400' },
                        { id: 'semi-exterieur', label: t('admin.productManagement.semiOutdoor'), icon: Store, color: 'text-purple-400' },
{ id: 'exterieur', label: t('admin.productManagement.outdoor'), icon: Sun, color: 'text-yellow-400' }
                      ].map((item) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            setEnvironment((prev: string[]) =>
                              prev.includes(item.id as any)
                                ? (prev.length > 1 ? prev.filter(e => e !== item.id) : prev)
                                : [...prev, item.id]
                            );
                          }}
                          className={cn(
                            "w-full h-12 rounded-xl flex items-center px-4 gap-3 transition-all duration-300 relative overflow-hidden group",
                            environment.includes(item.id as any) ? "bg-[#18181B] text-white" : "bg-slate-100 text-slate-400"
                          )}
                        >
                          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", environment.includes(item.id as any) ? "bg-white/10" : "bg-slate-200")}>
                            <item.icon className={cn("w-4 h-4", environment.includes(item.id as any) ? item.color : "text-slate-400")} />
                          </div>
                          <span className="text-xs font-black uppercase tracking-widest">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Galerie photos (Mobile, Boutique only) */}
                {activeSpace === 'boutique' && (
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Galerie photos</label>
                    <input type="file" ref={galleryFileInputRef} onChange={handleGalleryUpload} className="hidden" accept="image/*" multiple />
                    <DndContext collisionDetection={closestCenter} onDragEnd={(e) => { if (e.active && e.over && e.active.id !== e.over.id) { setGalleryUrls((items) => { const oldIdx = items.indexOf(String(e.active.id)); const newIdx = items.indexOf(String(e.over.id)); return arrayMove(items, oldIdx, newIdx); }); } }}>
                      <SortableContext items={galleryUrls}>
                        <div className="flex flex-wrap gap-2">
                          {galleryUrls.map((url, idx) => (
                        <GalleryImage key={url} url={url} idx={idx} onRemove={() => removeGalleryImage(idx)} />
                          ))}
                          <button onClick={triggerGalleryUpload} className="w-[calc(33.333%-6px)] aspect-square rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-1 hover:border-slate-400 transition-colors">
                            <Plus className="w-5 h-5 text-slate-300" />
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Ajouter</span>
                          </button>
                        </div>
                      </SortableContext>
                    </DndContext>
                  </div>
                )}

                <div className="shrink-0 p-4 bg-white border-t border-slate-100">
                  <button onClick={() => setIsPricingMediaOpen(false)} className="w-full h-12 bg-black text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-black/20">{t('admin.productManagement.confirmClose')}</button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Mobile Action Buttons (Style FloatingFooterNav) */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-[90] p-4 pointer-events-none">
          <div className="relative p-1.5 bg-black/20 backdrop-blur-md border border-white/50 rounded-[24px] shadow-2xl pointer-events-auto">
            <div className="relative z-10 flex items-center gap-2 w-full">
              <button
                onClick={() => { setEditingProduct(null); setActivePage('gestion'); }}
                className="w-12 h-12 rounded-[16px] bg-black text-white flex items-center justify-center transition-all hover:bg-[#c6ff00] hover:text-black shadow-lg shrink-0"
              >
                <ChevronLeft size={20} strokeWidth={3} />
              </button>
              <button
                onClick={handleSaveProduct}
                disabled={isSaving || !productName}
                className="flex-1 h-12 bg-theme-sidebar-active-bg text-theme-sidebar-active-text rounded-[18px] flex items-center px-6 transition-all group shadow-lg overflow-hidden relative disabled:opacity-50"
              >
                <span className="relative z-10 font-black uppercase tracking-[0.3em] text-[10px] ml-2">
                  {editingProduct ? t('admin.productManagement.save') : t('admin.productManagement.add')}
                </span>
                <div className="relative z-10 ml-auto w-8 h-8 rounded-[12px] bg-white/10 flex items-center justify-center">
                  {isSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={14} strokeWidth={3} className="text-current" />}
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const GestionProduits = ({
  products,
  setProducts,
  onAddProduct,
  onEditProduct,
  onDuplicateProduct,
  onDeleteProduct,
  onBulkDelete,
  t
}: {
  products: any[];
  setProducts: (products: any[]) => void;
  onAddProduct: () => void;
  onEditProduct: (product: any) => void;
  onDuplicateProduct: (product: any) => void;
  onDeleteProduct: (id: string) => void;
  onBulkDelete?: (ids: string[]) => void;
  t: (key: string, options?: any) => string;
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('manual');
  const [filterType, setFilterType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [prevPage, setPrevPage] = useState(1);
  const itemsPerPage = 6;
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'center',
    containScroll: false,
    dragFree: false
  });

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setActiveIndex(emblaApi.selectedScrollSnap());
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi]);

  const filterOptions = [
    { id: 'all', label: t('admin.productManagement.allTypes'), icon: Layers },
    { id: 'indoor', label: t('admin.productManagement.indoor'), icon: Monitor },
    { id: 'outdoor', label: t('admin.productManagement.outdoor'), icon: Sun },
    { id: 'showcase', label: t('admin.productManagement.semiOutdoor'), icon: Store },
  ];

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    if (onBulkDelete) {
      onBulkDelete(selectedIds);
    } else {
      selectedIds.forEach(id => onDeleteProduct(id));
    }
    setSelectedIds([]);
    setShowBulkConfirm(false);
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || (Array.isArray(p.type) ? p.type.includes(filterType) : p.type === filterType);
    return matchesSearch && matchesType;
  }).sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'date') return new Date(b.date).getTime() - new Date(a.date).getTime();
    const priceA = parseFloat((a.price || '0').toString().replace(/[^\d]/g, '')) || 0;
    const priceB = parseFloat((b.price || '0').toString().replace(/[^\d]/g, '')) || 0;
    if (sortBy === 'price') return priceB - priceA;
    return 0;
  });

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const toggleSelectAll = () => {
    setSelectedIds(selectedIds.length === paginatedProducts.length && paginatedProducts.length > 0 ? [] : paginatedProducts.map(p => p.id));
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  useEffect(() => { setCurrentPage(1); }, [searchQuery, filterType, sortBy]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [filteredProducts.length, currentPage]);

  return (
    <div className="w-full space-y-6">
      <div className="hidden md:flex bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-4 w-auto">
          <button
            onClick={toggleSelectAll}
            className={cn("w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all", selectedIds.length === paginatedProducts.length && paginatedProducts.length > 0 ? "bg-blue-600 border-blue-600 text-white" : "border-slate-200 hover:border-blue-400")}
          >
            {selectedIds.length === paginatedProducts.length && paginatedProducts.length > 0 && <Check className="w-4 h-4" />}
          </button>
          <div className="relative w-80">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={t('admin.productManagement.searchProduct')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 h-10 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all"
            />
          </div>
          <button
            onClick={onAddProduct}
            className="flex items-center gap-3 px-6 h-10 bg-theme-sidebar-active-bg text-theme-sidebar-active-text rounded-xl text-sm font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-lg active:scale-[0.98] shrink-0"
          >
            <Plus className="w-5 h-5" />
            <span>{t('admin.productManagement.addProduct')}</span>
          </button>
        </div>

        <div className="flex items-center gap-3 w-auto">
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2">
              <AnimatePresence mode="wait">
                {showBulkConfirm ? (
                  <motion.div
                    key="confirm"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex items-center gap-2 bg-red-600 p-1 rounded-xl border border-red-500 shadow-xl shadow-red-500/20"
                  >
                    <span className="text-[10px] font-black text-white px-2">{t('admin.productManagement.deleteBulkText', { count: selectedIds.length })}</span>
                    <button onClick={() => setShowBulkConfirm(false)} className="px-2 py-1 text-[10px] font-bold text-white hover:bg-white/10 rounded-lg">{t('admin.productManagement.no')}</button>
                    <button onClick={handleBulkDelete} className="bg-white text-red-600 px-3 py-1 text-[10px] font-black rounded-lg">{t('admin.productManagement.yes')}</button>
                  </motion.div>
                ) : (
                  <button onClick={() => setShowBulkConfirm(true)} className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-bold hover:bg-red-600 hover:text-white transition-all">
                    <Trash2 className="w-4 h-4" /> {t('admin.productManagement.deleteBulkButton', { count: selectedIds.length })}
                  </button>
                )}
              </AnimatePresence>
            </div>
          )}

                <div className="relative">
                  <CustomSelect
                    options={[
                      { value: 'all', label: t('admin.productManagement.allTypes'), icon: Layers },
                      { value: 'indoor', label: t('admin.productManagement.indoor'), icon: Monitor },
                      { value: 'outdoor', label: t('admin.productManagement.outdoor'), icon: Sun },
                      { value: 'showcase', label: t('admin.productManagement.semiOutdoor'), icon: Store },
                    ]}
                    value={filterType}
                    onChange={(val) => setFilterType(val as any)}
                    placeholder={t('admin.productManagement.filterByType')}
                    className="w-56"
                  />
          </div>

          <CustomSelect
            options={[
              { value: 'manual', label: t('admin.productManagement.sortManual') },
              { value: 'name', label: t('admin.productManagement.sortName') },
              { value: 'price', label: t('admin.productManagement.sortPrice') },
              { value: 'date', label: t('admin.productManagement.sortDate') },
            ]}
            value={sortBy}
            onChange={setSortBy}
            placeholder={t('admin.productManagement.sortBy')}
            className="w-40"
          />
        </div>
      </div>

      {/* Refined Compact Command Strip */}
      <div className="md:hidden sticky top-4 z-40 px-2 mb-10">
        <div className="bg-white/90 backdrop-blur-xl rounded-[28px] border border-slate-100 shadow-xl p-2 flex items-center justify-between gap-2">
          <div className="flex gap-2">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="w-12 h-12 bg-slate-50 text-slate-900 rounded-[20px] flex items-center justify-center active:scale-90 transition-all border border-slate-100"
            >
              <Search className="w-5 h-5" />
            </button>

            <button
              onClick={() => setIsFilterOpen(true)}
              className={cn(
                "h-12 px-5 rounded-[20px] flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all active:scale-90 border",
                filterType !== 'all' ? "bg-theme-sidebar-active-bg text-theme-sidebar-active-text border-theme-sidebar-active-bg shadow-lg" : "bg-slate-50 text-slate-900 border-slate-100"
              )}
            >
              <Filter className="w-4 h-4" />
              <span>{t('admin.productManagement.filters')}</span>
            </button>
          </div>

          <button
            onClick={() => setIsSortOpen(true)}
            className={cn(
              "h-12 px-5 rounded-[20px] flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all active:scale-90 border",
              sortBy !== 'manual' ? "bg-theme-sidebar-active-bg text-theme-sidebar-active-text border-theme-sidebar-active-bg shadow-lg" : "bg-slate-50 text-slate-900 border-slate-100"
            )}
          >
            <ArrowUpDown className="w-4 h-4" />
            <span>{t('admin.productManagement.sort')}</span>
          </button>
        </div>
      </div>

      <div className="md:hidden -mx-4 relative">
        <div className="overflow-hidden pb-32" ref={emblaRef}>
          <div className="flex">
            {paginatedProducts.map((product, index) => (
              <div
                key={product.id}
                className="flex-[0_0_96%] min-w-0 pl-4"
              >
                <MobileProductCard
                  product={product}
                  onEdit={onEditProduct}
                  onDuplicate={onDuplicateProduct}
                  onDelete={onDeleteProduct}
                  isDeleting={deletingId === product.id}
                  setDeletingId={setDeletingId}
                  onOpenActions={(p: any) => { setEditingProduct(p); setIsActionsOpen(true); }}
                  isActive={activeIndex === index}
                />
              </div>
            ))}
          </div>
        </div>
        {/* Fixed Dual Action Bar — style FloatingFooterNav */}
        <div className="fixed bottom-8 left-0 right-0 z-30 px-5 flex justify-center pointer-events-none">
          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', damping: 20, stiffness: 280 }}
            className="pointer-events-auto w-full max-w-[400px] relative p-1.5 bg-black/20 backdrop-blur-md border border-white/50 rounded-[24px] shadow-[inset_0_1px_0px_rgba(255,255,255,0.75),0_0_9px_rgba(0,0,0,0.2),0_3px_8px_rgba(0,0,0,0.15)] before:absolute before:inset-0 before:rounded-[24px] before:bg-gradient-to-br before:from-white/60 before:via-transparent before:to-transparent before:opacity-70 before:pointer-events-none after:absolute after:inset-0 after:rounded-[24px] after:bg-gradient-to-tl after:from-white/30 after:via-transparent after:to-transparent after:opacity-50 after:pointer-events-none"
          >
            <div className="relative z-10 flex items-center gap-2 w-full">

              {/* Capsule principale — Ajouter un produit (style SUIVANT) */}
              <button
                onClick={onAddProduct}
                className="flex-1 h-12 bg-theme-sidebar-active-bg text-theme-sidebar-active-text rounded-[18px] flex items-center px-6 transition-all duration-300 group hover:shadow-[0_4px_20px_rgba(0,0,0,0.4)] active:scale-[0.98] shadow-lg overflow-hidden relative"
              >
                <div className="absolute inset-0 bg-theme-sidebar-active-bg opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
                <span className="relative z-10 font-black uppercase tracking-[0.3em] text-[10px] ml-2 transition-colors duration-300">
                  {t('admin.productManagement.addProduct')}
                </span>
                <div className="relative z-10 ml-auto w-8 h-8 rounded-[12px] bg-white/20 flex items-center justify-center transition-all duration-300 group-hover:scale-105">
                  <Plus size={14} strokeWidth={3} className="text-current" />
                </div>
              </button>

              {/* Bouton Actions (style bouton retour) */}
              <button
                onClick={() => {
                  const activeProduct = paginatedProducts[activeIndex];
                  if (activeProduct) {
                    setEditingProduct(activeProduct);
                    setIsActionsOpen(true);
                  }
                }}
                className="w-12 h-12 rounded-[16px] bg-theme-sidebar-active-bg text-theme-sidebar-active-text flex items-center justify-center transition-all duration-300 hover:opacity-90 hover:shadow-[0_0_20px_rgba(0,0,0,0.2)] active:scale-90 shadow-lg shrink-0"
              >
                <MoreVertical size={20} strokeWidth={3} />
              </button>

            </div>
          </motion.div>
        </div>
      </div>

      <ProductActionsDrawer isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} title={t('admin.productManagement.filterByType')}>
        <div className="grid grid-cols-1 gap-3">
          {filterOptions.map((opt) => (
            <button key={opt.id} onClick={() => { setFilterType(opt.id as any); setIsFilterOpen(false); }} className={cn("w-full flex items-center justify-between p-5 rounded-2xl transition-all", filterType === opt.id ? "bg-black text-white" : "bg-slate-50 text-slate-600")}>
              <div className="flex items-center gap-4"><opt.icon className="w-6 h-6" /> <span className="text-lg font-black uppercase tracking-widest">{opt.label}</span></div>
              {filterType === opt.id && <Check className="w-5 h-5 text-[#c6ff00]" />}
            </button>
          ))}
        </div>
      </ProductActionsDrawer>

      <ProductActionsDrawer isOpen={isSortOpen} onClose={() => setIsSortOpen(false)} title={t('admin.productManagement.sortList')}>
        <div className="grid grid-cols-1 gap-3">
          {[{ value: 'manual', label: t('admin.productManagement.sortManual'), icon: GripVertical }, { value: 'name', label: t('admin.productManagement.sortName'), icon: FileText }, { value: 'price', label: t('admin.productManagement.sortPrice'), icon: Zap }, { value: 'date', label: t('admin.productManagement.sortDate'), icon: Calendar }].map((opt) => (
            <button key={opt.value} onClick={() => { setSortBy(opt.value as any); setIsSortOpen(false); }} className={cn("w-full flex items-center justify-between p-5 rounded-2xl transition-all", sortBy === opt.value ? "bg-black text-white" : "bg-slate-50 text-slate-600")}>
              <div className="flex items-center gap-4"><opt.icon className="w-6 h-6" /> <span className="text-lg font-black uppercase tracking-widest">{opt.label}</span></div>
              {sortBy === opt.value && <Check className="w-5 h-5 text-[#c6ff00]" />}
            </button>
          ))}
        </div>
      </ProductActionsDrawer>

      {/* TikTok Style Search Overlay */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.1}
            onDragEnd={(_, info) => {
              if (info.offset.y > 150) setIsSearchOpen(false);
            }}
            className="fixed inset-0 bg-white z-[200] md:hidden flex flex-col touch-none"
          >
            {/* Drag Handle */}
            <div className="w-full flex justify-center py-4">
              <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
            </div>

            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setIsSearchOpen(false)}
                  className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-900"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <div className="flex-1 relative">
                  <Search className="w-6 h-6 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    autoFocus
                    type="text"
                    placeholder={t('admin.productManagement.searchProduct')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-14 pr-6 py-4 bg-slate-100 border-2 border-transparent focus:border-black rounded-[1.5rem] text-lg font-black uppercase tracking-widest transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">{t('admin.productManagement.suggestedResults')}</p>
              {products
                .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(p => (
                  <button
                    key={p.id}
                    onClick={() => {
                      const idx = filteredProducts.findIndex(item => item.id === p.id);
                      if (idx !== -1 && emblaApi) {
                        emblaApi.scrollTo(idx);
                        setIsSearchOpen(false);
                      }
                    }}
                    className="w-full flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-transparent hover:border-slate-200 transition-all text-left"
                  >
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-white border border-slate-100">
                      <img src={getSafeImageUrl(p)} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="font-black text-slate-900 uppercase tracking-tighter">{p.name}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">{p.price || '—'}</p>
                    </div>
                  </button>
                ))}
              {products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                <div className="py-20 text-center">
                  <Package className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                  <p className="text-slate-400 font-black uppercase tracking-widest">{t('admin.productManagement.noResults')}</p>
                </div>
              )}
            </div>

            <div className="p-6 pb-12 bg-slate-50 border-t border-slate-100">
              <button
                onClick={() => setIsSearchOpen(false)}
                className="w-full py-5 bg-black text-white rounded-[2rem] font-black uppercase tracking-[0.3em] shadow-2xl"
              >
                {t('admin.productManagement.done')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ProductActionsDrawer isOpen={isActionsOpen} onClose={() => setIsActionsOpen(false)} product={editingProduct} onEdit={onEditProduct} onDuplicate={onDuplicateProduct} onDelete={() => { setDeletingId(editingProduct?.id); setIsActionsOpen(false); }} />

      <div className="hidden md:block relative overflow-hidden min-h-[400px]">
        <AnimatePresence mode="popLayout">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <DndContext collisionDetection={closestCenter} onDragEnd={(e) => { if (e.active && e.over && e.active.id !== e.over.id && typeof setProducts === 'function') { const items = [...paginatedProducts]; const oldIdx = items.findIndex((p) => p.id === e.active.id); const newIdx = items.findIndex((p) => p.id === e.over.id); if (oldIdx !== -1 && newIdx !== -1) setProducts(arrayMove(items, oldIdx, newIdx)); } }}>
              <SortableContext items={paginatedProducts.map(p => p.id)}>
                <div className="space-y-4">
                  {paginatedProducts.map((product) => (
                    <ProductListItem key={product.id} product={product} selectedIds={selectedIds} toggleSelect={toggleSelect} onEditProduct={onEditProduct} onDuplicateProduct={onDuplicateProduct} onDeleteProduct={onDeleteProduct} setDeletingId={setDeletingId} deletingId={deletingId} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </motion.div>
        </AnimatePresence>

        {filteredProducts.length === 0 && (
          <div className="bg-white rounded-[32px] border border-slate-200 border-dashed p-12 text-center group/empty">
            <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover/empty:bg-black/5 transition-colors"><Package className="w-10 h-10 text-slate-300" /></div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">{t('admin.productManagement.noProducts')}</h3>
            <p className="text-slate-500 font-medium mb-8">{t('admin.productManagement.startByCreating')}</p>
            <button onClick={onAddProduct} className="px-8 py-3.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-[#131E3F] hover:text-white transition-all shadow-lg flex items-center gap-2 mx-auto"><Plus className="w-5 h-5" /> <span>{t('admin.productManagement.createProduct')}</span></button>
          </div>
        )}
      </div>


      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page) => {
          setPrevPage(currentPage);
          setCurrentPage(page);
        }}
        totalItems={filteredProducts.length}
        itemsPerPage={itemsPerPage}
      />
    </div>
  );
};

// --- Mock Data ---
const MOCK_USER = {
  uid: 'mock-user-123',
  email: 'demo@pixiatech.com',
  displayName: 'Demo User',
  emailVerified: true
};

const MOCK_CHARACTERISTICS = [
  {
    id: 'char-0',
    name: 'Distance de visionnage',
    iconName: 'distance',
    color: 'text-cyan-400',
    variants: [
      { id: 'vd0', value: '0-0.5m', image: null },
      { id: 'vd1', value: '0.5-2m', image: null },
      { id: 'vd2', value: '2-5m', image: null },
      { id: 'vd3', value: '5-10m', image: null },
      { id: 'vd4', value: '10-20m', image: null },
      { id: 'vd5', value: '20-50m', image: null },
      { id: 'vd6', value: '+50m', image: null }
    ],
    options: ['0-0.5m', '0.5-2m', '2-5m', '5-10m', '10-20m', '20-50m', '+50m'],
    locked: true,
    isPinned: true,
    uid: 'mock-user-123'
  },
  {
    id: 'char-1',
    name: 'Pixel pitch',
    iconName: 'pixel',
    color: 'text-blue-400',
    variants: [
      { id: 'pp1', value: 'P1.2', image: null },
      { id: 'pp2', value: 'P1.5', image: null },
      { id: 'pp3', value: 'P2', image: null },
      { id: 'pp4', value: 'P2.5', image: null },
      { id: 'pp5', value: 'P3', recommended: false },
      { id: 'pp6', value: 'P4', recommended: false },
      { id: 'pp7', value: 'P5', recommended: false },
      { id: 'pp8', value: 'P6', recommended: false },
      { id: 'pp9', value: 'P8', recommended: false },
      { id: 'pp10', value: 'P10', recommended: false },
      { id: 'pp11', value: 'P16', recommended: false },
      { id: 'pp12', value: 'P18', recommended: false },
      { id: 'pp13', value: 'P19', recommended: false }
    ],
    options: ['P1.2', 'P1.5', 'P2', 'P2.5', 'P3', 'P4', 'P5', 'P6', 'P8', 'P10', 'P16'],
    locked: true,
    isPinned: true,
    uid: 'mock-user-123'
  },
  {
    id: 'char-2',
    name: 'Luminosité',
    iconName: 'luminosité',
    color: 'text-yellow-400',
    variants: [
      { id: '1', value: '800 nits', image: null },
      { id: '2', value: '1200 nits', image: null },
      { id: '3', value: '5000 nits', image: null }
    ],
    options: ['800 nits', '1200 nits', '5000 nits'],
    locked: false,
    isPinned: true,
    uid: 'mock-user-123'
  },
  {
    id: 'char-3',
    name: 'Indice de protection',
    iconName: 'couches',
    color: 'text-green-400',
    variants: [
      { id: '1', value: 'IP20', image: null },
      { id: '2', value: 'IP65', image: null }
    ],
    options: ['IP20', 'IP65'],
    locked: false,
    isPinned: true,
    uid: 'mock-user-123'
  },
  {
    id: 'char-4',
    name: 'Résolution',
    iconName: 'monitor',
    color: 'text-purple-400',
    variants: [
      { id: '1', value: '1920x1080', image: null },
      { id: '2', value: '3840x2160', image: null }
    ],
    options: ['1920x1080', '3840x2160'],
    locked: false,
    isPinned: true,
    uid: 'mock-user-123'
  },
  {
    id: 'char-5',
    name: 'Consommation Max',
    iconName: 'zap',
    color: 'text-red-400',
    variants: [
      { id: '1', value: '600W/m²', image: null },
      { id: '2', value: '800W/m²', image: null }
    ],
    options: ['600W/m²', '800W/m²'],
    locked: false,
    uid: 'mock-user-123'
  },
  {
    id: 'char-6',
    name: 'Consommation Moyenne',
    iconName: 'zap',
    color: 'text-orange-400',
    variants: [
      { id: '1', value: '200W/m²', image: null },
      { id: '2', value: '300W/m²', image: null }
    ],
    options: ['200W/m²', '300W/m²'],
    locked: false,
    uid: 'mock-user-123'
  }
];

const MOCK_PRODUCTS = [
  {
    id: 'prod-1',
    name: 'Écran LED Intérieur P1.2 High-End',
    type: ['interieur'],
    mode: ['vente'],
    price: '4 500 \u20AC',
    pitch: 'P1.2',
    distance: '1.2m',
    power: '600W/m²',
    image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=1000',
    selectedChars: [
      { id: 'char-1', value: 'P1.2' },
      { id: 'char-2', value: '800 nits' },
      { id: 'char-3', value: 'IP20' }
    ],
    date: new Date().toISOString(),
    uid: 'mock-user-123'
  },
  {
    id: 'prod-2',
    name: 'Totem LED Extérieur P2.5 Publicitaire',
    type: ['exterieur'],
    mode: ['location'],
    price: '150 \u20AC',
    pitch: 'P2.5',
    distance: '2.5m',
    power: '800W/m²',
    image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=1000',
    selectedChars: [
      { id: 'char-1', value: 'P2.5' },
      { id: 'char-2', value: '5000 nits' },
      { id: 'char-3', value: 'IP65' }
    ],
    date: new Date().toISOString(),
    uid: 'mock-user-123'
  },
  {
    id: 'prod-3',
    name: 'Écran LED Transparent P3.9 Vitrine',
    type: ['interieur'],
    mode: ['vente'],
    price: '3 200 \u20AC',
    pitch: 'P3.9',
    distance: '4m',
    power: '400W/m²',
    image: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=1000',
    selectedChars: [
      { id: 'char-1', value: 'P3.9' },
      { id: 'char-2', value: '1200 nits' }
    ],
    date: new Date().toISOString(),
    uid: 'mock-user-123'
  },
  {
    id: 'prod-4',
    name: 'Dalle LED Sol Interactive P4.8',
    type: ['interieur'],
    mode: ['location'],
    price: '200 \u20AC',
    pitch: 'P4.8',
    distance: '5m',
    power: '900W/m²',
    image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=1000',
    selectedChars: [
      { id: 'char-1', value: 'P4.8' },
      { id: 'char-3', value: 'IP65' }
    ],
    date: new Date().toISOString(),
    uid: 'mock-user-123'
  },
  {
    id: 'prod-5',
    name: 'Bannière LED Sportive P10',
    type: ['exterieur'],
    mode: ['vente'],
    price: '1 800 \u20AC',
    pitch: 'P10',
    distance: '10m',
    power: '700W/m²',
    image: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?auto=format&fit=crop&q=80&w=1000',
    selectedChars: [
      { id: 'char-1', value: 'P10' },
      { id: 'char-2', value: '6000 nits' },
      { id: 'char-3', value: 'IP65' }
    ],
    date: new Date().toISOString(),
    uid: 'mock-user-123'
  },
  {
    id: 'prod-6',
    name: 'Écran LED Flexible P2.5 Design',
    type: ['interieur'],
    mode: ['vente'],
    price: '5 500 \u20AC',
    pitch: 'P2.5',
    distance: '2.5m',
    power: '500W/m²',
    image: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?auto=format&fit=crop&q=80&w=1000',
    selectedChars: [
      { id: 'char-1', value: 'P2.5' },
      { id: 'char-2', value: '1000 nits' }
    ],
    date: new Date().toISOString(),
    uid: 'mock-user-123'
  }
];

// ─────────────────────────────────────────────────────────────────────────
// --- Main App Component ---
export default function ProductManagementClient() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [authView, setAuthView] = useState<'login' | 'signup' | 'forgot-password'>('login');
  const [rememberMe, setRememberMe] = useState(true);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const [activePage, setActivePage] = useState<'gestion' | 'produit' | 'caracteristiques'>('gestion');
  const [prevActivePage, setPrevActivePage] = useState<'gestion' | 'produit' | 'caracteristiques'>('gestion');
  const [isSyncing, setIsSyncing] = useState(false);

  const getPageOrder = (page: string) => {
    const order = { 'gestion': 0, 'produit': 1, 'caracteristiques': 2 };
    return order[page as keyof typeof order] || 0;
  };

  const pageDirection = getPageOrder(activePage) >= getPageOrder(prevActivePage) ? 1 : -1;

  const handlePageChange = (newPage: 'gestion' | 'produit' | 'caracteristiques') => {
    if (!user) {
      toast({ title: t('admin.productManagement.restrictedAccess'), description: t('admin.productManagement.loginRequired'), variant: "destructive" });
      return;
    }
    setPrevActivePage(activePage);
    setActivePage(newPage);
    // Clear editing product when navigating away from the form
    if (newPage !== 'produit') {
      setEditingProduct(null);
    }
  };

  const [products, setProducts] = useState<any[]>([]);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [productName, setProductName] = useState('');
  const [characteristics, setCharacteristics] = useState<any[]>([]);
  const [wizardSettings, setWizardSettings] = useState<{ viewingDistances: string[], pixelPitches: string[] }>({ viewingDistances: [], pixelPitches: [] });
  const [activeSpace, setActiveSpace] = useState<'boutique' | 'configuration'>('configuration');
  const prodCol = useMemo(() => activeSpace === 'boutique' ? 'boutique_products' : 'products', [activeSpace]);
  const charCol = useMemo(() => activeSpace === 'boutique' ? 'boutique_characteristics' : 'characteristics', [activeSpace]);

  const handleFirestoreError = (error: any, action: string, collection: string) => {
    console.error(`Firestore error ${action} ${collection}:`, error);
    let message = t('admin.productManagement.errorAccessing', { collection });

    if (error.code === 'permission-denied') {
      message = t('admin.productManagement.errorPermissionDenied', { collection, projectId: auth.app.options.projectId });
    } else if (error.code === 'unavailable') {
      message = t('admin.productManagement.errorDatabaseUnavailable');
    } else {
      message = t('admin.productManagement.errorFirebase', { code: error.code, message: error.message });
    }

    toast({
      title: t('admin.productManagement.databaseError'),
      description: message,
      variant: "destructive"
    });
  };

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Data Sync (Real-time Firestore)
  useEffect(() => {
    // Listen to products
    const qProducts = query(collection(db, prodCol), orderBy("name", "asc"));
    const unsubProducts = onSnapshot(qProducts, (snapshot) => {
      const prods = snapshot.docs.map(doc => {
        const data = doc.data() as any;
        // Normalize availableFor and mode for UI (French)
        const normalizedMode = (data.availableFor || data.mode || [])
          .map((m: string) => {
            const val = m.toLowerCase();
            if (val === 'sale' || val === 'vente') return 'sale';
            if (val === 'rental' || val === 'location') return 'rental';
            return val;
          });

        // Normalize environment types for UI (English keys for translation)
        const normalizedType = (Array.isArray(data.type) ? data.type : [data.type || 'indoor'])
          .map((t: string) => {
            const val = t.toLowerCase();
            if (val === 'indoor' || val === 'interieur') return 'indoor';
            if (val === 'outdoor' || val === 'exterieur') return 'outdoor';
            if (val === 'showcase' || val === 'semi-exterieur' || val === 'vitrine') return 'showcase';
            return val;
          });

        return {
          id: doc.id,
          ...data,
          mode: normalizedMode,
          environment: normalizedType,
          type: normalizedType
        };
      });
      setProducts(prods);
    }, (error) => handleFirestoreError(error, 'fetching', 'products'));

    // Listen to characteristics
    const qChars = query(collection(db, charCol), orderBy("name", "asc"));
    const unsubChars = onSnapshot(qChars, async (snapshot) => {
      const chars = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Auto-seeding core characteristics if missing
      const coreNames = ['Pixel pitch', 'Distance de visionnage', 'Puissance maximale'];
      const missingNames = coreNames.filter(name => !chars.some((c: any) => c.name === name));

      if (missingNames.length > 0) {
        // Use a static flag to prevent multiple seeding calls in the same session
        if (!(window as any)._isSeeding) {
          (window as any)._isSeeding = true;
          for (const name of missingNames) {
            const defaultChar = MOCK_CHARACTERISTICS.find(c => c.name === name);
            if (defaultChar) {
              const { id: charId, ...data } = defaultChar;
              try {
                // Use setDoc with fixed ID for core characteristics
                await setDoc(doc(db, charCol, charId || `char-${name.replace(/\s+/g, '-').toLowerCase()}`), {
                  ...data,
                  uid: user?.uid || 'system',
                  locked: true,
                  isPinned: true
                });
              } catch (e) {
                console.error("Seeding failed", e);
              }
            }
          }
          (window as any)._isSeeding = false;
        }
      }

      setCharacteristics(chars);
    }, (error) => handleFirestoreError(error, 'fetching', 'characteristics'));

    // Listen to wizard settings for authoritative distance/pitch options
    const wizardRef = doc(db, 'settings', 'wizard');
    const unsubWizard = onSnapshot(wizardRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data() as any;
        const viewingDistances: string[] = (data.viewingDistances || [])
          .map((d: any) => (typeof d === 'string' ? d : d?.value || ''))
          .filter(Boolean);
        const pixelPitches: string[] = (data.pixelPitches || [])
          .map((p: any) => (typeof p === 'string' ? p : p?.value || ''))
          .filter(Boolean);
        setWizardSettings({ viewingDistances, pixelPitches });
      }
    });

    return () => {
      unsubProducts();
      unsubChars();
      unsubWizard();
    };
  }, [user, prodCol, charCol]); // Re-run if user or space changes

  // Auto-duplicate products to boutique_products when first switching to boutique
  const [hasDuplicatedBoutique, setHasDuplicatedBoutique] = useState(false);
  useEffect(() => {
    if (!user || activeSpace !== 'boutique' || hasDuplicatedBoutique) return;
    (async () => {
      try {
        const existing = await getDocs(collection(db, 'boutique_products'));
        if (existing.empty) {
          const configSnap = await getDocs(collection(db, 'products'));
          for (const d of configSnap.docs) {
            const data = d.data();
            await addDoc(collection(db, 'boutique_products'), {
              ...data,
              price: typeof data.price === 'number' ? data.price : parseFloat(String(data.salePricePerSqM || data.price || 0).replace(/[^0-9.,]/g, '').replace(',', '.')) || 0,
            });
          }
        }
      } catch (e) {
        console.error('Boutique duplication error:', e);
      }
      setHasDuplicatedBoutique(true);
    })();
  }, [user, activeSpace, hasDuplicatedBoutique]);

  // Sync characteristics to boutique_characteristics when switching to boutique
  const [hasSyncedBoutiqueChars, setHasSyncedBoutiqueChars] = useState(false);
  useEffect(() => {
    if (!user || activeSpace !== 'boutique' || hasSyncedBoutiqueChars) return;
    (async () => {
      try {
        const boutiqueCharsSnap = await getDocs(collection(db, 'boutique_characteristics'));
        const configCharsSnap = await getDocs(collection(db, 'characteristics'));
        const boutiqueNames = new Set(boutiqueCharsSnap.docs.map(d => d.data().name));
        for (const d of configCharsSnap.docs) {
          const data = d.data();
          if (!boutiqueNames.has(data.name)) {
            await setDoc(doc(db, 'boutique_characteristics', d.id), {
              ...data,
              uid: user?.uid || 'system',
            });
          }
        }
      } catch (e) {
        console.error('Boutique characteristics sync error:', e);
      }
      setHasSyncedBoutiqueChars(true);
    })();
  }, [user, activeSpace, hasSyncedBoutiqueChars]);

  const [selectedChars, setSelectedChars] = useState<any[]>([]);
  const [showCharPanel, setShowCharPanel] = useState(false);
  const [tempSelectedChars, setTempSelectedChars] = useState<string[]>([]);
  const [distancePitches, setDistancePitches] = useState<Record<string, string[]>>({});
  const [charPanelSearch, setCharPanelSearch] = useState('');

  const availableChars = characteristics.filter(c => !selectedChars.some(sc => sc.id === c.id));
  const filteredAvailableChars = charPanelSearch.trim()
    ? availableChars.filter(c => c.name.toLowerCase().includes(charPanelSearch.toLowerCase().trim()))
    : availableChars;

  const [mode, setMode] = useState<('vente' | 'location')[]>(['vente']);
  const [environment, setEnvironment] = useState<('interieur' | 'exterieur' | 'semi-exterieur')[]>(['exterieur']);
  const [screenType, setScreenType] = useState<'flat' | 'curved'>('flat');
  const [badges, setBadges] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [descriptionDetaillee, setDescriptionDetaillee] = useState('');
  const [ficheTab, setFicheTab] = useState<'pdf' | 'description' | 'detail'>('pdf');
  const [surface, setSurface] = useState<number>(9.00);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [mediaType, setMediaType] = useState<'photo' | 'video'>('photo');
  const [dimensionsEnabled, setDimensionsEnabled] = useState(false);

  // Media State
  const [photoUrl, setPhotoUrl] = useState('');
  const [uploadedPhoto, setUploadedPhoto] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [uploadedVideo, setUploadedVideo] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryFileInputRef = useRef<HTMLInputElement>(null);
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);

  const [aiSettings, setAiSettings] = useState<AISettings>(DEFAULT_AI_SETTINGS);
  const [isAISettingsOpen, setIsAISettingsOpen] = useState(false);



  const handleLogin = async () => {
    setAuthError(null);
    setIsAuthenticating(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed", error);
      setAuthError("Google login failed.");
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleEmailLogin = async (e?: React.FormEvent | string, maybePassword?: string) => {
    if (e && typeof e !== 'string') {
      e.preventDefault();
    }

    const loginEmail = typeof e === 'string' ? e : email;
    const loginPassword = typeof e === 'string' ? maybePassword : password;

    if (!loginEmail || !loginPassword) {
      setAuthError("Please fill in all fields.");
      return;
    }

    setAuthError(null);
    setIsAuthenticating(true);
    try {
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
      await signInWithEmailAndPassword(auth, loginEmail.trim(), loginPassword);
    } catch (error: any) {
      console.error("Email login failed", error);
      setAuthError("Incorrect email or password.");
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsAuthenticating(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setResetEmailSent(true);
    } catch (error: any) {
      console.error("Password reset failed", error);
      setAuthError("Error sending reset email.");
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsAuthenticating(true);
    try {
      // Note: Phone number is just visual for now as requested
      await createUserWithEmailAndPassword(auth, email.trim(), password);
    } catch (error: any) {
      console.error("Email sign up failed", error);
      setAuthError("Error creating account.");
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setActivePage('gestion');
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const handleSaveProduct = async () => {
    if (!user) return;
    if (Array.isArray(mode) && mode.includes('location') && (!rentalStock || Number(rentalStock) <= 0)) {
      toast({
        title: t('admin.productManagement.stockRequired'),
        description: t('admin.productManagement.stockRequiredDesc'),
        variant: "destructive"
      });
      return;
    }
    setIsSaving(true);

    try {
      let finalPhotoUrl = photoUrl;
      let finalVideoUrl = videoUrl;
      let finalPdfUrl = pdfUrl;

      // Handle Concurrent Photo Upload
      if (uploadedPhoto) {
        const photoRef = ref(storage, `products/photos/${Date.now()}_${uploadedPhoto.name}`);
        const uploadResult = await uploadBytes(photoRef, uploadedPhoto);
        finalPhotoUrl = await getDownloadURL(uploadResult.ref);
      }

      // Handle Concurrent Video Upload
      if (uploadedVideo) {
        const videoRef = ref(storage, `products/videos/${Date.now()}_${uploadedVideo.name}`);
        const uploadResult = await uploadBytes(videoRef, uploadedVideo);
        finalVideoUrl = await getDownloadURL(uploadResult.ref);
      } else if (videoUrl && !isVideoUrl(videoUrl) && !uploadedPhoto && finalPhotoUrl === videoUrl) {
        // Migration/Cleanup logic: if videoUrl was used as image placeholder, separate them
        finalVideoUrl = '';
      }

      // Handle PDF Upload (Fiche Technique)
      if (uploadedPdf) {
        const pdfRef = ref(storage, `products/pdfs/${Date.now()}_${uploadedPdf.name}`);
        const uploadResult = await uploadBytes(pdfRef, uploadedPdf);
        finalPdfUrl = await getDownloadURL(uploadResult.ref);
      }

      // Handle Gallery Photos Upload
      const finalGalleryUrls: string[] = [];
      for (const url of galleryUrls) {
        if (url.startsWith('data:')) {
          const blob = await (await fetch(url)).blob();
          const galleryRef = ref(storage, `products/gallery/${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`);
          const uploadResult = await uploadBytes(galleryRef, blob);
          finalGalleryUrls.push(await getDownloadURL(uploadResult.ref));
        } else {
          finalGalleryUrls.push(url);
        }
      }

      // Compute flat compatible values for backward compatibility
      const distVal = Object.keys(distancePitches || {}).filter(k => (distancePitches || {})[k]?.length > 0).join(', ');
      const pitchVal = Array.from(new Set(Object.values(distancePitches || {}).flat())).join(', ');

      const distCharDef = characteristics.find(c => c.name === 'Distance de visionnage');
      const pitchCharDef = characteristics.find(c => c.name === 'Pixel pitch');

      const filteredSelectedChars = (selectedChars || []).filter(c => {
        const charDef = characteristics.find(cd => cd.id === c.id);
        return charDef?.name !== 'Distance de visionnage' && charDef?.name !== 'Pixel pitch';
      }).map(c => ({
        id: String(c.id || ''),
        value: String(c.value || '')
      }));

      if (distCharDef) {
        filteredSelectedChars.push({ id: String(distCharDef.id), value: distVal });
      }
      if (pitchCharDef) {
        filteredSelectedChars.push({ id: String(pitchCharDef.id), value: pitchVal });
      }

      // --- DATA SANITIZATION ---
      const rawData: any = {
        name: productName || '',
        mode: (mode || []).map(m => {
          if (m === 'vente') return 'sale';
          if (m === 'location') return 'rental';
          return m;
        }),
        availableFor: (mode || []).map(m => {
          if (m === 'vente') return 'sale';
          if (m === 'location') return 'rental';
          return String(m || '').toLowerCase();
        }),
        type: (environment || []).map(e => {
          if (e === 'interieur') return 'indoor';
          if (e === 'exterieur') return 'outdoor';
          if (e === 'semi-exterieur' || e === 'vitrine') return 'showcase';
          return e;
        }),
        price: String(normalizePrice(prixVente)),
        oldPrice: oldPrice ? parseFloat(oldPrice) : null,
        image: finalPhotoUrl || '',
        videoUrl: finalVideoUrl || '',
        pdfUrl: finalPdfUrl || '',
        pitch: pitchVal,
        distance: distVal,
        distancePitches: distancePitches || {},
        power: String(selectedChars.find(c => {
          const charDef = characteristics.find(cd => cd.id === c.id);
          return charDef?.name === 'Puissance maximale';
        })?.value || ''),
        surfaceMinRequise: String(surfaceMinRequise || '0'),
        surfaceMaxLocation: String(surfaceMaxLocation || '0'),
        tileWidth: Number(largeurDalle || '0'),
        tileHeight: Number(hauteurDalle || '0'),
        pricePerTile: Number(prixDalle || '0'),
        dimensionsEnabled: !!dimensionsEnabled,
        screenType: screenType || 'flat',
        badges: badges,
        updatedAt: new Date().toISOString(),
        hasDimensions: !!dimensionsEnabled,
        prixLocationHeure: String(prixLocationHeure || '0'),
        prixLocationJour: String(prixLocationJour || '0'),
        rentalStock: Number(rentalStock || '0'),
        rentalQuantity: Number(rentalQuantity || '1'),
        stock: Number(stock || '0'),
        isHidden: !!isHidden,
        galleryUrls: finalGalleryUrls,
        description: description,
        descriptionDetaillee: descriptionDetaillee,
        variants: variants,
        date: new Date().toISOString(),
        uid: user?.uid || 'system',
        selectedChars: filteredSelectedChars
      };

      // Final pass to remove any undefined that might have sneaked in
      const productData = Object.fromEntries(
        Object.entries(rawData).filter(([_, v]) => v !== undefined)
      );

      if (editingProduct) {
        console.log("Updating product:", editingProduct.id, productData);
        await updateDoc(doc(db, prodCol, editingProduct.id), productData);
        toast({
          title: t('admin.productManagement.productUpdated'),
          description: t('admin.productManagement.productUpdatedDesc', { name: productName }),
          variant: "success"
        });
      } else {
        await addDoc(collection(db, prodCol), productData);
        toast({
          title: t('admin.productManagement.productAdded'),
          description: t('admin.productManagement.productAddedDesc', { name: productName }),
          variant: "success"
        });
      }

      setActivePage('gestion');
      setEditingProduct(null);
      setUploadedPhoto(null);
      setUploadedVideo(null);
      setPhotoUrl('');
      setVideoUrl('');
    } catch (error: any) {
      console.error('Error saving product:', error);
      toast({
        title: t('admin.productManagement.saveErrorToast'),
        description: error.message || t('admin.productManagement.saveErrorDesc'),
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDuplicateProduct = async (product: any) => {
    try {
      const { id, ...prodData } = product;
      const newProduct = {
        ...prodData,
        name: `Copy — ${product.name}`,
        date: new Date().toISOString(),
      };
      await addDoc(collection(db, prodCol), newProduct);
      toast({
        title: t('admin.productManagement.duplicateSuccessToast') || 'Produit dupliqué',
        description: t('admin.productManagement.duplicateSuccessDesc', { name: product.name }) || `« ${product.name} » a été dupliqué avec succès.`,
        variant: 'success',
      });
    } catch (error: any) {
      console.error('Duplicate error:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de dupliquer le produit.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await deleteDoc(doc(db, prodCol, id));
    } catch (error) {
      console.error("Error deleting product", error);
    }
  };

  const handleBulkDeleteProducts = async (ids: string[]) => {
    for (const id of ids) {
      await deleteDoc(doc(db, prodCol, id));
    }
  };

  const handleActivateV2 = async () => { };
  const handleSaveSettings = (newSettings: any) => {
    setAiSettings(newSettings);
  };

  // PDF State
  const [uploadedPdf, setUploadedPdf] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [pdfError, setPdfError] = useState<string>('');
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [aiSuggestion, setAiSuggestion] = useState<{ name: string, variants: string[] } | null>(null);

  const handleAIAnalysis = async () => {
    if (!aiSettings.enabled) {
      setPdfError('AI is disabled in settings.');
      setIsAISettingsOpen(true);
      return;
    }

    if (!aiSettings.apiKey) {
      setPdfError('Please configure your API key in AI settings.');
      setIsAISettingsOpen(true);
      return;
    }

    if (!uploadedPdf) {
      setPdfError('Please upload a PDF file first.');
      return;
    }

    if (uploadedPdf.size > aiSettings.pdfMaxSize * 1024 * 1024) {
      setPdfError(`File is too large (max ${aiSettings.pdfMaxSize} MB).`);
      return;
    }

    setIsAnalyzing(true);
    setAnalysisProgress(10);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = (reader.result as string).split(',')[1];

          setAnalysisProgress(30);

          const prompt = `Analyze this LED screen technical datasheet. 
          Extract the following information in JSON format:
          {
            "name": "Product name",
            "viewingDistance": "ex: 4m",
            "pixelPitch": "ex: P2.5",
            "powerMax": "ex: 10.8 kW",
            "powerMin": "ex: 3.8 kW",
            "resolution": "ex: 1920x1080",
            "brightness": "ex: 1200 nits",
            "type": "indoor | semi-outdoor | outdoor",
            "dimensions": { "width": 50, "height": 50 },
            "newCharacteristic": { "name": "Name", "variants": ["v1", "v2"] }
          }
          Be precise. Use the same units as requested. Answer in ${aiSettings.language === 'fr' ? 'French' : 'English'}.`;

          let data;

          if (aiSettings.provider === 'gemini') {
            const ai = new GoogleGenAI({ apiKey: aiSettings.apiKey });
            const result = await ai.models.generateContent({
              model: aiSettings.model || "gemini-3-flash-preview",
              contents: [
                {
                  parts: [
                    { text: prompt },
                    { inlineData: { data: base64Data, mimeType: "application/pdf" } }
                  ]
                }
              ],
              config: {
                responseMimeType: "application/json",
                maxOutputTokens: aiSettings.maxTokens
              }
            });
            data = JSON.parse(result.text || '{}');
          } else {
            // Placeholder for other providers
            throw new Error(`The ${aiSettings.provider} provider is not yet fully supported for direct PDF analysis.`);
          }

          setAnalysisProgress(90);

          // Fill fields
          if (data.name) setProductName(data.name);
          if (data.brightness) {
            setSelectedChars(prev => prev.map(c => c.id === 3 ? { ...c, value: data.brightness } : c));
          }
          if (data.pixelPitch) {
            setSelectedChars(prev => prev.map(c => c.id === 2 ? { ...c, value: data.pixelPitch } : c));
          }
          if (data.viewingDistance) {
            setSelectedChars(prev => prev.map(c => c.id === 1 ? { ...c, value: data.viewingDistance } : c));
          }
          if (data.powerMax) {
            setSelectedChars(prev => prev.map(c => c.id === 5 ? { ...c, value: data.powerMax } : c));
          }
          if (data.powerMin) {
            setSelectedChars(prev => prev.map(c => c.id === 6 ? { ...c, value: data.powerMin } : c));
          }
          if (data.resolution) {
            setSelectedChars(prev => prev.map(c => c.id === 4 ? { ...c, value: data.resolution } : c));
          }
          if (data.dimensions) {
            setLargeurDalle(data.dimensions.width.toString());
            setHauteurDalle(data.dimensions.height.toString());
            setDimensionsEnabled(true);
          }

          if (data.type) {
            setEnvironment(data.type as any);
          }

          if (data.newCharacteristic) {
            const exists = characteristics.some(c => c.name.toLowerCase() === data.newCharacteristic.name.toLowerCase());
            if (!exists) {
              if (aiSettings.autoCreateCharacteristics) {
                const newChar = {
                  id: `char-${Date.now()}`,
                  name: data.newCharacteristic.name,
                  iconName: 'puissance',
                  variants: data.newCharacteristic.variants.map((v: string, i: number) => ({ id: i + 1, value: v, image: null })),
                  options: data.newCharacteristic.variants,
                  color: 'text-blue-400',
                  locked: false,
                  uid: user.uid
                };
                setCharacteristics(prev => [...prev, newChar]);
                setSelectedChars(prev => [...prev, { id: newChar.id, value: data.newCharacteristic.variants[0] }]);
              } else {
                setAiSuggestion(data.newCharacteristic);
              }
            }
          }

          setAnalysisProgress(100);
          setTimeout(() => {
            setIsAnalyzing(false);
            setAnalysisProgress(0);
          }, 500);
        } catch (error) {
          console.error(error);
          setPdfError(error instanceof Error ? error.message : 'Error analyzing PDF.');
          setIsAnalyzing(false);
        }
      };
      reader.readAsDataURL(uploadedPdf);
    } catch (e) {
      console.error(e);
      setPdfError('An error occurred while reading the file.');
      setIsAnalyzing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const url = reader.result as string;
        if (mediaType === 'photo') {
          setUploadedPhoto(file);
          setPhotoUrl(url);
        } else {
          setUploadedVideo(file);
          setVideoUrl(url);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (mediaType === 'photo') {
      setPhotoUrl(e.target.value);
      if (e.target.value) setUploadedPhoto(null);
    } else {
      setVideoUrl(e.target.value);
      if (e.target.value) setUploadedVideo(null);
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      Array.from(e.target.files).forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setGalleryUrls((prev) => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeGalleryImage = (index: number) => {
    setGalleryUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const triggerGalleryUpload = () => {
    galleryFileInputRef.current?.click();
  };

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > aiSettings.pdfMaxSize * 1024 * 1024) {
        setPdfError(`File exceeds the ${aiSettings.pdfMaxSize} MB limit.`);
        setUploadedPdf(null);
      } else if (file.type !== 'application/pdf') {
        setPdfError('Please select a PDF file.');
        setUploadedPdf(null);
      } else {
        setUploadedPdf(file);
        setPdfError('');
      }
    }
  };

  const triggerPdfUpload = () => {
    pdfInputRef.current?.click();
  };

  const currentMediaUrl = mediaType === 'photo' ? photoUrl : videoUrl;
  const currentUploadedFile = mediaType === 'photo' ? uploadedPhoto : uploadedVideo;

  const previewSrc = currentUploadedFile
    ? URL.createObjectURL(currentUploadedFile)
    : (currentMediaUrl || (mediaType === 'photo' ? "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=1000" : ""));

  // Pricing State
  const [prixVente, setPrixVente] = useState<string>('1250');
  const [oldPrice, setOldPrice] = useState<string>('');
  const [isHidden, setIsHidden] = useState<boolean>(false);
  const [prixLocationHeure, setPrixLocationHeure] = useState<string>('');
  const [prixLocationJour, setPrixLocationJour] = useState<string>('');
  const [surfaceMaxLocation, setSurfaceMaxLocation] = useState<string>('');
  const [surfaceMinRequise, setSurfaceMinRequise] = useState<string>('0');
  const [rentalStock, setRentalStock] = useState<string>('');
  const [rentalQuantity, setRentalQuantity] = useState<string>('1');
  const [stock, setStock] = useState<string>('');

  // Ref to track which product ID has already been initialized, preventing
  // the form from re-resetting when characteristics load asynchronously (F5 race condition fix).
  const lastInitializedProductId = useRef<string | null>(undefined as any);

  // Pre-fill form when editing — only re-runs when editingProduct actually changes (by ID).
  // Characteristics are used only for legacy fallback paths; they do NOT trigger re-initialization.
  useEffect(() => {
    const newProductId = editingProduct?.id ?? null;
    // Guard: skip if this product was already initialized (prevents re-init when characteristics arrives)
    if (lastInitializedProductId.current === newProductId) return;
    lastInitializedProductId.current = newProductId;

    if (editingProduct) {
      setProductName(editingProduct.name);

      // Handle mode (convert from old string format if necessary)
      let initialModes: any[] = [];
      if (Array.isArray(editingProduct.mode)) {
        initialModes = editingProduct.mode;
      } else if (editingProduct.mode === 'les deux') {
        initialModes = ['vente', 'location'];
      } else if (editingProduct.mode) {
        initialModes = [editingProduct.mode];
      }

      // Reverse map DB values to UI labels
      setMode(initialModes.map(m => {
        if (m === 'sale') return 'vente';
        if (m === 'rental') return 'location';
        return m;
      }));

      // Handle environment (convert from old string format if necessary)
      let initialTypes: any[] = [];
      if (Array.isArray(editingProduct.type)) {
        initialTypes = editingProduct.type;
      } else if (editingProduct.type) {
        initialTypes = [editingProduct.type];
      }

      // Reverse map DB values to UI labels
      setEnvironment(initialTypes.map(e => {
        if (e === 'indoor') return 'interieur';
        if (e === 'outdoor') return 'exterieur';
        if (e === 'showcase') return 'semi-exterieur';
        return e;
      }));

      setPrixVente(editingProduct.price != null && editingProduct.price !== '' ? String(normalizePrice(editingProduct.price)) : '');
      setOldPrice(editingProduct.oldPrice ? editingProduct.oldPrice.toString() : '');

      // Handle selected characteristics
      if (editingProduct.selectedChars && Array.isArray(editingProduct.selectedChars)) {
        setSelectedChars(editingProduct.selectedChars);
      } else {
        // Fallback for legacy data or if selectedChars is missing
        const initialChars = [];
        if (editingProduct.pitch) {
          const charDef = characteristics.find(c => c.name === 'Pixel pitch');
          if (charDef) initialChars.push({ id: charDef.id, value: editingProduct.pitch });
        }
        if (editingProduct.distance) {
          const charDef = characteristics.find(c => c.name === 'Distance de visionnage');
          if (charDef) initialChars.push({ id: charDef.id, value: editingProduct.distance });
        }
        if (editingProduct.power) {
          const charDef = characteristics.find(c => c.name === 'Puissance maximale');
          if (charDef) initialChars.push({ id: charDef.id, value: editingProduct.power });
        }
        setSelectedChars(initialChars);
      }

      // Initialize distancePitches — always read directly from the product document (single source of truth)
      if (editingProduct.distancePitches) {
        setDistancePitches(editingProduct.distancePitches);
      } else {
        // Fallback mapping for legacy products without distancePitches
        const legacyDist = editingProduct.distance || (editingProduct.selectedChars && Array.isArray(editingProduct.selectedChars) ? editingProduct.selectedChars.find((c: any) => {
          const charDef = characteristics.find(cd => cd.id === c.id);
          return charDef?.name === 'Distance de visionnage';
        })?.value : null);
        const legacyPitch = editingProduct.pitch || (editingProduct.selectedChars && Array.isArray(editingProduct.selectedChars) ? editingProduct.selectedChars.find((c: any) => {
          const charDef = characteristics.find(cd => cd.id === c.id);
          return charDef?.name === 'Pixel pitch';
        })?.value : null);
        
        if (legacyDist && legacyPitch) {
          setDistancePitches({ [legacyDist]: [legacyPitch] });
        } else {
          setDistancePitches({});
        }
      }

      setPhotoUrl(getSafeImageUrl(editingProduct) || '');
      setVideoUrl(editingProduct.videoUrl || '');

      // Auto-switch media type if video exists
      if (editingProduct.videoUrl) {
        setMediaType('video');
      } else {
        setMediaType('photo');
      }

      // Handle PDF (Fiche Technique) - restore saved URL
      setPdfUrl(editingProduct.pdfUrl || '');
      setUploadedPdf(null); // Clear any local file, we use the URL

      // Handle technical/pricing specs
      setPrixLocationHeure(editingProduct.prixLocationHeure || '');
      setPrixLocationJour(editingProduct.prixLocationJour || '');
      setSurfaceMaxLocation(editingProduct.surfaceMaxLocation || '');
      setSurfaceMinRequise(editingProduct.surfaceMinRequise || '0');
      setRentalStock((editingProduct.rentalStock ?? editingProduct.surfaceMaxLocation ?? '').toString());
      setRentalQuantity((editingProduct.rentalQuantity ?? '1').toString());
      setStock((editingProduct.stock ?? '').toString());
      setLargeurDalle(editingProduct.tileWidth?.toString() || editingProduct.largeurDalle || '50');
      setHauteurDalle(editingProduct.tileHeight?.toString() || editingProduct.hauteurDalle || '50');
      setPrixDalle(editingProduct.pricePerTile?.toString() || editingProduct.prixDalle || '20');
      setDimensionsEnabled(!!(editingProduct.dimensionsEnabled || editingProduct.hasDimensions));
      setScreenType(editingProduct.screenType || 'flat');
      setBadges(editingProduct.badges || []);
      setGalleryUrls(editingProduct.galleryUrls || []);
      setDescription(editingProduct.description || '');
      setDescriptionDetaillee(editingProduct.descriptionDetaillee || '');
      setVariants(editingProduct.variants || []);
      setSurface(parseFloat(editingProduct.surfaceMinRequise || '0') || 9.00);
      setIsHidden(!!editingProduct.isHidden);
    } else {
      // Reset form for new product creation
      setProductName('');
      setMode(['vente']);
      setEnvironment(['exterieur']);
      setScreenType('flat');
      setBadges([]);
      setGalleryUrls([]);
      setDescription('');
      setDescriptionDetaillee('');
      setVariants([]);
      setPrixVente('1250');
      setOldPrice('');

      // Reset technical/pricing specs
      setPrixLocationHeure('');
      setPrixLocationJour('');
      setSurfaceMaxLocation('');
      setRentalStock('');
      setRentalQuantity('1');
      setStock('');
      setSurfaceMinRequise('0');
      setLargeurDalle('50');
      setHauteurDalle('50');
      setPrixDalle('20');
      setDimensionsEnabled(false);
      setSurface(9.00);
      setIsHidden(false);

      // Set pinned characteristics by default for new products
      const pinnedChars = characteristics.filter(c => c.isPinned).map(c => ({ id: c.id, value: c.options[0] }));

      // Force add Distance de visionnage and Pixel pitch for new products (required characteristics)
      const requiredCharNames = ['Distance de visionnage', 'Pixel pitch'];
      const existingIds = pinnedChars.map(c => c.id);
      const requiredChars = characteristics.filter(c =>
        requiredCharNames.includes(c.name) && !existingIds.includes(c.id)
      );
      const allChars = [...pinnedChars, ...requiredChars.map(c => ({ id: c.id, value: c.options[0] }))];

      setSelectedChars(allChars);
      setDistancePitches({});
      setPhotoUrl('');
      setVideoUrl('');
      setPdfUrl('');
      setUploadedPhoto(null);
      setUploadedVideo(null);
      setUploadedPdf(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingProduct]); // Only re-init when the product being edited changes, NOT when characteristics loads async

  // Dimensions State
  const [largeurDalle, setLargeurDalle] = useState<string>('50');
  const [hauteurDalle, setHauteurDalle] = useState<string>('50');
  const [prixDalle, setPrixDalle] = useState<string>('20');

  // Tech Specs State (Dynamic)

  const handleSurfaceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) setSurface(val);
  };

  const adjustSurface = (amount: number) => {
    setSurface(prev => Math.max(0, Number((prev + amount).toFixed(2))));
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0f172a] font-sans flex items-center justify-center p-4 overflow-hidden relative">
        {/* Animated Background Gradients */}
        <div className="absolute top-0 -left-4 w-72 h-72 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute top-0 -right-4 w-72 h-72 bg-[#a3e635] rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md relative z-10"
        >
          {/* Logo & Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.8, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              className="w-20 h-20 bg-white shadow-2xl shadow-blue-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6 relative group overflow-hidden"
            >
              <div className="absolute inset-0 bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              <Zap className="w-10 h-10 text-blue-600 group-hover:text-white transition-colors relative z-10" />
            </motion.div>
            <h1 className="text-4xl font-black text-white tracking-tight mb-2">PIXIATECH<span className="text-blue-500">.</span></h1>
            <p className="text-slate-400 font-medium">{t('admin.productManagement.catalogManagement')}</p>
          </div>

          {/* Auth Card */}
          <div className="bg-white/95 backdrop-blur-xl rounded-[40px] p-8 shadow-2xl border border-white/20 relative overflow-hidden">
            <AnimatePresence mode="wait">
              {authView === 'login' && (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-slate-900">{t('admin.productManagement.welcomeTitle')}</h2>
                    <p className="text-slate-500 text-sm">{t('admin.productManagement.welcomeSubtitle')}</p>
                  </div>

                  <div className="space-y-4">
                    <button
                      onClick={handleLogin}
                      disabled={isAuthenticating}
                      className="w-full py-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center gap-3 font-bold text-slate-700 hover:bg-slate-100 transition-all group"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                      </svg>
                      {t('admin.productManagement.continueWithGoogle')}
                    </button>

                    <div className="relative flex items-center justify-center py-2">
                      <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                      <span className="relative bg-white px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('admin.productManagement.orWithEmail')}</span>
                    </div>

                    <form onSubmit={handleEmailLogin} className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">{t('admin.productManagement.professionalEmail')}</label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder={t('admin.productManagement.emailPlaceholder')}
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between ml-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('admin.productManagement.password')}</label>
                          <button
                            type="button"
                            onClick={() => setAuthView('forgot-password')}
                            className="text-[10px] font-bold text-blue-600 hover:text-blue-700"
                          >
                            {t('admin.productManagement.forgotLink')}
                          </button>
                        </div>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                          <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="p-2 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {authError && (
                        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-xs font-medium flex items-center gap-2 border border-red-100">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          {authError}
                        </div>
                      )}

                      <div className="flex items-center gap-2 py-1">
                        <input
                          type="checkbox"
                          id="remember"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="remember" className="text-xs text-slate-500 font-medium cursor-pointer">{t('admin.productManagement.keepMeSignedIn')}</label>
                      </div>

                      <button
                        type="submit"
                        disabled={isAuthenticating}
                        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-[#131E3F] hover:text-white transition-all shadow-xl shadow-slate-900/10 flex items-center justify-center gap-2 group"
                      >
                        {isAuthenticating ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>{t('admin.productManagement.logIn')} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>
                        )}
                      </button>
                    </form>

                    <p className="text-center text-xs text-slate-500 font-medium">
                      {t('admin.productManagement.noAccountYet')}{' '}
                      <button
                        onClick={() => setAuthView('signup')}
                        className="text-blue-600 font-bold hover:underline"
                      >
                        {t('admin.productManagement.createAnAccount')}
                      </button>
                    </p>
                  </div>
                </motion.div>
              )}

              {authView === 'signup' && (
                <motion.div
                  key="signup"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-slate-900">{t('admin.productManagement.requestAccess')}</h2>
                    <p className="text-slate-500 text-sm">{t('admin.productManagement.requestAccessSubtitle')}</p>
                  </div>

                  <form onSubmit={handleEmailSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">{t('admin.productManagement.professionalEmail')}</label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder={t('admin.productManagement.emailPlaceholder')}
                          className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">{t('admin.productManagement.password')}</label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder={t('admin.productManagement.passwordPlaceholder')}
                          className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono"
                          required
                          minLength={8}
                        />
                      </div>
                    </div>

                    {authError && (
                      <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-xs font-medium flex items-center gap-2 border border-red-100">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        {authError}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isAuthenticating}
                      className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-[#131E3F] hover:text-white transition-all shadow-xl shadow-slate-900/10 flex items-center justify-center gap-2"
                    >
                      {isAuthenticating ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        t('admin.productManagement.createAccount')
                      )}
                    </button>
                  </form>

                  <p className="text-center text-xs text-slate-500 font-medium">
                    {t('admin.productManagement.alreadyHaveAccount')}{' '}
                    <button
                      onClick={() => setAuthView('login')}
                      className="text-blue-600 font-bold hover:underline"
                    >
                      {t('admin.productManagement.logIn')}
                    </button>
                  </p>
                </motion.div>
              )}

              {authView === 'forgot-password' && (
                <motion.div
                  key="forgot"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-slate-900">{t('admin.productManagement.forgotPassword')}</h2>
                    <p className="text-slate-500 text-sm">{t('admin.productManagement.forgotPasswordSubtitle')}</p>
                  </div>

                  {resetEmailSent ? (
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="bg-green-50 border border-green-100 rounded-3xl p-6 text-center"
                    >
                      <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Mail className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-bold text-green-800 mb-1">{t('admin.productManagement.emailSent')}</h4>
                      <p className="text-xs text-green-600 mb-6">{t('admin.productManagement.emailSentSubtitle')}</p>
                      <button
                        onClick={() => { setResetEmailSent(false); setAuthView('login'); }}
                        className="text-xs font-bold text-slate-900 hover:underline"
                      >
                        {t('admin.productManagement.backToLogin')}
                      </button>
                    </motion.div>
                  ) : (
                    <form onSubmit={handleResetPassword} className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">{t('admin.productManagement.accountEmail')}</label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder={t('admin.productManagement.emailPlaceholder')}
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            required
                          />
                        </div>
                      </div>

                      {authError && (
                        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-xs font-medium flex items-center gap-2 border border-red-100">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          {authError}
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={isAuthenticating}
                        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-[#131E3F] hover:text-white transition-all shadow-xl shadow-slate-900/10 flex items-center justify-center gap-2"
                      >
                        {isAuthenticating ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          t('admin.productManagement.sendLink')
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setAuthView('login')}
                        className="w-full py-3 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
                      >
                        {t('admin.productManagement.cancel')}
                      </button>
                    </form>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Version Footer */}
          <p className="text-center mt-8 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] opacity-40">
            Aura Admin v3.2 • Pixiatech Ecosystem
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent font-sans text-slate-900">
      <main className="min-h-screen transition-all duration-300">
        <div className="max-w-[1400px] mx-auto p-0 md:p-8">
          {/* Switch espace : Boutique / Configuration guidée */}
          <div className="flex items-center justify-center md:justify-start mb-3">
            <div className="relative flex bg-slate-100/80 p-0.5 rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              {[
                { id: 'boutique', label: 'Boutique', icon: ShoppingCart },
                { id: 'configuration', label: 'Configuration guidée', icon: Settings2 },
              ].map((space) => {
                const isActive = activeSpace === space.id;
                const locked = !!editingProduct;
                return (
                  <button
                    key={space.id}
                    onClick={() => { if (!locked) setActiveSpace(space.id as any); }}
                    className={cn(
                      "relative flex items-center justify-center gap-1.5 md:gap-2 px-3 md:px-5 h-8 text-[9px] md:text-[10px] font-black transition-all z-20 uppercase tracking-widest",
                      isActive ? "text-white" : locked ? "text-slate-300 cursor-not-allowed" : "text-slate-400 hover:text-slate-700"
                    )}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="space-bubble"
                        className="absolute inset-0 z-10 bg-theme-sidebar-active-bg rounded-lg shadow-md border border-theme-sidebar-active-bg"
                        transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                      />
                    )}
                    <space.icon className={cn("w-3 h-3 z-20 transition-colors", isActive ? "text-white" : "text-slate-400")} />
                    <span className="z-20 whitespace-nowrap">{space.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between mb-8">
            <div className="relative flex bg-slate-100/80 p-1 rounded-2xl border border-slate-200 w-full md:w-auto overflow-hidden shadow-sm">
              {[
                { id: 'gestion', label: t('admin.productManagement.managementTitle'), icon: Package },
                { id: 'produit', label: t('admin.productManagement.productFormTitle'), icon: FileText },
                { id: 'caracteristiques', label: t('admin.productManagement.characteristicsTitle'), icon: Settings2 },
              ].map((tab) => {
                const isActive = activePage === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handlePageChange(tab.id as any)}
                    className={cn(
                      "relative flex-1 md:flex-none flex items-center justify-center gap-2 md:gap-3 px-2 md:px-6 h-10 text-[10px] md:text-xs font-bold transition-all z-20 uppercase tracking-tighter md:tracking-widest",
                      isActive ? "text-theme-sidebar-active-text" : "text-slate-400 hover:text-slate-700"
                    )}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="nav-bubble"
                        className="absolute inset-0 z-10 bg-theme-sidebar-active-bg rounded-xl shadow-lg border border-theme-sidebar-active-bg"
                        transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                      />
                    )}
                    <tab.icon className={cn("w-4 h-4 z-20 transition-colors", isActive ? "text-theme-sidebar-active-text" : "text-slate-400")} />
                    <span className="z-20 hidden md:inline-block whitespace-nowrap">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Sync button — only visible when authenticated */}
            {user && (
              <button
                onClick={async () => {
                  setIsSyncing(true);
                  try {
                    const productsSnap = await getDocs(collection(db, 'products'));
                    const charsSnap = await getDocs(collection(db, 'characteristics'));
                    setProducts(productsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any);
                    setCharacteristics(charsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any);
                    toast({
                      title: '✅ Synchronisé',
                      description: `${productsSnap.size} produit(s) · ${charsSnap.size} caractéristique(s)`,
                      variant: 'success',
                    });
                  } catch (e: any) {
                    toast({
                      title: '❌ Erreur',
                      description: e.message,
                      variant: 'destructive',
                    });
                  } finally {
                    setIsSyncing(false);
                  }
                }}
                title="Synchroniser avec la base de données"
                className="flex items-center gap-2 px-4 h-10 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-all shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span className="hidden md:inline">Synchronisation</span>
              </button>
            )}
          </div>

          <AnimatePresence mode="popLayout" custom={pageDirection}>
            {activePage === 'gestion' && (
              <motion.div
                key="gestion"
                custom={pageDirection}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                className="w-full"
              >
                <GestionProduits
                  products={products}
                  setProducts={setProducts}
                  onAddProduct={() => { setEditingProduct(null); setActivePage('produit'); }}
                  onEditProduct={(product) => { setEditingProduct(product); setActivePage('produit'); }}
                  onDuplicateProduct={handleDuplicateProduct}
                  onDeleteProduct={handleDeleteProduct}
                  onBulkDelete={handleBulkDeleteProducts}
                  t={t}
                />
              </motion.div>
            )}

            {activePage === 'caracteristiques' && (
              <motion.div
                key="caracteristiques"
                custom={pageDirection}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                className="w-full"
              >
                <CaracteristiquesPage
                  onBack={() => handlePageChange('produit')}
                  characteristics={characteristics}
                  setCharacteristics={setCharacteristics}
                  user={user}
                  collectionName={charCol}
                />
              </motion.div>
            )}

            {activePage === 'produit' && (
              <motion.div
                key={`produit-${activeSpace}`}
                custom={pageDirection}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                className="w-full"
              >
                <ProduitPage
                  editingProduct={editingProduct}
                  setEditingProduct={setEditingProduct}
                  productName={productName}
                  setProductName={setProductName}
                  mode={mode}
                  setMode={setMode}
                  environment={environment}
                  setEnvironment={setEnvironment}
                  surface={surface}
                  setSurface={setSurface}
                  selectedChars={selectedChars}
                  setSelectedChars={setSelectedChars}
                  characteristics={characteristics}
                  setCharacteristics={setCharacteristics}
                  prixVente={prixVente}
                  setPrixVente={setPrixVente}
                  oldPrice={oldPrice}
                  setOldPrice={setOldPrice}
                  prixLocationHeure={prixLocationHeure}
                  setPrixLocationHeure={setPrixLocationHeure}
                  prixLocationJour={prixLocationJour}
                  setPrixLocationJour={setPrixLocationJour}
                  surfaceMaxLocation={surfaceMaxLocation}
                  setSurfaceMaxLocation={setSurfaceMaxLocation}
                  rentalStock={rentalStock}
                  setRentalStock={setRentalStock}
                  stock={stock}
                  setStock={setStock}
                  surfaceMinRequise={surfaceMinRequise}
                  setSurfaceMinRequise={setSurfaceMinRequise}
                  dimensionsEnabled={dimensionsEnabled}
                  setDimensionsEnabled={setDimensionsEnabled}
                  largeurDalle={largeurDalle}
                  setLargeurDalle={setLargeurDalle}
                  hauteurDalle={hauteurDalle}
                  setHauteurDalle={setHauteurDalle}
                  prixDalle={prixDalle}
                  setPrixDalle={setPrixDalle}
                  mediaType={mediaType}
                  setMediaType={setMediaType}
                  previewSrc={previewSrc}
                  uploadedPhoto={uploadedPhoto}
                  setUploadedPhoto={setUploadedPhoto}
                  photoUrl={photoUrl}
                  setPhotoUrl={setPhotoUrl}
                  uploadedVideo={uploadedVideo}
                  setUploadedVideo={setUploadedVideo}
                  videoUrl={videoUrl}
                  setVideoUrl={setVideoUrl}
                  currentMediaUrl={currentMediaUrl}
                  uploadedPdf={uploadedPdf}
                  setUploadedPdf={setUploadedPdf}
                  pdfUrl={pdfUrl}
                  setPdfUrl={setPdfUrl}
                  isHidden={isHidden}
                  setIsHidden={setIsHidden}
                  handleSaveProduct={handleSaveProduct}
                  setActivePage={handlePageChange}
                  user={user}
                  isSaving={isSaving}
                  aiSettings={aiSettings}
                  setAiSettings={setAiSettings}
                   handleFileChange={handleFileChange}
                   handleUrlChange={handleUrlChange}
                   triggerUpload={triggerUpload}
                   handleGalleryUpload={handleGalleryUpload}
                   removeGalleryImage={removeGalleryImage}
                   triggerGalleryUpload={triggerGalleryUpload}
                   galleryUrls={galleryUrls}
                   setGalleryUrls={setGalleryUrls}
                   galleryFileInputRef={galleryFileInputRef}
                   handlePdfChange={handlePdfChange}
                  triggerPdfUpload={triggerPdfUpload}
                  handleSurfaceChange={handleSurfaceChange}
                  adjustSurface={adjustSurface}
                  fileInputRef={fileInputRef}
                  pdfInputRef={pdfInputRef}
                  showCharPanel={showCharPanel}
                  setShowCharPanel={setShowCharPanel}
                  tempSelectedChars={tempSelectedChars}
                  setTempSelectedChars={setTempSelectedChars}
                  setCharPanelSearch={setCharPanelSearch}
                  availableChars={availableChars}
                  handleAIAnalysis={handleAIAnalysis}
                  isAnalyzing={isAnalyzing}
                  analysisProgress={analysisProgress}
                  pdfError={pdfError}
                  setIsAISettingsOpen={setIsAISettingsOpen}
                   screenType={screenType}
                   setScreenType={setScreenType}
                   badges={badges}
                   setBadges={setBadges}
                   description={description}
                   setDescription={setDescription}
                   descriptionDetaillee={descriptionDetaillee}
                   setDescriptionDetaillee={setDescriptionDetaillee}
                    ficheTab={ficheTab}
                    setFicheTab={setFicheTab}
                    variants={variants}
                    setVariants={setVariants}
                     distancePitches={distancePitches}
                    setDistancePitches={setDistancePitches}
                     wizardSettings={wizardSettings}
                     activeSpace={activeSpace}
                  />
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {aiSuggestion && (
              <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="bg-white rounded-3xl p-8 w-full max-w-md relative z-10 shadow-2xl border border-slate-200 text-center"
                >
                  <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Zap className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">New characteristic detected!</h3>
                  <p className="text-slate-500 mb-6">
                    AI detected a characteristic: <span className="font-bold text-slate-900">"{aiSuggestion.name}"</span>.
                    Add it with the following variants: <span className="italic">{aiSuggestion.variants.join(', ')}</span>?
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setAiSuggestion(null)}
                      className="flex-1 py-3.5 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                    >
                      Ignore
                    </button>
                    <button
                      onClick={() => {
                        const newChar = {
                          id: Date.now(),
                          name: aiSuggestion.name,
                          options: aiSuggestion.variants,
                          icon: Settings2,
                          color: 'text-blue-400',
                          border: 'focus:border-blue-400'
                        };
                        setCharacteristics(prev => [...prev, newChar]);
                        setSelectedChars(prev => [...prev, { id: newChar.id, value: newChar.options[0] }]);
                        setAiSuggestion(null);
                      }}
                      className="flex-1 py-3.5 bg-theme-sidebar-active-bg text-theme-sidebar-active-text rounded-xl font-bold hover:opacity-90 transition-colors shadow-lg"
                    >
                      Yes, add
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          <AISettingsSheet
            isOpen={isAISettingsOpen}
            onClose={() => setIsAISettingsOpen(false)}
            settings={aiSettings}
            onSave={handleSaveSettings}
          />

          <AnimatePresence>
            {showCharPanel && (
              <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowCharPanel(false)}
                  className="absolute inset-0 bg-black/80 backdrop-blur-md"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 40 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 40 }}
                  className="bg-white rounded-[2.5rem] w-full max-w-2xl relative z-10 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
                >
                  {/* Header */}
                  <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div>
                      <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Add characteristics</h3>
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">SELECT ITEMS TO ADD TO THE SHEET</p>
                    </div>
                    <button onClick={() => setShowCharPanel(false)} className="p-3 bg-white hover:bg-slate-100 rounded-2xl transition-colors shadow-sm">
                      <X className="w-5 h-5 text-slate-500" />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="flex-1 overflow-y-auto p-8">
                    {/* Search bar */}
                    <div className="relative mb-6">
                      <input
                        type="text"
                        value={charPanelSearch}
                        onChange={e => setCharPanelSearch(e.target.value)}
                        placeholder={t('admin.productManagement.searchCharacteristic')}
                        className="w-full pl-10 pr-10 py-3 text-sm border-2 border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white transition-all text-slate-800 placeholder:text-slate-400 font-bold"
                      />
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      {charPanelSearch && (
                        <button onClick={() => setCharPanelSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {availableChars.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                          <Settings2 className="w-8 h-8 text-slate-200" />
                        </div>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">{t('admin.productManagement.allAlreadyAdded')}</p>
                      </div>
                    ) : (
                      <>
                        {/* Select All header */}
                        {filteredAvailableChars.length > 0 && (
                          <div className="flex items-center justify-between mb-4 px-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                              {t('admin.productManagement.nAvailable', { n: filteredAvailableChars.length })}
                            </p>
                            <button
                              onClick={() => {
                                const allFilteredIds = filteredAvailableChars.map(c => c.id);
                                const allSelected = allFilteredIds.every(id => tempSelectedChars.includes(id));
                                if (allSelected) {
                                  setTempSelectedChars(prev => prev.filter(id => !allFilteredIds.includes(id)));
                                } else {
                                  setTempSelectedChars(prev => {
                                    const existing = new Set(prev);
                                    allFilteredIds.forEach(id => existing.add(id));
                                    return Array.from(existing);
                                  });
                                }
                              }}
                              className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-800 transition-colors"
                            >
                              {filteredAvailableChars.every(c => tempSelectedChars.includes(c.id)) ? t('admin.productManagement.deselectAll') : t('admin.productManagement.selectAll')}
                            </button>
                          </div>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {filteredAvailableChars.map((char: any) => {
                            const isSelected = tempSelectedChars.includes(char.id);
                            const Icon = getIcon(char.iconName);
                            return (
                              <button
                                key={char.id}
                                onClick={() => {
                                  setTempSelectedChars(prev =>
                                    prev.includes(char.id)
                                      ? prev.filter(id => id !== char.id)
                                      : [...prev, char.id]
                                  );
                                }}
                                className={cn(
                                  "flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left group",
                                  isSelected
                                    ? "bg-theme-sidebar-active-bg border-theme-sidebar-active-bg shadow-xl"
                                    : "bg-slate-50 border-slate-100 hover:border-slate-200 hover:bg-white"
                                )}
                              >
                                <div className={cn(
                                  "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                                  isSelected ? "bg-white/10" : "bg-white shadow-sm"
                                )}>
                                  <Icon className={cn("w-6 h-6", isSelected ? "text-theme-sidebar-active-text" : "text-slate-400")} />
                                </div>
                                <div>
                                  <div className={cn("text-xs font-black uppercase tracking-widest mb-0.5", isSelected ? "text-theme-sidebar-active-text" : "text-slate-900")}>
                                    {char.name}
                                  </div>
                                  <div className={cn("text-[10px] font-bold", isSelected ? "text-theme-sidebar-active-text/40" : "text-slate-400")}>
                                    {t('admin.productManagement.optionsAvailable', { n: char.options.length })}
                                  </div>
                                </div>
                                {isSelected && (
                                  <div className="ml-auto w-6 h-6 bg-theme-sidebar-active-bg rounded-full flex items-center justify-center shadow-lg border border-white/20">
                                    <Check className="w-4 h-4 text-theme-sidebar-active-text" />
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {t('admin.productManagement.nSelected', { n: tempSelectedChars.length })}
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowCharPanel(false)}
                        className="px-6 h-12 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-slate-900 transition-colors"
                      >
                        {t('admin.productManagement.cancel')}
                      </button>
                      <button
                        disabled={tempSelectedChars.length === 0}
                        onClick={() => {
                          const newChars = tempSelectedChars.map(id => {
                            const char = characteristics.find(c => c.id === id);
                            return { id: char.id, value: char.options[0] };
                          });
                          setSelectedChars(prev => [...prev, ...newChars]);
                          setShowCharPanel(false);
                          setTempSelectedChars([]);
                        }}
                        className="px-8 h-12 bg-theme-sidebar-active-bg text-theme-sidebar-active-text rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-black/20 hover:opacity-90 transition-all disabled:opacity-30 flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4 text-theme-sidebar-active-text" /> {t('admin.productManagement.addToSheet')}
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
