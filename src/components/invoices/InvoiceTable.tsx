'use client';

import { useCallback, useEffect, useState } from 'react';
import { Eye, Download, FileText, AlertCircle } from 'lucide-react';
import { fetchInvoiceList, type InvoiceSummary } from '@/services/invoiceService';
import { EmptyState } from '@/components/invoices/EmptyState';

interface InvoiceTableProps {
  refreshKey: number;
}

function formatEuro(n: number): string {
  return `${Number(n || 0).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} €`;
}

function formatDate(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function statusConfig(status: string): { label: string; bg: string; text: string } {
  switch (status) {
    case 'generated':
      return { label: 'Générée', bg: 'bg-[#fef3c7]', text: 'text-[#92400e]' };
    case 'sent':
      return { label: 'Envoyée', bg: 'bg-emerald-100', text: 'text-emerald-700' };
    case 'failed':
      return { label: 'Échec envoi', bg: 'bg-[#ffe4e6]', text: 'text-[#be123c]' };
    default:
      return { label: status, bg: 'bg-gray-100', text: 'text-gray-600' };
  }
}

export function InvoiceTable({ refreshKey }: InvoiceTableProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<InvoiceSummary[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchInvoiceList();
      // Tri par date décroissante (plus récente en premier).
      const sorted = [...data].sort(
        (a, b) => String(b.orderDate || b.generatedAt || '').localeCompare(String(a.orderDate || a.generatedAt || ''))
      );
      setInvoices(sorted);
    } catch (err: any) {
      setError(err?.message || 'Impossible de récupérer vos factures.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const downloadPdf = (invoice: InvoiceSummary) => {
    // TODO Phase 4 : ouvrir le modal preview PDF reste à implémenter (bouton "Voir").
    window.open(`/api/boutique/invoices/${invoice.id}/pdf`, '_blank');
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-14 text-center">
        <div className="mx-auto w-8 h-8 border-2 border-gray-200 border-t-[#004ac6] rounded-full animate-spin" />
        <p className="mt-4 text-sm text-gray-500">Chargement de vos factures…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-10 text-center">
        <AlertCircle className="w-8 h-8 mx-auto text-red-500" />
        <p className="mt-3 text-sm font-semibold text-gray-900">Impossible de charger vos factures</p>
        <p className="mt-1 text-sm text-gray-500">{error}</p>
        <button
          type="button"
          onClick={load}
          className="mt-5 inline-block bg-[#004ac6] text-white text-[13px] font-semibold px-6 py-2.5 rounded-lg hover:bg-[#003ea8] transition-colors"
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (invoices.length === 0) {
    return <EmptyState icon={FileText} title="Aucune facture pour le moment." />;
  }

  return (
    <>
      {/* Mobile : cartes */}
      <div className="space-y-3 md:hidden">
        {invoices.map((invoice) => {
          const cfg = statusConfig(invoice.status);
          return (
            <div key={invoice.id} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[14px] font-bold text-gray-900 truncate">{invoice.invoiceNumber}</p>
                  <p className="text-[12px] text-gray-500 mt-0.5">{formatDate(invoice.orderDate)}</p>
                </div>
                <span className={`inline-flex items-center px-2.5 py-1 rounded text-[11px] font-semibold shrink-0 ${cfg.bg} ${cfg.text}`}>
                  {cfg.label}
                </span>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-gray-100 text-gray-600">
                    {invoice.orderType === 'sale' ? 'Vente' : 'Location'}
                  </span>
                  <span className="text-[14px] font-bold text-gray-900">{formatEuro(invoice.totalTtc)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    title="Voir"
                    className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-[#004ac6] transition-colors"
                    onClick={() => {
                      // TODO Phase 4 : ouvrir modal preview
                    }}
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    title="Télécharger le PDF"
                    className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-[#004ac6] transition-colors"
                    onClick={() => downloadPdf(invoice)}
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop : tableau */}
      <div className="hidden md:block bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-[13px] font-semibold text-gray-500 uppercase tracking-wider">N° Facture</th>
                <th className="px-6 py-4 text-[13px] font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-[13px] font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-[13px] font-semibold text-gray-500 uppercase tracking-wider text-right">Montant TTC</th>
                <th className="px-6 py-4 text-[13px] font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-4 text-[13px] font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoices.map((invoice) => {
                const cfg = statusConfig(invoice.status);
                return (
                  <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-[14px] font-bold text-gray-900">{invoice.invoiceNumber}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[14px] text-gray-700">{formatDate(invoice.orderDate)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded text-[12px] font-bold bg-gray-100 text-gray-600">
                        {invoice.orderType === 'sale' ? 'Vente' : 'Location'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-[14px] font-bold text-gray-900">{formatEuro(invoice.totalTtc)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded text-[12px] font-semibold ${cfg.bg} ${cfg.text}`}>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          title="Voir"
                          className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-[#004ac6] transition-colors"
                          onClick={() => {
                            // TODO Phase 4 : ouvrir modal preview
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          title="Télécharger le PDF"
                          className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-[#004ac6] transition-colors"
                          onClick={() => downloadPdf(invoice)}
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}