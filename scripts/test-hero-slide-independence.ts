/**
 * Test de NON-REGRESSION — textes independants par slide du Hero.
 *
 * Objet : verrouiller le comportement du patch « data-slide-field » SANS
 * navigateur, en executant les VRAIES fonctions de lecture/ecriture CMS
 * (`getCmsText`, `setCmsFieldTranslation`) sur les VRAIES donnees Hero.
 *
 * Il reproduit EXACTEMENT les expressions de `HeroSection.tsx` :
 *   1. l'ancienne lecture « globale » (avant patch) ;
 *   2. la nouvelle lecture « slide -> global -> defaut » (apres patch).
 *
 * Scenarios couverts (spec utilisateur) :
 *   1. Les 3 slides affichent le contenu actuel avant toute personnalisation.
 *   2. Modifier le titre du slide 2 ne change ni slide 1 ni slide 3.
 *   3. Idem pour les sous-titres.
 *   4. Persistance : la section survit a un aller-retour JSON (ce que fait l'API).
 *   5. FR et EN sont lus independamment.
 *   6. Repli global quand aucune valeur specifique n'existe.
 *   7. Les styles `_elements` ne sont jamais touches par une edition de texte.
 * (Le scenario 8 — modes public/edition — est couvert par le test navigateur.)
 *
 * Lecture seule : aucune ecriture disque, aucune requete reseau.
 */
import { readFileSync } from 'node:fs';
import { getCmsText, setCmsFieldTranslation } from '@/lib/site-web/cms-i18n';

let assertions = 0;
let failures = 0;

function check(label: string, ok: boolean, detail?: string): void {
  assertions += 1;
  if (ok) return;
  failures += 1;
  console.error(`  ECHEC  ${label}${detail ? ` -> ${detail}` : ''}`);
}
function section(title: string): void {
  console.log(`\n--- ${title}`);
}

// ---------------------------------------------------------------------------
// Donnees reelles
// ---------------------------------------------------------------------------
const raw = JSON.parse(
  readFileSync(new URL('../data/pixel-tech-web-pages.json', import.meta.url), 'utf8')
);
const heroOriginal: Record<string, unknown> = raw.pages.home.sections.hero;
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));

// ---------------------------------------------------------------------------
// Reproduction EXACTE de la logique de HeroSection.tsx
// ---------------------------------------------------------------------------
type Lang = 'fr' | 'en';

/** Cle stable par slide, derivee de l'`imageKey` (jamais de l'index). */
const slideFieldKey = (imageKey: string, field: string): string =>
  `slider${imageKey.replace(/^slideImage/u, '')}.${field}`;

const slides = ['slideImage1', 'slideImage2', 'slideImage3'];

/** Nouvelle lecture (patch) : slide -> global -> defaut. */
function tSlideAware(hero: Record<string, unknown>, imageKey: string, lang: Lang) {
  const slideValue = (field: string): string => getCmsText(hero, slideFieldKey(imageKey, field), lang);
  const slideOrGlobal = (field: string, global: string): string => slideValue(field) || global;
  return {
    eyebrow: slideOrGlobal('badge', getCmsText(hero, 'badge', lang, 'PIXIATECH / VISUAL TECHNOLOGY')),
    h1Line1: slideOrGlobal(
      'title',
      getCmsText(hero, 'title', lang, lang === 'fr' ? "L'INGÉNIERIE" : 'ENGINEERED')
    ),
    h1Line2: slideOrGlobal(
      'tagline',
      getCmsText(hero, 'tagline', lang, lang === 'fr' ? 'DU VISIBLE.' : 'TO BE SEEN.')
    ),
    sub:
      getCmsText(hero, slideFieldKey(imageKey, 'description'), lang) ||
      getCmsText(hero, slideFieldKey(imageKey, 'subtitle'), lang) ||
      getCmsText(hero, 'description', lang) ||
      getCmsText(
        hero,
        'subtitle',
        lang,
        lang === 'fr'
          ? "Systèmes d'affichage LED professionnels conçus pour l'architecture, l'entreprise et des expériences visuelles inoubliables."
          : 'Professional LED display systems engineered for architecture, business and unforgettable visual experiences.'
      ),
    cta1:
      getCmsText(hero, slideFieldKey(imageKey, 'primaryCta'), lang) ||
      getCmsText(
        hero,
        'primaryCta',
        lang,
        getCmsText(hero, 'ctaText', lang, lang === 'fr' ? 'Explorer les solutions →' : 'Explore Solutions →')
      ),
    cta2:
      getCmsText(hero, slideFieldKey(imageKey, 'secondaryCta'), lang) ||
      getCmsText(hero, 'secondaryCta', lang, lang === 'fr' ? 'Démarrer un projet →' : 'Start a Project →'),
  };
}

