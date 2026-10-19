'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * IntroPixiaTech — animation d'introduction « pixels → texte » du site Web.
 *
 * Reproduction fidèle du principe observé sur xeron.co (analyse du code source
 * public) : des particules carrées colorées, nées aléatoirement dans un grand
 * rectangle centré, convergent en ligne droite (easing cubic in-out) vers les
 * formes réelles des lettres « Pixiatech » rendues avec la police GRATIS.ttf,
 * claquent sur les couleurs finales, puis se fondent dans le texte net avant
 * un fondu de l'overlay qui révèle le site.
 *
 * Déclenchement : première visite uniquement (localStorage). Effacer les
 * données du site revient à une nouvelle première visite. Désactivé si
 * prefers-reduced-motion ou si l'URL contient un hash (lien profond).
 */

const STORAGE_KEY = 'pixiatech-intro';
const FONT_FAMILY = 'PixiaTechLogo';
const INTRO_TEXT = 'Pixiatech';
/** Palette flash identique à la référence Xeron. */
const PARTICLE_COLORS = ['#ff3b30', '#34d97b', '#3b7bff'];

type IntroState = 'pending' | 'run' | 'off';

export function IntroPixiaTech() {
  const [state, setState] = useState<IntroState>('pending');
  const run = state === 'run';
  const setMode = (on: boolean) => setState(on ? 'run' : 'off');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Décision au montage : première visite (localStorage) + reduced-motion + hash.
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      let seen = false;
      try {
        seen = localStorage.getItem(STORAGE_KEY) === '1';
      } catch {}
      const hasHash = window.location.hash.length > 1;
      setState(reduced || seen || hasHash ? 'off' : 'run');
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (!run) return;
    const canvas = canvasRef.current;
    if (!canvas) {
      setMode(false);
      return;
    }
    document.body.style.overflow = 'hidden';

    let rafId = 0;
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      document.body.style.overflow = '';
      try {
        localStorage.setItem(STORAGE_KEY, '1');
      } catch {}
      setMode(false);
      window.dispatchEvent(new Event('pixiatech-intro-done'));
    };

    const start = () => {
      // Hi-DPI plafonné à 1.5 (identique à la référence).
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const W = window.innerWidth;
      const H = window.innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        finish();
        return;
      }
      ctx.scale(dpr, dpr);

      // Canvas hors-écran : rendu du texte pour échantillonner la forme des lettres.
      const off = document.createElement('canvas');
      off.width = W;
      off.height = H;
      const octx = off.getContext('2d', { willReadFrequently: true });
      if (!octx) {
        finish();
        return;
      }

      // Texte centré, largeur max min(72vw, 900px) — la font-scale est linéaire,
      // une mesure suffit pour cibler cette largeur.
      const targetW = Math.min(0.72 * W, 900);
      let fontSize = Math.min(0.15 * W, 230);
      octx.font = `400 ${fontSize}px ${FONT_FAMILY}, "Helvetica Neue", Arial, sans-serif`;
      const measured = octx.measureText(INTRO_TEXT).width || 1;
      fontSize = fontSize * (targetW / measured);
      const fontSpec = `400 ${fontSize}px ${FONT_FAMILY}, "Helvetica Neue", Arial, sans-serif`;

      // Même rendu exact sur les deux contextes : le crossfade est pixel-parfait.
      const drawText = (c: CanvasRenderingContext2D) => {
        c.font = fontSpec;
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillStyle = '#f5f4f0';
        c.fillText(INTRO_TEXT, W / 2, H / 2);
      };
      drawText(octx);

      // Échantillonnage en grille (pas max(2, round(W/520)), seuil alpha 128).
      const data = octx.getImageData(0, 0, W, H).data;
      const points: { tx: number; ty: number; sx: number; sy: number; c: string; fc: string }[] = [];
      const step = Math.max(2, Math.round(W / 520));
      for (let y = 0; y < H; y += step) {
        for (let x = 0; x < W; x += step) {
          const i = (y * W + x) * 4;
          if (data[i + 3] > 128) {
            points.push({
              tx: x,
              ty: y,
              // Départ aléatoire dans un rectangle centré de 110% × 110% du viewport.
              sx: W / 2 + (Math.random() - 0.5) * W * 1.1,
              sy: H / 2 + (Math.random() - 0.5) * H * 1.1,
              c: PARTICLE_COLORS[(Math.random() * 3) | 0],
              fc: `rgb(${data[i]}, ${data[i + 1]}, ${data[i + 2]})`,
            });
          }
        }
      }

      // Phases (identiques à la référence) : convergence, crossfade, fade-out.
      const isMobile = W <= 760;
      const CONVERGE = isMobile ? 750 : 1100;
      const CROSSFADE = isMobile ? 320 : 480;
      const FADE_OUT = isMobile ? 350 : 450;
      const t0 = performance.now();

      const frame = (now: number) => {
        const elapsed = now - t0;
        ctx.fillStyle = '#050505';
        ctx.fillRect(0, 0, W, H);

        const p = Math.min(elapsed / CONVERGE, 1);
        // Easing cubic in-out (4p³ puis 1-(-2p+2)³/2).
        const ease = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
        // Crossfade démarrant à CONVERGE, s'étalant sur 0.6 × CROSSFADE.
        const xf = Math.min(Math.max((elapsed - CONVERGE) / (0.6 * CROSSFADE), 0), 1);
        const size = Math.max(1.6, step - 0.5);

        // Particules : couleurs flash en vol, couleurs finales à l'arrivée.
        if (xf < 1) {
          for (const pt of points) {
            ctx.fillStyle = p < 1 ? pt.c : pt.fc;
            ctx.globalAlpha = (p < 1 ? 0.85 : 1) * (1 - xf);
            ctx.fillRect(pt.sx + (pt.tx - pt.sx) * ease, pt.sy + (pt.ty - pt.sy) * ease, size, size);
          }
        }
        // Fond du texte net à travers les particules (équivalent du PNG chez Xeron).
        if (xf > 0) {
          ctx.globalAlpha = xf;
          drawText(ctx);
        }
        ctx.globalAlpha = 1;

        if (elapsed < CONVERGE + CROSSFADE) {
          rafId = requestAnimationFrame(frame);
        } else {
          const parent = canvas.parentElement;
          if (parent) {
            parent.style.transition = `opacity .${FADE_OUT}s ease`;
            parent.style.opacity = '0';
          }
          setTimeout(finish, FADE_OUT + 30);
        }
      };
      rafId = requestAnimationFrame(frame);
    };

    // Attente du chargement de la police, plafonnée à 600 ms
    // (analoge de l'img.decode() plafonné de la référence).
    const fontReady =
      typeof document !== 'undefined' && 'fonts' in document
        ? document.fonts.load(`400 100px ${FONT_FAMILY}`).catch(() => {})
        : Promise.resolve();
    Promise.race([fontReady, new Promise((res) => setTimeout(res, 600))]).then(start);

    return () => {
      cancelAnimationFrame(rafId);
      document.body.style.overflow = '';
    };
  }, [run]);

  // 'off' : déjà vue / accessibilité / lien profond → aucun rendu.
  if (state === 'off') return null;

  return (
    <div
      /* z-index 9999 (Xeron : 400) — doit passer au-dessus de la bannière
         cookies (z-1000) et des modales du site PixiaTech. */
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#050505' }}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
    </div>
  );
}
