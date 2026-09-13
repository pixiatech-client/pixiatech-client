'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Download, FileText, X } from 'lucide-react';
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
            className="flex max-h-[94vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-neutral-100 p-5">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-neutral-400">
                  Facture {invoice.number}
                </p>
                <h2 className="text-lg font-extrabold text-neutral-900">
                  {invoice.companyName || 'PIXIATECH'}
                </h2>
                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                  <span
                    className={`rounded-full px-2.5 py-0.5 font-semibold ${
                      invoice.downloadable ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {invoice.statusLabel || 'En attente'}
                  </span>
                  <span>HT {formatMoney(invoice.totalHT)} Â· TVA {formatMoney(invoice.totalVAT)}</span>
                  <span className="font-bold text-neutral-900">Total {formatMoney(invoice.totalTTC)}</span>
                </div>
              </div>
              <button type="button" onClick={onClose} className="rounded-xl p-2 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700" aria-label="Fermer">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-neutral-100 p-4">
              {invoice.downloadable && !previewError ? (
                <iframe
                  key={previewUrl}
                  src={previewUrl}
                  title={`AperÃ§u facture ${invoice.number}`}
                  className="h-[58vh] w-full rounded-xl border border-neutral-200 bg-white"
                  onError={() => setPreviewError(true)}
                />
              ) : (
                <div className="flex h-[58vh] flex-col items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-white p-8 text-center">
                  <FileText size={36} className="text-neutral-300" />
                  <p className="mt-3 text-sm font-bold text-neutral-700">
                    {invoice.downloadable ? 'AperÃ§u indisponible' : 'Facture en cours de traitement'}
                  </p>
                  <p className="mt-1 max-w-xs text-sm text-neutral-500">
                    {invoice.downloadable
                      ? 'Laissez votre navigateur autoriser les PDF intÃ©grÃ©s, ou tÃ©lÃ©chargez-la directement ci-dessous.'
                      : 'Elle sera tÃ©lÃ©chargeable dÃ¨s sa gÃ©nÃ©ration. Consultez lâ€™e-mail de confirmation.'}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 border-t border-neutral-100 p-4">
              {invoice.downloadable && (
                <a
                  href={pdfUrl}
                  download
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#0A0D0E] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  <Download size={16} /> TÃ©lÃ©charger en PDF
                </a>
              )}
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-neutral-200 px-4 py-3 text-sm font-semibold text-neutral-600 transition hover:bg-neutral-50"
              >
                Fermer
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}