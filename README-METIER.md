# 📘 README — Système de Gestion d'Estimations & Configuration Produits LED

> **Document de référence métier pour IA**  
> Ce document contient toutes les règles métier, workflows et logique fonctionnelle du système.  
> Toute modification du code doit respecter ces règles.

---

## 🧭 1. Vue Globale de l'Application

L'application permet à un client de :
- Configurer un écran LED (achat ou location)
- Obtenir une estimation automatique (PDF)
- Envoyer une demande à l'entreprise
- Être traité côté administration (admin, fournisseur, commercial)

### Stack Technique
- **Frontend**: React, Tailwind CSS, Framer Motion, Lucide React
- **Backend**: Next.js (App Router)
- **Base de données**: Supabase (PostgreSQL)
- **Authentification**: Supabase Auth

---

## 👤 2. Rôles Utilisateurs

### 2.1 Liste des Rôles

| Rôle | Description | Accès |
|------|-------------|-------|
| `admin` | Administrateur système | Accès complet |
| `commercial` | Commercial terrain | Gestion estimations, modification |
| `fournisseur` | Fournisseur produit | Consultations assignées |
| `client` | Client final | Wizard de configuration |

### 2.2 Permissions par Rôle

```typescript
// src/application/admin/types/index.ts

type UserRole = 'admin' | 'commercial' | 'fournisseur' | 'client';

interface RolePermissions {
  admin: {
    canViewAllEstimations: true,
    canModifyAll: true,
    canDeletePermanent: true,
    canManageUsers: true,
    canManageProducts: true,
    canViewSuppliers: true,
  },
  commercial: {
    canViewAllEstimations: true,
    canModifyAll: false,      // Non définitif
    canDeletePermanent: false,
    canManageUsers: false,
    canManageProducts: false,
    canViewSuppliers: false,
  },
  fournisseur: {
    canViewAssignedEstimations: true,
    canManageDelivery: true,
    canDeletePermanent: false,
    canViewOtherStatuses: false,
    canAccessAdmin: false,
  },
  client: {
    canCreateEstimation: true,
    canViewOwnEstimation: true,
    canEditIfPending: true,
  },
}
```

### 2.3 Statuts Utilisateur

- `pending` → En attente de validation
- `approved` → Accès autorisé
- `rejected` → Accès refusé
- `suspended` → Compte suspendu

---

## 🧾 3. Workflow des Estimations (CRITIQUE MÉTIER)

### 3.1 Statuts d'Estimation

```typescript
// Ordre chronologique strict du workflow
type EstimationStatus = 
  | 'pending'      // 1. En attente
  | 'processed'   // 2. Traité (fournisseur assigné)
  | 'supplier'    // 3. Chez fournisseur
  | 'delivery'    // 4. En livraison
  | 'archived'    // 5. Archivé (terminé)
  | 'bin'         // 6. Corbeille (supprimé)
  | 'returned';   // 7. Retourné (refusé)
```

### 3.2 Diagramme de Transition

```
[pending] ──(traiter)──> [processed]
    │                         │
    │                         ▼
    │                   [supplier] ──(livrer)──> [delivery]
    │                                        │
    │                                        ▼
    │                                     [archived]
    │
    ├──(supprimer)──> [bin] ──(suppression définitive)──> [⊗]
    │
    └──(retourner)──> [returned]
```

### 3.3 Règles Métier Strictes

> **⚠️ RÈGLE #1** : Impossible de passer à `processed` sans fournisseur assigné
> ```typescript
> if (newStatus === 'processed' && !estimation.supplierId) {
>   throw new Error('Un fournisseur doit être assigné avant traitement');
> }
> ```

> **⚠️ RÈGLE #2** : Impossible de passer à `delivery` sans :
> - `trackingNumber` (numéro de suivi)
> - `deliveryDate` (date de livraison)
> ```typescript
> if (newStatus === 'delivery') {
>   if (!estimation.trackingNumber || !estimation.deliveryDate) {
>     throw new Error('Numéro de suivi et date de livraison requis');
>   }
> }
> ```

> **⚠️ RÈGLE #3** : Seul le rôle `admin` peut supprimer définitivement depuis `bin`
> ```typescript
> if (role !== 'admin' && estimation.status === 'bin') {
>   throw new Error('Seul admin peut supprimer définitivement');
> }
> ```

> **⚠️ RÈGLE #4** : Pas de retour automatique vers `pending` depuis `delivery`
> ```typescript
> // Transition valide uniquement : pending → processed → supplier → delivery → archived
> // Transitions invalides bloquées par le système
> ```

