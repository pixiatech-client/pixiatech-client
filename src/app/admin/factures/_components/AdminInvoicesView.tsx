'use client';

import { useMemo, useState, useRef } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n';
import {
  FileText,
  Clock,
  CheckCircle2,
  Search,
  Building2,
  User,
  ShieldCheck,
  X,
  Download,
  Check,
  FileCheck,
  FileUp,
  Printer,
  ChevronDown,
  ChevronUp,
  Loader2,
  Inbox,
  Tag,
  Truck,
  Eye,
  FileX,
  AlertCircle,
  Trash2,
  AlertTriangle,
  ShieldAlert,
} from 'lucide-react';
import { adminGenerateInvoice, markInvoiceInProgress, resetInvoiceToInProgress, moveInvoiceToTrash, deleteInvoicePermanently } from '@/app/admin/actions';
import type { InvoiceItem, InvoiceRequestSummary } from '@/lib/invoices';

function CustomerAvatar({
  photo,
  name,
  isB2B,
  fallbackText,
}: {
  photo?: string;
  name?: string;
  isB2B?: boolean;
  fallbackText: string;
}) {
  const [imgError, setImgError] = useState(false);

  if (photo && !imgError) {
    return (
      <img
        src={photo}
        alt={name || fallbackText}
        onError={() => setImgError(true)}
        className="w-10 h-10 rounded-full object-cover ring-2 ring-neutral-200 dark:ring-neutral-700 shrink-0"
        loading="lazy"
      />
    );
  }

  if (isB2B) {
    return (
      <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
        <Building2 className="w-4 h-4" />
      </div>
    );
  }

  return (
    <div className="p-2 rounded-xl bg-sky-50 text-sky-700 border border-sky-200 shrink-0">
      <User className="w-4 h-4" />
    </div>
  );
}

type StatusKey = 'ALL' | 'pending' | 'in_progress' | 'completed' | 'archived' | 'generated' | 'sent' | 'trash';

interface AdminInvoicesViewProps {
  requests: InvoiceRequestSummary[];
  loading: boolean;
  error: boolean;
  onRefresh: () => void;
}

const LOCALE_MAP: Record<string, string> = { fr: 'fr-FR', en: 'en-US', 'zh-CN': 'zh-CN' };

const KPI_STYLE = {
  pending: {
    active: 'bg-amber-500/10 border-amber-500 shadow-md ring-2 ring-amber-500/20',
    idle: 'bg-white dark:bg-zinc-900 border-neutral-200/80 dark:border-white/10 hover:border-amber-300',
    icon: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
    label: 'text-amber-900 dark:text-amber-500',
  },
  in_progress: {
    active: 'bg-sky-500/10 border-sky-500 shadow-md ring-2 ring-sky-500/20',
    idle: 'bg-white dark:bg-zinc-900 border-neutral-200/80 dark:border-white/10 hover:border-sky-300',
    icon: 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-400',
    label: 'text-sky-900 dark:text-sky-500',
  },
  completed: {
    active: 'bg-emerald-500/10 border-emerald-500 shadow-md ring-2 ring-emerald-500/20',
    idle: 'bg-white dark:bg-zinc-900 border-neutral-200/80 dark:border-white/10 hover:border-emerald-300',
    icon: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
    label: 'text-emerald-900 dark:text-emerald-500',
  },
} as const;

const STATUS_BADGE: Record<string, string> = {
  pending: 'text-amber-800 bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30',
  in_progress: 'text-sky-800 bg-sky-50 border-sky-200 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/30',
  completed: 'text-emerald-800 bg-emerald-50 border-emerald-300 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30',
  archived: 'text-neutral-600 bg-neutral-50 border-neutral-200 dark:bg-white/5 dark:text-neutral-400 dark:border-white/10',
  generated: 'text-violet-800 bg-violet-50 border-violet-200 dark:bg-violet-500/10 dark:text-violet-400 dark:border-violet-500/30',
  sent: 'text-teal-800 bg-teal-50 border-teal-200 dark:bg-teal-500/10 dark:text-teal-400 dark:border-teal-500/30',
  trash: 'text-rose-800 bg-rose-50 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/30',
};

function statusBadgeClass(status: string): string {
  return STATUS_BADGE[status] || STATUS_BADGE.pending;
}

function StatusBadgeIcon({ status }: { status: string }) {
  if (status === 'in_progress') return <Clock className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 animate-spin" />;
  if (status === 'completed') return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />;
  if (status === 'archived') return <CheckCircle2 className="w-3.5 h-3.5 text-neutral-500" />;
  if (status === 'generated') return <FileText className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />;
  if (status === 'sent') return <FileCheck className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />;
  if (status === 'trash') return <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />;
  return <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 animate-pulse" />;
}

