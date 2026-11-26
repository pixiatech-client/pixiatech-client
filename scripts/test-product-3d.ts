import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
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

function main() {
  console.log('--- 1. Catalogue des six modèles ---');
  const catalog = source('src/components/product-3d/catalog.ts');
  for (let n = 1; n <= 6; n += 1) {
    check(catalog.includes(`number: ${n},`), `modèle ${n} répertorié dans le catalogue`);
  }
  check(catalog.includes('supportsInstallationModes: true'), 'au moins un modèle déclare les modes d’installation');
  check(
    (catalog.match(/supportsInstallationModes: true/g) ?? []).length === 1,
    'les modes d’installation ne sont pas appliqués à tous les modèles'
  );

  console.log('--- 2. Chargement dynamique d’un seul modèle ---');
  const central = source('src/components/product-3d/Product3DModule.tsx');
  check(central.includes('dynamic('), 'composant central utilisant next/dynamic');
  check(central.includes('ssr: false'), 'module 3D chargé côté navigateur uniquement');
  check((central.match(/'model\d-[a-z]+': \(\) => import/g) ?? []).length === 6, 'exactement six charges dynamiques déclarés');
  check(central.includes('webglcontextlost'), 'nettoyage WebGL au démontage');
  check(central.includes('Réessayer'), 'état d’erreur avec reprise');
  check(central.includes('Chargement de la visualisation 3D'), 'état de chargement explicite');

  console.log('--- 3. Modèles réels isolés ---');
  const models = [
    'model1-transparent',
    'model2-black',
    'model3-curved',
    'model4-wall',
    'model5-simple',
    'model6-kinetic',
  ];
  for (const model of models) {
    const entry = source(`src/components/product-3d/models/${model}/Model3D.tsx`);
    check(entry.includes('use client'), `${model} : point d’entrée client`);
    check(entry.includes('import App'), `${model} : réutilise le vrai composant d’origine`);
    check(entry.includes("./styles.css"), `${model} : styles isolés importés`);
    check(central.includes(`./models/${model}/Model3D`), `${model} : chargé par le composant central`);
  }

  console.log('--- 4. Persistance du modèle par produit ---');
  const types = source('src/lib/products/types.ts');
  check(types.includes("'3dModelId'?: string;"), 'identifiant 3D stable dans le document produit');
  check(types.includes("'3dConfig'?: {"), 'configuration 3D optionnelle dans le document produit');
  const admin = source('src/app/admin/site-web/produits/_components/SiteWebProduitsModule.tsx');
  check(admin.includes("'3dModelId': isProduct3DModelId(model3dId) ? model3dId : undefined"), 'admin : modèle inclus à la création');
  check((admin.match(/'3dModelId': isProduct3DModelId\(model3dId\) \? model3dId : undefined/g) ?? []).length === 2, 'admin : modèle inclus à la création et à la mise à jour');
  check(admin.includes('Prévisualisation réelle'), 'admin : prévisualisation du vrai module 3D');
  const cms = source('src/web/cms/Product3DCmsControls.tsx');
  check(cms.includes("updateProduct(product.slug, { '3dModelId': modelId })"), 'CMS : écrit dans le même document produit');
  check(cms.includes('await refresh()'), 'CMS : rafraîchit le produit après enregistrement');
  const bar = source('src/web/cms/CmsSectionBar.tsx');
  check(bar.includes("activeKey === 'design' && <Product3DCmsControls"), 'CMS : panneau limité à la section Conception & Dimensions');

  console.log('--- 5. Fiche publique ---');
  const design = source('src/web/components/DesignSection.tsx');
  check(design.includes("import Product3DModule"), 'fiche publique : vrai module 3D monté');
  check(design.includes('getProduct3DDefinition(modelId)'), 'fiche publique : modèle propre au produit');
  check(design.includes('Vue de face'), 'partie gauche : vue de face');
  check(design.includes('Vue de profil'), 'partie gauche : vue de profil');
  check(design.includes('Visualisation 3D'), 'partie droite : visualisation 3D');
  check(!design.includes('Technical Cabinet & Module Blueprint'), 'ancien blueprint statique retiré de la section');
  const template = source('src/web/ProductPageTemplate.tsx');
  check(template.includes("modelId={product?.['3dModelId']}"), 'template : identifiant transmis depuis le produit');
  const webpage = source('src/web/WebPage.tsx');
  check(webpage.includes("modelId={product?.['3dModelId']}"), 'WebPage : identifiant transmis depuis le produit');

  console.log('--- 6. Ressources autonomes ---');
  check(existsSync(join(ROOT, 'public/product-3d/assets/aistudio/favicon_f9979c15.png')), 'logo PixiaTech copié dans public/product-3d');
  for (const model of models) {
    const dir = join(ROOT, 'public/product-3d', model);
    check(existsSync(dir) && readdirSync(dir).length > 0, `${model} : ressources présentes dans public/product-3d`);
  }
  const codeFiles = walk(join(ROOT, 'src/components/product-3d'));
  const leaking = codeFiles.filter((file) => {
    const content = readFileSync(file, 'utf8');
    return content.includes('0dalle/') || content.includes("'/0dalle") || content.includes('0dalle\\');
  });
  check(leaking.length === 0, 'aucun import ni chemin dynamique vers le dossier source 0dalle');
  const textures = models.slice(0, 5).map((model) => `src/components/product-3d/models/${model}/three/proceduralTextures.ts`);
  check(
    textures.every((file) => {
      const content = source(file);
      return content.includes("img.src = '/product-3d/assets/aistudio/favicon_f9979c15.png'") && !content.includes("'/product-3d/product-3d/assets/");
    }),
    'logo des modèles servi depuis le chemin public correct'
  );

  console.log('--- 7. Compatibilité descendante ---');
  check(catalog.includes('DEFAULT_PRODUCT_3D_MODEL'), 'modèle par défaut défini pour les produits anciens');
  check(design.includes('getProduct3DDefinition(modelId)'), 'un produit sans modèle utilise le repli sans erreur');
  check(admin.includes('getProduct3DDefinition(existing?.[\'3dModelId\'])'), 'admin : initialise le sélecteur depuis le produit existant');

  console.log('--- 8. Correction du provider CMS ---');
  const shell = source('src/app/web/web-cms-shell.tsx');
  check(shell.includes("import { ProductsProvider } from '@/lib/products/products-context';"), 'shell CMS : import du ProductsProvider');
  const providerOpen = shell.indexOf('<ProductsProvider>');
  const bridgeOpen = shell.indexOf('<WebCmsBridge />');
  const providerClose = shell.indexOf('</ProductsProvider>');
  const childrenStart = shell.indexOf('{children}');
  check(providerOpen >= 0 && bridgeOpen > providerOpen && providerClose > bridgeOpen, 'shell CMS : WebCmsBridge monté dans ProductsProvider');
  check(childrenStart > providerClose, 'shell CMS : children laissés hors du provider ajouté');

  console.log('--- 9. Grille Conception & Dimensions 42/58 ---');
  check(design.includes('className="section theme-dark design-section"'), 'section : classe locale design-section');
  check(design.includes('<div className="design-wrap">'), 'section : conteneur local design-wrap');
  check(design.includes('<div className="design-grid">'), 'section : grille dédiée design-grid');
  check(design.includes('<div className="design-technical space-y-6">'), 'section : panneau technique identifié');
  check(design.includes('<div className="design-viewer">'), 'section : panneau 3D identifié');
  check(design.includes('<Product3DModule modelId={modelId} className="product-3d-embed" />'), 'section : module 3D intégré sans doublon');
  check((design.match(/id="design"/g) ?? []).length === 1, 'section : un seul #design');
  const webCss = source('src/web/web.css');
  check(webCss.includes('max-width: 1440px;'), 'CSS : largeur maximale du contenu à 1440 px');
  check(webCss.includes('grid-template-columns: minmax(0, 42fr) minmax(0, 58fr);'), 'CSS : proportions 42/58');
  check(webCss.includes('gap: 28px;'), 'CSS : espacement de 28 px entre panneaux');
  check(webCss.includes('.design-technical,\n.design-viewer {\n  min-width: 0;\n}'), 'CSS : min-width: 0 uniquement sur les deux panneaux');
  check(webCss.includes('@media (max-width: 1100px)'), 'CSS : palier tablette');
  check(webCss.includes('@media (max-width: 820px)'), 'CSS : palier mobile');
  check(webCss.includes('.design-technical { order: 1; }') && webCss.includes('.design-viewer { order: 2; }'), 'CSS : ordre technique puis 3D sur mobile');
  check(webCss.includes('.product-3d-embed'), 'CSS : neutralisation limitée au module intégré');
  check(webCss.includes('.product-3d-embed [class*="p3d-model"] > div {\n  height: 100% !important;\n}') && webCss.includes('.product-3d-embed [class*="p3d-model"] main {\n  height: 100% !important;'), 'CSS : hauteur propagée jusqu’à la scène 3D');
  check(webCss.includes('.product-3d-embed [class*="lg:grid-cols-[0.95fr_1.25fr]"] {\n  height: 100% !important;'), 'CSS : grille interne du module conserve la hauteur');

  console.log('--- 10. Confinement du fond des modules 3D ---');
  for (const model of models.slice(0, 5)) {
    const backdrop = source(`src/components/product-3d/models/${model}/components/AmbientBackdrop.tsx`);
    check(backdrop.includes('absolute inset-0') && !backdrop.includes('fixed inset-0'), `${model} : fond en absolu, jamais fixed`);
    check(backdrop.includes('h-[46%] w-[88%]') && !backdrop.includes('h-[36vh] w-[76vw]'), `${model} : bandeau dimensionné sur le module`);
  }
  for (const model of models) {
    const entry = source(`src/components/product-3d/models/${model}/Model3D.tsx`);
    check(entry.includes('relative') && entry.includes('overflow-hidden') && !entry.includes('overflow-auto'), `${model} : racine relative et fond coupé au module`);
  }
  check(shell.includes('<WebCmsBridge />\n      </ProductsProvider>'), 'CMS : panneau d’édition protégé contre useProducts');

  console.log(`\nRésultat : ${assertions - failures}/${assertions} assertions réussies.`);
  if (failures > 0) {
    console.error(`${failures} échec(s).`);
    process.exit(1);
  }
}

void main();
