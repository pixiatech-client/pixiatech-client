'use client';
export type PitchTierId = 'p09' | 'p12' | 'p18';

export type ChassisFinishId = 'obsidian' | 'titanium' | 'raw';

export type AssemblyLayerId = 'emitter' | 'module' | 'chassis' | 'mount';

export type CameraPresetId = 'perspective' | 'front' | 'profile' | 'rear';

export type DisplayPatternId = 'video' | 'fluid' | 'ambient' | 'calibration' | 'off';

export type InstallationModeId = 'standing' | 'wall' | 'suspended';

export type HorizontalPanelCount = 1 | 2 | 3 | 4;

export interface InstallationModeSpec {
  id: InstallationModeId;
  label: string;
  shortLabel: string;
  subtitle: string;
  mountSummary: string;
  totalHeightMm: number;
  mountWeightKg: number;
}

export const INSTALLATION_MODES: Record<InstallationModeId, InstallationModeSpec> = {
  standing: {
    id: 'standing',
    label: 'SUR PIED',
    shortLabel: 'Sur pied',
    subtitle: 'Pieds en A amovibles sur roulettes',
    mountSummary: 'Piètement en A sur roulettes verrouillables · Emprise 500 mm',
    totalHeightMm: 2400,
    mountWeightKg: 10.0,
  },
  wall: {
    id: 'wall',
    label: 'MURAL',
    shortLabel: 'Mural',
    subtitle: 'Rails & équerres de fixation murale',
    mountSummary: 'Rails aluminium & équerres d’ancrage mural affleurant',
    totalHeightMm: 2000,
    mountWeightKg: 2.2,
  },
  suspended: {
    id: 'suspended',
    label: 'SUSPENDU',
    shortLabel: 'Suspendu',
    subtitle: 'Câbles acier & poutre d’accroche haute',
    mountSummary: 'Élingues acier réglables & rail de suspension plafond',
    totalHeightMm: 2550,
    mountWeightKg: 1.4,
  },
};

export const HORIZONTAL_PANEL_COUNTS: readonly HorizontalPanelCount[] = [1, 2, 3, 4];

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
  heightMm: 2000,
  depthMm: 55,
  standingHeightMm: 2400,
  standingFootprintMm: 500,
  moduleWidthMm: 500,
  moduleHeightMm: 1000,
  modulesPerCabinetX: 2,
  modulesPerCabinetY: 2,
  weightKg: 25.92,
  hangingWeightKg: 15.92,
  moduleWeightKg: 0.5,
  filmThicknessMm: 1.8,
  seamToleranceMm: 0.0,
} as const;

