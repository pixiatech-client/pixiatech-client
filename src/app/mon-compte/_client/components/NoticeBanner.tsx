'use client';

import { motion } from 'framer-motion';

export type NoticeKind = 'siret' | 'email';

interface NoticeBannerProps {
  kind: NoticeKind;
  title: string;
  subtitle: string;
  ctaLabel: string;
  onCta: () => void;
  onDismiss?: () => void;
}

export function NoticeBanner({ kind, title, subtitle, ctaLabel, onCta, onDismiss }: NoticeBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 flex flex-col gap-4 rounded-2xl border bg-white p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-center gap-4">
        <div
          className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${
            kind === 'siret'
              ? 'bg-[#0A0D0E] text-white'
              : 'bg-emerald-100 text-emerald-700'
          }`}
        >
          {kind === 'siret' ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6" />
              <path d="M9 15h.01" />
              <path d="M12 15h.01" />
              <path d="M15 15h.01" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
          )}
        </div>
        <div>
          <p className="text-sm font-bold text-neutral-900">{title}</p>
          <p className="text-sm text-neutral-500">{subtitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onCta}
          className="rounded-xl bg-[#0A0D0E] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
        >
          {ctaLabel}
        </button>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-xl px-3 py-2.5 text-sm font-medium text-neutral-400 transition hover:text-neutral-700"
          >
            Plus tard
          </button>
        )}
      </div>
    </motion.div>
  );
}