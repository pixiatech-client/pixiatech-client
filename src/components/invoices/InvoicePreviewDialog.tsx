'use client';
 
import { useState, useEffect } from 'react';
import { Download, ExternalLink, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface InvoicePreviewDialogProps {
  invoiceId: string | null;
  invoiceNumber: string;
  onClose: () => void;
}

export function InvoicePreviewDialog({ invoiceId, invoiceNumber, onClose }: InvoicePreviewDialogProps) {
  const open = !!invoiceId;
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (invoiceId) {
      setLoading(true);
    }
  }, [invoiceId]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-[42rem] w-[calc(100vw-2rem)] max-h-[90vh] p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-5 py-3.5 border-b border-gray-100">
          <DialogTitle className="text-[15px] font-bold text-gray-900">Aperçu — {invoiceNumber}</DialogTitle>
          <DialogDescription className="hidden" />
        </DialogHeader>

        {invoiceId && (
          <div className="relative">
            {loading && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gray-50/90 gap-2.5">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                <span className="text-xs text-gray-500 font-medium">Chargement du document...</span>
              </div>
            )}
            <iframe
              key={invoiceId}
              src={`/api/boutique/invoices/${invoiceId}/preview`}
              title={`Aperçu de la facture ${invoiceNumber}`}
              onLoad={() => setLoading(false)}
              className="w-full h-[68vh] bg-gray-100 border-0"
            />
            <a
              href={`/api/boutique/invoices/${invoiceId}/preview`}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-4 left-4 z-20 inline-flex items-center gap-1.5 bg-white text-gray-700 text-[12px] font-semibold px-3.5 py-2 rounded-lg shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Ouvrir dans un nouvel onglet
            </a>
            <a
              href={`/api/boutique/invoices/${invoiceId}/pdf`}
              className="absolute bottom-4 right-4 z-20 inline-flex items-center gap-1.5 bg-[#004ac6] text-white text-[12px] font-semibold px-3.5 py-2 rounded-lg shadow-lg hover:bg-[#003ea8] transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Télécharger
            </a>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
