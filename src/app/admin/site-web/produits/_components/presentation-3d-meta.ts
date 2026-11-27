import {
  isProduct3DModelId,
  type Product3DModelId,
} from '@/components/product-3d/catalog';
import {
  product3DModelDisplayName,
  type Product3DModelNames,
} from '@/components/product-3d/model-names';

/**
 * Métadonnées d'affichage de la carte « Modèle de présentation 3D ».
 * Les identifiants restent ceux du catalogue PIXIATECH : seules les
 * étiquettes proviennent de la maquette de référence.
 */
export interface Presentation3DMeta {
  indexLabel: string;
  fallbackName: string;
  dimensions: string;
  category: string;
}

export const PRESENTATION_3D_META: Record<Product3DModelId, Presentation3DMeta> = {
  'model1-transparent': {
    indexLabel: '01',
    fallbackName: 'Holographique',
    dimensions: '100 × 100 cm · Film optique',
    category: 'Signalétique suspendue',
  },
  'model2-black': {
    indexLabel: '02',
    fallbackName: 'Dalle SMD 50x50',
    dimensions: '50 × 50 cm · Châssis aluminium',
    category: 'Modulaire standard',
  },
  'model3-curved': {
    indexLabel: '03',
    fallbackName: 'Dalle SMD 50x100',
    dimensions: '50 × 100 cm · Format vertical',
    category: 'Grand format scène',
  },
  'model5-simple': {
    indexLabel: '04',
    fallbackName: 'Dalle Sample',
    dimensions: '32 × 32 cm · Module démo',
    category: 'Coffret de présentation',
  },
  'model6-kinetic': {
    indexLabel: '05',
    fallbackName: 'Transparent',
    dimensions: '100 × 100 cm · Lame vitrine',
    category: 'Façade architecturale',
  },
};

/** Nom commercial : personnalisation PIXIATECH d'abord, repli de maquette ensuite. */
export function presentation3DName(
  modelId: string,
  names?: Product3DModelNames | null
): string {
  if (!isProduct3DModelId(modelId)) return product3DModelDisplayName(modelId, names);
  return names?.[modelId]?.trim() || PRESENTATION_3D_META[modelId].fallbackName;
}

export function presentation3DMeta(modelId: string): Presentation3DMeta | null {
  return isProduct3DModelId(modelId) ? PRESENTATION_3D_META[modelId] : null;
}
