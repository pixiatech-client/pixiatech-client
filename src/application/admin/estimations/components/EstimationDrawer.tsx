'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Pencil, User, Truck, Package, Settings, DollarSign, CreditCard,
  ChevronLeft, Plus, Minus, Save, Send, History, FileText, Calculator,
  Shield, CheckCircle2, AlertCircle, TrendingDown, Monitor, Grid3X3, Layers
} from 'lucide-react';

interface PaymentStep {
  id: string;
  label: string;
  amount: number;
  status: 'pending' | 'completed';
  date?: string;
}

interface Product {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  specs?: {
    surface?: string;
    resolution?: string;
    ledModules?: number;
    pixelPitch?: string;
  };
}

interface ClientInfo {
  name: string;
  email: string;
  phone: string;
  company?: string;
  address?: string;
}

interface EstimationData {
  id: string;
  client: ClientInfo;
  products: Product[];
  productDiscount?: number;
  deliveryCost?: number;
  deliveryDiscount?: number;
  laborCost?: number;
  laborDiscount?: number;
  taxRate?: number;
  globalDiscount?: number;
  payments?: {
    totalPaid: number;
    steps: PaymentStep[];
  };
  status?: string;
  supplierId?: string;
  supplierName?: string;
  createdAt?: string;
}

interface EstimationDrawerProps {
  isOpen: boolean;
  data: EstimationData | null;
  onClose: () => void;
}

// ============================================
// CONFIGURATION COULEURS (Aura Pro Design)
// ============================================

const COLORS = {
  bg: '#09090b',
  card: '#18181b',
  border: '#27272a',
  accent: '#3b82f6',
  success: '#10b981',
  neonGreen: '#6dff1d',
  cyan: '#24c7ff',
  amber: '#f59e0b',
};

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

const formatCurrency = (val: number) => 
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(val);

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

