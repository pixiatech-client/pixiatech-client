'use client';

import React, { useState } from 'react';
import { ArrowUpDown } from 'lucide-react';
import { formatDuration, formatNumber } from './analytics-utils';
import type { GaugeAggregate } from './analytics-types';

interface PagesModuleProps {
  current: GaugeAggregate;
  t: (key: string, params?: Record<string, string | number>) => string;
}

type SortKey = 'views' | 'uniques' | 'exits' | 'avgDwellMs';

export default function PagesModule({ current, t }: PagesModuleProps) {
  const g = (k: string) => t(`admin.siteWeb.analytics.${k}`);
  const [sort, setSort] = useState<SortKey>('views');
  const [asc, setAsc] = useState(false);

  const rows = [...current.pages].sort((a, b) => {
    const d = (a[sort] ?? 0) - (b[sort] ?? 0);
    return asc ? d : -d;
  });

  const thCls = 'text-left text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 px-3 py-2';
  const tdCls = 'px-3 py-2.5 text-sm text-neutral-800 dark:text-neutral-200';

  const header = (key: SortKey, label: string) => (
    <th
      className={`${thCls} cursor-pointer select-none hover:text-neutral-700 dark:hover:text-neutral-200`}
      onClick={() => (sort === key ? setAsc((v) => !v) : (setSort(key), setAsc(false)))}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <ArrowUpDown className="h-3 w-3 opacity-60" />
      </span>
    </th>
  );

  return (
    <div className="rounded-2xl border border-neutral-200/80 dark:border-white/10 bg-white dark:bg-zinc-900 p-4 sm:p-5 shadow-sm">
      <h3 className="text-sm font-black tracking-tight text-neutral-900 dark:text-white mb-3">{g('pagesTitle')}</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">{g('empty')}</p>
      ) : (
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full min-w-[520px] border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-white/10">
                <th className={thCls}>{g('colPath')}</th>
                {header('views', g('colViews'))}
                {header('uniques', g('colUniques'))}
                {header('exits', g('colExit'))}
                {header('avgDwellMs', g('colAvgDwell'))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 15).map((p) => (
                <tr key={p.path} className="border-b border-neutral-100 dark:border-white/5 last:border-0 hover:bg-neutral-50 dark:hover:bg-white/5">
                  <td className={`${tdCls} font-mono text-xs max-w-[260px] truncate`}>{p.path}</td>
                  <td className={`${tdCls} tabular-nums`}>{formatNumber(p.views)}</td>
                  <td className={`${tdCls} tabular-nums`}>{formatNumber(p.uniques)}</td>
                  <td className={`${tdCls} tabular-nums`}>{formatNumber(p.exits)}</td>
                  <td className={`${tdCls} tabular-nums`}>{formatDuration(p.avgDwellMs)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}