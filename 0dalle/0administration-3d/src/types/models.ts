export type PresentationModelId =
  | 'holographique'
  | 'smd-50x50'
  | 'smd-50x100'
  | 'dalle-sample'
  | 'transparent';

export interface PresentationModelSpec {
  id: PresentationModelId;
  indexLabel: string;
  name: string;
  displayLabel: string;
  dimensions: string;
  category: string;
}

export type ModelActivationMap = Record<PresentationModelId, boolean>;

export const PRESENTATION_MODELS: readonly PresentationModelSpec[] = [
  {
    id: 'holographique',
    indexLabel: '01',
    name: 'Holographique',
    displayLabel: 'Holographique',
    dimensions: '100 × 100 cm · Film optique',
    category: 'Signalétique suspendue',
  },
  {
    id: 'smd-50x50',
    indexLabel: '02',
    name: 'Dalle SMD 50x50',
    displayLabel: 'Dalle SMD 50×50',
    dimensions: '50 × 50 cm · Châssis aluminium',
    category: 'Modulaire standard',
  },
  {
    id: 'smd-50x100',
    indexLabel: '03',
    name: 'Dalle SMD 50x100',
    displayLabel: 'Dalle SMD 50×100',
    dimensions: '50 × 100 cm · Format vertical',
    category: 'Grand format scène',
  },
  {
    id: 'dalle-sample',
    indexLabel: '04',
    name: 'Dalle Sample',
    displayLabel: 'Dalle Sample',
    dimensions: '32 × 32 cm · Module démo',
    category: 'Coffret de présentation',
  },
  {
    id: 'transparent',
    indexLabel: '05',
    name: 'Transparent',
    displayLabel: 'Transparent',
    dimensions: '100 × 100 cm · Lame vitrine',
    category: 'Façade architecturale',
  },
] as const;

export const DEFAULT_ACTIVE_MODEL_ID: PresentationModelId = 'smd-50x50';
