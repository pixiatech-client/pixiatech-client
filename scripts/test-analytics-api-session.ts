/**
 * Verrou : l'onglet Analytics ne doit jamais lever de rejection non geree.
 *
 * Contexte : `getJson` sert le cache pendant 30 s puis revalide en arriere-plan
 * (`fire and forget`). Sans `.catch` sur cette revalidation, une session
 * expiree produisait un 401 -> rejection non geree -> overlay Next
 * "Runtime Error", alors que la page affichait encore ses donnees en cache.
 * Le cache pouvait ensuite ressortir la promesse rejetee a tous les appelants
 * suivants (branche de dedup), qui echouaient tous sans jamais retenter le
 * reseau.
 */
import { fetchOverview, invalidateAnalyticsCache, resetAnalyticsData } from '../src/app/admin/site-web/analytics/_components/analytics-api.ts';

let failures = 0;
const check = (name: string, cond: boolean, extra?: string) => {
  console.log(`${cond ? 'PASS' : 'FAIL'} - ${name}${extra ? ` :: ${extra}` : ''}`);
  if (!cond) failures++;
};

const unhandled: unknown[] = [];
process.on('unhandledRejection', (reason) => unhandled.push(reason));

const realNow = Date.now;
let clock = 1_000_000;
Date.now = () => clock;

const okBody = { success: true, data: { totalSessions: 42 } };
let mode: 'ok' | 'unauth' = 'ok';
let calls = 0;

const stubFetch = async () => {
  calls += 1;
  if (mode === 'unauth') {
    return {
      ok: false,
      status: 401,
      json: async () => ({ success: false, message: 'Non authentifié', error: 'Non authentifié' }),
    } as Response;
  }
  return { ok: true, status: 200, json: async () => okBody } as Response;
};
(globalThis as unknown as { fetch: unknown }).fetch = stubFetch;

// Faux navigateur : `redirectToLogin` teste `typeof window`.
const realWindow = (globalThis as { window?: unknown }).window;
let redirectedTo: string | null = null;
(globalThis as { window?: unknown }).window = {
  location: {
    set href(v: string) {
      redirectedTo = v;
    },
  },
};

const FILTER = {} as never;
const FROM = clock - 86_400_000;
const TO = clock;

async function settle() {
  await new Promise((r) => setTimeout(r, 30));
}

async function main() {
  invalidateAnalyticsCache();
  unhandled.length = 0;

  // ── 1. Premiere visite, session valide ───────────────────────────────────
  const first = await fetchOverview(FROM, TO, FILTER);
  check('premier chargement renvoie les donnees', (first as { data?: unknown }).data !== undefined);
  check('aucune redirection quand la session est valide', redirectedTo === null);
  const afterFirst = calls;

  // ── 2. Cache devenu "stale" + session expiree ────────────────────────────
  // Contrat SWR : l'appelant recoit le CACHE, la revalidation part en
  // arriere-plan. C'est precisement ce chemin qui levait la rejection non
  // geree qui faisait tomber l'overlay, alors que la page, elle, allait bien.
  mode = 'unauth';
  clock += 31_000; // > STALE_MS

  const stale = await fetchOverview(FROM, TO, FILTER);
  check('cache servi immediatement (SWR)', (stale as { data?: unknown }).data !== undefined);
  check('revalidation declenchee en arriere-plan', calls > afterFirst);

  await settle();
  check(
    'aucune rejection non geree (plus d overlay "Runtime Error")',
    unhandled.length === 0,
    unhandled.length ? String(unhandled[0]) : undefined
  );
  check(
    'session expiree : redirection vers la connexion',
    redirectedTo === '/admin/login?reason=session_expired',
    String(redirectedTo)
  );

  // ── 3. L'entree rejetee a bien ete evincee du cache ──────────────────────
  // Sinon la branche de dedup ressortait la promesse rejetee a tous les
  // appelants suivants : ils echouaient tous sans jamais retenter le reseau.
  const callsBeforeRetry = calls;
  redirectedTo = null;
  void fetchOverview(FROM, TO, FILTER).catch(() => undefined);
  await settle();
  check(
    'cache rejete evince (l appel suivant retente le reseau)',
    calls > callsBeforeRetry,
    `calls ${callsBeforeRetry} -> ${calls}`
  );
  check('une seule redirection par echec', redirectedTo === '/admin/login?reason=session_expired');

  // ── 4. Visite sans cache + session expiree : erreur explicite ────────────
  invalidateAnalyticsCache();
  redirectedTo = null;
  unhandled.length = 0;
  let caught: unknown = null;
  try {
    await fetchOverview(FROM, TO, FILTER);
  } catch (e) {
    caught = e;
  }
  check('sans cache, l appelant recoit une erreur explicite', caught instanceof Error);
  check(
    'redirection effectuee avant de lever',
    redirectedTo === '/admin/login?reason=session_expired',
    String(redirectedTo)
  );

  // ── 5. Une erreur reseau classique ne doit PAS rediriger vers login ─────
  // Seul un 401/403 "Non authentifié/Non autorisé" vaut perte de session :
  // une 500 est un bug applicatif, pas une deconnexion.
  invalidateAnalyticsCache();
  redirectedTo = null;
  const realMode = mode;
  mode = 'ok';
  (globalThis as unknown as { fetch: unknown }).fetch = async () => {
    return {
      ok: false,
      status: 500,
      json: async () => ({ success: false, message: 'Erreur serveur' }),
    } as Response;
  };
  let serverErr: unknown = null;
  try {
    await fetchOverview(FROM, TO, FILTER);
  } catch (e) {
    serverErr = e;
  }
  check('une 500 remonte son message, sans redirection', serverErr instanceof Error && !redirectedTo,
    serverErr instanceof Error ? (serverErr as Error).message : undefined);
  mode = realMode;
  // On remet le stub standard : la section suivante doit repartir de zero.
  (globalThis as unknown as { fetch: unknown }).fetch = stubFetch;

  // ── 6. Idem sur le chemin POST (`resetAnalyticsData`) ────────────────────
  // Une session expiree pendant une action destructive ne doit pas laisser
  // l'utilisateur devant une page morte avec un simple toast « Non authentifié ».
  invalidateAnalyticsCache();
  redirectedTo = null;
  mode = 'unauth';
  let postErr: unknown = null;
  try {
    await resetAnalyticsData();
  } catch (e) {
    postErr = e;
  }
  check('POST : redirection vers la connexion sur 401', redirectedTo === '/admin/login?reason=session_expired', String(redirectedTo));
  check('POST : erreur explicite remontee au caller', postErr instanceof Error);
}

main()
  .catch((e) => {
    failures += 1;
    console.log('FAIL - erreur inattendue', e);
  })
  .finally(() => {
    Date.now = realNow;
    (globalThis as unknown as { fetch: unknown }).fetch = realFetch;
    (globalThis as { window?: unknown }).window = realWindow;
    console.log(failures === 0 ? 'ANALYTICS-SESSION-PASS' : `ANALYTICS-SESSION-FAIL (${failures})`);
    process.exit(failures === 0 ? 0 : 1);
  });
