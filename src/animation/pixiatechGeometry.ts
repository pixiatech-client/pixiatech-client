export interface GlyphData {
  readonly ch: string;
  readonly index: number;
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
  readonly cx: number;
  readonly cy: number;
  readonly d: string;
  readonly subpaths: readonly string[];
}

export interface LineSegment {
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
}

export interface TripleLineGroup {
  readonly id: string;
  readonly lines: readonly [LineSegment, LineSegment, LineSegment];
  readonly delayWeight: number;
}

export interface CircleGuide {
  readonly id: string;
  readonly cx: number;
  readonly cy: number;
  readonly r: number;
  readonly dashed: boolean;
  readonly opacity: number;
  readonly strokeWidth: number;
  readonly delayWeight: number;
}

export interface HorizontalGuide {
  readonly id: string;
  readonly y: number;
  readonly opacity: number;
  readonly strokeWidth: number;
  readonly delayWeight: number;
  readonly fromCenter: boolean;
}

export interface VerticalGuide {
  readonly id: string;
  readonly x: number;
  readonly opacity: number;
  readonly strokeWidth: number;
  readonly delayWeight: number;
}

export const STAGE_VIEWBOX = {
  width: 1600,
  height: 900,
  cx: 800,
  cy: 450,
} as const;

export const WORD_BOUNDS = {
  x1: 288.62,
  y1: 382.24,
  x2: 1311.38,
  y2: 517.76,
  width: 1022.76,
  height: 135.52,
} as const;

/**
 * Exact vector glyph contours extracted from PixiaTech's official GRATIS.ttf
 * wordmark font, centered at (800, 450) in a 1600x900 architectural viewBox.
 */
