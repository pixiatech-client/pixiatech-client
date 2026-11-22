'use client';

import { useEffect, useRef } from 'react';

/*
 * Champ d'étoiles en perspective — Hero Contact (Pixiatech).
 *
 * Canvas 2D natif + requestAnimationFrame : aucune dépendance, aucun shader.
 * Le canvas est transparent (clearRect) : le fond "deep space" du Hero reste
 * visible en dessous, les étoiles se dessinent par-dessus, et le contenu
 * (z-index 1) reste toujours au-dessus de l'ensemble.
 *
 * Adapté de « The background of stars flying behind the headline » (Animorio) :
 * point de fuite élastique, étoiles qui s'allongent en approchant, accélération
 * colorée maintenue, léger recul du titre. Les traînées et les étoiles teintées
 * suivent la couleur du thème CMS (--accent-rgb) : orange, bleu, vert, etc.
 *
 * Aucun contenu éditorial n'est modifié. Les seules touches au DOM existant :
 * une propriété CSS `--ct-warp` et la position du point de fuite `--ct-vpx/y`
 * posées sur le conteneur, pour piloter les halos décoratifs.
 */

/* ---- valeurs à régler ---- */
const SPEED = 1; // vitesse de croisière (0 = immobile)
const WARP = 9; // accélération quand le pointeur est maintenu
const STREAK = 1.15; // longueur des traînées
const SWAY = 0.38; // suivi du curseur sur le point de fuite
const DEFAULT_RGB = '195, 249, 16'; // repli : accent Pixiatech historique
const WHITE_RGB = '242, 247, 255';

type Star = {
  x: number;
  y: number;
  z: number;
  tw: number; // luminosité individuelle
  cool: boolean; // teinte d'accent (couleur du thème)
  big: boolean; // quelques étoiles plus brillantes
};

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

function hexToRgb(hex: string): string | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}

