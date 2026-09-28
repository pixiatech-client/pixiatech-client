'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RefreshCw, Loader2, BarChart3 } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import AnalyticsFilters, { type AnalyticsFilterState } from './AnalyticsFilters';
import KpiCards from './KpiCards';
import TrafficChart from './TrafficChart';
import ProductsModule from './ProductsModule';
import PagesModule from './PagesModule';
import SourcesModule from './SourcesModule';
import DimensionsModule from './DimensionsModule';
import RealtimeModule from './RealtimeModule';
import InsightsModule from './InsightsModule';
import ProductDetailView from './ProductDetailView';
import ExportMenu from './ExportMenu';
import DataMenu from './DataMenu';
import {
  fetchOverview,
  fetchProducts,
  fetchPages,
  fetchSources,
  fetchGeo,
  fetchLanguages,
  fetchDevices,
  fetchBehavior,
  invalidateAnalyticsCache,
} from './analytics-api';
import { fillDays } from './analytics-utils';
import type {
  BehaviorResponse,
  DevicesResponse,
  GeoResponse,
  LanguagesResponse,
  OverviewResponse,
  ProductsResponse,
  SourcesResponse,
} from './analytics-types';

const DAY = 24 * 3600 * 1000;

interface ModuleData {
  overview: OverviewResponse | null;
  products: ProductsResponse | null;
  pages: ProductsResponse | null;
  sources: SourcesResponse | null;
  geo: GeoResponse | null;
  languages: LanguagesResponse | null;
  devices: DevicesResponse | null;
  behavior: BehaviorResponse | null;
}