### 3.4 Actions par Statut

| Statut | Actions Autorisées |
|--------|-------------------|
| `pending` | modifier, traiter, supprimer → bin |
| `processed` | transférer vers supplier |
| `supplier` | suivre, livrer, retourner (avec cause) |
| `delivery` | archiver (si données livraison présentes) |
| `bin` | restaurer (admin only), suppression définitive (admin only) |
| `returned` | traiter à nouveau, archiver |
| `archived` | consulter uniquement |

---

## 🧠 4. Système Frontend (Wizard Client)

### 4.1 Étapes du Wizard

```typescript
// Étapes dans l'ordre strict
type WizardStep = 
  | 'mode'          // Vente ou Location
  | 'environment'  // Intérieur/Semi-extérieur/Extérieur
  | 'distance'      // Distance de visionnage
  | 'pitch'        // Pixel Pitch
  | 'dimensions'   // Largeur x Hauteur
  | 'photo'       // Photo du lieu
  | 'dates'        // (Location uniquement) Date début/fin
  | 'summary'      // Résumé technique
  | 'product'      // Produit recommandé
  | 'delivery'     // Région de livraison
  | 'installation' // Type d'installation
  | 'final'        // Estimation finale
  | 'client'       // Infos client
  | 'validation';  // Téléchargement ou email
```

### 4.2 Logique Conditionnelle

```typescript
// Étape 7: Dates (UNIQUEMENT pour location)
const showDatesStep = wizardData.mode === 'location';

// Étape 12: Installation (calcul automatique)
const installationRequired = wizardData.environment === 'exterior' || 
                            wizardData.dimensions.surface > 10;
```

### 4.3 Calculs Automatiques

```typescript
// Résumé technique (étape 8)
interface TechnicalSummary {
  dimensions: { width: number; height: number; };
  surface: number;           // width * height
  resolution: string;       // ex: 1920x1080
  power: number;           // Watts
  ledModules: number;       // nombre de modules
  breakerRecommended: number; // disjoncteur (A)
  environment: 'interior' | 'exterior' | 'semi-exterior';
  pixelPitch: string;      // ex: P1.9
  viewingDistance: string; // ex: 2-5m
}
```

---

## 🏭 5. Système Produits

### 5.1 Structure Produit

```typescript
interface Product {
  id: string;
  name: string;
  
  // Mode d'utilisation
  mode: 'vente' | 'location' | 'both';
  
  // Environnement
  environment: 'interior' | 'exterior' | 'semi-exterior' | 'all';
  
  // Contraintes techniques
  constraints: {
    minDistance: number;  // distance min visualización
    maxDistance: number;  // distance max visualización
    maxSize: number;       // taille max (m²)
  };
  
  // Spécifications techniques
  specs: {
    pixelPitch: string;      // ex: P1.9
    viewingDistance: string;  // ex: 2-5m
    resolution: string;
    brightness: number;      // nits
  };
  
  // Médias
  media: {
    images: string[];
    videoUrl?: string;
    datasheetUrl?: string;
  };
  
  // Tarification
  pricing: {
    salePrice: number;
    rentalPricePerDay?: number;
  };
  
  // Statut
  isActive: boolean;
}
```

### 5.2 Matching Produit

```typescript
// Logique de recommandation produit
function matchProducts(config: TechnicalSummary, products: Product[]): {
  main: Product;
  alternatives: Product[];
} {
  return products
    .filter(p => 
      p.isActive &&
      p.environment === config.environment || p.environment === 'all' &&
      parseInt(p.specs.pixelPitch) >= parseInt(config.pixelPitch) &&
      p.constraints.maxSize >= config.surface
    )
    .sort((a, b) => a.pricing.salePrice - b.pricing.salePrice);
}
```

### 5.3 Actions Admin (Produits)

- ✅ Modifier
- ✅ Dupliquer
- ✅ Supprimer (soft delete)
- ✅ Multi-sélection
- ✅ Organisation drag & drop

---

## 📊 6. Logique de Calcul

### 6.1 Tarifs

