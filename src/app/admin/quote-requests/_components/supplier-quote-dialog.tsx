'use client';

import React, { useState, useTransition, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Eye, Loader2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { SupplierQuotePdf } from '@/app/admin/quotes/[id]/_components/supplier-quote-pdf';
import type { QuoteRequest, Product, ProductSpec } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { getQuoteRequest, getProducts, getProductSpecs } from '@/app/admin/actions';
import { useAdminT } from '@/hooks/useAdminT';

// Props simplified: no longer needs allProducts/productSpecs from parent
interface SupplierQuoteDialogProps {
  quote: QuoteRequest;
  children: React.ReactNode;
}

export const SupplierQuoteDialog = React.forwardRef<HTMLDivElement, SupplierQuoteDialogProps>(
  ({ quote: initialQuote, children }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isPdfRendering, startPdfRender] = useTransition();

    // Full data states — populated lazily when dialog opens
    const [quote, setQuote] = useState<QuoteRequest>(initialQuote);
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [productSpecs, setProductSpecs] = useState<Record<string, ProductSpec[]>>({});
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);
    const { toast } = useToast();
    const { t } = useAdminT();

    useEffect(() => {
      if (!isOpen) {
        // Reset to lightweight data when closed
        setQuote(initialQuote);
        return;
      }

      // Lazy load everything needed when the dialog opens
      const loadDetails = async () => {
        setIsLoadingDetails(true);
        const start = performance.now();
        try {
          const [fullQuote, productsResult, specsResult] = await Promise.all([
            getQuoteRequest(initialQuote.id),
            getProducts(),
            getProductSpecs(),
          ]);

          if (fullQuote) setQuote(fullQuote);
          setAllProducts(productsResult.products);
          setProductSpecs(specsResult);

          console.log(`⏱️ SupplierQuoteDialog lazy load: ${Math.round(performance.now() - start)}ms`);
        } catch (error) {
          console.error('Failed to load supplier dialog details', error);
          toast({ variant: 'destructive', title: t('Error'), description: t('Unable to load details.') });
        } finally {
          setIsLoadingDetails(false);
        }
      };

      loadDetails();
    }, [isOpen, initialQuote.id]); // eslint-disable-line react-hooks/exhaustive-deps

    const generatePdf = async () => {
      const quoteContainer = document.getElementById(`supplier-pdf-view-${quote.id}`);
      if (!quoteContainer) {
        toast({ variant: 'destructive', title: t('Error'), description: t('PDF content not found.') });
        return null;
      }

      // Wait for rendering
      await new Promise(resolve => setTimeout(resolve, 500));
      const pdf = new jsPDF('p', 'mm', 'a4');
      const canvas = await html2canvas(quoteContainer, { 
        scale: 2, 
        useCORS: true, 
        logging: false,
        backgroundColor: '#ffffff' 
      });
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      return pdf;
    };

    const handleDownload = async () => {
      startPdfRender(async () => {
        const pdf = await generatePdf();
        if (pdf) {
          pdf.save(`${t('Technical sheet')}_${quote.id.substring(0, 6)}.pdf`);
        }
      });
    };

    const handlePreview = async () => {
      startPdfRender(async () => {
        const pdf = await generatePdf();
        if (pdf) {
          window.open(pdf.output('bloburl'), '_blank');
        }
      });
    };

    const handleUpdateRequest = (updatedData: Partial<QuoteRequest>, updatedSpecs?: Record<string, ProductSpec[]>) => {
      setQuote(prev => ({ ...prev, ...updatedData }));
      if (updatedSpecs) {
        setProductSpecs(updatedSpecs);
      }
    };

    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
        <DialogContent className="sm:max-w-4xl h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{t("Supplier View")}</DialogTitle>
            <DialogDescription>
              {t("Preview and download the simplified technical sheet.")}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-grow overflow-auto bg-gray-200 p-4 rounded-md">
            <div className="w-fit mx-auto" ref={ref}>
              {isLoadingDetails ? (
                <div className="flex flex-col items-center justify-center h-64 w-[210mm] bg-white rounded shadow text-slate-400">
                  <Loader2 className="h-10 w-10 animate-spin mb-3" />
                  <p className="font-bold text-sm">{t("Loading technical sheet...")}</p>
                </div>
              ) : (
                <SupplierQuotePdf
                  request={quote}
                  specs={productSpecs}
                  selectedCity={null}
                  allProducts={allProducts}
                  onUpdateRequest={handleUpdateRequest}
                />
              )}
            </div>
          </div>

          <DialogFooter className="sm:justify-start gap-2 pt-4 border-t">
            <Button variant="outline" onClick={handlePreview} disabled={isPdfRendering || isLoadingDetails}>
              {isPdfRendering ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Eye className="mr-2 h-4 w-4" />}
              {t("Preview")}
            </Button>
            <Button onClick={handleDownload} disabled={isPdfRendering || isLoadingDetails}>
              {isPdfRendering ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              {t("Download")}
            </Button>
          </DialogFooter>

          {/* Hidden div for PDF rendering */}
          <div className="absolute -left-[9999px] top-0 opacity-0 pointer-events-none z-[-1]">
            {!isLoadingDetails && (
              <SupplierQuotePdf
                id={`supplier-pdf-view-${quote.id}`}
                request={quote}
                specs={productSpecs}
                selectedCity={null}
                allProducts={allProducts}
                onUpdateRequest={handleUpdateRequest}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }
);

SupplierQuoteDialog.displayName = 'SupplierQuoteDialog';
