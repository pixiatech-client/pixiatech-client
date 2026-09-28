'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'framer-motion';
import { trackFormSubmit } from '@/lib/analytics/tracker';
import { DEFAULT_PAGE_CONTENT } from '@/lib/site-web/defaultPageContent';
import type { ContactSubmissionPayload, PageContentConfig } from '@/lib/site-web/types';
import type { Language } from '../../pixiatech-translations';

/* Drapeau temporaire : masque l'etape "choisissez votre type de projet"
   (fieldset des categories) pour raccourcir la tablette. Passez a `true`
   pour la restaurer. */
const SHOW_PROJECT_TYPE_STEP = false;

/* ──────────────────────────────  Styles  ──────────────────────────────
   Repris de web.css / pixiatech.css : encre #080808, accent lime #C3F910, mono
   pour les surtitres, filets 1px, aucune couleur décorative.

   Les états :hover / :focus-visible / :active / :checked ne sont pas
   exprimables en inline style, ils vivent donc dans une feuille injectée — en
   `innerHTML` et non comme texte enfant, sinon le rendu serveur peut émettre un
   <style/> vide et l'hydratation échoue.

   Règles suivies : accent lime sur chaque survol, anneau de focus visible
   (jamais `outline: none` sans remplacement), cibles tactiles >= 44px,
   transitions 200-300ms, contrast >= 4.5:1 pour le texte des libellés, et
   uniquement des transitions de couleur / opacité / transform — aucun survol
   qui décale la mise en page.

   Les couleurs de texte / fond / filet ne sont pas écrites en dur : elles
   passent par les variables `--ct-*` que chaque section définit selon sa
   tonalité (voir TONE_DARK / TONE_LIGHT). Une seule feuille sert donc aux
   sections noires et à la section blanche.

   Le lime est en revanche écrit en hexadécimal littéral partout : `--accent`
   pouvait être redéfini à l'exécution par le CMS, ce qui rendait un chip
   sélectionné noir sur noir. Ici la couleur est non négociable. */