export const PIXIATECH_GLYPHS: readonly GlyphData[] = [
  {
    ch: 'P',
    index: 0,
    x1: 288.62,
    y1: 382.24,
    x2: 392.71,
    y2: 517.76,
    cx: 340.66,
    cy: 450,
    d: 'M288.62 382.24L374.01 382.24Q380.98 382.24 386.72 387.82L386.72 387.82Q392.71 393.48 392.71 401.03L392.71 401.03L392.71 443.52Q392.71 451.07 386.72 456.81L386.72 456.81Q380.98 462.30 374.01 462.30L374.01 462.30L313.22 462.30L313.22 517.76L288.62 517.76L288.62 382.24ZM313.22 437.70L361.62 437.70Q364.25 437.70 366.13 436.14L366.13 436.14Q368.02 434.50 368.02 432.28L368.02 432.28L368.02 412.27Q368.02 410.05 366.13 408.49L366.13 408.49Q364.25 406.85 361.62 406.85L361.62 406.85L313.22 406.85L313.22 437.70Z',
    subpaths: [
      'M288.62 382.24L374.01 382.24Q380.98 382.24 386.72 387.82L386.72 387.82Q392.71 393.48 392.71 401.03L392.71 401.03L392.71 443.52Q392.71 451.07 386.72 456.81L386.72 456.81Q380.98 462.30 374.01 462.30L374.01 462.30L313.22 462.30L313.22 517.76L288.62 517.76L288.62 382.24Z',
      'M313.22 437.70L361.62 437.70Q364.25 437.70 366.13 436.14L366.13 436.14Q368.02 434.50 368.02 432.28L368.02 432.28L368.02 412.27Q368.02 410.05 366.13 408.49L366.13 408.49Q364.25 406.85 361.62 406.85L361.62 406.85L313.22 406.85L313.22 437.70Z',
    ],
  },
  {
    ch: 'I',
    index: 1,
    x1: 422.12,
    y1: 382.24,
    x2: 446.73,
    y2: 517.76,
    cx: 434.42,
    cy: 450,
    d: 'M422.12 382.24L446.73 382.24L446.73 517.76L422.12 517.76L422.12 382.24Z',
    subpaths: [
      'M422.12 382.24L446.73 382.24L446.73 517.76L422.12 517.76L422.12 382.24Z',
    ],
  },
  {
    ch: 'X',
    index: 2,
    x1: 476.13,
    y1: 382.24,
    x2: 591.63,
    y2: 517.76,
    cx: 533.88,
    cy: 450,
    d: 'M562.51 382.24L591.63 382.24L548.49 450.00L591.63 517.76L562.51 517.76L533.88 472.89L505.26 517.76L476.13 517.76L519.28 450.00L476.13 382.24L505.26 382.24L533.88 427.11L562.51 382.24Z',
    subpaths: [
      'M562.51 382.24L591.63 382.24L548.49 450.00L591.63 517.76L562.51 517.76L533.88 472.89L505.26 517.76L476.13 517.76L519.28 450.00L476.13 382.24L505.26 382.24L533.88 427.11L562.51 382.24Z',
    ],
  },
  {
    ch: 'I',
    index: 3,
    x1: 621.04,
    y1: 382.24,
    x2: 645.65,
    y2: 517.76,
    cx: 633.35,
    cy: 450,
    d: 'M621.04 382.24L645.65 382.24L645.65 517.76L621.04 517.76L621.04 382.24Z',
    subpaths: [
      'M621.04 382.24L645.65 382.24L645.65 517.76L621.04 517.76L621.04 382.24Z',
    ],
  },
  {
    ch: 'A',
    index: 4,
    x1: 675.06,
    y1: 382.24,
    x2: 788.1,
    y2: 517.76,
    cx: 731.58,
    cy: 450,
    d: 'M700.81 517.76L675.06 517.76L718.45 382.24L744.62 382.24L788.10 517.76L762.26 517.76L754.38 493.07L708.69 493.07L700.81 517.76ZM716.56 468.54L746.51 468.54L731.58 421.86L716.56 468.54Z',
    subpaths: [
      'M700.81 517.76L675.06 517.76L718.45 382.24L744.62 382.24L788.10 517.76L762.26 517.76L754.38 493.07L708.69 493.07L700.81 517.76Z',
      'M716.56 468.54L746.51 468.54L731.58 421.86L716.56 468.54Z',
    ],
  },
  {
    ch: 'T',
    index: 5,
    x1: 811.86,
    y1: 382.24,
    x2: 916.04,
    y2: 517.76,
    cx: 863.95,
    cy: 450,
    d: 'M811.86 406.85L811.86 382.24L916.04 382.24L916.04 406.85L876.26 406.85L876.26 517.76L851.73 517.76L851.73 406.85L811.86 406.85Z',
    subpaths: [
      'M811.86 406.85L811.86 382.24L916.04 382.24L916.04 406.85L876.26 406.85L876.26 517.76L851.73 517.76L851.73 406.85L811.86 406.85Z',
    ],
  },
  {
    ch: 'E',
    index: 6,
    x1: 943.81,
    y1: 382.24,
    x2: 1047.82,
    y2: 517.76,
    cx: 995.81,
    cy: 450,
    d: 'M943.81 382.24L1047.82 382.24L1047.82 406.85L968.42 406.85L968.42 437.70L1047.82 437.70L1047.82 462.30L968.42 462.30L968.42 493.15L1047.82 493.15L1047.82 517.76L943.81 517.76L943.81 382.24Z',
    subpaths: [
      'M943.81 382.24L1047.82 382.24L1047.82 406.85L968.42 406.85L968.42 437.70L1047.82 437.70L1047.82 462.30L968.42 462.30L968.42 493.15L1047.82 493.15L1047.82 517.76L943.81 517.76L943.81 382.24Z',
    ],
  },
  {
    ch: 'C',
    index: 7,
    x1: 1075.59,
    y1: 382.24,
    x2: 1179.6,
    y2: 517.76,
    cx: 1127.6,
    cy: 450,
    d: 'M1075.59 498.97L1075.59 401.03Q1075.59 393.64 1082.31 387.82L1082.31 387.82Q1088.63 382.24 1095.69 382.24L1095.69 382.24L1160.98 382.24Q1167.87 382.24 1173.62 387.82L1173.62 387.82Q1179.60 393.48 1179.60 401.03L1179.60 401.03L1179.60 421.62L1154.99 421.62L1154.99 412.27Q1154.99 410.05 1153.11 408.49L1153.11 408.49Q1151.22 406.85 1148.51 406.85L1148.51 406.85L1106.60 406.85Q1103.97 406.85 1102.08 408.49L1102.08 408.49Q1100.20 410.05 1100.20 412.27L1100.20 412.27L1100.20 487.73Q1100.20 489.95 1102.08 491.51L1102.08 491.51Q1103.97 493.15 1106.60 493.15L1106.60 493.15L1148.51 493.15Q1151.22 493.15 1153.11 491.51L1153.11 491.51Q1154.99 489.95 1154.99 487.73L1154.99 487.73L1154.99 478.30L1179.60 478.30L1179.60 498.97Q1179.60 506.52 1173.62 512.18L1173.62 512.18Q1167.87 517.76 1160.98 517.76L1160.98 517.76L1095.69 517.76Q1088.63 517.76 1082.31 512.18L1082.31 512.18Q1075.59 506.36 1075.59 498.97Z',
    subpaths: [
      'M1075.59 498.97L1075.59 401.03Q1075.59 393.64 1082.31 387.82L1082.31 387.82Q1088.63 382.24 1095.69 382.24L1095.69 382.24L1160.98 382.24Q1167.87 382.24 1173.62 387.82L1173.62 387.82Q1179.60 393.48 1179.60 401.03L1179.60 401.03L1179.60 421.62L1154.99 421.62L1154.99 412.27Q1154.99 410.05 1153.11 408.49L1153.11 408.49Q1151.22 406.85 1148.51 406.85L1148.51 406.85L1106.60 406.85Q1103.97 406.85 1102.08 408.49L1102.08 408.49Q1100.20 410.05 1100.20 412.27L1100.20 412.27L1100.20 487.73Q1100.20 489.95 1102.08 491.51L1102.08 491.51Q1103.97 493.15 1106.60 493.15L1106.60 493.15L1148.51 493.15Q1151.22 493.15 1153.11 491.51L1153.11 491.51Q1154.99 489.95 1154.99 487.73L1154.99 487.73L1154.99 478.30L1179.60 478.30L1179.60 498.97Q1179.60 506.52 1173.62 512.18L1173.62 512.18Q1167.87 517.76 1160.98 517.76L1160.98 517.76L1095.69 517.76Q1088.63 517.76 1082.31 512.18L1082.31 512.18Q1075.59 506.36 1075.59 498.97Z',
    ],
  },
  {
    ch: 'H',
    index: 8,
    x1: 1207.37,
    y1: 382.24,
    x2: 1311.38,
    y2: 517.76,
    cx: 1259.38,
    cy: 450,
    d: 'M1286.78 382.24L1311.38 382.24L1311.38 517.76L1286.78 517.76L1286.78 462.30L1231.90 462.30L1231.90 517.76L1207.37 517.76L1207.37 382.24L1231.90 382.24L1231.90 437.70L1286.78 437.70L1286.78 382.24Z',
    subpaths: [
      'M1286.78 382.24L1311.38 382.24L1311.38 517.76L1286.78 517.76L1286.78 462.30L1231.90 462.30L1231.90 517.76L1207.37 517.76L1207.37 382.24L1231.90 382.24L1231.90 437.70L1286.78 437.70L1286.78 382.24Z',
    ],
  },
] as const;

