export interface XeronProduct {
  slug: string;
  name: string;
  environment: string;
  category: string;
  menuGroup: string | null;
  menuTag: string | null;
  shortDesc: string;
  apps: string[];
}

// Extracted from the live xeron.co /en/products flight payload (39 series).
export const XERON_PRODUCTS: XeronProduct[] = [
  { slug: 'wp', name: 'XR Fine', environment: 'INDOOR', category: 'Indoor LED display', menuGroup: 'FIXED INSTALLATION / INDOOR', menuTag: 'FINE PITCH', shortDesc: 'The wallpaper-thin LED display engineered for spaces where thermal control, reliability and architectural integration are critical.', apps: ['Corporate', 'Control Room', 'Retail', 'XR / VP'] },
  { slug: 'wt', name: 'XR Ultra', environment: 'INDOOR', category: 'Indoor fine-pitch LED', menuGroup: 'FIXED INSTALLATION / INDOOR', menuTag: 'ULTRA-THIN', shortDesc: 'The micro-pitch LED display engineered for control rooms, broadcast studios and premium interiors.', apps: ['Corporate', 'Control Room', 'Broadcast'] },
  { slug: 'wpwrap', name: 'XR Wrap', environment: 'INDOOR', category: 'Indoor LED display', menuGroup: 'FIXED INSTALLATION / INDOOR', menuTag: 'CURVED WRAP', shortDesc: 'The LED display engineered to wrap panoramic control room and command center environments.', apps: ['Corporate', 'Retail', 'Rental', 'XR / VP'] },
  { slug: 'wv', name: 'XR Seamless', environment: 'INDOOR', category: 'Indoor control room LED', menuGroup: 'FIXED INSTALLATION / INDOOR', menuTag: 'CONTROL ROOM', shortDesc: 'The LED display engineered for control rooms that need native 2K, 4K and 8K performance.', apps: ['Control Room'] },
  { slug: 'gemini', name: 'XR Twin', environment: 'INDOOR', category: 'Dual-sided indoor LED', menuGroup: 'FIXED INSTALLATION / INDOOR', menuTag: 'DUAL-SIDED', shortDesc: 'The dual-sided LED display engineered for airports, transit hubs and retail.', apps: ['Corporate', 'Retail', 'Rental'] },
  { slug: 'orion', name: 'XR Orion', environment: 'INDOOR', category: 'Indoor collaboration LED', menuGroup: 'FIXED INSTALLATION / INDOOR', menuTag: 'ALL-IN-ONE', shortDesc: 'LED display, 4K AI camera, speakers, Android system and 10-point touch — fully integrated.', apps: ['Corporate'] },
  { slug: 'mv', name: 'XR Vision', environment: 'OUTDOOR', category: 'Outdoor LED display — next generation', menuGroup: 'OUTDOOR / DOOH', menuTag: 'DOOH', shortDesc: 'The next generation of outdoor commercial LED display — engineered for DOOH networks and landmark installations.', apps: ['DOOH', 'Corporate', 'Rental', 'Retail'] },
  { slug: 'mvedge', name: 'XR Edge', environment: 'OUTDOOR', category: 'Outdoor curved LED', menuGroup: 'OUTDOOR / DOOH', menuTag: 'CURVED FAÇADE', shortDesc: 'The outdoor LED module engineered for convex architectural façades.', apps: ['DOOH', 'Retail', 'Creative'] },
  { slug: 'mvmesh', name: 'XR Air', environment: 'OUTDOOR', category: 'Outdoor transparent LED', menuGroup: 'TRANSPARENT', menuTag: 'OUTDOOR MESH', shortDesc: 'A transparent outdoor LED display that lets air, light and architecture show through.', apps: ['Transparent', 'DOOH', 'Retail'] },
  { slug: 'rs', name: 'XR Rugged', environment: 'IN / OUT', category: 'Indoor / Outdoor rental LED', menuGroup: 'OUTDOOR / DOOH', menuTag: 'RUGGED', shortDesc: 'The rental display that lifted the industry standard by dropping the weight.', apps: ['Rental', 'DOOH'] },
  { slug: 'armk2', name: 'XR Flex', environment: 'IN / OUT', category: 'Indoor / Outdoor rental LED', menuGroup: 'RENTAL & STAGING', menuTag: 'FLEXIBLE', shortDesc: 'The rugged rental platform for events, touring and XR/VP — smart quick-locks, telescopic alignment.', apps: ['Rental', 'DOOH', 'XR / VP'] },
  { slug: 'art', name: 'XR Bastion', environment: 'IN / OUT', category: 'Outdoor touring LED', menuGroup: 'RENTAL & STAGING', menuTag: 'TOURING', shortDesc: 'The heavy-duty outdoor touring system for the world’s largest stages — carbon fiber strength, 20 m/s wind resistance.', apps: ['Rental'] },
  { slug: 'xmk2', name: 'XR Arc', environment: 'INDOOR', category: 'Curved creative LED', menuGroup: 'RENTAL & STAGING', menuTag: 'CURVED', shortDesc: 'The patented ±30° curved display for premium installations — seven precise angle positions.', apps: ['Rental', 'Corporate', 'XR / VP', 'Creative'] },
  { slug: 'xmk3', name: 'XR Arc II', environment: 'INDOOR', category: 'Curved creative LED', menuGroup: 'RENTAL & STAGING', menuTag: 'CURVED — NEXT-GEN', shortDesc: 'The ultra-flexible curved display that builds XR-ready waves and cylinders from single cabinets.', apps: ['Rental', 'Corporate', 'XR / VP'] },
  { slug: 'dbmk2', name: 'XR Modul', environment: 'INDOOR', category: 'Ultra-Black LED display', menuGroup: null, menuTag: null, shortDesc: 'The one-for-all indoor rental platform — flat, faceted, curved, right-angled or cubed, all from one inventory.', apps: ['Rental', 'Corporate', 'XR / VP'] },
  { slug: 'ezmk2', name: 'XR Essential', environment: 'INDOOR', category: 'Indoor fine-pitch rental LED', menuGroup: 'FIXED INSTALLATION / INDOOR', menuTag: 'ULTRA-THIN', shortDesc: 'The featherweight indoor rental display — 5.9 kg magnesium cabinets, quick-lock assembly, camera-ready fine pitch.', apps: ['Corporate', 'Retail', 'Rental'] },
  { slug: 'orez', name: 'XR Event', environment: 'OUTDOOR', category: 'Outdoor fine-pitch LED', menuGroup: null, menuTag: null, shortDesc: 'The energy-efficient 2.6 mm outdoor display with performance black LEDs, up to 5,000 nits.', apps: ['Rental', 'DOOH'] },
  { slug: 'titanx', name: 'XR Titan', environment: 'OUTDOOR', category: 'Outdoor transparent touring LED', menuGroup: 'RENTAL & STAGING', menuTag: 'LARGE FORMAT', shortDesc: 'The extra-large transparent touring system for mega outdoor stages — 70% transparency, foldable wind bracing.', apps: ['Transparent', 'Rental', 'DOOH'] },
  { slug: 'ammk2', name: 'XR Veil', environment: 'OUTDOOR', category: 'Outdoor transparent mesh LED', menuGroup: 'TRANSPARENT', menuTag: 'OUTDOOR MESH', shortDesc: 'The high-transparency outdoor mesh display engineered for creative stages.', apps: ['Transparent', 'Rental', 'DOOH'] },
  { slug: 'amt', name: 'XR Drape', environment: 'OUTDOOR', category: 'Outdoor touring mesh LED', menuGroup: 'TRANSPARENT', menuTag: 'TOURING MESH', shortDesc: 'The 70% transparency touring mesh engineered for large concerts, festivals and DOOH.', apps: ['Transparent', 'Rental', 'DOOH'] },
  { slug: 'bwamt', name: 'XR Nova', environment: 'OUTDOOR', category: 'Hybrid solid + mesh touring LED', menuGroup: 'RENTAL & STAGING', menuTag: 'DYNAMIC MODES', shortDesc: 'One touring ecosystem that moves from full-surface impact to 51% transparency — dynamic resolution.', apps: ['Transparent', 'Rental', 'Retail', 'DOOH'] },
  { slug: 'holo', name: 'XR Holo', environment: 'OUTDOOR', category: 'Outdoor transparent creative LED', menuGroup: 'TRANSPARENT', menuTag: 'HOLOGRAM', shortDesc: 'The high-transparency outdoor LED that curves — 50% see-through, 4500 nits.', apps: ['Transparent', 'Rental', 'DOOH'] },
  { slug: 'sf', name: 'XR Curve', environment: 'INDOOR', category: 'Flexible indoor LED', menuGroup: 'CREATIVE / XR & VP', menuTag: 'FLEXIBLE', shortDesc: 'The ultra-flexible LED engineered for curves rigid cabinets can’t follow — concave, convex, cylindrical, sculptural.', apps: ['Rental', 'Retail', 'Creative'] },
  { slug: 'mc', name: 'XR Cube', environment: 'IN / OUT', category: 'Creative corner & cube LED', menuGroup: 'CREATIVE / XR & VP', menuTag: 'CORNER & CUBE', shortDesc: 'MagCube — the creative rental system for 90° corners, 6-face cubes and complex geometries.', apps: ['Rental', 'XR / VP', 'Creative'] },
  { slug: 'rc', name: 'XR Column', environment: 'INDOOR', category: 'Indoor LED column', menuGroup: null, menuTag: null, shortDesc: 'The lightweight four-sided LED column for immersive spaces.', apps: ['Retail', 'Creative'] },
  { slug: 'dfmk2', name: 'XR Floor', environment: 'IN / OUT', category: 'LED floor system', menuGroup: 'CREATIVE / XR & VP', menuTag: 'LED FLOOR', shortDesc: 'The load-bearing LED floor engineered for XR, virtual production and immersive events — 1,500 kg/m² capacity.', apps: ['Rental', 'Retail', 'XR / VP', 'Corporate'] },
  { slug: 'studio', name: 'XR Studio', environment: 'INDOOR', category: 'Ceiling/background/floor studio LED', menuGroup: 'CREATIVE / XR & VP', menuTag: 'LED VOLUMES', shortDesc: 'The complete LED ecosystem for virtual production — ceiling, background and floor, engineered together for flicker-free filming.', apps: ['XR / VP'] },
  { slug: 'sp', name: 'XR Arena', environment: 'OUTDOOR', category: 'Stadium perimeter LED', menuGroup: 'SPORTS', menuTag: 'PERIMETER', shortDesc: 'The stadium perimeter display engineered to UEFA requirements — redundant power and signal.', apps: ['Sports', 'DOOH'] },
  { slug: 'spki', name: 'SPKI Kinetic Series', environment: 'INDOOR', category: 'Indoor 3D kinetic LED', menuGroup: 'KINETIC', menuTag: 'MOVING PIXELS', shortDesc: 'Indoor kinetic LED with 128–250 mm motion units on the Z-axis.', apps: ['Kinetic', 'Creative', 'Retail', 'Rental', 'Corporate'] },
  { slug: 'kin160', name: 'SPKO Kinetic Series', environment: 'OUTDOOR', category: 'Outdoor 3D kinetic LED', menuGroup: 'KINETIC', menuTag: 'OUTDOOR', shortDesc: 'Outdoor kinetic LED with 400–600 mm strokes — weather-protected motion units.', apps: ['Kinetic', 'Creative', 'DOOH'] },
  { slug: 'jfglass', name: 'Jellyfish Hologram Glass', environment: 'INDOOR', category: 'Glass-encapsulated transparent LED', menuGroup: 'TRANSPARENT', menuTag: 'HOLOGRAM / GLASS', shortDesc: 'LED pixels laminated inside architectural glass — a transparent display that keeps the view, the daylight and the façade.', apps: ['Transparent', 'Creative', 'Retail', 'Corporate'] },
  { slug: 'jfholo', name: 'Jellyfish Hologram Display', environment: 'INDOOR', category: 'Holographic invisible screen', menuGroup: 'TRANSPARENT', menuTag: 'HOLOGRAM', shortDesc: 'An ultra-thin, high-transparency screen that blends into any environment — plug-and-play, 160° viewing.', apps: ['Transparent', 'Creative', 'Retail'] },
  { slug: 'jffilm', name: 'Jellyfish LED Film', environment: 'INDOOR', category: 'Flexible transparent LED film', menuGroup: 'TRANSPARENT', menuTag: 'LED FILM', shortDesc: 'A flexible transparent LED film — 2 mm thin, up to 98% transparent — bonds to windows, curtain walls and curved glass.', apps: ['Transparent', 'Creative', 'Retail', 'DOOH'] },
  { slug: 'poster', name: 'Poster LED Display', environment: 'INDOOR', category: 'Freestanding LED poster', menuGroup: 'FIXED INSTALLATION / INDOOR', menuTag: 'FREESTANDING', shortDesc: 'Slim, freestanding LED poster for retail, lobbies and events — floor-standing, hanging or wall-mounted, plug in and play.', apps: ['Retail', 'Corporate'] },
  { slug: 'halo', name: 'XR Spin', environment: 'IN / OUT', category: 'Holographic 3D fan display', menuGroup: 'CREATIVE / XR & VP', menuTag: 'HOLOGRAM FAN', shortDesc: 'Naked-eye 3D holographic fan displays from Ø 42 cm desktop units to a 280 cm outdoor wall.', apps: ['Creative', 'Retail', 'DOOH'] },
  { slug: 'ap', name: 'AP Series', environment: 'IN / OUT', category: 'Indoor / Outdoor rental LED', menuGroup: 'RENTAL & STAGING', menuTag: 'GENERAL PURPOSE', shortDesc: 'The general-purpose rental LED that goes wherever the job goes — indoor or outdoor, ultra-light magnesium cabinets.', apps: ['Rental'] },
  { slug: 'gxmk2', name: 'GXmk2 Series', environment: 'IN / OUT', category: 'Indoor / Outdoor creative rental LED', menuGroup: 'RENTAL & STAGING', menuTag: 'FLEXIBLE', shortDesc: 'The creative rental platform with the widest reach — fine pitch to large stage, indoor to outdoor, flat to curved.', apps: ['Rental', 'Creative'] },
  { slug: 'javelin', name: 'Javelin Series', environment: 'OUTDOOR', category: 'Outdoor LED bar system', menuGroup: null, menuTag: null, shortDesc: 'The minimalist LED bar that turns lines into architecture — 6000 nits bright, 1.5 kg light.', apps: [] },
  { slug: 'wk', name: 'WK Series', environment: 'INDOOR', category: 'Indoor fine-pitch LED display', menuGroup: 'FIXED INSTALLATION / INDOOR', menuTag: 'FINE PITCH', shortDesc: 'High-resolution fine-pitch LED engineered for corporate, education and value-driven projects.', apps: ['Corporate'] },
];

