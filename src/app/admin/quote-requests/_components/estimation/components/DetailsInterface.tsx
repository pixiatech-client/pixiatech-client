'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Settings, History, Plus, Trash2, Send, Languages, FileText, Calculator,
  Truck, Eraser, Wrench, CheckCircle2, AlertCircle, TrendingDown, ArrowRight,
  LayoutDashboard, Box, MessageSquare, Bell, LogOut, ChevronLeft, ChevronDown,
  ChevronRight, Search, Filter, MoreVertical, X, Pencil, Check, Loader2,
  Sparkles, MapPin, Building2, StickyNote, MessageCircle, SendHorizontal,
  Share2, Download, FileSpreadsheet, Printer, Image as ImageIcon,
  ChevronRightSquare, History as HistoryIcon, Maximize2, Info, Minus, Lock
} from 'lucide-react';

type ProfileType = 'client' | 'supplier';

interface Product {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  specs?: Record<string, string | number>;
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

interface HistoryEntry {
  id: string;
  timestamp: string;
  action: string;
  user: string;
  userId: string;
  type: 'global' | 'local';
}

interface Estimation {
  id: string;
  client: ClientInfo;
  products: Product[];
  productDiscount: number;
  deliveryCity?: string;
  deliveryCost: number;
  deliveryDiscount: number;
  laborCost: number;
  laborDiscount: number;
  taxRate: number;
  globalDiscount: number;
  history: HistoryEntry[];
  transmittedToSupplier?: boolean;
  transmittedDate?: string;
  supplierNotes?: string;
  hideCommentsFromSupplier?: boolean;
  hidePhotoFromSupplier?: boolean;
}

interface DetailsAppProps {
  estimation?: Estimation;
}

const INITIAL_ESTIMATION: Estimation = {
  id: 'DEV-1ZUWBT8L',
  client: {
    name: 'JIJI',
    email: 'djohar75@hotmail.fr',
    phone: '0763475666',
    company: 'JiJi Event Solutions',
    address: '123 Avenue des Champs-Élysées, 75008 Paris',
    notes: 'Priorité haute pour l\'installation solaire du showroom.',
    sitePhoto: 'https://picsum.photos/seed/setup/800/600',
  },
  products: [
    { 
      id: '1', 
      name: 'Écran LED P2.5 Haute Résolution', 
      quantity: 4, 
      unitPrice: 1500,
      discount: 10,
      specs: {
        surface: '78.00 m²',
        resolution: '4800 x 2600 px',
        ledModules: 312,
        avgPower: '16.4 kW',
        pixelPitch: 'P2.5',
        projectType: 'Vente',
        environment: 'Intérieur',
        breaker: '68A',
        chipset: 'NationStar Gold',
        refreshRate: '3840Hz',
        brightness: '1200 nits',
        cabinetMaterial: 'Aluminium moulé sous pression',
        cabinetWeight: '7.5kg',
        ipRating: 'IP43',
        viewingAngle: '160/160',
        maintenanceType: 'Avant/Arrière'
      }
    },
  ],
  productDiscount: 0,
  deliveryCity: 'Paris',
  deliveryCost: 500,
  deliveryDiscount: 0,
  laborCost: 1200,
  laborDiscount: 0,
  taxRate: 20,
  globalDiscount: 0,
  history: [
    { id: 'h1', timestamp: '18/04/2026 10:00', action: 'Création du devis', user: 'Mich (Commercial)', userId: 'm1', type: 'local' },
    { id: 'h2', timestamp: '18/04/2026 10:30', action: 'Approbation technique', user: 'Supplier', userId: 's1', type: 'local' },
  ]
};

export default function DetailsApp({ estimation }: DetailsAppProps) {
  const [profile, setProfile] = useState<ProfileType>('client');
  const [currentEstimation, setCurrentEstimation] = useState<Estimation>(estimation || INITIAL_ESTIMATION);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isTransmitModalOpen, setIsTransmitModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState(false);
  const [fullscreenPhoto, setFullscreenPhoto] = useState<string | null>(null);

  const calculations = useMemo(() => {
    const products = currentEstimation?.products || [];
    const productsSubtotal = products.reduce((acc, p) => acc + (p.quantity * p.unitPrice), 0);
    const productsDiscountedTotal = products.reduce((acc, p) => {
      const lineTotal = p.quantity * p.unitPrice;
      const discounted = lineTotal * (1 - (p.discount || 0) / 100);
      return acc + discounted;
    }, 0);
    const productsTotal = productsDiscountedTotal * (1 - (currentEstimation?.productDiscount || 0) / 100);
    const deliveryTotal = (currentEstimation?.deliveryCost || 0) - ((currentEstimation?.deliveryCost || 0) * (currentEstimation?.deliveryDiscount || 0) / 100);
    const laborTotal = (currentEstimation?.laborCost || 0) - ((currentEstimation?.laborCost || 0) * (currentEstimation?.laborDiscount || 0) / 100);
    const subtotalHT = productsTotal + deliveryTotal + laborTotal;
    const tva = (subtotalHT * (currentEstimation?.taxRate || 20)) / 100;
    const totalTTC = subtotalHT + tva;
    const finalTotal = totalTTC - (totalTTC * (currentEstimation?.globalDiscount || 0) / 100);
    return {
      productsSubtotal,
      productsTotal,
      deliveryTotal,
      laborTotal,
      subtotalHT,
      tva,
      totalTTC,
      finalTotal,
      totalInitial: productsSubtotal + (currentEstimation?.deliveryCost || 0) + (currentEstimation?.laborCost || 0)
    };
  }, [currentEstimation]);

  const addHistory = (action: string) => {
    const newEntry: HistoryEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleString('fr-FR'),
      action,
      user: profile === 'client' ? 'Client' : 'Mich (Commercial)',
      userId: profile === 'client' ? 'c1' : 'm1',
      type: 'local'
    };
    setCurrentEstimation(prev => ({
      ...prev,
      history: [newEntry, ...prev.history]
    }));
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(val);
  };

