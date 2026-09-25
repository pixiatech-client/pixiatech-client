import { jsPDF } from 'jspdf';
import type { CompanySnapshot, InvoiceItem } from './invoices';
import { round2 } from './invoices';

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
  phone?: string;
}

export interface InvoicePdfData {
  invoiceNumber: string;
  orderType: 'sale' | 'rental';
  orderDate: string;
  dueDate?: string;
  company: CompanySnapshot;
  buyer: InvoicePdfBuyer;
  isB2B: boolean;
  vatValidated: boolean;
  rentalStartDate?: string;
  rentalEndDate?: string;
  items: InvoiceItem[];
  /** TVA rate as decimal (0.20 = 20%) */
  vatRate: number;
  subtotal: number;
  discount: number;
  deliveryCost: number;
  vat: number;
  totalTtc: number;
  promoCode?: string;
}

// ─── Colors ────────────────────────────────────────────────────────────────────
const BLACK:    [number, number, number] = [15,  23,  42];
const GRAY_MED: [number, number, number] = [120, 120, 135];
const GRAY_LT:  [number, number, number] = [170, 170, 180];
const GRAY_DK:  [number, number, number] = [50,  50,  65];
const GREEN:    [number, number, number] = [4,   132, 84];
const BORDER:   [number, number, number] = [210, 213, 220];

// ─── Page geometry ─────────────────────────────────────────────────────────────
const PAGE_W   = 210;
const PAGE_H   = 297;
const MARGIN   = 14;
const CONTENT_W = PAGE_W - MARGIN * 2;

// ─── Helpers ───────────────────────────────────────────────────────────────────
function fmtMoney(n: number): string {
  return `${n.toFixed(2).replace('.', ',')} €`;
}

