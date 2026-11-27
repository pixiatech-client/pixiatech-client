import { CheckCircle2, Download, Eye, RotateCcw, X } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { t } from '../../../core/i18n/translations.ts';
import type { Language } from '../../../core/types.ts';
import type { GeneratedQuotePdf } from '../../pdf/pdf-generator.ts';

interface SuccessPdfStepProps {
  lang: Language;
  quoteReference: string | null;
  pdf: GeneratedQuotePdf | null;
  pdfUrl: string | null;
  isGenerating: boolean;
  error: string | null;
  onRetry: () => void;
  onReset: () => void;
}

const CONFETTI_PIECES = Array.from({ length: 16 }, (_, idx) => ({
  id: idx,
  left: `${6 + ((idx * 6) % 88)}%`,
  delay: (idx % 5) * 0.08,
  color: idx % 3 === 0 ? '#38BDF8' : idx % 3 === 1 ? '#C084FC' : '#34D399',
}));

export function SuccessPdfStep({
  lang,
  quoteReference,
  pdf,
  pdfUrl,
  isGenerating,
  error,
  onRetry,
  onReset,
}: SuccessPdfStepProps) {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#202025] p-5 space-y-4">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 overflow-hidden" aria-hidden="true">
        {CONFETTI_PIECES.map((piece) => (
          <motion.span
            key={piece.id}
            initial={{ y: -12, opacity: 1, rotate: 0 }}
            animate={{ y: 92, opacity: 0, rotate: 160 }}
            transition={{ duration: 1.4, delay: piece.delay, ease: 'easeOut' }}
            style={{ left: piece.left, backgroundColor: piece.color }}
            className="absolute top-0 h-2 w-1.5 rounded-xs"
          />
        ))}
      </div>

      <div className="relative flex items-start gap-3">
        <CheckCircle2 className="h-6 w-6 text-[#34D399] shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-mono tabular-nums text-[#A1A1AA]">
            {quoteReference ?? 'PX-QUOTE'}
          </p>
          <h4 className="text-base font-semibold text-white">
            {lang === 'fr' ? 'Estimation & contrat enregistrés' : 'Estimate & contract confirmed'}
          </h4>
          <p className="mt-1 text-xs leading-relaxed text-[#D4D4D8]">
            {t(lang, 'bot.congratulations')}
          </p>
        </div>
      </div>

      {isGenerating && (
        <div className="rounded-xl border border-white/10 bg-[#141417] px-3.5 py-2.5 text-xs text-[#A1A1AA]">
          {lang === 'fr' ? 'Génération et archivage du PDF A4 en cours…' : 'Generating and archiving A4 PDF…'}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-[#FB7185]/30 bg-[#FB7185]/10 px-3.5 py-2.5 flex items-center justify-between gap-3">
          <span className="text-xs text-[#FB7185]">{error}</span>
          <button
            type="button"
            onClick={onRetry}
            className="text-xs font-semibold text-[#FB7185] underline cursor-pointer shrink-0"
          >
            {t(lang, 'ui.retry')}
          </button>
        </div>
      )}

      <div className="flex flex-col gap-2 pt-1">
        {pdf && (
          <>
            <a
              href={pdf.blobUrl}
              download={pdf.filename}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#141416] hover:bg-[#E4E4E7] transition-colors whitespace-nowrap min-h-[44px]"
            >
              <Download className="h-4 w-4" />
              {t(lang, 'ui.downloadPdf')}
            </a>
            <button
              type="button"
              onClick={() => setShowPreview(true)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/10 transition-colors cursor-pointer whitespace-nowrap min-h-[44px]"
            >
              <Eye className="h-4 w-4" />
              {t(lang, 'ui.previewPdf')}
            </button>
          </>
        )}

        <button
          type="button"
          onClick={onReset}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-[#A1A1AA] hover:text-white transition-colors cursor-pointer whitespace-nowrap min-h-[44px]"
        >
          <RotateCcw className="h-4 w-4" />
          {t(lang, 'ui.newQuote')}
        </button>
      </div>

      {pdfUrl && (
        <p className="text-[11px] font-mono text-[#71717A] truncate">
          {lang === 'fr' ? 'Archive serveur :' : 'Server archive:'} {pdfUrl}
        </p>
      )}

      {showPreview && pdf && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs"
          onClick={() => setShowPreview(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-4xl h-[85vh] flex flex-col rounded-2xl border border-white/15 bg-[#17171A] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <span className="text-sm font-semibold text-white font-mono">{pdf.filename}</span>
              <div className="flex items-center gap-2">
                <a
                  href={pdf.blobUrl}
                  download={pdf.filename}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-xs font-semibold text-[#141416] hover:bg-[#E4E4E7]"
                >
                  <Download className="h-3.5 w-3.5" />
                  {t(lang, 'ui.downloadPdf')}
                </a>
                <button
                  type="button"
                  onClick={() => setShowPreview(false)}
                  className="rounded-lg p-1.5 text-[#A1A1AA] hover:bg-white/10 hover:text-white cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <iframe
              src={pdf.blobUrl}
              title={pdf.filename}
              className="flex-1 w-full bg-[#121215]"
            />
          </div>
        </div>
      )}
    </div>
  );
}
