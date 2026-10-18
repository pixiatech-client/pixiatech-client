'use client';

/**
 * PixiaGlobalAnimation — mascotte Pixia globale, pilotée par le scroll.
 *
 * Comportement (site public : `/web/*` et pages légales du domaine web) :
 *
 *   1. Hero visible → le robot complet (WebM VP9 à canal alpha réel) est
 *      présent, **librement déplaçable** à la souris ou au doigt (glisser /
 *      lancer / rebond élastique, Framer Motion — mêmes réglages que le robot
 *      flottant historique), cliquable à tout moment, et accompagné de la
 *      bulle d'accueil écrite caractère par caractère qui le suit dans ses
 *      déplacements ;
 *   2. sortie du Hero → la progression du scroll pilote la transformation : le
 *      robot quitte sa position **réelle** (celle où l'utilisateur l'a laissé),
 *      rejoint le centre **réel** de l'icône (mesuré sur le canal alpha de
 *      `/pixiaicon.webm`), se réduit progressivement et s'efface exactement à
 *      l'arrivée — le corps disparaît au moment même où il atteint l'icône ;
 *   3. icône dockée → seule l'icône WebM transparente est visible, sans cercle
 *      ni fond, juste au-dessus du bouton « retour en haut » existant (dont la
 *      position réelle est lue à l'écran) ;
 *   4. retour vers le haut → la courbe est parcourue à l'envers : le robot
 *      ressort de son icône, reprend sa taille, retrouve immédiatement sa
 *      liberté de déplacement et la bulle de bienvenue réapparaît ;
 *   5. clic (robot du Hero **ou** icône dockée) → ouverture du chatbot
 *      existant (`FloatingChatButton` → `WizardBotFlow`) via l'événement
 *      `pixia:open-chatbot`. Aucun second chatbot, aucune conversation
 *      parallèle, aucune croix supplémentaire.
 *
 * Une seule mascotte visible à la fois : pendant que ce composant prend le
 * relais, le robot flottant historique se retire entièrement
 * (`pixia:mascot-takeover`) — y compris sa croix, la fermeture du chat restant
 * celle de la vraie fenêtre `WizardBotFlow`.
 *
 * Contraintes respectées : aucune écriture React par frame (transform/opacité
 * écrits directement sur les nœuds), `transform`/`opacity` uniquement, boucle
 * `requestAnimationFrame` bornée et nettoyée, `prefers-reduced-motion` honoré
 * sans retirer le glisser-déposer, aucun accès au DOM avant le montage client
 * (donc pas d'erreur d'hydratation), canal alpha de la vidéo, de l'icône et de
 * l'affiche préservés (affichés tels quels, sans filtre ni canvas).
 */

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { motion, useMotionValue } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import {
  PIXIA_CHAT_STATE_EVENT,
  openPixiaChatbot,
  setMascotTakeover,
} from '@/lib/pixia-global';

/* -------------------------------------------------------------------------- */
/* Ressources                                                                  */
/* -------------------------------------------------------------------------- */

/** Mascotte animée (WebM VP9 + couche alpha, 586 × 720). */
const VIDEO_SRC = '/bot-avatars/pixia_robot.webm';
/** Affiche de repli (WebP transparent) si le WebM ne peut pas être lu. */
const VIDEO_POSTER = '/bot-avatars/010.webp';
/** Ratio largeur/hauteur réel du WebM Pixia. */
const VIDEO_ASPECT = 586 / 720;
/** Icône dockée : WebM VP9 à canal alpha réel (903 × 720). */
const ICON_VIDEO_SRC = '/pixiaicon.webm';
/** Affiche de repli (PNG alpha extrait de la vidéo) si le WebM ne lit pas. */
const ICON_POSTER_SRC = '/pixiaicon-poster.png';

/* -------------------------------------------------------------------------- */
/* Métriques mesurées sur le canal alpha RÉEL des ressources                   */
/* -------------------------------------------------------------------------- */
/* Obtenues par décodage `libvpx-vp9` + `alphaextract` puis profil de largeur
 * ligne à ligne : aucune valeur de cadrage « au feeling ». */

/** Contenu opaque de la vidéo (fractions de la vidéo). */
const VIDEO_CONTENT_LEFT = 0.099;
const VIDEO_CONTENT_RIGHT = 0.722;
const VIDEO_CONTENT_TOP = 0.086;
const VIDEO_CONTENT_BOTTOM = 0.85;
const VIDEO_CONTENT_H = VIDEO_CONTENT_BOTTOM - VIDEO_CONTENT_TOP;

/** Tête du robot dans la vidéo : centre et hauteur (fractions de la vidéo). */
const VIDEO_HEAD_CX = 0.403;
const VIDEO_HEAD_CY = 0.362;
const VIDEO_HEAD_H = 0.319;