/** Ancienne lecture « globale » (etat AVANT patch) — reference. */
function tGlobalOnly(hero: Record<string, unknown>, lang: Lang) {
  return {
    eyebrow: getCmsText(hero, 'badge', lang, 'PIXIATECH / VISUAL TECHNOLOGY'),
    h1Line1: getCmsText(hero, 'title', lang, lang === 'fr' ? "L'INGÉNIERIE" : 'ENGINEERED'),
    h1Line2: getCmsText(hero, 'tagline', lang, lang === 'fr' ? 'DU VISIBLE.' : 'TO BE SEEN.'),
    sub:
      getCmsText(hero, 'description', lang) ||
      getCmsText(
        hero,
        'subtitle',
        lang,
        lang === 'fr'
          ? "Systèmes d'affichage LED professionnels conçus pour l'architecture, l'entreprise et des expériences visuelles inoubliables."
          : 'Professional LED display systems engineered for architecture, business and unforgettable visual experiences.'
      ),
    cta1: getCmsText(
      hero,
      'primaryCta',
      lang,
      getCmsText(hero, 'ctaText', lang, lang === 'fr' ? 'Explorer les solutions →' : 'Explore Solutions →')
    ),
    cta2: getCmsText(hero, 'secondaryCta', lang, lang === 'fr' ? 'Démarrer un projet →' : 'Start a Project →'),
  };
}

const IMAGE_KEYS = ['slideImage1', 'slideImage2', 'slideImage3'];

// ---------------------------------------------------------------------------
// Scenario 1 — avant personnalisation : identique a l'ancien comportement.
// ---------------------------------------------------------------------------
section('1. Trois slides = contenu actuel avant personnalisation (fr + en)');
for (const lang of ['fr', 'en'] as const) {
  const base = tGlobalOnly(heroOriginal, lang);
  for (const key of IMAGE_KEYS) {
    const got = tSlideAware(heroOriginal, key, lang);
    const same =
      got.eyebrow === base.eyebrow &&
      got.h1Line1 === base.h1Line1 &&
      got.h1Line2 === base.h1Line2 &&
      got.sub === base.sub &&
      got.cta1 === base.cta1 &&
      got.cta2 === base.cta2;
    check(`[${lang}] ${key} : lecture patch == ancienne lecture`, same, JSON.stringify({ got, base }));
  }
  console.log(`  ${lang}: titre="${base.h1Line1}" / tagline="${base.h1Line2}"`);
}

// ---------------------------------------------------------------------------
// Scenario 6 — repli global quand aucune cle de slide n'existe.
// ---------------------------------------------------------------------------
section('6. Repli global sans valeur specifique de slide');
check(
  'slide2.title (fr) sans cle -> titre global',
  tSlideAware(heroOriginal, 'slideImage2', 'fr').h1Line1 === tGlobalOnly(heroOriginal, 'fr').h1Line1
);

// ---------------------------------------------------------------------------
// Scenarios 2, 3, 5, 7 — personnalisation du slide 2.
// ---------------------------------------------------------------------------
section('2/3/5/7. Edition du slide 2 (titre + sous-titre, fr + en)');

// Simule deux ecritures : FR puis EN sur le slide 2 uniquement.
let hero = clone(heroOriginal);
hero = setCmsFieldTranslation(hero, 'slider2.title', 'fr', 'TITRE SLIDE 2 FR', { isManual: true, forceOverwrite: true });
hero = setCmsFieldTranslation(hero, 'slider2.title', 'en', 'SLIDE 2 TITLE EN', { isManual: true, forceOverwrite: true });
hero = setCmsFieldTranslation(hero, 'slider2.description', 'fr', 'SOUS-TITRE SLIDE 2 FR', { isManual: true, forceOverwrite: true });
hero = setCmsFieldTranslation(hero, 'slider2.description', 'en', 'SLIDE 2 SUBTITLE EN', { isManual: true, forceOverwrite: true });

const fr = (k: string) => tSlideAware(hero, k, 'fr');
const en = (k: string) => tSlideAware(hero, k, 'en');
const baseFr = tGlobalOnly(heroOriginal, 'fr');
const baseEn = tGlobalOnly(heroOriginal, 'en');

check('slide2 titre FR personnalise', fr('slideImage2').h1Line1 === 'TITRE SLIDE 2 FR', fr('slideImage2').h1Line1);
check('slide2 titre EN personnalise', en('slideImage2').h1Line1 === 'SLIDE 2 TITLE EN', en('slideImage2').h1Line1);
check('slide2 sous-titre FR personnalise', fr('slideImage2').sub === 'SOUS-TITRE SLIDE 2 FR', fr('slideImage2').sub);
check('slide2 sous-titre EN personnalise', en('slideImage2').sub === 'SLIDE 2 SUBTITLE EN', en('slideImage2').sub);

