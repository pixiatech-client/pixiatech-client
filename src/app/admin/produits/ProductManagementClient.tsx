"use client";
import { GoogleGenAI } from "@google/genai";
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import {
  Activity, Cpu, Layers, Smartphone, Tv,
  Package, FileText, Search, Plus, ShoppingCart, Calendar,
  Monitor, Sun, Store, Eye, Grid, ChevronLeft, ChevronDown, ChevronUp,
  ChevronRight, Zap, Maximize, SunMedium, PlusCircle, Camera, Image as ImageIcon,
  Video, Play, Upload, Trash2, ArrowLeft, ArrowRight, Link as LinkIcon, Tag, ChevronsUpDown, AlertTriangle,
  Settings2, Info, Save, Check, X, MoreVertical, Edit2, Copy, GripVertical, Filter, ArrowUpDown, Sparkles, Brain, Globe, ShieldCheck, Zap as ZapIcon, LogOut, LogIn, RefreshCw,
  Mail, Lock, Unlock, Phone, UserPlus, EyeOff, Users, Truck, Wrench, History, User as UserIcon, List, Settings, Hammer, Pin
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Pagination } from '@/components/ui/Pagination';
import { CustomSelect } from '@/components/ui/custom-select';
import useEmblaCarousel from 'embla-carousel-react';
import {
  auth, db, storage, googleProvider, signInWithPopup, signOut, onAuthStateChanged, User,
  signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, setPersistence, browserLocalPersistence, browserSessionPersistence,
  collection, doc, setDoc, getDoc, getDocs, deleteDoc, onSnapshot, query, where, orderBy, addDoc, updateDoc,
  ref, uploadBytes, getDownloadURL, deleteObject
} from './firebase';

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
              <h4 className="text-white font-black text-lg mb-1 leading-tight uppercase">Supprimer ?</h4>

              <div className="flex items-center gap-4 w-full mt-8">
                <button
                  onClick={(e) => { e.stopPropagation(); setDeletingId(null); }}
                  className="flex-1 py-4 text-[10px] font-black text-white bg-white/10 rounded-2xl uppercase tracking-widest active:bg-white/20"
                >
                  Non
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
                  Oui
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
                <div className="bg-[#c6ff00] px-3 py-1.5 rounded-lg text-[9px] font-black text-slate-900 shadow-lg border border-white/20">
                  <p className="opacity-50 uppercase leading-none mb-0.5">Pitch</p>
                  <p className="leading-none">{pitchChar?.value || product.pitch || '—'}</p>
                </div>
                <div className="bg-[#c6ff00] px-3 py-1.5 rounded-xl text-[9px] font-black text-slate-900 shadow-lg border border-white/20">
                  <p className="opacity-50 uppercase leading-none mb-0.5">Distance</p>
                  <p className="leading-none">{distanceChar?.value || product.distance || '—'}</p>
                </div>
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
              if (val.includes('vente') || val.includes('sale')) { label = 'Achat'; colors = "bg-emerald-50 text-emerald-700 border-emerald-100"; }
              else if (val.includes('location') || val.includes('rental')) { label = 'Location'; colors = "bg-violet-50 text-violet-700 border-violet-100"; }
              return (
                <div key={`mode-${idx}`} className={cn("px-3 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-widest", colors)}>
                  {label}
                </div>
              );
            })}

            {/* Screen Type Badge */}
            {product.screenType && (
              <div className={cn(
                "px-3 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-widest",
                product.screenType === '360' ? "bg-purple-50 text-purple-700 border-purple-100" :
                product.screenType === 'curved' ? "bg-blue-50 text-blue-700 border-blue-100" : "bg-slate-50 text-slate-500 border-slate-100"
              )}>
                {product.screenType === '360' ? '360°' : product.screenType === 'curved' ? 'Incurvé' : 'Plat'}
              </div>
            )}
          </div>

          <div className="flex flex-wrap justify-center gap-1.5">
            {/* Environment Badges */}
            {Array.from(new Set((Array.isArray(product.type) ? product.type : [product.type]).filter(Boolean))).map((t: any, idx: number) => {
              const val = String(t).toLowerCase();
              let label = t;
              let colors = "bg-slate-50 text-slate-500 border-slate-100";

              if (val.includes('interieur') || val.includes('indoor')) { label = 'Intérieur'; colors = "bg-purple-50 text-purple-700 border-purple-100"; }
              else if (val.includes('exterieur') || val.includes('outdoor')) { label = 'Extérieur'; colors = "bg-orange-50 text-orange-700 border-orange-100"; }
              else if (val.includes('vitrine') || val.includes('showcase') || val.includes('semi')) { label = 'Vitrine'; colors = "bg-cyan-50 text-cyan-700 border-cyan-100"; }

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
              {product.oldPrice} €
            </span>
          )}
          <span className="text-3xl font-black text-slate-900 tracking-tighter">
            {product.salePricePerSqM || product.price || '—'}
          </span>
        </div>
      </div>
    </div>
  );
});


const ProductActionsDrawer = ({ isOpen, onClose, product, onEdit, onDuplicate, onDelete, children, title }: any) => {
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
                    <span className="font-black text-xs uppercase tracking-widest">Modifier</span>
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => { onDuplicate(product); onClose(); }} className="w-full flex items-center gap-4 p-4 bg-slate-50 rounded-xl text-slate-900 active:bg-black active:text-white transition-all">
                    <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center"><Copy className="w-4 h-4" /></div>
                    <span className="font-black text-xs uppercase tracking-widest">Dupliquer</span>
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => { onDelete(product.id); onClose(); }} className="w-full flex items-center gap-4 p-4 bg-red-50 rounded-xl text-red-600 active:bg-red-600 active:text-white transition-all">
                    <div className="w-8 h-8 bg-red-100 text-red-600 rounded-lg flex items-center justify-center"><Trash2 className="w-4 h-4" /></div>
                    <span className="font-black text-xs uppercase tracking-widest">Supprimer</span>
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
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      key={product.id}
      value={product}
      dragListener={false}
      dragControls={dragControls}
      whileDrag={{
        scale: 1.02,
        backgroundColor: "rgb(255, 255, 255)",
        zIndex: 100,
        boxShadow: "0 25px 50px -12px rgb(0 0 0 / 0.15)"
      }}
      className={cn(
        "bg-theme-card border rounded-2xl p-4 flex items-center gap-4 shadow-sm transition-all group/product relative overflow-hidden hover:bg-theme-sidebar-active-bg hover:border-theme-sidebar-active-bg hover:-translate-y-1 hover:shadow-2xl dark:bg-theme-card/5 dark:border-theme-card-border",
        selectedIds.includes(product.id) ? "border-theme-sidebar-active-bg ring-1 ring-theme-sidebar-active-bg" : "border-theme-card-border"
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
          className="text-slate-300 group-hover/product:text-[#a3e635] transition-colors cursor-grab active:cursor-grabbing p-1"
          onPointerDown={(e) => dragControls.start(e)}
        >
          <GripVertical className="w-5 h-5" />
        </div>
      </div>

      <div className="w-16 h-16 rounded-xl overflow-hidden bg-white shrink-0 shadow-sm border border-slate-100 flex items-center justify-center relative group-hover/product:border-slate-800 transition-colors">
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
          <h3 className="font-bold text-slate-900 dark:text-zinc-100 group-hover/product:text-slate-900 transition-colors truncate flex items-center gap-1.5">
            {product.name}
            {product.isHidden && (
              <span title="Produit masqué" className="text-orange-500 shrink-0">
                <EyeOff className="w-3.5 h-3.5 animate-pulse" />
              </span>
            )}
          </h3>
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            {/* Environment Badges */}
            {Array.from(new Set((Array.isArray(product.type) ? product.type : [product.type]).filter(Boolean))).map((t: any, idx: number) => {
              const val = String(t).toLowerCase();
              let label = t;
              let colors = "bg-slate-100 text-slate-600";

              if (val.includes('interieur') || val.includes('indoor')) { label = 'Intérieur'; colors = "bg-purple-100 text-purple-700 border-purple-200"; }
              else if (val.includes('exterieur') || val.includes('outdoor')) { label = 'Extérieur'; colors = "bg-orange-100 text-orange-700 border-orange-200"; }
              else if (val.includes('vitrine') || val.includes('showcase') || val.includes('semi')) { label = 'Vitrine'; colors = "bg-cyan-100 text-cyan-700 border-cyan-200"; }

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

              if (val.includes('vente') || val.includes('sale')) { label = 'Achat'; colors = "bg-emerald-100 text-emerald-700 border-emerald-200"; }
              else if (val.includes('location') || val.includes('rental')) { label = 'Location'; colors = "bg-violet-100 text-violet-700 border-violet-200"; }

              return (
                <span key={`mode-${idx}`} className={cn("text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border transition-colors", colors)}>
                  {label}
                </span>
              );
            })}

            {/* Screen Type Badge */}
            {product.screenType && (
              <span className={cn(
                "text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border transition-colors",
                product.screenType === '360' ? "bg-purple-100 text-purple-700 border-purple-200" :
                product.screenType === 'curved' ? "bg-blue-100 text-blue-700 border-blue-200" : "bg-slate-100 text-slate-500 border-slate-200"
              )}>
                {product.screenType === '360' ? '360°' : product.screenType === 'curved' ? 'Incurvé' : 'Plat'}
              </span>
            )}
          </div>
        </div>

        <div className="hidden md:flex flex-col gap-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase group-hover/product:text-slate-900/40">Pitch</span>
          <span className="text-sm font-medium text-slate-700 dark:text-zinc-300 group-hover/product:text-slate-900">{product.pitch || '—'}</span>
        </div>

        <div className="hidden md:flex flex-col gap-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase group-hover/product:text-slate-900/40">Distance</span>
          <span className="text-sm font-medium text-slate-700 dark:text-zinc-300 group-hover/product:text-slate-900">{product.distance || '—'}</span>
        </div>

        <div className="hidden md:flex flex-col gap-1 items-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase group-hover/product:text-slate-900/40">Vente /m²</span>
          <span className="text-sm font-bold text-slate-900 dark:text-zinc-100 group-hover/product:text-slate-900 transition-colors duration-300">
            {product.oldPrice && (
              <span className="text-xs font-semibold text-orange-500 line-through mr-1.5">{product.oldPrice} €</span>
            )}
            {product.salePricePerSqM || product.price || '—'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={(e) => { e.stopPropagation(); onEditProduct(product); }}
          className="p-2 text-slate-400 hover:text-[#a3e635] transition-colors"
          title="Modifier"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDuplicateProduct(product); }}
          className="p-2 text-blue-500 hover:text-blue-400 transition-colors"
          title="Dupliquer"
        >
          <Copy className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); setDeletingId(product.id); }}
          className="p-2 text-slate-400 hover:text-red-500 transition-colors"
          title="Supprimer"
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
                <h4 className="text-white font-bold text-sm">Supprimer ce produit ?</h4>
                <p className="text-red-100 text-[10px] uppercase font-bold tracking-wider">Cette action est irréversible</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 text-xs font-bold text-white hover:bg-white/10 rounded-xl transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  onDeleteProduct(product.id);
                  setDeletingId(null);
                }}
                className="px-4 py-2 text-xs font-bold bg-white text-red-600 rounded-xl hover:bg-red-50 transition-all shadow-lg"
              >
                Supprimer
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Reorder.Item>
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


