'use client';

/*
  "The dot matrix sign button" from Animorio · https://animorio.com
  License: free on your own sites and your clients' sites, paid work included.
  Not for resale, redistribution, templates or code collections · https://animorio.com/en/license/

  Copie exacte de index.html / style.css / script.js fournis par Animorio.
  Seul le contenu est adapté (nom du produit, marque et sous-titre via les props).
*/

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import styles from './DotMatrixSignButton.module.css';

/* ---- valeurs da cambiare (contenu adapté via props) ---- */
const WAVE = 0.016; /* seconds between one column lighting up and the next */
const SPEED = 46; /* how many columns the sign scrolls in a second */
const HOLD = 1.6; /* seconds the second words stay before the sign scrolls back */
const SETTLE = 1.7; /* how far a cell flares past full before it settles (0 none) */

export interface DotMatrixSignButtonProps {
  /** the words on the sign at rest */
  label?: string;
  /** the words the sign scrolls to when you press it */
  done?: string;
  /** small brand line above the sign */
  brand?: string;
  /** the small line under the sign */
  note?: string;
  /** the small line while the second words show */
  noteDone?: string;
  className?: string;
}

export const DotMatrixSignButton: React.FC<DotMatrixSignButtonProps> = ({
  label = 'OPEN NOW',
  done = 'SEE YOU',
  brand = 'Corvo Diner',
  note = 'Kitchen open till eleven',
  noteDone = 'Thanks for coming by',
  className = '',
}) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const signRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const noteRef = useRef<HTMLParagraphElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const liveRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const HOVER = window.matchMedia('(hover: hover)').matches;
    const root = rootRef.current;
    const btn = btnRef.current;
    const canvas = canvasRef.current;
    const noteEl = noteRef.current;
    const labelEl = labelRef.current;
    const live = liveRef.current;
    if (!root || !btn || !canvas || !noteEl || !labelEl || !live) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const LABEL = label;
    const DONE = done;
    const NOTE = note;
    const NOTE_DONE = noteDone;

    noteEl.textContent = NOTE;
    labelEl.textContent = LABEL;

    /* a 5 by 7 font drawn by hand: one string per glyph, rows split by a bar, # for a lit cell */
    const FONT: Record<string, string> = {
      A: '.###.|#...#|#...#|#####|#...#|#...#|#...#', B: '####.|#...#|#...#|####.|#...#|#...#|####.',
      C: '.###.|#...#|#....|#....|#....|#...#|.###.', D: '####.|#...#|#...#|#...#|#...#|#...#|####.',
      E: '#####|#....|#....|####.|#....|#....|#####', F: '#####|#....|#....|####.|#....|#....|#....',
      G: '.###.|#...#|#....|#.###|#...#|#...#|.####', H: '#...#|#...#|#...#|#####|#...#|#...#|#...#',
      I: '.###.|..#..|..#..|..#..|..#..|..#..|.###.', J: '..###|...#.|...#.|...#.|...#.|#..#.|.##..',
      K: '#...#|#..#.|#.#..|##...|#.#..|#..#.|#...#', L: '#....|#....|#....|#....|#....|#....|#####',
      M: '#...#|##.##|#.#.#|#.#.#|#...#|#...#|#...#', N: '#...#|#...#|##..#|#.#.#|#..##|#...#|#...#',
      O: '.###.|#...#|#...#|#...#|#...#|#...#|.###.', P: '####.|#...#|#...#|####.|#....|#....|#....',
      Q: '.###.|#...#|#...#|#...#|#.#.#|#..#.|.##.#', R: '####.|#...#|#...#|####.|#.#..|#..#.|#...#',
      S: '.####|#....|#....|.###.|....#|....#|####.', T: '#####|..#..|..#..|..#..|..#..|..#..|..#..',
      U: '#...#|#...#|#...#|#...#|#...#|#...#|.###.', V: '#...#|#...#|#...#|#...#|#...#|.#.#.|..#..',
      W: '#...#|#...#|#...#|#.#.#|#.#.#|#.#.#|.#.#.', X: '#...#|#...#|.#.#.|..#..|.#.#.|#...#|#...#',
      Y: '#...#|#...#|.#.#.|..#..|..#..|..#..|..#..', Z: '#####|....#|...#.|..#..|.#...|#....|#####',
      '0': '.###.|#...#|#..##|#.#.#|##..#|#...#|.###.', '1': '..#..|.##..|..#..|..#..|..#..|..#..|.###.',
      '2': '.###.|#...#|....#|...#.|..#..|.#...|#####', '3': '####.|....#|....#|.###.|....#|....#|####.',
      '4': '...#.|..##.|.#.#.|#..#.|#####|...#.|...#.', '5': '#####|#....|####.|....#|....#|#...#|.###.',
      '6': '.###.|#....|#....|####.|#...#|#...#|.###.', '7': '#####|....#|...#.|..#..|.#...|.#...|.#...',
      '8': '.###.|#...#|#...#|.###.|#...#|#...#|.###.', '9': '.###.|#...#|#...#|.####|....#|....#|.###.',
      '!': '#|#|#|#|#|.|#', '?': '.###.|#...#|....#|...#.|..#..|.....|..#..', '.': '.|.|.|.|.|.|#',
      ',': '..|..|..|..|..|.#|#.', "'": '#|#|.|.|.|.|.', '-': '....|....|....|####|....|....|....',
      ':': '.|#|.|.|.|#|.', '&': '.##..|#..#.|#.#..|.#...|#.#.#|#..#.|.##.#', ' ': '...|...|...|...|...|...|...',
    };
    const ROWS = 7;
    const PAD = 1;
    const GAP = 6;

    /* a message as a list of columns, each a list of 7 booleans */
    const columns = (text: string) => {
      const out: boolean[][] = [];
      String(text)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
        .split('')
        .forEach((ch, i) => {
          const g = (FONT[ch] || FONT['?']).split('|');
          if (i > 0) out.push(new Array(ROWS).fill(false));
          for (let x = 0; x < g[0].length; x += 1) out.push(g.map((row) => row[x] === '#'));
        });
      return out;
    };

    const a = columns(LABEL);
    const b = columns(DONE);
    const W = Math.max(a.length, b.length) + 2 * PAD;
    const centred = (cols: boolean[][]) => {
      const left = Math.floor((W - cols.length) / 2);
      const out: boolean[][] = [];
      for (let x = 0; x < W; x += 1) out.push(cols[x - left] || new Array(ROWS).fill(false));
      return out;
    };
    const blank = (n: number) => Array.from({ length: n }, () => new Array(ROWS).fill(false));
    /* the strip: Open now, a gap, See you, a gap and Open now again, so the scroll always goes on to the left */
    const strip = [...centred(a), ...blank(GAP), ...centred(b), ...blank(GAP), ...centred(a)];
    const STEP = W + GAP;
    const H = ROWS + 2 * PAD;

    const st = { light: 0, scroll: 0, press: 0 };
    let busy = false;
    let hovered = false;
    let cell = 8;
    let dpr = 1;
    /* Le ticker ne dessine qu'une fois le canvas dimensionné ET les couleurs lues. */
    let ready = false;

    const css = getComputedStyle(root);
    const colour = (name: string) => css.getPropertyValue(name).trim();
    /* Valeurs par défaut cohérentes avec la feuille de style : le ticker GSAP
       est enregistré avant le premier fit, donc draw() peut être appelé alors
       que les variables CSS n'ont pas encore été lues. */
    const DEFAULT_OFF = '#161616';
    const DEFAULT_DIM = '#3a3732';
    const DEFAULT_LIT = '#ffb13d';
    const DEFAULT_HI = '#ffd78f';
    const hex = (value: string, fallback: string) => {
      const clean = String(value || '').trim().replace(/^#/, '');
      const normalised = /^[0-9a-f]{3}$/i.test(clean)
        ? clean
            .split('')
            .map((ch) => ch + ch)
            .join('')
        : clean;
      const source = /^[0-9a-f]{6}$/i.test(normalised) ? normalised : fallback.replace(/^#/, '');
      return [0, 2, 4].map((i) => parseInt(source.slice(i, i + 2), 16));
    };
    const mix = (p: number[], q: number[], t: number) => p.map((c, i) => Math.round(c + (q[i] - c) * t));
    const rgb = (c: number[]) => 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')';
    let OFF = hex(DEFAULT_OFF, DEFAULT_OFF);
    let DIM = hex(DEFAULT_DIM, DEFAULT_DIM);
    let LIT = hex(DEFAULT_LIT, DEFAULT_LIT);
    let HI = hex(DEFAULT_HI, DEFAULT_HI);
    /* Lecture indépendante du dimensionnement : même si le canvas n'a pas
       encore de largeur, les couleurs restent définies. */
    const readColours = () => {
      OFF = hex(colour('--cella-spenta'), DEFAULT_OFF);
      DIM = hex(colour('--cella-lettera'), DEFAULT_DIM);
      LIT = hex(colour('--accento'), DEFAULT_LIT);
      HI = hex(colour('--accento-chiaro'), DEFAULT_HI);
    };
    readColours();

    const fit = () => {
      const w = canvas.clientWidth || canvas.parentElement?.clientWidth || 0;
      if (w <= 0) return;
      cell = w / W;
      const h = Math.round(cell * H);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.height = h + 'px';
      readColours();
      ready = true;
      draw();
    };

    /* how lit one column is: the wave reaches it, the cell flares past full on back.out and settles */
    const backOut = (x: number) => {
      const c1 = SETTLE;
      const c3 = c1 + 1;
      return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
    };
    const litFor = (col: number) => {
      if (REDUCED) return st.light;
      const span = 6;
      const pos = st.light * (W + span) - col;
      const x = Math.max(0, Math.min(1, pos / span));
      return x <= 0 ? 0 : backOut(x);
    };

    function draw() {
      if (!ready) return;
      const c = cell * dpr;
      const gap = Math.max(1, Math.round(c * 0.2));
      const size = c - gap;
      const r = Math.min(size * 0.16, 2 * dpr);
      const off = Math.floor(st.scroll);
      ctx.clearRect(0, 0, canvas!.width, canvas!.height);
      for (let x = 0; x < W; x += 1) {
        const col = strip[x + off] || strip[x];
        const k = litFor(x);
        for (let y = 0; y < H; y += 1) {
          const on = y >= PAD && y < PAD + ROWS && col[y - PAD];
          const px = x * c + gap / 2;
          const py = y * c + gap / 2;
          let fill = OFF;
          if (on) fill = k > 1 ? mix(LIT, HI, Math.min(1, (k - 1) * 4)) : mix(DIM, LIT, Math.max(0, k));
          ctx.fillStyle = rgb(fill);
          ctx.beginPath();
          if (typeof (ctx as CanvasRenderingContext2D & { roundRect?: unknown }).roundRect === 'function') {
            (ctx as CanvasRenderingContext2D & { roundRect: (x: number, y: number, w: number, h: number, r: number) => void }).roundRect(px, py, size, size, r);
          } else ctx.rect(px, py, size, size);
          ctx.fill();
          /* a lit cell has a lighter core, so it reads as a little square lamp, not a flat dot */
          if (on && k > 0.4) {
            const inset = size * 0.3;
            ctx.fillStyle = 'rgba(' + HI.join(',') + ',' + Math.min(0.55, (k - 0.4) * 0.9).toFixed(3) + ')';
            ctx.fillRect(px + inset, py + inset, size - 2 * inset, size - 2 * inset);
          }
        }
      }
    }

    gsap.ticker.add(draw);

    const lightOn = () => gsap.to(st, { light: 1, duration: REDUCED ? 0.25 : WAVE * (W + 6) + 0.3, ease: 'none', overwrite: 'auto' });
    const lightOff = () => gsap.to(st, { light: 0, duration: REDUCED ? 0.25 : 0.45, ease: 'power2.in', overwrite: 'auto' });

    const setLit = (on: boolean) => btn.classList.toggle(styles.isLit, on);

    const onEnter = () => {
      hovered = true;
      setLit(true);
      if (!busy) lightOn();
    };
    const onLeave = () => {
      hovered = false;
      if (!busy) {
        setLit(false);
        lightOff();
      }
    };

    if (HOVER) {
      btn.addEventListener('pointerenter', onEnter);
      btn.addEventListener('pointerleave', onLeave);
    }

    const swapNote = (text: string, isDone: boolean) => {
      if (REDUCED) {
        gsap.to(noteEl, {
          opacity: 0,
          duration: 0.15,
          onComplete: () => {
            noteEl.textContent = text;
            noteEl.classList.toggle(styles.isDone, isDone);
            gsap.to(noteEl, { opacity: 1, duration: 0.2 });
          },
        });
        return;
      }
      gsap
        .timeline()
        .to(noteEl, { yPercent: -60, opacity: 0, duration: 0.16, ease: 'power2.in' })
        .add(() => {
          noteEl.textContent = text;
          noteEl.classList.toggle(styles.isDone, isDone);
        })
        .fromTo(noteEl, { yPercent: 70, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.5, ease: 'back.out(2)' });
    };

    let timeline: gsap.core.Timeline | undefined;
    const run = () => {
      if (busy) return;
      busy = true;
      btn.setAttribute('aria-pressed', 'true');
      setLit(true);
      live.textContent = DONE;
      const travel = STEP / SPEED;
      timeline = gsap.timeline({
        onComplete: () => {
          st.scroll = 0;
          busy = false;
          btn.setAttribute('aria-pressed', 'false');
          live.textContent = LABEL;
          if (!hovered) {
            setLit(false);
            lightOff();
          }
        },
      });
      if (!REDUCED) {
        timeline
          .to(btn, { scale: 0.975, duration: 0.09, ease: 'power2.out' }, 0)
          .to(btn, { scale: 1, duration: 0.7, ease: 'elastic.out(1, 0.45)' }, 0.09);
      }
      if (st.light < 0.99) timeline.add(lightOn(), 0);
      const start = st.light < 0.99 ? WAVE * (W + 6) + 0.3 : 0.12;
      if (REDUCED) {
        timeline
          .to(st, { scroll: STEP, duration: 0.01 }, start)
          .add(() => swapNote(NOTE_DONE, true), start)
          .to(st, { scroll: 2 * STEP, duration: 0.01 }, start + HOLD + 0.6)
          .add(() => swapNote(NOTE, false), start + HOLD + 0.6)
          .to({}, { duration: 0.3 });
        return;
      }
      timeline
        .to(st, { scroll: STEP, duration: travel, ease: 'none' }, start)
        .add(() => swapNote(NOTE_DONE, true), start + travel * 0.6)
        .to(st, { scroll: 2 * STEP, duration: travel, ease: 'none' }, start + travel + HOLD)
        .add(() => swapNote(NOTE, false), start + travel * 1.6 + HOLD)
        .to({}, { duration: 0.15 });
    };

    btn.addEventListener('click', run);

    const observer = new ResizeObserver(fit);
    observer.observe(btn);
    observer.observe(root);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
    fit();

    /* the entrance: use gsap.context + fromTo so React StrictMode double-mount never locks opacity at 0 */
    const gsapCtx = gsap.context(() => {
      if (!REDUCED) {
        const sign = signRef.current;
        if (sign) {
          gsap.fromTo(
            Array.from(sign.children),
            { opacity: 0, y: 8 },
            {
              opacity: 1,
              y: 0,
              duration: 0.8,
              ease: 'power3.out',
              stagger: 0.08,
              clearProps: 'opacity,transform',
            }
          );
        }
      }
    }, rootRef);

    return () => {
      gsap.ticker.remove(draw);
      observer.disconnect();
      btn.removeEventListener('pointerenter', onEnter);
      btn.removeEventListener('pointerleave', onLeave);
      btn.removeEventListener('click', run);
      timeline?.kill();
      gsapCtx.revert();
      gsap.killTweensOf([st, btn, noteEl, root]);
    };
  }, [label, done, note, noteDone]);

  return (
    <div ref={rootRef} className={`${styles.root} ${className}`}>
      <div className={styles.stage}>
        <div className={styles.sign} data-sign ref={signRef}>
          <p className={styles.brand} data-text-key="signBrand">{brand}</p>
          <button
            ref={btnRef}
            className={styles.btn}
            type="button"
            data-btn
            data-autoclic
            aria-pressed="false"
          >
            <span className={styles.glass} aria-hidden="true" />
            <canvas ref={canvasRef} className={styles.cells} data-cells aria-hidden="true" />
            <span className={styles.sr} ref={labelRef} data-label>
              {label}
            </span>
          </button>
          <p className={styles.note} ref={noteRef} data-note data-text-key="signNote">
            {note}
          </p>
          <p className={styles.sr} ref={liveRef} aria-live="polite" data-live />
        </div>
      </div>
    </div>
  );
};