// Independance : slide 1 et slide 3 gardent EXACTEMENT l'ancien contenu.
check('scenario 2 — slide1 titre inchange', fr('slideImage1').h1Line1 === baseFr.h1Line1 && en('slideImage1').h1Line1 === baseEn.h1Line1, `${fr('slideImage1').h1Line1} / ${en('slideImage1').h1Line1}`);
check('scenario 2 — slide3 titre inchange', fr('slideImage3').h1Line1 === baseFr.h1Line1 && en('slideImage3').h1Line1 === baseEn.h1Line1, `${fr('slideImage3').h1Line1} / ${en('slideImage3').h1Line1}`);
check('scenario 3 — slide1 sous-titre inchange', fr('slideImage1').sub === baseFr.sub && en('slideImage1').sub === baseEn.sub);
check('scenario 3 — slide3 sous-titre inchange', fr('slideImage3').sub === baseFr.sub && en('slideImage3').sub === baseEn.sub);

// Le champ global `title`/`description` ne bouge pas.
check('global `title` racine intact', hero.title === heroOriginal.title, String(hero.title));
check('global `description` racine intact', hero.description === heroOriginal.description);

// Les autres champs globaux du slide 2 (badge, CTA) restent sur le global.
check('scenario 6 — slide2 badge = global', fr('slideImage2').eyebrow === baseFr.eyebrow);
check('scenario 6 — slide2 cta2 = global', fr('slideImage2').cta2 === baseFr.cta2);

// ---------------------------------------------------------------------------
// Scenario 4 — persistance : aller-retour JSON (ce que fait PUT/GET l'API).
// ---------------------------------------------------------------------------
section('4. Persistance apres sauvegarde/rechargement (JSON round-trip)');
const reloaded: Record<string, unknown> = JSON.parse(JSON.stringify(hero));
check('titre slide2 FR conserve', tSlideAware(reloaded, 'slideImage2', 'fr').h1Line1 === 'TITRE SLIDE 2 FR');
check('titre slide2 EN conserve', tSlideAware(reloaded, 'slideImage2', 'en').h1Line1 === 'SLIDE 2 TITLE EN');
check('slide1 toujours sur le global apres reload', tSlideAware(reloaded, 'slideImage1', 'fr').h1Line1 === baseFr.h1Line1);
check('slide3 toujours sur le global apres reload', tSlideAware(reloaded, 'slideImage3', 'fr').h1Line1 === baseFr.h1Line1);

// ---------------------------------------------------------------------------
// Scenario 5 — independance FR/EN : ecrire FR n'ecrase pas EN et vice-versa.
// ---------------------------------------------------------------------------
section('5. FR et EN independants');
const frVal = (hero._i18n as any)['slider2.title'].fr.value;
const enVal = (hero._i18n as any)['slider2.title'].en.value;
check('valeur FR du slide2 intacte', frVal === 'TITRE SLIDE 2 FR', frVal);
check('valeur EN du slide2 intacte', enVal === 'SLIDE 2 TITLE EN', enVal);
check('traductions FR/EN distinctes', frVal !== enVal);

// ---------------------------------------------------------------------------
// Scenario 7 — les styles `_elements` restent communs et intacts.
// ---------------------------------------------------------------------------
section('7. Styles `_elements` intacts');
check('_elements identique avant/apres', JSON.stringify(hero._elements) === JSON.stringify(heroOriginal._elements));
check('style titre 58px conserve', (heroOriginal._elements as any).title.fontSize === '58px');
check('style tagline 68px conserve', (heroOriginal._elements as any).tagline.fontSize === '68px');

// ---------------------------------------------------------------------------
// Scenario 2bis — un bouton par slide (primaryCta) n'affecte pas les autres.
// ---------------------------------------------------------------------------
section('2bis. Bouton par slide independant');
let hero2 = setCmsFieldTranslation(clone(heroOriginal), 'slider3.primaryCta', 'fr', 'CTA SLIDE 3', { isManual: true, forceOverwrite: true });
check('slide3 CTA personnalise', tSlideAware(hero2, 'slideImage3', 'fr').cta1 === 'CTA SLIDE 3');
check('slide1 CTA = global', tSlideAware(hero2, 'slideImage1', 'fr').cta1 === baseFr.cta1);
check('slide2 CTA = global', tSlideAware(hero2, 'slideImage2', 'fr').cta1 === baseFr.cta1);

// ---------------------------------------------------------------------------
console.log(
  failures === 0
    ? `\n${assertions}/${assertions} assertions passees.\nIndependance des slides : OK.`
    : `\n${assertions - failures}/${assertions} assertions passees, ${failures} ECHEC(S).`
);
process.exit(failures === 0 ? 0 : 1);
