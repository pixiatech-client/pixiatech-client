# Espace Client Boutique — Magic Link Auth

## Objectif

Créer un espace client sans inscription préalable. Après un paiement validé, le client est automatiquement identifié via son email PayPal et peut se connecter via un Magic Link (sans mot de passe).

## Architecture

### Collections Firestore

**`customers/{customerId}`** — auto-généré par Firestore

| Champ | Type | Description |
|-------|------|-------------|
| `email` | string | Email du client (unique, depuis PayPal) |
| `displayName` | string | Nom depuis PayPal |
| `phone` | string | Téléphone |
| `createdAt` | string (ISO) | Date de création |
| `lastLoginAt` | string (ISO) | Dernière connexion |
| `status` | `'active'` | Réservé pour futur (blocage) |

**`magic_links/{tokenId}`** — token = crypto.randomBytes(32).toString('hex')

| Champ | Type | Description |
|-------|------|-------------|
| `email` | string | Email du client |
| `customerId` | string | Référence Firestore |
| `expiresAt` | string (ISO) | now + 15 min |
| `used` | boolean | false initialement |
| `createdAt` | string (ISO) | Date de création |

### Modifications des collections existantes

**`sale_orders/{orderId}`** — ajouter :

| Champ | Type |
|-------|------|
| `customerId` | string |

**`rental_orders/{orderId}`** — ajouter :

| Champ | Type |
|-------|------|
| `customerId` | string |

### Flux post-paiement (capture-order)

```
Paiement PayPal OK
→ extraction email + nom depuis capture.payer
→ customers collection : find by email
  → si existant : update lastLoginAt
  → si nouveau : create avec email, displayName, createdAt, status: 'active'
→ sale_orders / rental_orders :
  → écrire customerId en plus des champs existants
```

### Flux Magic Link

```
Client sur /boutique/mon-compte/connexion
→ saisit email
→ POST /api/boutique/send-magic-link
  → cherche customerId dans customers (find by email)
  → si pas trouvé : renvoie "Email inconnu" (pas de leak d'existence)
  → si trouvé : génère token crypto.randomBytes(32).toString('hex')
  → magic_links/{token} : { email, customerId, expiresAt: +15min, used: false }
  → construction lien : /boutique/mon-compte/valider?token=xxx&email=yyy
  → envoi email :
    → SI PayPal ENV = sandbox → TOUJOURS envoyer à ayanhil@gmail.com
    → SINON → envoyer à l'email du client
  → inclure dans l'email : lien, expiration 15 min, mention "si vous n'êtes pas à l'origine... ignorez"

Client reçoit email → clique sur lien
→ /boutique/mon-compte/valider?token=xxx&email=yyy
  → lit magic_links/{token}
  → vérifie : token existe, used === false, expiresAt > now, email match
  → si invalide → page d'erreur "lien invalide ou expiré"
  → si valide :
    → magic_links/{token}.used = true
    → customers/{customerId}.lastLoginAt = now
    → crée session cookie JWT (signé avec jose, 12h d'expiration)
    → redirect → /boutique/mon-compte/commandes
```

### Session client

- Cookie HTTP-only signé avec `jose` (même librairie que `src/lib/auth.ts`)
- Payload du cookie : `{ customerId, email, type: 'client', exp, iat }`
- Pas de Firebase Auth — pas de Firebase Auth user créé pour les clients
- Le cookie est spécifique au domaine, sécurisé, HTTP-only

### Middleware

Vérifie le cookie session client sur les routes protégées :

| Route | Protection |
|-------|-----------|
| `/boutique/mon-compte/connexion` | Aucune (publique) |
| `/boutique/mon-compte/valider` | Aucune (publique, token sécurisé) |
| `/boutique/mon-compte` | Redirige vers /commandes |
| `/boutique/mon-compte/commandes` | Protégée → si pas de cookie → redirect /connexion |
| `/boutique/mon-compte/commande/[id]` | Protégée → idem |

### Middleware technique

Un middleware Next.js (ou vérification côté client) lit le cookie et expose `customerId` aux pages.

## Délais

| Élément | Durée |
|---------|-------|
| Magic link token | 15 min |
| Session cookie | 12 h |
| Les autres délais existants (OTP, etc.) | Inchangés |

## Détection Sandbox PayPal

Utiliser la variable d'environnement `NEXT_PUBLIC_PAYPAL_ENV` ou détecter via la présence de `@sandbox` ou `@personal.example.com` dans l'email PayPal. Si sandbox → toujours envoyer à `ayanhil@gmail.com`.

## Email Magic Link

Template d'email minimal :

- Objet : "Connexion à votre espace client PIXIATECH"
- Corps : lien cliquable, expiration 15 min, message de sécurité standard
- Utiliser `buildSecureEmailHtml` existant ou créer un template dédié

## Routes

| Route | Méthode | Description |
|-------|---------|-------------|
| `/boutique/mon-compte/connexion` | GET | Formulaire email |
| `/boutique/mon-compte/valider` | GET | Valide token + set cookie |
| `/boutique/mon-compte` | GET | Redirige vers /commandes |
| `/boutique/mon-compte/commandes` | GET | Liste des commandes |
| `/boutique/mon-compte/commande/[id]` | GET | Détail d'une commande |
| `POST /api/boutique/send-magic-link` | API | Envoie magic link |
| `POST /api/boutique/logout` | API | Supprime cookie |

## Pages Espace Client

### /boutique/mon-compte/connexion

- Input email + bouton "Envoyer le lien"
- Message de confirmation : "Si cet email est associé à un compte, un lien de connexion vous a été envoyé."
- Pas de leak d'existence de compte

### /boutique/mon-compte/commandes

- Liste des commandes (sale_orders + rental_orders) du client
- Pour chaque commande : produit, date, montant, statut
- Bouton Voir détails → /commande/[id]
- Bouton Déconnexion

### /boutique/mon-compte/commande/[id]

- Détail d'une commande spécifique
- Toutes les infos disponibles
- Lien retour vers /commandes

## Admin Panel (phase 2, hors scope MVP)

- Section clients dans l'admin pour voir la liste des clients
- Voir les commandes par client
- Gérer les statuts

## Non-faits (hors scope MVP)

- Mot de passe optionnel
- Profil client modifiable
- Adresses de livraison multiples
- Historique navigation
- Wishlist
- Avis sur produits
