'use client';

import React, { useState } from 'react';
import {
  Wallet,
  Coins,
  Package,
  Truck,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronDown,
  ChevronUp,
  Target,
  Timer,
  Percent,
  MousePointerClick,
  Tag,
  type LucideIcon,
} from 'lucide-react';
import { deltaPct, formatDuration, formatNumber, formatPercent } from './analytics-utils';
import type { GaugeAggregate } from './analytics-types';

interface HeroCardTheme {
  bg: string;
  border: string;
  iconBg: string;
  iconShadow: string;
}

const HERO_THEMES = {
  orange: {
    bg: 'bg-[#FFF9EE] dark:bg-[#1A150B]',
    border: 'border-[#FFE2B3] dark:border-[#4A3212]',
    iconBg: 'bg-[#FA8C16]',
    iconShadow: 'shadow-orange-500/25',
  },
  coral: {
    bg: 'bg-[#FFF1F0] dark:bg-[#1C1213]',
    border: 'border-[#FFCCC7] dark:border-[#522023]',
    iconBg: 'bg-[#FF5A5F]',
    iconShadow: 'shadow-rose-500/25',
  },
  indigo: {
    bg: 'bg-[#F0F5FF] dark:bg-[#111827]',
    border: 'border-[#ADC6FF] dark:border-[#202E5C]',
    iconBg: 'bg-[#3B5BFD]',
    iconShadow: 'shadow-blue-500/25',
  },
  purple: {
    bg: 'bg-[#F9F0FF] dark:bg-[#1B1126]',
    border: 'border-[#E5CDFF] dark:border-[#421D63]',
    iconBg: 'bg-[#9A38FF]',
    iconShadow: 'shadow-purple-500/25',
  },
};

interface HeroKpiCardProps {
  label: string;
  value: string;
  delta?: number | null;
  deltaLabel?: string;
  icon: LucideIcon;
  theme: HeroCardTheme;
}

