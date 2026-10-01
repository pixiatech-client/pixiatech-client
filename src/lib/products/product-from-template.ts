// ============================================================================
// CONSTRUCTION D'UN PRODUIT : TEMPLATE MAÎTRE + PDF
//
// Pipeline de génération / fusion / normalisation du PRODUIT GÉNÉRÉ.
//
// RÈGLE ABSOLUE :
//   - Le master template est la BASE IMMUTABLE (verrouillé).
//   - Le PDF est la source des DONNÉES RÉELLES du produit.
//   - Le produit généré est la dérivation propre :
//       1. conserve la structure et les sections du master ;
//       2. remplace les données lorsque le PDF fournit une valeur réelle ;
//       3. conserve la vraie valeur du master lorsque le PDF ne fournit rien ;
//       4. ne JAMAIS laisser apparaître les placeholders du master dans le
//          produit final (ex: [Marché 1], [valeur], [Modele 1], [L×l mm]...) ;
//       5. ne JAMAIS créer de doublons ou concaténer ancienne + nouvelle valeur
//          (ex: pas de "1000 nits [valeur]", pas de "300 × 168,8 mm [L×l mm]") ;
//       6. "PENDING" est une valeur de donnée autorisée (PENDING ≠ placeholder) ;
//       7. n'invente jamais de données absentes et n'importe pas d'images du
//          PDF comme médias produit par défaut.
// ============================================================================

import {
  MASTER_TEMPLATE_SLUG,
  createMasterTemplateSkeleton,
  mergeProductOntoTemplate,
} from './master-template';
import type {
  Product,
  ProductFeature,
  ProductFieldworkProject,
  ProductSpecGroup,
  ProductSpecModel,
  ProductStat,
  ProductSubItem,
} from './types';

/**
 * Récupère le produit maître « template-maitre ».
 */
export async function loadMasterTemplate(
  resolveBase: (slug: string) => Promise<Product | null>
): Promise<Product> {
  try {
    const master = await resolveBase(MASTER_TEMPLATE_SLUG);
    if (master) return { ...createMasterTemplateSkeleton(), ...master };
  } catch {
    // Template maître illisible : on continue sur le squelette.
  }
  return createMasterTemplateSkeleton();
}

/**
 * Détecte si une valeur textuelle est un placeholder structurel du master template.
 * "PENDING" n'est PAS un placeholder, c'est une donnée autorisée.
 */
export function isPlaceholder(val: unknown): boolean {
  if (typeof val !== 'string') return false;
  const s = val.trim();
  if (!s) return false;
  if (/^pending$/i.test(s)) return false;

  // Crochets structurels de gabarit
  if (/^\[.*\]$/.test(s)) return true;

  const norm = s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim();

  const compact = norm.replace(/\s+/g, '');
  if (/^VALEUR(VALEUR)?$/.test(compact)) return true;
  if (/^MARCHE\d+$/.test(compact)) return true;
  if (/^MODELE\d+$/.test(compact)) return true;
  if (/^LABELSTAT\d+$/.test(compact)) return true;
  if (/^TITRE(FEATURE|PHOTO|VIDEO|VISUEL\d+|SECTION)?$/.test(compact)) return true;
  if (/^ACCROCHE/.test(compact)) return true;
  if (/^DESCRIPTION/.test(compact)) return true;
  if (/^NOM(PROJET|CLIENT|CONFIG|TECHNOLOGIE|ENTREPRISE|PRODUIT)?$/.test(compact)) return true;
  if (/^EMPLACEMENTMEDIA$/.test(compact)) return true;
  if (/^(LX?LMM|MM)$/.test(compact)) return true;
  if (/^PAYSANNEE$/.test(compact)) return true;

  return false;
}

/**
 * Nettoie une chaîne de tout placeholder résiduel, crochet ou concaténation :
 * - "1000 nits [valeur]" -> "1000 nits"
 * - "300 × 168,8 mm [L×l mm]" -> "300 × 168,8 mm"
 * - "2 [valeur]" -> "2"
 * - "valeur [valeur]" -> ""
 * - "[ PXT-S1.2 ]" -> "PXT-S1.2"
 * - "PENDING" -> "PENDING"
 */
