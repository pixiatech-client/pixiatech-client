'use client';

import React, { useEffect, useRef, useState } from 'react';
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
  FileUp,
  FileCheck,
  X,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { parseProductPdf } from '@/lib/products/product-pdf-parser';
import { uploadProductPhoto } from '@/lib/products/products-service';
import { slugify, MAX_PRODUCT_NAME_LENGTH } from '@/lib/products/types';
import type { Product } from '@/lib/products/types';

interface SiteWebProduitsModuleProps {
  initial?: Product[];
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

const STATUS_BADGE: Record<string, string> = {
  published:
    'text-emerald-800 bg-emerald-50 border-emerald-300 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30',
  draft:
    'text-amber-800 bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30',
  deleted:
    'text-neutral-600 bg-neutral-50 border-neutral-200 dark:bg-white/5 dark:text-neutral-400 dark:border-white/10',
};

const STATUS_LABEL: Record<string, string> = {
  published: 'Publié',
  draft: 'Brouillon',
  deleted: 'Archivé',
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

function statusClass(status?: string): string {
  return STATUS_BADGE[status || 'draft'] || STATUS_BADGE.draft;
}

function statusText(status?: string): string {
  return STATUS_LABEL[status || 'draft'] || 'Brouillon';
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

export function SiteWebProduitsModule({ initial }: SiteWebProduitsModuleProps) {
  const [state, setState] = useState<ViewState>({ view: 'list' });
  const [products, setProducts] = useState<Product[]>(initial ?? []);
  const [loading, setLoading] = useState(!initial);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      setProducts(await listProducts());
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initial) void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goEdit = (product: Product) => setState({ view: 'edit', product });

  const deleteProduct = async (product: Product) => {
    if (!window.confirm(`Supprimer le produit « ${product.name} » ? Il disparaîtra de la liste.`)) return;
    setError(null);
    try {
      const res = await fetch(`/api/site-web/products/${encodeURIComponent(product.slug)}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || 'Échec de la suppression.');
      }
      toast.success('Produit supprimé.');
      await refresh();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const duplicateProduct = async (product: Product) => {
    const used = new Set(products.map((p) => p.slug));
    const base = product.name || 'Produit';
    const makeVariantName = (idx: number): string => {
      const suffix = ` ${idx}`;
      if (base.length + suffix.length <= MAX_PRODUCT_NAME_LENGTH) return base + suffix;
      return `${base.slice(0, Math.max(1, MAX_PRODUCT_NAME_LENGTH - suffix.length))}${suffix}`;
    };
    let idx = 2;
    let name = makeVariantName(idx);
    let slug = slugify(name);
    while (used.has(slug)) {
      idx += 1;
      name = makeVariantName(idx);
      slug = slugify(name);
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
      onDelete={deleteProduct}
      onDuplicate={duplicateProduct}
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
}: {
  products: Product[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onNew: () => void;
  onEdit: (p: Product) => void;
  onDelete: (p: Product) => void;
  onDuplicate: (p: Product) => void;
}) {
  const [filter, setFilter] = useState<ProductFilter>('ALL');
  const [query, setQuery] = useState('');

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
                  <th className="p-4">Photo</th>
                  <th className="p-4">Nom</th>
                  <th className="p-4">Statut</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-white/5">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-12">
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
                    return (
                      <tr key={p.slug} className="hover:bg-neutral-50/90 dark:hover:bg-white/[0.02] transition-colors">
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
                          <div className="font-extrabold text-neutral-900 dark:text-white text-xs">{p.name}</div>
                          <div className="text-[11px] text-neutral-400 font-mono mt-0.5">/web/product/{p.slug}</div>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center text-[11px] font-bold px-3 py-1 rounded-full border ${statusClass(p.status)}`}>
                            {statusText(p.status)}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            <a
                              href={`/web/product/${p.slug}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-2 rounded-xl text-neutral-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors cursor-pointer"
                              title="Voir la page publique"
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
                            <button
                              type="button"
                              onClick={() => onDelete(p)}
                              className="p-2 rounded-xl text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
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

  const photoInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const cleanName = name.replace(/\s+/g, ' ').trim();
  const slug = slugify(cleanName);
  const nameValid = cleanName.length > 0 && cleanName.length <= MAX_PRODUCT_NAME_LENGTH;
  const previewUrl = isNew ? photoPreview : undefined;

  const summary = isNew
    ? extractedSummary(
        pdfAnalysis ? { ...pdfAnalysis, name: cleanName || pdfAnalysis.name } : { name: cleanName }
      )
    : extractedSummary(
        pdfReanalysis
          ? { ...pdfReanalysis, name: cleanName || pdfReanalysis.name }
          : existing ?? { name: cleanName }
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
      const photos = [
        {
          name: upload.name,
          url: upload.url,
          path: upload.path,
          size: upload.size,
          type: 'image' as const,
        },
        ...(existing.media?.photos ?? []).filter((m) => m.name !== file.name),
      ];
      await saveProduct(existing.slug, { media: { photos } });
      setPhotoPreview(upload.url);
      setPhotoFile(null);
      toast.success('Photo mise à jour.');
    } catch (err) {
      toast.error((err as Error).message || 'Échec du téléversement de la photo.');
    } finally {
      setUploading(false);
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
      if (existing) {
        setPdfReanalysis(parsed);
      } else {
        setPdfAnalysis(parsed);
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
      });
      if (photoFile) {
        try {
          const upload = await uploadProductPhoto(product.slug, photoFile);
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
          const attached = await saveProduct(product.slug, { media: { photos } });
          toast.success(`Produit « ${attached.name} » créé (brouillon).`);
          await onCreated(attached);
          return;
        } catch {
          toast.warning('Produit créé, mais la photo n’a pas pu être téléversée (vous pourrez l’ajouter plus tard).');
        }
      }
      toast.success(`Produit « ${product.name} » créé (brouillon).`);
      await onCreated(product);
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
      const body: Record<string, unknown> = { name: cleanName, status: nextStatus || status };
      if (pdfReanalysis) Object.assign(body, pdfReanalysis);
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
                  <span className="text-[11px] text-neutral-400 font-medium">(12 caractères max)</span>
                </div>
                <input
                  type="text"
                  maxLength={MAX_PRODUCT_NAME_LENGTH}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ex. WK Series"
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

              {/* 3 · PDF technique */}
              <section>
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-[#38E044] text-black text-[11px] font-black font-mono shrink-0">3</div>
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
                </section>
              )}
            </>
          )}
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