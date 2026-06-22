# Refonte Header Boutique — Style Apple

**Date :** 22 juin 2025
**Statut :** Design validé

## Objectif

Créer un header global pour les pages boutique avec un design minimaliste Apple-like, regroupant tous les boutons de navigation actuellement dupliqués dans chaque page, et ajoutant Connexion / Créer un compte ainsi que le sélecteur de langue.

## Architecture

### Nouveau composant : `src/components/boutique-header.tsx`

Header client-side (`'use client'`) utilisé sur toutes les pages `/boutique/*`.

**Structure (gauche → droite) :**

```
[← Back] [Accueil] [Boutique]  ───  [LOGO PIXIATECH]  ───  [FR/EN] [Connexion | Créer un compte] [🛒 badge]
```

- **Gauche :** Bouton retour `←` (appelle `router.back()`), Accueil (`/`), Boutique (`/boutique`)
- **Centre :** Logo PixiaTech (lien vers `/`)
- **Droite :** Sélecteur de langue (FR/EN toggle), Connexion / Créer un compte, Panier avec badge de quantité

**Styles :**
- Fond blanc/translucide avec `backdrop-blur-xl` (glassmorphism)
- Ombre légère `shadow-sm`
- Hauteur fixe `56px` (h-14)
- Typographie clean, `tracking-tight`
- Aucune bordure dure visible — un `border-b border-gray-100/80` subtil
- Padding horizontal responsive : `px-6 md:px-10 lg:px-14`
- Contenu centré dans un `max-w-7xl mx-auto`

**Fonctionnalités :**

| Élément | Comportement |
|---------|-------------|
| ← Back | `router.back()` — toujours visible, retour sécurisé |
| Accueil | Lien vers `/` |
| Boutique | Lien vers `/boutique` — état actif si on est sur `/boutique` |
| Logo | Lien vers `/` |
| FR/EN | Toggle `locale` via `useI18n()` |
| Connexion | Lien vers `/boutique/mon-compte/connexion` — caché si connecté |
| Créer un compte | Ouvre un formulaire email+nom → POST `/api/boutique/send-magic-link` → caché si connecté |
| Profil (si connecté) | Affiche email tronqué + dropdown avec "Mes commandes" et "Déconnexion" |
| Panier 🛒 | Lien vers `/boutique/panier` avec badge `itemCount` de `useCart()` |

**État connecté vs non connecté :**
- Cookie `client_session` présent et valide → mode connecté (profil, pas de connexion/inscription)
- Pas de cookie → mode non connecté (Connexion + Créer un compte)

### Formulaire "Créer un compte"

Mini formulaire inline ou modal :
- Champ **Nom** (displayName)
- Champ **Email**
- Bouton "Créer mon compte"
- Appelle `POST /api/boutique/create-account` (nouvel endpoint) qui :
  1. Upsert le client via `upsertCustomer(email, displayName)`
  2. Envoie un magic link via `createMagicLink` + SMTP (comme le login)
  3. Retourne `{ message: "..." }`

**Nouvel API :** `src/app/api/boutique/create-account/route.ts`

### Pages modifiées

**`src/components/layout-provider.tsx` :**
- Remplacer `<Header>` par `<BoutiqueHeader>` sur les pages boutique
- Garder l'ancien `<Header>` pour les pages non-admin, non-boutique

**`src/app/boutique/page.tsx` :**
- Supprimer le `<header>` inline (lignes ~225-257)

**`src/app/boutique/panier/page.tsx` :**
- Supprimer le `<header>` inline (lignes ~52-75)

**`src/app/boutique/produit/[id]/page.tsx` :**
- Supprimer le `<header>` inline (lignes ~245-276)
- Ajuster le padding (plus besoin de `pt-[56px]` via layout-provider — le header est déjà fixe)

**`src/app/boutique/paiement/page.tsx` :**
- Supprimer le `<header>` inline (lignes ~263-295)

## Fichiers impactés

| Fichier | Action |
|---------|--------|
| `src/components/boutique-header.tsx` | **Créer** — nouveau header Apple-style |
| `src/components/layout-provider.tsx` | **Modifier** — utiliser `BoutiqueHeader` pour pages boutique |
| `src/app/boutique/page.tsx` | **Modifier** — supprimer nav inline |
| `src/app/boutique/panier/page.tsx` | **Modifier** — supprimer nav inline |
| `src/app/boutique/produit/[id]/page.tsx` | **Modifier** — supprimer nav inline |
| `src/app/boutique/paiement/page.tsx` | **Modifier** — supprimer nav inline |
| `src/app/api/boutique/create-account/route.ts` | **Créer** — endpoint création compte |
| `src/lib/customers.ts` | Déjà existant, utilisé par le nouvel API |

## Ordre d'implémentation

1. Créer `boutique-header.tsx`
2. Créer `create-account` API route
3. Modifier `layout-provider.tsx`
4. Modifier les 4 pages boutique (supprimer nav inline)
5. Ajuster padding/positionnement si nécessaire