export const PRODUCT_APPS = [
  'Corporate',
  'Control Room',
  'Retail',
  'DOOH',
  'Rental',
  'Sports',
  'XR / VP',
  'Creative',
  'Kinetic',
  'Transparent',
];

export interface Market {
  img: string;
  index: string;
  title: string;
  desc: string;
  link: string;
}

export const XERON_MARKETS: Market[] = [
  { img: '/uploads/site/market-corporate.jpg', index: '01', title: 'CORPORATE', desc: 'Precision displays for spaces where every detail matters.', link: 'EXPLORE CORPORATE →' },
  { img: '/uploads/site/market-retail.jpg', index: '02', title: 'RETAIL', desc: 'Displays that turn visitors into audiences.', link: 'EXPLORE RETAIL →' },
  { img: '/uploads/site/market-dooh.jpg', index: '03', title: 'DOOH', desc: 'The urban canvas — bright, bold and built for the elements.', link: 'EXPLORE DOOH →' },
  { img: '/uploads/site/market-rental.jpg', index: '04', title: 'RENTAL & EVENTS', desc: 'Fast to build, safe to tour, impossible to ignore.', link: 'EXPLORE RENTAL & EVENTS →' },
  { img: '/uploads/site/market-xr.jpg', index: '05', title: 'XR & VIRTUAL PRODUCTION', desc: 'Precision-built for the camera.', link: 'EXPLORE XR & VIRTUAL PRODUCTION →' },
  { img: '/uploads/site/market-sports.jpg', index: '06', title: 'SPORTS', desc: 'Engineered for stadium scale and broadcast light.', link: 'EXPLORE SPORTS →' },
  { img: '/uploads/site/market-control.jpg', index: '07', title: 'CONTROL ROOMS', desc: '24/7 reliability for mission-critical environments.', link: 'EXPLORE CONTROL ROOMS →' },
  { img: '/uploads/site/market-creative.jpg', index: '08', title: 'CREATIVE & ARCHITECTURE', desc: 'Curved, transparent and sculptural surfaces.', link: 'EXPLORE CREATIVE & ARCHITECTURE →' },
];