const CONTACT_CSS = `
.ct-input, .ct-area {
  width: 100%;
  background: var(--ct-surface);
  border: 1px solid var(--ct-line-strong);
  color: var(--ct-text);
  font-family: var(--font);
  font-size: 16px;
  line-height: 1.5;
  padding: 13px 15px;
  transition: border-color .2s ease, background .2s ease, box-shadow .2s ease;
}
.ct-input::placeholder, .ct-area::placeholder { color: var(--ct-placeholder); opacity: 1; }
.ct-input:hover, .ct-area:hover { border-color: var(--ct-line-hover); }
.ct-input:focus, .ct-area:focus {
  border-color: #C3F910;
  background: var(--ct-surface-focus);
  box-shadow: 0 0 0 3px rgba(195, 249, 16, .2);
}
.ct-input:focus-visible, .ct-area:focus-visible {
  outline: 2px solid #C3F910;
  outline-offset: 2px;
}
.ct-area { resize: vertical; min-height: 132px; }
.ct-label {
  display: block;
  font-family: var(--font);
  font-size: 10.5px;
  letter-spacing: .18em;
  text-transform: uppercase;
  font-weight: 700;
  color: var(--ct-muted);
  margin-bottom: 8px;
}
.ct-link {
  color: var(--ct-sub);
  border-bottom: 1px solid transparent;
  transition: color .2s ease, border-color .2s ease;
}
.ct-link:hover, .ct-link:active { color: #C3F910; border-bottom-color: #C3F910; }
.ct-link:focus-visible {
  outline: 2px solid #C3F910;
  outline-offset: 2px;
}

/* Lignes de coordonnées : le libellé passe au lime au survol de la ligne. */
.ct-row-label { transition: color .2s ease; }
.ct-row:hover .ct-row-label { color: #C3F910; }

/* Titre de carte en Satoshi, comme tous les titres du site. */
.ct-chip {
  font-family: var(--font);
  font-size: 14.5px;
  letter-spacing: -.01em;
  text-transform: none;
  font-weight: 700;
  color: var(--ct-text);
  background: transparent;
  border: 1px solid var(--ct-line-strong);
  padding: 13px 15px;
  min-height: 44px;
  cursor: pointer;
  text-align: left;
  line-height: 1.35;
  transition: color .2s ease, border-color .2s ease, background .2s ease,
    transform .12s ease;
}
.ct-chip:hover {
  border-color: #C3F910;
  background: rgba(195, 249, 16, .12);
  color: var(--ct-text);
}
/* Élément sélectionné ou activé : lime plein, texte quasi noir. */
.ct-chip[aria-pressed='true'],
.ct-chip:active {
  background: #C3F910;
  border-color: #C3F910;
  color: #0a0a0a;
}
.ct-chip[aria-pressed='true']:hover { background: #d4ff2e; }
.ct-chip:active { transform: scale(.985); }
.ct-chip:focus-visible {
  outline: 2px solid #C3F910;
  outline-offset: 2px;
}
.ct-chip-sub {
  display: block;
  font-family: var(--font);
  font-size: 9.5px;
  letter-spacing: .16em;
  text-transform: uppercase;
  opacity: .72;
  margin-top: 6px;
  font-weight: 600;
}

.ct-check {
  appearance: none;
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  flex: none;
  margin: 2px 0 0;
  border: 1px solid var(--ct-muted);
  background: transparent;
  display: inline-grid;
  place-content: center;
  cursor: pointer;
  transition: background .2s ease, border-color .2s ease;
}
.ct-check:hover, .ct-check:active { border-color: #C3F910; background: rgba(195, 249, 16, .22); }
.ct-check:checked { background: #C3F910; border-color: #C3F910; }
.ct-check:checked::after {
  content: '';
  width: 8px;
  height: 4px;
  border-left: 2px solid #0a0a0a;
  border-bottom: 2px solid #0a0a0a;
  transform: rotate(-45deg) translate(1px, -2px);
}
.ct-check:focus-visible {
  outline: 2px solid #C3F910;
  outline-offset: 2px;
}

/* Boutons : primaire plein lime, secondaire transparent qui vire au lime. */
.ct-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 48px;
  padding: 14px 26px;
  font-family: var(--font);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: .14em;
  text-transform: uppercase;
  border: 1px solid var(--ct-line-strong);
  background: transparent;
  color: var(--ct-text);
  cursor: pointer;
  text-decoration: none;
  transition: background .2s ease, color .2s ease, border-color .2s ease,
    box-shadow .2s ease, transform .12s ease;
}
.ct-btn:hover, .ct-btn:active {
  background: #C3F910;
  border-color: #C3F910;
  color: #0a0a0a;
  box-shadow: 0 0 0 3px rgba(195, 249, 16, .2);
}
.ct-btn:active { transform: scale(.985); }
.ct-btn:focus-visible {
  outline: 2px solid #C3F910;
  outline-offset: 3px;
}
.ct-btn:disabled {
  cursor: progress;
  opacity: .65;
  background: transparent;
  color: var(--ct-text);
  border-color: var(--ct-line-strong);
  box-shadow: none;
}
.ct-btn-solid {
  background: #C3F910;
  border-color: #C3F910;
  color: #0a0a0a;
}
.ct-btn-solid:hover {
  background: #d4ff2e;
  border-color: #d4ff2e;
  box-shadow: 0 0 0 4px rgba(195, 249, 16, .26);
}
.ct-btn-solid:disabled {
  background: rgba(195, 249, 16, .4);
  border-color: transparent;
  color: #0a0a0a;
  box-shadow: none;
}

/* FAQ : le "+" devient une pastille lime pleine au survol et à l'ouverture. */
.ct-faq-btn {
  width: 100%;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  background: none;
  border: 0;
  padding: 26px 0;
  text-align: left;
  cursor: pointer;
  color: var(--ct-text);
}
.ct-faq-q {
  font-size: clamp(17px, 1.6vw, 21px);
  font-weight: 700;
  letter-spacing: -.01em;
  line-height: 1.3;
  transition: color .2s ease;
}
.ct-faq-btn:hover .ct-faq-q { color: var(--ct-body); }
.ct-faq-plus {
  flex: none;
  display: inline-grid;
  place-content: center;
  width: 30px;
  height: 30px;
  font-size: 20px;
  line-height: 1;
  color: var(--ct-muted);
  background: transparent;
  border: 1px solid var(--ct-line);
  transition: background .2s ease, color .2s ease, border-color .2s ease,
    transform .3s ease;
}
.ct-faq-btn:hover .ct-faq-plus, .ct-faq-btn:active .ct-faq-plus {
  background: #C3F910;
  border-color: #C3F910;
  color: #0a0a0a;
}
.ct-faq-btn[aria-expanded='true'] .ct-faq-plus {
  background: #C3F910;
  border-color: #C3F910;
  color: #0a0a0a;
  transform: rotate(45deg);
}
.ct-faq-btn:focus-visible {
  outline: 2px solid #C3F910;
  outline-offset: 2px;
}

/* ── Fond mesh animé ────────────────────────────────────────────────────
   Un voile de quatre taches floutes derive lentement derriere la carte. La
   teinte vient de --mesh-1/2/3, que fixent les classes .ct-mesh-1 … .ct-mesh-6 :
   les six melanges sont des fenetres glissantes sur une meme rampe
   (lime → vert → sarcelle → cyan → bleu → violet), donc la 1re carte prend la
   1re teinte, la 2e la suivante, etc., sans jamais sortir du registre de la
   marque.

   L'animation porte sur transform et non sur background-position : le voile
   est donc rasterise une fois puis compose sur le GPU, au lieu d'etre
   re-floute a chaque image.

   L'opacite vient de --ct-mesh-op, que chaque tonalite regle (voir
   TONE_DARK / TONE_LIGHT) : lisible sans ecrire la valeur en dur, et le
   contraste du texte au-dessus reste celui de la section. */
@keyframes ct-mesh-drift {
  0%   { transform: translate3d(-5%, -4%, 0) scale(1.05); }
  50%  { transform: translate3d(6%, 5%, 0) scale(1.15); }
  100% { transform: translate3d(-3%, 6%, 0) scale(1.07); }
}
.ct-mesh {
  position: relative;
  isolation: isolate;
  overflow: hidden;
}
.ct-mesh::before {
  content: '';
  position: absolute;
  inset: -45%;
  z-index: -1;
  pointer-events: none;
  background-image:
    radial-gradient(38% 42% at 14% 20%, var(--mesh-1, #C3F910) 0px, transparent 100%),
    radial-gradient(40% 38% at 86% 14%, var(--mesh-2, #8FE83A) 0px, transparent 100%),
    radial-gradient(42% 44% at 80% 86%, var(--mesh-3, #4AE07A) 0px, transparent 100%),
    radial-gradient(36% 40% at 18% 84%, var(--mesh-2, #8FE83A) 0px, transparent 100%);
  filter: blur(38px);
  opacity: var(--ct-mesh-op, .2);
  animation: ct-mesh-drift 28s ease-in-out infinite alternate;
  /* Le decalage evite que toutes les cartes battent a la meme phase. */
  animation-delay: calc(var(--i, 0) * -4.6s);
  will-change: transform;
}
.ct-mesh-1 { --mesh-1: #C3F910; --mesh-2: #8FE83A; --mesh-3: #4AE07A; }
.ct-mesh-2 { --mesh-1: #8FE83A; --mesh-2: #4AE07A; --mesh-3: #22C9A8; }
.ct-mesh-3 { --mesh-1: #4AE07A; --mesh-2: #22C9A8; --mesh-3: #2BB6E0; }
.ct-mesh-4 { --mesh-1: #22C9A8; --mesh-2: #2BB6E0; --mesh-3: #4A8CE8; }
.ct-mesh-5 { --mesh-1: #2BB6E0; --mesh-2: #4A8CE8; --mesh-3: #7A70FF; }
.ct-mesh-6 { --mesh-1: #4A8CE8; --mesh-2: #7A70FF; --mesh-3: #A96BFF; }

/* Grande surface (hero, carte du formulaire) : l'opacite baisse sur son seul
   voile, sans toucher a --ct-mesh-op — sinon elle herriterait dans les cartes
   imbriquees (chips du formulaire) qui doivent garder leur tonalite. */
.ct-mesh.ct-mesh--faint::before { opacity: .07; }
/* Carte selectionnee : le lime plein est deja la couleur, le voile s'eteint. */
.ct-chip[aria-pressed='true'] { --ct-mesh-op: 0; }

/* ── Hero : zoom au scroll (faccon topology.vc) ─────────────────────────
   La section est epinglee (sticky) plein ecran ; contenu + voile mesh
   grandissent de 1 → 1.18 pendant que la section suivante, opaque et au-dessus
   (z-index inline), glisse par-dessus. Sur mobile on renonce a l'epingle : la
   section reprend le flux normal, avec juste le zoom leger a la sortie. */
.ct-zoom-pin { height: calc(100svh + 62vh); }
.ct-zoom-hero {
  position: sticky;
  top: 0;
  height: 100svh;
  overflow: hidden;
}
.ct-zoom-scale { position: relative; min-height: 100svh; }
.ct-zoom-bg {
  position: absolute;
  inset: -45%;
  z-index: 0;
  pointer-events: none;
  background-image:
    radial-gradient(38% 42% at 14% 20%, var(--mesh-1, #C3F910) 0px, transparent 100%),
    radial-gradient(40% 38% at 86% 14%, var(--mesh-2, #8FE83A) 0px, transparent 100%),
    radial-gradient(42% 44% at 80% 86%, var(--mesh-3, #4AE07A) 0px, transparent 100%),
    radial-gradient(36% 40% at 18% 84%, var(--mesh-2, #8FE83A) 0px, transparent 100%);
  filter: blur(55px);
  opacity: .14;
  animation: ct-mesh-drift 34s ease-in-out infinite alternate;
  will-change: transform;
}

/* ── Tablette « Our fastest-ever POS » (Shopify Editions Spring 2026) ───────
   Composition fidèle au référence : fond noir #080808, environnement studio
   sombre avec lumière diffuse haute et texture merch, grande tablette widescreen
   en aluminium anodisé avec chanfrein diamant CNC, caméra paysage, boutons
   physiques, reflets spéculaires et perspective 3D pilotée par la souris. */
.ct-retail-section {
  position: relative;
  background: var(--black, #080808);
  overflow: hidden;
  padding: clamp(80px, 10vh, 120px) 0 clamp(80px, 10vh, 130px);
}
.ct-retail-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  flex-wrap: wrap;
  gap: 24px 40px;
  margin-bottom: clamp(36px, 4.5vw, 64px);
  position: relative;
  z-index: 2;
}
.ct-retail-head-title {
  max-width: 680px;
}
.ct-retail-head-side {
  max-width: 480px;
}
.ct-stage {
  position: relative;
  perspective: 1600px;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 10px 0 30px;
}
.ct-device-glow {
  position: absolute;
  inset: -16%;
  z-index: -1;
  background:
    radial-gradient(56% 62% at 50% 38%, rgba(255, 255, 255, .08), transparent 66%),
    radial-gradient(44% 54% at 80% 84%, rgba(130, 142, 160, .06), transparent 72%);
  filter: blur(60px);
  pointer-events: none;
}
.ct-device-3d {
  position: relative;
  transform: rotateX(7.5deg);
  transform-style: preserve-3d;
  width: 100%;
  display: flex;
  justify-content: center;
}
.ct-device-frame {
  position: relative;
  width: min(100%, 1160px);
  margin-inline: auto;
  transform-style: preserve-3d;
}
.ct-device {
  position: relative;
  z-index: 2;
  width: 100%;
  padding: clamp(14px, 1.6vw, 22px);
  border-radius: clamp(30px, 3.4vw, 44px);
  background: linear-gradient(160deg, #3d3c42 0%, #29282e 30%, #1c1b20 70%, #141317 100%);
  border: 1px solid rgba(255, 255, 255, .22);
  box-shadow:
    /* Hairline métallique extérieur */
    0 0 0 1px rgba(255, 255, 255, .08),
    /* Épaisseur 3D métallique extrudée (chanfrein latéral) */
    0 1px 0 #3a393f,
    0 2px 0 #323136,
    0 3px 0 #2a292e,
    0 4px 0 #222126,
    0 5px 0 #1b1a1f,
    0 6px 0 #151418,
    0 7px 1px rgba(0, 0, 0, .55),
    /* Ombres flottantes d'ambiance studio */
    0 25px 50px -12px rgba(0, 0, 0, .88),
    0 70px 140px -30px rgba(0, 0, 0, .98),
    0 0 100px rgba(0, 0, 0, .75),
    /* Chanfrein diamant CNC et liseré supérieur */
    inset 0 1.5px 0.5px rgba(255, 255, 255, .45),
    inset 1px 0 0 rgba(255, 255, 255, .2),
    inset -1px 0 0 rgba(0, 0, 0, .6),
    inset 0 -1.5px 0.5px rgba(0, 0, 0, .85);
  transform-style: preserve-3d;
  will-change: transform;
}
.ct-device::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  background: linear-gradient(120deg, rgba(255, 255, 255, .14), transparent 22%, transparent 76%, rgba(255, 255, 255, .08));
}
.ct-device::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, .2), rgba(255, 255, 255, .04) 8%, transparent 24%),
    linear-gradient(0deg, rgba(0, 0, 0, .65), transparent 12%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, .12),
    inset 0 0 0 1px rgba(255, 255, 255, .04);
}

/* Caméra paysage & capteur au centre du bord supérieur */
.ct-dev-cam {
  position: absolute;
  top: clamp(6px, .8vw, 10px);
  left: 50%;
  transform: translateX(-50%);
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #2a3c50 0%, #0d1722 55%, #05080c 100%);
  box-shadow: inset 0 0 2px rgba(0, 0, 0, .9), 0 0 0 1px rgba(255, 255, 255, .15);
  z-index: 5;
  pointer-events: none;
}
.ct-dev-sensor {
  position: absolute;
  top: clamp(8px, .95vw, 12px);
  left: calc(50% + 14px);
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #0d1218;
  box-shadow: inset 0 0 1px rgba(0, 0, 0, .8), 0 0 0 1px rgba(255, 255, 255, .08);
  z-index: 5;
  pointer-events: none;
}

/* Boutons physiques tranches : volume à gauche, power en haut à droite */
.ct-dev-vol, .ct-dev-power {
  position: absolute;
  z-index: 1;
  pointer-events: none;
  background: linear-gradient(180deg, #717078, #3c3b41 55%, #232226);
  box-shadow:
    0 1px 2px rgba(0, 0, 0, .55),
    inset 0 1px 0 rgba(255, 255, 255, .25),
    inset 0 -1px 0 rgba(0, 0, 0, .45);
}
.ct-dev-vol {
  left: -6px;
  width: 6px;
  height: clamp(30px, 3.2vw, 42px);
  border-radius: 4px 0 0 4px;
}
.ct-dev-vol-1 { top: clamp(75px, 9vw, 130px); }
.ct-dev-vol-2 { top: calc(clamp(75px, 9vw, 130px) + clamp(38px, 4.2vw, 54px)); }
.ct-dev-power {
  right: clamp(48px, 6vw, 90px);
  top: -6px;
  width: clamp(40px, 4.5vw, 60px);
  height: 6px;
  border-radius: 4px 4px 0 0;
}

/* Écran tablette */
.ct-device-screen {
  position: relative;
  border-radius: clamp(22px, 2.6vw, 32px);
  overflow: hidden;
  background: linear-gradient(180deg, #0d0e13 0%, #0a0b10 100%);
  border: 1px solid rgba(255, 255, 255, .09);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, .04),
    inset 0 2px 28px rgba(0, 0, 0, .92),
    inset 0 0 120px rgba(0, 0, 0, .82);
  /* Subtle active-display ambient glow */
  isolation: isolate;
}
/* Glass sheen overlay */
.ct-device-screen::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 10;
  pointer-events: none;
  border-radius: inherit;
  background: linear-gradient(
    128deg,
    rgba(255,255,255,.055) 0%,
    transparent 28%,
    transparent 72%,
    rgba(255,255,255,.02) 100%
  );
}
/* Scrollable inner area so form is never clipped. La barre de scroll est
   masquee : le formulaire compacte rentre dans l'ecran ; s'il reste un
   trop-plein, la molette/le doigt scrollent sans barre visible. */
.ct-screen-scroll {
  max-height: clamp(560px, 72vh, 880px);
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.ct-screen-scroll::-webkit-scrollbar { display: none; }

/* OS status bar */
.ct-os-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 9px clamp(14px, 2vw, 26px) 8px;
  background: rgba(10, 11, 16, .9);
  border-bottom: 1px solid rgba(255, 255, 255, .06);
  font-family: var(--font);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: .12em;
  color: rgba(255, 255, 255, .55);
  user-select: none;
  position: relative;
  z-index: 3;
}
.ct-os-bar-left {
  display: flex;
  align-items: center;
  gap: 8px;
}
.ct-os-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #C3F910;
  box-shadow: 0 0 6px #C3F910;
  flex: none;
  animation: ct-dot-pulse 2.8s ease-in-out infinite;
}
@keyframes ct-dot-pulse {
  0%, 100% { opacity: 1; box-shadow: 0 0 6px #C3F910; }
  50% { opacity: .6; box-shadow: 0 0 10px #C3F910; }
}
.ct-os-bar-right {
  display: flex;
  align-items: center;
  gap: 14px;
}
.ct-os-signal {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 10px;
}
.ct-os-signal span {
  width: 3px;
  background: rgba(255,255,255,.5);
  border-radius: 1px;
  display: block;
}
.ct-os-signal span:nth-child(1) { height: 4px; }
.ct-os-signal span:nth-child(2) { height: 6px; }
.ct-os-signal span:nth-child(3) { height: 8px; }
.ct-os-signal span:nth-child(4) { height: 10px; }
.ct-os-battery {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 9px;
  color: rgba(255,255,255,.55);
}
.ct-os-battery-icon {
  width: 18px;
  height: 9px;
  border: 1.5px solid rgba(255,255,255,.4);
  border-radius: 2px;
  position: relative;
  display: flex;
  align-items: center;
  padding: 1px;
}
.ct-os-battery-icon::after {
  content: '';
  position: absolute;
  right: -5px;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 5px;
  background: rgba(255,255,255,.35);
  border-radius: 0 1px 1px 0;
}
.ct-os-battery-fill {
  height: 100%;
  width: 72%;
  background: #C3F910;
  border-radius: 1px;
}

/* App bar below OS bar */
.ct-tablet-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 11px clamp(14px, 2vw, 26px) 10px;
  border-bottom: 1px solid rgba(255, 255, 255, .06);
  background: rgba(13, 14, 20, .8);
  font-family: var(--font);
  font-size: 10.5px;
  letter-spacing: .14em;
  text-transform: uppercase;
  font-weight: 700;
  position: relative;
  z-index: 2;
}
.ct-tablet-bar-left {
  display: flex;
  align-items: center;
  gap: 10px;
  color: rgba(255, 255, 255, .72);
}
.ct-status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #C3F910;
  box-shadow: 0 0 8px #C3F910;
  flex: none;
}
.ct-tablet-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 10px;
  letter-spacing: .14em;
  color: #C3F910;
  background: rgba(195, 249, 16, .1);
  border: 1px solid rgba(195, 249, 16, .25);
  padding: 3px 9px;
}
.ct-device-screen .ct-form-shell {
  position: relative;
  z-index: 2;
  padding: clamp(14px, 1.6vw, 24px);
}
/* Formulaire compacte : doit tenir dans l'ecran de la tablette sans barre de
   defilement. Le textarea est ramene a une hauteur fixe coherente avec
   l'ecran (pas de barre verticale). */
.ct-device-screen .ct-area {
  min-height: 88px;
  resize: none;
}

/* Widescreen 2-colonnes pour la tablette */
.ct-form-cols {
  display: grid;
  grid-template-columns: 1fr;
  gap: 28px;
}
@media (min-width: 900px) {
  .ct-form-cols {
    grid-template-columns: 1.05fr 1fr;
    gap: clamp(28px, 3.2vw, 48px);
    align-items: start;
  }
}
.ct-reassurance-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 22px 0 24px;
  padding-top: 18px;
  border-top: 1px solid var(--ct-line-strong);
}
.ct-reassurance-item {
  display: flex;
  align-items: center;
  gap: 12px;
  font-family: var(--font);
  font-size: 12.5px;
  color: var(--ct-sub);
  letter-spacing: .02em;
}
.ct-reassurance-dash {
  width: 14px;
  height: 2px;
  background: #C3F910;
  flex: none;
}

/* Ombre de contact au sol */
.ct-floor-shadow {
  position: absolute;
  bottom: -40px;
  left: 4%;
  right: 4%;
  height: 60px;
  background: radial-gradient(ellipse at 50% 50%, rgba(0, 0, 0, .95) 0%, rgba(0, 0, 0, .5) 45%, transparent 75%);
  filter: blur(28px);
  pointer-events: none;
  z-index: -1;
}

/* Console coordonnées sous la tablette */
.ct-coords-console {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 16px;
  max-width: 1160px;
  margin: clamp(48px, 6vh, 80px) auto 0;
  position: relative;
  z-index: 2;
}
.ct-coord-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 18px 20px;
  background: rgba(255, 255, 255, .02);
  border: 1px solid var(--ct-line-strong);
  transition: border-color .2s ease, background .2s ease;
}
.ct-coord-card:hover {
  border-color: #3a3a3a;
  background: rgba(255, 255, 255, .035);
}
.ct-coord-label {
  font-family: var(--font);
  font-size: 10.5px;
  letter-spacing: .2em;
  text-transform: uppercase;
  font-weight: 700;
  color: var(--ct-muted);
}
.ct-coord-value {
  font-size: 14.5px;
  line-height: 1.5;
  color: var(--ct-text);
}
.ct-coord-value a { color: var(--ct-text); }
.ct-coord-value a:hover { color: #C3F910; }
.ct-coord-sub {
  display: block;
  font-size: 12px;
  color: var(--ct-muted);
  margin-top: 4px;
}

/* ─── Environnement « studio sombre » ─────────────────────────────────────── */
.ct-retail-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
  background: radial-gradient(120% 85% at 50% 30%, #0c0c0f 0%, #09090b 44%, #050507 100%);
}
.ct-retail-bg > div {
  position: absolute;
  inset: 0;
}
.ct-retail-merch {
  position: absolute;
  inset: 0;
  background: url('/web/contact/retail-merch.webp') center 22% / cover no-repeat;
  opacity: .32;
  mix-blend-mode: screen;
  filter: contrast(1.08) brightness(.9);
  pointer-events: none;
}
.ct-retail-key {
  background: radial-gradient(52% 60% at 50% 20%, rgba(255, 255, 255, .06), rgba(255, 255, 255, .015) 55%, transparent 78%);
}
.ct-retail-halo {
  inset: -12% -18%;
  background: radial-gradient(34% 42% at 50% 44%, rgba(255, 255, 255, .04), transparent 68%);
  filter: blur(22px);
}
.ct-retail-fluid {
  background-image:
    radial-gradient(40% 46% at 30% 36%, rgba(48, 66, 88, .12) 0, transparent 62%),
    radial-gradient(44% 48% at 72% 20%, rgba(30, 44, 60, .10) 0, transparent 64%),
    radial-gradient(52% 46% at 66% 82%, rgba(40, 36, 52, .09) 0, transparent 62%),
    radial-gradient(36% 42% at 16% 74%, rgba(52, 58, 70, .07) 0, transparent 58%);
  filter: blur(46px) saturate(.9);
  animation: ct-fluid-drift 46s ease-in-out infinite alternate;
  will-change: transform;
}
@keyframes ct-fluid-drift {
  0%   { transform: translate3d(-3%, -2%, 0) scale(1); }
  50%  { transform: translate3d(2.5%, 3%, 0) scale(1.07); }
  100% { transform: translate3d(-2%, 2.4%, 0) scale(1.03); }
}
.ct-retail-vignette {
  background: radial-gradient(120% 95% at 50% 45%, transparent 40%, rgba(3, 3, 4, .44) 82%, rgba(2, 2, 3, .8) 100%);
}
.ct-retail-section > .wrap {
  position: relative;
  z-index: 1;
}

@media (prefers-reduced-motion: reduce) {
  .ct-input, .ct-area, .ct-chip, .ct-link, .ct-check, .ct-btn,
  .ct-faq-q, .ct-faq-plus, .ct-row-label { transition: none; }
  .ct-chip:active, .ct-btn:active, .ct-faq-btn[aria-expanded='true'] .ct-faq-plus { transform: none; }
  .ct-mesh::before, .ct-zoom-bg, .ct-retail-fluid { animation: none; }
}
`;

