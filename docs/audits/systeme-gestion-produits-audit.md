# Audit & Plan — Système de Gestion des Produits (Site Web)

Date : 24 septembre 2026
Sauvegarde git avant toute modification : `1b0a269` — `chore(backup): sauvegarde avant systeme de gestion des produits`

Ce document ne modifie **aucun code**. Il inventorie le template produit existant, identifie tous ses champs,
décrit le système PDF déjà en place (réutilisable), et propose un plan d'implémentation étape par étape
à valider avant de coder.

---

## 1. Objectif

Centraliser dans l'admin la gestion des produits du site public `/web` :

- créer un produit (nom court, slug → URL stable `/web/product/[slug]`),
- importer une fiche technique PDF avec reconnaissance automatique et préremplissage,
- re-générer automatiquement la page produit publique à partir du **modèle unique** existant
  (celui de `/web/pxt-fine`),
- modifier en pré-rempli (y compris le tableau de comparaison des specs),
- gérer la photo principale + galerie (glisser-déposer, aperçu, remplacement, suppression),
- gérer les types produit (intérieur / extérieur / semi-extérieur, vente / location, plat / courbe / 360° / 3D),
- gérer le menu méga (sections > réorganisation > produits utilisés grisés) avec séparation produit ↔ menu,
- dupliquer / supprimer (suppression douce) un produit,
- architecture données maintenable : PRODUIT / MODÈLE PRODUIT (template) / MENU MÉGA / FICHE TECHNIQUE,
- extensible : vidéos, galeries, documents, variantes, SEO, traductions.

Règles imposées : ne rien casser de l'existant, pas de refonte globale, respecter l'architecture et le design en place,
PDF obligatoirement exploitables automatiquement, robuste à différentes structures de PDF, évolutif pour de nombreux produits.

---

## 2. Le template produit existant (`/web/pxt-fine`)

- Page : `src/app/web/[[...slug]]/page.tsx` achemine `pxt-fine` → `WebPage` (`src/web/WebPage.tsx`).
- `WebPage.tsx` = **le modèle unique** de page produit. Il est aujourd'hui câblé en dur sur « PXT Fine »
  (id CMS `product_wp`) et enchaîne 7 sections : Hero, Aperçu, Conception, Caractéristiques,
  Spécifications (matrice), Réalisations, CTA final (+ en-tête/pied `XerHeader`/`XerFooter`,
  modales Consultation & Fiche technique).

### 2.1 Inventaire COMPLET des champs du template