/** Tête dans l'icône dockée : centre et hauteur (fractions du conteneur).
 *
 * L'icône est un WebM 903 × 720 (paysage) affiché avec `objectFit: contain`
 * dans un conteneur carré : largeur pleine, hauteur 720/903 = 0,7973 du
 * conteneur, marges verticales de 0,1013 en haut et en bas.
 *
 * Le contenu opaque, mesuré sur le canal alpha RÉEL de `/pixiaicon.webm`
 * (décode RGBA pixel par pixel, bbox x 0,150 → 0,842 / y 0,067 → 0,823,
 * stable sur toute la boucle de 10 s), se reprojette donc ainsi :
 *   CX = 0,496                         (centre x du contenu, sans décalage)
 *   CY = 0,1013 + 0,4450 × 0,7973 = 0,456
 *   H  = 0,7560 × 0,7973 = 0,603
 */
const ICON_HEAD_CX = 0.496;
const ICON_HEAD_CY = 0.456;
const ICON_HEAD_H = 0.603;

/* -------------------------------------------------------------------------- */
/* Réglages                                                                    */
/* -------------------------------------------------------------------------- */

/** Espace visuel entre le bas de la tête dockée et le bouton « retour en haut ». */
const DOCK_GAP = 16;
/** Bascule visuelle robot → tête (fin de la progression seulement). */
const HANDOFF_FROM = 0.84;
const HANDOFF_SPAN = 0.16;
/** À l'arrivée, le robot est réduit à cette fraction de la tête d'accueil. */
const END_ROBOT_RATIO = 0.72;
/** Hauteur de la barre de navigation du site (`--nav-h`). */
const NAV_H = 88;
/** Arc et inclinaison pendant la plongée (nuls aux deux extrémités). */
const ARC_PX = 26;
const ROT_DEG = 7;
/** Au-delà de cette progression, le robot devient interactif de nouveau. */
const ROBOT_MODE_T = 0.02;
/** Au-delà de cette progression, la bulle est réarmée pour un nouveau passage. */
const GREET_REARM_P = 0.25;

const GREETING_HOLD_MS = 3400; // délai d'affichage après la frappe
const GREETING_FADE_MS = 600; // fondu de sortie de la bulle
const TYPE_MS = 42; // cadence de frappe, caractère par caractère

const GREETING_FR =
  'Bonjour, je suis Pixia, ton assistant. Besoin d\u2019aide ? Clique sur moi !';
const GREETING_EN =
  'Hello, I\u2019m Pixia, your assistant. Need help? Click me!';

/* -------------------------------------------------------------------------- */
/* Utilitaires                                                                 */
/* -------------------------------------------------------------------------- */

/** Taille de police réellement appliquée à la racine (le site la fixe à 14 px). */
function rootRem(): number {
  const fs = Number.parseFloat(
    window.getComputedStyle(document.documentElement).fontSize
  );
  return Number.isFinite(fs) && fs > 0 ? fs : 16;
}

/**
 * Taille du robot complet.
 *
 * Elle reprend exactement celle du robot flottant historique
 * (`FloatingChatButton` dans l'historique Git) : `w-28 h-28` puis
 * `sm:w-44 sm:h-44`. Tailwind exprime ces classes en `rem` (7 rem puis 11 rem) ;
 * on refait donc le même calcul à partir de la police racine du site au lieu
 * d'inventer des pixels — les proportions restent celles de l'original.
 */
function boxSizeFor(vw: number, rem: number): number {
  return vw < 640 ? 7 * rem : 11 * rem; // w-28 / sm:w-44
}

function iconSizeFor(vw: number): number {
  return vw < 640 ? 64 : 76;
}

/** Position de repos du robot : bord droit, centré ; sous la nav sur mobile. */
function homeFor(vw: number, vh: number, size: number) {
  const pad = vw < 640 ? 14 : 40;
  return {
    left: Math.max(12, vw - pad - size),
    top: vw < 640 ? NAV_H + 14 : Math.max(12, (vh - size) / 2),
  };
}

function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/** Mode édition CMS : la barre de section réserve une hauteur (> 0). */
function isCmsEditing(): boolean {
  const root = document.getElementById('pixia-web');
  const h = root?.style.getPropertyValue('--cms-section-bar-h')?.trim() ?? '';
  return h !== '' && h !== '0px';
}

/**
 * Géométrie réelle du bouton « retour en haut » existant.
 *
 * On mesure le rectangle du bouton (`getBoundingClientRect`) : c'est la seule
 * référence qui reste juste quel que soit le zoom du navigateur, la largeur de
 * la barre de défilement ou la hauteur de fenêtre. Les anciens calculs
 * (`innerWidth - right`) partaient de la fenêtre entière — barre de défilement
 * comprise — alors que les éléments `position: fixed` sont positionnés dans la
 * zone de mise en page : la cible était décalée d'autant.
 *
 * Le bouton masqué applique `translate-y-4` : on retire ce décalage pour viser
 * la position qu'il occupera une fois visible. Rien n'est modifié sur le bouton.
 */