/* Tonalités : une section = un jeu de `--ct-*`. Le lime, lui, ne change pas. */
type Tone = React.CSSProperties & Record<'--ct-text' | '--ct-body' | '--ct-sub' | '--ct-muted' | '--ct-line' | '--ct-line-strong' | '--ct-line-hover' | '--ct-surface' | '--ct-surface-focus' | '--ct-placeholder' | '--ct-error' | '--ct-accent' | '--ct-mesh-op', string>;

const TONE_DARK: Tone = {
  '--ct-text': 'var(--dark-text, #f5f4f0)',
  '--ct-body': 'var(--dark-body, #a3a3a3)',
  '--ct-sub': 'var(--dark-text-2, #c9c7c1)',
  '--ct-muted': '#8a8880',
  '--ct-line': 'var(--dark-line-2, #161615)',
  '--ct-line-strong': 'var(--dark-line, #1f1f1f)',
  '--ct-line-hover': '#3a3a3a',
  '--ct-surface': 'transparent',
  '--ct-surface-focus': 'rgba(195, 249, 16, .06)',
  '--ct-placeholder': '#7a7a76',
  '--ct-error': '#ffb3a4',
  '--ct-accent': '#C3F910',
  /* Sur le noir le voile peut monter : le texte clair garde son contraste. */
  '--ct-mesh-op': '.24',
};

