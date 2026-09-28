'use client';

import React, { useState } from 'react';
import {
  ExternalLink,
  ArrowUpDown,
  LayoutGrid,
  List,
  Eye,
  MousePointerClick,
  Users,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { formatNumber, formatPercent } from './analytics-utils';
import type { GaugeAggregate } from './analytics-types';

interface ProductsModuleProps {
  current: GaugeAggregate;
  t: (key: string, params?: Record<string, string | number>) => string;
  onSelect: (slug: string) => void;
}

type SortKey = 'views' | 'clicks' | 'uniques' | 'interestRate';
type ViewMode = 'cards' | 'table';

const KNOWN_PRODUCT_PHOTOS: Record<string, string> = {
  'pxt-fine': '/uploads/products/wp/front.jpg',
  'wk-series': '/uploads/products/wk/front.jpg',
  'pxt-ultra': '/uploads/products/wt/front.jpg',
  'pxt-390': '/uploads/products/wv/front.jpg',
  'wk-a': '/uploads/products/ap/front.jpg',
  'pxt-pro': '/uploads/products/armk2/front.jpg',
  'wp': '/uploads/products/wp/front.jpg',
  'wk': '/uploads/products/wk/front.jpg',
  'wt': '/uploads/products/wt/front.jpg',
  'wv': '/uploads/products/wv/front.jpg',
};

const FALLBACK_IMAGE = '/no-product.png';

function getProductPhotoUrl(slug: string): string {
  if (KNOWN_PRODUCT_PHOTOS[slug]) {
    return KNOWN_PRODUCT_PHOTOS[slug];
  }
  return `/uploads/products/${slug}/front.jpg`;
}

export default function ProductsModule({ current, t, onSelect }: ProductsModuleProps) {
  const g = (k: string) => t(`admin.siteWeb.analytics.${k}`);
  const [sort, setSort] = useState<SortKey>('views');
  const [asc, setAsc] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('cards');

  const rows = [...current.products].sort((a, b) => {
    const d = (a[sort] ?? 0) - (b[sort] ?? 0);
    return asc ? d : -d;
  });

  const thCls = 'text-left text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 px-4 py-3';
  const tdCls = 'px-4 py-3 text-sm text-neutral-800 dark:text-neutral-200';

  const header = (key: SortKey, label: string) => (
    <th
      className={`${thCls} cursor-pointer select-none hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors`}
      onClick={() => {
        if (sort === key) setAsc((v) => !v);
        else {
          setSort(key);
          setAsc(false);
        }
      }}
    >
      <span className="inline-flex items-center gap-1.5">
        {label}
        <ArrowUpDown className="h-3 w-3 opacity-60" />
      </span>
    </th>
  );

  return (
    <div className="rounded-[28px] border border-neutral-200/80 dark:border-white/10 bg-white dark:bg-zinc-900 p-6 sm:p-7 shadow-sm transition-all">
      {/* Module Header with View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="text-lg font-black tracking-tight text-neutral-900 dark:text-white">
              {g('productsTitle') || 'Produits les plus consultés'}
            </h3>
            <span className="text-[11px] font-mono font-bold text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-white/5 px-2.5 py-0.5 rounded-full tabular-nums">
              {rows.length}
            </span>
          </div>
          <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
            Performances individuelles, visuels et taux d'engagement par produit.
          </p>
        </div>

        {/* View mode toggle: Cartes photos vs Tableau */}
        <div className="flex items-center gap-1 p-1 bg-neutral-100 dark:bg-white/5 rounded-xl border border-neutral-200/60 dark:border-white/10 shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('cards')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'cards'
                ? 'bg-white dark:bg-zinc-800 text-neutral-900 dark:text-white shadow-xs'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-white'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5 text-[#38E044]" />
            <span>Cartes photos</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'table'
                ? 'bg-white dark:bg-zinc-800 text-neutral-900 dark:text-white shadow-xs'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-white'
            }`}
          >
            <List className="w-3.5 h-3.5 text-neutral-400" />
            <span>Tableau avec miniatures</span>
          </button>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-neutral-500 dark:text-neutral-400 py-8 text-center">{g('empty')}</p>
      ) : viewMode === 'cards' ? (
        /* 1. Vue Cartes photos avec miniatures grand format */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {rows.slice(0, 9).map((p, idx) => {
            const photoUrl = getProductPhotoUrl(p.slug);
            const rank = idx + 1;
            const rankBadgeColor =
              rank === 1
                ? 'bg-amber-500 text-black shadow-amber-500/30'
                : rank === 2
                  ? 'bg-slate-300 text-black shadow-slate-300/30'
                  : rank === 3
                    ? 'bg-amber-700 text-white shadow-amber-700/30'
                    : 'bg-black/60 text-white backdrop-blur-md';

            return (
              <div
                key={p.slug}
                onClick={() => onSelect(p.slug)}
                className="group relative rounded-2xl border border-neutral-200/80 dark:border-white/10 bg-white dark:bg-zinc-900/90 overflow-hidden shadow-xs hover:shadow-xl hover:border-neutral-300 dark:hover:border-white/20 transition-all duration-300 cursor-pointer flex flex-col"
              >
                {/* Photo container */}
                <div className="relative w-full h-48 bg-neutral-950 overflow-hidden">
                  <img
                    src={photoUrl}
                    alt={p.name ?? p.slug}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = FALLBACK_IMAGE;
                    }}
                    className="w-full h-full object-cover object-center group-hover:scale-108 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {/* Rank Badge */}
                  <div className="absolute top-3 left-3">
                    <span
                      className={`text-[11px] font-black font-mono px-2.5 py-1 rounded-lg shadow-md ${rankBadgeColor}`}
                    >
                      #{rank}
                    </span>
                  </div>

                  {/* Interest rate pill */}
                  <div className="absolute top-3 right-3">
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-black/60 text-emerald-400 border border-emerald-500/30 backdrop-blur-md flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      {formatPercent(p.interestRate, 0)} intérêt
                    </span>
                  </div>

                  {/* Bottom title in photo overlay */}
                  <div className="absolute bottom-3 left-3 right-3">
                    <div className="text-white font-black text-base drop-shadow-sm truncate">
                      {p.name ?? p.slug}
                    </div>
                    <div className="text-neutral-300 text-[11px] font-mono truncate">
                      /web/product/{p.slug}
                    </div>
                  </div>
                </div>

                {/* Card metrics & CTA */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-xl bg-neutral-50 dark:bg-white/5 border border-neutral-100 dark:border-white/5">
                      <div className="text-[10px] uppercase font-bold text-neutral-400">Vues</div>
                      <div className="text-sm font-black text-neutral-900 dark:text-white tabular-nums mt-0.5">
                        {formatNumber(p.views)}
                      </div>
                    </div>
                    <div className="p-2 rounded-xl bg-neutral-50 dark:bg-white/5 border border-neutral-100 dark:border-white/5">
                      <div className="text-[10px] uppercase font-bold text-neutral-400">Clics</div>
                      <div className="text-sm font-black text-neutral-900 dark:text-white tabular-nums mt-0.5">
                        {formatNumber(p.clicks)}
                      </div>
                    </div>
                    <div className="p-2 rounded-xl bg-neutral-50 dark:bg-white/5 border border-neutral-100 dark:border-white/5">
                      <div className="text-[10px] uppercase font-bold text-neutral-400">Visiteurs</div>
                      <div className="text-sm font-black text-neutral-900 dark:text-white tabular-nums mt-0.5">
                        {formatNumber(p.uniques)}
                      </div>
                    </div>
                  </div>

                  {/* Interest Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-500">
                      <span>Niveau d'intérêt</span>
                      <span className="text-[#38E044] font-bold">{formatPercent(p.interestRate, 0)}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-neutral-100 dark:bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-[#38E044]"
                        style={{ width: `${Math.min(100, Math.round(p.interestRate * 100))}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-neutral-100 dark:border-white/5 flex items-center justify-between text-xs font-bold text-[#38E044] group-hover:translate-x-1 transition-transform">
                    <span>Consulter les détails</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* 2. Vue Tableau avec miniatures */
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full min-w-[620px] border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-white/10">
                <th className={thCls}>{g('colProduct')}</th>
                {header('views', g('colViews'))}
                {header('clicks', g('colClicks'))}
                {header('uniques', g('colUniques'))}
                {header('interestRate', g('colInterest'))}
                <th className={thCls} />
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 15).map((p) => {
                const photoUrl = getProductPhotoUrl(p.slug);
                return (
                  <tr
                    key={p.slug}
                    className="border-b border-neutral-100 dark:border-white/5 last:border-0 hover:bg-neutral-50/80 dark:hover:bg-white/5 transition-colors"
                  >
                    <td className={tdCls}>
                      <div className="flex items-center gap-3">
                        <img
                          src={photoUrl}
                          alt={p.name ?? p.slug}
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = FALLBACK_IMAGE;
                          }}
                          className="w-12 h-12 rounded-xl object-cover border border-neutral-200 dark:border-white/10 shrink-0 bg-neutral-900 shadow-2xs"
                        />
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => onSelect(p.slug)}
                            className="flex items-center gap-1.5 font-bold text-neutral-900 dark:text-white hover:text-[#38E044] transition-colors cursor-pointer text-left truncate"
                          >
                            <span className="truncate">{p.name ?? p.slug}</span>
                            <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-60" />
                          </button>
                          <div className="text-[11px] font-mono text-neutral-400 truncate">
                            {p.slug}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className={`${tdCls} tabular-nums font-semibold`}>{formatNumber(p.views)}</td>
                    <td className={`${tdCls} tabular-nums font-semibold`}>{formatNumber(p.clicks)}</td>
                    <td className={`${tdCls} tabular-nums font-semibold`}>{formatNumber(p.uniques)}</td>
                    <td className={`${tdCls} tabular-nums`}>
                      <div className="flex items-center gap-2.5">
                        <div className="h-2 w-20 rounded-full bg-neutral-100 dark:bg-white/10 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#38E044]"
                            style={{ width: `${Math.min(100, Math.round(p.interestRate * 100))}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold">{formatPercent(p.interestRate, 0)}</span>
                      </div>
                    </td>
                    <td className={`${tdCls} text-right`}>
                      <button
                        type="button"
                        onClick={() => onSelect(p.slug)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-[#38E044] hover:bg-[#38E044]/10 transition-colors cursor-pointer"
                      >
                        Consulter
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}