  const updateClient = (field: keyof ClientInfo, value: string) => {
    setCurrentEstimation(prev => ({
      ...prev,
      client: { ...prev.client, [field]: value }
    }));
  };

  const removeProduct = (id: string) => {
    setCurrentEstimation(prev => ({
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
    setCurrentEstimation(prev => ({
      ...prev,
      products: [...prev.products, newProduct]
    }));
    addHistory('Ajout nouveau produit');
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col font-sans">
      <main className="flex-1 flex flex-col bg-[#050005] relative overflow-hidden">
        <header className="h-20 border-b border-[#27272a] flex items-center justify-between px-10 bg-[#18181b]/50 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-xl font-bold">Technical & Commercial Details</h1>
              <p className="text-xs text-[#a1a1aa]">Estimation #{currentEstimation?.id || 'N/A'}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-[#18181b] border border-[#27272a] rounded-xl p-1">
              <button
                onClick={() => setProfile('client')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${profile === 'client' ? 'bg-[#3b82f6] text-white' : 'text-[#a1a1aa] hover:text-white'}`}
              >
                Client
              </button>
              <button
                onClick={() => setProfile('supplier')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${profile === 'supplier' ? 'bg-[#3b82f6] text-white' : 'text-[#a1a1aa] hover:text-white'}`}
              >
                Fournisseur
              </button>
            </div>
            <button
              onClick={() => setIsEditMode(!isEditMode)}
              className={`h-11 px-4 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${isEditMode ? 'bg-amber-500/20 border-amber-500/50 text-amber-500' : 'bg-white/5 border-[#27272a] text-[#a1a1aa] hover:text-white'}`}
            >
              <Pencil size={14} /> {isEditMode ? 'Exit' : 'Edit'}
            </button>
          </div>
        </header>

        <div className="flex-1 p-6 overflow-auto">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Client Info Card */}
            <div className="bg-[#18181b] border border-[#27272a] rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#3b82f6]/20 rounded-xl flex items-center justify-center">
                    <User size={20} className="text-[#3b82f6]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">{currentEstimation?.client?.name || 'Client'}</h2>
                    <p className="text-sm text-[#a1a1aa]">{currentEstimation?.client?.company || ''}</p>
                  </div>
                </div>
                {currentEstimation?.client?.sitePhoto && (
                  <button
                    onClick={() => setFullscreenPhoto(currentEstimation?.client?.sitePhoto || null)}
                    className="w-16 h-16 rounded-lg overflow-hidden border border-[#27272a]"
                  >
                    <img src={currentEstimation.client.sitePhoto} alt="Site" className="w-full h-full object-cover" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-[#a1a1aa]">Email</span>
                  <p className="font-medium">{currentEstimation?.client?.email || '-'}</p>
                </div>
                <div>
                  <span className="text-[#a1a1aa]">Phone</span>
                  <p className="font-medium">{currentEstimation?.client?.phone || '-'}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-[#a1a1aa]">Adresse</span>
                  <p className="font-medium">{currentEstimation?.client?.address || '-'}</p>
                </div>
              </div>
              {currentEstimation?.client?.notes && (
                <div className="mt-4 p-3 bg-[#09090b] rounded-lg">
                  <span className="text-[#a1a1aa] text-xs">Notes</span>
                  <p className="text-sm">{currentEstimation.client.notes}</p>
                </div>
              )}
            </div>

            {/* Products Section */}
            <div className="bg-[#18181b] border border-[#27272a] rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#3b82f6]/20 rounded-xl flex items-center justify-center">
                    <Box size={20} className="text-[#3b82f6]" />
                  </div>
                  <h2 className="text-lg font-bold">Produits</h2>
                </div>
                {isEditMode && (
                  <button onClick={addProduct} className="flex items-center gap-2 px-3 py-2 bg-[#3b82f6] rounded-lg text-sm">
                    <Plus size={16} /> Ajouter
                  </button>
                )}
              </div>
              <div className="space-y-3">
                {(currentEstimation?.products || []).map(product => (
                  <div key={product.id} className="flex items-center justify-between p-4 bg-[#09090b] rounded-xl">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-medium">{product.name}</h3>
                        <span className="text-xs text-[#a1a1aa] bg-[#27272a] px-2 py-0.5 rounded">
                          {product.quantity}x {formatCurrency(product.unitPrice)}
                        </span>
                      </div>
                      {product.specs && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {Object.entries(product.specs).slice(0, 6).map(([key, val]) => (
                            <span key={key} className="text-xs text-[#71717a] bg-[#18181b] px-2 py-1 rounded">
                              {key}: {val}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-bold">{formatCurrency(product.quantity * product.unitPrice * (1 - product.discount / 100))}</p>
                        {product.discount > 0 && (
                          <p className="text-xs text-green-500">-{product.discount}%</p>
                        )}
                      </div>
                      {isEditMode && (
                        <button onClick={() => removeProduct(product.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Summary */}
            <div className="bg-[#18181b] border border-[#27272a] rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-[#10b981]/20 rounded-xl flex items-center justify-center">
                  <Calculator size={20} className="text-[#10b981]" />
                </div>
                <h2 className="text-lg font-bold">Financial Summary</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#a1a1aa]">Product subtotal</span>
                    <span>{formatCurrency(calculations.productsTotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#a1a1aa]">Delivery</span>
                    <span>{formatCurrency(calculations.deliveryTotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#a1a1aa]">Labor</span>
                    <span>{formatCurrency(calculations.laborTotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#a1a1aa]">VAT ({currentEstimation.taxRate}%)</span>
                    <span>{formatCurrency(calculations.tva)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-[#a1a1aa]">Total incl. tax</div>
                  <div className="text-2xl font-bold text-green-500">{formatCurrency(calculations.totalTTC)}</div>
                  {currentEstimation.globalDiscount > 0 && (
                    <div className="text-xs text-green-500">
                      Savings: {formatCurrency(calculations.totalTTC - calculations.finalTotal)}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-4 gap-4">
              <button onClick={() => alert('PDF en cours...')} className="flex items-center justify-center gap-2 p-4 bg-[#18181b] border border-[#27272a] rounded-xl hover:border-[#3b82f6] transition-colors">
                <Download size={20} />
                <span>PDF</span>
              </button>
              <button onClick={() => alert('Partage en cours...')} className="flex items-center justify-center gap-2 p-4 bg-[#18181b] border border-[#27272a] rounded-xl hover:border-[#3b82f6] transition-colors">
                <Share2 size={20} />
                <span>Partager</span>
              </button>
              <button onClick={() => alert('Traduction...')} className="flex items-center justify-center gap-2 p-4 bg-[#18181b] border border-[#27272a] rounded-xl hover:border-[#3b82f6] transition-colors">
                <Languages size={20} />
                <span>Traduire</span>
              </button>
              <button onClick={() => setIsTransmitModalOpen(true)} className="flex items-center justify-center gap-2 p-4 bg-[#18181b] border border-[#27272a] rounded-xl hover:border-[#3b82f6] transition-colors">
                <Send size={20} />
                <span>Transmettre</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Fullscreen Photo Modal */}
      <AnimatePresence>
        {fullscreenPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setFullscreenPhoto(null)}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-10"
          >
            <img src={fullscreenPhoto} alt="Fullscreen" className="max-w-full max-h-full object-contain" />
            <button className="absolute top-4 right-4 p-2 bg-white/10 rounded-lg">
              <X size={24} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}