const TONE_LIGHT: Tone = {
  '--ct-text': 'var(--ink, #111110)',
  '--ct-body': 'var(--body, #4a4a46)',
  '--ct-sub': 'var(--muted-2, #6b6a66)',
  '--ct-muted': 'var(--muted-2, #6b6a66)',
  '--ct-line': 'var(--line, #dad8d2)',
  '--ct-line-strong': 'var(--line-2, #e2e0da)',
  '--ct-line-hover': '#c9c7c2',
  '--ct-surface': 'var(--paper-2, #fff)',
  '--ct-surface-focus': 'rgba(195, 249, 16, .05)',
  '--ct-placeholder': 'var(--muted-2, #6b6a66)',
  '--ct-error': '#a3271b',
  '--ct-accent': 'var(--ink, #111110)',
  /* Sur le papier le voile reste un lavis : l'encre garde ses 4.5:1. */
  '--ct-mesh-op': '.18',
};

/* Lime : hexadécimal littéral, jamais `var(--accent)`. Le CMS peut redéfinir
   `--accent` à l'exécution, ce qui rendait les chips sélectionnés illisibles
   (noir sur noir). Ici la couleur est fixe. */
const ACCENT = '#C3F910';

/* Le lime n'est lisible qu'en fond ou en texte sur fond noir (15:1). Sur le
   papier il tombe à 1.5:1 : sur section blanche, l'accent en texte devient
   donc l'encre du site. `--ct-accent` est le pendant "côté texte" du lime. */