function HeroKpiCard({ label, value, delta, deltaLabel, icon: Icon, theme }: HeroKpiCardProps) {
  const up = typeof delta === 'number' && delta > 0.0001;
  const down = typeof delta === 'number' && delta < -0.0001;
  const DeltaIcon = up ? TrendingUp : down ? TrendingDown : Minus;

  const pillCls = up
    ? 'border-emerald-400 bg-white/90 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
    : down
      ? 'border-rose-400 bg-white/90 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
      : 'border-neutral-300 bg-white/90 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300';

  return (
    <div
      className={`relative overflow-hidden rounded-[24px] border ${theme.border} ${theme.bg} p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5`}
    >
      {/* Top row: Icon + Label & Value */}
      <div className="flex items-center gap-4">
        <div
          className={`grid h-14 w-14 shrink-0 place-items-center rounded-[18px] ${theme.iconBg} text-white shadow-lg ${theme.iconShadow}`}
        >
          <Icon className="h-7 w-7" strokeWidth={2.2} aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 truncate">
            {label}
          </div>
          <div className="mt-1 text-2xl sm:text-3xl font-black tracking-tight text-neutral-900 dark:text-white tabular-nums">
            {value}
          </div>
        </div>
      </div>

      {/* Subtle Divider / Spacing */}
      <div className="mt-5 pt-3.5 border-t border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between gap-2">
        {/* Pill Badge */}
        {typeof delta === 'number' ? (
          <span
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-bold tabular-nums shadow-2xs ${pillCls}`}
          >
            <DeltaIcon className="h-3.5 w-3.5" strokeWidth={2.5} />
            <span>{up ? '+' : ''}{formatPercent(delta)}</span>
          </span>
        ) : (
          <span className="text-xs text-neutral-400">—</span>
        )}

        {/* Comparison label */}
        <span className="text-xs font-medium text-neutral-400 dark:text-neutral-500 truncate">
          {deltaLabel || 'Compared last month'}
        </span>
      </div>
    </div>
  );
}

interface SecondaryKpiProps {
  label: string;
  value: string;
  delta?: number | null;
  deltaLabel?: string;
  icon: LucideIcon;
}

function SecondaryKpiCard({ label, value, delta, deltaLabel, icon: Icon }: SecondaryKpiProps) {
  const up = typeof delta === 'number' && delta > 0.0001;
  const down = typeof delta === 'number' && delta < -0.0001;
  const DeltaIcon = up ? TrendingUp : down ? TrendingDown : Minus;

  return (
    <div className="rounded-2xl border border-neutral-200/80 dark:border-white/10 bg-white dark:bg-zinc-900 p-4 shadow-2xs">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 truncate">
          {label}
        </span>
        <span className="grid h-8 w-8 place-items-center rounded-xl bg-neutral-100 dark:bg-white/5 text-neutral-700 dark:text-neutral-300">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-2 text-xl font-black tracking-tight text-neutral-900 dark:text-white tabular-nums">
        {value}
      </div>
      <div className="mt-1 flex items-center gap-2 text-xs text-neutral-400">
        {typeof delta === 'number' && (
          <span
            className={`inline-flex items-center gap-1 font-bold ${
              up ? 'text-emerald-500' : down ? 'text-rose-500' : 'text-neutral-400'
            }`}
          >
            <DeltaIcon className="h-3 w-3" />
            {formatPercent(Math.abs(delta))}
          </span>
        )}
        <span className="truncate">{deltaLabel}</span>
      </div>
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
  const vsPrevious = g('vsPrevious') || 'Compared last month';
  const [showAll, setShowAll] = useState(false);

  // 4 Primary Hero Cards matching Image 2
  const heroCards: HeroKpiCardProps[] = [
    {
      label: 'Total Sales / Sessions',
      value: formatNumber(current.sessions),
      delta: deltaPct(previous.sessions, current.sessions),
      deltaLabel: vsPrevious,
      icon: Wallet,
      theme: HERO_THEMES.orange,
    },
    {
      label: 'Total Income / Visiteurs',
      value: formatNumber(current.uniqueVisitors),
      delta: deltaPct(previous.uniqueVisitors, current.uniqueVisitors),
      deltaLabel: vsPrevious,
      icon: Coins,
      theme: HERO_THEMES.coral,
    },
    {
      label: 'Total Product / Consultés',
      value: formatNumber(current.productViews),
      delta: deltaPct(previous.productViews, current.productViews),
      deltaLabel: vsPrevious,
      icon: Package,
      theme: HERO_THEMES.indigo,
    },
    {
      label: 'Total Orders / Objectifs',
      value: formatNumber(conversions > 0 ? conversions : current.pageViews),
      delta: deltaPct(prevConversions > 0 ? prevConversions : previous.pageViews, conversions > 0 ? conversions : current.pageViews),
      deltaLabel: vsPrevious,
      icon: Truck,
      theme: HERO_THEMES.purple,
    },
  ];

  // Secondary metrics for in-depth analysis
  const secondaryCards = [
    {
      label: g('kpiPageViews'),
      value: formatNumber(current.pageViews),
      delta: deltaPct(previous.pageViews, current.pageViews),
      deltaLabel: vsPrevious,
      icon: MousePointerClick,
    },
    {
      label: g('kpiDistinctProducts'),
      value: formatNumber(current.distinctProducts),
      delta: deltaPct(previous.distinctProducts, current.distinctProducts),
      deltaLabel: vsPrevious,
      icon: Tag,
    },
    {
      label: g('kpiAvgDuration'),
      value: formatDuration(current.avgDurationMs),
      delta: deltaPct(previous.avgDurationMs, current.avgDurationMs),
      deltaLabel: vsPrevious,
      icon: Timer,
    },
    {
      label: g('kpiBounceRate'),
      value: formatPercent(current.bounceRate),
      delta: deltaPct(previous.bounceRate, current.bounceRate) === null
        ? null
        : -1 * (deltaPct(previous.bounceRate, current.bounceRate) as number),
      deltaLabel: vsPrevious,
      icon: Percent,
    },
  ];

  return (
    <div className="space-y-4">
      {/* 4 Hero Cards in a wide, spacious 4-column layout like Image 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {heroCards.map((c) => (
          <HeroKpiCard key={c.label} {...c} />
        ))}
      </div>

      {/* Optional toggle for secondary analytics */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors cursor-pointer"
        >
          <span>{showAll ? 'Masquer les métriques secondaires' : 'Toutes les métriques (8)'}</span>
          {showAll ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {showAll && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pt-1">
          {secondaryCards.map((c) => (
            <SecondaryKpiCard key={c.label} {...c} />
          ))}
        </div>
      )}
    </div>
  );
}