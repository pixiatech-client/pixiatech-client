'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TabNavigation, SummaryCard } from '../components/Layout';
import dynamic from 'next/dynamic';
import { SearchHeader, EstimationTable } from '../components/Table';
import { Pagination } from '@/components/ui/Pagination';
import { TransmitModal, SimpleMessagePopup, ReturnReasonPopup } from '@/application/admin/estimations/components/TransmitModal';

const DetailsApp = dynamic(() => import('../details/App'), {
  loading: () => <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[110]"><div className="w-10 h-10 border-4 border-[#95d230] border-t-transparent rounded-full animate-spin" /></div>,
});
import { EstimationDrawer } from '../components/EstimationDrawer';
import { MobileFilterDrawer } from '../components/MobileFilterDrawer';

import { X } from 'lucide-react';
import { EstimationStatus, Estimation, TrackingInfo } from '../types';
import { getQuoteRequests, getPaginatedQuotes, getQuoteCounts, updateQuoteStatus, moveQuotesToTrash, restoreQuotes, permanentDeleteQuotes, permanentDeleteAllTrashedQuotes, getUsers, getQuoteRequest, getProducts, getProductSpecs, calibrateQuoteStats } from '@/app/admin/actions';
import type { QuoteRequest, UserProfile, Product, ProductSpec } from '@/lib/types';
import { hasPermission, canPermanentlyDelete } from '@/lib/permissions';
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
};

const estimationToStatus: Record<EstimationStatus, string> = {
  'En attente': 'pending',
  'Traité': 'processed',
  'Fournisseur': 'in_progress',
  'Livraison': 'sent',
  'Archivé': 'archived',
  'Corbeille': 'trashed',
  'Retourné': 'returned',
};


