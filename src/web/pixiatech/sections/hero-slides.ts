'use client';

import { getCmsText } from '@/lib/site-web/cms-i18n';

export interface HeroSlide {
  img: string;
  alt: string;
  imageKey: string;
}

/** Visuel de repli du Hero (asset réel de la page d'accueil PixiaTech actuelle). */
const FALLBACK_HERO_IMAGE =
  'https://firebasestorage.googleapis.com/v0/b/pixiatech-client.firebasestorage.app/o/site%2Fcms%2FInstallation_LED_immersive_dans_un_espace_commercial_haut_de_gamme_0mzdc.webp?alt=media';

/**
 * Référence d'image exploitable ? On rejette les valeurs vides et les chaînes
 * sentinelles (`undefined`, `null`, `#`) qui produiraient une diapositive
 * fantôme sans photo.
 */
export function isValidImageRef(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (trimmed === 'undefined' || trimmed === 'null' || trimmed === '#') return false;
  return true;
}

const SLIDE_ALTS: Record<'fr' | 'en', string[]> = {
  fr: [
    'Installation LED — hall architectural avec structure illuminée',
    'Installation LED — atrium avec écran LED immersif',
    'Installation LED — mur LED panoramique incurvé',
  ],
  en: [
    'LED installation — architectural lobby with illuminated structure',
    'LED installation — atrium with immersive LED display',
    'LED installation — curved panoramic LED wall',
  ],
};

/**
 * Construit la liste RÉELLE des diapositives du Hero à partir des données CMS.
 *
 * - Priorité au champ plat racine (HeroSlidersAdmin / API) puis au stockage
 *   `_i18n` (updateSectionField), et repli sur `primaryImage` / `heroImage`.
 * - Les diapositives sans référence d'image valide sont supprimées : plus de
 *   `01/02/03` fantômes.
 * - Liste vide → un unique visuel de repli (le Hero public garde son image,
 *   mais aucun indicateur de navigation inutile n'est affiché).
 */
export function computeValidHeroSlides(
  hero: Record<string, unknown> | undefined,
  lang: string
): HeroSlide[] {
  const h = hero || {};
  const flat = (key: string): string | undefined => {
    const v = h[key];
    return typeof v === 'string' && v.trim() ? v : undefined;
  };

  const candidates: { key: string; value: string | undefined }[] = [
    {
      key: 'slideImage1',
      value:
        flat('slideImage1') ||
        getCmsText(h, 'slideImage1', 'fr') ||
        flat('primaryImage') ||
        flat('heroImage'),
    },
    { key: 'slideImage2', value: flat('slideImage2') || getCmsText(h, 'slideImage2', 'fr') },
    { key: 'slideImage3', value: flat('slideImage3') || getCmsText(h, 'slideImage3', 'fr') },
  ];

  const alts = SLIDE_ALTS[String(lang).toLowerCase() === 'en' ? 'en' : 'fr'];
  const slides: HeroSlide[] = [];
  candidates.forEach((candidate, index) => {
    if (!isValidImageRef(candidate.value)) return;
    slides.push({
      img: candidate.value,
      alt: alts[index] || alts[0],
      imageKey: candidate.key,
    });
  });

  if (slides.length === 0) {
    slides.push({ img: FALLBACK_HERO_IMAGE, alt: alts[0], imageKey: 'slideImage1' });
  }
  return slides;
}