export default function AnalyticsModule() {
  const { t } = useI18n();
  const g = (key: string, params?: Record<string, string | number>) => t(`admin.siteWeb.analytics.${key}`, params);

  const [from, setFrom] = useState<number>(() => Date.now() - 30 * DAY);
  const [to, setTo] = useState<number>(() => Date.now());
  const [filter, setFilter] = useState<AnalyticsFilterState>({});
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);

  const [data, setData] = useState<ModuleData>({
    overview: null,
    products: null,
    pages: null,
    sources: null,
    geo: null,
    languages: null,
    devices: null,
    behavior: null,
  });
  // Independent loading flags so the UI can render progressively
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingSecondary, setLoadingSecondary] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const filterKey = useMemo(
    () => JSON.stringify({ from, to, ...filter }),
    [from, to, filter]
  );

  /**
   * Two-phase load:
   *  Phase 1 — overview only → renders KPIs + chart instantly
   *  Phase 2 — all secondary data in background (products, pages, geo …)
   */
  const load = useCallback(async (opts?: { hard?: boolean }) => {
    const id = ++requestId.current;
    setLoadingOverview(true);
    setLoadingSecondary(true);
    setError(null);

    if (opts?.hard) {
      invalidateAnalyticsCache();
    }

    // ─── Phase 1: overview (critical path) ────────────────────────────
    try {
      const overview = await fetchOverview(from, to, { ...filter });
      if (requestId.current !== id) return;
      setData((prev) => ({ ...prev, overview }));
    } catch (err: unknown) {
      if (requestId.current !== id) return;
      setError(err instanceof Error ? err.message : 'Erreur de chargement.');
      setLoadingOverview(false);
      setLoadingSecondary(false);
      return;
    } finally {
      if (requestId.current === id) setLoadingOverview(false);
    }

    // ─── Phase 2: secondary data (background) ──────────────────────
    try {
      const [products, pages, sources, geo, languages, devices, behavior] = await Promise.all([
        fetchProducts(from, to, { ...filter }),
        fetchPages(from, to, { ...filter }),
        fetchSources(from, to, { ...filter }),
        fetchGeo(from, to, { ...filter }),
        fetchLanguages(from, to, { ...filter }),
        fetchDevices(from, to, { ...filter }),
        fetchBehavior(from, to, { ...filter }),
      ]);
      if (requestId.current !== id) return;
      setData((prev) => ({ ...prev, products, pages, sources, geo, languages, devices, behavior }));
    } catch (err: unknown) {
      // Non-critical — overview already rendered, soft-fail
      if (requestId.current === id) {
        console.warn('[Analytics] Secondary data failed:', err);
      }
    } finally {
      if (requestId.current === id) setLoadingSecondary(false);
    }
  }, [from, to, filter]);

  useEffect(() => {
    void load();
  }, [load, filterKey]);

  const overview = data.overview;
  const loading = loadingOverview;

  const series = useMemo(() => {
    if (!overview) return [];
    return fillDays(overview.current.byDay, from, to);
  }, [overview, from, to]);

  const sourcesOptions = useMemo(() => (overview ? Object.keys(overview.current.bySource) : []), [overview]);
  const countriesOptions = useMemo(() => (data.geo ? data.geo.rows.map((r) => r.code) : []), [data.geo]);
  const languagesOptions = useMemo(() => (data.languages ? data.languages.rows.map((r) => r.key) : []), [data.languages]);
  const devicesOptions = useMemo(() => (data.devices ? data.devices.byDevice.map((r) => r.key) : []), [data.devices]);

  return (
    <div className="space-y-6">
      <div className="bg-[#0A0D0E] border border-neutral-800 rounded-3xl p-5 sm:p-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#141B1E] border border-neutral-700 flex items-center justify-center shrink-0">
            <BarChart3 className="w-6 h-6 text-[#38E044]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold tracking-tight">{g('title')}</h1>
              <span className="text-[10px] font-mono font-extrabold bg-[#38E044] text-black px-2.5 py-0.5 rounded-full shadow-[0_0_10px_rgba(56,224,68,0.4)]">
                {g('liveBadge')}
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-1 max-w-2xl">{g('subtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <ExportMenu
            current={overview?.current ?? emptyAggregate}
            previous={overview?.previous ?? emptyAggregate}
            conversions={overview?.conversions ?? 0}
            prevConversions={overview?.prevConversions ?? 0}
            from={from}
            to={to}
            filter={{ ...filter }}
            t={t}
          />
          <DataMenu t={t} onChanged={() => void load()} />
          <button
            type="button"
            onClick={() => void load({ hard: true })}
            className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
            disabled={loadingOverview}
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            {g('refresh')}
          </button>
        </div>
      </div>

      <AnalyticsFilters
        from={from}
        to={to}
        filter={filter}
        onChange={({ from: nf, to: nt, filter: nfilter }) => {
          if (typeof nf === 'number' && typeof nt === 'number') {
            setFrom(nf);
            setTo(nt);
          }
          if (nfilter) setFilter(nfilter);
        }}
        sources={sourcesOptions}
        countries={countriesOptions}
        languages={languagesOptions}
        devices={devicesOptions}
        t={t}
      />

      {selectedProduct ? (
        <ProductDetailView
          slug={selectedProduct}
          from={from}
          to={to}
          filter={{ ...filter }}
          t={t}
          onBack={() => setSelectedProduct(null)}
        />
      ) : (
        <>
          {error && (
            <div className="rounded-2xl border border-rose-300 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-sm px-4 py-3">
              {error}
            </div>
          )}
          {loading && !overview && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-32 rounded-2xl bg-neutral-100 dark:bg-white/5 animate-pulse" />
              ))}
            </div>
          )}
          {overview && (
            <>
              <KpiCards current={overview.current} previous={overview.previous} conversions={overview.conversions} prevConversions={overview.prevConversions} t={t} />
              <TrafficChart series={series} t={t} />
              {/* Secondary modules: render skeleton while loading, real data when ready */}
              <div className="w-full">
                {loadingSecondary && !data.products
                  ? <div className="h-64 rounded-2xl bg-white/5 animate-pulse" />
                  : <ProductsModule current={data.products?.current ?? overview.current} t={t} onSelect={setSelectedProduct} />}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {loadingSecondary && !data.sources
                  ? <div className="h-40 rounded-2xl bg-white/5 animate-pulse" />
                  : <SourcesModule rows={data.sources?.rows ?? []} t={t} />}
                <RealtimeModule t={t} />
              </div>
              <DimensionsModule
                geo={data.geo?.rows ?? []}
                languages={data.languages?.rows ?? []}
                devices={
                  data.devices ?? { byDevice: [], byOs: [], byBrowser: [], byScreen: [] }
                }
                current={overview.current}
                t={t}
              />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {loadingSecondary && !data.pages
                  ? <div className="h-40 rounded-2xl bg-white/5 animate-pulse" />
                  : <PagesModule current={data.pages?.current ?? overview.current} t={t} />}
                <InsightsModule current={overview.current} previous={overview.previous} conversions={overview.conversions} prevConversions={overview.prevConversions} t={t} onSelectProduct={setSelectedProduct} />
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

const emptyAggregate = {
  sessions: 0,
  uniqueVisitors: 0,
  pageViews: 0,
  productViews: 0,
  distinctProducts: 0,
  bounceRate: 0,
  avgDurationMs: 0,
  actions: {},
  bySource: {},
  byCountry: {},
  byLang: {},
  byDevice: {},
  byOs: {},
  byBrowser: {},
  byScreen: {},
  byDay: {},
  byHour: {},
  products: [],
  pages: [],
};