export default function EstimationDrawer({ isOpen, data, onClose }: EstimationDrawerProps) {
  const [localData, setLocalData] = useState<EstimationData | null>(null);
  const [profile, setProfile] = useState<'client' | 'supplier'>('client');
  const [isSaving, setIsSaving] = useState(false);

  // Synchroniser les données locales quand data change
  useEffect(() => {
    if (data) {
      setLocalData(JSON.parse(JSON.stringify(data)));
    }
  }, [data]);

  // Calculs financiers
  const calculations = useMemo(() => {
    if (!localData) return null;

    const productsSubtotal = localData.products?.reduce(
      (sum, p) => sum + (p.quantity * p.unitPrice), 0
    ) || 0;

    const productsDiscounted = localData.products?.reduce(
      (sum, p) => sum + (p.quantity * p.unitPrice) * (1 - (p.discount || 0) / 100), 0
    ) || 0;

    const productsTotal = productsDiscounted * (1 - (localData.productDiscount || 0) / 100);

    const deliveryTotal = (localData.deliveryCost || 0) * (1 - (localData.deliveryDiscount || 0) / 100);
    const laborTotal = (localData.laborCost || 0) * (1 - (localData.laborDiscount || 0) / 100);

    const subtotalHT = productsTotal + deliveryTotal + laborTotal;
    const tva = subtotalHT * ((localData.taxRate || 20) / 100);
    const totalTTC = subtotalHT + tva;
    const finalTotal = totalTTC * (1 - (localData.globalDiscount || 0) / 100);

    return {
      productsSubtotal,
      productsTotal,
      deliveryTotal,
      laborTotal,
      subtotalHT,
      tva,
      totalTTC,
      finalTotal,
    };
  }, [localData]);

  // Handlers de modification
  const updateProduct = (productId: string, field: keyof Product, value: any) => {
    if (!localData) return;
    setLocalData({
      ...localData,
      products: localData.products.map(p =>
        p.id === productId ? { ...p, [field]: value } : p
      ),
    });
  };

  const updatePaymentStep = (stepId: string, newStatus: 'pending' | 'completed') => {
    if (!localData?.payments) return;
    setLocalData({
      ...localData,
      payments: {
        ...localData.payments,
        steps: localData.payments.steps.map(s =>
          s.id === stepId
            ? { ...s, status: newStatus, date: newStatus === 'completed' ? new Date().toLocaleDateString('fr-FR') : undefined }
            : s
        ),
      },
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Logique de sauvegarde à implémenter
    setTimeout(() => setIsSaving(false), 1000);
  };

  // ============================================
  // REGLES METIER - Validation des transitions
  // Cf. README-METIER.md Section 3.3
  // ============================================

  const canChangeStatusToFournisseur = (): { valid: boolean; error: string } => {
    // Règle #1: Impossible de passer à Traité/Fournisseur sans fournisseur assigné
    if (!localData?.supplierId && !localData?.supplierName) {
      return { 
        valid: false, 
        error: 'Veuillez ASSIGNER UN FOURNISSEUR avant de traiter cette estimation' 
      };
    }
    return { valid: true, error: '' };
  };

  const handleStatusChange = (newStatus: string) => {
    if (newStatus === 'Fournisseur' || newStatus === 'Traité') {
      const validation = canChangeStatusToFournisseur();
      if (!validation.valid) {
        alert(validation.error);
        return;
      }
    }
    setLocalData({ ...localData!, status: newStatus });
  };

  const handleAssignSupplier = (supplierId: string, supplierName: string) => {
    setLocalData({ ...localData!, supplierId, supplierName });
  };

  // ============================================
  // RENDU
  // ============================================

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex"
      >
        {/* BACKDROP */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* DRAWER */}
        <motion.aside
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 200 }}
          className="absolute right-0 top-0 bottom-0 w-full max-w-4xl bg-[#09090b] border-l border-[#27272a] flex flex-col shadow-2xl"
          style={{ backgroundColor: COLORS.bg }}
        >
          {/* ============================================ */}
          {/* HEADER */}
          {/* ============================================ */}
          <div className="h-24 px-8 flex items-center justify-between border-b border-[#27272a] bg-black/40 backdrop-blur-xl sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <button
                onClick={onClose}
                className="w-11 h-11 flex items-center justify-center hover:bg-white/5 border border-white/5 rounded-xl text-zinc-400 hover:text-white transition-all"
              >
                <ChevronLeft size={20} />
              </button>
              <div>
                <h2 className="text-xl font-['Space_Grotesk'] font-black text-white uppercase tracking-tight">
                  Modifier Estimation
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[#3b82f6] font-['JetBrains_Mono'] text-xs font-bold uppercase tracking-wider">
                    {localData?.id || 'N/A'}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-white/20" />
                  <span className="text-[10px] font-['JetBrains_Mono'] text-zinc-500 uppercase tracking-widest">
                    STATUS: {localData?.status || 'En attente'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* PROFILE SWITCHER */}
              <div className="flex p-1 bg-black/40 border border-[#27272a] rounded-xl">
                <button
                  onClick={() => setProfile('client')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                    profile === 'client'
                      ? 'bg-[#3b82f6] text-white shadow-[0_0_15px_rgba(59,130,246,0.4)]'
                      : 'text-zinc-500 hover:text-white'
                  }`}
                >
                  <User size={14} className="inline mr-2" />
                  Client
                </button>
                <button
                  onClick={() => setProfile('supplier')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                    profile === 'supplier'
                      ? 'bg-[#3b82f6] text-white shadow-[0_0_15px_rgba(59,130,246,0.4)]'
                      : 'text-zinc-500 hover:text-white'
                  }`}
                >
                  <Truck size={14} className="inline mr-2" />
                  Fournisseur
                </button>
              </div>

              <button
                onClick={handleSave}
                disabled={isSaving}
                className="h-11 px-5 rounded-xl bg-[#10b981]/10 border border-[#10b981]/30 text-[#10b981] text-xs font-bold uppercase tracking-wider hover:bg-[#10b981]/20 transition-all flex items-center gap-2"
              >
                {isSaving ? (
                  <span className="animate-pulse">Enregistrement...</span>
                ) : (
                  <>
                    <Save size={16} /> Sauvegarder
                  </>
                )}
              </button>
            </div>
          </div>

          {/* SECTION: FOURNISSEUR (OBLIGATOIRE pour traiter) */}
          <div className="px-8 py-4 border-b border-[#27272a] bg-black/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Truck size={16} className="text-[#3b82f6]" />
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Fournisseur Assigné
                </span>
              </div>
              <div className="flex items-center gap-3">
                {localData?.supplierId || localData?.supplierName ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-[#10b981]/10 border border-[#10b981]/30 rounded-lg">
                    <CheckCircle2 size={14} className="text-[#10b981]" />
                    <span className="text-xs font-bold text-[#10b981]">
                      {localData.supplierName || localData.supplierId}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-[#f59e0b]/10 border border-[#f59e0b]/30 rounded-lg">
                    <AlertCircle size={14} className="text-[#f59e0b]" />
                    <span className="text-xs font-bold text-[#f59e0b]">
                      Aucun fournisseur
                    </span>
                  </div>
                )}
                <select
                  value={localData?.supplierId || ''}
                  onChange={(e) => {
                    const option = e.target.options[e.target.selectedIndex];
                    handleAssignSupplier(e.target.value, option?.text || e.target.value);
                  }}
                  className="h-9 px-3 rounded-lg bg-black/40 border border-[#27272a] text-xs text-white focus:border-[#3b82f6]/50 focus:outline-none"
                >
                  <option value="">Sélectionner un fournisseur</option>
                  <option value="supplier_1">NovaStar Technologies</option>
                  <option value="supplier_2">Barco LED Systems</option>
                  <option value="supplier_3">Unilumin Group</option>
                  <option value="supplier_4">Absen LED</option>
                  <option value="supplier_5">LianTronics</option>
                </select>
              </div>
            </div>
            {!localData?.supplierId && !localData?.supplierName && (
              <div className="mt-2 text-[10px] text-[#f59e0b] flex items-center gap-2">
                <AlertCircle size={12} />
                <span>RÈGLE MÉTIER: Vous devez assigner un fournisseur avant de passer le statut à "Traité"</span>
              </div>
            )}
          </div>

          {/* ============================================ */}
          {/* CONTENU SCROLLABLE */}
          {/* ============================================ */}
          <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
            {/* SECTION: INFOS CLIENT */}
            <section className="space-y-4">
              <h3 className="text-xs font-['Space_Grotesk'] font-bold uppercase tracking-[0.3em] text-[#3b82f6] flex items-center gap-3">
                <User size={14} />
                <span className="w-8 h-px bg-gradient-to-r from-[#3b82f6] to-transparent" />
                Informations Client
              </h3>
              <div
                className="p-6 rounded-3xl border border-[#27272a] bg-[#18181b]"
                style={{ backgroundColor: COLORS.card }}
              >
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] text-zinc-500 font-['JetBrains_Mono'] font-bold uppercase tracking-widest pl-1">
                      Contact
                    </label>
                    <input
                      type="text"
                      value={localData?.client?.name || ''}
                      onChange={(e) =>
                        setLocalData({
                          ...localData!,
                          client: { ...localData!.client, name: e.target.value },
                        })
                      }
                      className="w-full py-3 bg-black/40 border border-[#27272a] rounded-xl px-4 text-sm font-bold text-white focus:border-[#3b82f6]/50 focus:outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-zinc-500 font-['JetBrains_Mono'] font-bold uppercase tracking-widest pl-1">
                      Entreprise
                    </label>
                    <input
                      type="text"
                      value={localData?.client?.company || ''}
                      onChange={(e) =>
                        setLocalData({
                          ...localData!,
                          client: { ...localData!.client, company: e.target.value },
                        })
                      }
                      className="w-full py-3 bg-black/40 border border-[#27272a] rounded-xl px-4 text-sm font-bold text-white focus:border-[#3b82f6]/50 focus:outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-zinc-500 font-['JetBrains_Mono'] font-bold uppercase tracking-widest pl-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={localData?.client?.email || ''}
                      onChange={(e) =>
                        setLocalData({
                          ...localData!,
                          client: { ...localData!.client, email: e.target.value },
                        })
                      }
                      className="w-full py-3 bg-black/40 border border-[#27272a] rounded-xl px-4 text-sm font-bold text-white font-['JetBrains_Mono'] focus:border-[#3b82f6]/50 focus:outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-zinc-500 font-['JetBrains_Mono'] font-bold uppercase tracking-widest pl-1">
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      value={localData?.client?.phone || ''}
                      onChange={(e) =>
                        setLocalData({
                          ...localData!,
                          client: { ...localData!.client, phone: e.target.value },
                        })
                      }
                      className="w-full py-3 bg-black/40 border border-[#27272a] rounded-xl px-4 text-sm font-bold text-white font-['JetBrains_Mono'] focus:border-[#3b82f6]/50 focus:outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION: CONFIGURATION MATÉRIEL */}
            <section className="space-y-4">
              <h3 className="text-xs font-['Space_Grotesk'] font-bold uppercase tracking-[0.3em] text-[#3b82f6] flex items-center gap-3">
                <Package size={14} />
                <span className="w-8 h-px bg-gradient-to-r from-[#3b82f6] to-transparent" />
                Configuration Matériel
              </h3>
              <div className="space-y-6">
                {localData?.products?.map((product) => (
                  <div
                    key={product.id}
                    className="p-6 rounded-3xl border border-[#27272a] bg-[#18181b] relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#3b82f6]/40 to-transparent" />
                    <div className="flex items-start justify-between mb-6">
                      <input
                        type="text"
                        value={product.name}
                        onChange={(e) => updateProduct(product.id, 'name', e.target.value)}
                        className="text-2xl font-['Space_Grotesk'] font-black text-white uppercase bg-transparent border-none focus:outline-none w-full"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-6 mb-6">
                      <NumericInput
                        label="Quantité"
                        value={product.quantity}
                        onChange={(v) => updateProduct(product.id, 'quantity', v)}
                      />
                      <NumericInput
                        label="Prix Unitaire (€)"
                        value={product.unitPrice}
                        onChange={(v) => updateProduct(product.id, 'unitPrice', v)}
                        unit="€"
                      />
                      <NumericInput
                        label="Remise (%)"
                        value={product.discount}
                        onChange={(v) => updateProduct(product.id, 'discount', v)}
                        unit="%"
                      />
                    </div>

                    <div className="pt-4 border-t border-[#27272a] flex justify-between items-center">
                      <span className="text-xs font-['JetBrains_Mono'] text-zinc-500">
                        0x{product.id.slice(0, 8).toUpperCase()}
                      </span>
                      <div className="text-right">
                        <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider mr-3">
                          Total HT
                        </span>
                        <span className="text-2xl font-['Space_Grotesk'] font-black text-white">
                          {formatCurrency(
                            product.quantity * product.unitPrice * (1 - product.discount / 100)
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* SECTION: DOSSIER TECHNIQUE */}
            <section className="space-y-4">
              <h3 className="text-xs font-['Space_Grotesk'] font-bold uppercase tracking-[0.3em] text-[#3b82f6] flex items-center gap-3">
                <Settings size={14} />
                <span className="w-8 h-px bg-gradient-to-r from-[#3b82f6] to-transparent" />
                Dossier Technique
              </h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <TechSpecCard
                  icon={<Monitor size={16} />}
                  label="Surface"
                  value={localData?.products?.[0]?.specs?.surface || 'N/A'}
                  color="#38bdf8"
                />
                <TechSpecCard
                  icon={<Grid3X3 size={16} />}
                  label="Résolution"
                  value={localData?.products?.[0]?.specs?.resolution || 'N/A'}
                  color="#a78bfa"
                />
                <TechSpecCard
                  icon={<Layers size={16} />}
                  label="Modules"
                  value={localData?.products?.[0]?.specs?.ledModules?.toString() || 'N/A'}
                  color="#f472b6"
                />
                <TechSpecCard
                  icon={<TrendingDown size={16} />}
                  label="Pixel Pitch"
                  value={localData?.products?.[0]?.specs?.pixelPitch || 'N/A'}
                  color="#34d399"
                />
              </div>
            </section>

            {/* SECTION: SUIVI DES PAIEMENTS */}
            <section className="space-y-4">
              <h3 className="text-xs font-['Space_Grotesk'] font-bold uppercase tracking-[0.3em] text-[#3b82f6] flex items-center gap-3">
                <CreditCard size={14} />
                <span className="w-8 h-px bg-gradient-to-r from-[#3b82f6] to-transparent" />
                Suivi des Paiements
              </h3>
              <div className="space-y-3">
                {localData?.payments?.steps?.map((step) => (
                  <div
                    key={step.id}
                    className="p-4 rounded-xl border border-[#27272a] bg-[#18181b] flex items-center justify-between"
                  >
                    <div>
                      <div className="text-sm font-bold text-white">{step.label}</div>
                      <div className="text-xs text-zinc-500">{step.date || 'En attente'}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-['Space_Grotesk'] font-bold text-white">
                        {formatCurrency(step.amount)}
                      </span>
                      <button
                        onClick={() =>
                          updatePaymentStep(
                            step.id,
                            step.status === 'completed' ? 'pending' : 'completed'
                          )
                        }
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                          step.status === 'completed'
                            ? 'bg-[#10b981]/20 text-[#10b981]'
                            : 'bg-white/5 text-zinc-500 hover:bg-white/10'
                        }`}
                      >
                        {step.status === 'completed' ? (
                          <CheckCircle2 size={20} />
                        ) : (
                          <AlertCircle size={20} />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
                {(!localData?.payments?.steps || localData.payments.steps.length === 0) && (
                  <div className="p-8 text-center text-zinc-500 border border-dashed border-[#27272a] rounded-xl">
                    Aucun échéancier configuré
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* ============================================ */}
          {/* FOOTER FIXE */}
          {/* ============================================ */}
          <div className="p-8 border-t border-[#27272a] bg-gradient-to-b from-[#09090b] to-black/80">
            <div className="flex items-end justify-between gap-8">
              {/* SOUS-TOTAL */}
              <div className="flex-1 bg-[#18181b] p-6 rounded-2xl border border-[#27272a]">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">
                      Sous-total HT
                    </span>
                    <span className="text-xl font-['Space_Grotesk'] font-black text-white">
                      {formatCurrency(calculations?.subtotalHT || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">
                      TVA ({localData?.taxRate || 20}%)
                    </span>
                    <span className="text-lg font-['Space_Grotesk'] font-bold text-[#3b82f6]">
                      +{formatCurrency(calculations?.tva || 0)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <NumericInput
                      label="TVA %"
                      value={localData?.taxRate || 20}
                      onChange={(v) =>
                        setLocalData({ ...localData!, taxRate: v })
                      }
                      unit="%"
                    />
                    <NumericInput
                      label="Remise %"
                      value={localData?.globalDiscount || 0}
                      onChange={(v) =>
                        setLocalData({ ...localData!, globalDiscount: v })
                      }
                      unit="%"
                    />
                  </div>
                </div>
              </div>

              {/* TOTAL TTC */}
              <div className="text-right">
                <div className="text-[#24c7ff] text-xs font-bold uppercase tracking-[0.6em] mb-2">
                  À PAYER (TTC)
                </div>
                <div
                  className="text-5xl font-['Space_Grotesk'] font-black tracking-tighter"
                  style={{
                    color: COLORS.neonGreen,
                    textShadow: '0 0 30px rgba(109, 255, 29, 0.5)',
                  }}
                >
                  {formatCurrency(calculations?.finalTotal || 0)}
                </div>
                {localData?.payments?.totalPaid ? (
                  <div className="text-xs text-[#10b981] mt-3 font-bold uppercase tracking-wider">
                    Déjà paid: {formatCurrency(localData.payments.totalPaid)}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </motion.aside>
      </motion.div>
    </AnimatePresence>
  );
}

// ============================================
// COMPOSANTS UTILITAIRES
// ============================================

function NumericInput({
  label,
  value,
  onChange,
  unit,
}: {
  label: string;
  value: number;
  onChange: (val: number) => void;
  unit?: string;
}) {
  return (
    <div className="space-y-2">
      <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider pl-1">
        {label}
      </span>
      <div className="flex items-center bg-black/40 border border-[#27272a] rounded-xl p-1">
        <button
          onClick={() => onChange(Math.max(0, value - 1))}
          className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/10 transition-all"
        >
          <Minus size={16} />
        </button>
        <div className="flex-1 flex items-center justify-center gap-1">
          <input
            type="number"
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-16 bg-transparent border-none text-center font-['Space_Grotesk'] font-bold text-lg text-white focus:outline-none"
          />
          {unit && (
            <span className="text-xs font-bold text-[#3b82f6]">{unit}</span>
          )}
        </div>
        <button
          onClick={() => onChange(value + 1)}
          className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/10 transition-all"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}

function TechSpecCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="p-4 rounded-xl bg-[#18181b] border border-[#27272a] group hover:border-white/10 transition-all">
      <div
        className="w-10 h-10 rounded-lg bg-black/50 flex items-center justify-center mb-3 transition-all group-hover:scale-110"
        style={{ color, boxShadow: `0 0 15px ${color}20` }}
      >
        {icon}
      </div>
      <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-1">
        {label}
      </div>
      <div className="font-['JetBrains_Mono'] font-bold text-white text-sm">
        {value}
      </div>
    </div>
  );
}