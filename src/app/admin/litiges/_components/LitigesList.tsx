'use client';

import React from 'react';
import {
  Search,
  MessageSquare,
  ChevronRight,
  Package,
  X,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useI18n, IntlHelpers } from '@/lib/i18n';
import { getDisputeStatusMeta } from './disputeStatusConfig';
import type { Dispute } from '@/lib/types';

interface LitigesListProps {
  disputes: Dispute[];
  selectedDisputeId: string | null;
  onSelectDispute: (id: string) => void;
  activeFilter: 'all' | 'open' | 'resolved' | 'closed';
  onFilterChange: (filter: 'all' | 'open' | 'resolved' | 'closed') => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  counts: {
    all: number;
    open: number;
    resolved: number;
    closed: number;
  };
}

function formatDate(iso?: string, locale?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return IntlHelpers.formatDate(d, (locale as any) || 'fr', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function LitigesList({
  disputes,
  selectedDisputeId,
  onSelectDispute,
  activeFilter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  counts,
}: LitigesListProps) {
  const { t, locale } = useI18n();
  return (
    <div className="space-y-4">
      {/* 1. Filter Chips */}
      <div className="flex items-center gap-1.5 p-1.5 bg-neutral-100/80 rounded-2xl border border-neutral-200/60 text-xs">
        <button
          type="button"
          onClick={() => onFilterChange('all')}
          className={`flex-1 py-1.5 px-2.5 rounded-xl font-bold transition-all cursor-pointer truncate ${
            activeFilter === 'all'
              ? 'bg-white text-neutral-900 shadow-xs'
              : 'text-neutral-500 hover:text-neutral-900'
          }`}
        >
          {t('admin.litiges.filterAll', { count: counts.all })}
        </button>
        <button
          type="button"
          onClick={() => onFilterChange('open')}
          className={`flex-1 py-1.5 px-2.5 rounded-xl font-bold transition-all cursor-pointer truncate ${
            activeFilter === 'open'
              ? 'bg-white text-neutral-900 shadow-xs'
              : 'text-neutral-500 hover:text-neutral-900'
          }`}
        >
          {t('admin.litiges.filterOpen', { count: counts.open })}
        </button>
        <button
          type="button"
          onClick={() => onFilterChange('resolved')}
          className={`flex-1 py-1.5 px-2.5 rounded-xl font-bold transition-all cursor-pointer truncate ${
            activeFilter === 'resolved'
              ? 'bg-white text-neutral-900 shadow-xs'
              : 'text-neutral-500 hover:text-neutral-900'
          }`}
        >
          {t('admin.litiges.filterResolved', { count: counts.resolved })}
        </button>
        <button
          type="button"
          onClick={() => onFilterChange('closed')}
          className={`flex-1 py-1.5 px-2.5 rounded-xl font-bold transition-all cursor-pointer truncate ${
            activeFilter === 'closed'
              ? 'bg-white text-neutral-900 shadow-xs'
              : 'text-neutral-500 hover:text-neutral-900'
          }`}
        >
          {t('admin.litiges.filterClosed', { count: counts.closed })}
        </button>
      </div>

      {/* 2. Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
        <Input
          placeholder={t('admin.litiges.searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 pr-9 h-10 rounded-xl border-neutral-200 bg-white text-xs text-neutral-900 placeholder:text-neutral-400 shadow-2xs"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-neutral-400 hover:text-neutral-600 rounded-md"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* 3. List of Dispute Cards */}
      <div className="space-y-3 max-h-[720px] overflow-y-auto pr-1">
        {disputes.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-neutral-200 text-xs text-neutral-400 shadow-2xs">
            {t('admin.litiges.listEmpty')}
          </div>
        ) : (
          disputes.map((dispute) => {
            const isSelected = selectedDisputeId === dispute.id;
            const messageCount = dispute.messages?.length || 0;
            const lastMessage = dispute.messages && dispute.messages.length > 0
              ? dispute.messages[dispute.messages.length - 1]
              : null;

            // Needs attention if customer was the last to speak or dispute just opened with no admin reply
            const isPendingAdminReply =
              dispute.status !== 'closed' &&
              dispute.status !== 'resolved' &&
              (!lastMessage || lastMessage.sender === 'customer');

            const statusMeta = getDisputeStatusMeta(dispute.status);
            const StatusIcon = statusMeta.icon;

            return (
              <div
                key={dispute.id}
                onClick={() => onSelectDispute(dispute.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-3 ${
                  isSelected
                    ? 'bg-white border-[#0A0D0E] ring-2 ring-black/10 shadow-sm'
                    : 'bg-white border-neutral-200/80 hover:border-neutral-300 hover:bg-neutral-50/40'
                }`}
              >
                {/* Top Row: Client/Order info & Status Badge */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-wrap">
                    {dispute.orderNumber ? (
                      <span className="font-mono font-bold text-[11px] text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded-md truncate max-w-[120px]">
                        {dispute.orderNumber}
                      </span>
                    ) : (
                      <span className="font-mono font-semibold text-[11px] text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded-md">
                        #{dispute.id.slice(0, 6)}
                      </span>
                    )}
                    <span className="text-[11px] text-neutral-400">• {formatDate(dispute.createdAt, locale)}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {isPendingAdminReply && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
                        {t('admin.litiges.toHandle')}
                      </span>
                    )}
                    <Badge
                      variant="outline"
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${statusMeta.badge}`}
                    >
                      <StatusIcon className="w-3 h-3" />
                      <span>{t(statusMeta.labelKey)}</span>
                    </Badge>
                  </div>
                </div>

                {/* Customer email & problem snippet */}
                <div className="flex items-start gap-3">
                  {dispute.productImage ? (
                    <img
                      src={dispute.productImage}
                      alt={dispute.productName || 'Produit'}
                      className="w-11 h-11 rounded-xl object-cover border border-neutral-200 shrink-0"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-xl bg-neutral-100 border border-neutral-200 shrink-0 flex items-center justify-center text-neutral-400">
                      <Package className="w-5 h-5" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-neutral-900 truncate">
                      {dispute.customerEmail}
                    </div>
                    <div className="text-[11px] font-semibold text-neutral-700 truncate mt-0.5">
                      {dispute.reason}
                    </div>
                    <div className="text-[11px] text-neutral-500 line-clamp-2 mt-0.5">
                      {lastMessage ? lastMessage.text : dispute.description}
                    </div>
                  </div>
                </div>

                {/* Card Footer: Message count & CTA */}
                <div className="flex items-center justify-between pt-2 border-t border-neutral-100 text-[11px] text-neutral-400">
                  <span className="flex items-center gap-1 font-medium text-neutral-600">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{t('admin.litiges.messages', { count: messageCount })}</span>
                  </span>
                  <span className="text-neutral-500 flex items-center gap-0.5 font-medium hover:text-black">
                    <span>{t('admin.litiges.consultCase')}</span>
                    <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
