'use client';

import { useState, useMemo } from 'react';
import { Copy, Check, Code, Download } from 'lucide-react';
import { buildSecureEmailHtml } from '@/lib/email-templates';
import type { MessageStyle } from './types';

interface EmailHtmlPreviewProps {
  code: string;
  companyName: string;
  companySlogan: string;
  documentLabel: string;
  messageStyle: MessageStyle;
  validityMinutes: number;
  theme?: string;
}

export function EmailHtmlPreview({
  code, companyName, companySlogan, documentLabel, messageStyle, validityMinutes, theme,
}: EmailHtmlPreviewProps) {
  const [copied, setCopied] = useState(false);
  const [showRaw, setShowRaw] = useState(true);

  const generatedHtml = useMemo(() => {
    if (code.length !== 6) return '';
    return buildSecureEmailHtml({
      code,
      companyName: companyName || 'PIXIATECH',
      companySlogan: companySlogan || 'TECHNOLOGY PRO',
      documentLabel: documentLabel || 'estimation du projet',
      validityMinutes,
      messageStyle,
      theme,
      lang: 'fr',
    });
  }, [code, companyName, companySlogan, documentLabel, messageStyle, validityMinutes, theme]);

  const handleCopy = async () => {
    if (!generatedHtml) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(generatedHtml);
      } else {
        const ta = document.createElement('textarea');
        ta.value = generatedHtml;
        ta.style.position = 'fixed';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {}
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-indigo-500 font-mono text-xs font-semibold uppercase tracking-wider">
          <Code className="w-4 h-4" />
          <span>Gabarit HTML E-mail Safe</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400 font-mono">
            {generatedHtml.length.toLocaleString()} chars
          </span>
          <button
            type="button"
            onClick={handleCopy}
            disabled={code.length !== 6}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              copied
                ? 'bg-emerald-500 text-white shadow-md'
                : 'bg-slate-900 text-white hover:bg-slate-800 shadow-md'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {copied ? (
              <><Check className="w-3.5 h-3.5" /> Copié !</>
            ) : (
              <><Copy className="w-3.5 h-3.5" /> Copier le code HTML</>
            )}
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-[28px] overflow-hidden shadow-sm">
        {code.length !== 6 ? (
          <div className="flex items-center justify-center py-16 text-slate-400 text-sm font-mono">
            Entrez un code à 6 chiffres pour générer le HTML
          </div>
        ) : (
          <div className="relative">
            <div className="bg-slate-900 px-5 py-3 flex items-center justify-between border-b border-slate-700">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                HTML généré — prêt pour envoi SMTP
              </span>
              <span className="text-[9px] text-slate-500 font-mono">
                {generatedHtml.length.toLocaleString()} caractères
              </span>
            </div>
            <textarea
              readOnly
              value={generatedHtml}
              className="w-full h-[500px] font-mono text-[11px] leading-relaxed p-5 bg-slate-50 text-slate-800 border-0 resize-none focus:outline-none selection:bg-indigo-200"
              onClick={(e) => (e.target as HTMLTextAreaElement).select()}
            />
          </div>
        )}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-800 leading-relaxed">
        <strong className="font-black uppercase tracking-wide">💡 Intégration SMTP :</strong> Ce HTML est généré en temps réel avec les variables ci-contre.
        Copiez-le et injectez-le directement dans votre corps d&apos;email via Nodemailer, SendGrid, Mailgun, PHP mail(), ou tout autre serveur SMTP.
        Pour une intégration dynamique côté serveur, utilisez la fonction <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono text-amber-900">buildSecureEmailHtml()</code> depuis <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono text-amber-900">@/lib/email-templates</code>.
      </div>
    </div>
  );
}
