/**
 * Verrou — Règle de remplacement PDF → TEMPLATE (mission, POINT 18).
 *
 *   LE TEMPLATE MAÎTRE EST LA BASE. LE PDF PERSONNALISE LE TEMPLATE.
 *
 *   SI le PDF contient une valeur  -> on l'utilise.
 *   SI le PDF ne contient RIEN     -> on conserve la valeur du template.
 *
 * Le défaut historique : la surcouche PDF était appliquée à un objet vide, si
 * bien qu'une section absente du PDF disparaissait de la page et que le produit
 * pouvait se réduire à son nom. Ces tests verrouillent la structure complète et
 * la conservation des valeurs du template.
 */
import {
  MASTER_TEMPLATE_SLUG,
  attachSectionMedia,
  createMasterTemplateSkeleton,
  isEmptyValue,
  mergeProductOntoTemplate,
} from '../src/lib/products/master-template.ts';
import { buildProductFromMasterTemplate, loadMasterTemplate } from '../src/lib/products/product-from-template.ts';
import type { Product } from '../src/lib/products/types.ts';

let failures = 0;
const check = (name: string, cond: boolean, extra?: string) => {
  console.log(`${cond ? 'PASS' : 'FAIL'} - ${name}${extra ? ` :: ${extra}` : ''}`);
  if (!cond) failures++;
};

/** Le template maître officiel, tel qu'il existe dans Firestore. */
const MASTER: Product = {
  ...createMasterTemplateSkeleton(),
  name: 'Produit LED',
  slug: 'template-maitre',
  status: 'draft',
  characteristics: [
    { key: 'LUMINOSITÉ', value: '5000 nits' },
    { key: 'POIDS', value: '25 kg' },
  ],
  hero: { title: 'Produit LED', subtitle: 'Série pro', primaryCta: 'DEMANDER', tags: ['LED'] },
  // Les DEUX photos d'aperçu du template maitre. Le template en est la base.
  media: {
    photos: [
      { id: 'ph1', name: 'photo-1', url: '/uploads/t1/photo-1.jpg', type: 'image', path: 't1/photo-1.jpg' },
      { id: 'ph2', name: 'photo-2', url: '/uploads/t1/photo-2.jpg', type: 'image', path: 't1/photo-2.jpg' },
    ],
  },
  overview: { title: 'Aperçu', description: 'Description du template.', stats: [{ value: '5000', label: 'nits' }] },
  design: { title: 'Conception', weight: '25 kg', specsList: [{ label: 'MODULE', value: '600 mm' }] },
  features: { title: 'Points clés', items: [{ num: '01', title: 'Fiabilité' }] },
  specs: { groups: [{ id: 'g1', label: 'Écran', rows: [{ key: 'k1', label: 'LUMINOSITÉ' }] }], models: [{ name: 'PX', specs: { k1: '5000 nits' } }] },
  fieldwork: { title: 'Projets', projects: [{ title: 'Paris' }] },
  next: { headline: 'Découvrir', cta: 'VOIR' },
  seo: { title: 'Produit LED', description: 'SEO du template.' },
};

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

/**
 * Rattachement des médias aux SECTIONS (mission, section 02 de la fiche).
 *
 *   photos[0] -> 01 / APERÇU        photos[1] -> 02 / CONCEPTION
 *
 * Avant, la 2e photo n'avait aucun propriétaire et finissait en 01. Ces
 * tests verrouillent le contrat : une photo par section, jamais deux dans
 * l'aperçu, et le template qui reste la base quand une section est vide.
 */
