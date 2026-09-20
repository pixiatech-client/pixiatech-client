'use client';

import React from 'react';
import { MessageSquare, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

interface LitigesStatsProps {
  total: number;
  openCount: number;
  resolvedCount: number;
  closedCount: number;
  activeFilter: 'all' | 'open' | 'resolved' | 'closed';
  onFilterChange: (filter: 'all' | 'open' | 'resolved' | 'closed') => void;
}

export function LitigesStats({
  total,
  openCount,
  resolvedCount,
  closedCount,
  activeFilter,
  onFilterChange,
}: LitigesStatsProps) {
  const { t } = useI18n();
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* 1. Total */}
      <div
        onClick={() => onFilterChange('all')}
        className={`bg-white rounded-2xl border p-4 shadow-xs flex items-center gap-3 transition-all cursor-pointer ${
          activeFilter === 'all'
            ? 'border-neutral-900 ring-2 ring-black/10'
            : 'border-neutral-200/80 hover:border-neutral-300'
        }`}
      >
        <div className="p-3 rounded-xl bg-neutral-100 text-neutral-700 shrink-0">
          <MessageSquare className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <div className="text-xs text-neutral-500 font-medium truncate">{t('admin.litiges.statsTotal')}</div>
          <div className="text-xl font-black text-neutral-900 font-mono">{total}</div>
        </div>
      </div>

      {/* 2. En cours / Ouverts */}
      <div
        onClick={() => onFilterChange('open')}
        className={`bg-white rounded-2xl border p-4 shadow-xs flex items-center gap-3 transition-all cursor-pointer ${
          activeFilter === 'open'
            ? 'border-amber-500 ring-2 ring-amber-500/20'
            : 'border-neutral-200/80 hover:border-amber-300'
        }`}
      >
        <div className="p-3 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/60 shrink-0">
          <Clock className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <div className="text-xs text-neutral-500 font-medium truncate">{t('admin.litiges.statsOpen')}</div>
          <div className="text-xl font-black text-amber-700 font-mono">{openCount}</div>
        </div>
      </div>

      {/* 3. Résolus */}
      <div
        onClick={() => onFilterChange('resolved')}
        className={`bg-white rounded-2xl border p-4 shadow-xs flex items-center gap-3 transition-all cursor-pointer ${
          activeFilter === 'resolved'
            ? 'border-emerald-500 ring-2 ring-emerald-500/20'
            : 'border-neutral-200/80 hover:border-emerald-300'
        }`}
      >
        <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/60 shrink-0">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <div className="text-xs text-neutral-500 font-medium truncate">{t('admin.litiges.statsResolved')}</div>
          <div className="text-xl font-black text-emerald-700 font-mono">{resolvedCount}</div>
        </div>
      </div>

      {/* 4. Fermés */}
      <div
        onClick={() => onFilterChange('closed')}
        className={`bg-white rounded-2xl border p-4 shadow-xs flex items-center gap-3 transition-all cursor-pointer ${
          activeFilter === 'closed'
            ? 'border-neutral-400 ring-2 ring-neutral-400/20'
            : 'border-neutral-200/80 hover:border-neutral-300'
        }`}
      >
        <div className="p-3 rounded-xl bg-neutral-100 text-neutral-500 border border-neutral-200/60 shrink-0">
          <XCircle className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <div className="text-xs text-neutral-500 font-medium truncate">{t('admin.litiges.statsClosed')}</div>
          <div className="text-xl font-black text-neutral-600 font-mono">{closedCount}</div>
        </div>
      </div>
    </div>
  );
}
