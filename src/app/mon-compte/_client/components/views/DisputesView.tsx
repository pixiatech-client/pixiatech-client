'use client';

import { useMemo, useState } from 'react';
import { MessageSquareWarning, Plus } from 'lucide-react';
import type { ClientDispute } from '../../types';
import { formatDate } from '../../lib/format';
import { SlidingSwitch } from '../SlidingSwitch';

interface DisputesViewProps {
  disputes: ClientDispute[];
  onSelectDispute: (id: string) => void;
  onNewDispute: () => void;
}

type FilterKey = 'all' | 'open' | 'resolved';

export function DisputesView({ disputes, onSelectDispute, onNewDispute }: DisputesViewProps) {
  const [filter, setFilter] = useState<FilterKey>('all');

  const filtered = useMemo(() => {
    const sorted = [...disputes].sort((a, b) => b.date.localeCompare(a.date));
    if (filter === 'all') return sorted;
    if (filter === 'open') return sorted.filter((d) => d.statusLabel === 'Ouvert' || d.statusLabel === 'En cours' || d.statusLabel === 'En attente');
    return sorted.filter((d) => d.statusLabel === 'RÃ©solu' || d.statusLabel === 'FermÃ©');
  }, [disputes, filter]);

  const openCount = disputes.filter((d) => d.statusLabel === 'Ouvert' || d.statusLabel === 'En cours' || d.statusLabel === 'En attente').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-neutral-900">Mes litiges</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {openCount > 0 ? `${openCount} litige${openCount > 1 ? 's' : ''} en cours` : 'Aucun litige en cours'} Â· {disputes.length} au total
          </p>
        </div>
        <button
          type="button"
          onClick={onNewDispute}
          className="flex items-center gap-2 rounded-xl bg-[#0A0D0E] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
        >
          <Plus size={16} /> Ouvrir un litige
        </button>
      </div>

      <SlidingSwitch
        options={[
          { key: 'all', label: 'Tout' },
          { key: 'open', label: 'En cours' },
          { key: 'resolved', label: 'RÃ©solus' },
        ]}
        active={filter}
        onChange={(k) => setFilter(k as FilterKey)}
        className="max-w-xs"
      />

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-neutral-200 bg-white py-16 text-center shadow-xs">
          <MessageSquareWarning size={36} className="text-neutral-300" />
          <p className="mt-3 text-sm font-bold text-neutral-700">Aucun litige {filter !== 'all' ? 'dans cette catÃ©gorie' : ''}</p>
          <p className="mt-1 max-w-sm text-sm text-neutral-500">
            Un problÃ¨me avec votre commande ? Ouvrez un litige, nous rÃ©pondons sous 24h ouvrÃ©es.
          </p>
          <button
            type="button"
            onClick={onNewDispute}
            className="mt-4 rounded-xl bg-[#0A0D0E] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Ouvrir un litige
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((dispute) => (
            <button
              key={dispute.id}
              type="button"
              onClick={() => onSelectDispute(dispute.id)}
              className="flex w-full items-center gap-4 rounded-2xl border border-neutral-200/80 bg-white p-5 text-left shadow-xs transition hover:border-neutral-300"
            >
              {dispute.unreadByClient ? (
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
                  <MessageSquareWarning size={19} />
                </span>
              ) : (
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-500">
                  <MessageSquareWarning size={19} />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-bold text-neutral-900">{dispute.reasonLabel}</p>
                  <DisputeStatusPill label={dispute.statusLabel} />
                  {dispute.unreadByClient && (
                    <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold uppercase text-rose-600">Nouveau</span>
                  )}
                </div>
                <p className="mt-0.5 truncate text-xs text-neutral-500">
                  {dispute.orderNumber ? `${dispute.orderNumber} Â· ` : ''}
                  {dispute.productName || 'Demande sans commande'} Â· {formatDate(dispute.date)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-neutral-900">DerniÃ¨re activitÃ©</p>
                <p className="text-xs text-neutral-500">{formatDate(dispute.lastResponseDate)}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function DisputeStatusPill({ label }: { label: string }) {
  const tone = label === 'RÃ©solu' || label === 'FermÃ©'
    ? 'bg-emerald-100 text-emerald-700'
    : 'bg-amber-100 text-amber-700';
  return <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${tone}`}>{label}</span>;
}