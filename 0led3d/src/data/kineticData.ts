export interface FeaturedSpec {
  label: string;
  value: string;
  detail: string;
}

export type CuratedThemeId =
  | 'show_prism'
  | 'show_organic'
  | 'amber'
  | 'liquid_gold'
  | 'cryo'
  | 'monolith';

export interface CuratedShowOption {
  id: string;
  label: string;
  theme: CuratedThemeId | 'video';
  accent: string;
  /**
   * Configuration développeur : renseignez ici l'URL d'une vidéo MP4/WebM locale
   * (ex: '/videos/showreel.mp4' dans public/videos/) pour remplacer le flux procédural.
   */
  videoUrl?: string;
}

export const CURATED_SHOWS: CuratedShowOption[] = [
  { id: 'prism', label: 'Prismatique', theme: 'show_prism', accent: '#A855F7' },
  { id: 'organic', label: 'Organique', theme: 'show_organic', accent: '#38BDF8' },
  { id: 'amber', label: 'Ambre', theme: 'amber', accent: '#E87A24' },
  { id: 'gold', label: 'Or', theme: 'liquid_gold', accent: '#F5C451' },
  { id: 'cryo', label: 'Cryo', theme: 'cryo', accent: '#0EA5E9' },
  { id: 'monolith', label: 'Titane', theme: 'monolith', accent: '#E4E4E7' },
];

export type ComponentPartId =
  | 'motion_unit'
  | 'linear_rail'
  | 'motion_controller'
  | 'quick_lock'
  | 'die_cast_cabinet';

export interface KineticComponentInfo {
  id: ComponentPartId;
  code: string;
  label: string;
  metric: string;
  description: string;
}

export const KINETIC_COMPONENTS: KineticComponentInfo[] = [
  {
    id: 'motion_unit',
    code: '01',
    label: 'Unité motrice',
    metric: '250 × 250 mm',
    description: 'Actionneur 4-en-1 synchrone à vis à billes haute précision (course 250 mm).',
  },
  {
    id: 'linear_rail',
    code: '02',
    label: 'Glissières linéaires',
    metric: 'Double rail inox',
    description: 'Guidage rectifié sans jeu assurant un déplacement silencieux < 24 dBA.',
  },
  {
    id: 'motion_controller',
    code: '03',
    label: 'Contrôleur cinétique',
    metric: 'CryoCathode',
    description: 'Étage de puissance et dissipation passive sans ventilateur intégrés au châssis.',
  },
  {
    id: 'quick_lock',
    code: '04',
    label: 'Verrouillage Quick-Lock',
    metric: 'Sans outil',
    description: 'Loquets d’alignement rapide et broches coniques à interstice de 1,5 mm.',
  },
  {
    id: 'die_cast_cabinet',
    code: '05',
    label: 'Caisson moulé',
    metric: '500 × 500 mm',
    description: 'Châssis aluminium moulé sous pression avec surface matte OptiShield IP65.',
  },
];

export interface HeroMetricItem {
  value: string;
  label: string;
}

export const HERO_METRICS: HeroMetricItem[] = [
  { value: '250 × 250', label: 'Unité motrice · mm' },
  { value: '500 × 500', label: 'Caisson · mm' },
  { value: '1,5 mm', label: 'Interstice optique' },
  { value: 'Quick-Lock', label: 'Montage sans outil' },
  { value: 'Die-Cast', label: 'Châssis aluminium' },
];

export const FEATURED_ASSETS = {
  heroWall: '/src/assets/images/hero_kinetic_wall_1795529925891.jpg',
  moduleRail: '/src/assets/images/module_rail_detail_1795529925381.jpg',
};

export const FEATURED_SPECS: FeaturedSpec[] = [
  { label: 'Format caisson', value: '500 × 500 mm', detail: 'Aluminium moulé sous pression' },
  { label: 'Unité motrice', value: '250 × 250 mm (4-en-1)', detail: 'Rails inox & vis à billes' },
  { label: 'Course axiale', value: '0 – 250 mm', detail: 'Répétabilité ±0,15 mm' },
  { label: 'Interstice module', value: '1,5 mm', detail: 'Alignement Quick-Lock conique' },
  { label: 'Vitesse maximale', value: '1,20 m/s', detail: 'Acoustique < 24 dBA' },
  { label: 'Gestion thermique', value: 'CryoCathode', detail: '145 W/m² sans ventilateur' },
  { label: 'Protection frontale', value: 'OptiShield IP65', detail: 'Surface mate anti-moiré' },
  { label: 'Pilotage temps réel', value: 'Art-Net 4 / sACN', detail: 'Synchronisation SMPTE' },
];