export default function ContactStarfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const stage = canvas.parentElement as HTMLElement | null;
    if (!stage) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const nav = navigator as Navigator & { deviceMemory?: number };
    const lowPower =
      (typeof nav.hardwareConcurrency === 'number' && nav.hardwareConcurrency <= 4) ||
      (typeof nav.deviceMemory === 'number' && nav.deviceMemory <= 4);

    // Le titre est réutilisé tel quel : aucun attribut ajouté, aucun wrapper.
    const title = stage.querySelector('h1') as HTMLElement | null;

    // Couleur des traînées : lue depuis les tokens du thème, jamais figée.
    let accentRgb = DEFAULT_RGB;
    function readAccentRgb() {
      const cs = getComputedStyle(stage!);
      const rgb = (cs.getPropertyValue('--accent-rgb') || cs.getPropertyValue('--ui-accent-rgb') || '').trim();
      if (rgb) {
        accentRgb = rgb;
        return;
      }
      const hex = (cs.getPropertyValue('--accent') || cs.getPropertyValue('--ui-accent') || '').trim();
      accentRgb = hexToRgb(hex) || DEFAULT_RGB;
    }
    readAccentRgb();

    let W = 1;
    let H = 1;
    let dpr = 1;
    let targetStars = 0;
    let raf = 0;
    let last = 0;
    let drift = 0;
    let holding = false;
    let aiming = false;
    let visible = true;
    let reduced = motionQuery.matches;
    let frameCount = 0;
    let frameMs = 0;

    const stars: Star[] = [];
    const vp = { x: 0, y: 0, tx: 0, ty: 0, vx: 0, vy: 0, cx: 0, cy: 0 };
    const state = { boost: 0, boostV: 0, intro: 0 };

    function seat(s: Star, far: boolean) {
      // Dense vers le centre, jamais exactement sur l'axe (il ne bougerait plus).
      const a = Math.random() * Math.PI * 2;
      const r = 0.06 + Math.pow(Math.random(), 0.75) * 1.1;
      s.x = Math.cos(a) * r;
      s.y = Math.sin(a) * r;
      s.z = far ? 1 : 0.05 + Math.random() * 0.95;
      s.big = Math.random() < 0.055;
      s.tw = 0.72 + Math.random() * 0.48 + (s.big ? 0.26 : 0);
      s.cool = Math.random() < 0.32;
    }

    function syncStars(count: number) {
      targetStars = count;
      while (stars.length < count) {
        const s = {} as Star;
        seat(s, false);
        stars.push(s);
      }
      if (stars.length > count) stars.length = count;
    }

    function resize() {
      const rect = stage!.getBoundingClientRect();
      W = Math.max(1, rect.width);
      H = Math.max(1, rect.height);

      // Pas de flou inutile : résolution et budget de pixels plafonnés.
      dpr = Math.min(window.devicePixelRatio || 1, lowPower ? 1 : 1.75);
      const budget = lowPower ? 1_200_000 : 2_200_000;
      if (W * H * dpr * dpr > budget) dpr = Math.sqrt(budget / (W * H));
      canvas!.width = Math.round(W * dpr);
      canvas!.height = Math.round(H * dpr);

      // Point de fuite décentré à droite sur desktop : le texte respire à gauche.
      const ncx = W * (W < 700 ? 0.5 : 0.64);
      const ncy = H * (W < 700 ? 0.38 : 0.5);
      vp.x = vp.tx = ncx + (vp.x - vp.cx);
      vp.y = vp.ty = ncy + (vp.y - vp.cy);
      vp.cx = ncx;
      vp.cy = ncy;

      const areaCount = Math.round(clamp((W * H) / 2100, 110, 520));
      syncStars(lowPower ? Math.round(areaCount * 0.5) : areaCount);
      updateStageVars();

      if (reduced) draw(0);
    }

    function speedNow() {
      const k = 1 + (WARP - 1) * Math.max(0, state.boost);
      return Math.max(0, 0.16 * SPEED * k);
    }

    function draw(dt: number) {
      const focal = Math.max(W, H) * 0.62;
      const sp = speedNow();
      const warpness = clamp(state.boost, 0, 1);
      // La queue remonte en profondeur : tirets en croisière, traînées en warp.
      const tailDepth = (0.006 + sp * sp * 0.05 + sp * 0.014) * STREAK;
      const minLen = 3;

      ctx!.setTransform(1, 0, 0, 1, 0, 0);
      ctx!.globalCompositeOperation = 'source-over';
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx!.globalCompositeOperation = 'lighter';
      ctx!.lineCap = 'round';

      for (const s of stars) {
        s.z -= sp * dt;
        const hx = vp.x + (s.x / s.z) * focal;
        const hy = vp.y + (s.y / s.z) * focal;
        if (s.z < 0.02 || hx < -60 || hx > W + 60 || hy < -60 || hy > H + 60) {
          seat(s, true);
          continue;
        }

        const zt = Math.min(1.25, s.z + tailDepth);
        let tx = vp.x + (s.x / zt) * focal;
        let ty = vp.y + (s.y / zt) * focal;
        // Jamais un point : une étoile trop courte est étirée vers le point de fuite.
        let dx = hx - tx;
        let dy = hy - ty;
        let len = Math.hypot(dx, dy);
        if (len < minLen) {
          const ox = hx - vp.x;
          const oy = hy - vp.y;
          const ol = Math.hypot(ox, oy) || 1;
          tx = hx - (ox / ol) * minLen;
          ty = hy - (oy / ol) * minLen;
          dx = hx - tx;
          dy = hy - ty;
          len = minLen;
        }

        const near = 1 - s.z;
        const fade = Math.min(1, (1 - s.z) / 0.16) * state.intro;
        const alpha = fade * s.tw * (0.16 + 0.84 * Math.pow(near, 1.5)) * (1 + 0.32 * warpness);
        if (alpha <= 0.01 || len < 0.01) continue;

        const width = 0.55 + (s.big ? 0.9 : 0) + 1.5 * Math.pow(near, 2.2);
        const mx = tx + dx * 0.62;
        const my = ty + dy * 0.62;

        // En accélération la queue prend la couleur du thème, la tête reste blanche.
        if (warpness > 0.02) {
          ctx!.strokeStyle = `rgba(${accentRgb}, ${Math.min(1, alpha * 0.85 * warpness).toFixed(3)})`;
          ctx!.lineWidth = width * 0.8;
          ctx!.beginPath();
          ctx!.moveTo(tx, ty);
          ctx!.lineTo(mx, my);
          ctx!.stroke();
        }

        ctx!.strokeStyle = `rgba(${s.cool ? accentRgb : WHITE_RGB}, ${alpha.toFixed(3)})`;
        ctx!.lineWidth = width;
        ctx!.beginPath();
        ctx!.moveTo(warpness > 0.02 ? mx : tx, warpness > 0.02 ? my : ty);
        ctx!.lineTo(hx, hy);
        ctx!.stroke();
      }
    }

    function stepBoost(dt: number) {
      // Ressort légèrement sous-amorti : montée progressive, retour avec un
      // léger dépassement (comme le back.out de la démo), sans GSAP.
      const target = holding && !reduced ? 1 : 0;
      const k = 13;
      const damping = 6.4;
      state.boostV += ((target - state.boost) * k - state.boostV * damping) * dt;
      state.boost = clamp(state.boost + state.boostV * dt, -0.3, 1.12);
    }

    function updateStageVars() {
      // Pilote les halos / le viseur décoratifs sans toucher au contenu CMS.
      stage!.style.setProperty('--ct-warp', clamp(state.boost, 0, 1).toFixed(3));
      stage!.style.setProperty('--ct-vpx', `${vp.x.toFixed(1)}px`);
      stage!.style.setProperty('--ct-vpy', `${vp.y.toFixed(1)}px`);
      if (title) {
        // `scale` est indépendant de `transform` : le reveal n'est pas écrasé.
        title.style.scale = (1 - 0.016 * clamp(state.boost, -0.3, 1)).toFixed(4);
      }
    }

    function adapt(dtMs: number) {
      frameCount += 1;
      frameMs += dtMs;
      if (frameMs < 1000) return;
      const avg = frameMs / frameCount;
      if (avg > 25 && targetStars > 70) {
        targetStars = Math.max(70, Math.floor(targetStars * 0.85));
        syncStars(targetStars);
      }
      frameCount = 0;
      frameMs = 0;
    }

    function frame(time: number) {
      if (!raf) return;
      const dtMs = last ? time - last : 16;
      const dt = Math.min(0.12, dtMs / 1000);
      last = time;

      // Sous-pas fixes : le ressort reste synchronisé avec le temps réel même
      // si le navigateur ne fournit que 10-15 images/s (appareil chargé).
      let remaining = dt;
      while (remaining > 0) {
        const h = Math.min(0.016, remaining);
        remaining -= h;
        drift += h;
        if (!aiming) {
          // Sans curseur, le point de fuite continue de dériver doucement.
          vp.tx = vp.cx + Math.sin(drift * 0.23) * W * 0.03;
          vp.ty = vp.cy + Math.sin(drift * 0.17 + 1.3) * H * 0.025;
        }
        // Poursuite élastique et adoucie du point de fuite.
        vp.vx += ((vp.tx - vp.x) * 18 - vp.vx * 6.2) * h;
        vp.vy += ((vp.ty - vp.y) * 18 - vp.vy * 6.2) * h;
        vp.x += vp.vx * h;
        vp.y += vp.vy * h;
        stepBoost(h);
        state.intro = Math.min(1, state.intro + h / 1.6);
      }

      draw(dt);
      updateStageVars();
      adapt(dtMs);

      raf = requestAnimationFrame(frame);
    }

    function start() {
      if (raf || reduced || !visible || document.hidden) return;
      last = 0;
      raf = requestAnimationFrame(frame);
    }

    function stop() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    }

    function applyMotionPreference() {
      reduced = motionQuery.matches;
      if (reduced) {
        stop();
        holding = false;
        aiming = false;
        state.boost = 0;
        state.boostV = 0;
        state.intro = 1;
        vp.x = vp.tx = vp.cx;
        vp.y = vp.ty = vp.cy;
        vp.vx = 0;
        vp.vy = 0;
        if (title) title.style.scale = '';
        // Image fixe élégante : les étoiles restent dessinées, sans mouvement.
        draw(0);
      } else {
        state.intro = 0;
        state.boost = 0.85; // arrivée en léger survol, puis retour en croisière
        state.boostV = 0;
        start();
      }
      updateStageVars();
    }

    function aimAt(clientX: number, clientY: number) {
      const rect = stage!.getBoundingClientRect();
      vp.tx = vp.cx + (clientX - rect.left - vp.cx) * SWAY;
      vp.ty = vp.cy + (clientY - rect.top - vp.cy) * SWAY;
      aiming = true;
    }

    function onPointerMove(e: PointerEvent) {
      if (reduced) return;
      if (e.pointerType === 'mouse' || e.buttons) aimAt(e.clientX, e.clientY);
    }

    function onPointerDown(e: PointerEvent) {
      if (reduced) return;
      aimAt(e.clientX, e.clientY);
      // Ne jamais détourner un bouton, un lien, un champ ou un texte éditable CMS.
      const el = e.target as Element | null;
      if (el?.closest('button, a, input, textarea, select, [contenteditable="true"], [role="button"]')) return;
      holding = true;
    }

    function onPointerUp() {
      holding = false;
    }

    function onPointerLeave() {
      aiming = false;
    }

    function onBlur() {
      holding = false;
      aiming = false;
    }

    function onVisibility() {
      if (document.hidden) stop();
      else start();
    }

    // Recoloration immédiate quand l'admin change le thème dans le CMS.
    function onTheme(e: Event) {
      const detail = (e as CustomEvent<{ accent?: string; tokens?: Record<string, string> }>).detail;
      const rgb = detail?.tokens?.['--accent-rgb'];
      if (rgb) accentRgb = rgb;
      else if (detail?.accent) accentRgb = hexToRgb(detail.accent) || accentRgb;
      else readAccentRgb();
      if (reduced) draw(0); // image fixe : on repaint avec la nouvelle couleur
    }

    let resizeObserver: ResizeObserver | undefined;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(stage);
    } else {
      window.addEventListener('resize', resize);
    }

    let intersectionObserver: IntersectionObserver | undefined;
    if (typeof IntersectionObserver !== 'undefined') {
      // On arrête de dessiner dès que le Hero sort de l'écran (formulaire, FAQ…).
      intersectionObserver = new IntersectionObserver(
        (entries) => {
          visible = entries[0]?.isIntersecting ?? true;
          if (visible) start();
          else stop();
        },
        { threshold: 0 }
      );
      intersectionObserver.observe(stage);
    }

    stage.addEventListener('pointermove', onPointerMove);
    stage.addEventListener('pointerdown', onPointerDown);
    stage.addEventListener('pointerleave', onPointerLeave);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    window.addEventListener('blur', onBlur);
    window.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pixiatech-theme-change', onTheme);
    if (typeof motionQuery.addEventListener === 'function') {
      motionQuery.addEventListener('change', applyMotionPreference);
    } else {
      motionQuery.addListener(applyMotionPreference);
    }

    resize();
    applyMotionPreference();

    return () => {
      stop();
      stage!.removeEventListener('pointermove', onPointerMove);
      stage!.removeEventListener('pointerdown', onPointerDown);
      stage!.removeEventListener('pointerleave', onPointerLeave);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pixiatech-theme-change', onTheme);
      if (typeof motionQuery.removeEventListener === 'function') {
        motionQuery.removeEventListener('change', applyMotionPreference);
      } else {
        motionQuery.removeListener(applyMotionPreference);
      }
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
      window.removeEventListener('resize', resize);
      if (title) title.style.scale = '';
      stage!.style.removeProperty('--ct-warp');
      stage!.style.removeProperty('--ct-vpx');
      stage!.style.removeProperty('--ct-vpy');
    };
  }, []);

  return <canvas ref={canvasRef} className="ct-starfield" aria-hidden="true" />;
}