const ACCENT_TEXT = 'var(--ct-accent)';

/* Six melanges = six fenetres sur une rampe unique. `mesh()` donne a la carte
   d'index `i` le melange `i`, en rebouclant si le CMS en ajoute davantage :
   la 1re carte prend la 1re teinte, la 2e la suivante, etc. `meshVars()`
   fournit le `--i` qui decale la phase de l'animation d'une carte a l'autre. */
const MESH_COUNT = 6;

const mesh = (i: number) => `ct-mesh ct-mesh-${(i % MESH_COUNT) + 1}`;

const meshVars = (i: number) => ({ '--i': String(i) }) as React.CSSProperties;

/* Les couleurs de texte, de fond et de filet vivent dans les variables
   `--ct-*` définies par la tonalité de chaque section (TONE_DARK /
   TONE_LIGHT). On garde des alias pour ne pas répéter `var(--ct-…)` partout. */
const DARK_TEXT = 'var(--ct-text)';
const DARK_BODY = 'var(--ct-body)';
const DARK_TEXT_2 = 'var(--ct-sub)';
const DARK_MUTED = 'var(--ct-muted)';
const DARK_LINE_2 = 'var(--ct-line)';
const DARK_LINE = 'var(--ct-line-strong)';
const DARK_SURFACE = 'var(--ct-surface)';
const ERROR_TEXT = 'var(--ct-error)';

const eyebrowDark: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: '.24em',
  textTransform: 'uppercase',
  fontFamily: 'var(--font)',
  fontWeight: 700,
  color: DARK_MUTED,
  marginBottom: 28,
};

const mapsUrl = (address: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

const digits = (value: string) => value.replace(/[^0-9]/g, '');

/* ──────────────────────────────  Primitives  ────────────────────────────── */

/* Horloge live pour la barre de status OS */
function OsTime() {
  const [time, setTime] = useState(() =>
    new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
  );
  useEffect(() => {
    const id = setInterval(() => {
      setTime(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
    }, 30_000);
    return () => clearInterval(id);
  }, []);
  return <span>{time}</span>;
}

function Field({
  id,
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  required,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
}) {
  return (
    <div>
      <label className="ct-label" htmlFor={id}>
        {label}
        {required ? ' *' : ''}
      </label>
      <input
        id={id}
        name={id}
        className="ct-input"
        type={type}
        value={value}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  href,
  type = 'button',
  disabled,
  variant = 'ghost',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  type?: 'button' | 'submit';
  disabled?: boolean;
  variant?: 'ghost' | 'solid';
}) {
  // `solid` = action primaire : lime plein dès l'état de repos, parce que le
  // site reserve l'accent à l'action retenue. `ghost` vire au lime au survol
  // comme à l'activation.
  const className = variant === 'solid' ? 'ct-btn ct-btn-solid' : 'ct-btn';

  if (href) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={className}>
        {children}
      </a>
    );
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={className}>
      {children}
    </button>
  );
}

/* ──────────────────────────────  Formulaire  ────────────────────────────── */