export function cleanPlaceholderText(val: string | undefined | null): string {
  if (val === undefined || val === null) return '';
  let s = String(val).trim();
  if (!s) return '';
  if (/^pending$/i.test(s)) return 'PENDING';

  // Si tout le texte est entre crochets simples
  if (/^\[[^[\]]+\]$/.test(s)) {
    const inner = s.slice(1, -1).trim();
    if (isPlaceholder(inner)) return '';
    return inner;
  }

  // Supprime tout bloc [ ... ] contenant un placeholder
  s = s.replace(/\[[^[\]]*\]/g, (match) => {
    const inner = match.slice(1, -1).trim();
    if (isPlaceholder(inner) || isPlaceholder(match)) return '';
    return inner;
  });

  s = s.replace(/\s+/g, ' ').trim();
  if (isPlaceholder(s)) return '';

  if (s.startsWith('[') && s.endsWith(']')) {
    const unwrapped = s.slice(1, -1).trim();
    if (!isPlaceholder(unwrapped)) s = unwrapped;
  }

  return s;
}

/** Une valeur textuelle est-elle réelle (non vide et non placeholder) ? */
export function isRealValue(val: unknown): boolean {
  if (val === undefined || val === null) return false;
  if (typeof val === 'string') {
    const cleaned = cleanPlaceholderText(val);
    return cleaned.length > 0;
  }
  if (Array.isArray(val)) return val.length > 0;
  if (typeof val === 'object') return Object.keys(val as object).length > 0;
  return true;
}

/**
 * Squelette STRUCTUREL de secours : les 5 groupes, 21 lignes, dans l'ordre et
 * avec les libellés EXACTS du produit maître « template-maitre » en Firestore.
 *
 * Il ne sert que si le maître est illisible, et DOIT donc être identique à ce
 * que Firestore contient. Il portait 20 lignes et des libellés divergents
 * (« Module res. », « Max power »…) : au premier écart, la même fiche rebuilt
 * hors ligne perdait une caractéristique (`cabRes` n'existait qu'en Firestore)
 * et les intitulés changeaient d'un build à l'autre. Une régression, donc, pas
 * une commodité de libellé.
 */
const CANONICAL_SPEC_GROUPS: ProductSpecGroup[] = [
  {
    id: 'general',
    label: 'GENERAL',
    rows: [
      { key: 'env', label: 'IN / OUT' },
      { key: 'arrangement', label: 'LED ARRANGEMENT' },
    ],
  },
  {
    id: 'physical',
    label: 'PHYSIQUE',
    rows: [
      { key: 'pitch', label: 'PIXEL PITCH' },
      { key: 'density', label: 'PHYSICAL DENSITY' },
      { key: 'moduleRes', label: 'MODULE RESOLUTION (H/V)' },
      { key: 'moduleDim', label: 'MODULE DIMENSIONS' },
      { key: 'cabRes', label: 'CABINET RESOLUTION (H/V)' },
      { key: 'cabDim', label: 'CABINET DIMENSIONS' },
      { key: 'weight', label: 'CABINET WEIGHT' },
    ],
  },
  {
    id: 'optical',
    label: 'OPTIQUE',
    rows: [
      { key: 'brightness', label: 'BRIGHTNESS' },
      { key: 'refresh', label: 'REFRESH RATE' },
      { key: 'scan', label: 'SCAN RATE' },
      { key: 'angle', label: 'VIEWING ANGLE (H/V)' },
    ],
  },
  {
    id: 'electrical',
    label: 'ELECTRIQUE',
    rows: [
      { key: 'maxPower', label: 'MAX POWER (W / PANEL)' },
      { key: 'avgPower', label: 'AVG POWER (W / PANEL)' },
      { key: 'powerSource', label: 'OPERATING POWER SOURCE' },
      { key: 'signal', label: 'SIGNAL INPUT' },
    ],
  },
  {
    id: 'environmental',
    label: 'ENVIRONNEMENT',
    rows: [
      { key: 'ip', label: 'IP RATING' },
      { key: 'temp', label: 'OPERATING TEMPERATURE' },
      { key: 'transparency', label: 'TRANSPARENCY' },
      { key: 'certs', label: 'CERTIFICATIONS' },
    ],
  },
];

/**
 * Nettoie récursivement un objet de tous les placeholders résiduels
 * tout en conservant scrupuleusement la valeur "PENDING".
 */
export function sanitizeProductRecursively(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') {
    return cleanPlaceholderText(obj);
  }
  if (Array.isArray(obj)) {
    return obj
      .map(sanitizeProductRecursively)
      .filter((item) => {
        if (typeof item === 'string') return item.length > 0;
        if (item === null || item === undefined) return false;
        return true;
      });
  }
  if (typeof obj === 'object') {
    const res: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      res[k] = sanitizeProductRecursively(v);
    }
    return res;
  }
  return obj;
}

