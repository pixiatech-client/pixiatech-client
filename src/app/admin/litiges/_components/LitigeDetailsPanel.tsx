'use client';

import React from 'react';
import Link from 'next/link';
import {
  ExternalLink,
  User,
  Package,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ImageIcon,
  ShieldAlert,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useI18n, IntlHelpers } from '@/lib/i18n';
import { LitigeAdminActions } from './LitigeAdminActions';
import { LitigeConversation } from './LitigeConversation';
import type { Dispute } from '@/lib/types';

interface LitigeDetailsPanelProps {
  dispute: Dispute | null;
  onStatusChange: (disputeId: string, nextStatus: Dispute['status']) => Promise<void>;
  onDelete: (disputeId: string) => Promise<void>;
  onSendReply: (disputeId: string, text: string) => Promise<void>;
  onReopen: (disputeId: string) => Promise<void>;
  isUpdatingStatus: boolean;
  isDeleting: boolean;
  isSending: boolean;
}

const STATUS_CONFIG: Record<
  Dispute['status'],
  { labelKey: string; color: string; icon: any }
> = {
  open: { labelKey: 'admin.litiges.statusOpenCase', color: 'bg-blue-50 text-blue-800 border-blue-200', icon: AlertCircle },
  in_progress: { labelKey: 'admin.litiges.statusProcessing', color: 'bg-sky-50 text-sky-800 border-sky-200', icon: Clock },
  resolved: { labelKey: 'admin.litiges.statusResolved', color: 'bg-emerald-50 text-emerald-800 border-emerald-200', icon: CheckCircle2 },
  closed: { labelKey: 'admin.litiges.statusClosedCase', color: 'bg-neutral-100 text-neutral-600 border-neutral-200', icon: XCircle },
};

function formatDate(iso?: string, locale?: string) {
  if (!iso) return '-';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return String(iso);
  return IntlHelpers.formatDate(d, (locale as any) || 'fr', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function LitigeDetailsPanel({
  dispute,
  onStatusChange,
  onDelete,
  onSendReply,
  onReopen,
  isUpdatingStatus,
  isDeleting,
  isSending,
}: LitigeDetailsPanelProps) {
  const { t, locale } = useI18n();
  if (!dispute) {
    return (
      <div className="bg-white rounded-3xl border border-neutral-200/80 p-12 text-center shadow-xs flex flex-col items-center justify-center min-h-[500px]">
        <div className="w-14 h-14 rounded-2xl bg-neutral-100 flex items-center justify-center text-neutral-400 mb-3">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-neutral-900">{t('admin.litiges.noSelectionTitle')}</h3>
        <p className="text-xs text-neutral-500 max-w-sm mt-1">
          {t('admin.litiges.noSelectionDesc')}
        </p>
      </div>
    );
  }

  const StatusIcon = STATUS_CONFIG[dispute.status]?.icon || AlertCircle;
  const statusCfg = STATUS_CONFIG[dispute.status] || STATUS_CONFIG.open;

  return (
    <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-xs overflow-hidden flex flex-col min-h-[640px]">
      {/* Panel Header */}
      <div className="p-5 border-b border-neutral-200/80 bg-neutral-50/50 space-y-4">
        {/* Top bar: ID, status badge & client profile link */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-neutral-900">
                {t('admin.litiges.disputeRef', { id: dispute.id.slice(0, 8) })}
              </h2>
              <Badge
                variant="outline"
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${statusCfg.color}`}
              >
                <StatusIcon className="w-3.5 h-3.5" />
                <span>{t(statusCfg.labelKey)}</span>
              </Badge>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              {t('admin.litiges.createdMeta', {
                date: formatDate(dispute.createdAt, locale),
                updated: formatDate(dispute.updatedAt, locale),
              })}
            </p>
          </div>

          <Link
            href={`/admin/membres?email=${encodeURIComponent(dispute.customerEmail)}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-white border border-neutral-200 text-neutral-700 hover:text-black hover:border-neutral-300 shadow-2xs transition-all"
          >
            <User className="w-3.5 h-3.5 text-neutral-500" />
            <span>{t('admin.litiges.customerCard')}</span>
            <ExternalLink className="w-3 h-3 text-neutral-400" />
          </Link>
        </div>

        {/* Customer & Order Context Card */}
        <div className="p-3.5 rounded-2xl bg-white border border-neutral-200/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-2xs">
          <div className="flex items-center gap-3 min-w-0">
            {dispute.productImage ? (
              <img
                src={dispute.productImage}
                alt={dispute.productName || 'Produit'}
                className="w-10 h-10 rounded-xl object-cover border border-neutral-200 shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-neutral-100 border border-neutral-200 shrink-0 flex items-center justify-center text-neutral-400">
                <Package className="w-5 h-5" />
              </div>
            )}
            <div className="min-w-0">
              <div className="font-bold text-neutral-900 truncate">
                {dispute.productName || dispute.reason}
              </div>
              <div className="text-neutral-500 text-[11px] flex items-center gap-1.5 flex-wrap">
                <span>{t('admin.litiges.customerLabel')} <strong className="text-neutral-800">{dispute.customerEmail}</strong></span>
                {dispute.orderNumber && (
                  <>
                    <span>•</span>
                    <span>{t('admin.litiges.orderLabel')} <strong className="font-mono text-neutral-800">{dispute.orderNumber}</strong></span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Admin Action Toolbar */}
        <div className="pt-1 flex items-center justify-between gap-3 flex-wrap">
          <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
            {t('admin.litiges.adminActionsTitle')}
          </span>
          <LitigeAdminActions
            dispute={dispute}
            onStatusChange={onStatusChange}
            onDelete={onDelete}
            isUpdatingStatus={isUpdatingStatus}
            isDeleting={isDeleting}
          />
        </div>
      </div>

      {/* Conversation & Reply */}
      <LitigeConversation
        dispute={dispute}
        onSendReply={onSendReply}
        onReopen={onReopen}
        isSending={isSending}
      />
    </div>
  );
}