export function extendLineToYRange(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  yTop = 0,
  yBottom = 900,
): LineSegment {
  const dy = by - ay;
  if (Math.abs(dy) < 1e-6) {
    return { x1: 0, y1: ay, x2: 1600, y2: by };
  }
  const dx = bx - ax;
  const xTop = ax + ((yTop - ay) * dx) / dy;
  const xBottom = ax + ((yBottom - ay) * dx) / dy;
  return {
    x1: Number(xTop.toFixed(2)),
    y1: yTop,
    x2: Number(xBottom.toFixed(2)),
    y2: yBottom,
  };
}

export function offsetLinePerpendicular(
  line: LineSegment,
  offset: number,
): LineSegment {
  const dx = line.x2 - line.x1;
  const dy = line.y2 - line.y1;
  const len = Math.hypot(dx, dy);
  if (len < 1e-6) return line;
  const nx = -dy / len;
  const ny = dx / len;
  return {
    x1: Number((line.x1 + nx * offset).toFixed(2)),
    y1: Number((line.y1 + ny * offset).toFixed(2)),
    x2: Number((line.x2 + nx * offset).toFixed(2)),
    y2: Number((line.y2 + ny * offset).toFixed(2)),
  };
}

function buildTripleGroup(
  id: string,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  spacing: number,
  delayWeight: number,
): TripleLineGroup {
  const center = extendLineToYRange(ax, ay, bx, by, -40, 940);
  return {
    id,
    lines: [
      offsetLinePerpendicular(center, -spacing),
      center,
      offsetLinePerpendicular(center, spacing),
    ],
    delayWeight,
  };
}

