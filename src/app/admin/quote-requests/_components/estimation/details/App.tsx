'use client';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  User,
  Settings,
  History,
  Plus,
  Trash2,
  Send,
  Languages,
  FileText,
  Calculator,
  Truck,
  Eraser,
  Wrench,
  CheckCircle2,
  AlertCircle,
  TrendingDown,
  ArrowRight,
  LayoutDashboard,
  Box,
  MessageSquare,
  Bell,
  LogOut,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  Search,
  Filter,
  MoreVertical,
  X,
  Pencil,
  Check,
  Loader2,
  Sparkles,
  MapPin,
  Building2,
  StickyNote,
  MessageCircle,
  SendHorizontal,
  Share2,
  Download,
  FileSpreadsheet,
  Printer,
  PlusCircle,
  Image as ImageIcon,
  ChevronRightSquare,
  History as HistoryIcon,
  Maximize2,
  Info,
  Minus,
  Lock,
  Package,
  Zap,
  Sun,
  LayoutGrid,
  Eye,
  Monitor,
  Cpu
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { TransmitModal } from '@/application/admin/estimations/components/TransmitModal';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/firebase/config';
import { QuotePDF } from '@/app/admin/quote-pdf';
import { updateQuoteStatus, getPdfSettings, updateQuotePdfUrl } from '@/app/admin/actions';
import { useUser } from '@/firebase';
import {
  ProfileType,
  Estimation,
  Product as LocalProduct,
  HistoryEntry,
  ClientInfo,
  PaymentStep
} from './types';
import { Product as GlobalProduct, ProductSpec } from '@/lib/types';
import { villes } from '@/lib/data/villes';
import { geminiService } from './services/geminiService';
import './details.css';

// Mock initial data as fallback
const FALLBACK_ESTIMATION: Estimation = {
  id: 'DEV-XXXXXX',
  client: {
    name: 'Chargement...',
    email: '',
    phone: '',
    company: '',
    address: '',
    notes: '',
  },
  products: [],
  productDiscount: 0,
  deliveryCity: '',
  deliveryCost: 0,
  deliveryDiscount: 0,
  laborCost: 0,
  laborDiscount: 0,
  taxRate: 20,
  globalDiscount: 0,
  history: [],
};

interface DetailsAppProps {
  initialEstimation?: any;
  allProducts?: GlobalProduct[];
  allProductSpecs?: Record<string, ProductSpec[]>;
  startOpen?: boolean;
  onClose?: () => void;
  suppliers?: any[];
  onStatusChange?: (newStatus: string) => void;
}

