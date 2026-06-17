'use client';
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  Trash2, 
  Archive, 
  Users, 
  Package, 
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  MoreHorizontal,
  RefreshCw,
  Calendar,
  ShoppingBag,
  AlertTriangle,
  Search,
  Send,
  Truck,
  Undo2,
  Building2,
  Phone,
  Mail,
  MapPin,
  FileText,
  StickyNote
} from 'lucide-react';
import { CustomSelect } from '@/components/ui/custom-select';
import { motion, AnimatePresence } from 'framer-motion';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, where, onSnapshot, limit } from 'firebase/firestore';
import { QuoteStatus } from './types';
import { moveQuotesToTrash, updateQuoteStatus, resetPerformancePoints, resetConfiguratorStats, getSettings, getQuoteCounts, getPaginatedQuotes } from '@/app/admin/actions';
import { useToast } from '@/hooks/use-toast';
import { X, Check } from 'lucide-react';
import { translateStatus } from '../../../../lib/utils';
import { useI18n, IntlHelpers } from '@/lib/i18n';
import { useAdminT } from '@/hooks/useAdminT';

const DAYS_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
const MONTH_KEYS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'] as const;

const formatDate = (date: Date | null | undefined, locale: string) => {
  if (!date) return '';
  try {
    return date.toLocaleDateString(locale === 'en' ? 'en-US' : 'fr-FR', { day: 'numeric', month: 'short' });
  } catch {
    return '';
  }
};

