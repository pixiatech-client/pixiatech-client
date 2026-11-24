'use client';

import React, { useEffect, useRef } from 'react';

// ---------------------------------------------------------------------------
// Police 5×7 hand-drawn — lettres A–Z, chiffres 0–9, ponctuation + espace
// Chaque caractère : 7 lignes séparées par '|', '#' = pixel allumé, '.' = off
// Source : Animorio dot-matrix-sign (reproduit fidèlement)
// ---------------------------------------------------------------------------
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
  '!': '#|#|#|#|#|.|#', '?': '.###.|#...#|....#|...#.|..#..|.....|..#..',
  '.': '.|.|.|.|.|.|#', ',': '..|..|..|..|..|.#|#.', "'": '#|#|.|.|.|.|.',
  '-': '....|....|....|####|....|....|....', ':': '.|#|.|.|.|#|.',
  '&': '.##..|#..#.|#.#..|.#...|#.#.#|#..#.|.##.#', ' ': '...|...|...|...|...|...|...',
  '(': '..#|.#.|#..|#..|#..|.#.|..#', ')': '#..|.#.|..#|..#|..#|.#.|#..',
  '/': '....#|...#.|..#..|.#...|#....', '+': '..#..|..#..|#####|..#..|..#..',
};

const ROWS = 7;   // hauteur d'un glyphe en pixels
const PAD = 1;    // rangées de cellules vides au-dessus et en dessous
const H = ROWS + 2 * PAD; // hauteur totale en cellules : 9

// ---------------------------------------------------------------------------
// Conversion texte → colonnes de booléens
// ---------------------------------------------------------------------------
function textToColumns(str: string): boolean[][] {
  const out: boolean[][] = [];
  str.toUpperCase().split('').forEach((ch, i) => {
    const glyph = FONT[ch] || FONT['?'];
    const rows = glyph.split('|');
    const w = rows[0].length;
    if (i > 0) out.push(new Array(ROWS).fill(false)); // espace inter-lettres
    for (let x = 0; x < w; x++) {
      out.push(rows.map(row => row[x] === '#'));
    }
  });
  return out;
}

// Centre les colonnes dans une grille de largeur W (ajoute du padding)
function centreColumns(cols: boolean[][], W: number): boolean[][] {
  const left = Math.floor((W - cols.length) / 2);
  const result: boolean[][] = [];
  for (let x = 0; x < W; x++) {
    result.push(cols[x - left] ?? new Array(ROWS).fill(false));
  }
  return result;
}

// ---------------------------------------------------------------------------
// Helpers couleur
// ---------------------------------------------------------------------------
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '').replace(/^(\w)(\w)(\w)$/, '$1$1$2$2$3$3');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function mixRgb(a: [number, number, number], b: [number, number, number], t: number): string {
  const r = Math.round(a[0] + (b[0] - a[0]) * t);
  const g = Math.round(a[1] + (b[1] - a[1]) * t);
  const bl = Math.round(a[2] + (b[2] - a[2]) * t);
  return `rgb(${r},${g},${bl})`;
}

