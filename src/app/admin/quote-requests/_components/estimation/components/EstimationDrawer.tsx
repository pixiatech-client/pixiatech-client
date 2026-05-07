'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  User, 
  Settings, 
  Cpu, 
  CreditCard, 
  ChevronRight, 
  Plus, 
  Trash2, 
  Copy, 
  Package, 
  Truck, 
  CheckCircle2, 
  Clock,
  LayoutGrid,
  ShieldCheck,
  Eye,
  EyeOff
} from 'lucide-react';
import { QuoteRequest, ConfiguredProduct } from '@/lib/types';
import { cn } from '@/lib/utils';

interface EstimationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  data: QuoteRequest | null;
  onUpdate?: (updatedData: QuoteRequest) => void;
}

export const EstimationDrawer: React.FC<EstimationDrawerProps> = ({ 
  isOpen, 
  onClose, 
  data, 
  onUpdate 
}) => {
  const [activeTab, setActiveTab] = useState<'client' | 'hardware' | 'tech' | 'payment'>('client');
  const [viewMode, setViewMode] = useState<'client' | 'supplier'>('client');
  const [localData, setLocalData] = useState<QuoteRequest | null>(null);

  useEffect(() => {
    if (data) {
      setLocalData(JSON.parse(JSON.stringify(data)));
    }
  }, [data]);

  const totals = useMemo(() => {
    if (!localData) return { products: 0, installation: 0, delivery: 0, total: 0 };
    
    const productsTotal = localData.products?.reduce((sum, p) => sum + (p.lineTotal || 0), 0) || 0;
    const installation = localData.installationCost || 0;
    const delivery = localData.deliveryCost || 0;
    
    return {
      products: productsTotal,
      installation,
      delivery,
      total: productsTotal + installation + delivery
    };
  }, [localData]);

  if (!localData && isOpen) return null;

  const handleUpdateField = (path: string, value: any) => {
    if (!localData) return;
    const newData = { ...localData };
    
    // Simple path update for this demo
    if (path.includes('.')) {
      const parts = path.split('.');
      let current: any = newData;
      for (let i = 0; i < parts.length - 1; i++) {
        current = current[parts[i]];
      }
      current[parts[parts.length - 1]] = value;
    } else {
      (newData as any)[path] = value;
    }
    
    setLocalData(newData);
    onUpdate?.(newData);
  };

  const handleUpdateProduct = (index: number, field: string, value: any) => {
    if (!localData) return;
    const newProducts = [...localData.products];
    (newProducts[index] as any)[field] = value;
    
    // Recalculate line total if price or quantity changes
    if (field === 'quantity' || field === 'price') {
      const p = newProducts[index];
      // Note: lineTotal calculation logic depends on your business rules
      // Here we just use a basic multiplication
      p.lineTotal = (p.quantity || 1) * (p.width * p.height * 500); // Mock pricing logic
    }
    
    handleUpdateField('products', newProducts);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />

          {/* Drawer Panel */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-[650px] bg-[#09090b] border-l border-[#27272a] shadow-2xl z-[101] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 border-b border-[#27272a] bg-[#0c0c0e]">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                    <LayoutGrid className="text-blue-500" size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white tracking-tight uppercase">
                      Estimation <span className="text-blue-500">{localData?.id.slice(0, 8).toUpperCase()}</span>
                    </h2>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] mt-0.5">
                      Console de Modification "Aura Pro"
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setViewMode(viewMode === 'client' ? 'supplier' : 'client')}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border",
                      viewMode === 'client' 
                        ? "bg-blue-500/10 border-blue-500/20 text-blue-400" 
                        : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                    )}
                  >
                    {viewMode === 'client' ? <Eye size={14} /> : <EyeOff size={14} />}
                    {viewMode === 'client' ? 'Vue Client' : 'Vue Fournisseur'}
                  </button>
                  <button
                    onClick={onClose}
                    className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5 text-zinc-400 hover:text-white"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-2 p-1 bg-black/40 rounded-2xl border border-white/5">
                {[
                  { id: 'client', label: 'Client', icon: User },
                  { id: 'hardware', label: 'Matériel', icon: Settings },
                  { id: 'tech', label: 'Technique', icon: Cpu },
                  { id: 'payment', label: 'Paiement', icon: CreditCard },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all",
                      activeTab === tab.id 
                        ? "bg-[#18181b] text-white shadow-xl border border-white/5" 
                        : "text-zinc-500 hover:text-zinc-300"
                    )}
                  >
                    <tab.icon size={14} className={activeTab === tab.id ? "text-blue-500" : ""} />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
              
              {/* SECTION: CLIENT */}
              {activeTab === 'client' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="grid grid-cols-2 gap-6 text-['Space_Grotesk']">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Entreprise / Nom</label>
                      <input 
                        className="w-full bg-[#18181b] border border-white/5 rounded-2xl px-5 py-3.5 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all"
                        value={localData?.client.companyName}
                        onChange={(e) => handleUpdateField('client.companyName', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Email</label>
                      <input 
                        className="w-full bg-[#18181b] border border-white/5 rounded-2xl px-5 py-3.5 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all font-mono"
                        value={localData?.client.email}
                        onChange={(e) => handleUpdateField('client.email', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Téléphone</label>
                      <input 
                        className="w-full bg-[#18181b] border border-white/5 rounded-2xl px-5 py-3.5 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all"
                        value={localData?.client.phone}
                        onChange={(e) => handleUpdateField('client.phone', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Statut</label>
                      <div className="h-[52px] bg-[#18181b] border border-white/5 rounded-2xl px-5 flex items-center justify-between">
                         <span className="text-sm font-bold text-blue-500 uppercase">{localData?.status}</span>
                         <Clock size={16} className="text-zinc-600" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Commentaires Client</label>
                    <textarea 
                      className="w-full bg-[#18181b] border border-white/5 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all h-32 resize-none"
                      value={localData?.client.notes}
                      onChange={(e) => handleUpdateField('client.notes', e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* SECTION: HARDWARE */}
              {activeTab === 'hardware' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="flex items-center justify-between mb-4">
                     <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                       <Package size={16} className="text-blue-500" />
                       Configuration Écrans
                     </h3>
                     <button className="text-[10px] text-blue-500 font-bold uppercase tracking-widest hover:underline">+ Ajouter</button>
                  </div>
                  
                  <div className="space-y-4">
                    {localData?.products.map((product, idx) => (
                      <div key={idx} className="bg-[#18181b] border border-white/5 rounded-3xl p-6 relative group">
                        <div className="flex items-start justify-between mb-6">
                           <div className="flex gap-4">
                             <div className="w-16 h-16 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-center shrink-0">
                                <Settings size={32} className="text-zinc-700" />
                             </div>
                             <div>
                               <h4 className="font-bold text-white text-base leading-tight">{product.productName}</h4>
                               <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Série professionnelle {product.productType}</p>
                             </div>
                           </div>
                           <button className="opacity-0 group-hover:opacity-100 p-2 text-zinc-500 hover:text-red-500 transition-all">
                             <Trash2 size={18} />
                           </button>
                        </div>

                        <div className="grid grid-cols-4 gap-4">
                           <div className="space-y-1">
                             <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">Largeur</span>
                             <div className="bg-black/20 rounded-xl px-3 py-2 text-xs font-['Space_Grotesk'] text-white border border-white/5 flex items-center justify-between">
                               {product.width}m
                             </div>
                           </div>
                           <div className="space-y-1">
                             <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">Hauteur</span>
                             <div className="bg-black/20 rounded-xl px-3 py-2 text-xs font-['Space_Grotesk'] text-white border border-white/5 flex items-center justify-between">
                               {product.height}m
                             </div>
                           </div>
                           <div className="space-y-1">
                             <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">Quantité</span>
                             <input 
                               type="number"
                               className="w-full bg-black/40 rounded-xl px-3 py-2 text-xs font-['Space_Grotesk'] text-white border border-white/10 focus:border-blue-500 focus:outline-none"
                               value={product.quantity}
                               onChange={(e) => handleUpdateProduct(idx, 'quantity', parseInt(e.target.value))}
                             />
                           </div>
                           <div className="space-y-1">
                             <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">Prix (HT)</span>
                             <div className="bg-black/20 rounded-xl px-3 py-2 text-xs font-['Space_Grotesk'] text-[#10b981] font-bold border border-[#10b981]/10">
                               {product.lineTotal.toLocaleString('fr-FR')} €
                             </div>
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Options */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#18181b] border border-white/5 rounded-3xl p-5 flex items-center justify-between">
                       <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                           <Settings size={18} className="text-blue-500" />
                         </div>
                         <span className="text-[10px] font-bold text-white uppercase tracking-widest">Installation</span>
                       </div>
                       <input 
                         className="w-24 bg-black/40 border border-white/5 rounded-xl px-3 py-2 text-xs font-['Space_Grotesk'] text-white text-right focus:outline-none"
                         value={localData?.installationCost}
                         onChange={(e) => handleUpdateField('installationCost', parseFloat(e.target.value))}
                       />
                    </div>
                    <div className="bg-[#18181b] border border-white/5 rounded-3xl p-5 flex items-center justify-between">
                       <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                           <Truck size={18} className="text-emerald-500" />
                         </div>
                         <span className="text-[10px] font-bold text-white uppercase tracking-widest">Livraison</span>
                       </div>
                       <input 
                         className="w-24 bg-black/40 border border-white/5 rounded-xl px-3 py-2 text-xs font-['Space_Grotesk'] text-white text-right focus:outline-none"
                         value={localData?.deliveryCost}
                         onChange={(e) => handleUpdateField('deliveryCost', parseFloat(e.target.value))}
                       />
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION: TECHNICAL */}
              {activeTab === 'tech' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                   <div className="bg-blue-500/5 border border-blue-500/10 rounded-3xl p-6 flex gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                         <ShieldCheck size={28} className="text-blue-500" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white uppercase tracking-wide">Validation Technique</h4>
                        <p className="text-[11px] text-zinc-500 leading-relaxed mt-1">Ces spécifications sont transmises au fournisseur pour la validation de faisabilité.</p>
                      </div>
                   </div>

                   <div className="space-y-4">
                     <div className="space-y-1.5">
                       <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Notes Internes / Fournisseur</label>
                       <textarea 
                         className="w-full bg-[#18181b] border border-white/5 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all h-48 resize-none"
                         value={localData?.supplierNotes}
                         onChange={(e) => handleUpdateField('supplierNotes', e.target.value)}
                         placeholder="Instructions de fabrication, câblage, structure..."
                       />
                     </div>
                     <div className="p-5 bg-black/20 border border-white/5 rounded-2xl border-dashed">
                        <p className="text-[10px] text-zinc-600 text-center font-bold uppercase tracking-[0.2em]">Cliquer pour joindre un plan technique (.PDF)</p>
                     </div>
                   </div>
                </div>
              )}

              {/* SECTION: PAYMENT */}
              {activeTab === 'payment' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="grid grid-cols-3 gap-4">
                     <div className="bg-[#18181b] border border-white/5 rounded-3xl p-5 space-y-2">
                        <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Acompte (30%)</span>
                        <p className="text-base font-['Space_Grotesk'] font-bold text-white">{(totals.total * 0.3).toLocaleString('fr-FR')} €</p>
                        <div className="flex items-center gap-1.5 text-emerald-500">
                           <CheckCircle2 size={12} />
                           <span className="text-[8px] font-black uppercase tracking-widest">Payé</span>
                        </div>
                     </div>
                     <div className="bg-[#18181b] border border-white/5 rounded-3xl p-5 space-y-2">
                        <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Intermédiaire</span>
                        <p className="text-base font-['Space_Grotesk'] font-bold text-white">{(totals.total * 0.4).toLocaleString('fr-FR')} €</p>
                        <div className="flex items-center gap-1.5 text-zinc-600">
                           <Clock size={12} />
                           <span className="text-[8px] font-black uppercase tracking-widest">En attente</span>
                        </div>
                     </div>
                     <div className="bg-[#18181b] border border-white/5 rounded-3xl p-5 space-y-2 border-emerald-500/20 bg-emerald-500/5">
                        <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-[0.2em]">Solde</span>
                        <p className="text-base font-['Space_Grotesk'] font-bold text-white">{(totals.total * 0.3).toLocaleString('fr-FR')} €</p>
                        <div className="flex items-center gap-1.5 text-emerald-400">
                           <CheckCircle2 size={12} />
                           <span className="text-[8px] font-black uppercase tracking-widest">Généré</span>
                        </div>
                     </div>
                  </div>

                  <div className="bg-[#18181b] border border-white/5 rounded-3xl overflow-hidden">
                     <div className="p-5 border-b border-white/5 flex items-center justify-between bg-black/20">
                        <h4 className="text-[10px] font-bold text-white uppercase tracking-widest">Historique Transactions</h4>
                        <button className="p-2 text-zinc-500 hover:text-white"><Plus size={16} /></button>
                     </div>
                     <div className="divide-y divide-white/5">
                        {[1, 2].map(i => (
                          <div key={i} className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-all cursor-pointer group">
                             <div className="flex items-center gap-4">
                               <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center border border-white/5 text-zinc-700">
                                  <CreditCard size={18} />
                               </div>
                               <div>
                                 <p className="text-xs font-bold text-white">Virement SEPA #TRX-9482{i}</p>
                                 <p className="text-[9px] text-zinc-500 font-['JetBrains_Mono'] mt-0.5">20/04/2026 • 14:32</p>
                               </div>
                             </div>
                             <div className="text-right">
                               <p className="text-xs font-bold text-[#10b981] font-['Space_Grotesk']">+ 3 450,00 €</p>
                               <span className="text-[8px] font-black uppercase tracking-widest text-[#10b981]/60">Validé</span>
                             </div>
                          </div>
                        ))}
                     </div>
                  </div>
                </div>
              )}

            </div>

            {/* FIXED FOOTER WITH NEON HALO */}
            <div className="p-8 border-t border-[#27272a] bg-[#0c0c0e] relative">
               {/* Neon Glow */}
               <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4/5 h-[1px] bg-gradient-to-r from-transparent via-[#10b981] to-transparent shadow-[0_0_20px_rgba(16,185,129,0.8)]" />
               
               <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                     <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-[#10b981] rounded-full animate-pulse" />
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em]">À PAYER (TTC)</span>
                     </div>
                     <div className="text-4xl font-['Space_Grotesk'] font-black text-white tracking-tighter">
                        {totals.total.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} <span className="text-lg text-zinc-600 ml-1">€</span>
                     </div>
                  </div>
                  
                  <div className="flex gap-3">
                     <button className="px-8 py-4 bg-white/5 border border-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-white transition-all">
                        Bon de Commande
                     </button>
                     <button 
                       onClick={() => {
                         onUpdate?.(localData!);
                         onClose();
                       }}
                       className="px-10 py-4 bg-gradient-to-br from-[#10b981] to-[#059669] hover:from-[#34d399] hover:to-[#10b981] text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-xl shadow-emerald-900/20 transition-all active:scale-95"
                     >
                        Valider Modification
                     </button>
                  </div>
               </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
