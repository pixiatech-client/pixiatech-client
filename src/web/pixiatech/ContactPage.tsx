'use client';

import { useEffect } from 'react';
import '../pixiatech.css';
import { PixiaHeader } from './PixiaHeader';
import { PixiaFooter } from './PixiaFooter';
import { RevealRoot } from './RevealRoot';
import { ContactSections } from './sections/ContactSections';
import type { Language } from '../pixiatech-translations';
import { useI18n } from '@/lib/i18n';
import { useCms } from '@/lib/site-web/cms-context';
import type { PageContentConfig } from '@/lib/site-web/types';

/**
 * Page Contact du site web.
 *
 * Elle est bâtie comme les autres pages du site : `PixiaHeader`, sections en
 * `theme-dark` / `theme-light` avec les tokens de web.css, puis `PixiaFooter` —
 * le même pied de page que l'accueil, les insights et les pages produit.
 */
export function PixiaContactPage({ initialContent }: { initialContent?: PageContentConfig }) {
  const { locale } = useI18n();
  const lang: Language = locale === 'en' ? 'EN' : 'FR';
  const { setCurrentPageId } = useCms();

  useEffect(() => {
    setCurrentPageId('contact');
  }, [setCurrentPageId]);

  return (
    <RevealRoot className="xer-site" style={{ background: 'var(--black, #080808)' }}>
      <PixiaHeader />
      <main>
        <ContactSections lang={lang} initialContent={initialContent} />
      </main>
      <PixiaFooter lang={lang} />
    </RevealRoot>
  );
}
