# Boutique — Parcours Location Complet

## Architecture

Nouveau composant `BoutiqueRentalFlow` inline sur la page produit, réutilisant les briques existantes (`ContractDocument`, `SignaturePad`, logique OTP). Collection Firestore dédiée `rental_orders`. `CartItem` enrichi avec `type: 'purchase' | 'rental'`.

## Fichiers modifiés / créés

| Fichier | Action |
|---|---|
| `src/components/BoutiqueRentalFlow.tsx` | **Nouveau** — assistant location 3 étapes |
| `src/contexts/CartContext.tsx` | Modifié — `CartItem.type`, champs rental |
| `src/app/boutique/produit/[id]/page.tsx` | Modifié — condition location → `BoutiqueRentalFlow` |
| `src/app/boutique/panier/page.tsx` | Modifié — affichage items rental |
| `src/app/boutique/paiement/page.tsx` | Modifié — passage rental au checkout |
| `src/lib/rental-orders.ts` | **Nouveau** — CRUD Firestore rental_orders |
| `src/app/api/paypal/capture-order/route.ts` | Modifié — création rental_orders après capture |
| `src/app/admin/boutique/location/page.tsx` | **Nouveau** — dashboard location admin |
| `src/app/admin/boutique/layout.tsx` | **Nouveau** — layout onglets Vente / Location |

## Modèle Firestore `rental_orders`

| Champ | Type | Description |
|---|---|---|
| id | string | Auto-généré |
| productId | string | Référence produit boutique |
| productName | string | Nom au moment de la commande |
| productImage | string | URL image |
| productPrice | number | Prix unitaire |
| quantity | number | Quantité |
| renterDetails | RenterDetails | Client (company, representative, email, phone, address, city, postcode) |
| rentalStartDate | string | YYYY-MM-DD |
| rentalEndDate | string | YYYY-MM-DD |
| rentalStartTime | string | HH:MM |
| rentalEndTime | string | HH:MM |
| additionalNotes | string | Remarques optionnelles |
| contractSignedAt | string \| null | ISO date de signature |
| contractPdfUrl | string \| null | URL Firebase Storage |
| emailVerified | boolean | Vérification OTP |
| emailVerifiedAt | string \| null | ISO date vérification |
| paypalOrderId | string \| null | PayPal order ID |
| paypalCaptureId | string \| null | PayPal capture ID |
| amountPaid | number | Montant total payé |
| status | string | `pending_validation` \| `validated` \| `shipped` \| `completed` \| `cancelled` |
| userId | string | UID du client (optionnel) |
| createdAt | string | ISO date |
| updatedAt | string | ISO date |

## CartItem (modifié)

```typescript
export interface CartItem {
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  category: string;
  // Nouveau
  type: 'purchase' | 'rental';
  // Rental uniquement
  rentalStartDate?: string;
  rentalEndDate?: string;
  rentalStartTime?: string;
  rentalEndTime?: string;
  renterDetails?: RenterDetails;
  rentalFlowCompleted?: boolean;
}
```

## BoutiqueRentalFlow — Composant

3 étapes sans stepper header (formulaire scrollable, boutons Précédent/Suivant en bas).

### Étape 1 — Formulaire

Champs (réutilisés du `SignatureFlow`) :
- Société, Contact, Email, Téléphone
- Ville (recherche avec autocomplete)
- Adresse
- Dates début/fin
- Horaires début/fin
- Remarques
- Quantité
- Pas d'installation (supprimé)

Validation : tous les champs marqués * requis. Bouton "Continuer" désactivé si invalide.

### Étape 2 — Contrat & Signature

- `ContractDocument` avec `projectMode='location'`
- Checkbox CGV
- `SignaturePad` (si signature numérique activée)
- Bouton "Continuer" désactivé si pas signé

### Étape 3 — Vérification email

- Envoi OTP via `/api/send-email` (réutilisé, endpoint existant)
- 6 chiffres, UI identique à SignatureFlow (hidden input + 6 cases visuelles)
- Validation : nouvelle server action `verifyBoutiqueOtp(email, code)` — pas de dépendance à `quoteId`
- Compteur de validité 10min, max 3 renvois
- Auto-ajout au panier après succès

### Étape finale

- Message "Prêt pour la location"
- Bouton "Voir le panier" / "Continuer mes achats"

### Intégration page produit

```tsx
// Dans page.tsx, condition purchaseType === 'location'
{locationCompleted ? (
  <button>Voir le panier</button>
) : (
  <BoutiqueRentalFlow
    product={product}
    onComplete={() => setLocationCompleted(true)}
  />
)}
```

Le bouton "Louer ce produit" dans la sidebar droite est désactivé avec texte "Effectuez les étapes de location" tant que `locationCompleted === false`.

## Panier

Les items location affichent :
- Badge "Location" (fond gris clair)
- Dates et horaires de location
- Infos client (expandable)

Le subtotal additionne achat + location. Checkout unique PayPal.

## Paiement

PayPal reçoit un **montant total unique** (achats + locations) — pas de ligne séparée par type. Les détails rental (client, dates, contrat) sont stockés dans `CartContext` et passés à la page paiement.

Après capture PayPal (`/api/paypal/capture-order`) :
1. Items `type: 'purchase'` → inchangé (pas de persistence)
2. Items `type: 'rental'` → création d'un document `rental_orders` par item dans Firestore avec `status: 'pending_validation'`
3. Contrat PDF signé : uploadé vers Firebase Storage (`rental-contracts/{orderId}.pdf`) via `html2canvas` + `jsPDF` (identique à `SignatureFlow.generateAndSaveContractPdf`)
4. `rentalOrders[].contractPdfUrl` mis à jour après upload
5. Puis redirection vers page de confirmation

## Admin Dashboard

`/admin/boutique/location` :

- **Statistiques** : nb locations total, CA location, actives (pending_validation + validated), terminées
- **Tableau** : colonnes client, produit, dates, montant, statut, actions
- **Actions** : Valider, Expédier, Terminer, Annuler
- **Filtres** : par statut, recherche client/produit

Layout `/admin/boutique` avec sous-navigation Vente / Location.

## Checklist de vérification

- [ ] Pas de placeholder/TODO dans le spec
- [ ] Cohérence interne : CartItem.type correspond au modèle rental_orders
- [ ] Scope défini : pas de refactoring hors périmètre
- [ ] Pas d'ambiguïté : le paiement unique PayPal traite les deux types