// --- Composant NumberInput Personnalisé ---
const NumberInput = ({ value, onChange, placeholder, className, isDark, compact, colorTheme = 'default' }: { value: string, onChange: (val: string) => void, placeholder?: string, className?: string, isDark?: boolean, compact?: boolean, colorTheme?: 'default' | 'orange' | 'cyan' }) => {
  const handleIncrement = () => {
    const val = parseFloat(value) || 0;
    onChange((val + 1).toString());
  };
  const handleDecrement = () => {
    const val = parseFloat(value) || 0;
    onChange(Math.max(0, val - 1).toString());
  };

  return (
    <div className="relative">
      <input
        type="number"
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

// --- Composant Paramètres IA ---
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
                  <h2 className="text-lg font-bold text-slate-900">Configuration IA</h2>
                  <p className="text-xs text-slate-500">Paramètres d'analyse et d'extraction</p>
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
                    <div className="text-sm font-bold text-slate-900">Activer l'IA</div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Analyse automatique</div>
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
                    <Globe className="w-3 h-3" /> Fournisseur
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
                    <ShieldCheck className="w-3 h-3" /> Clé API
                  </label>
                  <div className="relative">
                    <input
                      type={showApiKey ? "text" : "password"}
                      value={localSettings.apiKey}
                      onChange={e => setLocalSettings(prev => ({ ...prev, apiKey: e.target.value }))}
                      onBlur={() => fetchModels(localSettings.provider, localSettings.apiKey)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pr-12 text-sm font-medium focus:outline-none focus:border-slate-900 transition-colors"
                      placeholder={`Entrez votre clé ${localSettings.provider}`}
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

                {/* Modèle */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    <ZapIcon className="w-3 h-3" /> Modèle
                  </label>
                  <div className="relative">
                    <CustomSelect
                      options={models.map(m => ({ value: m, label: m }))}
                      value={localSettings.model}
                      onChange={val => setLocalSettings(prev => ({ ...prev, model: val }))}
                      placeholder="Sélectionnez un modèle"
                      className="w-full"
                    />
                    {isLoadingModels && (
                      <div className="absolute right-12 top-1/2 -translate-y-1/2 pointer-events-none">
                        <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Paramètres Avancés */}
                <div className="pt-4 border-t border-slate-100 space-y-6">
                  <h3 className="text-sm font-bold text-slate-900">Paramètres Avancés</h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Max Tokens</label>
                      <input
                        type="number"
                        value={localSettings.maxTokens}
                        onChange={e => setLocalSettings(prev => ({ ...prev, maxTokens: parseInt(e.target.value) }))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Taille PDF (MB)</label>
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
                        <div className="text-xs font-bold text-slate-900">Auto-création</div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Caractéristiques</div>
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
                {testStatus === 'testing' ? 'Test...' : testStatus === 'success' ? 'Connexion OK' : testStatus === 'error' ? 'Erreur' : 'Tester l\'IA'}
              </button>
              <button
                onClick={() => { onSave(localSettings); onClose(); }}
                className="flex-[2] bg-slate-900 text-white py-3.5 rounded-xl text-sm font-bold hover:bg-theme-sidebar-active-bg hover:text-theme-sidebar-active-text transition-all shadow-lg shadow-slate-200 flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" /> Sauvegarder
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Icône Minus manquante dans les imports, on la recrée ici ou on l'importe
const Minus = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14" /></svg>
);

const ICON_LIBRARY = [
  { name: 'écran', icon: Monitor },
  { name: 'distance', icon: Eye },
  { name: 'puissance', icon: Zap },
  { name: 'luminosité', icon: SunMedium },
  { name: 'pixel', icon: Grid },
  { name: 'résolution', icon: Maximize },
  { name: 'paramètres', icon: Settings2 },
  { name: 'activité', icon: Activity },
  { name: 'processeur', icon: Cpu },
  { name: 'couches', icon: Layers },
  { name: 'mobile', icon: Smartphone },
  { name: 'télévision', icon: Tv },
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
  user
}: {
  onBack: () => void,
  characteristics: any[],
  setCharacteristics: React.Dispatch<React.SetStateAction<any[]>>,
  user: any
}) => {
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
  const [prevCharPage, setPrevCharPage] = useState(1);
  const charItemsPerPage = 6;

  const totalCharPages = Math.ceil(characteristics.length / charItemsPerPage);
  const paginatedChars = characteristics.slice((charPage - 1) * charItemsPerPage, charPage * charItemsPerPage);
  const charDirection = charPage >= prevCharPage ? 1 : -1;

  const colors = [
    { name: 'Bleu', class: 'text-blue-400', bg: 'bg-blue-400' },
    { name: 'Violet', class: 'text-purple-400', bg: 'bg-purple-400' },
    { name: 'Orange', class: 'text-orange-400', bg: 'bg-orange-400' },
    { name: 'Jaune', class: 'text-yellow-400', bg: 'bg-yellow-400' },
    { name: 'Rouge', class: 'text-red-400', bg: 'bg-red-400' },
    { name: 'Vert', class: 'text-green-400', bg: 'bg-green-400' },
    { name: 'Cyan', class: 'text-cyan-400', bg: 'bg-cyan-400' },
    { name: 'Rose', class: 'text-pink-400', bg: 'bg-pink-400' },
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
      alert("Cette caractéristique est verrouillée et ne peut pas être supprimée.");
      return;
    }
    if (char?.name === 'Distance de visionnage' || char?.name === 'Pixel pitch') {
      alert("Cette caractéristique est obligatoire et verrouillée et ne peut pas être supprimée.");
      return;
    }
    await deleteDoc(doc(db, "characteristics", id));
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
        title: "Connexion requise",
        description: "Vous devez être connecté pour enregistrer une caractéristique.",
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
        iconName: ICON_LIBRARY.find(i => i.icon === selectedIcon)?.name || 'paramètres',
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
        await updateDoc(doc(db, "characteristics", editingId), charData);
      } else {
        await addDoc(collection(db, "characteristics"), charData);
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

  const handleSeedExamples = () => {
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
                  <h3 className="text-xl font-bold text-slate-900">Choisir une icône</h3>
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
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Ou téléverser une icône personnalisée</label>
                    <input
                      type="file"
                      id="custom-icon-upload"
                      className="hidden"
                      accept="image/*"
                      onChange={handleCustomIconUpload}
                    />
                    <label
                      htmlFor="custom-icon-upload"
                      className="flex items-center justify-center gap-2 w-full py-3 bg-slate-50 border border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-theme-sidebar-active-bg hover:text-theme-sidebar-active-text transition-all text-sm font-bold text-slate-600 group"
                    >
                      <Upload className="w-4 h-4 group-hover:text-[#a3e635] transition-colors" /> Téléverser une icône
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
                <Tag className="w-4 h-4 text-slate-500" /> Caractéristiques disponibles ({characteristics.length})
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
                          await setDoc(doc(db, "characteristics", finalId), {
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
                    toast({ title: "Synchronisation", description: "Les réglages Pixiatech et le Wizard ont été synchronisés." });
                  }}
                  className="w-10 h-10 flex items-center justify-center bg-blue-50 text-blue-600 rounded-full hover:bg-theme-sidebar-active-bg hover:text-theme-sidebar-active-text transition-all shadow-sm group mr-2"
                  title="Rétablir les réglages Pixiatech"
                >
                  <RefreshCw className="w-5 h-5 transition-colors group-hover:text-[#a3e635]" />
                </button>
                <button
                  onClick={() => {
                    setPrevCharPage(charPage);
                    setCharPage(prev => Math.max(prev - 1, 1));
                  }}
                  disabled={charPage === 1}
                  className="w-10 h-10 flex items-center justify-center bg-slate-100 text-slate-500 rounded-full hover:bg-theme-sidebar-active-bg hover:text-theme-sidebar-active-text transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm group"
                >
                  <ChevronLeft className="w-5 h-5 transition-colors group-hover:text-[#0078ff]" />
                </button>
                <button
                  onClick={() => {
                    setPrevCharPage(charPage);
                    setCharPage(prev => Math.min(prev + 1, totalCharPages));
                  }}
                  disabled={charPage === totalCharPages || totalCharPages === 0}
                  className="w-10 h-10 flex items-center justify-center bg-slate-100 text-slate-500 rounded-full hover:bg-theme-sidebar-active-bg hover:text-theme-sidebar-active-text transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm group"
                >
                  <ChevronRight className="w-5 h-5 transition-colors group-hover:text-[#0078ff]" />
                </button>
              </div>
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
                            : "border-theme-card-border hover:bg-theme-sidebar-active-bg hover:border-theme-sidebar-active-bg",
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
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                          {(char.locked || ['Pixel pitch', 'Distance de visionnage'].includes(char.name)) && (
                            <div className="p-2 text-slate-300 group-hover:text-white/20 cursor-not-allowed" title="Caractéristique système (Verrouillée)">
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
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Caractéristique enregistrée !</h3>
                    <p className="text-slate-500 text-sm mb-8 max-w-sm">
                      La caractéristique "{name}" a été {editingId ? 'modifiée' : 'ajoutée'} avec succès.
                    </p>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={handleReset}
                        className="px-6 h-10 bg-white border border-slate-200 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4" /> Créer une nouvelle
                      </button>
                      <button
                        onClick={() => setIsSaved(false)}
                        className="px-6 h-10 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg flex items-center justify-center gap-2 group"
                      >
                        <Edit2 className="w-4 h-4 group-hover:text-[#a3e635] transition-colors" /> Continuer l'édition
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <h3 className="text-sm font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-slate-500" />
                {editingId ? 'Modifier la caractéristique' : 'Créer une caractéristique'}
              </h3>

              <div className="space-y-6">
                {/* Icône et Nom */}
                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="shrink-0">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Icône</label>
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
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Nom de la caractéristique</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={editingId && ['Pixel pitch', 'Distance de visionnage'].includes(characteristics.find(c => c.id === editingId)?.name)}
                      placeholder="Ex: Distance de visionnage, Pixel pitch..."
                      className={cn(
                        "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all",
                        editingId && ['Pixel pitch', 'Distance de visionnage'].includes(characteristics.find(c => c.id === editingId)?.name) && "opacity-60 cursor-not-allowed"
                      )}
                    />
                  </div>
                </div>

                {/* Options Additionnelles : Verrouillage & Épinglage */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2 rounded-xl bg-white shadow-sm border border-slate-200", isLocked ? "text-orange-500" : "text-slate-400")}>
                        {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900">Verrouiller</div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider">Empêcher suppression</div>
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
                        <div className="text-sm font-bold text-slate-900">Épingler</div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider">Ajout par défaut</div>
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
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3 block">Couleur de l'icône</label>
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
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3 block">Variantes de la caractéristique</label>

                  <div className="space-y-3">
                    {variants.map((variant) => (
                      <div key={variant.id} className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <div className="flex-1">
                          <input
                            type="text"
                            value={variant.value}
                            onChange={(e) => updateVariant(variant.id, 'value', e.target.value)}
                            placeholder="Ex: 2 mètres, 4 mètres..."
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                          />
                        </div>

                        {/* Image Upload for Variant */}
                        <div className="shrink-0 relative group">
                          <input
                            type="file"
                            id={`variant-image-${variant.id}`}
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(variant.id, e)}
                          />
                          <label
                            htmlFor={`variant-image-${variant.id}`}
                            className={cn(
                              "flex items-center justify-center w-10 h-10 rounded-lg border border-dashed cursor-pointer transition-colors overflow-hidden",
                              variant.image ? "border-slate-300 bg-slate-100" : "border-slate-300 hover:border-slate-400 hover:bg-slate-100 text-slate-400"
                            )}
                            title="Ajouter une image/icône"
                          >
                            {variant.image ? (
                              <img src={variant.image.url} alt="Variant" className="w-full h-full object-cover" />
                            ) : (
                              <Camera className="w-4 h-4" />
                            )}
                          </label>
                          {variant.image && (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                updateVariant(variant.id, 'image', null);
                              }}
                              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>

                        <button
                          onClick={() => removeVariant(variant.id)}
                          disabled={variants.length === 1}
                          className="shrink-0 p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={addVariant}
                    className="mt-4 w-full h-10 bg-white border border-slate-200 border-dashed rounded-xl text-slate-600 font-black text-[10px] uppercase tracking-widest hover:border-slate-400 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Ajouter une variante
                  </button>
                </div>
              </div>

              {/* Desktop Action Buttons */}
              <div className="hidden md:flex mt-8 pt-6 border-t border-slate-100 items-center gap-3">
                <button
                  onClick={handleReset}
                  className="px-6 h-10 bg-white border border-transparent text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:text-slate-900 hover:border-slate-200 transition-all flex items-center gap-2"
                >
                  <PlusCircle className="w-4 h-4" /> Nouveau
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
                  <span>{isSaving ? 'Enregistrement...' : (editingId ? 'Mettre à jour' : 'Enregistrer')}</span>
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
                        {editingId ? 'Enregistrer' : 'Ajouter'}
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
  handleAIAnalysis,
  isAnalyzing,
  analysisProgress,
  pdfError,
  setIsAISettingsOpen,
  screenType,
  setScreenType,
  oldPrice,
  setOldPrice,
  isHidden,
  setIsHidden
}: any) => {
  const [specPage, setSpecPage] = useState(1);
  const [prevSpecPage, setPrevSpecPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [rentalStockLocal, setRentalStockLocal] = useState<string>('');
  const [rentalQuantityLocal, setRentalQuantityLocal] = useState<string>('1');
  const specItemsPerPage = 6;

  const filteredSpecs = React.useMemo(() => {
    if (!searchTerm.trim()) return selectedChars;
    return selectedChars.filter((sc: any) => {
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
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Nom du produit</label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Nom Du Produits"
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
                  <span className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-900 block mb-0.5">Mode & Environnement</span>
                  <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Paramètres de commercialisation</div>
                </div>
              </button>
            </div>

            {/* Desktop Only: Mode de commercialisation */}
            <div className="hidden md:block space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Mode de commercialisation</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setMode((prev: string[]) =>
                      prev.includes('vente')
                        ? (prev.length > 1 ? prev.filter(m => m !== 'vente') : prev)
                        : [...prev, 'vente']
                    );
                  }}
                  className={cn(
                    "h-10 rounded-xl flex items-center justify-center gap-3 font-bold transition-all border",
                    mode.includes('vente') ? "bg-theme-sidebar-active-bg text-theme-sidebar-active-text border-theme-sidebar-active-bg shadow-lg" : "bg-white text-slate-400 border-slate-200 hover:border-slate-300"
                  )}
                >
                  <ShoppingCart className={cn("w-5 h-5", mode.includes('vente') ? "text-[#c6ff00]" : "text-slate-300")} />
                  <span>Vente</span>
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
                    "h-10 rounded-xl flex items-center justify-center gap-3 font-bold transition-all border",
                    mode.includes('location') ? "bg-theme-sidebar-active-bg text-theme-sidebar-active-text border-theme-sidebar-active-bg shadow-lg" : "bg-white text-slate-400 border-slate-200 hover:border-slate-300"
                  )}
                >
                  <Calendar className={cn("w-5 h-5", mode.includes('location') ? "text-purple-400" : "text-slate-300")} />
                  <span>Location</span>
                </button>
              </div>
            </div>

            {/* Desktop Only: Type d'écran */}
            <div className="hidden md:block space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Type d'écran</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setScreenType('flat')}
                  className={cn(
                    "h-10 rounded-xl flex items-center justify-center gap-2 text-[11px] font-bold transition-all border",
                    screenType === 'flat' ? "bg-theme-sidebar-active-bg text-theme-sidebar-active-text border-theme-sidebar-active-bg shadow-lg" : "bg-white text-slate-400 border-slate-200 hover:border-slate-300"
                  )}
                >
                  <Monitor className={cn("w-4 h-4", screenType === 'flat' ? "text-[#c6ff00]" : "text-slate-300")} />
                  <span>Plat</span>
                </button>
                <button
                  onClick={() => setScreenType('curved')}
                  className={cn(
                    "h-10 rounded-xl flex items-center justify-center gap-2 text-[11px] font-bold transition-all border",
                    screenType === 'curved' ? "bg-theme-sidebar-active-bg text-theme-sidebar-active-text border-theme-sidebar-active-bg shadow-lg" : "bg-white text-slate-400 border-slate-200 hover:border-slate-300"
                  )}
                >
                  <svg className={cn("w-4 h-4", screenType === 'curved' ? "text-blue-400" : "text-slate-300")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 17C2 17 4 15 12 15C20 15 22 17 22 17V7C22 7 20 5 12 5C4 5 2 7 2 7V17Z" />
                    <path d="M12 15V19M10 19H14" />
                  </svg>
                  <span>Incurvé</span>
                </button>
                <button
                  onClick={() => setScreenType('360')}
                  className={cn(
                    "h-10 rounded-xl flex items-center justify-center gap-2 text-[11px] font-bold transition-all border",
                    screenType === '360' ? "bg-theme-sidebar-active-bg text-theme-sidebar-active-text border-theme-sidebar-active-bg shadow-lg" : "bg-white text-slate-400 border-slate-200 hover:border-slate-300"
                  )}
                >
                  <svg className={cn("w-4 h-4", screenType === '360' ? "text-purple-400" : "text-slate-300")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <ellipse cx="12" cy="5" rx="9" ry="3" />
                    <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5" />
                  </svg>
                  <span>360°</span>
                </button>
              </div>
            </div>

            {/* Desktop Only: Environnement */}
            <div className="hidden md:block space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Environnement</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'interieur', label: 'Intérieur', icon: Monitor, color: 'text-blue-400' },
                  { id: 'semi-exterieur', label: 'Semi-extérieur', icon: Store, color: 'text-purple-400' },
                  { id: 'exterieur', label: 'Extérieur', icon: Sun, color: 'text-yellow-400' }
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
                      environment.includes(item.id as any) ? "bg-theme-sidebar-active-bg text-theme-sidebar-active-text border-theme-sidebar-active-bg shadow-lg" : "bg-white text-slate-400 border-slate-200 hover:border-slate-300"
                    )}
                  >
                    <item.icon className={cn("w-4 h-4", environment.includes(item.id as any) ? item.color : "text-slate-300")} />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Technical Specs Grid */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Spécifications Techniques</label>
                {totalSpecPages > 1 && (
                  <div className="flex items-center gap-2">
                    <button onClick={() => { setPrevSpecPage(specPage); setSpecPage(prev => Math.max(prev - 1, 1)); }} disabled={specPage === 1} className="w-8 h-8 flex items-center justify-center bg-slate-100 text-slate-500 rounded-full hover:bg-theme-sidebar-active-bg hover:text-theme-sidebar-active-text disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
                    <button onClick={() => { setPrevSpecPage(specPage); setSpecPage(prev => Math.min(prev + 1, totalSpecPages)); }} disabled={specPage === totalSpecPages} className="w-8 h-8 flex items-center justify-center bg-slate-100 text-slate-500 rounded-full hover:bg-theme-sidebar-active-bg hover:text-theme-sidebar-active-text disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
                  </div>
                )}
              </div>

              <div className="relative mb-2">
                <input
                  type="text"
                  placeholder="Rechercher une spécification..."
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
                  onClick={() => { setTempSelectedChars([]); setShowCharPanel(true); }}
                  className="w-full h-10 bg-white hover:bg-slate-50 text-slate-600 rounded-xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest transition-all border border-slate-200 border-dashed hover:border-slate-400"
                >
                  <PlusCircle className="w-4 h-4 text-[#a3e635]" />
                  <span>Ajouter une caractéristique</span>
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
                  <h3 className="text-2xl font-black text-white uppercase tracking-tight">Tarification</h3>
                </div>

                <div className="space-y-4 flex-1">

                  {/* Prix de Vente (Teal Box like screenshot) */}
                  <div className="bg-cyan-950/40 p-4 rounded-2xl border border-cyan-500/20 relative group overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/5 to-transparent pointer-events-none" />
                    <label className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-1.5 block">Prix de vente (€)</label>
                    <NumberInput
                      value={prixVente}
                      onChange={setPrixVente}
                      placeholder="Ex: 1200"
                      isDark
                    />
                    <div className="text-[9px] text-cyan-400/40 mt-1 font-medium italic tracking-tight">Prix public conseillé par m².</div>
                  </div>

                  {/* Ancien Prix de Vente (Optionnel) */}
                  <div className="bg-orange-500/10 p-4 rounded-2xl border border-orange-500/40 relative group overflow-hidden shadow-[0_0_20px_rgba(249,115,22,0.08)] ring-1 ring-orange-500/20">
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-500/50 to-transparent" />
                    <label className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-1.5 block flex items-center gap-2">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-orange-400 shadow-[0_0_6px_rgba(249,115,22,0.8)]" />
                      Ancien prix de vente (€) (Optionnel)
                    </label>
                    <NumberInput
                      value={oldPrice}
                      onChange={setOldPrice}
                      placeholder="Ex: 1500"
                      isDark
                      colorTheme="orange"
                    />
                    <div className="text-[9px] text-orange-400 mt-1 font-medium italic tracking-tight">Saisir un ancien prix pour afficher une réduction barré.</div>
                  </div>

                  {Array.isArray(mode) && mode.includes('location') && (
                    <div className="bg-violet-500/10 p-4 rounded-2xl border border-violet-500/40 relative group overflow-hidden shadow-[0_0_20px_rgba(139,92,246,0.08)] ring-1 ring-violet-500/20">
                      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />
                      <label className="text-[10px] font-black text-violet-400 uppercase tracking-widest mb-1.5 block flex items-center gap-2">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-violet-400 shadow-[0_0_6px_rgba(139,92,246,0.8)]" />
                        Quantité de location
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <span className="text-[9px] text-violet-300/80 font-medium uppercase tracking-wider block mb-1">Quantité disponible</span>
                          <NumberInput
                            value={rentalStockLocal}
                            onChange={(val) => setRentalStockLocal(String(val ?? ''))}
                            placeholder="Ex: 10"
                            isDark
                          />
                        </div>
                        <div>
                          <span className="text-[9px] text-violet-300/80 font-medium uppercase tracking-wider block mb-1">Quantité à louer</span>
                          <NumberInput
                            value={rentalQuantityLocal}
                            onChange={(val) => {
                              const parsed = parseInt(String(val ?? '1'), 10);
                              const safe = Number.isNaN(parsed) ? 1 : Math.max(1, parsed);
                              const stock = parseInt(String(rentalStockLocal || '0'), 10);
                              const maxAllowed = Number.isNaN(stock) ? safe : Math.min(safe, stock);
                              setRentalQuantityLocal(String(maxAllowed));
                            }}
                            placeholder="Ex: 3"
                            isDark
                          />
                        </div>
                      </div>
                      <div className="text-[9px] text-violet-400 mt-1 font-medium italic tracking-tight">
                        Quantité louée affichée : {rentalQuantityLocal || '0'} / {rentalStockLocal || '0'} disponibles.
                      </div>
                    </div>
                  )}

                  {/* Masquer le produit (Visibility Toggle) */}
                  <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800 flex items-center justify-between shadow-[0_0_15px_rgba(0,0,0,0.15)]">
                    <div className="pr-4">
                      <div className="text-xs font-black text-white uppercase tracking-tight flex items-center gap-1.5">
                        <EyeOff className="w-4 h-4 text-orange-400" />
                        Masquer le produit
                      </div>
                      <div className="text-[9px] text-slate-400 mt-1 leading-tight">
                        Masque ce produit des suggestions du configurateur et du robot.
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
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Surface Minimum Requise (M²)</label>
                    <NumberInput
                      value={surfaceMinRequise || surface.toString()}
                      onChange={(val) => { setSurfaceMinRequise(val); setSurface(parseFloat(val) || 0); }}
                      isDark
                    />
                    <p className="text-[9px] text-slate-500 mt-1 px-1 leading-relaxed">Définit la surface minimale pour le calcul du devis.</p>
                  </div>

                  <div className="h-px bg-slate-800/50 my-0.5" />

                  {/* Dalles Management */}
                  <div className="space-y-3">
                    <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-700/50">
                      <div className="flex justify-between items-center mb-4">
                        <div className="pr-4">
                          <div className="text-xs font-black text-white uppercase tracking-tight">Gérer les dimensions et le prix par dalle</div>
                          <div className="text-[9px] text-slate-500 mt-1 leading-tight">Activez cette option pour calculer le prix selon les dimensions des dalles.</div>
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
                              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Largeur dalle (cm)</label>
                              <NumberInput value={largeurDalle} onChange={setLargeurDalle} isDark compact />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Hauteur dalle (cm)</label>
                              <NumberInput value={hauteurDalle} onChange={setHauteurDalle} isDark compact />
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Prix par dalle (€)</label>
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
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Prix par heure (€)</label>
                        <NumberInput value={prixLocationHeure} onChange={setPrixLocationHeure} placeholder="Ex: 50" isDark compact />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Prix par jour (€)</label>
                        <NumberInput value={prixLocationJour} onChange={setPrixLocationJour} placeholder="Ex: 300" isDark compact />
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
                      <div className="px-6 py-3 bg-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl">Remplacer la photo</div>
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
                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Aucune vidéo</p>
                      </div>
                    )}

                    {/* Floating Replace Button for Video (so it doesn't block controls) */}
                    <button
                      onClick={triggerUpload}
                      className="absolute top-4 right-4 p-3 bg-white/90 backdrop-blur-md text-slate-900 rounded-xl shadow-xl border border-white/20 opacity-0 group-hover:opacity-100 transition-all active:scale-95 flex items-center gap-2 z-30"
                    >
                      <RefreshCw className="w-4 h-4 text-blue-500" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Remplacer la vidéo</span>
                    </button>
                  </div>
                )}
                <div className="absolute top-4 left-4 px-4 py-2 bg-black/60 backdrop-blur-md text-white rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10 z-20 pointer-events-none">Aperçu du média</div>
              </div>

              {/* Media Settings Card */}
              <div className="bg-transparent md:bg-white border-none md:border-2 border-slate-100 rounded-[2rem] p-0 md:p-4 space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Type de média visuel</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => setMediaType('photo')} className={cn("h-10 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all border", mediaType === 'photo' ? "bg-black text-white border-black" : "bg-slate-50 text-slate-500 border-slate-200")}>
                      <Camera className={cn("w-4 h-4", mediaType === 'photo' ? "text-cyan-400" : "")} /> Photo
                    </button>
                    <button onClick={() => setMediaType('video')} className={cn("h-10 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all border", mediaType === 'video' ? "bg-black text-white border-black" : "bg-slate-50 text-slate-500 border-slate-200")}>
                      <Video className={cn("w-4 h-4", mediaType === 'video' ? "text-blue-400" : "")} /> Vidéo
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Lien du média (URL)</label>
                  <div className="flex gap-2">
                    <input type="text" value={currentMediaUrl} onChange={handleUrlChange} placeholder="data:image/..." className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900" />
                    <button onClick={triggerUpload} className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 shadow-sm active:scale-95 transition-all"><Upload className="w-4 h-4" /></button>
                    <button onClick={() => { if (mediaType === 'photo') { setPhotoUrl(''); setUploadedPhoto(null); } else { setVideoUrl(''); setUploadedVideo(null); } }} className="p-3 bg-red-50 text-red-600 rounded-xl border border-red-100 shadow-sm active:scale-95 transition-all"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            </div>

            {/* Fiche Technique Card */}
            <div className="bg-transparent md:bg-white border-none md:border-2 border-slate-100 rounded-[2rem] p-0 md:p-4 space-y-3 flex-1 flex flex-col shadow-none md:shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100">
                    <LinkIcon className="w-5 h-5 text-slate-400" />
                  </div>
                  <div className="flex flex-col">
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">Fiche Produit</h4>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Taille Max :</span>
                  <CustomSelect
                    options={[{ value: '1', label: '1 MB' }, { value: '5', label: '5 MB' }, { value: '10', label: '10 MB' }, { value: '20', label: '20 MB' }, { value: '50', label: '50 MB' }]}
                    value={String(aiSettings.pdfMaxSize)}
                    onChange={(val) => setAiSettings((prev: any) => ({ ...prev, pdfMaxSize: Number(val) }))}
                    className="w-24"
                  />
                </div>
              </div>

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
                    {(pdfUrl || uploadedPdf) ? 'Fiche technique présente' : 'Ajouter la fiche produit (PDF)'}
                  </span>
                  <span className="text-[9px] text-slate-400 uppercase tracking-widest">
                    {(pdfUrl || uploadedPdf) ? (uploadedPdf ? uploadedPdf.name : 'Fichier enregistré') : 'Fiche technique officielle'}
                  </span>

                  {(pdfUrl || uploadedPdf) && (
                    <div className="flex gap-2 mt-4" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => window.open(uploadedPdf ? URL.createObjectURL(uploadedPdf) : pdfUrl, '_blank')}
                        className="px-3 py-1.5 bg-white border border-emerald-200 text-emerald-600 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-emerald-600 hover:text-white transition-all"
                      >
                        Voir le PDF
                      </button>
                      <button
                        onClick={() => { setPdfUrl(''); setUploadedPdf(null); }}
                        className="px-3 py-1.5 bg-white border border-red-200 text-red-600 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-red-600 hover:text-white transition-all"
                      >
                        Supprimer
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-6 space-y-3 mt-auto">
                <button
                  onClick={handleSaveProduct}
                  disabled={isSaving || !productName}
                  className="w-full h-10 bg-theme-sidebar-active-bg text-theme-sidebar-active-text rounded-xl font-black uppercase tracking-[0.2em] text-xs hover:shadow-2xl hover:shadow-black/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isSaving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus className="w-5 h-5 text-theme-sidebar-active-text" />}
                  {editingProduct ? 'Enregistrer les modifications' : 'Ajouter au catalogue'}
                </button>
                <button
                  onClick={() => { setEditingProduct(null); setActivePage('gestion'); }}
                  className="w-full h-10 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] hover:text-slate-900 transition-colors border border-transparent hover:border-slate-200 rounded-xl"
                >
                  Annuler
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
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Réglages Avancés</h3>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Mode & Environnement</p>
                    </div>
                  </div>
                  <button onClick={() => setIsPricingMediaOpen(false)} className="p-2 bg-slate-100 text-slate-500 rounded-xl"><X className="w-5 h-5" /></button>
                </div>
                {/* Content */}
                <div className="flex-1 overflow-y-auto p-5 space-y-6 pb-20">

                  {/* Mode de commercialisation */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Mode de commercialisation</label>
                    <div className="grid grid-cols-1 gap-2">
                      <button
                        onClick={() => {
                          setMode((prev: string[]) =>
                            prev.includes('vente')
                              ? (prev.length > 1 ? prev.filter(m => m !== 'vente') : prev)
                              : [...prev, 'vente']
                          );
                        }}
                        className={cn(
                          "w-full h-12 rounded-xl flex items-center px-4 gap-3 transition-all duration-300 relative overflow-hidden group",
                          mode.includes('vente') ? "bg-black text-white" : "bg-slate-100 text-slate-400"
                        )}
                      >
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", mode.includes('vente') ? "bg-white/10" : "bg-slate-200")}>
                          <ShoppingCart className={cn("w-4 h-4", mode.includes('vente') ? "text-[#c6ff00]" : "text-slate-400")} />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest">Vente</span>
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
                          "w-full h-12 rounded-xl flex items-center px-4 gap-3 transition-all duration-300 relative overflow-hidden group",
                          mode.includes('location') ? "bg-black text-white" : "bg-slate-100 text-slate-400"
                        )}
                      >
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", mode.includes('location') ? "bg-white/10" : "bg-slate-200")}>
                          <Calendar className={cn("w-4 h-4", mode.includes('location') ? "text-purple-400" : "text-slate-400")} />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest">Location</span>
                      </button>
                    </div>
                  </div>

                  {/* Type d'écran (Mobile) */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Type d'écran</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => setScreenType('flat')}
                        className={cn(
                          "w-full h-12 rounded-xl flex items-center px-2 gap-2 transition-all duration-300 relative overflow-hidden group",
                          screenType === 'flat' ? "bg-black text-white" : "bg-slate-100 text-slate-400"
                        )}
                      >
                        <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center shrink-0", screenType === 'flat' ? "bg-white/10" : "bg-slate-200")}>
                          <Monitor className={cn("w-3.5 h-3.5", screenType === 'flat' ? "text-[#c6ff00]" : "text-slate-400")} />
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest truncate">Plat</span>
                      </button>
                      <button
                        onClick={() => setScreenType('curved')}
                        className={cn(
                          "w-full h-12 rounded-xl flex items-center px-2 gap-2 transition-all duration-300 relative overflow-hidden group",
                          screenType === 'curved' ? "bg-black text-white" : "bg-slate-100 text-slate-400"
                        )}
                      >
                        <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center shrink-0", screenType === 'curved' ? "bg-white/10" : "bg-slate-200")}>
                          <svg className={cn("w-3.5 h-3.5", screenType === 'curved' ? "text-blue-400" : "text-slate-400")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M2 17C2 17 4 15 12 15C20 15 22 17 22 17V7C22 7 20 5 12 5C4 5 2 7 2 7V17Z" />
                            <path d="M12 15V19M10 19H14" />
                          </svg>
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest truncate">Incurvé</span>
                      </button>
                      <button
                        onClick={() => setScreenType('360')}
                        className={cn(
                          "w-full h-12 rounded-xl flex items-center px-2 gap-2 transition-all duration-300 relative overflow-hidden group",
                          screenType === '360' ? "bg-black text-white" : "bg-slate-100 text-slate-400"
                        )}
                      >
                        <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center shrink-0", screenType === '360' ? "bg-white/10" : "bg-slate-200")}>
                          <svg className={cn("w-3.5 h-3.5", screenType === '360' ? "text-purple-400" : "text-slate-400")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <ellipse cx="12" cy="5" rx="9" ry="3" />
                            <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5" />
                          </svg>
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest truncate">360°</span>
                      </button>
                    </div>
                  </div>

                  {/* Environnement */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Environnement</label>
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        { id: 'interieur', label: 'Intérieur', icon: Monitor, color: 'text-blue-400' },
                        { id: 'semi-exterieur', label: 'Semi-extérieur', icon: Store, color: 'text-purple-400' },
                        { id: 'exterieur', label: 'Extérieur', icon: Sun, color: 'text-yellow-400' }
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
                            environment.includes(item.id as any) ? "bg-black text-white" : "bg-slate-100 text-slate-400"
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

                <div className="shrink-0 p-4 bg-white border-t border-slate-100">
                  <button onClick={() => setIsPricingMediaOpen(false)} className="w-full h-12 bg-black text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-black/20">Valider et Fermer</button>
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
                  {editingProduct ? 'Enregistrer' : 'Ajouter'}
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
  onBulkDelete
}: {
  products: any[];
  setProducts: (products: any[]) => void;
  onAddProduct: () => void;
  onEditProduct: (product: any) => void;
  onDuplicateProduct: (product: any) => void;
  onDeleteProduct: (id: string) => void;
  onBulkDelete?: (ids: string[]) => void;
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
    { id: 'all', label: 'Tous les types', icon: Layers },
    { id: 'interieur', label: 'Intérieur', icon: Monitor },
    { id: 'exterieur', label: 'Extérieur', icon: Sun },
    { id: 'semi-exterieur', label: 'Semi-extérieur', icon: Store },
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
    const priceA = parseFloat((a.price || '0').toString().replace(/ /g, '').replace('€', '')) || 0;
    const priceB = parseFloat((b.price || '0').toString().replace(/ /g, '').replace('€', '')) || 0;
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
              placeholder="Rechercher un produit..."
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
            <span>Ajouter un produit</span>
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
                    <span className="text-[10px] font-black text-white px-2">Supprimer {selectedIds.length} ?</span>
                    <button onClick={() => setShowBulkConfirm(false)} className="px-2 py-1 text-[10px] font-bold text-white hover:bg-white/10 rounded-lg">Non</button>
                    <button onClick={handleBulkDelete} className="bg-white text-red-600 px-3 py-1 text-[10px] font-black rounded-lg">Oui</button>
                  </motion.div>
                ) : (
                  <button onClick={() => setShowBulkConfirm(true)} className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-bold hover:bg-red-600 hover:text-white transition-all">
                    <Trash2 className="w-4 h-4" /> Supprimer ({selectedIds.length})
                  </button>
                )}
              </AnimatePresence>
            </div>
          )}

          <div className="relative">
            <CustomSelect
              options={[
                { value: 'all', label: 'Tous les types', icon: Layers },
                { value: 'interieur', label: 'Intérieur', icon: Monitor },
                { value: 'exterieur', label: 'Extérieur', icon: Sun },
                { value: 'semi-exterieur', label: 'Semi-extérieur', icon: Store },
              ]}
              value={filterType}
              onChange={(val) => setFilterType(val as any)}
              placeholder="Filtrer par type"
              className="w-56"
            />
          </div>

          <CustomSelect
            options={[
              { value: 'manual', label: 'Manuel' },
              { value: 'name', label: 'Nom' },
              { value: 'price', label: 'Prix' },
              { value: 'date', label: 'Date' },
            ]}
            value={sortBy}
            onChange={setSortBy}
            placeholder="Trier par"
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
              <span>Filtres</span>
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
            <span>Trier</span>
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
                  Ajouter un produit
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

      <ProductActionsDrawer isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} title="Filtrer par type">
        <div className="grid grid-cols-1 gap-3">
          {filterOptions.map((opt) => (
            <button key={opt.id} onClick={() => { setFilterType(opt.id as any); setIsFilterOpen(false); }} className={cn("w-full flex items-center justify-between p-5 rounded-2xl transition-all", filterType === opt.id ? "bg-black text-white" : "bg-slate-50 text-slate-600")}>
              <div className="flex items-center gap-4"><opt.icon className="w-6 h-6" /> <span className="text-lg font-black uppercase tracking-widest">{opt.label}</span></div>
              {filterType === opt.id && <Check className="w-5 h-5 text-[#c6ff00]" />}
            </button>
          ))}
        </div>
      </ProductActionsDrawer>

      <ProductActionsDrawer isOpen={isSortOpen} onClose={() => setIsSortOpen(false)} title="Trier la liste">
        <div className="grid grid-cols-1 gap-3">
          {[{ value: 'manual', label: 'Ordre Manuel', icon: GripVertical }, { value: 'name', label: 'Par Nom', icon: FileText }, { value: 'price', label: 'Par Prix', icon: Zap }, { value: 'date', label: 'Par Date', icon: Calendar }].map((opt) => (
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
                    placeholder="Rechercher un produit..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-14 pr-6 py-4 bg-slate-100 border-2 border-transparent focus:border-black rounded-[1.5rem] text-lg font-black uppercase tracking-widest transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Résultats suggérés</p>
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
                  <p className="text-slate-400 font-black uppercase tracking-widest">Aucun résultat</p>
                </div>
              )}
            </div>

            <div className="p-6 pb-12 bg-slate-50 border-t border-slate-100">
              <button
                onClick={() => setIsSearchOpen(false)}
                className="w-full py-5 bg-black text-white rounded-[2rem] font-black uppercase tracking-[0.3em] shadow-2xl"
              >
                Terminer
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ProductActionsDrawer isOpen={isActionsOpen} onClose={() => setIsActionsOpen(false)} product={editingProduct} onEdit={onEditProduct} onDuplicate={onDuplicateProduct} onDelete={() => { setDeletingId(editingProduct?.id); setIsActionsOpen(false); }} />

      <div className="hidden md:block relative overflow-hidden min-h-[400px]">
        <AnimatePresence mode="popLayout">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Reorder.Group axis="y" values={paginatedProducts} onReorder={setProducts} className="space-y-4">
              {paginatedProducts.map((product) => (
                <ProductListItem key={product.id} product={product} selectedIds={selectedIds} toggleSelect={toggleSelect} onEditProduct={onEditProduct} onDuplicateProduct={onDuplicateProduct} onDeleteProduct={onDeleteProduct} setDeletingId={setDeletingId} deletingId={deletingId} />
              ))}
            </Reorder.Group>
          </motion.div>
        </AnimatePresence>

        {filteredProducts.length === 0 && (
          <div className="bg-white rounded-[32px] border border-slate-200 border-dashed p-12 text-center group/empty">
            <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover/empty:bg-black/5 transition-colors"><Package className="w-10 h-10 text-slate-300" /></div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Aucun produit</h3>
            <p className="text-slate-500 font-medium mb-8">Commencez par créer votre premier produit</p>
            <button onClick={onAddProduct} className="px-8 py-3.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-theme-sidebar-active-bg hover:text-theme-sidebar-active-text transition-all shadow-lg flex items-center gap-2 mx-auto"><Plus className="w-5 h-5" /> <span>Créer un produit</span></button>
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
  displayName: 'Utilisateur Démo',
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
    price: '4 500 €',
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
    price: '150 €',
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
    price: '3 200 €',
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
    price: '200 €',
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
    price: '1 800 €',
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
    price: '5 500 €',
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

// --- Main App Component ---
export default function ProductManagementClient() {
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

  const getPageOrder = (page: string) => {
    const order = { 'gestion': 0, 'produit': 1, 'caracteristiques': 2 };
    return order[page as keyof typeof order] || 0;
  };

  const pageDirection = getPageOrder(activePage) >= getPageOrder(prevActivePage) ? 1 : -1;

  const handlePageChange = (newPage: 'gestion' | 'produit' | 'caracteristiques') => {
    if (!user) {
      toast({ title: "Accès restreint", description: "Veuillez vous connecter pour accéder à cette section.", variant: "destructive" });
      return;
    }
    setPrevActivePage(activePage);
    setActivePage(newPage);
  };

  const [products, setProducts] = useState<any[]>([]);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [productName, setProductName] = useState('');
  const [characteristics, setCharacteristics] = useState<any[]>([]);

  const handleFirestoreError = (error: any, action: string, collection: string) => {
    console.error(`Firestore error ${action} ${collection}:`, error);
    let message = `Erreur lors de l'accès à ${collection}.`;

    if (error.code === 'permission-denied') {
      message = `Accès refusé à ${collection}. Vérifiez vos droits Firestore (Projet: ${auth.app.options.projectId})`;
    } else if (error.code === 'unavailable') {
      message = "La base de données est temporairement indisponible.";
    } else {
      message = `Erreur Firebase (${error.code}) : ${error.message}`;
    }

    toast({
      title: "Erreur Base de données",
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
    const qProducts = query(collection(db, "products"), orderBy("name", "asc"));
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
    const qChars = query(collection(db, "characteristics"), orderBy("name", "asc"));
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
                await setDoc(doc(db, "characteristics", charId || `char-${name.replace(/\s+/g, '-').toLowerCase()}`), {
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

    return () => {
      unsubProducts();
      unsubChars();
    };
  }, [user]); // Re-run if user changes to ensure UID is correct for seeding

  const [selectedChars, setSelectedChars] = useState<any[]>([]);
  const [showCharPanel, setShowCharPanel] = useState(false);
  const [tempSelectedChars, setTempSelectedChars] = useState<string[]>([]);

  const availableChars = characteristics.filter(c => !selectedChars.some(sc => sc.id === c.id));

  const [mode, setMode] = useState<('vente' | 'location')[]>(['vente']);
  const [environment, setEnvironment] = useState<('interieur' | 'exterieur' | 'semi-exterieur')[]>(['exterieur']);
  const [screenType, setScreenType] = useState<'flat' | 'curved'>('flat');
  const [surface, setSurface] = useState<number>(9.00);
  const [mediaType, setMediaType] = useState<'photo' | 'video'>('photo');
  const [dimensionsEnabled, setDimensionsEnabled] = useState(false);

  // Media State
  const [photoUrl, setPhotoUrl] = useState('');
  const [uploadedPhoto, setUploadedPhoto] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [uploadedVideo, setUploadedVideo] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [aiSettings, setAiSettings] = useState<AISettings>(DEFAULT_AI_SETTINGS);
  const [isAISettingsOpen, setIsAISettingsOpen] = useState(false);



  const handleLogin = async () => {
    setAuthError(null);
    setIsAuthenticating(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed", error);
      setAuthError("La connexion avec Google a échoué.");
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
      setAuthError("Veuillez remplir tous les champs.");
      return;
    }

    setAuthError(null);
    setIsAuthenticating(true);
    try {
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
      await signInWithEmailAndPassword(auth, loginEmail.trim(), loginPassword);
    } catch (error: any) {
      console.error("Email login failed", error);
      setAuthError("Email ou mot de passe incorrect.");
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
      setAuthError("Erreur lors de l'envoi de l'email de réinitialisation.");
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
      setAuthError("Erreur lors de la création du compte.");
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
        title: "Stock requis",
        description: "Veuillez renseigner une quantité de stock pour la location.",
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
        price: (prixVente || '0') + ' €',
        oldPrice: oldPrice ? parseFloat(oldPrice) : null,
        image: finalPhotoUrl || '',
        videoUrl: finalVideoUrl || '',
        pdfUrl: finalPdfUrl || '',
        pitch: String(selectedChars.find(c => {
          const charDef = characteristics.find(cd => cd.id === c.id);
          return charDef?.name === 'Pixel pitch';
        })?.value || ''),
        distance: String(selectedChars.find(c => {
          const charDef = characteristics.find(cd => cd.id === c.id);
          return charDef?.name === 'Distance de visionnage';
        })?.value || ''),
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
        updatedAt: new Date().toISOString(),
        hasDimensions: !!dimensionsEnabled,
        prixLocationHeure: String(prixLocationHeure || '0'),
        prixLocationJour: String(prixLocationJour || '0'),
        rentalStock: Number(rentalStock || '0'),
        rentalQuantity: Number(rentalQuantity || '1'),
        isHidden: !!isHidden,
        date: new Date().toISOString(),
        uid: user?.uid || 'system',
        selectedChars: (selectedChars || []).map(c => ({
          id: String(c.id || ''),
          value: String(c.value || '')
        }))
      };

      // Final pass to remove any undefined that might have sneaked in
      const productData = Object.fromEntries(
        Object.entries(rawData).filter(([_, v]) => v !== undefined)
      );

      if (editingProduct) {
        console.log("Updating product:", editingProduct.id, productData);
        await updateDoc(doc(db, "products", editingProduct.id), productData);
        toast({
          title: "Produit mis à jour",
          description: `${productName} a été modifié avec succès.`,
          variant: "success"
        });
      } else {
        await addDoc(collection(db, "products"), productData);
        toast({
          title: "Produit ajouté",
          description: `${productName} a été ajouté au catalogue.`,
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
        title: "Erreur de sauvegarde",
        description: error.message || "Une erreur est survenue lors de l'enregistrement.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDuplicateProduct = async (product: any) => {
    const { id, ...prodData } = product;
    const newProduct = {
      ...prodData,
      name: `Copie — ${product.name}`,
      date: new Date().toISOString(),
    };
    await addDoc(collection(db, "products"), newProduct);
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await deleteDoc(doc(db, "products", id));
    } catch (error) {
      console.error("Error deleting product", error);
    }
  };

  const handleBulkDeleteProducts = async (ids: string[]) => {
    for (const id of ids) {
      await deleteDoc(doc(db, "products", id));
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
      setPdfError('L\'IA est désactivée dans les paramètres.');
      setIsAISettingsOpen(true);
      return;
    }

    if (!aiSettings.apiKey) {
      setPdfError('Veuillez configurer votre clé API dans les paramètres IA.');
      setIsAISettingsOpen(true);
      return;
    }

    if (!uploadedPdf) {
      setPdfError('Veuillez d\'abord uploader un fichier PDF.');
      return;
    }

    if (uploadedPdf.size > aiSettings.pdfMaxSize * 1024 * 1024) {
      setPdfError(`Le fichier est trop volumineux (max ${aiSettings.pdfMaxSize} MB).`);
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

          const prompt = `Analyse cette fiche technique d'écran LED. 
          Extrais les informations suivantes au format JSON :
          {
            "name": "Nom du produit",
            "viewingDistance": "ex: 4m",
            "pixelPitch": "ex: P2.5",
            "powerMax": "ex: 10.8 kW",
            "powerMin": "ex: 3.8 kW",
            "resolution": "ex: 1920x1080",
            "brightness": "ex: 1200 nits",
            "type": "interieur | semi-exterieur | exterieur",
            "dimensions": { "width": 50, "height": 50 },
            "newCharacteristic": { "name": "Nom", "variants": ["v1", "v2"] }
          }
          Sois précis. Utilise les mêmes unités que demandées. Réponds en ${aiSettings.language === 'fr' ? 'français' : 'anglais'}.`;

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
            throw new Error(`Le fournisseur ${aiSettings.provider} n'est pas encore pleinement supporté pour l'analyse PDF directe.`);
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
          setPdfError(error instanceof Error ? error.message : 'Erreur lors de l\'analyse du PDF.');
          setIsAnalyzing(false);
        }
      };
      reader.readAsDataURL(uploadedPdf);
    } catch (e) {
      console.error(e);
      setPdfError('Une erreur est survenue lors de la lecture du fichier.');
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

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > aiSettings.pdfMaxSize * 1024 * 1024) {
        setPdfError(`Le fichier dépasse la limite de ${aiSettings.pdfMaxSize} MB.`);
        setUploadedPdf(null);
      } else if (file.type !== 'application/pdf') {
        setPdfError('Veuillez sélectionner un fichier PDF.');
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

  // Pre-fill form when editing
  useEffect(() => {
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

      setPrixVente((editingProduct.price || '').toString().replace(/ /g, '').replace('€', ''));
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
      setLargeurDalle(editingProduct.tileWidth?.toString() || editingProduct.largeurDalle || '50');
      setHauteurDalle(editingProduct.tileHeight?.toString() || editingProduct.hauteurDalle || '50');
      setPrixDalle(editingProduct.pricePerTile?.toString() || editingProduct.prixDalle || '20');
      setDimensionsEnabled(!!(editingProduct.dimensionsEnabled || editingProduct.hasDimensions));
      setScreenType(editingProduct.screenType || 'flat');
      setSurface(parseFloat(editingProduct.surfaceMinRequise || '0') || 9.00);
      setIsHidden(!!editingProduct.isHidden);
    } else {
      // Reset form
      setProductName('');
      setMode(['vente']);
      setEnvironment(['exterieur']);
      setScreenType('flat');
      setPrixVente('1250');
      setOldPrice('');

      // Reset technical/pricing specs
      setPrixLocationHeure('');
      setPrixLocationJour('');
      setSurfaceMaxLocation('');
      setRentalStock('');
      setRentalQuantity('1');
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
      setPhotoUrl('');
      setVideoUrl('');
      setPdfUrl('');
      setUploadedPhoto(null);
      setUploadedVideo(null);
      setUploadedPdf(null);
    }
  }, [editingProduct, characteristics]); // Added characteristics to dependency array to ensure new products get defaults when chars load

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
            <p className="text-slate-400 font-medium">Gestion du Catalogue Audiovisuel</p>
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
                    <h2 className="text-2xl font-bold text-slate-900">Bienvenue</h2>
                    <p className="text-slate-500 text-sm">Connectez-vous pour continuer</p>
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
                      Continuer avec Google
                    </button>

                    <div className="relative flex items-center justify-center py-2">
                      <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                      <span className="relative bg-white px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">ou avec email</span>
                    </div>

                    <form onSubmit={handleEmailLogin} className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Email professionnel</label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="admin@pixiatech.com"
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between ml-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Mot de passe</label>
                          <button
                            type="button"
                            onClick={() => setAuthView('forgot-password')}
                            className="text-[10px] font-bold text-blue-600 hover:text-blue-700"
                          >
                            Oublié ?
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
                        <label htmlFor="remember" className="text-xs text-slate-500 font-medium cursor-pointer">Maintenir la session ouverte</label>
                      </div>

                      <button
                        type="submit"
                        disabled={isAuthenticating}
                        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-theme-sidebar-active-bg hover:text-theme-sidebar-active-text transition-all shadow-xl shadow-slate-900/10 flex items-center justify-center gap-2 group"
                      >
                        {isAuthenticating ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>Se connecter <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>
                        )}
                      </button>
                    </form>

                    <p className="text-center text-xs text-slate-500 font-medium">
                      Pas encore de compte ?{' '}
                      <button
                        onClick={() => setAuthView('signup')}
                        className="text-blue-600 font-bold hover:underline"
                      >
                        Créer un accès
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
                    <h2 className="text-2xl font-bold text-slate-900">Demander un accès</h2>
                    <p className="text-slate-500 text-sm">Créez votre compte administrateur</p>
                  </div>

                  <form onSubmit={handleEmailSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Email professionnel</label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="votre@email.com"
                          className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Mot de passe</label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Minimum 8 caractères"
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
                      className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-theme-sidebar-active-bg hover:text-theme-sidebar-active-text transition-all shadow-xl shadow-slate-900/10 flex items-center justify-center gap-2"
                    >
                      {isAuthenticating ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        "Créer le compte"
                      )}
                    </button>
                  </form>

                  <p className="text-center text-xs text-slate-500 font-medium">
                    Déjà un compte ?{' '}
                    <button
                      onClick={() => setAuthView('login')}
                      className="text-blue-600 font-bold hover:underline"
                    >
                      Se connecter
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
                    <h2 className="text-2xl font-bold text-slate-900">Mot de passe oublié ?</h2>
                    <p className="text-slate-500 text-sm">Entrez votre email pour demander une réinitialisation</p>
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
                      <h4 className="text-sm font-bold text-green-800 mb-1">Email envoyé !</h4>
                      <p className="text-xs text-green-600 mb-6">Vérifiez votre boîte de réception pour les instructions.</p>
                      <button
                        onClick={() => { setResetEmailSent(false); setAuthView('login'); }}
                        className="text-xs font-bold text-slate-900 hover:underline"
                      >
                        Retour à la connexion
                      </button>
                    </motion.div>
                  ) : (
                    <form onSubmit={handleResetPassword} className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Email associé au compte</label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="votre@email.com"
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
                        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-theme-sidebar-active-bg hover:text-theme-sidebar-active-text transition-all shadow-xl shadow-slate-900/10 flex items-center justify-center gap-2"
                      >
                        {isAuthenticating ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          "Envoyer le lien"
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setAuthView('login')}
                        className="w-full py-3 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
                      >
                        Annuler
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
          <div className="flex items-center justify-between mb-8">
            <div className="relative flex bg-slate-100/80 p-1 rounded-2xl border border-slate-200 w-full md:w-auto overflow-hidden shadow-sm">
              {[
                { id: 'gestion', label: 'Gestion des Produits', icon: Package },
                { id: 'produit', label: 'Fiche Produit', icon: FileText },
                { id: 'caracteristiques', label: 'Caractéristiques', icon: Settings2 },
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
                />
              </motion.div>
            )}

            {activePage === 'produit' && (
              <motion.div
                key="produit"
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
                  availableChars={availableChars}
                  handleAIAnalysis={handleAIAnalysis}
                  isAnalyzing={isAnalyzing}
                  analysisProgress={analysisProgress}
                  pdfError={pdfError}
                  setIsAISettingsOpen={setIsAISettingsOpen}
                  screenType={screenType}
                  setScreenType={setScreenType}
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
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">Nouvelle caractéristique détectée !</h3>
                  <p className="text-slate-500 mb-6">
                    L'IA a détecté une caractéristique : <span className="font-bold text-slate-900">"{aiSuggestion.name}"</span>.
                    Voulez-vous l'ajouter avec les variantes suivantes : <span className="italic">{aiSuggestion.variants.join(', ')}</span> ?
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setAiSuggestion(null)}
                      className="flex-1 py-3.5 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                    >
                      Ignorer
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
                      Oui, ajouter
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
                      <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Ajouter des caractéristiques</h3>
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">SÉLECTIONNEZ LES ÉLÉMENTS À AJOUTER À LA FICHE</p>
                    </div>
                    <button onClick={() => setShowCharPanel(false)} className="p-3 bg-white hover:bg-slate-100 rounded-2xl transition-colors shadow-sm">
                      <X className="w-5 h-5 text-slate-500" />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="flex-1 overflow-y-auto p-8">
                    {availableChars.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                          <Settings2 className="w-8 h-8 text-slate-200" />
                        </div>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Toutes les caractéristiques sont déjà ajoutées</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {availableChars.map((char: any) => {
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
                                  {char.options.length} options disponibles
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
                    )}
                  </div>

                  {/* Footer */}
                  <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {tempSelectedChars.length} sélectionnée(s)
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowCharPanel(false)}
                        className="px-6 h-12 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-slate-900 transition-colors"
                      >
                        Annuler
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
                        <Plus className="w-4 h-4 text-theme-sidebar-active-text" /> Ajouter à la fiche
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