function readBackToTop(): { cx: number; top: number } {
  const docW = document.documentElement.clientWidth;
  const docH = document.documentElement.clientHeight;
  const el = document.getElementById('back-to-top-btn');
  if (el) {
    const rect = el.getBoundingClientRect();
    const cs = window.getComputedStyle(el);
    let shiftY = 0;
    if (cs.transform && cs.transform !== 'none') {
      try {
        shiftY = new DOMMatrixReadOnly(cs.transform).m42;
      } catch {
        shiftY = 0;
      }
    }
    const w = rect.width || el.offsetWidth || 0;
    return {
      cx: rect.left + w / 2,
      top: rect.top - (Number.isFinite(shiftY) ? shiftY : 0),
    };
  }
  // Repli (aucun bouton monté sur la page) : mêmes classes que le composant
  // `BackToTopButton` — `bottom-6 right-6` (1,5 rem) et `w-12 h-12` (3 rem)
  // puis `sm:w-[52px] sm:h-[52px]`.
  const rem = rootRem();
  const w = docW < 640 ? 3 * rem : 52;
  return { cx: docW - 1.5 * rem - w / 2, top: docH - 1.5 * rem - w };
}

/* -------------------------------------------------------------------------- */
/* Composant                                                                   */
/* -------------------------------------------------------------------------- */

interface PixiaGlobalAnimationProps {
  /** Le composant n'agit que sur les pages du site public. */
  active?: boolean;
}