const formatDateLong = (date: Date | null | undefined, locale: string) => {
  if (!date) return '';
  try {
    return date.toLocaleDateString(locale === 'en' ? 'en-US' : 'fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return '';
  }
};

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

interface DashboardProps {
  theme: 'light' | 'dark';
  onOpenChat: () => void;
  userName?: string;
  userAvatar?: string;
  userRole?: string;
  rawRole?: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ theme, onOpenChat, userName, userAvatar, userRole, rawRole }) => {
  const { t, locale } = useI18n();
  const { t: adt } = useAdminT();
  const { user, userProfile } = useUser();
  const router = useRouter();
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });
  const [typeFilter, setTypeFilter] = useState<'all' | 'sale' | 'rental'>('all');
  const [statsTypeFilter, setStatsTypeFilter] = useState<'all' | 'sale' | 'rental'>('all');
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | 'ALL' | 'FOURNISSEUR'>('ALL');
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  const tableLastIdsRef = useRef<Record<number, string | null>>({});

  React.useEffect(() => {
    setCurrentPage(1);
    tableLastIdsRef.current = {};
  }, [statusFilter, typeFilter, selectedDate, dateRange]);

  useEffect(() => {
    if (isSearchOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [isSearchOpen]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isPerformanceMenuOpen, setIsPerformanceMenuOpen] = useState(false);
  const [performancePeriod, setPerformancePeriod] = useState<'1-month' | '2-months' | '3-months' | 'year'>('1-month');
  const [confirmDialog, setConfirmDialog] = useState<{ message: string; onConfirm: () => void } | null>(null);
  const [detailQuote, setDetailQuote] = useState<any>(null);
  const [performanceSettings, setPerformanceSettings] = useState<any>(null);
  const { toast } = useToast();

  const [statsCounts, setStatsCounts] = useState<Record<string, number>>({});
  const [statsSums, setStatsSums] = useState<Record<string, number>>({});

  useEffect(() => {
    getQuoteCounts(undefined, statsTypeFilter === 'all' ? undefined : statsTypeFilter).then(r => {
      setStatsCounts(r.counts);
      setStatsSums(r.sums);
    });
  }, [statsTypeFilter]);

  // Server-paginated table data — only page 1 loaded on mount
  const itemsPerPage = 5;
  const [tableQuotes, setTableQuotes] = useState<any[]>([]);
  const [tableLoading, setTableLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fetchTablePage = async () => {
      setTableLoading(true);
      try {
        const startAfterId = currentPage === 1 ? null : (tableLastIdsRef.current[currentPage - 1] ?? null);
        if (currentPage > 1 && !startAfterId) return;

        const statusKey = statusFilter === 'ALL' || statusFilter === 'FOURNISSEUR' ? undefined : statusFilter;
        const txType = typeFilter === 'all' ? undefined : typeFilter;

        const result = await getPaginatedQuotes({
          status: statusKey,
          limit: itemsPerPage,
          startAfterId,
          transactionType: txType,
        });

        if (!cancelled) {
          setTableQuotes(result.requests);
          tableLastIdsRef.current[currentPage] = result.lastId;
        }
      } catch (e) {
        console.error('Failed to fetch table page:', e);
      } finally {
        if (!cancelled) setTableLoading(false);
      }
    };
    fetchTablePage();
    return () => { cancelled = true; };
  }, [currentPage, statusFilter, typeFilter]);

  React.useEffect(() => {
    getSettings().then(setPerformanceSettings);
  }, []);

  const handleResetPerformance = async () => {
    const res = await resetPerformancePoints();
    if (res.success) {
      toast({
        title: t('admin.resetPerformanceSuccess', { defaultValue: 'Scores reset' }),
        description: t('admin.resetPerformanceDesc'),
      });
      const newSettings = await getSettings();
      setPerformanceSettings(newSettings);
      setIsPerformanceMenuOpen(false);
    } else {
      toast({
        title: t('common.error'),
        description: res.error,
        variant: 'destructive'
      });
    }
  };

  const handleResetConfiguratorStats = async () => {
    const res = await resetConfiguratorStats();
    if (res.success) {
      toast({
        title: t('admin.resetConfiguratorSuccess', { defaultValue: 'Counters reset' }),
        description: t('admin.resetConfiguratorDesc'),
      });
      const newSettings = await getSettings();
      setPerformanceSettings(newSettings);
    } else {
      toast({
        title: t('common.error'),
        description: res.error,
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async (quoteId: string) => {
    setIsDeleting(quoteId);
    try {
      await moveQuotesToTrash([quoteId]);
      toast({
        title: t('admin.deleteQuoteSuccess'),
        description: t('admin.deleteQuoteDesc'),
      });
      router.refresh();
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('admin.deleteQuoteError'),
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const handleRevertToPending = async (quoteId: string) => {
    try {
      await updateQuoteStatus(quoteId, { status: 'pending' });
      toast({
        title: 'Statut modifié',
        description: 'L\'estimation est repassée en « En attente ».',
      });
      setDetailQuote(null);
      router.refresh();
    } catch {
      toast({
        title: t('common.error'),
        variant: 'destructive',
      });
    }
  };
  const isDark = theme === 'dark';

  const firestore = useFirestore();

  // Fetch real data from Firestore
  const quotesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'quotes'), orderBy('createdAt', 'desc'), limit(12)) : null, [firestore]);
  const { data: allQuotesRaw } = useCollection<any>(quotesQuery, { suppressPermissionError: true });

  const usersQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'users'), limit(200)) : null, [firestore]);
  const { data: allUsers } = useCollection<any>(usersQuery, { suppressPermissionError: true });

  const productsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'products'), limit(200)) : null, [firestore]);
  const { data: allProducts } = useCollection<any>(productsQuery, { suppressPermissionError: true });

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const statusLabels: Record<string, string> = {
    pending: 'En attente', processed: 'Traitée', trashed: 'Corbeille',
    archived: 'Archivée', in_progress: 'En cours', sent: 'Envoyée',
    delivered: 'Livrée', returned: 'Retournée', rented: 'Louée',
  };

  const configuratorStats = useMemo(() => {
    if (!allQuotesRaw) return { guided: 0, lumi: 0 };
    
    const resetDateStr = performanceSettings?.configuratorStatsResetAt;
    const resetDate = resetDateStr ? new Date(resetDateStr) : new Date(0);

    const filteredQuotes = allQuotesRaw.filter(q => {
      const qDate = q.createdAt?.toDate ? q.createdAt.toDate() : new Date(q.createdAt);
      return qDate >= resetDate;
    });

    return {
      guided: filteredQuotes.filter(q => q.configuratorType === 'guided').length,
      lumi: filteredQuotes.filter(q => q.configuratorType === 'lumi').length,
    };
  }, [allQuotesRaw, performanceSettings]);

  const topCommercials = useMemo(() => {
    if (!allUsers || !allQuotesRaw) return [];
    
    const commercials = allUsers.filter(u => u.role === 'commercial');
    const resetDateStr = performanceSettings?.performanceResetAt;
    const resetDate = resetDateStr ? new Date(resetDateStr) : new Date(0);
    
    const now = new Date();
    
    const scores = commercials.map(u => {
      const processedCount = allQuotesRaw.filter(q => {
        if (q.status !== 'processed' && q.status !== 'delivered') return false;
        
        // Use history for precise tracking of who processed it
        const processAction = q.history?.find((h: any) => 
          h.userId === u.uid && 
          (h.action?.toLowerCase().includes('statut') || h.action?.toLowerCase().includes('traité')) &&
          (h.details?.toLowerCase().includes('traité') || h.details?.toLowerCase().includes('processed'))
        );

        if (!processAction) return false;

        const actionDate = processAction.timestamp?.toDate ? processAction.timestamp.toDate() : new Date(processAction.timestamp);
        if (actionDate < resetDate) return false;

        if (performancePeriod === '1-month') {
          return actionDate.getMonth() === now.getMonth() && actionDate.getFullYear() === now.getFullYear();
        }
        if (performancePeriod === '2-months') {
          const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          return actionDate >= twoMonthsAgo;
        }
        if (performancePeriod === '3-months') {
          const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
          return actionDate >= threeMonthsAgo;
        }
        if (performancePeriod === 'year') {
          return actionDate.getFullYear() === now.getFullYear();
        }
        return false;
      }).length;

      return {
        id: u.uid,
        name: u.displayName,
        avatar: u.photoURL,
        count: processedCount
      };
    });

    const sorted = scores.sort((a, b) => b.count - a.count);
    const maxCount = sorted.find(s => s.count > 0)?.count || 1;
    
    return sorted.slice(0, 5).map(u => ({
      ...u,
      score: u.count > 0 ? Math.min(100, Math.round((u.count / maxCount) * 100)) : 0
    }));
  }, [allUsers, allQuotesRaw, performancePeriod, performanceSettings]);

  // Client-side search on server-paginated data
  const searchedQuotes = useMemo(() => {
    if (!searchQuery.trim()) return tableQuotes;
    const q = searchQuery.toLowerCase();
    return tableQuotes.filter(e =>
      e.id?.toLowerCase().includes(q) ||
      (e.client?.companyName?.toLowerCase() || '').includes(q) ||
      (e.status || '').toLowerCase().includes(q)
    );
  }, [tableQuotes, searchQuery]);

  // Total from persistent stats doc (accurate, not from loaded page)
  const filteredTotal = useMemo(() => {
    if (statusFilter === 'FOURNISSEUR') {
      return Math.max(tableQuotes.length, searchedQuotes.length + 1);
    }
    if (statusFilter === 'ALL') {
      return Object.values(statsCounts).reduce((a, b) => a + b, 0);
    }
    return statsCounts[statusFilter] || 0;
  }, [statusFilter, statsCounts, tableQuotes, searchedQuotes]);

  const totalPages = Math.ceil(filteredTotal / itemsPerPage);

  const counts = useMemo(() => {
    if (!allQuotesRaw) return { all: 0, sale: 0, rental: 0 };
    let baseQuotes = [...allQuotesRaw];
    if (statusFilter !== 'ALL') {
      baseQuotes = baseQuotes.filter(q => q.status === statusFilter);
    }
    if (dateRange.start) {
      const startStr = dateRange.start.toISOString().split('T')[0];
      if (dateRange.end) {
        const endStr = dateRange.end.toISOString().split('T')[0];
        baseQuotes = baseQuotes.filter(q => {
          const qDate = q.createdAt?.toDate ? q.createdAt.toDate().toISOString().split('T')[0] : '';
          return qDate >= startStr && qDate <= endStr;
        });
      } else {
        baseQuotes = baseQuotes.filter(q => {
          const qDate = q.createdAt?.toDate ? q.createdAt.toDate().toISOString().split('T')[0] : '';
          return qDate === startStr;
        });
      }
    } else if (selectedDate) {
      const selectedStr = selectedDate.toISOString().split('T')[0];
      baseQuotes = baseQuotes.filter(q => {
        const qDate = q.createdAt?.toDate ? q.createdAt.toDate().toISOString().split('T')[0] : '';
        return qDate === selectedStr;
      });
    }

    const sale = baseQuotes.filter(q => q.transactionType !== 'rental').length;
    const rental = baseQuotes.filter(q => q.transactionType === 'rental').length;
    return {
      all: baseQuotes.length,
      sale,
      rental
    };
  }, [allQuotesRaw, statusFilter, selectedDate, dateRange]);

  const mobileStats = useMemo(() => {
    if (!allQuotesRaw) return { total: 0, saleCount: 0, saleAmount: 0, rentalCount: 0, rentalAmount: 0 };
    const active = allQuotesRaw.filter(q => q.status !== 'trashed');
    const sales = active.filter(q => q.transactionType !== 'rental');
    const rentals = active.filter(q => q.transactionType === 'rental');
    
    const saleAmount = sales.reduce((sum, q) => sum + (q.totalClient || q.totalQuote || 0), 0);
    const rentalAmount = rentals.reduce((sum, q) => sum + (q.totalClient || q.totalQuote || 0), 0);
    
    return {
      total: active.length,
      saleCount: sales.length,
      saleAmount,
      rentalCount: rentals.length,
      rentalAmount
    };
  }, [allQuotesRaw]);

  const performanceStats = useMemo(() => {
    if (!allQuotesRaw) return { percentage: 0, message: t('common.loading'), treated: 0, total: 0 };
    const totalQuotes = allQuotesRaw.length;
    const treatedQuotes = allQuotesRaw.filter(q => q.status === 'processed' || q.status === 'delivered').length;
    const percentage = totalQuotes > 0 ? Math.round((treatedQuotes / totalQuotes) * 100) : 0;
    const message = percentage >= 60
      ? t('admin.encouragementExcellent')
      : percentage >= 30
        ? t('admin.encouragementGood')
        : t('admin.encouragementLow');
    return { percentage, message, treated: treatedQuotes, total: totalQuotes };
  }, [allQuotesRaw]);

  const ACTIVITY_TRANSLATIONS: Record<string, { fr: string; en: string }> = {
    // French keys → English
    'Mise à jour du statut': { fr: 'Mise à jour du statut', en: 'Status update' },
    'Statut changé vers': { fr: 'Statut changé vers', en: 'Status changed to' },
    'Statut changé pour': { fr: 'Statut changé pour', en: 'Status changed for' },
    'traité': { fr: 'traité', en: 'processed' },
    'traitée': { fr: 'traitée', en: 'processed' },
    'en attente': { fr: 'en attente', en: 'pending' },
    'corbeille': { fr: 'corbeille', en: 'trash' },
    'archivé': { fr: 'archivé', en: 'archived' },
    'livré': { fr: 'livré', en: 'delivered' },
    'envoyé': { fr: 'envoyé', en: 'sent' },
    'retourné': { fr: 'retourné', en: 'returned' },
    'loué': { fr: 'loué', en: 'rented' },
    'payé': { fr: 'payé', en: 'paid' },
    'annulé': { fr: 'annulé', en: 'cancelled' },
    'confirmé': { fr: 'confirmé', en: 'confirmed' },
    'expiré': { fr: 'expiré', en: 'expired' },
    'révisé': { fr: 'révisé', en: 'revised' },
    'accepté': { fr: 'accepté', en: 'accepted' },
    // English keys → French (bidirectional)
    'Status update': { fr: 'Mise à jour du statut', en: 'Status update' },
    'Status changed to': { fr: 'Statut changé vers', en: 'Status changed to' },
    'Status changed for': { fr: 'Statut changé pour', en: 'Status changed for' },
    'Moved to trash': { fr: 'Déplacé vers la corbeille', en: 'Moved to trash' },
    'moved to trash': { fr: 'déplacé vers la corbeille', en: 'moved to trash' },
    'Submitted to supplier': { fr: 'Soumis au fournisseur', en: 'Submitted to supplier' },
    'processed': { fr: 'traité', en: 'processed' },
    'pending': { fr: 'en attente', en: 'pending' },
    'trash': { fr: 'corbeille', en: 'trash' },
    'trashed': { fr: 'corbeille', en: 'trashed' },
    'archived': { fr: 'archivé', en: 'archived' },
    'delivered': { fr: 'livré', en: 'delivered' },
    'sent': { fr: 'envoyé', en: 'sent' },
    'returned': { fr: 'retourné', en: 'returned' },
    'rented': { fr: 'loué', en: 'rented' },
    'paid': { fr: 'payé', en: 'paid' },
    'cancelled': { fr: 'annulé', en: 'cancelled' },
    'confirmed': { fr: 'confirmé', en: 'confirmed' },
    'expired': { fr: 'expiré', en: 'expired' },
    'revised': { fr: 'révisé', en: 'revised' },
    'accepted': { fr: 'accepté', en: 'accepted' },
  };

  function translateActivityText(text: string, targetLocale: string): string {
    if (!text) return text;
    let translated = text;
    const entries = Object.entries(ACTIVITY_TRANSLATIONS)
      .sort((a, b) => b[0].length - a[0].length);
    for (const [phrase, translations] of entries) {
      if (translated.includes(phrase)) {
        const replacement = targetLocale === 'en' ? translations.en : translations.fr;
        if (replacement && replacement !== phrase) {
          translated = translated.replace(phrase, replacement);
        }
      }
    }
    return translated;
  }

  const activityHistory = useMemo(() => {
    if (!allQuotesRaw) return [];
    const history: any[] = [];
    allQuotesRaw.forEach(q => {
      if (q.history) {
        q.history.forEach((h: any) => {
          history.push({
            ...h,
            quoteId: q.id,
            timestamp: h.timestamp?.toDate ? h.timestamp.toDate() : new Date(h.timestamp)
          });
        });
      }
    });
    return history
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 5)
      .map((activity) => ({
        ...activity,
        action: translateActivityText(activity.action || '', locale),
        details: translateActivityText(activity.details || '', locale),
      }));
  }, [allQuotesRaw, locale]);

  // Fetch unread messages
  React.useEffect(() => {
    if (!firestore || !user?.uid) return;
    
    const q = query(
      collection(firestore, 'chats'),
      where('participants', 'array-contains', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      let totalUnread = 0;
      snap.docs.forEach(doc => {
        const data = doc.data();
        if (data.unreadCount && data.unreadCount[user.uid]) {
          totalUnread += data.unreadCount[user.uid];
        }
      });
      setUnreadMessagesCount(totalUnread);
    });

    return () => unsubscribe();
  }, [firestore, user?.uid]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleDateClick = (day: number) => {
    const clickedDate = new Date(currentYear, currentMonth, day);
    
    if (!dateRange.start || (dateRange.start && dateRange.end)) {
      // Start new selection
      setDateRange({ start: clickedDate, end: null });
      setSelectedDate(clickedDate);
    } else if (dateRange.start && !dateRange.end) {
      // Complete the range
      if (clickedDate < dateRange.start) {
        setDateRange({ start: clickedDate, end: dateRange.start });
      } else {
        setDateRange({ start: dateRange.start, end: clickedDate });
      }
      setSelectedDate(null);
    }
  };

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const isDateSelected = (day: number) => {
    const date = new Date(currentYear, currentMonth, day);
    if (selectedDate) return date.toDateString() === selectedDate.toDateString();
    if (dateRange.start) return date.toDateString() === dateRange.start.toDateString();
    return false;
  };

  const isRangeStart = (day: number) => {
    const date = new Date(currentYear, currentMonth, day);
    return dateRange.start && date.toDateString() === dateRange.start.toDateString();
  };

  const isRangeEnd = (day: number) => {
    const date = new Date(currentYear, currentMonth, day);
    return dateRange.end && date.toDateString() === dateRange.end.toDateString();
  };

  const isInRange = (day: number) => {
    if (!dateRange.start || !dateRange.end) return false;
    const date = new Date(currentYear, currentMonth, day);
    return date > dateRange.start && date < dateRange.end;
  };

  const clearDateFilter = () => {
    setSelectedDate(null);
    setDateRange({ start: null, end: null });
  };

  const renderCalendar = () => (
    <div className="bg-black rounded-3xl border border-white/10 p-4 shadow-2xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-white">{IntlHelpers.formatDate(new Date(currentYear, currentMonth, 1), locale, { month: 'long' })} {currentYear}</h3>
        <div className="flex items-center gap-1">
          <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <ChevronLeft className="w-4 h-4 text-white" />
          </button>
          <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <ChevronRight className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-y-2 text-center mb-2">
        {['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map(day => (
          <span key={day} className="text-[10px] font-bold uppercase text-gray-500">{t(`admin.days.${day}`)}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {Array.from({ length: firstDay }, (_, i) => (
          <div key={`empty-${i}`} className="w-7 h-7"></div>
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => (
          <div key={day} className={`flex items-center justify-center relative ${isInRange(day) ? 'bg-blue-600/20' : ''} ${isRangeStart(day) && dateRange.end ? 'rounded-l-lg bg-blue-600/20' : ''} ${isRangeEnd(day) ? 'rounded-r-lg bg-blue-600/20' : ''}`}>
            <button
              onClick={() => handleDateClick(day)}
              className={`w-7 h-7 flex items-center justify-center rounded-lg text-sm font-medium transition-all relative z-10 ${
                isDateSelected(day) || isRangeEnd(day)
                    ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)]'
                    : 'text-gray-400 hover:bg-white/10'
              }`}
            >
              {day}
            </button>
          </div>
        ))}
      </div>
      {(selectedDate || dateRange.start) && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between">
            <div className="text-[10px] text-gray-400">
                <span className="text-white">
                  {dateRange.start && dateRange.end ? (
                    `${t('admin.dateRangeFromTo', { start: IntlHelpers.formatDate(dateRange.start, locale, { day: 'numeric', month: 'short' }), end: IntlHelpers.formatDate(dateRange.end, locale, { day: 'numeric', month: 'short' }) })}`
                  ) : (
                    IntlHelpers.formatDate(selectedDate || dateRange.start, locale, { day: 'numeric', month: 'long', year: 'numeric' })
                  )}
                </span>
            </div>
            <button 
              onClick={clearDateFilter}
              className="text-[10px] text-red-400 hover:text-red-300 transition-colors font-bold uppercase tracking-widest"
            >
              {t('admin.dateFilterReset')}
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row gap-8 min-h-screen text-gray-900 px-3 md:px-0">
      <div className="flex-1 space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">{t('admin.greetingAdmin', { userName: userName || 'User' })}</h1>
            <p className="text-sm mt-1 text-gray-500">
              {t('admin.subtitleToday')}
            </p>
          </div>
        </div>

        {/* Mobile Stats Card - Adapted to Vente & Location */}
        <div className="md:hidden grid grid-cols-2 gap-4">
          {/* Vente Card */}
          <div className="bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent backdrop-blur-md rounded-[2rem] p-5 border border-emerald-500/20 shadow-lg flex flex-col justify-between h-32 relative overflow-hidden">
            <div className="absolute right-0 top-0 translate-x-2 -translate-y-2 opacity-5">
              <ShoppingBag className="w-24 h-24 text-emerald-500" />
            </div>
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
              </div>
              <span className="text-[10px] font-black text-emerald-500/80 dark:text-emerald-400 uppercase tracking-widest">
                {t('admin.sale', { defaultValue: 'Vente' })}
              </span>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">
                {mobileStats.saleCount} {mobileStats.saleCount > 1 ? 'estimations' : 'estimation'}
              </p>
              <p className="text-lg font-black text-gray-900 dark:text-white leading-none">
                {mobileStats.saleAmount.toLocaleString(locale === 'en' ? 'en-US' : 'fr-FR', {
                  style: 'currency',
                  currency: 'EUR',
                  maximumFractionDigits: 0
                })}
              </p>
            </div>
          </div>

          {/* Location Card */}
          <div className="bg-gradient-to-br from-violet-500/10 via-violet-500/5 to-transparent backdrop-blur-md rounded-[2rem] p-5 border border-violet-500/20 shadow-lg flex flex-col justify-between h-32 relative overflow-hidden">
            <div className="absolute right-0 top-0 translate-x-2 -translate-y-2 opacity-5">
              <Calendar className="w-24 h-24 text-violet-500" />
            </div>
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-violet-500/20 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-violet-500 dark:text-violet-400" />
              </div>
              <span className="text-[10px] font-black text-violet-500/80 dark:text-violet-400 uppercase tracking-widest">
                {t('admin.rental', { defaultValue: 'Location' })}
              </span>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">
                {mobileStats.rentalCount} {mobileStats.rentalCount > 1 ? 'estimations' : 'estimation'}
              </p>
              <p className="text-lg font-black text-gray-900 dark:text-white leading-none">
                {mobileStats.rentalAmount.toLocaleString(locale === 'en' ? 'en-US' : 'fr-FR', {
                  style: 'currency',
                  currency: 'EUR',
                  maximumFractionDigits: 0
                })}
              </p>
            </div>
          </div>
        </div>



        <div className="md:hidden">
          {renderCalendar()}
        </div>

        <div className={`p-6 rounded-[2rem] border transition-colors duration-300 ${isDark ? 'bg-[#141414] border-white/5 text-white' : 'bg-white border-gray-200 shadow-sm text-gray-900'}`}>
          <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-6 mb-8">
            <div className="flex flex-wrap xl:flex-nowrap items-center gap-3">
              <h3 className="text-xl font-extrabold tracking-tight">
                {isSearchOpen && searchQuery
                  ? `${t('admin.searchResults') || 'Search results'}`
                  : t('admin.recentEstimations')}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsSearchOpen(!isSearchOpen)}
                  className={`p-2 rounded-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'} hover:bg-theme-sidebar-active-bg transition-colors ${isSearchOpen ? 'bg-theme-sidebar-active-bg text-theme-sidebar-active-text ring-2 ring-theme-sidebar-active-bg' : ''}`}
                >
                  {isSearchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5 text-gray-400" />}
                </button>
                <button 
                  onClick={() => router.push('/admin/quote-requests')}
                  className="xl:hidden text-[10px] font-black uppercase tracking-widest text-blue-500 hover:text-blue-600 transition-colors"
                >
                  {t('admin.viewAll')}
                </button>
              </div>
              <div className="bg-gray-100 dark:bg-white/5 p-1 rounded-2xl border border-gray-200/50 dark:border-white/5 self-start min-w-[450px]">
                {isSearchOpen ? (
                  <div className="w-full">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        ref={searchRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Rechercher par ID, client ou statut..."
                        className="w-full pl-9 pr-8 py-[7px] text-sm rounded-xl border outline-none transition-colors bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-gray-300 dark:bg-black/20 dark:border-white/10 dark:text-white dark:placeholder-gray-500 dark:focus:border-white/20"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    {searchQuery && (
                      <p className={`text-xs mt-1 px-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        {searchedQuotes.length} résultat{searchedQuotes.length !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center">
                    <button
                      onClick={() => setTypeFilter('all')}
                      className={`relative px-4 py-2 text-xs font-bold rounded-xl transition-all duration-300 flex items-center gap-2 ${
                        typeFilter === 'all'
                          ? 'bg-white dark:bg-[#202020] text-blue-500 shadow-sm'
                          : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                      }`}
                    >
                      <span>{t('admin.all', { defaultValue: 'Tous' })}</span>
                      <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold transition-colors ${
                        typeFilter === 'all' ? 'bg-blue-500/10 text-blue-500' : 'bg-gray-200 dark:bg-white/10 text-gray-500'
                      }`}>
                        {counts.all}
                      </span>
                    </button>
                    
                    <button
                      onClick={() => setTypeFilter('sale')}
                      className={`relative px-4 py-2 text-xs font-bold rounded-xl transition-all duration-300 flex items-center gap-2 ${
                        typeFilter === 'sale'
                          ? 'bg-white dark:bg-[#202020] text-emerald-500 shadow-sm'
                          : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                      }`}
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>{t('admin.sale', { defaultValue: 'Vente' })}</span>
                      <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold transition-colors ${
                        typeFilter === 'sale' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-gray-200 dark:bg-white/10 text-gray-500'
                      }`}>
                        {counts.sale}
                      </span>
                    </button>

                    <button
                      onClick={() => setTypeFilter('rental')}
                      className={`relative px-4 py-2 text-xs font-bold rounded-xl transition-all duration-300 flex items-center gap-2 ${
                        typeFilter === 'rental'
                          ? 'bg-white dark:bg-[#202020] text-violet-500 shadow-sm'
                          : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                      }`}
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{t('admin.rental', { defaultValue: 'Location' })}</span>
                      <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold transition-colors ${
                        typeFilter === 'rental' ? 'bg-violet-500/10 text-violet-500' : 'bg-gray-200 dark:bg-white/10 text-gray-500'
                      }`}>
                        {counts.rental}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <CustomSelect
                options={[
                  { value: 'ALL', label: t('admin.allStatuses') },
                  { value: 'pending', label: t('admin.pending'), color: 'text-yellow-500' },
                  { value: 'processed', label: t('admin.processed'), color: 'text-emerald-500' },
                  { value: 'returned', label: t('admin.returned', { defaultValue: 'Retourné' }), color: 'text-orange-500' },
                  ...(typeFilter !== 'rental' ? [{ value: 'FOURNISSEUR', label: 'Fournisseur', color: 'text-blue-400' }] : []),
                  ...(typeFilter !== 'sale' ? [{ value: 'rented', label: 'Loué', color: 'text-violet-500' }] : []),
                  ...(typeFilter !== 'rental' ? [{ value: 'delivered', label: 'Livré', color: 'text-teal-500' }] : []),
                  { value: 'archived', label: t('admin.archived'), color: 'text-indigo-500' },
                  { value: 'trashed', label: t('admin.trashed'), color: 'text-rose-500' },
                ]}
                value={statusFilter}
                onChange={(val) => setStatusFilter(val as QuoteStatus | 'ALL' | 'FOURNISSEUR')}
                isDark={isDark}
                placeholder={t('admin.status')}
                className="w-full sm:min-w-[160px]"
              />
              <button 
                onClick={() => router.push('/admin/quote-requests')}
                className="hidden xl:inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl border transition-all duration-200 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:border-blue-300 dark:hover:border-blue-700 cursor-pointer whitespace-nowrap group"
              >
                {t('admin.viewAll')}
                <ChevronRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
              </button>
            </div>
          </div>
          {/* Desktop View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`text-left text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'} border-b border-gray-100 dark:border-white/5`}>
                  <th className="pb-4 font-semibold">{t('admin.clientIdHeader', { defaultValue: 'Client' })}</th>
                  <th className="pb-4 font-semibold">{t('admin.submissionDateHeader', { defaultValue: 'Date de soumission' })}</th>
                  <th className="pb-4 font-semibold">{t('admin.type', { defaultValue: 'Type' })}</th>
                  <th className="pb-4 font-semibold">{t('admin.amountHeader', { defaultValue: 'Montant' })}</th>
                  <th className="pb-4 font-semibold">{t('admin.status', { defaultValue: 'Statut' })}</th>
                  <th className="pb-4 font-semibold text-right">{t('admin.actions', { defaultValue: 'Actions' })}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {searchedQuotes.length > 0 ? searchedQuotes.map((quote) => {
                  const isRental = quote.transactionType === 'rental';
                  const amountVal = quote.totalClient || quote.totalQuote || 0;
                  return (
                    <tr key={quote.id} className="group hover:bg-theme-sidebar-active-bg/5 transition-colors">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <img src="/bot-avatars/estimation.png" alt="" className="w-8 h-8 rounded-lg object-cover" />
                          <div className="flex flex-col">
                            <span className="text-sm font-bold group-hover:text-blue-500 transition-colors">
                              {quote.client?.companyName || t('admin.noNameClient')}
                            </span>
                            <span className="text-[10px] text-gray-400 uppercase tracking-tighter">
                              ID: {quote.id.substring(0, 8)}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="flex flex-col">
                          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500 group-hover:text-zinc-600'} transition-colors`}>
                            {quote.createdAt?.toDate 
                              ? IntlHelpers.formatDate(quote.createdAt.toDate(), locale, { day: 'numeric', month: 'long', year: 'numeric' }) 
                              : t('admin.unknownDate')}
                          </span>
                          {quote.createdAt?.toDate && (
                            <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'} mt-0.5`}>
                              {IntlHelpers.formatDateTime(quote.createdAt.toDate(), locale)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4">
                        {isRental ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-violet-500/10 text-violet-600 dark:text-violet-400 dark:bg-violet-500/20">
                            <Calendar className="w-3.5 h-3.5" />
                            {t('admin.rental', { defaultValue: 'Location' })}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 dark:bg-emerald-500/20">
                            <ShoppingBag className="w-3.5 h-3.5" />
                            {t('admin.sale', { defaultValue: 'Vente' })}
                          </span>
                        )}
                      </td>
                      <td className="py-4">
                        <span className="text-sm font-extrabold text-blue-500 dark:text-blue-400">
                          {amountVal > 0 ? amountVal.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) : '—'}
                        </span>
                      </td>
                      <td className="py-4">
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                          quote.status === 'processed' || quote.status === 'delivered' ? 'bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500/20' :
                          quote.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500 group-hover:bg-yellow-500/20' :
                          quote.status === 'returned' ? 'bg-orange-500/10 text-orange-500 group-hover:bg-orange-500/20' :
                          quote.status === 'in_progress' ? 'bg-blue-500/10 text-blue-500 group-hover:bg-blue-500/20' :
                          quote.status === 'trashed' ? 'bg-red-500/10 text-red-500' :
                          'bg-gray-500/10 text-gray-500 group-hover:bg-zinc-800'
                        } transition-colors`}>
                          {translateStatus(quote.status, locale)}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {quote.status === 'in_progress' ? (
                            <button
                              onClick={() => setDetailQuote(quote)}
                              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-bold bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              + de détails
                            </button>
                          ) : (
                            <Link 
                              href={`/admin/quote-requests`}
                              className="p-2 rounded-lg text-gray-400 hover:bg-zinc-800 hover:text-white transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                          )}
                          {(rawRole === 'admin' || userRole === 'Administrateur') ? (
                            <button 
                              onClick={() => setConfirmDialog({ message: t('admin.deleteQuoteConfirm'), onConfirm: () => { setConfirmDialog(null); handleDelete(quote.id); } })}
                              disabled={isDeleting === quote.id}
                              className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                            >
                              {isDeleting === quote.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            </button>
                          ) : (
                            <button className="p-2 rounded-lg text-gray-400 hover:bg-zinc-800 hover:text-white transition-colors">
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={6} className={`py-8 text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      {searchQuery ? (t('admin.noSearchResults') || 'Aucun résultat pour cette recherche') : t('admin.noEstimationFound')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile View - Card based accordion layout */}
          <div className="md:hidden space-y-3">
            {searchedQuotes.length > 0 ? searchedQuotes.map((quote) => {
              const isExpanded = expandedId === quote.id;
              const isRental = quote.transactionType === 'rental';
              const amountVal = quote.totalClient || quote.totalQuote || 0;
              const dateStr = quote.createdAt?.toDate ? IntlHelpers.formatDate(quote.createdAt.toDate(), locale, { day: 'numeric', month: 'long' }) : t('admin.unknownDate');
              
              return (
                <div 
                  key={quote.id} 
                  className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                    isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100 shadow-sm'
                  } ${isExpanded ? (isDark ? 'ring-1 ring-blue-500/50' : 'ring-1 ring-blue-500/30 shadow-md') : ''}`}
                >
                  <div 
                    className="p-4 flex flex-col gap-3 cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : quote.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img src="/bot-avatars/estimation.png" alt="" className="w-10 h-10 rounded-xl object-cover" />
                        <div className="flex flex-col">
                          <span className="text-sm font-bold truncate max-w-[150px]">{quote.client?.companyName || t('admin.noNameClient')}</span>
                          <span className="text-[10px] text-gray-400 uppercase font-medium">
                            {dateStr}
                            {quote.createdAt?.toDate && (
                              <span className="block text-[9px] font-normal normal-case mt-0.5">
                                {IntlHelpers.formatDateTime(quote.createdAt.toDate(), locale)}
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-1.5">
                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                          quote.status === 'processed' || quote.status === 'delivered' ? 'bg-emerald-500/20 text-emerald-500' :
                          quote.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
                          quote.status === 'returned' ? 'bg-orange-500/20 text-orange-500' :
                          quote.status === 'in_progress' ? 'bg-blue-500/20 text-blue-500' :
                          quote.status === 'trashed' ? 'bg-red-500/20 text-red-500' :
                          'bg-gray-500/20 text-gray-500'
                        }`}>
                          {translateStatus(quote.status, locale)}
                        </span>
                        
                        <div className="flex items-center gap-2">
                          {isRental ? (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-violet-500/10 text-violet-500 dark:bg-violet-500/20">
                              <Calendar className="w-2.5 h-2.5" />
                              {t('admin.rental', { defaultValue: 'Location' })}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/20">
                              <ShoppingBag className="w-2.5 h-2.5" />
                              {t('admin.sale', { defaultValue: 'Vente' })}
                            </span>
                          )}
                          <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-2 border-t border-gray-200/50 dark:border-white/5">
                      <span className="text-[10px] text-gray-400 uppercase tracking-wider">{t('admin.estimatedAmount', { defaultValue: 'Montant' })}</span>
                      <span className="text-xs font-black text-blue-500 dark:text-blue-400">
                        {amountVal > 0 ? amountVal.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) : '—'}
                      </span>
                    </div>
                  </div>
                  
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className={`border-t ${isDark ? 'border-white/5 bg-white/5' : 'border-gray-100 bg-white/50'}`}
                      >
                        <div className="p-4 space-y-4">
                          <div className="flex flex-col gap-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">{t('admin.identifier')}</p>
                                <p className="text-[11px] font-medium text-gray-500 truncate" title={quote.id}>{quote.id}</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 pt-2">
                            {quote.status === 'in_progress' ? (
                              <button
                                onClick={() => setDetailQuote(quote)}
                                className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
                              >
                                <Eye className="w-4 h-4" />
                                + de détails
                              </button>
                            ) : (
                              <Link 
                                href={`/admin/quote-requests`}
                                className="flex-1 py-3 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all dark:bg-white dark:text-black"
                              >
                                <Eye className="w-4 h-4" />
                                <span>{t('admin.detailsButton')}</span>
                              </Link>
                            )}
                            {(rawRole === 'admin' || userRole === 'Administrateur') ? (
                              <button 
                              onClick={() => setConfirmDialog({ message: t('admin.deleteQuoteConfirm'), onConfirm: () => { setConfirmDialog(null); handleDelete(quote.id); } })}
                                disabled={isDeleting === quote.id}
                                className={`p-3 rounded-xl border flex items-center justify-center bg-red-50 border-red-100 active:scale-95 transition-all disabled:opacity-50 dark:bg-red-950/20 dark:border-red-900/30`}
                              >
                                {isDeleting === quote.id ? <RefreshCw className="w-4 h-4 animate-spin text-red-500" /> : <Trash2 className="w-4 h-4 text-red-500" />}
                              </button>
                            ) : (
                              <button className={`p-3 rounded-xl border flex items-center justify-center ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'} active:scale-95 transition-all`}>
                                <MoreHorizontal className="w-4 h-4 text-gray-400" />
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            }) : (
              <div className={`py-12 text-center rounded-2xl border border-dashed ${isDark ? 'border-white/10 text-gray-500' : 'border-gray-200 text-gray-400'}`}>
                {t('admin.noRecentEstimation')}
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between mt-6 pt-6 border-t border-gray-100 dark:border-white/5 gap-4">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {locale === 'en' ? (
                  <>
                    Showing <span className="font-bold text-gray-900 dark:text-white">{(currentPage - 1) * itemsPerPage + 1}</span> to{" "}
                    <span className="font-bold text-gray-900 dark:text-white">
                      {Math.min(currentPage * itemsPerPage, filteredTotal)}
                    </span>{" "}
                    of <span className="font-bold text-gray-900 dark:text-white">{filteredTotal}</span> estimates
                  </>
                ) : (
                  <>
                    Affichage de <span className="font-bold text-gray-900 dark:text-white">{(currentPage - 1) * itemsPerPage + 1}</span> à{" "}
                    <span className="font-bold text-gray-900 dark:text-white">
                      {Math.min(currentPage * itemsPerPage, filteredTotal)}
                    </span>{" "}
                    sur <span className="font-bold text-gray-900 dark:text-white">{filteredTotal}</span> estimations
                  </>
                )}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-xl border transition-all duration-300 ${
                    currentPage === 1
                      ? 'text-gray-300 border-gray-100 dark:text-zinc-600 dark:border-white/5 cursor-not-allowed'
                      : 'text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:border-white/10 dark:hover:bg-white/5 dark:hover:text-white'
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => {
                  if (
                    totalPages > 6 &&
                    pageNum !== 1 &&
                    pageNum !== totalPages &&
                    Math.abs(pageNum - currentPage) > 1
                  ) {
                    if (pageNum === 2 && currentPage > 3) {
                      return <span key="ellipsis-start" className="px-2 text-gray-400">...</span>;
                    }
                    if (pageNum === totalPages - 1 && currentPage < totalPages - 2) {
                      return <span key="ellipsis-end" className="px-2 text-gray-400">...</span>;
                    }
                    return null;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 text-xs font-bold rounded-xl transition-all duration-300 ${
                        currentPage === pageNum
                          ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
                          : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-xl border transition-all duration-300 ${
                    currentPage === totalPages
                      ? 'text-gray-300 border-gray-100 dark:text-zinc-600 dark:border-white/5 cursor-not-allowed'
                      : 'text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:border-white/10 dark:hover:bg-white/5 dark:hover:text-white'
                  }`}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
          </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className={`p-6 rounded-[2rem] border transition-colors duration-300 ${isDark ? 'bg-[#141414] border-white/5 text-white' : 'bg-white border-gray-200 shadow-sm text-gray-900'}`}>
            <div className="flex flex-col gap-4 mb-6">
              <h3 className="text-lg font-bold">{t('admin.topCommercialsTitle')}</h3>
              <div className="w-full">
                <div className="relative w-full">
                  <button 
                    onClick={() => setIsPerformanceMenuOpen(!isPerformanceMenuOpen)}
                    className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border transition-all lg:min-w-[160px] ${
                      isDark ? 'bg-[#1a1a1a] border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-900 shadow-sm'
                    }`}
                  >
                    <span className="text-sm font-medium">
                      {performancePeriod === '1-month' ? t('admin.1month') : 
                       performancePeriod === '2-months' ? t('admin.2months') : 
                       performancePeriod === '3-months' ? t('admin.3months') : t('admin.1year')}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isPerformanceMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Desktop dropdown - only on lg+ */}
                  <AnimatePresence>
                    {isPerformanceMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.97 }}
                        transition={{ duration: 0.15 }}
                        className={`hidden lg:block absolute top-full right-0 mt-2 w-48 rounded-2xl border shadow-xl z-50 overflow-hidden ${
                          isDark ? 'bg-[#1a1a1a] border-white/10' : 'bg-white border-gray-100'
                        }`}
                      >
                         {[
                           { id: '1-month', label: t('admin.1month') },
                           { id: '2-months', label: t('admin.2months') },
                           { id: '3-months', label: t('admin.3months') },
                           { id: 'year', label: t('admin.1year') },
                         ].map((item) => (
                           <button
                             key={item.id}
                             onClick={() => {
                               setPerformancePeriod(item.id as any);
                               setIsPerformanceMenuOpen(false);
                             }}
                             className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium transition-all ${
                               performancePeriod === item.id
                                 ? isDark ? 'bg-white/10 text-white' : 'bg-blue-50 text-blue-600'
                                 : isDark ? 'text-gray-300 hover:bg-white/5' : 'text-gray-700 hover:bg-gray-50'
                             }`}
                           >
                             <span>{item.label}</span>
                             {performancePeriod === item.id && (
                               <Check className="w-4 h-4 text-blue-500" />
                             )}
                           </button>
                         ))}
                         {(rawRole === 'admin' || userRole === 'admin' || userRole === 'Administrateur') && (
                           <div className="border-t border-gray-100">
                             <button
                                onClick={() => { setConfirmDialog({ message: t('admin.resetPerformanceConfirm'), onConfirm: () => { setConfirmDialog(null); handleResetPerformance(); } }); setIsPerformanceMenuOpen(false); }}
                               className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 transition-all"
                             >
                               <RefreshCw className="w-4 h-4" />
                               {t('admin.resetPerformanceButton')}
                             </button>
                           </div>
                         )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              {topCommercials.length > 0 ? (
                topCommercials.map((user, idx) => (
                  <div key={user.id} className="flex items-center gap-3">
                    {/* Rank */}
                    <span className={`text-xs font-black w-5 text-center shrink-0 ${
                      idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-gray-400' : idx === 2 ? 'text-amber-700' : isDark ? 'text-gray-600' : 'text-gray-300'
                    }`}>{idx + 1}</span>
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-xl overflow-hidden shadow-sm shrink-0">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                          {user.name?.charAt(0) || '?'}
                        </div>
                      )}
                    </div>
                    {/* Info + bar */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-xs font-bold truncate">{user.name}</h4>
                    <span className={`text-[10px] font-black shrink-0 ml-2 ${
                      user.count === 0 ? (isDark ? 'text-gray-600' : 'text-gray-300') : 'text-rose-500'
                    }`}>
                          {user.count} {t('admin.estimates')}
                    </span>
                      </div>
                      <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            user.count === 0 ? 'bg-gray-200' :
                            idx === 0 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                            'bg-gradient-to-r from-blue-400 to-indigo-500'
                          }`}
                          style={{ width: `${user.score}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400 text-xs italic">
                  {t('admin.noCommercialRegistered')}
                </div>
              )}
            </div>
          </div>

          <div className={`p-6 rounded-[2rem] border transition-colors duration-300 ${isDark ? 'bg-[#141414] border-white/5 text-white' : 'bg-white border-gray-200 shadow-sm text-gray-900'}`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">{t('admin.recentActivities')}</h3>
              <button 
                onClick={() => router.push('/admin/history')}
                className="text-xs font-medium text-blue-500 cursor-pointer hover:underline"
              >
                {t('admin.viewAll')}
              </button>
            </div>
            <div className="relative space-y-6 pl-6">
              <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-gray-100 dark:bg-white/5"></div>
              {activityHistory.length > 0 ? activityHistory.map((activity, idx) => (
                <div key={`${activity.quoteId}-${idx}`} className="relative">
                  <div className={`absolute -left-[23px] top-1.5 w-2.5 h-2.5 rounded-full border-2 ${
                    idx === 0 ? 'bg-blue-500 border-blue-100 dark:border-blue-900' : 
                    idx === 1 ? 'bg-purple-500 border-purple-100 dark:border-purple-900' :
                    'bg-orange-500 border-orange-100 dark:border-orange-900'
                  }`}></div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">{activity.userName}</span>
                    <span className={`text-[10px] font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      {new Date(activity.timestamp).toLocaleTimeString(locale === 'en' ? 'en-US' : 'fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold mb-1">{activity.action}</h4>
                  <p className={`text-[10px] leading-relaxed ${isDark ? 'text-gray-500' : 'text-gray-400'} line-clamp-1`}>{activity.details}</p>
                </div>
              )) : (
                <div className="py-4 text-center text-xs text-gray-400 italic">
                  {t('admin.noRecentActivity')}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-[360px] space-y-8 lg:pt-[88px]">
        <div className={`hidden md:block p-6 rounded-[2rem] border transition-colors duration-300 ${isDark ? 'bg-[#141414] border-white/5 text-white' : 'bg-white border-gray-200 shadow-sm text-gray-900'}`}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold">{t('admin.configuratorMethodsTitle')}</h3>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest">{t('admin.globalUsage')}</p>
            </div>
            {(rawRole === 'admin' || userRole === 'admin' || userRole === 'Administrateur') && (
              <button
                onClick={() => setConfirmDialog({ message: t('admin.resetConfiguratorConfirm'), onConfirm: () => { setConfirmDialog(null); handleResetConfiguratorStats(); } })}
                className={`p-2 rounded-lg transition-colors ${isDark ? 'text-gray-400 hover:text-red-400 hover:bg-red-500/10' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'}`}
                title={t('admin.resetCounters')}
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-yellow-500/10 to-transparent border border-yellow-500/20 hover:scale-[1.02] transition-transform">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                  <span className="text-yellow-500 text-lg">⚡</span>
                </div>
                <span className="text-sm font-bold">{t('admin.configuratorGuided')}</span>
              </div>
              <span className="text-lg font-black text-yellow-600 dark:text-yellow-500">{configuratorStats.guided}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-purple-500/10 to-transparent border border-purple-500/20 hover:scale-[1.02] transition-transform">
              <div className="flex items-center gap-3">
                <Image
                  src="/bot-avatars/AssistantBotPixia.png"
                  alt="Bot"
                  width={28}
                  height={28}
                  className="w-7 h-7 object-contain shrink-0"
                />
                <span className="text-sm font-bold">{t('bot.title')}</span>
              </div>
              <span className="text-lg font-black text-purple-600 dark:text-purple-500">{configuratorStats.lumi}</span>
            </div>
          </div>
        </div>

        <div className="hidden md:flex flex-col bg-black/90 backdrop-blur-md rounded-3xl p-4 gap-3 shadow-2xl border border-white/10">
          <div className="flex items-center gap-1.5">
            {[
              { key: 'all', label: adt('All') },
                { key: 'sale', label: adt('Sale') },
                { key: 'rental', label: adt('Rental') },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setStatsTypeFilter(key as 'all' | 'sale' | 'rental')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                    statsTypeFilter === key
                      ? key === 'all'
                        ? 'bg-white/15 text-white shadow-sm'
                        : key === 'sale'
                          ? 'bg-emerald-500/20 text-emerald-400 shadow-sm shadow-emerald-500/10'
                          : 'bg-violet-500/20 text-violet-400 shadow-sm shadow-violet-500/10'
                      : 'text-white/40 hover:text-white/80'
                  }`}
                >
                  {label}
                </button>
              ))}
              <span className="ml-auto text-[10px] font-medium text-white/30" title="Total des estimations">
                {Object.values(statsCounts).reduce((a, b) => a + b, 0) || 0}
              </span>
            </div>
          <div className="grid grid-cols-4 gap-1">
            {([
              { key: 'pending',   icon: Clock,       color: 'text-yellow-500',  glow: 'rgba(234,179,8,0.8)' },
              { key: 'processed', icon: CheckCircle2, color: 'text-emerald-500', glow: 'rgba(34,197,94,0.8)' },
              { key: 'returned',  icon: Undo2,        color: 'text-orange-400',  glow: 'rgba(251,146,60,0.8)' },
              ...(statsTypeFilter !== 'rental' ? [{ key: 'fournisseur', icon: Users as any, color: 'text-blue-400', glow: 'rgba(96,165,250,0.8)' }] : []),
              ...(statsTypeFilter !== 'sale' ? [{ key: 'rented', icon: Calendar as any, color: 'text-violet-400', glow: 'rgba(167,139,250,0.8)' }] : []),
              ...(statsTypeFilter !== 'rental' ? [{ key: 'delivered', icon: Truck as any, color: 'text-teal-400', glow: 'rgba(45,212,191,0.8)' }] : []),
              { key: 'archived',  icon: Archive,      color: 'text-indigo-400',  glow: 'rgba(129,140,248,0.8)' },
              { key: 'trashed',   icon: Trash2,       color: 'text-rose-500',    glow: 'rgba(244,63,94,0.8)' },
            ] as const).map(({ key, icon: Icon, color, glow }: any) => {
              const val = key === 'fournisseur'
                ? (allUsers?.filter((u: any) => u.role === 'fournisseur').length || 0)
                : (statsCounts[key] || 0);
              const label = key === 'fournisseur' ? 'Fournisseur' : key === 'delivered' ? 'Livré' : key === 'rented' ? 'Loué' : (statusLabels[key] || key);
              return (
                <div
                  key={key}
                  title={`${label}: ${val}`}
                  className="group relative flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-white/10 transition-all cursor-default min-w-[52px]"
                >
                  <Icon className={`w-5 h-5 ${color} group-hover:drop-shadow-[0_0_8px_${glow}] transition-all`} />
                  <span className="text-lg font-bold text-white">{val}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="hidden md:block">
          {renderCalendar()}
        </div>
      </div>

      {/* Desktop backdrop to close dropdown on outside click */}
      {isPerformanceMenuOpen && (
        <div
          className="hidden lg:block fixed inset-0 z-40"
          onClick={() => setIsPerformanceMenuOpen(false)}
        />
      )}

      {/* Mobile bottom sheet drawer - hidden on lg+ */}
      <AnimatePresence>
        {isPerformanceMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPerformanceMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] lg:hidden"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.2}
              onDragEnd={(_, info) => {
                if (info.offset.y > 150) setIsPerformanceMenuOpen(false);
              }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[2.5rem] p-8 z-[101] shadow-2xl overflow-hidden lg:hidden"
            >
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-8" />
              
              <div className="flex items-center justify-between mb-8">
                 <div>
                   <h2 className="text-2xl font-black text-gray-900 leading-tight">{t('admin.periodTitle')}</h2>
                   <p className="text-sm text-gray-500 font-medium">{t('admin.periodChoose')}</p>
                 </div>
                <button 
                  onClick={() => setIsPerformanceMenuOpen(false)}
                  className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                 {[
                  { id: '1-month', label: t('admin.1month') },
                  { id: '2-months', label: t('admin.2months') },
                  { id: '3-months', label: t('admin.3months') },
                  { id: 'year', label: t('admin.1year') },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setPerformancePeriod(item.id as any);
                      setIsPerformanceMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between py-4 px-6 rounded-2xl transition-all ${
                      performancePeriod === item.id 
                        ? 'bg-blue-50 border-2 border-blue-500/20' 
                        : 'bg-gray-50 border-2 border-transparent'
                    }`}
                  >
                    <span className={`text-lg font-bold ${performancePeriod === item.id ? 'text-blue-600' : 'text-gray-600'}`}>
                      {item.label}
                    </span>
                    {performancePeriod === item.id && (
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </button>
                ))}

                {(rawRole === 'admin' || userRole === 'admin' || userRole === 'Administrateur') && (
                  <div className="pt-4 mt-2">
                    <button
                       onClick={() => setConfirmDialog({ message: t('admin.resetPerformanceConfirm'), onConfirm: () => { setConfirmDialog(null); handleResetPerformance(); } })}
                       className="w-full flex items-center justify-between py-3 px-6 rounded-2xl bg-red-600 border-2 border-red-700 text-white hover:bg-red-700 transition-all group shadow-lg shadow-red-200"
                    >
                      <div className="flex items-center gap-3">
                        <RefreshCw className="w-4 h-4 font-black group-hover:rotate-180 transition-transform duration-500" />
                        <span className="text-sm font-black uppercase tracking-widest text-left">
                          {adt('Reset')} <span className="text-[9px] opacity-80 font-bold ml-2">{adt('— Reset to zero')}</span>
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 opacity-50" />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Confirm Dialog */}
      <AnimatePresence>
        {confirmDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setConfirmDialog(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-[2rem] shadow-2xl p-6 max-w-sm w-full border border-red-100"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">{t('admin.productManagement.deleteConfirmTitle')}</h3>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed mb-6">{confirmDialog.message}</p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setConfirmDialog(null)}
                  className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  {t('admin.productManagement.cancel')}
                </button>
                <button
                  onClick={confirmDialog.onConfirm}
                  className="px-5 py-2.5 text-sm font-bold bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
                >
                  {t('admin.productManagement.delete')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail Modal for En cours */}
      <AnimatePresence>
        {detailQuote && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setDetailQuote(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 320 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="sticky top-0 z-10 bg-white rounded-t-3xl border-b border-slate-100 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-200">
                    <Eye className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 leading-tight">Détails de l'estimation</h3>
                    <p className="text-[10px] font-medium text-slate-400 font-mono tracking-tight">#{detailQuote.id.substring(0, 8)}</p>
                  </div>
                </div>
                <button
                  onClick={() => setDetailQuote(null)}
                  className="w-8 h-8 rounded-xl hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              <div className="px-6 py-5 space-y-6">
                {/* Client Section */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Building2 className="w-4 h-4 text-slate-400" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Client</span>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-white shadow-sm border border-slate-200 flex items-center justify-center shrink-0">
                        <Building2 className="w-4 h-4 text-slate-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Société</p>
                        <p className="text-sm font-bold text-slate-800 truncate">{detailQuote.client?.companyName || 'Non renseigné'}</p>
                      </div>
                    </div>
                    <div className="h-px bg-slate-200/60" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-white shadow-sm border border-slate-200 flex items-center justify-center shrink-0">
                          <Mail className="w-3.5 h-3.5 text-slate-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Email</p>
                          <p className="text-xs font-semibold text-slate-700 truncate">{detailQuote.client?.email || 'Non renseigné'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-white shadow-sm border border-slate-200 flex items-center justify-center shrink-0">
                          <Phone className="w-3.5 h-3.5 text-slate-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Téléphone</p>
                          <p className="text-xs font-semibold text-slate-700 truncate">{detailQuote.client?.phone || 'Non renseigné'}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-white shadow-sm border border-slate-200 flex items-center justify-center shrink-0">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Adresse</p>
                        <p className="text-xs font-semibold text-slate-700 truncate">{detailQuote.client?.address || 'Non renseigné'}</p>
                      </div>
                    </div>
                    {detailQuote.client?.notes && (
                      <>
                        <div className="h-px bg-slate-200/60" />
                        <div className="flex items-start gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-white shadow-sm border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                            <StickyNote className="w-3.5 h-3.5 text-slate-500" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Notes</p>
                            <p className="text-xs text-slate-600 leading-relaxed">{detailQuote.client.notes}</p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Estimation Section */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Estimation</span>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white rounded-xl p-3 border border-slate-200/60">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">Type</p>
                        <div className="flex items-center gap-1.5">
                          {detailQuote.transactionType === 'rental' ? (
                            <>
                              <Calendar className="w-3.5 h-3.5 text-violet-500" />
                              <span className="text-xs font-extrabold text-violet-600">Location</span>
                            </>
                          ) : (
                            <>
                              <ShoppingBag className="w-3.5 h-3.5 text-emerald-500" />
                              <span className="text-xs font-extrabold text-emerald-600">Vente</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="bg-white rounded-xl p-3 border border-slate-200/60">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">Montant</p>
                        <p className="text-xs font-extrabold text-blue-600">
                          {detailQuote.totalClient || detailQuote.totalQuote
                            ? (detailQuote.totalClient || detailQuote.totalQuote).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
                            : '—'}
                        </p>
                      </div>
                    </div>
                    <div className="bg-white rounded-xl p-3 border border-slate-200/60">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">Date de soumission</p>
                      <p className="text-xs font-bold text-slate-700">
                        {detailQuote.createdAt?.toDate
                          ? detailQuote.createdAt.toDate().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                          : 'Non renseigné'}
                      </p>
                    </div>
                    <div className="bg-white rounded-xl p-3 border border-amber-200/60 bg-amber-50/50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[9px] font-bold uppercase tracking-widest text-amber-500 mb-1">Statut actuel</p>
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                            <span className="text-xs font-extrabold text-blue-600">En cours</span>
                          </div>
                        </div>
                        <Clock className="w-5 h-5 text-amber-400" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="px-6 pb-6">
                <button
                  onClick={() => handleRevertToPending(detailQuote.id)}
                  className="w-full py-3.5 text-sm font-extrabold bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg shadow-amber-200 flex items-center justify-center gap-2.5 cursor-pointer active:scale-[0.98]"
                >
                  <Undo2 className="w-4 h-4" />
                  Repasser en « En attente »
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
