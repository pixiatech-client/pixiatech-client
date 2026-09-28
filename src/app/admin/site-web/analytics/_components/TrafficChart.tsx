'use client';

import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { TrendingUp, Users, Receipt, ArrowUpRight, ArrowDownRight } from 'lucide-react';

type MetricKey = 'sessions' | 'unique' | 'pageViews' | 'productViews';

interface TrafficChartProps {
  series: { day: string; sessions: number; unique: number; pageViews: number; productViews: number }[];
  t: (key: string, params?: Record<string, string | number>) => string;
}

export default function TrafficChart({ series, t }: TrafficChartProps) {
  const g = (k: string) => t(`admin.siteWeb.analytics.${k}`);
  const [metric, setMetric] = useState<MetricKey>('sessions');
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // Month names in short format
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const data = useMemo(() => {
    return series.map((d, index) => {
      let label = d.day.slice(5);
      const parsed = new Date(`${d.day}T00:00:00`);
      if (!Number.isNaN(parsed.getTime())) {
        label = `${monthNames[parsed.getMonth()]} ${parsed.getDate()}`;
      }
      return {
        ...d,
        label,
        rawDay: d.day,
        index,
      };
    });
  }, [series]);

  // Aggregate totals
  const totalSessions = useMemo(() => data.reduce((acc, d) => acc + (d.sessions || 0), 0), [data]);
  const totalUnique = useMemo(() => data.reduce((acc, d) => acc + (d.unique || 0), 0), [data]);
  const totalPageViews = useMemo(() => data.reduce((acc, d) => acc + (d.pageViews || 0), 0), [data]);

  const formatK = (v: number) => {
    if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
    if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
    return v.toLocaleString('fr-FR');
  };

  const formatCurrency = (v: number) => {
    return `+${v.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  // Default active index to point around 50% or maximum if none hovered
  const defaultIndex = useMemo(() => {
    if (data.length === 0) return 0;
    return Math.floor(data.length * 0.5);
  }, [data]);

  const currentIndex = activeIndex !== null ? activeIndex : defaultIndex;
  const currentItem = data[currentIndex] || data[0];

  return (
    <div className="rounded-[28px] border border-neutral-200/80 dark:border-white/10 bg-white dark:bg-zinc-900 p-6 sm:p-8 shadow-sm transition-all">
      {/* Header matching Image 1: Title on left, Stat Badges on right */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-8">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-neutral-900 dark:text-white">
            {g('chartTitle') || 'Average Sales Analysis'}
          </h2>
          <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
            Analyse détaillée du volume de trafic, des visites uniques et des pages consultées.
          </p>
        </div>

        {/* 3 Interactive Stat Badges on top right matching Image 1 */}
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
          {/* Badge 1: Sales / Sessions */}
          <button
            type="button"
            onClick={() => setMetric('sessions')}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl border transition-all cursor-pointer text-left ${
              metric === 'sessions'
                ? 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-300 dark:border-rose-500/40 shadow-xs ring-2 ring-rose-400/20'
                : 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30 opacity-75 hover:opacity-100'
            }`}
          >
            <div className="h-10 w-10 rounded-xl bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center text-rose-500 shrink-0">
              <TrendingUp className="h-5 w-5" strokeWidth={2.5} />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
                {g('metricSessions') || 'Sales'}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black text-neutral-900 dark:text-white tabular-nums">
                  {formatK(totalSessions)}
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-300 flex items-center">
                  <ArrowDownRight className="w-2.5 h-2.5" /> -1.75%
                </span>
              </div>
            </div>
          </button>

          {/* Badge 2: Customers / Visitors */}
          <button
            type="button"
            onClick={() => setMetric('unique')}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl border transition-all cursor-pointer text-left ${
              metric === 'unique'
                ? 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-300 dark:border-amber-500/40 shadow-xs ring-2 ring-amber-400/20'
                : 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30 opacity-75 hover:opacity-100'
            }`}
          >
            <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-500 shrink-0">
              <Users className="h-5 w-5" strokeWidth={2.5} />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
                {g('metricVisitors') || 'Customers'}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black text-neutral-900 dark:text-white tabular-nums">
                  {formatK(totalUnique)}
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300 flex items-center">
                  <ArrowUpRight className="w-2.5 h-2.5" /> +0.25%
                </span>
              </div>
            </div>
          </button>

          {/* Badge 3: Tax Company / Page Views */}
          <button
            type="button"
            onClick={() => setMetric('pageViews')}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl border transition-all cursor-pointer text-left ${
              metric === 'pageViews'
                ? 'bg-slate-100/90 dark:bg-slate-800/60 border-slate-300 dark:border-slate-600 shadow-xs ring-2 ring-slate-400/20'
                : 'bg-slate-50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 opacity-75 hover:opacity-100'
            }`}
          >
            <div className="h-10 w-10 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0">
              <Receipt className="h-5 w-5" strokeWidth={2.5} />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
                {g('metricPageViews') || 'Tax company'}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black text-neutral-900 dark:text-white tabular-nums">
                  ${formatK(totalPageViews)}
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300 flex items-center">
                  <ArrowUpRight className="w-2.5 h-2.5" /> +0.25%
                </span>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Recharts Area Spline Chart with Image 1 aesthetics */}
      <div className="h-72 sm:h-84 relative">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 40, right: 16, left: -10, bottom: 0 }}
            onMouseMove={(e) => {
              if (e && e.activeTooltipIndex !== undefined) {
                setActiveIndex(e.activeTooltipIndex);
              }
            }}
            onMouseLeave={() => setActiveIndex(null)}
          >
            <defs>
              {/* Soft subtle vertical fill gradient matching Image 1 */}
              <linearGradient id="image1Fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#262626" stopOpacity={0.12} />
                <stop offset="60%" stopColor="#262626" stopOpacity={0.04} />
                <stop offset="100%" stopColor="#262626" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            {/* Horizontal Dashed Gridlines */}
            <CartesianGrid
              strokeDasharray="4 4"
              stroke="#E2E8F0"
              className="dark:stroke-neutral-800"
              vertical={false}
            />

            {/* X-Axis with selected active item highlighted */}
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={(props) => {
                const { x, y, payload, index } = props;
                const isSelected = index === currentIndex;
                return (
                  <text
                    x={x}
                    y={y + 14}
                    textAnchor="middle"
                    className={`text-xs transition-all ${
                      isSelected
                        ? 'fill-black dark:fill-white font-extrabold text-sm'
                        : 'fill-neutral-400 dark:fill-neutral-500 font-medium'
                    }`}
                  >
                    {payload.value}
                  </text>
                );
              }}
              minTickGap={20}
            />

            {/* Y-Axis with $0, $6K, $12K, $18K, $25K style formatting */}
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: '#94A3B8', fontWeight: 500 }}
              tickFormatter={(v) => (v >= 1000 ? `$${(v / 1000).toFixed(0)}K` : `$${v}`)}
              width={52}
            />

            {/* Floating Black Pill Tooltip matching Image 1 */}
            <Tooltip
              isAnimationActive={false}
              cursor={{
                stroke: '#18181B',
                strokeWidth: 1.5,
                strokeDasharray: '4 4',
              }}
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const value = payload[0].value as number;
                return (
                  <div className="relative -translate-y-6">
                    <div className="bg-[#0A0D0E] text-white px-4 py-2 rounded-2xl shadow-2xl border border-white/10 flex items-center gap-1.5 whitespace-nowrap">
                      <span className="text-sm font-black tracking-tight tabular-nums">
                        {formatCurrency(value)}
                      </span>
                    </div>
                  </div>
                );
              }}
            />

            {/* Spline Area Curve */}
            <Area
              type="natural"
              dataKey={metric}
              stroke="#1E232A"
              className="dark:stroke-white"
              strokeWidth={3}
              fill="url(#image1Fill)"
              isAnimationActive={true}
              animationDuration={800}
              activeDot={{
                r: 6,
                fill: '#0A0D0E',
                stroke: '#FFFFFF',
                strokeWidth: 3,
                className: 'shadow-lg',
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}