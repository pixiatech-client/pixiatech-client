'use client';

import React from 'react';
import { createRoot } from 'react-dom/client';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';
import type { Product } from './types';
import { ProductDatasheetPdfDocument } from '@/web/components/pdf/ProductDatasheetPdfDocument';

/**
 * Attente du chargement complet des images dans un conteneur donné.
 */
async function waitForImagesToLoad(container: HTMLElement, timeoutMs = 4000): Promise<void> {
  const images = Array.from(container.querySelectorAll('img'));
  if (images.length === 0) return;

  const promises = images.map((img) => {
    if (img.complete && img.naturalHeight > 0) return Promise.resolve();
    return new Promise<void>((resolve) => {
      const timer = setTimeout(() => resolve(), timeoutMs);
      img.onload = () => {
        clearTimeout(timer);
        resolve();
      };
      img.onerror = () => {
        clearTimeout(timer);
        // En cas d'erreur de chargement d'image (ex: cross-origin bloqué),
        // on ne bloque pas la génération du PDF.
        resolve();
      };
    });
  });

  await Promise.race([
    Promise.all(promises),
    new Promise((resolve) => setTimeout(resolve, timeoutMs)),
  ]);
}

/**
 * Nettoie le nom de fichier pour le téléchargement.
 */
function sanitizeFileName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
    .replace(/[^a-zA-Z0-9_-]/g, '-') // Remplace les caractères spéciaux par des tirets
    .replace(/-+/g, '-') // Évite les tirets consécutifs
    .replace(/^-|-$/g, ''); // Trim les tirets aux extrémités
}

export interface PdfExportProgress {
  percent: number;
  step: string;
  page?: number;
  totalPages?: number;
  status: 'starting' | 'rendering' | 'compiling' | 'completed' | 'error';
}

export interface ExportProductPdfOptions {
  lang?: 'FR' | 'EN';
  companyName?: string;
  onProgress?: (progress: PdfExportProgress) => void;
}

/**
 * Génère et télécharge la fiche technique officielle du produit au format PDF A4 haute résolution.
 * 
 * 1. Monte le document off-screen avec la mise en page exacte du gabarit officiel.
 * 2. Capture chaque page séparément à échelle 2 (300 DPI) via html2canvas.
 * 3. Assemble le fichier PDF multi-pages avec jsPDF.
 * 4. Déclenche le téléchargement du fichier `Fiche-Technique-[NOM-PRODUIT].pdf`.
 */
export async function exportProductToPdf(
  product: Product,
  options: ExportProductPdfOptions = {}
): Promise<boolean> {
  const toastId = 'export-pdf-toast';
  const lang = options.lang || 'FR';
  const cleanName = sanitizeFileName(product.name || product.slug || 'Produit');
  const fileName = `Fiche-Technique-${cleanName}.pdf`;

  const report = (progress: PdfExportProgress) => {
    try {
      options.onProgress?.(progress);
      toast.loading(
        lang === 'FR'
          ? `Génération PDF (${progress.percent}%) · ${progress.step}`
          : `Generating PDF (${progress.percent}%) · ${progress.step}`,
        { id: toastId }
      );
    } catch {}
  };

  report({
    percent: 5,
    step: lang === 'FR' ? 'Initialisation du gabarit…' : 'Initializing template…',
    status: 'starting',
  });

  // Création du conteneur temporaire hors écran
  const container = document.createElement('div');
  container.id = 'pixiatech-pdf-render-container';
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '794px';
  container.style.zIndex = '-1000';
  container.style.opacity = '1';
  container.style.pointerEvents = 'none';
  document.body.appendChild(container);

  const root = createRoot(container);

  try {
    report({
      percent: 12,
      step: lang === 'FR' ? 'Rendu des composants…' : 'Rendering components…',
      status: 'starting',
    });

    // Rendu React du composant de datasheet
    await new Promise<void>((resolve) => {
      root.render(
        <ProductDatasheetPdfDocument
          product={product}
          lang={lang}
          companyName={options.companyName || 'PIXIATECH'}
        />
      );
      // Laisser React peindre le composant
      setTimeout(resolve, 350);
    });

    report({
      percent: 20,
      step: lang === 'FR' ? 'Chargement des visuels HD…' : 'Loading HD images…',
      status: 'starting',
    });

    // Attente des images
    await waitForImagesToLoad(container);
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Récupération des pages (.page-break-after)
    const pages = container.querySelectorAll<HTMLElement>('.page-break-after');
    if (pages.length === 0) {
      throw new Error('Aucune page de fiche technique générée.');
    }

    // Initialisation du document PDF en format A4 Portrait
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pdfWidth = pdf.internal.pageSize.getWidth(); // 210 mm
    const pdfHeight = pdf.internal.pageSize.getHeight(); // 297 mm
    const totalPages = pages.length;

    for (let i = 0; i < totalPages; i++) {
      const pageEl = pages[i];
      const pageNum = i + 1;
      const currentPercent = Math.round(25 + (i / totalPages) * 65);

      report({
        percent: currentPercent,
        step: lang === 'FR' ? `Rendu HD page ${pageNum}/${totalPages}…` : `Rendering HD page ${pageNum}/${totalPages}…`,
        page: pageNum,
        totalPages,
        status: 'rendering',
      });

      const canvas = await html2canvas(pageEl, {
        scale: 2, // 2x pour une netteté d'impression optimale (~300 DPI)
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 794,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.96);

      if (i > 0) {
        pdf.addPage('a4', 'portrait');
      }

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');

      const donePercent = Math.round(25 + ((i + 1) / totalPages) * 65);
      report({
        percent: donePercent,
        step: lang === 'FR' ? `Page ${pageNum}/${totalPages} capturée` : `Page ${pageNum}/${totalPages} captured`,
        page: pageNum,
        totalPages,
        status: 'rendering',
      });
    }

    report({
      percent: 95,
      step: lang === 'FR' ? 'Assemblage & compression PDF…' : 'Compiling & compressing PDF…',
      status: 'compiling',
    });

    // Petite pause pour peindre l'étape 95%
    await new Promise((resolve) => setTimeout(resolve, 150));

    // Téléchargement automatique
    pdf.save(fileName);

    report({
      percent: 100,
      step: lang === 'FR' ? 'Fiche complète ! Téléchargement…' : 'Complete! Downloading…',
      status: 'completed',
    });

    toast.success(
      lang === 'FR'
        ? `Fiche technique « ${product.name || cleanName} » téléchargée avec succès !`
        : `Datasheet "${product.name || cleanName}" successfully downloaded!`,
      { id: toastId, duration: 4000 }
    );

    return true;
  } catch (error) {
    report({
      percent: 0,
      step: (error as Error).message,
      status: 'error',
    });
    console.error('Erreur lors de l’export PDF de la fiche technique :', error);
    toast.error(
      lang === 'FR'
        ? `Erreur lors de la génération du PDF : ${(error as Error).message}`
        : `Failed to generate PDF: ${(error as Error).message}`,
      { id: toastId, duration: 5000 }
    );
    return false;
  } finally {
    // Nettoyage complet du conteneur DOM
    try {
      root.unmount();
    } catch {}
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  }
}