export interface Tech {
  img: string;
  index: string;
  name: string;
  desc: string;
  expand?: boolean;
}

export const XERON_TECHS: Tech[] = [
  { img: '/uploads/site/tech-coldled.jpg', index: '01', name: 'COLDLED', desc: 'Heat is the enemy of LED performance. ColdLED eliminates it — extending lifespan and maintaining brightness where others fade.', expand: true },
  { img: '/uploads/site/tech-solidskin.jpg', index: '02', name: 'SOLIDSKIN', desc: 'A reinforced surface layer that protects LED modules — boosting impact resistance, durability and long-term visual performance.' },
  { img: '/uploads/site/tech-armorled.jpg', index: '03', name: 'ARMORLED', desc: 'Reinforced LED soldering connections improve impact resistance by 3–5× for tougher, more reliable displays.' },
  { img: '/uploads/site/tech-cbsf.jpg', index: '04', name: 'CBSF', desc: 'Harmonizes performance across every pixel — minimizing color shift and brightness inconsistency across a wide viewing angle.' },
  { img: '/uploads/site/tech-infinite.jpg', index: '05', name: 'INFINITE COLORS', desc: 'Expands LED beyond RGB with an added warm white emitter — richer spectrum control, natural skin tones and production-ready lighting.' },
];

