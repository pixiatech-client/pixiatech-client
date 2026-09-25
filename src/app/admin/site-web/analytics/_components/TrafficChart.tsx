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

type MetricKey = 'sessions' | 'unique' | 'pageViews' | 'productViews';

interface TrafficChartProps {
  series: { day: string; sessions: number; unique: number; pageViews: number; productViews: number }[];
  t: (key: string, params?: Record<string, string | number>) => string;
}

const METRICS: MetricKey[] = ['sessions', 'unique', 'pageViews', 'productViews'];

export default function TrafficChart({ series, t }: TrafficChartProps) {
  const g = (k: string) => t(`admin.siteWeb.analytics.${k}`);
  const [metric, setMetric] = useState<MetricKey>('sessions');

  const data = useMemo(() => series.map((d) => ({ ...d, label: d.day.slice(5) })), [series]);

  const labelKeyByMetric: Record<MetricKey, string> = {
    sessions: 'metricSessions',
    unique: 'metricVisitors',
    pageViews: 'metricPageViews',
    productViews: 'metricProductViews',
  };

  const colorsByMetric: Record<MetricKey, string> = {
    sessions: '#38E044',
    unique: '#38B6FF',
    pageViews: '#F59E0B',
    productViews: '#A78BFA',
  };

  const metricLabel = (m: MetricKey) => g(labelKeyByMetric[m]);

  const total = useMemo(() => data.reduce((acc, d) => acc + (d[metric] || 0), 0), [data, metric]);

  const formatTooltipValue = (v: number) => v.toLocaleString('fr-FR');

  return (
    <div className="rounded-2xl border border-neutral-200/80 dark:border-white/10 bg-white dark:bg-zinc-900 p-4 sm:p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-black tracking-tight text-neutral-900 dark:text-white">{g('chartTitle')}</h3>
          <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5 tabular-nums">
            <span className="font-black" style={{ color: colorsByMetric[metric] }}>
              {formatTooltipValue(total)}
            </span>{' '}
            {metricLabel(metric).toLowerCase()}
          </p>
        </div>
        <div className="flex items-center gap-1 p-1 bg-neutral-100 dark:bg-white/5 rounded-xl" role="group" aria-label={g('chartTitle')}>
          {METRICS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMetric(m)}
              aria-pressed={metric === m}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                metric === m
                  ? 'bg-white dark:bg-zinc-800 shadow-sm text-neutral-900 dark:text-white'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              {metricLabel(m)}
            </button>
          ))}
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="metricFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colorsByMetric[metric]} stopOpacity={0.35} />
                <stop offset="100%" stopColor={colorsByMetric[metric]} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.08} vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: 'currentColor', opacity: 0.6 }}
              axisLine={false}
              tickLine={false}
              minTickGap={24}
            />
            <YAxis tick={{ fontSize: 11, fill: 'currentColor', opacity: 0.6 }} axisLine={false} tickLine={false} width={42} />
            <Tooltip
              contentStyle={{
                background: '#0A0D0E',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 12,
                fontSize: 12,
                color: '#fff',
                boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
              }}
              labelFormatter={(label: string) => {
                const parsed = new Date(`${label}T00:00:00`);
                return Number.isNaN(parsed.getTime())
                  ? String(label)
                  : parsed.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
              }}
              formatter={(value: number | string | (number | string)[]) => {
                const num = typeof value === 'number' ? value : Number(Array.isArray(value) ? value[0] : value);
                return [formatTooltipValue(num || 0), metricLabel(metric)];
              }}
            />
            <Area
              type="monotone"
              dataKey={metric}
              stroke={colorsByMetric[metric]}
              strokeWidth={2}
              fill="url(#metricFill)"
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}