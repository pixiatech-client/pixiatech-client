'use client';

import React, { useEffect, useState } from 'react';
import { fetchRealtime } from './analytics-api';
import type { RealtimeResponse } from './analytics-types';

interface RealtimeModuleProps {
  t: (key: string, params?: Record<string, string | number>) => string;
}

export default function RealtimeModule({ t }: RealtimeModuleProps) {
  const g = (k: string) => t(`admin.siteWeb.analytics.${k}`);
  const [data, setData] = useState<RealtimeResponse | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      try {
        const d = await fetchRealtime();
        if (alive) {
          setData(d);
          setError(false);
        }
      } catch {
        if (alive) setError(true);
      }
      if (alive) timer = setTimeout(poll, 30_000);
    };
    void poll();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className="rounded-2xl border border-neutral-200/80 dark:border-white/10 bg-white dark:bg-zinc-900 p-4 sm:p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <span className="relative flex h-2.5 w-2.5">
          {data && data.online > 0 && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#38E044] opacity-60" />
          )}
          <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${data && data.online > 0 ? 'bg-[#38E044]' : 'bg-neutral-300 dark:bg-neutral-600'}`} />
        </span>
        <h3 className="text-sm font-black tracking-tight text-neutral-900 dark:text-white">
          {g('realtimeTitle')} <span className="tabular-nums text-[#38E044]">({data ? data.online : '…'})</span>
        </h3>
      </div>
      {error ? (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">{g('empty')}</p>
      ) : data && data.sessions.length === 0 ? (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">{g('realtimeEmpty')}</p>
      ) : (
        <ul className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar">
          {(data?.sessions ?? []).map((s) => (
            <li key={s.sid} className="flex items-center gap-2 text-xs">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#38E044]" />
              <span className="text-neutral-400 tabular-nums shrink-0">
                {s.country ? s.country.toUpperCase() : '—'} · {s.lang ?? '—'} · {s.device ?? '—'}
              </span>
              <span className="flex-1 font-mono truncate text-neutral-700 dark:text-neutral-300">{s.lastPath ?? '/'}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}