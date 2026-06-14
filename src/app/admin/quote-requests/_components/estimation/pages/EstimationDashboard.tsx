'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { TabNavigation, SummaryCard } from '../components/Layout';
import dynamic from 'next/dynamic';
import { SearchHeader, EstimationTable } from '../components/Table';
import { Pagination } from '@/components/ui/Pagination';
import { TransmitModal, SimpleMessagePopup, ReturnReasonPopup, RentalTreatmentModal } from '@/application/admin/estimations/components/TransmitModal';

const DetailsApp = dynamic(() => import('../details/App'), {
  loading: () => <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[110]"><div className="w-10 h-10 border-4 border-[#95d230] border-t-transparent rounded-full animate-spin" /></div>,
});
import { EstimationDrawer } from '../components/EstimationDrawer';
import { MobileFilterDrawer } from '../components/MobileFilterDrawer';

import { X, ShoppingBag, Calendar, Calculator } from 'lucide-react';
import { EstimationStatus, Estimation, TrackingInfo } from '../types';
import { getQuoteRequests, getPaginatedQuotes, getQuoteCounts, updateQuoteStatus, moveQuotesToTrash, restoreQuotes, permanentDeleteQuotes, permanentDeleteAllTrashedQuotes, getUsers, getQuoteRequest, getProducts, getProductSpecs, calibrateQuoteStats } from '@/app/admin/actions';
import type { QuoteRequest, UserProfile, Product, ProductSpec } from '@/lib/types';
import { hasPermission, canPermanentlyDelete } from '@/lib/permissions';
import { useI18n } from '@/lib/i18n';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  setDoc, 
  serverTimestamp, 
  increment, 
  getDoc, 
  addDoc, 
  updateDoc,
  deleteDoc,
  getDocs,
  writeBatch,
  orderBy,
  limit
} from 'firebase/firestore';
import { firestore as db, storage } from '@/firebase/config';
import { ref, listAll, deleteObject } from 'firebase/storage';

// Mapping Firestore status <-> Estimation status
// Cf. README-METIER.md Section 3.1
const statusToEstimation: Record<string, EstimationStatus> = {
  'pending': 'En attente',
  'processed': 'Traité',
  'in_progress': 'Fournisseur',
  'sent': 'Livraison',
  'archived': 'Archivé',
  'trashed': 'Corbeille',
  'returned': 'Retourné',
  'rented': 'Loué',
};

const estimationToStatus: Record<EstimationStatus, string> = {
  'En attente': 'pending',
  'Traité': 'processed',
  'Fournisseur': 'in_progress',
  'Livraison': 'sent',
  'Archivé': 'archived',
  'Corbeille': 'trashed',
  'Retourné': 'returned',
  'Loué': 'rented',
};


function quoteToEstimation(q: QuoteRequest): Estimation {
  const rawDate = q.createdAt ? (q.createdAt instanceof Date ? q.createdAt : new Date(q.createdAt)) : null;
  const isValidDate = rawDate && !isNaN(rawDate.getTime());
  const estStatus = statusToEstimation[q.status] || 'En attente';

  // Use pre-calculated totalQuote if available, otherwise recalculate
  const totalClient = q.totalQuote || (q.products?.reduce((sum, p) => sum + (p.lineTotal || 0), 0) || 0) + (q.deliveryCost || 0) + (q.installationCost || 0);
  const idShort = q.id.slice(0, 8).toUpperCase();

  // Parse rental period from string ISO dates (from getPaginatedQuotes projection)
  let rentalPeriod: { from: string; to: string } | undefined;
  const rawRental = (q as any).rentalPeriod;
  if (rawRental) {
    const fromVal = rawRental.from instanceof Date ? rawRental.from.toISOString().split('T')[0] : (typeof rawRental.from === 'string' ? rawRental.from.split('T')[0] : null);
    const toVal = rawRental.to instanceof Date ? rawRental.to.toISOString().split('T')[0] : (typeof rawRental.to === 'string' ? rawRental.to.split('T')[0] : null);
    if (fromVal && toVal) rentalPeriod = { from: fromVal, to: toVal };
  }

   return {
     id: q.id,
     number: q.number || `DEV-${idShort}`,
      client: typeof q.client === 'string' ? q.client : (q.client?.companyName || (q.client as any)?.name || 'Unknown Client'),
     phone: (q.client && typeof q.client === 'object' ? q.client.phone : (q as any).phone) || '',
     email: (q.client && typeof q.client === 'object' ? q.client.email : (q as any).email) || '',
     status: estStatus,
     time: isValidDate ? rawDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '--:--',
     date: isValidDate ? rawDate.toLocaleDateString('fr-FR') : '--/--/----',
     totalPurchase: (q as any).totalPurchase || 0,
     totalClient: (q as any).totalClient || q.totalQuote || 0,
     reference: idShort,
     trackingNumber: (q as any).trackingNumber,
     supplierId: (q as any).supplierId,
     isReturned: (q as any).isReturned || false,
     returnReason: (q as any).returnReason,
     supplierNotes: (q as any).supplierNotes,
     treatedBy: (q as any).treatedBy,
     treatedByName: (q as any).treatedByName,
     treatedByRole: (q as any).treatedByRole,
     treatedAt: (q as any).treatedAt,
     emailVerified: (q as any).emailVerified,
     sitePhoto: q.sitePhoto || (q.client && typeof q.client === 'object' ? (q.client as any).sitePhoto : undefined),
     pdfUrl: q.pdfUrl,
     transactionType: (q as any).transactionType,
     rentalPeriod,
     rentalStartTime: (q as any).rentalStartTime,
     rentalEndTime: (q as any).rentalEndTime,
   };
}


interface EstimationDashboardProps {
  userRole?: string;
  userId?: string;
  userName?: string;
}



export const EstimationDashboard: React.FC<EstimationDashboardProps> = ({ userRole = 'admin', userId, userName }) => {
  const [estimations, setEstimations] = useState<Estimation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [serverTabCounts, setServerTabCounts] = useState<Record<string, number>>({});
  const [serverTabSums, setServerTabSums] = useState<Record<string, number>>({});
  const [selectedItems, setSelectedItems] = useState<Map<string, Estimation>>(new Map());
  const selectedIds = useMemo(() => new Set(selectedItems.keys()), [selectedItems]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isSupplierPanelOpen, setIsSupplierPanelOpen] = useState(false);
  const [activeEstimationId, setActiveEstimationId] = useState<string | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedEstimation, setSelectedEstimation] = useState<any>(null);
  const [autoEditMode, setAutoEditMode] = useState(false);
  const [suppliers, setSuppliers] = useState<UserProfile[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [fullQuotes, setFullQuotes] = useState<Record<string, QuoteRequest>>({});
  const [isMessagePopupOpen, setIsMessagePopupOpen] = useState(false);
  const [popupData, setPopupData] = useState({ title: '', message: '', subtitle: '', variant: 'default' as 'default' | 'alert' });
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isEmptyTrashConfirming, setIsEmptyTrashConfirming] = useState(false);
  const [isResyncConfirming, setIsResyncConfirming] = useState(false);
  const [isRentalModalOpen, setIsRentalModalOpen] = useState(false);
  const [pendingRentalId, setPendingRentalId] = useState<string | null>(null);
  const [lastDocIds, setLastDocIds] = useState<Record<number, string | null>>({ 1: null });
  const [pageCache, setPageCache] = useState<Record<string, Record<number, { estimations: Estimation[], lastId: string | null }>>>({});
   const [isFetchingFullQuote, setIsFetchingFullQuote] = useState(false);
   const [allProducts, setAllProducts] = useState<Product[]>([]);
   const [allProductSpecs, setAllProductSpecs] = useState<Record<string, ProductSpec[]>>({});
   const [productsLoaded, setProductsLoaded] = useState(false);
   // Animated bulk processing
   const [exitingIds, setExitingIds] = useState<Set<string>>(new Set());
   const [bulkProgress, setBulkProgress] = useState<{ total: number; remaining: number } | null>(null);

