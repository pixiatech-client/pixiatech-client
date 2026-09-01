# AUDIT C5 — RÈGLE « 1 EMAIL = 1 COMPTE » + FUSION GOOGLE/EMAIL (ADMIN)

- **Date** : 2026-08-31
- **Portée** : authentification Admin (Firebase Auth) — flux email/mdp (`registerUser`) et Google (`handleGoogleSignIn` / `signInWithPopup`).
- **État** : phase d'audit **lecture seule** — aucun fichier source modifié, aucun commit, aucun déploiement.
- **Maillon** : C2 (Firestore rules) validé 21/21 via émulateur, non déployé en prod.

---

## 1. SYNTHÈSE / VERDICT

Firebase Auth **préserve déjà « 1 email = 1 compte » au niveau du UID** en bloquant la création d'un second compte par email. Mais cette protection se manifeste par **deux impasses UX non gérées** et **non traduites**, et il n'existe **aucun chemin de liaison** entre providers. Il subsiste par ailleurs une **faille applicative résiduelle** permettant (dans des scénarios de création manuelle/import) deux comptes de **privilèges incohérents** pour un même email.

**Verdict : correctif nécessaire.** Stratégie retenue : **même UID via `linkWithPopup`** (liaison officielle Firebase Auth des méthodes email et Google sur un compte unique), complétée par une **recherche croisée par email côté serveur** et une **traduction FR/EN/ZH** des messages.

**Aucun fichier modifié. En attente de feu vert utilisateur avant implémentation.**

---

## 2. CONTEXTE & PÉRIMÈTRE

Le projet comporte **deux systèmes d'authentification indépendants** :

| Système | Cible | Méthodes | Session |
|---------|-------|----------|---------|
| **Admin — Firebase Auth** | `/admin` | email/mdp (**`registerUser`**) + Google (**`handleGoogleSignIn`** + `signInWithPopup`) | cookie `session` (5 j) via `loginAndRedirect` |
| **Boutique — custom** | `/mon-compte` | magic-link + `/api/boutique/login-password` (bcrypt+jose) | cookie `client_session` |

**Périmètre C5 = Admin uniquement.** La boutique n'a **aucun Google Sign-In** (confirmé par grep : aucun `GoogleAuthProvider` sous `src/app/mon-compte/`). Elle est hors périmètre.

Points d'entrée Admin analysés :
- `src/app/admin/login/page.tsx` — connexion email/mdp, inscription, connexion Google.
- `src/app/admin/actions.ts` — `registerUser` (l.369-493), `handleGoogleSignIn` (l.499-600), `updateGoogleUserProfile` (l.602-652).
- `src/app/admin/register/page.tsx` — formulaire d'inscription email/mdp (→ `registerUser`).
- `src/app/admin/users/_components/**` — `registerUser` appelé depuis la gestion des utilisateurs (création par un admin).

---

## 3. ARCHITECTURE DE L'AUTHENTIFICATION ADMIN

**Flux email/mdp (client → serveur)**
1. Client : `signInWithEmailAndPassword(auth, email, password)` → `checkUserStatus(uid)` → `loginAndRedirect(idToken)`.
2. `registerUser` (serveur) : vérifie `getUserByEmail` / `getUserByPhoneNumber` → `createUser` → `setCustomUserClaims({role})` → écrit `users/<uid>` depuis **côté serveur** (contourne les règles Firestore).

**Flux Google (client → serveur)**
1. Client : `signInWithPopup(auth, new GoogleAuthProvider())`.
2. Serveur `handleGoogleSignIn(idToken)` : `verifyIdToken` → lecture `users/<uid>` → si existe : retourne rôle/status ; sinon : crée `users/<uid>` avec rôle par défaut (`getDefaultRole()` → `commercial`) et statut `pending`/`approved`.

**Point clé** : le flux Google s'appuie sur le **UID** (`decodedToken.uid`) comme clé Firestore, et ne fait **aucune recherche par email** dans `users` pour détecter un compte existant partageant le même email.

---

## 4. INVENTAIRE DES CHEMINS DE CONNEXION / INSCRIPTION

| Chemin | Fichier | Résultat |
|--------|---------|----------|
| Connexion email/mdp | `login/page.tsx:139` (`signInWithEmailAndPassword`) | Session admin |
| Inscription email/mdp | `login/page.tsx:211` / `register/page.tsx:54` → `registerUser` | Compte + doc `users/<uid>` |
| Connexion/inscription Google | `login/page.tsx:251` (`signInWithPopup`) → `handleGoogleSignIn` | Compte + doc `users/<uidGoogle>` |
| Création par admin | `admin/users/_components/*` → `registerUser` | Compte + doc `users/<uid>` |

