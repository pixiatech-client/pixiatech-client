# Rendre "livraison + installation + techniciens" cohérents de la sélection utilisateur au prix final, dans tous les flux

## Contexte (vérifié par audit côté code, févr. 2026)

La refonte tarifaire (commit `4651764`) a créé un moteur partagé `computeDeliveryCost` / `computeLaborCost` — source de vérité pour les coûts. L'audit fonctionnel transversal qui a suivi a montré que le moteur est correctement utilisé partout pour le *coût*, mais que la **composition du prix final et sa persistance divergent selon le flux** :

| Flux | includeDelivery | deliveryCost | totalQuote |
|---|---|---|---|
| SignatureFlow | **`true` hardcodé** (`SignatureFlow.tsx:2107,2767`) | calculé réel | `subtotal + delivery + install` (601) |
| WizardBotFlow | **`false` hardcodé** (`WizardBotFlow.tsx:753,1976`) | **`0` à jamais** (754,1966) | `lineTotal + install` seulement (198) |
| Boutique / paiement | via API | calcul zone/ville réel | `items + TVA + delivery` |

Conséquences vérifiées :
- Deux devis identiques persistés via `createQuoteWithContract` (stocke le payload client **tel quel**, `quote-actions.ts:566`) ont des coûts de livraison **opposés**.
- En configurateur/Signature, les règles zone/ville `deliveryFeeRules` ne s'appliquent **jamais** : le sélecteur passe `zoneId: null` (`SignatureFlow.tsx:591`) et `lib/cities.ts` n'a pas de `zoneId`, alors que la boutique les résout (`app/api/boutique/delivery-cost/route.ts:27-33`). Même CP ≠ même prix selon le point d'entrée.
- Le **contrat signé** n'affiche que `pack.price` = sous-total produits (`ContractDocument.tsx` + `activePack` construit sur `totalSubtotalProducts`, `SignatureFlow.tsx:667-680`), alors que devis/récap incluent livraison+installation.
- **QuickRent** (`app/boutique/louer/[id]/page.tsx`) écrit `currentStep:5`+`isSignatureFlowActive:true` mais `QuoteBuilder` reset au step 1 au retour (`quote-builder.tsx:263-266`) → le flux ne débouche jamais sur la signature.
- Le **serveur fait confiance aux montants du navigateur** : `create-order` accepte l'`amount` client tel quel (`app/api/paypal/create-order/route.ts:6-7`), `capture-order` stocke `amountPaid = productPrice × qty` **sans TVA ni livraison** (`capture-order/route.ts:151,192`) alors que PayPal a encaissé items + TVA + livraison.
- UI de paiement : `deliveryCost === 0` affiché **« Offerte »** même en état `unconfigured` (`app/boutique/paiement/page.tsx:1385-1396`) alors que l'API renvoie `label`/`isFree` pour distinguer ces cas.
- TVA : `taxRate: 19` (configurateurs, `public-actions.ts:108`) vs `vatRate: 20` (boutique, `lib/checkout-calculations.ts:36`).

**Règle d'or — ne pas corriger les symptômes flux par flux.** On crée une seule source de vérité métier pour le calcul ET la persistance du prix final, puis tous les flux l'utilisent.

## Architecture cible

```
                 ┌─────────────────────┐
                 │   Configuration     │
                 │ produits / options  │
                 └──────────┬──────────┘
                            │
                 ┌──────────▼──────────┐
                 │   PRICE ENGINE      │
                 │  produits/m²        │
                 │  livraison (zone)   │
                 │  installation       │
                 │  techniciens        │
                 │  TVA                │
                 │  dépôt/échéancier   │
                 └──────────┬──────────┘
                            │
                 ┌──────────▼──────────┐
                 │   PRICE SNAPSHOT    │
                 │ montant immuable    │
                 └──────────┬──────────┘
        ┌─────────┬─────────┼─────────┬─────────┐
        ▼         ▼         ▼         ▼         ▼
 Configurateur Signature  Bot    QuickRent  Boutique
        └─────────┴─────────┴─────────┴─────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
     Contrat             Paiement          Quote PDF
```

