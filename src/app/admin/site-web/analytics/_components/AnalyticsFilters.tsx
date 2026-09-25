'use client';

import React, { useMemo, useState } from 'react';
import { RotateCcw } from 'lucide-react';

export type RangePreset = 'last24h' | 'last7d' | 'last30d' | 'last90d' | 'custom';

export interface AnalyticsFilterState {
  source?: string;
  country?: string;
  lang?: string;
  device?: string;
}

interface AnalyticsFiltersProps {
  from: number;
  to: number;
  filter: AnalyticsFilterState;
  onChange: (payload: { from?: number; to?: number; filter?: AnalyticsFilterState }) => void;
  sources: string[];
  countries: string[];
  languages: string[];
  devices: string[];
  t: (key: string, params?: Record<string, string | number>) => string;
}

function toInputValue(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function AnalyticsFilters({
  from,
  to,
  filter,
  onChange,
  sources,
  countries,
  languages,
  devices,
  t,
}: AnalyticsFiltersProps) {
  const g = (k: string) => t(`admin.siteWeb.analytics.${k}`);
  const rangeMs = to - from;
  const days = Math.round(rangeMs / (24 * 3600 * 1000));
  const [preset, setPreset] = useState<RangePreset>(
    days === 1 ? 'last24h' : days <= 7 ? 'last7d' : days <= 30 ? 'last30d' : days <= 90 ? 'last90d' : 'custom'
  );

  const applyPreset = (key: RangePreset) => {
    setPreset(key);
    const n = key === 'last24h' ? 1 : key === 'last7d' ? 7 : key === 'last30d' ? 30 : 90;
    const toMs = Date.now();
    const fromMs = toMs - n * 24 * 3600 * 1000;
    onChange({ from: fromMs, to: toMs });
  };

  const [fromInput, setFromInput] = useState(toInputValue(from));
  const [toInput, setToInput] = useState(toInputValue(to));

  const applyCustom = () => {
    setPreset('custom');
    const fromMs = Date.parse(`${fromInput}T00:00:00`);
    const toMs = Date.parse(`${toInput}T23:59:59`);
    if (Number.isFinite(fromMs) && Number.isFinite(toMs) && fromMs < toMs) {
      onChange({ from: fromMs, to: toMs });
    }
  };

  const selectCls =
    'w-full px-3 py-2.5 bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10 rounded-xl text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-[#38E044]/50 outline-none transition-all';
  const labelCls = 'text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1.5 block';

  return (
    <div className="rounded-2xl border border-neutral-200/80 dark:border-white/10 bg-white dark:bg-zinc-900 p-4 sm:p-5 space-y-5 shadow-sm">
      <div>
        <span className={labelCls}>{g('rangeLabel')}</span>
        <div className="flex flex-wrap gap-1.5">
          {(['last24h', 'last7d', 'last30d', 'last90d', 'custom'] as RangePreset[]).map((key) => (
            <button
              key={key}
              type="button"
              aria-pressed={preset === key}
              onClick={() => applyPreset(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38E044]/50 ${
                preset === key
                  ? 'bg-[#38E044] text-black'
                  : 'bg-neutral-100 dark:bg-white/5 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-white/10'
              }`}
            >
              {key === 'custom' ? g('custom') : g(`last${key.replace('last', '')}`)}
            </button>
          ))}
        </div>
        {preset === 'custom' && (
          <div className="mt-3 flex flex-wrap items-end gap-2">
            <label className="block">
              <span className={labelCls}>{g('from')}</span>
              <input
                type="date"
                value={fromInput}
                onChange={(e) => setFromInput(e.target.value)}
                className={selectCls}
              />
            </label>
            <label className="block">
              <span className={labelCls}>{g('to')}</span>
              <input
                type="date"
                value={toInput}
                onChange={(e) => setToInput(e.target.value)}
                className={selectCls}
              />
            </label>
            <button
              type="button"
              onClick={applyCustom}
              className="px-3 py-2.5 rounded-xl bg-[#0A0D0E] dark:bg-white text-white dark:text-neutral-900 text-xs font-bold cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38E044]/50"
            >
              {g('apply')}
            </button>
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className={labelCls}>{g('filtersTitle')}</span>
          <button
            type="button"
            onClick={() => {
              setPreset('custom');
              onChange({ filter: {} });
            }}
            className="flex items-center gap-1 text-[11px] font-bold text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors cursor-pointer"
          >
            <RotateCcw className="h-3 w-3" />
            {g('reset')}
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <select
            value={filter.source ?? ''}
            onChange={(e) => onChange({ filter: { ...filter, source: e.target.value || undefined } })}
            className={selectCls}
          >
            <option value="">{g('source')} — {g('all')}</option>
            {sources.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            value={filter.country ?? ''}
            onChange={(e) => onChange({ filter: { ...filter, country: e.target.value || undefined } })}
            className={selectCls}
          >
            <option value="">{g('country')} — {g('all')}</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c.toUpperCase()}
              </option>
            ))}
          </select>
          <select
            value={filter.lang ?? ''}
            onChange={(e) => onChange({ filter: { ...filter, lang: e.target.value || undefined } })}
            className={selectCls}
          >
            <option value="">{g('language')} — {g('all')}</option>
            {languages.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
          <select
            value={filter.device ?? ''}
            onChange={(e) => onChange({ filter: { ...filter, device: e.target.value || undefined } })}
            className={selectCls}
          >
            <option value="">{g('device')} — {g('all')}</option>
            {devices.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}