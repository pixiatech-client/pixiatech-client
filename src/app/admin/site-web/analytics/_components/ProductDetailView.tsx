'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { ArrowLeft } from 'lucide-react';
import { fetchProductDetail } from './analytics-api';
import { formatDuration, formatNumber, formatPercent, topEntries } from './analytics-utils';
import type { AnalyticsFilter, ProductDetailResponse } from './analytics-types';

interface ProductDetailViewProps {
  slug: string;
  from: number;
  to: number;
  filter: AnalyticsFilter;
  t: (key: string, params?: Record<string, string | number>) => string;
  onBack: () => void;
}

export default function ProductDetailView({ slug, from, to, filter, t, onBack }: ProductDetailViewProps) {
  const g = (k: string, params?: Record<string, string | number>) => t(`admin.siteWeb.analytics.${k}`, params);
  const [data, setData] = useState<ProductDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    fetchProductDetail(slug, from, to, filter)
      .then((d) => {
        if (alive) setData(d);
      })
      .catch((err: Error) => {
        if (alive) setError(err.message);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [slug, from, to, filter]);

  const kpis = useMemo(() => {
    if (!data) return [];
    return [
      { label: g('colViews'), value: formatNumber(data.product.views) },
      { label: g('colClicks'), value: formatNumber(data.product.clicks) },
      { label: g('colUniques'), value: formatNumber(data.uniqueVisitors) },
      { label: g('colInterest'), value: formatPercent(data.product.interestRate) },
      { label: g('kpiAvgDuration'), value: formatDuration(data.avgSessionMs) },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const sources = useMemo(() => (data ? topEntries(data.sources) : []), [data]);
  const countries = useMemo(
    () => (data ? topEntries(Object.fromEntries(Object.entries(data.countries).map(([c, v]) => [c, v.sessions])), 8) : []),
    [data]
  );
  const langs = useMemo(() => (data ? topEntries(data.langs) : []), [data]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-100 dark:bg-white/5 text-xs font-bold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-white/10 transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {g('backToAnalytics')}
        </button>
        <div>
          <h3 className="text-sm font-black tracking-tight text-neutral-900 dark:text-white">{data?.name ?? slug}</h3>
          <div className="text-[11px] font-mono text-neutral-400">{slug}</div>
        </div>
      </div>

      {loading && <p className="text-sm text-neutral-400">…</p>}
      {error && <p className="text-sm text-rose-500">{error}</p>}
      {data && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {kpis.map((k) => (
              <div key={k.label} className="rounded-xl border border-neutral-200/80 dark:border-white/10 bg-white dark:bg-zinc-900 p-3.5 shadow-sm">
                <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">{k.label}</div>
                <div className="mt-1 text-xl font-black tabular-nums text-neutral-900 dark:text-white">{k.value}</div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-neutral-200/80 dark:border-white/10 bg-white dark:bg-zinc-900 p-4 sm:p-5 shadow-sm">
            <h4 className="text-sm font-black tracking-tight text-neutral-900 dark:text-white mb-3">{g('chartTitle')}</h4>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.08} vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'currentColor', opacity: 0.6 }} axisLine={false} tickLine={false} minTickGap={24} />
                  <YAxis tick={{ fontSize: 10, fill: 'currentColor', opacity: 0.6 }} axisLine={false} tickLine={false} width={40} />
                  <Tooltip contentStyle={{ background: '#0A0D0E', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, fontSize: 12, color: '#fff', boxShadow: '0 12px 32px rgba(0,0,0,0.4)' }} />
                  <Area type="monotone" dataKey="views" name={g('colViews')} stroke="#38E044" strokeWidth={2} fill="#38E044" fillOpacity={0.2} isAnimationActive={false} />
                  <Area type="monotone" dataKey="clicks" name={g('colClicks')} stroke="#38B6FF" strokeWidth={2} fill="#38B6FF" fillOpacity={0.15} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div className="rounded-2xl border border-neutral-200/80 dark:border-white/10 bg-white dark:bg-zinc-900 p-4 sm:p-5 shadow-sm">
              <h4 className="text-xs font-black tracking-tight text-neutral-900 dark:text-white mb-2">{g('sourcesTitle')}</h4>
              <ChipList items={sources} />
              <h4 className="text-xs font-black tracking-tight text-neutral-900 dark:text-white mt-4 mb-2">{g('geoTitle')}</h4>
              <ChipList items={countries.map((c) => ({ key: c.key.toUpperCase(), count: c.count }))} />
              <h4 className="text-xs font-black tracking-tight text-neutral-900 dark:text-white mt-4 mb-2">{g('languagesTitle')}</h4>
              <ChipList items={langs} />
            </div>

            <div className="rounded-2xl border border-neutral-200/80 dark:border-white/10 bg-white dark:bg-zinc-900 p-4 sm:p-5 shadow-sm">
              <h4 className="text-xs font-black tracking-tight text-neutral-900 dark:text-white mb-2">{g('prevPages')}</h4>
              <NeighborList items={data.neighbors.prev} empty={g('noNeighbors')} />
              <h4 className="text-xs font-black tracking-tight text-neutral-900 dark:text-white mt-4 mb-2">{g('nextPages')}</h4>
              <NeighborList items={data.neighbors.next} empty={g('noNeighbors')} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ChipList({ items }: { items: { key: string; count: number }[] }) {
  if (items.length === 0) return <p className="text-xs text-neutral-400">—</p>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((i) => (
        <span key={i.key} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-white/5 text-xs font-bold text-neutral-800 dark:text-neutral-200">
          {i.key}
          <span className="tabular-nums text-neutral-400">{formatNumber(i.count)}</span>
        </span>
      ))}
    </div>
  );
}

function NeighborList({ items, empty }: { items: { path: string; count: number; name: string }[]; empty: string }) {
  if (items.length === 0) return <p className="text-xs text-neutral-400">{empty}</p>;
  return (
    <ul className="space-y-1.5">
      {items.slice(0, 6).map((n) => (
        <li key={n.path} className="flex items-center gap-2 text-xs">
          <span className="w-8 shrink-0 text-right tabular-nums text-neutral-400">{formatNumber(n.count)}</span>
          <span className="font-mono truncate text-neutral-700 dark:text-neutral-300" title={n.path}>
            {n.name !== n.path ? `${n.name} — ${n.path}` : n.path}
          </span>
        </li>
      ))}
    </ul>
  );
}