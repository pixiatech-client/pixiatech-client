'use client';

import { useState } from 'react';
import '../pixiatech.css';
import { PixiaHeader } from './PixiaHeader';
import { PixiaFooter } from './PixiaFooter';
import { ContactSections } from './sections/ContactSections';
import type { Language } from '../pixiatech-translations';

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
  const [lang, setLang] = useState<Language>('FR');
  const toggleLang = () => setLang((l) => (l === 'FR' ? 'EN' : 'FR'));

  return (
    <div className="xer-site" style={{ background: 'var(--black, #080808)' }}>
      <PixiaHeader lang={lang} onToggleLang={toggleLang} />
      <main>
        <ContactSections lang={lang} />
      </main>
      <PixiaFooter lang={lang} />
    </div>
  );
}