| # | Section (composant) | Champs affichés | Source aujourd'hui | Consommé par le composant ? |
|---|---|---|---|---|
| 0 | Hero (`HeroSection`) | breadcrumb TOUS LES PRODUITS / catégorie | codé en dur | — |
| 0 | Hero | **titre** (= nom produit, ex. PXT Fine) | CMS `hero.title` | ✅ |
| 0 | Hero | **sous-titre** (accroche) | CMS `hero.subtitle` | ✅ |
| 0 | Hero | **CTA principal** (ex. Recevoir une étude technique) | CMS `hero.primaryCta` | ✅ (fallback « Demander un devis ») |
| 0 | Hero | badge, CTA secondaire, image de fond, couleur de fond | CMS `hero.*` | ❌ (présents dans les données, non rendus) |
| 0 | Hero | tags (INTÉRIEUR, Corporate…) | codé en dur | — |
| 0 | Hero | grille 4 specs (pitch / luminosité / châssis / environnement) | codé en dur | — |
| 1 | Aperçu (`OverviewSection`) | eyebrow, **titre**, **description** | CMS `overview.*` | ✅ eyebrow/titre/description |
| 1 | Aperçu | vidéo châssis + image module | codé en dur (`.webm/.mov`, `module-1.jpg`) | — |
| 1 | Aperçu | stats 3 colonnes (50% / 29,5mm / 8K) | codé en dur | ❌ (données CMS `overview.stats[]` non utilisées) |
| 1 | Aperçu | technologies (ColdLED, SolidSkin) | codé en dur | ❌ (données CMS `overview.technologies` absentes) |
| 2 | Conception (`DesignSection`) | eyebrow, **titre** | CMS `design.title` | ✅ eyebrow/titre |
| 2 | Conception | specs rapides (châssis / pitch / luminosité / environnement) | codé en dur | — |
| 2 | Conception | plan technique SVG (module 300×168.8, châssis 600×337.5, profondeur 29.5) | codé en dur | ❌ (CMS a `design.cabinetDim/weight/material/image` mais non rendus) |
| 2 | Conception | image module-3 | codé en dur | — |
| 2 | Conception | configurations (fixation murale / totem / angles) | codé en dur | — |
| 3 | Caractéristiques (`FeaturesSection`) | eyebrow, **titre** | CMS `features.title` | ✅ |
| 3 | Caractéristiques | **7 features** (num, titre, desc, image) | codé en dur (`featureList`) | ❌ (CMS `features.stages[]` existe mais non lu) |
| 4 | Spécifications (`SpecsSection`) | **matrice de comparaison** : 9 modèles × 19-21 lignes | fichier `src/web/data/specs-data.json` | ✅ (affiche `models` + `groups`) |
| 4 | Spécifications | bouton FICHE TECHNIQUE → modale Datasheet | `SpecModel` | ✅ |
| 5 | Réalisations (`FieldworkSection`) | eyebrow, **titre** | CMS `fieldwork.title` | ✅ |
| 5 | Réalisations | **projets** (image, légende, lieu/année) | codé en dur (`projects`) | ❌ (CMS `fieldwork.projects[]` existe mais non lu) |
| 6 | CTA final (`NextSection`) | bouton consultation | codé en dur | — |
| — | En-tête (`XerHeader`) | méga-menu produits + carte produit active | `src/web/xeron/xeron-catalog.ts` (`CATALOG_PRODUCTS`, `MEGA_COLUMNS`) | ✅ |
| — | Routeur | `/web/pxt-fine` → WebPage ; clic produit → TOUJOURS `/web/pxt-fine` | `XerHeader.handleProductClick` | ⚠️ slug ignoré |
| — | SEO | meta.title / meta.description | CMS `product_wp.meta` | ❌ (non rendu dans `<head>`) |
| — | Pied (`XerFooter`) | liens produits génériques → `/web/products` | codé en dur | — |

### 2.2 Sources de données actuelles (dispersées — obstacle au multi-produits)

1. **CMS** `data/pixel-tech-web-pages.json` → page `product_wp`
   (`hero/overview/design/features/fieldwork` + `meta`), servie par `/api/site-web/pages`,
   lue par `useCms()` (`src/lib/site-web/cms-context.tsx`), modifiable en visuel via l'éditeur.
2. **Fichier** `src/web/data/specs-data.json` → 9 modèles « IL-FISS-IRWPx » (matrice de specs).
3. **Fichier** `src/web/xeron/xeron-catalog.ts` → 13 séries (`CATALOG_PRODUCTS`) + méga-menu (`MEGA_COLUMNS`).
4. **Composants** → contenus codés en dur (tags, stats, technologies, blueprint, configurations, 7 features, 2 projets, vidéos).
5. **Admin boutique** `/admin/produits` → produits de la boutique (Firestore) :
   `ProductManagementClient.tsx` (~8 000 lignes) + `firebase.ts`.

Un produit est donc éclaté sur 4 emplacements. Pour gérer N produits il faut une entité unique + un modèle de rendu.

---

## 3. Système d'import PDF existant (déjà en place, réutilisable)

- Fichier : **`src/lib/product-pdf-parser.ts`** — importé par `ProductManagementClient` (`src/app/admin/produits/ProductManagementClient.tsx:48`).
- Le mode « IMPORT » existe déjà dans l'UI admin (« Mode import activé — le PDF sera analysé automatiquement »,
  clés i18n `fr.json:1520,1525` ; `handlePdfChange` → `parseProductPdf` → `applyParsedData`).
