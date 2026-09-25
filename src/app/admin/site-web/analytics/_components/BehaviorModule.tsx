'use client';

import React, { useMemo } from 'react';
import { formatDuration, formatNumber } from './analytics-utils';
import type { BehaviorRow } from './analytics-types';

interface BehaviorModuleProps {
  rows: BehaviorRow[];
  actions: Record<string, number>;
  t: (key: string, params?: Record<string, string | number>) => string;
}

export default function BehaviorModule({ rows, actions, t }: BehaviorModuleProps) {
  const g = (k: string) => t(`admin.siteWeb.analytics.${k}`);
  const topActions = useMemo(() => Object.entries(actions).sort((a, b) => b[1] - a[1]).slice(0, 8), [actions]);

  return (
    <div className="rounded-2xl border border-neutral-200/80 dark:border-white/10 bg-white dark:bg-zinc-900 p-4 sm:p-5 shadow-sm">
      <h3 className="text-sm font-black tracking-tight text-neutral-900 dark:text-white mb-3">{g('behaviorTitle')}</h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          {rows.length === 0 ? (
            <p className="text-sm text-neutral-500 dark:text-neutral-400">{g('empty')}</p>
          ) : (
            <ul className="space-y-1.5">
              {rows.slice(0, 10).map((r) => (
                <li key={r.path} className="flex items-center gap-3 text-xs">
                  <span className="flex-1 font-mono truncate text-neutral-700 dark:text-neutral-300">{r.path}</span>
                  <span className="text-neutral-400 tabular-nums" title={g('colEntry')}>
                    ↗ {formatNumber(r.entries)}
                  </span>
                  <span className="text-neutral-400 tabular-nums" title={g('colExit')}>
                    ↙ {formatNumber(r.exits)}
                  </span>
                  <span className="text-neutral-500 tabular-nums w-16 text-right">{formatDuration(r.avgDwellMs)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-2">{g('actionsTitle')}</div>
          {topActions.length === 0 ? (
            <p className="text-sm text-neutral-500 dark:text-neutral-400">{g('empty')}</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {topActions.map(([k, v]) => (
                <span key={k} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-white/5 text-xs font-bold text-neutral-800 dark:text-neutral-200">
                  {k}
                  <span className="tabular-nums text-neutral-400">{formatNumber(v)}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}