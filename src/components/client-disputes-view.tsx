'use client';

import { useState } from 'react';
import Link from 'next/link';
import { LifeBuoy, MessageSquare, ArrowRight, ChevronLeft } from 'lucide-react';
import { ClientPageHeader } from '@/components/client-ui/client-page-header';
import { ClientSlidingSwitch } from '@/components/client-ui/client-sliding-switch';
import { ClientStatusBadge } from '@/components/client-ui/client-status-badge';

interface DisputeItem {
  id: string;
  reason: string;
  description: string;
  status: string;
  createdAt: string;
  unreadByClient?: boolean;
  messageCount?: number;
}

const toneFor: Record<string, 'red' | 'amber' | 'emerald' | 'neutral'> = {
  open: 'red',
  in_progress: 'amber',
  resolved: 'emerald',
  closed: 'neutral',
};

const FILTERS = [
  { id: 'all', label: 'Tous' },
  { id: 'open', label: 'En cours' },
  { id: 'resolved', label: 'Résolus' },
  { id: 'closed', label: 'Fermés' },
] as const;

type FilterId = (typeof FILTERS)[number]['id'];

function formatDate(iso: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function ClientDisputesView({
  disputes,
  statusLabels,
  openCount,
  title,
  subtitle,
  backLabel,
  emptyLabel,
  backToDashboardLabel,
  newReplyLabel,
  messageCountLabel,
}: {
  disputes: DisputeItem[];
  statusLabels: Record<string, string>;
  openCount: number;
  title: string;
  subtitle: string;
  backLabel: string;
  emptyLabel: string;
  backToDashboardLabel: string;
  newReplyLabel: string;
  messageCountLabel: string;
}) {
  const [filter, setFilter] = useState<FilterId>('all');
  const [dismissed, setDismissed] = useState(false);

  const counts = {
    all: disputes.length,
    open: disputes.filter((d) => d.status === 'open' || d.status === 'in_progress').length,
    resolved: disputes.filter((d) => d.status === 'resolved').length,
    closed: disputes.filter((d) => d.status === 'closed').length,
  };

  const filtered =
    filter === 'all'
      ? disputes
      : filter === 'open'
        ? disputes.filter((d) => d.status === 'open' || d.status === 'in_progress')
        : disputes.filter((d) => d.status === filter);

  return (
    <div className="w-full max-w-[1536px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      {!dismissed && (
        <Link
          href="/mon-compte/tableau-de-bord"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-neutral-200 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 hover:border-neutral-300 shadow-xs transition-all"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          {backLabel}
        </Link>
      )}

      <ClientPageHeader
        title={title}
        subtitle={subtitle}
        icon={LifeBuoy}
        iconClassName="text-amber-400"
      />

      {disputes.length > 0 && (
        <ClientSlidingSwitch
          options={FILTERS.map((f) => ({ id: f.id, label: f.label, badge: counts[f.id] }))}
          activeId={filter}
          onChange={(id) => setFilter(id as FilterId)}
        />
      )}

      {disputes.length === 0 ? (
        <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-xs p-14 text-center">
          <div className="w-14 h-14 mx-auto rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400 mb-3">
            <LifeBuoy className="w-7 h-7" />
          </div>
          <p className="text-sm font-medium text-neutral-500">{emptyLabel}</p>
          <Link href="/mon-compte/tableau-de-bord" className="inline-block text-sm font-semibold text-neutral-800 hover:underline mt-3">
            {backToDashboardLabel}
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-xs p-12 text-center">
          <p className="text-sm font-medium text-neutral-500">Aucun litige dans ce filtre.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((d) => (
            <Link
              key={d.id}
              href={`/mon-compte/litiges/${d.id}`}
              className={`block bg-white rounded-2xl border p-5 hover:shadow-md transition-all ${
                d.unreadByClient ? 'border-amber-300 ring-1 ring-amber-200/60' : 'border-neutral-200/80 hover:border-neutral-300'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="text-sm font-bold text-neutral-900">{d.reason}</h3>
                    {d.unreadByClient && (
                      <span className="text-[10px] font-bold text-black bg-amber-400 px-1.5 py-0.5 rounded-full">
                        {newReplyLabel}
                      </span>
                    )}
                  </div>
                  {d.description && (
                    <p className="text-xs text-neutral-500 line-clamp-2 mb-2.5">{d.description}</p>
                  )}
                  <div className="flex items-center gap-3 text-[11px] text-neutral-400">
                    <ClientStatusBadge
                      label={statusLabels[d.status] || d.status}
                      tone={toneFor[d.status] || 'neutral'}
                      dot
                    />
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {messageCountLabel.replace('{count}', String(d.messageCount ?? 0))}
                    </span>
                    <span>{formatDate(d.createdAt)}</span>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-neutral-300 shrink-0 mt-1" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