- Pipeline : `File → extractTextFromPdf (pdfjs-dist, worker /pdf.worker.min.mjs, regroupement par Y, séparation de colonnes ` | ` si écart > 30px, filtre des en-têtes « PIXIATECH • FICHE PRODUIT ») → parseProductText (regex + sections numérotées)`.
- **Pas d'IA, pas d'appel réseau** : parsing déterministe (fiabilité, hors-ligne).
- Format reconnu aujourd'hui (sections numérotées 1→8) :
  1. Nom du produit · 2. Mode de vente (vente/location/sur-commande) · 3. Badge (nouveau/populaire/promotion) ·
  4. Environnement (intérieur/extérieur/semi-extérieur) · 5. Caractéristiques techniques (table `CLÉ | VALEUR`) ·
  6. Boutons personnalisés (`Bouton 1 | libellé`) · 7. Variantes (`NOM | VALEUR | RÉFÉRENCE`) ·
  8. Description (petite description : … / description détaillée : … / mots-clés : • …).
- Ce format couvre les champs **boutique**. Il ne couvre pas (encore) les champs du **template web**
  (sections 0-6 et matrice specs). Le plan ci-dessous **étend** ce parser (mêmes techniques) pour les champs web.

⚠️ Constat : la matrice + les images ne sont pas extractibles d'un PDF texte. La fiche PDF couvrira
le texte/les specs ; **les photos restent fournies par glisser-déposer** dans l'admin (exigence déjà prévue).

---

## 4. Architecture cible (4 entités, séparées)

