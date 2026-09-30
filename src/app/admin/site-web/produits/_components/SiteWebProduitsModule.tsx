'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Box,
  Plus,
  Eye,
  Pencil,
  Trash2,
  Copy,
  Upload,
  Loader2,
  Inbox,
  Search,
  AlertTriangle,
  CheckCircle2,
  Check,
  ArrowLeft,
  ExternalLink,
  RefreshCw,
  Image as ImageIcon,
  Star as StarIcon,
  FileUp,
  FileCheck,
  X,
  Sparkles,
  SlidersHorizontal,
  Lock,
} from 'lucide-react';
import { toast } from 'sonner';
import { AnimatePresence, motion } from 'framer-motion';
import { parseProductPdf } from '@/lib/products/product-pdf-parser';
import { buildProductFromMasterTemplate } from '@/lib/products/product-from-template';
import {
  getProductBySlug,
  uploadProductPhoto,
  uploadProductHoverImage,
  deleteProductMedia,
} from '@/lib/products/products-service';
import { slugify, groupDisplayName, productCategoryIds, MAX_PRODUCT_NAME_LENGTH, isValidShopUrl, normalizeShopUrl, sanitizeShopLinks } from '@/lib/products/types';
import {
  SYSTEM_TEMPLATE_LABEL,
  SYSTEM_TEMPLATE_PROTECTED_MESSAGE,
  isSystemTemplate,
  partitionDeletableProducts,
} from '@/lib/products/system-template';
import type { Product, ProductCategory, ProductCategoryGroup, ProductMediaItem, ProductShopLinks } from '@/lib/products/types';

interface SiteWebProduitsModuleProps {
  initial?: Product[];
  /** Slug à ouvrir directement en édition, lu côté serveur dans `?edit=`. */
  editSlug?: string;
}

type ViewState =
  | { view: 'list' }
  | { view: 'new' }
  | { view: 'edit'; product: Product };

const ENVIRONMENT_LABEL: Record<string, string> = {
  indoor: 'Intérieur',
  outdoor: 'Extérieur',
  both: 'Intérieur / Extérieur',
  showcase: 'Vitrine',
};

const BACKOFFICE_HEADER =
  'flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl';

type ProductFilter = 'ALL' | 'draft' | 'published';

function productPhoto(p: Product): string | undefined {
  return (
    p.media?.photos?.find((m) => m.url)?.url ??
    p.hero?.image ??
    p.overview?.image
  );
}

/**
 * Case à cocher de sélection.
 *
 * L'état « certaines cochées » n'existe pas en HTML : `indeterminate` ne passe
 * que par l'API DOM, d'où le `ref` piloté dans un effet. Sans lui, une
 * sélection partielle afficherait la case « tout cocher » comme décochée, ce
 * qui ferait croire que rien n'est sélectionné alors que c'est l'inverse.
 */
function SelectBox({
  checked,
  indeterminate,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
  label: string;
  /** Ligne non sélectionnable : le template système ne doit jamais entrer dans
   *  une cible de suppression groupée. */
  disabled?: boolean;
}) {
  const ref = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    if (ref.current) ref.current.indeterminate = Boolean(indeterminate);
  }, [indeterminate]);
  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      disabled={disabled}
      aria-label={label}
      className="w-4 h-4 rounded accent-[#38E044] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
    />
  );
}

async function listProducts(): Promise<Product[]> {
  const res = await fetch('/api/site-web/products', { credentials: 'include' });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || data.error || 'Impossible de charger les produits.');
  }
  return data.products;
}

async function saveProduct(slug: string, body: Record<string, unknown>): Promise<Product> {
  const res = await fetch(`/api/site-web/products/${encodeURIComponent(slug)}`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || data.error || 'Échec de la sauvegarde.');
  }
  return data.product as Product;
}

async function createProduct(body: Record<string, unknown>): Promise<Product> {
  const res = await fetch('/api/site-web/products', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.message || data.error || 'Création impossible.');
  }
  return data.product as Product;
}

async function fetchProductCategories(): Promise<ProductCategory[]> {
  const res = await fetch('/api/site-web/categories', { credentials: 'include' });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || data.error || 'Impossible de charger les catégories.');
  }
  return data.categories as ProductCategory[];
}

async function fetchProductGroups(): Promise<ProductCategoryGroup[]> {
  const res = await fetch('/api/site-web/category-groups', { credentials: 'include' });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || data.error || 'Impossible de charger les groupes de filtres.');
  }
  return data.groups as ProductCategoryGroup[];
}

/** Champs extraits du PDF, résumés pour un affichage convivial (aucun JSON). */
function extractedSummary(p: Partial<Product>): { label: string; value: string }[] {
  const rows: { label: string; value: string }[] = [];
  if (p.name) rows.push({ label: 'Série', value: p.name });
  if (p.environment) rows.push({ label: 'Environnement', value: ENVIRONMENT_LABEL[p.environment] || p.environment });
  if (p.sellingModes?.length) {
    rows.push({
      label: 'Modes de vente',
      value: p.sellingModes.map((m) => (m === 'sale' ? 'Vente' : 'Location')).join(' · '),
    });
  }
  if (p.characteristics?.length) {
    rows.push({ label: 'Caractéristiques', value: `${p.characteristics.length} caractéristiques` });
  }
  if (p.variants?.length) {
    rows.push({ label: 'Variantes & références', value: `${p.variants.length} variantes` });
  }
  if (p.specs?.models?.length) {
    rows.push({ label: 'Matrice comparative', value: `${p.specs.models.length} modèles` });
  }
  if (p.fieldwork?.projects?.length) {
    rows.push({ label: 'Projets réalisés', value: `${p.fieldwork.projects.length} projets` });
  }
  if (p.buttons) rows.push({ label: 'Boutons', value: 'Pré-remplis' });
  if (p.description?.shortFr) rows.push({ label: 'Description', value: 'Pré-remplie' });
  if (p.seo?.description) rows.push({ label: 'Référencement', value: 'Description prête' });
  return rows;
}

/**
 * Ce que l'import PDF n'a PAS pu fournir, à vérifier avant publication.
 *
 * Rien n'est perdu en silence : le parser conserve les libellés et valeurs
 * inconnus, et cette fonction les remonte à l'administrateur. Les visuels ne
 * sont pas extractibles (le PDF ne contient que des descriptions) : ils sont
 * listés comme « à joindre » pour que la section ne reste pas vide en ligne.
 */
type ImportDiagnostic = { tone: 'warn' | 'info'; text: string };

function importDiagnostics(p: Partial<Product>): ImportDiagnostic[] {
  const out: ImportDiagnostic[] = [];

  for (const warning of p.importWarnings ?? []) {
    out.push({ tone: 'warn', text: warning });
  }

  // Visuels décrits par le PDF mais sans fichier : à joindre côté admin.
  const mediaSlots: { label: string; title: string }[] = [];
  const pushSlot = (label: string, title?: string, url?: string) => {
    if (title && !url) mediaSlots.push({ label, title });
  };
  pushSlot('Aperçu — photo', p.overview?.photo?.title, p.overview?.photo?.url);
  pushSlot('Aperçu — vidéo', p.overview?.video?.title, p.overview?.video?.url);
  pushSlot('Conception — visuel', p.design?.visuals?.[0]?.title, p.design?.visuals?.[0]?.url);
  pushSlot('Points forts — visuel', p.features?.visual?.title, p.features?.visual?.url);
  (p.fieldwork?.projects ?? []).forEach((proj, i) => {
    if (proj.title && !proj.image) {
      mediaSlots.push({ label: `Projet ${i + 1}`, title: proj.title });
    }
  });
  for (const slot of mediaSlots) {
    out.push({ tone: 'info', text: `Visuel à joindre — ${slot.label} : « ${slot.title} »` });
  }

  // Valeurs laissées en attente dans la matrice : le gabarit les prévoit, le PDF
  // ne les renseigne pas encore. Elles s'afficheront comme telles en ligne.
  const pending = (p.specs?.models ?? []).reduce(
    (count, model) =>
      count + Object.values(model.specs ?? {}).filter((v) => v === 'PENDING' || v === '—').length,
    0
  );
  if (pending > 0) {
    out.push({
      tone: 'info',
      text: `${pending} valeur${pending > 1 ? 's' : ''} en attente dans la matrice (PENDING) — visible comme telle sur le site.`,
    });
  }

  return out;
}