export const DIAGONAL_TRIPLE_GROUPS: readonly TripleLineGroup[] = [
  buildTripleGroup('x-diag-down', 490.7, 382.24, 577.07, 517.76, 8.5, 0.06),
  buildTripleGroup('x-diag-up', 577.07, 382.24, 490.7, 517.76, 8.5, 0.14),
  buildTripleGroup('a-leg-left', 731.54, 382.24, 687.93, 517.76, 8.5, 0.02),
  buildTripleGroup('a-leg-right', 731.54, 382.24, 775.18, 517.76, 8.5, 0.1),
  buildTripleGroup('c-harm-up', 1127.6 + 43.18, 382.24, 1127.6 - 43.18, 517.76, 8.5, 0.18),
  buildTripleGroup('c-harm-down', 1127.6 - 43.18, 382.24, 1127.6 + 43.18, 517.76, 8.5, 0.22),
];

export const HORIZONTAL_GUIDES: readonly HorizontalGuide[] = [
  { id: 'h-frame-top', y: 215, opacity: 0.2, strokeWidth: 0.75, delayWeight: 0.24, fromCenter: true },
  { id: 'h-apex', y: 341.2, opacity: 0.34, strokeWidth: 0.75, delayWeight: 0.16, fromCenter: true },
  { id: 'h-cap-top', y: 382.24, opacity: 0.65, strokeWidth: 1.0, delayWeight: 0.02, fromCenter: true },
  { id: 'h-inner-top', y: 406.85, opacity: 0.36, strokeWidth: 0.7, delayWeight: 0.08, fromCenter: true },
  { id: 'h-mid-top', y: 437.7, opacity: 0.28, strokeWidth: 0.65, delayWeight: 0.12, fromCenter: true },
  { id: 'h-center', y: 450, opacity: 0.48, strokeWidth: 0.85, delayWeight: 0.0, fromCenter: true },
  { id: 'h-mid-bot', y: 462.3, opacity: 0.28, strokeWidth: 0.65, delayWeight: 0.12, fromCenter: true },
  { id: 'h-inner-bot', y: 493.15, opacity: 0.36, strokeWidth: 0.7, delayWeight: 0.08, fromCenter: true },
  { id: 'h-baseline', y: 517.76, opacity: 0.65, strokeWidth: 1.0, delayWeight: 0.04, fromCenter: true },
  { id: 'h-frame-bot', y: 685, opacity: 0.2, strokeWidth: 0.75, delayWeight: 0.24, fromCenter: true },
];

