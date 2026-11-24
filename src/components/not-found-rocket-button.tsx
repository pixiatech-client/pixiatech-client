'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { gsap } from 'gsap';
import styles from './not-found-rocket-button.module.css';

type Locale = 'fr' | 'en';

const COPY: Record<
  Locale,
  {
    label: string;
    counting: string;
    launched: string;
    hint: string;
    hintCount: string;
    hintFly: string;
    hintDone: string;
    hintAbort: string;
    ariaAbort: string;
    ariaFlying: string;
    ariaDone: string;
    liveCountdown: string;
    liveLiftoff: string;
    liveDone: string;
    liveAbort: string;
  }
> = {
  fr: {
    label: "Retour à l'accueil",
    counting: 'Lancement dans',
    launched: 'C’est parti',
    hint: 'Prêt pour le décollage',
    hintCount: 'Appuyez à nouveau pour annuler',
    hintFly: 'Décollage !',
    hintDone: 'Direction l’accueil',
    hintAbort: 'Lancement annulé',
    ariaAbort: 'Annuler le lancement',
    ariaFlying: 'Lancement en cours',
    ariaDone: 'Retour à l’accueil lancé',
    liveCountdown: 'Lancement dans',
    liveLiftoff: 'Décollage',
    liveDone: 'Retour à l’accueil lancé',
    liveAbort: 'Lancement annulé',
  },
  en: {
    label: 'Go to Home',
    counting: 'Launching in',
    launched: 'Launched',
    hint: 'Ready for liftoff',
    hintCount: 'Press again to abort',
    hintFly: 'Liftoff!',
    hintDone: 'Heading home',
    hintAbort: 'Launch aborted',
    ariaAbort: 'Abort the launch',
    ariaFlying: 'Launching',
    ariaDone: 'Launch complete. Go to Home',
    liveCountdown: 'Launching in',
    liveLiftoff: 'Liftoff',
    liveDone: 'Launch complete',
    liveAbort: 'Launch aborted',
  },
};

/* values to change (from the original Animorio demo) */
const COUNT = 3;
const BEAT = 0.8;
const SHAKE = 1;
const FLIGHT = 1.5;
const LEAN = 9;
const SMOKE = 1;
const SWIRL = 1;
const DONE = 2.6;
const SIZE = 0.8;
const NOZZLE = 24.2 * SIZE;
const FLOOR = 25;
const HOLD = 0.42;

type RGB = number[];

interface Emit {
  vx: number;
  vy: number;
  r0: number;
  grow: number;
  life: number;
  a0: number;
  front?: boolean;
  heat?: number;
  drag: number;
  buoy: number;
  floor?: number;
  curl?: number;
}

interface Part extends Emit {
  x: number;
  y: number;
  age: number;
  img: HTMLCanvasElement;
  hot: HTMLCanvasElement;
}

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
}

