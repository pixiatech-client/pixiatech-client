export type Product3DModelId =
  | 'model1-transparent'
  | 'model2-black'
  | 'model3-curved'
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
  },
  {
    id: 'model3-curved',
    number: 3,
    label: 'Dalle incurvée',
    sourceFolder: '0dalleencurvé',
    appearance: 'Dalle incurvable titanium, modes objet/surface, courbures G/D, éclaté et extraction de module.',
    thumbnail: '/product-3d/model3-curved/favicon_f9979c15.png',
    supportsInstallationModes: false,
    supportsCurvature: true,
    supportsWallGrids: false,
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
  },
  {
    id: 'model6-kinetic',
    number: 6,
    label: 'Dalle transparente 2026',
    sourceFolder: '0dalleTransparent2026',
    appearance: 'Dalle LED transparente 2026 IP65, châssis aluminium, grilles 1×1 à 3×3, courbures G/D, pieds et miroir au sol.',
    thumbnail: '/product-3d/model6-kinetic/favicon_f9979c15.png',
    supportsInstallationModes: false,
    supportsCurvature: true,
    supportsWallGrids: true,
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