function quoteToEstimation(q: QuoteRequest): Estimation {
  const rawDate = q.createdAt ? (q.createdAt instanceof Date ? q.createdAt : new Date(q.createdAt)) : null;
  const isValidDate = rawDate && !isNaN(rawDate.getTime());
  const estStatus = statusToEstimation[q.status] || 'En attente';

  // Use pre-calculated totalQuote if available, otherwise recalculate
  const totalClient = q.totalQuote || (q.products?.reduce((sum, p) => sum + (p.lineTotal || 0), 0) || 0) + (q.deliveryCost || 0) + (q.installationCost || 0);
  const idShort = q.id.slice(0, 8).toUpperCase();

   return {
     id: q.id,
     number: q.number || `DEV-${idShort}`,
     client: typeof q.client === 'string' ? q.client : (q.client?.companyName || (q.client as any)?.name || 'Client Inconnu'),
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
  const [suppliers, setSuppliers] = useState<UserProfile[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [fullQuotes, setFullQuotes] = useState<Record<string, QuoteRequest>>({});
  const [isMessagePopupOpen, setIsMessagePopupOpen] = useState(false);
  const [popupData, setPopupData] = useState({ title: '', message: '', subtitle: '', variant: 'default' as 'default' | 'alert' });
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isEmptyTrashConfirming, setIsEmptyTrashConfirming] = useState(false);
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

  // Pour le fournisseur: afficher "Fournisseur" et "Retourné" par défaut
  const defaultTab = isFournisseur ? 'Fournisseur' : 'En attente';
  const [activeTab, setActiveTab] = useState<EstimationStatus>(defaultTab as EstimationStatus);

   // Current user object for chat
   const currentUser = useMemo(() => ({
     uid: userId || userName || 'unknown',
     email: '',
     displayName: userName || (userRole === 'admin' ? 'Admin' : userRole === 'commercial' ? 'Commercial' : 'Fournisseur'),
     photoURL: '',
     role: userRole === 'fournisseur' ? 'prestataire' : (userRole as any),
   }), [userId, userName, userRole]);

   // Helper to open the global MiniChat from any dashboard action
   const openChat = useCallback((chatId: string) => {
     window.dispatchEvent(new CustomEvent('open-chat', { detail: { chatId } }));
   }, []);

  const itemsPerPage = 6;

  const clearCache = useCallback((tab?: EstimationStatus) => {
    if (tab) {
      setPageCache(prev => {
        const next = { ...prev };
        delete next[tab];
        return next;
      });
    } else {
      setPageCache({});
    }
  }, []);

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

  const fetchPage = useCallback(async (page: number, currentTab: EstimationStatus, startId: string | null) => {
    // Check cache first
    const tabCache = pageCache[currentTab] || {};
    if (tabCache[page]) {
      setEstimations(tabCache[page].estimations);
      return;
    }

    setIsLoading(true);
    // Clear current estimations to avoid showing old data from previous tab
    setEstimations([]);
    try {
      const statusKey = estimationToStatus[currentTab as string];
      const { requests, lastId } = await getPaginatedQuotes({
        status: statusKey,
        limit: itemsPerPage,
        startAfterId: startId,
        supplierId: isFournisseur ? (userId ?? null) : undefined
      });
      
      const newEstimations = requests.map((q: any) => quoteToEstimation(q));
      
      // Update cache
      setPageCache(prev => ({
        ...prev,
        [currentTab]: {
          ...(prev[currentTab] || {}),
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
  }, [isFournisseur, userId, itemsPerPage]);

  // Load suppliers and counts separately to avoid redundant calls during pagination
  useEffect(() => {
    const loadInitialData = async () => {
      if (!userId) return;
      
      try {
        // Phase 1 perf: only load stats at startup — products/specs load lazily on detail open
        const statsResult = await getQuoteCounts(isFournisseur ? (userId ?? null) : null);
        
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
  }, [isAdmin, isCommercial, isFournisseur, userId, userName]);

  useEffect(() => {
    setLastDocIds({ 1: null });
    setCurrentPage(1);
    fetchPage(1, activeTab, null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  useEffect(() => {
    const startId = lastDocIds[currentPage];
    fetchPage(currentPage, activeTab, startId);
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
       REGLES METIER - Validation des transitions
       Cf. README-METIER.md Section 3.3
       ============================================ */
    
    const validateStatusTransition = (
      currentStatus: EstimationStatus,
      targetStatus: EstimationStatus,
      estimation: Estimation,
      userRole: string
    ): { valid: boolean; error?: string } => {
      
      // Règle #1: Impossible de passer à 'Traité' sans fournisseur (Sauf pour l'Admin)
      if (currentStatus === 'En attente' && targetStatus === 'Traité') {
        if (!estimation.supplierId && !estimation.supplier && userRole !== 'admin') {
          return { valid: false, error: 'Veuillez ASSIGNER UN FOURNISSEUR avant de traiter cette estimation' };
        }
      }
      
      // Règle #2: Impossible de passer à 'Livraison' sans trackingNumber + deliveryDate
      if (currentStatus === 'Fournisseur' && targetStatus === 'Livraison') {
        if (!estimation.trackingNumber || !estimation.trackingInfo?.deliveryDate) {
          return { valid: false, error: 'Veuillez saisir le NUMÉRO DE SUIVI et la DATE DE LIVRAISON avant de passer en livraison' };
        }
      }
      
      // Règle #3: Seul ADMIN peut supprimer définitivement depuis Corbeille
      if (currentStatus === 'Corbeille' && targetStatus === 'En attente') {
        if (userRole !== 'admin') {
          return { valid: false, error: 'Seul l\'ADMINISTRATEUR peut restaurer depuis la Corbeille' };
        }
      }
      
      // Règle #4: Pas de retour automatique vers En attente depuis Livraison
      if (currentStatus === 'Livraison' && targetStatus === 'En attente') {
        return { valid: false, error: 'Transition non autorisée: impossible de retourner vers "En attente" depuis "Livraison"' };
      }
      
      // Règle #5: Seul l'ADMIN peut supprimer définitivement
      if (targetStatus === 'Corbeille' && currentStatus === 'Corbeille') {
        if (userRole !== 'admin') {
          return { valid: false, error: 'Seul l\'ADMINISTRATEUR peut supprimer définitivement' };
        }
      }

      
      return { valid: true };
    };

    const handleStatusTransition = useCallback(async (id: string) => {
      const est = estimations.find(e => e.id === id);
      if (!est) return;

      let nextStatus: EstimationStatus = est.status;

      // 1. EN ATTENTE -> TRAITÉ (Action: Check icon)
      if (est.status === 'En attente') {
        nextStatus = 'Traité';
      } 
      // 2. TRAITÉ -> FOURNISSEUR (Action: Send icon)
      else if (est.status === 'Traité' || est.status === 'Retourné') {
        setActiveEstimationId(id);
        setIsSupplierPanelOpen(true); // Ouvre la modale de transmission
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

      // Appliquer les règles métier avant transition
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
        // Capture "traité par" lors du premier passage En attente → Traité
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
        
        // Changer automatiquement l'onglet après transition
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
          title: 'Motif du Retour',
          message: est.returnReason || quoteToUse?.returnReason || 'Aucun motif précisé.',
          subtitle: `Réf: ${est.number}`,
          variant: 'alert'
        });
      } else {
        setPopupData({
          title: 'Instructions Fournisseur',
          message: est.supplierNotes || quoteToUse?.supplierNotes || 'Aucune instruction technique.',
          subtitle: `Réf: ${est.number}`,
          variant: 'default'
        });
      }
      setIsMessagePopupOpen(true);
    }, [estimations, fullQuotes]);

    const handleUpdateTracking = useCallback((id: string, info: TrackingInfo) => {
      updateQuoteStatus(id, { trackingNumber: info.number }).then(() => {
        setEstimations(prev => prev.map(est =>
          est.id === id ? { ...est, trackingInfo: info, trackingNumber: info.number } : est
        ));
      });
    }, []);

// Règle #3: Seul ADMIN peut restaurer depuis Corbeille
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
        // Après restauration, aller vers l'onglet En attente
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

   // handleArchive: archive = verrouiller (save previousStatus), désarchiver = restaurer statut précédent
   const handleArchive = useCallback(async (id: string) => {
     const est = estimations.find(e => e.id === id);
     if (!est) return;
     try {
       if (est.status === 'Archivé') {
         // Désarchiver: restaure le statut métier précédent (sans changer le workflow)
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
         alert('Erreur: aucune estimation trouvée');
         setIsSupplierPanelOpen(false);
         return;
       }

       const failedIds: string[] = [];
       setIsLoading(true);

       try {
         for (const activeEstimation of itemsToProcess) {
           if (currentUser.role !== 'admin' && activeEstimation.treatedBy && currentUser.uid !== activeEstimation.treatedBy) {
             alert(`Seul le commercial responsable peut transférer l'estimation ${activeEstimation.number} au fournisseur.`);
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
         alert('Erreur lors du transfert');
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
                 : (data?.subject || data?.reason || 'Aucun motif précisé')
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
               : (data?.subject || data?.reason || 'Aucun motif précisé');
               
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

          // Changer d'onglet selon l'action si ce n'est pas un fournisseur
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
        await updateQuoteStatus(id, { status: 'processed' as any });
        setEstimations(prev => prev.map(est =>
          est.id === id ? { ...est, status: 'Archivé' as EstimationStatus, isLocked: true } : est
        ));
        // Changer vers l'onglet Archive
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
     if (!skipConfirm && !window.confirm(activeTab === 'Corbeille' ? 'Supprimer définitivement ?' : 'Mettre à la corbeille ?')) return;
     
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
       alert('Une erreur est survenue lors de la suppression.');
     } finally {
       setIsLoading(false);
     }
   }, [activeTab, estimations, clearCache, updateCountsLocally, currentPage, fetchPage, lastDocIds, serverTabCounts]);

   const handleBulkDelete = useCallback(async (skipConfirm: boolean = false) => {
     if (selectedItems.size === 0) return;
     if (!skipConfirm && !window.confirm(`Voulez-vous vraiment supprimer ces ${selectedItems.size} estimations ?`)) return;
     
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
       alert('Une erreur est survenue lors de la suppression groupée.');
     } finally {
       setIsLoading(false);
     }
   }, [selectedItems, activeTab, clearCache, updateCountsLocally, currentPage, fetchPage, lastDocIds, serverTabCounts]);

   const handleResync = useCallback(async () => {
    if (!window.confirm("Voulez-vous forcer le recalcul complet des statistiques ? Cette opération est lourde et écrasera les compteurs persistés avec les valeurs réelles de Firestore.")) return;
    setIsLoading(true);
    try {
      const result = await calibrateQuoteStats();
      if (result) {
        setServerTabCounts(result.counts);
        setServerTabSums(result.sums);
        alert("Recalcul terminé avec succès.");
      }
    } catch (e) {
      console.error(e);
      alert("Erreur lors du recalcul.");
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
        <TabNavigation
          activeTab={activeTab}
          onTabChange={handleTabChange}
          userRole={userRole}
          tabCounts={tabCounts}
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
          onResync={isAdmin ? handleResync : undefined}
          onSelectAll={handleSelectAll}
          isAllSelected={paginatedEstimations.length > 0 && selectedItems.size === paginatedEstimations.length}
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
            suppliers={suppliers}
            onClose={() => setIsDetailsOpen(false)}
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

      {/* MODAL CONFIRMATION VIDER LA CORBEILLE */}
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
                <h3 className="text-white font-black text-lg leading-tight">Vider la corbeille</h3>
                <p className="text-red-100 text-sm mt-1">Action irréversible</p>
              </div>
            </div>
            {/* Body */}
            <div className="px-6 py-5">
              <p className="text-zinc-700 text-sm leading-relaxed">
                Vous êtes sur le point de <span className="font-bold text-red-600">supprimer définitivement</span> toutes les estimations dans la corbeille.
              </p>
              <p className="text-zinc-500 text-xs mt-2 leading-relaxed">
                Cette action est <strong>irréversible</strong>. Les données supprimées ne pourront pas être récupérées.
              </p>
            </div>
            {/* Footer */}
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setIsEmptyTrashConfirming(false)}
                className="flex-1 px-4 py-3 rounded-xl border-2 border-zinc-200 text-zinc-700 font-bold text-sm hover:bg-zinc-50 transition-all"
              >
                Annuler
              </button>
              <button
                onClick={confirmEmptyTrash}
                className="flex-1 px-4 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-sm transition-all shadow-lg shadow-red-200 flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                </svg>
                Vider la corbeille
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
