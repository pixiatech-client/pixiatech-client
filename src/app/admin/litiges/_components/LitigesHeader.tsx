'use client';

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';

interface LitigesHeaderProps {
  openCount: number;
  loading: boolean;
  onRefresh: () => void;
}

export function LitigesHeader({ openCount, loading, onRefresh }: LitigesHeaderProps) {
  const { t } = useI18n();
  return (
    <div className="bg-white rounded-3xl border border-neutral-200/80 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-[#0A0D0E] text-white flex items-center justify-center shrink-0 shadow-md">
          <AlertTriangle className="w-6 h-6 text-amber-400" />
        </div>
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
              {t('admin.litiges.title')}
            </h1>
            {openCount > 0 && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold bg-amber-50 text-amber-800 px-2.5 py-0.5 rounded-full border border-amber-200">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                {t('admin.litiges.openBadge', { count: openCount })}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
            {t('admin.litiges.subtitle')}
          </p>
        </div>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={onRefresh}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-neutral-200 bg-white hover:bg-neutral-50 text-xs font-bold text-neutral-700 shadow-xs shrink-0 cursor-pointer"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-neutral-900' : 'text-neutral-500'}`} />
        <span>{t('admin.litiges.refresh')}</span>
      </Button>
    </div>
  );
}
