'use client';

import React, { useState } from 'react';
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RotateCcw,
  Trash2,
  ChevronDown,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useI18n } from '@/lib/i18n';
import type { Dispute } from '@/lib/types';

interface LitigeAdminActionsProps {
  dispute: Dispute;
  onStatusChange: (disputeId: string, nextStatus: Dispute['status']) => Promise<void>;
  onDelete: (disputeId: string) => Promise<void>;
  isUpdatingStatus: boolean;
  isDeleting: boolean;
}

const STATUS_DETAILS: Record<
  Dispute['status'],
  { labelKey: string; actionKey: string; icon: any; color: string }
> = {
  open: {
    labelKey: 'admin.litiges.statusOpen',
    actionKey: 'admin.litiges.actionOpen',
    icon: Clock,
    color: 'text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-200',
  },
  in_progress: {
    labelKey: 'admin.litiges.statusInProgress',
    actionKey: 'admin.litiges.actionResolve',
    icon: CheckCircle2,
    color: 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200',
  },
  resolved: {
    labelKey: 'admin.litiges.statusResolved',
    actionKey: 'admin.litiges.actionClose',
    icon: XCircle,
    color: 'text-neutral-700 bg-neutral-100 hover:bg-neutral-200 border-neutral-300',
  },
  closed: {
    labelKey: 'admin.litiges.statusClosed',
    actionKey: 'admin.litiges.actionReopen',
    icon: RotateCcw,
    color: 'text-blue-700 bg-blue-50 hover:bg-blue-100 border-blue-200',
  },
};

export function LitigeAdminActions({
  dispute,
  onStatusChange,
  onDelete,
  isUpdatingStatus,
  isDeleting,
}: LitigeAdminActionsProps) {
  const { t } = useI18n();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  const getNextStatus = (current: Dispute['status']): Dispute['status'] => {
    switch (current) {
      case 'open':
        return 'in_progress';
      case 'in_progress':
        return 'resolved';
      case 'resolved':
        return 'closed';
      case 'closed':
        return 'open';
      default:
        return 'in_progress';
    }
  };

  const nextStatus = getNextStatus(dispute.status);
  const nextConfig = STATUS_DETAILS[nextStatus];
  const NextIcon = nextConfig.icon;

  const handleQuickNext = async () => {
    await onStatusChange(dispute.id, nextStatus);
  };

  const handleSelectStatus = async (status: Dispute['status']) => {
    setShowStatusDropdown(false);
    if (status !== dispute.status) {
      await onStatusChange(dispute.id, status);
    }
  };

  return (
    <div className="flex items-center flex-wrap gap-2">
      {/* Quick primary action button */}
      <Button
        size="sm"
        onClick={handleQuickNext}
        disabled={isUpdatingStatus}
        className={`h-9 px-3.5 rounded-xl border text-xs font-bold transition-all shadow-xs gap-1.5 cursor-pointer ${nextConfig.color}`}
      >
        {isUpdatingStatus ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <NextIcon className="w-3.5 h-3.5" />
        )}
        <span>{t(nextConfig.actionKey)}</span>
      </Button>

      {/* Dropdown for direct status selection */}
      <div className="relative">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowStatusDropdown((prev) => !prev)}
          disabled={isUpdatingStatus}
          className="h-9 px-3 rounded-xl border-neutral-200 bg-white hover:bg-neutral-50 text-xs font-semibold text-neutral-700 shadow-xs gap-1 cursor-pointer"
        >
          <span>{t('admin.litiges.statusLabel')}</span>
          <span className="font-bold text-neutral-900">{t(STATUS_DETAILS[dispute.status]?.labelKey)}</span>
          <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 transition-transform ${showStatusDropdown ? 'rotate-180' : ''}`} />
        </Button>

        {showStatusDropdown && (
          <div className="absolute right-0 mt-1.5 w-48 bg-white rounded-2xl border border-neutral-200 shadow-lg py-1.5 z-30 space-y-0.5">
            <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              {t('admin.litiges.changeStatusTitle')}
            </div>
            {(['open', 'in_progress', 'resolved', 'closed'] as const).map((st) => {
              const isCurrent = dispute.status === st;
              const Icon = STATUS_DETAILS[st].icon;
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => handleSelectStatus(st)}
                  className={`w-full px-3 py-2 text-xs flex items-center justify-between text-left transition-colors cursor-pointer ${
                    isCurrent
                      ? 'bg-neutral-100 font-bold text-neutral-900'
                      : 'hover:bg-neutral-50 text-neutral-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-3.5 h-3.5 opacity-70" />
                    <span>{t(STATUS_DETAILS[st].labelKey)}</span>
                  </div>
                  {isCurrent && <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowDeleteConfirm(true)}
        disabled={isDeleting || isUpdatingStatus}
        className="h-9 px-3 rounded-xl border-neutral-200 bg-white hover:bg-red-50 hover:border-red-200 hover:text-red-700 text-xs font-semibold text-neutral-500 shadow-xs transition-colors gap-1.5 cursor-pointer ml-auto"
        title={t('admin.litiges.deleteTooltip')}
      >
        <Trash2 className="w-3.5 h-3.5 text-red-500" />
        <span className="hidden sm:inline">{t('admin.litiges.deleteBtn')}</span>
      </Button>

      {/* Confirmation modal */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title={t('admin.litiges.deleteTitle')}
        subtitle={t('admin.litiges.deleteSubtitle')}
        description={
          <div>
            {t('admin.litiges.deleteDescIntro')}{' '}
            <strong className="text-neutral-900">{dispute.customerEmail}</strong>{' '}
            {t('admin.litiges.deleteDescReason')}{' '}
            <strong className="text-neutral-900">« {dispute.reason} »</strong>
            <br />
            {t('admin.litiges.deleteDescOutro')}
          </div>
        }
        cancelText={t('admin.litiges.cancel')}
        confirmText={isDeleting ? t('admin.litiges.deleting') : t('admin.litiges.deleteConfirm')}
        headerColor="bg-red-600"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
        onConfirm={async () => {
          setShowDeleteConfirm(false);
          await onDelete(dispute.id);
        }}
      />
    </div>
  );
}
