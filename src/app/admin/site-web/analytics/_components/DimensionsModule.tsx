'use client';

import React, { useState } from 'react';
import { formatNumber, formatPercent } from './analytics-utils';
import type { GeoRow, GaugeAggregate } from './analytics-types';

interface DimensionsModuleProps {
  geo: GeoRow[];
  languages: { key: string; count: number }[];
  devices: { byDevice: { key: string; count: number }[]; byOs: { key: string; count: number }[]; byBrowser: { key: string; count: number }[]; byScreen: { key: string; count: number }[] };
  current: GaugeAggregate;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const DEVICE_TABS = ['device', 'os', 'browser', 'screen'] as const;
export type DeviceTab = (typeof DEVICE_TABS)[number];

export default function DimensionsModule({ geo, languages, devices, current, t }: DimensionsModuleProps) {
  const g = (k: string) => t(`admin.siteWeb.analytics.${k}`);
  const [tab, setTab] = useState<DeviceTab>('device');

  const totalSessions = current.sessions || 1;
  const deviceRows =
    tab === 'device' ? devices.byDevice : tab === 'os' ? devices.byOs : tab === 'browser' ? devices.byBrowser : devices.byScreen;
  const maxDevice = Math.max(1, ...deviceRows.map((d) => d.count));

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="rounded-2xl border border-neutral-200/80 dark:border-white/10 bg-white dark:bg-zinc-900 p-4 sm:p-5 shadow-sm">
        <h3 className="text-sm font-black tracking-tight text-neutral-900 dark:text-white mb-3">{g('geoTitle')}</h3>
        {geo.length === 0 ? (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">{g('empty')}</p>
        ) : (
          <ul className="space-y-2">
            {geo.slice(0, 10).map((c) => (
              <li key={c.code} className="flex items-center gap-3">
                <span className="w-10 shrink-0 text-[11px] font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  {c.code === 'zz' ? '—' : c.code}
                </span>
                <div className="flex-1 h-1.5 rounded-full bg-neutral-100 dark:bg-white/10 overflow-hidden">
                  <div className="h-full rounded-full bg-[#38E044]" style={{ width: `${(c.sessions / totalSessions) * 100}%` }} />
                </div>
                <span className="text-xs tabular-nums text-neutral-700 dark:text-neutral-300 w-14 text-right">{formatNumber(c.sessions)}</span>
              </li>
            ))}
          </ul>
        )}
        <h3 className="text-sm font-black tracking-tight text-neutral-900 dark:text-white mt-5 mb-1">{g('languagesTitle')}</h3>
        {languages.length === 0 ? (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">{g('empty')}</p>
        ) : (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {languages.map((l) => (
              <span key={l.key} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-white/5 text-xs font-bold text-neutral-800 dark:text-neutral-200">
                {l.key}
                <span className="tabular-nums text-neutral-400">{formatNumber(l.count)}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="md:col-span-2 rounded-2xl border border-neutral-200/80 dark:border-white/10 bg-white dark:bg-zinc-900 p-4 sm:p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
          <h3 className="text-sm font-black tracking-tight text-neutral-900 dark:text-white">{g('devicesTitle')}</h3>
          <div className="flex items-center gap-1 p-1 bg-neutral-100 dark:bg-white/5 rounded-xl">
            {DEVICE_TABS.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  tab === key ? 'bg-white dark:bg-zinc-800 shadow-sm text-neutral-900 dark:text-white' : 'text-neutral-500 dark:text-neutral-400'
                }`}
              >
                {g(`tab${key.charAt(0).toUpperCase()}${key.slice(1)}`)}
              </button>
            ))}
          </div>
        </div>
        {deviceRows.length === 0 ? (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">{g('empty')}</p>
        ) : (
          <ul className="space-y-2">
            {deviceRows.slice(0, 8).map((d) => (
              <li key={d.key} className="flex items-center gap-3">
                <span className="w-24 shrink-0 text-xs font-bold text-neutral-800 dark:text-neutral-200 truncate">{d.key}</span>
                <div className="flex-1 h-2 rounded-full bg-neutral-100 dark:bg-white/10 overflow-hidden">
                  <div className="h-full rounded-full bg-sky-400" style={{ width: `${(d.count / maxDevice) * 100}%` }} />
                </div>
                <span className="text-xs tabular-nums text-neutral-600 dark:text-neutral-300 w-16 text-right">{formatNumber(d.count)}</span>
                <span className="text-[11px] tabular-nums text-neutral-400 w-12 text-right">{formatPercent(d.count / totalSessions, 0)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}