'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import { useUser } from '@/firebase';
import { getInvoiceRequests } from '@/app/admin/actions';
import { translateStatus } from '@/lib/utils';
import type { InvoiceRequestStatus, InvoiceRequestSummary } from '@/lib/invoices';
import {
  ShieldAlert,
  Loader2,
  Receipt,
  Download,
  PencilLine,
  FilePlus2,
  Archive,
  Send,
  Inbox,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';

const ALLOWED_ROLES = ['admin', 'commercial'];
const TABS: InvoiceRequestStatus[] = ['pending', 'in_progress', 'completed', 'archived'];

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  in_progress: 'bg-blue-50 text-blue-700 border-blue-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  archived: 'bg-gray-100 text-gray-600 border-gray-200',
};

function formatRequestDate(iso: string, locale: string): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const localeMap: Record<string, string> = { fr: 'fr-FR', en: 'en-US', 'zh-CN': 'zh-CN' };
  return date.toLocaleString(localeMap[locale] || 'fr-FR', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminFacturesPage() {
  const { t, locale } = useI18n();
  const { userProfile, isUserLoading } = useUser();
  const [requests, setRequests] = useState<InvoiceRequestSummary[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState<InvoiceRequestStatus>('pending');

  const role = userProfile?.role;
  const isAllowed = !isUserLoading && role && ALLOWED_ROLES.includes(role);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const items = await getInvoiceRequests();
      setRequests(items);
    } catch {
      setError(true);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAllowed) return;
    load();
  }, [isAllowed, load]);

  if (isUserLoading || !role) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!isAllowed) {
    return (
      <Card className="m-auto max-w-lg border-rose-200">
        <CardContent className="p-8 text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center mb-4">
            <ShieldAlert className="w-7 h-7 text-rose-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('admin.factures.notAllowed')}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">{t('admin.factures.notAllowedDesc')}</p>
          <Button asChild variant="outline" className="mt-6">
            <Link href="/admin">{t('admin.factures.backToDashboard')}</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const counts = (requests || []).reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});
  const filtered = (requests || []).filter((r) => r.status === activeTab);
  const statusLabel = (status: string): string =>
    locale === 'zh-CN' ? t(`admin.factures.tabs.${status}`) : translateStatus(status, locale);

  const handleComingSoon = () => toast.info(t('admin.factures.actionComing'));

  return (
    <div className="space-y-5 p-2 sm:p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
            <span className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-500/10 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-teal-600" />
            </span>
            {t('admin.factures.title')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('admin.factures.subtitle')}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => load()}
          disabled={loading}
          className="w-fit"
        >
          <RotateCcw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          {t('admin.factures.refresh')}
        </Button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all border ${
              activeTab === tab
                ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                : 'bg-white dark:bg-zinc-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-white/10 hover:border-teal-400 hover:text-teal-600'
            }`}
          >
            {t(`admin.factures.tabs.${tab}`)}
            <span className={`ml-2 px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
              activeTab === tab ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-white/10 text-gray-500'
            }`}>
              {counts[tab] || 0}
            </span>
          </button>
        ))}
      </div>

      <Card className="overflow-hidden">
        {loading && requests === null ? (
          <CardContent className="p-12 flex flex-col items-center justify-center gap-3 text-gray-500 dark:text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
            <span className="text-sm">{t('admin.factures.loading')}</span>
          </CardContent>
        ) : error ? (
          <CardContent className="p-12 flex flex-col items-center justify-center gap-3 text-gray-500 dark:text-gray-400">
            <ShieldAlert className="w-8 h-8 text-rose-500" />
            <span className="text-sm">{t('admin.factures.loadError')}</span>
            <Button variant="outline" size="sm" onClick={() => load()}>{t('admin.factures.refresh')}</Button>
          </CardContent>
        ) : filtered.length === 0 ? (
          <CardContent className="p-12 flex flex-col items-center justify-center gap-3 text-gray-500 dark:text-gray-400">
            <Inbox className="w-8 h-8 text-gray-300 dark:text-gray-600" />
            <h3 className="text-base font-bold text-gray-700 dark:text-gray-200">
              {requests && requests.length === 0 ? t('admin.factures.emptyAllTitle') : t('admin.factures.emptyTitle')}
            </h3>
            <p className="text-sm max-w-sm text-center">
              {requests && requests.length === 0 ? t('admin.factures.emptyAllDesc') : t('admin.factures.emptyDesc')}
            </p>
          </CardContent>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/10 bg-gray-50/60 dark:bg-white/[0.02] text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <th className="px-4 py-3 font-semibold">{t('admin.factures.columns.orderId')}</th>
                  <th className="px-4 py-3 font-semibold">{t('admin.factures.columns.customerName')}</th>
                  <th className="px-4 py-3 font-semibold hidden md:table-cell">{t('admin.factures.columns.date')}</th>
                  <th className="px-4 py-3 font-semibold">{t('admin.factures.columns.status')}</th>
                  <th className="px-4 py-3 font-semibold hidden lg:table-cell">{t('admin.factures.columns.type')}</th>
                  <th className="px-4 py-3 font-semibold text-right">{t('admin.factures.columns.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-gray-50 dark:border-white/5 hover:bg-gray-50/50 dark:hover:bg-white/[0.03] transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-700 dark:text-gray-200">{r.id}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-800 dark:text-gray-100">{r.customerName}</div>
                      {r.customerEmail && (
                        <div className="text-xs text-gray-400 dark:text-gray-500">{r.customerEmail}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 hidden md:table-cell">
                      {formatRequestDate(r.requestedAt, locale)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${STATUS_BADGE[r.status] || 'bg-gray-50 text-gray-600 border-gray-200'}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                        {statusLabel(r.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {t(r.isB2B ? 'admin.factures.type.b2b' : 'admin.factures.type.particulier')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={handleComingSoon}
                          disabled={!r.hasPdf}
                          className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-teal-50 hover:text-teal-600 dark:hover:bg-teal-500/10 transition-colors disabled:opacity-40 disabled:pointer-events-none"
                          title={t('admin.factures.actions.download')}
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleComingSoon}
                          className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-500/10 transition-colors"
                          title={t('admin.factures.actions.edit')}
                        >
                          <PencilLine className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleComingSoon}
                          disabled={r.status === 'completed'}
                          className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-violet-50 hover:text-violet-600 dark:hover:bg-violet-500/10 transition-colors disabled:opacity-40 disabled:pointer-events-none"
                          title={t('admin.factures.actions.generate')}
                        >
                          <FilePlus2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleComingSoon}
                          disabled={r.status === 'archived'}
                          className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/10 dark:hover:text-white transition-colors disabled:opacity-40 disabled:pointer-events-none"
                          title={t('admin.factures.actions.archive')}
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleComingSoon}
                          disabled={r.status !== 'completed'}
                          className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-500/10 transition-colors disabled:opacity-40 disabled:pointer-events-none"
                          title={t('admin.factures.actions.transmit')}
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}