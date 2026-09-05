'use client';

import { useCallback, useState } from 'react';
import {
  Building2,
  Package,
  FileText,
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';
import { generateInvoice, type EligibleOrder } from '@/services/invoiceService';
import type { ProfessionalInfo } from '@/services/professionalInfoService';

function formatEuro(n: number): string {
  return `${n.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} €`;
}

interface InvoiceSummaryStepProps {
  professionalInfo: ProfessionalInfo;
  order: EligibleOrder;
  onBack: () => void;
  onGenerated: (invoiceNumber: string) => void;
  onAlreadyInvoiced: (message: string) => void;
}

export function InvoiceSummaryStep({
  professionalInfo,
  order,
  onBack,
  onGenerated,
  onAlreadyInvoiced,
}: InvoiceSummaryStepProps) {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unitPrice = order.quantity > 0 ? order.subtotal / order.quantity : 0;
  const showDiscount = order.discount > 0;
  const isAutoLiquidated = order.vatRate === 0;

  const vatLabel = isAutoLiquidated ? 'Autoliquidée 0%' : 'TVA 20%';

  const addressLine = [professionalInfo.address, professionalInfo.postcode, professionalInfo.city]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(', ');

  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    setError(null);
    try {
      const { invoice } = await generateInvoice(order.orderId, order.orderType);
      onGenerated(String(invoice?.invoiceNumber || ''));
    } catch (err: any) {
      if (err?.name === 'APIError' && err?.status === 409) {
        onAlreadyInvoiced(err?.message || 'Cette commande a déjà été facturée.');
        return;
      }
      setError(err?.message || 'Une erreur est survenue pendant la génération de la facture.');
    } finally {
      setGenerating(false);
    }
  }, [order.orderId, order.orderType, onGenerated, onAlreadyInvoiced]);

  return (
    <div className="space-y-5">
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="leading-relaxed font-medium">{error}</p>
        </div>
      )}

      {/* SECTION 1 — Informations entreprise */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8">
        <div className="flex items-center gap-2.5 mb-5">
          <span className="w-8 h-8 rounded-lg bg-[#004ac6] text-white flex items-center justify-center">
            <Building2 className="w-4 h-4" />
          </span>
          <h3 className="text-[15px] font-semibold text-gray-900">Informations entreprise</h3>
        </div>

        <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
          <div>
            <dt className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Nom de l'entreprise</dt>
            <dd className="text-sm font-semibold text-gray-900 mt-1">{professionalInfo.companyName || '—'}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">SIRET</dt>
            <dd className="text-sm font-semibold text-gray-900 mt-1">{professionalInfo.siret || '—'}</dd>
          </div>
          {professionalInfo.vatNumber && (
            <div>
              <dt className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">TVA Intracommunautaire</dt>
              <dd className="text-sm font-semibold text-gray-900 mt-1">{professionalInfo.vatNumber}</dd>
            </div>
          )}
          <div>
            <dt className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Adresse complète</dt>
            <dd className="text-sm font-semibold text-gray-900 mt-1">{addressLine || '—'}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Email professionnel</dt>
            <dd className="text-sm font-semibold text-gray-900 mt-1">{professionalInfo.companyEmail || '—'}</dd>
          </div>
        </dl>
      </div>

      {/* SECTION 2 — Détails de la commande */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8">
        <div className="flex items-center gap-2.5 mb-5">
          <span className="w-8 h-8 rounded-lg bg-[#004ac6] text-white flex items-center justify-center">
            <Package className="w-4 h-4" />
          </span>
          <h3 className="text-[15px] font-semibold text-gray-900">Détails de la commande</h3>
        </div>

        <div className="rounded-xl border border-gray-100 bg-gray-50/60 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-4 sm:px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Produit</th>
                <th className="px-4 sm:px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wide text-center">Qté</th>
                <th className="px-4 sm:px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wide text-right">Prix unitaire</th>
                <th className="px-4 sm:px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wide text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-4 sm:px-5 py-3.5 text-sm font-medium text-gray-900">{order.productName}</td>
                <td className="px-4 sm:px-5 py-3.5 text-sm text-gray-600 text-center">{order.quantity}</td>
                <td className="px-4 sm:px-5 py-3.5 text-sm text-gray-600 text-right">{formatEuro(unitPrice)}</td>
                <td className="px-4 sm:px-5 py-3.5 text-sm font-semibold text-gray-900 text-right">{formatEuro(order.subtotal)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-5 flex flex-col items-end gap-1.5 max-w-xs ml-auto">
          <div className="flex items-center justify-between w-full text-sm">
            <span className="text-gray-500">Sous-total HT</span>
            <span className="font-medium text-gray-900">{formatEuro(order.subtotal)}</span>
          </div>
          {showDiscount && (
            <div className="flex items-center justify-between w-full text-sm">
              <span className="text-gray-500">Remise</span>
              <span className="font-medium text-gray-900">− {formatEuro(order.discount)}</span>
            </div>
          )}
          <div className="flex items-center justify-between w-full text-sm">
            <span className="text-gray-500">Frais de livraison</span>
            <span className="font-medium text-gray-900">
              {order.deliveryCost > 0 ? formatEuro(order.deliveryCost) : 'Gratuite'}
            </span>
          </div>
          <div className="flex items-center justify-between w-full text-sm">
            <span className="text-gray-500">TVA ({vatLabel})</span>
            <span className="font-medium text-gray-900">{formatEuro(order.vat)}</span>
          </div>
          <div className="flex items-center justify-between w-full pt-3 mt-1 border-t border-gray-200">
            <span className="text-[15px] font-bold text-gray-900">TOTAL TTC</span>
            <span className="text-[18px] font-bold text-[#004ac6]">{formatEuro(order.totalTtc)}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col-reverse sm:flex-row gap-3 sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onBack}
          disabled={generating}
          className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 px-4 py-2.5 rounded-lg transition-colors disabled:opacity-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </button>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={generating}
          className="inline-flex items-center justify-center gap-2 bg-[#004ac6] text-white text-sm font-semibold px-8 py-2.5 rounded-lg hover:bg-[#003ea8] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {generating ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Génération…
            </>
          ) : (
            <>
              <FileText className="h-4 w-4" />
              Générer ma facture
            </>
          )}
        </button>
      </div>

      <p className="flex items-center gap-1.5 text-[12px] text-gray-400">
        <CheckCircle2 className="h-3.5 w-3.5" />
        La facture sera envoyée à {professionalInfo.companyEmail || 'votre email professionnel'}.
      </p>
    </div>
  );
}