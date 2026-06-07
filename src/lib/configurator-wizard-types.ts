
export type ProjectType = 'vente' | 'location';
export type Environment = 'interieur' | 'semi-exterieur' | 'exterieur';
export type ViewingDistance = string;
export type PixelPitch = string;

export interface ConfigState {
  step: number;
  projectType: ProjectType;
  environment: Environment;
  viewingDistance: ViewingDistance;
  pixelPitch: PixelPitch;
  width: number;
  height: number;
  installationPhoto: string | null;
  selectedProduct: string | null;
  selectedProducts: string[];
  selectionMode: 'single' | 'multi';
  delivery: string | null;
  installation: string | null;
  rentalStartDate: string | null;
  rentalEndDate: string | null;
  rentalDate: string | null;
  rentalStartTime: string | null;
  rentalEndTime: string | null;
  quantity: number;
  quantities: Record<string, number>;
  isCurved: boolean;
  curveLeft: number;
  curveRight: number;
  is360: boolean;
  diameter: number;
  cabinetAngle: number;
  envColor: string;
  gridColor: string;
}

export const INITIAL_STATE: ConfigState = {
  step: 1,
  projectType: 'vente',
  environment: 'interieur',
  viewingDistance: '2-5m',
  pixelPitch: 'P2.5',
  width: 12,
  height: 6.5,
  installationPhoto: null,
  selectedProduct: null,
  selectedProducts: [],
  selectionMode: 'single',
  delivery: null,
  installation: null,
  rentalStartDate: null,
  rentalEndDate: null,
  rentalDate: null,
  rentalStartTime: '08:00',
  rentalEndTime: '18:00',
  quantity: 1,
  quantities: {},
  isCurved: false,
  curveLeft: 0,
  curveRight: 0,
  is360: false,
  diameter: 1.0,
  cabinetAngle: 0,
  envColor: '#f8fafc',
  gridColor: '#e2e8f0',
};