function testAttachSectionMedia() {
  const base: Product = {
    ...createMasterTemplateSkeleton(),
    name: 'Produit LED',
    slug: 'rattache',
    media: {
      photos: [
        { name: 'apercu', url: '/uploads/t1/apercu.jpg' },
        { name: 'conception', url: '/uploads/t1/conception.jpg' },
      ],
      videos: [],
    },
  };

  const r = attachSectionMedia(clone(base));

  // ── Cas 1 : deux photos, deux sections ───────────────────────────────────
  check(
    'photo 1 rattachee a la section 01 (apercu)',
    r.overview?.photo?.url === '/uploads/t1/apercu.jpg',
    String(r.overview?.photo?.url)
  );
  check(
    'photo 2 rattachee a la section 02 (conception)',
    r.design?.visuals?.[0]?.url === '/uploads/t1/conception.jpg',
    JSON.stringify(r.design?.visuals?.map((v) => v.url))
  );
  check(
    'la photo 2 n est PAS reinjectee dans l apercu',
    r.overview?.photo?.url !== '/uploads/t1/conception.jpg' &&
      !JSON.stringify(r.overview ?? {}).includes('conception.jpg'),
    String(r.overview?.photo?.url)
  );
  check(
    'la galerie source reste intacte (2 photos, meme ordre)',
    r.media?.photos?.length === 2 && r.media?.photos?.[0]?.url === '/uploads/t1/apercu.jpg' && r.media?.photos?.[1]?.url === '/uploads/t1/conception.jpg'
  );

  // ── Cas 2 : la fonction ne mute PAS l produit source ──────────────────────
  const source = clone(base);
  const before = JSON.stringify(source);
  attachSectionMedia(source);
  check('aucune mutation du produit source', JSON.stringify(source) === before);

  // ── Cas 3 : le template reste la base (section deja renseignee) ───────────
  const filled = clone(base);
  filled.overview = { ...filled.overview, photo: { url: '/template/photo-apercu.jpg' } };
  filled.design = { ...filled.design, visuals: [{ url: '/template/visuel-conception.jpg' }] };
  const rf = attachSectionMedia(filled);
  check(
    'photo d apercu du template conservee si deja renseignee',
    rf.overview?.photo?.url === '/template/photo-apercu.jpg',
    String(rf.overview?.photo?.url)
  );
  check(
    'visuel de conception du template conserve si deja renseigne',
    rf.design?.visuals?.[0]?.url === '/template/visuel-conception.jpg' &&
      rf.design?.visuals?.length === 1,
    JSON.stringify(rf.design?.visuals?.map((v) => v.url))
  );

  // ── Cas 4 : pas de galerie -> repli sur hero.image en 01 ─────────────────
  const heroOnly = clone(base);
  heroOnly.media = { photos: [], videos: [] };
  heroOnly.hero = { ...heroOnly.hero, image: '/uploads/t1/hero.jpg' };
  const rh = attachSectionMedia(heroOnly);
  check(
    'sans galerie, hero.image alimente la photo de la section 01',
    rh.overview?.photo?.url === '/uploads/t1/hero.jpg',
    String(rh.overview?.photo?.url)
  );
  check('sans galerie, la section 02 ne recoit aucune photo fantome', !rh.design?.visuals?.length);

  // ── Cas 5 : une seule photo -> rien d invente en 02 ──────────────────────
  const one = clone(base);
  one.media = { photos: [{ name: 'apercu', url: '/uploads/t1/apercu.jpg' }], videos: [] };
  const r1 = attachSectionMedia(one);
  check(
    'photo unique : section 01 ok, section 02 laissee vide',
    r1.overview?.photo?.url === '/uploads/t1/apercu.jpg' && !r1.design?.visuals?.length,
    JSON.stringify(r1.design?.visuals?.map((v) => v.url))
  );
}