export interface ProcessStep {
  index: string;
  title: string;
  desc: string;
}

export const XERON_PROCESS: ProcessStep[] = [
  { index: '01', title: 'DISCOVER', desc: 'Understanding the environment, audience and project objectives.' },
  { index: '02', title: 'ENGINEER', desc: 'Pixel pitch, brightness, structure and system architecture.' },
  { index: '03', title: 'DESIGN', desc: 'Architectural and visual integration.' },
  { index: '04', title: 'CREATE', desc: 'LED-native content production — motion design tailored to each screen’s resolution, form and environment.' },
  { index: '05', title: 'INSTALL', desc: 'Professional on-site implementation.' },
  { index: '06', title: 'CALIBRATE', desc: 'Image optimization and system commissioning.' },
  { index: '07', title: 'SUPPORT', desc: 'Maintenance and long-term technical service.' },
];

export interface Project {
  img: string;
  title: string;
  titleFr?: string;
  meta: string;
  tag: string;
}

export const XERON_PROJECTS: Project[] = [
  { img: '/uploads/projects/how-xeron-elevates-shenzhen-happy-valleys-summer-festival-stage.jpg', title: 'How PixiaTech Elevates Shenzhen Happy Valley&rsquo;s Summer Festival Stage', titleFr: 'Comment PixiaTech sublime la scène du festival d’été de Shenzhen Happy Valley', meta: 'China — 2026', tag: 'RENTAL & EVENTS' },
  { img: '/uploads/projects/university-of-aucklands-hiwa-recreation-and-wellbeing-centre.jpg', title: 'University of Auckland’s Hiwa Recreation and Wellbeing Centre', titleFr: 'Le centre de loisirs et de bien-être Hiwa de l’Université d’Auckland', meta: 'New Zealand — 2026', tag: 'EDUCATION' },
  { img: '/uploads/projects/xeron-powers-up-the-uaes-state-of-the-art-production-studio.jpg', title: 'PixiaTech Powers Up the UAE&rsquo;s State-of-The-Art Production Studio', titleFr: 'PixiaTech alimente le studio de production ultramoderne des Émirats arabes unis', meta: 'UAE', tag: 'XR / VP' },
  { img: '/uploads/projects/led-wall-evokes-early-cinema-effects-for-poor-things.jpg', title: 'LED Wall Evokes Early-Cinema Effects for Poor Things', titleFr: 'Un mur LED évoque les effets du cinéma primitif pour Poor Things', meta: 'Hungary — 2024', tag: 'RENTAL & EVENTS' },
];

