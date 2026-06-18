'use client';

import React, { useState, useMemo } from 'react';
import { 
  User, Settings, History, Plus, Trash2, Send, Languages, FileText, Calculator,
  Truck, Eraser, Wrench, CheckCircle2, AlertCircle, TrendingDown, ArrowRight,
  LayoutDashboard, Box, MessageSquare, Bell, LogOut, ChevronLeft, ChevronDown,
  ChevronRight, Search, Filter, MoreVertical, X, Pencil, Check, Loader2,
  Sparkles, MapPin, Building2, StickyNote, MessageCircle, SendHorizontal,
  Share2, Download, FileSpreadsheet, Image as ImageIcon,
  ChevronRightSquare, Maximize2, Info, Minus, Lock, History as HistoryIcon,
  Cpu, Monitor, Grid3X3, Layers, Zap, CircuitBoard, Mail
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TransmitModal, ReturnReasonPopup } from './TransmitModal';
import { updateQuoteStatus } from '@/app/admin/actions';
import { cn } from '@/lib/utils';

import { 
  ProfileType, 
  Estimation, 
  Product, 
  HistoryEntry, 
  ClientInfo 
} from '../types';
import { geminiService } from '../services/geminiService';

interface DetailsInterfaceProps {
  estimation: any;
  onClose?: () => void;
}

