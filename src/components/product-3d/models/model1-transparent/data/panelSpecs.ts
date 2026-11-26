'use client';
export type PitchTierId = 'p09' | 'p12' | 'p18';

export type ChassisFinishId = 'obsidian' | 'titanium' | 'raw';

export type AssemblyLayerId = 'emitter' | 'module' | 'chassis' | 'mount';

export type CameraPresetId = 'perspective' | 'front' | 'profile' | 'rear';

export type DisplayPatternId = 'fluid' | 'ambient' | 'calibration' | 'off';

export type WallMode = 'object' | 'surface';

export type WallLayoutId = '1x1' | '3x2' | '2x3' | '3x3';

export interface WallLayoutSpec {
  id: WallLayoutId;
  label: string;
  cols: number;
  rows: number;
  mode: WallMode;
}

export const WALL_LAYOUT_SPECS: Record<WallLayoutId, WallLayoutSpec> = {
  '1x1': { id: '1x1', label: '1×1', cols: 1, rows: 1, mode: 'object' },
  '3x2': { id: '3x2', label: '3×2', cols: 3, rows: 2, mode: 'surface' },
  '2x3': { id: '2x3', label: '2×3', cols: 2, rows: 3, mode: 'surface' },
  '3x3': { id: '3x3', label: '3×3', cols: 3, rows: 3, mode: 'surface' },
};

export type BackgroundPhaseId = 'phase1' | 'phase2' | 'phase3';

export interface BackgroundPhaseSpec {
  id: BackgroundPhaseId;
  label: string;
  subtitle: string;
  baseHex: string;
  orbPrimary: string;
  orbSecondary: string;
  orbAccent: string;
  spotHex: string;
  swatchHex: string;
}

export const BACKGROUND_PHASES: Record<BackgroundPhaseId, BackgroundPhaseSpec> = {
  phase1: {
    id: 'phase1',
    label: 'Phase 1',
    subtitle: 'Nuit ambrée',
    baseHex: '#020204',
    orbPrimary: 'rgba(255, 153, 0, 0.24)',
    orbSecondary: 'rgba(15, 76, 129, 0.28)',
    orbAccent: 'rgba(245, 158, 11, 0.14)',
    spotHex: '#FFE4C4',
    swatchHex: '#FF9900',
  },
  phase2: {
    id: 'phase2',
    label: 'Phase 2',
    subtitle: 'Glace prisme',
    baseHex: '#02040A',
    orbPrimary: 'rgba(34, 211, 238, 0.24)',
    orbSecondary: 'rgba(139, 92, 246, 0.26)',
    orbAccent: 'rgba(59, 130, 246, 0.18)',
    spotHex: '#BAE6FD',
    swatchHex: '#22D3EE',
  },
  phase3: {
    id: 'phase3',
    label: 'Phase 3',
    subtitle: 'Émeraude boréale',
    baseHex: '#020A08',
    orbPrimary: 'rgba(16, 185, 129, 0.28)',
    orbSecondary: 'rgba(13, 148, 136, 0.28)',
    orbAccent: 'rgba(52, 211, 153, 0.16)',
    spotHex: '#A7F3D0',
    swatchHex: '#10B981',
  },
};

export interface PitchSpec {
  id: PitchTierId;
  label: string;
  pitchMm: number;
  cabinetResX: number;
  cabinetResY: number;
  luminanceNits: number;
  contrastRatio: string;
  minViewingDistanceM: number;
  typicalPowerWPerSqm: number;
  peakPowerWPerSqm: number;
  refreshRateHz: number;
}

export const CABINET_DIMENSIONS = {
  widthMm: 1000,
  heightMm: 500,
  depthMm: 65,
  moduleWidthMm: 500,
  moduleHeightMm: 250,
  modulesPerCabinetX: 2,
  modulesPerCabinetY: 2,
  weightKg: 8.5,
  seamToleranceMm: 0.0,
} as const;

export const PITCH_SPECS: Record<PitchTierId, PitchSpec> = {
  p09: {
    id: 'p09',
    label: 'P3.9-7.8 O-Crystal Pro',
    pitchMm: 3.9,
    cabinetResX: 256,
    cabinetResY: 128,
    luminanceNits: 4500,
    contrastRatio: '6 000 : 1',
    minViewingDistanceM: 4.0,
    typicalPowerWPerSqm: 240,
    peakPowerWPerSqm: 800,
    refreshRateHz: 3840,
  },
  p12: {
    id: 'p12',
    label: 'P5.2-10.4 O-Crystal Pro',
    pitchMm: 5.2,
    cabinetResX: 192,
    cabinetResY: 96,
    luminanceNits: 4500,
    contrastRatio: '6 000 : 1',
    minViewingDistanceM: 5.0,
    typicalPowerWPerSqm: 240,
    peakPowerWPerSqm: 800,
    refreshRateHz: 3840,
  },
  p18: {
    id: 'p18',
    label: 'P10.4 Transparent',
    pitchMm: 10.4,
    cabinetResX: 96,
    cabinetResY: 48,
    luminanceNits: 4500,
    contrastRatio: '6 000 : 1',
    minViewingDistanceM: 10.0,
    typicalPowerWPerSqm: 240,
    peakPowerWPerSqm: 800,
    refreshRateHz: 3840,
  },
};