Il existe **deux implémentations de `UserManager`** (`_components/user-manager.tsx` et `_components/gestion-utilisateurs/UserManager.tsx`) appelant toutes deux `registerUser`.

---

## 5. CAS 1 — EMAIL/MDP PUIS GOOGLE MÊME EMAIL (IMPASSE UX)

**Scénario** : un compte email/mdp existe (UID_A, même projet Firebase). L'utilisateur clique « Connexion avec Google » avec le même email.

**Comportement réel** : `signInWithPopup` lève côté client **`auth/account-exists-with-different-credential`**. Ce code n'est **pas géré** dans `getFirebaseErrorMessage` (`login/page.tsx:32-47` — switch limité à `user-not-found`/`wrong-password`/`invalid-credential`/`too-many-requests`/`network-request-failed`) → tombe dans `default` → `t('An error occurred with Google.')`.

**Conséquences**
1. L'utilisateur voit une erreur générique, **aucune indication** sur le conflit d'email.
2. **Aucun `fetchSignInMethodsForEmail`** pour récupérer les méthodes existantes.
3. **Aucun `linkWithPopup`** pour fusionner Google sur l'UID_A existant. (grep : 0 occurrence dans tout `src/app`.)

**Impact** : impasse fonctionnelle totale pour tout utilisateur ayant d'abord créé un compte email/mdp puis tentant Google. Aucun moyen de « relier » les deux méthodes.

---

## 6. CAS 2 — GOOGLE PUIS EMAIL/MDP MÊME EMAIL (IMPASSE UX)

**Scénario** : un compte Google existe (UID_B). L'utilisateur tente de s'inscrire avec le même email via le formulaire email/mdp.

**Comportement réel** : `registerUser` (`actions.ts:390`) appelle `adminAuth.getUserByEmail(email)` → trouve UID_B → retourne `{ success:false, error: 'A user with this email already exists.' }`.

**Conséquences**
1. Message d'erreur **en anglais brut**, affiché directement via `setSignupError(error?.message)` (`login/page.tsx:232`) **sans passer par `t()`** → non traduit en FR/ZH.
2. **Impasse symétrique du cas 1** : aucun écran « ajouter un mot de passe » (`updatePassword`/`linkWithCredential`) pour convertir le compte Google en compte hybride.

---

## 7. CAS 3 — MULTI-PROVIDERS MÊME EMAIL

**Scénario** : un email lié à plusieurs providers (ex. deux comptes Google distincts, ou Google + email) sur le même UID.

**Comportement réel** : aucun support. Pas de `fetchSignInMethodsForEmail`, pas de `linkWithPopup`, pas de gestion multi-méthodes. Les providers multiples ne peuvent pas être liés à un UID unique via l'UI.

**Impact** : impossible de profiter de l'identifiant OAuth récupérable dans `auth/account-exists-with-different-credential` (`error.credential` / `error.email`) pour relier proprement les comptes.

---

## 8. CAS 4 — DOUBLONS UID

**Scénario** : un même email associé à deux UID distincts (UID_A email/mdp, UID_B Google) — atteignable par création manuelle dans la console, désactivation/reconnexion d'une méthode, ou import.

**Comportement réel** : `handleGoogleSignIn` (l.521-539) ne vérifie que `users/<uid>` et **retourne le rôle/status du doc** sans rechercher d'autres `users` partageant le même email. `registerUser` rejette déjà l'email s'il existe **en Auth**, mais ne protège pas contre un email présent uniquement dans d'autres docs.

**Impact** : possibilité de **deux comptes avec privilèges divergents pour le même email** (ex. UID_A rôle `fournisseur` approuvé, UID_B `commercial` pending). C'est l'écart central par rapport à la règle « 1 email = 1 compte ».

---

## 9. FAILLE DE FUSION RÉSIDUELLE (2 COMPTES MÊME EMAIL)

**Localisation** : `handleGoogleSignIn` (`actions.ts:521-539`).

**Analyse** : la branche `userDoc.exists` retourne `success:true` en se fiant au seul UID Google. Si un compte email/mdp (UID_A) a déjà le même email, le doc Google (UID_B) est traité comme un **nouvel utilisateur légitime**, créant un second compte sans détection du conflit d'email au niveau applicatif.

**Gravité** : **HIGH** — risque de fragmentation d'identité et d'incohérence de privilèges (Admin/PROD), sur un chemin de gestion d'accès critique.

