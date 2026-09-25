'use client';

import React from 'react';
import {
  Users,
  Eye,
  MousePointerClick,
  Box,
  Tag,
  Target,
  Timer,
  Percent,
  TrendingUp,
  TrendingDown,
  Minus,
  type LucideIcon,
} from 'lucide-react';
import { deltaPct, formatDuration, formatNumber, formatPercent } from './analytics-utils';
import type { GaugeAggregate } from './analytics-types';

type ToneKey = 'sky' | 'emerald' | 'violet' | 'orange' | 'amber' | 'teal' | 'blue' | 'rose';

const TONES: Record<ToneKey, { chip: string; dot: string }> = {
  sky: {
    chip: 'bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400',
    dot: 'bg-sky-500',
  },
  emerald: {
    chip: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
    dot: 'bg-emerald-500',
  },
  violet: {
    chip: 'bg-violet-100 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400',
    dot: 'bg-violet-500',
  },
  orange: {
    chip: 'bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400',
    dot: 'bg-orange-500',
  },
  amber: {
    chip: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
    dot: 'bg-amber-500',
  },
  teal: {
    chip: 'bg-teal-100 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400',
    dot: 'bg-teal-500',
  },
  blue: {
    chip: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
    dot: 'bg-blue-500',
  },
  rose: {
    chip: 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400',
    dot: 'bg-rose-500',
  },
};

interface KpiCardProps {
  label: string;
  value: string;
  delta?: number | null;
  deltaLabel?: string;
  icon: LucideIcon;
  tone: ToneKey;
}

function KpiCard({ label, value, delta, deltaLabel, icon: Icon, tone }: KpiCardProps) {
  const up = typeof delta === 'number' && delta > 0.0001;
  const down = typeof delta === 'number' && delta < -0.0001;
  const { chip, dot } = TONES[tone];
  const DeltaIcon = up ? TrendingUp : down ? TrendingDown : Minus;
  const deltaCls = up
    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
    : down
      ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'
      : 'bg-neutral-100 text-neutral-500 dark:bg-white/5 dark:text-neutral-400';

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-neutral-200/80 dark:border-white/10 bg-white dark:bg-zinc-900 p-4 sm:p-5 shadow-sm transition-colors hover:border-neutral-300 dark:hover:border-white/20">
      <span className={`absolute inset-x-0 top-0 h-[3px] ${dot}`} aria-hidden="true" />
      <div className="flex items-start justify-between gap-3">
        <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">{label}</span>
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${chip}`}>
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>
      <div className="mt-3 text-2xl sm:text-[28px] font-black tracking-tight text-neutral-900 dark:text-white tabular-nums">
        {value}
      </div>
      {typeof delta === 'number' ? (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className={`inline-flex items-center gap-1 rounded-lg px-1.5 py-0.5 text-[11px] font-bold tabular-nums ${deltaCls}`}>
            <DeltaIcon className="h-3 w-3" aria-hidden="true" />
            {formatPercent(Math.abs(delta))}
          </span>
          {deltaLabel && <span className="text-[11px] text-neutral-400 dark:text-neutral-500">{deltaLabel}</span>}
        </div>
      ) : (
        <div className="mt-2 text-[11px] text-neutral-400 dark:text-neutral-500">{deltaLabel}</div>
      )}
    </div>
  );
}

interface KpiCardsProps {
  current: GaugeAggregate;
  previous: GaugeAggregate;
  conversions: number;
  prevConversions: number;
  t: (key: string, params?: Record<string, string | number>) => string;
}

export default function KpiCards({ current, previous, conversions, prevConversions, t }: KpiCardsProps) {
  const g = (k: string) => t(`admin.siteWeb.analytics.${k}`);
  const vsPrevious = g('vsPrevious');
  const cards: KpiCardProps[] = [
    {
      label: g('kpiSessions'),
      value: formatNumber(current.sessions),
      delta: deltaPct(previous.sessions, current.sessions),
      deltaLabel: vsPrevious,
      icon: Users,
      tone: 'sky',
    },
    {
      label: g('kpiVisitors'),
      value: formatNumber(current.uniqueVisitors),
      delta: deltaPct(previous.uniqueVisitors, current.uniqueVisitors),
      deltaLabel: vsPrevious,
      icon: Eye,
      tone: 'emerald',
    },
    {
      label: g('kpiPageViews'),
      value: formatNumber(current.pageViews),
      delta: deltaPct(previous.pageViews, current.pageViews),
      deltaLabel: vsPrevious,
      icon: MousePointerClick,
      tone: 'violet',
    },
    {
      label: g('kpiProductViews'),
      value: formatNumber(current.productViews),
      delta: deltaPct(previous.productViews, current.productViews),
      deltaLabel: vsPrevious,
      icon: Box,
      tone: 'orange',
    },
    {
      label: g('kpiDistinctProducts'),
      value: formatNumber(current.distinctProducts),
      delta: deltaPct(previous.distinctProducts, current.distinctProducts),
      deltaLabel: vsPrevious,
      icon: Tag,
      tone: 'amber',
    },
    {
      label: g('kpiConversions'),
      value: formatNumber(conversions),
      delta: deltaPct(prevConversions, conversions),
      deltaLabel: vsPrevious,
      icon: Target,
      tone: 'teal',
    },
    {
      label: g('kpiAvgDuration'),
      value: formatDuration(current.avgDurationMs),
      delta: deltaPct(previous.avgDurationMs, current.avgDurationMs),
      deltaLabel: vsPrevious,
      icon: Timer,
      tone: 'blue',
    },
    {
      label: g('kpiBounceRate'),
      value: formatPercent(current.bounceRate),
      delta: deltaPct(previous.bounceRate, current.bounceRate) === null
        ? null
        : -1 * (deltaPct(previous.bounceRate, current.bounceRate) as number),
      deltaLabel: vsPrevious,
      icon: Percent,
      tone: 'rose',
    },
  ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
      {cards.map((c) => (
        <KpiCard key={c.label} {...c} />
      ))}
    </div>
  );
}