export default function DetailsInterface({ estimation: projectEstimation, onClose }: DetailsInterfaceProps) {
  const initialData: Estimation = useMemo(() => {
    if (projectEstimation.client && typeof projectEstimation.client === 'object' && 'name' in projectEstimation.client) {
      return projectEstimation;
    }

    const id = projectEstimation.id || 'DEV-N/A';
    const client: ClientInfo = {
      name: projectEstimation.client?.companyName || projectEstimation.client || 'Client',
      email: projectEstimation.email || projectEstimation.client?.email || '',
      phone: projectEstimation.phone || projectEstimation.client?.phone || '',
      company: projectEstimation.client?.companyName || '',
      address: projectEstimation.client?.address || '',
      notes: projectEstimation.client?.notes || '',
      sitePhoto: projectEstimation.client?.sitePhoto || undefined,
    };

    const products: Product[] = (projectEstimation.products || []).map((p: any) => ({
      id: p.id || Math.random().toString(36).substr(2, 9),
      name: p.productName || p.name || 'Produit',
      quantity: p.quantity || 1,
      unitPrice: p.unitPrice || (p.lineTotal / p.quantity) || 0,
      discount: p.discount || 0,
      specs: p.specs || {}
    }));

    return {
      id,
      client,
      products,
      productDiscount: projectEstimation.productDiscount || 0,
      deliveryCity: projectEstimation.deliveryCity || '',
      deliveryCost: projectEstimation.deliveryCost || 0,
      deliveryDiscount: projectEstimation.deliveryDiscount || 0,
      laborCost: projectEstimation.installationCost || projectEstimation.laborCost || 0,
      laborDiscount: projectEstimation.laborDiscount || 0,
      taxRate: projectEstimation.taxRate || 20,
      globalDiscount: projectEstimation.globalDiscount || 0,
      history: projectEstimation.history?.map((h: any) => ({
        id: h.id || Math.random().toString(36).substr(2, 9),
        timestamp: h.timestamp instanceof Date ? h.timestamp.toLocaleString('fr-FR') : (h.timestamp || new Date().toLocaleString('fr-FR')),
        action: h.action || '',
        user: h.userName || h.user || 'Système',
        userId: h.userId || '',
        type: 'local'
      })) || [],
      transmittedToSupplier: projectEstimation.status === 'in_progress' || projectEstimation.status === 'sent' || projectEstimation.status === 'delivered',
      supplierNotes: projectEstimation.supplierNotes || '',
    };
  }, [projectEstimation]);

  const [profile, setProfile] = useState<ProfileType>('client');
  const [estimation, setEstimation] = useState<Estimation>(initialData);
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const [isTransmitModalOpen, setIsTransmitModalOpen] = useState(false);
  const [isReturnReasonOpen, setIsReturnReasonOpen] = useState(false);

  const [isEditMode, setIsEditMode] = useState(false);
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(true);
  const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState(false);
  const [fullscreenPhoto, setFullscreenPhoto] = useState<string | null>(null);
  const [historyPage, setHistoryPage] = useState(1);
  const itemsPerPage = 5;

  const [aiResult, setAiResult] = useState<{ title: string, content: string } | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const calculations = useMemo(() => {
    const productsSubtotal = estimation.products.reduce((acc, p) => acc + (p.quantity * p.unitPrice), 0);
    const productsDiscountedTotal = estimation.products.reduce((acc, p) => {
      const lineTotal = p.quantity * p.unitPrice;
      const discounted = lineTotal * (1 - (p.discount || 0) / 100);
      return acc + discounted;
    }, 0);

    const productsTotal = productsDiscountedTotal * (1 - estimation.productDiscount / 100);

    const deliveryTotal = estimation.deliveryCost - (estimation.deliveryCost * (estimation.deliveryDiscount || 0) / 100);
    const laborTotal = estimation.laborCost - (estimation.laborCost * (estimation.laborDiscount || 0) / 100);

    const subtotalHT = productsTotal + deliveryTotal + laborTotal;
    const tva = (subtotalHT * estimation.taxRate) / 100;
    const totalTTC = subtotalHT + tva;
    const finalTotal = totalTTC - (totalTTC * estimation.globalDiscount / 100);

    return {
      productsSubtotal,
      productsTotal,
      deliveryTotal,
      laborTotal,
      subtotalHT,
      tva,
      totalTTC,
      finalTotal,
      totalInitial: productsSubtotal + estimation.deliveryCost + estimation.laborCost
    };
  }, [estimation]);

  const addHistory = (action: string) => {
    const newEntry: HistoryEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleString('fr-FR'),
      action,
      user: profile === 'client' ? 'Client' : 'Commercial',
      userId: 'local',
      type: 'local'
    };
    setEstimation(prev => ({
      ...prev,
      history: [newEntry, ...prev.history]
    }));
  };

  const updateClient = (field: keyof ClientInfo, value: string) => {
    setEstimation(prev => ({
      ...prev,
      client: { ...prev.client, [field]: value }
    }));
  };

  const removeProduct = (id: string) => {
    setEstimation(prev => ({
      ...prev,
      products: prev.products.filter(p => p.id !== id)
    }));
    addHistory(`Suppression produit ID: ${id}`);
  };

  const addProduct = () => {
    const newProduct: Product = {
      id: Math.random().toString(36).substr(2, 9),
      name: 'Nouvel Écran LED',
      quantity: 1,
      unitPrice: 0,
      discount: 0
    };
    setEstimation(prev => ({
      ...prev,
      products: [...prev.products, newProduct]
    }));
    addHistory('Ajout nouveau produit');
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(val);
  };

  const handleTranslate = async () => {
    setIsAiLoading(true);
    addHistory('Demande de traduction Chinois');
    const result = await geminiService.translateToChinese(estimation);
    setAiResult({ title: 'Traduction Technique (Chinois)', content: result });
    setIsAiLoading(false);
  };

  const handleSummary = async () => {
    setIsAiLoading(true);
    addHistory('Génération synthèse dossier');
    const result = await geminiService.generateSummary(estimation);
    setAiResult({ title: 'Synthèse du Dossier', content: result });
    setIsAiLoading(false);
  };

  const shareTranslatedText = (platform: 'whatsapp' | 'telegram', text: string) => {
    const encoded = encodeURIComponent(text);
    const url = platform === 'whatsapp' 
      ? `https://wa.me/${estimation.client.phone.replace(/\s+/g, '')}?text=${encoded}`
      : `https://t.me/share/url?url=${window.location.href}&text=${encoded}`;
    window.open(url, '_blank');
    addHistory(`Partage résultat sur ${platform}`);
  };

  const shareEstimation = (platform: 'whatsapp' | 'telegram') => {
    let message = '';
    
    if (profile === 'client') {
      message = `Bonjour ${estimation.client.name}, voici votre estimation ${estimation.id} d'un montant de ${formatCurrency(calculations.totalTTC)}. Ref: ${estimation.id}\n\nDate: ${new Date().toLocaleString('fr-FR')}`;
    } else {
      message = `COMMANDE TECHNIQUE - Estimation #${estimation.id}\n`;
      message += `Date d'envoi: ${new Date().toLocaleString('fr-FR')}\n\n`;
      message += `Détails des produits :\n`;
      estimation.products.forEach(p => {
        message += `- ${p.quantity}x ${p.name}\n`;
        message += `  Spécifications techniques:\n`;
        if (p.specs) {
          Object.entries(p.specs).forEach(([key, val]) => {
            if (val) message += `  * ${key}: ${val}\n`;
          });
        }
        message += `\n`;
      });
      if (estimation.supplierNotes) {
        message += `Notes complémentaires: ${estimation.supplierNotes}\n`;
      }
    }

    const encodedMessage = encodeURIComponent(message);
    let url = '';

    if (platform === 'whatsapp') {
      url = `https://wa.me/${estimation.client.phone.replace(/\s+/g, '')}?text=${encodedMessage}`;
    } else {
      url = `https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodedMessage}`;
    }

    window.open(url, '_blank');
    addHistory(`Partage estimation sur ${platform} (${profile})`);
  };

  return (
    <div className="h-full w-full bg-[#09090b] text-white flex flex-col font-['Inter'] relative overflow-hidden">
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none" style={{
        backgroundImage: `
          linear-gradient(rgba(59, 130, 246, 0.3) 1px, transparent 1px),
          linear-gradient(90deg, rgba(59, 130, 246, 0.3) 1px, transparent 1px)
        `,
        backgroundSize: '50px 50px'
      }} />
      
      <motion.aside 
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 150, restDelta: 0.001 }}
        className="h-full w-full bg-[#09090b] flex flex-col relative"
      >
        <div className="h-28 border-b border-white/[0.08] flex items-center justify-between px-10 bg-black/70 backdrop-blur-3xl sticky top-0 z-20">
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#3b82f6]/20 to-transparent" />
          <div className="flex items-center gap-5">
            {onClose && (
              <button onClick={onClose} className="w-12 h-12 flex items-center justify-center hover:bg-white/[0.05] border border-white/[0.05] hover:border-[#3b82f6]/30 rounded-2xl text-zinc-500 hover:text-white transition-all duration-300 group active:scale-95">
                <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform duration-300" />
              </button>
            )}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-2 h-2 rounded-full bg-[#6dff1d] animate-pulse shadow-[0_0_10px_#6dff1d]" />
                <h2 className="text-2xl  font-black text-white tracking-tight uppercase">
                  Détails Technique & Commercial
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[#3b82f6]  text-[11px] font-bold tracking-wider px-3 py-1 bg-[#3b82f6]/10 border border-[#3b82f6]/20 rounded-lg">{estimation.id}</span>
                <div className="w-1 h-1 rounded-full bg-white/20" />
                {projectEstimation.isReturned ? (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-[9px] text-red-500  font-bold uppercase tracking-[0.4em]">
                      RETOURNÉ
                    </span>
                  </div>
                ) : (
                  <span className="text-[9px] text-zinc-600  font-bold uppercase tracking-[0.4em]">
                    STATUS: {projectEstimation.status?.toUpperCase() || 'EN ATTENTE'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Affichage cause du retour */}
          {projectEstimation.isReturned && projectEstimation.returnReason && (
            <div className="mx-8 mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle size={14} className="text-red-500" />
                <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Motif du retour</span>
              </div>
              <p className="text-sm text-white font-medium">{projectEstimation.returnReason}</p>
              {projectEstimation.returnSubject && (
                <p className="text-xs text-red-400 mt-1">Sujet: {projectEstimation.returnSubject}</p>
              )}
            </div>
          )}

          <div className="flex items-center gap-4">
            {profile === 'supplier' && (
              <>
                {projectEstimation.isReturned && (
                  <button 
                    onClick={() => setIsReturnReasonOpen(true)}
                    className="h-12 px-5 rounded-2xl bg-red-500/10 border border-red-500/30 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-red-500/20 hover:border-red-500/50 transition-all duration-300 text-red-500 flex items-center gap-3 active:scale-95"
                  >
                    <Mail size={16} /> Motif Retour
                  </button>
                )}
                <button 
                  onClick={() => setIsTransmitModalOpen(true)}
                  className="h-12 px-6 rounded-2xl bg-[#10b981]/10 border border-[#10b981]/30 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-[#10b981]/20 hover:border-[#10b981]/50 transition-all duration-300 text-[#10b981] flex items-center gap-3 active:scale-95 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
                >
                  <SendHorizontal size={16} /> Transmettre
                </button>
              </>
            )}
            
            <button 
              onClick={() => setIsHistoryPanelOpen(true)} 
              className="h-12 px-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-300 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 hover:text-white flex items-center gap-3 active:scale-95"
            >
              <HistoryIcon size={16} className="text-[#3b82f6]" /> Historique
            </button>
            
            {profile === 'client' && (
              <div className="flex items-center gap-3 pl-4 border-l border-white/[0.08]">
                <button 
                  onClick={() => setIsEditMode(!isEditMode)} 
                  className={`h-12 px-5 rounded-2xl border text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-500 flex items-center gap-3 active:scale-95 ${
                    isEditMode 
                      ? 'bg-[#f59e0b]/15 border-[#f59e0b]/50 text-[#f59e0b] shadow-[0_0_30px_rgba(245,158,11,0.2),inset_0_0_20px_rgba(245,158,11,0.05)]' 
                      : 'bg-white/[0.03] border-white/[0.08] text-zinc-500 hover:text-white hover:bg-white/[0.06]'
                  }`}
                >
                  <Pencil size={16} /> {isEditMode ? 'Quitter' : 'Éditer'}
                </button>
                                
                <button 
                  onClick={() => shareEstimation('whatsapp')} 
                  className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] hover:border-[#3b82f6]/30 transition-all duration-300 text-white flex items-center justify-center active:scale-95"
                >
                  <Share2 size={18} className="text-[#3b82f6]" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-10 space-y-12 relative custom-scrollbar">
          <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-[#3b82f6]/10 to-transparent" />
          
          <AnimatePresence>
            {aiResult && (
              <motion.section 
                initial={{ opacity: 0, scale: 0.95, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                className="bg-[#18181b]/80 border border-[#3b82f6]/20 p-8 space-y-4 rounded-3xl backdrop-blur-xl shadow-[0_0_40px_rgba(59,130,246,0.1)] relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#3b82f6]/50 to-transparent" />
                <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-[#3b82f6]/30 rounded-tl-xl" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-[#3b82f6]/30 rounded-br-xl" />
                <div className="flex items-center justify-between">
                  <h3 className="text-xs  font-bold uppercase tracking-[0.2em] text-[#3b82f6] flex items-center gap-3">
                    <Sparkles size={16} className="animate-pulse" /> {aiResult.title}
                  </h3>
                  <button onClick={() => setAiResult(null)} className="w-8 h-8 flex items-center justify-center hover:bg-white/5 rounded-lg text-zinc-500 hover:text-white transition-all"><X size={14} /></button>
                </div>
                <div className="text-sm leading-relaxed text-white/80 whitespace-pre-wrap  bg-black/30 p-4 rounded-xl border border-white/[0.05]">{aiResult.content}</div>
              </motion.section>
            )}
          </AnimatePresence>

          <div className="space-y-8">
            <div className="flex justify-center">
              <div className="flex p-1.5 bg-black/60 border border-white/[0.05] rounded-2xl shadow-[inset_0_0_30px_rgba(0,0,0,0.5)] backdrop-blur-xl relative">
                <div className="absolute inset-0 bg-gradient-to-r from-[#3b82f6]/5 via-transparent to-[#3b82f6]/5 rounded-2xl" />
                <button 
                  onClick={() => { setProfile('client'); addHistory('Switch Profil: Client'); }} 
                  className={`px-10 py-4 rounded-xl text-xs  font-bold uppercase transition-all duration-500 tracking-[0.15em] flex items-center gap-3 active:scale-95 relative ${
                    profile === 'client' 
                      ? 'bg-gradient-to-r from-[#3b82f6] to-[#2563eb] text-white shadow-[0_0_30px_rgba(59,130,246,0.4)]' 
                      : 'text-zinc-500 hover:text-white'
                  }`}
                >
                  <User size={16} /> Profil Client
                </button>
                <button 
                  onClick={() => { setProfile('supplier'); addHistory('Switch Profil: Fournisseur'); }} 
                  className={`px-10 py-4 rounded-xl text-xs  font-bold uppercase transition-all duration-500 tracking-[0.15em] flex items-center gap-3 active:scale-95 relative ${
                    profile === 'supplier' 
                      ? 'bg-gradient-to-r from-[#3b82f6] to-[#2563eb] text-white shadow-[0_0_30px_rgba(59,130,246,0.4)]' 
                      : 'text-zinc-500 hover:text-white'
                  }`}
                >
                  <Truck size={16} /> Profil Fournisseur
                </button>
              </div>
            </div>

            {profile === 'supplier' && (
              <div className="grid grid-cols-2 gap-6">
                <button 
                  className="flex items-center justify-center gap-5 p-6 bg-[#18181b] border border-white/[0.05] rounded-3xl hover:border-[#3b82f6]/40 transition-all duration-500 group active:scale-[0.98] shadow-xl relative overflow-hidden"
                  onClick={handleSummary}
                  disabled={isAiLoading}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-[#3b82f6]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="w-14 h-14 rounded-2xl bg-[#3b82f6]/10 flex items-center justify-center text-[#3b82f6] group-hover:bg-[#3b82f6] group-hover:text-white group-hover:shadow-[0_0_30px_rgba(59,130,246,0.4)] transition-all duration-500 shadow-inner">
                    {isAiLoading ? <Loader2 size={20} className="animate-spin" /> : <FileText size={22} />}
                  </div>
                  <div className="text-left relative">
                    <h4 className=" font-bold text-white group-hover:text-[#3b82f6] transition-colors text-[11px] tracking-[0.15em] uppercase">GÉNÉRER SYNTHÈSE</h4>
                    <p className="text-[9px] text-zinc-600 uppercase tracking-tight ">AI Intelligence Dossier</p>
                  </div>
                </button>
                <button 
                  className="flex items-center justify-center gap-5 p-6 bg-[#18181b] border border-white/[0.05] rounded-3xl hover:border-[#3b82f6]/40 transition-all duration-500 group active:scale-[0.98] shadow-xl relative overflow-hidden"
                  onClick={handleTranslate}
                  disabled={isAiLoading}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-[#3b82f6]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="w-14 h-14 rounded-2xl bg-[#3b82f6]/10 flex items-center justify-center text-[#3b82f6] group-hover:bg-[#3b82f6] group-hover:text-white group-hover:shadow-[0_0_30px_rgba(59,130,246,0.4)] transition-all duration-500 shadow-inner">
                    {isAiLoading ? <Loader2 size={20} className="animate-spin" /> : <Languages size={22} />}
                  </div>
                  <div className="text-left relative">
                    <h4 className=" font-bold text-white group-hover:text-[#3b82f6] transition-colors text-[11px] tracking-[0.15em] uppercase">TRADUIRE CHINOIS</h4>
                    <p className="text-[9px] text-zinc-600 uppercase tracking-tight ">Factory Export Tool</p>
                  </div>
                </button>
              </div>
            )}
          </div>

          <AnimatePresence>
            {profile === 'client' && (
              <motion.section 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 30 }}
                className="space-y-6"
              >
                <h3 className="text-[10px]  font-bold uppercase tracking-[0.4em] text-[#3b82f6] flex items-center gap-4">
                  <span className="w-12 h-px bg-gradient-to-r from-[#3b82f6] to-transparent" />
                  <User size={14} />
                  <span>État Civil & Configuration</span>
                </h3>
                <div className={`bg-[#18181b] p-8 rounded-3xl transition-all duration-700 relative overflow-hidden ${
                  isEditMode 
                    ? 'border-2 border-[#f59e0b]/40 shadow-[0_0_50px_rgba(245,158,11,0.1),inset_0_0_50px_rgba(245,158,11,0.02)]' 
                    : 'border border-white/[0.05] shadow-2xl'
                }`}>
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.1] to-transparent" />
                  <div className="absolute top-0 left-0 w-8 h-8 border-l border-t border-white/[0.1] rounded-tl-2xl" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-r border-b border-white/[0.1] rounded-br-2xl" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <span className="text-[9px] text-zinc-600  font-bold uppercase tracking-[0.3em] pl-2">Contact Principal</span>
                      <input 
                        type="text" 
                        disabled={!isEditMode}
                        value={estimation.client.name}
                        onChange={(e) => updateClient('name', e.target.value)}
                        className={`w-full py-4 bg-black/50 border transition-all duration-300 focus:outline-none px-5 rounded-2xl text-sm font-bold shadow-inner ${
                          isEditMode 
                            ? 'border-[#f59e0b]/30 focus:border-[#f59e0b]/60 text-white placeholder:text-zinc-600' 
                            : 'border-white/[0.05] text-white'
                        }`} 
                      />
                    </div>
                    <div className="space-y-3">
                      <span className="text-[9px] text-zinc-600  font-bold uppercase tracking-[0.3em] pl-2">Entreprise</span>
                      <input 
                        type="text" 
                        disabled={!isEditMode}
                        value={estimation.client.company || ''}
                        onChange={(e) => updateClient('company', e.target.value)}
                        className={`w-full py-4 bg-black/50 border transition-all duration-300 focus:outline-none px-5 rounded-2xl text-sm font-bold shadow-inner ${
                          isEditMode 
                            ? 'border-[#f59e0b]/30 focus:border-[#f59e0b]/60 text-white placeholder:text-zinc-600' 
                            : 'border-white/[0.05] text-white'
                        }`} 
                      />
                    </div>
                    <div className="space-y-3">
                      <span className="text-[9px] text-zinc-600  font-bold uppercase tracking-[0.3em] pl-2">Email</span>
                      <input 
                        type="text" 
                        disabled={!isEditMode}
                        value={estimation.client.email}
                        onChange={(e) => updateClient('email', e.target.value)}
                        className={`w-full py-4 bg-black/50 border transition-all duration-300 focus:outline-none px-5 rounded-2xl text-sm font-bold  shadow-inner ${
                          isEditMode 
                            ? 'border-[#f59e0b]/30 focus:border-[#f59e0b]/60 text-white placeholder:text-zinc-600' 
                            : 'border-white/[0.05] text-white'
                        }`} 
                      />
                    </div>
                    <div className="space-y-3">
                      <span className="text-[9px] text-zinc-600  font-bold uppercase tracking-[0.3em] pl-2">WhatsApp</span>
                      <input 
                        type="text" 
                        disabled={!isEditMode}
                        value={estimation.client.phone}
                        onChange={(e) => updateClient('phone', e.target.value)}
                        className={`w-full py-4 bg-black/50 border transition-all duration-300 focus:outline-none px-5 rounded-2xl text-sm font-bold  shadow-inner ${
                          isEditMode 
                            ? 'border-[#f59e0b]/30 focus:border-[#f59e0b]/60 text-white placeholder:text-zinc-600' 
                            : 'border-white/[0.05] text-white'
                        }`} 
                      />
                    </div>
                    <div className="md:col-span-2 space-y-3">
                      <span className="text-[9px] text-zinc-600  font-bold uppercase tracking-[0.3em] pl-2">Adresse de livraison</span>
                      <input 
                        type="text" 
                        disabled={!isEditMode}
                        value={estimation.client.address || ''}
                        onChange={(e) => updateClient('address', e.target.value)}
                        className={`w-full py-4 bg-black/50 border transition-all duration-300 focus:outline-none px-5 rounded-2xl text-sm font-bold shadow-inner ${
                          isEditMode 
                            ? 'border-[#f59e0b]/30 focus:border-[#f59e0b]/60 text-white placeholder:text-zinc-600' 
                            : 'border-white/[0.05] text-white'
                        }`} 
                      />
                    </div>
                  </div>
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {(profile === 'client' || (profile === 'supplier' && !estimation.hidePhotoFromSupplier)) && (
              <motion.section 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 30 }}
                className="space-y-6"
              >
                <h3 className="text-[10px]  font-bold uppercase tracking-[0.4em] text-[#3b82f6] flex items-center gap-4">
                  <span className="w-12 h-px bg-gradient-to-r from-[#3b82f6] to-transparent" />
                  <ImageIcon size={14} />
                  <span>Photo du Lieu</span>
                </h3>
                <div className="bg-[#18181b] border border-white/[0.05] p-8 rounded-3xl group shadow-2xl overflow-hidden relative">
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#3b82f6]/30 to-transparent" />
                  <div className="relative h-[400px] rounded-2xl overflow-hidden border border-white/[0.08] bg-black/60 group-hover:border-[#3b82f6]/30 transition-all duration-700 shadow-inner">
                    {estimation.client.sitePhoto ? (
                      <>
                        <img 
                          src={estimation.client.sitePhoto} 
                          alt="Site" 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover transition-all duration-700 cursor-pointer group-hover:scale-105" 
                          onClick={() => setFullscreenPhoto(estimation.client.sitePhoto!)}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                        <div className="absolute inset-0 bg-[#3b82f6]/0 group-hover:bg-[#3b82f6]/5 transition-all duration-500" />
                        <div className="absolute top-6 right-6 flex gap-3 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0">
                          <button 
                            onClick={() => setFullscreenPhoto(estimation.client.sitePhoto!)}
                            className="w-14 h-14 flex items-center justify-center bg-black/70 backdrop-blur-xl rounded-2xl text-white border border-white/10 hover:bg-[#3b82f6] hover:border-[#3b82f6] transition-all duration-300 shadow-2xl active:scale-95"
                          >
                            <Maximize2 size={20} />
                          </button>
                          {profile === 'client' && isEditMode && (
                            <button 
                              onClick={() => {
                                setEstimation({ ...estimation, client: { ...estimation.client, sitePhoto: undefined } });
                                addHistory("Suppression photo du site");
                              }}
                              className="w-14 h-14 flex items-center justify-center bg-red-500/80 backdrop-blur-xl rounded-2xl text-white border border-red-500/20 hover:bg-red-600 transition-all shadow-2xl active:scale-95"
                            >
                              <Trash2 size={20} />
                            </button>
                          )}
                        </div>
                        <div className="absolute bottom-6 left-6 flex items-center gap-3">
                          <div className="px-3 py-1.5 bg-black/60 backdrop-blur-xl rounded-lg border border-white/10 text-[9px]  text-zinc-400 uppercase tracking-wider">
                            Site Visualization
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600 text-xs gap-6">
                        <div className="w-32 h-32 rounded-full bg-white/[0.02] flex items-center justify-center border-2 border-dashed border-white/[0.1] relative">
                          <div className="absolute inset-4 rounded-full border border-white/[0.05]" />
                          <ImageIcon size={48} className="opacity-20" />
                        </div>
                        <span className=" font-bold uppercase tracking-[0.5em] opacity-30 text-[10px]">Awaiting Site Visualization</span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          <section className="space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px]  font-bold uppercase tracking-[0.4em] text-[#3b82f6] flex items-center gap-4">
                <span className="w-12 h-px bg-gradient-to-r from-[#3b82f6] to-transparent" />
                <Box size={14} />
                <span>{profile === 'supplier' ? 'Dossier Technique Produit' : 'Configuration Matérielle'}</span>
              </h3>
              {isEditMode && (
                <button onClick={addProduct} className="px-5 py-3 bg-[#3b82f6]/10 border border-[#3b82f6]/30 rounded-xl text-[9px]  font-bold uppercase tracking-[0.2em] text-[#3b82f6] flex items-center gap-3 hover:bg-[#3b82f6] hover:text-white hover:border-[#3b82f6] transition-all duration-300 active:scale-95 shadow-lg">
                  <Plus size={14} /> Ajouter Unité
                </button>
              )}
            </div>
            
            <div className="space-y-12">
              {estimation.products.map((p) => (
                <motion.div 
                  key={p.id} 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-[#18181b] rounded-[2rem] overflow-hidden group transition-all duration-700 shadow-2xl relative ${
                    isEditMode 
                      ? 'border-2 border-[#f59e0b]/30 shadow-[0_0_40px_rgba(245,158,11,0.08)]' 
                      : 'border border-white/[0.05]'
                  }`}
                >
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-[#3b82f6]/40 via-[#3b82f6]/20 to-transparent" />
                  <div className="absolute top-0 right-0 w-64 h-64 bg-[#3b82f6]/5 rounded-full blur-[100px]" />
                  
                  <div className="p-12 relative">
                    <div className="flex items-start justify-between gap-8 mb-14">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-16 h-px bg-gradient-to-r from-[#3b82f6] to-transparent" />
                          <span className="text-[9px] text-[#3b82f6]  font-bold uppercase tracking-[0.5em] block">Module Hardware Specification</span>
                        </div>
                        {isEditMode ? (
                          <input 
                            value={p.name}
                            onChange={(e) => {
                              const newProducts = estimation.products.map(prod => prod.id === p.id ? { ...prod, name: e.target.value } : prod);
                              setEstimation({ ...estimation, products: newProducts });
                            }}
                            className="w-full bg-black/50 border border-[#f59e0b]/30 rounded-2xl px-8 py-5 focus:border-[#f59e0b]/60 outline-none text-3xl  font-black text-white uppercase tracking-tight shadow-inner"
                          />
                        ) : (
                          <div className="text-4xl  font-black text-white uppercase tracking-tighter leading-none">{p.name}</div>
                        )}
                      </div>
                      {isEditMode && (
                        <button onClick={() => removeProduct(p.id)} className="w-14 h-14 flex items-center justify-center text-red-500/40 hover:text-white hover:bg-red-500/20 rounded-2xl transition-all duration-300 active:scale-95 border border-red-500/20 hover:border-red-500/40">
                          <Trash2 size={20} />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <NumericControl 
                        label="Quantité"
                        value={p.quantity}
                        onChange={(val) => {
                          const newProducts = estimation.products.map(prod => prod.id === p.id ? { ...prod, quantity: val } : prod);
                          setEstimation({ ...estimation, products: newProducts });
                        }}
                        isEditMode={isEditMode}
                      />
                      <NumericControl 
                        label="Prix Unitaire (€)"
                        unit="€"
                        value={p.unitPrice}
                        onChange={(val) => {
                          const newProducts = estimation.products.map(prod => prod.id === p.id ? { ...prod, unitPrice: val } : prod);
                          setEstimation({ ...estimation, products: newProducts });
                        }}
                        isEditMode={isEditMode}
                      />
                      <NumericControl 
                        label="Remise (%)"
                        unit="%"
                        value={p.discount || 0}
                        onChange={(val) => {
                          const newProducts = estimation.products.map(prod => prod.id === p.id ? { ...prod, discount: val } : prod);
                          setEstimation({ ...estimation, products: newProducts });
                        }}
                        isEditMode={isEditMode}
                      />
                    </div>

                    <div className="mt-14 pt-10 border-t border-white/[0.05] flex items-end justify-between">
                      <div className="space-y-3">
                        <span className="text-[9px] text-zinc-700  font-bold uppercase tracking-[0.2em] block">Technical Tracking ID</span>
                        <span className="text-xs  text-zinc-500 bg-white/[0.03] px-4 py-2 rounded-lg border border-white/[0.05]">0x{p.id.slice(0,8).toUpperCase()}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] text-zinc-600  font-bold uppercase tracking-[0.2em] block mb-3">Calculated Subtotal (HT)</span>
                        <div className="flex items-center gap-6 justify-end">
                          {p.discount > 0 && (
                            <span className="text-lg text-red-500/30 line-through ">
                              {formatCurrency(p.quantity * p.unitPrice)}
                            </span>
                          )}
                          <span className="text-5xl  font-black text-white tracking-tighter">
                            {formatCurrency((p.quantity * p.unitPrice) * (1 - (p.discount || 0) / 100))}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="px-12 pb-12">
                    <div className="bg-black/70 rounded-[1.5rem] border border-white/[0.05] p-6 shadow-inner relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-[#3b82f6]/3 via-transparent to-[#10b981]/3 rounded-[1.5rem]" />
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 relative">
                        <TechSpecCard icon={<Monitor size={16} />} label="Surface" value={p.specs?.surface || 'N/A'} color="#38bdf8" />
                        <TechSpecCard icon={<Grid3X3 size={16} />} label="Résolution" value={p.specs?.resolution || 'N/A'} color="#a78bfa" />
                        <TechSpecCard icon={<Layers size={16} />} label="Modules" value={p.specs?.ledModules?.toString() || 'N/A'} color="#f472b6" />
                        <TechSpecCard icon={<TrendingDown size={16} />} label="Pitch" value={p.specs?.pixelPitch || 'N/A'} color="#34d399" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          <AnimatePresence>
            {profile === 'client' && (
              <motion.section 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 30 }}
                className="space-y-6"
              >
                <h3 className="text-[10px]  font-bold uppercase tracking-[0.4em] text-[#3b82f6] flex items-center gap-4">
                  <span className="w-12 h-px bg-gradient-to-r from-[#3b82f6] to-transparent" />
                  <Truck size={14} />
                  <span>Logistique & Services</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-[#18181b] border border-white/[0.05] p-8 rounded-3xl space-y-8 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#3b82f6]/40 to-transparent" />
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#3b82f6]/5 rounded-full blur-[60px]" />
                    <div className="flex justify-between items-start relative">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-[#3b82f6]/10 flex items-center justify-center text-[#3b82f6] shadow-inner group-hover:bg-[#3b82f6] group-hover:text-white group-hover:shadow-[0_0_30px_rgba(59,130,246,0.4)] transition-all duration-500">
                          <Truck size={26} />
                        </div>
                        <div>
                          <div className="text-[10px]  font-bold uppercase tracking-widest text-white mb-1">Logistique Livraison</div>
                          <div className="text-[10px] text-zinc-600 ">CITY_CORE: <span className="text-white uppercase">{estimation.deliveryCity || 'NOT_FOUND'}</span></div>
                        </div>
                      </div>
                      <span className="text-3xl  font-black text-[#3b82f6]">{formatCurrency(calculations.deliveryTotal)}</span>
                    </div>
                    {isEditMode && (
                      <div className="grid grid-cols-2 gap-5 pt-6 border-t border-white/[0.05]">
                        <NumericControl 
                          label="Initial (€)" 
                          unit="€" 
                          value={estimation.deliveryCost} 
                          onChange={(val) => setEstimation({...estimation, deliveryCost: val})}
                          isEditMode={isEditMode}
                        />
                        <NumericControl 
                          label="Remise (%)" 
                          unit="%" 
                          value={estimation.deliveryDiscount} 
                          onChange={(val) => setEstimation({...estimation, deliveryDiscount: val})}
                          isEditMode={isEditMode}
                        />
                      </div>
                    )}
                  </div>

                  <div className="bg-[#18181b] border border-white/[0.05] p-8 rounded-3xl space-y-8 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#10b981]/40 to-transparent" />
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#10b981]/5 rounded-full blur-[60px]" />
                    <div className="flex justify-between items-start relative">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-[#10b981]/10 flex items-center justify-center text-[#10b981] shadow-inner group-hover:bg-[#10b981] group-hover:text-white group-hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] transition-all duration-500">
                          <Wrench size={26} />
                        </div>
                        <div>
                          <div className="text-[10px]  font-bold uppercase tracking-widest text-white mb-1">Installation Tech</div>
                          <div className="text-[10px] text-zinc-600 ">OPERATIONAL_LABOR</div>
                        </div>
                      </div>
                      <span className="text-3xl  font-black text-[#10b981]">{formatCurrency(calculations.laborTotal)}</span>
                    </div>
                    {isEditMode && (
                      <div className="grid grid-cols-2 gap-5 pt-6 border-t border-white/[0.05]">
                        <NumericControl 
                          label="Initial (€)" 
                          unit="€" 
                          value={estimation.laborCost} 
                          onChange={(val) => setEstimation({...estimation, laborCost: val})}
                          isEditMode={isEditMode}
                        />
                        <NumericControl 
                          label="Remise (%)" 
                          unit="%" 
                          value={estimation.laborDiscount} 
                          onChange={(val) => setEstimation({...estimation, laborDiscount: val})}
                          isEditMode={isEditMode}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {profile === 'client' && (
              <motion.div 
                layout
                initial={false}
                animate={{ 
                  height: isSummaryExpanded ? 'auto' : '60px',
                  y: 0, 
                  opacity: 1 
                }}
                className={cn(
                  "border-t border-white/[0.08] bg-gradient-to-b from-black/80 to-black/60 backdrop-blur-3xl mt-16 shadow-[0_-20px_80px_rgba(0,0,0,0.8)] relative overflow-hidden transition-all duration-500",
                  isSummaryExpanded ? "p-12 rounded-[2.5rem]" : "p-0 rounded-2xl cursor-pointer hover:bg-black/90"
                )}
                onClick={() => !isSummaryExpanded && setIsSummaryExpanded(true)}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#6dff1d]/3 via-transparent to-[#24c7ff]/3 pointer-events-none" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                
                {/* Toggle Button (Green Bar) */}
                <div className="flex justify-center mb-6 relative z-30">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsSummaryExpanded(!isSummaryExpanded);
                    }}
                    className={cn(
                      "w-48 h-2 rounded-full transition-all duration-500 shadow-[0_0_15px_rgba(109,255,29,0.3)] hover:shadow-[0_0_25px_rgba(109,255,29,0.5)]",
                      isSummaryExpanded ? "bg-[#6dff1d]/40" : "bg-[#6dff1d] h-3 mt-6"
                    )}
                  />
                </div>

                <AnimatePresence mode="wait">
                  {isSummaryExpanded && (
                    <motion.div
                      key="summary-content"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      className="flex flex-col lg:flex-row items-end justify-between gap-12 relative"
                    >
                      <div className="flex-1 bg-[#18181b] p-10 rounded-3xl border border-white/[0.05] w-full shadow-inner relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#3b82f6]/5 to-transparent pointer-events-none" />
                        <div className="space-y-8 relative">
                          <div className="flex justify-between items-end border-b border-white/[0.05] pb-8">
                            <div className="flex flex-col gap-2">
                              <span className="text-[9px] text-zinc-700 uppercase  font-bold tracking-[0.3em]">Sous-total Net HT</span>
                              <span className="text-4xl  font-black text-white tracking-tighter">{formatCurrency(calculations.subtotalHT)}</span>
                            </div>
                            <div className="text-right flex flex-col items-end gap-2">
                              <span className="text-[9px] text-zinc-700 uppercase  font-bold tracking-[0.3em]">Hardware Tax (TVA)</span>
                              <span className=" text-2xl text-[#3b82f6] font-black">+{formatCurrency(calculations.tva)}</span>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-6">
                            <NumericControl 
                              label="TVA (%)"
                              unit="%"
                              value={estimation.taxRate}
                              onChange={(val) => setEstimation({...estimation, taxRate: val})}
                              isEditMode={isEditMode}
                            />
                            <NumericControl 
                              label="REMISE GLOBALE (%)"
                              unit="%"
                              value={estimation.globalDiscount}
                              onChange={(val) => setEstimation({...estimation, globalDiscount: val})}
                              isEditMode={isEditMode}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="text-right flex flex-col justify-end min-w-[350px] relative">
                        <div className="absolute -top-12 right-0 w-64 h-64 bg-[#6dff1d]/10 rounded-full blur-[100px] pointer-events-none" />
                        
                        <div className="text-[#24c7ff] text-[11px]  font-bold uppercase mb-6 tracking-[0.8em] pr-4 relative">
                          <span className="absolute -left-4 top-1/2 -translate-y-1/2 w-2 h-2 bg-[#24c7ff] rounded-full shadow-[0_0_10px_#24c7ff]" />
                          À PAYER (TTC)
                        </div>
                        
                        <div className="text-7xl  font-black tracking-tighter text-[#6dff1d] relative" style={{ textShadow: '0 0 40px rgba(109, 255, 29, 0.5), 0 0 80px rgba(109, 255, 29, 0.3), 0 0 120px rgba(109, 255, 29, 0.1)' }}>
                          {formatCurrency(calculations.finalTotal)}
                        </div>
                        
                        {estimation.globalDiscount > 0 && (
                          <div className="text-[10px] text-[#6dff1d]  font-bold mt-8 uppercase tracking-[0.3em] bg-[#6dff1d]/10 border border-[#6dff1d]/20 px-6 py-3 rounded-full w-fit ml-auto shadow-[0_0_30px_rgba(109,255,29,0.15)] relative">
                            SAVINGS: {formatCurrency(calculations.totalTTC - calculations.finalTotal)}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.aside>

      <TransmitModal 
        isOpen={isTransmitModalOpen}
        onClose={() => setIsTransmitModalOpen(false)}
        onConfirm={async (supplierId, supplierName, message) => {
          try {
            await updateQuoteStatus(estimation.id, {
              status: 'processed',
              supplierId: supplierId,
              supplierNotes: message
            });
            setIsTransmitModalOpen(false);
            onClose?.();
          } catch (error) {
            console.error('Error transmitting:', error);
          }
        }}
      />

      <ReturnReasonPopup 
        isOpen={isReturnReasonOpen}
        onClose={() => setIsReturnReasonOpen(false)}
        reason={projectEstimation.returnReason || ''}
      />


      <AnimatePresence>
        {isHistoryPanelOpen && (
          <div className="fixed inset-0 z-[800] flex justify-end">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsHistoryPanelOpen(false)} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 200 }} className="relative w-full max-w-lg bg-[#09090b] h-full flex flex-col border-l border-white/[0.08] shadow-2xl">
              <div className="p-10 border-b border-white/[0.08] flex items-center justify-between bg-black/50 h-28 backdrop-blur-xl">
                <div className="flex items-center gap-5">
                  <div className="w-10 h-10 rounded-xl bg-[#3b82f6]/10 flex items-center justify-center text-[#3b82f6]">
                    <HistoryIcon size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl  font-black uppercase tracking-tighter">Historique</h2>
                    <div className="text-[10px] text-zinc-600 uppercase  font-bold tracking-widest mt-0.5">{estimation.id}</div>
                  </div>
                </div>
                <button onClick={() => setIsHistoryPanelOpen(false)} className="w-10 h-10 flex items-center justify-center hover:bg-white/5 rounded-xl transition-all text-zinc-500"><X size={20} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar">
                {estimation.history.map((entry) => (
                  <div key={entry.id} className="relative pl-10 border-l border-[#3b82f6]/20 pb-8 last:pb-0">
                    <div className="absolute left-[-5px] top-0 w-3 h-3 rounded-full bg-[#3b82f6] shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                    <div className="flex justify-between items-start mb-2 text-[9px]  text-zinc-600">
                      <span>{entry.timestamp}</span>
                      <span className="px-3 py-1 rounded-lg bg-white/[0.03] border border-white/[0.05] uppercase font-bold">{entry.user}</span>
                    </div>
                    <div className="text-sm font-bold text-white/80 leading-snug">{entry.action}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {aiResult && (
          <div className="fixed inset-0 bg-black/95 z-[900] flex items-center justify-center p-8">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-2xl bg-[#18181b] border border-white/[0.08] rounded-3xl overflow-hidden shadow-2xl flex flex-col">
              <div className="p-8 border-b border-white/[0.05] flex items-center justify-between bg-gradient-to-r from-[#3b82f6]/10 to-transparent">
                <h2 className="text-xl  font-bold flex items-center gap-3"><Sparkles className="text-[#3b82f6]" /> {aiResult.title}</h2>
                <button onClick={() => setAiResult(null)} className="w-10 h-10 flex items-center justify-center hover:bg-white/5 rounded-xl transition-all"><X size={20} /></button>
              </div>
              <div className="p-8 overflow-y-auto text-sm text-zinc-300 leading-relaxed  bg-black/30 m-6 rounded-2xl border border-white/[0.05]">
                {aiResult.content}
              </div>
              <div className="p-6 border-t border-white/[0.05] flex justify-end gap-4">
                <button onClick={() => { navigator.clipboard.writeText(aiResult.content); addHistory('Copie résultat IA'); }} className="px-6 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-xs  font-bold uppercase transition-all hover:bg-white/[0.06]">Copier</button>
                <button onClick={() => setAiResult(null)} className="px-6 py-3 bg-gradient-to-r from-[#3b82f6] to-[#2563eb] text-white rounded-xl text-xs  font-bold uppercase shadow-[0_0_20px_rgba(59,130,246,0.3)]">Fermer</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {fullscreenPhoto && (
        <div className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-8" onClick={() => setFullscreenPhoto(null)}>
          <img src={fullscreenPhoto} className="max-w-full max-h-full rounded-2xl shadow-2xl object-contain border border-white/[0.1]" referrerPolicy="no-referrer" />
          <button className="absolute top-8 right-8 w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-xl border border-white/10 hover:bg-white/20 transition-all" onClick={() => setFullscreenPhoto(null)}>
            <X size={24} />
          </button>
        </div>
      )}
    </div>
  );
}

function NumericControl({ value, onChange, label, unit = "", isEditMode = false }: { value: number, onChange: (val: number) => void, label: string, unit?: string, isEditMode?: boolean }) {
  return (
    <div className="space-y-3 flex-1 min-w-0">
      <span className="text-[9px] text-zinc-600 uppercase  font-bold tracking-[0.25em] pl-2">{label}</span>
      <div className={`flex items-center rounded-2xl p-1.5 transition-all duration-300 ${
        isEditMode 
          ? 'bg-black/60 border border-[#f59e0b]/20 shadow-[inset_0_0_20px_rgba(245,158,11,0.05)]' 
          : 'bg-black/50 border border-white/[0.05]'
      }`}>
        <button 
          onClick={() => onChange(Math.max(0, value - 1))}
          className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 active:scale-90 ${
            isEditMode 
              ? 'bg-[#f59e0b]/10 text-[#f59e0b] hover:bg-[#f59e0b]/20 hover:text-white' 
              : 'bg-white/[0.03] text-zinc-500 hover:bg-[#3b82f6]/20 hover:text-[#3b82f6]'
          }`}
        >
          <Minus size={18} />
        </button>
        <div className="flex-1 flex items-center justify-center gap-2 px-4">
          <input 
            type="number"
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="bg-transparent border-none p-0 focus:ring-0 text-center  font-black text-2xl w-full text-white"
          />
          {unit && <span className={`text-sm  font-bold ${isEditMode ? 'text-[#f59e0b]' : 'text-[#3b82f6]'}`}>{unit}</span>}
        </div>
        <button 
          onClick={() => onChange(value + 1)}
          className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 active:scale-90 ${
            isEditMode 
              ? 'bg-[#f59e0b]/10 text-[#f59e0b] hover:bg-[#f59e0b]/20 hover:text-white' 
              : 'bg-white/[0.03] text-zinc-500 hover:bg-[#3b82f6]/20 hover:text-[#3b82f6]'
          }`}
        >
          <Plus size={18} />
        </button>
      </div>
    </div>
  );
}

function TechSpecCard({ icon, label, value, color = "#3b82f6" }: { icon: React.ReactNode, label: string, value: string, color?: string }) {
  return (
    <div className="flex items-center gap-4 p-4 bg-white/[0.02] border border-white/[0.05] rounded-2xl group hover:bg-white/[0.04] hover:border-white/[0.08] transition-all duration-300 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-10 h-10 bg-white/[0.02] rotate-45 translate-x-5 -translate-y-5" />
      <div 
        className="w-12 h-12 rounded-xl bg-black/50 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg"
        style={{ color, boxShadow: `0 0 20px ${color}20` }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[9px] text-zinc-700 uppercase  font-bold tracking-[0.2em] mb-1">{label}</div>
        <div className="text-sm  font-bold text-white/90 truncate">{value}</div>
      </div>
    </div>
  );
}
