'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { initTracker, trackEvent, trackPageView } from '@/lib/analytics/tracker';

/**
 * Monte le tracker analytics sur les pages publiques.
 * Ne collecte JAMAIS tant que le consentement analytics n'est pas donné
 * (géré dans tracker.ts). Aucun rendu, aucun impact sur la page.
 */
export function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    initTracker();
  }, []);

  useEffect(() => {
    trackPageView(pathname ?? '/', document.title);
  }, [pathname]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      try {
        const el = e.target instanceof Element ? e.target.closest('a') : null;
        if (!el || !(el instanceof HTMLAnchorElement)) return;
        const href = el.getAttribute('href') || '';
        const trimmed = href.trim();
        if (trimmed.startsWith('mailto:')) {
          trackEvent('email_click');
          return;
        }
        if (trimmed.startsWith('tel:')) {
          trackEvent('phone_click');
          return;
        }
        if (/wa\.me|whatsapp\.com|api\.whatsapp/i.test(trimmed)) {
          trackEvent('whatsapp_click');
          return;
        }
        if (el.hasAttribute('download') || /\.(pdf|zip|docx?|xlsx?|pptx?|mp4|webm|mov)(\?.*)?$/i.test(trimmed)) {
          trackEvent('download');
        }
      } catch {
        /* la collecte ne doit jamais interrompre la navigation */
      }
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  return null;
}