/** Avertissements + visuels à joindre, affichés après l'analyse du PDF. */
function ImportDiagnosticsPanel({ items }: { items: ImportDiagnostic[] }) {
  if (items.length === 0) return null;
  return (
    <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/[0.06] px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-700 dark:text-amber-400 mb-1.5">
        <AlertTriangle className="w-3.5 h-3.5" />
        À vérifier avant publication ({items.length})
      </div>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li
            key={`${item.tone}-${i}`}
            className="text-[11px] leading-snug text-neutral-600 dark:text-neutral-300 flex gap-1.5"
          >
            <span aria-hidden className="text-amber-500 shrink-0">
              {item.tone === 'warn' ? '•' : '◦'}
            </span>
            <span className="font-mono">{item.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DerivedSlugHint({ name }: { name: string }) {
  const slug = slugify(name);
  return (
    <div className="mt-2 flex items-center gap-1.5 rounded-xl bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200 dark:border-white/10 px-3 py-2 text-[11px] font-mono text-neutral-500 dark:text-neutral-400">
      <Globe className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500 shrink-0" />
      <span className="truncate">
        /web/product/<span className="font-bold text-neutral-800 dark:text-neutral-200">{slug || '…'}</span>
      </span>
    </div>
  );
}

function Globe({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
      <path d="M2 12h20" />
    </svg>
  );
}

/**
 * Traduit une erreur technique en message compréhensible.
 *
 * Le symptoms rapprochement etait un texte Firestore brut (« Missing or
 * insufficient permissions », codes `permission-denied`/`unavailable`) affiche
 * dans un toast : inutile pour un administrateur, qui ne peut pas y agir. On
 * distingue ce qui est de son ressort (droits, session) de ce qui est
 * transitoire (reseau), et on ne masque jamais une cause inconnue.
 */
function describeActionError(err: unknown, fallback: string): string {
  const raw = err instanceof Error ? err.message : String(err ?? '');
  const code = raw.includes('permission-denied')
    || /insufficient permissions/i.test(raw)
    || /missing or insufficient/i.test(raw)
    || /PERMISSION_DENIED/i.test(raw)
    ? 'permission'
    : raw.includes('unavailable')
      || /deadline exceeded/i.test(raw)
      || /fetch failed/i.test(raw)
      || /network/i.test(raw)
      || /ENOTFOUND|ETIMEDOUT|ECONNREFUSED/i.test(raw)
      ? 'reseau'
      : null;

  if (code === 'permission') {
    return 'Vos droits ne permettent pas cette action. reconnectez-vous en tant qu’administrateur puis réessayez.';
  }
  if (code === 'reseau') {
    return 'Connexion à la base interrompue. Vos données sont peut-être déjà enregistrées : rechargez la page pour vérifier avant de réessayer.';
  }
  // Un code Firestore inconnu reste traçable : on ne remplace pas une cause
  // que l'on ne comprend pas par un texte générique qui masquerait le bug.
  return raw.trim() || fallback;
}

export function SiteWebProduitsModule({ initial, editSlug }: SiteWebProduitsModuleProps) {
  const [state, setState] = useState<ViewState>({ view: 'list' });
  const [products, setProducts] = useState<Product[]>(initial ?? []);
  const [loading, setLoading] = useState(!initial);
  const [error, setError] = useState<string | null>(null);
  // Suppression en deux temps : on demande confirmation, puis on exécute.
  // Un seul slug à la fois, comme `deletingId` dans l'application Pixiatech :
  // seule la ligne visée bascule en confirmation, les autres restent intactes.
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      setProducts(await listProducts());
    } catch (err) {
      setError(describeActionError(err, 'Impossible de charger les produits.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initial) void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Deep-link « Modifier le produit » depuis la prévisualisation
  // (`/admin/site-web/produits?edit=<slug>`). Appliqué une seule fois : sinon le
  // rafraîchissement qui suit l'enregistrement rouvrirait l'éditeur en boucle.
  const editSlugApplied = useRef(false);
  useEffect(() => {
    if (!editSlug || editSlugApplied.current) return;
    const found = products.find((p) => p.slug === editSlug);
    if (!found) return;
    editSlugApplied.current = true;
    setState({ view: 'edit', product: found });
  }, [editSlug, products]);

  const goEdit = (product: Product) => setState({ view: 'edit', product });

  /** Étape 1 : ouvrir la confirmation. Ne touche pas à Firestore. */
  const askDelete = (product: Product) => {
    if (deleting) return;
    // Le template n'a pas d'action de suppression à confirmer : la corbeille
    // en ligne ne doit même pas s'ouvrir pour lui.
    if (isSystemTemplate(product)) {
      toast.error(SYSTEM_TEMPLATE_PROTECTED_MESSAGE);
      return;
    }
    setDeletingSlug(product.slug);
  };

  /**
   * Étape 2 : exécuter la suppression validée.
   *
   * Accepte un slug (corbeille sur une ligne) ou une liste (action groupée sur
   * la sélection) : la suppression passe par le même appel dans les deux cas,
   * donc pas deux implémentations à garder cohérentes.
   *
   * Les lignes ne sont retirées qu'après la réponse du backend. En cas d'échec
   * elles repassent en état normal et l'erreur est affichée : l'administrateur
   * peut donc relancer la suppression d'un second clic sur la corbeille.
   */
  const confirmDelete = async (target: string | string[]) => {
    if (deleting) return;
    const slugs = Array.isArray(target) ? target : [target];
    const victims = slugs
      .map((slug) => products.find((p) => p.slug === slug))
      .filter((p): p is Product => Boolean(p));
    // Le template est retiré de la sélection AVANT tout appel réseau. Le serveur
    // le refuserait de toute façon, mais une sélection groupée qui part avec lui
    // afficherait « 3 produits supprimés, 1 en échec » pour un produit qui n'a
    // jamais été visé : ici il n'entre pas dans la sélection.
    const { deletable: targets, protectedItems } = partitionDeletableProducts(victims);
    if (protectedItems.length > 0) {
      toast.error(SYSTEM_TEMPLATE_PROTECTED_MESSAGE);
    }
    if (targets.length === 0) {
      setDeletingSlug(null);
      return;
    }
    setDeleting(true);
    try {
      // `allSettled` plutôt qu'un `for` : une suppression refusée par le backend
      // ne doit pas empêcher les autres d'aboutir. Les échecs sont comptés et
      // annoncés, pas avalés.
      const results = await Promise.allSettled(
        targets.map(async (product) => {
          const res = await fetch(`/api/site-web/products/${encodeURIComponent(product.slug)}`, {
            method: 'DELETE',
            credentials: 'include',
          });
          const data = await res.json().catch(() => null);
          if (!res.ok || !data?.success) {
            throw new Error(data?.message || data?.error || 'La suppression a échoué.');
          }
          return product;
        })
      );
      const deletedSlugs = new Set(
        results
          .filter((r): r is PromiseFulfilledResult<Product> => r.status === 'fulfilled')
          .map((r) => r.value.slug)
      );
      const failed = results.length - deletedSlugs.size;

      setProducts((current) => current.filter((p) => !deletedSlugs.has(p.slug)));
      setDeletingSlug(null);
      if (deletedSlugs.size === 1) {
        const name = victims.find((p) => deletedSlugs.has(p.slug))?.name;
        toast.success(`Produit « ${name} » supprimé.`);
      } else if (deletedSlugs.size > 1) {
        toast.success(`${deletedSlugs.size} produits supprimés.`);
      }
      if (failed > 0) {
        toast.error(
          deletedSlugs.size > 0
            ? `${deletedSlugs.size} produits supprimés, ${failed} en échec — regardez la console si nécessaire.`
            : `La suppression a échoué pour ${failed} produit${failed > 1 ? 's' : ''}.`
        );
      }

      // Le rafraîchissement est une étape secondaire : s'il échoue, la
      // suppression est déjà faite et il ne faut pas la présenter comme un
      // échec — c'est ce qui affichait un message Firestore trompeur.
      await refresh();
    } catch (err) {
      setDeletingSlug(null);
      toast.error(describeActionError(err, 'La suppression a échoué.'));
    } finally {
      setDeleting(false);
    }
  };

  const duplicateProduct = async (product: Product) => {
    const used = new Set(products.map((p) => p.slug));
    const base = product.name || 'Produit';
    const makeVariantName = (idx: number): string => {
      // Le nom dupliqué n'est JAMAIS tronqué : « IL-FISS-IRWP1.2 Lite 2 » doit
      // rester lisible en entier. Si le suffixe déborde de la garde-fou, on
      // remonte une erreur explicite plutôt que de mutiler le nom — le slug,
      // lui, reste calculé séparément et peut être raccourpi si besoin.
      const candidate = `${base} ${idx}`;
      if (candidate.length > MAX_PRODUCT_NAME_LENGTH) {
        throw new Error(
          `Le nom « ${candidate} » dépasse ${MAX_PRODUCT_NAME_LENGTH} caractères : impossible de dupliquer sans tronquer le nom.`
        );
      }
      return candidate;
    };
    let idx = 2;
    let name: string;
    let slug: string;
    try {
      name = makeVariantName(idx);
      slug = slugify(name);
      while (used.has(slug)) {
        idx += 1;
        name = makeVariantName(idx);
        slug = slugify(name);
      }
    } catch (err) {
      toast.error((err as Error).message);
      return;
    }
    const { createdAt, updatedAt, ...rest } = product;
    try {
      const copy = await createProduct({ ...rest, name, slug, status: 'draft' });
      toast.success(`Copie « ${copy.name} » créée en brouillon.`);
      await refresh();
      goEdit(copy);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  if (state.view !== 'list') {
    return (
      <ProductForm
        view={state}
        onBack={() => setState({ view: 'list' })}
        onSaved={(msg) => {
          setState({ view: 'list' });
          void refresh();
          toast.success(msg);
        }}
        onCreated={async (product) => {
          await refresh();
          setState({ view: 'edit', product });
        }}
      />
    );
  }

  return (
    <ProductList
      products={products}
      loading={loading}
      error={error}
      onRefresh={refresh}
      onNew={() => setState({ view: 'new' })}
      onEdit={goEdit}
      onDelete={askDelete}
      onDuplicate={duplicateProduct}
      deletingSlug={deletingSlug}
      deleting={deleting}
      onConfirmDelete={confirmDelete}
      onCancelDelete={() => {
        if (!deleting) setDeletingSlug(null);
      }}
    />
  );
}

/* ---------------------------------------------------------------------------
 * LISTE
 * ------------------------------------------------------------------------- */

function ProductList({
  products,
  loading,
  error,
  onRefresh,
  onNew,
  onEdit,
  onDelete,
  onDuplicate,
  deletingSlug,
  deleting,
  onConfirmDelete,
  onCancelDelete,
}: {
  products: Product[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onNew: () => void;
  onEdit: (p: Product) => void;
  onDelete: (p: Product) => void;
  onDuplicate: (p: Product) => void;
  /** Slug de la ligne actuellement en confirmation, `null` si aucune. */
  deletingSlug: string | null;
  /** Appel backend en cours : la ligne confirmée est verrouillée. */
  deleting: boolean;
  onConfirmDelete: (slugs: string | string[]) => Promise<void>;
  onCancelDelete: () => void;
}) {
  const [filter, setFilter] = useState<ProductFilter>('ALL');
  const [query, setQuery] = useState('');

  /**
   * Sélection courante, en `Record` plutôt qu'en `Set` : le rendu de la table
   * ne dépend que d'un objet, donc une seule comparaison de référence suffit
   * pour re-rendre, et la clé est un slug (jamais l'index de ligne, qui change
   * dès qu'un filtre bouge).
   */
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const filtered = products.filter((p) => {
    if (filter !== 'ALL' && p.status !== filter) return false;
    if (filter === 'ALL' && p.status === 'deleted') return false;
    if (!query.trim()) return true;
    return p.name.toLowerCase().includes(query.trim().toLowerCase());
  });

  const counts = {
    all: products.filter((p) => p.status !== 'deleted').length,
    draft: products.filter((p) => p.status === 'draft').length,
    published: products.filter((p) => p.status === 'published').length,
  };

/**
   * Publier / dépublier depuis la liste, sans ouvrir l'éditeur.
   *
   * Le bouton EST l'action : auparavant le seul moyen de publier d'ici était le
   * stylo. Un seul champ part au backend (`status`) et le PUT fusionne par-dessus
   * le document existant, donc le reste de la fiche n'est pas touché.
   *
   * Asymétrie volontaire : publier est instantané (c'est l'action demandée),
   * dépublier passe par une confirmation. Retirer un produit en ligne par un
   * faux clic coûte plus cher que l'absence de raccourci — même logique que la
   * suppression en deux temps déjà présente dans cette page.
   *
   * L'affichage ne devine jamais : `onRefresh` recharge la liste une fois
   * l'écriture confirmée par le serveur.
   */
  const [statusPending, setStatusPending] = useState<Record<string, boolean>>({});
  const [unpublishAsk, setUnpublishAsk] = useState<string | null>(null);

/**
   * Écrit le statut d'UN produit et renvoie `false` en cas d'échec.
   *
   * Deux options pour l'action groupée, qui doit parler une seule fois au lieu
   * de N fois : `announce` coupe le toast (un résumé le remplace) et `refresh`
   * coupe le rechargement — sinon 20 produits cochés déclencheraient 20
   * rechargements de la liste et 20 toasts empilés.
   *
   * Elle ne propage pas l'erreur : ses appelants en ligne l'appellent en
   * `void`, une promesse rejetée y deviendrait un rejet non traité. En
   * renvoyant le résultat plutôt que de lever, l'action groupée peut additionner
   * les succès et les échecs au lieu de les confondre.
   */
  const writeStatus = async (
    p: Product,
    next: Product['status'],
    opts: { announce?: boolean; refresh?: boolean } = {}
  ): Promise<boolean> => {
    const { announce = true, refresh = true } = opts;
    if (statusPending[p.slug]) return false;
    setStatusPending((prev) => ({ ...prev, [p.slug]: true }));
    try {
      await saveProduct(p.slug, { status: next });
      if (announce) {
        toast.success(
          next === 'published'
            ? `Produit « ${p.name} » publié.`
            : `Produit « ${p.name} » repassé en brouillon.`
        );
      }
      if (refresh) onRefresh();
      return true;
    } catch (err) {
      if (announce) {
        toast.error(
          describeActionError(
            err,
            next === 'published'
              ? 'Publication impossible. La base est momentanément indisponible — réessayez dans un instant.'
              : 'Dépublication impossible. La base est momentanément indisponible — réessayez dans un instant.'
          )
        );
      }
      return false;
    } finally {
      setStatusPending((prev) => {
        const rest = { ...prev };
        delete rest[p.slug];
        return rest;
      });
    }
  };


/* --- Sélection multiple -------------------------------------------------
   *
   * La sélection est bornée à ce qui est VISIBLE. Deux raisons, et la seconde
   * est celle qui compte : un filtre ou une recherche qui change ferait
   * disparaître de l'écran des produits qui restent cochés, et l'action
   * groupée porterait alors sur des lignes que l'administrateur ne voit plus.
   * On vide donc la sélection à chaque changement de vue plutôt que de laisser
   * invisibles des produits cochés.
   */
  /**
   * Slugs réellement sélectionnables : le template en est retiré, et sa case est
   * désactivée plus bas. C'est l'option forte — « exclure le template de la
   * sélection » plutôt que « le laisser coché et refuser au dernier moment » :
   * un « Tout sélectionner » suivi de « Supprimer » ne peut alors même pas
   * composer une cible destructive contre lui. Le serveur garde la même règle.
   */
  const selectableSlugs = filtered.filter((p) => !isSystemTemplate(p)).map((p) => p.slug);
  const selectedSlugs = selectableSlugs.filter((slug) => selected[slug]);
  const selectedCount = selectedSlugs.length;
  const allVisibleSelected = selectableSlugs.length > 0 && selectedCount === selectableSlugs.length;
  const someVisibleSelected = selectedCount > 0 && !allVisibleSelected;

  /**
   * Action groupée : un seul PUT par produit, comme `writeStatus`, et les
   * résultats sont additionnés au lieu d'empiler N toasts. Les échecs
   * partiels sont annoncés — une sélection de 20 produits dont 2 échouent ne
   * doit pas afficher « 20 publiés ».
   */
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkConfirm, setBulkConfirm] = useState<'publish' | 'unpublish' | 'delete' | null>(null);

  useEffect(() => {
    setSelected({});
    // La confirmation est désarmée avec la sélection : sans ça, changer de
    // filtre en pleine confirmation laisserait la barre armée, et elle
    // réapparaîtrait en mode « Confirmer ? » sur une sélection toute nouvelle.
    setBulkConfirm(null);
  }, [filter, query]);

  const toggleOne = (slug: string) =>
    setSelected((prev) => ({ ...prev, [slug]: !prev[slug] }));

  const toggleAllVisible = () => {
    setSelected((prev) => {
      const next = { ...prev };
      if (allVisibleSelected) selectableSlugs.forEach((slug) => delete next[slug]);
      else selectableSlugs.forEach((slug) => { next[slug] = true; });
      return next;
    });
  };

  const clearSelection = () => setSelected({});

  const runBulkStatus = async (next: Product['status']) => {
    if (bulkBusy || selectedCount === 0) return;
    const targets = filtered.filter((p) => selected[p.slug] && !isSystemTemplate(p));
    if (targets.length === 0) return;
    setBulkBusy(true);
    setBulkConfirm(null);
    try {
      // `announce: false` et `refresh: false` : un seul résumé, un seul
      // rechargement, pour toute la sélection.
      const results = await Promise.all(
        targets.map((p) => writeStatus(p, next, { announce: false, refresh: false }))
      );
      const failed = results.filter((ok) => !ok).length;
      if (failed === 0) {
        toast.success(
          next === 'published'
            ? `${targets.length} produit${targets.length > 1 ? 's' : ''} publié${targets.length > 1 ? 's' : ''}.`
            : `${targets.length} produit${targets.length > 1 ? 's' : ''} repassé${targets.length > 1 ? 's' : ''} en brouillon.`
        );
      } else {
        toast.error(
          `${targets.length - failed} sur ${targets.length} produits traités, ${failed} en échec.`
        );
      }
      clearSelection();
      onRefresh();
    } finally {
      setBulkBusy(false);
    }
  };

  /**
   * Suppression groupée. La promesse est attendue pour que la barre reste
   * affichée, « En cours… », jusqu'à la réponse du backend : la faire
   * disparaître immédiatement laisserait l'administrateur sans aucune preuve
   * que son clic était parti.
   */
  const confirmBulkDelete = async () => {
    if (bulkBusy || selectedCount === 0) return;
    const targets = selectedSlugs;
    setBulkConfirm(null);
    setBulkBusy(true);
    try {
      await onConfirmDelete(targets);
    } finally {
      setBulkBusy(false);
      clearSelection();
    }
  };

return (
    <div id="admin-products-workspace" className="space-y-6">
{/* Bandeau titre backoffice */}
      <div className={`bg-[#0A0D0E] border border-neutral-800 rounded-3xl p-5 sm:p-6 text-white ${BACKOFFICE_HEADER}`}>

        <div className="flex items-center gap-4 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-[#141B1E] border border-neutral-700 flex items-center justify-center shrink-0">
            <Box className="w-6 h-6 text-[#38E044]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold tracking-tight">Produits du site web</h1>
              <span className="text-[10px] font-mono font-extrabold bg-[#38E044] text-black px-2.5 py-0.5 rounded-full shadow-[0_0_10px_rgba(56,224,68,0.4)]">
                BACKOFFICE
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-1 truncate">
              Fiches produits du site — création depuis PDF technique, gestion des photos et de la publication.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          <button
            type="button"
            onClick={onRefresh}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 text-white text-xs font-bold border border-white/10 transition-all cursor-pointer shadow-sm active:scale-95"
            title="Actualiser la liste"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#38E044] ${loading ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </button>
          <button
            type="button"
            onClick={onNew}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#38E044] hover:bg-[#2fcb3c] text-black text-xs font-extrabold transition-all cursor-pointer shadow-[0_0_16px_rgba(56,224,68,0.35)] active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Nouveau produit</span>
          </button>
        </div>
      </div>

      {/* Filtres + recherche */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-neutral-200/80 dark:border-white/10 shadow-sm">
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-semibold">
          <button
            type="button"
            onClick={() => setFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              filter === 'ALL' ? 'bg-neutral-900 text-white shadow-sm' : 'text-neutral-600 hover:bg-neutral-100 dark:hover:bg-white/5'
            }`}
          >
            Tous ({counts.all})
          </button>
          <button
            type="button"
            onClick={() => setFilter(filter === 'draft' ? 'ALL' : 'draft')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              filter === 'draft' ? 'bg-amber-600 text-white shadow-sm' : 'text-amber-800 hover:bg-amber-50 dark:hover:bg-amber-500/10'
            }`}
          >
            <span>Brouillons</span>
            <span className="px-1.5 rounded-full text-[10px] bg-amber-800/60 text-white">{counts.draft}</span>
          </button>
          <button
            type="button"
            onClick={() => setFilter(filter === 'published' ? 'ALL' : 'published')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              filter === 'published' ? 'bg-emerald-600 text-white shadow-sm' : 'text-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-500/10'
            }`}
          >
            <span>Publiés</span>
            <span className="px-1.5 rounded-full text-[10px] bg-emerald-800/60 text-white">{counts.published}</span>
          </button>
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher un produit…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-neutral-50 dark:bg-zinc-800 border border-neutral-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-neutral-400"
          />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-300 text-xs font-semibold">
          <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
          <span className="flex-1">{error}</span>
          <button
            type="button"
            onClick={onRefresh}
            className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold transition-colors cursor-pointer"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* Barre d'actions groupées : n'apparaît que s'il y a une sélection,
          et ne vise que les produits réellement visibles (cf. `selectedSlugs`). */}
      <AnimatePresence>
        {selectedCount > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div
              role="region"
              aria-label="Actions sur les produits sélectionnés"
              className="flex flex-col sm:flex-row sm:items-center gap-3 bg-[#0A0D0E] border border-neutral-800 rounded-2xl px-4 py-3 text-white shadow-lg"
            >
              <span className="text-xs font-bold shrink-0" aria-live="polite">
                {selectedCount} produit{selectedCount > 1 ? 's' : ''} sélectionné
                {selectedCount > 1 ? 's' : ''}
              </span>

              {/* Confirmation : on nomme l'impact réel avant de l'exécuter. */}
              {bulkConfirm ? (
                <>
                  <span className="text-xs text-neutral-300 flex-1 min-w-0">
                    {bulkConfirm === 'delete'
                      ? `Supprimer ${selectedCount} produit${selectedCount > 1 ? 's' : ''} définitivement ?`
                      : bulkConfirm === 'unpublish'
                        ? `Retirer ${selectedCount} produit${selectedCount > 1 ? 's' : ''} du site ?`
                        : `Publier ${selectedCount} produit${selectedCount > 1 ? 's' : ''} ?`}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setBulkConfirm(null)}
                      disabled={bulkBusy || deleting}
                      className="px-3 py-1.5 text-[11px] font-bold text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (bulkConfirm === 'delete') void confirmBulkDelete();
                        else void runBulkStatus(bulkConfirm === 'unpublish' ? 'draft' : 'published');
                      }}
                      disabled={bulkBusy || deleting}
                      className="px-3 py-1.5 text-[11px] font-bold bg-white text-rose-600 rounded-lg hover:bg-rose-50 transition-all cursor-pointer disabled:opacity-70 inline-flex items-center gap-1.5"
                    >
                      {bulkBusy || deleting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden />
                          En cours…
                        </>
                      ) : (
                        'Confirmer'
                      )}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 flex-wrap flex-1">
                    <button
                      type="button"
                      onClick={() => setBulkConfirm('publish')}
                      disabled={bulkBusy}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wide rounded-full bg-[#38E044] text-black border border-[#38E044] hover:bg-[#2fcb3c] transition-colors cursor-pointer disabled:opacity-60"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      Publier
                    </button>
                    <button
                      type="button"
                      onClick={() => setBulkConfirm('unpublish')}
                      disabled={bulkBusy}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-full border border-white/15 hover:bg-white/10 text-white transition-colors cursor-pointer disabled:opacity-60"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Repasser en brouillon
                    </button>
                    <button
                      type="button"
                      onClick={() => setBulkConfirm('delete')}
                      disabled={bulkBusy || deleting}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-full border border-rose-500/40 text-rose-300 hover:bg-rose-500/15 transition-colors cursor-pointer disabled:opacity-60"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Supprimer
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={clearSelection}
                    disabled={bulkBusy}
                    className="shrink-0 px-2.5 py-1.5 text-[11px] font-bold text-neutral-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer disabled:opacity-60"
                  >
                    Tout désélectionner
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-neutral-200/80 dark:border-white/10 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-neutral-50 dark:bg-white/[0.02] border-b border-neutral-200 dark:border-white/10 font-mono text-neutral-500 uppercase tracking-wider text-[11px]">
                  <th className="p-4 w-10">
                    <SelectBox
                      checked={allVisibleSelected}
                      indeterminate={someVisibleSelected}
                      onChange={toggleAllVisible}
                      label={
                        allVisibleSelected
                          ? 'Tout désélectionner'
                          : 'Sélectionner tous les produits affichés'
                      }
                    />
                  </th>
                  <th className="p-4">Photo</th>
                  <th className="p-4">Nom</th>
                  <th className="p-4">Statut</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-white/5">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-12">
                      <div className="flex flex-col items-center justify-center gap-3 text-center">
                        <div className="p-3 rounded-2xl bg-neutral-100 dark:bg-white/5">
                          <Inbox className="w-7 h-7 text-neutral-400" />
                        </div>
                        <div className="text-sm text-neutral-500 dark:text-neutral-400 font-semibold">
                          {products.length === 0
                            ? 'Aucun produit pour le moment.'
                            : 'Aucun produit ne correspond à cette recherche.'}
                        </div>
                        {products.length === 0 && (
                          <p className="text-xs text-neutral-400 max-w-sm">
                            Cliquez sur « Nouveau produit », saisissez le nom, ajoutez la photo et analysez la
                            fiche technique PDF : le brouillon est créé automatiquement.
                          </p>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((p) => {
                    const photo = productPhoto(p);
                    // Ressource système : éditable et publiable comme les
                    // autres, jamais supprimable. Le même predicate que celui
                    // du serveur, importé — pas recopié ici.
                    const isTemplate = isSystemTemplate(p);
                    // Un brouillon n'est pas public : l'œil l'ouvre en
                    // prévisualisation admin. L'URL ne vaut rien sans session
                    // admin, la page refusera l'accès à un visiteur.
                    const isDraft = p.status !== 'published';
                    const viewHref = isDraft
                      ? `/web/product/${p.slug}?preview=true`
                      : `/web/product/${p.slug}`;
                    return (
                      <tr
                        key={p.slug}
                        className={`relative transition-colors ${
                          selected[p.slug]
                            ? 'bg-[#38E044]/10 dark:bg-[#38E044]/5'
                            : 'hover:bg-neutral-50/90 dark:hover:bg-white/[0.02]'
                        }`}
                      >
                        <td className="p-4">
                          <SelectBox
                            checked={Boolean(selected[p.slug])}
                            onChange={() => toggleOne(p.slug)}
                            disabled={isTemplate}
                            label={
                              isTemplate
                                ? `« ${p.name} » est un template système : non sélectionnable`
                                : `Sélectionner « ${p.name} »`
                            }
                          />
                        </td>
                        <td className="p-4">
                          {photo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={photo}
                              alt={p.name}
                              className="w-14 h-14 rounded-2xl object-cover border border-neutral-200 dark:border-white/10 shrink-0 bg-neutral-100"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-2xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 flex items-center justify-center shrink-0">
                              <Box className="w-6 h-6 text-neutral-400" />
                            </div>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="font-extrabold text-neutral-900 dark:text-white text-xs">{p.name}</div>
                            {isTemplate && (
                              <span
                                title={SYSTEM_TEMPLATE_PROTECTED_MESSAGE}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold uppercase tracking-wide bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/40"
                              >
                                <Lock className="w-3 h-3" aria-hidden />
                                {SYSTEM_TEMPLATE_LABEL}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-neutral-400 font-mono mt-0.5">/web/product/{p.slug}</div>
                        </td>
                        <td className="p-4">
                          {/* Le statut EST l'action : un brouillon affiche un
                              bouton « Publier » plein et contrasté ; un produit
                              en ligne affiche « Publié » avec la coche, et un
                              clic propose de le remettre en brouillon. Aucun
                              badge décoratif qui obligerait à ouvrir l'éditeur
                              pour agir sur le produit. */}
                          {(() => {
                            const busy = Boolean(statusPending[p.slug]);
                            const isPublished = p.status === 'published';
                            if (isPublished) {
                              // Étape 1 : ce clic n'atteint pas Firestore, il
                              // ouvre seulement la confirmation. Le produit
                              // reste en ligne tant que l'admin n'a pas confirmé.
                              if (unpublishAsk === p.slug) {
                                return (
                                  <div className="flex flex-col gap-1.5">
                                    <div className="flex items-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => void writeStatus(p, 'draft')}
                                        disabled={busy}
                                        className="text-[11px] font-bold px-2.5 py-1.5 rounded-full border transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-wait text-amber-800 bg-amber-50 border-amber-300 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30"
                                      >
                                        {busy ? 'Dépublication…' : 'Confirmer'}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setUnpublishAsk(null)}
                                        disabled={busy}
                                        className="text-[11px] font-bold px-2.5 py-1.5 rounded-full border transition-colors cursor-pointer disabled:opacity-60 text-neutral-600 bg-white border-neutral-200 hover:bg-neutral-50 dark:bg-white/5 dark:text-neutral-300 dark:border-white/10 dark:hover:bg-white/10"
                                      >
                                        Annuler
                                      </button>
                                    </div>
                                    <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
                                      Repasser en brouillon ?
                                    </span>
                                  </div>
                                );
                              }
                              return (
                                <button
                                  type="button"
                                  onClick={() => setUnpublishAsk(p.slug)}
                                  aria-label={`« ${p.name} » est publié. Cliquer pour proposer un retour en brouillon.`}
                                  title="Publié — cliquer pour le remettre en brouillon"
                                  className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full border transition-colors cursor-pointer text-emerald-800 bg-emerald-50 border-emerald-300 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-800 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30 dark:hover:bg-amber-500/10 dark:hover:text-amber-400 dark:hover:border-amber-500/30"
                                >
                                  <CheckCircle2 className="w-3 h-3" />
                                  Publié
                                </button>
                              );
                            }
                            return (
                              <button
                                type="button"
                                onClick={() => void writeStatus(p, 'published')}
                                disabled={busy}
                                aria-label={`Publier « ${p.name} »`}
                                title="Publier ce produit sur le site web"
                                className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wide px-3.5 py-2 rounded-full border transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-wait bg-[#38E044] text-black border-[#38E044] hover:bg-[#2ec235] hover:border-[#2ec235] shadow-[0_0_12px_rgba(56,224,68,0.35)]"
                              >
                                {busy ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Globe className="w-3.5 h-3.5" />
                                )}
                                Publier
                              </button>
                            );
                          })()}
                        </td>
                        <td className="p-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            <a
                              href={viewHref}
                              target="_blank"
                              rel="noreferrer"
                              className="p-2 rounded-xl text-neutral-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors cursor-pointer"
                              title={isDraft ? 'Prévisualiser le brouillon' : 'Voir la page publique'}
                            >
                              <Eye className="w-4 h-4" />
                            </a>
                            <button
                              type="button"
                              onClick={() => onEdit(p)}
                              className="p-2 rounded-xl text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 dark:hover:text-white dark:hover:bg-white/10 transition-colors cursor-pointer"
                              title="Éditer"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDuplicate(p)}
                              className="p-2 rounded-xl text-neutral-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-500/10 transition-colors cursor-pointer"
                              title="Dupliquer"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            {/* La corbeille n'existe pas pour le template : pas de
                              bouton du tout, plutôt qu'un bouton désactivé
                              qui laisserait croire à une panne. La garde
                              serveur reste, elle. */}
                          {!isTemplate && (
                            <button
                              type="button"
                              onClick={() => onDelete(p)}
                              disabled={deleting}
                              className="p-2 rounded-xl text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                          </div>
                        </td>

                        {/* Confirmation en ligne — pattern identique à
                            `ProductListItem` (src/app/admin/produits) : la zone
                            rouge recouvre la ligne depuis la droite, sans modal ni
                            overlay. `relative` sur le <tr> en fait le référent. */}
                        <AnimatePresence>
                          {deletingSlug === p.slug && !isTemplate && (
                            <motion.td
                              key={`delete-confirm-${p.slug}`}
                              colSpan={5}
                              initial={{ x: '100%' }}
                              animate={{ x: 0 }}
                              exit={{ x: '100%' }}
                              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                              className="absolute inset-0 z-10 p-0"
                            >
                              <div
                                role="group"
                                aria-labelledby={`delete-confirm-title-${p.slug}`}
                                className="h-full w-full bg-rose-600 flex items-center justify-between gap-3 px-3 sm:px-6"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                                    <AlertTriangle className="w-5 h-5 text-white" aria-hidden />
                                  </div>
                                  <div className="min-w-0">
                                    <h4
                                      id={`delete-confirm-title-${p.slug}`}
                                      className="text-white font-bold text-sm truncate"
                                    >
                                      Supprimer ce produit&nbsp;?
                                    </h4>
                                    <p className="text-rose-100 text-[10px] uppercase font-bold tracking-wider truncate">
                                      Cette action est irréversible
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                                  <button
                                    type="button"
                                    onClick={onCancelDelete}
                                    disabled={deleting}
                                    className="px-3 sm:px-4 py-2 text-xs font-bold text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                                  >
                                    Annuler
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => onConfirmDelete(p.slug)}
                                    disabled={deleting}
                                    className="px-3 sm:px-4 py-2 text-xs font-bold bg-white text-rose-600 rounded-xl hover:bg-rose-50 transition-all shadow-lg cursor-pointer disabled:opacity-70 inline-flex items-center gap-1.5"
                                  >
                                    {deleting ? (
                                      <>
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden />
                                        Suppression…
                                      </>
                                    ) : (
                                      'Supprimer'
                                    )}
                                  </button>
                                </div>
                              </div>
                            </motion.td>
                          )}
                        </AnimatePresence>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="text-[11px] text-neutral-400 dark:text-neutral-500 px-1">
        Les produits créés sont d&apos;abord en brouillon : ils ne deviennent visibles sur le site public
        qu&apos;une fois publiés.
      </p>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * FORMULAIRE (création + édition/vérification)
 * ------------------------------------------------------------------------- */

function ProductForm({
  view,
  onBack,
  onSaved,
  onCreated,
}: {
  view: Exclude<ViewState, { view: 'list' }>;
  onBack: () => void;
  onSaved: (message: string) => void;
  onCreated: (product: Product) => void;
}) {
  const existing = view.view === 'edit' ? view.product : null;
  const isNew = !existing;

  const [name, setName] = useState(existing?.name ?? '');
  const [status, setStatus] = useState<Product['status']>(existing?.status ?? 'draft');
  const [pdfAnalysis, setPdfAnalysis] = useState<Partial<Product> | null>(existing ?? null);
  const [pdfReanalysis, setPdfReanalysis] = useState<Partial<Product> | null>(null);
  const [pdfName, setPdfName] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | undefined>(
    existing ? productPhoto(existing) : undefined
  );
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  /**
   * Liens boutique par variante, indexés par nom de modèle.
   *
   * Clé racine du produit (et non `specs.models`) car `specs` est reconstruit
   * à chaque analyse de PDF : un lien stocké dans la matrice disparaîtrait à la
   * réanalyse. Ici la fusion superficielle de `saveProduct` préserve la map.
   *
   * On conserve la saisie BRUTE (même invalide) pour que l'admin voie son
   * erreur au lieu que sa frappe disparaisse ; `sanitizeShopLinks` ne persiste
   * que les entrées réellement valides.
   */
  const [shopLinks, setShopLinks] = useState<ProductShopLinks>(existing?.shopLinks ?? {});

  /**
   * Bibliothèque média — POINTS 7 à 10.
   *
   * La galerie est l'état local de référence : chaque image se remplace, se
   * supprime et se promeut INDÉPENDAMMENT des autres, et le résultat est
   * persisté immédiatement dans Firestore. On ne lit donc jamais
   * `existing.media.photos` pour l'affichage : `view.product` est figé à
   * l'ouverture de l'éditeur et ne refléterait pas les modifications.
   */
  const [mediaPhotos, setMediaPhotos] = useState<ProductMediaItem[]>(
    existing?.media?.photos ?? []
  );
  const [busyPhotoIndex, setBusyPhotoIndex] = useState<number | null>(null);

  /** Persiste la galerie et la répercute immédiatement à l'écran. */
  const persistPhotos = async (next: ProductMediaItem[], message: string) => {
    setMediaPhotos(next);
    if (!existing) return;
    await saveProduct(existing.slug, { media: { photos: next } });
    toast.success(message);
  };

  /**
   * Efface un fichier devenu inutile (remplacement, suppression).
   *
   * TOUJOURS appelé APRÈS l'écriture Firestore. L'ordre inverse est un piège :
   * si l'écriture échoue, l'entrée continue de pointer vers un fichier effacé
   * et l'image est cassée sur le site, sans issue. Dans cet ordre, le pire cas
   * est un fichier orphelin — invisible, sans conséquence pour le visiteur.
   */
  const discardFile = async (path: string | undefined, label: string) => {
    if (!path) return;
    try {
      await deleteProductMedia(path);
    } catch (err) {
      console.warn(`[ProductForm] ${label} non supprimé :`, err);
      toast.error("Fichier obsolète non effacé du stockage (l'image reste valable).");
    }
  };

  /**
   * Suppression DÉFINITIVE : l'entrée disparaît de Firestore ET l'objet
   * Storage est supprimé. Sans cela les fichiers accumulaient des orphelins
   * invisibles (l'URL continuait de fonctionner, l'image ne disparaissait pas).
   * L'entrée part d'abord, le fichier ensuite : on ne laisse jamais Firestore
   * pointer dans le vide, et un effacement refusé ne ressuscite pas l'image.
   */
  const removePhotoAt = async (index: number) => {
    if (!existing) return;
    const target = mediaPhotos[index];
    if (!target) return;
    setBusyPhotoIndex(index);
    try {
      await persistPhotos(
        mediaPhotos.filter((_, i) => i !== index),
        'Image supprimée.'
      );
      await discardFile(target.path, "Fichier de l'image supprimée");
    } catch (err) {
      toast.error((err as Error).message || 'Échec de la suppression.');
    } finally {
      setBusyPhotoIndex(null);
    }
  };

  /** Remplacement ciblé : seule l'image visée change, l'ancien fichier est effacé. */
  const replacePhotoAt = async (index: number, file: File) => {
    if (!existing) return;
    const previous = mediaPhotos[index];
    setBusyPhotoIndex(index);
    setUploading(true);
    try {
      const upload = await uploadProductPhoto(existing.slug, file);
      const next = [...mediaPhotos];
      next[index] = {
        ...previous,
        name: upload.name,
        url: upload.url,
        path: upload.path,
        size: upload.size,
        type: 'image',
      };
      // On referencia la nouvelle image AVANT d'effacer l'ancienne : une
      // écriture Firestore en échec laisse alors l'ancienne image intacte.
      await persistPhotos(next, 'Image mise à jour.');
      if (previous?.path && previous.path !== upload.path) {
        await discardFile(previous.path, 'Ancienne image');
      }
      setPhotoPreview(upload.url);
    } catch (err) {
      toast.error((err as Error).message || 'Échec du téléversement de la photo.');
    } finally {
      setUploading(false);
      setBusyPhotoIndex(null);
    }
  };

  /** La photo principale est la 1re de la galerie (cf. `productPhoto`). */
  const promotePhotoAt = async (index: number) => {
    if (index === 0) return;
    const next = [...mediaPhotos];
    const [moved] = next.splice(index, 1);
    next.unshift(moved);
    try {
      await persistPhotos(next, 'Photo principale mise à jour.');
      setPhotoPreview(moved?.url);
    } catch (err) {
      toast.error((err as Error).message || 'Échec du changement de photo principale.');
    }
  };

  // ── Catégories (taxonomie CMS) ────────────────────────────────────────────
  const [categories, setCategoriesState] = useState<ProductCategory[]>([]);
  const [groups, setGroups] = useState<ProductCategoryGroup[]>([]);
  /** Sélection par groupe de filtres : clé = type de catégorie, valeur = IDs. */
  const [selByGroup, setSelByGroup] = useState<Record<string, string[]>>({});
  const [addingGroup, setAddingGroup] = useState<string | null>(null);
  const [newFilterName, setNewFilterName] = useState('');
  const [categorySaving, setCategorySaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    Promise.all([fetchProductCategories(), fetchProductGroups()])
      .then(([list, groupList]) => {
        if (!mounted) return;
        setCategoriesState(list);
        setGroups(groupList);
        // Sélections initiales depuis `categoryIds` (choix unifié) avec repli
        // sur les anciens tableaux environment/application du produit.
        const initial = productCategoryIds(existing);
        if (initial.length > 0) {
          const buckets: Record<string, string[]> = {};
          for (const id of initial) {
            const cat = list.find((c) => c.id === id);
            if (cat) (buckets[cat.type] ??= []).push(id);
          }
          setSelByGroup(buckets);
        }
      })
      .catch((err) => {
        if (!mounted) return;
        console.warn('[ProductForm] Impossible de charger les catégories :', err);
      });
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleSel = (type: string, id: string) =>
    setSelByGroup((prev) => ({
      ...prev,
      [type]: prev[type]?.includes(id) ? prev[type].filter((x) => x !== id) : [...(prev[type] ?? []), id],
    }));

  /** Création d'un filtre directement depuis le formulaire produit :
   *  crée la catégorie, recharge la liste et sélectionne la nouvelle. */
  const addFilter = async (type: string, raw: string) => {
    const name = raw.trim();
    if (!name) return;
    setCategorySaving(true);
    try {
      const res = await fetch('/api/site-web/categories', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug: slugify(name), type, active: true, order: 9999 }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || 'Échec de la création du filtre.');
      }
      const list = await fetchProductCategories();
      setCategoriesState(list);
      const created =
        list.find((c) => c.id === data.category?.id) ??
        list.find((c) => c.slug === data.category?.slug && c.type === type);
      if (created) {
        setSelByGroup((prev) => ({
          ...prev,
          [type]: prev[type]?.includes(created.id) ? prev[type] : [...(prev[type] ?? []), created.id],
        }));
      }
      setNewFilterName('');
      setAddingGroup(null);
      toast.success(`Filtre « ${name} » ajouté et sélectionné.`);
    } catch (err) {
      toast.error((err as Error).message || 'Échec de la création du filtre.');
    } finally {
      setCategorySaving(false);
    }
  };

  /** Catégories sélectionnées, groupées par groupe (pour sauvegarde). */
  const categoryIds: string[] = Object.values(selByGroup).flat();
  // Anciens tableaux environment/application conservés pour compatibilité.
  const legacyBuckets: Record<string, string[]> = {};
  for (const id of categoryIds) {
    const type = categories.find((c) => c.id === id)?.type;
    if (type) (legacyBuckets[type] ??= []).push(id);
  }
  const environmentCategoryIds = legacyBuckets['environment'] ?? [];
  const applicationCategoryIds = legacyBuckets['application'] ?? [];

  // ── Image au survol (hero.hoverImage) ──────────────────────────────────────
  // Utilisable à la création (upload différé après création du document) comme
  // en édition (upload immédiat sur le slug existant).
  const [hoverFile, setHoverFile] = useState<File | null>(null);
  const [hoverPreview, setHoverPreview] = useState<string | undefined>(
    existing?.hero?.hoverImage ?? undefined
  );
  const [hoverLocalPreview, setHoverLocalPreview] = useState<string | undefined>(undefined);
  const [hoverUploading, setHoverUploading] = useState(false);
  const hoverInputRef = useRef<HTMLInputElement>(null);

  // Aperçu effectif : en création on montre l'aperçu local du fichier choisi,
  // en édition l'URL déjà enregistrée.
  const hoverSrc = isNew ? hoverLocalPreview : hoverPreview;

  const revokeHoverLocal = useCallback(() => {
    setHoverLocalPreview((prev) => {
      if (prev && prev.startsWith('blob:')) URL.revokeObjectURL(prev);
      return undefined;
    });
  }, []);

  // Libère l'object URL du fichier hover en attente à la destruction du formulaire.
  useEffect(() => {
    return () => {
      if (hoverLocalPreview && hoverLocalPreview.startsWith('blob:')) URL.revokeObjectURL(hoverLocalPreview);
    };
  }, [hoverLocalPreview]);

  const setNewHoverPhoto = (file: File) => {
    revokeHoverLocal();
    setHoverFile(file);
    setHoverLocalPreview(URL.createObjectURL(file));
  };

  const clearNewHover = () => {
    revokeHoverLocal();
    setHoverFile(null);
    setHoverPreview(undefined);
  };

  const photoInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  /** Une entrée file cachée par vignette : « Remplacer » cible l'image exacte. */
  const photoInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const cleanName = name.replace(/\s+/g, ' ').trim();
  const slug = slugify(cleanName);
  const nameValid = cleanName.length > 0 && cleanName.length <= MAX_PRODUCT_NAME_LENGTH;
  const previewUrl = isNew ? photoPreview : undefined;

  /**
   * Variantes à équiper d'un lien boutique. La source est la matrice RÉELLEMENT
   * enregistrée (ou en attente de réanalyse, qui la remplacera à l'identique) :
   * c'est elle que le site public affiche en colonnes.
   *
   * Une réanalyse peut supprimer une variante ; son lien devient orphelin et
   * n'est simplement jamais lu par `SpecsSection`.
   */
  const variantNames: string[] = (isNew
    ? (pdfAnalysis?.specs?.models ?? [])
    : (pdfReanalysis?.specs?.models ?? existing?.specs?.models ?? [])
  )
    .map((model) => model.name)
    .filter((modelName) => typeof modelName === 'string' && modelName.trim() !== '');

  // Clés saisies qui ne correspondent à aucune variante affichée : le lien
  // serait impossible à nettoyer depuis l'admin, puisque aucun champ ne le
  // porte. Les lister permet de le supprimer explicitement.
  const orphanShopLinkKeys = Object.keys(shopLinks).filter(
    (key) => !variantNames.includes(key)
  );

  const summary = isNew
    ? extractedSummary(
        pdfAnalysis ? { ...pdfAnalysis, name: cleanName || pdfAnalysis.name } : { name: cleanName }
      )
    : extractedSummary(
        pdfReanalysis
          ? { ...pdfReanalysis, name: cleanName || pdfReanalysis.name }
          : existing ?? { name: cleanName }
      );

  // Avertissements d'import + visuels à joindre, pour l'analyse courante
  // (nouveau produit ou réanalyse) et pour les données déjà enregistrées.
  const diagnostics = importDiagnostics(
    isNew
      ? (pdfAnalysis ?? { name: cleanName })
      : (pdfReanalysis ?? existing ?? { name: cleanName })
  );

  const clearNewPhoto = () => {
    if (photoPreview && photoPreview.startsWith('blob:')) URL.revokeObjectURL(photoPreview);
    setPhotoFile(null);
    setPhotoPreview(undefined);
  };

  const setNewPhoto = (file: File) => {
    if (photoPreview && photoPreview.startsWith('blob:')) URL.revokeObjectURL(photoPreview);
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const replaceExistingPhoto = async (file: File) => {
    if (!existing) return;
    setUploading(true);
    try {
      const upload = await uploadProductPhoto(existing.slug, file);
      const previousMain = mediaPhotos[0];
      // La zone « Photo principale » REMPLACE l'image de tête, elle n'ajoute
      // pas une photo supplémentaire. D'où le `slice(1)` : conserver
      // `...mediaPhotos` en entier laissait l'ancienne entrée en doublon dans
      // Firestore, pointant vers un fichier déjà effacé du stockage.
      const photos: ProductMediaItem[] = [
        {
          name: upload.name,
          url: upload.url,
          path: upload.path,
          size: upload.size,
          type: 'image' as const,
        },
        ...mediaPhotos.slice(previousMain ? 1 : 0),
      ];
      // Écriture Firestore d'abord, effacement du fichier ensuite : si
      // l'enregistrement échoue, l'ancienne photo reste la référence valide.
      await persistPhotos(photos, 'Photo mise à jour.');
      if (previousMain?.path && previousMain.path !== upload.path) {
        await discardFile(previousMain.path, 'Ancienne photo principale');
      }
      setPhotoPreview(upload.url);
      setPhotoFile(null);
    } catch (err) {
      toast.error((err as Error).message || 'Échec du téléversement de la photo.');
    } finally {
      setUploading(false);
    }
  };

  const uploadHoverImage = async (file: File) => {
    if (!existing) return;
    setHoverUploading(true);
    try {
      const { url, path } = await uploadProductHoverImage(existing.slug, file);
      const previousPath = existing.hero?.hoverImagePath;
      await saveProduct(existing.slug, {
        hero: { ...existing.hero, hoverImage: url, hoverImagePath: path },
      });
      // L'image précédente devient inutile : on efface le fichier pour ne pas
      // laisser d'orphelin dans le stockage à chaque remplacement.
      if (previousPath && previousPath !== path) {
        try {
          await deleteProductMedia(previousPath);
        } catch (err) {
          console.warn('[ProductForm] Ancien fichier survol non supprimé :', err);
        }
      }
      setHoverPreview(url);
      setHoverFile(null);
      toast.success('Image au survol mise à jour.');
    } catch (err) {
      toast.error((err as Error).message || 'Échec du téléversement.');
    } finally {
      setHoverUploading(false);
    }
  };

  const removeHoverImage = async () => {
    if (!existing) return;
    setHoverUploading(true);
    try {
      // Suppression DÉFINITIVE : référence Firestore + fichier Storage.
      const stalePath = existing.hero?.hoverImagePath;
      const { hoverImage: _removed, hoverImagePath: _removedPath, ...heroRest } = existing.hero ?? {};
      await saveProduct(existing.slug, { hero: heroRest });
      if (stalePath) {
        try {
          await deleteProductMedia(stalePath);
        } catch (err) {
          console.warn('[ProductForm] Fichier survol déjà absent :', err);
        }
      }
      setHoverPreview(undefined);
      setHoverFile(null);
      toast.success('Image au survol supprimée.');
    } catch (err) {
      toast.error((err as Error).message || 'Échec de la suppression.');
    } finally {
      setHoverUploading(false);
    }
  };

  const analyzePdf = async (file: File) => {
    setAnalyzing(true);
    try {
      const parsed = await parseProductPdf(file, isNew ? cleanName || undefined : undefined);
      if (!parsed) {
        toast.error('Aucun contenu exploitable détecté dans ce PDF. La fiche technique doit suivre le modèle PixiaTech.');
        setPdfName(null);
        if (existing) setPdfReanalysis(null);
        else setPdfAnalysis(null);
        return;
      }
      setPdfName(file.name);

      // POINT 16/18/20 — le produit n'est PAS construit sur un objet vide :
      // le TEMPLATE MAÎTRE est la base, et le PDF n'écrase que les champs
      // qu'il contient réellement. Sans cela, une section absente du PDF
      // disparaissait de la page et le produit se réduisait à son nom.
      //
      // Réanalyse d'un produit EXISTANT : la base reste ce produit, jamais le
      // template maître — sinon ses valeurs propres seraient écrasées par
      // celles d'un autre produit, ce que la mission interdit explicitement.
      const built = existing
        ? await buildProductFromMasterTemplate(parsed, async () => existing)
        : await buildProductFromMasterTemplate(parsed, getProductBySlug);

      if (existing) {
        setPdfReanalysis(built);
      } else {
        setPdfAnalysis(built);
        // Le nom pré-rempli vient du PDF, PAS du produit construit. `built`
        // fusionne le template maître, et sa ligne 239 fait
        // `overlay.name || master.name` : quand le parser n'a rien lu, c'est
        // donc le nom du gabarit — la page Démo — qui atterrissait dans le
        // champ, puis dans le slug du brouillon créé. Un produit ne doit
        // jamais hériter de l'identité du template qui sert à le générer.
        if (!cleanName && parsed.name) setName(parsed.name);
      }
    } catch {
      toast.error('Échec de l’analyse du PDF.');
    } finally {
      setAnalyzing(false);
    }
  };

  const create = async () => {
    if (!nameValid) {
      toast.error(`Saisissez un nom de produit (${MAX_PRODUCT_NAME_LENGTH} caractères max).`);
      return;
    }
    setSaving(true);
    try {
      const product = await createProduct({
        ...(pdfAnalysis ?? {}),
        name: cleanName,
        slug,
        status: 'draft',
        order: 0,
        environmentCategoryIds,
        applicationCategoryIds,
        categoryIds,
      });

      // On enchaîne sur la version la plus récente du document à chaque étape.
      let attached = product;
      const warnings: string[] = [];

      // 1. Image principale — rôle inchangé (photos du produit).
      if (photoFile) {
        try {
          const upload = await uploadProductPhoto(attached.slug, photoFile);
          const photos = [
            {
              name: upload.name,
              url: upload.url,
              path: upload.path,
              size: upload.size,
              type: 'image' as const,
            },
            ...(pdfAnalysis?.media?.photos ?? []),
          ];
          attached = await saveProduct(attached.slug, { media: { photos } });
        } catch {
          warnings.push('la photo principale n’a pas pu être téléversée');
        }
      }

      // 2. Image au survol — exécuté dans TOUS les chemins de création
      //    (avec ou sans photo principale, même si l'upload photo a échoué).
      //    L'ancien `return` dans la branche photo court-circuait cette étape.
      if (hoverFile) {
        try {
          const { url } = await uploadProductHoverImage(attached.slug, hoverFile);
          attached = await saveProduct(attached.slug, {
            hero: { ...(attached.hero ?? {}), hoverImage: url },
          });
        } catch {
          warnings.push('l’image au survol n’a pas pu être téléversée');
        }
      }

      if (warnings.length > 0) {
        toast.warning(
          `Produit « ${attached.name} » créé (brouillon), mais ${warnings.join(' et ')} (vous pourrez les ajouter plus tard).`
        );
      } else {
        toast.success(`Produit « ${attached.name} » créé (brouillon).`);
      }
      await onCreated(attached);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const save = async (nextStatus?: Product['status']) => {
    if (!existing) return;
    if (!nameValid) {
      toast.error('Le nom doit faire 1 à 12 caractères.');
      return;
    }
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        name: cleanName,
        status: nextStatus || status,
        environmentCategoryIds,
        applicationCategoryIds,
        categoryIds,
      };
      if (pdfReanalysis) Object.assign(body, pdfReanalysis);
      // La galerie est l'état local de référence. La réanalyse a été construite
      // sur le produit tel qu'il était À L'OUVERTURE de l'éditeur : sans cette
      // ligne, enregistrer une réanalyse annulait silencieusement les photos
      // ajoutées, remplacées ou promues depuis.
      if (pdfReanalysis && existing) {
        body.media = { ...pdfReanalysis.media, photos: mediaPhotos };
      }
      // Liens boutique : racine du produit, donc hors du `specs` reconstruit
      // par la réanalyse. Seules les URL valides sont persistées — une saisie
      // erronée ne se transformera jamais en lien mort sur le site.
      const cleanShopLinks = sanitizeShopLinks(shopLinks);
      if (Object.keys(cleanShopLinks).length > 0) {
        body.shopLinks = cleanShopLinks;
      } else if (existing?.shopLinks) {
        // Plus aucun lien valide : on efface la map pour ne pas laisser une
        // dernière saisie invalide survivre dans le produit.
        body.shopLinks = {};
      }
      const next = await saveProduct(existing.slug, body);
      onSaved(next.status === 'published' ? `Produit « ${next.name} » publié.` : `Produit « ${next.name} » enregistré.`);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const headerTitle = isNew ? 'Nouveau produit' : `Éditer — ${existing.name}`;
  const headerSubtitle = isNew
    ? 'Créez une fiche produit à partir d’un PDF technique.'
    : 'Vérifiez les données extraites avant publication.';

  return (
    <div className="space-y-6">
      {/* Bandeau titre backoffice */}
      <div className={`bg-[#0A0D0E] border border-neutral-800 rounded-3xl p-5 sm:p-6 text-white ${BACKOFFICE_HEADER}`}>
        <div className="flex items-center gap-4 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="w-10 h-10 rounded-2xl bg-[#141B1E] border border-neutral-700 hover:border-neutral-500 flex items-center justify-center shrink-0 transition-colors cursor-pointer"
            title="Retour à la liste"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-300" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold tracking-tight truncate">{headerTitle}</h1>
              <span className="text-[10px] font-mono font-extrabold bg-[#38E044] text-black px-2.5 py-0.5 rounded-full shadow-[0_0_10px_rgba(56,224,68,0.4)]">
                BACKOFFICE
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-1 truncate">{headerSubtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          {existing && existing.status === 'published' && (
            <a
              href={`/web/product/${existing.slug}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 text-white text-xs font-bold border border-white/10 transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#38E044]" />
              <span>Voir la page</span>
            </a>
          )}
          {existing && existing.status !== 'published' && (
            <span className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              Visible sur le site après publication
            </span>
          )}
          {isNew ? (
            <button
              type="button"
              onClick={() => void create()}
              disabled={saving || !nameValid}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#38E044] hover:bg-[#2fcb3c] text-black text-xs font-extrabold transition-all cursor-pointer shadow-[0_0_16px_rgba(56,224,68,0.35)] active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              <span>{saving ? 'Création…' : 'Créer le produit'}</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => void save(status === 'published' ? 'draft' : 'published')}
                disabled={saving || uploading}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#38E044] hover:bg-[#2fcb3c] text-black text-xs font-extrabold transition-all cursor-pointer shadow-[0_0_16px_rgba(56,224,68,0.35)] active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
              >
                {saving && !uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : status === 'published' ? (
                  <Eye className="w-4 h-4" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                <span>
                  {saving && !uploading
                    ? 'Enregistrement…'
                    : status === 'published'
                      ? 'Repasser en brouillon'
                      : 'Publier le produit'}
                </span>
              </button>
              <button
                type="button"
                onClick={() => void save()}
                disabled={saving || uploading}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 text-white text-xs font-bold border border-white/10 transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
              >
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5 text-[#38E044]" />
                )}
                <span>{uploading ? 'Photo…' : 'Enregistrer'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Carte principale */}
      <div className="bg-white dark:bg-zinc-900 border border-neutral-200/80 dark:border-white/10 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-5 sm:p-6 space-y-8">
          {isNew ? (
            <>
              {/* 1 · NOM */}
              <section>
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-[#38E044] text-black text-[11px] font-black font-mono shrink-0">1</div>
                  <h2 className="text-sm font-bold text-neutral-900 dark:text-white">Le nom du produit</h2>
                  <span className="text-[11px] text-neutral-400 font-medium">({MAX_PRODUCT_NAME_LENGTH} caractères max)</span>
                </div>
                <input
                  type="text"
                  maxLength={MAX_PRODUCT_NAME_LENGTH}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ex. PXT Series"
                  autoFocus
                  className="mt-3 w-full max-w-md px-4 py-3 bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10 rounded-xl text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-[#38E044]/50 outline-none transition-all"
                />
                <div className="mt-1.5 flex items-center justify-between max-w-md">
                  <span className="text-[11px] font-semibold text-neutral-400">
                    {name.length}/{MAX_PRODUCT_NAME_LENGTH}
                  </span>
                  {name.length > MAX_PRODUCT_NAME_LENGTH && (
                    <span className="text-[11px] font-bold text-rose-500">Trop long : réduisez le nom.</span>
                  )}
                </div>
                <DerivedSlugHint name={cleanNameForSlugHints(cleanName, isNew, existing)} />
              </section>

              {/* 2 · PHOTO */}
              <section>
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-[#38E044] text-black text-[11px] font-black font-mono shrink-0">2</div>
                  <h2 className="text-sm font-bold text-neutral-900 dark:text-white">La photo du produit</h2>
                  <span className="text-[11px] text-neutral-400 font-medium">(optionnelle — ajustée ensuite à la direction artistique)</span>
                </div>
                <div className="mt-3 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="w-24 h-24 rounded-2xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-white/[0.03] flex items-center justify-center overflow-hidden shrink-0">
                    {previewUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={previewUrl} alt="Aperçu de la photo" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-neutral-300" />
                    )}
                  </div>
                  <div className="flex-1 w-full">
                    <UploadZone
                      label="Glissez la photo ici ou cliquez pour choisir"
                      hint="JPG ou PNG recommandé"
                      onFile={(file) => file && setNewPhoto(file)}
                      inputRef={photoInputRef}
                    />
                  </div>
                </div>
                {photoFile && (
                  <div className="mt-3 flex items-center gap-2 text-[11px] text-neutral-500">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="font-semibold">{photoFile.name}</span> en attente — téléversée à la création.
                    <button
                      type="button"
                      onClick={clearNewPhoto}
                      className="ml-1 flex items-center gap-1 text-rose-500 hover:text-rose-700 font-bold transition-colors cursor-pointer"
                    >
                      <X className="w-3 h-3" /> Retirer
                    </button>
                  </div>
                )}
              </section>

              {/* 3 · IMAGE AU SURVOL */}
              <section>
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-[#38E044] text-black text-[11px] font-black font-mono shrink-0">3</div>
                  <h2 className="text-sm font-bold text-neutral-900 dark:text-white">L&apos;image au survol</h2>
                  <span className="text-[11px] text-neutral-400 font-medium">
                    (optionnelle — affichée au survol dans « Tous les produits »)
                  </span>
                </div>
                <div className="mt-3 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="w-24 h-24 rounded-2xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-white/[0.03] flex items-center justify-center overflow-hidden shrink-0">
                    {hoverSrc ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={hoverSrc} alt="Aperçu image au survol" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-neutral-300" />
                    )}
                  </div>
                  <div className="flex-1 w-full">
                    <UploadZone
                      label="Glissez l’image au survol ici ou cliquez pour choisir"
                      hint="Remplace l’image principale au survol — ne la remplace pas"
                      onFile={(file) => file && setNewHoverPhoto(file)}
                      inputRef={hoverInputRef}
                    />
                  </div>
                </div>
                {hoverFile && (
                  <div className="mt-3 flex items-center gap-2 text-[11px] text-neutral-500">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="font-semibold">{hoverFile.name}</span> en attente — enregistrée dans
                    <code className="font-mono text-[10px] px-1 rounded bg-neutral-100 dark:bg-white/10">hero.hoverImage</code>
                    à la création.
                    <button
                      type="button"
                      onClick={clearNewHover}
                      className="ml-1 flex items-center gap-1 text-rose-500 hover:text-rose-700 font-bold transition-colors cursor-pointer"
                    >
                      <X className="w-3 h-3" /> Retirer
                    </button>
                  </div>
                )}
              </section>

              {/* 4 · PDF technique */}
              <section>
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-[#38E044] text-black text-[11px] font-black font-mono shrink-0">4</div>
                  <h2 className="text-sm font-bold text-neutral-900 dark:text-white">La fiche technique (PDF)</h2>
                  <span className="text-[11px] text-neutral-400 font-medium">(optionnelle — remplit automatiquement la fiche)</span>
                </div>
                <div className="mt-3">
                  <UploadZone
                    label="Glissez le PDF ici ou cliquez pour choisir"
                    hint="Fiche technique au format PixiaTech"
                    acceptsPdf
                    onFile={(file) => file && void analyzePdf(file)}
                    inputRef={pdfInputRef}
                    disabled={analyzing}
                  />
                  {analyzing && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-neutral-500 font-semibold">
                      <Loader2 className="w-4 h-4 animate-spin text-[#38E044]" />
                      Analyse du PDF en cours…
                    </div>
                  )}
                  {pdfAnalysis && !analyzing && (
                    <div className="mt-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-2">
                        <FileCheck className="w-4 h-4" />
                        {pdfName ? `Fiche technique analysée : ${pdfName}` : 'Données extraites'}
                      </div>
                      <SummaryGrid summary={summary} />
                      <ImportDiagnosticsPanel items={diagnostics} />
                    </div>
                  )}
                </div>
              </section>
            </>
          ) : (
            <>
              {/* ÉDITION : nom + statut + photo + données extraites */}
              <section>
                <h2 className="text-sm font-bold text-neutral-900 dark:text-white mb-1.5">Nom du produit</h2>
                <input
                  type="text"
                  maxLength={MAX_PRODUCT_NAME_LENGTH}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full max-w-md px-4 py-3 bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10 rounded-xl text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-[#38E044]/50 outline-none transition-all"
                />
                <div className="mt-1.5 flex items-center justify-between max-w-md">
                  <span className="text-[11px] font-semibold text-neutral-400">
                    {name.length}/{MAX_PRODUCT_NAME_LENGTH}
                  </span>
                  {name.length > MAX_PRODUCT_NAME_LENGTH && (
                    <span className="text-[11px] font-bold text-rose-500">Trop long : réduisez le nom.</span>
                  )}
                </div>
                <DerivedSlugHint name={existing.slug} />
              </section>

              <section>
                <h2 className="text-sm font-bold text-neutral-900 dark:text-white mb-1.5">Statut</h2>
                <div className="flex items-center gap-2">
                  {(['draft', 'published'] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStatus(s)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                        status === s
                          ? s === 'published'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-amber-500 text-white border-amber-500 shadow-sm'
                          : 'bg-white dark:bg-zinc-800 text-neutral-600 dark:text-neutral-300 border-neutral-300 dark:border-white/10 hover:bg-neutral-50'
                      }`}
                    >
                      {s === 'published' ? 'Publié' : 'Brouillon'}
                    </button>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-sm font-bold text-neutral-900 dark:text-white mb-1.5">Photo principale</h2>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 rounded-2xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-white/[0.03] flex items-center justify-center overflow-hidden shrink-0">
                    {photoPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={photoPreview} alt={existing.name} className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-neutral-300" />
                    )}
                  </div>
                  <div className="flex-1 w-full">
                    <UploadZone
                      label="Remplacer la photo (glisser-déposer ou cliquer)"
                      hint="JPG ou PNG recommandé"
                      onFile={(file) => file && void replaceExistingPhoto(file)}
                      inputRef={photoInputRef}
                      disabled={uploading}
                    />
                  </div>
                </div>
              </section>

              {/* ── Bibliothèque média (POINTS 7-10) ──────────────────────────
                  Chaque image est éditable, supprimable et promovable
                  indépendamment. La 1re vignette est la photo principale. */}
              <section>
                <div className="flex items-center justify-between gap-3 mb-1.5">
                  <h2 className="text-sm font-bold text-neutral-900 dark:text-white">Bibliothèque média</h2>
                  <span className="text-[10px] font-mono font-bold bg-neutral-100 dark:bg-white/5 text-neutral-600 dark:text-neutral-400 px-2 py-0.5 rounded-full border border-neutral-200 dark:border-white/10 uppercase tracking-wider">
                    {mediaPhotos.length} image{mediaPhotos.length > 1 ? 's' : ''}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mb-3 leading-relaxed">
                  La première image sert de photo principale. Remplacez, supprimez ou
                  repositionnez chaque image sans toucher aux autres.
                </p>
                {mediaPhotos.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-neutral-200 dark:border-white/10 px-4 py-6 text-center text-xs text-neutral-400 dark:text-neutral-500">
                    Aucune image. Utilisez « Photo principale » pour en ajouter une.
                  </div>
                ) : (
                  <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {mediaPhotos.map((photo, index) => (
                      <li
                        key={photo.path || photo.url || index}
                        className="group relative rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-white/[0.03] overflow-hidden"
                      >
                        <div className="aspect-square w-full bg-neutral-50 dark:bg-black/20 flex items-center justify-center">
                          {photo.url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={photo.url}
                              alt={photo.name || `Image ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ImageIcon className="w-6 h-6 text-neutral-300" />
                          )}
                        </div>
                        {index === 0 && (
                          <span className="absolute top-1.5 left-1.5 text-[9px] font-mono font-bold bg-neutral-900 text-white px-1.5 py-0.5 rounded uppercase tracking-wider">
                            Principale
                          </span>
                        )}
                        {busyPhotoIndex === index && (
                          <div className="absolute inset-0 bg-white/70 dark:bg-black/60 flex items-center justify-center">
                            <Loader2 className="w-5 h-5 animate-spin text-neutral-500 dark:text-white" />
                          </div>
                        )}
                        <div className="p-1.5 flex items-center gap-1 border-t border-neutral-200 dark:border-white/10">
                          {index !== 0 && (
                            <button
                              type="button"
                              title="Définir comme photo principale"
                              aria-label={`Définir l'image ${index + 1} comme photo principale`}
                              disabled={busyPhotoIndex === index}
                              onClick={() => void promotePhotoAt(index)}
                              className="flex-1 h-7 inline-flex items-center justify-center gap-1 rounded-md text-[10px] font-bold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/10 disabled:opacity-50"
                            >
                              <StarIcon className="w-3 h-3" />
                              Principale
                            </button>
                          )}
                          <button
                            type="button"
                            title="Remplacer cette image"
                            aria-label={`Remplacer l'image ${index + 1}`}
                            disabled={busyPhotoIndex === index}
                            onClick={() => photoInputRefs.current[index]?.click()}
                            className="flex-1 h-7 inline-flex items-center justify-center gap-1 rounded-md text-[10px] font-bold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/10 disabled:opacity-50"
                          >
                            <ImageIcon className="w-3 h-3" />
                            Remplacer
                          </button>
                          <button
                            type="button"
                            title="Supprimer définitivement"
                            aria-label={`Supprimer définitivement l'image ${index + 1}`}
                            disabled={busyPhotoIndex === index}
                            onClick={() => void removePhotoAt(index)}
                            className="w-7 h-7 inline-flex items-center justify-center rounded-md text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 disabled:opacity-50"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                {/* Une entrée cachée par image : le bouton « Remplacer » de la
                    vignette i vise la photo i, jamais « la première ». */}
                {mediaPhotos.map((photo, index) => (
                  <input
                    key={`up-${photo.path || photo.url || index}`}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={(el) => {
                      photoInputRefs.current[index] = el;
                    }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      e.target.value = '';
                      if (file) void replacePhotoAt(index, file);
                    }}
                  />
                ))}
              </section>

              {/* ── Image au survol (hero.hoverImage) ── */}
              <section className="rounded-2xl border border-dashed border-neutral-200 dark:border-white/10 p-4 bg-neutral-50/50 dark:bg-white/[0.02]">
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="text-sm font-bold text-neutral-900 dark:text-white">Image au survol</h2>
                  <span className="text-[10px] font-mono font-bold bg-sky-100 dark:bg-sky-500/15 text-sky-700 dark:text-sky-400 px-2 py-0.5 rounded-full border border-sky-200 dark:border-sky-500/30 uppercase tracking-wider">
                    Hover · Tous les produits uniquement
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mb-3 leading-relaxed">
                  Affichée uniquement au survol dans la page <strong>Tous les produits</strong>.
                  La photo principale reste inchangée partout ailleurs (méga menu, fiche produit, etc.).
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 rounded-2xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-white/[0.03] flex items-center justify-center overflow-hidden shrink-0">
                    {hoverPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={hoverPreview} alt="Aperçu image survol" className="w-full h-full object-contain p-1" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-neutral-200 dark:text-neutral-700" />
                    )}
                  </div>
                  <div className="flex-1 w-full space-y-2">
                    <UploadZone
                      label="Image au survol (glisser-déposer ou cliquer)"
                      hint="JPG ou PNG — remplace l'image principale au hover"
                      onFile={(file) => file && void uploadHoverImage(file)}
                      inputRef={hoverInputRef}
                      disabled={hoverUploading}
                    />
                    {hoverUploading && (
                      <div className="flex items-center gap-2 text-xs text-neutral-500 font-semibold">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-500" />
                        Téléversement en cours…
                      </div>
                    )}
                    {hoverPreview && !hoverUploading && (
                      <button
                        type="button"
                        onClick={() => void removeHoverImage()}
                        className="flex items-center gap-1.5 text-[11px] text-rose-500 hover:text-rose-700 font-bold transition-colors cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                        Retirer l'image au survol
                      </button>
                    )}
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-sm font-bold text-neutral-900 dark:text-white mb-1.5">
                  Fiche technique (PDF)
                </h2>
                <p className="text-[11px] text-neutral-400 mb-3">
                  Réanalysez un PDF pour mettre à jour les données techniques, puis « Enregistrer ».
                </p>
                <UploadZone
                  label="Remplacer la fiche technique (glisser-déposer ou cliquer)"
                  hint="Fiche technique au format PixiaTech"
                  acceptsPdf
                  onFile={(file) => file && void analyzePdf(file)}
                  inputRef={pdfInputRef}
                  disabled={analyzing}
                />
                {analyzing && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-neutral-500 font-semibold">
                    <Loader2 className="w-4 h-4 animate-spin text-[#38E044]" />
                    Analyse du PDF en cours…
                  </div>
                )}
                {pdfReanalysis && !analyzing && (
                  <div className="mt-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-2">
                      <FileCheck className="w-4 h-4" />
                      <span className="truncate">Nouvelle analyse prête : {pdfName}</span>
                      <button
                        type="button"
                        onClick={() => setPdfReanalysis(null)}
                        className="ml-auto flex items-center gap-1 text-rose-500 hover:text-rose-700 font-bold transition-colors cursor-pointer shrink-0"
                      >
                        <X className="w-3 h-3" /> Retirer
                      </button>
                    </div>
                    <SummaryGrid summary={summary} />
                    <ImportDiagnosticsPanel items={diagnostics} />
                    <p className="mt-2 text-[11px] font-semibold text-neutral-400">
                      Ces données remplaceront les données techniques actuelles à l’enregistrement.
                    </p>
                  </div>
                )}
              </section>

              {!pdfReanalysis && summary.length > 0 && (
                <section>
                  <h2 className="text-sm font-bold text-neutral-900 dark:text-white mb-1.5">
                    Données extraites de la fiche technique
                  </h2>
                  <p className="text-[11px] text-neutral-400 mb-3">
                    Informations à vérifier avant publication.
                  </p>
                  <SummaryGrid summary={summary} />
                  <ImportDiagnosticsPanel items={diagnostics} />
                </section>
              )}
            </>
          )}

          {/* ── Liens boutique par variante ──
              CE BLOC EST UN CONTRÔLE D'ÉDITION, PAS LE BOUTON PUBLIC.

              Il est conditionné à l'EXISTENCE DES VARIANTES du matrice, jamais
              à l'existence d'un lien. Le gate est donc volontairement
              `!isNew && variantNames.length > 0`, et il ne doit surtout pas
              devenir `&& Object.keys(shopLinks).length > 0` : sinon
              l'administrateur ne pourrait plus saisir le PREMIER lien, puisque
              le contrôle disparaîtrait justement quand il n'y en a pas encore.

              Symétrie voulue :
                - EDITION, sans lien  -> champ affiché, vide, saisissable.
                - EDITION, avec lien  -> champ affiché, URL pré-remplie.
                - PUBLIC, sans lien   -> aucun bouton.
                - PUBLIC, avec lien  -> bouton « Acheter le produit ».

              « Masqué publiquement » ne signifie pas « inexistant dans le CMS ». */}
          {!isNew && variantNames.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <h2 className="text-sm font-bold text-neutral-900 dark:text-white">
                  Liens boutique par variante
                </h2>
                <span className="text-[11px] text-neutral-400 font-medium">
                  {variantNames.length} variante{variantNames.length > 1 ? 's' : ''}
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 mb-3">
                Une colonne par variante, comme la matrice du site. Chaque contrôle
                est rattaché à sa colonne et alimente le bouton
                «&nbsp;Acheter le produit&nbsp;» de cette seule variante. Le champ
                reste vide tant qu&apos;aucun lien n&apos;est saisi, et le bouton
                n&apos;apparaît alors pas. Renseignez une URL pour l&apos;afficher,
                videz-la pour le retirer.
              </p>

              {/* Une colonne par variante, comme la matrice publique.
                  La colonne est rendue par `variantNames.map`, donc le contrôle
                  vit DANS la colonne de son propre nom : impossible qu'il soit
                  lu comme appartenant à la variante voisine. Une variante = un
                  contrôle, il n'y a pas de second rendu global plus bas.
                  Débordement horizontal + largeur fixe : les colonnes restent
                  alignées quand la liste défile, et la colonne d'en-tête de
                  gauche reste visible (sticky) pour situer la ligne. */}
              <div className="overflow-x-auto rounded-2xl border border-neutral-300 dark:border-white/10">
                <div className="flex min-w-max">
                  {/* Colonne de tête : elle nomme la ligne, pas une variante. */}
                  <div className="sticky left-0 z-10 shrink-0 w-[220px] bg-white dark:bg-[#0A0D0E] border-r border-neutral-300 dark:border-white/10 p-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                      Variante
                    </p>
                    <p className="mt-1 text-[10px] leading-snug text-neutral-400 dark:text-neutral-500">
                      Un contrôle par colonne. Champ vide = aucun bouton sur le
                      site.
                    </p>
                  </div>

                  {variantNames.map((variantName) => {
                    const raw = shopLinks[variantName] ?? '';
                    const blank = raw.trim() === '';
                    const valid = !blank && isValidShopUrl(raw);
                    return (
                      <div
                        key={variantName}
                        className="shrink-0 w-[300px] p-3 border-l border-neutral-300 dark:border-white/10"
                      >
                        {/* En-tête de colonne : le nom EXACT de la variante,
                            repris tel quel de la matrice. */}
                        <p
                          className="text-[12px] font-bold text-neutral-900 dark:text-white break-words"
                          title={variantName}
                        >
                          {variantName}
                        </p>
                        <p className="mt-0.5 mb-2 text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                          Acheter le produit
                        </p>

                        <div className="flex items-center gap-2">
                          <input
                            type="url"
                            inputMode="url"
                            autoComplete="off"
                            aria-label={`Lien boutique — ${variantName}`}
                            value={raw}
                            onChange={(ev) =>
                              setShopLinks((prev) => ({ ...prev, [variantName]: ev.target.value }))
                            }
                            placeholder="https://boutique…"
                            aria-invalid={!blank && !valid}
                            className="flex-1 min-w-0 px-3 py-1.5 rounded-xl text-[11px] font-semibold bg-white dark:bg-zinc-800 text-neutral-900 dark:text-white border border-neutral-300 dark:border-white/10 focus:ring-2 focus:ring-[#38E044]/40 outline-none transition-all"
                          />
                          {valid && (
                            <a
                              href={normalizeShopUrl(raw)}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Ouvrir le lien dans un nouvel onglet"
                              className="shrink-0 w-8 h-8 rounded-xl inline-flex items-center justify-center border border-neutral-300 dark:border-white/10 text-neutral-500 dark:text-neutral-300 hover:text-[#38E044] hover:border-[#38E044]/60 transition-colors"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                          {!blank && (
                            <button
                              type="button"
                              title="Retirer le lien"
                              onClick={() =>
                                setShopLinks((prev) => ({ ...prev, [variantName]: '' }))
                              }
                              className="shrink-0 w-8 h-8 rounded-xl inline-flex items-center justify-center border border-neutral-300 dark:border-white/10 text-neutral-500 dark:text-neutral-300 hover:text-rose-500 hover:border-rose-500/60 transition-colors cursor-pointer"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                        {!blank && !valid && (
                          <p className="mt-1 text-[11px] font-semibold text-rose-500">
                            Lien ignoré : saisissez une URL complète (https://…) ou un
                            chemin interne (/boutique).
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {orphanShopLinkKeys.length > 0 && (
                <div className="mt-4 rounded-2xl border border-amber-300/60 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/5 p-3">
                  <p className="text-[11px] font-bold text-amber-800 dark:text-amber-300 mb-2">
                    {orphanShopLinkKeys.length} lien
                    {orphanShopLinkKeys.length > 1 ? 's' : ''} sans variante correspondante
                  </p>
                  <div className="space-y-2">
                    {orphanShopLinkKeys.map((key) => (
                      <div key={key} className="flex items-center gap-2">
                        <span className="flex-1 min-w-0 truncate text-[11px] font-semibold text-neutral-600 dark:text-neutral-300">
                          {key} — {shopLinks[key] || '(vide)'}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setShopLinks((prev) => {
                              const next = { ...prev };
                              delete next[key];
                              return next;
                            })
                          }
                          className="shrink-0 px-2 py-1 rounded-lg text-[10px] font-bold border border-neutral-300 dark:border-white/10 text-neutral-600 dark:text-neutral-200 hover:text-rose-500 hover:border-rose-500/60 transition-colors cursor-pointer"
                        >
                          Supprimer
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* ── Catégories (taxonomie CMS) ── */}
          <section>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <h2 className="text-sm font-bold text-neutral-900 dark:text-white">Catégories</h2>
              <span className="text-[11px] text-neutral-400 font-medium">
                Filtres de la page « Tous les produits »
              </span>
              <a
                href="/admin/site-web/categories"
                className="inline-flex items-center gap-1.5 ml-auto px-3 py-1.5 rounded-xl text-[11px] font-bold border border-neutral-300 dark:border-white/10 text-neutral-700 dark:text-neutral-200 hover:border-[#38E044]/60 hover:text-[#38E044] transition-colors"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Gérer les filtres (renommer / supprimer)
              </a>
            </div>
            {categories.length === 0 ? (
              <p className="text-[11px] text-neutral-400">
                Chargement des catégories… Si aucune n’apparaît, créez-en dans le
                menu <strong>Site Web → Catégories</strong>.
              </p>
            ) : (
              <div className="space-y-4">
                {[...groups]
                  .sort((a, b) => {
                    const oa = typeof a.order === 'number' ? a.order : Number.MAX_SAFE_INTEGER;
                    const ob = typeof b.order === 'number' ? b.order : Number.MAX_SAFE_INTEGER;
                    return oa - ob;
                  })
                  .map((group) => {
                    const type = group.key;
                    const list = categories.filter((c) => c.type === type && c.active);
                    const selected = selByGroup[type] ?? [];
                    const label = groupDisplayName(group, 'FR');
                    return (
                      <div key={group.id}>
                        <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-2 flex items-center gap-2 flex-wrap">
                          <span>{label}</span>
                          {list.length > 0 && <span className="text-neutral-400">({list.length})</span>}
                          {!group.active && (
                            <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-white/10 text-neutral-500 dark:text-neutral-300">
                              inactif
                            </span>
                          )}
                        </div>
                        {list.length === 0 ? (
                          <p className="text-[11px] text-neutral-400 italic">Aucune catégorie active.</p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {list.map((c) => {
                              const on = selected.includes(c.id);
                              return (
                                <button
                                  key={c.id}
                                  type="button"
                                  onClick={() => toggleSel(type, c.id)}
                                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer border ${
                                    on
                                      ? 'bg-[#38E044] text-black border-[#38E044] shadow-[0_0_12px_rgba(56,224,68,0.25)]'
                                      : 'bg-white dark:bg-zinc-800 text-neutral-700 dark:text-neutral-200 border-neutral-300 dark:border-white/10 hover:border-neutral-400'
                                  }`}
                                >
                                  {on ? '✓ ' : ''}
                                  {c.name}
                                </button>
                              );
                            })}
                          </div>
                        )}
                        <div className="mt-2">
                          {addingGroup === type ? (
                            <div className="flex items-center gap-2">
                              <input
                                autoFocus
                                value={newFilterName}
                                onChange={(ev) => setNewFilterName(ev.target.value)}
                                onKeyDown={(ev) => {
                                  if (ev.key === 'Enter') {
                                    ev.preventDefault();
                                    void addFilter(type, newFilterName);
                                  }
                                }}
                                placeholder={`Nouveau filtre ${label}…`}
                                className="w-56 px-3 py-1.5 rounded-xl text-[11px] font-semibold bg-white dark:bg-zinc-800 text-neutral-900 dark:text-white border border-neutral-300 dark:border-white/10 focus:ring-2 focus:ring-[#38E044]/40 outline-none transition-all"
                              />
                              <button
                                type="button"
                                onClick={() => void addFilter(type, newFilterName)}
                                disabled={categorySaving}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-black bg-[#38E044] text-black hover:bg-[#4af257] transition-colors disabled:opacity-50 cursor-pointer"
                              >
                                {categorySaving ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Check className="h-3.5 w-3.5" />
                                )}
                                Ajouter
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setAddingGroup(null);
                                  setNewFilterName('');
                                }}
                                className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white px-2 py-1.5 transition-colors cursor-pointer"
                              >
                                Annuler
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setAddingGroup(type);
                                setNewFilterName('');
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-bold text-neutral-500 dark:text-neutral-400 border border-dashed border-neutral-300 dark:border-white/15 hover:text-[#38E044] hover:border-[#38E044]/60 transition-colors cursor-pointer"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              Ajouter un filtre {label}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function cleanNameForSlugHints(cleanName: string, isNew: boolean, existing: Product | null): string {
  return isNew ? cleanName : existing?.slug || '';
}

/* ---------------------------------------------------------------------------
 * Sous-composants
 * ------------------------------------------------------------------------- */

function UploadZone({
  label,
  hint,
  onFile,
  inputRef,
  acceptsPdf,
  disabled,
}: {
  label: string;
  hint?: string;
  onFile: (file: File | null) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  acceptsPdf?: boolean;
  disabled?: boolean;
}) {
  const [dragOver, setDragOver] = useState(false);

  const pickFile = (files: FileList | null) => {
    const file = files?.[0] || null;
    if (!file) return;
    onFile(file);
  };

  return (
    <label
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        if (disabled) return;
        pickFile(e.dataTransfer.files);
      }}
      className={`flex flex-col items-center justify-center gap-1.5 px-4 py-6 rounded-2xl border-2 border-dashed cursor-pointer transition-all text-center select-none ${
        dragOver
          ? 'border-[#38E044] bg-emerald-50 dark:bg-emerald-500/10'
          : 'border-neutral-300 dark:border-white/15 hover:border-[#38E044]/60 hover:bg-neutral-50 dark:hover:bg-white/[0.03]'
      } ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
    >
      {acceptsPdf ? (
        <FileUp className={`w-6 h-6 ${dragOver ? 'text-[#38E044]' : 'text-neutral-400'}`} />
      ) : (
        <Upload className={`w-6 h-6 ${dragOver ? 'text-[#38E044]' : 'text-neutral-400'}`} />
      )}
      <span className="text-xs font-bold text-neutral-700 dark:text-neutral-200">{label}</span>
      {hint && <span className="text-[11px] text-neutral-400">{hint}</span>}
      <input
        ref={inputRef}
        type="file"
        accept={acceptsPdf ? 'application/pdf,.pdf' : 'image/*'}
        className="hidden"
        onChange={(e) => {
          pickFile(e.target.files);
          e.target.value = '';
        }}
      />
    </label>
  );
}

function SummaryGrid({ summary }: { summary: { label: string; value: string }[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
      {summary.map((row) => (
        <div
          key={row.label}
          className="flex items-start gap-2.5 p-3 rounded-xl bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200/70 dark:border-white/[0.06]"
        >
          <CheckCircle2 className="w-4 h-4 text-[#2fcb3c] mt-0.5 shrink-0" />
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">{row.label}</div>
            <div className="text-xs font-semibold text-neutral-800 dark:text-neutral-100 truncate" title={row.value}>
              {row.value}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
