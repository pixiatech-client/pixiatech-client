export type PitchTierId = 'p09' | 'p12' | 'p18';

export type ChassisFinishId = 'obsidian' | 'titanium' | 'raw';

export type AssemblyLayerId = 'emitter' | 'module' | 'chassis' | 'mount';

export type CameraPresetId = 'perspective' | 'front' | 'profile' | 'rear';

export type DisplayPatternId = 'fluid' | 'ambient' | 'calibration' | 'off';

export type WallMode = 'object' | 'surface';

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
    subtitle: 'Titane polaire',
    baseHex: '#06080D',
    orbPrimary: 'rgba(203, 213, 225, 0.2)',
    orbSecondary: 'rgba(71, 85, 105, 0.28)',
    orbAccent: 'rgba(253, 230, 138, 0.12)',
    spotHex: '#F1F5F9',
    swatchHex: '#CBD5E1',
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
  widthMm: 600,
  heightMm: 337.5,
  depthMm: 29.7,
  moduleWidthMm: 300,
  moduleHeightMm: 168.75,
  modulesPerCabinetX: 2,
  modulesPerCabinetY: 2,
  weightKg: 4.9,
  seamToleranceMm: 0.0,
} as const;

export const PITCH_SPECS: Record<PitchTierId, PitchSpec> = {
  p09: {
    id: 'p09',
    label: 'P0.93 Ultra-Fin',
    pitchMm: 0.93,
    cabinetResX: 640,
    cabinetResY: 360,
    luminanceNits: 1200,
    contrastRatio: '1 000 000 : 1',
    minViewingDistanceM: 0.9,
    typicalPowerWPerSqm: 145,
    peakPowerWPerSqm: 410,
    refreshRateHz: 7680,
  },
  p12: {
    id: 'p12',
    label: 'P1.25 Architectural',
    pitchMm: 1.25,
    cabinetResX: 480,
    cabinetResY: 270,
    luminanceNits: 1500,
    contrastRatio: '800 000 : 1',
    minViewingDistanceM: 1.3,
    typicalPowerWPerSqm: 130,
    peakPowerWPerSqm: 380,
    refreshRateHz: 7680,
  },
  p18: {
    id: 'p18',
    label: 'P1.87 Monumental',
    pitchMm: 1.87,
    cabinetResX: 320,
    cabinetResY: 180,
    luminanceNits: 1800,
    contrastRatio: '600 000 : 1',
    minViewingDistanceM: 1.9,
    typicalPowerWPerSqm: 115,
    peakPowerWPerSqm: 350,
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
    name: 'Surface optique LED souple',
    subtitle: 'Masque silicone mat antireflet',
    thicknessMm: '2,6 mm',
    material: 'Élastomère optique haute souplesse',
    description:
      'Matrice LED flexible à haut contraste résistante aux flexions répétées pour surfaces concaves, convexes ou ondulées jusqu’à ±30°.',
  },
  {
    id: 'module',
    index: '02',
    name: 'Quatre dalles magnétiques flexibles',
    subtitle: 'Sous-modules 300 × 168,8 mm souples',
    thicknessMm: '7,4 mm',
    material: 'PCB flexible FPC + aimants néodyme',
    description:
      'Circuit imprimé souple multicouche à alignement magnétique auto-centré avec maintenance frontale à chaud sans outil.',
  },
  {
    id: 'chassis',
    index: '03',
    name: 'Châssis articulé multi-courbure',
    subtitle: 'Structure porteuse 600 × 337,5 mm',
    thicknessMm: '16,2 mm',
    material: 'Alliage léger usiné à segments flexibles',
    description:
      'Châssis de soutien épousant les cintres gauche et droite indépendants avec dissipation thermique passive intégrée.',
  },
  {
    id: 'mount',
    index: '04',
    name: 'Épine dorsale d’ancrage',
    subtitle: 'Interface murale courbe ou plane',
    thicknessMm: '3,5 mm',
    material: 'Acier inoxydable microbillé',
    description:
      'Rail porteur modulaire compatible avec parois droites, colonnes et façades architecturales cintrées en continu.',
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
    label: 'Obsidienne anodisée',
    chassisHex: '#252932',
    trimHex: '#3E4554',
    roughness: 0.34,
    metalness: 0.86,
  },
  titanium: {
    id: 'titanium',
    label: 'Titane satiné',
    chassisHex: '#9BA4B3',
    trimHex: '#BCC4D2',
    roughness: 0.28,
    metalness: 0.88,
  },
  raw: {
    id: 'raw',
    label: 'Aluminium usiné',
    chassisHex: '#C2C9D4',
    trimHex: '#E0E5ED',
    roughness: 0.22,
    metalness: 0.94,
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