export function PixiaGlobalAnimation({ active = false }: PixiaGlobalAnimationProps) {
  const pathname = usePathname();
  const { locale } = useI18n();
  const greeting = (locale === 'en' ? GREETING_EN : GREETING_FR).trim();

  /* --- Références DOM --- */
  const rootRef = useRef<HTMLDivElement>(null);
  const constraintsRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const iconRef = useRef<HTMLVideoElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);

  /* --- Déplacement libre (Framer Motion) --- */
  const dragX = useMotionValue(0);
  const dragY = useMotionValue(0);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);

  /* --- Animation --- */
  const heroRef = useRef<HTMLElement | null>(null);
  const rafRef = useRef(0);
  const sizeRef = useRef(154);
  const iconSizeRef = useRef(76);
  const bubbleSizeRef = useRef({ w: 0, h: 0 });
  const bubbleActiveRef = useRef(false);
  /** Vrai quand un prochain retour du robot doit déclencher un nouveau salut. */
  const awaitingGreetRef = useRef(true);
  const markedAtRef = useRef(0); // début du fondu de sortie de la bulle
  const greetingTypeTimerRef = useRef(0);
  const greetingHoldTimerRef = useRef(0);
  const greetingFadeTimerRef = useRef(0);
  const chatOpenRef = useRef(false);
  const dockedRef = useRef(false);
  const interactiveRef = useRef(false);
  /** Horodatage de la dernière tentative de lecture de la vidéo (anti-boucle). */
  const videoPlayRetryRef = useRef(0);

  const [size, setSize] = useState(154);
  const [iconSize, setIconSize] = useState(76);
  const [home, setHome] = useState({ left: 0, top: 0 });
  const [reduceMotion, setReduceMotion] = useState(false);
  const [heroFound, setHeroFound] = useState(false);
  const [typed, setTyped] = useState('');
  const [bubbleMounted, setBubbleMounted] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  /** La tête a remplacé le robot : la cible interactive et le focus changent. */
  const [docked, setDocked] = useState(false);
  /** Le robot accepte le glisser-déposer (aucune écriture React par frame). */
  const [interactive, setInteractive] = useState(false);

  const clearGreetingTimers = useCallback(() => {
    if (greetingTypeTimerRef.current) {
      window.clearInterval(greetingTypeTimerRef.current);
      greetingTypeTimerRef.current = 0;
    }
    if (greetingHoldTimerRef.current) {
      window.clearTimeout(greetingHoldTimerRef.current);
      greetingHoldTimerRef.current = 0;
    }
    if (greetingFadeTimerRef.current) {
      window.clearTimeout(greetingFadeTimerRef.current);
      greetingFadeTimerRef.current = 0;
    }
  }, []);

  /** Écritures par frame : géométrie réelle, transformation, bascule, bulle. */
  const apply = useCallback(() => {
    const drag = dragRef.current;
    const box = boxRef.current;
    const video = videoRef.current;
    const icon = iconRef.current;
    if (!drag || !box || !video || !icon) return;

    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;
    const S = sizeRef.current;
    const D = iconSizeRef.current;
    const chat = chatOpenRef.current;

    /* --- Hero courant (le nœud peut être démonté par le CMS) --- */
    let hero = heroRef.current;
    if (hero && !hero.isConnected) hero = null;
    if (!hero) {
      hero = document.querySelector<HTMLElement>(
        '[data-cms-section="hero"], #hero, section.hero'
      );
    }
    heroRef.current = hero;

    const editing = isCmsEditing();

    /* --- Progression : 0 = robot entier, 1 = tête dockée --- */
    let p: number;
    if (!hero || editing) {
      // Pages sans Hero (ou mode édition) : tête flottante directement.
      p = 1;
    } else {
      const rect = hero.getBoundingClientRect();
      const heroTop = rect.top + window.scrollY;
      const range = clamp(rect.height * 0.5, 260, 620);
      p = clamp((window.scrollY - heroTop) / range, 0, 1);
    }
    if (reduceMotion) p = p >= 0.5 ? 1 : 0;
    const t = reduceMotion ? p : easeInOutCubic(p);

    /* --- Position RÉELLE du robot (déplacement libre compris) --- */
    const dragRect = drag.getBoundingClientRect();
    const dragScale = dragRect.width > 0 ? dragRect.width / S : 1;
    const curX = dragRect.left + dragRect.width / 2;
    const curY = dragRect.top + dragRect.height / 2;

    /* --- Cible RÉELLE : centre du contenu de l'icône, au-dessus du bouton --- */
    const anchor = readBackToTop();
    const headH = ICON_HEAD_H * D;
    // Jamais coupée par un bord (zoom, petite fenêtre, barre de défilement) :
    // on borne le centre de la tête à l'intérieur de la zone visible.
    const headX = clamp(anchor.cx, D / 2 + 4, Math.max(D / 2 + 4, vw - D / 2 - 4));
    const headY = clamp(
      anchor.top - DOCK_GAP - headH / 2,
      headH / 2 + 4,
      Math.max(headH / 2 + 4, vh - headH / 2 - 4)
    );

    /* --- Transformation : déplacement vers la tête + réduction + effacement.
       Le robot est réduit à une fraction de la tête d'accueil pour rentrer
       réellement DEDANS au moment où il arrive. --- */
    const sEnd =
      dragScale > 0
        ? (END_ROBOT_RATIO * headH) / (VIDEO_CONTENT_H * S * dragScale)
        : 0.2;
    const scale = lerp(1, sEnd, t);
    const arc = reduceMotion ? 0 : -ARC_PX * Math.sin(Math.PI * t);
    const rot = reduceMotion ? 0 : -ROT_DEG * Math.sin(Math.PI * t);
    const tx = ((headX - curX) * t + arc) / dragScale;
    const ty = ((headY - curY) * t) / dragScale;

    box.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${scale}) rotate(${rot}deg)`;
    box.style.opacity = chat ? '0' : '1';

    /* --- Bascule robot → tête : le corps ne disparaît qu'à l'arrivée --- */
    const handoff = clamp((t - HANDOFF_FROM) / HANDOFF_SPAN, 0, 1);
    video.style.opacity = String((1 - handoff) * lerp(1, 0.92, t) * (chat ? 0 : 1));
    icon.style.opacity = String(handoff * (chat ? 0 : 1));
    icon.style.transform = `translate3d(${headX - ICON_HEAD_CX * D}px, ${
      headY - ICON_HEAD_CY * D
    }px, 0) scale(${lerp(0.88, 1, handoff)})`;

    /* --- Cibles interactives : jamais d'élément invisible qui reste cliquable.
       Pendant la plongée, les clics traversent : ni le robot ni la tête ne
       peuvent intercepter un clic destiné au bouton « retour en haut ». --- */
    const isDocked = handoff > 0.5;
    video.style.pointerEvents = !chat && t < 0.55 ? 'auto' : 'none';
    icon.style.pointerEvents = !chat && isDocked ? 'auto' : 'none';
    if (isDocked !== dockedRef.current) {
      dockedRef.current = isDocked;
      setDocked(isDocked);
    }
    const nextInteractive = !chat && t < ROBOT_MODE_T;
    if (nextInteractive !== interactiveRef.current) {
      interactiveRef.current = nextInteractive;
      setInteractive(nextInteractive);
    }

    /* --- Bulle : réarmement dès que le robot quitte franchement le Hero --- */
    if (!hero || editing || p > GREET_REARM_P) awaitingGreetRef.current = true;
    const robotVisible = !!hero && !editing && p <= 0.02 && !chat;

    /* --- Bulle : démarrage du salut (typé) et positionnement réel --- */
    if (
      robotVisible &&
      awaitingGreetRef.current &&
      !bubbleActiveRef.current &&
      greeting.length > 0
    ) {
      awaitingGreetRef.current = false;
      setBubbleMounted(true);
      bubbleActiveRef.current = true;
      markedAtRef.current = 0;
      if (reduceMotion) {
        setTyped(greeting);
      } else {
        setTyped(''); // saute le premier caractère du divertissement
        let i = 0;
        greetingTypeTimerRef.current = window.setInterval(() => {
          i += 1;
          setTyped(greeting.slice(0, i));
          if (i >= greeting.length) {
            window.clearInterval(greetingTypeTimerRef.current);
            greetingTypeTimerRef.current = 0;
          }
        }, TYPE_MS);
      }
      // Fin de frappe → attente statique, puis fondu, puis démontage.
      const typingMs = reduceMotion ? 0 : greeting.length * TYPE_MS;
      greetingHoldTimerRef.current = window.setTimeout(() => {
        markedAtRef.current = performance.now();
        greetingFadeTimerRef.current = window.setTimeout(() => {
          bubbleActiveRef.current = false;
          setBubbleMounted(false);
        }, GREETING_FADE_MS);
      }, typingMs + GREETING_HOLD_MS);
    }

    const bubble = bubbleRef.current;
    if (bubble) {
      // Bornes RÉELLES du robot à l'écran (contenu opaque de la vidéo), pour
      // que la bulle le suive quand il est déplacé.
      const videoW = S * VIDEO_ASPECT;
      const videoLeft = S / 2 - VIDEO_HEAD_CX * videoW;
      const videoTop = S / 2 - VIDEO_HEAD_CY * S;
      const k = scale * dragScale;
      const boxCx = curX + tx * dragScale;
      const boxCy = curY + ty * dragScale;
      const robotLeft = boxCx + (videoLeft + VIDEO_CONTENT_LEFT * videoW - S / 2) * k;
      const robotTop = boxCy + (videoTop + VIDEO_CONTENT_TOP * S - S / 2) * k;
      const robotBottom =
        boxCy + (videoTop + VIDEO_CONTENT_BOTTOM * S - S / 2) * k;
      const headCenterY = boxCy + (videoTop + VIDEO_HEAD_CY * S - S / 2) * k;

      const { w: bw, h: bh } = bubbleSizeRef.current;
      const margin = 12;
      let bx = robotLeft - margin - bw;
      let by = headCenterY - bh / 2;
      if (bx < margin) {
        // Pas de place à gauche (robot au bord droit) : au-dessus, sinon dessous.
        bx = clamp(boxCx - bw / 2, margin, Math.max(margin, vw - bw - margin));
        by = robotTop - margin - bh;
        if (by < margin) by = robotBottom + margin;
      }
      by = clamp(by, margin, Math.max(margin, vh - bh - margin));
      bubble.style.transform = `translate3d(${bx}px, ${by}px, 0)`;

      let alpha = 1;
      if (markedAtRef.current) {
        alpha = clamp(
          1 - (performance.now() - markedAtRef.current) / GREETING_FADE_MS,
          0,
          1
        );
      }
      const scrollFade = clamp(1 - p * 2.4, 0, 1);
      bubble.style.opacity = String(
        bubbleActiveRef.current && !chat ? alpha * scrollFade : 0
      );
    }

    // Repères de test/QA (aucun rendu React déclenché).
    const root = rootRef.current;
    if (root) {
      root.dataset.pixiaPhase =
        !hero || editing ? 'dock' : p <= 0.001 ? 'hero' : p >= 0.999 ? 'dock' : 'transition';
      root.dataset.pixiaProgress = p.toFixed(3);
      root.dataset.pixiaHandoff = handoff.toFixed(3);
      root.dataset.pixiaChatOpen = chat ? 'true' : 'false';
      root.dataset.pixiaDocked = isDocked ? 'true' : 'false';
    }
  }, [greeting, reduceMotion]);

  /**
   * Toujours la DERNIÈRE version d'`apply`.
   *
   * La boucle `frame` se relance elle-même tant que la bulle vit. Si elle
   * capturait `apply` directement, elle resterait figée sur la fermeture du
   * rendu qui l'a démarrée : les changements d'état lus par `apply`
   * (`prefers-reduced-motion`, langue) seraient ignorés pendant toute la durée
   * de la boucle — et `schedule()` étant court-circuité tant qu'une frame est
   * en attente, aucune version plus récente ne serait exécutée. On passe donc
   * par une ref, mise à jour à chaque rendu avant la peinture.
   */
  const applyRef = useRef(apply);
  useLayoutEffect(() => {
    applyRef.current = apply;
  });

  /** Boucle bornée : relancée tant que la bulle vit, sinon sur interaction. */
  const frame = useCallback(() => {
    rafRef.current = 0;
    // Le composant peut être passé en `null` (page hors site public) : on
    // n'écrit plus dans des refs absentes et on ne boucle pas à vide.
    if (!boxRef.current || !videoRef.current || !iconRef.current) return;
    applyRef.current();
    if (bubbleActiveRef.current) {
      rafRef.current = window.requestAnimationFrame(frame);
    }
  }, []);

  const schedule = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = window.requestAnimationFrame(frame);
  }, [frame]);

  /**
   * Relance la lecture des deux vidéos (animation d'origine, boucle infinie) :
   * le robot du Hero et l'icône dockée.
   *
   * L'autoplay peut être refusé par le navigateur — typiquement quand la page
   * est ouverte dans un onglet non visible : la vidéo reste alors figée sur son
   * affiche. On retente donc la lecture sur les signaux fiables (visibilité,
   * fin de chargement, premier geste), avec un garde-fou anti-boucle.
   */
  const ensureVideoPlaying = useCallback(() => {
    const now = performance.now();
    if (now - videoPlayRetryRef.current < 500) return;
    videoPlayRetryRef.current = now;
    for (const v of [videoRef.current, iconRef.current]) {
      if (v && v.paused) void v.play().catch(() => {});
    }
  }, []);

  /* --- Lecture des vidéos : autoplay, onglet réaffiché, média prêt --- */
  useEffect(() => {
    if (!active) return;
    const videos = [videoRef.current, iconRef.current].filter(
      (v): v is HTMLVideoElement => !!v
    );
    const onWake = () => {
      if (document.visibilityState === 'visible') ensureVideoPlaying();
      schedule();
    };
    const onReady = () => ensureVideoPlaying();
    const onPause = () => {
      // Seul l'onglet visible doit relancer la lecture : évite toute boucle
      // play/pause quand la page est en arrière-plan.
      if (document.visibilityState === 'visible') ensureVideoPlaying();
    };
    document.addEventListener('visibilitychange', onWake);
    window.addEventListener('focus', onWake);
    window.addEventListener('pageshow', onWake);
    window.addEventListener('pointerdown', onReady, { passive: true });
    window.addEventListener('keydown', onReady);
    for (const v of videos) {
      v.addEventListener('loadeddata', onReady);
      v.addEventListener('canplay', onReady);
      v.addEventListener('pause', onPause);
    }
    ensureVideoPlaying();
    const id = window.setTimeout(ensureVideoPlaying, 300);
    return () => {
      document.removeEventListener('visibilitychange', onWake);
      window.removeEventListener('focus', onWake);
      window.removeEventListener('pageshow', onWake);
      window.removeEventListener('pointerdown', onReady);
      window.removeEventListener('keydown', onReady);
      for (const v of videos) {
        v.removeEventListener('loadeddata', onReady);
        v.removeEventListener('canplay', onReady);
        v.removeEventListener('pause', onPause);
      }
      window.clearTimeout(id);
    };
  }, [active, pathname, ensureVideoPlaying, schedule]);

  /* --- Réglages d'environnement (client uniquement) --- */
  useEffect(() => {
    const sync = () => {
      setReduceMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
      // Zone de mise en page (hors barres de défilement) : c'est elle qui
      // positionne les éléments `fixed`, pas `innerWidth`/`innerHeight`.
      const vw = document.documentElement.clientWidth;
      const vh = document.documentElement.clientHeight;
      const s = boxSizeFor(vw, rootRem());
      sizeRef.current = s;
      setSize(s);
      const d = iconSizeFor(vw);
      iconSizeRef.current = d;
      setIconSize(d);
      setHome(homeFor(vw, vh, s));
    };
    sync();
    window.addEventListener('resize', sync);
    window.addEventListener('orientationchange', sync);
    return () => {
      window.removeEventListener('resize', sync);
      window.removeEventListener('orientationchange', sync);
    };
  }, []);

  /* --- La préférence « mouvement réduit » peut changer sans rechargement --- */
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onPreference = () => {
      setReduceMotion(mq.matches);
      schedule();
    };
    mq.addEventListener('change', onPreference);
    return () => mq.removeEventListener('change', onPreference);
  }, [schedule]);

  /* --- Détection du Hero de la page courante (montages CMS tardifs inclus) --- */
  useEffect(() => {
    heroRef.current = null;
    clearGreetingTimers();
    bubbleActiveRef.current = false;
    awaitingGreetRef.current = true;
    markedAtRef.current = 0;
    setHeroFound(false);
    setBubbleMounted(false);
    setTyped('');

    if (!active) return;

    let cancelled = false;
    let attempts = 0;
    let timer: number | undefined;
    const probe = () => {
      if (cancelled) return;
      const el = document.querySelector<HTMLElement>(
        '[data-cms-section="hero"], #hero, section.hero'
      );
      if (el) {
        heroRef.current = el;
        setHeroFound(true);
        schedule();
        return;
      }
      attempts += 1;
      if (attempts < 20) timer = window.setTimeout(probe, 250);
    };
    probe();
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [active, pathname, schedule, clearGreetingTimers]);

  /* --- Nouvelle page : le robot repart de sa position de repos --- */
  useEffect(() => {
    dragX.set(0);
    dragY.set(0);
    dragStartRef.current = null;
  }, [pathname, dragX, dragY]);

  /* --- Relais de mascotte : le robot flottant historique se retire --- */
  useEffect(() => {
    if (!active) return;
    setMascotTakeover(true);
    return () => setMascotTakeover(false);
  }, [active, pathname]);

  /* --- État du chatbot (le chat ouvert masque temporairement la mascotte) --- */
  useEffect(() => {
    if (!active) return;
    const onChatState = (event: Event) => {
      const open = Boolean((event as CustomEvent<{ open?: boolean }>).detail?.open);
      chatOpenRef.current = open;
      setChatOpen(open);
      schedule();
    };
    window.addEventListener(PIXIA_CHAT_STATE_EVENT, onChatState);
    return () => window.removeEventListener(PIXIA_CHAT_STATE_EVENT, onChatState);
  }, [active, pathname, schedule]);

  /* --- Scroll piloté (molette, tactile, trackpad, clavier) + redimensionnements --- */
  useEffect(() => {
    if (!active) return;
    const onScroll = () => schedule();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [active, pathname, schedule]);

  /* --- Premier calcul après montage et à chaque changement de route --- */
  useEffect(() => {
    if (!active) return;
    schedule();
    const id = window.setTimeout(schedule, 120); // laisse la page se stabiliser
    return () => window.clearTimeout(id);
  }, [active, pathname, heroFound, size, home, schedule]);

  /* --- Mesure de la bulle quand son contenu/taille change (hors frame) --- */
  useEffect(() => {
    if (!bubbleMounted) return;
    const el = bubbleRef.current;
    if (!el) return;
    bubbleSizeRef.current = { w: el.offsetWidth, h: el.offsetHeight };
    schedule();
  }, [bubbleMounted, typed, size, schedule]);

  /* --- Nettoyage : frames, timers de la bulle et take-over --- */
  useEffect(
    () => () => {
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
      if (greetingTypeTimerRef.current) {
        window.clearInterval(greetingTypeTimerRef.current);
        greetingTypeTimerRef.current = 0;
      }
      if (greetingHoldTimerRef.current) {
        window.clearTimeout(greetingHoldTimerRef.current);
        greetingHoldTimerRef.current = 0;
      }
      if (greetingFadeTimerRef.current) {
        window.clearTimeout(greetingFadeTimerRef.current);
        greetingFadeTimerRef.current = 0;
      }
      setMascotTakeover(false);
    },
    []
  );

  /** Clic (sans glissement) sur le robot → ouverture du chatbot existant. */
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    const start = dragStartRef.current;
    dragStartRef.current = null;
    const moved = start ? Math.hypot(e.clientX - start.x, e.clientY - start.y) : 0;
    if (moved > 8) return; // c'était un déplacement, pas un clic
    e.preventDefault();
    e.stopPropagation();
    openPixiaChatbot();
  }, []);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      event.stopPropagation();
      openPixiaChatbot();
    }
  }, []);

  // Aucune sortie tant que la page n'est pas une page du site public : évite
  // tout travail inutile (admin, boutique, embed, mon-compte…).
  if (!active) return null;

  const elevated = pathname.startsWith('/web');
  const videoLabel =
    locale === 'en' ? 'Open the Pixia assistant' : 'Ouvrir l\u2019assistant Pixia';
  const iconLabel = locale === 'en' ? 'Pixia assistant' : 'Assistant Pixia';
  const videoW = size * VIDEO_ASPECT;
  const videoLeft = size / 2 - VIDEO_HEAD_CX * videoW;
  const videoTop = size / 2 - VIDEO_HEAD_CY * size;

  return (
    <div
      ref={rootRef}
      className="pixia-global-animation"
      data-pixia-global
      data-pixia-phase={heroFound ? 'hero' : 'dock'}
      data-pixia-progress="0"
      data-pixia-handoff="0"
      data-pixia-chat-open={chatOpen ? 'true' : 'false'}
      data-pixia-docked={docked ? 'true' : 'false'}
      data-pixia-reduced-motion={reduceMotion ? 'true' : 'false'}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: elevated ? 290 : 101,
        pointerEvents: 'none',
      }}
    >
      {/* Limites du glisser-déposer : tout l'écran, comme le robot historique. */}
      <div
        ref={constraintsRef}
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none"
      />

      {/* Robot complet : couche de glissement Framer Motion (déplacement libre,
          inertie, rebond élastique) → boîte pilotée par le scroll. */}
      <motion.div
        ref={dragRef}
        drag
        dragConstraints={constraintsRef}
        dragElastic={0.1}
        dragMomentum
        whileHover={{ cursor: 'grab', scale: 1.05 }}
        whileDrag={{ cursor: 'grabbing', scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        onDrag={() => schedule()}
        data-pixia-drag
        className={interactive ? 'pointer-events-auto' : 'pointer-events-none'}
        style={{
          position: 'fixed',
          left: home.left,
          top: home.top,
          width: size,
          height: size,
          x: dragX,
          y: dragY,
          touchAction: 'none',
          willChange: 'transform',
        }}
      >
        <div
          ref={boxRef}
          data-pixia-mascot
          style={{
            width: size,
            height: size,
            opacity: 0,
            pointerEvents: 'none',
            willChange: 'transform, opacity',
            transformOrigin: 'center center',
          }}
        >
          <video
            ref={videoRef}
            data-pixia-video
            src={VIDEO_SRC}
            poster={VIDEO_POSTER}
            autoPlay
            muted
            playsInline
            loop
            preload="auto"
            aria-label={videoLabel}
            role="button"
            tabIndex={docked ? -1 : 0}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onKeyDown={handleKeyDown}
            className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C3F910]"
            style={{
              position: 'absolute',
              left: videoLeft,
              top: videoTop,
              width: videoW,
              height: size,
              background: 'transparent',
              display: 'block',
              cursor: 'grab',
              pointerEvents: 'auto',
              willChange: 'opacity',
              userSelect: 'none',
            }}
            onLoadedMetadata={(e) => {
              // Certains navigateurs limitent l'autoplay : on retente dès que le
              // média est prêt. En cas de blocage total, l'affiche (poster) reste
              // visible, sans casser la mise en page.
              void (e.target as HTMLVideoElement).play().catch(() => {});
            }}
            onTimeUpdate={() => {
              const v = videoRef.current;
              if (v && v.duration > 0 && v.currentTime >= v.duration - 0.04) {
                v.currentTime = 0.04;
              }
            }}
            onEnded={(e) => {
              const v = e.target as HTMLVideoElement;
              v.currentTime = 0.04;
              void v.play().catch(() => {});
            }}
          />
        </div>
      </motion.div>

      {/* Icône dockée de Pixia : WebM VP9 à canal alpha réel, sans cercle ni
          fond, juste au-dessus du bouton « retour en haut ». L'affiche PNG
          (même géométrie, alpha réel) couvre l'instant de chargement et les
          navigateurs qui ne lisent pas le WebM/VP9. */}
      <video
        ref={iconRef}
        data-pixia-icon
        src={ICON_VIDEO_SRC}
        poster={ICON_POSTER_SRC}
        autoPlay
        muted
        playsInline
        loop
        preload="auto"
        aria-label={iconLabel}
        role={docked ? 'button' : undefined}
        tabIndex={docked ? 0 : -1}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onKeyDown={handleKeyDown}
        className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C3F910]"
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          width: iconSize,
          height: iconSize,
          objectFit: 'contain',
          opacity: 0,
          transformOrigin: `${ICON_HEAD_CX * 100}% ${ICON_HEAD_CY * 100}%`,
          cursor: 'pointer',
          pointerEvents: 'none',
          willChange: 'opacity, transform',
          userSelect: 'none',
          background: 'transparent',
        }}
        onLoadedMetadata={(e) => {
          // Autoplay parfois refusé (onglet non visible) : on retente dès que
          // le média est prêt. Sans lecture, l'affiche reste en place.
          void (e.target as HTMLVideoElement).play().catch(() => {});
        }}
      />

      {/* Bulle d'accueil : écrite caractère par caractère, rejouée à chaque
          retour du robot, jamais bloquante (aucun événement pointeur).
          Pas de `role="status"` : le texte change toutes les ~40 ms, un live
          region annoncerait caractère par caractère. Le texte reste lisible en
          navigation, la mascotte expose son propre `aria-label`. */}
      {bubbleMounted && (
        <div
          ref={bubbleRef}
          data-pixia-bubble
          style={{
            position: 'fixed',
            left: 0,
            top: 0,
            maxWidth: 'min(280px, 70vw)',
            padding: '14px 18px',
            borderRadius: '18px',
            background: 'rgba(225, 255, 170, 0.97)',
            color: '#0f1a00',
            fontFamily: 'Satoshi, "Helvetica Neue", Helvetica, Arial, sans-serif',
            fontSize: '14px',
            lineHeight: 1.45,
            fontWeight: 600,
            boxShadow: '0 20px 45px rgba(0,0,0,0.35)',
            border: '1px solid rgba(195, 249, 16, 0.6)',
            opacity: 0,
            willChange: 'opacity, transform',
            pointerEvents: 'none',
          }}
        >
          {typed}
          {typed.length > 0 && typed.length < greeting.length && (
            <span aria-hidden="true">|</span>
          )}
        </div>
      )}
    </div>
  );
}