/**
 * Construit le produit final en appliquant les règles de fusion strictes :
 * base = template maître, surcouche = PDF.
 * La base n'est jamais modifiée.
 */
export async function buildProductFromMasterTemplate(
  overlay: Partial<Product>,
  resolveBase: (slug: string) => Promise<Product | null>
): Promise<Product> {
  const master = await loadMasterTemplate(resolveBase);

  // 1. Fusion structurelle initiale via la fonction de base
  const baseMerged = mergeProductOntoTemplate(master, overlay);

  // 2. Normalisation stricte section par section

  // --- Masthead & Identité ---
  const masterName =
    master.slug === MASTER_TEMPLATE_SLUG || master.name?.includes('template maître')
      ? ''
      : cleanPlaceholderText(master.name);
  const name = cleanPlaceholderText(overlay.name) || masterName || '';
  const series = cleanPlaceholderText(overlay.series) || cleanPlaceholderText(master.series) || '';
  const company = cleanPlaceholderText(overlay.company) || cleanPlaceholderText(master.company) || '';

  // --- Hero ---
  const heroTitle = cleanPlaceholderText(overlay.hero?.title) || cleanPlaceholderText(master.hero?.title) || name;
  const heroSubtitle = cleanPlaceholderText(overlay.hero?.subtitle) || cleanPlaceholderText(master.hero?.subtitle) || '';
  const heroPrimaryCta = cleanPlaceholderText(overlay.hero?.primaryCta) || cleanPlaceholderText(master.hero?.primaryCta) || '';
  const heroSecondaryCta = cleanPlaceholderText(overlay.hero?.secondaryCta) || cleanPlaceholderText(master.hero?.secondaryCta) || '';
  const breadcrumbCategoryFr =
    cleanPlaceholderText(overlay.hero?.breadcrumbCategoryFr) ||
    cleanPlaceholderText(master.hero?.breadcrumbCategoryFr) ||
    series;
  const breadcrumbCategoryEn =
    cleanPlaceholderText(overlay.hero?.breadcrumbCategoryEn) ||
    cleanPlaceholderText(master.hero?.breadcrumbCategoryEn) ||
    series;

  // Marchés (hero.tags) : le PDF remplace le master. Aucun [Marché 1..4] ne survit.
  let tags: string[] = [];
  if (overlay.hero?.tags && overlay.hero.tags.length > 0) {
    tags = overlay.hero.tags.map(cleanPlaceholderText).filter(Boolean);
  } else if (master.hero?.tags && master.hero.tags.length > 0) {
    tags = master.hero.tags.map(cleanPlaceholderText).filter(Boolean);
  }

  // 4 Badges du masthead (hero.specs) : le PDF remplace le master. Aucun [valeur] ne survit.
  let specsBadges: { label: string; value: string }[] = [];
  if (overlay.hero?.specs && overlay.hero.specs.length > 0) {
    specsBadges = overlay.hero.specs
      .map((s) => ({
        label: cleanPlaceholderText(s.label).toUpperCase(),
        value: cleanPlaceholderText(s.value),
      }))
      .filter((s) => s.label && s.value);
  } else if (master.hero?.specs && master.hero.specs.length > 0) {
    specsBadges = master.hero.specs
      .map((s) => ({
        label: cleanPlaceholderText(s.label).toUpperCase(),
        value: cleanPlaceholderText(s.value),
      }))
      .filter((s) => s.label && s.value);
  }

  // --- 01 Aperçu ---
  const overviewTitle =
    cleanPlaceholderText(overlay.overview?.title) ||
    cleanPlaceholderText(master.overview?.title) ||
    '';
  const overviewDescription =
    cleanPlaceholderText(overlay.overview?.description) ||
    cleanPlaceholderText(master.overview?.description) ||
    '';

  // 3 Statistiques : le PDF remplace le master. Aucun [valeur] ni [Label stat X].
  let stats: ProductStat[] = [];
  if (overlay.overview?.stats && overlay.overview.stats.length > 0) {
    stats = overlay.overview.stats
      .map((s) => ({
        value: cleanPlaceholderText(s.value),
        label: cleanPlaceholderText(s.label),
        ...(s.labelFr ? { labelFr: cleanPlaceholderText(s.labelFr) } : {}),
        ...(s.labelEn ? { labelEn: cleanPlaceholderText(s.labelEn) } : {}),
      }))
      .filter((s) => s.value && s.label);
  } else if (master.overview?.stats && master.overview.stats.length > 0) {
    stats = master.overview.stats
      .map((s) => ({
        value: cleanPlaceholderText(s.value),
        label: cleanPlaceholderText(s.label),
        ...(s.labelFr ? { labelFr: cleanPlaceholderText(s.labelFr) } : {}),
        ...(s.labelEn ? { labelEn: cleanPlaceholderText(s.labelEn) } : {}),
      }))
      .filter((s) => s.value && s.label);
  }

  // Technologies : le PDF remplace les placeholders du master.
  let technologies: ProductSubItem[] = [];
  if (overlay.overview?.technologies && overlay.overview.technologies.length > 0) {
    technologies = overlay.overview.technologies
      .map((t) => ({
        ...(t.num ? { num: cleanPlaceholderText(t.num) } : {}),
        title: cleanPlaceholderText(t.title),
        ...(t.description ? { description: cleanPlaceholderText(t.description) } : {}),
      }))
      .filter((t) => t.title);
  } else if (master.overview?.technologies && master.overview.technologies.length > 0) {
    technologies = master.overview.technologies
      .map((t) => ({
        ...(t.num ? { num: cleanPlaceholderText(t.num) } : {}),
        title: cleanPlaceholderText(t.title),
        ...(t.description ? { description: cleanPlaceholderText(t.description) } : {}),
      }))
      .filter((t) => t.title && !isPlaceholder(t.title));
  }

  // --- 02 Conception & Format ---
  const designTitle =
    cleanPlaceholderText(overlay.design?.title) ||
    cleanPlaceholderText(master.design?.title) ||
    '';
  const moduleDim =
    cleanPlaceholderText(overlay.design?.moduleDim) ||
    cleanPlaceholderText(master.design?.moduleDim) ||
    '';
  const cabinetDim =
    cleanPlaceholderText(overlay.design?.cabinetDim) ||
    cleanPlaceholderText(master.design?.cabinetDim) ||
    '';
  const depth =
    cleanPlaceholderText(overlay.design?.depth) ||
    cleanPlaceholderText(master.design?.depth) ||
    '';

  // Dimensions specsList
  const specsList = [
    ...(moduleDim ? [{ label: 'MODULE', value: moduleDim }] : []),
    ...(cabinetDim ? [{ label: 'CABINET', value: cabinetDim }] : []),
    ...(depth ? [{ label: 'PROFONDEUR', value: depth }] : []),
  ];

  // Configurations d'installation
  let configs: ProductSubItem[] = [];
  if (overlay.design?.configs && overlay.design.configs.length > 0) {
    configs = overlay.design.configs
      .map((c) => ({
        ...(c.num ? { num: cleanPlaceholderText(c.num) } : {}),
        title: cleanPlaceholderText(c.title),
        ...(c.description ? { description: cleanPlaceholderText(c.description) } : {}),
      }))
      .filter((c) => c.title);
  } else if (master.design?.configs && master.design.configs.length > 0) {
    configs = master.design.configs
      .map((c) => ({
        ...(c.num ? { num: cleanPlaceholderText(c.num) } : {}),
        title: cleanPlaceholderText(c.title),
        ...(c.description ? { description: cleanPlaceholderText(c.description) } : {}),
      }))
      .filter((c) => c.title && !isPlaceholder(c.title));
  }

  // --- 03 Points Forts Techniques ---
  // Le master impose exactement 7 caractéristiques.
  const featuresTitle =
    cleanPlaceholderText(overlay.features?.title) ||
    cleanPlaceholderText(master.features?.title) ||
    '';
  let featureItems: ProductFeature[] = [];
  const overlayFeatures = (overlay.features?.items ?? []).filter((f) => isRealValue(f.title));

  if (overlayFeatures.length > 0) {
    // Le PDF fournit les données textuelles ; le master conserve les images du
    // slider (le PDF ne transporte jamais d'images — règle absolue).
    const masterItems = master.features?.items ?? [];
    featureItems = overlayFeatures.map((f, idx) => {
      const masterItem = masterItems[idx];
      return {
        num: f.num ? cleanPlaceholderText(f.num) : String(idx + 1).padStart(2, '0'),
        title: cleanPlaceholderText(f.title),
        ...(f.description ? { description: cleanPlaceholderText(f.description) } : {}),
        // Image du master pour cet index : conservée si le PDF n'en fournit pas
        ...(f.image ? { image: f.image } : masterItem?.image ? { image: masterItem.image } : {}),
        ...(f.contain !== undefined ? { contain: f.contain } : masterItem?.contain ? { contain: masterItem.contain } : {}),
      };
    });
  } else if (master.features?.items && master.features.items.length > 0) {
    featureItems = master.features.items
      .filter((f) => !isPlaceholder(f.title))
      .map((f, idx) => ({
        num: f.num ? cleanPlaceholderText(f.num) : String(idx + 1).padStart(2, '0'),
        title: cleanPlaceholderText(f.title),
        ...(f.description ? { description: cleanPlaceholderText(f.description) } : {}),
        // Image du master conservée telle quelle : le slider doit rester fonctionnel
        ...(f.image ? { image: f.image } : {}),
        ...(f.contain ? { contain: f.contain } : {}),
      }));
  }

  // --- 04 Caractéristiques Techniques (Tableau) ---
  // Structure des catégories préservée (GENERAL, PHYSIQUE, OPTIQUE, ELECTRIQUE, ENVIRONNEMENT)
  // et colonnes variantes du PDF (ex: PXT-S1.2, PXT-S1.5). Aucun [Modele 1..3].
  let finalGroups: ProductSpecGroup[] = [];
  if (master.specs?.groups && master.specs.groups.length > 0) {
    // Si le master a déjà des groupes, on préserve leur structure et leur ordre
    finalGroups = master.specs.groups.map((g) => ({
      id: g.id,
      label: g.label,
      rows: g.rows.map((r) => ({ key: r.key, label: r.label })),
    }));
  } else {
    // Sinon on garantit les 5 catégories canoniques
    finalGroups = CANONICAL_SPEC_GROUPS.map((g) => ({
      id: g.id,
      label: g.label,
      rows: g.rows.map((r) => ({ key: r.key, label: r.label })),
    }));
  }

  // `finalGroups` est désormais la structure FINALE, et elle ne vient que du
  // master : les catégories, les lignes, leur ordre et leurs libellés. Le PDF
  // n'y apporte plus rien. Il ne reste qu'à y ranger les VALEURS, et une valeur
  // dont la clé n'existe pas au master est ignorée — pas transformée en ligne.
  //
  // Conséquence recherchée : une caractéristique reste dans le groupe que le
  // master lui a défini, même quand le PDF l'a classée ailleurs. C'est ce qui
  // ramène `ip` dans ENVIRONMENTAL et `maxPower` dans ELECTRICAL, au lieu de les
  // laisser là où la géométrie du PDF les avait fait tomber.

  // Modèles / colonnes variantes
  //
  // Les valeurs sont filtrées sur les SEULES clés de `finalGroups` : une clé
  // que le master ne définit pas est supprimée, pas seulement ignorée au
  // rendu. Sans ce filtre, un produit en Firestore conservait dans chaque
  // `model.specs` des champs dynamiques que rien n'affichait — des données
  // orphelines qui entraient dans les exports et qui rejoueraient le bug dès
  // qu'un parcours des groupes les oublierait.
  const masterKeys = new Set<string>();
  for (const g of finalGroups) for (const r of g.rows) masterKeys.add(r.key);

  const toModel = (m: ProductSpecModel): ProductSpecModel => {
    const specs: Record<string, string> = {};
    for (const [k, v] of Object.entries(m.specs ?? {})) {
      if (!masterKeys.has(k)) continue;
      const cleaned = cleanPlaceholderText(v);
      if (cleaned) specs[k] = cleaned;
    }
    return {
      name: cleanPlaceholderText(m.name),
      ...(m.tag ? { tag: m.tag } : {}),
      specs,
    };
  };

  let finalModels: ProductSpecModel[] = [];
  const overlayModels = (overlay.specs?.models ?? []).filter(
    (m) => isRealValue(m.name) && !isPlaceholder(m.name)
  );

  if (overlayModels.length > 0) {
    // Les variantes du PDF deviennent les colonnes produit
    finalModels = overlayModels.map(toModel);
  } else if (master.specs?.models && master.specs.models.length > 0) {
    // Sinon modèles du master filtrés de tout placeholder [Modele X]
    finalModels = master.specs.models.filter((m) => !isPlaceholder(m.name)).map(toModel);
  }

  // --- 05 Références / Projets ---
  const fieldworkTitle =
    cleanPlaceholderText(overlay.fieldwork?.title) ||
    cleanPlaceholderText(master.fieldwork?.title) ||
    '';
  let projects: ProductFieldworkProject[] = [];
  const overlayProjects = (overlay.fieldwork?.projects ?? []).filter((p) => isRealValue(p.title));

  if (overlayProjects.length > 0) {
    // Le PDF fournit noms/lieux/années ; les images restent celles du master
    // (le PDF ne transporte jamais d'images — règle absolue, section 05).
    const masterProjects = master.fieldwork?.projects ?? [];
    projects = overlayProjects.map((p, idx) => {
      const masterProj = masterProjects[idx];
      return {
        title: cleanPlaceholderText(p.title),
        ...(p.location ? { location: cleanPlaceholderText(p.location) } : {}),
        ...(p.pitch ? { pitch: cleanPlaceholderText(p.pitch) } : {}),
        ...(p.year ? { year: cleanPlaceholderText(p.year) } : {}),
        // Image du master pour ce slot : conservée si le PDF n'en fournit pas
        ...(p.image ? { image: p.image } : masterProj?.image ? { image: masterProj.image } : {}),
        ...(p.caption ? { caption: cleanPlaceholderText(p.caption) } : masterProj?.caption ? { caption: masterProj.caption } : {}),
      };
    });
  } else if (master.fieldwork?.projects && master.fieldwork.projects.length > 0) {
    projects = master.fieldwork.projects
      .filter((p) => !isPlaceholder(p.title))
      .map((p) => ({
        title: cleanPlaceholderText(p.title),
        ...(p.location ? { location: cleanPlaceholderText(p.location) } : {}),
        ...(p.pitch ? { pitch: cleanPlaceholderText(p.pitch) } : {}),
        ...(p.year ? { year: cleanPlaceholderText(p.year) } : {}),
        // Images du master conservées telles quelles
        ...(p.image ? { image: p.image } : {}),
        ...(p.caption ? { caption: p.caption } : {}),
      }));
  }

  // --- CTA / Next ---
  const nextHeadline =
    cleanPlaceholderText(overlay.next?.headline) ||
    cleanPlaceholderText(master.next?.headline) ||
    '';
  const nextCta =
    cleanPlaceholderText(overlay.next?.cta) ||
    cleanPlaceholderText(master.next?.cta) ||
    '';

  // --- Assemblage du produit complet ---
  const result: Product = {
    ...baseMerged,
    name,
    ...(series ? { series } : {}),
    ...(company ? { company } : {}),
    status: overlay.status ?? master.status ?? 'draft',

    hero: {
      ...baseMerged.hero,
      title: heroTitle,
      ...(heroSubtitle ? { subtitle: heroSubtitle } : {}),
      ...(heroPrimaryCta ? { primaryCta: heroPrimaryCta } : {}),
      ...(heroSecondaryCta ? { secondaryCta: heroSecondaryCta } : {}),
      ...(breadcrumbCategoryFr ? { breadcrumbCategoryFr } : {}),
      ...(breadcrumbCategoryEn ? { breadcrumbCategoryEn } : {}),
      tags,
      specs: specsBadges,
    },

    overview: {
      ...baseMerged.overview,
      ...(overviewTitle ? { title: overviewTitle } : {}),
      ...(overviewDescription ? { description: overviewDescription } : {}),
      stats,
      technologies,
    },

    design: {
      ...baseMerged.design,
      ...(designTitle ? { title: designTitle } : {}),
      ...(moduleDim ? { moduleDim } : {}),
      ...(cabinetDim ? { cabinetDim } : {}),
      ...(depth ? { depth } : {}),
      specsList,
      configs,
    },

    features: {
      ...baseMerged.features,
      ...(featuresTitle ? { title: featuresTitle } : {}),
      items: featureItems,
    },

    specs: {
      groups: finalGroups,
      models: finalModels,
    },

    fieldwork: {
      ...baseMerged.fieldwork,
      ...(fieldworkTitle ? { title: fieldworkTitle } : {}),
      projects,
    },

    next: {
      ...baseMerged.next,
      ...(nextHeadline ? { headline: nextHeadline } : {}),
      ...(nextCta ? { cta: nextCta } : {}),
    },

    // Médias : les médias réels du template maître sont conservés (POINT 16/18)
    // Les images du PDF ne sont jamais injectées comme médias produit par défaut.
    media: master.media ?? { photos: [], videos: [] },
  };

  // 3. Passe finale de désinfection globale
  return sanitizeProductRecursively(result) as Product;
}
