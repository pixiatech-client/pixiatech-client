'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n';
import { ShieldCheck, X } from 'lucide-react';

export function SecurityBanner({ customerId }: { customerId: string }) {
  const { t } = useI18n();
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      return window.localStorage.getItem(`pixiatech-security-dismissed-${customerId}`) === '1';
    } catch {
      return false;
    }
  });

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    try {
      window.localStorage.setItem(`pixiatech-security-dismissed-${customerId}`, '1');
    } catch {}
  };

  return (
    <div className="mb-6 flex w-full items-start gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-black">
        <ShieldCheck className="h-5 w-5 text-white" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-bold text-slate-900">{t('client.securityBanner.title')}</p>
        <p className="mt-0.5 text-[13px] leading-relaxed text-slate-500">{t('client.securityBanner.desc')}</p>
        <p className="mt-1 text-[12px] text-slate-400">{t('client.securityBanner.hint')}</p>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Link
            href="/mon-compte/parametres/mot-de-passe"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-black px-5 py-2.5 text-[13px] font-bold text-white transition-all hover:opacity-90"
          >
            <ShieldCheck className="h-4 w-4" />
            {t('client.securityBanner.cta')}
          </Link>
          <button
            onClick={handleDismiss}
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-3.5 w-3.5" />
            {t('client.securityBanner.dismiss')}
          </button>
        </div>
      </div>
    </div>
  );
}