export default function DetailsApp({ initialEstimation, allProducts = [], allProductSpecs = {}, startOpen = false, onClose, suppliers = [], onStatusChange }: DetailsAppProps) {
  const { userProfile } = useUser();
  const [profile, setProfile] = useState<ProfileType>('client');

  // Auto-switch to supplier profile if the user is a supplier
  useEffect(() => {
    if (userProfile?.role === 'supplier') {
      setProfile('supplier');
      setIsEditMode(false);
    }
  }, [userProfile]);
  const [estimation, setEstimation] = useState<Estimation>(FALLBACK_ESTIMATION);
  const [isDrawerOpen, setIsDrawerOpen] = useState(startOpen);
  const [isTransmitModalOpen, setIsTransmitModalOpen] = useState(false);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [pdfSettings, setPdfSettings] = useState<any>(null);

  // Interface Control States
  const [isEditMode, setIsEditMode] = useState(false);
  const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState(false);
  const [fullscreenPhoto, setFullscreenPhoto] = useState<string | null>(null);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');

  const [historyPage, setHistoryPage] = useState(1);
  const itemsPerPage = 5;

  // AI States
  const [aiResult, setAiResult] = useState<{ title: string, content: string } | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const pdfContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchPdfSettings() {
      const settings = await getPdfSettings(true);
      setPdfSettings(settings);
    }
    fetchPdfSettings();
  }, []);

  const handleDownloadPdf = async () => {
    if (estimation.pdfUrl) {
      window.open(estimation.pdfUrl, '_blank');
      return;
    }

    setIsPdfLoading(true);
    try {
      const quoteContainer = document.getElementById('app-pdf-render-view');
      if (!quoteContainer) {
        console.error("PDF element not found");
        return;
      }
      
      // Wait for rendering
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pages = quoteContainer.querySelectorAll('.page-break-after');
      const targetPages = pages.length > 0 ? pages : [quoteContainer];

      for (let i = 0; i < targetPages.length; i++) {
        const page = targetPages[i] as HTMLElement;
        const canvas = await html2canvas(page, { 
          scale: 3, // Premium quality
          useCORS: true,
          logging: false,
          allowTaint: true,
          backgroundColor: '#ffffff'
        });
        
        const imgData = canvas.toDataURL('image/jpeg', 1.0);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      }

      const pdfBlob = pdf.output('blob');
      
      // Auto-persist if missing
      if (estimation.id) {
        try {
          const storageRef = ref(storage, `quotes/pdfs/${estimation.id}.pdf`);
          await uploadBytes(storageRef, pdfBlob);
          const pdfUrl = await getDownloadURL(storageRef);
          await updateQuotePdfUrl(estimation.id, pdfUrl);
          // Optimistic update
          setEstimation(prev => ({ ...prev, pdfUrl }));
        } catch (uploadError) {
          console.error("Failed to persist admin PDF:", uploadError);
        }
      }

      pdf.save(`Estimation_${estimation.id || 'N-A'}.pdf`);
    } catch (err) {
      console.error("PDF Generation error:", err);
    } finally {
      setIsPdfLoading(false);
    }
  };

  // Sync with initialEstimation if provided
  useEffect(() => {
    if (initialEstimation) {
      const idShort = initialEstimation.id?.slice(0, 8).toUpperCase() || 'N/A';
      const displayId = initialEstimation.number || `DEV-${idShort}`;

      // Handle both raw QuoteRequest and simplified Estimation objects
      const clientObj = typeof initialEstimation.client === 'object' ? initialEstimation.client : null;
      const clientName = clientObj?.companyName || clientObj?.name || (typeof initialEstimation.client === 'string' ? initialEstimation.client : '') || 'Client Inconnu';
      const clientEmail = clientObj?.email || initialEstimation.email || '';
      const clientPhone = clientObj?.phone || initialEstimation.phone || '';
      const clientAddress = clientObj?.address || initialEstimation.address || '';
      const clientNotes = clientObj?.notes || initialEstimation.notes || '';
      const sitePhoto = clientObj?.sitePhoto || initialEstimation.sitePhoto || initialEstimation.supplierPhoto || initialEstimation.client?.sitePhoto;

      const taxRate = initialEstimation.taxRate ?? 0;
      const dbTotalClient = initialEstimation.totalClient || initialEstimation.totalQuote || 0;

      // Auto-détecter si les prix unitaires en base sont déjà TTC
      const dbProducts = initialEstimation.products || [];
      const sumProductsHT = dbProducts.reduce((acc: number, p: any) => acc + (p.unitPrice || (p.lineTotal / (p.quantity || 1)) || 0) * (p.quantity || 1), 0);
      const deliveryCost = initialEstimation.deliveryCost || 0;
      const laborCost = initialEstimation.laborCost || initialEstimation.installationCost || 0;

      // Si le total affiché (TTC) est égal à la somme des lignes + frais, c'est que les lignes sont déjà TTC
      const isActuallyTTC = dbTotalClient > 0 && Math.abs(dbTotalClient - (sumProductsHT + deliveryCost + laborCost)) < 0.1;
      const divisor = isActuallyTTC ? (1 + taxRate / 100) : 1;

      const mapped: Estimation = {
        id: displayId,
        client: {
          name: clientName,
          email: clientEmail,
          phone: clientPhone,
          company: clientName,
          address: clientAddress,
          notes: clientNotes,
          sitePhoto: sitePhoto || undefined,
        },
        products: initialEstimation.products?.map((p: any) => ({
          id: p.id || Math.random().toString(36).substr(2, 9),
          productId: p.productId || p.id || '',
          name: p.productName || p.name || 'Produit',
          quantity: p.quantity || 1,
          unitPrice: (p.unitPrice || (p.lineTotal / (p.quantity || 1)) || 0) / divisor,
          discount: p.discount || 0,
          tileWidth: parseFloat(p.largeurDalle || p.tileWidth || '0'),
          tileHeight: parseFloat(p.hauteurDalle || p.tileHeight || '0'),
          pricePerTile: parseFloat(p.prixDalle || p.pricePerTile || '0'),
          nombreEcrans: p.nombreEcrans || p.quantity || 1,
          dimensionsEnabled: !!p.dimensionsEnabled,
          width: p.width || 0,
          height: p.height || 0,
          specs: (allProductSpecs[p.productId] || allProductSpecs[p.id])
            ? Object.fromEntries((allProductSpecs[p.productId] || allProductSpecs[p.id]).map(s => [s.key, s.value]))
            : p.specs || {
              surface: `${((p.width || 0) * (p.height || 0)).toFixed(2)} m²`,
              resolution: `${Math.round((p.width || 0) * 400)} x ${Math.round((p.height || 0) * 400)} px`,
              ledModules: Math.round(((p.width || 0) * (p.height || 0)) * 4),
              avgPower: 'N/A',
              pixelPitch: p.pitch || 'N/A',
              projectType: initialEstimation.transactionType === 'sale' ? 'Vente' : 'Location',
              environment: initialEstimation.screenType || 'N/A',
              breaker: 'N/A'
            }
        })) || [
            {
              id: 'default',
              name: 'Estimation Globale',
              quantity: 1,
              unitPrice: dbTotalClient / (1 + taxRate / 100),
              discount: 0
            }
          ],
        productDiscount: initialEstimation.productDiscount || 0,
        deliveryCity: initialEstimation.deliveryCity || initialEstimation.unconfiguredCityQuery || '',
        deliveryCost: (initialEstimation.deliveryCost || 0) / divisor,
        deliveryDiscount: initialEstimation.deliveryDiscount || 0,
        laborCost: (initialEstimation.laborCost || initialEstimation.installationCost || 0) / divisor,
        laborDiscount: initialEstimation.laborDiscount || 0,
        taxRate: taxRate,
        globalDiscount: initialEstimation.globalDiscount || 0,
        history: initialEstimation.history || [
          { id: 'h1', timestamp: new Date().toLocaleString('fr-FR'), action: 'Ouverture du dossier', user: 'Système', userId: 'sys', type: 'local' }
        ],
        payments: initialEstimation.payments || {
          totalPaid: initialEstimation.paidAmount || 0,
          steps: [
            { id: 'p1', label: 'Echéance Unique', amount: initialEstimation.totalClient || initialEstimation.totalQuote || 0, status: 'pending' }
          ]
        },
        status: initialEstimation.status,
        pdfUrl: initialEstimation.pdfUrl
      };
      setEstimation(mapped);
    }
  }, [initialEstimation]);

  useEffect(() => {
    if (startOpen) {
      setIsDrawerOpen(true);
    }
  }, [startOpen]);

  const handleClose = () => {
    setIsDrawerOpen(false);
    onClose?.();
  };

  // Calculations
  const calculations = useMemo(() => {
    const products = estimation.products || [];
    const productsSubtotal = products.reduce((acc, p) => {
      let unitPrice = p.unitPrice || 0;
      if (p.dimensionsEnabled && p.tileWidth && p.tileHeight && p.pricePerTile) {
        const tilesPerWidth = Math.ceil(((p.width || 0) * 100) / (p.tileWidth || 1));
        const tilesPerHeight = Math.ceil(((p.height || 0) * 100) / (p.tileHeight || 1));
        const totalTiles = tilesPerWidth * tilesPerHeight;
        unitPrice = totalTiles * (p.pricePerTile || 0);
      }
      return acc + ((p.quantity || 0) * unitPrice);
    }, 0);

    const productsDiscountedTotal = products.reduce((acc, p) => {
      let unitPrice = p.unitPrice || 0;
      if (p.dimensionsEnabled && p.tileWidth && p.tileHeight && p.pricePerTile) {
        const tilesPerWidth = Math.ceil(((p.width || 0) * 100) / (p.tileWidth || 1));
        const tilesPerHeight = Math.ceil(((p.height || 0) * 100) / (p.tileHeight || 1));
        const totalTiles = tilesPerWidth * tilesPerHeight;
        unitPrice = totalTiles * (p.pricePerTile || 0);
      }
      const lineTotal = (p.quantity || 0) * unitPrice;
      const discounted = lineTotal * (1 - (p.discount || 0) / 100);
      return acc + discounted;
    }, 0);

    const productsTotal = productsDiscountedTotal * (1 - (estimation.productDiscount || 0) / 100);

    const deliveryTotal = (estimation.deliveryCost || 0) - ((estimation.deliveryCost || 0) * (estimation.deliveryDiscount || 0) / 100);
    const laborTotal = (estimation.laborCost || 0) - ((estimation.laborCost || 0) * (estimation.laborDiscount || 0) / 100);

    const subtotalHT = productsTotal + deliveryTotal + laborTotal;
    const tva = (subtotalHT * (estimation.taxRate || 0)) / 100;
    const totalTTC = subtotalHT + tva;
    const finalTotal = totalTTC - (totalTTC * (estimation.globalDiscount || 0) / 100);

    return {
      productsSubtotal,
      productsTotal,
      deliveryTotal,
      laborTotal,
      subtotalHT,
      tva,
      totalTTC,
      finalTotal,
      totalInitial: productsSubtotal + (estimation.deliveryCost || 0) + (estimation.laborCost || 0),
      totalArea: products.reduce((acc, p) => acc + ((p.width || 0) * (p.height || 0) * (p.quantity || 1)), 0),
      techniciansCount: Math.max(1, Math.ceil(products.reduce((acc, p) => acc + ((p.width || 0) * (p.height || 0) * (p.quantity || 1)), 0) / 40))
    };
  }, [estimation]);

  const addHistory = (action: string) => {
    const newEntry: HistoryEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      action,
      user: userProfile?.displayName || 'Système',
      userId: userProfile?.uid || 'sys',
      userPhoto: userProfile?.photoURL || undefined,
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
    const newProduct: LocalProduct = {
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
    if (isNaN(val) || val === undefined || val === null) return "0,00 €";
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

  const addPaymentStep = () => {
    const newStep: PaymentStep = {
      id: Math.random().toString(36).substr(2, 9),
      label: 'Nouvelle échéance',
      amount: 0,
      status: 'pending',
      date: new Date().toLocaleDateString('fr-FR')
    };
    setEstimation(prev => ({
      ...prev,
      payments: prev.payments ? {
        ...prev.payments,
        steps: [...prev.payments.steps, newStep]
      } : {
        totalPaid: 0,
        steps: [newStep]
      }
    }));
    addHistory('Ajout étape de paiement');
  };

  const updatePaymentStep = (id: string, field: keyof PaymentStep, value: any) => {
    setEstimation(prev => {
      if (!prev.payments) return prev;
      const newSteps = prev.payments.steps.map(s => s.id === id ? { ...s, [field]: value } : s);
      const newTotalPaid = newSteps
        .filter(s => s.status === 'completed')
        .reduce((acc, s) => acc + s.amount, 0);

      return {
        ...prev,
        payments: {
          ...prev.payments,
          steps: newSteps,
          totalPaid: newTotalPaid
        }
      };
    });
  };

  const removePaymentStep = (id: string) => {
    setEstimation(prev => {
      if (!prev.payments) return prev;
      const newSteps = prev.payments.steps.filter(s => s.id !== id);
      const newTotalPaid = newSteps
        .filter(s => s.status === 'completed')
        .reduce((acc, s) => acc + s.amount, 0);

      return {
        ...prev,
        payments: {
          ...prev.payments,
          steps: newSteps,
          totalPaid: newTotalPaid
        }
      };
    });
    addHistory('Suppression étape de paiement');
  };

  const togglePaymentStatus = (id: string) => {
    setEstimation(prev => {
      if (!prev.payments) return prev;
      const newSteps = prev.payments.steps.map(s =>
        s.id === id ? { ...s, status: s.status === 'completed' ? 'pending' : 'completed' as any, date: s.status === 'pending' ? new Date().toLocaleDateString('fr-FR') : undefined } : s
      );
      const newTotalPaid = newSteps
        .filter(s => s.status === 'completed')
        .reduce((acc, s) => acc + s.amount, 0);

      return {
        ...prev,
        payments: {
          ...prev.payments,
          steps: newSteps,
          totalPaid: newTotalPaid
        }
      };
    });
    addHistory('Mise à jour statut paiement');
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
    const url = platform === 'whatsapp'
      ? `https://wa.me/${estimation.client.phone.replace(/\s+/g, '')}?text=${encodedMessage}`
      : `https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodedMessage}`;

    window.open(url, '_blank');
    addHistory(`Partage estimation sur ${platform} (${profile})`);
  };

  return (
    <div className="min-h-screen bg-transparent text-white flex flex-col font-sans selection:bg-aura-accent selection:text-white">
      <AnimatePresence>
        {isDrawerOpen && (
          <div className="fixed inset-0 z-[100] flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-[900px] bg-aura-bg flex flex-col overflow-hidden shadow-[-20px_0_80px_rgba(0,0,0,0.5)] border-l border-aura-border"
            >
              <div className="h-20 md:h-24 border-b border-aura-border flex items-center justify-between px-4 md:px-8 bg-black/60 sticky top-0 z-20 backdrop-blur-xl">
                <div className="flex items-center gap-2 md:gap-4">
                  <button onClick={handleClose} className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center hover:bg-white/5 border border-transparent hover:border-aura-border rounded-xl text-aura-text-dim transition-all group shrink-0">
                    <ChevronLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
                  </button>
                  <div>
                    <h2 className="text-lg md:text-xl font-display font-bold text-white tracking-tight uppercase truncate max-w-[120px] md:max-w-none">
                      Estimation
                    </h2>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-[9px] md:text-[10px] text-aura-text-dim font-bold uppercase tracking-widest truncate">
                        DOSSIER TECHNIQUE
                      </span>
                      {estimation.status && (
                        <div className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border ${
                          estimation.status === 'returned' ? 'bg-orange-500/20 border-orange-500/30 text-orange-400' :
                          estimation.status === 'processed' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' :
                          estimation.status === 'archived' ? 'bg-white/10 border-white/20 text-white/40' :
                          'bg-amber-500/20 border-amber-500/30 text-amber-400'
                        }`}>
                          {estimation.status === 'returned' ? 'Retourné' : 
                           estimation.status === 'processed' ? 'Traité' :
                           estimation.status === 'archived' ? 'Archivé' :
                           estimation.status === 'trashed' ? 'Corbeille' :
                           estimation.status === 'pending' ? 'En cours' : estimation.status}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 md:gap-4 shrink-0">
                  <div className="flex items-center gap-1 md:gap-2">
                    {profile === 'supplier' && userProfile?.role !== 'supplier' && (
                      <button
                        onClick={() => setIsTransmitModalOpen(true)}
                        className="h-9 md:h-11 px-3 md:px-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[9px] md:text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-500/20 transition-all text-emerald-500 flex items-center gap-1.5 md:gap-2"
                      >
                        <SendHorizontal size={14} /> <span className="hidden sm:inline">Transmettre</span>
                      </button>
                    )}

                    {userProfile?.role !== 'supplier' && (
                      <button
                        onClick={() => setIsHistoryPanelOpen(true)}
                        className="h-9 md:h-11 px-3 md:px-4 rounded-xl bg-white/5 border border-aura-border text-[9px] md:text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all text-white flex items-center gap-1.5 md:gap-2"
                      >
                        <HistoryIcon size={14} className="text-aura-accent" /> <span className="hidden sm:inline">Historique</span>
                      </button>
                    )}

                    {(estimation.status === 'archived' || estimation.status === 'trashed') && userProfile?.role !== 'supplier' && (
                      <div className="flex items-center gap-2 pr-2 border-r border-white/10">
                        <button
                          onClick={async () => {
                            if (!initialEstimation?.id) return;
                            await updateQuoteStatus(initialEstimation.id, { status: 'processed' });
                            setEstimation(prev => ({ ...prev, status: 'processed' }));
                            addHistory('Restauration du dossier');
                            if (onStatusChange) onStatusChange('processed');
                          }}
                          className="h-9 md:h-11 px-3 md:px-4 rounded-xl bg-blue-500/10 border border-blue-500/30 text-[9px] md:text-[10px] font-bold uppercase tracking-widest hover:bg-blue-500/20 transition-all text-blue-500 flex items-center gap-1.5 md:gap-2"
                        >
                          <Eraser size={14} /> <span className="hidden sm:inline">Désarchiver</span>
                        </button>
                        
                        {estimation.status === 'archived' ? (
                          <button
                            onClick={async () => {
                              if (!initialEstimation?.id) return;
                              if (confirm('Déplacer ce dossier vers la corbeille ?')) {
                                await updateQuoteStatus(initialEstimation.id, { status: 'trashed' });
                                handleClose();
                                if (onStatusChange) onStatusChange('trashed');
                              }
                            }}
                            className="h-9 md:h-11 px-3 md:px-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-[9px] md:text-[10px] font-bold uppercase tracking-widest hover:bg-rose-500/20 transition-all text-rose-500 flex items-center gap-1.5 md:gap-2"
                          >
                            <Trash2 size={14} /> <span className="hidden sm:inline">Corbeille</span>
                          </button>
                        ) : (
                          <button
                            onClick={async () => {
                              if (!initialEstimation?.id) return;
                              if (confirm('Attention : Cette action est irréversible. Supprimer définitivement ce dossier ?')) {
                                // Deleting permanent is best done from the dashboard where we have delete access,
                                // but we can simulate it or alert for safety here.
                                alert("Veuillez utiliser le tableau de bord principal (onglet Corbeille) pour effectuer une suppression définitive.");
                                handleClose();
                              }
                            }}
                            className="h-9 md:h-11 px-3 md:px-4 rounded-xl bg-red-600/20 border border-red-500/50 text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-red-600/40 transition-all text-red-500 flex items-center gap-1.5 md:gap-2"
                          >
                            <Trash2 size={14} /> <span className="hidden sm:inline">Supprimer Def.</span>
                          </button>
                        )}
                      </div>
                    )}

                    {profile === 'client' && userProfile?.role !== 'supplier' && (
                      <div className="flex items-center gap-1 md:gap-2 pl-1 md:pl-2 border-l border-white/10">
                        <button
                          onClick={() => setIsEditMode(!isEditMode)}
                          disabled={estimation.status === 'archived' || estimation.status === 'trashed'}
                          className={`h-9 md:h-11 px-3 md:px-4 rounded-xl border text-[9px] md:text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-1.5 md:gap-2 ${isEditMode ? 'bg-amber-500/20 border-amber-500/50 text-amber-500' : 'bg-white/5 border-aura-border text-aura-text-dim hover:text-white'} ${(estimation.status === 'archived' || estimation.status === 'trashed') ? 'opacity-30 cursor-not-allowed' : ''}`}
                        >
                          <Pencil size={14} /> <span className="hidden sm:inline">{isEditMode ? 'Quitter' : 'Éditer'}</span>
                        </button>

                        <button
                          onClick={handleDownloadPdf}
                          disabled={isPdfLoading}
                          className="w-9 h-9 md:w-11 md:h-11 rounded-xl bg-white/5 border border-aura-border hover:bg-white/10 transition-all text-white flex items-center justify-center disabled:opacity-50"
                        >
                          {isPdfLoading ? <Loader2 size={14} className="animate-spin text-aura-accent" /> : <Download size={14} className="text-aura-accent md:w-4 md:h-4" />}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className={`flex-1 overflow-y-auto p-4 md:p-8 space-y-6 md:space-y-10 custom-sidebar-scroll relative no-scrollbar ${(estimation.status === 'archived' || estimation.status === 'trashed') ? 'opacity-60 grayscale-[0.5] pointer-events-none' : ''}`}>
                <AnimatePresence>
                  {aiResult && (
                    <motion.section
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="glass-card border-aura-accent/30 bg-aura-accent/5 p-4 md:p-6 space-y-3 shadow-aura-accent-glow/20"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-aura-accent flex items-center gap-2">
                          <Sparkles size={14} /> {aiResult.title}
                        </h3>
                        <button onClick={() => setAiResult(null)} className="text-aura-text-dim hover:text-white transition-colors"><X size={14} /></button>
                      </div>
                      <div className="text-[11px] md:text-xs leading-relaxed text-white/90 whitespace-pre-wrap font-sans">{aiResult.content}</div>
                    </motion.section>
                  )}
                </AnimatePresence>

                <div className="space-y-4 md:space-y-6 w-full">
                  <div className="flex justify-center w-full">
                    <div className="flex p-1 bg-black/40 border border-aura-border rounded-xl shadow-2xl w-full sm:w-auto">
                      {userProfile?.role !== 'supplier' && (
                        <button
                          onClick={() => { setProfile('client'); addHistory('Switch Profil: Client'); }}
                          className={`flex-1 sm:flex-none px-2 sm:px-8 py-2 md:py-2.5 rounded-lg text-[9px] md:text-xs font-bold uppercase transition-all tracking-widest flex justify-center items-center gap-1.5 md:gap-2 ${profile === 'client' ? 'bg-aura-accent text-white shadow-lg' : 'text-aura-text-dim hover:text-white'}`}
                        >
                          <User size={14} /> <span className="truncate">Profil Client</span>
                        </button>
                      )}
                      <button
                        onClick={() => { setProfile('supplier'); addHistory('Switch Profil: Fournisseur (Vérification)'); }}
                        className={`flex-1 sm:flex-none px-2 sm:px-8 py-2 md:py-2.5 rounded-lg text-[9px] md:text-xs font-bold uppercase transition-all tracking-widest flex justify-center items-center gap-1.5 md:gap-2 ${profile === 'supplier' ? 'bg-aura-accent text-white shadow-lg' : 'text-aura-text-dim hover:text-white'}`}
                      >
                        <Truck size={14} /> <span className="truncate">Profil Fournisseur</span>
                      </button>
                    </div>
                  </div>

                </div>

                <AnimatePresence>
                  {profile === 'client' && (
                    <motion.section
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-4"
                    >
                      <h3 className="text-xs font-bold uppercase tracking-widest text-aura-accent flex items-center gap-2">
                        <User size={14} /> INFORMATIONS DU DOSSIER
                      </h3>
                      <div className="glass-card p-6 grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                        <div className="space-y-1">
                          <span className="text-[10px] text-aura-text-dim font-bold uppercase tracking-widest">Nom du Client</span>
                          <input
                            type="text"
                            disabled={!isEditMode}
                            value={estimation.client.name}
                            onChange={(e) => updateClient('name', e.target.value)}
                            className="neon-input w-full py-2 bg-white/5 font-display font-black uppercase"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] text-aura-text-dim font-bold uppercase tracking-widest">N° Estimation</span>
                          <input
                            type="text"
                            disabled={!isEditMode}
                            value={estimation.id || ''}
                            onChange={() => { }}
                            className="neon-input w-full py-2 bg-white/5 font-mono font-bold uppercase cursor-not-allowed"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] text-aura-text-dim font-bold uppercase tracking-widest">Email</span>
                          <input
                            type="text"
                            disabled={!isEditMode}
                            value={estimation.client.email}
                            onChange={(e) => updateClient('email', e.target.value)}
                            className="neon-input w-full py-2 bg-white/5 font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] text-aura-text-dim font-bold uppercase tracking-widest">Téléphone</span>
                          <input
                            type="text"
                            disabled={!isEditMode}
                            value={estimation.client.phone}
                            onChange={(e) => updateClient('phone', e.target.value)}
                            className="neon-input w-full py-2 bg-white/5 font-mono font-bold"
                          />
                        </div>
                        <div className="md:col-span-2 space-y-1">
                          <span className="text-[10px] text-aura-text-dim font-bold uppercase tracking-widest">Adresse de livraison</span>
                          <input
                            type="text"
                            disabled={!isEditMode}
                            value={estimation.client.address || ''}
                            onChange={(e) => updateClient('address', e.target.value)}
                            className="neon-input w-full py-2 bg-white/5 uppercase"
                          />
                        </div>

                        <div className="md:col-span-2 pt-6 mt-4 border-t border-white/5 space-y-4">
                          <div className="flex flex-wrap gap-6 bg-black/40 p-4 rounded-xl border border-white/5">
                            <label className="flex items-center gap-3 cursor-pointer group">
                              <div className="relative inline-flex items-center h-5 w-10">
                                <input
                                  type="checkbox"
                                  className="sr-only peer"
                                  checked={estimation.hideCommentsFromSupplier}
                                  onChange={() => setEstimation({ ...estimation, hideCommentsFromSupplier: !estimation.hideCommentsFromSupplier })}
                                />
                                <div className="w-10 h-5 bg-white/10 rounded-full peer peer-checked:bg-aura-accent after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5 transition-all duration-300"></div>
                              </div>
                              <span className="text-[9px] font-bold uppercase tracking-widest text-aura-text-dim group-hover:text-white transition-colors uppercase">Masquer notes au fournisseur</span>
                            </label>

                            <label className="flex items-center gap-3 cursor-pointer group">
                              <div className="relative inline-flex items-center h-5 w-10">
                                <input
                                  type="checkbox"
                                  className="sr-only peer"
                                  checked={estimation.hidePhotoFromSupplier}
                                  onChange={() => setEstimation({ ...estimation, hidePhotoFromSupplier: !estimation.hidePhotoFromSupplier })}
                                />
                                <div className="w-10 h-5 bg-white/10 rounded-full peer peer-checked:bg-aura-accent after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5 transition-all duration-300"></div>
                              </div>
                              <span className="text-[9px] font-bold uppercase tracking-widest text-aura-text-dim group-hover:text-white transition-colors uppercase">Masquer photo au fournisseur</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </motion.section>
                  )}
                </AnimatePresence>


                <AnimatePresence>
                  {(profile === 'client' || (profile === 'supplier' && !estimation.hidePhotoFromSupplier)) && (
                    <motion.section
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-4 overflow-hidden"
                    >
                      <h3 className="text-xs font-bold uppercase tracking-widest text-aura-accent flex items-center gap-2">
                        <ImageIcon size={14} /> PHOTO DU LIEU
                      </h3>
                      <div className="glass-card p-6 relative group">
                        <div className="relative h-[300px] rounded-2xl overflow-hidden border border-white/10 group/img bg-white/5">
                          {estimation.client.sitePhoto ? (
                            <>
                              <img
                                src={estimation.client.sitePhoto}
                                alt="Site"
                                className="w-full h-full object-cover transition-all group-hover/img:scale-105 cursor-pointer"
                                onClick={() => setFullscreenPhoto(estimation.client.sitePhoto!)}
                              />
                              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover/img:opacity-100 transition-opacity">
                                <button
                                  onClick={() => setFullscreenPhoto(estimation.client.sitePhoto!)}
                                  className="w-10 h-10 flex items-center justify-center bg-black/60 backdrop-blur rounded-xl text-white border border-white/10 hover:bg-aura-accent transition-all hover:scale-110 shadow-2xl"
                                >
                                  <Maximize2 size={18} />
                                </button>
                                {profile === 'client' && isEditMode && (
                                  <button
                                    onClick={() => {
                                      setEstimation({ ...estimation, client: { ...estimation.client, sitePhoto: undefined } });
                                      addHistory("Suppression photo du site");
                                    }}
                                    className="w-10 h-10 flex items-center justify-center bg-red-500/80 backdrop-blur rounded-xl text-white border border-red-500/20 hover:bg-red-600 transition-all hover:scale-110 shadow-2xl"
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                )}
                              </div>
                            </>
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-aura-text-dim text-xs gap-3">
                              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center border border-dashed border-white/10">
                                <ImageIcon size={32} />
                              </div>
                              <span className="font-bold uppercase tracking-widest opacity-50 text-[10px]">Aucun visuel disponible</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.section>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {(profile === 'client' || (profile === 'supplier' && !estimation.hideCommentsFromSupplier && estimation.client.notes)) && (
                    <motion.section
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-6 glass-card bg-aura-accent/5 border-aura-accent/20"
                    >
                      <h4 className="text-[10px] font-bold text-aura-accent uppercase mb-2 flex items-center gap-2">
                        <StickyNote size={12} /> NOTES DU CLIENT
                      </h4>
                      {estimation.client.notes && (
                        <p className="text-xs text-white/90 italic leading-relaxed whitespace-pre-wrap mb-4">{estimation.client.notes}</p>
                      )}
                      {profile === 'client' && isEditMode && (
                        <div className={`${estimation.client.notes ? 'mt-4 pt-4 border-t border-white/5' : ''}`}>
                          <textarea
                            value={estimation.client.notes || ''}
                            onChange={(e) => updateClient('notes', e.target.value)}
                            className="neon-input w-full bg-black/40 p-4 text-xs resize-none"
                            rows={4}
                            placeholder="Écrivez vos notes ici..."
                          />
                        </div>
                      )}
                    </motion.section>
                  )}
                </AnimatePresence>

                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-aura-accent flex items-center gap-2">
                      <Box size={14} /> {profile === 'supplier' ? 'Dossier Technique Produit' : 'Lignes de Produits'}
                    </h3>
                    {isEditMode && (
                      <button onClick={addProduct} className="text-[10px] font-bold text-aura-accent flex items-center gap-1 hover:text-white transition-colors">
                        <Plus size={12} /> Ajouter Ligne
                      </button>
                    )}
                  </div>

                  <div className="space-y-6">
                    {estimation.products.map((p) => (
                      <div key={p.id} className="glass-card overflow-hidden transition-all duration-300 border border-white/5 hover:border-aura-accent/30 group">
                        <div className="p-8">
                          <div className="flex items-center justify-between gap-4 mb-8">
                            <div className="flex-1 min-w-0">
                              <span className="text-[9px] text-aura-accent font-black uppercase tracking-[0.3em] mb-2 block">Produit / Désignation</span>
                              {isEditMode ? (
                                <input
                                  value={p.name}
                                  onChange={(e) => {
                                    const newProducts = estimation.products.map(prod => prod.id === p.id ? { ...prod, name: e.target.value } : prod);
                                    setEstimation({ ...estimation, products: newProducts });
                                  }}
                                  className="w-full bg-transparent border-b border-aura-accent/30 p-0 focus:ring-0 text-2xl font-display font-black text-white placeholder:opacity-20 uppercase"
                                  placeholder="Nom du produit..."
                                />
                              ) : (
                                <div className="text-2xl font-display font-black text-white tracking-tighter uppercase">{p.name}</div>
                              )}
                            </div>
                            {isEditMode && (
                              <button
                                onClick={() => removeProduct(p.id)}
                                className="p-2.5 text-red-500/50 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                              >
                                <Trash2 size={20} />
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                            <NumericControl
                              label="Quantité"
                              value={p.quantity}
                              onChange={(val) => {
                                const newProducts = estimation.products.map(prod => prod.id === p.id ? { ...prod, quantity: val } : prod);
                                setEstimation({ ...estimation, products: newProducts });
                              }}
                            />
                            {profile === 'client' && (
                              <>
                                <NumericControl
                                  label="Prix Unitaire (€)"
                                  unit="€"
                                  value={p.unitPrice}
                                  onChange={(val) => {
                                    const newProducts = estimation.products.map(prod => prod.id === p.id ? { ...prod, unitPrice: val } : prod);
                                    setEstimation({ ...estimation, products: newProducts });
                                  }}
                                />
                                <NumericControl
                                  label="Remise (%)"
                                  unit="%"
                                  value={p.discount || 0}
                                  onChange={(val) => {
                                    const newProducts = estimation.products.map(prod => prod.id === p.id ? { ...prod, discount: val } : prod);
                                    setEstimation({ ...estimation, products: newProducts });
                                  }}
                                />
                              </>
                            )}
                          </div>

                          <div className="mt-8 pt-6 border-t border-white/5 flex items-end justify-between">
                            <div className="space-y-1">
                              <span className="text-[13px] text-aura-text-dim font-bold uppercase tracking-widest block">Référence Article</span>
                              <div className="text-sm font-display font-black text-white/90 uppercase tracking-tight">{p.productId || 'N/A'}</div>
                            </div>
                            {profile === 'client' && (
                              <div className="text-right">
                                <span className="text-[10px] text-aura-text-dim font-bold uppercase tracking-widest block mb-1">Total pour cette ligne</span>
                                <div className="flex items-center gap-3 justify-end">
                                  {(p.discount || 0) > 0 && (
                                    <span className="text-sm text-red-500/40 line-through font-mono">
                                      {formatCurrency(p.quantity * p.unitPrice)}
                                    </span>
                                  )}
                                  <span className="text-3xl font-display font-black text-white tracking-tighter">
                                    {formatCurrency((p.quantity * p.unitPrice) * (1 - (p.discount || 0) / 100))}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="px-8 pb-8">
                          <div className="bg-black rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
                            <div className="p-8 pb-0 flex items-center justify-between mb-8">
                              <h4 className="text-[11px] font-black text-aura-accent uppercase tracking-[0.3em] flex items-center gap-3">
                                <Settings size={16} /> Spécifications Techniques
                              </h4>
                              <div className="w-2.5 h-2.5 rounded-full bg-aura-success shadow-[0_0_12px_rgba(34,197,94,0.6)]" />
                            </div>
                            <div className="p-8 pt-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-x-12 gap-y-8">
                              {(() => {
                                const getSpecValue = (searchKeys: string[], fallback: string) => {
                                  let val = null;
                                  const isValid = (v: any) => v && v !== 'N/A' && v !== 'n/a' && v !== 'null' && v !== 'undefined';

                                  if (p.specs) {
                                    const keys = Object.keys(p.specs);
                                    for (const sk of searchKeys) {
                                      const fk = keys.find(k => k.toLowerCase().includes(sk.toLowerCase()));
                                      if (fk && isValid(p.specs[fk])) { val = p.specs[fk]; break; }
                                    }
                                  }
                                  if (!isValid(val) && allProductSpecs) {
                                    const globalSpecs = allProductSpecs[p.productId || p.id];
                                    if (globalSpecs) {
                                      for (const sk of searchKeys) {
                                        const found = globalSpecs.find(s => s.key.toLowerCase().includes(sk.toLowerCase()));
                                        if (found && isValid(found.value)) { val = found.value; break; }
                                      }
                                    }
                                  }
                                  if (!isValid(val) && allProducts) {
                                    const globalProduct = allProducts.find(prod => prod.id === (p.productId || p.id));
                                    if (globalProduct) {
                                      if ((globalProduct as any).selectedChars) {
                                        for (const sk of searchKeys) {
                                          const found = (globalProduct as any).selectedChars.find((c: any) => c.name?.toLowerCase().includes(sk.toLowerCase()));
                                          if (found && isValid(found.value)) { val = found.value; break; }
                                        }
                                      }
                                      // Check root product object
                                      if (!isValid(val)) {
                                        for (const sk of searchKeys) {
                                          const found = Object.entries(globalProduct).find(([k]) => k.toLowerCase().includes(sk.toLowerCase()));
                                          if (found && isValid(found[1])) { val = found[1]; break; }
                                        }
                                      }
                                    }
                                  }
                                  return isValid(val) ? val : fallback;
                                };

                                // Retrieve base specs
                                const projectType = getSpecValue(['projecttype', 'type'], "Vente");
                                const environment = getSpecValue(['environment', 'environnement'], "Intérieur");
                                const visionDistance = getSpecValue(['vision', 'distance'], "N/A");
                                const pixelPitchStr = getSpecValue(['pixelpitch', 'pitch'], "2.5");

                                // Perform calculations exactly like the wizard
                                const w = p.width || 0;
                                const h = p.height || 0;
                                const qty = p.quantity || 1;
                                const area = w * h * qty;

                                const pitchValue = parseFloat(String(pixelPitchStr).replace('P', '')) || 2.5;
                                const resX = Math.round((w * 1000) / pitchValue);
                                const resY = Math.round((h * 1000) / pitchValue);
                                const modules = Math.ceil(w / 0.5) * Math.ceil(h / 0.5) * qty;
                                const isOutdoor = environment.toLowerCase().includes('exterieur') || environment.toLowerCase().includes('extérieur');
                                const powerMax = area * (isOutdoor ? 0.8 : 0.6);
                                const powerAvg = powerMax * 0.35;
                                const amps = Math.ceil((powerMax * 1000) / 230 / 3);

                                return [
                                  { label: "SURFACE TOTALE", value: `${area.toFixed(2)} m²`, icon: <Maximize2 size={16} />, color: "text-blue-400", bgColor: "bg-blue-400/10" },
                                  { label: "RÉSOLUTION", value: `${resX} x ${resY} pixels`, icon: <Monitor size={16} />, color: "text-violet-400", bgColor: "bg-violet-400/10" },
                                  { label: "NOMBRE DE MODULES LED", value: modules.toString(), icon: <Cpu size={16} />, color: "text-fuchsia-400", bgColor: "bg-fuchsia-400/10" },
                                  { label: "PUISSANCE MAXIMALE", value: `${powerMax.toFixed(1)} kW`, icon: <Zap size={16} />, color: "text-emerald-400", bgColor: "bg-emerald-400/10" },
                                  { label: "PUISSANCE MOYENNE", value: `${powerAvg.toFixed(1)} kW`, icon: <Zap size={16} />, color: "text-sky-400", bgColor: "bg-sky-400/10" },
                                  { label: "DISJONCTEUR RECOMMANDÉ", value: `${amps}A Tripolaire`, icon: <Zap size={16} />, color: "text-orange-400", bgColor: "bg-orange-400/10" },
                                  { label: "TYPE DE PROJET", value: projectType, icon: <Truck size={16} />, color: "text-orange-400", bgColor: "bg-orange-400/10" },
                                  { label: "ENVIRONNEMENT", value: environment, icon: <Sun size={16} />, color: "text-teal-400", bgColor: "bg-teal-400/10" },
                                  { label: "DISTANCE DE VISIONNAGE", value: visionDistance, icon: <Eye size={16} />, color: "text-cyan-400", bgColor: "bg-cyan-400/10" },
                                  { label: "PIXEL PITCH", value: pixelPitchStr, icon: <LayoutGrid size={16} />, color: "text-red-400", bgColor: "bg-red-400/10" },
                                ].map((spec, idx) => (
                                  <TechnicalSpec
                                    key={idx}
                                    icon={spec.icon}
                                    label={spec.label}
                                    value={spec.value?.toString() || 'N/A'}
                                    colorClass={spec.color}
                                    bgColorClass={spec.bgColor}
                                  />
                                ));
                              })()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>


                  {profile === 'supplier' && (
                    <div className="p-6 glass-card bg-aura-accent/[0.03] border-aura-border">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-aura-accent/10 flex items-center justify-center text-aura-accent"><Info size={20} /></div>
                        <div>
                          <div className="text-xs font-bold uppercase tracking-wider">Mode Technique Fournisseur Active</div>
                          <div className="text-[10px] text-aura-text-dim mt-1 font-mono uppercase tracking-[0.2em]">Données chiffrées masquées conformément à la politique commerciale.</div>
                        </div>
                      </div>
                    </div>
                  )}
                </section>

                <AnimatePresence>
                  {profile === 'client' && (
                    <motion.section
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-4"
                    >
                      <h3 className="text-xs font-bold uppercase tracking-widest text-aura-accent flex items-center gap-2 uppercase">
                        <Truck size={14} /> LOGISTIQUE & SERVICES
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="glass-card p-6 space-y-4">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-aura-accent/10 flex items-center justify-center text-aura-accent"><Truck size={20} /></div>
                              <div>
                                <div className="text-xs font-bold uppercase">LIVRAISON</div>
                                <div className="text-[10px] text-aura-text-dim uppercase">Ville: <b>{estimation.deliveryCity || 'Non spécifiée'}</b></div>
                              </div>
                            </div>
                            <span className="text-lg font-bold font-mono text-aura-accent">{formatCurrency(calculations.deliveryTotal)}</span>
                          </div>
                          {isEditMode && (
                            <div className="space-y-6 pt-6 border-t border-aura-border">
                              <div className="space-y-1.5 flex-1 min-w-0">
                                <span className="text-[9px] text-aura-text-dim uppercase font-bold tracking-widest">Ville de Destination</span>
                                <CustomSelect
                                  placeholder="Choisir une ville..."
                                  value={estimation.deliveryCity || ''}
                                  onChange={(val) => setEstimation({ ...estimation, deliveryCity: val })}
                                  options={villes}
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <NumericControl
                                  label="Prix (€)"
                                  unit="€"
                                  value={estimation.deliveryCost}
                                  onChange={(val) => setEstimation({ ...estimation, deliveryCost: val })}
                                />
                                <NumericControl
                                  label="Remise (%)"
                                  unit="%"
                                  value={estimation.deliveryDiscount}
                                  onChange={(val) => setEstimation({ ...estimation, deliveryDiscount: val })}
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="glass-card p-6 space-y-4">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-aura-accent/10 flex items-center justify-center text-aura-accent"><Wrench size={20} /></div>
                              <div>
                                <div className="text-xs font-bold uppercase">Main d'œuvre</div>
                                <div className="text-aura-text-dim uppercase">Installation experte</div>
                              </div>
                            </div>
                            <span className="text-lg font-bold font-mono text-aura-accent">{formatCurrency(calculations.laborTotal)}</span>
                          </div>
                          {isEditMode && (
                            <div className="space-y-4 pt-4 border-t border-aura-border">
                              <div className="py-4 border-b border-white/5 mb-2">
                                <div className="text-[10px] text-aura-text-dim uppercase font-black tracking-[0.2em] leading-relaxed">
                                  Pour une surface totale de <span className="text-aura-accent">{calculations.totalArea.toFixed(2)} m²</span>
                                </div>
                                <div className="text-[10px] text-aura-text-dim uppercase font-black tracking-[0.2em] leading-relaxed">
                                  votre projet nécessite <span className="text-aura-accent">{calculations.techniciansCount}</span> technicien(s).
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <NumericControl
                                  label="Prix (€)"
                                  unit="€"
                                  value={estimation.laborCost}
                                  onChange={(val) => setEstimation({ ...estimation, laborCost: val })}
                                />
                                <NumericControl
                                  label="Remise (%)"
                                  unit="%"
                                  value={estimation.laborDiscount}
                                  onChange={(val) => setEstimation({ ...estimation, laborDiscount: val })}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                    </motion.section>
                  )}
                </AnimatePresence>



                {/* MOBILE ONLY FOOTER (In-flow to allow scrolling) */}
                <AnimatePresence>
                  {profile === 'client' && (
                    <motion.div
                      key="aura-footer-mobile"
                      className="block md:hidden mt-8 mb-6 p-5 bg-white/[0.03] border border-aura-border rounded-2xl shadow-2xl mx-4"
                    >
                      <div className="flex justify-between items-end mb-4 pb-4 border-b border-white/5">
                        <div>
                          <span className="text-[10px] text-aura-text-dim uppercase font-black tracking-[0.2em] block mb-1">Sous-total HT</span>
                          <span className="text-xl font-display font-black text-white">{formatCurrency(calculations.subtotalHT)}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-aura-text-dim uppercase font-black tracking-[0.2em] block mb-1">TVA ({estimation.taxRate}%)</span>
                          <span className="font-mono text-sm text-aura-accent font-bold">+{formatCurrency(calculations.tva)}</span>
                        </div>
                      </div>

                      {isEditMode && (
                        <div className="grid grid-cols-2 gap-3 mb-6">
                          <NumericControl label="TVA (%)" value={estimation.taxRate} onChange={(val) => setEstimation({ ...estimation, taxRate: val })} />
                          <NumericControl label="REMISE (%)" value={estimation.globalDiscount} onChange={(val) => setEstimation({ ...estimation, globalDiscount: val })} />
                        </div>
                      )}

                      <div className="text-center pt-2 pb-2">
                        <div className="text-[11px] uppercase font-black mb-1 tracking-[0.3em] text-aura-accent font-display">À Payer (TTC)</div>
                        <div className="text-4xl font-display font-black neon-text-emerald">{formatCurrency(calculations.finalTotal)}</div>
                        {estimation.globalDiscount > 0 && (
                          <div className="text-[9px] text-emerald-400/80 font-bold mt-2 uppercase tracking-[0.2em]">Remise exceptionnelle appliquée</div>
                        )}
                      </div>

                      {isEditMode && (
                        <button
                          onClick={() => { addHistory('Validation Modifications'); setIsEditMode(false); }}
                          className="futuristic-btn-primary w-full mt-4 py-4 text-[10px]"
                        >
                          Approuver et Enregistrer
                        </button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>

              <AnimatePresence>
                {profile === 'client' && (
                  <motion.div
                    key="aura-footer"
                    initial={{ y: 80, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="aura-footer-fixed hidden md:block"
                  >
                    <div className="flex flex-col md:flex-row md:items-end gap-6 md:gap-10 mb-8 emerald-neon-halo">
                      <div className="flex-1 bg-white/[0.03] p-5 md:p-6 rounded-2xl border border-white/5 shadow-2xl w-full">
                        <div className="space-y-4">
                          <div className="flex flex-col sm:flex-row justify-between sm:items-end border-b border-white/5 pb-4 gap-4 sm:gap-0">
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] text-aura-text-dim uppercase font-black tracking-[0.2em] font-display">Sous-total HT</span>
                              <span className="text-2xl font-display font-black text-white tracking-tighter">{formatCurrency(calculations.subtotalHT)}</span>
                            </div>
                            <div className="text-left sm:text-right flex flex-col sm:items-end gap-1">
                              <span className="text-[10px] text-aura-text-dim uppercase font-black tracking-[0.2em] font-display">TVA ({estimation.taxRate}%)</span>
                              <span className="font-mono text-base text-aura-accent font-bold">+{formatCurrency(calculations.tva)}</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <NumericControl
                              label="TVA (%)"
                              unit="%"
                              value={estimation.taxRate}
                              onChange={(val) => setEstimation({ ...estimation, taxRate: val })}
                            />
                            <NumericControl
                              label="REMISE GLOBALE (%)"
                              unit="%"
                              value={estimation.globalDiscount}
                              onChange={(val) => setEstimation({ ...estimation, globalDiscount: val })}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="text-left md:text-right flex flex-col justify-end min-w-0 md:min-w-[220px] flex-shrink-0 relative">
                        {/* Floating Neon Halo Decoration */}
                        <div className="absolute -inset-4 bg-emerald-500/10 blur-[40px] rounded-full pointer-events-none hidden md:block" />

                        <div className="text-[11px] uppercase font-black mb-1 [letter-spacing:0.3em] text-aura-accent font-display relative z-10">À Payer (TTC)</div>
                        <div className="text-4xl sm:text-5xl md:text-6xl font-display font-black tracking-tighter neon-text-emerald relative z-10 truncate">
                          {formatCurrency(calculations.finalTotal)}
                        </div>
                        {estimation.globalDiscount > 0 && (
                          <div className="text-[10px] text-emerald-400/80 font-bold mt-2 uppercase tracking-[0.2em] font-display relative z-10">
                            Remise exceptionnelle appliquée
                          </div>
                        )}
                      </div>
                    </div>

                    {isEditMode && (
                      <button
                        onClick={() => { addHistory('Validation Modifications'); setIsEditMode(false); }}
                        className="futuristic-btn-primary w-full group"
                      >
                        Approuver et Enregistrer le Dossier
                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {aiResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-2xl z-[300] p-10 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-2xl bg-aura-card border border-aura-accent/30 rounded-[2rem] flex flex-col overflow-hidden shadow-[0_0_100px_rgba(59,130,246,0.2)]"
            >
              <div className="p-8 border-b border-aura-border flex items-center justify-between bg-aura-accent/5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-aura-accent flex items-center justify-center text-white">
                    <Sparkles size={24} />
                  </div>
                  <h2 className="text-2xl font-display font-bold uppercase">{aiResult.title}</h2>
                </div>
                <button onClick={() => setAiResult(null)} className="w-10 h-10 hover:bg-white/5 rounded-full flex items-center justify-center"><X size={20} /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-10">
                <div className="prose prose-invert max-w-none">
                  <p className="text-aura-text-dim leading-relaxed whitespace-pre-wrap font-mono text-sm bg-white/5 p-6 rounded-2xl border border-white/5">
                    {aiResult.content}
                  </p>
                </div>
              </div>

              <div className="p-8 bg-black/40 flex flex-col md:flex-row justify-between items-center gap-4 border-t border-white/5">
                <div className="flex items-center gap-3">
                  <button onClick={() => shareTranslatedText('whatsapp', aiResult.content)} className="px-6 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                    <MessageCircle size={14} /> WhatsApp
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => { if (aiResult) { navigator.clipboard.writeText(aiResult.content); addHistory('Copie résultat IA'); } }}
                    className="px-6 py-3 rounded-xl bg-white/5 border border-aura-border text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2"
                  >
                    Copier
                  </button>
                  <button onClick={() => setAiResult(null)} className="px-6 py-3 rounded-xl bg-aura-accent text-white text-xs font-bold uppercase tracking-widest transition-all">Fermer</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {fullscreenPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-xl flex items-center justify-center p-8"
          >
            <motion.button
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              onClick={() => setFullscreenPhoto(null)}
              className="absolute top-8 right-8 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all border border-white/10"
            >
              <X size={24} />
            </motion.button>
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              src={fullscreenPhoto}
              className="max-w-full max-h-full rounded-2xl shadow-2xl object-contain border border-white/10"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isTransmitModalOpen && (
          <TransmitModal
            isOpen={isTransmitModalOpen}
            onClose={() => setIsTransmitModalOpen(false)}
            onConfirm={async (supplierId, supplierName, notes) => {
              // Get the raw ID from the initialEstimation object (not the formatted display ID)
              const rawId = initialEstimation?.id;
              if (!rawId) {
                alert('Erreur: identifiant de devis introuvable.');
                return;
              }
              try {
                await updateQuoteStatus(rawId, {
                  status: 'in_progress',
                  supplierId: supplierId,
                  supplierNotes: notes,
                  transmittedToSupplier: true,
                } as any);
                // Update local state to reflect the change
                setEstimation(prev => ({
                  ...prev,
                  transmittedToSupplier: true,
                  supplierId: supplierId,
                  supplierNotes: notes,
                  status: 'in_progress'
                } as any));
                addHistory(`Transmission au fournisseur ${supplierName} validée`);
                setIsTransmitModalOpen(false);
                setProfile('supplier');
                if (onStatusChange) onStatusChange('in_progress');
                // Success toast
                const toast = document.createElement('div');
                toast.innerHTML = `✅ Devis transmis à <strong>${supplierName}</strong> avec succès !`;
                toast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#10b981;color:white;padding:14px 28px;border-radius:16px;font-weight:700;font-size:14px;z-index:9999;box-shadow:0 8px 32px rgba(16,185,129,0.4);animation:fadeIn 0.3s ease';
                document.body.appendChild(toast);
                setTimeout(() => toast.remove(), 4000);
              } catch (err: any) {
                console.error('[TransmitModal] Error saving transmission:', err);
                const toast = document.createElement('div');
                toast.textContent = `❌ Erreur lors du transfert: ${err?.message || 'Veuillez réessayer'}`;
                toast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#ef4444;color:white;padding:14px 28px;border-radius:16px;font-weight:700;font-size:14px;z-index:9999;box-shadow:0 8px 32px rgba(239,68,68,0.4)';
                document.body.appendChild(toast);
                setTimeout(() => toast.remove(), 5000);
              }
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isHistoryPanelOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 35, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-4xl z-[800] bg-aura-card flex flex-col border-l border-aura-border shadow-2xl"
          >
            <div className="p-8 border-b border-aura-border flex items-center justify-between bg-black/40 h-24">
              <div className="flex items-center gap-4">
                <button onClick={() => setIsHistoryPanelOpen(false)} className="w-10 h-10 hover:bg-aura-accent hover:text-white rounded-xl flex items-center justify-center transition-all bg-aura-accent/10 text-aura-accent"><ChevronLeft size={24} /></button>
                <div>
                  <h2 className="text-2xl font-display font-black uppercase tracking-tighter">Historique</h2>
                  <div className="text-[10px] text-aura-text-dim uppercase font-bold tracking-widest mt-0.5">Dossier: {estimation.id}</div>
                </div>
              </div>
              <button onClick={() => setIsHistoryPanelOpen(false)} className="w-12 h-12 flex items-center justify-center hover:bg-white/5 rounded-full transition-all text-aura-accent hover:scale-110">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-6 custom-sidebar-scroll no-scrollbar">
              {estimation.history.slice((historyPage - 1) * itemsPerPage, historyPage * itemsPerPage).map((entry) => (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  key={entry.id}
                  className="relative pl-12 border-l border-aura-accent/20 pb-10 last:pb-0"
                >
                  <div className="absolute left-[-21px] top-0 w-10 h-10 rounded-full border-2 border-aura-accent/30 bg-aura-card overflow-hidden z-10 shadow-lg">
                    {entry.userPhoto ? (
                      <img src={entry.userPhoto} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-aura-accent/10 text-aura-accent text-xs font-bold">
                        {entry.user?.[0]?.toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between items-start mb-1 text-[10px] font-mono text-aura-text-dim uppercase">
                    <span>{new Date(entry.timestamp).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 uppercase tracking-widest">{entry.user}</span>
                  </div>
                  <div className="text-lg font-bold text-white/90 tracking-tight leading-snug uppercase">{entry.action}</div>
                </motion.div>
              ))}
            </div>

            <div className="p-8 border-t border-aura-border bg-black/40 flex justify-between items-center">
              <div className="text-[10px] text-aura-text-dim font-bold uppercase tracking-[0.2em]">Page {historyPage} sur {Math.ceil(estimation.history.length / itemsPerPage)}</div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setHistoryPage(prev => Math.max(1, prev - 1))}
                  disabled={historyPage === 1}
                  className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-aura-accent hover:text-white transition-all disabled:opacity-30 disabled:pointer-events-none"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={() => setHistoryPage(prev => Math.min(Math.ceil(estimation.history.length / itemsPerPage), prev + 1))}
                  disabled={historyPage === Math.ceil(estimation.history.length / itemsPerPage)}
                  className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-aura-accent hover:text-white transition-all disabled:opacity-30 disabled:pointer-events-none"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Hidden div for PDF rendering */}
      <div
        id="app-pdf-render-view"
        style={{
          position: "fixed",
          top: 0,
          left: '-9999px',
          width: '820px',
          background: 'white',
          opacity: 0,
          pointerEvents: 'none',
          zIndex: -9999,
        }}
      >
        {pdfSettings && estimation && (
          <QuotePDF 
            id="quote-pdf-view-admin-inner"
            request={{
              ...estimation,
              id: estimation.id || 'DEV-XXXXXX',
              createdAt: new Date().toISOString(),
              totalQuote: calculations.finalTotal,
              deliveryCost: estimation.deliveryCost,
              installationCost: estimation.laborCost,
              products: (estimation.products || []).map(p => ({
                ...p,
                productName: p.name || 'Produit',
                lineTotal: (p.quantity * p.unitPrice) * (1 - (p.discount || 0) / 100)
              }))
            } as any} 
            settings={pdfSettings} 
            selectedCity={null} 
            globalSettings={{ isDeliveryStepEnabled: true, isInstallationStepEnabled: true } as any} 
            allProducts={allProducts} 
            specs={allProductSpecs} 
          />
        )}
      </div>
    </div>
  );
}

function CustomSelect({
  value,
  onChange,
  options,
  placeholder,
  renderOption
}: {
  value: string;
  onChange: (val: string) => void;
  options: any[];
  placeholder: string;
  renderOption?: (opt: any) => React.ReactNode
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(o => (o.uid || o.id || o) === value);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="custom-select-trigger"
      >
        <div className="flex items-center gap-3 overflow-hidden">
          {selectedOption ? (
            renderOption ? renderOption(selectedOption) : <span className="uppercase text-xs font-bold truncate">{selectedOption.label || selectedOption.displayName || selectedOption.name || selectedOption}</span>
          ) : (
            <span className="text-aura-text-dim uppercase text-[10px] font-bold">{placeholder}</span>
          )}
        </div>
        <ChevronDown size={14} className={`text-aura-text-dim transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="absolute top-full left-0 right-0 z-[600] bg-[#1c1c1e] border border-aura-border rounded-xl shadow-2xl overflow-hidden mt-2 p-1"
          >
            <div className="max-h-64 overflow-y-auto custom-sidebar-scroll">
              {options.map((opt) => {
                const optId = opt.uid || opt.id || opt;
                return (
                  <div
                    key={optId}
                    onClick={() => {
                      onChange(optId);
                      setIsOpen(false);
                    }}
                    className={`custom-select-option rounded-lg ${value === optId ? 'bg-aura-accent/10 border-aura-accent/20' : 'border-transparent'}`}
                  >
                    {renderOption ? renderOption(opt) : <span className="uppercase text-[10px] font-bold">{opt.label || opt.displayName || opt.name || opt}</span>}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NumericControl({ value, onChange, label, unit = "" }: { value: number, onChange: (val: number) => void, label: string, unit?: string }) {
  return (
    <div className="space-y-1 flex-1 min-w-0">
      <span className="text-[9px] text-aura-text-dim uppercase font-bold tracking-widest">{label}</span>
      <div className="flex items-center bg-black/40 border border-aura-border rounded-xl p-1 group focus-within:border-aura-accent shadow-inner">
        <button
          onClick={() => onChange(Math.max(0, value - 1))}
          className="w-10 h-10 rounded-lg bg-white/5 hover:bg-aura-accent hover:text-white flex items-center justify-center transition-all text-aura-text-dim shadow-lg active:scale-95 border border-white/5"
        >
          <Minus size={14} />
        </button>
        <div className="flex-1 flex items-center justify-center gap-1.5 px-3">
          <input
            type="number"
            value={isNaN(value) ? 0 : value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="bg-transparent border-none p-0 focus:ring-0 text-center font-display font-black text-2xl w-full text-white appearance-none no-arrows"
          />
          {unit && <span className="text-base font-display font-black text-aura-accent min-w-[1ch]">{unit}</span>}
        </div>
        <button
          onClick={() => onChange(value + 1)}
          className="w-10 h-10 rounded-lg bg-white/5 hover:bg-aura-accent hover:text-white flex items-center justify-center transition-all text-aura-text-dim shadow-lg active:scale-95 border border-white/5"
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}

function TechnicalSpec({ icon, label, value, colorClass = "text-aura-accent", bgColorClass = "bg-aura-accent/10" }: { icon: React.ReactNode, label: string, value: string, colorClass?: string, bgColorClass?: string }) {
  return (
    <div className="flex items-center gap-4 group">
      <div className={`w-12 h-12 rounded-2xl ${bgColorClass} flex items-center justify-center ${colorClass} transition-all duration-500 group-hover:scale-110 shadow-lg border border-white/5`}>
        {icon}
      </div>
      <div className="flex flex-col">
        <div className="text-[10px] text-aura-text-dim uppercase font-black tracking-widest mb-0.5">{label}</div>
        <div className="text-sm font-display font-black text-white/90 uppercase tracking-tight">{value}</div>
      </div>
    </div>
  );
}