export interface AssemblyLayerInfo {
  id: AssemblyLayerId;
  index: string;
  name: string;
  subtitle: string;
  thicknessMm: string;
  material: string;
  description: string;
}

export const ASSEMBLY_LAYERS: AssemblyLayerInfo[] = [
  {
    id: 'emitter',
    index: '01',
    name: 'Grille LED transparente IP68',
    subtitle: 'Transparence 55–75 % · 4500 nits · 3840 Hz',
    thicknessMm: '6,5 mm',
    material: 'Encapsulation polymère anti-UV + lames SMD1921/2727',
    description:
      'Lames LED haute transparence hermétiquement encapsulées dans un polymère IP68 résistant aux intempéries, UV et chocs de montage.',
  },
  {
    id: 'module',
    index: '02',
    name: 'Quatre modules ajourés 500 × 250 mm',
    subtitle: 'Maintenance avant/arrière · Bus PCB vert émeraude',
    thicknessMm: '16,5 mm',
    material: 'Support polymère ajouré + pistes PCB étanches',
    description:
      'Quatre sous-modules 500 × 250 mm démontables par l’avant ou l’arrière sans outillage complexe pour un entretien rapide en prestation.',
  },
  {
    id: 'chassis',
    index: '03',
    name: 'Châssis aluminium moulé 1000 × 500',
    subtitle: 'Main Lock, Edge Lock, poignée & Arc Lock rouge',
    thicknessMm: '30,0 mm',
    material: 'Aluminium moulé noir 8,5 kg + verrous Arc Lock rouges',
    description:
      'Cadre ultra-léger IP65 doté de plaques d’alignement argentées, bloc alim central avec témoin Signal Light vert et verrous de courbure Arc Lock à gâchette rouge.',
  },
  {
    id: 'mount',
    index: '04',
    name: 'Béquille & lestage arrière',
    subtitle: 'Tour acier profilée sur platine à roulettes',
    thicknessMm: '12,0 mm',
    material: 'Acier thermolaqué noir + équerres de bridage',
    description:
      'Structure portante verticale à découpes allégées assurant le maintien au sol et la reprise de charge des parois transparentes droites ou cintrées.',
  },
];

export interface ChassisFinishSpec {
  id: ChassisFinishId;
  label: string;
  chassisHex: string;
  trimHex: string;
  roughness: number;
  metalness: number;
}

export const CHASSIS_FINISHES: Record<ChassisFinishId, ChassisFinishSpec> = {
  obsidian: {
    id: 'obsidian',
    label: 'Noir absolu IP65',
    chassisHex: '#08090C',
    trimHex: '#161920',
    roughness: 0.36,
    metalness: 0.46,
  },
  titanium: {
    id: 'titanium',
    label: 'Graphite anodisé',
    chassisHex: '#2D323C',
    trimHex: '#485060',
    roughness: 0.42,
    metalness: 0.68,
  },
  raw: {
    id: 'raw',
    label: 'Acier brossé',
    chassisHex: '#9BA3B0',
    trimHex: '#CFD6E0',
    roughness: 0.28,
    metalness: 0.9,
  },
};

export interface WallMetrics {
  cols: number;
  rows: number;
  cabinetCount: number;
  moduleCount: number;
  totalWidthMm: number;
  totalHeightMm: number;
  areaSqm: number;
  totalResX: number;
  totalResY: number;
  totalWeightKg: number;
  typicalPowerW: number;
  peakPowerW: number;
}

export function computeWallMetrics(
  pitchId: PitchTierId,
  cols: number,
  rows: number,
): WallMetrics {
  const safeCols = Math.max(1, Math.floor(cols));
  const safeRows = Math.max(1, Math.floor(rows));
  const pitch = PITCH_SPECS[pitchId];

  const cabinetCount = safeCols * safeRows;
  const moduleCount =
    cabinetCount *
    CABINET_DIMENSIONS.modulesPerCabinetX *
    CABINET_DIMENSIONS.modulesPerCabinetY;
  const totalWidthMm = safeCols * CABINET_DIMENSIONS.widthMm;
  const totalHeightMm = safeRows * CABINET_DIMENSIONS.heightMm;
  const areaSqm = Number(((totalWidthMm * totalHeightMm) / 1_000_000).toFixed(2));
  const totalResX = safeCols * pitch.cabinetResX;
  const totalResY = safeRows * pitch.cabinetResY;
  const totalWeightKg = Number((cabinetCount * CABINET_DIMENSIONS.weightKg).toFixed(1));
  const typicalPowerW = Math.round(areaSqm * pitch.typicalPowerWPerSqm);
  const peakPowerW = Math.round(areaSqm * pitch.peakPowerWPerSqm);

  return {
    cols: safeCols,
    rows: safeRows,
    cabinetCount,
    moduleCount,
    totalWidthMm,
    totalHeightMm,
    areaSqm,
    totalResX,
    totalResY,
    totalWeightKg,
    typicalPowerW,
    peakPowerW,
  };
}