Point clé : **Price Snapshot** immuable — une fois le devis validé, le détail calculé (`products`, `delivery`, `installation`, `tax`, `total`, `deposit`, `paymentSchedule`, `destination`) est conservé en l'état. Contrat, paiement et commandes ne recalculent **pas** leur propre version du prix.

## Structure métier unique (à créer, ex. `src/lib/price-snapshot.ts`)

```ts
export interface PriceSnapshot {
  destination: {
    cityId: string | null;
    zoneId: string | null;
    postcode: string;
    cityName: string;
    resolved: boolean;            // true si ville trouvée dans les référentiels
    fallbackUsed?: boolean;       // true si recours au fallback (ex. Paris)
  };
  productsSubtotal: number;       // HT (produits × quantité)
  deliveryCost: number;
  deliveryReason: 'unconfigured' | 'total-free' | 'threshold-free' | 'rule' | 'default';
  deliveryLabel: string;
  includeDelivery: boolean;       // choix métier utilisateur, jamais hardcodé
  installationCost: number;
  techniciansRequired: number;
  includeInstallation: boolean;   // choix métier utilisateur
  taxRate: number;                // UNE source (voir P1.5)
  vat: number;
  total: number;                  // total TTC final
  deposit: number;                // siège d'après règle métier (P1.1)
  paymentSchedule: { label: string; amount: number }[];
  currency: 'EUR';
}
```

Tous les consommateurs — QuotePDF, récap, contrat, `createQuoteWithContract`, commandes (sale/rental), API PayPal, `processQuoteSnapshot` — lisent **cette même structure**, jamais des champs épars.

---

## 🔴 P0 — À corriger avant toute livraison

### P0.1 — Résolution centralisée ville/CP → zone → règle → tarif

Créer `src/lib/delivery-resolver.ts` (fonction pure, sans Firestore) :

```
resolveDestination({ cityId, postcode, cityName }, référentielsCities, référentielZones?): Destination
```

- Enrichit `lib/cities.ts` avec des `zoneId` réels cohérents avec le référentiel Firestore `cities` (zones existantes `BDmrBX1bvYiEzVw5TrzP`, `quYmSJVKBKWVg4WEhGdL`, etc.).
- Signature et configurateur = mêmes zones/IDs que la boutique (référentiel unique).
- Règles :
  - postcode/city présents dans le référentiel → `resolved: true`, zone résolue ;
  - introuvable → `resolved: false`, `fallbackUsed` selon politique (supprimer le fallback « resetToParis » forcé de `SignatureFlow.tsx:1333-1347` ou le rendre explicite et signalé à l'utilisateur) ;
  - `computeDeliveryCost(deliverySettings, { subtotal, zoneId: zone, cityId })` — **le même appel qu'en boutique** (`delivery-cost/route.ts:44`).

Critère d'acceptation : pour le même panier et la même destination, **zone/ville/CP** donnent le même `deliveryCost` dans les 5 flux — la règle zone/ville s'applique aussi en configurateur/Signature/Bot (plus seulement en boutique).

### P0.2 — Choix utilisateur explicite de livraison + installation (fini les flags hardcodés)

- Supprimer `includeDelivery: true` (`SignatureFlow.tsx:2107,2767`) et `includeDelivery: false` / `deliveryCost: 0` (`WizardBotFlow.tsx:753-754,1966,1976`).
- Dans SignatureFlow, ajouter un toggle « Livraison » explicite (comme la carte Installation 1629-1725), défaut : configurable via settings (défaut recommandé `false` pour respecter « aucun coût imposé », ou hérité de `isDeliveryStepEnabled`).
- Dans WizardBotFlow, ajouter une question « inclure la livraison ? » à l'étape livraison du chat (STEP.INSTALLATION existe déjà pour l'installation) — ou au minimum un choix par défaut explicite, jamais `0` muet.
- Le choix de l'utilisateur est stocké dans `includeDelivery`/`includeInstallation` du **PriceSnapshot**.
- `quote-persistence.ts` : mettre les mêmes defaults que les `useState` (`includeDelivery/Installation: false`), aligner avec `quote-builder.tsx:153,166`.