function ContactFormCard({
  form,
  visibility,
  lang,
}: {
  form: PageContentConfig['form'];
  visibility: PageContentConfig['visibility'];
  lang: Language;
}) {
  const categories = useMemo(() => (form.categories ?? []).filter((c) => c.visible), [form.categories]);

  // `null` = l'utilisateur n'a rien choisi : on suit alors la première catégorie
  // visible, y compris quand le contenu CMS arrive après le premier rendu.
  const [picked, setPicked] = useState<string | null>(null);
  const projectType = picked ?? categories[0]?.title ?? 'Autre';

  const [fields, setFields] = useState({ name: '', email: '', phone: '', company: '', subject: '', message: '' });
  const [consent, setConsent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);

  const set = (key: keyof typeof fields) => (value: string) =>
    setFields((prev) => ({ ...prev, [key]: value }));

  const empty = { name: '', email: '', phone: '', company: '', subject: '', message: '' };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;
    setError(null);
    setSending(true);

    const payload: ContactSubmissionPayload = { ...fields, projectType, consent };

    try {
      const response = await fetch('/api/site-web/contact/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message ?? "Erreur lors de l'envoi de votre demande.");
      }
      trackFormSubmit();
      setSent(result.message ?? 'Votre demande a bien été enregistrée.');
      setFields(empty);
      setConsent(false);
      setPicked(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur inattendue est survenue.');
    } finally {
      setSending(false);
    }
  }

  if (!visibility.contactFormCard) return null;

  if (sent) {
    return (
      <div
        className="ct-mesh ct-mesh-1 ct-mesh--faint"
        style={{
          ...meshVars(0),
          border: `1px solid ${ACCENT}`,
          background: 'rgba(195, 249, 16, .04)',
          padding: 'clamp(28px, 4vw, 48px)',
        }}
      >
        <div style={{ ...eyebrowDark, marginBottom: 18, color: ACCENT_TEXT }}>
          {lang === 'FR' ? 'Demande envoyée' : 'Request sent'}
        </div>
        <h3 className="display" style={{ margin: 0, color: DARK_TEXT, fontSize: 'clamp(26px, 3vw, 40px)' }}>
          {lang === 'FR' ? 'Merci, votre demande est partie.' : 'Thanks, your request is on its way.'}
        </h3>
        <p style={{ margin: '20px 0 0', color: DARK_BODY, fontSize: 15.5, lineHeight: 1.6, maxWidth: 520 }}>{sent}</p>
        <p style={{ margin: '14px 0 0', color: DARK_MUTED, fontSize: 13, lineHeight: 1.6 }}>
          {lang === 'FR'
            ? `Technologie déclarée : ${projectType}`
            : `Declared technology: ${projectType}`}
        </p>
        <div style={{ marginTop: 30 }}>
          <ActionButton onClick={() => setSent(null)}>
            {lang === 'FR' ? 'Envoyer une autre demande' : 'Send another request'}
          </ActionButton>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="ct-mesh ct-mesh-1 ct-mesh--faint"
      style={{
        ...meshVars(0),
        border: `1px solid ${DARK_LINE_2}`,
        background: DARK_SURFACE,
        padding: 'clamp(16px, 2vw, 26px)',
      }}
    >
      <div style={eyebrowDark}>{form.badge}</div>
      <h3 className="display" style={{ margin: 0, color: DARK_TEXT, fontSize: 'clamp(18px, 1.9vw, 24px)' }}>
        {form.title}
      </h3>
      <p style={{ margin: '10px 0 0', color: DARK_BODY, fontSize: 13, lineHeight: 1.55, maxWidth: 560 }}>
        {form.subtitle}
      </p>

      {error && (
        <div
          role="alert"
          style={{
            marginTop: 26,
            padding: '14px 16px',
            border: '1px solid #ff6b57',
            background: 'rgba(255, 107, 87, .08)',
            color: ERROR_TEXT,
            fontSize: 14,
            lineHeight: 1.5,
          }}
        >
          {error}
        </div>
      )}

      {SHOW_PROJECT_TYPE_STEP && visibility.formCategorySelection && categories.length > 0 && (
        <fieldset style={{ border: 0, padding: 0, margin: '30px 0 0' }}>
          <legend className="ct-label" style={{ marginBottom: 12 }}>
            {form.step1Title}
          </legend>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 10 }}>
            {categories.map((cat, i) => {
              const active = cat.title === projectType;
              return (
                <button
                  key={cat.id}
                  type="button"
                  className={`ct-chip ${mesh(i)}`}
                  style={meshVars(i)}
                  aria-pressed={active}
                  onClick={() => setPicked(cat.title)}
                >
                  {cat.title}
                  <span className="ct-chip-sub">{cat.tag}</span>
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginTop: 14 }}>
        <Field
          id="ct-name"
          label={lang === 'FR' ? 'Nom complet' : 'Full name'}
          value={fields.name}
          onChange={set('name')}
          placeholder="ex. Alexandre Bernard"
          required
          autoComplete="name"
        />
        <Field
          id="ct-email"
          label={lang === 'FR' ? 'Email professionnel' : 'Work email'}
          type="email"
          value={fields.email}
          onChange={set('email')}
          placeholder="contact@entreprise.fr"
          required
          autoComplete="email"
        />
        {visibility.formPhoneField && (
          <Field
            id="ct-phone"
            label={lang === 'FR' ? 'Téléphone' : 'Phone'}
            type="tel"
            value={fields.phone}
            onChange={set('phone')}
            placeholder="+33 6 00 00 00 00"
            autoComplete="tel"
          />
        )}
        {visibility.formCompanyField && (
          <Field
            id="ct-company"
            label={lang === 'FR' ? 'Entreprise / Organisation' : 'Company'}
            value={fields.company}
            onChange={set('company')}
            placeholder="Nom de la société"
            autoComplete="organization"
          />
        )}
        {visibility.formSubjectField && (
          <div style={{ gridColumn: '1 / -1' }}>
            <Field
              id="ct-subject"
              label={lang === 'FR' ? 'Objet' : 'Subject'}
              value={fields.subject}
              onChange={set('subject')}
              placeholder={lang === 'FR' ? 'ex. Écran vitrine 3m × 2m en boutique' : 'ex. 3m × 2m shopfront display'}
            />
          </div>
        )}
      </div>

      <div style={{ marginTop: 12 }}>
        <label className="ct-label" htmlFor="ct-message">
          {form.step3Title}
        </label>
        <textarea
          id="ct-message"
          name="message"
          className="ct-area"
          rows={4}
          required
          value={fields.message}
          onChange={(e) => set('message')(e.target.value)}
          placeholder={
            lang === 'FR'
              ? 'Dimensions prévues, environnement (intérieur / vitrine / extérieur), ville d’installation, planning souhaité…'
              : 'Expected dimensions, environment (indoor / shopfront / outdoor), city, target timeline…'
          }
        />
      </div>

      <label
        htmlFor="ct-consent"
        style={{
          display: 'flex',
          gap: 12,
          alignItems: 'flex-start',
          marginTop: 12,
          color: DARK_TEXT_2,
          fontSize: 12,
          lineHeight: 1.55,
          cursor: 'pointer',
        }}
      >
        <input
          id="ct-consent"
          name="consent"
          type="checkbox"
          className="ct-check"
          required
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
        />
        <span>
          {lang === 'FR' ? (
            <>
              J’accepte que PIXIATECH traite mes informations dans le cadre de ma demande de devis et
              d’échange technique, conformément à la{' '}
              <a href="/web/politique-confidentialite" className="ct-link">
                politique de confidentialité
              </a>
              .
            </>
          ) : (
            <>
              I agree that PIXIATECH processes my information for the purpose of my quote and technical
              enquiry, in accordance with the{' '}
              <a href="/web/politique-confidentialite" className="ct-link">
                privacy policy
              </a>
              .
            </>
          )}
        </span>
      </label>

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 20, marginTop: 16 }}>
        <ActionButton type="submit" disabled={sending} variant="solid">
          {sending
            ? lang === 'FR'
              ? 'Transmission…'
              : 'Sending…'
            : form.submitButtonText}
          {!sending && <span aria-hidden="true">→</span>}
        </ActionButton>
        <span
          style={{
            fontFamily: 'var(--font)',
            fontSize: 10.5,
            letterSpacing: '.14em',
            textTransform: 'uppercase',
            color: DARK_MUTED,
          }}
        >
          {form.trustReassuranceText}
        </span>
      </div>
    </form>
  );
}

/* ──────────────────────  Retail : tablette + coordonnées  ──────────────────
   Recréation en CSS de la section « Our fastest-ever POS » des Shopify
   Editions Spring 2026 : fond quasi noir, tablette aluminium argentée au
   centre (col 3 → 10 de la grille), et un volant de coordonnées dans la
   colonne de gauche — la ou le reference pose ses onglets « Add product… ».
   Le formulaire vit sur l'écran de la tablette (la couleur de l'écran est
   conservee). Un parallaxe souris incline la tablette et decale le halo,
   sauf si l'utilisateur reduit les animations. */
function RetailContact({
  info,
  form,
  visibility,
  lang,
}: {
  info: PageContentConfig['info'];
  form: PageContentConfig['form'];
  visibility: PageContentConfig['visibility'];
  lang: Language;
}) {
  const reduceMotion = useReducedMotion();
  // Sur ecran tactile (pas de souris) la scene reste statique : l'orientation
  // par defaut est donnee par le CSS (.ct-device-3d), sans calcul JS.
  const [coarse, setCoarse] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(hover: none), (pointer: coarse)');
    setCoarse(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setCoarse(e.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  // Parallaxe souris : position normalisée (-0.5..0.5) déposée dans mx/my,
  // amortie par deux ressorts souples, puis répercutée en 3D sur la tablette et le halo.
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 65, damping: 20, mass: 0.8 });
  const sy = useSpring(my, { stiffness: 65, damping: 20, mass: 0.8 });

  // Rotation 3D de la tablette (perspective) façon Shopify Editions Spring 2026 POS :
  // - Au repos : tablette légèrement inclinée vers l'arrière (~7.5°)
  // - Souris vers le haut (sy < 0) : s'incline/pivote davantage vers l'arrière pour faire face au curseur (~13°)
  // - Souris vers le bas (sy > 0) : s'incline vers l'avant (~2°)
  const devRotX = useTransform(sy, [-0.5, 0.5], [13, 2]);

  // - Souris vers la gauche (sx < 0) : pivote vers la gauche (-9°)
  // - Souris vers la droite (sx > 0) : pivote vers la droite (+9°)
  const devRotY = useTransform(sx, [-0.5, 0.5], [-9, 9]);

  // Roulis Z léger pour le réalisme physique
  const devRotZ = useTransform(sx, [-0.5, 0.5], [-1.2, 1.2]);

  // Micro-translation parallaxe X / Y
  const devX = useTransform(sx, [-0.5, 0.5], [-14, 14]);
  const devY = useTransform(sy, [-0.5, 0.5], [-10, 10]);

  // Déplacement opposé du halo studio pour une sensation de profondeur optique
  const glowX = useTransform(sx, [-0.5, 0.5], [26, -26]);
  const glowY = useTransform(sy, [-0.5, 0.5], [18, -18]);

  const onPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (reduceMotion || e.pointerType !== 'mouse') return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    mx.set((e.clientX - rect.left) / rect.width - 0.5);
    my.set((e.clientY - rect.top) / rect.height - 0.5);
  };
  const onPointerLeave = () => {
    // Retour doux à la position initiale de repos
    mx.set(0);
    my.set(0);
  };

  const deviceActive = !reduceMotion && !coarse;
  const whatsappHref = `https://wa.me/${digits(info.whatsappNumber)}?text=${encodeURIComponent(
    "Bonjour PIXIATECH, je souhaite échanger sur un projet d'affichage / écran LED.",
  )}`;

  return (
    <section
      className="theme-dark ct-retail-section"
      style={{
        ...TONE_DARK,
        position: 'relative',
        zIndex: 2,
        background: 'var(--black, #080808)',
        overflow: 'hidden',
        padding: 'clamp(64px, 8vh, 110px) 0 clamp(80px, 10vh, 130px)',
      }}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      {/* Environnement studio sombre avec texture Shopify POS */}
      <div className="ct-retail-bg" aria-hidden="true">
        <div className="ct-retail-merch" />
        <div className="ct-retail-key" />
        <div className="ct-retail-halo" />
        <div className="ct-retail-fluid" />
        <div className="ct-retail-vignette" />
      </div>

      <div className="wrap">
        {/* En-tête façon Shopify : Titre showroom & consultation */}
        {visibility.contactInfoCard && (
          <header className="ct-retail-head">
            <div className="ct-retail-head-title">
              <div style={eyebrowDark}>{info.hqBadge}</div>
              <h2 className="display" style={{ margin: 0, color: DARK_TEXT, fontSize: 'clamp(30px, 3.4vw, 48px)', maxWidth: 720 }}>
                {info.hqTitle}
              </h2>
            </div>
            <div className="ct-retail-head-side">
              <p style={{ margin: 0, color: DARK_BODY, fontSize: 16, lineHeight: 1.62 }}>{info.hqDesc}</p>
            </div>
          </header>
        )}

        {/* Scène centrale : Grande tablette 3D widescreen flottante */}
        <div
          className="ct-stage"
          id="contact-form"
          style={{
            scrollMarginTop: 'calc(var(--nav-h) + 32px)',
          }}
        >
          <motion.div
            className="ct-device-glow"
            aria-hidden="true"
            style={deviceActive ? { x: glowX, y: glowY } : undefined}
          />
          <motion.div
            className="ct-device-3d"
            style={{
              transformStyle: 'preserve-3d',
              ...(deviceActive ? { rotateX: devRotX, rotateY: devRotY, rotateZ: devRotZ, x: devX, y: devY } : {}),
            }}
          >
            <div className="ct-device-frame">
              {/* Boutons physiques sur les tranches */}
              <span className="ct-dev-vol ct-dev-vol-1" aria-hidden="true" />
              <span className="ct-dev-vol ct-dev-vol-2" aria-hidden="true" />
              <span className="ct-dev-power" aria-hidden="true" />

              {/* Châssis métallique 3D */}
              <div className="ct-device">
                {/* Caméra frontale & capteur au centre du bord supérieur */}
                <span className="ct-dev-cam" aria-hidden="true" />
                <span className="ct-dev-sensor" aria-hidden="true" />

                {/* Écran avec reflet de verre */}
                <div className="ct-device-screen">
                  {/* Barre de status OS façon POS */}
                  <div className="ct-os-bar" aria-hidden="true">
                    <div className="ct-os-bar-left">
                      <span className="ct-os-dot" />
                      <span>PIXIATECH POS</span>
                    </div>
                    <div className="ct-os-bar-right">
                      <OsTime />
                      <div className="ct-os-signal">
                        <span /><span /><span /><span />
                      </div>
                      <div className="ct-os-battery">
                        <div className="ct-os-battery-icon">
                          <div className="ct-os-battery-fill" />
                        </div>
                        72%
                      </div>
                    </div>
                  </div>
                  {/* App bar */}
                  <div className="ct-tablet-bar">
                    <div className="ct-tablet-bar-left">
                      <span className="ct-status-dot" aria-hidden="true" />
                      <span style={{ color: 'rgba(255,255,255,.72)' }}>
                        {lang === 'FR' ? 'Formulaire de contact' : 'Contact form'}
                      </span>
                    </div>
                    <span className="ct-tablet-badge">
                      {lang === 'FR' ? 'Réponse sous 2h' : 'Reply within 2h'}
                    </span>
                  </div>
                  {/* Formulaire scrollable à l'intérieur de la tablette */}
                  <div className="ct-screen-scroll">
                    <div className="ct-form-shell" style={TONE_DARK}>
                      <ContactFormCard form={form} visibility={visibility} lang={lang} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Ombre de contact au sol */}
              <div className="ct-floor-shadow" aria-hidden="true" />
            </div>
          </motion.div>
        </div>

        {/* Console de coordonnées réelles sous la tablette */}
        {visibility.contactInfoCard && (
          <div className="ct-coords-console">
            {visibility.infoAddressRow && (
              <div className="ct-coord-card">
                <span className="ct-coord-label">{info.addressLabel}</span>
                <span className="ct-coord-value">
                  {info.addressValue}{' '}
                  <a
                    href={mapsUrl(info.addressValue)}
                    target="_blank"
                    rel="noreferrer"
                    className="ct-link"
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    {lang === 'FR' ? 'Itinéraire ↗' : 'Directions ↗'}
                  </a>
                </span>
              </div>
            )}
            {visibility.infoPhonesRow && (
              <div className="ct-coord-card">
                <span className="ct-coord-label">{info.phonesLabel}</span>
                <span className="ct-coord-value">
                  <a href={`tel:${digits(info.phone1)}`} className="ct-link">
                    {info.phone1}
                  </a>
                  {info.phone2 && (
                    <>
                      {' · '}
                      <a href={`tel:${digits(info.phone2)}`} className="ct-link">
                        {info.phone2}
                      </a>
                    </>
                  )}
                </span>
              </div>
            )}
            {visibility.infoEmailRow && (
              <div className="ct-coord-card">
                <span className="ct-coord-label">{info.emailLabel}</span>
                <span className="ct-coord-value">
                  <a href={`mailto:${info.emailValue}`} className="ct-link">
                    {info.emailValue}
                  </a>
                </span>
              </div>
            )}
            {visibility.infoWhatsappRow && (
              <div className="ct-coord-card">
                <span className="ct-coord-label">{info.whatsappLabel}</span>
                <span className="ct-coord-value">
                  <a href={whatsappHref} target="_blank" rel="noreferrer" className="ct-link">
                    {info.whatsappNumber}
                  </a>
                  <span className="ct-coord-sub">{info.whatsappSubtext}</span>
                </span>
              </div>
            )}
            {visibility.infoWorkingHoursRow && (
              <div className="ct-coord-card">
                <span className="ct-coord-label">{info.hoursLabel.replace(':', '')}</span>
                <span className="ct-coord-value">{info.hoursValue}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

/* ──────────────────────────────  FAQ  ────────────────────────────── */

function FaqList({ faq }: { faq: PageContentConfig['faq'] }) {
  const items = useMemo(() => (faq.items ?? []).filter((i) => i.visible), [faq.items]);
  // `undefined` = l'utilisateur n'a encore rien choisi : on affiche alors le
  // premier item, y compris quand le contenu CMS arrive après le premier rendu.
  const [picked, setPicked] = useState<string | null | undefined>(undefined);
  const open = picked === undefined ? items[0]?.id ?? null : picked;
  const toggle = (id: string) => setPicked(open === id ? null : id);

  if (!items.length) return null;

  return (
    <div style={{ borderTop: `1px solid ${DARK_LINE_2}` }}>
      {items.map((item) => {
        const expanded = open === item.id;
        return (
          <div key={item.id} style={{ borderBottom: `1px solid ${DARK_LINE_2}` }}>
            <button
              type="button"
              className="ct-faq-btn"
              aria-expanded={expanded}
              aria-controls={`ct-faq-panel-${item.id}`}
              onClick={() => toggle(item.id)}
            >
              <span>
                <span
                  style={{
                    display: 'block',
                    fontFamily: 'var(--font)',
                    fontSize: 10.5,
                    letterSpacing: '.18em',
                    textTransform: 'uppercase',
                    fontWeight: 700,
                    color: DARK_MUTED,
                    marginBottom: 10,
                  }}
                >
                  {item.category}
                </span>
                <span className="ct-faq-q">{item.question}</span>
              </span>
              <span className="ct-faq-plus" aria-hidden="true">
                +
              </span>
            </button>
            {expanded && (
              <div
                id={`ct-faq-panel-${item.id}`}
                style={{ padding: '0 0 28px', maxWidth: 760, color: DARK_BODY, fontSize: 15.5, lineHeight: 1.65 }}
              >
                {item.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ──────────────────────────────  Sections  ────────────────────────────── */

export function ContactSections({ lang }: { lang: Language }) {
  const [content, setContent] = useState<PageContentConfig>(DEFAULT_PAGE_CONTENT);
  const pinRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: pinRef, offset: ['start start', 'end start'] });
  const zoom = useTransform(scrollYProgress, [0, 1], [1, 1.18]);
  const heroScale = reduceMotion ? 1 : zoom;

  useEffect(() => {
    let alive = true;
    fetch('/api/site-web/contact/page-content')
      .then((res) => (res.ok ? res.json() : null))
      .then((body) => {
        const incoming = body?.data as PageContentConfig | undefined;
        if (!alive || !body?.success || !incoming) return;
        setContent((prev) => ({
          ...prev,
          ...incoming,
          visibility: { ...prev.visibility, ...incoming.visibility },
          hero: { ...prev.hero, ...incoming.hero },
          info: { ...prev.info, ...incoming.info },
          form: { ...prev.form, ...incoming.form },
          faq: { ...prev.faq, ...incoming.faq },
        }));
      })
      .catch(() => {
        /* Le contenu par défaut reste affiché : la page ne dépend pas du réseau. */
      });
    return () => {
      alive = false;
    };
  }, []);

  const { hero, info, form, faq, visibility } = content;
  const scrollToForm = () =>
    document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const stats = [hero.stat1Text, hero.stat2Text, hero.stat3Text].filter(Boolean);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CONTACT_CSS }} />

      {/* ── Hero : epingle, zoom au scroll (faccon topology.vc) ── */}
      <div ref={pinRef} className="ct-zoom-pin" style={{ position: 'relative' }}>
        <section
          id="contact"
          className="theme-dark ct-mesh ct-mesh-1 ct-zoom-hero"
          style={{ ...TONE_DARK, ...meshVars(0), background: 'var(--black, #080808)' }}
        >
          <motion.div className="ct-zoom-scale" style={{ scale: heroScale, willChange: 'transform' }}>
            <div className="ct-zoom-bg" aria-hidden="true" />
            <div
              className="wrap"
              style={{
                position: 'relative',
                zIndex: 1,
                minHeight: '100svh',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                padding: 'calc(var(--nav-h) + clamp(16px, 3vh, 40px)) 24px clamp(48px, 7vh, 92px)',
              }}
            >
              {visibility.heroBadge && (
                <div style={eyebrowDark}>
                  {lang === 'FR' ? 'PIXIATECH / CONTACT' : 'PIXIATECH / CONTACT'}
                </div>
              )}
              {visibility.heroTitle && (
                <h1 className="display" style={{ margin: 0, color: DARK_TEXT, maxWidth: 1020 }}>
                  {hero.titleLine1}
                  {hero.titleHighlight && (
                    <>
                      <br />
                      <span style={{ color: ACCENT }}>{hero.titleHighlight}</span>
                    </>
                  )}
                </h1>
              )}
              {visibility.heroSubtitle && (
                <p
                  className="lede"
                  data-reveal="true"
                  style={{ margin: '22px 0 0', maxWidth: 660, color: DARK_BODY, fontSize: 17, lineHeight: 1.62 }}
                >
                  {hero.subtitle}
                </p>
              )}

              {visibility.heroStatsPills && stats.length > 0 && (
                <div
                  data-reveal="true"
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '14px 44px',
                    marginTop: 26,
                    paddingTop: 18,
                    borderTop: `1px solid ${DARK_LINE}`,
                  }}
                >
                  {stats.map((stat) => (
                    <span
                      key={stat}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 10,
                        fontFamily: 'var(--font)',
                        fontSize: 11,
                        letterSpacing: '.14em',
                        textTransform: 'uppercase',
                        fontWeight: 600,
                        color: DARK_TEXT_2,
                      }}
                    >
                      <span
                        aria-hidden="true"
                        style={{ width: 14, height: 2, background: ACCENT, flex: 'none' }}
                      />
                      {stat}
                    </span>
                  ))}
                </div>
              )}

              {visibility.heroCtaButton && (
                <div style={{ marginTop: 26 }}>
                  <ActionButton onClick={scrollToForm}>
                    {hero.ctaButtonText}
                    <span aria-hidden="true">↓</span>
                  </ActionButton>
                </div>
              )}
            </div>
          </motion.div>
        </section>
      </div>

      {/* ── Coordonnées dans la tablette : la section « Our fastest-ever
          POS » des Shopify Editions Spring 2026. Le formulaire vit à
          l'écran de la tablette (sa couleur claire est conservée), les
          coordonnées flottent à gauche, et la souris incline l'ensemble. */}
      <RetailContact info={info} form={form} visibility={visibility} lang={lang} />

      {/* ── FAQ ────────────────────────────────────────────────
          Retour au noir pour refermer l'alternance. */}
      {visibility.faqSection && (
        <section
          id="faq"
          className="theme-dark"
          style={{
            ...TONE_DARK,
            background: 'var(--black, #080808)',
            borderTop: '1px solid var(--dark-line-2, #161615)',
            padding: 'clamp(72px, 9vh, 120px) 0',
          }}
        >
          <div className="wrap">
            <div style={eyebrowDark}>{faq.badge}</div>
            <h2 className="display" style={{ margin: 0, color: DARK_TEXT, maxWidth: 780 }}>
              {faq.title}
            </h2>
            <p
              data-reveal="true"
              style={{ margin: '24px 0 52px', maxWidth: 620, color: DARK_BODY, fontSize: 16.5, lineHeight: 1.62 }}
            >
              {faq.subtitle}
            </p>
            <FaqList faq={faq} />
          </div>
        </section>
      )}
    </>
  );
}
