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

  Share2,
  SendHorizontal,
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
  Cpu,
  Settings2,
  Activity,
  Layers,
  Smartphone,
  Tv,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { TransmitModal } from '@/application/admin/estimations/components/TransmitModal';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/firebase/config';
import { QuotePDF } from '@/app/admin/quote-pdf';
import { updateQuoteStatus, getPdfSettings, updateQuotePdfUrl } from '@/app/admin/actions';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import {

  Estimation,
  Product as LocalProduct,
  HistoryEntry,
  ClientInfo,
  PaymentStep
} from './types';
import { Product as GlobalProduct, ProductSpec } from '@/lib/types';
import { villes } from '@/lib/data/villes';
import { geminiService } from './services/geminiService';
import { cn } from '@/lib/utils';
import './details.css';

// Mock initial data as fallback
const FALLBACK_ESTIMATION: Estimation = {
  id: 'DEV-XXXXXX',
    client: {
      name: 'Loading...',
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
  autoEditMode?: boolean;
  onClose?: () => void;
  suppliers?: any[];
  onStatusChange?: (newStatus: string) => void;
  onSave?: (updatedQuote: any) => void;
}

export default function DetailsApp({ initialEstimation, allProducts = [], allProductSpecs = {}, startOpen = false, autoEditMode = false, onClose, suppliers = [], onStatusChange, onSave }: DetailsAppProps) {
  const { userProfile } = useUser();

  const firestore = useFirestore();
  const charsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'characteristics'), orderBy('name')) : null, [firestore]);
  const { data: characteristics } = useCollection<any>(charsQuery, { suppressPermissionError: true });

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'Ã©cran':
        return Monitor;
      case 'distance':
        return Eye;
      case 'puissance':
        return Zap;
      case 'luminositÃ©':
        return Sun;
      case 'pixel':
        return LayoutGrid;
      case 'rÃ©solution':
        return Maximize2;
      case 'paramÃ¨tres':
        return Settings;
      case 'activitÃ©':
        return Activity;
      case 'processeur':
        return Cpu;
      case 'couches':
        return Layers;
      case 'mobile':
        return Smartphone;
      case 'tÃ©lÃ©vision':
        return Tv;
      default:
        return Settings;
    }
  };


  const [estimation, setEstimation] = useState<Estimation>(FALLBACK_ESTIMATION);
  const [isDrawerOpen, setIsDrawerOpen] = useState(startOpen);
  const [isTransmitModalOpen, setIsTransmitModalOpen] = useState(false);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [isContractLoading, setIsContractLoading] = useState(false);
  const [pdfSettings, setPdfSettings] = useState<any>(null);

  // Interface Control States
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(true);
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

  const handleDownloadContract = () => {
    if (estimation.contractUrl) {
      window.open(estimation.contractUrl, '_blank');
    } else {
      const toast = document.createElement('div');
      toast.textContent = 'Le contrat signÃ© n\'est pas encore disponible.';
      toast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#f59e0b;color:white;padding:14px 28px;border-radius:16px;font-weight:700;font-size:14px;z-index:9999;box-shadow:0 8px 32px rgba(245,158,11,0.4)';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 4000);
    }
  };

  // Sync with initialEstimation if provided
  useEffect(() => {
    if (initialEstimation) {
      const idShort = initialEstimation.id?.slice(0, 8).toUpperCase() || 'N/A';
      const displayId = initialEstimation.number || `DEV-${idShort}`;

      // Handle both raw QuoteRequest and simplified Estimation objects
      const clientObj = typeof initialEstimation.client === 'object' ? initialEstimation.client : null;
      const clientName = clientObj?.companyName || clientObj?.name || (typeof initialEstimation.client === 'string' ? initialEstimation.client : '') || 'Unknown Client';
      const clientEmail = clientObj?.email || initialEstimation.email || '';
      const clientPhone = clientObj?.phone || initialEstimation.phone || '';
      const clientAddress = clientObj?.address || initialEstimation.address || '';
      const clientNotes = clientObj?.notes || initialEstimation.notes || '';
      const sitePhoto = clientObj?.sitePhoto || initialEstimation.sitePhoto || initialEstimation.supplierPhoto || initialEstimation.client?.sitePhoto;

      const taxRate = initialEstimation.taxRate ?? 0;
      const dbTotalClient = initialEstimation.totalClient || initialEstimation.totalQuote || 0;

      // Auto-detect if base unit prices are already tax-included
      const dbProducts = initialEstimation.products || [];
      const sumProductsHT = dbProducts.reduce((acc: number, p: any) => acc + (p.unitPrice || (p.lineTotal / (p.quantity || 1)) || 0) * (p.quantity || 1), 0);
      const deliveryCost = initialEstimation.deliveryCost || 0;
      const laborCost = initialEstimation.laborCost || initialEstimation.installationCost || 0;

      // If the displayed total (incl. tax) equals sum sur lines + fees, the lines are already tax-inclusive
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
          name: p.productName || p.name || 'Product',
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
              surface: `${((p.width || 0) * (p.height || 0)).toFixed(2)} mÂ²`,
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
          { id: 'h1', timestamp: new Date().toLocaleString('fr-FR'), action: 'Dossier opened', user: 'System', userId: 'sys', type: 'local' }
        ],
        payments: initialEstimation.payments || {
          totalPaid: initialEstimation.paidAmount || 0,
          steps: [
            { id: 'p1', label: 'Paiement unique', amount: initialEstimation.totalClient || initialEstimation.totalQuote || 0, status: 'pending' }
          ]
        },
        status: initialEstimation.status,
        pdfUrl: initialEstimation.pdfUrl,
        contractUrl: (initialEstimation as any).contractUrl,
        rentalPeriod: (initialEstimation as any).rentalPeriod || undefined,
        rentalStartTime: (initialEstimation as any).rentalStartTime || undefined,
        rentalEndTime: (initialEstimation as any).rentalEndTime || undefined,
      };
      setEstimation(mapped);
    }
  }, [initialEstimation]);

  useEffect(() => {
    if (startOpen) {
      setIsDrawerOpen(true);
    }
  }, [startOpen]);

  // Auto-enable edit mode if launched from the "Process" button
  useEffect(() => {
    if (autoEditMode) {
      setIsEditMode(true);
    }
  }, [autoEditMode]);

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
      const lineBaseTotal = (p.quantity || 0) * unitPrice;
      
      // Facteur Location
      let durationFactor = 1;
      if (p.transactionType === 'rental') {
        durationFactor = p.rentalDuration || 1;
      }
      
      const lineTotal = lineBaseTotal * durationFactor;
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
      user: userProfile?.displayName || 'System',
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
    addHistory(`Produit supprimÃ© : ${id}`);
  };

  const addProduct = () => {
    const lastProduct = estimation.products[estimation.products.length - 1];
    const newProduct: LocalProduct = {
      id: Math.random().toString(36).substr(2, 9),
      productId: lastProduct?.productId || '',
      name: lastProduct?.name || 'New LED Screen',
      quantity: 1,
      width: lastProduct?.width || 2.0,
      height: lastProduct?.height || 2.0,
      unitPrice: lastProduct?.unitPrice || 0,
      discount: 0,
      transactionType: lastProduct?.transactionType || 'sale',
      rentalUnit: lastProduct?.rentalUnit || 'day',
      rentalDuration: lastProduct?.rentalDuration || 1,
      specs: {
        pixelPitch: (lastProduct?.specs?.pixelPitch as string) || '2.5',
        environment: (lastProduct?.specs?.environment as string) || 'Indoor',
        projectType: (lastProduct?.specs?.projectType as string) || 'Vente'
      }
    };
    setEstimation(prev => ({
      ...prev,
      products: [...prev.products, newProduct]
    }));
    addHistory('Nouveau produit ajoutÃ© (dimensions hÃ©ritÃ©es)');
  };

  const formatCurrency = (val: number) => {
    if (isNaN(val) || val === undefined || val === null) return "0,00 â‚¬";
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(val);
  };

  const handleTranslate = async () => {
    setIsAiLoading(true);
    addHistory('Traduction chinoise demandÃ©e');
    const result = await geminiService.translateToChinese(estimation);
    setAiResult({ title: 'Technical Translation (Chinese)', content: result });
    setIsAiLoading(false);
  };

  const handleSummary = async () => {
    setIsAiLoading(true);
    addHistory('GÃ©nÃ©ration du rÃ©sumÃ© du dossier');
    const result = await geminiService.generateSummary(estimation);
    setAiResult({ title: 'Case Summary', content: result });
    setIsAiLoading(false);
  };

  const addPaymentStep = () => {
    const newStep: PaymentStep = {
      id: Math.random().toString(36).substr(2, 9),
      label: 'New payment',
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
    addHistory('Ã‰chÃ©ance de paiement ajoutÃ©e');
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
    addHistory('Ã‰chÃ©ance de paiement supprimÃ©e');
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
    addHistory('Statut du paiement mis Ã  jour');
  };

  const shareTranslatedText = (platform: 'whatsapp' | 'telegram', text: string) => {
    const encoded = encodeURIComponent(text);
    const url = platform === 'whatsapp'
      ? `https://wa.me/${estimation.client.phone.replace(/\s+/g, '')}?text=${encoded}`
      : `https://t.me/share/url?url=${window.location.href}&text=${encoded}`;
    window.open(url, '_blank');
    addHistory(`RÃ©sultat partagÃ© sur ${platform}`);
  };

  const shareEstimation = (platform: 'whatsapp' | 'telegram') => {
    const message = `Hello ${estimation.client.name}, here is your estimate ${estimation.id} for ${formatCurrency(calculations.totalTTC)}. Ref: ${estimation.id}\n\nDate: ${new Date().toLocaleString('fr-FR')}`;
    const encodedMessage = encodeURIComponent(message);
    const url = platform === 'whatsapp'
      ? `https://wa.me/${estimation.client.phone.replace(/\s+/g, '')}?text=${encodedMessage}`
      : `https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodedMessage}`;

    window.open(url, '_blank');
    addHistory(`Devis partagÃ© sur ${platform}`);
  };

  return (
    <div className="min-h-screen bg-transparent text-slate-900 flex flex-col font-sans selection:bg-aura-accent selection:text-white">
      <AnimatePresence>
        {isDrawerOpen && (
          <div className="fixed inset-0 z-[100] flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-[900px] bg-white flex flex-col overflow-hidden shadow-[-20px_0_80px_rgba(0,0,0,0.15)] border-l border-slate-200"
            >
              <div className="h-20 md:h-24 border-b border-slate-200 flex items-center justify-between px-4 md:px-8 bg-white/90 sticky top-0 z-20 backdrop-blur-xl">
                <div className="flex items-center gap-2 md:gap-4">
                  <button onClick={handleClose} className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center hover:bg-slate-50 border border-transparent hover:border-slate-200 rounded-xl text-slate-400 transition-all group shrink-0">
                    <ChevronLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
                  </button>
                  <div>
                    <h2 className="text-lg md:text-xl font-display font-bold text-slate-900 tracking-tight uppercase truncate max-w-[120px] md:max-w-none">
                      Estimation
                    </h2>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate">
                        FICHIER TECHNIQUE
                      </span>
                      {estimation.status && (
                        <div className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border ${estimation.status === 'returned' ? 'bg-orange-500/20 border-orange-500/30 text-orange-400' :
                            estimation.status === 'processed' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' :
                              estimation.status === 'in_progress' ? 'bg-cyan-500/20 border-cyan-500/30 text-cyan-400' :
                                estimation.status === 'sent' ? 'bg-blue-500/20 border-blue-500/30 text-blue-400' :
                                  estimation.status === 'archived' ? 'bg-slate-100 border-slate-200 text-slate-400' :
                                    'bg-amber-500/20 border-amber-500/30 text-amber-400'
                          }`}>
                          {estimation.status === 'returned' ? 'RetournÃ©' :
                            estimation.status === 'processed' ? 'TraitÃ©' :
                              estimation.status === 'in_progress' ? 'Fournisseur' :
                                estimation.status === 'sent' ? 'Livraison' :
                                  estimation.status === 'archived' ? 'ArchivÃ©' :
                                    estimation.status === 'trashed' ? 'Corbeille' :
                                      estimation.status === 'pending' ? 'En attente' : estimation.status}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Middle Indicator */}
                <div className="hidden md:flex items-center justify-center">
                  {initialEstimation?.transactionType === 'sale' ? (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 shadow-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-[0.25em]">Mode Vente</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-violet-50 border border-violet-100 text-violet-700 shadow-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-[0.25em]">Mode Location</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 md:gap-4 shrink-0">
                  <div className="flex items-center gap-1 md:gap-2">
                    {userProfile?.role !== 'supplier' && (
                      <button
                        onClick={() => setIsHistoryPanelOpen(true)}
                        className="h-9 md:h-11 px-3 md:px-4 rounded-xl bg-slate-100 border border-slate-200 text-[9px] md:text-[10px] font-bold uppercase tracking-widest hover:bg-slate-200 transition-all text-slate-900 flex items-center gap-1.5 md:gap-2"
                      >
                        <HistoryIcon size={14} className="text-aura-accent" /> <span className="hidden sm:inline">Historique</span>
                      </button>
                    )}

                    {(estimation.status === 'archived' || estimation.status === 'trashed') && userProfile?.role !== 'supplier' && (
                      <div className="flex items-center gap-2 pr-2 border-r border-slate-200">
                        <button
                          onClick={async () => {
                            if (!initialEstimation?.id) return;
                            await updateQuoteStatus(initialEstimation.id, { status: 'processed' });
                            setEstimation(prev => ({ ...prev, status: 'processed' }));
                                  addHistory('Dossier restaurÃ©');
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
                                alert("Veuillez utiliser le tableau de bord principal (onglet Corbeille) pour effectuer une suppression dÃ©finitive.");
                                handleClose();
                              }
                            }}
                            className="h-9 md:h-11 px-3 md:px-4 rounded-xl bg-red-600/20 border border-red-500/50 text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-red-600/40 transition-all text-red-500 flex items-center gap-1.5 md:gap-2"
                          >
                            <Trash2 size={14} /> <span className="hidden sm:inline">Suppr. Déf.</span>
                          </button>
                        )}
                      </div>
                    )}

                    {userProfile?.role !== 'supplier' && (
                      <div className="flex items-center gap-1 md:gap-2 border-l border-slate-200 pl-1 md:pl-2">
                        <button
                          onClick={() => setIsEditMode(!isEditMode)}
                          disabled={estimation.status === 'archived' || estimation.status === 'trashed'}
                          className={`h-9 md:h-11 px-3 md:px-4 rounded-xl border text-[9px] md:text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-1.5 md:gap-2 ${isEditMode ? 'bg-amber-500/10 border-amber-500/30 text-amber-600' : 'bg-slate-100 border-slate-200 text-slate-500 hover:text-slate-900'} ${(estimation.status === 'archived' || estimation.status === 'trashed') ? 'opacity-30 cursor-not-allowed' : ''}`}
                        >
                          <Pencil size={14} /> <span className="hidden sm:inline">{isEditMode ? 'Quitter' : 'Modifier'}</span>
                        </button>

                        <button
                          onClick={handleDownloadPdf}
                          disabled={isPdfLoading}
                          className="h-9 md:h-11 px-3 md:px-4 rounded-xl bg-slate-100 border border-slate-200 hover:bg-slate-200 transition-all text-slate-900 flex items-center justify-center disabled:opacity-50"
                        >
                          {isPdfLoading ? <Loader2 size={14} className="animate-spin text-aura-accent" /> : <Download size={14} className="text-aura-accent md:w-4 md:h-4" />}
                        </button>

                        {initialEstimation?.transactionType === 'rental' && (
                          <button
                            onClick={handleDownloadContract}
                            className="h-9 md:h-11 px-3 md:px-4 rounded-xl bg-slate-100 border border-slate-200 hover:bg-slate-200 transition-all text-slate-900 flex items-center gap-1.5 md:gap-2 text-[9px] md:text-[10px] font-bold uppercase tracking-widest"
                          >
                            <Download size={14} className="md:w-4 md:h-4" />
                            <span className="hidden sm:inline">Contrat</span>
                          </button>
                        )}
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

                <section className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-aura-accent flex items-center gap-2">
                    <User size={14} /> CASE INFORMATION
                  </h3>
                      <div className="bg-slate-50 border border-slate-200 rounded-[2rem] p-6 grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                        <div className="space-y-1">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Nom du client</span>
                          <input
                            type="text"
                            disabled={!isEditMode}
                            value={estimation.client.name}
                            onChange={(e) => updateClient('name', e.target.value)}
                            className="neon-input w-full py-2 bg-slate-50 border-slate-200 text-slate-900 font-display font-black uppercase"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Devis N°</span>
                          <input
                            type="text"
                            disabled={!isEditMode}
                            value={estimation.id || ''}
                            onChange={() => { }}
                            className="neon-input w-full py-2 bg-slate-50 border-slate-200 text-slate-900 font-mono font-bold uppercase cursor-not-allowed"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Email</span>
                          <input
                            type="text"
                            disabled={!isEditMode}
                            value={estimation.client.email}
                            onChange={(e) => updateClient('email', e.target.value)}
                            className="neon-input w-full py-2 bg-slate-50 border-slate-200 text-slate-900 font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Téléphone</span>
                          <input
                            type="text"
                            disabled={!isEditMode}
                            value={estimation.client.phone}
                            onChange={(e) => updateClient('phone', e.target.value)}
                            className="neon-input w-full py-2 bg-slate-50 border-slate-200 text-slate-900 font-mono font-bold"
                          />
                        </div>
                        <div className="md:col-span-2 space-y-1">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Adresse de livraison</span>
                          <input
                            type="text"
                            disabled={!isEditMode}
                            value={estimation.client.address || ''}
                            onChange={(e) => updateClient('address', e.target.value)}
                            className="neon-input w-full py-2 bg-slate-50 border-slate-200 text-slate-900 uppercase"
                          />
                        </div>

                        <div className="md:col-span-2 pt-6 mt-4 border-t border-slate-200 space-y-4">
                          <div className="flex flex-wrap gap-6 bg-slate-100 p-4 rounded-xl border border-slate-200">
                            <label className="flex items-center gap-3 cursor-pointer group">
                              <div className="relative inline-flex items-center h-5 w-10">
                                <input
                                  type="checkbox"
                                  className="sr-only peer"
                                  checked={estimation.hideCommentsFromSupplier}
                                  onChange={() => setEstimation({ ...estimation, hideCommentsFromSupplier: !estimation.hideCommentsFromSupplier })}
                                />
                                <div className="w-10 h-5 bg-slate-200 rounded-full peer peer-checked:bg-aura-accent after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5 transition-all duration-300"></div>
                              </div>
                              <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 group-hover:text-slate-900 transition-colors uppercase">Masquer les notes du fournisseur</span>
                            </label>

                            <label className="flex items-center gap-3 cursor-pointer group">
                              <div className="relative inline-flex items-center h-5 w-10">
                                <input
                                  type="checkbox"
                                  className="sr-only peer"
                                  checked={estimation.hidePhotoFromSupplier}
                                  onChange={() => setEstimation({ ...estimation, hidePhotoFromSupplier: !estimation.hidePhotoFromSupplier })}
                                />
                                <div className="w-10 h-5 bg-slate-200 rounded-full peer peer-checked:bg-aura-accent after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5 transition-all duration-300"></div>
                              </div>
                              <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 group-hover:text-slate-900 transition-colors uppercase">Masquer la photo du fournisseur</span>
                            </label>
                          </div>
                      </div>
                    </div>
                  </section>


                <AnimatePresence>
                  {!estimation.hidePhotoFromSupplier && (
                    <motion.section
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-4 overflow-hidden"
                    >
                      <h3 className="text-xs font-bold uppercase tracking-widest text-aura-accent flex items-center gap-2">
                        <ImageIcon size={14} /> SITE PHOTO
                      </h3>
                      <div className="bg-slate-50 border border-slate-200 rounded-[2rem] p-6 relative group">
                        <div className="relative h-[300px] rounded-2xl overflow-hidden border border-slate-200 group/img bg-slate-100">
                          {estimation.client.sitePhoto ? (
                            <>
                              <img
                                src={estimation.client.sitePhoto}
                                alt="Photo du site"
                                className="w-full h-full object-cover transition-all group-hover/img:scale-105 cursor-pointer"
                                onClick={() => setFullscreenPhoto(estimation.client.sitePhoto!)}
                              />
                              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover/img:opacity-100 transition-opacity">
                                <button
                                  onClick={() => setFullscreenPhoto(estimation.client.sitePhoto!)}
                                  className="w-10 h-10 flex items-center justify-center bg-white/90 backdrop-blur rounded-xl text-slate-900 border border-slate-200 hover:bg-aura-accent hover:text-white transition-all hover:scale-110 shadow-xl"
                                >
                                  <Maximize2 size={18} />
                                </button>
                                {isEditMode && (
                                  <button
                                    onClick={() => {
                                      setEstimation({ ...estimation, client: { ...estimation.client, sitePhoto: undefined } });
                                      addHistory("Photo du site supprimÃ©e");
                                    }}
                                    className="w-10 h-10 flex items-center justify-center bg-red-500/10 backdrop-blur rounded-xl text-red-600 border border-red-200 hover:bg-red-600 hover:text-white transition-all hover:scale-110 shadow-xl"
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                )}
                              </div>
                            </>
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs gap-3">
                              <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center border border-dashed border-slate-200">
                                <ImageIcon size={32} />
                              </div>
                              <span className="font-bold uppercase tracking-widest opacity-50 text-[10px]">No visuals available</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.section>
                  )}
                </AnimatePresence>

                {(userProfile?.role !== 'supplier' || !estimation.hideCommentsFromSupplier) && estimation.client.notes && (
                    <section className="p-6 bg-slate-50 border border-slate-200 rounded-[2rem]">
                      <h4 className="text-[10px] font-bold text-aura-accent uppercase mb-2 flex items-center gap-2">
                        <StickyNote size={12} /> NOTES DU CLIENT
                      </h4>
                      <p className="text-xs text-slate-700 italic leading-relaxed whitespace-pre-wrap mb-4">{estimation.client.notes}</p>
                      {isEditMode && (
                        <div className={`${estimation.client.notes ? 'mt-4 pt-4 border-t border-slate-200' : ''}`}>
                          <textarea
                            value={estimation.client.notes || ''}
                            onChange={(e) => updateClient('notes', e.target.value)}
                            className="neon-input w-full bg-slate-100 p-4 text-xs resize-none text-slate-900"
                            rows={4}
                            placeholder="Écrivez vos notes ici..."
                          />
                        </div>
                      )}
                    </section>
                  )}

                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-aura-accent flex items-center gap-2">
                        <Box size={14} /> Lignes de Produits
                      </h3>
                      {estimation.products.length > 0 && (
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          {estimation.products.length} {estimation.products.length > 1 ? 'Produits' : 'Produit'}
                        </span>
                      )}
                    </div>
                    {isEditMode && (
                      <button onClick={addProduct} className="h-10 px-6 rounded-xl bg-aura-accent/10 border border-aura-accent/30 text-[10px] font-bold text-aura-accent flex items-center gap-2 hover:bg-aura-accent hover:text-white transition-all shadow-lg active:scale-95">
                        <Plus size={14} /> Add Line
                      </button>
                    )}
                  </div>

                  <div className="space-y-6">
                    {estimation.products.map((p, index) => (
                      <div key={p.id} className="bg-slate-50 border border-slate-200 rounded-[2.5rem] overflow-hidden transition-all duration-300 hover:border-aura-accent/30 group relative">
                        {/* Line Number Badge */}
                        <div className="absolute top-0 right-0 p-8 pointer-events-none opacity-5 group-hover:opacity-10 transition-opacity">
                          <span className="text-7xl font-display font-black text-slate-900 tracking-tighter">
                            {(index + 1).toString().padStart(2, '0')}
                          </span>
                        </div>

                        <div className="p-8">
                          <div className="flex items-center justify-between gap-4 mb-8">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="px-1.5 py-0.5 rounded bg-aura-accent text-white text-[8px] font-black uppercase tracking-widest">
                                  Item {(index + 1).toString().padStart(2, '0')}
                                </span>
                                <span className="text-[9px] text-slate-400 font-black uppercase tracking-[0.3em]">Produit / Désignation</span>
                              </div>
                              {isEditMode ? (
                                <CustomSelect
                                  value={p.productId || ''}
                                  placeholder="Sélectionner un produit..."
                                  options={allProducts
                                    .filter(prod => {
                                      if (prod.id === p.productId) return true;
                                      const isRentalMode = initialEstimation?.transactionType === 'rental';
                                      if (isRentalMode) {
                                        return prod.availableFor?.includes('rental');
                                      } else {
                                        return prod.availableFor?.includes('sale') || !prod.availableFor || prod.availableFor.length === 0;
                                      }
                                    })
                                    .map(prod => ({
                                      id: prod.id,
                                      label: prod.name,
                                      image: prod.image || (prod as any).mainImage
                                    }))}
                                  onChange={(val) => {
                                    const selectedProd = allProducts.find(prod => prod.id === val);
                                    if (selectedProd) {
                                      // Build specs from allProductSpecs first, then fallback to product.specs
                                      const catalogSpecs = allProductSpecs[selectedProd.id];
                                      const specsFromCatalog = catalogSpecs
                                        ? Object.fromEntries(catalogSpecs.map(s => [s.key, s.value]))
                                        : selectedProd.specs || {};

                                      // Enrich with product-level fields
                                      const enrichedSpecs = {
                                        ...specsFromCatalog,
                                        pixelPitch: selectedProd.pitch || specsFromCatalog.pixelPitch || 'N/A',
                                        environment: selectedProd.environment || specsFromCatalog.environment || 'N/A',
                                        visionDistance: selectedProd.distance || specsFromCatalog.visionDistance || 'N/A',
                                        projectType: specsFromCatalog.projectType || 'Vente',
                                      };

                                      // Determine best price: pricePerTile > salePricePerSqM > 0
                                      const unitPrice = selectedProd.pricePerTile || selectedProd.salePricePerSqM || 0;

                                      const newProducts = estimation.products.map(prod => prod.id === p.id ? {
                                        ...prod,
                                        productId: selectedProd.id,
                                        name: selectedProd.name,
                                        unitPrice,
                                        tileWidth: selectedProd.tileWidth || prod.tileWidth || 0,
                                        tileHeight: selectedProd.tileHeight || prod.tileHeight || 0,
                                        pricePerTile: selectedProd.pricePerTile || prod.pricePerTile || 0,
                                        dimensionsEnabled: selectedProd.hasDimensions ?? prod.dimensionsEnabled,
                                        specs: enrichedSpecs,
                                      } : prod);
                                      setEstimation({ ...estimation, products: newProducts });
                                      addHistory(`Produit changÃ© : ${selectedProd.name}`);
                                    }
                                  }}
                                  renderOption={(opt) => (
                                    <div className="flex items-center gap-4 py-1">
                                      <div className="w-12 h-12 rounded-lg bg-slate-50 overflow-hidden border border-slate-200 shrink-0 shadow-sm">
                                        {opt.image ? (
                                          <img src={opt.image} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                          <div className="w-full h-full flex items-center justify-center text-slate-400"><ImageIcon size={16} /></div>
                                        )}
                                      </div>
                                      <span className="font-display font-black text-xs uppercase tracking-tight text-slate-900">{opt.label}</span>
                                    </div>
                                  )}
                                />
                              ) : (
                                <div className="flex items-center gap-4 group">
                                  {(() => {
                                    const prodInfo = allProducts.find(pr => pr.id === (p.productId || p.id));
                                    const img = prodInfo?.image || (prodInfo as any)?.mainImage;
                                    return (
                                      <>
                                        <div className="w-16 h-16 rounded-2xl bg-slate-100 overflow-hidden border border-slate-200 shadow-sm transition-transform duration-500 group-hover:scale-110">
                                          {img ? (
                                            <img src={img} alt="" className="w-full h-full object-cover" />
                                          ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-400"><ImageIcon size={20} /></div>
                                          )}
                                        </div>
                                        <div className="text-2xl md:text-3xl font-display font-black text-slate-900 tracking-tighter uppercase leading-none">{p.name}</div>
                                      </>
                                    );
                                  })()}
                                </div>
                              )}
                              
                              {/* SALE / RENTAL TOGGLE â€” hidden in Sale mode, shown only in Rental mode */}
                              {isEditMode && initialEstimation?.transactionType === 'rental' && (
                                <div className="mt-4 flex items-center gap-2">
                                  <div className="flex p-1 bg-slate-100/80 border border-slate-200/80 rounded-xl backdrop-blur-sm shadow-sm">
                                    <button
                                      onClick={() => {
                                        const newProducts = estimation.products.map(prod => prod.id === p.id ? { 
                                          ...prod, 
                                          transactionType: 'sale',
                                          specs: { ...prod.specs, projectType: 'Vente' }
                                        } : prod);
                                        setEstimation({ ...estimation, products: newProducts as any });
                                      }}
                                      className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-200 ${p.transactionType !== 'rental' ? 'bg-black text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                      Vente
                                    </button>
                                    <button
                                      onClick={() => {
                                        const newProducts = estimation.products.map(prod => prod.id === p.id ? { 
                                          ...prod, 
                                          transactionType: 'rental',
                                          specs: { ...prod.specs, projectType: 'Location' }
                                        } : prod);
                                        setEstimation({ ...estimation, products: newProducts as any });
                                      }}
                                      className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-200 ${p.transactionType === 'rental' ? 'bg-black text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                      Location
                                    </button>
                                  </div>
                                </div>
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

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
                            {isEditMode && (
                              <>
                                <NumericControl
                                  label="Largeur (m)"
                                  value={p.width || 0}
                                  unit="m"
                                  onChange={(val) => {
                                    const newProducts = estimation.products.map(prod => prod.id === p.id ? { ...prod, width: val } : prod);
                                    setEstimation({ ...estimation, products: newProducts });
                                  }}
                                />
                                <NumericControl
                                  label="Hauteur (m)"
                                  value={p.height || 0}
                                  unit="m"
                                  onChange={(val) => {
                                    const newProducts = estimation.products.map(prod => prod.id === p.id ? { ...prod, height: val } : prod);
                                    setEstimation({ ...estimation, products: newProducts });
                                  }}
                                />
                              </>
                            )}
                            <NumericControl
                              label="Quantité"
                              value={p.quantity}
                              onChange={(val) => {
                                const newProducts = estimation.products.map(prod => prod.id === p.id ? { ...prod, quantity: val } : prod);
                                setEstimation({ ...estimation, products: newProducts });
                              }}
                            />
                            {userProfile?.role !== 'supplier' && (
                              <NumericControl
                                label="Unit Price (â‚¬)"
                                unit="â‚¬"
                                value={p.unitPrice}
                                onChange={(val) => {
                                  const newProducts = estimation.products.map(prod => prod.id === p.id ? { ...prod, unitPrice: val } : prod);
                                  setEstimation({ ...estimation, products: newProducts });
                                }}
                              />
                            )}
                          </div>

                          {/* RENTAL OPTIONS â€” shown only in Rental mode */}
                          <AnimatePresence>
                            {isEditMode && initialEstimation?.transactionType === 'rental' && p.transactionType === 'rental' && (
                              <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-6 pt-6 border-t border-white/5 space-y-4 overflow-hidden"
                              >
                                <div className="flex items-center gap-4">
                                   <div className="flex p-1 bg-black/5 border border-black/10 rounded-xl">
                                     <button
                                       onClick={() => {
                                         const newProducts = estimation.products.map(prod => prod.id === p.id ? { ...prod, rentalUnit: 'day' } : prod);
                                         setEstimation({ ...estimation, products: newProducts as any });
                                       }}
                                       className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-200 ${p.rentalUnit !== 'hour' ? 'bg-black text-white shadow-md' : 'text-slate-500 hover:text-slate-900'}`}
                                    >
                                      Jour
                                    </button>
                                    <button
                                      onClick={() => {
                                        const newProducts = estimation.products.map(prod => prod.id === p.id ? { ...prod, rentalUnit: 'hour' } : prod);
                                        setEstimation({ ...estimation, products: newProducts as any });
                                      }}
                                      className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-200 ${p.rentalUnit === 'hour' ? 'bg-black text-white shadow-md' : 'text-slate-500 hover:text-slate-900'}`}
                                      >
                                        Jour spÃ©cifique (Heures)
                                     </button>
                                   </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-end">
                                  {p.rentalUnit !== 'hour' ? (
                                    <>
                                      <div className="space-y-1">
                                          <span className="text-[9px] text-aura-text-dim uppercase font-bold tracking-widest">Du</span>
                                        <input 
                                          type="date"
                                          className="neon-input w-full py-2 bg-white font-mono text-xs text-slate-900"
                                          min={new Date().toISOString().split('T')[0]}
                                          value={p.rentalPeriod?.from ? new Date(p.rentalPeriod.from).toISOString().split('T')[0] : ''}
                                          onChange={(e) => {
                                            const from = new Date(e.target.value);
                                            const to = p.rentalPeriod?.to ? new Date(p.rentalPeriod.to) : from;
                                            const diff = Math.max(1, Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1);
                                            const newProducts = estimation.products.map(prod => prod.id === p.id ? { 
                                              ...prod, 
                                              rentalPeriod: { from, to },
                                              rentalDuration: diff
                                            } : prod);
                                            setEstimation({ ...estimation, products: newProducts as any });
                                          }}
                                        />
                                      </div>
                                      <div className="space-y-1">
                                          <span className="text-[9px] text-aura-text-dim uppercase font-bold tracking-widest">Au</span>
                                        <input 
                                          type="date"
                                          className="neon-input w-full py-2 bg-white font-mono text-xs text-slate-900"
                                          min={new Date().toISOString().split('T')[0]}
                                          value={p.rentalPeriod?.to ? new Date(p.rentalPeriod.to).toISOString().split('T')[0] : ''}
                                          onChange={(e) => {
                                            const to = new Date(e.target.value);
                                            const from = p.rentalPeriod?.from ? new Date(p.rentalPeriod.from) : to;
                                            const diff = Math.max(1, Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1);
                                            const newProducts = estimation.products.map(prod => prod.id === p.id ? { 
                                              ...prod, 
                                              rentalPeriod: { from, to },
                                              rentalDuration: diff
                                            } : prod);
                                            setEstimation({ ...estimation, products: newProducts as any });
                                          }}
                                        />
                                      </div>
                                      <NumericControl
                                        label="DurÃ©e (Jours)"
                                        value={p.rentalDuration || 1}
                                        onChange={(val) => {
                                          const newProducts = estimation.products.map(prod => prod.id === p.id ? { ...prod, rentalDuration: Math.max(1, val) } : prod);
                                          setEstimation({ ...estimation, products: newProducts });
                                        }}
                                      />
                                    </>
                                  ) : (
                                    <>
                                      <div className="space-y-1">
                                          <span className="text-[9px] text-aura-text-dim uppercase font-bold tracking-widest">Le</span>
                                        <input 
                                          type="date"
                                          className="neon-input w-full py-2 bg-white font-mono text-xs text-slate-900"
                                          min={new Date().toISOString().split('T')[0]}
                                          value={p.rentalDate ? new Date(p.rentalDate).toISOString().split('T')[0] : ''}
                                          onChange={(e) => {
                                            const date = new Date(e.target.value);
                                            const newProducts = estimation.products.map(prod => prod.id === p.id ? { ...prod, rentalDate: date } : prod);
                                            setEstimation({ ...estimation, products: newProducts as any });
                                          }}
                                        />
                                      </div>
                                      <div className="flex gap-2">
                                        <div className="space-y-1 flex-1">
                                          <span className="text-[9px] text-aura-text-dim uppercase font-bold tracking-widest">DÃ©but</span>
                                          <input 
                                            type="time"
                                            className="neon-input w-full py-2 bg-white font-mono text-xs text-slate-900"
                                            value={p.rentalStartTime || '09:00'}
                                            onChange={(e) => {
                                              const newProducts = estimation.products.map(prod => prod.id === p.id ? { ...prod, rentalStartTime: e.target.value } : prod);
                                              setEstimation({ ...estimation, products: newProducts as any });
                                            }}
                                          />
                                        </div>
                                        <div className="space-y-1 flex-1">
                                          <span className="text-[9px] text-aura-text-dim uppercase font-bold tracking-widest">Fin</span>
                                          <input 
                                            type="time"
                                            className="neon-input w-full py-2 bg-white font-mono text-xs text-slate-900"
                                            value={p.rentalEndTime || '18:00'}
                                            onChange={(e) => {
                                              const newProducts = estimation.products.map(prod => prod.id === p.id ? { ...prod, rentalEndTime: e.target.value } : prod);
                                              setEstimation({ ...estimation, products: newProducts as any });
                                            }}
                                          />
                                        </div>
                                      </div>
                                      <NumericControl
                                        label="DurÃ©e (Heures)"
                                        value={p.rentalDuration || 1}
                                        onChange={(val) => {
                                          const newProducts = estimation.products.map(prod => prod.id === p.id ? { ...prod, rentalDuration: Math.max(1, val) } : prod);
                                          setEstimation({ ...estimation, products: newProducts });
                                        }}
                                      />
                                    </>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          <div className="mt-8 pt-6 border-t border-slate-200 flex items-end justify-between">
                            <div className="space-y-1">
                              <span className="text-[13px] text-slate-400 font-bold uppercase tracking-widest block">Référence Article</span>
                              <div className="text-sm font-display font-black text-slate-900 uppercase tracking-tight">{p.productId || 'N/A'}</div>
                            </div>
                            {userProfile?.role !== 'supplier' && (
                              <div className="text-right">
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block mb-1">Total pour cette ligne</span>
                                <div className="flex items-center gap-3 justify-end">
                                  {(p.discount || 0) > 0 && (
                                    <span className="text-sm text-red-500/40 line-through font-mono">
                                      {formatCurrency(p.quantity * p.unitPrice)}
                                    </span>
                                  )}
                                  <span className="text-3xl font-display font-black text-slate-900 tracking-tighter">
                                    {formatCurrency((p.quantity * p.unitPrice) * (1 - (p.discount || 0) / 100))}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="px-8 pb-8">
                          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                            <div className="p-8 pb-0 flex items-center justify-between mb-8">
                              <h4 className="text-[11px] font-black text-aura-accent uppercase tracking-[0.3em] flex items-center gap-3">
                                <Settings size={16} /> Technical Specifications
                              </h4>
                              <div className="w-2.5 h-2.5 rounded-full bg-aura-success shadow-[0_0_12px_rgba(34,197,94,0.6)]" />
                            </div>
                            <div className="p-8 pt-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-x-12 gap-y-8">
                              {(() => {
                                  const getSpecValue = (searchKeys: string[], fallback: string) => {
                                    let val = null;
                                    const isValid = (v: any) => v && v !== 'N/A' && v !== 'n/a' && v !== 'null' && v !== 'undefined' && typeof v !== 'object';

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
                                const environment = getSpecValue(['environment', 'environnement'], "IntÃ©rieur");
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
                                const isOutdoor = environment.toLowerCase().includes('exterieur') || environment.toLowerCase().includes('extÃ©rieur');
                                const powerMax = area * (isOutdoor ? 0.8 : 0.6);
                                const powerAvg = powerMax * 0.35;
                                const amps = Math.ceil((powerMax * 1000) / 230 / 3);

                                const baseSpecs = [
                                  { label: "SURFACE TOTALE", value: `${area.toFixed(2)} mÂ²`, icon: <Maximize2 size={16} />, color: "text-blue-400", bgColor: "bg-blue-400/10" },
                                  { label: "RÃ‰SOLUTION", value: `${resX} x ${resY} pixels`, icon: <Monitor size={16} />, color: "text-violet-400", bgColor: "bg-violet-400/10" },
                                  { label: "NOMBRE DE MODULES LED", value: modules.toString(), icon: <Cpu size={16} />, color: "text-fuchsia-400", bgColor: "bg-fuchsia-400/10" },
                                  { label: "PUISSANCE MAX", value: `${powerMax.toFixed(1)} kW`, icon: <Zap size={16} />, color: "text-emerald-400", bgColor: "bg-emerald-400/10" },
                                  { label: "PUISSANCE MOY", value: `${powerAvg.toFixed(1)} kW`, icon: <Zap size={16} />, color: "text-sky-400", bgColor: "bg-sky-400/10" },
                                  { label: "DISJONCTEUR RECOMMANDÃ‰", value: `${amps}A 3-Pole`, icon: <Zap size={16} />, color: "text-orange-400", bgColor: "bg-orange-400/10" },
                                  { label: "TYPE DE PROJET", value: projectType, icon: <Truck size={16} />, color: "text-orange-400", bgColor: "bg-orange-400/10" },
                                  { label: "ENVIRONNEMENT", value: environment, icon: <Sun size={16} />, color: "text-teal-400", bgColor: "bg-teal-400/10" },
                                  { label: "DISTANCE DE VISUALISATION", value: visionDistance, icon: <Eye size={16} />, color: "text-cyan-400", bgColor: "bg-cyan-400/10" },
                                  { label: "PAS DE PIXEL", value: pixelPitchStr, icon: <LayoutGrid size={16} />, color: "text-red-400", bgColor: "bg-red-400/10" },
                                ];

                                const globalProduct = allProducts?.find(prod => prod.id === (p.productId || p.id));
                                const customSpecs: any[] = [];
                                if (globalProduct && (globalProduct as any).selectedChars && characteristics) {
                                  const skippedNames = ['pixel pitch', 'distance de visionnage', 'puissance maximale', 'environnement'];
                                  (globalProduct as any).selectedChars.forEach((sc: any) => {
                                    const charDef = characteristics.find(c => String(c.id) === String(sc.id));
                                    if (charDef && !skippedNames.includes(charDef.name?.toLowerCase())) {
                                      const IconComponent = getIconComponent(charDef.iconName) || Settings;
                                      customSpecs.push({
                                        label: charDef.name.toUpperCase(),
                                        value: sc.value || 'N/A',
                                        icon: <IconComponent size={16} />,
                                        color: charDef.color || "text-slate-400",
                                        bgColor: (charDef.color || "text-slate-400").replace('text-', 'bg-') + "/10"
                                      });
                                    }
                                  });
                                }

                                return [...baseSpecs, ...customSpecs].map((spec, idx) => (
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

                </section>

                <AnimatePresence>
                  {userProfile?.role !== 'supplier' && (
                    <motion.section
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-4"
                    >
                      <h3 className="text-xs font-bold uppercase tracking-widest text-aura-accent flex items-center gap-2 uppercase">
                        <Truck size={14} /> LOGISTIQUE & SERVICES
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-slate-50 border border-slate-200 p-6 rounded-[2rem] space-y-4">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-aura-accent/10 flex items-center justify-center text-aura-accent"><Truck size={20} /></div>
                              <div>
                              <div className="text-xs font-bold uppercase text-slate-900">LIVRAISON</div>
                              <div className="text-[10px] text-slate-400 uppercase">Ville : <b className="text-slate-900">{estimation.deliveryCity || 'Non spÃ©cifiÃ©e'}</b></div>
                              </div>
                            </div>
                            <span className="text-lg font-bold font-mono text-aura-accent">{formatCurrency(calculations.deliveryTotal)}</span>
                          </div>
                          {isEditMode && (
                            <div className="space-y-6 pt-6 border-t border-slate-200">
                              <div className="space-y-1.5 flex-1 min-w-0">
                                <span className="text-[9px] text-slate-400 uppercase font-bold tracking-widest">Ville de destination</span>
                                <CustomSelect
                                  placeholder="Choisir une ville..."
                                  value={estimation.deliveryCity || ''}
                                  onChange={(val) => setEstimation({ ...estimation, deliveryCity: val })}
                                  options={villes}
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-4">
<NumericControl
                                    label="Prix (â‚¬)"
                                    unit="â‚¬"
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

                        <div className="bg-slate-50 border border-slate-200 p-6 rounded-[2rem] space-y-4">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-aura-accent/10 flex items-center justify-center text-aura-accent"><Wrench size={20} /></div>
                              <div>
                              <div className="text-xs font-bold uppercase text-slate-900">Main d'Å“uvre</div>
                              <div className="text-slate-400 uppercase">Installation experte</div>
                              </div>
                            </div>
                            <span className="text-lg font-bold font-mono text-aura-accent">{formatCurrency(calculations.laborTotal)}</span>
                          </div>
                          {isEditMode && (
                            <div className="space-y-4 pt-4 border-t border-slate-200">
                              <div className="py-4 border-b border-slate-200 mb-2">
                                <div className="text-[10px] text-slate-400 uppercase font-black tracking-[0.2em] leading-relaxed">
                                  Pour une surface totale de <span className="text-aura-accent">{calculations.totalArea.toFixed(2)} mÂ²</span>
                                </div>
                                <div className="text-[10px] text-slate-400 uppercase font-black tracking-[0.2em] leading-relaxed">
                                  votre projet nécessite <span className="text-aura-accent">{calculations.techniciansCount}</span> technicien(s).
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <NumericControl
                                  label="Prix (â‚¬)"
                                  unit="â‚¬"
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

                      {/* RENTAL PERIOD CARD - visible only in Rental mode */}
                      {initialEstimation?.transactionType === 'rental' && (
                        <div className="bg-violet-50 border border-violet-200 p-6 rounded-[2rem] space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                              <Calendar size={20} className="text-violet-600" />
                            </div>
                            <div>
                              <div className="text-xs font-bold uppercase text-slate-900">PÃ©riode de Location</div>
                              <div className="text-[10px] text-slate-400 uppercase">Dates &amp; Horaires</div>
                            </div>
                          </div>

                          {!isEditMode ? (
                            <div className="grid grid-cols-2 gap-3">
                              <div className="bg-white border border-violet-100 rounded-2xl p-3 space-y-0.5">
                                <div className="text-[9px] text-violet-400 uppercase font-bold tracking-widest">DÃ©but</div>
                                <div className="text-sm font-bold text-slate-900">
                                  {estimation.rentalPeriod?.from
                                    ? new Date(estimation.rentalPeriod.from).toLocaleDateString('fr-FR')
                                    : 'â€”'}
                                </div>
                                <div className="text-[10px] text-slate-500">{estimation.rentalStartTime || 'â€”'}</div>
                              </div>
                              <div className="bg-white border border-violet-100 rounded-2xl p-3 space-y-0.5">
                                <div className="text-[9px] text-violet-400 uppercase font-bold tracking-widest">Fin</div>
                                <div className="text-sm font-bold text-slate-900">
                                  {estimation.rentalPeriod?.to
                                    ? new Date(estimation.rentalPeriod.to).toLocaleDateString('fr-FR')
                                    : 'â€”'}
                                </div>
                                <div className="text-[10px] text-slate-500">{estimation.rentalEndTime || 'â€”'}</div>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-4 pt-2 border-t border-violet-200">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                  <label className="text-[9px] text-violet-500 uppercase font-bold tracking-widest">Date de dÃ©but</label>
                                  <input
                                    type="date"
                                    min={new Date().toISOString().split('T')[0]}
                                    value={estimation.rentalPeriod?.from ? new Date(estimation.rentalPeriod.from).toISOString().split('T')[0] : ''}
                                    onChange={(e) => {
                                      const from = new Date(e.target.value);
                                      const to = estimation.rentalPeriod?.to ? new Date(estimation.rentalPeriod.to) : from;
                                      setEstimation({ ...estimation, rentalPeriod: { from, to } });
                                    }}
                                    className="w-full px-4 py-3 bg-white border border-violet-200 rounded-2xl text-slate-900 text-sm focus:border-violet-400 focus:outline-none transition-all [color-scheme:light]"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[9px] text-violet-500 uppercase font-bold tracking-widest">Date de fin</label>
                                  <input
                                    type="date"
                                    min={new Date().toISOString().split('T')[0]}
                                    value={estimation.rentalPeriod?.to ? new Date(estimation.rentalPeriod.to).toISOString().split('T')[0] : ''}
                                    onChange={(e) => {
                                      const to = new Date(e.target.value);
                                      const from = estimation.rentalPeriod?.from ? new Date(estimation.rentalPeriod.from) : to;
                                      setEstimation({ ...estimation, rentalPeriod: { from, to } });
                                    }}
                                    className="w-full px-4 py-3 bg-white border border-violet-200 rounded-2xl text-slate-900 text-sm focus:border-violet-400 focus:outline-none transition-all [color-scheme:light]"
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                  <label className="text-[9px] text-violet-500 uppercase font-bold tracking-widest">Heure de dÃ©but</label>
                                  <input
                                    type="time"
                                    value={estimation.rentalStartTime || '08:00'}
                                    onChange={(e) => setEstimation({ ...estimation, rentalStartTime: e.target.value })}
                                    className="w-full px-4 py-3 bg-white border border-violet-200 rounded-2xl text-slate-900 text-sm focus:border-violet-400 focus:outline-none transition-all [color-scheme:light]"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[9px] text-violet-500 uppercase font-bold tracking-widest">Heure de fin</label>
                                  <input
                                    type="time"
                                    value={estimation.rentalEndTime || '18:00'}
                                    onChange={(e) => setEstimation({ ...estimation, rentalEndTime: e.target.value })}
                                    className="w-full px-4 py-3 bg-white border border-violet-200 rounded-2xl text-slate-900 text-sm focus:border-violet-400 focus:outline-none transition-all [color-scheme:light]"
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                    </motion.section>
                  )}

                </AnimatePresence>
              </div>

              {/* FIXED FOOTER (OUTSIDE SCROLL AREA) */}
              <AnimatePresence>
                {userProfile?.role !== 'supplier' && (
                  <motion.div
                    key="aura-footer"
                    initial={{ y: 80, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="aura-footer-fixed hidden md:block relative shrink-0"
                  >
                    {/* Toggle Pill â€” floating on the border-top divider line, always visible */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50">
                      <button
                        onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
                        className="group flex items-center gap-3 px-5 py-2.5 rounded-full border border-slate-200 bg-white backdrop-blur-xl shadow-lg hover:shadow-xl hover:border-slate-300 transition-all duration-500 active:scale-95"
                      >
                        <motion.div
                          animate={{ rotate: isSummaryExpanded ? 180 : 0 }}
                          transition={{ duration: 0.4, ease: 'easeInOut' }}
                        >
                          <ChevronDown size={14} className="text-slate-900" />
                        </motion.div>
                        <span className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-900">
                          RÃ©sumÃ© Financier
                        </span>
                        <div className="w-px h-3 bg-slate-200" />
                        <span className="text-[10px] font-black font-mono text-slate-700 tracking-tight group-hover:text-slate-900 transition-colors">
                          {formatCurrency(calculations.finalTotal)}
                        </span>
                      </button>
                    </div>

                    {/* Collapsible Financial Summary */}
                    <AnimatePresence initial={false}>
                      {isSummaryExpanded && (
                        <motion.div
                          key="summary-body"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.4, ease: 'easeInOut' }}
                          style={{ overflow: 'hidden' }}
                        >
                          <div className="flex flex-col md:flex-row md:items-end gap-6 md:gap-10 mb-8">
                            <div className="flex-1 bg-slate-100 p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm w-full">
                              <div className="space-y-4">
                                <div className="flex flex-col sm:flex-row justify-between sm:items-end border-b border-slate-200 pb-4 gap-4 sm:gap-0">
                                  <div className="flex flex-col gap-1">
                                    <span className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em] font-display">Sous-total HT</span>
                                    <span className="text-2xl font-display font-black text-slate-900 tracking-tighter">{formatCurrency(calculations.subtotalHT)}</span>
                                  </div>
                                  <div className="text-left sm:text-right flex flex-col sm:items-end gap-1">
                                    <span className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em] font-display">TVA ({estimation.taxRate}%)</span>
                                    <span className="font-mono text-base text-aura-accent font-bold">+{formatCurrency(calculations.tva)}</span>
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <NumericControl label="TVA (%)" unit="%" value={estimation.taxRate} onChange={(val) => setEstimation({ ...estimation, taxRate: val })} />
                                  <NumericControl label="REMISE GLOBALE (%)" unit="%" value={estimation.globalDiscount} onChange={(val) => setEstimation({ ...estimation, globalDiscount: val })} />
                                </div>
                              </div>
                            </div>
                            <div className="text-left md:text-right flex flex-col justify-end min-w-0 md:min-w-[220px] flex-shrink-0 relative">
                              <div className="text-[11px] uppercase font-black mb-1 [letter-spacing:0.3em] text-aura-accent font-display relative z-10">Ã€ Payer (TTC)</div>
                              <div className="text-4xl sm:text-5xl md:text-6xl font-display font-bold tracking-tighter neon-text-emerald relative z-10 truncate">
                                {formatCurrency(calculations.finalTotal)}
                              </div>
                              {estimation.globalDiscount > 0 && (
                                <div className="text-[10px] text-emerald-400/80 font-bold mt-2 uppercase tracking-[0.2em] font-display relative z-10">
                                  Remise exceptionnelle appliquÃ©e
                                </div>
                              )}
                            </div>
                          </div>
                          {isEditMode && (
                            <button
                              onClick={async () => {
                                setIsAiLoading(true);
                                try {
                                  addHistory('Modifications validÃ©es et enregistrÃ©es');
                                  const isRentalPending =
                                    initialEstimation?.transactionType === 'rental' &&
                                    (initialEstimation?.status === 'pending' || initialEstimation?.status === 'En attente');
                                  const updatedFields: any = {
                                    products: estimation.products.map(p => ({
                                      ...p,
                                      productName: p.name,
                                      lineTotal: (p.quantity || 1) * (p.unitPrice || 0)
                                    })),
                                    taxRate: estimation.taxRate,
                                    globalDiscount: estimation.globalDiscount,
                                    client: estimation.client,
                                    rentalPeriod: (estimation as any).rentalPeriod || null,
                                    rentalStartTime: (estimation as any).rentalStartTime || null,
                                    rentalEndTime: (estimation as any).rentalEndTime || null,
                                    // Auto-transition Pending -> Processed for rentals
                                    ...(isRentalPending ? { status: 'processed' } : {}),
                                  };
                                  // Actual DB Save
                                  await updateQuoteStatus(initialEstimation.id, updatedFields as any);
                                  setIsEditMode(false);
                                  onSave?.({
                                    ...initialEstimation,
                                    ...updatedFields
                                  });
                                  if (isRentalPending && onStatusChange) {
                                    onStatusChange('processed');
                                  }
                                } catch (err) {
                                  console.error("Save error:", err);
                                } finally {
                                  setIsAiLoading(false);
                                }
                              }}
                              className="futuristic-btn-primary w-full group py-4 flex items-center justify-center gap-3"
                            >
                              {isAiLoading ? <Loader2 className="animate-spin" /> : <><CheckCircle2 size={18} /> Approve and Permanently Save</>}
                            </button>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
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
              className="w-full max-w-2xl bg-white border border-slate-200 rounded-[2rem] flex flex-col overflow-hidden shadow-2xl"
            >
              <div className="p-8 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-aura-accent flex items-center justify-center text-white">
                    <Sparkles size={24} />
                  </div>
                  <h2 className="text-2xl font-display font-bold uppercase text-slate-900">{aiResult.title}</h2>
                </div>
                <button onClick={() => setAiResult(null)} className="w-10 h-10 hover:bg-slate-100 rounded-full flex items-center justify-center"><X size={20} /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-10 bg-white">
                <div className="prose max-w-none">
                  <p className="text-slate-600 leading-relaxed whitespace-pre-wrap font-mono text-sm bg-slate-50 p-6 rounded-2xl border border-slate-200">
                    {aiResult.content}
                  </p>
                </div>
              </div>

              <div className="p-8 bg-slate-50 flex flex-col md:flex-row justify-between items-center gap-4 border-t border-slate-200">
                <div className="flex items-center gap-3">
                  <button onClick={() => shareTranslatedText('whatsapp', aiResult.content)} className="px-6 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                    <MessageCircle size={14} /> WhatsApp
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => { if (aiResult) { navigator.clipboard.writeText(aiResult.content);     addHistory('RÃ©sultat IA copiÃ©'); } }}
                    className="px-6 py-3 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2"
                  >
                    Copy
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
                alert('Erreur : ID du devis introuvable.');
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
                addHistory(`Transmis au fournisseur ${supplierName}`);
                setIsTransmitModalOpen(false);
                if (onStatusChange) onStatusChange('in_progress');
                // Success toast
                const toast = document.createElement('div');
                toast.innerHTML = `âœ… Devis transmis Ã  <strong>${supplierName}</strong> avec succÃ¨s !`;
                toast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#10b981;color:white;padding:14px 28px;border-radius:16px;font-weight:700;font-size:14px;z-index:9999;box-shadow:0 8px 32px rgba(16,185,129,0.4);animation:fadeIn 0.3s ease';
                document.body.appendChild(toast);
                setTimeout(() => toast.remove(), 4000);
              } catch (err: any) {
                console.error('[TransmitModal] Error saving transmission:', err);
                const toast = document.createElement('div');
                toast.textContent = `âŒ Erreur de transfert : ${err?.message || 'Veuillez rÃ©essayer'}`;
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
            className="fixed right-0 top-0 bottom-0 w-full max-w-4xl z-[800] bg-white flex flex-col border-l border-slate-200 shadow-2xl"
          >
            <div className="p-8 border-b border-slate-200 flex items-center justify-between bg-slate-50 h-24">
              <div className="flex items-center gap-4">
                <button onClick={() => setIsHistoryPanelOpen(false)} className="w-10 h-10 hover:bg-aura-accent hover:text-white rounded-xl flex items-center justify-center transition-all bg-aura-accent/10 text-aura-accent"><ChevronLeft size={24} /></button>
                <div>
                  <h2 className="text-2xl font-display font-black uppercase tracking-tighter text-slate-900">Historique</h2>
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-0.5">Case: {estimation.id}</div>
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
                  <div className="absolute left-[-21px] top-0 w-10 h-10 rounded-full border-2 border-slate-200 bg-white overflow-hidden z-10 shadow-sm">
                    {entry.userPhoto ? (
                      <img src={entry.userPhoto} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-600 text-xs font-bold">
                        {entry.user?.[0]?.toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between items-start mb-1 text-[10px] font-mono text-slate-400 uppercase">
                    <span>{new Date(entry.timestamp).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 uppercase tracking-widest">{entry.user}</span>
                  </div>
                  <div className="text-lg font-bold text-slate-800 tracking-tight leading-snug uppercase">{entry.action}</div>
                </motion.div>
              ))}
            </div>

            <div className="p-8 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Page {historyPage} sur {Math.ceil(estimation.history.length / itemsPerPage)}</div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setHistoryPage(prev => Math.max(1, prev - 1))}
                  disabled={historyPage === 1}
                  className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:bg-aura-accent hover:text-white transition-all disabled:opacity-30 disabled:pointer-events-none shadow-sm"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={() => setHistoryPage(prev => Math.min(Math.ceil(estimation.history.length / itemsPerPage), prev + 1))}
                  disabled={historyPage === Math.ceil(estimation.history.length / itemsPerPage)}
                  className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:bg-aura-accent hover:text-white transition-all disabled:opacity-30 disabled:pointer-events-none shadow-sm"
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
        className="custom-select-trigger bg-slate-50 border border-slate-200 hover:border-aura-accent/50 transition-all"
      >
        <div className="flex items-center gap-3 overflow-hidden">
          {selectedOption ? (
            renderOption ? renderOption(selectedOption) : <span className="uppercase text-xs font-bold truncate text-slate-900">{selectedOption.label || selectedOption.displayName || selectedOption.name || selectedOption}</span>
          ) : (
            <span className="text-slate-400 uppercase text-[10px] font-bold">{placeholder}</span>
          )}
        </div>
        <ChevronDown size={14} className={`text-slate-400 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="absolute top-full left-0 right-0 z-[600] bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden mt-2 p-1"
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
                    className={`custom-select-option rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors ${value === optId ? 'bg-slate-50 border-slate-200 text-aura-accent' : 'border-transparent'}`}
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
  const len = (value || 0).toString().length;
  const fontSizeClass = len > 7 ? 'text-xs' : len > 4 ? 'text-sm' : 'text-base';
  
  return (
    <div className="space-y-1 flex-1 min-w-0">
      <span className="text-[9px] text-slate-400 uppercase font-bold tracking-widest">{label}</span>
      <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-1 group focus-within:border-aura-accent shadow-sm transition-all">
        <button
          onClick={() => onChange(Math.max(0, value - 1))}
          className="w-8 h-8 rounded-xl bg-white hover:bg-aura-accent hover:text-white flex items-center justify-center transition-all text-slate-400 shadow-sm active:scale-95 border border-slate-200 shrink-0"
        >
          <Minus size={12} />
        </button>
        <div className="flex-1 flex items-center justify-center gap-1 px-2 min-w-0">
          <input
            type="number"
            value={isNaN(value) ? 0 : value}
            onChange={(e) => onChange(Number(e.target.value))}
            className={`bg-transparent border-none p-0 focus:ring-0 text-center font-display font-black w-full min-w-0 flex-1 text-slate-900 appearance-none no-arrows ${fontSizeClass}`}
          />
          {unit && <span className="text-sm font-display font-black text-aura-accent shrink-0">{unit}</span>}
        </div>
        <button
          onClick={() => onChange(value + 1)}
          className="w-8 h-8 rounded-xl bg-white hover:bg-aura-accent hover:text-white flex items-center justify-center transition-all text-slate-400 shadow-sm active:scale-95 border border-slate-200 shrink-0"
        >
          <Plus size={12} />
        </button>
      </div>
    </div>
  );
}

function TechnicalSpec({ icon, label, value, colorClass = "text-aura-accent", bgColorClass = "bg-aura-accent/10" }: { icon: React.ReactNode, label: string, value: string, colorClass?: string, bgColorClass?: string }) {
  return (
    <div className="flex items-center gap-4 group">
      <div className={`w-12 h-12 rounded-2xl ${bgColorClass} flex items-center justify-center ${colorClass} transition-all duration-500 group-hover:scale-110 shadow-sm border border-slate-200`}>
        {icon}
      </div>
      <div className="flex flex-col">
        <div className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-0.5">{label}</div>
        <div className="text-sm font-display font-black text-slate-800 uppercase tracking-tight">{value}</div>
      </div>
    </div>
  );
}