```typescript
interface CalculationParams {
  products: Product[];
  deliveryCity: string;
  deliveryCost: number;
  installationCost: number;
  taxRate: number;        // ex: 20 pour TVA 20%
  productDiscount: number;
  globalDiscount: number;
}

interface CalculationResult {
  productsSubtotal: number;
  productsTotal: number;
  deliveryTotal: number;
  laborTotal: number;
  subtotalHT: number;
  tva: number;
  totalTTC: number;
  finalTotal: number;
}

// Formule de calcul
const calculateTotals = (params: CalculationParams): CalculationResult => {
  const { products, deliveryCost, laborCost, taxRate, productDiscount, globalDiscount } = params;
  
  // Sous-total produits
  const productsSubtotal = products.reduce((sum, p) => 
    sum + (p.quantity * p.unitPrice), 0);
  
  // Remise produit individuelle
  const productsDiscounted = products.reduce((sum, p) => 
    sum + (p.quantity * p.unitPrice) * (1 - p.discount / 100), 0);
  
  const productsTotal = productsDiscounted * (1 - productDiscount / 100);
  
  // Livraison
  const deliveryTotal = deliveryCost * (1 - params.deliveryDiscount / 100);
  
  // Installation
  const laborTotal = laborCost * (1 - params.laborDiscount / 100);
  
  // Sous-total HT
  const subtotalHT = productsTotal + deliveryTotal + laborTotal;
  
  // TVA
  const tva = subtotalHT * (taxRate / 100);
  
  // Total TTC
  const totalTTC = subtotalHT + tva;
  
  // Remise globale
  const finalTotal = totalTTC * (1 - globalDiscount / 100);
  
  return { productsSubtotal, productsTotal, deliveryTotal, laborTotal, subtotalHT, tva, totalTTC, finalTotal };
};
```

---

## ⚠️ 7. Points Critiques à Respecter

### 7.1 Interdictions absolues

| Règle | Condition | Action |
|-------|-----------|--------|
| Bypass fournisseur | `status === 'processed'` sans `supplierId` | Blocage système |
| Bypass livraison | `status === 'delivery'` sans tracking/date | Blocage système |
| Suppression permanente | Rôle ≠ `admin` et `status === 'bin'` | Blocage système |
| Retour auto | any → `pending` depuis `delivery` | Blocage système |

### 7.2 Validation Frontend

```typescript
// Utiliser ces fonctions de validation avant toute transition de statut
const canTransitionTo = (
  currentStatus: EstimationStatus,
  targetStatus: EstimationStatus,
  estimation: Estimation,
  userRole: UserRole
): boolean => {
  // Règle #1
  if (targetStatus === 'processed' && !estimation.supplierId) return false;
  
  // Règle #2
  if (targetStatus === 'delivery' && (!estimation.trackingNumber || !estimation.deliveryDate)) return false;
  
  // Règle #3
  if (currentStatus === 'bin' && targetStatus === 'delete_permanent' && userRole !== 'admin') return false;
  
  // Règle #4
  if (currentStatus === 'delivery' && targetStatus === 'pending') return false;
  
  return true;
};
```

---

## 🔧 8. Structure des Données

### 8.1 Estimation

```typescript
interface Estimation {
  id: string;
  status: EstimationStatus;
  
  // Client
  client: {
    name: string;
    email: string;
    phone: string;
    company?: string;
    address?: string;
    notes?: string;
    sitePhoto?: string;
  };
  
  // Produits
  products: Product[];
  
  // Fournisseur
  supplierId?: string;
  supplierNotes?: string;
  
  // Logistique
  deliveryCity?: string;
  deliveryCost?: number;
  deliveryDiscount?: number;
  trackingNumber?: string;
  deliveryDate?: Date;
  
  // Installation
  laborCost?: number;
  laborDiscount?: number;
  
  // Tarifs
  productDiscount?: number;
  taxRate?: number;
  globalDiscount?: number;
  
  // Historique
  history: HistoryEntry[];
  
  // Métadonnées
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}
```

### 8.2 HistoryEntry

```typescript
interface HistoryEntry {
  id: string;
  timestamp: string;
  action: string;
  user: string;
  userId: string;
  type: 'global' | 'local';
}
```

---

## 📁 9. Emplacement des Fichiers Clés

```
src/
├── application/
│   ├── admin/
│   │   ├── estimations/
│   │   │   └── components/
│   │   │     └── DetailsInterface.tsx    # Interface dessin estimation
│   │   ├── products/
│   │   │   └── components/
│   │   │     └── ProductForm.tsx         # Gestion produits
│   │   └── types/
│   │     └── index.ts                    # Types partagés
│   └── client/
│       └── wizard/
│           └── components/                # Wizard de configuration
├── app/
│   ├── globals.css                      # Styles globaux
│   └── admin/
│       └── quote-requests/               # Pages admin
└── lib/
    └── supabase.ts                      # Client Supabase
```

---

## 🎯 10. Résumé pour IA

