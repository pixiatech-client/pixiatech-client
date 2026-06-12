
'use client';

import { useState, useTransition } from 'react';
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
import { useAdminT } from '@/hooks/useAdminT';

interface SupplierQuoteDialogProps {
  quote: QuoteRequest;
  allProducts: Product[];
  productSpecs: Record<string, ProductSpec[]>;
  children: React.ReactNode;
}

export function SupplierQuoteDialog({ quote, allProducts, productSpecs, children }: SupplierQuoteDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPdfRendering, startPdfRender] = useTransition();
  const { toast } = useToast();
  const { t } = useAdminT();

  const handleUpdateRequest = (updatedData: Partial<QuoteRequest>, updatedSpecs?: Record<string, ProductSpec[]>) => {
    console.log('Update request:', updatedData, updatedSpecs);
  };

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
  }

  const handleDownload = async () => {
    startPdfRender(async () => {
      const pdf = await generatePdf();
      if (pdf) {
        pdf.save(`fiche_technique_${quote.id.substring(0, 6)}.pdf`);
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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Supplier View</DialogTitle>
          <DialogDescription>
            Preview and download the simplified technical sheet.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow overflow-auto bg-gray-200 p-4 rounded-md">
          <div className="w-fit mx-auto">
            <SupplierQuotePdf
              request={quote}
              specs={productSpecs}
              selectedCity={null}
              allProducts={allProducts}
              onUpdateRequest={handleUpdateRequest}
            />
          </div>
        </div>
        <DialogFooter className="sm:justify-start gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handlePreview} disabled={isPdfRendering}>
            {isPdfRendering ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Eye className="mr-2 h-4 w-4" />}
            Preview
          </Button>
          <Button onClick={handleDownload} disabled={isPdfRendering}>
            {isPdfRendering ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Download
          </Button>
        </DialogFooter>
        
        {/* Hidden div for rendering */}
        <div className="absolute -left-[9999px] top-0 opacity-0 pointer-events-none z-[-1]">
             <SupplierQuotePdf id={`supplier-pdf-view-${quote.id}`} request={quote} specs={productSpecs} selectedCity={null} allProducts={allProducts} onUpdateRequest={handleUpdateRequest} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