export const CURVATURE_LIMIT_DEG = 30;
export const CURVATURE_VISUAL_MULTIPLIER = 2;
export const CURVATURE_SURFACE_MULTIPLIER = 1;

export function clampCurvatureDeg(deg: number): number {
  if (!Number.isFinite(deg)) return 0;
  return Math.max(-CURVATURE_LIMIT_DEG, Math.min(CURVATURE_LIMIT_DEG, deg));
}

export function toInternalCurvatureDeg(
  displayDeg: number,
  multiplier: number = CURVATURE_VISUAL_MULTIPLIER,
): number {
  return clampCurvatureDeg(displayDeg) * multiplier;
}

/**
 * Evaluates normalized mechanical slide travel [-1, +1] for the rear H-yoke
 * articulation carriage & quick-lock linkage along the slotted horizontal rail.
 */
export function evaluateCurvedRailSlide(displayDeg: number): number {
  return clampCurvatureDeg(displayDeg) / CURVATURE_LIMIT_DEG;
}

export interface CurvedPoint {
  x: number;
  z: number;
  angleY: number;
}

/**
 * Evaluates C1-continuous horizontal circular-arc bending around x = 0.
 * Display degrees in [-30, +30] map internally via multiplier (2x in 1x1 object mode, 1x in 3x2 wall mode).
 * - x < 0 uses curveLeftDeg (+ = forward toward viewer +Z, - = backward -Z)
 * - x >= 0 uses curveRightDeg (+ = forward toward viewer +Z, - = backward -Z)
 */
export function evaluatePanelCurve(
  x: number,
  z: number,
  halfWidth: number,
  curveLeftDeg: number,
  curveRightDeg: number,
  multiplier: number = CURVATURE_VISUAL_MULTIPLIER,
): CurvedPoint {
  const safeHalf = Math.max(halfWidth, 1e-4);
  const isLeft = x < 0;
  const deg = toInternalCurvatureDeg(isLeft ? curveLeftDeg : curveRightDeg, multiplier);
  const theta = (deg * Math.PI) / 180;

  if (Math.abs(theta) < 1e-5) {
    return { x, z, angleY: 0 };
  }

  const s = (isLeft ? -x : x) / safeHalf;
  const radius = safeHalf / theta;
  const alpha = s * theta;
  const angleY = isLeft ? alpha : -alpha;

  const cx = (isLeft ? -1 : 1) * radius * Math.sin(alpha);
  const cz = radius * (1 - Math.cos(alpha));

  const sinY = Math.sin(angleY);
  const cosY = Math.cos(angleY);

  return {
    x: cx + z * sinY,
    z: cz + z * cosY,
    angleY,
  };
}

/**
 * Evaluates circular-arc bending for a 3x2 wall side-wing cabinet in its local space,
 * hinged tangentially at its inner seam edge (+halfWidth for left wing, -halfWidth for right wing).
 */
export function evaluateWingCurve(
  side: 'left' | 'right',
  x: number,
  z: number,
  halfWidth: number,
  curveDeg: number,
  multiplier: number = CURVATURE_SURFACE_MULTIPLIER,
): CurvedPoint {
  const safeHalf = Math.max(halfWidth, 1e-4);
  const deg = toInternalCurvatureDeg(curveDeg, multiplier);
  const theta = (deg * Math.PI) / 180;

  if (Math.abs(theta) < 1e-5) {
    return { x, z, angleY: 0 };
  }

  const isLeft = side === 'left';
  const s = (isLeft ? safeHalf - x : x + safeHalf) / safeHalf;
  const radius = safeHalf / theta;
  const alpha = s * theta;
  const angleY = isLeft ? alpha : -alpha;

  const cx = isLeft
    ? safeHalf - radius * Math.sin(alpha)
    : -safeHalf + radius * Math.sin(alpha);
  const cz = radius * (1 - Math.cos(alpha));

  const sinY = Math.sin(angleY);
  const cosY = Math.cos(angleY);

  return {
    x: cx + z * sinY,
    z: cz + z * cosY,
    angleY,
  };
}
