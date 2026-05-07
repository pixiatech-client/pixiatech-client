'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  ArrowLeft, 
  User, 
  Users, 
  Send, 
  FileText, 
  Box, 
  Truck, 
  Wrench, 
  ChevronDown, 
  ChevronUp,
  Pencil,
  Save,
  Calculator,
  Trash2,
  Plus,
  Languages,
  Download,
  Share2,
  History,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Settings,
  StickyNote,
  MessageCircle,
  SendHorizontal
} from 'lucide-react';
import { Estimation, type EstimationStatus } from '../types';

interface EstimationEditModalProps {
  estimation: Estimation | null;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (updatedEstimation: Partial<Estimation>) => void;
}

interface Product {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  specs?: Record<string, any>;
}

interface ClientInfo {
  name: string;
  email: string;
  phone: string;
  company?: string;
  address?: string;
  notes?: string;
  sitePhoto?: string;
}

export const EstimationEditModal: React.FC<EstimationEditModalProps> = ({ 
  estimation, 
  isOpen, 
  onClose,
  onSave 
}) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'client' | 'products' | 'logistics' | 'summary'>('client');
  const [localEstimation, setLocalEstimation] = useState<Estimation | null>(estimation);
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    if (estimation) {
      setLocalEstimation(estimation);
    }
  }, [estimation]);

  const calculations = useMemo(() => {
    const subtotalHT = (localEstimation?.totalClient || 0);
    const tva = subtotalHT * 0.2;
    const totalTTC = subtotalHT + tva;
    return { subtotalHT, tva, totalTTC };
  }, [localEstimation]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(val || 0);
  };

  if (!isOpen || !estimation || !localEstimation) return null;

  const handleSave = async () => {
    if (!onSave || !localEstimation) return;
    setIsSaving(true);
    try {
      await onSave(localEstimation);
      setIsEditMode(false);
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const updateClient = (field: keyof ClientInfo, value: string) => {
    setLocalEstimation(prev => prev ? {
      ...prev,
      [field]: value
    } : null);
  };

  const updateProduct = (productId: string, field: keyof Product, value: any) => {
    setLocalEstimation(prev => {
      if (!prev) return null;
      return prev;
    });
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-full max-w-2xl bg-[#0a0a0b] z-[101] overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-[#0a0a0b]/95 backdrop-blur-md border-b border-[#27272a]">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-[#27272a] rounded-lg transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5 text-zinc-400" />
                  </button>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-white">Détails de l'estimation</h2>
                      <span className="text-zinc-500 font-mono tracking-wide text-xs uppercase">{localEstimation.number}</span>
                    </div>
                    <p className="text-xs text-zinc-500">
                      Créé le {localEstimation.date}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsEditMode(!isEditMode)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                      isEditMode 
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-500' 
                        : 'bg-[#27272a] border-[#3f3f46] text-zinc-300 hover:text-white'
                    }`}
                  >
                    <Pencil size={14} />
                    <span className="text-xs font-bold uppercase">{isEditMode ? 'Quitter' : 'Éditer'}</span>
                  </button>
                  {isEditMode && (
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white transition-all"
                    >
                      <Save size={14} />
                      <span className="text-xs font-bold uppercase">{isSaving ? '...' : 'Enregistrer'}</span>
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-[#27272a] rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-zinc-400" />
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-1 px-4 pb-4">
                <button
                  onClick={() => setActiveTab('client')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${
                    activeTab === 'client' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-[#27272a] text-zinc-400 hover:text-white'
                  }`}
                >
                  <User size={14} />
                  Client
                </button>
                <button
                  onClick={() => setActiveTab('products')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${
                    activeTab === 'products' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-[#27272a] text-zinc-400 hover:text-white'
                  }`}
                >
                  <Box size={14} />
                  Produits
                </button>
                <button
                  onClick={() => setActiveTab('logistics')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${
                    activeTab === 'logistics' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-[#27272a] text-zinc-400 hover:text-white'
                  }`}
                >
                  <Truck size={14} />
                  Logistique
                </button>
                <button
                  onClick={() => setActiveTab('summary')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${
                    activeTab === 'summary' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-[#27272a] text-zinc-400 hover:text-white'
                  }`}
                >
                  <Calculator size={14} />
                  Résumé
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              <AnimatePresence mode="wait">
                {activeTab === 'client' && (
                  <motion.div
                    key="client"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    <div className="bg-[#18181b] rounded-xl p-4 border border-[#27272a]">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base font-bold text-white">Informations client</h3>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Nom</label>
                          <input
                            type="text"
                            value={localEstimation.client || ''}
                            onChange={(e) => updateClient('name', e.target.value)}
                            disabled={!isEditMode}
                            className="w-full mt-1 px-3 py-2 bg-[#0a0a0b] border border-[#27272a] rounded-lg text-white focus:border-blue-500 focus:outline-none disabled:opacity-50"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Email</label>
                          <input
                            type="email"
                            value={localEstimation.email || ''}
                            onChange={(e) => updateClient('email', e.target.value)}
                            disabled={!isEditMode}
                            className="w-full mt-1 px-3 py-2 bg-[#0a0a0b] border border-[#27272a] rounded-lg text-white focus:border-blue-500 focus:outline-none disabled:opacity-50"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Téléphone</label>
                          <input
                            type="tel"
                            value={localEstimation.phone || ''}
                            onChange={(e) => updateClient('phone', e.target.value)}
                            disabled={!isEditMode}
                            className="w-full mt-1 px-3 py-2 bg-[#0a0a0b] border border-[#27272a] rounded-lg text-white focus:border-blue-500 focus:outline-none disabled:opacity-50"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'products' && (
                  <motion.div
                    key="products"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    <div className="bg-[#18181b] rounded-xl p-4 border border-[#27272a]">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base font-bold text-white">Produits</h3>
                        {isEditMode && (
                          <button className="flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-500 rounded text-xs text-white">
                            <Plus size={12} />
                            Ajouter
                          </button>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-3 bg-[#0a0a0b] rounded-lg">
                          <div className="flex-1">
                            <p className="text-sm font-bold text-white">Estimation #{localEstimation.number}</p>
                            <p className="text-xs text-zinc-500">{localEstimation.reference}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-green-500">{formatCurrency(localEstimation.totalClient)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'logistics' && (
                  <motion.div
                    key="logistics"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    <div className="bg-[#18181b] rounded-xl p-4 border border-[#27272a]">
                      <h3 className="text-base font-bold text-white mb-4">Frais de logistique</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-zinc-400">Achats</span>
                          <span className="text-sm font-bold text-white">{formatCurrency(localEstimation.totalPurchase)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-zinc-400">Frais de port</span>
                          <span className="text-sm font-bold text-white">-</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'summary' && (
                  <motion.div
                    key="summary"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    <div className="bg-[#18181b] rounded-xl p-4 border border-[#27272a]">
                      <h3 className="text-base font-bold text-white mb-4">Résumé financier</h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-zinc-400">Total HT</span>
                          <span className="text-sm font-bold text-white">{formatCurrency(calculations.subtotalHT)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-zinc-400">TVA (20%)</span>
                          <span className="text-sm font-bold text-white">{formatCurrency(calculations.tva)}</span>
                        </div>
                        <div className="border-t border-[#27272a] pt-2 mt-2">
                          <div className="flex items-center justify-between">
                            <span className="text-base font-bold text-white">Total TTC</span>
                            <span className="text-lg font-bold text-green-500">{formatCurrency(calculations.totalTTC)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#18181b] rounded-xl p-4 border border-[#27272a]">
                      <h3 className="text-base font-bold text-white mb-4">Actions</h3>
                      <div className="grid grid-cols-2 gap-2">
                        <button className="flex items-center justify-center gap-2 px-3 py-2 bg-[#27272a] hover:bg-[#3f3f46] rounded-lg text-sm text-white transition-colors">
                          <Download size={14} />
                          PDF
                        </button>
                        <button className="flex items-center justify-center gap-2 px-3 py-2 bg-[#27272a] hover:bg-[#3f3f46] rounded-lg text-sm text-white transition-colors">
                          <Share2 size={14} />
                          Partager
                        </button>
                        <button className="flex items-center justify-center gap-2 px-3 py-2 bg-[#27272a] hover:bg-[#3f3f46] rounded-lg text-sm text-white transition-colors">
                          <Languages size={14} />
                          Traduire
                        </button>
                        <button className="flex items-center justify-center gap-2 px-3 py-2 bg-[#27272a] hover:bg-[#3f3f46] rounded-lg text-sm text-white transition-colors">
                          <Send size={14} />
                          Transmettre
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default EstimationEditModal;