export default function NotFoundRocketButton({ locale }: { locale: Locale }) {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const t = COPY[locale];
    const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const btn = root.querySelector('[data-btn]') as HTMLButtonElement;
    const pad = root.querySelector('[data-pad]') as HTMLSpanElement;
    const ring = root.querySelector('[data-ring]') as SVGCircleElement;
    const reel = root.querySelector('[data-reel]') as HTMLSpanElement;
    const lines = {
      idle: root.querySelector('[data-line="idle"]') as HTMLSpanElement,
      count: root.querySelector('[data-line="count"]') as HTMLSpanElement,
      done: root.querySelector('[data-line="done"]') as HTMLSpanElement,
    };
    const check = root.querySelector('[data-check]') as SVGPathElement;
    const hintEl = root.querySelector('[data-hint]') as HTMLSpanElement;
    const live = root.querySelector('[data-live]') as HTMLParagraphElement;
    const heatEl = root.querySelector('[data-heat]') as HTMLSpanElement;
    const rocket = root.querySelector('[data-rocket]') as SVGSVGElement;
    const craft = rocket.querySelector('[data-craft]') as SVGGElement;
    const burn = rocket.querySelector('[data-burn]') as SVGRectElement;
    const flameG = rocket.querySelector('[data-flame]') as SVGGElement;
    const fire = rocket.querySelector('[data-fire]') as SVGPathElement;
    const core = rocket.querySelector('[data-core]') as SVGPathElement;
    const knots = rocket.querySelector('[data-knots]') as SVGPathElement;
    const halo = rocket.querySelector('[data-halo]') as SVGCircleElement;
    const splash = rocket.querySelector('[data-splash]') as SVGEllipseElement;
    const sparkPath = rocket.querySelector('[data-sparks]') as SVGPathElement;

    const skies = ['back', 'front'].map((k) => {
      const c = root.querySelector(`[data-sky="${k}"]`) as HTMLCanvasElement;
      return { c, ctx: c.getContext('2d') as CanvasRenderingContext2D, clean: true };
    });

    const LABEL = t.label;
    const HINT = t.hint;
    const NUMBERS = Math.max(1, Math.min(9, Math.round(COUNT)));

    const z = { throttle: 0, shake: 0, lift: 0, rise: 0, hover: 0, wisp: 0 };
    let state: 'idle' | 'counting' | 'flying' | 'done' | 'rearming' = 'idle';
    let tl: gsap.core.Timeline | null = null;
    let backCall: gsap.core.Tween | null = null;
    let hintTl: gsap.core.Timeline | null = null;
    let hintBack: gsap.core.Tween | null = null;
    let climb = 600;
    let W = 0;
    let H = 0;
    let dpr = 1;
    let colors: { smoke: RGB; flame: RGB } | null = null;
    let puffs: HTMLCanvasElement[] = [];
    let hots: HTMLCanvasElement[] = [];
    const parts: Part[] = [];
    const sparks: Spark[] = [];
    let lastNozzle: { x: number; y: number; ang: number } | null = null;
    let emitDebt = 0;
    let shook = false;
    let cancelled = false;

    /* ---------------------------------------------------------------- noise */
    const perm = new Uint8Array(512);
    {
      const p = Array.from({ length: 256 }, (_, i) => i);
      let s = 1234567;
      for (let i = 255; i > 0; i--) {
        s = (s * 16807) % 2147483647;
        const j = s % (i + 1);
        [p[i], p[j]] = [p[j], p[i]];
      }
      for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
    }
    const GRAD = [
      [1, 1],
      [-1, 1],
      [1, -1],
      [-1, -1],
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ];
    const F2 = 0.5 * (Math.sqrt(3) - 1);
    const G2 = (3 - Math.sqrt(3)) / 6;
    function noise(xin: number, yin: number) {
      const s = (xin + yin) * F2;
      const i = Math.floor(xin + s);
      const j = Math.floor(yin + s);
      const tt = (i + j) * G2;
      const x0 = xin - (i - tt);
      const y0 = yin - (j - tt);
      const i1 = x0 > y0 ? 1 : 0;
      const j1 = 1 - i1;
      const x1 = x0 - i1 + G2;
      const y1 = y0 - j1 + G2;
      const x2 = x0 - 1 + 2 * G2;
      const y2 = y0 - 1 + 2 * G2;
      const ii = i & 255;
      const jj = j & 255;
      let n = 0;
      let a = 0.5 - x0 * x0 - y0 * y0;
      if (a > 0) {
        const g = GRAD[perm[ii + perm[jj]] & 7];
        a *= a;
        n += a * a * (g[0] * x0 + g[1] * y0);
      }
      a = 0.5 - x1 * x1 - y1 * y1;
      if (a > 0) {
        const g = GRAD[perm[ii + i1 + perm[jj + j1]] & 7];
        a *= a;
        n += a * a * (g[0] * x1 + g[1] * y1);
      }
      a = 0.5 - x2 * x2 - y2 * y2;
      if (a > 0) {
        const g = GRAD[perm[ii + 1 + perm[jj + 1]] & 7];
        a *= a;
        n += a * a * (g[0] * x2 + g[1] * y2);
      }
      return 70 * n;
    }
    let seed = 42;
    const rnd = (a = 0, b = 1) => {
      seed = (seed * 16807) % 2147483647;
      return a + ((seed - 1) / 2147483646) * (b - a);
    };

    /* ---------------------------------------------------------------- the sprites */
    function rgb(css: string): RGB {
      const probe = document.createElement('i');
      probe.style.color = css;
      document.body.appendChild(probe);
      const m = getComputedStyle(probe).color.match(/[\d.]+/g) || ['200', '200', '200'];
      probe.remove();
      return m.slice(0, 3).map(Number);
    }
    const mix = (a: RGB, b: RGB, k: number): RGB =>
      a.map((v, i) => Math.round(v + (b[i] - v) * k));
    const rgba = (c: RGB, a: number) => `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${a})`;

    function makePuff(col: RGB) {
      const c = document.createElement('canvas');
      c.width = c.height = 128;
      const g = c.getContext('2d') as CanvasRenderingContext2D;
      const light = mix(col, [255, 255, 255], 0.35);
      const shade = mix(col, [0, 0, 0], 0.45);
      for (let k = 0; k < 7; k++) {
        const r = rnd(22, 38);
        const x = 64 + rnd(-20, 20);
        const y = 64 + rnd(-20, 20);
        const gr = g.createRadialGradient(x, y - r * 0.35, 0, x, y, r);
        gr.addColorStop(0, rgba(light, 0.5));
        gr.addColorStop(0.55, rgba(col, 0.32));
        gr.addColorStop(1, rgba(shade, 0));
        g.fillStyle = gr;
        g.beginPath();
        g.arc(x, y, r, 0, Math.PI * 2);
        g.fill();
      }
      return c;
    }
    function readColors() {
      /* the variables live on the wrapper, not on :root, so read them there */
      const cs = getComputedStyle(root);
      const smoke = rgb(cs.getPropertyValue('--smoke').trim() || '#dcd8d2');
      const flame = rgb(cs.getPropertyValue('--flame').trim() || '#ff8a2b');
      colors = { smoke, flame };
      seed = 42;
      puffs = [0, 1, 2, 3].map(() => makePuff(smoke));
      seed = 42;
      hots = [0, 1, 2, 3].map(() => makePuff(mix(smoke, flame, 0.55)));
    }

    function size() {
      W = window.innerWidth;
      H = window.innerHeight;
      dpr = Math.min(0.75, 0.5 * (window.devicePixelRatio || 1));
      skies.forEach((k) => {
        k.c.width = Math.round(W * dpr);
        k.c.height = Math.round(H * dpr);
        k.clean = true;
      });
    }

    /* ---------------------------------------------------------------- where things are */
    function anchor() {
      const r = pad.getBoundingClientRect();
      const b = btn.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2, s: r.width / 52, floor: b.bottom + 3 };
    }
    function pose(time: number) {
      const k = z.shake * SHAKE;
      const q = Math.min(1, z.lift / climb);
      const rot = LEAN * q * q + noise(time * 31, 5.5) * 2.4 * k;
      const x = z.lift * Math.tan((rot * Math.PI) / 180) * 0.45 + noise(time * 43, 3.1) * 1.4 * k;
      const y = -z.lift + z.rise - z.hover * 3 + noise(time * 47, 9.7) * 0.8 * k;
      return { x, y, rot };
    }

    /* ---------------------------------------------------------------- the particles */
    function puff(x: number, y: number, o: Emit) {
      if (parts.length > 300) return;
      const k = (rnd(0, 4) | 0) % 4;
      parts.push({
        x,
        y,
        ...o,
        age: 0,
        img: puffs[k],
        hot: hots[k],
      });
    }
    function exhaust(a: ReturnType<typeof anchor>) {
      if (rnd() < 0.16) {
        const side = rnd() < 0.5 ? -1 : 1;
        puff(a.x + side * rnd(8, 16) * a.s, a.y + rnd(-4, 10) * a.s, {
          vx: side * rnd(30, 80),
          vy: rnd(-70, -30),
          r0: rnd(4, 7),
          grow: rnd(14, 26),
          life: rnd(0.8, 1.3),
          a0: rnd(0.22, 0.34),
          heat: 1,
          drag: 2.4,
          buoy: 30,
          curl: 0.8,
          front: true,
        });
        return;
      }
      puff(a.x + rnd(-3, 3), a.y + NOZZLE * a.s, {
        vx: rnd(-70, 70),
        vy: rnd(380, 560),
        r0: rnd(7, 11),
        grow: rnd(48, 86),
        life: rnd(2.2, 3.4),
        a0: rnd(0.4, 0.56),
        heat: 1,
        drag: 2.6,
        buoy: rnd(30, 60),
        floor: a.floor,
        curl: 1,
      });
    }
    function vent(a: ReturnType<typeof anchor>) {
      for (let i = 0; i < 4; i++) {
        const side = i % 2 ? 1 : -1;
        puff(a.x + side * 9 * a.s, a.y + 12 * a.s, {
          vx: side * rnd(70, 140),
          vy: rnd(-40, -10),
          r0: rnd(2.5, 4),
          grow: rnd(12, 22),
          life: rnd(0.8, 1.3),
          a0: rnd(0.3, 0.42),
          heat: 0,
          drag: 3.4,
          buoy: 20,
          curl: 0.6,
          front: true,
        });
      }
    }
    function burst(a: ReturnType<typeof anchor>) {
      for (let i = 0; i < 18; i++) {
        const ang = rnd(-Math.PI * 0.92, -Math.PI * 0.08);
        const v = rnd(220, 520);
        sparks.push({
          x: a.x + rnd(-6, 6),
          y: a.y + 10 * a.s,
          vx: Math.cos(ang) * v,
          vy: Math.sin(ang) * v,
          age: 0,
          life: rnd(0.4, 0.9),
        });
      }
    }

    function step(dt: number, time: number) {
      const sc = 0.0065;
      const e = 0.01;
      const drift = time * 0.18;
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.age += dt;
        if (p.age >= p.life) {
          parts[i] = parts[parts.length - 1];
          parts.pop();
          continue;
        }
        const X = p.x * sc + drift;
        const Y = p.y * sc - drift * 0.6;
        const dx = (noise(X + e, Y) - noise(X - e, Y)) / (2 * e);
        const dy = (noise(X, Y + e) - noise(X, Y - e)) / (2 * e);
        const f = 70 * SWIRL * (p.curl || 1) * Math.min(1, p.age * 1.4);
        p.vx += dy * f * dt;
        p.vy += -dx * f * dt - p.buoy * dt;
        const d = Math.exp(-p.drag * dt);
        p.vx *= d;
        p.vy *= d;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.floor && p.y > p.floor) {
          p.y = p.floor;
          const hit = Math.abs(p.vy);
          p.vx += (p.vx >= 0 ? 1 : -1) * hit * rnd(0.7, 1.25);
          p.vy = -hit * 0.06;
          p.drag = Math.min(p.drag, rnd(1.1, 1.7));
        }
      }
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.age += dt;
        if (s.age >= s.life) {
          sparks[i] = sparks[sparks.length - 1];
          sparks.pop();
          continue;
        }
        s.vy += 1100 * dt;
        s.vx *= Math.exp(-1.6 * dt);
        s.x += s.vx * dt;
        s.y += s.vy * dt;
      }
    }

    /* ---------------------------------------------------------------- drawing */
    const f1 = (n: number) => n.toFixed(1);
    function flameD(w: number, L: number, sway: number, y0: number) {
      return (
        `M${f1(-w / 2)} ${f1(y0)}C${f1(-w * 0.8)} ${f1(y0 + L * 0.32)} ${f1(-w * 0.3 + sway * 0.5)} ${f1(y0 + L * 0.72)} ${f1(sway)} ${f1(y0 + L)}` +
        `C${f1(w * 0.3 + sway * 0.5)} ${f1(y0 + L * 0.72)} ${f1(w * 0.8)} ${f1(y0 + L * 0.32)} ${f1(w / 2)} ${f1(y0)}Z`
      );
    }
    function drawFlame(time: number, p: { x: number; y: number; rot: number }) {
      const th = z.throttle;
      if (th < 0.01) {
        flameG.style.display = 'none';
        halo.style.opacity = '0';
        splash.style.opacity = '0';
        return;
      }
      flameG.style.display = '';
      const flick = 0.84 + 0.16 * noise(time * 19, 1.3) + 0.07 * noise(time * 53, 7.7);
      const y0 = 23.4;
      let L = (8 + 52 * th) * flick;
      const w = 6.2 + 4 * th;
      const room = (FLOOR - p.y) / SIZE - y0;
      let hit = 0;
      if (L > room) {
        hit = Math.min(1, (L - room) / 30);
        L = Math.max(2, room);
      }
      const sway = noise(time * 11, 4.2) * w * 0.6;
      fire.setAttribute('d', flameD(w, L, sway, y0));
      core.setAttribute('d', flameD(w * 0.5, L * 0.55, sway * 0.4, y0));
      let kd = '';
      if (th > 0.7 && !hit) {
        for (let k = 1; k <= 3; k++) {
          const cy = y0 + L * (0.15 * k + 0.05);
          const rx = w * 0.16 * (1 - k * 0.15);
          const ry = w * 0.3 * (1 - k * 0.15);
          kd += `M${f1(sway * (k / 4) - rx)} ${f1(cy)}a${f1(rx)} ${f1(ry)} 0 1 0 ${f1(rx * 2)} 0a${f1(rx)} ${f1(ry)} 0 1 0 ${f1(-rx * 2)} 0Z`;
        }
      }
      knots.setAttribute('d', kd);
      knots.style.opacity = Math.max(0, (th - 0.7) * 3).toFixed(2);
      const r = (p.rot * Math.PI) / 180;
      const hx = p.x - Math.sin(r) * (y0 + L * 0.4) * SIZE;
      const hy = p.y + Math.cos(r) * (y0 + L * 0.4) * SIZE;
      halo.setAttribute('cx', f1(hx));
      halo.setAttribute('cy', f1(hy));
      halo.setAttribute('r', f1((L * 0.9 + 22) * SIZE));
      halo.style.opacity = Math.min(1, th * 1.4).toFixed(2);
      splash.setAttribute('rx', f1(24 + 36 * hit * flick));
      splash.style.opacity = (hit * th).toFixed(2);
    }

    function drawSparks(a: ReturnType<typeof anchor>) {
      if (!sparks.length) {
        if (sparkPath.getAttribute('d')) sparkPath.setAttribute('d', '');
        return;
      }
      let d = '';
      for (const s of sparks) {
        const x = (s.x - a.x) / a.s;
        const y = (s.y - a.y) / a.s;
        const k = 1 - s.age / s.life;
        d += `M${f1(x)} ${f1(y)}l${f1((-s.vx * 0.03 * k) / a.s)} ${f1((-s.vy * 0.03 * k) / a.s)}`;
      }
      sparkPath.setAttribute('d', d);
      let k = 0;
      for (const s of sparks) k = Math.max(k, 1 - s.age / s.life);
      sparkPath.style.opacity = k.toFixed(2);
    }

    function drawSmoke() {
      const used = [0, 0];
      for (const p of parts) used[p.front ? 1 : 0] = 1;
      skies.forEach((k, i) => {
        if (!used[i] && k.clean) return;
        k.ctx.setTransform(1, 0, 0, 1, 0, 0);
        k.ctx.clearRect(0, 0, k.c.width, k.c.height);
        k.clean = !used[i];
      });
      for (const p of parts) {
        const ctx = skies[p.front ? 1 : 0].ctx;
        const k = p.age / p.life;
        const r = (p.r0 + p.grow * (1 - Math.exp(-p.age * 1.5))) * dpr;
        const a = p.a0 * Math.min(1, p.age * 9) * (1 - k) * (1 - k);
        if (a < 0.004) continue;
        const warm = (p.heat || 0) * Math.exp(-p.age * 2.2);
        ctx.globalAlpha = a;
        ctx.drawImage(warm > 0.35 ? p.hot : p.img, p.x * dpr - r, p.y * dpr - r, r * 2, r * 2);
      }
      skies.forEach((k) => (k.ctx.globalAlpha = 1));
    }

    /* ---------------------------------------------------------------- every frame */
    const tick = (time: number, delta: number) => {
      if (!colors) return;
      const dt = Math.min(delta / 1000, 1 / 30);
      const a = anchor();
      const p = pose(time);
      rocket.style.transform = `translate(${(a.x - 40).toFixed(2)}px, ${(a.y - 60).toFixed(2)}px) scale(${a.s.toFixed(4)})`;
      rocket.style.visibility = 'visible';
      craft.setAttribute(
        'transform',
        `translate(${p.x.toFixed(2)} ${p.y.toFixed(2)}) rotate(${p.rot.toFixed(2)}) scale(${SIZE})`,
      );
      burn.style.opacity = Math.min(1, z.throttle * 1.2).toFixed(3);
      heatEl.style.opacity = (z.throttle * Math.max(0, 1 - z.lift / 160)).toFixed(3);
      const tremble = REDUCED
        ? 0
        : Math.max(0, z.throttle - 0.3) * 1.4 * Math.max(0, 1 - z.lift / 140) * SHAKE;
      if (tremble > 0.01) {
        gsap.set(btn, { x: noise(time * 37, 2.2) * 1.3 * tremble, y: noise(time * 41, 6.6) * 0.9 * tremble });
        shook = true;
      } else if (shook) {
        gsap.set(btn, { x: 0, y: 0 });
        shook = false;
      }
      if (REDUCED) return;

      const r = (p.rot * Math.PI) / 180;
      const nozzle = {
        x: a.x + a.s * (p.x - Math.sin(r) * NOZZLE),
        y: a.y + a.s * (p.y + Math.cos(r) * NOZZLE),
        ang: r,
      };
      if (z.throttle > 0.5 && nozzle.y > -40) {
        if (z.lift < 4) {
          emitDebt += dt * 95 * SMOKE * z.throttle;
          while (emitDebt >= 1) {
            exhaust(a);
            emitDebt -= 1;
          }
        } else if (lastNozzle) {
          const dist = Math.hypot(nozzle.x - lastNozzle.x, nozzle.y - lastNozzle.y);
          emitDebt += (dist / 8.5 + dt * 34) * SMOKE;
          const n = Math.floor(emitDebt);
          emitDebt -= n;
          const dirx = -Math.sin(r);
          const diry = Math.cos(r);
          for (let k = 0; k < n; k++) {
            const q = (k + rnd()) / Math.max(1, n);
            const px = lastNozzle.x + (nozzle.x - lastNozzle.x) * q;
            const py = lastNozzle.y + (nozzle.y - lastNozzle.y) * q;
            const v = rnd(140, 260);
            puff(px + rnd(-2, 2), py + 6, {
              vx: dirx * v + rnd(-40, 40),
              vy: diry * v,
              r0: rnd(6, 10),
              grow: rnd(26, 52) * (1 + Math.min(1, z.lift / 400)),
              life: rnd(1.8, 3),
              a0: rnd(0.26, 0.38),
              heat: 0.9,
              drag: 3,
              buoy: rnd(14, 30),
              floor: a.floor,
              curl: 1.2,
              front: py < a.y - 70,
            });
          }
        }
      }
      if (z.wisp > 0.02) {
        emitDebt += dt * 28 * z.wisp;
        while (emitDebt >= 1) {
          puff(a.x + rnd(-1.5, 1.5), a.y + 2, {
            vx: rnd(-4, 4),
            vy: rnd(-40, -28),
            r0: rnd(2, 3),
            grow: rnd(9, 15),
            life: rnd(2.4, 3.2),
            a0: rnd(0.16, 0.24) * Math.min(1, z.wisp * 1.5),
            heat: 0,
            drag: 1.4,
            buoy: 46,
            curl: 0.3,
            front: true,
          });
          emitDebt -= 1;
        }
      }
      lastNozzle = nozzle;
      step(dt, time);
      drawFlame(time, p);
      drawSparks(a);
      drawSmoke();
    };
    /* GSAP drives the tweened values; an rAF loop draws from them every frame.
       (GSAP's own ticker can go to sleep when no tween is active, which would
       leave the rocket frozen on the pad.) */
    let rafId = 0;
    let lastTs = 0;
    const frame = (ts: number) => {
      const delta = lastTs ? ts - lastTs : 1000 / 60;
      lastTs = ts;
      tick(gsap.ticker.time || ts / 1000, delta);
      rafId = requestAnimationFrame(frame);
    };
    rafId = requestAnimationFrame(frame);

    /* ---------------------------------------------------------------- the words */
    function hint(text: string, back?: number) {
      if (hintTl) hintTl.kill();
      if (hintBack) hintBack.kill();
      hintBack = back ? gsap.delayedCall(back, () => hint(HINT)) : null;
      if (hintEl.textContent === text) return;
      if (REDUCED) {
        hintEl.textContent = text;
        return;
      }
      hintTl = gsap
        .timeline()
        .to(hintEl, { y: -6, opacity: 0, duration: 0.14, ease: 'power2.in' })
        .add(() => (hintEl.textContent = text))
        .fromTo(hintEl, { y: 6, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, ease: 'power3.out' });
    }
    function swap(tl_: gsap.core.Timeline, from: HTMLElement, to: HTMLElement, at: number) {
      if (REDUCED) {
        tl_.to(from, { autoAlpha: 0, duration: 0.2 }, at).fromTo(
          to,
          { autoAlpha: 0, yPercent: 0 },
          { autoAlpha: 1, duration: 0.25 },
          at + 0.1,
        );
        return;
      }
      tl_.to(from, { yPercent: -100, autoAlpha: 0, duration: 0.3, ease: 'power2.in' }, at).fromTo(
        to,
        { yPercent: 100, autoAlpha: 0 },
        { yPercent: 0, autoAlpha: 1, duration: 0.45, ease: 'power3.out' },
        at + 0.12,
      );
    }

    const digits = Array.from(reel.children) as HTMLElement[];

    /* ---------------------------------------------------------------- the launch */
    function start() {
      state = 'counting';
      if (tl) tl.kill();
      if (backCall) backCall.kill();
      readColors();
      btn.setAttribute('aria-label', t.ariaAbort);
      hint(t.hintCount);
      live.textContent = `${t.liveCountdown} ${NUMBERS}`;
      gsap.set(reel, { yPercent: 0 });
      gsap.set(digits, { opacity: 1 });
      tl = gsap.timeline();
      swap(tl, lines.idle, lines.count, 0);
      tl.fromTo(
        ring,
        { strokeDashoffset: 1, opacity: 1 },
        { strokeDashoffset: 0, duration: NUMBERS * BEAT, ease: 'none', autoRound: false },
        0,
      );
      if (!REDUCED) tl.to(z, { shake: 0.6, hover: 0, duration: NUMBERS * BEAT, ease: 'power1.in' }, 0);
      for (let i = 1; i < NUMBERS; i++) {
        if (REDUCED) tl.set(reel, { yPercent: (-100 * i) / NUMBERS }, i * BEAT);
        else tl.to(reel, { yPercent: (-100 * i) / NUMBERS, duration: 0.5, ease: 'expo.out' }, i * BEAT);
        tl.add(() => (live.textContent = String(NUMBERS - i)), i * BEAT);
        if (!REDUCED) tl.fromTo(pad, { scale: 1.07 }, { scale: 1, duration: 0.45, ease: 'power3.out' }, i * BEAT);
      }
      if (!REDUCED) [0.15, 0.45, 0.65].forEach((k) => tl!.add(() => vent(anchor()), (NUMBERS - 1 + k) * BEAT));
      tl.add(ignite, NUMBERS * BEAT);
    }

    function ignite() {
      state = 'flying';
      btn.setAttribute('aria-disabled', 'true');
      btn.setAttribute('aria-label', t.ariaFlying);
      hint(t.hintFly);
      live.textContent = t.liveLiftoff;
      const a = anchor();
      climb = (a.y + 180) / a.s;
      tl = gsap.timeline({ onComplete: launched });
      tl.to(ring, { opacity: 0, duration: 0.5, ease: 'power2.out' }, 0);
      const at = REDUCED ? 0.15 : HOLD + 0.05;
      swap(tl, lines.count, lines.done, at);
      tl.fromTo(
        check,
        { strokeDashoffset: 1 },
        { strokeDashoffset: 0, duration: 0.45, ease: 'power2.out', autoRound: false },
        at + 0.3,
      );
      if (REDUCED) {
        tl.to(craft, { opacity: 0, duration: 0.5, ease: 'power1.inOut' }, 0.1);
        return;
      }
      emitDebt = 0;
      lastNozzle = null;
      burst(a);
      tl.to(z, { throttle: 1, duration: 0.18, ease: 'power2.out' }, 0)
        .to(z, { shake: 1, duration: 0.15 }, 0)
        .to(z, { lift: climb, duration: FLIGHT, ease: 'power2.in' }, HOLD)
        .to(z, { shake: 0.15, duration: 0.6, ease: 'power1.out' }, HOLD + 0.2)
        .set(z, { throttle: 0, shake: 0 }, HOLD + FLIGHT);
    }

    /* the rocket is gone: this replaces the old link, so take the visitor home */
    function launched() {
      state = 'done';
      btn.removeAttribute('aria-disabled');
      btn.setAttribute('aria-label', t.ariaDone);
      hint(t.hintDone);
      live.textContent = t.liveDone;
      if (!REDUCED) {
        gsap.set(z, { lift: 0, rise: 60 });
        gsap.fromTo(z, { wisp: 1 }, { wisp: 0, duration: DONE + 0.4, ease: 'power1.in' });
      }
      router.push('/');
    }

    function rearm() {
      if (tl) tl.kill();
      if (backCall) backCall.kill();
      backCall = null;
      state = 'rearming';
      btn.setAttribute('aria-label', LABEL);
      hint(HINT);
      live.textContent = '';
      tl = gsap.timeline({ onComplete: () => (state = 'idle') });
      swap(tl, lines.done, lines.idle, 0);
      tl.set(ring, { strokeDashoffset: 1, opacity: 1 }, 0);
      if (REDUCED) {
        tl.set(z, { lift: 0, rise: 0, throttle: 0, shake: 0 }, 0).to(craft, { opacity: 1, duration: 0.5 }, 0.1);
        return;
      }
      tl.set(craft, { opacity: 1 }, 0)
        .to(z, { wisp: 0, duration: 0.3 }, 0)
        .fromTo(z, { rise: 60 }, { rise: 0, duration: 0.9, ease: 'back.out(1.3)' }, 0.15);
    }

    function abort() {
      if (tl) tl.kill();
      state = 'rearming';
      btn.setAttribute('aria-label', LABEL);
      hint(t.hintAbort, 2.2);
      live.textContent = t.liveAbort;
      tl = gsap.timeline({ onComplete: () => (state = 'idle') });
      swap(tl, lines.count, lines.idle, 0);
      tl.to(ring, { strokeDashoffset: 1, duration: REDUCED ? 0.01 : 0.45, ease: 'power2.inOut', autoRound: false }, 0)
        .to(z, { shake: 0, duration: 0.3 }, 0)
        .to(pad, { scale: 1, duration: 0.2 }, 0);
    }

    function act() {
      if (state === 'idle') start();
      else if (state === 'counting') abort();
      else if (state === 'done') rearm();
    }

    /* ---------------------------------------------------------------- hands and keys */
    const onClick = () => act();
    function stir(on: boolean) {
      if (REDUCED || state !== 'idle') return;
      gsap.to(z, {
        hover: on ? 1 : 0,
        throttle: on ? 0.14 : 0,
        duration: on ? 0.35 : 0.3,
        ease: 'power2.out',
        overwrite: 'auto',
      });
      if (on && !colors) readColors();
    }
    const onPointerEnter = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') stir(true);
    };
    const onPointerLeave = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') stir(false);
    };
    const onFocus = () => {
      if (btn.matches(':focus-visible')) stir(true);
    };
    const onBlur = () => stir(false);
    const onPointerDown = () => {
      if (!REDUCED && state !== 'flying') gsap.to(btn, { scale: 0.975, duration: 0.12, ease: 'power2.out', overwrite: 'auto' });
    };
    const letGo = () => {
      if (!REDUCED) gsap.to(btn, { scale: 1, duration: 0.5, ease: 'power3.out', overwrite: 'auto' });
    };
    const markKeys = () => (document.documentElement.dataset.using = 'keys');
    const markPointer = () => (document.documentElement.dataset.using = 'pointer');

    btn.addEventListener('click', onClick);
    btn.addEventListener('pointerenter', onPointerEnter);
    btn.addEventListener('pointerleave', onPointerLeave);
    btn.addEventListener('focus', onFocus);
    btn.addEventListener('blur', onBlur);
    btn.addEventListener('pointerdown', onPointerDown);
    ['pointerup', 'pointerleave', 'pointercancel'].forEach((evt) => btn.addEventListener(evt, letGo));
    window.addEventListener('keydown', markKeys, true);
    window.addEventListener('pointerdown', markPointer, true);
    window.addEventListener('resize', size);

    size();
    readColors();
    if (!REDUCED) z.rise = 60;
    document.fonts.ready.then(() => {
      if (cancelled || REDUCED) return;
      gsap.from(btn, { y: 16, opacity: 0, duration: 0.8, ease: 'power3.out', clearProps: 'opacity' });
      gsap.from(hintEl.parentNode as HTMLElement, {
        y: 8,
        opacity: 0,
        duration: 0.6,
        delay: 0.15,
        ease: 'power3.out',
        clearProps: 'transform,opacity',
      });
      gsap.to(z, { rise: 0, duration: 1, delay: 0.35, ease: 'back.out(1.3)' });
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      if (tl) tl.kill();
      if (backCall) backCall.kill();
      if (hintTl) hintTl.kill();
      if (hintBack) hintBack.kill();
      gsap.killTweensOf(z);
      gsap.killTweensOf(btn);
      gsap.killTweensOf(pad);
      btn.removeEventListener('click', onClick);
      btn.removeEventListener('pointerenter', onPointerEnter);
      btn.removeEventListener('pointerleave', onPointerLeave);
      btn.removeEventListener('focus', onFocus);
      btn.removeEventListener('blur', onBlur);
      btn.removeEventListener('pointerdown', onPointerDown);
      ['pointerup', 'pointerleave', 'pointercancel'].forEach((evt) => btn.removeEventListener(evt, letGo));
      window.removeEventListener('keydown', markKeys, true);
      window.removeEventListener('pointerdown', markPointer, true);
      window.removeEventListener('resize', size);
      delete document.documentElement.dataset.using;
    };
  }, [locale, router]);

  return (
    <div className={styles.wrapper} ref={rootRef}>
      <canvas className={`${styles.sky} ${styles.skyBack}`} data-sky="back" aria-hidden="true" />

      <div className={styles.stage}>
        <div className={styles.launch} data-launch>
          <button
            className={styles.btn}
            type="button"
            aria-label={COPY[locale].label}
            data-btn
          >
            <span className={styles.heat} data-heat aria-hidden="true" />
            <span className={styles.pad} data-pad aria-hidden="true">
              <svg className={styles.ring} viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="30" pathLength="1" data-ring />
              </svg>
            </span>
            <span className={styles.label} aria-hidden="true">
              <span className={styles.line} data-line="idle">
                {COPY[locale].label}
              </span>
              <span className={`${styles.line} ${styles.lineCount}`} data-line="count">
                {COPY[locale].counting}
                <span className={styles.digits}>
                  <span className={styles.reel} data-reel>
                    {Array.from({ length: COUNT }, (_, i) => (
                      <span key={i}>{COUNT - i}</span>
                    ))}
                  </span>
                </span>
              </span>
              <span className={`${styles.line} ${styles.lineDone}`} data-line="done">
                <svg className={styles.check} viewBox="0 0 24 24">
                  <path d="M5 12.6l4.3 4.3L19 7.2" pathLength="1" data-check />
                </svg>
                {COPY[locale].launched}
              </span>
            </span>
          </button>
          <p className={styles.hint}>
            <span data-hint>{COPY[locale].hint}</span>
          </p>
          <p className={styles.sr} aria-live="polite" data-live />
        </div>
      </div>

      <canvas className={styles.sky} data-sky="front" aria-hidden="true" />

      <svg className={styles.rocket} data-rocket viewBox="-40 -60 80 120" aria-hidden="true">
        <defs>
          <linearGradient id="rk-hull" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" className="rocket__hull-a" />
            <stop offset="0.38" className="rocket__hull-b" />
            <stop offset="0.72" className="rocket__hull-c" />
            <stop offset="1" className="rocket__hull-d" />
          </linearGradient>
          <linearGradient id="rk-fin" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" className="rocket__fin-a" />
            <stop offset="1" className="rocket__fin-b" />
          </linearGradient>
          <linearGradient id="rk-metal" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#5b6070" />
            <stop offset="0.45" stopColor="#b9bdc8" />
            <stop offset="1" stopColor="#3d414d" />
          </linearGradient>
          <linearGradient id="rk-heat" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0.35" className="rocket__heat-a" />
            <stop offset="1" className="rocket__heat-b" />
          </linearGradient>
          <radialGradient id="rk-glow">
            <stop offset="0" className="rocket__glow-a" />
            <stop offset="0.35" className="rocket__glow-m" />
            <stop offset="1" className="rocket__glow-b" />
          </radialGradient>
          <linearGradient id="rk-flame" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
            <stop offset="0" className="rocket__flame-a" />
            <stop offset="0.3" className="rocket__flame-b" />
            <stop offset="1" className="rocket__flame-c" />
          </linearGradient>
          <linearGradient id="rk-core" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
            <stop offset="0" stopColor="#fff" />
            <stop offset="0.5" className="rocket__core-a" />
            <stop offset="1" className="rocket__core-b" />
          </linearGradient>
          <clipPath id="rk-body">
            <path d="M0 -27C7.4 -21 10.2 -10 10.2 3.5L9.2 15.2Q9 17.4 6.9 17.4H-6.9Q-9 17.4 -9.2 15.2L-10.2 3.5C-10.2 -10 -7.4 -21 0 -27Z" />
          </clipPath>
          <clipPath id="rk-silo" clipPathUnits="userSpaceOnUse">
            <path d="M-600 -6000H600V0H26A26 26 0 0 1 -26 0H-600Z" />
          </clipPath>
        </defs>
        <circle className="rocket__halo" r="1" data-halo />
        <ellipse className="rocket__splash" cx="0" cy="25" rx="40" ry="8" data-splash />
        <g clipPath="url(#rk-silo)">
          <g data-craft>
            <g className="rocket__flame" data-flame>
              <path className="rocket__fire" data-fire />
              <path className="rocket__core" data-core />
              <path className="rocket__knots" data-knots />
            </g>
            <path className="rocket__fin" d="M-9.4 1.5C-14.8 5.6 -17.6 11.6 -17.4 20.6L-9 15.6Z" />
            <path className="rocket__fin" d="M9.4 1.5C14.8 5.6 17.6 11.6 17.4 20.6L9 15.6Z" />
            <path className="rocket__nozzle" d="M-5.2 17.2H5.2L6.8 23.4Q6.9 24.2 6.1 24.2H-6.1Q-6.9 24.2 -6.8 23.4Z" />
            <path
              className="rocket__hull"
              d="M0 -27C7.4 -21 10.2 -10 10.2 3.5L9.2 15.2Q9 17.4 6.9 17.4H-6.9Q-9 17.4 -9.2 15.2L-10.2 3.5C-10.2 -10 -7.4 -21 0 -27Z"
            />
            <g clipPath="url(#rk-body)">
              <rect className="rocket__cap" x="-12" y="-30" width="24" height="15.5" />
              <rect className="rocket__band" x="-12" y="8.2" width="24" height="2" />
              <rect className="rocket__burn" x="-12" y="-4" width="24" height="24" data-burn />
            </g>
            <path className="rocket__keel" d="M-1.3 9.5H1.3V22.2Q1.3 23.4 0 23.4Q-1.3 23.4 -1.3 22.2Z" />
            <circle className="rocket__rim" cx="0" cy="-4" r="5.2" />
            <circle className="rocket__glass" cx="0" cy="-4" r="3.6" />
            <path className="rocket__shine" d="M-2.2 -5.6A2.6 2.6 0 0 1 0.2 -6.9" />
          </g>
        </g>
        <path className="rocket__sparks" data-sparks />
      </svg>
    </div>
  );
}
