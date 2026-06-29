'use client';

import { useState, useRef } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { OrderInvoicePDF } from './order-invoice-pdf';
import type { PdfSettings } from '@/lib/types';

interface InvoiceProduct {
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

interface InvoiceData {
  orderRef: string;
  customerName: string;
  customerEmail: string;
  customerAddress?: string;
  customerPostcode?: string;
  customerCity?: string;
  productName?: string;
  quantity?: number;
  unitPrice?: number;
  subtotal: number;
  vat: number;
  amountPaid: number;
  createdAt: string;
  type: 'sale' | 'rental';
  rentalStartDate?: string;
  rentalEndDate?: string;
  products?: InvoiceProduct[];
}

export function InvoiceButton({ data, pdfSettings, className }: { data: InvoiceData; pdfSettings?: PdfSettings; className?: string }) {
  const [generating, setGenerating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const generateInvoice = async () => {
    setGenerating(true);
    try {
      if (pdfSettings) {
        // Use template-based PDF generation
        await new Promise(resolve => setTimeout(resolve, 500));
        const el = containerRef.current?.querySelector('#invoice-pdf-render');
        if (!el) throw new Error('PDF container not found');

        const canvas = await html2canvas(el as HTMLElement, {
          scale: 3,
          useCORS: true,
          logging: false,
          allowTaint: true,
          backgroundColor: '#ffffff',
        });

        const imgData = canvas.toDataURL('image/jpeg', 1.0);
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfW = pdf.internal.pageSize.getWidth();
        const pdfH = (canvas.height * pdfW) / canvas.width;
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfW, pdfH, undefined, 'FAST');
        pdf.save(`facture-INV${data.orderRef}.pdf`);
      } else {
        // Fallback: raw jspdf
        const doc = new jsPDF({ unit: 'mm', format: 'a4' });
        const pageW = 210;
        const margin = 20;
        const contentW = pageW - margin * 2;
        let y = margin;

        const bold = (text: string, size: number, x: number, color?: string) => {
          doc.setTextColor(color || '#000');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(size);
          doc.text(text, x, y);
        };
        const normal = (text: string, size: number, x: number, color?: string) => {
          doc.setTextColor(color || '#000');
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(size);
          doc.text(text, x, y);
        };
        const right = (text: string, size: number, color?: string) => {
          doc.setTextColor(color || '#000');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(size);
          doc.text(text, pageW - margin, y, { align: 'right' });
        };

        const formatDate = (iso: string) => {
          const d = new Date(iso);
          return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
        };

        bold('PIXIATECH.PRO', 22, margin);
        normal('Facture', 16, margin, '#666');
        y += 12;

        doc.setDrawColor('#e5e7eb');
        doc.line(margin, y, pageW - margin, y);
        y += 8;

        normal(`Facture n° INV${data.orderRef}`, 10, margin, '#333');
        y += 5;
        normal(`Date : ${formatDate(data.createdAt)}`, 10, margin, '#666');
        y += 5;
        normal(`Type : ${data.type === 'rental' ? 'Location' : 'Achat'}`, 10, margin, '#666');
        if (data.type === 'rental' && data.rentalStartDate) {
          y += 5;
          normal(`Du ${data.rentalStartDate} au ${data.rentalEndDate || '—'}`, 10, margin, '#666');
        }
        y += 8;

        bold('Client', 10, margin);
        y += 5;
        normal(data.customerName || '—', 10, margin);
        y += 5;
        normal(data.customerEmail, 10, margin);
        if (data.customerAddress) {
          y += 5;
          normal(`${data.customerAddress}${data.customerCity ? ', ' + data.customerPostcode + ' ' + data.customerCity : ''}`, 10, margin);
        }
        y += 10;

        doc.line(margin, y, pageW - margin, y);
        y += 6;

        const col1 = margin;
        const col2 = pageW - margin - 100;
        const col3 = pageW - margin - 55;
        const col4 = pageW - margin;

        doc.setFillColor('#f9fafb');
        doc.rect(margin, y - 4, contentW, 8, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor('#666');
        doc.text('PRODUIT', col1, y);
        doc.text('QTÉ', col2, y, { align: 'right' });
        doc.text('PRIX UNIT.', col3, y, { align: 'right' });
        doc.text('TOTAL', col4, y, { align: 'right' });
        y += 8;

        doc.setDrawColor('#e5e7eb');
        doc.line(margin, y, pageW - margin, y);
        y += 6;

        const productList = data.products && data.products.length > 0 ? data.products : [{
          name: data.productName || 'Produit',
          quantity: data.quantity || 1,
          unitPrice: data.unitPrice || 0,
          lineTotal: data.subtotal,
        }];
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor('#000');
        for (const p of productList) {
          doc.text(p.name, col1, y, { maxWidth: col2 - col1 - 5 });
          doc.text(String(p.quantity), col2, y, { align: 'right' });
          doc.text(`${p.unitPrice.toFixed(2)} €`, col3, y, { align: 'right' });
          doc.text(`${p.lineTotal.toFixed(2)} €`, col4, y, { align: 'right' });
          y += 8;
        }
        y += 2;

        doc.line(margin, y, pageW - margin, y);
        y += 6;

        normal('Sous-total', 10, col3 - 10, '#666');
        right(`${data.subtotal.toFixed(2)} €`, 10);
        y += 6;
        normal('TVA (20%)', 10, col3 - 10, '#666');
        right(`${data.vat.toFixed(2)} €`, 10);
        y += 6;

        doc.setDrawColor('#000');
        doc.setLineWidth(0.5);
        doc.line(col3 - 10, y, pageW - margin, y);
        y += 6;

        bold('TOTAL PAYÉ', 12, col3 - 10);
        right(`${data.amountPaid.toFixed(2)} €`, 14, '#000');
        y += 14;

        const footerY = 285;
        doc.setDrawColor('#e5e7eb');
        doc.line(margin, footerY, pageW - margin, footerY);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor('#999');
        doc.text('PIXIATECH.PRO - Facture générée le ' + new Date().toLocaleDateString('fr-FR'), margin, footerY + 5);
        doc.text('Merci de votre confiance.', margin, footerY + 10);

        doc.save(`facture-INV${data.orderRef}.pdf`);
      }
    } finally {
      setGenerating(false);
    }
  };

  return (
    <>
      {/* Hidden PDF preview container */}
      {pdfSettings && (
        <div
          ref={containerRef}
          style={{
            position: 'fixed',
            top: 0,
            left: '-9999px',
            opacity: 0,
            pointerEvents: 'none',
            zIndex: -9999,
          }}
        >
          <OrderInvoicePDF
            id="invoice-pdf-render"
            settings={pdfSettings}
            invoiceNumber={data.orderRef}
            createdAt={data.createdAt}
            type={data.type}
            rentalStartDate={data.rentalStartDate}
            rentalEndDate={data.rentalEndDate}
            customerName={data.customerName}
            customerEmail={data.customerEmail}
            customerAddress={data.customerAddress || ''}
            customerPostcode={data.customerPostcode}
            customerCity={data.customerCity}
            products={data.products && data.products.length > 0 ? data.products : [{
              name: data.productName || 'Produit',
              quantity: data.quantity || 1,
              unitPrice: data.unitPrice || 0,
              lineTotal: data.subtotal,
            }]}
            subtotal={data.subtotal}
            vat={data.vat}
            vatRate={20}
            totalTtc={data.amountPaid}
          />
        </div>
      )}
      <button
        onClick={generateInvoice}
        disabled={generating}
        className={className || "w-full sm:w-auto px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
        {generating ? 'Génération...' : 'Télécharger la facture'}
      </button>
    </>
  );
}
