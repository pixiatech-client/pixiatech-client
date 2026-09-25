'use client';

import React from 'react';
import {
  FileText,
  Download,
  Printer,
  X,
  CheckCircle2,
  Lock,
  Tag
} from 'lucide-react';
import type { Invoice, ClientInvoice } from '../../types';
import { clientApi } from '../../lib/api';

interface InvoiceDetailModalProps {
  invoice: Invoice | ClientInvoice | null;
  onClose: () => void;
  onOpenStoreProduct?: () => void;
}

export const InvoiceDetailModal: React.FC<InvoiceDetailModalProps> = ({
  invoice: rawInvoice,
  onClose,
  onOpenStoreProduct
}) => {
  if (!rawInvoice) return null;

  // Normalize between Invoice and variations
  const inv = rawInvoice as any;
  const invoice: Invoice = inv.clientSnapshot
    ? (rawInvoice as Invoice)
    : {
        id: inv.id,
        invoiceNumber: inv.invoiceNumber || inv.number || 'FAC-2026-0001',
        orderId: inv.orderId || 'ord-1',
        orderNumber: inv.orderNumber || 'CMD-2026-0891',
        productId: inv.productId || 'prod-led',
        productName: inv.productName || inv.orders?.[0]?.productName || 'Écran LED Haute Définition',
        productImage: inv.productImage || inv.orders?.[0]?.productImage || 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=300&auto=format&fit=crop&q=80',
        issueDate: inv.issueDate || '14/09/2026',
        dueDate: inv.dueDate || '14/10/2026',
        subtotalHT: inv.subtotalHT ?? (inv.totalTTC ? inv.totalTTC / 1.2 : 1232.5),
        vatAmount: inv.vatAmount ?? (inv.totalTTC ? inv.totalTTC - inv.totalTTC / 1.2 : 246.5),
        vatRate: 0.20,
        totalTTC: inv.totalTTC ?? inv.totalTtc ?? 1479,
        status: inv.status || 'FACTURE DISPONIBLE',
        billingType: inv.billingType || 'particulier',
        clientSnapshot: {
          clientName: 'Alexandre Martin',
          email: 'client@pixiatech.com',
          billingAddress: '142 Avenue des Champs-Élysées',
          postalCode: '75008',
          city: 'Paris',
          country: 'France',
          billingType: 'particulier'
        }
      };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // If backend provides a real pdf download route:
    if (invoice.id) {
      const downloadUrl = clientApi.invoicePdf(invoice.id);
      window.open(downloadUrl, '_blank');
    } else {
      window.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 border border-neutral-200 my-8">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-200 print:hidden">
          <div className="flex items-center gap-2">
            <span className="font-mono font-extrabold text-sm text-neutral-900 bg-neutral-100 px-3 py-1 rounded-xl">
              {invoice.invoiceNumber}
            </span>
            {invoice.status === 'FACTURE DISPONIBLE' ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Facture disponible & certifiée
              </span>
            ) : invoice.status === 'EN COURS' ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-800 bg-sky-50 border border-sky-200 px-2.5 py-0.5 rounded-full">
                Traitement administratif en cours
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                Demande en attente de traitement
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {invoice.status === 'FACTURE DISPONIBLE' ? (
              <>
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimer</span>
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0A0D0E] text-white hover:bg-neutral-800 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-[#38E044]" />
                  <span>Télécharger PDF</span>
                </button>
              </>
            ) : (
              <span className="text-[11px] text-amber-800 bg-amber-50 px-3 py-1 rounded-xl border border-amber-200 font-medium">
                Document certifié en cours d'association
              </span>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-neutral-400 hover:text-black cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ================================================================= */}
        {/* PRINTABLE INVOICE SHEET                                           */}
        {/* ================================================================= */}
        <div id="invoice-printable-sheet" className="space-y-6 text-xs text-neutral-800">
          {/* Header of the Invoice */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b-2 border-neutral-900">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-2xl tracking-wider font-mono text-black">
                  PIXIATECH
                </span>
                <span className="bg-[#38E044] text-black font-extrabold text-[10px] px-2 py-0.5 rounded-full">
                  FACTURE
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 mt-1">
                PIXIATECH DISTRIBUTION SAS • Capital de 100 000 €
              </p>
              <p className="text-[11px] text-neutral-500">
                32 Boulevard Haussmann, 75009 Paris • SIRET : 522 888 888 00012
              </p>
              <p className="text-[11px] text-neutral-500">
                N° TVA Intracommunautaire : FR 44 522 888 888
              </p>
            </div>

            <div className="text-left sm:text-right font-mono">
              <div className="text-xl font-extrabold text-neutral-900">
                {invoice.invoiceNumber}
              </div>
              <div className="text-[11px] text-neutral-500 mt-1">
                Date d'émission : <strong className="text-neutral-800">{invoice.issueDate}</strong>
              </div>
              <div className="text-[11px] text-neutral-500">
                Réf. Commande : <strong className="text-neutral-800">{invoice.orderNumber}</strong>
              </div>
              <div className="text-[11px] text-neutral-500">
                Statut : <span className="text-emerald-700 font-bold">{invoice.status}</span>
              </div>
            </div>
          </div>

          {/* Client Invoicing Snapshot */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-neutral-50 border border-neutral-200">
            <div>
              <span className="font-mono font-bold text-[10px] text-neutral-400 uppercase tracking-wider block mb-1">
                Destinataire Facturé
              </span>
              <div className="font-bold text-sm text-neutral-900">
                {invoice.clientSnapshot.companyName || invoice.clientSnapshot.clientName}
              </div>
              {invoice.clientSnapshot.billingType === 'entreprise' && (
                <div className="text-[11px] text-neutral-600 mt-0.5 font-mono">
                  Représenté par : {invoice.clientSnapshot.clientName}
                </div>
              )}
              <div className="text-[11px] text-neutral-600 mt-1">
                {invoice.clientSnapshot.billingAddress}
              </div>
              <div className="text-[11px] text-neutral-600">
                {invoice.clientSnapshot.postalCode} {invoice.clientSnapshot.city} ({invoice.clientSnapshot.country})
              </div>
            </div>

            <div>
              <span className="font-mono font-bold text-[10px] text-neutral-400 uppercase tracking-wider block mb-1">
                Identifiants Fiscaux
              </span>
              {invoice.clientSnapshot.siret ? (
                <>
                  <div className="text-[11px] text-neutral-600">
                    SIRET : <strong className="font-mono text-neutral-900">{invoice.clientSnapshot.siret}</strong>
                  </div>
                  <div className="text-[11px] text-neutral-600">
                    TVA Intracommunautaire : <strong className="font-mono text-neutral-900">{invoice.clientSnapshot.vatNumber || 'Non renseigné'}</strong>
                  </div>
                </>
              ) : (
                <div className="text-[11px] text-neutral-600">
                  Client Particulier • E-mail : <strong className="text-neutral-900">{invoice.clientSnapshot.email}</strong>
                </div>
              )}
              <div className="mt-2 text-[10px] text-neutral-400 flex items-center gap-1">
                <Lock className="w-3 h-3 text-neutral-400" />
                <span>Mentions légales archivées au moment de l'émission</span>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="space-y-2">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-300 text-[11px] font-mono text-neutral-500 uppercase tracking-wider">
                  <th className="py-2">Désignation</th>
                  <th className="py-2 text-center">Qté</th>
                  <th className="py-2 text-right">Prix Unit. HT</th>
                  <th className="py-2 text-right">Taux TVA</th>
                  <th className="py-2 text-right">Total HT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                <tr>
                  <td className="py-3.5">
                    <div className="flex items-center gap-3">
                      <img
                        src={invoice.productImage}
                        alt={invoice.productName}
                        className="w-10 h-10 rounded-lg object-cover border border-neutral-200 shrink-0"
                      />
                      <div>
                        <div className="font-bold text-neutral-900">
                          {invoice.productName}
                        </div>
                        <div className="text-[10px] text-neutral-400 font-mono">
                          Réf : {invoice.productId}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 text-center font-mono">1</td>
                  <td className="py-3.5 text-right font-mono">{invoice.subtotalHT.toFixed(2)} €</td>
                  <td className="py-3.5 text-right font-mono">{(invoice.vatRate * 100).toFixed(0)}%</td>
                  <td className="py-3.5 text-right font-mono font-bold text-neutral-900">
                    {invoice.subtotalHT.toFixed(2)} €
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Total Breakdown Summary */}
          <div className="flex justify-end pt-2">
            <div className="w-72 space-y-1.5 p-4 rounded-2xl bg-neutral-50 border border-neutral-200">
              <div className="flex justify-between text-neutral-600">
                <span>Total HT brut :</span>
                <span className="font-mono text-neutral-900">{invoice.subtotalHT.toFixed(2)} €</span>
              </div>

              {invoice.discountCode && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span className="flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    Remise ({invoice.discountCode}) :
                  </span>
                  <span className="font-mono">-{invoice.discountAmount?.toFixed(2)} €</span>
                </div>
              )}

              <div className="flex justify-between text-neutral-600">
                <span>TVA (20,0%) :</span>
                <span className="font-mono text-neutral-900">{invoice.vatAmount.toFixed(2)} €</span>
              </div>

              <div className="flex justify-between pt-2 border-t border-neutral-300 font-extrabold text-sm text-neutral-900">
                <span>Total TTC Net :</span>
                <span className="font-mono font-extrabold">{invoice.totalTTC.toFixed(2)} €</span>
              </div>
            </div>
          </div>

          {/* Legal mentions footer */}
          <div className="pt-4 border-t border-neutral-200 text-[10px] text-neutral-400 leading-relaxed text-center">
            Facture certifiée conforme au Code Général des Impôts (Art. 289 et suivants). Dispense d'immatriculation en application de l'article L. 123-1-1 du code de commerce.
            TVA acquittée sur les encaissements. Aucun escompte consenti pour paiement anticipé. Pénalités de retard : 3 fois le taux d'intérêt légal en vigueur majoré de l'indemnité forfaitaire de 40 €.
          </div>
        </div>
      </div>
    </div>
  );
};
