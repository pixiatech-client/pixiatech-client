'use client';

import React, { useMemo } from 'react';
import { Sparkles } from 'lucide-react';
import { topEntries } from './analytics-utils';
import type { GaugeAggregate } from './analytics-types';

interface InsightsModuleProps {
  current: GaugeAggregate;
  previous: GaugeAggregate;
  conversions: number;
  prevConversions: number;
  t: (key: string, params?: Record<string, string | number>) => string;
  onSelectProduct: (slug: string) => void;
}

export default function InsightsModule({ current, previous, conversions, prevConversions, t, onSelectProduct }: InsightsModuleProps) {
  const g = (k: string, params?: Record<string, string | number>) => t(`admin.siteWeb.analytics.${k}`, params);

  const items = useMemo(() => {
    const out: { key: string; text: string; slug?: string }[] = [];
    if (current.sessions === 0) {
      out.push({ key: 'noData', text: g('insightNoData') });
      return out;
    }

    const topProduct = current.products[0];
    if (topProduct) {
      out.push({ key: 'topProduct', text: g('insightTopProduct', { name: topProduct.name ?? topProduct.slug, views: topProduct.views }), slug: topProduct.slug });
    }
    const topSource = topEntries(current.bySource, 1)[0];
    if (topSource) out.push({ key: 'topSource', text: g('insightTopSource', { name: topSource.key, count: topSource.count }) });
    const topCountry = topEntries(
      Object.fromEntries(Object.entries(current.byCountry).map(([c, v]) => [c, v.sessions])),
      1
    )[0];
    if (topCountry) out.push({ key: 'topCountry', text: g('insightTopCountry', { name: topCountry.key.toUpperCase(), count: topCountry.count }) });
    const topDevice = topEntries(current.byDevice, 1)[0];
    if (topDevice) out.push({ key: 'topDevice', text: g('insightTopDevice', { name: topDevice.key }) });

    const bestDay = topEntries(Object.fromEntries(Object.entries(current.byDay).map(([d, v]) => [d, v.sessions])), 1)[0];
    if (bestDay) out.push({ key: 'bestDay', text: g('insightBestDay', { day: bestDay.key, count: bestDay.count }) });
    const bestHour = topEntries(current.byHour, 1)[0];
    if (bestHour) out.push({ key: 'peakHour', text: g('insightPeakHour', { hour: bestHour.key }) });

    if (previous.sessions > 0 && current.sessions !== previous.sessions) {
      const pct = Math.abs(Math.round(((current.sessions - previous.sessions) / previous.sessions) * 100));
      out.push({
        key: 'growth',
        text: current.sessions > previous.sessions ? g('insightGrowthUp', { pct }) : g('insightGrowthDown', { pct }),
      });
    }
    const bouncePct = Math.round(current.bounceRate * 100);
    if (current.sessions > 0) {
      out.push({
        key: 'bounce',
        text: bouncePct >= 60 ? g('insightBounceHigh', { pct: bouncePct }) : g('insightBounceLow', { pct: bouncePct }),
      });
    }
    if (conversions > 0 && current.sessions > 0) {
      out.push({
        key: 'conv',
        text: g('insightConversionRate', { pct: ((conversions / current.sessions) * 100).toFixed(1) }),
      });
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, previous, conversions, prevConversions]);

  return (
    <div className="rounded-2xl border border-neutral-200/80 dark:border-white/10 bg-white dark:bg-zinc-900 p-4 sm:p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-[#38E044]" aria-hidden="true" />
        <h3 className="text-sm font-black tracking-tight text-neutral-900 dark:text-white">{g('insightsTitle')}</h3>
      </div>
      <ul className="space-y-2">
        {items.map((i) => (
          <li key={i.key} className="flex items-start gap-2">
            <span className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#38E044]/60" aria-hidden="true" />
            <button
              type="button"
              disabled={!i.slug}
              onClick={() => i.slug && onSelectProduct(i.slug)}
              className={`text-sm text-left text-neutral-700 dark:text-neutral-300 ${
                i.slug
                  ? 'cursor-pointer underline decoration-dotted underline-offset-4 hover:text-[#38E044] focus-visible:outline-none focus-visible:text-[#38E044]'
                  : 'cursor-default'
              }`}
            >
              {i.text}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}