Critère d'acceptation : rien ne décide `includeDelivery`/`includeInstallation` en dur dans le code ; les deux viennent de l'état utilisateur avec des défauts explicites et cohérents entre tous les composants et la persistance.

### P0.3 — Sécurité du prix côté serveur (PAY/MANDATORY)

**Le montant du navigateur n'est JAMAIS considéré fiable.**

1. `app/api/paypal/create-order/route.ts` :
   - Ne plus accepter `{ amount }` seul. Accepter un `checkoutToken`/`snapshotId` OU l'ensemble des entrées (`delivery`, `items`, `subtotal`, `destination`, `includeDelivery/Installation`, `customerType`).
   - Server-side : recomputer `calculateCheckout` + `computeDeliveryCost` + `computeLaborCost` (fonctions purs importées) et **comparer** le `total` recalculé au `total` reçu (tolérance ≤ 0,01 €). Rejeter (400) si écart.
   - `createPayPalOrder(amount)` reçoit le **total validé côté serveur**, jamais un montant client non vérifié.
2. `app/api/paypal/capture-order/route.ts` :
   - Revalider le même calcul au moment du capture (l'`orderId` PayPal ayant encapsulé un montant fixé).
   - `amountPaid` = **total TTC validé** (items + TVA + livraison + installation), réparti : stocker `subtotal`, `vat`, `deliveryCost`, `installationCost`, `total` dans `sale_orders` et `rental_orders` (lignes 151-152 et 192-194 à remplacer).
   - Conserver le PriceSnapshot persisté dans la commande (`priceSnapshot`).
3. Optionnel mais recommandé : signer le snapshot avec un HMAC court (`auth/verified amount`) côté serveur lors de la création, pour que le capture puisse vérifier sans re-résolution.

Critère d'acceptation : modifier le montant dans la requête du navigateur → erreur côté serveur, pas de création d'ordre PayPal ; les commandes stockent le total revalidé, pas le montant client.

### P0.4 — Contrat sur le même total que le devis validé

- `ContractDocument.tsx` et `activePack` (`SignatureFlow.tsx:667-680`, `WizardBotFlow.tsx:201-212`) doivent consommer un **PriceSnapshot** : le montant du contrat = `snapshot.total` (+ `snapshot.deposit` si location).
- Plus de reconstruction `pack.price = Math.round(totalSubtotalProducts)` : le contrat reproduit le détail produits + livraison + installation + TVA du snapshot.
- `quote-pdf.tsx`, `ContractDocument`, récap SignatureFlow (step 2), `createQuoteWithContract` : **tous** lisent la même structure.

Critère d'acceptation : pour un même devis validé, devis PDF, récap, contrat et montant persisté affichent exactement le même `total`, `total` incluant livraison/installation le cas échéant.

### P0.5 — QuickRent = flux officiel (réparer la chaîne)

- `app/boutique/louer/[id]/page.tsx` :
  - Construire un vrai PriceSnapshot au lieu de zéros faux (même si livraison/install = 0 par défaut, c'est calculé via le moteur, pas posé).
  - Ne plus dépendre du hack `currentStep:5` + `isSignatureFlowActive:true` qui est écrasé par `quote-builder.tsx:263-266`.
  - Alternatives propres : (a) un état de reprise explicite dans le snapshot/context consommé par `QuoteBuilder` à son montage (ne pas reset si un `quickRentSnapshot` non consommé existe), ou (b) généraliser le mécanisme de reprise existant pour que SignatureFlow puisse s'ouvrir direct avec ce snapshot.
  - Supprimer le reset inconditionnel de l'état au retour (`quote-builder.tsx:263-266`) si un snapshot en attente est présent.
- Gérer le `wizard-reset` de `BoutiqueHeader` (`quote-builder.tsx:468-474`) pour qu'il ne détruise pas l'état de reprise QuickRent.

Critère d'acceptation : depuis `/boutique/louer/[id]`, l'utilisateur arrive dans SignatureFlow avec le bon produit pré-chargé et un total cohérent (pas un retour à l'étape 1 du flux standard).

---

## 🟠 P1 — Nettoyage métier (après P0)

### P1.1 — Dépôt 50 % → moteur/métier
`SignatureFlow.tsx:672` et `WizardBotFlow.tsx:206` (`Math.round(subtotal * 0.5)`) → fonction partagée dans `pricing-engine` (ou settings), ex. `computeDeposit(priceSnapshot, modeVente/vente)`.

### P1.2 — Split 60/40 → métier
`SignatureFlow.tsx:1976/1986` (`totalAmount * 0.6`, `* 0.4`) → partie de `paymentSchedule` du PriceSnapshot (configurable via settings si souhaité, sinon constantes centralisées uniques, pas dupliquées).

### P1.3 — Supprimer le fallback commercial hardcodé 2000 €/m²
`App.tsx:987` (fallback `DEFAULT_SALE_PRICE_PER_SQM`) → ne jamais afficher/stocké un tarif de secours : si produit sans prix, afficher « Prix sur devis » et bloquer la soumission (ou laisser le prix manquant explicite), aucune valeur inventée en base.

### P1.4 — Date du contrat dynamique
`ContractDocument.tsx:45` (« 29 mai 2026 ») → date du jour / date de signature.

### P1.5 — Une seule source de TVA
`taxRate: 19` (`public-actions.ts:108`, `SignatureFlow.tsx:640`) vs `vatRate: 20` (`checkout-calculations.ts:36`) → une constante/défaut unique dans `pricing-engine` (ou settings), tous les calculs et affichages lisent la même source ; `calculateCheckout` prend le taux comme entrée par défaut de cette source.

### P1.6 — cache incohérent
`clearSettingsCache` systématiquement appelé dans `updateDeliverySettings` / `updateLaborSettings` (`admin/actions.ts:3666,3718`), pas seulement `revalidatePath`.

### P1.7 — supprimer/isoler le mock
`DetailsInterface.tsx:110,112` (`deliveryCost: 500`, `laborCost: 1200`, `unitPrice: 1500`) → isoler dans un dossier `dev/` ou supprimer (non routé en prod, vérifié).

### P1.8 — supprimer le code mort
`src/app/quote-form.tsx` (`QuoteForm`) : non importé nulle part → supprimer (après confirmation d'absence de route de référence).

---

## 🟡 P2 — UX et architecture

### P2.1 — Stepper honnête
`quote-builder.tsx:211-212` annonce « Livraison » et « Installation », mais `renderStepContent` ne rend que le step 1 (680-711) et `handleNext` saute 1→5 (505-554). → Réduire le stepper aux étapes réellement rendues, ou implémenter les étapes manquantes via le moteur.

### P2.2 — Chemins morts
Supprimer/neutraliser : `handleLocationChange` jamais appelé (`quote-builder.tsx:597-602`), `isDeliveryCostFinal` inutilisé (157), étapes 2/3/4 non rendues.

### P2.3 — Documentation des états livraison
Documenter dans le code (commentaires/types) les états `unconfigured` / `total-free` / `threshold-free` / `rule` / `default` de `deliveryReason`, et leur affichage UI correct (ne jamais afficher « Offerte » si `unconfigured`). Aligner l'UI paiement (`paiement/page.tsx:1385-1396`) pour consommer `label`/`isFree` de l'API au lieu d'un test `deliveryCost === 0`.

### P2.4 — Tests de non-régression (matriciels)

Ajouter une suite de tests (Vitest) sur le moteur et les snapshots :

| Entrée | Destination | Livraison | Installation | Total |
|---|---|---|---|---|
| Configurateur | Zone A | X | 0 | Y |
| Signature | Zone A | X | 0 | Y |
| Bot | Zone A | X | 0 | Y |
| QuickRent | Zone A | X | 0 | Y |
| Boutique | Zone A | X | 0 | Y |

→ Pour le MÊME panier et la MÊME destination, les 5 flux produisent le MÊME résultat.

Matrice étendue : installation activée · techniciens activés · livraison offerte par seuil · livraison non configurée (`unconfigured`) · ville sans règle · plusieurs produits · location · vente · TVA (particulier / entreprise UE) · dépôt.

Tests unitaires ciblés :
- `resolveDeliveryCost`: `unconfigured` (0, pas « offerte »), `threshold-free`, `total-free`, `rule` zone/ville, `default`.
- `computeLaborCost`: règles minSqM croissantes, `totalArea<=0`, rules vides.
- `computeDeposit` / `paymentSchedule`: vente 60/40, location 50 %.
- `calculateCheckout` serveur : rejet si total client ≠ total revalidé.
- `ContractDocument` : montants = snapshot (pas de reconstruction).
- `quote-persistence` : defaults alignés avec `useState`.

---

## Ordre d'exécution recommandé

1. **P0.1** destination/zone centralisée (+ enrichir `lib/cities.ts`) — lib pure, testable.
2. **P0.2** choix utilisateur livraison/installation dans Signature + Bot (suppression des hardcodes). 
3. **P0.4** PriceSnapshot + branchement contract/PDF/récap/persist.
4. **P0.3** sécurisation serveur (create-order, capture-order, commandes).
5. **P0.5** QuickRent sur le nouveau mécanisme de reprise.
6. P1 (métier), puis P2 (UX/tests).

Chaque P0 doit être validé par typecheck (`npx tsc --noEmit`), les tests unitaires de la matrice, et idéalement un parcours manuel des 5 flux à la même destination.

## Fichiers principaux concernés (référentiel de travail)

- `src/lib/pricing-engine.ts` (ne pas casser : ajouter `computeDeposit`, `taxRate` source), nouveau `src/lib/price-snapshot.ts`, nouveau `src/lib/delivery-resolver.ts`, `src/lib/checkout-calculations.ts`, `src/lib/cities.ts`, `src/lib/quote-persistence.ts`
- `src/components/SignatureFlow.tsx`, `src/components/chat/WizardBotFlow.tsx`, `src/components/ContractDocument.tsx`, `src/components/quote-builder.tsx`, `src/components/success-view.tsx`
- `src/app/api/paypal/create-order/route.ts`, `src/app/api/paypal/capture-order/route.ts`, `src/app/api/boutique/delivery-cost/route.ts`
- `src/app/boutique/louer/[id]/page.tsx`, `src/app/boutique/paiement/page.tsx`
- `src/app/actions/quote-actions.ts`, `src/app/actions/public-actions.ts`, `src/app/admin/actions.ts`
- `src/app/admin/quote-pdf.tsx`, `src/app/admin/quote-requests/_components/estimation/**`, `src/app/admin/quotes/[id]/_components/admin-quote-details.tsx`
- Suppressions : `src/app/quote-form.tsx`, `DetailsInterface.tsx` (ou isolation dev)

## Contraintes fermes

- Ne JAMAIS modifier la logique de coût de `computeDeliveryCost` / `computeLaborCost` (moteur validé et testé). On peut l'ÉTENDRE (destination, dépôt, TVA, snapshot) mais pas changer ses résultats existants.
- Aucune nouvelle valeur tarifaire hardcodée dans les composants (`includeDelivery`, dépôt, split, TVA, fallback de prix).
- Le serveur est l'autorité sur les montants ; le navigateur ne fournit que les choix (items, destination, options), jamais le montant.
- Tout changement P0 doit passer la matrice de tests des 5 flux et `npx tsc --noEmit`.

---

## Critère d'acceptation global

**Pour le même panier et la même destination (ville/CP/zone), tous les flux — Configurateur, SignatureFlow, WizardBot, QuickRent, Boutique — produisent le même prix final, le même contrat, le même paiement et la même persistance, y compris en présence de règle de livraison, d'installation, de techniciens, de TVA et de dépôt ; et le serveur refuse tout montant divergent de son propre calcul.**