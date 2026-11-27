import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import postcss from 'postcss';

const ROOT = process.cwd();
const MODELS = [
  { id: 'model1-transparent', source: '0dalleTransparent' },
  { id: 'model2-black', source: '0dalleblack' },
  { id: 'model3-curved', source: null },
  { id: 'model5-simple', source: '0dallesemple' },
  { id: 'model6-kinetic', source: '0dalleTransparent2026' },
] as const;

/** Fichiers volontairement adaptés au CMS (contexte, fond cadré, plus d'upload visiteur). */
const CMS_ADAPTED_FILES = new Set([
  'App.tsx',
  'components/AmbientBackdrop.tsx',
  'components/PhotonicsCanvas3D.tsx',
]);

let assertions = 0;
let failures = 0;

function check(condition: boolean, label: string) {
  assertions += 1;
  if (condition) {
    console.log(`  PASS | ${label}`);
  } else {
    failures += 1;
    console.error(`  FAIL | ${label}`);
  }
}

function source(path: string): string {
  const full = join(ROOT, path);
  return existsSync(full) ? readFileSync(full, 'utf8').replace(/\r\n/g, '\n') : '';
}

function walk(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

function rewriteAssets(value: string): string {
  return value
    .replaceAll('/assets/aistudio/favicon_f9979c15.png', '/product-3d/assets/aistudio/favicon_f9979c15.png')
    .replaceAll('/src/assets/images/', '/product-3d/model6-kinetic/');
}

function sourceDir(model: (typeof MODELS)[number]): string {
  if (model.source) return join(ROOT, '0dalle', model.source, 'src');
  const folder = readdirSync(join(ROOT, '0dalle')).find((name) => name.startsWith('0dalleencurv'));
  return join(ROOT, '0dalle', folder ?? '', 'src');
}

function main() {
  console.log('--- 1. Fidélité aux cinq sources originales ---');
  for (const model of MODELS) {
    const from = sourceDir(model);
    const dest = join(ROOT, 'src/components/product-3d/models', model.id);
    const files = walk(from).filter(
      (file) => /\.(ts|tsx)$/.test(file) && !file.endsWith('panelSpecs.test.ts'),
    );
    let identical = files.length > 0;
    for (const file of files) {
      const rel = file.slice(from.length + 1).replace(/\\/g, '/');
      if (rel === 'main.tsx' || CMS_ADAPTED_FILES.has(rel)) continue;
      const target = join(dest, rel);
      const expected = rewriteAssets(readFileSync(file, 'utf8').replace(/\r\n/g, '\n'));
      const actual = existsSync(target)
        ? readFileSync(target, 'utf8').replace(/\r\n/g, '\n').replace(/^'use client';\n/, '')
        : '';
      if (expected !== actual) identical = false;
    }
    check(identical, `${model.id} : moteur TS/TSX identique à la source (hors adaptations CMS documentées)`);
    const adaptedApp = source(`src/components/product-3d/models/${model.id}/App.tsx`);
    const adaptedCanvas = source(`src/components/product-3d/models/${model.id}/components/PhotonicsCanvas3D.tsx`);
    check(adaptedApp.includes('readProduct3DParam') && adaptedApp.includes('useProduct3DModelConfig'), `${model.id} : App adapté au contexte CMS`);
    check(!adaptedCanvas.includes('type="file"') && !adaptedCanvas.includes('Vidéo .mp4') && !adaptedCanvas.includes('videoUrl?'), `${model.id} : aucun téléversement ni source vidéo`);
  }

  console.log('--- 2. Feuilles de style isolées et valides ---');
  for (const model of MODELS) {
    const css = source(`src/components/product-3d/models/${model.id}/styles.css`);
    let parsed = null;
    try {
      parsed = postcss.parse(css);
    } catch {
      parsed = null;
    }
    check(!!parsed, `${model.id} : CSS analysable`);
    check(!css.includes('@import "tailwindcss"') && !css.includes('@layer base') && !css.includes('@theme'), `${model.id} : directives Vite retirées`);
    check(css.startsWith("@import url('https://fonts.googleapis.com/css2?"), `${model.id} : polices d’origine chargées`);
    let declarationPrefixed = false;
    let selectorUnscoped = false;
    parsed?.walkDecls((decl) => {
      if (decl.prop.startsWith('.p3d-')) declarationPrefixed = true;
    });
    parsed?.walkRules((rule) => {
      let parent = rule.parent;
      while (parent) {
        if (parent.type === 'atrule' && /keyframes$/.test(parent.name)) return;
        parent = parent.parent;
      }
      if (!rule.selector.split(',').every((part) => part.trim().startsWith('.p3d-'))) selectorUnscoped = true;
    });
    check(!declarationPrefixed && !selectorUnscoped, `${model.id} : sélecteurs cadrés, déclarations inchangées`);
    check(css.includes('@media (prefers-reduced-motion: reduce)'), `${model.id} : mouvement réduit conservé`);
  }

  console.log('--- 3. Point d’entrée sans hauteur imposée ---');
  for (const model of MODELS) {
    const entry = source(`src/components/product-3d/models/${model.id}/Model3D.tsx`);
    check(entry.includes("import App from './App';") && entry.includes("import './styles.css';"), `${model.id} : monte le vrai App avec ses styles`);
    check(entry.includes(`<div className="${model.id === 'model3-curved' ? 'p3d-model3-curved' : `p3d-${model.id}`}">`), `${model.id} : racine sans conteneur parasite`);
    check(!/h-\[(640|720)px\]|h-screen|overflow-auto|overflow-hidden/.test(entry), `${model.id} : aucune hauteur ni coupure ajoutée`);
  }

  console.log('--- 4. Catalogue et chargement dynamique ---');
  const catalog = source('src/components/product-3d/catalog.ts');
  for (const n of [1, 2, 3, 5, 6]) check(catalog.includes(`number: ${n},`), `modèle ${n} répertorié`);
  check(catalog.includes('DEFAULT_PRODUCT_3D_MODEL'), 'repli défini pour les produits anciens');
  for (const folder of ['0dalleTransparent', '0dalleblack', '0dalleencurvé', '0dallesemple', '0dalleTransparent2026']) {
    check(catalog.includes(`sourceFolder: '${folder}'`), `catalogue : vrai dossier source ${folder}`);
  }
  check(!catalog.includes('0dalleincurvé'), 'catalogue : faute de frappe « 0dalleincurvé » absente');
  check(!catalog.includes('model4-wall') && !catalog.includes('0dallemural') && !catalog.includes('supportsVideo'), 'modèle 4 et capacité vidéo retirés du catalogue');
  const central = source('src/components/product-3d/Product3DModule.tsx');
  check(central.includes('dynamic(') && central.includes('ssr: false'), 'chargement client unique');
  check((central.match(/'model\d-[a-z]+': \(\) => import/g) ?? []).length === 5, 'cinq imports dynamiques');
  check(central.includes('webglcontextlost') && central.includes('Réessayer'), 'nettoyage WebGL et reprise');
  for (const model of MODELS) check(central.includes(`./models/${model.id}/Model3D`), `${model.id} : chargé par le composant central`);

  console.log('--- 5. Section publique : module d’origine uniquement ---');
  const design = source('src/web/components/DesignSection.tsx');
  check((design.match(/id="design"/g) ?? []).length === 1, 'une seule section Conception & Dimensions');
  check(design.includes('<Product3DModule modelId={modelId} />'), 'le module d’origine occupe toute la section');
  for (const forbidden of ['design-grid', 'design-wrap', 'design-technical', 'design-viewer', 'product-3d-embed', 'Vue de face', 'Vue de profil', 'Visualisation 3D —', 'Architecture — vues techniques', 'SpecsList', 'ConfigGrid']) {
    check(!design.includes(forbidden), `aucun panneau simplifié ni doublon (${forbidden})`);
  }
  const webCss = source('src/web/web.css');
  for (const forbidden of ['.design-grid', '.design-wrap', '.design-technical', '.design-viewer', '.product-3d-embed', 'header#conception', 'glass-mirror', 'grid-template-columns: minmax(0, 42fr)']) {
    check(!webCss.includes(forbidden), `aucune surcharge CSS masquant l’interface d’origine (${forbidden})`);
  }
  const template = source('src/web/ProductPageTemplate.tsx');
  const webpage = source('src/web/WebPage.tsx');
  check(template.includes('getProduct3DModelId(product)') && template.includes('modelId={model3dId}'), 'template : modèle enregistré + prévisualisation du CMS');
  check(webpage.includes('getProduct3DModelId(product)') && webpage.includes('modelId={model3dId}'), 'WebPage : modèle enregistré + prévisualisation du CMS');
  const heroSection = source('src/web/components/HeroSection.tsx');
  check(template.includes('cmsPageId={`product__${slug}`}') && heroSection.includes('cmsPageId'), 'hero produit : page CMS correcte dès le premier rendu');
  check(webCss.includes('[data-product-main]') && webCss.includes('--product-main-top'), 'hero produit : fond noir ciblé uniquement sur la fiche produit');

  console.log('--- 6. CMS : cinq modèles, prévisualisation temporaire, sauvegarde et fond de section ---');
  const cms = source('src/web/cms/Product3DCmsControls.tsx');
  const picker = source('src/components/product-3d/Product3DModelPicker.tsx');
  const previewStore = source('src/components/product-3d/preview-store.ts');
  check(cms.includes('CHOISIR LE MODÈLE DE PRÉSENTATION 3D'), 'titre exact du panneau de sélection');
  check(picker.includes('PRODUCT_3D_MODELS.map') && picker.includes('data-testid={`model-button-${model.id}`}'), 'cinq boutons distincts exposant leur identifiant');
  check(picker.includes('{model.sourceFolder}') && picker.includes('title={model.sourceFolder}'), 'sélecteur : vrais noms de dossiers affichés');
  const namesSource = source('src/components/product-3d/model-names.ts');
  check(picker.includes('defaultProduct3DModelName') && namesSource.includes('return `Modèle ${definition.number}`'), 'libellés par défaut « Modèle N »');
  check(picker.includes('aria-pressed={active}') && picker.includes('Actif'), 'modèle actif clairement identifiable');
  check(picker.includes('aria-label={`Renommer ${displayName}`}') && picker.includes('resetProduct3DModelName'), 'crayon et restauration du nom par défaut');
  check(previewStore.includes('setProduct3DPreviewModelId') && previewStore.includes('clearProduct3DPreviewModelId'), 'sélection temporaire partagée avec la section');
  check(cms.includes('setProduct3DPreviewModelId(product.slug, modelId)'), 'changement de modèle immédiat dans la page');
  check(cms.includes('data-testid="cms-3d-save"') && cms.includes('Enregistrer'), 'bouton Enregistrer présent');
  check(cms.includes('data-testid="cms-3d-cancel"') && cms.includes('Annuler'), 'annulation et restauration du modèle enregistré');
  check(cms.includes('persistProduct3DModel(product.slug, previewModelId)') && cms.includes('product3DModelPatch'), 'sauvegarde du modèle dans le document produit');
  check(cms.includes('refresh(),') && cms.includes('getProductBySlug(product.slug)'), 'produit rafraîchi après enregistrement');
  const bar = source('src/web/cms/CmsSectionBar.tsx');
  check(!bar.includes('Product3DCmsControls'), 'panneau 3D retiré du CMS public');
  check(!bar.includes("activeKey === 'design' && <Product3DCmsControls"), 'aucun montage du panneau 3D dans la barre CMS');
  const editable = source('src/web/cms/EditableWrapper.tsx');
  const bgControl = source('src/web/cms/SectionBackgroundControl.tsx');
  const sectionStyle = source('src/web/cms/useSectionStyle.ts');
  check(editable.includes('bgColor') && editable.includes('bgImage') && editable.includes('bgParallax'), 'wrapper : couleur, image et parallaxe lus depuis le CMS');
  check(editable.includes("sec.style.backgroundAttachment = bgParallax ? 'fixed' : 'scroll'"), 'parallaxe appliquée à la section uniquement');
  check(!editable.includes('document.body.style') && !editable.includes('document.documentElement.style'), 'aucune modification de body ou html');
  check(bgControl.includes('uploadMedia(file)') && bgControl.includes('saveCurrentPage()'), 'import d’image et sauvegarde réelle');
  check(bgControl.includes('Remplacer') && bgControl.includes('Effet parallaxe'), 'remplacement d’image et réglage parallaxe présents');
  check(sectionStyle.includes('bgParallax') && sectionStyle.includes('backgroundAttachment'), 'conversion CMS du fond conservée');
  check(editable.includes('<SectionBackgroundControl') && editable.includes('sectionKey={sectionKey}'), 'réglages d’arrière-plan montés sur chaque section');

  console.log('--- 7. Données produit et ressources ---');
  const types = source('src/lib/products/types.ts');
  check(types.includes('model3dId?: string;') && types.includes("'3dModelId'?: string;") && types.includes("'3dConfig'?: {"), 'champs canonique, historique et configuration stables');
  const modelField = source('src/components/product-3d/model-field.ts');
  check(modelField.includes("model3dId: id") && modelField.includes("'3dModelId': id"), 'un seul patch écrit les deux identifiants cohérents');
  const names = source('src/components/product-3d/model-names.ts');
  check(names.includes("doc(firestore, 'settings', PRODUCT_3D_NAMES_SETTING_ID)") && names.includes('setDoc('), 'noms globaux persistés dans Firestore');
  check(names.includes('delete next[modelId]') && names.includes('resetProduct3DModelName'), 'restauration du nom par défaut');
  const preview = source('src/components/product-3d/Product3DPreview.tsx');
  const previewCss = source('src/components/product-3d/product-3d-preview.css');
  check(preview.includes('<Product3DModule modelId={modelId} onModelResolved={handleModelResolved} />'), 'prévisualisation : vrai composant original');
  check(preview.includes("startsWith('three.js')") && previewCss.includes("[data-p3d-preview-hidden='true']"), 'seul le canvas WebGL est conservé, sans panneau de contrôle');
  check(!preview.includes('PRODUCT_3D_MODELS.map'), 'un seul moteur 3D chargé à la fois');
  check(previewCss.includes('.p3d-admin-preview'), 'masquage local au conteneur de prévisualisation');
  check(preview.includes('data-p3d-preview-root="true"'), 'prévisualisation : racine marquée sans conteneur supplémentaire');
  check(preview.includes("setProperty('height'") && previewCss.includes(':has(canvas)') && previewCss.includes('min-height: 0 !important;'), 'prévisualisation : ancêtres du canvas alignés sur le conteneur');
  check(previewCss.includes('.p3d-model6-kinetic .fixed'), 'prévisualisation : dock fixe du modèle 6 neutralisé');
  check(previewCss.includes('display: block !important') && !previewCss.includes('object-fit: contain'), 'prévisualisation : grille interne neutralisée, canvas sans letterbox');
  check(!existsSync(join(ROOT, 'src/app/pxt-admin-preview/page.tsx')), 'route temporaire /pxt-admin-preview supprimée');
  const admin = source('src/app/admin/site-web/produits/_components/SiteWebProduitsModule.tsx');
  check(admin.includes('Modèle de présentation 3D'), 'admin : section au libellé exact');
  check((admin.match(/\.\.\.product3DModelPatch\(model3dId\),/g) ?? []).length === 2, 'admin : création et mise à jour du modèle');
  check(admin.includes('<Product3DConfigCards') && admin.includes('<Product3DPreview'), 'admin : cartes de configuration et prévisualisation réelle');
  check(admin.includes('lg:grid-cols-[minmax(0,1.22fr)_minmax(0,1fr)]'), 'admin : colonnes 55/45 sur desktop');
  const cards = source('src/app/admin/site-web/produits/_components/Product3DConfigCards.tsx');
  check(/PRODUCT_3D_MODELS\.map\(\(model(?:, index)?\) =>/.test(cards) && !cards.includes('model4-wall'), 'admin : cinq lignes, sans modèle 4');
  check(cards.includes('data-testid="admin-3d-on-off-indicator"') && !cards.includes('aria-expanded'), 'admin : indicateur ON/OFF séparé, aucun accordéon');
  check(!cards.includes('Ajouter une vidéo') && !cards.includes('Remplacer') && !cards.includes('Supprimer la vidéo') && !cards.includes('/video'), 'admin : aucune action vidéo dans les lignes');
  check(admin.includes('withExclusiveModel') && !admin.includes('<Product3DModelPicker'), 'admin : sélection exclusive par produit, sans sélecteur additionnel');
  check(!existsSync(join(ROOT, 'src/app/refonte-check/page.tsx')), 'aucune page publique /refonte-check');
  check(!existsSync(join(ROOT, 'src/app/visual-check-3d/page.tsx')), 'aucune page publique /visual-check-3d');
  check(!existsSync(join(ROOT, 'src/app/api/site-web/products/[slug]/video/route.ts')) && !existsSync(join(ROOT, 'src/lib/products/product-3d-videos.ts')), 'API et utilitaires vidéo supprimés');
  check(existsSync(join(ROOT, 'public/product-3d/assets/aistudio/favicon_f9979c15.png')), 'logo PixiaTech servi localement');
  for (const model of MODELS) {
    const dir = join(ROOT, 'public/product-3d', model.id);
    check(existsSync(dir) && readdirSync(dir).length > 0, `${model.id} : ressources autonomes`);
  }
  const leaking = walk(join(ROOT, 'src/components/product-3d')).filter((file) => {
    const content = readFileSync(file, 'utf8');
    return content.includes('0dalle/') || content.includes("'/0dalle") || content.includes('0dalle\\');
  });
  check(leaking.length === 0, 'aucun import vers le dossier source 0dalle');

  console.log('--- 8. Correction du provider CMS ---');
  const shell = source('src/app/web/web-cms-shell.tsx');
  const providerOpen = shell.indexOf('<ProductsProvider>');
  const bridgeOpen = shell.indexOf('<WebCmsBridge />');
  const providerClose = shell.indexOf('</ProductsProvider>');
  const childrenStart = shell.indexOf('{children}');
  check(providerOpen >= 0 && bridgeOpen > providerOpen && providerClose > bridgeOpen, 'WebCmsBridge monté dans ProductsProvider');
  check(childrenStart > providerClose, 'children laissés hors du provider ajouté');

  console.log('--- 9. Matrice LED : cause technique du runtime ---');
  const dot = source('src/web/components/DotMatrixSignButton.tsx');
  check(dot.includes('let OFF = hex(DEFAULT_OFF, DEFAULT_OFF)') && dot.includes('readColours();'), 'matrice LED : couleurs initialisées avant le ticker');
  check(dot.includes('if (!ready) return;') && dot.includes('ready = true;'), 'matrice LED : dessin différé après dimensionnement du canvas');
  check(!dot.includes('let OFF: number[];') && !dot.includes('rgb(fill) === undefined'), 'matrice LED : aucune couleur RGB indéfinie');
  check(dot.includes('gsap.ticker.add(draw)') && dot.includes('gsap.timeline('), 'matrice LED : animations d’origine conservées');

  console.log('--- 10. Fond décoratif limité à son modèle ---');
  for (const model of MODELS) {
    const backdrop = source(`src/components/product-3d/models/${model.id}/components/AmbientBackdrop.tsx`);
    check(
      backdrop.includes('pointer-events-none absolute inset-0 z-0') && !backdrop.includes('fixed inset-0'),
      `${model.id} : fond ancré au modèle, pas au viewport`,
    );
    const original = source(`0dalle/${model.source ?? '0dalleencurvé'}/src/components/AmbientBackdrop.tsx`);
    check(
      original.includes('pointer-events-none absolute inset-0 z-0') && !original.includes('fixed inset-0'),
      `${model.source ?? '0dalleencurvé'} : source du fond également cadrée`,
    );
  }

  console.log(`\nRésultat : ${assertions - failures}/${assertions} assertions réussies.`);
  if (failures > 0) {
    console.error(`${failures} échec(s).`);
    process.exit(1);
  }
}

void main();
