'use client';

import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export interface GeneratedQuotePdf {
  filename: string;
  base64: string;
  blobUrl: string;
}

export function buildQuotePdfFilename(company: string, reference: string): string {
  const cleanCompany = company.trim().replace(/[^a-zA-Z0-9À-ÿ_-]+/g, '_').replace(/^_+|_+$/g, '');
  return `Pixiatech_Estimation_${cleanCompany || reference}.pdf`;
}

/**
 * Capture le modèle de devis officiel (QuotePDF) rendu par
 * `AssistantQuotePdfTemplate` exactement comme le parcours client normal
 * (`SignatureFlow` / `SuccessView`) : html2canvas sur chaque `.page-break-after`,
 * puis assemblage des pages dans un jsPDF A4 portrait.
 *
 * Le document rendu est la seule source du PDF : aucun texte, montant ou style
 * n'est redessiné ici, ce qui garantit l'identité avec le devis de l'application.
 */
export async function renderQuotePdfFromTemplate(
  container: HTMLElement,
  filename: string
): Promise<GeneratedQuotePdf> {
  // Laisse le temps au navigateur de terminer le rendu du modèle hors écran.
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const pages = Array.from(
    container.querySelectorAll<HTMLElement>('.page-break-after')
  );
  if (pages.length === 0) {
    throw new Error('Modèle de devis officiel introuvable dans le document.');
  }

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pdfWidth = pdf.internal.pageSize.getWidth();

  for (let i = 0; i < pages.length; i += 1) {
    const canvas = await html2canvas(pages[i], {
      scale: 2,
      useCORS: true,
      logging: false,
      allowTaint: true,
      backgroundColor: '#ffffff',
    });
    const imgData = canvas.toDataURL('image/jpeg', 1.0);
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    if (i > 0) pdf.addPage();
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
  }

  const dataUri = pdf.output('datauristring');
  const base64 = dataUri.split(',')[1] ?? '';
  const blobUrl = URL.createObjectURL(pdf.output('blob'));
  return { filename, base64, blobUrl };
}