export const VERTICAL_GUIDES: readonly VerticalGuide[] = [
  { id: 'v-p-left', x: 288.62, opacity: 0.52, strokeWidth: 0.9, delayWeight: 0.14 },
  { id: 'v-p-right', x: 392.71, opacity: 0.25, strokeWidth: 0.65, delayWeight: 0.22 },
  { id: 'v-i1-left', x: 422.12, opacity: 0.22, strokeWidth: 0.6, delayWeight: 0.18 },
  { id: 'v-x-center', x: 533.88, opacity: 0.42, strokeWidth: 0.8, delayWeight: 0.08 },
  { id: 'v-i2-right', x: 645.65, opacity: 0.22, strokeWidth: 0.6, delayWeight: 0.12 },
  { id: 'v-a-left', x: 675.06, opacity: 0.34, strokeWidth: 0.75, delayWeight: 0.06 },
  { id: 'v-a-center', x: 731.58, opacity: 0.46, strokeWidth: 0.85, delayWeight: 0.02 },
  { id: 'v-a-right', x: 788.1, opacity: 0.34, strokeWidth: 0.75, delayWeight: 0.06 },
  { id: 'v-stage-center', x: 800, opacity: 0.38, strokeWidth: 0.75, delayWeight: 0.0 },
  { id: 'v-t-stem', x: 863.95, opacity: 0.3, strokeWidth: 0.7, delayWeight: 0.1 },
  { id: 'v-e-left', x: 943.81, opacity: 0.25, strokeWidth: 0.65, delayWeight: 0.15 },
  { id: 'v-c-center', x: 1127.6, opacity: 0.32, strokeWidth: 0.7, delayWeight: 0.18 },
  { id: 'v-h-left', x: 1207.37, opacity: 0.24, strokeWidth: 0.65, delayWeight: 0.2 },
  { id: 'v-h-right', x: 1311.38, opacity: 0.52, strokeWidth: 0.9, delayWeight: 0.14 },
];

export const CONSTRUCTION_CIRCLES: readonly CircleGuide[] = [
  { id: 'c-grand-outer', cx: 800, cy: 450, r: 356, dashed: true, opacity: 0.48, strokeWidth: 1.0, delayWeight: 0.0 },
  { id: 'c-grand-inner', cx: 800, cy: 450, r: 215, dashed: true, opacity: 0.38, strokeWidth: 0.9, delayWeight: 0.1 },
  { id: 'c-grand-hairline', cx: 800, cy: 450, r: 530, dashed: true, opacity: 0.18, strokeWidth: 0.75, delayWeight: 0.18 },
  { id: 'c-anchor-x', cx: 533.88, cy: 450, r: 128, dashed: true, opacity: 0.34, strokeWidth: 0.85, delayWeight: 0.12 },
  { id: 'c-anchor-a', cx: 731.58, cy: 450, r: 142, dashed: true, opacity: 0.38, strokeWidth: 0.85, delayWeight: 0.06 },
  { id: 'c-anchor-c', cx: 1127.6, cy: 450, r: 96, dashed: true, opacity: 0.3, strokeWidth: 0.8, delayWeight: 0.16 },
];

export const RADIAL_DOTTED_AXES: readonly LineSegment[] = [
  extendLineToYRange(800, 450, 800 + Math.cos(Math.PI / 6) * 100, 450 + Math.sin(Math.PI / 6) * 100, 40, 860),
  extendLineToYRange(800, 450, 800 - Math.cos(Math.PI / 6) * 100, 450 + Math.sin(Math.PI / 6) * 100, 40, 860),
  extendLineToYRange(800, 450, 800 + Math.cos(Math.PI / 3) * 100, 450 + Math.sin(Math.PI / 3) * 100, 40, 860),
  extendLineToYRange(800, 450, 800 - Math.cos(Math.PI / 3) * 100, 450 + Math.sin(Math.PI / 3) * 100, 40, 860),
];
