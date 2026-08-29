# AUDIT PRÉ-PRODUCTION — PIXIATECH CLIENT

**Version audité :** 0.1.0 (working tree au-dessus de `0beb7df`)
**Date :** 29/08/2026
**Méthode :** revue de code statique + lecture directe des routes sensibles + `tsc`/`build`/smoke tests HTTP sur serveur de production local.

---

## 1. SYNTHÈSE / VERDICT

**🟠 PRÊT SOUS RÉSERVES (READY WITH MANUAL CHECKS)**

Les vulnérabilités critiques (IDOR quote-requests) et la majorité des risques élevés ont été **corrigées et vérifiées en runtime**. Il reste :
- des tests manuels navigateurs/appareils (`MANUAL TEST REQUIRED`),
- la vérification des secrets en environnement de production (non exécutable ici, env non accessible),
- le linter `next lint` retiré par Next.js 16 → script `npm run lint` inutilisable (problème d'outillage, pas de code).

---

## 2. SECTIONS AUDITÉES

### S1. Secrets et configuration
| Vérification | Résultat |
|---|---|
| `.env.local` présent et NON commité | ✅ PASS (`.gitignore` couvre `.env*`) |
| Clés privées / blocs `BEGIN` dans le code | ✅ PASS (aucune) |
| `apiKey` Firebase dans le bundle client | ✅ PASS (publique par design Firebase) — présente dans `src/firebase/config.ts`, `src/components/chat/AdminPanel.tsx:13`, `src/app/admin/produits/firebase-applet-config.json` |
| Secrets serveur (SESSION_SECRET, CAPABILITY_SECRET, ADMIN_*, PAYPAL_CLIENT_SECRET, SMTP_*, GEMINI_API_KEY) | ✅ PASS — tous via `process.env`, server-only, jamais importés dans un composant `"use client"` |
| Logs init Admin SDK | ✅ PASS — variables loguées en `PRESENT/MISSING`, valeurs jamais affichées |
| Secrets en production (Cloud Run) | ⚠️ MANUAL — environnement inaccessible depuis ce poste |

### S2. Contrôles d'accès API (55 routes inventoriées)
| Route | Auth | Verdict |
|---|---|---|
| `quote-requests/list`, `update`, `delete` | ✅ `verifyAdminSession` **(ajouté)** | 🔓 était **CRITICAL IDOR** → corrigé |
| `quote-requests/[id]` GET | public (requis par `/quote/pay/[id]`) | ✅ WARNING documenté, volontaire |
| `quote-requests/create`, `respond` | public par design | ✅ PASS |
| `quote-requests/capture-payment` | auth présente | ✅ PASS |
| `promo/*` CRUD, `system-messages/*`, `seed-orders` | admin | ✅ PASS |
| `debug/session`, `debug/smtp-test`, `admin/cleanup-anonymous`, `admin/migrate-boutique`, `tracking/register|status|test`, `tracking/webhook` (callback tiers) | présentes | ✅ PASS |
| `seed-tracking-test` | ✅ `verifyAdminSession` **(ajouté)** | 🔓 était ouvert → corrigé |
| `send-email` | session Firebase requise | ⚠️ MEDIUM — accepte tout destinataire ; rate limit ajouté, destinataire arbitraire non bloquable sans casser le flux |
| `download`, `audio` | public | ✅ PASS — anti-SSRF solide (allowlist `firebasestorage.googleapis.com`/`storage.googleapis.com` + blocage IP privée/loopback/métadonnées) |
| `smtp-status` | public | ✅ PASS — renvoye uniquement `{configured: bool}`, aucun secret |

### S3. Authentification des API (rate limiting)
- Module maison `src/lib/rate-limit.ts` (fenêtre par IP + plafond global par route, fail-open, purge automatique des buckets expirés). **Aucune dépendance ajoutée.**
- Appliqué sur les endpoints abusables :
  - `gemini` (40 req/IP/min, 300 global) — API **payante**
  - `media/upload` (40/200), `media/optimize` (24/120)
  - `promo/validate` (30/200), `promo/use` (30/200)
  - `send-email` (20/300)
  - `login-password` (10/120) — **anti-force brute**
  - `send-magic-link` (6/IP/min, 240 global) — anti-spam
- Limite connue : **compteur en mémoire par instance** — à plusieurs réplicas Cloud Run, chaque instance compte séparément (accepté, doc dans le module).

### S4. API Gemini
- Cap longueur prompt : 12 000 caractères ; pièce jointe inline max 12 Mo. ✅
- Modèles restreints à la whitelist `ALLOWED_MODELS`. ✅
- `err.message` plus renvoyé au client (message générique sur 502). ✅
- Rate limited. ✅

### S5. Middleware / Headers HTTP
- CSP par route (iframe `/chat-widget`/`/embed` = `frame-ancestors *`, autre = `X-Frame-Options: DENY`). ✅ PASS
- `nosniff`, `Referrer-Policy`, `Permissions-Policy`. ✅ PASS
- HSTS conditionné au HTTPS. ✅ PASS
- Log par-requête supprimé (`middleware.ts`). ✅ PASS
- ⚠️ WARNING : convention `middleware` dépréciée par Next 16 au profit de `proxy` (ici Next.js 16.2.9) — migration recommandée mais rien ne casse (le build émet le warning).

### S6. Env, vars (NEXT_PUBLIC_*)
- Seulement `PAYPAL_CLIENT_ID` + `SITE_URL`/`BASE_URL` publics. ✅ PASS

### S7. Fichier de téléchargement (proxy SSRF)
- Cf. S2. ✅ PASS.

### S8. Autres endpoints publics (audio piggyback prod)
- `audio` : proxy Firebase Storage, hôte whitelisté + blocage IP privée. ✅ PASS.

### S9. Validation des entrées client et serveur
- `gemini` : types + limites (ajout). `promo/use` : ID requis + existence + `active` vérifiés avant incrément (ajout). `login-password` : email/password requis, messages 401 génériques (pas d'énumération). `send-magic-link` : réponse générique identique si compte trouvé ou non (anti-énumération) ✅.
- `quote-requests/create` : validation `REQUIRED_FIELDS` présente (par design). ✅ PASS.

### S10. Uploads et taille de fichiers
- `proxyClientMaxBodySize: 128mb` (expérimental). Rate limits ajoutés. Upload vidéo (>10 Mo) pipeline FFmpeg SSE **[GELÉ — non modifié]**.

### S11. SEO / Méta / robots / sitemap
| Vérification | Résultat |
|---|---|
| robots.txt | ✅ **AJOUTÉ** `src/app/robots.ts` — disallow `/admin`, `/mon-compte`, `/api/`, `/quote/`, `/embed`, `/chat-widget`, `/test-admin`, `/test-db` ; sitemap référencé (vérifié en runtime 200) |
| sitemap.xml | ✅ **AJOUTÉ** `src/app/sitemap.ts` — `/`, `/boutique`, `/boutique/panier` (vérifié en runtime 200) |
| Metadata racine | ✅ **ENRICHIE** — `metadataBase`, template `%s | PixiaTech`, `openGraph` (type website, image `/favicon-512.png`), favicon versionné `icons` `/favicon.ico?v=3` |
| Metadata par page | ⚠️ WARNING — les pages sont des **Client Components** (`"use client"`) : impossible d'ajouter `metadata`/`generateMetadata` sans les rendre serveur (refactor invasif, écarté). Title/description standards appliqués par le layout racine. |
| Canonical dynamique | ⚠️ WARNING — absent (nécessite `metadataBase` + pages serveur) |
| favicon doublon `src/favicon.ico` (non servi) | ⚠️ WARNING — à supprimer (optionnel) |

### S12. Page 404
- `src/app/not-found.tsx` **AJOUTÉE** (design cohérent + lien « Retour à l'accueil »).
- ⚠️ WARNING : la route catch-all racine `[[...step]]/page.tsx` renvoie le wizard (200) pour tout chemin inconnu de premier niveau — le 404 custom ne s'affiche que si `notFound()` est levé. Comportement existant, non modifié.

### S13. Console / Logs / Performance
- 104 `console.log`, 54 `warn`, 339 `error` recensés — concentrés dans `admin/actions.ts`, `quote-actions.ts`, `SignatureFlow.tsx`, estimation dashboard (`useVatValidation.ts` 8 logs debug client).
- Log par-requête du middleware supprimé. Build warning NFT (traçage via `next.config.mjs` ↔ `optimize/route.ts`) — non bloquant, dû aux `fs` dynamiques du pipeline vidéo.

### S14. Compilation TypeScript
- `npx tsc --noEmit` : **✅ 0 erreur**.

### S15. Build production
- `npm run build` : **✅ SUCCESS** — 101 routes, `robots.txt`, `sitemap.xml` générés statiques.

### S16. Lint / Tests / Backup
- Lint : ⚠️ FAIL — script `npm run lint` → `next lint`, **supprimé dans Next 16** (« Invalid project directory »). À remplacer (ESLint direct ou Biome) — outillage, ne bloque pas le build.
- Tests automatisés : ❌ AUCUN framework configuré — non-régression couverte par tsc/build/smoke HTTP.
- Backup : aucune référence à un mécanisme de backup/sauvegarde dans scripts/package.json — ⚠️ MANUAL (procédure de sauvegarde Firestore à définir côté ops).

### Sections NON TESTÉES (explicites)
| Section | État |
|---|---|
| Responsive / mobile (breakpoints, tactile) | ⚠️ MANUAL TEST REQUIRED |
| Cross-browser (Chrome/Edge/Firefox/Safari) | ⚠️ MANUAL TEST REQUIRED |
| HTTPS réel / HSTS en prod (Cloud Run) | ⚠️ MANUAL TEST REQUIRED |
| Secrets de production | ⚠️ MANUAL TEST REQUIRED |
| Paiement PayPal réel (sandbox → live) | ⚠️ MANUAL TEST REQUIRED |
| Sendinblue/SMTP réel | ⚠️ MANUAL TEST REQUIRED (le sandbox a été retiré) |

---

## 3. PROBLÈMES AVANT L'AUDIT

### 🔴 CRITICAL
1. **IDOR `quote-requests/{list,update,delete}`** : lecture/modification/suppression de tout devis (PII clients, prix, lien de paiement) sans aucune auth. → **CORRIGÉ** (`verifyAdminSession`).

### 🟠 HIGH
2. **`gemini` sans rate limit** (API payante, usage illimité possible) + pas de cap de prompt + fuite `err.message` sur 502. → **CORRIGÉ**.
3. **`promo/use` sans garde** : incrément arbitraire de `currentUses` → épuisement de quotas de codes. → **CORRIGÉ** (existence + `active`).
4. **`seed-tracking-test` ouvert** : injection de données de test par n'importe qui. → **CORRIGÉ** (admin).
5. **`login-password` sans anti-force-brute / `send-magic-link` sans anti-spam**. → **CORRIGÉ** (rate limits).

### 🟡 MEDIUM
6. **`send-email` vers destinataires arbitraires** (usage relais). → Atténué (rate limit) ; restriction de destinataire non appliquée pour ne pas casser le flux d'envoi des estimations.
7. **`promo/validate` expose codes actifs + promoDocId** — nécessaire au flux panier (`CartContext`, `quote/pay`). → Accepté, rate-limité.
8. **Regex cassée du middleware admin** : `verify-session` `MAX_RETRIES = 0`, fail-open sur erreurs inattendues — accepté (AdminLayout fait le contrôle autoritaire).
9. **403/500 des /api fuitent des messages** — nettoyé sur `gemini` et `send-email`.

### 🟢 LOW
10. Logs par-requête middleware → supprimé. `console.log` du code métier → non modifiés (bruit acceptable, aucun secret).
11. Build warning « middleware deprecated » (Next 16) → documenté, non bloquant.
12. Énorme `favicon.ico` (348 Ko) → versionné via `icons` metadata (busting de cache), conversion .webp recommandée plus tard.

---

## 4. CORRECTIONS APPLIQUÉES (14 fichiers, +99/−9)

| Fichier | Correction |
|---|---|
| `src/lib/rate-limit.ts` | **Nouveau** : limiter en mémoire (IP + global, fail-open, purge) |
| `src/app/api/quote-requests/{list,update,delete}/route.ts` | `verifyAdminSession` |
| `src/app/api/seed-tracking-test/route.ts` | `verifyAdminSession` |
| `src/app/api/gemini/route.ts` | rate limit + cap prompt 12k + erreurs génériques |
| `src/app/api/promo/use/route.ts` | rate limit + garde existence/`active` |
| `src/app/api/promo/validate/route.ts` | rate limit |
| `src/app/api/send-email/route.ts` | rate limit + erreur générique |
| `src/app/api/media/{upload,optimize}/route.ts` | rate limit uniquement (logique vidéo intacte) |
| `src/app/api/boutique/login-password/route.ts` | rate limit anti-brute-force |
| `src/app/api/boutique/send-magic-link/route.ts` | rate limit anti-spam |
| `src/middleware.ts` | suppression log par-requête |
| `src/app/layout.tsx` | metadataBase + title template + openGraph + icons versionné |
| `src/app/robots.ts` | **Nouveau** |
| `src/app/sitemap.ts` | **Nouveau** |
| `src/app/not-found.tsx` | **Nouveau** |

## 5. TESTS EXÉCUTÉS

1. `npx tsc --noEmit` → **0 erreur** (après chaque étape).
2. `npm run build` → **SUCCESS** (101 routes ; `robots.txt`/`sitemap.xml` ⚡ statiques).
3. Smoke tests HTTP sur serveur de production local (port 3100) :
   - `/robots.txt` → **200** (disallows corrects)
   - `/sitemap.xml` → **200**
   - `/api/quote-requests/list` → **401** (était ouvert)
   - `/api/quote-requests/update` PATCH → **401** (était ouvert)
   - `/api/quote-requests/delete` → **401** (était ouvert)
   - `/api/seed-tracking-test` → **401** (était ouvert)
   - `/api/quote-requests/impossible-id` GET → **404 « Devis introuvable »** (public préservé pour le paiement)
   - `/api/promo/use` (id inconnu) → **404 « Code promo introuvable »**

## 6. VERDICT

**🟠 READY AVEC RESERVES**

- Sécurité : vulnérabilités critiques corrigées et vérifiées en runtime.
- Qualité : build + types OK.
- **Blocages de production à valider par l'humain (MANUAL)** : secrets Cloud Run, HTTPS/HSTS réel, PayPal live, SMTP réel, tests navigateurs/mobiles (responsive, cross-browser).
- **À traiter prochainement** : restaurer un linter (`npm run lint` cassé par Next 16), procédure de backup Firestore, migration `middleware` → `proxy` (Next 16).