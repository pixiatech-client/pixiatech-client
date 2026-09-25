'use client';

import React, { useState } from 'react';
import { ExternalLink, ArrowUpDown } from 'lucide-react';
import { formatNumber, formatPercent } from './analytics-utils';
import type { GaugeAggregate } from './analytics-types';

interface ProductsModuleProps {
  current: GaugeAggregate;
  t: (key: string, params?: Record<string, string | number>) => string;
  onSelect: (slug: string) => void;
}

type SortKey = 'views' | 'clicks' | 'uniques' | 'interestRate';

export default function ProductsModule({ current, t, onSelect }: ProductsModuleProps) {
  const g = (k: string) => t(`admin.siteWeb.analytics.${k}`);
  const [sort, setSort] = useState<SortKey>('views');
  const [asc, setAsc] = useState(false);

  const rows = [...current.products].sort((a, b) => {
    const d = (a[sort] ?? 0) - (b[sort] ?? 0);
    return asc ? d : -d;
  });

  const thCls = 'text-left text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 px-3 py-2';
  const tdCls = 'px-3 py-2.5 text-sm text-neutral-800 dark:text-neutral-200';

  const header = (key: SortKey, label: string) => (
    <th
      className={`${thCls} cursor-pointer select-none hover:text-neutral-700 dark:hover:text-neutral-200`}
      onClick={() => {
        if (sort === key) setAsc((v) => !v);
        else {
          setSort(key);
          setAsc(false);
        }
      }}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <ArrowUpDown className="h-3 w-3 opacity-60" />
      </span>
    </th>
  );

  return (
    <div className="rounded-2xl border border-neutral-200/80 dark:border-white/10 bg-white dark:bg-zinc-900 p-4 sm:p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h3 className="text-sm font-black tracking-tight text-neutral-900 dark:text-white">{g('productsTitle')}</h3>
        <span className="text-[10px] font-mono font-bold text-neutral-400 dark:text-neutral-500 bg-neutral-100 dark:bg-white/5 px-2 py-0.5 rounded-lg tabular-nums">
          {rows.slice(0, 12).length}
        </span>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">{g('empty')}</p>
      ) : (
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full min-w-[560px] border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-white/10">
                <th className={thCls}>{g('colProduct')}</th>
                {header('views', g('colViews'))}
                {header('clicks', g('colClicks'))}
                {header('uniques', g('colUniques'))}
                {header('interestRate', g('colInterest'))}
                <th className={thCls} />
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 12).map((p) => (
                <tr key={p.slug} className="border-b border-neutral-100 dark:border-white/5 last:border-0 hover:bg-neutral-50 dark:hover:bg-white/5">
                  <td className={tdCls}>
                    <button
                      type="button"
                      onClick={() => onSelect(p.slug)}
                      className="flex items-center gap-2 font-bold text-neutral-900 dark:text-white hover:text-[#38E044] transition-colors cursor-pointer text-left"
                    >
                      <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{p.name ?? p.slug}</span>
                    </button>
                    <div className="text-[11px] font-mono text-neutral-400">{p.slug}</div>
                  </td>
                  <td className={`${tdCls} tabular-nums`}>{formatNumber(p.views)}</td>
                  <td className={`${tdCls} tabular-nums`}>{formatNumber(p.clicks)}</td>
                  <td className={`${tdCls} tabular-nums`}>{formatNumber(p.uniques)}</td>
                  <td className={`${tdCls} tabular-nums`}>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 rounded-full bg-neutral-100 dark:bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#38E044]"
                          style={{ width: `${Math.min(100, Math.round(p.interestRate * 100))}%` }}
                        />
                      </div>
                      <span className="text-xs">{formatPercent(p.interestRate, 0)}</span>
                    </div>
                  </td>
                  <td className={tdCls}>
                    <button
                      type="button"
                      onClick={() => onSelect(p.slug)}
                      className="text-[11px] font-bold text-[#38E044] hover:underline cursor-pointer"
                    >
                      {g('detail')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}