export interface Insight {
  slug: string;
  img: string;
  category: string;
  chip: string;
  title: string;
  titleFr?: string;
  desc?: string;
  descFr?: string;
  read: string;
  date: string;
  tag?: string;
  featured?: boolean;
}

export const XERON_INSIGHTS: Insight[] = [
  { slug: 'stadium-led-screens', img: '/uploads/site/ins-stadium-led-screens.jpg', category: 'GUIDE — FEATURED', chip: 'Guides', tag: 'GUIDE', title: 'Stadium and arena LED screens: scoreboards, perimeter boards and ribbon displays explained', titleFr: 'Écrans LED de stade : tableaux de score, panneaux de périmètre et bandeaux expliqués', desc: 'Stadium LED screen guide: scoreboards, perimeter boards, ribbon displays and center-hung cubes, with pixel pitch, broadcast, brightness and structure explained.', descFr: 'Guide des écrans de stade : tableaux de score, panneaux de périmètre, bandeaux et cubes centraux, avec pas de pixel, diffusion, luminosité et structure expliqués.', read: '11 MIN READ', date: '20 SEPT 2026', featured: true },
  { slug: 'led-screen-installation', img: '/uploads/site/ins-led-screen-installation.jpg', category: 'GUIDE', chip: 'Guides', title: 'LED screen installation: seven steps from site survey to commissioning', titleFr: 'Installation d’un écran LED : sept étapes, de l’étude de site à la mise en service', read: '11 MIN READ', date: '18 SEPT 2026' },
  { slug: 'led-screen-power-consumption', img: '/uploads/site/ins-led-screen-power-consumption.jpg', category: 'LED TECHNOLOGY', chip: 'LED Technology', title: 'How much electricity does an LED screen use? Calculating power draw and cutting it', titleFr: 'Combien d’électricité consomme un écran LED ? Calculer la puissance et la réduire', read: '10 MIN READ', date: '16 SEPT 2026' },
  { slug: 'led-floor-screens', img: '/uploads/site/ins-led-floor-screens.jpg', category: 'GUIDE', chip: 'Guides', title: 'LED floor screens: a guide for dance floors, stages and interactive floors', titleFr: 'Écrans de sol LED : guide pour pistes de danse, scènes et sols interactifs', read: '10 MIN READ', date: '14 SEPT 2026' },
  { slug: 'led-sign-vs-led-screen', img: '/uploads/site/ins-led-sign-vs-led-screen.jpg', category: 'COMPARISON', chip: 'Case Studies', title: 'LED sign or LED screen? The differences and how to choose for your business', titleFr: 'Enseigne LED ou écran LED ? Les différences et comment choisir pour votre entreprise', read: '10 MIN READ', date: '12 SEPT 2026' },
  { slug: 'led-screen-rental-guide', img: '/uploads/site/ins-led-screen-rental-guide.jpg', category: 'GUIDE', chip: 'Guides', title: 'LED screen rental guide 2026: how to size a wall, choose a pixel pitch and compare quotes', titleFr: 'Guide de location d’écrans LED 2026 : dimensionner un mur, choisir le pas de pixel et comparer les devis', read: '11 MIN READ', date: '10 SEPT 2026' },
  { slug: 'led-screen-prices', img: '/uploads/site/ins-led-screen-prices.jpg', category: 'GUIDE', chip: 'Guides', title: 'What sets the price of an LED display? The 8 factors behind the cost per square metre', titleFr: 'Qu’est-ce qui fixe le prix d’un écran LED ? Les 8 facteurs derrière le coût au mètre carré', read: '12 MIN READ', date: '09 SEPT 2026' },
  { slug: 'led-in-outdoor-advertising', img: '/uploads/site/ins-led-in-outdoor-advertising.jpg', category: 'DOOH', chip: 'DOOH', title: 'Why LED screens now lead outdoor advertising: DOOH versus static billboards', titleFr: 'Pourquoi les écrans LED dominent désormais la publicité extérieure : DOOH contre panneaux statiques', read: '12 MIN READ', date: '08 SEPT 2026' },
  { slug: 'outdoor-led-buying-checklist', img: '/uploads/site/ins-outdoor-led-buying-checklist.jpg', category: 'GUIDE', chip: 'Guides', title: 'Buying an outdoor LED screen: the 10-point checklist before you sign', titleFr: 'Acheter un écran LED extérieur : la checklist en 10 points avant de signer', read: '12 MIN READ', date: '07 SEPT 2026' },
  { slug: 'led-vs-projector', img: '/uploads/site/ins-led-vs-projector.jpg', category: 'COMPARISON', chip: 'Case Studies', title: 'LED wall or projector? Choosing for events, auditoriums and meeting rooms', titleFr: 'Mur LED ou projecteur ? Choisir pour les événements, auditoriums et salles de réunion', read: '12 MIN READ', date: '06 SEPT 2026' },
  { slug: 'retail-window-led', img: '/uploads/site/ins-retail-window-led.jpg', category: 'RETAIL', chip: 'Retail', title: 'LED screens for shops and window displays: the digital storefront that sells', titleFr: 'Écrans LED pour boutiques et vitrines : la vitrine numérique qui vend', read: '11 MIN READ', date: '05 SEPT 2026' },
  { slug: 'event-led-screen-size', img: '/uploads/site/ins-event-led-screen-size.jpg', category: 'GUIDE', chip: 'Guides', title: 'How to size an LED screen for an event: weddings, concerts, trade fairs and launches', titleFr: 'Comment dimensionner un écran LED pour un événement : mariages, concerts, salons et lancements', read: '11 MIN READ', date: '04 SEPT 2026' },
  { slug: 'led-vs-lcd-video-wall', img: '/uploads/site/ins-led-vs-lcd-video-wall.jpg', category: 'COMPARISON', chip: 'Case Studies', title: 'LED video wall vs LCD video wall: which is right for boardrooms and control rooms', titleFr: 'Mur d’images LED ou mur d’images LCD : lequel pour les conseils d’administration et les salles de contrôle', read: '12 MIN READ', date: '03 SEPT 2026' },
  { slug: 'led-screen-lifespan-maintenance', img: '/uploads/site/ins-led-screen-lifespan-maintenance.jpg', category: 'LED TECHNOLOGY', chip: 'LED Technology', title: 'How long does an LED screen last? Lifespan, maintenance schedule and common faults', titleFr: 'Combien de temps dure un écran LED ? Durée de vie, maintenance et pannes courantes', read: '11 MIN READ', date: '02 SEPT 2026' },
  { slug: 'holographic-displays', img: '/uploads/site/ins-holographic-displays.jpg', category: 'RETAIL', chip: 'Retail', title: 'Holographic fan displays: how 3D hologram fans work and where floating visuals sell', titleFr: 'Afficheurs holographiques : comment fonctionnent les fans 3D holographiques et où ils font vendre', read: '8 MIN READ', date: '01 SEPT 2026' },
  { slug: 'what-is-an-led-screen', img: '/uploads/site/ins-what-is-an-led-screen.jpg', category: 'LED TECHNOLOGY', chip: 'LED Technology', title: 'What is an LED screen and how does it work? From module to controller, every term explained', titleFr: 'Qu’est-ce qu’un écran LED et comment fonctionne-t-il ? Du module au contrôleur, chaque terme expliqué', read: '13 MIN READ', date: '01 SEPT 2026' },
  { slug: 'cob-fine-pitch', img: '/uploads/site/ins-cob-fine-pitch.jpg', category: 'LED TECHNOLOGY', chip: 'LED Technology', title: 'COB vs SMD LED: what changes below 1 mm pixel pitch with chip-on-board and flip-chip LED', titleFr: 'COB contre SMD : ce qui change sous 1 mm de pas de pixel avec le chip-on-board et le flip-chip', read: '8 MIN READ', date: '20 AUG 2026' },
  { slug: 'rental-stage-build', img: '/uploads/site/ins-rental-stage-build.jpg', category: 'GUIDE', chip: 'Guides', title: 'Rental LED screen setup: how a touring LED wall is built, rigged and checked for a show', titleFr: 'Montage d’un écran LED de location : comment un mur de tournée est assemblé, hissé et vérifié', read: '9 MIN READ', date: '02 AUG 2026' },
  { slug: 'transparent-led', img: '/uploads/site/ins-transparent-led.jpg', category: 'RETAIL', chip: 'Retail', title: 'Transparent LED displays for shop windows and glass façades: mesh, film and glass compared', titleFr: 'Écrans LED transparents pour vitrines et façades en verre : maille, film et verre comparés', read: '9 MIN READ', date: '08 JUL 2026' },
  { slug: 'pixel-pitch', img: '/uploads/site/ins-pixel-pitch.jpg', category: 'GUIDE', chip: 'Guides', title: 'LED pixel pitch explained: how to choose the right pitch for viewing distance, cost and power', titleFr: 'Pas de pixel LED expliqué : choisir le bon pas selon la distance de visionnage, le coût et la puissance', read: '9 MIN READ', date: '12 JUN 2026' },
  { slug: 'corporate-screens', img: '/uploads/site/ins-corporate-screens.jpg', category: 'CORPORATE AV', chip: 'Corporate AV', title: 'Corporate LED walls: designing lobby, boardroom and briefing-room displays as architecture', titleFr: 'Murs LED d’entreprise : concevoir les écrans de lobby, de conseil et de briefings comme une architecture', read: '8 MIN READ', date: '20 MAY 2026' },
  { slug: 'outdoor-brightness', img: '/uploads/site/ins-outdoor-brightness.jpg', category: 'DOOH', chip: 'DOOH', title: 'Outdoor LED brightness explained: nits, contrast and content for DOOH screens in direct sunlight', titleFr: 'Luminosité LED extérieure expliquée : nits, contraste et contenu pour les écrans DOOH en plein soleil', read: '8 MIN READ', date: '08 APR 2026' },
  { slug: 'curved-led', img: '/uploads/site/ins-curved-led.jpg', category: 'ARCHITECTURE', chip: 'Architecture', title: 'Curved LED screens: designing concave, convex and wrapped LED walls for architecture', titleFr: 'Écrans LED incurvés : concevoir des murs concave, convexes et enveloppants pour l’architecture', read: '8 MIN READ', date: '14 MAR 2026' },
  { slug: 'xr-stages', img: '/uploads/site/ins-xr-stages.jpg', category: 'VIRTUAL PRODUCTION', chip: 'Virtual Production', title: 'LED volumes for virtual production: how to specify a camera-ready LED wall', titleFr: 'Volumes LED pour la production virtuelle : comment spécifier un mur LED compatible caméra', read: '9 MIN READ', date: '02 FEB 2026' },
  { slug: 'kinetic', img: '/uploads/site/ins-kinetic.jpg', category: 'LED TECHNOLOGY', chip: 'LED Technology', title: 'Kinetic LED screens explained: how moving LED walls add physical depth to digital content', titleFr: 'Écrans LED cinétiques expliqués : comment les murs mobiles ajoutent de la profondeur physique au contenu', read: '8 MIN READ', date: '15 JAN 2026' },
];

