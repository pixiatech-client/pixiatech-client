'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Globe,
  ExternalLink,
  PenSquare,
  RefreshCw,
  Loader2,
  Search,
  FileText,
  X,
  Plus,
  Copy,
  Trash2,
  Pencil,
  Layers,
  Inbox,
  AlertTriangle,
  FileJson,
} from 'lucide-react';
import { useCms } from '@/lib/site-web/cms-context';
import { toast } from 'sonner';

interface StatusInfo {
  online: boolean;
  message: string;
  pagesCount?: number;
  dataFile?: string;
}

interface PageItem {
  id: string;
  name: string;
  slug: string;
  editorPath: string;
  description: string;
  sectionsCount?: number;
  badge?: string;
  isSystem?: boolean;
}

const DEFAULT_PAGES: PageItem[] = [
  {
    id: 'home',
    name: 'Accueil & Showreel',
    slug: '/web',
    editorPath: '/web',
    description: 'Showreel 3D immersif, hero principal, marchés, kinetic, manifeste et contact',
    sectionsCount: 13,
    badge: 'Principale',
    isSystem: true,
  },
  {
    // Conservée dans la liste par défaut (le nom sert de repli au merge) mais
    // retirée du catalogue Admin : ce produit est géré par le module Produits.
    id: 'product_wp',
    name: 'Produit : PXT Fine',
    slug: '/web/pxt-fine',
    editorPath: '/web/pxt-fine',
    description: 'Fiche produit écran LED PXT Fine (Série WP 600×337,5 mm, ColdLED)',
    sectionsCount: 5,
    badge: 'Produit',
  },
  {
    id: 'mentions_legales',
    name: 'Mentions Légales',
    slug: '/mentions-legales',
    editorPath: '/web/mentions-legales',
    description: 'Conditions générales de vente, de services et de location (CGV / CGL), informations société',
    sectionsCount: 14,
    badge: 'Juridique',
  },
  {
    id: 'politique_confidentialite',
    name: 'Politique de Confidentialité',
    slug: '/politique-confidentialite',
    editorPath: '/web/politique-confidentialite',
    description: 'Protection des données personnelles, conformité RGPD, finalités et droits des utilisateurs',
    sectionsCount: 8,
    badge: 'RGPD',
  },
  {
    id: 'gestion_cookies',
    name: 'Gestion des Cookies',
    slug: '/gestion-cookies',
    editorPath: '/web/gestion-cookies',
    description: 'Politique de gestion des traceurs, catégories de cookies et centre de consentement CNIL',
    sectionsCount: 7,
    badge: 'CNIL',
  },
];

/** Familles proposées en filtre, calquées sur les badges du catalogue. */
type PageFilter = 'ALL' | 'system' | 'legal' | 'custom';

const LEGAL_BADGES = ['Juridique', 'RGPD', 'CNIL'];

function matchesFilter(page: PageItem, filter: PageFilter): boolean {
  if (filter === 'ALL') return true;
  if (filter === 'system') return Boolean(page.isSystem);
  if (filter === 'legal') return LEGAL_BADGES.includes(page.badge ?? '');
  return !page.isSystem && !LEGAL_BADGES.includes(page.badge ?? '');
}

