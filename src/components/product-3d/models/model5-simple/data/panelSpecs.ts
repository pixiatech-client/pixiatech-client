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
    name: 'Lame optique Micro-LED',
    subtitle: 'Encapsulation saphir mate antireflet',
    thicknessMm: '2,6 mm',
    material: 'Résine optique nanocéramique',
    description:
      'Matrice Flip-Chip COB scellée sous vide pour un noir absolu sans moirage et une résistance aux chocs frontaux.',
  },
  {
    id: 'module',
    index: '02',
    name: 'Quatre dalles magnétiques',
    subtitle: 'Sous-modules 300 × 168,8 mm interchangeables',
    thicknessMm: '7,4 mm',
    material: 'Alliage anodisé + PCB 12 couches',
    description:
      'Alignement magnétique auto-centré avec connecteurs pogo-pin plaqués or permettant une extraction frontale à chaud en moins de 4 secondes.',
  },
  {
    id: 'chassis',
    index: '03',
    name: 'Châssis monobloc usiné',
    subtitle: 'Structure portante 600 × 337,5 mm',
    thicknessMm: '16,2 mm',
    material: 'Magnésium-aluminium injecté CNC',
    description:
      'Dissipation thermique passive par ailettes radiales usinées, tolérance géométrique de ±0,02 mm et verrouillage excentrique sans outil.',
  },
  {
    id: 'mount',
    index: '04',
    name: 'Épine dorsale murale',
    subtitle: 'Interface d’ancrage affleurante',
    thicknessMm: '3,5 mm',
    material: 'Acier inoxydable microbillé',
    description:
      'Rail de référence laser compensant les irrégularités architecturales du mur porteur tout en préservant une profondeur finie de 29,7 mm.',
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
    chassisHex: '#1D2027',
    trimHex: '#3A404D',
    roughness: 0.36,
    metalness: 0.84,
  },
  titanium: {
    id: 'titanium',
    label: 'Titane satiné',
    chassisHex: '#4B515E',
    trimHex: '#868E9D',
    roughness: 0.32,
    metalness: 0.88,
  },
  raw: {
    id: 'raw',
    label: 'Aluminium usiné',
    chassisHex: '#8F96A3',
    trimHex: '#C6CDD8',
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