export const INSIGHT_CHIPS = [
  'All',
  'LED Technology',
  'Architecture',
  'DOOH',
  'Corporate AV',
  'Retail',
  'Virtual Production',
  'Guides',
  'Case Studies',
];

export const NAV_LINKS = [
  { label: 'Products', href: '/web#products' },
  { label: 'Markets', href: '/web#markets' },
  { label: 'Projects', href: '/web#projects' },
  { label: 'Technology', href: '/web#technology' },
  { label: 'About', href: '/web#manifesto' },
  { label: 'Resources', href: '/web/insights' },
];

export const FOOTER_LINKS = [
  {
    title: 'PRODUCTS',
    links: [
      { label: 'XR Fine', href: '/web#products' },
      { label: 'XR Vision', href: '/web#products' },
      { label: 'XR Flex', href: '/web#products' },
      { label: 'XR Studio', href: '/web#products' },
      { label: 'All Series', href: '/web#products' },
    ],
  },
  {
    title: 'COMPANY',
    links: [
      { label: 'About', href: '/web#manifesto' },
      { label: 'Projects', href: '/web#projects' },
      { label: 'Technology', href: '/web#technology' },
      { label: 'Experience Center', href: '/web#experience' },
    ],
  },
  {
    title: 'SUPPORT',
    links: [
      { label: 'Contact', href: '/web#contact' },
      { label: 'Technical Support', href: '/web#contact' },
      { label: 'Resources', href: '/web/insights' },
      { label: 'Start a Project', href: '/web#contact' },
    ],
  },
];
