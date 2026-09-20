'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { getDisputes, updateDisputeStatus, replyToDispute, deleteDispute } from '../actions';
import { normalizeSearchText } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import type { Dispute, DisputeMessage } from '@/lib/types';

import { LitigesHeader } from './_components/LitigesHeader';
import { LitigesStats } from './_components/LitigesStats';
import { LitigesList } from './_components/LitigesList';
import { LitigeDetailsPanel } from './_components/LitigeDetailsPanel';

export default function AdminLitigesPage() {
  const { t } = useI18n();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDisputeId, setSelectedDisputeId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'open' | 'resolved' | 'closed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSendingReply, setIsSendingReply] = useState(false);

  const fetchDisputes = async () => {
    setLoading(true);
    try {
      const data = await getDisputes();
      setDisputes(data);
      if (data.length > 0 && !selectedDisputeId) {
        setSelectedDisputeId(data[0].id);
      }
    } catch (err) {
      console.error('[AdminLitigesPage] Fetch error:', err);
      toast.error(t('admin.litiges.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, []);

  // Compute counts for stats & filter chips
  const counts = useMemo(() => {
    return {
      all: disputes.length,
      open: disputes.filter((d) => d.status === 'open' || d.status === 'in_progress').length,
      resolved: disputes.filter((d) => d.status === 'resolved').length,
      closed: disputes.filter((d) => d.status === 'closed').length,
    };
  }, [disputes]);

  // Filter & search
  const filteredDisputes = useMemo(() => {
    let result = disputes;

    if (activeFilter === 'open') {
      result = result.filter((d) => d.status === 'open' || d.status === 'in_progress');
    } else if (activeFilter === 'resolved') {
      result = result.filter((d) => d.status === 'resolved');
    } else if (activeFilter === 'closed') {
      result = result.filter((d) => d.status === 'closed');
    }

    if (searchQuery.trim()) {
      const q = normalizeSearchText(searchQuery);
      result = result.filter((d) => {
        return (
          normalizeSearchText(d.customerEmail || '').includes(q) ||
          normalizeSearchText(d.reason || '').includes(q) ||
          normalizeSearchText(d.description || '').includes(q) ||
          (d.orderNumber && normalizeSearchText(d.orderNumber).includes(q))
        );
      });
    }

    return result;
  }, [disputes, activeFilter, searchQuery]);

  // Active dispute object for the detail panel
  const activeDispute = useMemo(() => {
    if (selectedDisputeId) {
      const found = disputes.find((d) => d.id === selectedDisputeId);
      if (found) return found;
    }
    return filteredDisputes[0] || disputes[0] || null;
  }, [disputes, selectedDisputeId, filteredDisputes]);

  // Actions
  const handleStatusChange = async (disputeId: string, nextStatus: Dispute['status']) => {
    setIsUpdatingStatus(true);
    try {
      await updateDisputeStatus(disputeId, nextStatus);
      const now = new Date().toISOString();
      setDisputes((prev) =>
        prev.map((d) => (d.id === disputeId ? { ...d, status: nextStatus, updatedAt: now } : d))
      );

      const statusLabels: Record<Dispute['status'], string> = {
        open: t('admin.litiges.statusOpen'),
        in_progress: t('admin.litiges.statusProcessing'),
        resolved: t('admin.litiges.statusResolved'),
        closed: t('admin.litiges.statusClosed'),
      };
      toast.success(t('admin.litiges.statusUpdated', { label: statusLabels[nextStatus] }));
    } catch (err) {
      console.error('[AdminLitigesPage] Status update error:', err);
      toast.error(t('admin.litiges.updateError'));
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleSendReply = async (disputeId: string, text: string) => {
    if (!text.trim()) return;
    setIsSendingReply(true);
    try {
      await replyToDispute(disputeId, text.trim());
      const now = new Date().toISOString();
      const newMsg: DisputeMessage = {
        sender: 'admin',
        text: text.trim(),
        createdAt: now,
      };

      setDisputes((prev) =>
        prev.map((d) =>
          d.id === disputeId
            ? {
                ...d,
                messages: [...(d.messages || []), newMsg],
                status: 'in_progress',
                updatedAt: now,
              }
            : d
        )
      );
      toast.success(t('admin.litiges.replySuccess'));
    } catch (err) {
      console.error('[AdminLitigesPage] Reply error:', err);
      toast.error(t('admin.litiges.replyError'));
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleDelete = async (disputeId: string) => {
    setIsDeleting(true);
    try {
      await deleteDispute(disputeId);
      setDisputes((prev) => {
        const remaining = prev.filter((d) => d.id !== disputeId);
        if (selectedDisputeId === disputeId) {
          setSelectedDisputeId(remaining[0]?.id || null);
        }
        return remaining;
      });
      toast.success(t('admin.litiges.deleteSuccess'));
    } catch (err) {
      console.error('[AdminLitigesPage] Delete error:', err);
      toast.error(t('admin.litiges.deleteError'));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReopen = async (disputeId: string) => {
    await handleStatusChange(disputeId, 'in_progress');
  };

  return (
    <div
      className="min-h-screen font-sans"
      style={{ backgroundColor: 'var(--theme-page-bg, #f8f9fa)', color: 'var(--theme-sidebar-text, #0f172a)' }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* 1. Header */}
        <LitigesHeader
          openCount={counts.open}
          loading={loading}
          onRefresh={fetchDisputes}
        />

        {/* 2. Key Metrics Bar */}
        <LitigesStats
          total={counts.all}
          openCount={counts.open}
          resolvedCount={counts.resolved}
          closedCount={counts.closed}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />

        {/* 3. Main Split View or Empty State */}
        {loading && disputes.length === 0 ? (
          <div className="bg-white rounded-3xl border border-neutral-200/80 p-16 text-center shadow-xs">
            <div className="w-10 h-10 mx-auto rounded-full border-2 border-neutral-900 border-t-transparent animate-spin mb-3" />
            <p className="text-xs font-semibold text-neutral-500">{t('admin.litiges.loading')}</p>
          </div>
        ) : disputes.length === 0 ? (
          <div className="bg-white rounded-3xl border border-neutral-200/80 p-14 text-center shadow-xs">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h2 className="text-base font-bold text-neutral-900">{t('admin.litiges.emptyTitle')}</h2>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1">
              {t('admin.litiges.emptyDesc')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Disputes List & Filters (5 cols) */}
            <div className="lg:col-span-5">
              <LitigesList
                disputes={filteredDisputes}
                selectedDisputeId={activeDispute?.id || null}
                onSelectDispute={(id) => setSelectedDisputeId(id)}
                activeFilter={activeFilter}
                onFilterChange={setActiveFilter}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                counts={counts}
              />
            </div>

            {/* Right Column: Active Dispute Details & Conversation (7 cols) */}
            <div className="lg:col-span-7">
              <LitigeDetailsPanel
                dispute={activeDispute}
                onStatusChange={handleStatusChange}
                onDelete={handleDelete}
                onSendReply={handleSendReply}
                onReopen={handleReopen}
                isUpdatingStatus={isUpdatingStatus}
                isDeleting={isDeleting}
                isSending={isSendingReply}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
