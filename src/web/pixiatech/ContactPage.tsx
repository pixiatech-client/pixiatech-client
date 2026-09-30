'use client';

import { useEffect } from 'react';
import '../pixiatech.css';
import { PixiaHeader } from './PixiaHeader';
import { PixiaFooter } from './PixiaFooter';
import { ContactSections } from './sections/ContactSections';
import type { Language } from '../pixiatech-translations';
import { useI18n } from '@/lib/i18n';
import { useCms } from '@/lib/site-web/cms-context';

/**
 * Page Contact du site web.
 *
 * Elle est bâtie comme les autres pages du site : `PixiaHeader`, sections en
 * `theme-dark` / `theme-light` avec les tokens de web.css, puis `PixiaFooter` —
 * le même pied de page que l'accueil, les insights et les pages produit. Le
 * module contact d'origine (hero dégradé violet/rouge, cartes grises, footer
 * propriétaire) ne sert plus que de source de contenu côté admin.
 */
export function PixiaContactPage() {
  // Meme source de langue que le header (contexte i18n global, persiste) :
  // la page ne peut plus repartir sur FR au refresh ni diverger du header.
  const { locale } = useI18n();
  const lang: Language = locale === 'en' ? 'EN' : 'FR';
  const { setCurrentPageId } = useCms();

  // Sans cela la page courante restait celle du site precedant, et les styles
  // CMS de sa section `header` etaient reappliques sur cette page.
  useEffect(() => {
    setCurrentPageId('contact');
  }, [setCurrentPageId]);

  return (
    <div className="xer-site" style={{ background: 'var(--black, #080808)' }}>
      <PixiaHeader />
      <main>
        <ContactSections lang={lang} />
      </main>
      <PixiaFooter lang={lang} />
    </div>
  );
}
