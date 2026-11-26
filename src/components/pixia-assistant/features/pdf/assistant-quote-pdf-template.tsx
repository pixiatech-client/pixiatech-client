'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { QuotePDF } from '@/app/admin/quote-pdf';
import type {
  City,
  PdfSettings as AppPdfSettings,
  ProductSpec,
  QuoteRequest,
  Settings as AppSettings,
} from '@/lib/types';
import type { PdfSettings } from '../../core/types';

/**
 * Rend le modèle de devis officiel (le même composant que le parcours client
 * normal) dans un conteneur hors écran. Le portail vers `document.body` évite
 * que le CSS scope du bot ne modifie la police, les coins ou les couleurs du
 * document capturé par html2canvas.
 */
export function AssistantQuotePdfTemplate({
  quoteRequest,
  pdfSettings,
  selectedCity,
  specs,
  containerRef,
}: {
  quoteRequest: QuoteRequest | null;
  pdfSettings: PdfSettings;
  selectedCity: City | null;
  specs?: Record<string, ProductSpec[]>;
  containerRef: React.MutableRefObject<HTMLDivElement | null>;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted || !quoteRequest) return null;

  const appPdfSettings: AppPdfSettings = {
    companyName: pdfSettings.companyName,
    address: pdfSettings.companyAddress,
    email: pdfSettings.companyEmail,
    phone: pdfSettings.companyPhone,
    siret: pdfSettings.siret,
    logoUrl: pdfSettings.logoUrl,
    backgroundUrl: pdfSettings.backgroundUrl,
    quoteTitle: pdfSettings.quoteTitle,
    quoteNumberPrefix: pdfSettings.quoteNumberPrefix,
    termsAndConditions:
      pdfSettings.termsAndConditions ?? pdfSettings.footerFr,
    bgColor: pdfSettings.bgColor,
    themeId: pdfSettings.themeId,
  };

  return createPortal(
    <div
      ref={containerRef}
      id="pixia-assistant-pdf-container"
      style={{
        position: 'fixed',
        left: '-99999px',
        top: 0,
        width: '820px',
        pointerEvents: 'none',
        zIndex: -9999,
      }}
    >
      <QuotePDF
        id="pixia-assistant-pdf-view"
        request={quoteRequest}
        settings={appPdfSettings}
        selectedCity={selectedCity}
        globalSettings={{} as AppSettings}
        allProducts={[]}
        specs={specs}
      />
    </div>,
    document.body
  );
}