export const PITCH_SPECS: Record<PitchTierId, PitchSpec> = {
  p09: {
    id: 'p09',
    label: 'P3.91 O-Raster Holographique',
    pitchMm: 3.91,
    cabinetResX: 256,
    cabinetResY: 512,
    luminanceNits: 3200,
    contrastRatio: '6 000 : 1',
    minViewingDistanceM: 3.5,
    typicalPowerWPerSqm: 640,
    peakPowerWPerSqm: 1600,
    refreshRateHz: 3840,
  },
  p12: {
    id: 'p12',
    label: 'P3.91 O-Raster Poster 1000×2000',
    pitchMm: 3.91,
    cabinetResX: 256,
    cabinetResY: 512,
    luminanceNits: 3200,
    contrastRatio: '6 000 : 1',
    minViewingDistanceM: 4.0,
    typicalPowerWPerSqm: 640,
    peakPowerWPerSqm: 1600,
    refreshRateHz: 3840,
  },
  p18: {
    id: 'p18',
    label: 'P3.91 Double-Face Suspendu',
    pitchMm: 3.91,
    cabinetResX: 256,
    cabinetResY: 512,
    luminanceNits: 3000,
    contrastRatio: '6 000 : 1',
    minViewingDistanceM: 4.0,
    typicalPowerWPerSqm: 640,
    peakPowerWPerSqm: 1600,
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
    name: 'Film LED holographique > 92 %',
    subtitle: 'Pas 3,91 mm · 3 200 nits · Effet flottant sans verre',
    thicknessMm: '1,8 mm',
    material: 'Diodes & drivers intégrés à matrice perforée 3,05 mm',
    description:
      'Matrice micro-perforée ultra-invisible à plus de 92 % de transparence visuelle : les visuels 3D et vidéos semblent flotter dans le vide tout en conservant 160° d’angle de vision.',
  },
  {
    id: 'module',
    index: '02',
    name: 'Quatre dalles film 500 × 1000 mm',
    subtitle: 'Ultra-fin 1,8 mm · 0,50 kg / module · Assemblage sans outil',
    thicknessMm: '1,8 mm',
    material: 'Substrat polymère optique noir perforé + bus micro-conducteur',
    description:
      'Quatre sections modulaires ultra-légères (0,50 kg chacune) remplaçables individuellement sans altérer le cadre ni la transparence de la vitrine.',
  },
  {
    id: 'chassis',
    index: '03',
    name: 'Cadre aluminium ultra-fin & coffret Plug-and-Play',
    subtitle: 'Profilé 55 mm · Prise secteur haut, HDMI, RJ45 & Wi-Fi',
    thicknessMm: '55,0 mm',
    material: 'Aluminium extrudé noir nervuré 15,92 kg (panneau nu) + œillets acier',
    description:
      'Cadre périmétrique évidé sans montant central : bandeau supérieur nervuré intégrant alimentation, prise C13 amovible, bouton de mise sous tension et pilotage Wi-Fi/App.',
  },
  {
    id: 'mount',
    index: '04',
    name: 'Système de pose : Sur pied, Mural ou Suspendu',
    subtitle: 'Pieds en A 500 mm · Rails muraux · Élingues plafond',
    thicknessMm: '3 modes',
    material: 'Brides sur roulettes / Équerres murales / Câbles acier haute résistance',
    description:
      'Trois méthodes d’installation dédiées sans empilement vertical : pose libre sur pieds en A à roulettes, fixation murale sur rails aluminium ou suspension haute par câbles acier.',
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
  rows: 1;
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

export function clampHorizontalPanelCount(count: number): HorizontalPanelCount {
  if (!Number.isFinite(count)) return 1;
  const rounded = Math.round(count);
  if (rounded <= 1) return 1;
  if (rounded === 2) return 2;
  if (rounded === 3) return 3;
  return 4;
}

export function getActiveHorizontalCols(panelCount: HorizontalPanelCount): number[] {
  if (panelCount === 1) return [0];
  if (panelCount === 2) return [0, 1];
  if (panelCount === 3) return [-1, 0, 1];
  return [-1, 0, 1, 2];
}

export function getHorizontalSlotIndex(col: number, panelCount: HorizontalPanelCount): number {
  if (panelCount === 1) return 0;
  if (panelCount === 2) return col; // 0, 1
  return col + 1; // [-1, 0, 1] -> 0, 1, 2 | [-1, 0, 1, 2] -> 0, 1, 2, 3
}

export function getHorizontalCenterOffset(panelCount: HorizontalPanelCount, cabinetWidth: number): number {
  return panelCount === 2 || panelCount === 4 ? -cabinetWidth * 0.5 : 0;
}

export function computeWallMetrics(
  pitchId: PitchTierId,
  panelCount: number,
  installationMode: InstallationModeId = 'standing',
): WallMetrics {
  const safeCols = clampHorizontalPanelCount(panelCount);
  const rows = 1 as const;
  const pitch = PITCH_SPECS[pitchId];
  const modeSpec = INSTALLATION_MODES[installationMode];

  const cabinetCount = safeCols;
  const moduleCount =
    cabinetCount *
    CABINET_DIMENSIONS.modulesPerCabinetX *
    CABINET_DIMENSIONS.modulesPerCabinetY;
  const totalWidthMm = safeCols * CABINET_DIMENSIONS.widthMm;
  const totalHeightMm = CABINET_DIMENSIONS.heightMm;
  const areaSqm = Number(((totalWidthMm * totalHeightMm) / 1_000_000).toFixed(2));
  const totalResX = safeCols * pitch.cabinetResX;
  const totalResY = pitch.cabinetResY;
  const unitWeightKg = CABINET_DIMENSIONS.hangingWeightKg + modeSpec.mountWeightKg;
  const totalWeightKg = Number((cabinetCount * unitWeightKg).toFixed(1));
  const typicalPowerW = Math.round(areaSqm * pitch.typicalPowerWPerSqm);
  const peakPowerW = Math.round(areaSqm * pitch.peakPowerWPerSqm);

  return {
    cols: safeCols,
    rows,
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