// easing backOut : surbrillance légère avant retomber → effet "flare"
const SETTLE = 1.7;
function backOut(x: number): number {
  const c1 = SETTLE;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

// ---------------------------------------------------------------------------
// Composant
// ---------------------------------------------------------------------------
interface LedCanvasTextProps {
  label?: string;
  className?: string;
}

export const LedCanvasText: React.FC<LedCanvasTextProps> = ({
  label = 'PXT Fine',
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let animId = 0;
    let lastLabel = '';
    let lastWidth = 0;

    // ---- lecture des couleurs CSS theme ----
    const readColors = () => {
      const cs = getComputedStyle(document.documentElement);
      const rawAccent = cs.getPropertyValue('--accent').trim() || '#ff8c00';
      // normalisation : accepte hex 3 ou 6 chiffres, ou rgb(…) → on force hex
      let accentHex = rawAccent;
      if (rawAccent.startsWith('rgb')) {
        // rgb(r,g,b) → hex
        const m = rawAccent.match(/\d+/g);
        if (m && m.length >= 3) {
          accentHex = '#' + m.slice(0, 3).map(n => parseInt(n).toString(16).padStart(2, '0')).join('');
        }
      }
      return {
        OFF: hexToRgb('#0a0a09'),          // cellule éteinte (fond très sombre)
        DIM: hexToRgb('#2a2520'),          // cellule lettre au repos (dim)
        LIT: hexToRgb(accentHex),         // cellule lettre allumée (couleur accent)
        HI: hexToRgb('#ffffff'),           // éclat central (flare)
      };
    };

    const draw = (cols: boolean[][], W: number, light: number) => {
      const { OFF, DIM, LIT, HI } = readColors();
      const w = canvas.clientWidth || 800;
      const cell = w / W;
      const h = Math.round(cell * H);

      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.height = h + 'px';

      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const c = cell;
      const gap = Math.max(1, Math.round(c * 0.18));
      const size = c - gap;
      const radius = Math.min(size * 0.18, 2.5 * dpr);

      const WAVE_SPAN = 6; // colonnes dans le front d'onde

      for (let x = 0; x < W; x++) {
        const col = cols[x] ?? new Array(ROWS).fill(false);

        // avancement de la vague pour cette colonne (0→1)
        let k = 0;
        if (prefersReducedMotion) {
          k = light; // instantané
        } else {
          const pos = light * (W + WAVE_SPAN) - x;
          const t = Math.max(0, Math.min(1, pos / WAVE_SPAN));
          k = t <= 0 ? 0 : backOut(t);
        }

        for (let y = 0; y < H; y++) {
          const isLetter = y >= PAD && y < PAD + ROWS && col[y - PAD];
          const px = x * c + gap / 2;
          const py = y * c + gap / 2;

          let fill: string;
          if (isLetter) {
            if (k <= 0) {
              fill = mixRgb(OFF, DIM, 0.6);
            } else if (k < 1) {
              fill = mixRgb(DIM, LIT, k);
            } else {
              // flare : k peut dépasser 1 grâce à backOut
              fill = mixRgb(LIT, HI, Math.min(1, (k - 1) * 3));
            }
          } else {
            fill = `rgb(${OFF[0]},${OFF[1]},${OFF[2]})`;
          }

          ctx.fillStyle = fill;
          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(px, py, size, size, radius);
          } else {
            ctx.rect(px, py, size, size);
          }
          ctx.fill();

          // point lumineux central sur les cellules fortement allumées
          if (isLetter && k > 0.5) {
            const inset = size * 0.28;
            const alpha = Math.min(0.55, (k - 0.5) * 1.1);
            ctx.fillStyle = `rgba(${HI[0]},${HI[1]},${HI[2]},${alpha.toFixed(3)})`;
            ctx.fillRect(px + inset, py + inset, size - 2 * inset, size - 2 * inset);
          }
        }
      }
    };

    const render = () => {
      const w = canvas.clientWidth || 800;
      const rawCols = textToColumns(label);
      // largeur minimale : colonnes du texte + 2 PAD de chaque côté
      const W = rawCols.length + 2 * PAD;
      const cols = centreColumns(rawCols, W);
      lastLabel = label;

      if (prefersReducedMotion) {
        draw(cols, W, 1);
        return;
      }

      // animation de vague gauche→droite
      let light = 0;
      const duration = 1200 + W * 16; // ms totales (wave + settle)
      const startTime = performance.now();

      const animate = (now: number) => {
        const elapsed = now - startTime;
        // 0→1 sur la durée de la vague, puis on freeze
        light = Math.min(1, elapsed / duration);
        draw(cols, W, light);
        if (light < 1) {
          animId = requestAnimationFrame(animate);
        }
      };

      // premier frame statique à "dim"
      draw(cols, W, 0);
      animId = requestAnimationFrame(animate);
    };

    render();

    // Écoute du changement de thème pour relire la couleur accent
    const onThemeChange = () => {
      cancelAnimationFrame(animId);
      render();
    };
    window.addEventListener('pixiatech-theme-change', onThemeChange);

    const observer = new ResizeObserver(() => {
      const w = canvas.clientWidth;
      if (lastWidth && Math.abs(w - lastWidth) < 4) return;
      lastWidth = w;
      cancelAnimationFrame(animId);
      render();
    });
    lastWidth = canvas.clientWidth;
    observer.observe(canvas);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(animId);
      window.removeEventListener('pixiatech-theme-change', onThemeChange);
    };
  }, [label]);

  return (
    <div className={`relative w-full ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full block"
        style={{ height: 'clamp(80px, 12vw, 180px)' }}
        aria-hidden="true"
      />
      <h1 className="sr-only">{label}</h1>
    </div>
  );
};
