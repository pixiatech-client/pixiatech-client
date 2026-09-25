'use client';

import React, { useState } from 'react';
import { Download, FileText, FileSpreadsheet, Loader2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { downloadVisitorsCsv } from './analytics-api';
import { downloadCsv, downloadPdf } from './analytics-utils';
import type { AnalyticsFilter, GaugeAggregate } from './analytics-types';

interface ExportMenuProps {
  current: GaugeAggregate;
  previous: GaugeAggregate;
  conversions: number;
  prevConversions: number;
  from: number;
  to: number;
  filter: AnalyticsFilter;
  t: (key: string, params?: Record<string, string | number>) => string;
}

export default function ExportMenu({ current, previous, conversions, prevConversions, from, to, filter, t }: ExportMenuProps) {
  const g = (k: string) => t(`admin.siteWeb.analytics.${k}`);
  const [busy, setBusy] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const rangeLabel = `${new Date(from).toLocaleDateString()} → ${new Date(to).toLocaleDateString()}`;

  const exportAggregatesCsv = () => {
    const header = ['Produit', 'Vues', 'Clics', 'Visiteurs', 'Intérêt'];
    const rows = current.products.map((p) => [p.name ?? p.slug, p.views, p.clicks, p.uniques, p.interestRate.toFixed(3)]);
    downloadCsv(`pixiatech_produits_${from}_${to}.csv`, header, rows);
  };

  const exportVisitors = async () => {
    setBusy('visitors');
    try {
      await downloadVisitorsCsv(from, to, filter);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Export impossible.');
    } finally {
      setBusy(null);
    }
  };

  const exportReportPdf = async () => {
    setBusy('pdf');
    try {
      await downloadPdf({
        title: 'PixiaTech — Rapport Analytics',
        rangeLabel,
        generatedAt: new Date().toLocaleString(),
        kpis: [
          { label: 'Sessions', value: String(current.sessions) },
          { label: 'Visiteurs uniques', value: String(current.uniqueVisitors) },
          { label: 'Vues de pages', value: String(current.pageViews) },
          { label: 'Vues produits', value: String(current.productViews) },
          { label: 'Produits consultés', value: String(current.distinctProducts) },
          { label: 'Conversions', value: String(conversions) },
          { label: 'Taux de rebond', value: `${Math.round(current.bounceRate * 100)}%` },
          { label: 'Durée moyenne', value: `${Math.round(current.avgDurationMs / 60000)} min` },
        ],
        products: current.products.map((p) => ({ name: p.name ?? p.slug, slug: p.slug, views: p.views, clicks: p.clicks })),
        pages: current.pages.map((p) => ({ path: p.path, views: p.views, uniques: p.uniques, exits: p.exits })),
        sources: Object.entries(current.bySource)
          .sort((a, b) => b[1] - a[1])
          .map(([key, count]) => ({ key, visits: count })),
      });
      toast.success(g('reportGenerated'));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Export PDF impossible.');
    } finally {
      setBusy(null);
    }
  };

  const btn = (mode: string, busyMode: string | null) =>
    `px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
      busyMode === mode ? 'bg-neutral-100 dark:bg-white/5 opacity-60' : mode === 'pdf' ? 'bg-[#38E044] text-black hover:bg-[#4af257]' : 'bg-white/5 hover:bg-white/10 border border-white/10 text-white'
    }`;

  return (
    <div className="relative">
      <button
        type="button"
        disabled={!!busy}
        onClick={() => setOpen((v) => !v)}
        className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
      >
        <Download className="h-3.5 w-3.5" />
        {g('exportTitle')}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#0A0D0E] shadow-2xl z-30 p-2 space-y-1">
            <p className="px-2 py-1 text-[11px] font-mono text-neutral-500 dark:text-neutral-400 truncate">{rangeLabel}</p>
            <button
              type="button"
              onClick={() => {
                exportAggregatesCsv();
                setOpen(false);
              }}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs font-bold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors cursor-pointer text-left"
            >
              {busy === 'aggregates' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-500" />}
              {g('exportCsv')}
            </button>
            <button
              type="button"
              onClick={() => {
                void exportVisitors();
                setOpen(false);
              }}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs font-bold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors cursor-pointer text-left"
            >
              {busy === 'visitors' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Users className="h-3.5 w-3.5 text-sky-500" />}
              {g('exportVisitorsCsv')}
            </button>
            <button
              type="button"
              onClick={() => {
                void exportReportPdf();
                setOpen(false);
              }}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs font-black text-black hover:shadow-lg transition-all cursor-pointer text-left bg-[#38E044]"
            >
              {busy === 'pdf' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
              {g('exportPdf')}
            </button>
          </div>
        </>
      )}
    </div>
  );
}