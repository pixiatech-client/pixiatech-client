export const STEP_ROUTES: Record<number, string> = {
  1: '/produits-recommandes',
  2: '/livraison',
  3: '/installation',
  4: '/resume-estimation',
  5: '/contrat-signature',
  6: '/verification-securite',
  7: '/projet-termine',
};

export const ROUTE_STEP_MAP: Record<string, number> = {
  'produits-recommandes': 1,
  'livraison': 2,
  'installation': 3,
  'resume-estimation': 4,
  'contrat-signature': 5,
  'verification-securite': 6,
  'projet-termine': 7,
};

export const VALID_STEPS = [
  'produits-recommandes',
  'livraison',
  'installation',
  'resume-estimation',
  'contrat-signature',
  'verification-securite',
  'projet-termine',
];
