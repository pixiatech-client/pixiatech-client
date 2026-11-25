'use client';

import { jsPDF } from 'jspdf';
import type { PriceSnapshot } from '@/lib/types';
import type {
  ClientFormState,
  ConfigState,
  Language,
  PdfSettings,
  Settings,
} from '../../core/types';

export interface GeneratedQuotePdf {
  filename: string;
  base64: string;
  blobUrl: string;
}

export function buildQuotePdfFilename(company: string, reference: string): string {
  const cleanCompany = company.trim().replace(/[^a-zA-Z0-9À-ÿ_-]+/g, '_').replace(/^_+|_+$/g, '');
  return `Pixiatech_Estimation_${cleanCompany || reference}.pdf`;
}

export function generateQuotePdfDocument(params: {
  lang: Language;
  reference: string;
  createdAt: string;
  configState: ConfigState;
  form: ClientFormState;
  includeDelivery: boolean;
  includeInstallation: boolean;
  priceSnapshot: PriceSnapshot;
  signatureDataUrl: string | null;
  pdfSettings: PdfSettings;
  settings: Settings;
}): GeneratedQuotePdf {
  const { lang, reference, configState, form, priceSnapshot, pdfSettings, settings } = params;
  const isFr = lang === 'fr';
  const areaSqm = Math.round((Number(configState.width) || 0) * (Number(configState.height) || 0) * 100) / 100;
  const totalAreaSqm = Math.round(areaSqm * Math.max(1, configState.quantity || 1) * 100) / 100;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const pageWidth = 210;
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  let y = 18;

  const priceLabel = settings.isPriceHidden
    ? (isFr ? 'Tarif confidentiel' : 'Confidential pricing')
    : `${priceSnapshot.total.toFixed(2)} EUR`;

  // Header band
  doc.setFillColor(20, 20, 19);
  doc.rect(0, 0, pageWidth, 34, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('Assistant Bot Pixia', margin, 15);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text(pdfSettings.companyName, margin, 22);
  doc.text(`${pdfSettings.companyAddress} · ${pdfSettings.companyEmail}`, margin, 27);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(isFr ? 'PROPOSITION D’ESTIMATION LED' : 'LED DISPLAY ESTIMATE PROPOSAL', pageWidth - margin, 15, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text(`${isFr ? 'Réf.' : 'Ref.'} ${reference}`, pageWidth - margin, 22, { align: 'right' });
  doc.text(new Date(params.createdAt).toLocaleDateString(isFr ? 'fr-FR' : 'en-US'), pageWidth - margin, 27, {
    align: 'right',
  });

  y = 46;
  doc.setTextColor(20, 20, 19);

  // Client & Project metadata two-column block
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(isFr ? 'INFORMATIONS CLIENT' : 'CLIENT DETAILS', margin, y);
  doc.text(isFr ? 'PARAMÈTRES DU PROJET' : 'PROJECT PARAMETERS', margin + contentWidth / 2 + 4, y);
  y += 5;
  doc.setDrawColor(220, 220, 215);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  const leftLines = [
    `${isFr ? 'Société' : 'Company'}: ${form.company}`,
    `${isFr ? 'Représentant' : 'Representative'}: ${form.representative}`,
    `Email: ${form.email}`,
    `${isFr ? 'Téléphone' : 'Phone'}: ${form.phone}`,
    `${isFr ? 'Adresse' : 'Address'}: ${form.address}`,
    `${isFr ? 'Ville livraison' : 'Delivery city'}: ${form.deliveryCity}${form.deliveryPostcode ? ` (${form.deliveryPostcode})` : ''}`,
  ];

  const envLabel =
    configState.environment === 'interieur'
      ? (isFr ? 'Intérieur' : 'Indoor')
      : configState.environment === 'semi-exterieur'
        ? (isFr ? 'Semi-extérieur' : 'Semi-outdoor')
        : (isFr ? 'Extérieur' : 'Outdoor');

  const rightLines = [
    `${isFr ? 'Type' : 'Type'}: ${configState.projectType === 'location' ? (isFr ? 'Location' : 'Rental') : (isFr ? 'Achat' : 'Purchase')}`,
    `${isFr ? 'Environnement' : 'Environment'}: ${envLabel}`,
    `${isFr ? 'Dimensions' : 'Dimensions'}: ${configState.width ?? '-'}m × ${configState.height ?? '-'}m (${areaSqm} m²)`,
    `${isFr ? 'Distance vue' : 'Viewing distance'}: ${configState.distance ?? '-'}`,
    `${isFr ? 'Pas de pixel' : 'Pixel pitch'}: P${configState.pixelPitch ?? '-'}`,
    ...(configState.projectType === 'location' && configState.rentalStartDate
      ? [
          `${isFr ? 'Période' : 'Rental period'}: ${configState.rentalStartDate} → ${configState.rentalEndDate} (${configState.rentalStartTime}–${configState.rentalEndTime})`,
          ...(configState.rentalComment ? [`${isFr ? 'Commentaire' : 'Comment'}: ${configState.rentalComment}`] : []),
        ]
      : []),
  ];

  const maxInfoRows = Math.max(leftLines.length, rightLines.length);
  for (let i = 0; i < maxInfoRows; i += 1) {
    if (leftLines[i]) doc.text(leftLines[i], margin, y, { maxWidth: contentWidth / 2 - 2 });
    if (rightLines[i]) doc.text(rightLines[i], margin + contentWidth / 2 + 4, y, { maxWidth: contentWidth / 2 - 4 });
    y += 5.5;
  }

  y += 6;

  // Itemized table
  doc.setFillColor(244, 243, 239);
  doc.rect(margin, y, contentWidth, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(isFr ? 'DÉSIGNATION' : 'DESCRIPTION', margin + 3, y + 5.5);
  doc.text(isFr ? 'QTÉ / SURFACE' : 'QTY / AREA', margin + 105, y + 5.5);
  doc.text(isFr ? 'ESTIMATION' : 'ESTIMATE', pageWidth - margin - 3, y + 5.5, { align: 'right' });
  y += 12;

  const rows: Array<[string, string, string]> = [
    [
      configState.selectedProduct?.name ?? (isFr ? 'Écran LED configuré' : 'Configured LED Screen'),
      `${configState.quantity} × ${areaSqm} m² (${totalAreaSqm} m²)`,
      priceLabel,
    ],
    [
      isFr ? 'Livraison sur site' : 'Site delivery',
      params.includeDelivery ? `${isFr ? 'Incluse' : 'Included'} (${form.deliveryCity})` : (isFr ? 'Non incluse' : 'Excluded'),
      params.includeDelivery ? priceLabel : '—',
    ],
    [
      isFr ? 'Installation technique' : 'Technical installation',
      params.includeInstallation ? (isFr ? 'Incluse' : 'Included') : (isFr ? 'Non incluse' : 'Excluded'),
      params.includeInstallation ? priceLabel : '—',
    ],
  ];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  for (const [desc, qty, amt] of rows) {
    doc.text(desc, margin + 3, y, { maxWidth: 96 });
    doc.text(qty, margin + 105, y, { maxWidth: 46 });
    doc.text(amt, pageWidth - margin - 3, y, { align: 'right' });
    y += 7;
    doc.setDrawColor(235, 234, 229);
    doc.line(margin, y - 2, pageWidth - margin, y - 2);
  }

  y += 6;
  doc.setFillColor(248, 248, 246);
  doc.rect(margin, y, contentWidth, 16, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text(isFr ? 'TOTAL ESTIMATIF' : 'ESTIMATED TOTAL', margin + 4, y + 7);
  doc.text(priceLabel, pageWidth - margin - 4, y + 7, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(95, 94, 91);
  doc.text(
    isFr
      ? `Régime fiscal configuré : ${priceSnapshot.tax.mode.toUpperCase()} (${priceSnapshot.tax.rate}%) · Statut : Validation ingénierie Pixiatech`
      : `Tax mode: ${priceSnapshot.tax.mode.toUpperCase()} (${priceSnapshot.tax.rate}%) · Status: Pending Pixiatech engineering review`,
    margin + 4,
    y + 13
  );

  y += 24;
  doc.setTextColor(20, 20, 19);

  // Signature block
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(isFr ? 'SIGNATURE ÉLECTRONIQUE DU CLIENT' : 'CLIENT ELECTRONIC SIGNATURE', margin, y);
  y += 4;
  doc.setDrawColor(210, 209, 203);
  doc.rect(margin, y, 80, 28);
  if (params.signatureDataUrl) {
    try {
      doc.addImage(params.signatureDataUrl, 'PNG', margin + 2, y + 2, 76, 24);
    } catch {
      // Fallback text if image fails
      doc.setFont('helvetica', 'italic');
      doc.text(isFr ? 'Signature enregistrée' : 'Signature recorded', margin + 4, y + 14);
    }
  }
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`${form.representative} — ${form.company}`, margin + 86, y + 8);
  doc.text(
    isFr ? 'Contrat approuvé électroniquement' : 'Contract approved electronically',
    margin + 86,
    y + 14
  );

  // Page 2: Contract Clauses
  doc.addPage();
  let y2 = 20;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(isFr ? 'CONDITIONS CONTRACTUELLES' : 'CONTRACTUAL TERMS', margin, y2);
  y2 += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const contractText = isFr
    ? settings.estimationFlow.contractTemplateFr
    : settings.estimationFlow.contractTemplateEn;
  const wrapped = doc.splitTextToSize(contractText, contentWidth);
  doc.text(wrapped, margin, y2);

  // Footer on both pages
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p += 1) {
    doc.setPage(p);
    doc.setFontSize(8);
    doc.setTextColor(115, 114, 110);
    const footerText = isFr ? pdfSettings.footerFr : pdfSettings.footerEn;
    doc.text(footerText, margin, 286, { maxWidth: contentWidth - 20 });
    doc.text(`${p} / ${totalPages}`, pageWidth - margin, 286, { align: 'right' });
  }

  const filename = buildQuotePdfFilename(form.company, reference);
  const dataUri = doc.output('datauristring');
  const base64 = dataUri.split(',')[1] ?? '';
  const blob = doc.output('blob');
  const blobUrl = URL.createObjectURL(blob);

  return { filename, base64, blobUrl };
}
