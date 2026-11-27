import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { PRODUCT_3D_MODELS } from '../src/components/product-3d/catalog';

const ROOT = process.cwd();
let assertions = 0;
let failures = 0;

function check(condition: boolean, label: string) {
  assertions += 1;
  if (condition) console.log(`  PASS | ${label}`);
  else {
    failures += 1;
    console.error(`  FAIL | ${label}`);
  }
}

function source(relative: string): string {
  const full = join(ROOT, relative);
  return existsSync(full) ? readFileSync(full, 'utf8').replace(/\r\n/g, '\n') : '';
}

const admin = source('src/app/admin/site-web/produits/_components/SiteWebProduitsModule.tsx');
const cards = source('src/app/admin/site-web/produits/_components/Product3DConfigCards.tsx');
const preview = source('src/components/product-3d/Product3DPreview.tsx');
const previewCss = source('src/components/product-3d/product-3d-preview.css');
const moduleSource = source('src/components/product-3d/Product3DModule.tsx');
const context = source('src/components/product-3d/config-context.tsx');
const catalog = source('src/components/product-3d/catalog.ts');
const types = source('src/lib/products/types.ts');
const template = source('src/web/ProductPageTemplate.tsx');
const webpage = source('src/web/WebPage.tsx');
const design = source('src/web/components/DesignSection.tsx');

const VIDEO_FILES = [
  'src/app/api/site-web/products/[slug]/video/route.ts',
  'src/lib/products/product-3d-videos.ts',
];

console.log('--- 1. Indépendance du formulaire produit ---');
check(admin.includes("key={state.view === 'edit' ? state.product.slug : 'new'}"), 'formulaire remonté sur un changement de produit');
check(admin.includes('setModel3dId(nextModelId);'), 'modèle 3D resynchronisé depuis le produit');
check(admin.includes("setThreeDConfig(withExclusiveModel(existing?.['3dConfig'], nextModelId));"), 'configuration 3D resynchronisée et exclusive depuis le produit');
check(!admin.includes("'3dConfig': existing?.['3dConfig']"), 'aucune sauvegarde d’une configuration obsolète');
check((admin.match(/'3dConfig': threeDConfig,/g) ?? []).length === 2, 'création et mise à jour écrivent la configuration locale');