async function main() {
  testAttachSectionMedia();

  // ── 1. Le cas d'école de la mission ──────────────────────────────────────
  // Template : Nom, Luminosité 5000, Poids 25 kg, Fréquence 3840.
  // PDF      : PX Fine, Luminosité 6000, Fréquence 7680.
  // Attendu  : Nom PX Fine, Luminosité 6000, POIDS 25 kg (conservé),
  //            Fréquence 7680.
  const master = clone(MASTER);
  const pdf: Partial<Product> = {
    name: 'PX Fine',
    characteristics: [
      { key: 'LUMINOSITÉ', value: '6000 nits' },
      { key: 'TAUX DE RAFRAÎCHISSEMENT', value: '7680 Hz' },
    ],
  };
  const r = mergeProductOntoTemplate(master, pdf);

  check('nom issu du PDF', r.name === 'PX Fine', r.name);

  const lum = r.characteristics?.find((c) => c.key === 'LUMINOSITÉ');
  check('valeur presente dans le PDF : le PDF gagne', lum?.value === '6000 nits', String(lum?.value));

  // POINT 18 : le poids n'est pas dans le PDF -> valeur du template conservée.
  const poids = r.characteristics?.find((c) => c.key === 'POIDS');
  check(
    'valeur ABSENTE du PDF : le template est conserve (POINT 18)',
    poids?.value === '25 kg',
    String(poids?.value)
  );

  const freq = r.characteristics?.find((c) => c.key === 'TAUX DE RAFRAÎCHISSEMENT');
  check('valeur ajoutee par le PDF presente', freq?.value === '7680 Hz', String(freq?.value));

  // ── 2. Structure complete : la page ne se reduit pas au nom ──────────────
  check('hero conserve', r.hero?.title === 'Produit LED', r.hero?.title);
  check('overview conserve', r.overview?.description === 'Description du template.');
  check('design conserve', r.design?.weight === '25 kg', r.design?.weight);
  check('features conserve', r.features?.items?.[0]?.title === 'Fiabilité');
  check('specs conserve', r.specs?.models?.[0]?.name === 'PX');
  check('fieldwork conserve', r.fieldwork?.projects?.[0]?.title === 'Paris');
  check('next conserve', r.next?.headline === 'Découvrir');
  check('seo conserve', r.seo?.description === 'SEO du template.');

  // ── 3. Valeur PDF qui REMPLACE une valeur de template (champ scalaire) ──
  const r2 = mergeProductOntoTemplate(clone(MASTER), { name: 'PX Fine', overview: { description: 'Desc du PDF.' } });
  check('objet fusionne champ par champ : le PDF gagne', r2.overview?.description === 'Desc du PDF.');
  check('objet fusionne : les autres champs du template survivent', r2.overview?.title === 'Aperçu', r2.overview?.title);

  // ── 4. Le template n'est jamais muté ────────────────────────────────────
  const before = clone(MASTER);
  mergeProductOntoTemplate(MASTER, pdf);
  check('le template maitre n est pas mute', JSON.stringify(MASTER) === JSON.stringify(before));

  // ── 5. La superposition ne modifie pas non plus l'overlay ───────────────
  const overlayBefore = clone(pdf);
  mergeProductOntoTemplate(clone(MASTER), pdf);
  check('la surcouche PDF n est pas mutee', JSON.stringify(pdf) === JSON.stringify(overlayBefore));

  // ── 6. Un brouillon reste un brouillon ──────────────────────────────────
  check('le produit cree reste un brouillon', r.status === 'draft', r.status);
  const rPub = mergeProductOntoTemplate(clone(MASTER), { name: 'X', status: 'published' });
  check('un statut publie explicite est respecte', rPub.status === 'published', rPub.status);

  // ── 7. PDF vide : rien n'est ecrase, rien n'est invente ────────────────
  const rEmpty = mergeProductOntoTemplate(clone(MASTER), { name: 'Vide', characteristics: [], hero: { title: '' } });
  check('tableau vide : conserve celui du template', (rEmpty.characteristics?.length ?? 0) === 2, String(rEmpty.characteristics?.length));
  check('chaine vide : conserve celle du template', rEmpty.hero?.title === 'Produit LED', rEmpty.hero?.title);
  check('aucune valeur inventee (POINT 22)', rEmpty.name === 'Vide');

  // ── 8. Fusion d'elements de tableau ─────────────────────────────────────
  // Une entree du template absente du PDF est CONSERVEE, pas supprimee.
  const rDeep = mergeProductOntoTemplate(clone(MASTER), {
    features: { items: [{ num: '09', title: 'Nouvelle feature' }] },
  });
  check(
    'entree du template absente du PDF conservee',
    rDeep.features?.items?.length === 2 && rDeep.features.items.some((i) => i.title === 'Fiabilité'),
    JSON.stringify(rDeep.features?.items?.map((i) => i.title))
  );
  check(
    'entree du PDF presente',
    rDeep.features?.items?.some((i) => i.title === 'Nouvelle feature')
  );

  // Entree appariee : le PDF gagne sur les champs qu il renseigne.
  const rMatch = mergeProductOntoTemplate(clone(MASTER), {
    features: { items: [{ num: '01', title: 'Fiabilité', description: 'Description PDF.' }] },
  });
  const matched = rMatch.features?.items?.find((i) => i.title === 'Fiabilité');
  check('entree appariee : description du PDF appliquee', matched?.description === 'Description PDF.', String(matched?.description));
  check('entree appariee : pas de doublon', rMatch.features?.items?.length === 1, String(rMatch.features?.items?.length));

  // Lignes de specifications appariees par `key`.
  const rSpec = mergeProductOntoTemplate(clone(MASTER), {
    specs: { models: [{ name: 'PX', specs: { k1: '6000 nits' } }] },
  });
  check(
    'modele apparie : valeur du PDF gagne',
    rSpec.specs?.models?.[0]?.specs?.k1 === '6000 nits',
    String(rSpec.specs?.models?.[0]?.specs?.k1)
  );

  // ── 9. isEmptyValue ─────────────────────────────────────────────────────
  check('isEmptyValue : chaine vide', isEmptyValue('') && isEmptyValue('   '));
  check('isEmptyValue : tableau vide', isEmptyValue([]));
  check('isEmptyValue : undefined/null', isEmptyValue(undefined) && isEmptyValue(null));
  check('isEmptyValue : 0 et false ne sont PAS vides', !isEmptyValue(0) && !isEmptyValue(false));
  check('isEmptyValue : valeur pleine', !isEmptyValue('5000 nits') && !isEmptyValue([1]));

  // ── 10. Chargement du template : reel, ou repli structurel ─────────────
  check('slug du template maitre', MASTER_TEMPLATE_SLUG === 'template-maitre', MASTER_TEMPLATE_SLUG);

  const fromFirestore = await loadMasterTemplate(async (slug) => (slug === MASTER_TEMPLATE_SLUG ? clone(MASTER) : null));
  check('template reel charge depuis Firestore', fromFirestore.hero?.title === 'Produit LED', fromFirestore.hero?.title);

  const missing = await loadMasterTemplate(async () => null);
  check('template absent : repli sur le squelette structurel', !!missing.hero && !!missing.specs && !!missing.fieldwork);
  check(
    'repli structurel : AUCUNE valeur inventee',
    missing.hero?.title === '' && missing.overview?.title === '' && (missing.characteristics?.length ?? 0) === 0
  );

  const thrown = await loadMasterTemplate(async () => {
    throw new Error('Firestore indisponible');
  });
  check('template illisible : repli structurel, pas de crash', !!thrown.specs && thrown.specs.groups?.length === 0);

  // ── 11. Pipeline complet : template reel + PDF partiel ─────────────────
  const built = await buildProductFromMasterTemplate({ name: 'PX Fine', hero: { title: 'PX Fine' } }, async () => clone(MASTER));
  check('pipeline : nom du PDF', built.name === 'PX Fine');
  check('pipeline : titre hero du PDF', built.hero?.title === 'PX Fine');
  check('pipeline : sous-titre du template conserve', built.hero?.subtitle === 'Série pro', built.hero?.subtitle);
  check('pipeline : CTA du template conserve', built.hero?.primaryCta === 'DEMANDER', built.hero?.primaryCta);
  check('pipeline : section specs conservee', built.specs?.models?.[0]?.name === 'PX');
  check('pipeline : le produit est un brouillon', built.status === 'draft');

  // ── 12. Les deux photos d'apercu : le PDF ne peut pas les supprimer ────
  // Regle : "aucune image ne doit etre supprimee simplement parce qu elle
  // n existe pas dans le PDF". Cas 1 : le PDF ignore completement les photos.
  const rNoMedia = mergeProductOntoTemplate(clone(MASTER), { name: 'Sans media' });
  check(
    'PDF sans media : les 2 photos du template sont conservees',
    rNoMedia.media?.photos?.length === 2 &&
      rNoMedia.media?.photos?.[0]?.url === '/uploads/t1/photo-1.jpg' &&
      rNoMedia.media?.photos?.[1]?.url === '/uploads/t1/photo-2.jpg',
    JSON.stringify(rNoMedia.media?.photos?.map((p) => p.url))
  );

  // Cas 2 : le PDF ne fournit que la photo 1. Elle gagne, la photo 2 du
  // template est conservee, et il n'y a pas de doublon ni de trou.
  const rOnePhoto = mergeProductOntoTemplate(clone(MASTER), {
    name: 'Une photo',
    media: { photos: [{ id: 'pdf1', name: 'photo-1', url: '/uploads/pdf/photo-1.jpg', type: 'image', path: 'pdf/photo-1.jpg' }] },
  });
  const mergedPhotos = rOnePhoto.media?.photos ?? [];
  check('PDF avec 1 photo : la photo 1 du PDF remplace celle du template', mergedPhotos[0]?.url === '/uploads/pdf/photo-1.jpg', mergedPhotos[0]?.url);
  check(
    'PDF SANS photo 2 : la photo 2 du template est conservee',
    mergedPhotos.length === 2 && mergedPhotos[1]?.url === '/uploads/t1/photo-2.jpg',
    JSON.stringify(mergedPhotos.map((p) => p.url))
  );
  check('PDF avec 1 photo : toujours 2 photos, pas de cellule vide ni de doublon', mergedPhotos.length === 2, String(mergedPhotos.length));

  // Cas 3 : le PDF fournit une photo inconnue du template. Elle s'ajoute,
  // les photos du template ne sont pas ecrasees -> aucune image perdue.
  const rUnknown = mergeProductOntoTemplate(clone(MASTER), {
    name: 'Photo inconnue',
    media: { photos: [{ id: 'pdf9', name: 'detail-zoom', url: '/uploads/pdf/detail-zoom.jpg', type: 'image' }] },
  });
  const allPhotos = rUnknown.media?.photos ?? [];
  check(
    'photo inconnue du template : ajoutee SANS ecraser les photos du template',
    allPhotos.length === 3 &&
      allPhotos.some((p) => p.name === 'photo-1') &&
      allPhotos.some((p) => p.name === 'photo-2') &&
      allPhotos.some((p) => p.name === 'detail-zoom'),
    JSON.stringify(allPhotos.map((p) => p.name))
  );

  // Cas 4 : chemin reel -> clone via loadMasterTemplate puis build.
  const cloneWithPhotos = await buildProductFromMasterTemplate({ name: 'PX Fine' }, async () => clone(MASTER));
  check(
    'clone du template : les 2 photos sont heritees',
    cloneWithPhotos.media?.photos?.length === 2 &&
      cloneWithPhotos.media?.photos?.[1]?.url === '/uploads/t1/photo-2.jpg',
    JSON.stringify(cloneWithPhotos.media?.photos?.map((p) => p.url))
  );
  check(
    'clone du template : les photos heritees gardent leur chemin Storage',
    cloneWithPhotos.media?.photos?.every((p) => typeof p.path === 'string' && p.path.length > 0),
    JSON.stringify(cloneWithPhotos.media?.photos?.map((p) => p.path))
  );

  // ── 13. AUTORITE ABSOLUE DU MASTER SUR LA MATRICE TECHNIQUE ────────────
  // Le produit genere est le master, avec des valeurs. Trois fautes
  // recurrentes sont verrouillees ici :
  //   1. le PDF ajoutait une LIGNE et un GROUPE absents du master, donc la
  //      structure du produit dependait du document importe ;
  //   2. le PDF rangeait une valeur dans le mauvais groupe : `ip` atterrissait
  //      en ELECTRICAL au lieu d'ENVIRONNEMENTAL ;
  //   3. le PDF creait une CLE DYNAMIQUE, conservee dans `model.specs`,
  //      invisible au rendu — donc invisible pour tout le monde, jusqu'aux
  //      exports, qui la rejoueraient.
  console.log('\n--- 13. Le PDF n a aucun droit sur la structure ---');
  const realMaster: Product = {
    ...createMasterTemplateSkeleton(),
    name: 'Produit LED',
    slug: MASTER_TEMPLATE_SLUG,
    specs: {
      groups: [
        { id: 'physical', label: 'PHYSIQUE', rows: [{ key: 'pitch', label: 'PIXEL PITCH' }, { key: 'cabDim', label: 'CABINET DIMENSIONS' }] },
        { id: 'optical', label: 'OPTIQUE', rows: [{ key: 'brightness', label: 'BRIGHTNESS' }] },
        { id: 'environmental', label: 'ENVIRONNEMENT', rows: [{ key: 'ip', label: 'IP RATING' }] },
      ],
      models: [],
    },
  };

  // Overlay volontairement hostile : groupe fantome, ligne fantome, `ip` range
  // dans ELECTRICAL par le PDF, et deux cles dynamiques.
  const hostile = await buildProductFromMasterTemplate(
    {
      name: 'PXT ULTRA',
      specs: {
        groups: [
          { id: 'electrical', label: 'ELECTRIQUE', rows: [{ key: 'ip', label: 'IP' }] },
          { id: 'ghost', label: 'GHOST', rows: [{ key: 'fantome', label: 'Fantome' }] },
        ],
        models: [
          {
            name: 'PXT-U1.2',
            specs: { pitch: '1.2 mm', ip: 'IP30', fantome: 'doit disparaitre', 'moduleDim.moduleRes': 'souillure' },
          },
        ],
      },
    } as Partial<Product>,
    async () => realMaster
  );

  check(
    'structure : les groupes du PDF sont ignores',
    JSON.stringify(hostile.specs?.groups.map((g) => g.id)) === JSON.stringify(['physical', 'optical', 'environmental']),
    JSON.stringify(hostile.specs?.groups.map((g) => g.id))
  );
  check(
    'structure : les lignes du PDF sont ignorees, ordre du master conserve',
    JSON.stringify(hostile.specs?.groups.flatMap((g) => g.rows.map((r) => r.key))) ===
      JSON.stringify(['pitch', 'cabDim', 'brightness', 'ip'])
  );
  check(
    'structure : les libelles viennent du master, jamais du PDF',
    JSON.stringify(hostile.specs?.groups.flatMap((g) => g.rows.map((r) => r.label))) ===
      JSON.stringify(['PIXEL PITCH', 'CABINET DIMENSIONS', 'BRIGHTNESS', 'IP RATING'])
  );
  check(
    'placement : ip reste dans ENVIRONMENTAL malgre le classement du PDF',
    hostile.specs?.groups.find((g) => g.rows.some((r) => r.key === 'ip'))?.id === 'environmental'
  );
  check(
    'stockage : seules les cles du master restent dans le modele',
    JSON.stringify(Object.keys(hostile.specs?.models?.[0]?.specs ?? {}).sort()) === JSON.stringify(['ip', 'pitch']),
    JSON.stringify(Object.keys(hostile.specs?.models?.[0]?.specs ?? {}))
  );
  check(
    'valeurs : la valeur du PDF est bien conservee sous sa cle canonique',
    hostile.specs?.models?.[0]?.specs?.pitch === '1.2 mm',
    String(hostile.specs?.models?.[0]?.specs?.pitch)
  );

  // ── 14. Le repli hors ligne vaut pour le master ────────────────────────
  // Si Firestore est illisible, la structure vient du squelette de secours.
  // Celui-ci portait 20 lignes et des libelles divergents, et `cabRes`
  // n'existait QUE cote Firestore : la meme fiche perdait une caracteristique
  // selon qu'elle etait construite en ligne ou hors ligne. Le repli est
  // l'instantane du master, il doit donc evolutionner avec lui.
  console.log('\n--- 14. Le repli hors ligne reproduit le master ---');
  const offline = await buildProductFromMasterTemplate(
    { specs: { models: [{ name: 'PXT-U1.2', specs: { pitch: '1.2 mm' } }] } } as Partial<Product>,
    async () => null
  );
  const offlineKeys = offline.specs?.groups.flatMap((g) => g.rows.map((r) => r.key)) ?? [];
  const offlineLabels = offline.specs?.groups.flatMap((g) => g.rows.map((r) => r.label ?? '')) ?? [];
  check('repli : 5 groupes', offline.specs?.groups.length === 5, String(offline.specs?.groups.length));
  check('repli : 21 lignes, comme le master Firestore', offlineKeys.length === 21, String(offlineKeys.length));
  check('repli : aucune cle dupliquee', new Set(offlineKeys).size === 21, String(new Set(offlineKeys).size));
  check('repli : cabRes present (absent du repli avant correction)', offlineKeys.includes('cabRes'));
  check(
    'repli : cabRes a sa place, entre moduleDim et cabDim',
    // Le groupe `general` precede : les 2 premieres cles ne sont pas physiques.
    JSON.stringify(offlineKeys.slice(2, 9)) ===
      JSON.stringify(['pitch', 'density', 'moduleRes', 'moduleDim', 'cabRes', 'cabDim', 'weight'])
  );
  check(
    'repli : libelles du master en capitales',
    offlineLabels.every((l) => l === l.toUpperCase()),
    offlineLabels.filter((l) => l !== l.toUpperCase()).join(', ')
  );
  check(
    'repli : aucune cle dynamique stockee non plus',
    JSON.stringify(Object.keys(offline.specs?.models?.[0]?.specs ?? {})) === JSON.stringify(['pitch']),
    JSON.stringify(Object.keys(offline.specs?.models?.[0]?.specs ?? {}))
  );
}

main()
  .catch((e) => {
    failures += 1;
    console.log('FAIL - erreur inattendue', e);
  })
  .finally(() => {
    console.log(failures === 0 ? 'MASTER-TEMPLATE-PASS' : `MASTER-TEMPLATE-FAIL (${failures})`);
    process.exit(failures === 0 ? 0 : 1);
  });
