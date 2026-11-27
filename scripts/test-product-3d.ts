import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import postcss from 'postcss';

const ROOT = process.cwd();
const MODELS = [
  { id: 'model1-transparent', source: '0dalleTransparent' },
  { id: 'model2-black', source: '0dalleblack' },
  { id: 'model3-curved', source: null },
  { id: 'model4-wall', source: '0dallemural' },
  { id: 'model5-simple', source: '0dallesemple' },
  { id: 'model6-kinetic', source: '0led3d' },
] as const;

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
  console.log('--- 1. Fidélité aux six sources originales ---');
  for (const model of MODELS) {
    const from = sourceDir(model);
    const dest = join(ROOT, 'src/components/product-3d/models', model.id);
    const files = walk(from).filter(
      (file) => /\.(ts|tsx)$/.test(file) && !file.endsWith('panelSpecs.test.ts'),
    );
    let identical = files.length > 0;
    for (const file of files) {
      const rel = file.slice(from.length + 1).replace(/\\/g, '/');
      if (rel === 'main.tsx') continue;
      const target = join(dest, rel);
      let expected = rewriteAssets(readFileSync(file, 'utf8').replace(/\r\n/g, '\n'));
      const actual = existsSync(target)
        ? readFileSync(target, 'utf8').replace(/\r\n/g, '\n').replace(/^'use client';\n/, '')
        : '';
      // Correction TS indispensable : la source du modèle 4 transmet un second
      // argument ignoré par l'implémentation d'origine.
      if (model.id === 'model4-wall' && rel === 'components/PhotonicsCanvas3D.tsx') {
        expected = expected.replace(
          'afterDraw(done, renderDirty || nonVideoAnimating ? 25 : 420);',
          'afterDraw(done);',
        );
      }
      if (expected !== actual) identical = false;
    }
    check(identical, `${model.id} : TS/TSX identiques aux sources (hors 'use client' et chemins d’assets)`);
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
  for (let n = 1; n <= 6; n += 1) check(catalog.includes(`number: ${n},`), `modèle ${n} répertorié`);
  check(catalog.includes('DEFAULT_PRODUCT_3D_MODEL'), 'repli défini pour les produits anciens');
  const central = source('src/components/product-3d/Product3DModule.tsx');
  check(central.includes('dynamic(') && central.includes('ssr: false'), 'chargement client unique');
  check((central.match(/'model\d-[a-z]+': \(\) => import/g) ?? []).length === 6, 'six imports dynamiques');
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
  check(template.includes("modelId={product?.['3dModelId']}"), 'template : identifiant issu du produit');
  check(webpage.includes("modelId={product?.['3dModelId']}"), 'WebPage : identifiant issu du produit');

  console.log('--- 6. CMS : six modèles, sauvegarde et fond de section ---');
  const cms = source('src/web/cms/Product3DCmsControls.tsx');
  check(cms.includes('`Modèle ${model.number}`'), 'les six boutons portent un libellé explicite « Modèle N »');
  check(cms.includes('data-testid={`model-button-${model.id}`}'), 'chaque bouton expose son identifiant de modèle');
  check(cms.includes("await updateProduct(product.slug, { '3dModelId': modelId })"), 'sélection enregistrée dans le produit');
  check(cms.includes('await refresh()'), 'produit rafraîchi après enregistrement');
  check(cms.includes('setPreviewModelId(modelId)'), 'changement de modèle immédiat');
  const bar = source('src/web/cms/CmsSectionBar.tsx');
  check(bar.includes("activeKey === 'design' && <Product3DCmsControls"), 'panneau limité à la section design');
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
  check(types.includes("'3dModelId'?: string;") && types.includes("'3dConfig'?: {"), 'champs stables dans le document produit');
  const admin = source('src/app/admin/site-web/produits/_components/SiteWebProduitsModule.tsx');
  check((admin.match(/'3dModelId': isProduct3DModelId\(model3dId\) \? model3dId : undefined/g) ?? []).length === 2, 'admin : création et mise à jour du modèle');
  check(admin.includes('Prévisualisation réelle'), 'admin : prévisualisation du vrai module');
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

  console.log(`\nRésultat : ${assertions - failures}/${assertions} assertions réussies.`);
  if (failures > 0) {
    console.error(`${failures} échec(s).`);
    process.exit(1);
  }
}

void main();
