'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Download, FileText, X } from 'lucide-react';
import type { ClientInvoice } from '../../types';
import { clientApi } from '../../lib/api';
import { formatMoney } from '../../lib/format';

interface InvoiceDetailModalProps {
  invoice: ClientInvoice | null;
  onClose: () => void;
}

export function InvoiceDetailModal({ invoice, onClose }: InvoiceDetailModalProps) {
  const [previewError, setPreviewError] = useState(false);

  const pdfUrl = invoice ? clientApi.invoicePdf(invoice.id) : '';
  const previewUrl = invoice ? clientApi.invoicePreview(invoice.id) : '';

  return (
    <AnimatePresence>
      {invoice && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-xs sm:items-center sm:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="flex max-h-[94vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-neutral-200 bg-white shadow-2xl sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-neutral-100 p-5 pb-3">
              <div className="flex items-center gap-2">
                <span className="rounded-xl bg-neutral-100 px-3 py-1.5 font-mono text-sm font-extrabold text-neutral-900">
                  {invoice.number}
                </span>
                {invoice.downloadable ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                    <CheckCircle2 className="size-3 text-emerald-600" />
                    Facture disponible & certifiée
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
                    En attente de traitement
                  </span>
                )}
              </div>
              <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-neutral-400 transition hover:bg-neutral-100 hover:text-black" aria-label="Fermer">
                <X className="size-5" />
              </button>
            </div>

            <div className="flex items-center justify-between px-5 pt-3 text-xs text-neutral-500">
              <span className="font-bold text-neutral-900">{invoice.companyName || 'PIXIATECH'}</span>
              <span>
                HT {formatMoney(invoice.totalHT)} · TVA {formatMoney(invoice.totalVAT)} ·{' '}
                <span className="font-bold text-neutral-900">Total {formatMoney(invoice.totalTTC)}</span>
              </span>
            </div>

            <div className="flex-1 overflow-y-auto bg-neutral-100 p-5">
              {invoice.downloadable && !previewError ? (
                <iframe
                  key={previewUrl}
                  src={previewUrl}
                  title={`Aperçu facture ${invoice.number}`}
                  className="h-[56vh] w-full rounded-xl border border-neutral-200 bg-white"
                  onError={() => setPreviewError(true)}
                />
              ) : (
                <div className="flex h-[56vh] flex-col items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-white p-8 text-center">
                  <FileText className="size-9 text-neutral-300" />
                  <p className="mt-3 text-sm font-bold text-neutral-700">
                    {invoice.downloadable ? 'Aperçu indisponible' : 'Facture en cours de traitement'}
                  </p>
                  <p className="mt-1 max-w-xs text-sm text-neutral-500">
                    {invoice.downloadable
                      ? 'Laissez votre navigateur autoriser les PDF intégrés, ou téléchargez-la directement ci-dessous.'
                      : "Elle sera téléchargeable dès sa génération. Consultez l'e-mail de confirmation."}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 border-t border-neutral-100 p-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-neutral-200 px-4 py-3 text-sm font-semibold text-neutral-600 transition hover:bg-neutral-50"
              >
                Fermer
              </button>
              {invoice.downloadable && (
                <a
                  href={pdfUrl}
                  download
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#0A0D0E] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  <Download className="size-4 text-[#38E044]" /> Télécharger en PDF
                </a>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}