**Correctif attendu** : dans `handleGoogleSignIn`, après `verifyIdToken`, rechercher **par email** dans `users` (query sur `email`). Si un UID existant différent de `uid` possède déjà cet email :
- soit lier Google à l'UID existant (stratégie même-UID, cf. §11),
- soit **rejeter la création** avec un message clair si le compte existant ne peut pas être relié côté serveur.

---

## 10. GESTION DES ERREURS & TRADUCTIONS FR/EN/ZH

**Messages d'erreur serveur** (renvoyés en **anglais brut**, non traduits) :

| Message (serveur) | Ligne | FR (`admin-translations.ts`) | ZH (`admin-translations-zh-CN.ts`) |
|-------------------|-------|------|------|
| `A user with this email already exists.` | actions.ts:391 | ❌ absente | ❌ absente |
| `A user with this phone number already exists.` | actions.ts:403 | ❌ absente | ✅ présente |
| `The phone number format is invalid…` | actions.ts:488 | ❌ absente | ✅ présente |
| `An error occurred during registration.` | actions.ts:491 | ✅ | ✅ |
| `Invalid data` | actions.ts:502/612 | ❌ | ❌ |
| `Service unavailable.` | actions.ts:509/618 | ❌ | ❌ |
| `Google sign-in handler error` (via `error.message`) | actions.ts:598 | ❌ | ❌ |

**Path d'affichage des erreurs serveur** : renvoyées dans `result.error`, puis `throw new Error(result.error)` → dans `login/page.tsx` :
- `handleSignup` : `setSignupError(error?.message)` (l.232) → **brut, non traduit**.
- `handleGoogleSignIn` : `getFirebaseErrorMessage(error, t('An error occurred with Google.'))` (l.287) — erreur sans `code` → `default` → `fallback` = **`error.message` brut**.

**Path des erreurs Firebase côté client** : `getFirebaseErrorMessage` (l.32-47) traduit via `t()` uniquement pour `user-not-found`/`wrong-password`/`invalid-credential`/`too-many-requests`/`network-request-failed`. **Absent du switch** : `account-exists-with-different-credential`, `provider-already-linked`, `credential-already-in-use`, `email-already-in-use`.

**Bilan** : la plupart des messages serveur et le code critique `account-exists-with-different-credential` ne sont **ni traduits ni gérés**.

---

## 11. STRATÉGIE RETENUE — MÊME UID VIA LINKWITHPOPUP

Conforme à la décision utilisateur. Approche officielle Firebase Auth : **un seul compte (UID), plusieurs méthodes (email/mdp + Google)**.

**Principe**
- **Cas 1** (email/mdp puis Google) : intercepter `auth/account-exists-with-different-credential` → récupérer `error.email` → `fetchSignInMethodsForEmail(email)` → si la méthode `password` existe, afficher une invitation à **se connecter d'abord par email/mdp** puis **`linkWithPopup(provider)`** pour rattacher Google au même UID. Le rôle/status Firestore **reste celui du compte d'origine** (pas de second compte).
- **Cas 2** (Google puis email/mdp) : après connexion Google existante, proposer un écran « **Ajouter un mot de passe** » utilisant `linkWithCredential`/`updatePassword` (méthode `password` rattachée au même UID google).
- **Cas 4** (fusion de 2 UID résiduels) : hors périmètre immédiat — prévenir à la source via la recherche par email (cf. §13), plutôt que de fusionner a posteriori (risqué, données divisées).

**Avantages** : 1 compte = 1 UID = 1 doc Firestore → règle « 1 email = 1 compte » garantie au niveau UID, rôles/status cohérents, aucune fusion de données.

---

## 12. CORRECTIFS PROPOSÉS (CLIENT)

Fichiers cibles : `src/app/admin/login/page.tsx`, `src/app/admin/register/page.tsx` (validation).

1. **`getFirebaseErrorMessage`** — ajouter la gestion de :
   - `auth/account-exists-with-different-credential`
   - `auth/provider-already-linked`
   - `auth/credential-already-in-use`
   - `auth/email-already-in-use`
   - `auth/invalid-login-credentials`
2. **`handleGoogleSignIn` (client, l.238-292)** — dans le `catch` :
   - si `error.code === 'auth/account-exists-with-different-credential'` → `fetchSignInMethodsForEmail(error.email)` → si `password` présent, ouvrir l'UI « email/mdp déjà utilisé → relier » :
     - étape 1 : connecter via `signInWithEmailAndPassword(auth, error.email, mdp)`,
     - étape 2 : `currentUser.linkWithPopup(provider)`.
   - gérer l'annulation popup existante (`popup-closed-by-user` déjà traité).
   - ne **pas** appeler `handleGoogleSignIn` serveur tant que la liaison n'est pas résolue (éviter la création d'un UID_B).