const isFournisseur = userRole === 'fournisseur';
   const isCommercial = userRole === 'commercial';
   const isAdmin = userRole === 'admin';
   const { t } = useI18n();

   // For supplier: show "Fournisseur" and "Retourné" by default
   const defaultTab = isFournisseur ? 'Fournisseur' : 'En attente';
   const [activeTab, setActiveTab] = useState<EstimationStatus>(defaultTab as EstimationStatus);
   const [estimationMode, setEstimationMode] = useState<'vente' | 'location'>('vente');
   const [sortField, setSortField] = useState<'price' | 'date' | 'time'>('price');
   const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

   const handleSortChange = useCallback((field: 'price' | 'date' | 'time') => {
     setSortField(prevField => {
       if (prevField === field) {
         setSortDirection(prevDir => prevDir === 'asc' ? 'desc' : 'asc');
       }
       return field;
     });
   }, []);

   // Current user object for chat
   const currentUser = useMemo(() => ({
     uid: userId || userName || 'unknown',
     email: '',
      displayName: userName || (userRole === 'admin' ? t('common.admin') : userRole === 'commercial' ? t('common.commercial') : t('common.supplier')),
     photoURL: '',
     role: userRole === 'fournisseur' ? 'prestataire' : (userRole as any),
   }), [userId, userName, userRole]);

   // Helper to open the global MiniChat from any dashboard action
   const openChat = useCallback((chatId: string) => {
     window.dispatchEvent(new CustomEvent('open-chat', { detail: { chatId } }));
   }, []);

  const itemsPerPage = 6;

  const clearCache = useCallback((tab?: EstimationStatus) => {
    const modeSuffix = estimationMode || 'vente';
    if (tab) {
      setPageCache(prev => {
        const next = { ...prev };
        delete next[`${tab}_${modeSuffix}`];
        return next;
      });
    } else {
      setPageCache({});
    }
  }, [estimationMode]);

  const updateCountsLocally = useCallback((from: EstimationStatus | null, to: EstimationStatus | null, count: number = 1, value: number = 0) => {
    const statusToKey = (s: EstimationStatus) => estimationToStatus[s];

    if (from) {
      const fromKey = statusToKey(from);
      setServerTabCounts(prev => ({ ...prev, [fromKey]: Math.max(0, (prev[fromKey] || 0) - count) }));
      setServerTabSums(prev => ({ ...prev, [fromKey]: Math.max(0, (prev[fromKey] || 0) - value) }));
    }
    
    if (to) {
      const toKey = statusToKey(to);
      setServerTabCounts(prev => ({ ...prev, [toKey]: (prev[toKey] || 0) + count }));
      setServerTabSums(prev => ({ ...prev, [toKey]: (prev[toKey] || 0) + value }));
    }
  }, []);

  const fetchPage = useCallback(async (page: number, currentTab: EstimationStatus, startId: string | null, mode?: 'vente' | 'location') => {
    // Check cache first
    const cacheKey = `${currentTab}_${mode || 'vente'}`;
    const tabCache = pageCache[cacheKey] || {};
    if (tabCache[page]) {
      setEstimations(tabCache[page].estimations);
      return;
    }

    setIsLoading(true);
    // Clear current estimations to avoid showing old data from previous tab
    setEstimations([]);
    try {
      const statusKey = estimationToStatus[currentTab as string];
      const txType = (mode || estimationMode) === 'location' ? 'rental' : 'sale';
      const { requests, lastId } = await getPaginatedQuotes({
        status: statusKey,
        limit: itemsPerPage,
        startAfterId: startId,
        supplierId: isFournisseur ? (userId ?? null) : undefined,
        transactionType: txType,
      });
      
      const newEstimations = requests.map((q: any) => quoteToEstimation(q));
      
      // Update cache
      setPageCache(prev => ({
        ...prev,
        [cacheKey]: {
          ...(prev[cacheKey] || {}),
          [page]: { estimations: newEstimations, lastId }
        }
      }));

      setEstimations(newEstimations);
      setLastDocIds(prev => ({ ...prev, [page + 1]: lastId }));
    } catch (error) {
      console.error('Failed to fetch estimations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isFournisseur, userId, itemsPerPage, estimationMode]);

  // Load suppliers and counts separately to avoid redundant calls during pagination
  useEffect(() => {
    const loadInitialData = async () => {
      if (!userId) return;
      
      try {
        // Phase 1 perf: only load stats at startup — products/specs load lazily on detail open
        const txType = estimationMode === 'location' ? 'rental' : 'sale';
        const statsResult = await getQuoteCounts(isFournisseur ? (userId ?? null) : null, txType);
        
        // Store stats using technical keys (pending, processed, etc.) for easier lookup
        setServerTabCounts(statsResult.counts);
        setServerTabSums(statsResult.sums);

        if (isAdmin || isCommercial) {
          const usersResult = await getUsers({ limit: 100 });
          const supplierUsers = usersResult.users.filter((u: UserProfile) => u.role === 'fournisseur');
          setSuppliers(supplierUsers);
        } else if (isFournisseur) {
          const selfUser = { uid: userId, email: '', displayName: userName, photoURL: '', role: 'fournisseur' } as UserProfile;
          setSuppliers([selfUser]);
        }
      } catch (err) {
        console.error("Failed to load initial estimation data:", err);
      }
    };
    
    loadInitialData();
  }, [isAdmin, isCommercial, isFournisseur, userId, userName, estimationMode]);

  useEffect(() => {
    setLastDocIds({ 1: null });
    setCurrentPage(1);
    // Pass estimationMode explicitly to avoid reading stale closure value
    fetchPage(1, activeTab, null, estimationMode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // When mode changes, reset to first valid tab and immediately fetch with the NEW mode.
  // We must pass the new mode explicitly to fetchPage — the closure inside fetchPage
  // still holds the OLD estimationMode value until the next render cycle.
  useEffect(() => {
    const validTabs = estimationMode === 'location'
      ? ['En attente', 'Traité', 'Loué', 'Archivé', 'Corbeille']
      : ['En attente', 'Traité', 'Retourné', 'Fournisseur', 'Livraison', 'Archivé', 'Corbeille'];
    
    const targetTab: EstimationStatus = validTabs.includes(activeTab)
      ? activeTab
      : 'En attente' as EstimationStatus;
    
    // Reset all pagination/cache state for the new mode
    setPageCache({});
    setLastDocIds({ 1: null });
    setCurrentPage(1);
    setEstimations([]);

    if (!validTabs.includes(activeTab)) {
      // setActiveTab will trigger the [activeTab] effect which calls fetchPage,
      // but we pass the mode explicitly here to be safe
      setActiveTab(targetTab);
    }
    // Always fetch immediately with the new mode, passing it explicitly
    fetchPage(1, targetTab, null, estimationMode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estimationMode]);

  useEffect(() => {
    const startId = lastDocIds[currentPage];
    // Pass estimationMode explicitly to avoid reading stale closure value
    fetchPage(currentPage, activeTab, startId, estimationMode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

   // Phase 4 perf: stabilized chat listener — only triggers re-render when unread counts actually change
   // Note: Firestore map fields (unreadCount.userId) cannot be filtered server-side,
   // so we filter client-side and guard setState with a JSON diff to block useless re-renders.
   const prevUnreadRef = React.useRef<string>('{}');
   useEffect(() => {
     if (!currentUser.uid || currentUser.uid === 'unknown') return;

     const chatsRef = collection(db, 'chats');
     const q = query(chatsRef, where('participants', 'array-contains', currentUser.uid));

     const unsubscribe = onSnapshot(q, (snapshot) => {
       const counts: Record<string, number> = {};
       snapshot.forEach((docSnap) => {
         const chat = docSnap.data();
         const estimationId = chat.estimationId;
         const unread = chat.unreadCount?.[currentUser.uid] || 0;
         // Client-side filter: only track chats with unread messages
         if (estimationId && unread > 0) {
           counts[estimationId] = unread;
         }
       });

       // Guard: only update state if data actually changed — prevents useless re-renders
       const serialized = JSON.stringify(counts);
       if (serialized !== prevUnreadRef.current) {
         prevUnreadRef.current = serialized;
         setUnreadCounts(counts);
       }
     }, (error) => {
       console.error('Error listening to chats:', error);
     });

     return () => unsubscribe();
   }, [currentUser.uid]);

    // Server Action handles paging and tab caching robustly. Real-time updates for quotes are fetched via actions upon transitions.

const filteredEstimations = useMemo(() => {
     let filtered = estimations.filter((est) => {
       const matchesTab = est.status === activeTab;
       const matchesSearch =
         est.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
         est.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
         est.date.includes(searchTerm);

         if (isFournisseur) {
           return matchesTab && matchesSearch;
         }

       return matchesTab && matchesSearch;
     });
 return filtered;
     }, [estimations, activeTab, searchTerm, isFournisseur, userId]);

     const tabCounts = useMemo(() => {
       const counts: any = {};
       Object.entries(estimationToStatus).forEach(([label, techKey]) => {
         counts[label] = serverTabCounts[techKey] || 0;
       });
       return counts;
     }, [serverTabCounts]);

   const totalPages = Math.max(1, Math.ceil((tabCounts[activeTab] || 0) / itemsPerPage));
  const paginatedEstimations = filteredEstimations;

   const handleSelect = useCallback((id: string) => {
     setSelectedItems(prev => {
       const next = new Map(prev);
       if (next.has(id)) {
         next.delete(id);
       } else {
         const est = estimations.find(e => e.id === id);
         if (est) next.set(id, est);
       }
       return next;
     });
   }, [estimations]);

   const handleSelectAll = useCallback(() => {
     if (selectedItems.size === paginatedEstimations.length && paginatedEstimations.length > 0) {
       setSelectedItems(new Map());
     } else {
       const newItems = new Map(selectedItems);
       paginatedEstimations.forEach(est => newItems.set(est.id, est));
       setSelectedItems(newItems);
     }
   }, [paginatedEstimations, selectedItems.size]);

  const totalValue = useMemo(() => {
    // Force conversion of UI label to technical key (e.g. "Traité" -> "processed")
    const statusKey = estimationToStatus[activeTab] || 'pending';
    
    if (selectedItems.size > 0) {
      return Array.from(selectedItems.values()).reduce((sum, est) => sum + (est.totalClient || 0), 0);
    }
    // If search is active, calculate based on filtered items (approximate if paginated)
    if (searchTerm) {
      return filteredEstimations.reduce((sum, est) => sum + (est.totalClient || 0), 0);
    }
    // Otherwise, show global server total for this status key
    return serverTabSums[statusKey] || 0;
  }, [selectedItems, filteredEstimations, searchTerm, activeTab, serverTabSums]);

   const handleTabChange = useCallback((tab: EstimationStatus) => {
     setActiveTab(tab);
     setSelectedItems(new Map());
     setCurrentPage(1);
   }, []);

    /* ============================================
       BUSINESS RULES - Status transition validation
       See README-METIER.md Section 3.3
       ============================================ */
    
    const validateStatusTransition = (
      currentStatus: EstimationStatus,
      targetStatus: EstimationStatus,
      estimation: Estimation,
      userRole: string
    ): { valid: boolean; error?: string } => {
      
      // Rule #1: Cannot move to 'Traité' without a supplier (Except for Admin)
      if (currentStatus === 'En attente' && targetStatus === 'Traité') {
        if (!estimation.supplierId && !estimation.supplier && userRole !== 'admin') {
          return { valid: false, error: 'Veuillez ASSIGNER UN FOURNISSEUR avant de traiter cette estimation' };
        }
      }
      
      // Rule #2: Cannot move to 'Livraison' without trackingNumber + deliveryDate
      if (currentStatus === 'Fournisseur' && targetStatus === 'Livraison') {
        if (!estimation.trackingNumber || !estimation.trackingInfo?.deliveryDate) {
          return { valid: false, error: 'Veuillez saisir le NUMÉRO DE SUIVI et la DATE DE LIVRAISON avant de passer en livraison' };
        }
      }
      
      // Rule #3: Only ADMIN can restore from Trash
      if (currentStatus === 'Corbeille' && targetStatus === 'En attente') {
        if (userRole !== 'admin') {
          return { valid: false, error: 'Seul l\'ADMINISTRATEUR peut restaurer depuis la Corbeille' };
        }
      }
      
      // Rule #4: No automatic return to En attente from Livraison
      if (currentStatus === 'Livraison' && targetStatus === 'En attente') {
        return { valid: false, error: 'Transition non autorisée : impossible de revenir à "En attente" depuis "Livraison"' };
      }
      
      // Rule #5: Only ADMIN can permanently delete
      if (targetStatus === 'Corbeille' && currentStatus === 'Corbeille') {
        if (userRole !== 'admin') {
          return { valid: false, error: 'Seul l\'ADMINISTRATEUR peut supprimer définitivement' };
        }
      }

      
      return { valid: true };
    };

    const handleRentalConfirm = useCallback(async (startDate: string, endDate: string, startTime: string, endTime: string) => {
      if (!pendingRentalId) return;
      const est = estimations.find(e => e.id === pendingRentalId);
      if (!est) { setIsRentalModalOpen(false); return; }

      const firestoreStatus = estimationToStatus['Traité'];
      try {
        const updateData: any = {
          status: firestoreStatus,
          treatedBy: currentUser.uid,
          treatedByName: currentUser.displayName,
          treatedByRole: currentUser.role,
          treatedAt: Date.now(),
          rentalPeriod: { from: startDate, to: endDate },
          rentalStartTime: startTime,
          rentalEndTime: endTime,
        };
        await updateQuoteStatus(pendingRentalId, updateData);
        clearCache(est.status);
        clearCache('Traité');
        updateCountsLocally(est.status, 'Traité', 1, est.totalClient || 0);
        setEstimations(prev => prev.filter(e => e.id !== pendingRentalId));
        setActiveTab('Traité');
      } catch (error) {
        console.error('Failed to process rental treatment:', error);
      } finally {
        setIsRentalModalOpen(false);
        setPendingRentalId(null);
      }
    }, [pendingRentalId, estimations, currentUser, clearCache, updateCountsLocally]);

    const handleStatusTransition = useCallback(async (id: string) => {
      const est = estimations.find(e => e.id === id);
      if (!est) return;

      let nextStatus: EstimationStatus = est.status;

      // LOCATION MODE specific transitions
      if (estimationMode === 'location') {
        // 1. PENDING -> PROCESSED: direct transition without popup or Edit window
        if (est.status === 'En attente') {
          const firestoreStatus = estimationToStatus['Traité'];
          try {
            const updateData: any = {
              status: firestoreStatus,
              treatedBy: currentUser.uid,
              treatedByName: currentUser.displayName,
              treatedByRole: currentUser.role,
              treatedAt: Date.now(),
            };
            await updateQuoteStatus(id, updateData);
            clearCache(est.status);
            clearCache('Traité');
            updateCountsLocally(est.status, 'Traité', 1, est.totalClient || 0);
            setEstimations(prev => prev.filter(e => e.id !== id));
            setActiveTab('Traité' as EstimationStatus);
          } catch (error) {
            console.error('Failed to process rental treatment:', error);
          }
          return;
        }
        // 2. TRAITÉ -> LOUÉ: direct transition
        else if (est.status === 'Traité') {
          nextStatus = 'Loué';
        }
        // 3. LOUÉ -> ARCHIVÉ
        else if (est.status === 'Loué') {
          nextStatus = 'Archivé';
        }
        // 4. ARCHIVÉ -> CORBEILLE
        else if (est.status === 'Archivé') {
          nextStatus = 'Corbeille';
        }
        // 5. CORBEILLE -> EN ATTENTE
        else if (est.status === 'Corbeille') {
          nextStatus = 'En attente';
        }
      } else {
        // VENTE MODE (existing logic)
        // 1. EN ATTENTE -> TRAITÉ (Action: Check icon)
        if (est.status === 'En attente') {
          nextStatus = 'Traité';
        } 
        // 2. TRAITÉ -> FOURNISSEUR (Action: Send icon)
        else if (est.status === 'Traité' || est.status === 'Retourné') {
          setActiveEstimationId(id);
          setIsSupplierPanelOpen(true); // Opens the transmission modal
          return;
        } 
        // 3. FOURNISSEUR -> LIVRAISON (Action: Truck icon)
        else if (est.status === 'Fournisseur') {
          nextStatus = 'Livraison';
        } 
        // 4. LIVRAISON -> ARCHIVÉ (Action: Archive icon)
        else if (est.status === 'Livraison') {
          nextStatus = 'Archivé';
        } 
        // 5. ARCHIVÉ -> CORBEILLE
        else if (est.status === 'Archivé') {
          nextStatus = 'Corbeille';
        } 
        // 6. CORBEILLE -> EN ATTENTE (Restaurer)
        else if (est.status === 'Corbeille') {
          nextStatus = 'En attente';
        }
      }

      // Apply business rules before transition
      const validation = validateStatusTransition(est.status, nextStatus, est, currentUser.role);
      if (!validation.valid) {
        setPopupData({
          title: 'Action refusée',
          message: validation.error || 'Cette action est impossible.',
          subtitle: `Estimation ${est.number}`,
          variant: 'alert'
        });
        setIsMessagePopupOpen(true);
        return;
      }

      const firestoreStatus = estimationToStatus[nextStatus];
      try {
        // Capture "processed by" on first transition Pending → Processed
        const isFirstTreatment = est.status === 'En attente' && nextStatus === 'Traité';
        
        const updateData: any = { status: firestoreStatus };
        if (isFirstTreatment) {
          updateData.treatedBy = currentUser.uid;
          updateData.treatedByName = currentUser.displayName;
          updateData.treatedByRole = currentUser.role;
          updateData.treatedAt = Date.now();
        }
        
        await updateQuoteStatus(id, updateData);
        
        const oldStatus = est.status;
        const value = est.totalClient || 0;
        clearCache(oldStatus);
        clearCache(nextStatus);
        updateCountsLocally(oldStatus, nextStatus, 1, value);
        
        setEstimations(prev => prev.filter(e => e.id !== id));
        
        // Automatically switch tab after transition
        setActiveTab(nextStatus);
      } catch (error) {
        console.error('Failed to update status:', error);
      }
      setSelectedItems(prev => {
        const next = new Map(prev);
        next.delete(id);
        return next;
      });
    }, [estimations, currentUser, clearCache, updateCountsLocally]);

    const handleBulkStatusTransition = useCallback(async () => {
      if (selectedItems.size === 0) return;

      if (activeTab === 'Traité' || activeTab === 'Retourné') {
        setActiveEstimationId(null);
        setIsSupplierPanelOpen(true);
        return;
      }

      const items = Array.from(selectedItems.values());
      const total = items.length;
      const failedIds: string[] = [];

      setBulkProgress({ total, remaining: total });

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        let nextStatus: EstimationStatus = item.status;
        if (item.status === 'En attente') nextStatus = 'Traité';
        else if (item.status === 'Fournisseur') nextStatus = 'Livraison';
        else if (item.status === 'Livraison') nextStatus = 'Archivé';
        else if (item.status === 'Archivé') nextStatus = 'Corbeille';
        else if (item.status === 'Corbeille') nextStatus = 'En attente';

        // 1. Animate exit optimistically
        setExitingIds(prev => new Set([...Array.from(prev), item.id]));

        try {
          const firestoreStatus = estimationToStatus[nextStatus];
          const isFirstTreatment = item.status === 'En attente' && nextStatus === 'Traité';
          const updateData: any = { status: firestoreStatus };
          if (isFirstTreatment) {
            updateData.treatedBy = currentUser.uid;
            updateData.treatedByName = currentUser.displayName;
            updateData.treatedByRole = currentUser.role;
            updateData.treatedAt = Date.now();
          }

          await updateQuoteStatus(item.id, updateData);

          clearCache(item.status);
          clearCache(nextStatus);
          updateCountsLocally(item.status, nextStatus, 1, item.totalClient || 0);

          // 2. Remove from list after exit animation completes (~350ms)
          await new Promise(r => setTimeout(r, 350));
          setEstimations(prev => prev.filter(e => e.id !== item.id));

        } catch (err) {
          console.error('Failed to update status for:', item.id, err);
          failedIds.push(item.id);
          // Rollback: cancel exit animation for failed item
          setExitingIds(prev => { const next = new Set(prev); next.delete(item.id); return next; });
        }

        setBulkProgress({ total, remaining: total - i - 1 });
      }

      // Cleanup
      setExitingIds(new Set());
      setBulkProgress(null);
      // Only clear selection for items that succeeded
      setSelectedItems(prev => {
        const next = new Map(prev);
        items.forEach(item => { if (!failedIds.includes(item.id)) next.delete(item.id); });
        return next;
      });
    }, [selectedItems, currentUser, clearCache, updateCountsLocally]);

    const handleViewMessage = useCallback(async (id: string) => {
      const est = estimations.find(e => e.id === id);
      if (!est) return;

      // Prioritize local state if it has the data we need
      const hasLocalNotes = !!est.supplierNotes || !!est.returnReason;
      
      let quoteToUse = fullQuotes[id];
      
      // Only fetch if we really need it or if local state is empty
      if (!quoteToUse && !hasLocalNotes) {
        setIsFetchingFullQuote(true);
        try {
          const fetched = await getQuoteRequest(id);
          if (fetched) {
            setFullQuotes(prev => ({ ...prev, [id]: fetched }));
            quoteToUse = fetched;
          }
        } catch (error) {
          console.error("Failed to fetch full quote for message view:", error);
        } finally {
          setIsFetchingFullQuote(false);
        }
      }

      const isReturned = est.isReturned || est.status === 'Retourné';
      
      if (isReturned) {
        setPopupData({
          title: 'Return Reason',
          message: est.returnReason || quoteToUse?.returnReason || 'No reason specified.',
          subtitle: `Réf: ${est.number}`,
          variant: 'alert'
        });
      } else {
        setPopupData({
          title: 'Supplier Instructions',
          message: est.supplierNotes || quoteToUse?.supplierNotes || 'No technical instructions.',
          subtitle: `Réf: ${est.number}`,
          variant: 'default'
        });
      }
      setIsMessagePopupOpen(true);
      
      // Mark supplier notes as read locally so the red badge disappears
      if (est.supplierNotes) {
        setEstimations(prev => prev.map(e =>
          e.id === id ? { ...e, supplierNotesRead: true } : e
        ));
      }
    }, [estimations, fullQuotes]);

    const handleUpdateTracking = useCallback((id: string, info: TrackingInfo) => {
      updateQuoteStatus(id, { trackingNumber: info.number }).then(() => {
        setEstimations(prev => prev.map(est =>
          est.id === id ? { ...est, trackingInfo: info, trackingNumber: info.number } : est
        ));
      });
    }, []);

// Rule #3: Only ADMIN can restore from Trash
    const handleRestore = useCallback(async (id: string) => {
      if (currentUser.role !== 'admin') {
        alert('Seul l\'ADMINISTRATEUR peut restaurer depuis la Corbeille');
        return;
      }
      
      const est = estimations.find(e => e.id === id);
      if (!est) return;

      try {
        await restoreQuotes([id]);
        const oldStatus = est.status;
        const newStatus = 'En attente' as EstimationStatus;
        clearCache(oldStatus);
        clearCache(newStatus);
        updateCountsLocally(oldStatus, newStatus, 1, est.totalClient || 0);
        
        setEstimations(prev => prev.filter(est => est.id !== id));
        setSelectedItems(prev => {
          const next = new Map(prev);
          next.delete(id);
          return next;
        });
        // After restoration, go to the En attente tab
        setActiveTab('En attente');
     } catch (error) {
       console.error('Failed to restore:', error);
     }
   }, [currentUser.role, estimations, clearCache, updateCountsLocally]);

   const handleBulkRestore = useCallback(async () => {
     if (selectedItems.size === 0) return;
      if (currentUser.role !== 'admin') {
        alert('Seul l\'ADMINISTRATEUR peut restaurer des estimations');
       return;
     }

     const items = Array.from(selectedItems.values());
     const total = items.length;
     const failedIds: string[] = [];

     setBulkProgress({ total, remaining: total });

     for (let i = 0; i < items.length; i++) {
       const item = items[i];

       // 1. Optimistically animate exit
       setExitingIds(prev => new Set([...Array.from(prev), item.id]));

       try {
         await restoreQuotes([item.id]);

         const oldStatus = item.status;
         clearCache(oldStatus);
         clearCache('En attente');
         updateCountsLocally(oldStatus, 'En attente', 1, item.totalClient || 0);

         // 2. Remove from list after animation (~350ms)
         await new Promise(r => setTimeout(r, 350));
         setEstimations(prev => prev.filter(e => e.id !== item.id));

       } catch (err) {
         console.error('Failed to restore:', item.id, err);
         failedIds.push(item.id);
         // Rollback animation for failed item
         setExitingIds(prev => { const next = new Set(prev); next.delete(item.id); return next; });
       }

       setBulkProgress({ total, remaining: total - i - 1 });
     }

     // Cleanup
     setExitingIds(new Set());
     setBulkProgress(null);
     setSelectedItems(prev => {
       const next = new Map(prev);
       items.forEach(item => { if (!failedIds.includes(item.id)) next.delete(item.id); });
       return next;
     });
     if (failedIds.length === 0) setActiveTab('En attente');
   }, [selectedItems, currentUser.role, clearCache, updateCountsLocally]);

   // handleArchive: archive = lock (save previousStatus), unarchive = restore previous status
   const handleArchive = useCallback(async (id: string) => {
     const est = estimations.find(e => e.id === id);
     if (!est) return;
     try {
       if (est.status === 'Archivé') {
          // Unarchive: restore the previous business status (without changing the workflow)
         const prevStatus = (est as any).previousStatus || 'delivered';
         const prevDisplayStatus = {
           'pending': 'En attente', 'processed': 'Traité', 'in_progress': 'Fournisseur',
           'delivered': 'Livraison', 'returned': 'Retourné'
         }[prevStatus] || 'Livraison';
         await updateQuoteStatus(id, { status: prevStatus, previousStatus: null });
         clearCache('Archivé');
         clearCache(prevDisplayStatus as any);
         updateCountsLocally('Archivé', prevDisplayStatus as any, 1);
         setEstimations(prev => prev.filter(e => e.id !== id));
         setActiveTab(prevDisplayStatus as any);
       } else {
         // Archiver: verrouiller en sauvegardant le statut actuel
         const prevStatus = est.status;
         await updateQuoteStatus(id, { status: 'archived', previousStatus: prevStatus });
         clearCache(prevStatus as any);
         clearCache('Archivé');
         updateCountsLocally(prevStatus as any, 'Archivé', 1);
         setEstimations(prev => prev.filter(e => e.id !== id));
         setActiveTab('Archivé');
       }
     } catch (error) {
       console.error('Failed to archive/unarchive:', error);
     }
   }, [estimations, clearCache, updateCountsLocally]);

   const handleSupplierClick = useCallback((id?: string) => {
     if (id) setActiveEstimationId(id);
     setIsSupplierPanelOpen(true);
   }, []);

    const handleSupplierConfirm = useCallback(async (supplierId: string, supplierName: string, message: string) => {
       const itemsToProcess = activeEstimationId 
         ? [estimations.find(e => e.id === activeEstimationId)].filter(Boolean) as Estimation[]
         : Array.from(selectedItems.values());

       if (itemsToProcess.length === 0) {
          alert('Error: no estimation found');
         setIsSupplierPanelOpen(false);
         return;
       }

       const failedIds: string[] = [];
       setIsLoading(true);

       try {
         for (const activeEstimation of itemsToProcess) {
          if (currentUser.role !== 'admin' && activeEstimation.treatedBy && currentUser.uid !== activeEstimation.treatedBy) {
              alert(`Only the responsible commercial can transfer estimation ${activeEstimation.number} to the supplier.`);
             failedIds.push(activeEstimation.id);
             continue;
           }

           const commercialId = activeEstimation.treatedBy || currentUser.uid;

           await updateQuoteStatus(activeEstimation.id, {
             status: 'in_progress', // Move to "Fournisseur" status
             supplierId: supplierId,
             supplierNotes: message,
             isReturned: false,
             ...(activeEstimation.treatedBy ? {} : {
               treatedBy: commercialId,
               treatedByName: currentUser.displayName,
               treatedByRole: currentUser.role,
             }),
           });

           const oldStatus = activeEstimation.status;
           const value = activeEstimation.totalClient || 0;
           clearCache(oldStatus);
           clearCache('Fournisseur');
           updateCountsLocally(oldStatus, 'Fournisseur', 1, value);
         }

         setEstimations(prev => prev.filter(est => !itemsToProcess.some(item => item.id === est.id && !failedIds.includes(item.id))));
         
         if (failedIds.length < itemsToProcess.length) {
           setActiveTab('Fournisseur');
         }

       } catch (error) {
         console.error('Error transferring to supplier:', error);
          alert('Error during transfer');
       } finally {
         setIsLoading(false);
         setIsSupplierPanelOpen(false);
         setActiveEstimationId(null);
         setSelectedItems(prev => {
           const next = new Map(prev);
           itemsToProcess.forEach(item => { if (!failedIds.includes(item.id)) next.delete(item.id); });
           return next;
         });
       }
      }, [activeEstimationId, selectedItems, estimations, currentUser, clearCache, updateCountsLocally]);

     // Send refusal message from supplier to the handling commercial via chat
    const sendRefusalMessage = async (est: Estimation, reason: string, subject: string) => {
      if (!est.supplierId || !est.treatedBy) {
        console.warn('Cannot send refusal message: missing supplierId or treatedBy', est.id);
        return;
      }

      const chatId = `est_${est.id}`;
      const chatRef = doc(db, 'chats', chatId);

       try {
         const chatSnap = await getDoc(chatRef);
         if (!chatSnap.exists()) {
           await setDoc(chatRef, {
             id: chatId,
             participants: [est.supplierId, est.treatedBy],
             estimationId: est.id,
             lastMessage: `Refus: ${subject}`,
             lastMessageAt: serverTimestamp(),
             unreadCount: {
               [est.treatedBy]: 1,
               [est.supplierId]: 0,
             },
             isGroup: false,
             createdBy: est.supplierId,
             createdAt: serverTimestamp(),
           });
          } else {
            // Increment unread for treatedBy (the explicit target) only
            await updateDoc(chatRef, {
              lastMessage: `Refus: ${subject}`,
              lastMessageAt: serverTimestamp(),
              [`unreadCount.${est.treatedBy}`]: increment(1),
            });
          }

       const messageData = {
         chatId,
         senderId: est.supplierId,
         senderName: currentUser.displayName,
         senderRole: currentUser.role,
         content: `${subject}\n${reason}`,
         type: 'text',
         targetUserId: est.treatedBy,
         status: 'sent',
         createdAt: serverTimestamp(),
       };
        await addDoc(collection(db, 'chats', chatId, 'messages'), messageData);
      } catch (error) {
        console.error('Error sending refusal message:', error);
      }
    };

    const handleSupplierAction = useCallback(async (ids: string[], action: 'approve' | 'refuse', data?: { trackingNumber?: string, reason?: string, subject?: string }) => {
       try {
         if (action === 'approve') {
           for (const id of ids) {
             await updateQuoteStatus(id, {
               status: 'sent' as any,
               trackingNumber: data?.trackingNumber,
             });
           }
         } else {
           // Refuser: send refusal message to chat first, then update status
           for (const id of ids) {
             const est = estimations.find(e => e.id === id);
             if (est && data?.reason && data?.subject) {
               await sendRefusalMessage(est, data.reason, data.subject);
             }
             await updateQuoteStatus(id, {
               status: 'returned' as any,
               supplierId: undefined,
               returnReason: data?.subject && data?.reason 
                 ? `${data.subject}: ${data.reason}` 
              : (data?.subject || data?.reason || 'No reason specified')
             });
           }
         }
         setEstimations(prev => prev.map(est => {
           if (!ids.includes(est.id)) return est;
           if (action === 'approve') {
             return {
               ...est,
               status: 'Livraison' as EstimationStatus,
               trackingNumber: data?.trackingNumber,
               sendDate: new Date().toLocaleDateString('fr-FR'),
               expectedArrivalDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR'),
               isReturned: false
             };
           } else {
             const finalReason = data?.subject && data?.reason && data.reason.trim() !== ""
               ? `${data.subject}: ${data.reason}` 
               : (data?.subject || data?.reason || 'No specific reason');
               
             return {
               ...est,
               status: 'Retourné' as EstimationStatus,
               isReturned: true,
               returnReason: finalReason,
               supplierId: undefined,
               supplier: undefined,
               supplierPhoto: undefined,
              };
            }
           }));

           ids.forEach(id => {
             const est = estimations.find(e => e.id === id);
             if (est) {
               const oldStatus = est.status;
               const newStatus = action === 'approve' ? 'Livraison' : 'Retourné';
               const value = est.totalClient || 0;
               clearCache(oldStatus);
               clearCache(newStatus);
               updateCountsLocally(oldStatus, newStatus, 1, value);
             }
           });

           setEstimations(prev => prev.filter(est => !ids.includes(est.id)));
           if (action === 'refuse') clearCache('Retourné');

           // Switch tab according to action if not a supplier
          if (!isFournisseur) {
            if (action === 'approve') {
              setActiveTab('Livraison');
            } else if (action === 'refuse') {
              setActiveTab('Retourné');
            }
          }
         } catch (error) {
           console.error('Failed supplier action:', error);
         }
       }, [estimations, isFournisseur, clearCache, updateCountsLocally, sendRefusalMessage]);

    const handleMarkAsDelivered = useCallback(async (id: string) => {
      try {
        await updateQuoteStatus(id, { status: 'archived' as any });
        setEstimations(prev => prev.map(est =>
          est.id === id ? { ...est, status: 'Archivé' as EstimationStatus, isLocked: true } : est
        ));
        setActiveTab('Archivé');
      } catch (error) {
        console.error('Failed to mark as delivered:', error);
      }
    }, []);

   const handleToggleLock = useCallback(async (id: string) => {
     const est = estimations.find(e => e.id === id);
     if (!est) return;
     const newLocked = !est.isLocked;
     // Persist to Firestore
     try {
       await updateQuoteStatus(id, { isLocked: newLocked });
     } catch (e) {
       console.error('Failed to toggle lock:', e);
     }
     // Update local state
     setEstimations(prev => prev.map(e =>
       e.id === id ? { ...e, isLocked: newLocked } : e
     ));
   }, [estimations]);


   const handleEdit = useCallback(async (id: string) => {
     const estimation = estimations.find(e => e.id === id);
     if (!estimation) return;

     // Use cache if available
     if (fullQuotes[id]) {
       setSelectedEstimation(fullQuotes[id]);
       setIsDetailsOpen(true);
     } else {
       // Open immediately with partial data — DetailsApp handles partial mode
       setSelectedEstimation(estimation);
       setIsDetailsOpen(true);

       // Load full quote data in the background
       try {
         const fullQuote = await getQuoteRequest(id);
         if (fullQuote) {
           setFullQuotes(prev => ({ ...prev, [id]: fullQuote }));
           setSelectedEstimation(fullQuote);
         }
       } catch (error) {
         console.error("Failed to fetch full quote details in background:", error);
       }
     }

     // Phase 1 perf: lazy-load products & specs only on first detail open
     if (!productsLoaded) {
       try {
         const [productsResult, specsResult] = await Promise.all([
           getProducts({ limit: 1000 }),
           getProductSpecs()
         ]);
         setAllProducts(productsResult.products);
         setAllProductSpecs(specsResult);
         setProductsLoaded(true);
       } catch (err) {
         console.error('Failed to lazy-load products/specs:', err);
       }
     }
   }, [estimations, fullQuotes, productsLoaded]);

   // Delete associated chat and storage when estimation is permanently deleted
   const deleteEstimationChat = async (estimationId: string) => {
     const chatId = `est_${estimationId}`;
     const chatRef = doc(db, 'chats', chatId);
     const chatSnap = await getDoc(chatRef);
     if (!chatSnap.exists()) return;

     // Delete all messages using batch
     const messagesRef = collection(db, 'chats', chatId, 'messages');
     const messagesSnap = await getDocs(messagesRef);
     const batch = writeBatch(db);
     messagesSnap.forEach(msgDoc => {
       batch.delete(msgDoc.ref);
     });
     await batch.commit();

     // Delete chat document
     await deleteDoc(chatRef);

     // Delete storage files (images, videos, audio)
     try {
       const chatStorageRef = ref(storage, `chats/${chatId}`);
       const filesResult = await listAll(chatStorageRef);
       const deletePromises = filesResult.items.map(file => deleteObject(file));
       if (deletePromises.length > 0) {
         await Promise.all(deletePromises);
       }
     } catch (err) {
       console.log('Storage cleanup error or no files:', err);
     }
   };

   const handleDelete = useCallback(async (id: string, skipConfirm: boolean = false) => {
      if (!skipConfirm && !window.confirm(activeTab === 'Corbeille' ? 'Permanently delete?' : 'Move to trash?')) return;
     
     try {
       setIsLoading(true);
       if (activeTab === 'Corbeille') {
         await permanentDeleteQuotes([id]);
         await deleteEstimationChat(id);
       } else {
         await moveQuotesToTrash([id]);
       }
       
       clearCache(activeTab);
       if (activeTab !== 'Corbeille') clearCache('Corbeille');
       
        if (activeTab === 'Corbeille') {
          updateCountsLocally('Corbeille', null, 1, estimations.find(e => e.id === id)?.totalClient || 0);
        } else {
          updateCountsLocally(activeTab, 'Corbeille', 1, estimations.find(e => e.id === id)?.totalClient || 0);
        }
        setEstimations(prev => {
          const updated = prev.filter(est => est.id !== id);
          if (updated.length === 0) {
            const countKey = estimationToStatus[activeTab] as keyof typeof serverTabCounts;
            if (serverTabCounts[countKey] > 1) {
              fetchPage(currentPage, activeTab, lastDocIds[currentPage] || null);
            }
          }
          return updated;
        });
     } catch (error) {
       console.error('Error during deletion:', error);
        alert('An error occurred during deletion.');
     } finally {
       setIsLoading(false);
     }
   }, [activeTab, estimations, clearCache, updateCountsLocally, currentPage, fetchPage, lastDocIds, serverTabCounts]);

   const handleBulkDelete = useCallback(async (skipConfirm: boolean = false) => {
     if (selectedItems.size === 0) return;
      if (!skipConfirm && !window.confirm(`Are you sure you want to delete these ${selectedItems.size} estimations?`)) return;
     
     try {
       setIsLoading(true);
       const ids = Array.from(selectedItems.keys());
       
       if (activeTab === 'Corbeille') {
         await permanentDeleteQuotes(ids);
         for (const id of ids) {
           await deleteEstimationChat(id);
         }
       } else {
         await moveQuotesToTrash(ids);
       }
       
       clearCache(activeTab);
       if (activeTab !== 'Corbeille') clearCache('Corbeille');
        if (activeTab === 'Corbeille') {
          const totalValue = Array.from(selectedItems.values()).reduce((sum, e) => sum + (e.totalClient || 0), 0);
          updateCountsLocally('Corbeille', null, ids.length, totalValue);
        } else {
          const totalValue = Array.from(selectedItems.values()).reduce((sum, e) => sum + (e.totalClient || 0), 0);
          updateCountsLocally(activeTab, 'Corbeille', ids.length, totalValue);
        }
        setSelectedItems(new Map());
        setEstimations(prev => {
          const updated = prev.filter(est => !ids.includes(est.id));
          if (updated.length === 0) {
            const countKey = estimationToStatus[activeTab] as keyof typeof serverTabCounts;
            if (serverTabCounts[countKey] > ids.length) {
              fetchPage(currentPage, activeTab, lastDocIds[currentPage] || null);
            }
          }
          return updated;
        });
     } catch (error) {
       console.error('Error during bulk deletion:', error);
        alert('An error occurred during bulk deletion.');
     } finally {
       setIsLoading(false);
     }
   }, [selectedItems, activeTab, clearCache, updateCountsLocally, currentPage, fetchPage, lastDocIds, serverTabCounts]);

    const handleResync = useCallback(async () => {
      setIsResyncConfirming(true);
    }, []);

    const confirmResync = useCallback(async () => {
      setIsResyncConfirming(false);
      setIsLoading(true);
      try {
        const result = await calibrateQuoteStats();
        if (result) {
          setServerTabCounts(result.counts);
          setServerTabSums(result.sums);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }, []);

     const handleEmptyTrash = useCallback(async () => {
       if (!isAdmin) return;
       // Show styled confirmation modal instead of window.confirm
       setIsEmptyTrashConfirming(true);
     }, [isAdmin]);

     const confirmEmptyTrash = useCallback(async () => {
       setIsEmptyTrashConfirming(false);
       try {
         setIsLoading(true);
         await permanentDeleteAllTrashedQuotes();
         clearCache('Corbeille');
         if (activeTab === 'Corbeille') {
           setEstimations([]);
         }
         setServerTabCounts(prev => ({ ...prev, trashed: 0 }));
       } catch (error) {
         console.error('Error emptying trash:', error);
       } finally {
         setIsLoading(false);
       }
     }, [activeTab, clearCache]);

  return (
    <div className="min-h-screen px-3 py-4 md:p-6 overflow-x-hidden bg-transparent">
      <div className="max-w-7xl mx-auto w-full">

        {!isFournisseur && (
          <div className="flex justify-end mb-6">
            <div className="relative flex bg-slate-100/80 p-1 gap-2 rounded-2xl border border-slate-200 w-full md:w-auto overflow-hidden shadow-sm">
              <button
                onClick={() => setEstimationMode('vente')}
                className={cn(
                  "relative flex-1 md:flex-none flex items-center justify-center gap-2 md:gap-3 px-6 h-10 text-[10px] md:text-xs font-bold transition-all z-20 uppercase tracking-widest",
                  estimationMode === 'vente' ? "text-white" : "text-slate-400 hover:text-slate-700"
                )}
              >
                {estimationMode === 'vente' && (
                  <motion.span
                    layoutId="estimation-mode-bubble"
                    className="absolute inset-0 z-10 bg-[#131E3F] rounded-xl shadow-lg border border-[#131E3F]"
                    transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                  />
                )}
                <ShoppingBag className={cn("w-4 h-4 z-20 transition-colors", estimationMode === 'vente' ? "text-[#c6ff00]" : "text-slate-400")} />
                <span className="z-20 whitespace-nowrap">{t('admin.saleMode')}</span>
              </button>
              <button
                onClick={() => setEstimationMode('location')}
                className={cn(
                  "relative flex-1 md:flex-none flex items-center justify-center gap-2 md:gap-3 px-6 h-10 text-[10px] md:text-xs font-bold transition-all z-20 uppercase tracking-widest",
                  estimationMode === 'location' ? "text-white" : "text-slate-400 hover:text-slate-700"
                )}
              >
                {estimationMode === 'location' && (
                  <motion.span
                    layoutId="estimation-mode-bubble"
                    className="absolute inset-0 z-10 bg-[#131E3F] rounded-xl shadow-lg border border-[#131E3F]"
                    transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                  />
                )}
                <Calendar className={cn("w-4 h-4 z-20 transition-colors", estimationMode === 'location' ? "text-[#4fc3f7]" : "text-slate-400")} />
                <span className="z-20 whitespace-nowrap">{t('admin.rentalMode')}</span>
              </button>
            </div>
          </div>
        )}

        <TabNavigation
          activeTab={activeTab}
          onTabChange={handleTabChange}
          userRole={userRole}
          tabCounts={tabCounts}
          estimationMode={estimationMode}
        />

<SearchHeader
           searchTerm={searchTerm}
           onSearchChange={setSearchTerm}
           total={totalValue}
           selectedCount={selectedItems.size}
           activeTab={activeTab}
           onOpenMobileDrawer={() => setIsMobileDrawerOpen(true)}
           isFournisseur={isFournisseur}
           isAdmin={isAdmin}
           onEmptyTrash={handleEmptyTrash}
            onResync={handleResync}
           onSelectAll={handleSelectAll}
           isAllSelected={paginatedEstimations.length > 0 && selectedItems.size === paginatedEstimations.length}
           sortField={sortField}
           sortDirection={sortDirection}
           onSortChange={handleSortChange}
         />

        <div className="flex flex-col gap-4 pb-28 md:pb-0">
<EstimationTable
                   estimations={paginatedEstimations}
                   selectedIds={selectedIds}
                   onSelect={handleSelect}
                   onSelectAll={handleSelectAll}
                   activeTab={activeTab}
                   onStatusClick={handleStatusTransition}
                   onBulkStatusClick={handleBulkStatusTransition}
                   onSupplierClick={handleSupplierClick}
                   onSupplierAction={handleSupplierAction}
                   onMarkAsDelivered={handleMarkAsDelivered}
                   onEdit={handleEdit}
                   onDelete={handleDelete}
                   onBulkDelete={handleBulkDelete}
                   onRestore={handleRestore}
                   onBulkRestore={handleBulkRestore}
                   onArchive={handleArchive}
                   onToggleLock={handleToggleLock}
                   onUpdateTracking={handleUpdateTracking}
                   onViewMessage={handleViewMessage}
                   isFournisseur={isFournisseur}
                   userRole={userRole}
                   currentUser={currentUser}
                   suppliers={suppliers}
                   unreadCounts={unreadCounts}
                   loading={isLoading}
                   exitingIds={exitingIds}
                   bulkProgress={bulkProgress}
                   estimationMode={estimationMode}
                   sortField={sortField}
                   sortDirection={sortDirection}
                   onSortChange={handleSortChange}
                 />

          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={tabCounts[activeTab] || 0}
              itemsPerPage={itemsPerPage}
            />
          )}
        </div>
      </div>

      <TransmitModal
        isOpen={isSupplierPanelOpen}
        onClose={() => setIsSupplierPanelOpen(false)}
        onConfirm={handleSupplierConfirm}
      />

      {/* RentalTreatmentModal removed — the Treat flow now goes through the Edit window (DetailsApp) */}

      <SimpleMessagePopup
        isOpen={isMessagePopupOpen}
        onClose={() => setIsMessagePopupOpen(false)}
        title={popupData.title}
        message={popupData.message}
        subtitle={popupData.subtitle}
        variant={popupData.variant}
      />



      {isDetailsOpen && selectedEstimation && (
        <div className="fixed inset-0 z-[100]">
          <DetailsApp 
            initialEstimation={selectedEstimation} 
            allProducts={allProducts}
            allProductSpecs={allProductSpecs}
            startOpen={true}
            autoEditMode={autoEditMode}
            suppliers={suppliers}
            onClose={() => { setIsDetailsOpen(false); setAutoEditMode(false); }}
            onSave={async (updatedQuote) => {
              setFullQuotes(prev => ({ ...prev, [updatedQuote.id]: updatedQuote }));
              setSelectedEstimation(updatedQuote);
              // Only clear affected tab cache instead of everything
              clearCache(activeTab);
              const startId = lastDocIds[currentPage];
              await fetchPage(currentPage, activeTab, startId, estimationMode);
            }}
            onStatusChange={async (newStatus) => {
              setAutoEditMode(false);
              setIsDetailsOpen(false);
              setSelectedEstimation(null);
              clearCache(activeTab);
              if (newStatus) clearCache(newStatus as EstimationStatus);
              const startId = lastDocIds[currentPage];
              await fetchPage(currentPage, activeTab, startId, estimationMode);
               // If we were on "En attente" and moved to "Traité", switch the tab
              if (activeTab === 'En attente' && newStatus === 'processed') {
                setActiveTab('Traité' as EstimationStatus);
              }
            }}
          />
        </div>
      )}

      <MobileFilterDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        tabCounts={tabCounts}
        userRole={userRole}
      />

      {/* MODAL CONFIRMATION EMPTY TRASH */}
      {isEmptyTrashConfirming && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setIsEmptyTrashConfirming(false)}
          />
          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden">
            {/* Header rouge */}
            <div className="bg-red-600 px-6 pt-6 pb-4 flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-black text-lg leading-tight">{t('estimation.emptyTrash')}</h3>
                <p className="text-red-100 text-sm mt-1">{t('estimation.irreversibleAction')}</p>
              </div>
            </div>
            {/* Body */}
            <div className="px-6 py-5">
              <p className="text-zinc-700 text-sm leading-relaxed">
                {t('estimation.emptyTrashDesc')}
              </p>
              <p className="text-zinc-500 text-xs mt-2 leading-relaxed">
                {t('estimation.emptyTrashWarning')}
              </p>
            </div>
            {/* Footer */}
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setIsEmptyTrashConfirming(false)}
                className="flex-1 px-4 py-3 rounded-xl border-2 border-zinc-200 text-zinc-700 font-bold text-sm hover:bg-zinc-50 transition-all"
              >
                {t('estimation.cancel')}
              </button>
              <button
                onClick={confirmEmptyTrash}
                className="flex-1 px-4 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-sm transition-all shadow-lg shadow-red-200 flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                </svg>
                {t('estimation.emptyTrash')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMATION RESYNC */}
      {isResyncConfirming && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setIsResyncConfirming(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden">
            <div className="bg-amber-500 px-6 pt-6 pb-4 flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <Calculator className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-black text-lg leading-tight">Synchroniser les données</h3>
                <p className="text-amber-100 text-sm mt-1">Cette opération est irréversible</p>
              </div>
            </div>
            <div className="px-6 py-5">
              <p className="text-zinc-700 text-sm leading-relaxed">
                Toutes les statistiques seront recalculées à partir des données Firestore. Les compteurs actuels seront remplacés.
              </p>
              <p className="text-amber-600 text-xs mt-3 leading-relaxed font-semibold flex items-center gap-1.5">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                </svg>
                Action potentiellement lourde selon le volume de données
              </p>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setIsResyncConfirming(false)}
                className="flex-1 px-4 py-3 rounded-xl border-2 border-zinc-200 text-zinc-700 font-bold text-sm hover:bg-zinc-50 transition-all"
              >
                Annuler
              </button>
              <button
                onClick={confirmResync}
                className="flex-1 px-4 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-sm transition-all shadow-lg shadow-amber-200 flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
                </svg>
                Synchroniser
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