export default function SiteWebDashboardPage() {
  const { saveStatus } = useCms();
  const [status, setStatus] = useState<StatusInfo | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [pagesList, setPagesList] = useState<PageItem[]>(DEFAULT_PAGES);
  const [loadingPages, setLoadingPages] = useState<boolean>(true);

  const [filter, setFilter] = useState<PageFilter>('ALL');
  const [query, setQuery] = useState('');

  // Modales
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const [selectedPage, setSelectedPage] = useState<PageItem | null>(null);
  // Confirmation de suppression EN LIGNE (même pattern que le module Produits) :
  // la ligne se couvre au lieu d'afficher une modale.
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Formulaires
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchPages = async () => {
    setError(null);
    try {
      const res = await fetch('/api/site-web/pages');
      if (res.ok) {
        const data = await res.json();
        const serverPages = data?.pages || {};

        const mergedMap = new Map<string, PageItem>();
        DEFAULT_PAGES.forEach((p) => mergedMap.set(p.id, p));

        Object.entries(serverPages).forEach(([id, p]: [string, any]) => {
          const existing = mergedMap.get(id);
          const sections = p.sections || {};
          const count = Object.keys(sections).length;

          const editorUrl = p.slug?.startsWith('/web')
            ? p.slug
            : `/web${p.slug?.startsWith('/') ? p.slug : `/${p.slug}`}`;

          mergedMap.set(id, {
            id,
            name: p.name || existing?.name || id,
            slug: p.slug || existing?.slug || `/${id}`,
            editorPath: editorUrl,
            description:
              p.meta?.description || existing?.description || 'Page gérée par le CMS',
            sectionsCount: count > 0 ? count : existing?.sectionsCount || 1,
            badge: existing?.badge || 'Custom',
            isSystem: existing?.isSystem || false,
          });
        });

        // Le catalogue Admin n'expose QUE les pages réellement éditables.
        // Les entrées ci-dessous restent PUBLIQUES et accessibles — aucune
        // route n'est touchée — mais elles sont gérées par un module dédié,
        // donc les lister ici donnerait l'impression de devoir les tenir à la
        // main en plus de leur module.
        const isSuperseded = (id: string) =>
          id === 'product_wp' || // produit figé, repris par le module Produits
          id === 'contact' || // contact, repris par le module Contact
          id.startsWith('product__') || // gabarits internes de fiche produit
          id.startsWith('_'); // ids auto-générés (ex. `_01`)

        const filtered = Array.from(mergedMap.values()).filter(
          (p) => !isSuperseded(p.id)
        );

        // Une page CMS sans aucune section n'a rien à éditer : on ne la liste pas.
        const cleaned = filtered.filter(
          (p) => p.isSystem || (p.sectionsCount ?? 0) > 0
        );

        setPagesList(cleaned);
      }
    } catch (err) {
      console.warn('[Pages] Fetch error:', err);
      setError('Impossible de charger les pages. Vérifiez la connexion au CMS.');
    } finally {
      setLoadingPages(false);
    }
  };

  const checkStatus = async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/site-web/status');
      if (res.ok) {
        const data = await res.json();
        setStatus({
          online: true,
          message: data?.message || 'API opérationnelle',
          pagesCount: data?.pagesCount,
          dataFile: data?.dataFile,
        });
      } else {
        setStatus({ online: false, message: `Erreur ${res.status}` });
      }
    } catch {
      setStatus({ online: false, message: 'API injoignable' });
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    checkStatus();
    fetchPages();
  }, []);

  const counts = useMemo(
    () => ({
      all: pagesList.length,
      system: pagesList.filter((p) => matchesFilter(p, 'system')).length,
      legal: pagesList.filter((p) => matchesFilter(p, 'legal')).length,
      custom: pagesList.filter((p) => matchesFilter(p, 'custom')).length,
    }),
    [pagesList]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return pagesList.filter((p) => {
      if (!matchesFilter(p, filter)) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        (p.description ?? '').toLowerCase().includes(q)
      );
    });
  }, [pagesList, filter, query]);

  // Action: créer une page
  const handleCreatePage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formSlug.trim()) {
      toast.error('Veuillez renseigner un titre et un slug');
      return;
    }

    setSubmitting(true);
    try {
      const cleanSlug = formSlug.startsWith('/') ? formSlug : `/${formSlug}`;
      const pageId = formSlug.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();

      const newPageData = {
        id: pageId,
        name: formName.trim(),
        slug: cleanSlug,
        updatedAt: new Date().toISOString(),
        meta: {
          title: `${formName} · PIXIATECH`,
          description: formDesc.trim(),
        },
        sections: {
          header: {
            badge: 'PAGE',
            title: formName.trim(),
            description: formDesc.trim(),
          },
        },
      };

      const res = await fetch(`/api/site-web/pages/${pageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPageData),
      });

      if (res.ok) {
        toast.success(`Page « ${formName} » créée avec succès.`);
        setIsCreateOpen(false);
        setFormName('');
        setFormSlug('');
        setFormDesc('');
        await fetchPages();
      } else {
        toast.error('Erreur lors de la création de la page');
      }
    } catch {
      toast.error('Erreur réseau');
    } finally {
      setSubmitting(false);
    }
  };

  // Action: modifier les métadonnées
  const handleOpenEdit = (page: PageItem) => {
    setSelectedPage(page);
    setFormName(page.name);
    setFormSlug(page.slug);
    setFormDesc(page.description);
    setIsEditOpen(true);
  };

  const handleUpdatePage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPage) return;

    setSubmitting(true);
    try {
      const cleanSlug = formSlug.startsWith('/') ? formSlug : `/${formSlug}`;
      const updateData = {
        name: formName.trim(),
        slug: cleanSlug,
        updatedAt: new Date().toISOString(),
        meta: {
          title: `${formName} · PIXIATECH`,
          description: formDesc.trim(),
        },
      };

      const res = await fetch(`/api/site-web/pages/${selectedPage.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (res.ok) {
        toast.success(`Page « ${formName} » mise à jour.`);
        setIsEditOpen(false);
        await fetchPages();
      } else {
        toast.error('Erreur lors de la mise à jour');
      }
    } catch {
      toast.error('Erreur réseau');
    } finally {
      setSubmitting(false);
    }
  };

  // Action: cloner
  const handleClonePage = async (page: PageItem) => {
    const cloneId = `${page.id}_copie_${Date.now().toString().slice(-4)}`;
    const cloneName = `${page.name} (copie)`;
    const cloneSlug = `${page.slug}-copie`;

    toast.loading('Clonage de la page en cours…');
    try {
      const getRes = await fetch(`/api/site-web/pages/${page.id}`);
      let existingData = {};
      if (getRes.ok) {
        const json = await getRes.json();
        existingData = json?.page || {};
      }

      const clonedData = {
        ...existingData,
        id: cloneId,
        name: cloneName,
        slug: cloneSlug,
        updatedAt: new Date().toISOString(),
        meta: {
          title: `${cloneName} · PIXIATECH`,
          description: `Copie de la page ${page.name}`,
        },
      };

      const res = await fetch(`/api/site-web/pages/${cloneId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clonedData),
      });

      toast.dismiss();
      if (res.ok) {
        toast.success(`Page « ${cloneName} » clonée avec succès.`);
        await fetchPages();
      } else {
        toast.error('Échec du clonage');
      }
    } catch {
      toast.dismiss();
      toast.error('Erreur lors du clonage');
    }
  };

  // Action: supprimer — la ligne n'est retirée qu'après réponse du backend.
  const confirmDelete = async (id: string) => {
    if (deleting) return;
    const page = pagesList.find((p) => p.id === id);
    if (!page) {
      setDeletingId(null);
      return;
    }
    if (page.isSystem) {
      toast.error('La page principale ne peut pas être supprimée');
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/site-web/pages/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast.success(`Page « ${page.name} » supprimée.`);
      setDeletingId(null);
      setPagesList((prev) => prev.filter((p) => p.id !== id));
      await fetchPages();
    } catch {
      setDeletingId(null);
      toast.error('Erreur lors de la suppression');
    } finally {
      setDeleting(false);
    }
  };

  const openCreate = () => {
    setFormName('');
    setFormSlug('');
    setFormDesc('');
    setIsCreateOpen(true);
  };

  return (
    <div id="admin-pages-workspace" className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Bandeau titre backoffice — même langage visuel que le module Produits */}
      <div className="bg-[#0A0D0E] border border-neutral-800 rounded-3xl p-5 sm:p-6 text-white shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-[#141B1E] border border-neutral-700 flex items-center justify-center shrink-0">
              <Globe className="w-6 h-6 text-[#38E044]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold tracking-tight">
                  Pages du site web
                </h1>
                <span className="text-[10px] font-mono font-extrabold bg-[#38E044] text-black px-2.5 py-0.5 rounded-full shadow-[0_0_10px_rgba(56,224,68,0.4)]">
                  BACKOFFICE
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-1 truncate">
                {status
                  ? `CMS ${status.online ? 'opérationnel' : 'injoignable'} · ${
                      status.pagesCount ?? pagesList.length
                    } page(s) publiée(s)`
                  : 'Édition visuelle des pages, style Elementor.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            <Link
              href="/web"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 text-white text-xs font-bold border border-white/10 transition-all cursor-pointer shadow-sm active:scale-95"
              title="Ouvrir le site public dans un nouvel onglet"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#38E044]" />
              <span>Voir le site</span>
            </Link>
            <button
              type="button"
              onClick={() => {
                checkStatus();
                fetchPages();
              }}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 text-white text-xs font-bold border border-white/10 transition-all cursor-pointer shadow-sm active:scale-95"
              title="Actualiser la liste"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-[#38E044] ${refreshing ? 'animate-spin' : ''}`}
              />
              <span>Actualiser</span>
            </button>
            <button
              type="button"
              onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#38E044] hover:bg-[#2fcb3c] text-black text-xs font-extrabold transition-all cursor-pointer shadow-[0_0_16px_rgba(56,224,68,0.35)] active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Nouvelle page</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filtres + recherche */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-neutral-200/80 shadow-sm">
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-semibold">
          {(
            [
              ['ALL', 'Toutes', counts.all, 'bg-neutral-900 text-white shadow-sm'],
              ['system', 'Principale', counts.system, 'bg-emerald-600 text-white shadow-sm'],
              ['legal', 'Juridiques', counts.legal, 'bg-sky-600 text-white shadow-sm'],
              ['custom', 'Personnalisées', counts.custom, 'bg-violet-600 text-white shadow-sm'],
            ] as [PageFilter, string, number, string][]
          ).map(([value, label, count, active]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(filter === value ? 'ALL' : value)}
              className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                filter === value
                  ? active
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              <span>{label}</span>
              <span
                className={`px-1.5 rounded-full text-[10px] ${
                  filter === value ? 'bg-white/25 text-white' : 'bg-neutral-100 text-neutral-500'
                }`}
              >
                {count}
              </span>
            </button>
          ))}
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher une page…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-neutral-50 border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-400"
          />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
          <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
          <span className="flex-1">{error}</span>
          <button
            type="button"
            onClick={fetchPages}
            className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold transition-colors cursor-pointer"
          >
            Réessayer
          </button>
        </div>
      )}

      {loadingPages ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
        </div>
      ) : (
        <div className="bg-white border border-neutral-200/80 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200 font-mono text-neutral-500 uppercase tracking-wider text-[11px]">
                  <th className="p-4">Page</th>
                  <th className="p-4">Chemin public</th>
                  <th className="p-4">Sections</th>
                  <th className="p-4">État</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-12">
                      <div className="flex flex-col items-center justify-center gap-3 text-center">
                        <div className="p-3 rounded-2xl bg-neutral-100">
                          <Inbox className="w-7 h-7 text-neutral-400" />
                        </div>
                        <div className="text-sm text-neutral-500 font-semibold">
                          {pagesList.length === 0
                            ? 'Aucune page pour le moment.'
                            : 'Aucune page ne correspond à cette recherche.'}
                        </div>
                        {pagesList.length === 0 && (
                          <p className="text-xs text-neutral-400 max-w-sm">
                            Cliquez sur « Nouvelle page » pour créer une page
                            éditoriale, puis ouvrez son éditeur visuel pour
                            composer les sections.
                          </p>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((page) => (
                    <tr
                      key={page.id}
                      className="relative hover:bg-neutral-50/90 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-neutral-100 flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4 text-neutral-500" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-neutral-900 truncate">
                                {page.name}
                              </span>
                              {page.badge && (
                                <span className="text-[9.5px] font-mono uppercase px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600 font-semibold shrink-0">
                                  {page.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-neutral-400 truncate max-w-md">
                              {page.description}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-mono text-[11px] text-neutral-500">
                          {page.slug}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-neutral-600">
                          <Layers className="w-3.5 h-3.5" />
                          {page.sectionsCount || 1}
                        </span>
                      </td>
                      <td className="p-4">
                        {page.isSystem ? (
                          <span className="text-[10px] font-mono font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                            Principale
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono font-extrabold uppercase px-2 py-0.5 rounded-full bg-sky-100 text-sky-700">
                            CMS actif
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={page.editorPath}
                            className="p-2 rounded-xl text-neutral-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                            title="Ouvrir l'éditeur visuel"
                          >
                            <PenSquare className="w-4 h-4" />
                          </Link>
                          <Link
                            href={page.slug}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-xl text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer"
                            title="Voir la page publique"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(page)}
                            className="p-2 rounded-xl text-neutral-400 hover:text-sky-600 hover:bg-sky-50 transition-colors cursor-pointer"
                            title="Modifier les informations"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleClonePage(page)}
                            className="p-2 rounded-xl text-neutral-400 hover:text-violet-600 hover:bg-violet-50 transition-colors cursor-pointer"
                            title="Dupliquer"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          {!page.isSystem && (
                            <button
                              type="button"
                              onClick={() => setDeletingId(page.id)}
                              disabled={deleting}
                              className="p-2 rounded-xl text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-40"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Confirmation en ligne — même pattern que le module
                          Produits : la zone rouge recouvre la ligne depuis la
                          droite, sans modale ni overlay. */}
                      <AnimatePresence>
                        {deletingId === page.id && (
                          <motion.td
                            key={`delete-confirm-${page.id}`}
                            colSpan={5}
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{
                              type: 'spring',
                              damping: 25,
                              stiffness: 200,
                            }}
                            className="absolute inset-0 z-10 p-0"
                          >
                            <div
                              role="group"
                              aria-labelledby={`page-delete-title-${page.id}`}
                              className="h-full w-full bg-rose-600 flex items-center justify-between gap-3 px-3 sm:px-6"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                                  <AlertTriangle
                                    className="w-5 h-5 text-white"
                                    aria-hidden
                                  />
                                </div>
                                <div className="min-w-0">
                                  <h4
                                    id={`page-delete-title-${page.id}`}
                                    className="text-white font-bold text-sm truncate"
                                  >
                                    Supprimer cette page&nbsp;?
                                  </h4>
                                  <p className="text-rose-100 text-[10px] uppercase font-bold tracking-wider truncate">
                                    Cette action est irréversible
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => setDeletingId(null)}
                                  disabled={deleting}
                                  className="px-3 sm:px-4 py-2 text-xs font-bold text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                                >
                                  Annuler
                                </button>
                                <button
                                  type="button"
                                  onClick={() => confirmDelete(page.id)}
                                  disabled={deleting}
                                  className="px-3 sm:px-4 py-2 text-xs font-bold bg-white text-rose-600 rounded-xl hover:bg-rose-50 transition-all shadow-lg cursor-pointer disabled:opacity-70 inline-flex items-center gap-1.5"
                                >
                                  {deleting ? (
                                    <>
                                      <Loader2
                                        className="w-3.5 h-3.5 animate-spin"
                                        aria-hidden
                                      />
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modale : créer une page */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-2xl border border-neutral-200 shadow-2xl overflow-hidden p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-lg text-neutral-900">
                <Plus className="w-5 h-5 text-emerald-600" />
                <span>Créer une nouvelle page</span>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer"
                aria-label="Fermer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePage} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-neutral-900 mb-1">
                  Nom de la page *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => {
                    setFormName(e.target.value);
                    if (!formSlug) {
                      setFormSlug(
                        '/' +
                          e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9]+/g, '-')
                            .replace(/(^-|-$)/g, '')
                      );
                    }
                  }}
                  placeholder="Ex : Conditions de garantie"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 focus:border-emerald-600 focus:outline-none text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-900 mb-1">
                  Slug URL (chemin d'accès) *
                </label>
                <input
                  type="text"
                  required
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                  placeholder="Ex : /conditions-garantie"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 focus:border-emerald-600 focus:outline-none font-mono text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-900 mb-1">
                  Description courte (SEO)
                </label>
                <textarea
                  rows={3}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Présentation des garanties constructeur et engagement technique…"
                  className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 focus:border-emerald-600 focus:outline-none text-xs leading-relaxed"
                />
              </div>

              <div className="pt-3 border-t border-neutral-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-neutral-200 text-neutral-600 hover:text-neutral-900 font-semibold transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Création…' : 'Créer la page'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modale : modifier les métadonnées */}
      {isEditOpen && selectedPage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-2xl border border-neutral-200 shadow-2xl overflow-hidden p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-lg text-neutral-900">
                <Pencil className="w-5 h-5 text-sky-600" />
                <span>Modifier les paramètres de la page</span>
              </div>
              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer"
                aria-label="Fermer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdatePage} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-neutral-900 mb-1">
                  Nom de la page *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 focus:border-sky-600 focus:outline-none text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-900 mb-1">
                  Slug URL *
                </label>
                <input
                  type="text"
                  required
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 focus:border-sky-600 focus:outline-none font-mono text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-900 mb-1">
                  Description courte (SEO)
                </label>
                <textarea
                  rows={3}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 focus:border-sky-600 focus:outline-none text-xs leading-relaxed"
                />
              </div>

              <div className="pt-3 border-t border-neutral-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-neutral-200 text-neutral-600 hover:text-neutral-900 font-semibold transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold transition-colors cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Enregistrement…' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pied : état de persistance + sauvegarde CMS */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-neutral-400">
        <span className="inline-flex items-center gap-1.5">
          <FileJson className="w-3.5 h-3.5" />
          {status?.dataFile ? `Persistance : ${status.dataFile}` : 'Persistance : JSON serveur synchronisé'}
        </span>
        {saveStatus ? <span>{String(saveStatus)}</span> : null}
      </div>
    </div>
  );
}