> **Instructions pour toute IA travaillant sur ce projet :**
>
> 1. **NE JAMAIS** modifier les transitions de statut sans validates les règles métier (#1-#4)
> 2. **TOUJOURS** vérifier le rôle utilisateur avant toute action sécurisée
> 3. **NE JAMAIS** autoriser `processed` sans `supplierId`
> 4. **NE JAMAIS** autoriser `delivery` sans `trackingNumber` + `deliveryDate`
> 5. Utiliser les types définis dans `src/application/admin/types/index.ts`
> 6. Les calculs financiers doivent utiliser la formule en section 6.1
> 7. Toute modification du wizard doit respecter l'ordre des étapes (section 4.1)

---

## 💬 8. Module Messagerie (Chat Pro)

### 8.1 Objectif
Permettre la communication entre Administrateurs, Commerciaux et Fournisseurs en respectant des règles strictes d'isolation, de visibilité et de modération.

### 8.2 Rôles (hérités du système global)
- `admin` → accès total
- `commercial` → accès standard interne
- `prestataire` / `fournisseur` → accès limité

### 8.3 Système de visibilité (CRITIQUE - 4 couches)

#### A. Isolation globale (isIsolated)
```typescript
interface User {
  isIsolated: boolean;
}
```
**Règles :**
- Si `user.isIsolated === true` :
  - ✅ L'utilisateur voit uniquement les admins
  - ❌ Ne voit aucun autre utilisateur
  - Les autres utilisateurs ne voient pas cet utilisateur (sauf admin)

#### B. Isolation par paire (restrictedContacts)
```typescript
interface User {
  restrictedContacts: string[]; // UIDs
}
```
**Règles :**
- Si A contient B dans `restrictedContacts` → A et B ne se voient plus mutuellement
- Isolation bilatérale automatique
- Invisible dans l'UI (barrière silencieuse)

#### C. Visibilité prestataire (adminOnly)
```typescript
interface User {
  role: 'prestataire';
  adminOnly: boolean;
}
```
**Règles :**
- Visible uniquement par admin
- Invisible pour commerciaux

#### D. Auto-filtrage
- Un utilisateur ne se voit jamais lui-même

**Priorité des règles (ordonnancement strict) :**
1. Isolation globale
2. Isolation par paire
3. AdminOnly
4. Auto-filtrage

> ⚠️ Une seule condition bloquante = utilisateur invisible

### 8.4 Blocage utilisateur (blockedUsers)
```typescript
interface User {
  blockedUsers: string[]; // UIDs
}
```
**Effets :**
- ❌ Communication impossible
- UI : nom en rouge/gris, messages bloqués

### 8.5 Statuts utilisateur
```typescript
interface UserStatus {
  isAnnoying: boolean;      // Ne pas déranger - badge rouge
  isInDiscussion: boolean;   // En conversation - badge bleu
  canChat: boolean;          // Si false : lecture seule, envoi bloqué
}
```

### 8.6 Système d'exclusion avancé
```typescript
interface ExclusionMetadata {
  [targetUid: string]: {
    reason: string;      // Texte libre (ex: "Conflit d'intérêt")
    date: string;
    isPublic: boolean;  // true = visible par admins, false = privé
  };
}
```
**Règles :**
- Gère les conflits
- Modifiable uniquement par admin
- Persistant

### 8.7 Actions administrateur
- Isoler un utilisateur
- Ajouter restriction par paire
- Modifier reason
- Gérer visibilité prestataire
- Bloquer / débloquer
- Activer / désactiver chat

### 8.8 Standards UI (OBLIGATOIRES)
```css
/* Boutons */
.bouton-chat {
  height: 44px;   /* h-11 */
  width: 44px;    /* w-11 */
}

/* Couleurs */
--chat-primary: #15bcd7;    /* Cyan - Primaire */
--chat-bg: #000000;         /* Fond */
--chat-error: #a51a1a;      /* Erreur */
--chat-action: #0078ff;     /* Action */

/* Alignement */
.boutons-chat {
  /* Envoi, recherche, menu */
  align-items: flex-end;
  justify-content: flex-end;
}
```

### 8.9 Règles critiques à NE JAMAIS casser
1. Isolation globale prioritaire sur tout
2. Restriction par paire invisible mais active
3. Admin voit toujours tout
4. Prestataire adminOnly : jamais visible par commercial
5. Blocage = coupure totale communication

### 8.10 Intégration avec le reste
- Dépend de : système utilisateurs, rôles, estimations, notifications

---

*Document généré pour référence métier. Toute modification du code doit respecter ces règles.*