console.log('--- 2. Cinq lignes, sélection exclusive et rigueur visuelle ---');
check(PRODUCT_3D_MODELS.length === 5, 'catalogue : exactement cinq modèles');
check(/PRODUCT_3D_MODELS\.map\(\(model(?:, index)?\) =>/.test(cards), 'cartes admin : cinq lignes sans exclusion');
check(cards.includes("from '@/components/ui/switch'") && cards.includes('<Switch') && cards.includes('size="sm"'), 'Switch partagé élargi (sm) réutilisé');
check(!cards.includes('size="xs"'), 'aucun Switch miniature');
check(!cards.includes('GREEN_SWITCH_STYLE') && !cards.includes('--ui-accent'), 'Switch suit le thème, jamais forcé au vert');
check(cards.includes('data-testid="admin-3d-on-off-indicator"') && cards.includes("data-state={active ? 'on' : 'off'}"), 'indicateur ON/OFF distinct du Switch');
check(cards.includes('text-emerald-400') && cards.includes("active ? 'text-emerald-400' : 'text-slate-500'"), 'indicateur vert en ON, neutre en OFF');
check(!cards.includes('expandedModelId') && !cards.includes('aria-expanded') && !cards.includes('<select'), 'aucun accordéon ni menu déroulant');
check(!cards.includes('Réglages') && !cards.includes('Masquer') && !cards.includes('Eye'), 'aucun réglage ni option supplémentaire');
check(admin.includes('bg-[#0C0F16]') && !cards.includes('opacity-50') && !cards.includes('disabled:opacity'), 'fond sombre unique pour toutes les lignes, actives ou non');
check(context.includes('export function withExclusiveModel') && admin.includes('withExclusiveModel'), 'sélection exclusive normalisée par produit');
check(admin.includes('const select3DModel = (id: string)') && admin.includes('onModelChange={select3DModel}'), 'un seul ON lors de la sélection');
check(admin.includes("'3dConfig': nextConfig") && admin.includes('...product3DModelPatch(nextModelId)'), 'sélection sauvegardée dans le produit');
check(!admin.includes('<Product3DModelPicker') && !cards.includes('{model.sourceFolder}'), 'interface épurée : aucun sélecteur ni identifiant technique visible');
check(!admin.includes('Un seul modèle actif par produit'), 'aucune note explicative superflue dans la section 3D');
check(admin.includes('lg:grid-cols-[minmax(0,1.22fr)_minmax(0,1fr)]'), 'colonnes 55/45 conformes à la maquette');

console.log('--- 3. Prévisualisation : pleine carte, sans bande ni scrollbar ---');
check(preview.includes('<Product3DModule modelId={modelId} onModelResolved={handleModelResolved} />'), 'un seul moteur 3D monté et modèle résolu suivi');
check(preview.includes('<Product3DConfigProvider value={config}>') && moduleSource.includes('useProduct3DConfig()') && moduleSource.includes('`${definition.id}-${renderId}-${fingerprint}`'), 'configuration propagée et scène remontée au changement de modèle');
check(preview.includes("setProperty('width'") && preview.includes("setProperty('height'") && preview.includes('new ResizeObserver'), 'dimensions réelles du mount et observation du conteneur');
check(preview.includes("if (sizeChanged) window.dispatchEvent(new Event('resize'))"), 'redimensionnement WebGL sans boucle');
check(previewCss.includes(':has(canvas)') && previewCss.includes('display: block !important'), 'grilles internes neutralisées : plus de colonne réservée à gauche');
check(!previewCss.includes('object-fit: contain'), 'aucun letterbox CSS sur le canvas WebGL');
check(previewCss.includes('transform: none !important') && previewCss.includes('translate: none !important'), 'aucun décalage interne résiduel du canvas');
check(previewCss.includes('overflow: hidden !important') && previewCss.includes('scrollbar-width: none !important'), 'aucune barre ni débordement interne');
check(previewCss.includes('border-radius: 0.75rem') && previewCss.includes('border: 1px solid rgba(255, 255, 255, 0.12)'), 'bordure discrète et coins légèrement arrondis');
check(previewCss.includes('prefers-reduced-motion: reduce'), 'mouvement réduit respecté');
check(preview.includes('Math.round(root.clientWidth || rect.width)'), 'canvas dimensionné sur la surface utile de la carte');

console.log('--- 4. Vidéo supprimée définitivement ---');
check(VIDEO_FILES.every((file) => !existsSync(join(ROOT, file))), 'route API et utilitaires vidéo supprimés');
check(!types.includes('Product3DVideoRef') && !types.includes('videos?: Record<string'), 'aucun type de référence vidéo 3D dans le produit');
check(!context.includes('videos') && !context.includes('video?:') && !moduleSource.includes('videos'), 'aucune projection vidéo dans le contexte 3D');
check(!cards.includes('Ajouter une vidéo') && !cards.includes('Remplacer') && !cards.includes('Supprimer la vidéo') && !cards.includes('/video'), 'aucune action vidéo dans les lignes du CMS');
check(!admin.includes('/video') && !admin.includes('uploadVideo'), 'aucun appel vidéo depuis le formulaire produit');
const model1App = source('src/components/product-3d/models/model1-transparent/App.tsx');
const model1Canvas = source('src/components/product-3d/models/model1-transparent/components/PhotonicsCanvas3D.tsx');
check(!model1App.includes('videoUrl=') && !model1Canvas.includes('videoUrl?:'), 'aucune source vidéo injectée dans le moteur 3D');
check(!model1Canvas.includes('customVideoRef') && !model1Canvas.includes('Vidéo CMS'), 'chargement vidéo du moteur retiré');

console.log('--- 5. Modèle 4 supprimé définitivement ---');
check(!catalog.includes('model4-wall') && !catalog.includes('0dallemural') && !catalog.includes('supportsVideo'), 'catalogue sans modèle 4 ni capacité vidéo');
check(!moduleSource.includes('model4-wall'), 'aucun loader pour le modèle 4');
check(!existsSync(join(ROOT, 'src/components/product-3d/models/model4-wall')), 'module du modèle 4 supprimé');
check(!existsSync(join(ROOT, '0dalle/0dallemural')), 'source 0dallemural supprimée');
check(!existsSync(join(ROOT, 'public/product-3d/model4-wall')), 'assets publics du modèle 4 supprimés');

console.log('--- 6. Configuration par produit, du CMS au public ---');
check(context.includes('useProduct3DModelConfig(modelId: string)'), 'contexte isolé par identifiant de modèle');
check(context.includes('readProduct3DParam') && context.includes('readProduct3DNumber'), 'paramètres éditables validés');
check(types.includes('disabledModels?: string[];') && types.includes('hiddenModels?: string[];'), 'états Actif/Masqué persistés');
check(template.includes("config={product?.['3dConfig']}") && webpage.includes("config={product?.['3dConfig']}"), 'les deux fiches publiques lisent la configuration du produit');
check(design.includes('<Product3DConfigProvider value={config}>') && design.includes('<Product3DModule modelId={modelId} />'), 'DesignSection transmet la configuration au module');
for (const id of ['model1-transparent', 'model2-black', 'model3-curved', 'model5-simple', 'model6-kinetic']) {
  const app = source(`src/components/product-3d/models/${id}/App.tsx`);
  check(app.includes(`useProduct3DModelConfig('${id}')`), `${id} : réglages lus depuis le CMS`);
}
check(!existsSync(join(ROOT, 'src/app/refonte-check')), 'aucune page ni route de test /refonte-check');
check(!existsSync(join(ROOT, 'src/app/visual-check-3d')), 'aucune page ni route de test /visual-check-3d');

console.log(`\n${assertions - failures}/${assertions} assertions réussies.`);
if (failures > 0) process.exitCode = 1;