function fmtDate(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function fmtVatPct(rate: number): string {
  const pct = Math.round(rate * 1000) / 10;
  return `${String(pct).replace('.', ',')} %`;
}

// ─── Main export ───────────────────────────────────────────────────────────────
export function generateInvoicePdf(data: InvoicePdfData): string {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const { company } = data;

  // ── text helper ──────────────────────────────────────────────────────────────
  const txt = (
    str: string,
    x: number,
    y: number,
    opts?: {
      size?: number;
      bold?: boolean;
      color?: [number, number, number];
      align?: 'left' | 'right' | 'center';
      maxWidth?: number;
    },
  ) => {
    doc.setFontSize(opts?.size ?? 9);
    doc.setFont('helvetica', opts?.bold ? 'bold' : 'normal');
    doc.setTextColor(...(opts?.color ?? GRAY_DK));
    doc.text(String(str), x, y, { align: opts?.align, maxWidth: opts?.maxWidth } as any);
  };

  const hrule = (y: number, lx = MARGIN, rx = PAGE_W - MARGIN, c = BORDER) => {
    doc.setDrawColor(...c);
    doc.setLineWidth(0.25);
    doc.line(lx, y, rx, y);
  };

  // ── add new page, resetting y ─────────────────────────────────────────────
  const ensureSpace = (needed: number, curY: number): number => {
    if (curY + needed > PAGE_H - 28) {
      doc.addPage();
      return 18;
    }
    return curY;
  };

  // ──────────────────────────────────────────────────────────────────────────
  // 1. ACCENT BAR (top)
  // ──────────────────────────────────────────────────────────────────────────
  doc.setFillColor(...BLACK);
  doc.rect(0, 0, PAGE_W, 3, 'F');

  // ──────────────────────────────────────────────────────────────────────────
  // 2. LOGO AREA — PIXIATECH wordmark (left)
  // ──────────────────────────────────────────────────────────────────────────
  let y = 14;
  txt('PIXIATECH', MARGIN, y, { size: 16, bold: true, color: BLACK });

  // ──────────────────────────────────────────────────────────────────────────
  // 3. SELLER BLOCK — right column ("Envoyée par")
  // ──────────────────────────────────────────────────────────────────────────
  const RX = PAGE_W - MARGIN; // right edge
  const COL2 = 110;           // start of right column

  txt('Envoyée par', RX, y, { size: 7, color: GRAY_LT, align: 'right' });
  y += 5;
  txt(company.companyName, RX, y, { size: 8.5, bold: true, color: BLACK, align: 'right' });
  y += 4.5;
  txt(company.companyAddress, RX, y, { size: 7.5, color: GRAY_DK, align: 'right' });
  y += 4;
  txt(`${company.companyPostcode} ${company.companyCity}, ${company.companyCountry}`, RX, y, { size: 7.5, color: GRAY_DK, align: 'right' });
  y += 4;
  txt(company.companyEmail, RX, y, { size: 7.5, color: GRAY_DK, align: 'right' });
  y += 4;
  txt(`+33 ${company.companyPhone.replace(/^0/, '').replace(/\s/g, ' ')}`, RX, y, { size: 7.5, color: GRAY_DK, align: 'right' });
  if (company.companySiret) {
    y += 4;
    txt(`SIRET : ${company.companySiret}`, RX, y, { size: 7, color: GRAY_LT, align: 'right' });
  }
  if (company.companyVatNumber) {
    y += 4;
    txt(`N° TVA : ${company.companyVatNumber}`, RX, y, { size: 7, color: GRAY_LT, align: 'right' });
  }
  y += 8;

  // ──────────────────────────────────────────────────────────────────────────
  // 4. DOCUMENT TYPE + METADATA (left)
  // ──────────────────────────────────────────────────────────────────────────
  const topBlockStartY = 14 + 5 + 2; // approx same height as seller block
  let leftY = topBlockStartY;

  // "FACTURE" title
  txt('FACTURE', MARGIN, leftY + 1, { size: 18, bold: true, color: BLACK });
  leftY += 9;

  // Metadata rows
  const metaRows: [string, string][] = [
    ['Numéro',          data.invoiceNumber],
    ['Date d\'émission', fmtDate(data.orderDate)],
    ['Date d\'échéance', fmtDate(data.dueDate ?? data.orderDate)],
    ['Type de vente',   data.orderType === 'rental' ? 'Location de biens' : 'Livraisons de biens'],
  ];

  for (const [label, value] of metaRows) {
    txt(label, MARGIN, leftY, { size: 8, bold: true, color: GRAY_MED });
    txt(value, MARGIN + 38, leftY, { size: 8, color: BLACK });
    leftY += 6;
  }

  // Sync y to the bottom of whichever block is taller
  y = Math.max(y, leftY + 4);

  hrule(y);
  y += 8;

  // ──────────────────────────────────────────────────────────────────────────
  // 5. BUYER BLOCK ("À destination de")
  // ──────────────────────────────────────────────────────────────────────────
  txt('À destination de', MARGIN, y, { size: 7, color: GRAY_LT });

  const buyerName   = data.buyer.company || data.buyer.name;
  const buyerContact = data.buyer.company ? data.buyer.name : '';
  y += 5;
  txt(buyerName, MARGIN, y, { size: 9.5, bold: true, color: BLACK });
  if (buyerContact) {
    y += 5;
    txt(buyerContact, MARGIN, y, { size: 8.5, color: GRAY_DK });
  }
  const addrParts = [
    data.buyer.address,
    [data.buyer.postcode, data.buyer.city].filter(Boolean).join(' '),
    data.buyer.country,
  ].filter(Boolean) as string[];
  for (const part of addrParts) {
    y += 4.5;
    txt(part, MARGIN, y, { size: 8, color: GRAY_DK });
  }
  if (data.buyer.phone) { y += 4.5; txt(data.buyer.phone, MARGIN, y, { size: 8, color: GRAY_DK }); }
  if (data.buyer.email) { y += 4.5; txt(data.buyer.email, MARGIN, y, { size: 8, color: GRAY_DK }); }
  if (data.buyer.siren) { y += 4.5; txt(`SIRET : ${data.buyer.siren}`, MARGIN, y, { size: 7.5, color: GRAY_LT }); }
  if (data.buyer.vatNumber) { y += 4.5; txt(`N° TVA : ${data.buyer.vatNumber}`, MARGIN, y, { size: 7.5, color: GRAY_LT }); }

  y += 10;

  // ──────────────────────────────────────────────────────────────────────────
  // 6. RENTAL PERIOD BANNER (if applicable)
  // ──────────────────────────────────────────────────────────────────────────
  if (data.orderType === 'rental' && data.rentalStartDate && data.rentalEndDate) {
    doc.setFillColor(255, 251, 235);
    doc.rect(MARGIN, y - 1, CONTENT_W, 8, 'F');
    txt(`Période de location : ${fmtDate(data.rentalStartDate)} → ${fmtDate(data.rentalEndDate)}`, MARGIN + 3, y + 5, { size: 8, bold: true, color: [146, 64, 14] });
    y += 13;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 7. ITEMS TABLE
  // ──────────────────────────────────────────────────────────────────────────
  // Column positions (x = left edge of each column)
  const COL_PROD  = MARGIN;
  const COL_QTY   = MARGIN + 68;
  const COL_PU    = MARGIN + 88;
  const COL_TVA   = MARGIN + 112;
  const COL_HT    = MARGIN + 132;
  const COL_TTC   = PAGE_W - MARGIN;

  // Header row
  const TH_H = 8;
  doc.setFillColor(...BLACK);
  doc.rect(MARGIN, y, CONTENT_W, TH_H, 'F');
  const thY = y + 5.2;
  const WHITE: [number, number, number] = [255, 255, 255];
  txt('Produits',     COL_PROD + 2,  thY, { size: 7.5, bold: true, color: WHITE });
  txt('Qté',         COL_QTY  + 12, thY, { size: 7.5, bold: true, color: WHITE, align: 'right' });
  txt('Prix u. HT',  COL_PU   + 20, thY, { size: 7.5, bold: true, color: WHITE, align: 'right' });
  txt('TVA (%)',     COL_TVA  + 16, thY, { size: 7.5, bold: true, color: WHITE, align: 'right' });
  txt('Total HT',   COL_HT   + 20, thY, { size: 7.5, bold: true, color: WHITE, align: 'right' });
  txt('Total TTC',  COL_TTC,        thY, { size: 7.5, bold: true, color: WHITE, align: 'right' });
  y += TH_H;

  const vatPct = fmtVatPct(data.vatRate);

  for (let i = 0; i < data.items.length; i++) {
    const item = data.items[i];
    const desc  = item.variantName ? `${item.productName} — ${item.variantName}` : item.productName;
    const lines = doc.splitTextToSize(desc, 60) as string[];
    const rowH  = Math.max(8, lines.length * 4.5 + 3);

    y = ensureSpace(rowH + 2, y);

    // Alternating row background
    if (i % 2 === 0) {
      doc.setFillColor(248, 249, 251);
      doc.rect(MARGIN, y, CONTENT_W, rowH, 'F');
    }

    const rowY = y + 5;
    let lineY  = y + 5;
    for (const ln of lines) {
      txt(ln, COL_PROD + 2, lineY, { size: 8.5, color: BLACK });
      lineY += 4.5;
    }

    const lineHt  = round2(item.unitPrice * item.quantity);
    const lineTtc = data.vatRate === 0 ? lineHt : round2(lineHt * (1 + data.vatRate));

    txt(String(item.quantity),       COL_QTY  + 12, rowY, { size: 8.5, align: 'right', color: GRAY_DK });
    txt(fmtMoney(item.unitPrice),    COL_PU   + 20, rowY, { size: 8.5, align: 'right', color: GRAY_DK });
    txt(vatPct,                      COL_TVA  + 16, rowY, { size: 8.5, align: 'right', color: GRAY_DK });
    txt(fmtMoney(lineHt),            COL_HT   + 20, rowY, { size: 8.5, align: 'right', color: GRAY_DK });
    txt(fmtMoney(lineTtc),           COL_TTC,       rowY, { size: 8.5, bold: true, align: 'right', color: BLACK });

    y += rowH;
    hrule(y, MARGIN, PAGE_W - MARGIN, BORDER);
  }

  y += 8;

  // ──────────────────────────────────────────────────────────────────────────
  // 8. TVA DETAILS (bottom-left) + RÉCAPITULATIF (bottom-right)
  // ──────────────────────────────────────────────────────────────────────────
  const isAutoLiq = data.vatRate === 0 && data.vatValidated;
  const priceAfterDiscount = round2(data.subtotal - data.discount);

  y = ensureSpace(55, y);

  // ── TVA block (left) ────────────────────────────────────────────────────
  const TVA_X     = MARGIN;
  const TVA_W     = 80;
  const RECAP_X   = MARGIN + 86;
  const RECAP_W   = CONTENT_W - 86;

  txt('Détails TVA', TVA_X, y, { size: 8.5, bold: true, color: BLACK });
  y += 5;

  // TVA mini-table header
  txt('Taux',        TVA_X,      y, { size: 7.5, bold: true, color: GRAY_MED });
  txt('Montant TVA', TVA_X + 20, y, { size: 7.5, bold: true, color: GRAY_MED });
  txt('Base HT',     TVA_X + 52, y, { size: 7.5, bold: true, color: GRAY_MED });
  hrule(y + 1.5, TVA_X, TVA_X + TVA_W, BORDER);
  y += 6;

  const baseHt    = round2(data.subtotal - data.discount);
  const montantTva = isAutoLiq ? 0 : data.vat;

  txt(isAutoLiq ? '0 % (autoliquidée)' : `${Math.round(data.vatRate * 100)} %`, TVA_X, y, { size: 8, color: GRAY_DK });
  txt(fmtMoney(montantTva), TVA_X + 20, y, { size: 8, color: GRAY_DK });
  txt(fmtMoney(baseHt),    TVA_X + 52, y, { size: 8, color: GRAY_DK });

  // ── Récapitulatif (right) ───────────────────────────────────────────────
  const recapRows: [string, string, boolean][] = [];

  recapRows.push(['Total HT avant remise', fmtMoney(data.subtotal), false]);
  if (data.discount > 0) {
    const pct = data.subtotal > 0 ? Math.round((data.discount / data.subtotal) * 100) : 0;
    recapRows.push([`Remise (${pct} %)`, `- ${fmtMoney(data.discount)}`, false]);
    recapRows.push(['Total HT après remise', fmtMoney(priceAfterDiscount), true]);
  }
  if (data.deliveryCost > 0) {
    recapRows.push(['Frais de livraison', fmtMoney(data.deliveryCost), false]);
  }
  recapRows.push([isAutoLiq ? 'Total TVA (autoliquidée)' : 'Total TVA', fmtMoney(isAutoLiq ? 0 : data.vat), false]);

  // Recap starting y (aligned with TVA block)
  const recapStartY = y - 11;
  let ry = recapStartY;

  txt('Récapitulatif', RECAP_X, ry, { size: 8.5, bold: true, color: BLACK });
  ry += 6;

  for (const [label, value, bold] of recapRows) {
    txt(label,  RECAP_X,           ry, { size: 8, color: GRAY_DK });
    txt(value,  PAGE_W - MARGIN,   ry, { size: 8, bold, color: bold ? BLACK : GRAY_DK, align: 'right' });
    ry += 5.5;
  }

  // TOTAL TTC box
  ry += 2;
  doc.setFillColor(...BLACK);
  doc.roundedRect(RECAP_X - 1, ry - 1, RECAP_W + 1, 12, 1.5, 1.5, 'F');
  txt('Total TTC',         RECAP_X + 2, ry + 7, { size: 8.5, bold: true, color: [255, 255, 255] });
  txt(fmtMoney(data.totalTtc), PAGE_W - MARGIN - 2, ry + 7, { size: 11, bold: true, color: [255, 255, 255], align: 'right' });
  ry += 16;

  y = Math.max(y + 8, ry);

  // Autoliquidation mention
  if (isAutoLiq) {
    y += 2;
    txt('TVA autoliquidée — Art. 283-1 du CGI. TVA non applicable.', MARGIN, y, { size: 7.5, color: [60, 100, 60] });
    y += 6;
  }

  y += 4;
  hrule(y);
  y += 8;

  // ──────────────────────────────────────────────────────────────────────────
  // 9. PAIEMENT BLOCK
  // ──────────────────────────────────────────────────────────────────────────
  y = ensureSpace(35, y);

  doc.setFillColor(245, 246, 248);
  doc.roundedRect(MARGIN, y - 2, CONTENT_W / 2 - 4, 28, 2, 2, 'F');

  txt('Paiement', MARGIN + 4, y + 5, { size: 8.5, bold: true, color: BLACK });

  const payRows: [string, string][] = [
    ['Établissement', 'QONTO'],
    ['IBAN',          'FR76 1695 8000 0181 4578 3043 121'],
    ['BIC',           'QNTOFRP1XXX'],
  ];
  let py = y + 11;
  for (const [label, value] of payRows) {
    txt(label, MARGIN + 4, py, { size: 7.5, bold: true, color: GRAY_MED });
    txt(value, MARGIN + 26, py, { size: 7.5, color: GRAY_DK });
    py += 5;
  }

  y += 30;

  // ──────────────────────────────────────────────────────────────────────────
  // 10. FOOTER
  // ──────────────────────────────────────────────────────────────────────────
  const footerY = PAGE_H - 16;
  doc.setFillColor(...BLACK);
  doc.rect(0, footerY - 2, PAGE_W, 0.5, 'F');

  txt(
    `${company.companyName} — ${company.companyAddress}, ${company.companyPostcode} ${company.companyCity}, ${company.companyCountry}`,
    PAGE_W / 2, footerY + 3, { size: 6.5, color: GRAY_LT, align: 'center' },
  );
  if (company.companySiret) {
    txt(
      `SIRET ${company.companySiret}  •  TVA ${company.companyVatNumber}  •  ${company.companyEmail}`,
      PAGE_W / 2, footerY + 7.5, { size: 6.5, color: GRAY_LT, align: 'center' },
    );
  }
  txt(
    'Paiement à réception de la facture. Tout retard de paiement entraîne des pénalités légales (art. L441-10 du Code de commerce).',
    PAGE_W / 2, footerY + 12, { size: 6, color: GRAY_LT, align: 'center' },
  );

  const buf = Buffer.from(doc.output('arraybuffer'));
  return buf.toString('base64');
}
