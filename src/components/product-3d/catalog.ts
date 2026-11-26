export type Product3DModelId =
  | 'model1-transparent'
  | 'model2-black'
  | 'model3-curved'
  | 'model4-wall'
  | 'model5-simple'
  | 'model6-kinetic';

export type Product3DDefinition = {
  id: Product3DModelId;
  number: number;
  label: string;
  sourceFolder: string;
  appearance: string;
  thumbnail: string;
  supportsInstallationModes: boolean;
  supportsCurvature: boolean;
  supportsWallGrids: boolean;
  supportsVideo: boolean;
};

export const PRODUCT_3D_MODELS: Product3DDefinition[] = [
  {
    id: 'model1-transparent',
    number: 1,
    label: 'Dalle transparente',
    sourceFolder: '0dalleTransparent',
    appearance: 'Dalle LED transparente IP65, châssis aluminium, grilles 1×1 à 3×3, courbures G/D, pieds et miroir au sol.',
    thumbnail: '/product-3d/model1-transparent/favicon_f9979c15.png',
    supportsInstallationModes: false,
    supportsCurvature: true,
    supportsWallGrids: true,
    supportsVideo: false,
  },
  {
    id: 'model2-black',
    number: 2,
    label: 'Dalle noire',
    sourceFolder: '0dalleblack',
    appearance: 'Dalle LED obsidienne monobloc, grilles 1×1 à 3×3, courbures G/D, pieds et miroir au sol.',
    thumbnail: '/product-3d/model2-black/favicon_f9979c15.png',
    supportsInstallationModes: false,
    supportsCurvature: true,
    supportsWallGrids: true,
    supportsVideo: false,
  },
  {
    id: 'model3-curved',
    number: 3,
    label: 'Dalle incurvée',
    sourceFolder: '0dalleincurvé',
    appearance: 'Dalle incurvable titanium, modes objet/surface, courbures G/D, éclaté et extraction de module.',
    thumbnail: '/product-3d/model3-curved/favicon_f9979c15.png',
    supportsInstallationModes: false,
    supportsCurvature: true,
    supportsWallGrids: false,
    supportsVideo: false,
  },
  {
    id: 'model4-wall',
    number: 4,
    label: 'Poster mural holographique',
    sourceFolder: '0dallemural',
    appearance: 'Film LED 1,8 mm transparent à 92 %, 1 à 4 panneaux, pose sur pied/mural/suspendu, motif vidéo importable.',
    thumbnail: '/product-3d/model4-wall/favicon_f9979c15.png',
    supportsInstallationModes: true,
    supportsCurvature: false,
    supportsWallGrids: false,
    supportsVideo: true,
  },
  {
    id: 'model5-simple',
    number: 5,
    label: 'Dalle simple',
    sourceFolder: '0dallesemple',
    appearance: 'Dalle monobloc épurée, modes objet/surface, éclaté et extraction magnétique du module.',
    thumbnail: '/product-3d/model5-simple/favicon_f9979c15.png',
    supportsInstallationModes: false,
    supportsCurvature: false,
    supportsWallGrids: false,
    supportsVideo: false,
  },
  {
    id: 'model6-kinetic',
    number: 6,
    label: 'Mur cinétique MK-250',
    sourceFolder: '0led3d',
    appearance: 'Mur LED cinétique à modules mobiles, 5 motifs, bloom, 4 caméras, blueprint déplaçable et relief vidéo.',
    thumbnail: '/product-3d/model6-kinetic/hero_kinetic_wall_1795529925891.jpg',
    supportsInstallationModes: false,
    supportsCurvature: false,
    supportsWallGrids: false,
    supportsVideo: true,
  },
];

export const DEFAULT_PRODUCT_3D_MODEL: Product3DModelId = 'model5-simple';

export function isProduct3DModelId(value: unknown): value is Product3DModelId {
  return PRODUCT_3D_MODELS.some((model) => model.id === value);
}

export function getProduct3DDefinition(value: unknown): Product3DDefinition {
  return (
    PRODUCT_3D_MODELS.find((model) => model.id === value) ??
    PRODUCT_3D_MODELS.find((model) => model.id === DEFAULT_PRODUCT_3D_MODEL)!
  );
}