3. **Erreurs serveur** — router les `result.error` **via `t()`** avant affichage (au lieu du brut) pour respecter FR/EN/ZH.

---

## 13. CORRECTIFS PROPOSÉS (SERVEUR / FIRESTORE)

Fichier cible : `src/app/admin/actions.ts`.

1. **`handleGoogleSignIn` (l.521-539)** — après `verifyIdToken`, **recherche croisée par email** dans `users` :
   - `adminDb.collection('users').where('email','==',email).get()` ;
   - si un UID **existant ≠ uid** possède cet email (et que son doc est valide) → **rejeter la création** avec un message clair indiquant que ce compte existe déjà (et renvoyer l'invitation à utiliser le flux de liaison client côté même-UID), OU adopter l'UID existant en liant la méthode Google (à décider selon la stratégie).
   - cette garde **comble la faille §9** et impose « 1 email = 1 compte » au niveau applicatif, indépendamment du comportement Firebase.
2. **`registerUser`** — même garde : vérifier que l'email n'existe pas déjà dans un doc `users` avec un autre UID (en plus du `getUserByEmail` Auth existant qui couvre déjà le cas Auth).
3. Messages d'erreur centralisés et **traduisibles** (via le map existant).

---

## 14. TRADUCTIONS À AJOUTER

Catalogues : `src/lib/admin-translations.ts` (FR), `src/lib/admin-translations-zh-CN.ts` (ZH). Clés à ajouter des deux côtés :

- `A user with this email already exists.`
- `This email is already linked to another account. Please sign in with your password first to link your Google account.` (affichage cas 1)
- `Sign in with your password to link your Google account.`
- `Account linked successfully.`
- `Add a password to your Google account.`
- `account-exists-with-different-credential` adapté : `An account already exists with this email. Sign in with your existing password to continue.`
- `Invalid data`
- `Service unavailable.`

(Nota : `userAlreadyExists` existe déjà en `en.json`/`i18n-server.ts` — à aligner dans les catalogues admin.)

---

## 15. TESTS / VALIDATION PRÉVUS

Validation via l'infra émulateur éprouvée en C2 (`@firebase/rules-unit-testing@5.0.2`, firebase ^12, JDK 21) — réutilisée sans changement durable du repo :

1. **Cas 1** : créer email/mdp (UID_A) → tenter Google même email → vérifier qu'`account-exists-with-different-credential` est géré → `linkWithPopup` → **1 seul UID, 1 doc**, rôle conservé.
2. **Cas 2** : créer Google (UID_B) → ajouter mot de passe → `fetchSignInMethodsForEmail` retourne `['google.com','password']` → **1 seul UID**.
3. **Cas 4 / garde serveur** : document `users/<uid>` sans email correspondant + tentative Google même email → **création rejetée**.
4. **Traductions** : vérifier l'affichage FR/ZH des nouveaux messages.
5. **Gates** : `tsc --noEmit` exit 0, `next build` exit 0 (101 pages).

---

## 16. PLAN D'IMPLÉMENTATION & RISQUES

**Ordre suggéré** (après feu vert) :
1. Serveur : garde par email dans `handleGoogleSignIn` + `registerUser` (§13) — prioritaire (faille §9).
2. Client : gestion `account-exists-with-different-credential` + flux `linkWithPopup` (§12).
3. Cas 2 : écran « ajouter un mot de passe » (§12/13).
4. Traductions FR/EN/ZH (§14).
5. Tests émulateur + `tsc` + `next build` (§15).

**Risques / points d'attention**
- **Fusion a posteriori de 2 UID** : volontairement hors périmètre, jugé risqué (données divisées). On **prévient** la création de doublons plutôt que de les fusionner.
- **`signInWithPopup` vs `signInWithRedirect`** : popup est utilisé actuellement ; sur appareils/iframe, préférer redirect si nécessaire — hors périmètre immédiat.
- **Deux `UserManager`** (`_components/user-manager.tsx` + `gestion-utilisateurs/UserManager.tsx`) → toute modification de `registerUser` affecte les deux ; vérifier qu'elles restent synchronisées.
- **Sessions actives** : un changement de méthode sur un UID ne doit pas invalider la session Firestore existante.

---

**ÉTAT** : rapport d'audit livré — **aucun fichier source modifié** (seul ce fichier de rapport est créé). En attente du **feu vert utilisateur** pour l'implémentation (sections 12-15).