| Entité | Rôle | Stockage proposé | Consommée par |
|---|---|---|---|
| **PRODUCT** | données d'un produit (identité, catégorie, vente/location, types, photos, accordéon de sections, specs, SEO, variantes) | nouveau `data/products.json` + API `/api/products` (CRUD) — même mécanique que le CMS `/web` (cohérence, admin existe déjà) | WebPage (par slug), AllProductsPage, header |
| **PRODUCT TEMPLATE** | structure de la page produit (l'ordre des sections tel que `WebPage.tsx`) = **le modèle unique** | `WebPage.tsx` (existant), on y injecte `product.slug` au lieu de `product_wp` | routeur `/web` |
| **MEGA MENU** | sections du méga-menu + ordre + produit référencé par `productId`/`slug` (séparé du produit) | `MEGA_COLUMNS` → nouveau `data/mega-menu.json` + API | XerHeader |
| **PRODUCT TECHNICAL DATA** | fiches techniques PDF téléversées + données extraites + matrice specs par produit | uploads + champs specs par produit (ex. `specsData` par produit) | SpecsSection, DatasheetModal |

Règle clé : **le menu référence le produit** (id/slug uniquement) ; supprimer un produit ne casse pas le menu
(item grisé avec statut) ; dupliquer un produit crée un nouvel id/slug/nom.

### 4.1 Schéma PRODUIT (cible, non figé — à valider)

```
id · slug (unique, URL /web/product/[slug]) · name (≤12 car.) · dateCreated/Updated · softDelete
saleMode: vente|location|sur-commande · badge · environment: [interieur, exterieur, semi-exterieur]
formFactor: plat|coube|360|3d (extensible) 
menu: { label, groupFr, groupEn, tag }   ← copie d'affichage, le menu reste séparé
hero: { title, subtitle, primaryCta, secondaryCta, badge, bgColor, image }
overview: { eyebrow, title, description, stats[], video?, moduleImage }
design: { eyebrow, title, cabinetDim, weight, material, configs[], image, blueprint }  
features: { eyebrow, title, stages[] }
specs: { groups[] (clés/labels), models[] (nom + valeurs par clé) }   ← matrice de comparaison
fieldwork: { eyebrow, title, projects[] }
seo: { title, description, keywords }
media: { mainImage, gallery[] }   ← galerie extensible (photos/vidéos/documents)
```

---

## 5. Plan d'implémentation étape par étape (à valider)

Chaque étape = petit lot, vérifié par `tsc --noEmit` et test manuel sur le navigateur. Rien avant validation.

### Phase A — Fondations données (non visuel)
1. Créer `data/products.json` (ex. seed avec PXT Fine repris des 4 sources) + API `/api/products` (GET public, PUT/POST/DELETE admin, même schéma que `/api/site-web/pages`), + un provider `useProducts()` calqué sur `useCms()`.
2. Migrer `MEGA_COLUMNS` → `data/mega-menu.json` + API (menu séparé du produit).
3. Créer le type complet `Product` (schéma §4.1) dans `src/web/types.ts`.

### Phase B — Template dynamique (1 modèle, N produits)
4. Modifier `WebPage` : lire le produit par slug (au lieu de `product_wp` codé en dur) et passer les données aux
   sections en **props** (les sections gardent leurs fallbacks pour ne rien casser hors produit connu).
5. Dynamiser les blocs codés en dur : tags, grille 4 specs, stats, technologies, blueprint, configurations,
   7 features, 2 projets → poussés depuis `product.*` (avec fallback identique à l'affichage actuel).
6. Brancher la matrice specs et la modale Datasheet sur `product.specs`.
7. Routeur `/web` : ajouter la route `/web/product/[slug]` → `WebPage(slug)` ; faire pointer
   `XerHeader.handleProductClick(slug)` vers `/web/product/${slug}` ; AllProductsPage & SearchModal branchés sur `products.json`.
8. Rendu SEO : `metadata` dynamique (title/description) sur la page produit.

### Phase C — Admin Produits du web (`/admin/site-web/produits`)
9. Remplacer le placeholder par le gestionnaire : liste des produits, création (nom ≤12 char, génération de slug + contrôle collision), dupliquer, supprimer (soft delete + confirmation), bouton « voir la page » → `/web/product/[slug]`.
10. Formulaire édition pré-rempli par produit : toutes les sections du schéma + matrice specs (tableau de comparaison éditable) + SEO.
11. Photos : photo principale + galerie — glisser-déposer, aperçu, remplacement, suppression (réutiliser les patterns `handleFileChange`/upload existants).
12. **Import PDF** : mode « IMPORT » calqué sur la boutique — `parseProductPdf` étendu aux champs web (sections 9+) → `applyParsedData` remplit le formulaire ; le PDF devient la fiche technique du produit (téléversée et conservée).

### Phase D — Gestion du méga-menu (`/admin/site-web/menu`)
13. Remplacer le placeholder : sections de menu, création, tri par glisser-déposer (rouéutiliser `SectionDragDropManager`), ordre, affectation d'un produit à une rubrique (listeur des produits existants), produits utilisés grisés/filtrés, état du libellé FR/EN.

### Phase E — Démo & recette
14. Migrer le PXT Fine réel dans `products.json` (valeurs exactes de `/web/pxt-fine`), vérifier que la page,
    le menu, la recherche et le SEO rendent à l'identique (aucune régression).
15. Créer un 2e produit de test depuis un PDF pour valider la boucle complète (import → préremplissage → publication → URL stable).

---

## 6. Risques & décisions à noter

- **Régression visuelle** : le rendu actuel dépend de contenus codés en dur ; on conserve les MÊMES valeurs
  en fallback par défaut → zéro changement visible sans données produit.
- **Deux parsers/chemins d'import** : on n'étend PAS le parser boutique existant ; on crée un parser web
  séparé mais réutilisant `extractTextFromPdf` et les mêmes conventions de sections numérotées + ` | `.
- **Photos** : non extractibles d'un PDF texte → import manuel obligatoire (par glisser-déposer).
- **Matrice specs** : chaque produit aura sa propre matrice (ex. PXT Fine = 9 modèles IL-FISS-IRW…).
- **Collision de slug** : contrôle à la création et au rename (refus + suggestion).
- **Taille du ProductManagementClient** (~8 000 lignes) : ne pas y toucher ; nouvelle UI dédiée.
- **Persistance** : on privilégie JSON + API (compatible avec le CMS `/web` et `useCms`), plutôt que Firestore
  (utilisé par la boutique) — à trancher avec vous à la Phase A.
- **Accents** : garder le format sans accents normés dans les mots-clés reconnus (le parser gère intérieur/interieur, extérieur/exterieur).