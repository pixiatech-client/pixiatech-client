'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { formatNumber } from './analytics-utils';
import type { SourcesRow } from './analytics-types';

interface SourcesModuleProps {
  rows: SourcesRow[];
  t: (key: string, params?: Record<string, string | number>) => string;
}

export default function SourcesModule({ rows, t }: SourcesModuleProps) {
  const g = (k: string) => t(`admin.siteWeb.analytics.${k}`);
  const [open, setOpen] = useState<string | null>(null);
  const thCls = 'text-left text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 px-3 py-2';
  const tdCls = 'px-3 py-2.5 text-sm text-neutral-800 dark:text-neutral-200';
  const maxVisits = Math.max(1, ...rows.map((r) => r.visits));

  return (
    <div className="rounded-2xl border border-neutral-200/80 dark:border-white/10 bg-white dark:bg-zinc-900 p-4 sm:p-5 shadow-sm">
      <h3 className="text-sm font-black tracking-tight text-neutral-900 dark:text-white mb-3">{g('sourcesTitle')}</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">{g('empty')}</p>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <div key={r.key} className="border border-neutral-100 dark:border-white/5 rounded-2xl overflow-hidden">
              <button
                type="button"
                onClick={() => setOpen(open === r.key ? null : r.key)}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors cursor-pointer text-left"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-neutral-900 dark:text-white">{r.key}</span>
                    <span className="text-xs tabular-nums text-neutral-500 dark:text-neutral-400 flex items-center gap-3">
                      <span>{formatNumber(r.unique)} {g('colUniques').toLowerCase()}</span>
                      <span>{formatNumber(r.pageViews)} {g('colViews').toLowerCase()}</span>
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-neutral-100 dark:bg-white/10 overflow-hidden">
                    <div className="h-full rounded-full bg-[#38E044]" style={{ width: `${(r.visits / maxVisits) * 100}%` }} />
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-black tabular-nums text-neutral-900 dark:text-white">{formatNumber(r.visits)}</span>
                  <ChevronDown className={`h-4 w-4 text-neutral-400 transition-transform ${open === r.key ? 'rotate-180' : ''}`} />
                </div>
              </button>
              {open === r.key && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 px-4 py-3 border-t border-neutral-100 dark:border-white/5 bg-neutral-50/50 dark:bg-white/[0.02]">
                  <MiniList title={g('medium')} items={r.mediums} empty={g('noNeighbors')} />
                  <MiniList title={g('campaign')} items={r.campaigns} empty={g('noNeighbors')} />
                  <MiniList title={g('landing')} items={r.landings} empty={g('noNeighbors')} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MiniList({ title, items, empty }: { title: string; items: { key: string; count: number }[]; empty: string }) {
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-1.5">{title}</div>
      {items.length === 0 ? (
        <p className="text-xs text-neutral-400">{empty}</p>
      ) : (
        <ul className="space-y-1">
          {items.map((i) => (
            <li key={i.key} className="flex items-center justify-between gap-2 text-xs">
              <span className="truncate text-neutral-700 dark:text-neutral-300">{i.key}</span>
              <span className="tabular-nums text-neutral-400">{formatNumber(i.count)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}