export function AdminInvoicesView({ requests, loading, error, onRefresh }: AdminInvoicesViewProps) {
  const { t, locale } = useI18n();
  const [filterStatus, setFilterStatus] = useState<StatusKey>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedInvoiceId, setExpandedInvoiceId] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRequestSummary | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const money = (value: number): string =>
    (value || 0).toLocaleString(LOCALE_MAP[locale] || 'fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const percent = (rate: number): number => Math.round((rate || 0) * 100 * 100) / 100;

  const counts = useMemo(
    () =>
      (['pending', 'in_progress', 'completed', 'archived', 'generated', 'sent', 'trash'] as const).reduce<Record<string, number>>(
        (acc, s) => {
          acc[s] = requests.filter((r) => r.status === s).length;
          return acc;
        },
        {}
      ),
    [requests]
  );

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return requests.filter((inv) => {
      if (filterStatus !== 'ALL' && inv.status !== filterStatus) return false;
      // Par défaut (ALL) masquer la corbeille — seul le filtre explicite 'trash' les montre
      if (filterStatus === 'ALL' && inv.status === 'trash') return false;
      if (!q) return true;
      return (
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.orderNumber.toLowerCase().includes(q) ||
        inv.customerName.toLowerCase().includes(q) ||
        (inv.siret && inv.siret.replace(/\s/g, '').includes(q.replace(/\s/g, '')))
      );
    });
  }, [requests, filterStatus, searchQuery]);

  const toggleRow = (id: string) => setExpandedInvoiceId((prev) => (prev === id ? null : id));
  const collapseAll = () => setExpandedInvoiceId(null);

  const openPrintModal = (inv: InvoiceRequestSummary) => {
    setSelectedInvoice(inv);
    setShowPrintModal(true);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentUploadInvoiceId, setCurrentUploadInvoiceId] = useState<string | null>(null);
  const [uploadingInvoiceId, setUploadingInvoiceId] = useState<string | null>(null);

  const triggerUpload = (invoiceId: string) => {
    setCurrentUploadInvoiceId(invoiceId);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUploadInvoiceId) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Format invalide. Veuillez sélectionner un fichier PDF.');
      return;
    }

    const invoiceId = currentUploadInvoiceId;
    setUploadingInvoiceId(invoiceId);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`/api/admin/invoices/${invoiceId}/upload-certified-pdf`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Facture certifiée "${data.certPdfName}" téléversée avec succès.`);
        if (selectedInvoice && selectedInvoice.id === invoiceId) {
          setSelectedInvoice({
            ...selectedInvoice,
            hasCustomCertPdf: true,
            certPdfName: data.certPdfName,
            certifiedUploadedAt: data.certifiedUploadedAt || new Date().toISOString(),
            status: data.status || 'in_progress',
          });
        }
        onRefresh();
      } else {
        toast.error(data.error || "Erreur lors de l'upload du fichier certifié");
      }
    } catch {
      toast.error("Erreur réseau lors du téléversement du PDF");
    } finally {
      setUploadingInvoiceId(null);
      setCurrentUploadInvoiceId(null);
    }
  };

  const downloadRealPdf = (inv: InvoiceRequestSummary) => {
    window.open(`/api/admin/invoices/${inv.id}/pdf`, '_blank');
  };

  const handleDownloadModel = async (inv: InvoiceRequestSummary) => {
    // Télécharge directement le modèle PDF officiel (identique à celui du client)
    window.open(`/api/admin/invoices/${inv.id}/pdf`, '_blank');
    if (inv.status === 'pending') {
      try {
        const res = await markInvoiceInProgress(inv.id);
        if (res?.success) onRefresh();
      } catch {}
    }
  };

  const handlePublish = async (inv: InvoiceRequestSummary) => {
    if (actionId) return;
    setActionId(inv.id);
    try {
      const res = await adminGenerateInvoice(inv.id);
      if (res?.success) {
        toast.success(t('admin.factures.publishSuccess', { number: res.invoiceNumber || inv.invoiceNumber }));
        onRefresh();
      } else if (res?.alreadyGenerated) {
        toast.error(res?.error || t('admin.factures.actionError'));
      } else {
        toast.error(res?.error || t('admin.factures.actionError'));
      }
    } catch {
      toast.error(t('admin.factures.actionError'));
    } finally {
      setActionId(null);
    }
  };

  const handleResetToInProgress = async (inv: InvoiceRequestSummary) => {
    if (actionId) return;
    setActionId(inv.id);
    try {
      const res = await resetInvoiceToInProgress(inv.id);
      if (res?.success) {
        toast.success('Facture repassée en cours. La publication client a été suspendue.');
        onRefresh();
      } else {
        toast.error(res?.error || t('admin.factures.actionError'));
      }
    } catch {
      toast.error(t('admin.factures.actionError'));
    } finally {
      setActionId(null);
    }
  };

  const handleMoveToTrash = async (inv: InvoiceRequestSummary) => {
    if (actionId) return;
    setActionId(inv.id);
    try {
      const res = await moveInvoiceToTrash(inv.id);
      if (res?.success) {
        toast.success('Facture déplacée dans la corbeille.');
        onRefresh();
      } else {
        toast.error(res?.error || t('admin.factures.actionError'));
      }
    } catch {
      toast.error(t('admin.factures.actionError'));
    } finally {
      setActionId(null);
    }
  };

  const handleDeletePermanently = async (inv: InvoiceRequestSummary) => {
    if (actionId) return;
    setActionId(inv.id);
    try {
      const res = await deleteInvoicePermanently(inv.id);
      if (res?.success) {
        toast.success('Facture supprimée définitivement.');
        setConfirmDeleteId(null);
        onRefresh();
      } else {
        toast.error(res?.error || t('admin.factures.actionError'));
      }
    } catch {
      toast.error(t('admin.factures.actionError'));
    } finally {
      setActionId(null);
    }
  };

  const handleMoveInProgress = async (inv: InvoiceRequestSummary) => {
    if (actionId) return;
    setActionId(inv.id);
    try {
      const res = await markInvoiceInProgress(inv.id);
      if (res?.success) {
        toast.success(t('admin.factures.downloadSuccess'));
        onRefresh();
      } else {
        toast.error(res?.error || t('admin.factures.actionError'));
      }
    } catch {
      toast.error(t('admin.factures.actionError'));
    } finally {
      setActionId(null);
    }
  };

  const handleConnectClick = () => toast.info(t('admin.factures.connectMsg'));
  const handleSetPending = () => toast.info(t('admin.factures.resetSoonMsg'));

  const isBusy = (id: string) => actionId === id;

  const statusLabel = (status: string): string => {
    switch (status) {
      case 'pending':
        return t('admin.factures.statusPending');
      case 'in_progress':
        return t('admin.factures.statusInProgress');
      case 'completed':
        return t('admin.factures.statusAvailable');
      case 'archived':
        return t('admin.factures.statusArchived');
      case 'generated':
        return 'Générée';
      case 'sent':
        return 'Envoyée';
      case 'trash':
        return 'Corbeille';
      default:
        return status;
    }
  };

  if (loading && requests.length === 0) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error && requests.length === 0) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-gray-500">
        <Inbox className="w-8 h-8 text-rose-500" />
        <span className="text-sm">{t('admin.factures.loadError')}</span>
        <button
          type="button"
          onClick={onRefresh}
          className="px-4 py-2 rounded-xl text-xs font-semibold border border-neutral-300 hover:bg-neutral-100"
        >
          {t('admin.factures.refresh')}
        </button>
      </div>
    );
  }

  const invoiceStep2Label = (inv: InvoiceRequestSummary): string => {
    if (inv.certPdfName) return t('admin.factures.step2DescFile', { name: inv.certPdfName });
    return t('admin.factures.step2DescEmpty');
  };

  return (
    <div id="admin-invoices-workspace" className="space-y-6">
      {/* 1. Bandeau titre backoffice */}
      <div className="bg-[#0A0D0E] border border-neutral-800 rounded-3xl p-5 sm:p-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#141B1E] border border-neutral-700 flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6 text-[#38E044]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold tracking-tight">{t('admin.factures.headerTitle')}</h1>
              <span className="text-[10px] font-mono font-extrabold bg-[#38E044] text-black px-2.5 py-0.5 rounded-full shadow-[0_0_10px_rgba(56,224,68,0.4)]">
                {t('admin.factures.backofficeBadge')}
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-1">{t('admin.factures.headerSubtitle')}</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            href="/admin/litiges"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-950 to-neutral-900 hover:from-rose-900 hover:to-neutral-800 text-white text-xs font-bold border border-rose-500/30 transition-all cursor-pointer shadow-sm group shrink-0"
            title={t('admin.factures.litigesTooltip')}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400 group-hover:scale-110 transition-transform" />
            <span className="tracking-wide">{t('admin.factures.litigesBtn')}</span>
            <span className="text-[9px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-1.5 py-0.5 rounded font-mono font-bold">
              {t('admin.factures.litigesNew')}
            </span>
          </Link>

          <button
            id="btn-pixiatech-connect"
            type="button"
            onClick={handleConnectClick}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-neutral-800 to-neutral-900 hover:from-neutral-700 hover:to-neutral-800 text-white text-xs font-bold border border-[#38E044]/30 transition-all cursor-pointer shadow-sm group"
            title={t('admin.factures.connectTooltip')}
          >
            <div className="w-2 h-2 rounded-full bg-[#38E044] shadow-[0_0_8px_#38E044] group-hover:scale-125 transition-transform" />
            <span className="tracking-wide">{t('admin.factures.connectLabel')}</span>
            <span className="text-[9px] bg-[#1a3821] text-white border border-[#38E044]/30 px-1.5 py-0.5 rounded font-mono font-semibold">
              {t('admin.factures.connectSoon')}
            </span>
          </button>
        </div>
      </div>

      {/* 2. Indicateurs métriques en 3 statuts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          type="button"
          onClick={() => setFilterStatus(filterStatus === 'pending' ? 'ALL' : 'pending')}
          className={`text-left p-5 rounded-2xl border transition-all cursor-pointer ${filterStatus === 'pending' ? KPI_STYLE.pending.active : KPI_STYLE.pending.idle}`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${KPI_STYLE.pending.label}`}>
              {t('admin.factures.kpiPending')}
            </span>
            <div className={`p-2 rounded-xl ${KPI_STYLE.pending.icon}`}>
              <Clock className="w-4 h-4 animate-pulse" />
            </div>
          </div>
          <div className="text-3xl font-black font-mono text-neutral-900 dark:text-white mt-2">
            {counts.pending}
          </div>
          <p className="text-[11px] text-neutral-500 mt-1">{t('admin.factures.kpiPendingDesc')}</p>
        </button>

        <button
          type="button"
          onClick={() => setFilterStatus(filterStatus === 'in_progress' ? 'ALL' : 'in_progress')}
          className={`text-left p-5 rounded-2xl border transition-all cursor-pointer ${filterStatus === 'in_progress' ? KPI_STYLE.in_progress.active : KPI_STYLE.in_progress.idle}`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${KPI_STYLE.in_progress.label}`}>
              {t('admin.factures.kpiInProgress')}
            </span>
            <div className={`p-2 rounded-xl ${KPI_STYLE.in_progress.icon}`}>
              <Clock className="w-4 h-4 animate-spin" />
            </div>
          </div>
          <div className="text-3xl font-black font-mono text-neutral-900 dark:text-white mt-2">
            {counts.in_progress}
          </div>
          <p className="text-[11px] text-neutral-500 mt-1">{t('admin.factures.kpiInProgressDesc')}</p>
        </button>

        <button
          type="button"
          onClick={() => setFilterStatus(filterStatus === 'completed' ? 'ALL' : 'completed')}
          className={`text-left p-5 rounded-2xl border transition-all cursor-pointer ${filterStatus === 'completed' ? KPI_STYLE.completed.active : KPI_STYLE.completed.idle}`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${KPI_STYLE.completed.label}`}>
              {t('admin.factures.kpiAvailable')}
            </span>
            <div className={`p-2 rounded-xl ${KPI_STYLE.completed.icon}`}>
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black font-mono text-neutral-900 dark:text-white mt-2">
            {counts.completed}
          </div>
          <p className="text-[11px] text-neutral-500 mt-1">{t('admin.factures.kpiAvailableDesc')}</p>
        </button>
      </div>

      {/* 3. Filtres rapides & recherche */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-neutral-200/80 dark:border-white/10 shadow-sm">
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-semibold">
          <button
            type="button"
            onClick={() => setFilterStatus('ALL')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              filterStatus === 'ALL' ? 'bg-neutral-900 text-white shadow-sm' : 'text-neutral-600 hover:bg-neutral-100 dark:hover:bg-white/5'
            }`}
          >
            {t('admin.factures.filterAll')} ({requests.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus(filterStatus === 'pending' ? 'ALL' : 'pending')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              filterStatus === 'pending' ? 'bg-amber-600 text-white shadow-sm' : 'text-amber-800 hover:bg-amber-50 dark:hover:bg-amber-500/10'
            }`}
          >
            <span>{t('admin.factures.statusPending')}</span>
            <span className="px-1.5 rounded-full text-[10px] bg-amber-800/60 text-white">{counts.pending}</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus(filterStatus === 'in_progress' ? 'ALL' : 'in_progress')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              filterStatus === 'in_progress' ? 'bg-sky-600 text-white shadow-sm' : 'text-sky-800 hover:bg-sky-50 dark:hover:bg-sky-500/10'
            }`}
          >
            <span>{t('admin.factures.statusPending')}</span>
            <span className="px-1.5 rounded-full text-[10px] bg-sky-800/60 text-white">{counts.in_progress}</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus(filterStatus === 'completed' ? 'ALL' : 'completed')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              filterStatus === 'completed' ? 'bg-emerald-600 text-white shadow-sm' : 'text-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-500/10'
            }`}
          >
            <span>{t('admin.factures.statusAvailable')}</span>
            <span className="px-1.5 rounded-full text-[10px] bg-emerald-800/60 text-white">{counts.completed}</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus(filterStatus === 'archived' ? 'ALL' : 'archived')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              filterStatus === 'archived' ? 'bg-neutral-700 text-white shadow-sm' : 'text-neutral-600 hover:bg-neutral-100 dark:hover:bg-white/5'
            }`}
          >
            <span>{t('admin.factures.filterArchived')}</span>
            <span className="px-1.5 rounded-full text-[10px] bg-neutral-700/70 text-white">{counts.archived}</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus(filterStatus === 'generated' ? 'ALL' : 'generated')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              filterStatus === 'generated' ? 'bg-violet-600 text-white shadow-sm' : 'text-violet-700 hover:bg-violet-50 dark:hover:bg-violet-500/10'
            }`}
          >
            <span>Générées</span>
            <span className="px-1.5 rounded-full text-[10px] bg-violet-700/60 text-white">{counts.generated ?? 0}</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus(filterStatus === 'sent' ? 'ALL' : 'sent')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              filterStatus === 'sent' ? 'bg-teal-600 text-white shadow-sm' : 'text-teal-700 hover:bg-teal-50 dark:hover:bg-teal-500/10'
            }`}
          >
            <span className="text-xs">Envoyées</span>
            <span className="px-1.5 rounded-full text-[10px] bg-teal-700/60 text-white">{counts.sent ?? 0}</span>
          </button>
          {/* Séparateur + Corbeille */}
          <span className="w-px h-5 bg-neutral-200 dark:bg-white/10 mx-1 shrink-0" />
          <button
            type="button"
            onClick={() => setFilterStatus(filterStatus === 'trash' ? 'ALL' : 'trash')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              filterStatus === 'trash' ? 'bg-rose-600 text-white shadow-sm' : 'text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-500/10'
            }`}
          >
            <Trash2 className="w-3 h-3" />
            <span>Corbeille</span>
            {(counts.trash ?? 0) > 0 && (
              <span className="px-1.5 rounded-full text-[10px] bg-rose-700/60 text-white">{counts.trash}</span>
            )}
          </button>
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t('admin.factures.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-neutral-50 dark:bg-zinc-800 border border-neutral-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-neutral-400"
          />
        </div>
      </div>

      {/* Bannière corbeille */}
      {filterStatus === 'trash' && (
        <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-300 text-xs font-semibold">
          <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>
            <strong>Corbeille :</strong> Les factures ci-dessous ont été supprimées de l&apos;espace client.
            Cliquez sur &quot;Supprimer définitivement&quot; pour les effacer de façon irréversible depuis Firestore.
          </span>
        </div>
      )}

      {/* 4. Tableau des factures avec dépliage */}
      <div className="bg-white dark:bg-zinc-900 border border-neutral-200/80 dark:border-white/10 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-neutral-50 dark:bg-white/[0.02] border-b border-neutral-200 dark:border-white/10 font-mono text-neutral-500 uppercase tracking-wider text-[11px]">
                <th className="p-4">{t('admin.factures.colRef')}</th>
                <th className="p-4">{t('admin.factures.colProfile')}</th>
                <th className="p-4">{t('admin.factures.colEmissionDate')}</th>
                <th className="p-4">{t('admin.factures.colAmountTtc')}</th>
                <th className="p-4 text-center">{t('admin.factures.columns.status')}</th>
                <th className="p-4 text-right">{t('admin.factures.colAction')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-white/5">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-neutral-400">
                    {requests.length === 0 ? t('admin.factures.emptyAllTitle') : t('admin.factures.emptyFiltered')}
                  </td>
                </tr>
              ) : (
                filtered.map((inv) => {
                  const isExpanded = expandedInvoiceId === inv.id;
                  const firstItem: InvoiceItem | undefined = inv.items[0];
                  return (
                    <FragmentRow key={inv.id}>
                      {/* Ligne principale (cliquable) */}
                      <tr
                        onClick={() => toggleRow(inv.id)}
                        className={`hover:bg-neutral-50/90 dark:hover:bg-white/[0.02] transition-colors cursor-pointer ${isExpanded ? 'bg-neutral-50/60 dark:bg-white/[0.03]' : ''}`}
                        title={t('admin.factures.rowTitle')}
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-extrabold text-neutral-900 dark:text-white text-xs">
                              {inv.invoiceNumber || '—'}
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5 text-neutral-400" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
                            )}
                          </div>
                          <div className="text-[11px] text-neutral-500 font-mono">
                            {t('admin.factures.orderLabel')}{' '}
                            <span className="font-semibold text-neutral-700 dark:text-neutral-300">{inv.orderNumber}</span>
                          </div>
                          {firstItem && (
                            <div className="text-[11px] text-neutral-400 mt-0.5 line-clamp-1 max-w-[200px]">
                              {firstItem.productName}
                            </div>
                          )}
                        </td>

                        <td className="p-4">
                          <div className="flex items-center gap-2.5">
                            <CustomerAvatar
                              photo={inv.customerPhoto}
                              name={inv.customerName}
                              isB2B={inv.isB2B}
                              fallbackText={t('admin.factures.customerNameFallback')}
                            />
                            <div>
                              <div className="font-extrabold text-neutral-900 dark:text-white text-xs">
                                {inv.customerName || t('admin.factures.customerNameFallback')}
                              </div>
                              {inv.isB2B && inv.siret ? (
                                <div className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1">
                                  <span>{t('admin.factures.siretLabel')}</span>
                                  <strong className="font-bold">{inv.siret}</strong>
                                </div>
                              ) : (
                                <div className="text-[10px] text-neutral-400">
                                  {t('admin.factures.particulierText')} • {inv.customerEmail || '—'}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="p-4 text-neutral-600 dark:text-neutral-400 font-mono text-[11px]">
                          {inv.issueDate || '—'}
                        </td>

                        <td className="p-4 font-mono font-extrabold text-neutral-900 dark:text-white text-xs">
                          {money(inv.totalTtc)} €
                          <span className="block text-[10px] font-normal text-neutral-400 font-mono">
                            HT : {money(inv.subtotal)} €
                          </span>
                        </td>

                        <td className="p-4 text-center">
                          <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full border ${statusBadgeClass(inv.status)}`}>
                            <StatusBadgeIcon status={inv.status} />
                            <span>{statusLabel(inv.status)}</span>
                          </span>
                        </td>

                        <td className="p-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleRow(inv.id);
                              }}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer border shadow-sm ${
                                isExpanded
                                  ? 'bg-neutral-800 text-white border-neutral-700 hover:bg-neutral-700'
                                  : 'bg-white dark:bg-zinc-800 text-neutral-800 dark:text-neutral-200 border-neutral-300 dark:border-white/10 hover:bg-neutral-100'
                              }`}
                              title={isExpanded ? t('admin.factures.collapseTitle') : t('admin.factures.expandTitle')}
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronUp className="w-3.5 h-3.5 text-[#38E044]" />
                                  <span>{t('admin.factures.btnCollapse')}</span>
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />
                                  <span>{t('admin.factures.btnExpand')}</span>
                                </>
                              )}
                            </button>

                            {inv.status === 'trash' ? (
                              /* Vue corbeille : bouton supprimer définitivement */
                              <button
                                type="button"
                                disabled={isBusy(inv.id)}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConfirmDeleteId(inv.id);
                                }}
                                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-sm border border-rose-500/50 disabled:opacity-60"
                                title="Supprimer définitivement cette facture"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Supprimer définitivement</span>
                              </button>
                            ) : (
                              /* Vue normale : bouton Instruire + bouton corbeille */
                              <>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedInvoice(inv);
                                  }}
                                  className="px-3.5 py-1.5 rounded-xl bg-neutral-900 dark:bg-zinc-800 hover:bg-black text-white font-bold text-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-sm border border-transparent dark:border-white/10"
                                  title={t('admin.factures.instructTooltip')}
                                >
                                  <EyeIcon />
                                  <span>{t('admin.factures.btnInstruct')}</span>
                                </button>
                                <button
                                  type="button"
                                  disabled={isBusy(inv.id)}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMoveToTrash(inv);
                                  }}
                                  className="p-1.5 rounded-xl text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer disabled:opacity-40"
                                  title="Mettre à la corbeille"
                                >
                                  {isBusy(inv.id) ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Vue détaillée expandable */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={6} className="p-4 sm:p-6 bg-neutral-50/70 dark:bg-white/[0.02] border-b border-neutral-200 dark:border-white/10">
                            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-neutral-200 dark:border-white/10 p-5 sm:p-6 shadow-sm space-y-5">
                              {/* Header de la commande */}
                              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-neutral-100 dark:border-white/10">
                                <div className="flex items-center gap-3 flex-wrap">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono font-extrabold text-sm text-neutral-900 dark:text-white">
                                      {inv.orderNumber}
                                    </span>
                                    <span className="text-xs text-neutral-400">
                                      • {t('admin.factures.orderHeaderOrdered')} {inv.issueDate || '—'}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border ${statusBadgeClass(inv.status)}`}>
                                    <StatusBadgeIcon status={inv.status} />
                                    <span>{statusLabel(inv.status)}</span>
                                  </span>

                                  <button
                                    type="button"
                                    onClick={collapseAll}
                                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 text-neutral-800 dark:text-neutral-200 text-xs font-bold border border-neutral-300 dark:border-white/10 transition-all cursor-pointer shadow-sm active:scale-95"
                                    title={t('admin.factures.collapseReplierTitle')}
                                  >
                                    <ChevronUp className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
                                    <span>{t('admin.factures.btnCollapseReplier')}</span>
                                  </button>
                                </div>
                              </div>

                              {/* Ligne produit */}
                              {firstItem && (
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-3.5 rounded-2xl bg-neutral-50/60 dark:bg-white/[0.03] border border-neutral-100 dark:border-white/5">
                                  <div className="flex items-center gap-4 min-w-0">
                                    {firstItem.productImage ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img
                                        src={firstItem.productImage}
                                        alt={firstItem.productName}
                                        className="w-16 h-16 rounded-2xl object-cover border border-neutral-200 shrink-0"
                                      />
                                    ) : (
                                      <div className="w-16 h-16 rounded-2xl bg-neutral-100 border border-neutral-200 flex items-center justify-center shrink-0">
                                        <FileText className="w-6 h-6 text-neutral-400" />
                                      </div>
                                    )}
                                    <div className="min-w-0">
                                      <div className="text-left font-bold text-sm text-neutral-900 dark:text-white">
                                        {firstItem.productName}
                                      </div>
                                      <div className="flex items-center gap-3 text-xs text-neutral-500 mt-1 flex-wrap">
                                        <span>
                                          {t('admin.factures.productQty')}{' '}
                                          <strong className="text-neutral-800 dark:text-neutral-200">{firstItem.quantity}</strong>
                                        </span>
                                        <span>•</span>
                                        <span>
                                          {t('admin.factures.productUnitPrice')}{' '}
                                          <strong className="text-neutral-800 dark:text-neutral-200 font-mono">
                                            {money(firstItem.unitPrice)} €
                                          </strong>
                                        </span>
                                        <span>•</span>
                                        <span>
                                          {t('admin.factures.productTva')} <strong>{percent(inv.vatRate)}%</strong>
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="text-right shrink-0">
                                    <div className="text-sm font-extrabold text-neutral-900 dark:text-white font-mono">
                                      {money(firstItem.lineTotal * (1 + (inv.vatRate || 0)))} {t('admin.factures.ttcShort')}
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Expédition (gauche) et ventilation financière (droite) */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1 text-xs">
                                <div className="p-3.5 rounded-2xl bg-neutral-100/50 dark:bg-white/[0.03] border border-neutral-200/60 dark:border-white/5 space-y-1.5">
                                  <div className="font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                                    <Truck className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-400" />
                                    <span>{t('admin.factures.shippingTitle')}</span>
                                  </div>
                                  {inv.billingAddress ? (
                                    <div className="text-neutral-500 dark:text-neutral-400">
                                      {t('admin.factures.deliveryAddress')} {inv.billingAddress}
                                    </div>
                                  ) : (
                                    <div className="text-neutral-500">{t('admin.factures.noInfo')}</div>
                                  )}
                                </div>

                                <div className="p-3.5 rounded-2xl bg-neutral-100/50 dark:bg-white/[0.03] border border-neutral-200/60 dark:border-white/5 space-y-1.5 text-neutral-600 dark:text-neutral-400">
                                  <div className="flex justify-between">
                                    <span>{t('admin.factures.subtotalHtLabel')}</span>
                                    <span className="font-mono text-neutral-900 dark:text-white">{money(inv.subtotal)} €</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>{t('admin.factures.vatAmountLabel', { rate: percent(inv.vatRate) })}</span>
                                    <span className="font-mono text-neutral-900 dark:text-white">{money(inv.vat)} €</span>
                                  </div>
                                  {inv.discount > 0 && (
                                    <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-medium">
                                      <span className="flex items-center gap-1">
                                        <Tag className="w-3 h-3" />
                                        {t('admin.factures.promoCodeLabel')}
                                      </span>
                                      <span className="font-mono">-{money(inv.discount)} €</span>
                                    </div>
                                  )}
                                  {inv.deliveryCost > 0 && (
                                    <div className="flex justify-between">
                                      <span>{t('admin.factures.shippingTitle')}</span>
                                      <span className="font-mono text-neutral-900 dark:text-white">{money(inv.deliveryCost)} €</span>
                                    </div>
                                  )}
                                  <div className="flex justify-between pt-1.5 border-t border-neutral-200 dark:border-white/10 font-bold text-neutral-900 dark:text-white text-sm">
                                    <span>{t('admin.factures.totalTtcLabel')}</span>
                                    <span className="font-mono font-extrabold text-base">{money(inv.totalTtc)} €</span>
                                  </div>
                                </div>
                              </div>

                              {/* Workflow PennyLane */}
                              <div className="mt-4 p-5 rounded-3xl bg-[#0A0D0E] text-white border border-neutral-800 space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <ShieldCheck className="w-4 h-4 text-[#38E044]" />
                                      <span className="text-xs font-bold uppercase tracking-wider text-neutral-200">
                                        {t('admin.factures.pennylanePanelTitle', { number: inv.invoiceNumber || inv.orderNumber })}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-neutral-400 mt-0.5">{t('admin.factures.pennylanePanelDesc')}</p>
                                  </div>

                                  <div className="flex items-center gap-2 flex-wrap shrink-0">
                                    {inv.status === 'completed' ? (
                                      <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-extrabold bg-[#38E044] text-black px-2.5 py-1 rounded-full shrink-0 shadow-sm">
                                        <FileCheck className="w-3.5 h-3.5" />
                                        HOMOLOGUÉE &amp; PUBLIÉE
                                      </span>
                                    ) : inv.hasCustomCertPdf ? (
                                      <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-1 rounded-full shrink-0">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-[#38E044]" />
                                        PDF CERTIFIÉ PRÊT
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-full shrink-0">
                                        <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                                        PROJET INITIAL NON HOMOLOGUÉ
                                      </span>
                                    )}
                                    <button
                                      type="button"
                                      onClick={handleConnectClick}
                                      className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-2xl bg-[#111713] hover:bg-[#16201a] text-white border border-[#38E044]/40 hover:border-[#38E044]/70 transition-all cursor-pointer shadow-[0_0_12px_rgba(56,224,68,0.15)] shrink-0 active:scale-95 group"
                                      title={t('admin.factures.transferTooltip')}
                                    >
                                      <div className="w-2.5 h-2.5 rounded-full bg-[#38E044] shadow-[0_0_8px_#38E044] group-hover:scale-110 transition-transform shrink-0" />
                                      <span className="text-xs tracking-wide">
                                        <span className="text-neutral-300 font-semibold">{t('admin.factures.transferToConnect')}</span>
                                        <span className="text-white font-extrabold font-mono">PIXIATECH </span>
                                        <span className="text-[#38E044] font-black font-mono">Connect</span>
                                      </span>
                                      <span className="text-[10px] font-mono font-bold bg-[#1a3821] text-white px-2 py-0.5 rounded-md border border-[#38E044]/30 shadow-sm">
                                        {t('admin.factures.transferSoon')}
                                      </span>
                                    </button>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                  {/* Étape 1 : Télécharger le modèle */}
                                  <div className="p-3.5 rounded-2xl bg-neutral-900/90 border border-neutral-800 space-y-2.5 flex flex-col justify-between">
                                    <div>
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                                          <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px] font-mono">
                                            1
                                          </span>
                                          <span>{t('admin.factures.step1Title')}</span>
                                        </div>
                                        <span className="text-[10px] font-mono text-neutral-400 bg-neutral-800/80 px-2 py-0.5 rounded border border-neutral-700">
                                          Modèle PIX
                                        </span>
                                      </div>
                                      <p className="text-[11px] text-neutral-400 mt-1.5 leading-relaxed">{t('admin.factures.step1Desc')}</p>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleDownloadModel(inv)}
                                      className="w-full py-2 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-neutral-700 shadow-sm"
                                    >
                                      <Download className="w-3.5 h-3.5 text-[#38E044]" />
                                      <span>{t('admin.factures.step1Btn')}</span>
                                    </button>
                                  </div>

                                  {/* Étape 2 : Uploader la facture certifiée */}
                                  <div
                                    className={`p-3.5 rounded-2xl bg-neutral-900/90 border transition-all space-y-2.5 flex flex-col justify-between ${
                                      inv.hasCustomCertPdf
                                        ? 'border-emerald-500/50 shadow-[0_0_15px_rgba(56,224,68,0.1)]'
                                        : 'border-neutral-800'
                                    }`}
                                  >
                                    <div>
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-xs font-bold text-sky-400">
                                          <span
                                            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono ${
                                              inv.hasCustomCertPdf
                                                ? 'bg-emerald-500/20 text-emerald-400'
                                                : 'bg-sky-500/20 text-sky-400'
                                            }`}
                                          >
                                            2
                                          </span>
                                          <span>{t('admin.factures.step2Title')}</span>
                                        </div>

                                        {inv.hasCustomCertPdf ? (
                                          <span className="inline-flex items-center gap-1 text-[10px] font-bold font-mono px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                            <Check className="w-3 h-3 text-[#38E044]" />
                                            <span>Fichier présent</span>
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center gap-1 text-[10px] font-medium font-mono px-2 py-0.5 rounded-md bg-neutral-800 text-neutral-400 border border-neutral-700">
                                            En attente
                                          </span>
                                        )}
                                      </div>

                                      <p className="text-[11px] text-neutral-400 mt-1.5 leading-relaxed">
                                        {t('admin.factures.step2Desc')}
                                      </p>
                                    </div>

                                    <div className="space-y-2">
                                      {inv.hasCustomCertPdf ? (
                                        <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 space-y-2">
                                          <div className="flex items-start gap-2">
                                            <FileCheck className="w-4 h-4 text-[#38E044] shrink-0 mt-0.5" />
                                            <div className="min-w-0 flex-1">
                                              <div className="font-mono text-xs font-bold text-white truncate" title={inv.certPdfName || 'facture-certifiee.pdf'}>
                                                {inv.certPdfName || 'facture-certifiee.pdf'}
                                              </div>
                                              <div className="text-[10px] text-emerald-400/90 font-medium mt-0.5">
                                                {inv.certifiedUploadedAt
                                                  ? `Téléversé le ${new Date(inv.certifiedUploadedAt).toLocaleDateString('fr-FR', {
                                                      day: '2-digit',
                                                      month: '2-digit',
                                                      year: 'numeric',
                                                      hour: '2-digit',
                                                      minute: '2-digit',
                                                    })}`
                                                  : 'Fichier officiel certifié actif'}
                                              </div>
                                            </div>
                                          </div>

                                          <div className="flex items-center gap-1.5 pt-1.5 border-t border-emerald-500/20">
                                            <button
                                              type="button"
                                              onClick={() => window.open(`/api/admin/invoices/${inv.id}/pdf`, '_blank')}
                                              className="flex-1 py-1 px-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 text-[10px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                                              title="Consulter le PDF certifié dans un nouvel onglet"
                                            >
                                              <Eye className="w-3 h-3 text-[#38E044]" />
                                              <span>Voir le PDF</span>
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => window.open(`/api/admin/invoices/${inv.id}/pdf?download=1`, '_blank')}
                                              className="flex-1 py-1 px-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[10px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                                              title="Télécharger une copie du PDF certifié"
                                            >
                                              <Download className="w-3 h-3 text-neutral-300" />
                                              <span>Télécharger</span>
                                            </button>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="p-2.5 rounded-xl bg-neutral-950/70 border border-neutral-800 text-[11px] text-neutral-400 flex items-center gap-2">
                                          <FileX className="w-4 h-4 text-amber-400/80 shrink-0" />
                                          <div className="leading-snug">
                                            <span className="font-semibold text-neutral-300">Aucun PDF certifié importé</span>
                                            <p className="text-[10px] text-neutral-500 mt-0.5">
                                              Le projet auto-généré sert de modèle tant qu&apos;aucun fichier officiel n&apos;est importé.
                                            </p>
                                          </div>
                                        </div>
                                      )}

                                      <button
                                        type="button"
                                        disabled={uploadingInvoiceId === inv.id}
                                        onClick={() => triggerUpload(inv.id)}
                                        className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm disabled:opacity-60 ${
                                          inv.hasCustomCertPdf
                                            ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700'
                                            : 'bg-sky-600 hover:bg-sky-500 text-white border border-sky-500/50 shadow-[0_0_12px_rgba(2,132,199,0.25)]'
                                        }`}
                                      >
                                        {uploadingInvoiceId === inv.id ? (
                                          <>
                                            <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                                            <span>Téléversement en cours...</span>
                                          </>
                                        ) : (
                                          <>
                                            <FileUp className={`w-3.5 h-3.5 ${inv.hasCustomCertPdf ? 'text-neutral-400' : 'text-white'}`} />
                                            <span>{inv.hasCustomCertPdf ? 'Remplacer le PDF Certifié' : 'Uploader le PDF Certifié'}</span>
                                          </>
                                        )}
                                      </button>
                                    </div>
                                  </div>

                                  {/* Étape 3 : Publication Client */}
                                  <div
                                    className={`p-3.5 rounded-2xl bg-neutral-900/90 border transition-all space-y-2.5 flex flex-col justify-between ${
                                      inv.status === 'completed'
                                        ? 'border-emerald-500/30'
                                        : inv.hasCustomCertPdf
                                          ? 'border-[#38E044]/40 shadow-[0_0_15px_rgba(56,224,68,0.1)]'
                                          : 'border-neutral-800'
                                    }`}
                                  >
                                    <div>
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                                          <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-mono">
                                            3
                                          </span>
                                          <span>{t('admin.factures.step3Title')}</span>
                                        </div>

                                        {inv.status === 'completed' ? (
                                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-[#38E044] border border-emerald-500/40">
                                            <Check className="w-3 h-3" />
                                            En ligne
                                          </span>
                                        ) : inv.hasCustomCertPdf ? (
                                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-[#38E044]/20 text-[#38E044] border border-[#38E044]/40 animate-pulse">
                                            Prêt
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium px-2 py-0.5 rounded-md bg-neutral-800 text-neutral-500 border border-neutral-700">
                                            Verrouillé
                                          </span>
                                        )}
                                      </div>

                                      {inv.status === 'completed' ? (
                                        <p className="text-[11px] text-neutral-400 mt-1.5 leading-relaxed">
                                          <span className="text-emerald-400 font-semibold">{t('admin.factures.step3DescPublished')}</span>
                                        </p>
                                      ) : !inv.hasCustomCertPdf ? (
                                        <p className="text-[11px] text-amber-400/90 mt-1.5 leading-relaxed">
                                          ⚠️ Uploadez d&apos;abord le PDF certifié à l&apos;étape 2 pour débloquer la publication au client.
                                        </p>
                                      ) : (
                                        <p className="text-[11px] text-neutral-300 mt-1.5 leading-relaxed">
                                          <span className="text-[#38E044] font-bold">✓ PDF certifié validé.</span> Cliquez pour publier la facture officielle sur l&apos;espace client.
                                        </p>
                                      )}
                                    </div>

                                    {inv.status === 'completed' ? (
                                      <button
                                        type="button"
                                        disabled={isBusy(inv.id)}
                                        onClick={() => handleResetToInProgress(inv)}
                                        className="w-full py-2 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold transition-colors cursor-pointer text-center border border-neutral-700 disabled:opacity-60"
                                      >
                                        {isBusy(inv.id) ? (
                                          <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" />
                                        ) : (
                                          t('admin.factures.step3BtnRepasse')
                                        )}
                                      </button>
                                    ) : (
                                      <button
                                        type="button"
                                        disabled={isBusy(inv.id) || !inv.hasCustomCertPdf}
                                        onClick={() => handlePublish(inv)}
                                        title={
                                          !inv.hasCustomCertPdf
                                            ? "Téléversez le PDF certifié (Étape 2) pour débloquer la publication"
                                            : "Publier la facture officielle certifiée"
                                        }
                                        className={`w-full py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all shadow-md ${
                                          !inv.hasCustomCertPdf
                                            ? 'bg-neutral-800 text-neutral-500 border border-neutral-700/60 cursor-not-allowed opacity-50'
                                            : 'bg-[#38E044] hover:bg-[#2ecc3a] text-black cursor-pointer shadow-[0_0_20px_rgba(56,224,68,0.3)] active:scale-95'
                                        }`}
                                      >
                                        {isBusy(inv.id) ? (
                                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        ) : (
                                          <Check className="w-4 h-4 stroke-[3]" />
                                        )}
                                        <span>
                                          {!inv.hasCustomCertPdf
                                            ? 'Publier (PDF certifié requis)'
                                            : 'Publier la Facture Certifiée'}
                                        </span>
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Barre de pied */}
                              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-neutral-200 dark:border-white/10">
                                <div className="text-[11px] text-neutral-500 flex items-center gap-2">
                                  <span>
                                    {t('admin.factures.orderLabel')} <strong>{inv.orderNumber}</strong> • {t('admin.factures.colRef')}{' '}
                                    <strong>{inv.invoiceNumber || '—'}</strong>
                                  </span>
                                  <span>•</span>
                                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                                    {t('admin.factures.footerDataSynced')}
                                  </span>
                                </div>

                                <button
                                  type="button"
                                  onClick={collapseAll}
                                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-900 dark:bg-zinc-800 hover:bg-black text-white text-xs font-bold transition-all cursor-pointer shadow-md active:scale-95"
                                  title={t('admin.factures.footerCollapseTitle')}
                                >
                                  <ChevronUp className="w-4 h-4 text-[#38E044]" />
                                  <span>{t('admin.factures.footerCollapseBtn')}</span>
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </FragmentRow>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal confirmation suppression définitive */}
      {confirmDeleteId && (() => {
        const inv = requests.find((r) => r.id === confirmDeleteId);
        if (!inv) return null;
        return (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-rose-300 dark:border-rose-500/40 space-y-5">
              {/* Header */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-500/20 flex items-center justify-center shrink-0">
                  <Trash2 className="w-6 h-6 text-rose-600 dark:text-rose-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-neutral-900 dark:text-white">Suppression définitive</h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">Cette action est <strong className="text-rose-600">irréversible</strong></p>
                </div>
              </div>

              {/* Détails */}
              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-xs space-y-1.5">
                <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-semibold">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>La facture sera supprimée définitivement de Firestore.</span>
                </div>
                <ul className="list-disc list-inside text-rose-700 dark:text-rose-400 space-y-1 pl-1">
                  <li>Le document sera effacé de la base de données</li>
                  <li>La facture ne sera plus accessible ni côté admin, ni côté client</li>
                  <li>Cette opération ne peut pas être annulée</li>
                </ul>
              </div>

              {/* Infos de la facture */}
              <div className="p-3 rounded-xl bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-xs text-neutral-600 dark:text-neutral-400 space-y-1">
                <div><span className="font-semibold text-neutral-900 dark:text-white">Facture :</span> {inv.invoiceNumber || '—'}</div>
                <div><span className="font-semibold text-neutral-900 dark:text-white">Commande :</span> {inv.orderNumber}</div>
                <div><span className="font-semibold text-neutral-900 dark:text-white">Client :</span> {inv.customerName}</div>
                <div><span className="font-semibold text-neutral-900 dark:text-white">Montant TTC :</span> {money(inv.totalTtc)} €</div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(null)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold border border-neutral-200 dark:border-white/10 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  disabled={isBusy(inv.id)}
                  onClick={() => handleDeletePermanently(inv)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-extrabold bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer shadow-md shadow-rose-500/20 inline-flex items-center justify-center gap-1.5 disabled:opacity-60"
                >
                  {isBusy(inv.id) ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  <span>Supprimer définitivement</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 5. Modal d'instruction */}
      {selectedInvoice && !showPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 border border-neutral-200 dark:border-white/10 max-h-[90vh] overflow-y-auto my-6">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-200 dark:border-white/10">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                    {t('admin.factures.instructTitle', { number: selectedInvoice.invoiceNumber || selectedInvoice.orderNumber })}
                  </h2>
                  <span className="text-[10px] font-mono font-bold bg-neutral-100 dark:bg-white/10 text-neutral-800 dark:text-neutral-200 px-2 py-0.5 rounded border border-neutral-200 dark:border-white/10">
                    {t('admin.factures.orderBadge', { number: selectedInvoice.orderNumber })}
                  </span>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  {t('admin.factures.instructClient')} <strong>{selectedInvoice.customerName || t('admin.factures.customerNameFallback')}</strong>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="p-1.5 rounded-xl text-neutral-400 hover:text-black dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Étape 1 : Téléchargement du modèle */}
            <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-950 dark:text-amber-400">
                  <Download className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                  <span>{t('admin.factures.step1DownloadTitle')}</span>
                </div>
                <button
                  type="button"
                  onClick={() => openPrintModal(selectedInvoice)}
                  className="px-3 py-1.5 rounded-xl bg-amber-900 hover:bg-black text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <EyeIcon />
                  <span>{t('admin.factures.btnSeeAndPrint')}</span>
                </button>
              </div>
              <p className="text-[11px] text-amber-900 dark:text-amber-400 leading-relaxed">{t('admin.factures.step1DownloadDesc')}</p>
            </div>

            {/* Étape 2 : Uploader la facture certifiée */}
            <div
              className={`p-5 rounded-2xl bg-[#0A0D0E] text-white border transition-all space-y-3.5 ${
                selectedInvoice.hasCustomCertPdf
                  ? 'border-emerald-500/50 shadow-[0_0_15px_rgba(56,224,68,0.15)]'
                  : 'border-neutral-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#38E044]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-200">
                    {t('admin.factures.step2UploadTitle')}
                  </span>
                </div>
                {selectedInvoice.hasCustomCertPdf ? (
                  <span className="text-[10px] font-bold bg-[#38E044] text-black px-2.5 py-0.5 rounded-full font-mono flex items-center gap-1">
                    <Check className="w-3 h-3 text-black stroke-[3]" />
                    {t('admin.factures.certifieeBadge')}
                  </span>
                ) : (
                  <span className="text-[10px] font-medium bg-neutral-800 text-neutral-400 border border-neutral-700 px-2 py-0.5 rounded-md font-mono">
                    En attente d&apos;upload
                  </span>
                )}
              </div>

              <p className="text-[11px] text-neutral-400 leading-relaxed">{t('admin.factures.step2UploadDesc')}</p>

              {selectedInvoice.hasCustomCertPdf ? (
                <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <FileCheck className="w-5 h-5 text-[#38E044] shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <div className="font-mono text-xs font-bold text-white truncate" title={selectedInvoice.certPdfName || 'facture-certifiee.pdf'}>
                        {selectedInvoice.certPdfName || 'facture-certifiee.pdf'}
                      </div>
                      <div className="text-[10px] text-emerald-400/90 font-medium mt-0.5">
                        {selectedInvoice.certifiedUploadedAt
                          ? `Téléversé le ${new Date(selectedInvoice.certifiedUploadedAt).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}`
                          : 'Fichier officiel certifié actif'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-emerald-500/20">
                    <button
                      type="button"
                      onClick={() => window.open(`/api/admin/invoices/${selectedInvoice.id}/pdf`, '_blank')}
                      className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      title="Consulter le PDF certifié"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#38E044]" />
                      <span>Consulter le PDF</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => window.open(`/api/admin/invoices/${selectedInvoice.id}/pdf?download=1`, '_blank')}
                      className="flex-1 py-1.5 px-3 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      title="Télécharger le fichier"
                    >
                      <Download className="w-3.5 h-3.5 text-neutral-300" />
                      <span>Télécharger</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-400 flex items-center gap-2.5">
                  <FileX className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <span className="font-semibold text-neutral-300">Aucun PDF officiel téléversé</span>
                    <p className="text-[10px] text-neutral-500 mt-0.5">
                      Le modèle auto-généré sert de document temporaire jusqu&apos;à l&apos;import de la facture officielle.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={uploadingInvoiceId === selectedInvoice.id}
                  onClick={() => triggerUpload(selectedInvoice.id)}
                  className={`w-full sm:w-auto px-4 py-2 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer border shadow-sm disabled:opacity-60 ${
                    selectedInvoice.hasCustomCertPdf
                      ? 'bg-neutral-800 hover:bg-neutral-700 text-white border-neutral-700'
                      : 'bg-sky-600 hover:bg-sky-500 text-white border-sky-500/50 shadow-[0_0_12px_rgba(2,132,199,0.3)]'
                  }`}
                >
                  {uploadingInvoiceId === selectedInvoice.id ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                      <span>Téléversement en cours...</span>
                    </>
                  ) : (
                    <>
                      <FileUp className={`w-3.5 h-3.5 ${selectedInvoice.hasCustomCertPdf ? 'text-neutral-400' : 'text-white'}`} />
                      <span>
                        {selectedInvoice.hasCustomCertPdf
                          ? 'Remplacer par un autre PDF certifié'
                          : 'Uploader la Facture Certifiée'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Étape 3 : Statut & publication */}
            <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200 dark:border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                  {t('admin.factures.step3StatusTitle')}
                </span>
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${statusBadgeClass(selectedInvoice.status)}`}>
                  {t('admin.factures.step3StatusPrefix')} {statusLabel(selectedInvoice.status)}
                </span>
              </div>

              {!selectedInvoice.hasCustomCertPdf && selectedInvoice.status !== 'completed' && (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-700 dark:text-amber-400">
                  ⚠️ Uploadez d&apos;abord le PDF certifié (Étape 2) pour pouvoir publier la facture au client.
                </div>
              )}

              {selectedInvoice.status === 'completed' && (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
                  ✓ Facture officielle certifiée publiée et disponible pour le client.
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  disabled={isBusy(selectedInvoice.id)}
                  onClick={() => handleMoveInProgress(selectedInvoice)}
                  className={`p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    selectedInvoice.status === 'in_progress'
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'bg-white dark:bg-zinc-800 border border-neutral-200 dark:border-white/10 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>{t('admin.factures.statusStep2')}</span>
                </button>

                <button
                  type="button"
                  disabled={isBusy(selectedInvoice.id) || !selectedInvoice.hasCustomCertPdf || selectedInvoice.status === 'completed'}
                  onClick={() => handlePublish(selectedInvoice)}
                  title={
                    !selectedInvoice.hasCustomCertPdf
                      ? "PDF certifié requis à l'étape 2"
                      : selectedInvoice.status === 'completed'
                        ? 'Déjà publiée'
                        : 'Publier la facture certifiée au client'
                  }
                  className={`p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    selectedInvoice.status === 'completed'
                      ? 'bg-[#38E044] text-black shadow-sm font-black opacity-80 cursor-default'
                      : !selectedInvoice.hasCustomCertPdf
                        ? 'bg-neutral-200 dark:bg-zinc-800 text-neutral-400 border border-neutral-300 dark:border-white/10 cursor-not-allowed opacity-50'
                        : 'bg-[#38E044] hover:bg-[#2ecc3a] text-black shadow-sm cursor-pointer'
                  }`}
                >
                  {isBusy(selectedInvoice.id) ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  <span>{t('admin.factures.statusStep3')}</span>
                </button>

                {selectedInvoice.status === 'completed' ? (
                  <button
                    type="button"
                    disabled={isBusy(selectedInvoice.id)}
                    onClick={() => handleResetToInProgress(selectedInvoice)}
                    className="p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 cursor-pointer col-span-2 sm:col-span-1"
                  >
                    <span>Repasser en cours</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isBusy(selectedInvoice.id)}
                    onClick={handleSetPending}
                    className={`p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      selectedInvoice.status === 'pending'
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'bg-white dark:bg-zinc-800 border border-neutral-200 dark:border-white/10 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>{t('admin.factures.statusStep1')}</span>
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-200 dark:border-white/10">
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2 text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/5 rounded-xl cursor-pointer"
              >
                {t('admin.factures.btnClose')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Modèle PennyLane imprimable */}
      {showPrintModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl space-y-6 border border-neutral-200 my-8 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-200 print:hidden">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-extrabold text-sm text-neutral-900 bg-neutral-100 px-3 py-1 rounded-xl">
                    {t('admin.factures.printModalTitle', {
                      number: selectedInvoice.invoiceNumber || selectedInvoice.orderNumber,
                    })}
                  </span>
                  <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-semibold">
                    {t('admin.factures.printModalBadge')}
                  </span>
                </div>
                <p className="text-xs text-neutral-500 mt-1">{t('admin.factures.printModalDesc')}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0A0D0E] hover:bg-neutral-800 text-white text-xs font-bold transition-all shadow-sm cursor-pointer print:hidden"
                >
                  <Printer className="w-3.5 h-3.5 text-[#38E044]" />
                  <span>{t('admin.factures.btnPrint')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPrintModal(false)}
                  className="p-1.5 rounded-xl text-neutral-400 hover:text-black cursor-pointer print:hidden"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 sm:p-8 rounded-2xl bg-white border border-neutral-200 space-y-6 text-xs text-neutral-800">
              <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 text-center text-amber-900 font-mono text-[11px] font-bold">
                {t('admin.factures.printWatermark')}
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b-2 border-neutral-900">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-2xl tracking-wider font-mono text-black">PIXIATECH</span>
                    <span className="bg-[#38E044] text-black font-extrabold text-[10px] px-2 py-0.5 rounded-full font-mono">
                      {t('admin.factures.printEmitter')}
                    </span>
                  </div>
                  <div className="text-[11px] text-neutral-600 mt-2 space-y-0.5">
                    <p className="font-bold text-neutral-900">{t('admin.factures.printEmitterCompany')}</p>
                    <p>{t('admin.factures.printEmitterAddress')}</p>
                    <p>{t('admin.factures.printEmitterSiret')}</p>
                    <p>{t('admin.factures.printEmitterVat')}</p>
                  </div>
                </div>

                <div className="text-left sm:text-right font-mono">
                  <div className="text-xl font-black text-neutral-900">{t('admin.factures.printTitle')}</div>
                  <div className="text-sm font-bold text-neutral-800 mt-1">
                    {t('admin.factures.printNumber', { number: selectedInvoice.invoiceNumber || selectedInvoice.orderNumber })}
                  </div>
                  <div className="text-[11px] text-neutral-500 mt-1">
                    {t('admin.factures.printEmissionDate', { date: selectedInvoice.issueDate || '—' })}
                  </div>
                  <div className="text-[11px] text-neutral-500">
                    {t('admin.factures.printOrderRef', { number: selectedInvoice.orderNumber })}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-neutral-50 border border-neutral-200">
                <div>
                  <span className="font-mono font-bold text-[10px] text-neutral-400 uppercase tracking-wider block mb-1">
                    {t('admin.factures.printBilledTo')}
                  </span>
                  <div className="font-bold text-sm text-neutral-900">
                    {selectedInvoice.customerName || t('admin.factures.customerNameFallback')}
                  </div>
                  {selectedInvoice.billingAddress && (
                    <div className="text-[11px] text-neutral-600 mt-1">{selectedInvoice.billingAddress}</div>
                  )}
                  <div className="text-[11px] text-neutral-600">
                    {selectedInvoice.postalCode} {selectedInvoice.city} ({selectedInvoice.country})
                  </div>
                  <div className="text-[11px] text-neutral-600 mt-1">
                    {t('admin.factures.instructClient')} {selectedInvoice.customerEmail || '—'}
                  </div>
                </div>

                <div>
                  <span className="font-mono font-bold text-[10px] text-neutral-400 uppercase tracking-wider block mb-1">
                    {t('admin.factures.printLegalIds')}
                  </span>
                  {selectedInvoice.siret ? (
                    <div className="space-y-1 text-[11px]">
                      <div>
                        {t('admin.factures.siretLabel')} <strong className="font-mono">{selectedInvoice.siret}</strong>
                      </div>
                      <div className="text-emerald-700 font-semibold mt-1">{t('admin.factures.printVerifiedInsee')}</div>
                    </div>
                  ) : (
                    <div className="text-[11px] text-neutral-600">{t('admin.factures.printParticulier')}</div>
                  )}
                </div>
              </div>

              <div className="border border-neutral-200 rounded-2xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-neutral-100 text-[10px] font-mono uppercase text-neutral-600">
                    <tr>
                      <th className="p-3">{t('admin.factures.printColDesignation')}</th>
                      <th className="p-3 text-center">{t('admin.factures.printColQty')}</th>
                      <th className="p-3 text-right">{t('admin.factures.printColUnitPrice')}</th>
                      <th className="p-3 text-right">{t('admin.factures.printColVatRate')}</th>
                      <th className="p-3 text-right">{t('admin.factures.printColTotalHt')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {selectedInvoice.items.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-3 text-neutral-400">{t('admin.factures.noInfo')}</td>
                      </tr>
                    ) : (
                      selectedInvoice.items.map((item, idx) => (
                        <tr key={`${item.productName}-${idx}`}>
                          <td className="p-3">
                            <div className="font-bold text-neutral-900">{item.productName}</div>
                            {item.variantName && <div className="text-[10px] text-neutral-400">{item.variantName}</div>}
                          </td>
                          <td className="p-3 text-center font-mono">{item.quantity}</td>
                          <td className="p-3 text-right font-mono">{money(item.unitPrice)} €</td>
                          <td className="p-3 text-right font-mono">{percent(selectedInvoice.vatRate)}%</td>
                          <td className="p-3 text-right font-mono font-bold">{money(item.lineTotal)} €</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end">
                <div className="w-full sm:w-72 space-y-2 p-4 rounded-2xl bg-neutral-50 border border-neutral-200 text-xs">
                  <div className="flex justify-between">
                    <span>{t('admin.factures.printTotalHt')}</span>
                    <span className="font-mono font-bold">{money(selectedInvoice.subtotal)} €</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('admin.factures.printVatAmount', { rate: percent(selectedInvoice.vatRate) })}</span>
                    <span className="font-mono">{money(selectedInvoice.vat)} €</span>
                  </div>
                  {selectedInvoice.discount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>{t('admin.factures.promoCodeLabel')}</span>
                      <span className="font-mono">-{money(selectedInvoice.discount)} €</span>
                    </div>
                  )}
                  {selectedInvoice.deliveryCost > 0 && (
                    <div className="flex justify-between">
                      <span>{t('admin.factures.shippingTitle')}</span>
                      <span className="font-mono">{money(selectedInvoice.deliveryCost)} €</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t-2 border-neutral-900 font-extrabold text-sm text-neutral-900">
                    <span>{t('admin.factures.printTotalTtc')}</span>
                    <span className="font-mono">{money(selectedInvoice.totalTtc)} €</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-200 text-[10px] text-neutral-500 space-y-1">
                <p>{t('admin.factures.printPaymentTerms')}</p>
                <p>{t('admin.factures.printLatePayment')}</p>
                <p>{t('admin.factures.printVatNote')}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Input de fichier caché pour le téléversement du PDF certifié */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}

function FragmentRow({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function EyeIcon() {
  return <EyeIconInner />;
}

import { Eye as EyeIconRaw } from 'lucide-react';

function EyeIconInner() {
  return <EyeIconRaw className="w-3.5 h-3.5 text-[#38E044]" />;
}