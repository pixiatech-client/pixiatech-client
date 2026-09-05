import { jsPDF } from 'jspdf';
import type { CompanySnapshot, InvoiceItem } from './invoices';

export interface InvoicePdfBuyer {
  name: string;
  company?: string;
  address?: string;
  city?: string;
  postcode?: string;
  country?: string;
  siren?: string;
  vatNumber?: string;
  email?: string;
}

export interface InvoicePdfData {
  invoiceNumber: string;
  orderType: 'sale' | 'rental';
  orderDate: string;
  company: CompanySnapshot;
  buyer: InvoicePdfBuyer;
  isB2B: boolean;
  vatValidated: boolean;
  rentalStartDate?: string;
  rentalEndDate?: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  deliveryCost: number;
  vat: number;
  vatRate: 0 | 0.2;
  totalTtc: number;
}

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 15;
const CONTENT_W = PAGE_W - MARGIN * 2;

function fmtMoney(n: number): string {
  return `${n.toFixed(2).replace('.', ',')} €`;
}

function fmtDate(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

export function generateInvoicePdf(data: InvoicePdfData): string {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const { company } = data;

  const text = (str: string, x: number, y: number, opts?: { size?: number; bold?: boolean; color?: [number, number, number]; align?: 'left' | 'right' | 'center'; maxWidth?: number }) => {
    const size = opts?.size ?? 10;
    doc.setFontSize(size);
    doc.setFont('helvetica', opts?.bold ? 'bold' : 'normal');
    if (opts?.color) doc.setTextColor(opts.color[0], opts.color[1], opts.color[2]);
    else doc.setTextColor(20, 20, 30);
    doc.text(String(str), x, y, {
      align: opts?.align,
      maxWidth: opts?.maxWidth,
    } as any);
  };

  const line = (y: number, color?: [number, number, number]) => {
    doc.setDrawColor(color ? color[0] : 220, color ? color[1] : 220, color ? color[2] : 220);
    doc.setLineWidth(0.3);
    doc.line(MARGIN, y, PAGE_W - MARGIN, y);
  };

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, PAGE_W, 4, 'F');
  doc.setFillColor(128, 118, 248);
  doc.rect(0, 4, PAGE_W, 1, 'F');

  let y = 20;
  text(company.companyName, MARGIN, y, { size: 20, bold: true });
  y += 7;
  text(company.companyAddress, MARGIN, y, { size: 8.5, color: [90, 90, 100] });
  y += 5;
  text(`${company.companyPostcode} ${company.companyCity}`, MARGIN, y, { size: 8.5, color: [90, 90, 100] });
  y += 5;
  text(`${company.companyCountry}`, MARGIN, y, { size: 8.5, color: [90, 90, 100] });
  y += 5;
  if (company.companySiret) text(`SIRET : ${company.companySiret}`, MARGIN, y, { size: 8.5, color: [90, 90, 100] });
  y += 5.5;
  if (company.companyVatNumber) text(`N° TVA : ${company.companyVatNumber}`, MARGIN, y, { size: 8.5, color: [90, 90, 100] });
  y += 5.5;
  text(company.companyPhone, MARGIN, y, { size: 8.5, color: [90, 90, 100] });
  y += 5;
  text(company.companyEmail, MARGIN, y, { size: 8.5, color: [90, 90, 100] });

  text('FACTURE', PAGE_W - MARGIN, 24, { size: 30, bold: true, color: [15, 23, 42], align: 'right' });
  text(`${data.orderType === 'rental' ? 'Location' : 'Vente'}`, PAGE_W - MARGIN, 31, { size: 10, bold: true, color: [128, 118, 248], align: 'right' });

  const fieldsRight: Array<[string, string]> = [
    ['N° FACTURE', data.invoiceNumber],
    ['DATE', fmtDate(data.orderDate)],
    ['TYPE', data.orderType === 'rental' ? 'Location' : 'Vente'],
  ];

  let fy = 40;
  for (const [label, value] of fieldsRight) {
    doc.setFillColor(244, 244, 248);
    doc.roundedRect(PAGE_W - MARGIN - 62, fy - 5, 62, 8, 1.5, 1.5, 'F');
    text(label, PAGE_W - MARGIN - 4, fy, { size: 6.5, bold: true, color: [140, 140, 155], align: 'right' });
    text(value, PAGE_W - MARGIN - 4, fy + 4.5, { size: 8.5, bold: true, color: [20, 20, 30], align: 'right' });
    fy += 12;
  }

  y = Math.max(y + 6, fy + 2);
  line(y);
  y += 10;

  text(data.buyer.company && data.buyer.company !== data.buyer.name ? `Facturer à — ${data.isB2B ? 'Entreprise' : 'Particulier'}` : 'Facturer à', MARGIN, y, { size: 9, bold: true, color: [120, 120, 135] });
  y += 6;
  if (data.buyer.company) {
    text(data.buyer.company, MARGIN, y, { size: 12, bold: true });
    y += 6;
  }
  text(data.buyer.name, MARGIN, y, { size: 12, bold: true });
  y += 6;
  const buyerAddress = [data.buyer.address, [data.buyer.postcode, data.buyer.city].filter(Boolean).join(' '), data.buyer.country].filter(Boolean);
  for (const addrLine of buyerAddress) {
    text(addrLine, MARGIN, y, { size: 9, color: [60, 60, 70] });
    y += 5;
  }
  if (data.buyer.siren) text(`SIRET : ${data.buyer.siren}`, MARGIN, y, { size: 9, color: [60, 60, 70] });
  y += 5;
  if (data.buyer.vatNumber) text(`N° TVA : ${data.buyer.vatNumber}`, MARGIN, y, { size: 9, color: [60, 60, 70] });
  y += 5;
  if (data.buyer.email) text(data.buyer.email, MARGIN, y, { size: 9, color: [60, 60, 70] });
  y += 4;
  line(y);
  y += 8;

  if (data.orderType === 'rental') {
    doc.setFillColor(255, 251, 235);
    doc.rect(MARGIN, y, CONTENT_W, 8, 'F');
    text(`Période de location : ${fmtDate(data.rentalStartDate)} au ${fmtDate(data.rentalEndDate)}`, MARGIN + 3, y + 5.2, { size: 8.5, bold: true, color: [146, 64, 14] });
    y += 13;
  }

  const colDesc = MARGIN;
  const colQty = 70;
  const colUnit = 115;
  const colTotal = PAGE_W - MARGIN - 38;
  const colTotalRight = PAGE_W - MARGIN;

  doc.setFillColor(15, 23, 42);
  doc.rect(MARGIN, y - 4.5, CONTENT_W, 7.5, 'F');
  text('Description', colDesc, y, { size: 8, bold: true, color: [255, 255, 255] });
  text('Qté', colQty, y, { size: 8, bold: true, color: [255, 255, 255], align: 'right' });
  text('Prix unit. HT', colUnit, y, { size: 8, bold: true, color: [255, 255, 255], align: 'right' });
  text('Montant HT', colTotalRight, y, { size: 8, bold: true, color: [255, 255, 255], align: 'right' });
  y += 10;

  let idx = 0;
  for (const item of data.items) {
    idx += 1;
    const desc = item.variantName ? `${item.productName} — ${item.variantName}` : item.productName;
    const lines = doc.splitTextToSize(String(desc), colQty - MARGIN - 6) as string[];
    const rowH = Math.max(7, lines.length * 4.5);
    if (y + rowH > 264) {
      doc.addPage();
      y = 16;
    }
    text(String(idx).padStart(2, '0'), colDesc, y, { size: 8.5, bold: true, color: [110, 100, 240] });
    let descY = y;
    for (const ln of lines) {
      text(ln, colDesc + 10, descY, { size: 9 });
      descY += 4.5;
    }
    text(String(item.quantity), colQty, y, { size: 9, align: 'right' });
    text(fmtMoney(item.unitPrice), colUnit, y, { size: 9, align: 'right' });
    text(fmtMoney(item.lineTotal), colTotalRight, y, { size: 9, bold: true, align: 'right' });
    y += rowH + 2.5;
    line(y - 1, [232, 234, 240]);
  }

  y += 4;
  const summaryX = colTotal - 6;
  const summaryXRight = colTotalRight;
  const summaryLines: Array<[string, string, boolean]> = [
    ['Sous-total HT', fmtMoney(data.subtotal), false],
  ];
  if (data.discount > 0) summaryLines.push(['Remise', `- ${fmtMoney(data.discount)}`, false]);
  if (data.deliveryCost > 0) summaryLines.push(['Livraison', fmtMoney(data.deliveryCost), false]);
  if (data.isB2B && data.vatValidated) {
    summaryLines.push(['TVA (0%)', fmtMoney(0), false]);
  } else {
    summaryLines.push([`TVA (${Math.round(data.vatRate * 100)}%)`, fmtMoney(data.vat), false]);
  }

  for (const [label, value] of summaryLines) {
    text(label, summaryX, y, { size: 9, color: [70, 70, 85], align: 'right' });
    text(value, summaryXRight, y, { size: 9, bold: true, align: 'right' });
    y += 6;
  }

  doc.setFillColor(15, 23, 42);
  doc.roundedRect(summaryX - 4, y - 0.5, PAGE_W - MARGIN - summaryX + 4, 14, 2, 2, 'F');
  const totalLabel = data.isB2B && data.vatValidated ? 'TOTAL HT' : 'TOTAL TTC';
  text(totalLabel, summaryX, y + 6, { size: 10, bold: true, color: [255, 255, 255], align: 'right' });
  text(fmtMoney(data.totalTtc), summaryXRight, y + 6, { size: 13, bold: true, color: [255, 255, 255], align: 'right' });
  y += 18;

  if (data.isB2B && data.vatValidated) {
    text('TVA autoliquidée — TVA non applicable, article 283-1 du CGI', summaryX, y, {
      size: 8,
      color: [60, 100, 60],
      align: 'right',
    } as any);
    y += 6;
  }

  const footerY = PAGE_H - 24;
  line(footerY);
  text(`${company.companyName} — ${company.companyAddress}, ${company.companyPostcode} ${company.companyCity}, ${company.companyCountry}`, MARGIN, footerY + 6, { size: 7, color: [150, 150, 160], align: 'center' });
  if (company.companySiret) text(`SIRET ${company.companySiret} — TVA ${company.companyVatNumber}`, MARGIN, footerY + 11, { size: 7, color: [150, 150, 160], align: 'center' });
  text('Paiement à réception. Tout retard de paiement entraîne des pénalités conformément à la loi.', MARGIN, footerY + 16, { size: 7, color: [150, 150, 160], align: 'center' });

  const buf = Buffer.from(doc.output('arraybuffer'));
  return buf.toString('base64');
}