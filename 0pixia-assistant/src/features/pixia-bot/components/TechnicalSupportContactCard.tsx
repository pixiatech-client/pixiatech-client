import { Check, Copy, Headphones, Mail, MessageCircle, Phone, PhoneCall } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import type { Language } from '../../../core/types.ts';

interface TechnicalSupportContactCardProps {
  lang: Language;
  phone: string;
  email: string;
}

export function TechnicalSupportContactCard({
  lang,
  phone,
  email,
}: TechnicalSupportContactCardProps) {
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [activeChannel, setActiveChannel] = useState<'phone' | 'whatsapp' | 'email' | null>('phone');

  const normalizedTel = phone.replace(/[^\d+]/g, '');
  const whatsappDigits = normalizedTel.replace(/^\+/, '');
  const whatsappHref = `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(
    lang === 'fr'
      ? 'Bonjour l’équipe technique PIXIA, j’ai besoin d’aide pour finaliser mon estimation d’écran LED.'
      : 'Hello PIXIA technical support, I need help completing my LED display estimate.'
  )}`;

  const handleCopyPhone = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(phone);
      setCopiedPhone(true);
      window.setTimeout(() => setCopiedPhone(false), 2000);
    } catch {
      // Clipboard blocked in non-HTTPS contexts
    }
  };

  const handleCopyEmail = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(email);
      setCopiedEmail(true);
      window.setTimeout(() => setCopiedEmail(false), 2000);
    } catch {
      // Clipboard blocked
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl border border-[#EF4444]/40 bg-[#1B171D] p-3.5 space-y-3 shadow-[0_14px_32px_rgba(0,0,0,0.5),0_0_20px_rgba(239,68,68,0.14)]"
    >
      {/* Help Invitation Header */}
      <div className="flex items-start gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[#38BDF8]/40 bg-[#38BDF8]/15 text-[#38BDF8]">
          <Headphones className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <h4 className="text-xs font-semibold text-white">
            {lang === 'fr'
              ? 'Besoin d’aide avec le formulaire ?'
              : 'Need help completing the form?'}
          </h4>
          <p className="mt-0.5 text-[11px] leading-relaxed text-[#C4C4CC]">
            {lang === 'fr'
              ? 'Vous semblez rencontrer des difficultés. Contactez directement notre service technique :'
              : 'It looks like you’re having trouble. Contact our technical team directly:'}
          </p>
        </div>
      </div>

      {/* Animorio-style Expandable Support Channels */}
      <div className="space-y-1.5">
        {/* 1. Direct Phone (Call on mobile + Copy on desktop) */}
        <div
          onMouseEnter={() => setActiveChannel('phone')}
          className={`rounded-xl border transition-all duration-200 overflow-hidden ${
            activeChannel === 'phone'
              ? 'border-[#38BDF8]/55 bg-[#1B212A]'
              : 'border-white/10 bg-[#141418] hover:border-white/25'
          }`}
        >
          <div className="flex items-center justify-between gap-2 px-3 py-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#38BDF8]/15 text-[#38BDF8]">
                <Phone className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-[#9E9EA7]">
                  {lang === 'fr' ? 'Ligne directe technique' : 'Direct tech phone'}
                </p>
                <p className="text-xs font-mono font-semibold text-white tabular-nums truncate">
                  {phone}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <a
                href={`tel:${normalizedTel}`}
                className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[#141416] hover:bg-[#E4E4E7] transition-colors"
              >
                <PhoneCall className="h-3 w-3" />
                <span>{lang === 'fr' ? 'Appeler' : 'Call'}</span>
              </a>
              <button
                type="button"
                onClick={handleCopyPhone}
                title={lang === 'fr' ? 'Copier le numéro' : 'Copy number'}
                className="inline-flex items-center gap-1 rounded-lg border border-white/12 bg-white/6 px-2 py-1.5 text-[11px] font-medium text-[#E4E4E7] hover:bg-white/12 transition-colors cursor-pointer"
              >
                {copiedPhone ? (
                  <>
                    <Check className="h-3 w-3 text-[#34D399]" />
                    <span className="text-[#34D399]">{lang === 'fr' ? 'Copié' : 'Copied'}</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span>{lang === 'fr' ? 'Copier' : 'Copy'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* 2. WhatsApp Direct */}
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          onMouseEnter={() => setActiveChannel('whatsapp')}
          className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 transition-all duration-200 ${
            activeChannel === 'whatsapp'
              ? 'border-[#34D399]/60 bg-[#0F241B]'
              : 'border-white/10 bg-[#141418] hover:border-[#34D399]/40'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#25D366]/18 text-[#34D399]">
              <MessageCircle className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-[#9E9EA7]">WhatsApp Direct</p>
              <p className="text-xs font-medium text-white truncate">
                {lang === 'fr' ? 'Assistance instantanée WhatsApp' : 'Instant WhatsApp support'}
              </p>
            </div>
          </div>
          <span className="rounded-lg border border-[#34D399]/40 bg-[#34D399]/15 px-2.5 py-1 text-[11px] font-semibold text-[#6EE7B7] shrink-0">
            {lang === 'fr' ? 'Écrire →' : 'Chat →'}
          </span>
        </a>

        {/* 3. Professional Email */}
        <div
          onMouseEnter={() => setActiveChannel('email')}
          className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 transition-all duration-200 ${
            activeChannel === 'email'
              ? 'border-[#C084FC]/55 bg-[#1D1827]'
              : 'border-white/10 bg-[#141418] hover:border-white/25'
          }`}
        >
          <a href={`mailto:${email}`} className="flex items-center gap-2.5 min-w-0 flex-1">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#C084FC]/18 text-[#C084FC]">
              <Mail className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-[#9E9EA7]">
                {lang === 'fr' ? 'E-mail professionnel' : 'Business email'}
              </p>
              <p className="text-xs font-medium text-white truncate">{email}</p>
            </div>
          </a>
          <button
            type="button"
            onClick={handleCopyEmail}
            title={lang === 'fr' ? 'Copier l’e-mail' : 'Copy email'}
            className="inline-flex items-center gap-1 rounded-lg border border-white/12 bg-white/6 px-2 py-1 text-[10.5px] font-medium text-[#E4E4E7] hover:bg-white/12 transition-colors cursor-pointer shrink-0"
          >
            {copiedEmail ? (
              <Check className="h-3 w-3 text-[#34D399]" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
