'use client';

import React, { useState } from 'react';
import { Trash2, ChevronDown, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useI18n } from '@/lib/i18n';
import type { Dispute } from '@/lib/types';
import { DISPUTE_STATUSES, DISPUTE_STATUS_META, getDisputeStatusMeta } from './disputeStatusConfig';

interface LitigeAdminActionsProps {
  dispute: Dispute;
  onStatusChange: (disputeId: string, nextStatus: Dispute['status']) => Promise<void>;
  onDelete: (disputeId: string) => Promise<void>;
  isUpdatingStatus: boolean;
  isDeleting: boolean;
}

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

  const currentMeta = getDisputeStatusMeta(dispute.status);

  const handleSelectStatus = async (status: Dispute['status']) => {
    setShowStatusDropdown(false);
    if (status !== dispute.status) {
      await onStatusChange(dispute.id, status);
    }
  };

  return (
    <div className="flex items-center flex-wrap gap-2">
      {/* Unique status menu */}
      <div className="relative">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowStatusDropdown((prev) => !prev)}
          disabled={isUpdatingStatus}
          className="h-9 px-3 rounded-xl border-neutral-200 bg-white hover:bg-neutral-50 text-xs font-bold text-neutral-900 shadow-xs gap-1.5 cursor-pointer min-w-[7rem] justify-between"
          title={t('admin.litiges.changeStatusTitle')}
        >
          {isUpdatingStatus ? (
            <Loader2 className="w-3.5 h-3.5 text-neutral-500 animate-spin" />
          ) : (
            <span className={`w-2 h-2 rounded-full ${currentMeta.dot}`} />
          )}
          <span>{t(currentMeta.labelKey)}</span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-neutral-400 transition-transform ${showStatusDropdown ? 'rotate-180' : ''}`}
          />
        </Button>

        {showStatusDropdown && (
          <div className="absolute right-0 mt-1.5 w-52 bg-white rounded-2xl border border-neutral-200 shadow-lg py-1.5 z-50 space-y-0.5">
            <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              {t('admin.litiges.changeStatusTitle')}
            </div>
            {DISPUTE_STATUSES.map((st) => {
              const isCurrent = dispute.status === st;
              const meta = DISPUTE_STATUS_META[st];
              const Icon = meta.icon;
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
                  <span className="flex items-center gap-2.5">
                    <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
                    <Icon className={`w-3.5 h-3.5 ${isCurrent ? meta.itemText : 'text-neutral-400'}`} />
                    <span>{t(meta.labelKey)}</span>
                  </span>
                  {isCurrent && <Check className="w-3.5 h-3.5 text-neutral-900" />}
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
