'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Globe,
  ExternalLink,
  PenSquare,
  Server,
  RefreshCw,
  CheckCircle2,
  XCircle,
  FileJson,
  Plus,
  Copy,
  Trash2,
  Edit3,
  FileText,
  X,
  Check,
  Shield,
  Layers,
  Sparkles,
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

export default function SiteWebDashboardPage() {
  const { backendConnected, isAdmin, saveStatus } = useCms();
  const [status, setStatus] = useState<StatusInfo | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const [pagesList, setPagesList] = useState<PageItem[]>(DEFAULT_PAGES);
  const [loadingPages, setLoadingPages] = useState<boolean>(true);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [selectedPage, setSelectedPage] = useState<PageItem | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchPages = async () => {
    try {
      const res = await fetch('/api/site-web/pages');
      if (res.ok) {
        const data = await res.json();
        const serverPages = data?.pages || {};

        // Merge default list with any created or updated pages
        const mergedMap = new Map<string, PageItem>();
        DEFAULT_PAGES.forEach((p) => mergedMap.set(p.id, p));

        Object.entries(serverPages).forEach(([id, p]: [string, any]) => {
          const existing = mergedMap.get(id);
          const sections = p.sections || {};
          const count = Object.keys(sections).length;

          const editorUrl = p.slug?.startsWith('/web') ? p.slug : `/web${p.slug?.startsWith('/') ? p.slug : `/${p.slug}`}`;

          mergedMap.set(id, {
            id,
            name: p.name || existing?.name || id,
            slug: p.slug || existing?.slug || `/${id}`,
            editorPath: editorUrl,
            description: p.meta?.description || existing?.description || 'Page gérée par le CMS',
            sectionsCount: count > 0 ? count : existing?.sectionsCount || 1,
            badge: existing?.badge || 'Custom',
            isSystem: existing?.isSystem || false,
          });
        });

        setPagesList(Array.from(mergedMap.values()));
      }
    } catch (err) {
      console.warn('[Pages] Fetch error:', err);
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
      setLastCheck(new Date());
    }
  };

  useEffect(() => {
    checkStatus();
    fetchPages();
  }, []);

  // Action: Create Page
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
        toast.success(`Page "${formName}" créée avec succès !`);
        setIsCreateOpen(false);
        setFormName('');
        setFormSlug('');
        setFormDesc('');
        await fetchPages();
      } else {
        toast.error('Erreur lors de la création de la page');
      }
    } catch (err) {
      toast.error('Erreur réseau');
    } finally {
      setSubmitting(false);
    }
  };

  // Action: Edit Page metadata
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
        toast.success(`Page "${formName}" mise à jour !`);
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

  // Action: Clone Page
  const handleClonePage = async (page: PageItem) => {
    const cloneId = `${page.id}_copie_${Date.now().toString().slice(-4)}`;
    const cloneName = `${page.name} (Copie)`;
    const cloneSlug = `${page.slug}-copie`;

    toast.loading('Clonage de la page en cours…');
    try {
      // Fetch existing page data
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
        toast.success(`Page "${cloneName}" clonée avec succès !`);
        await fetchPages();
      } else {
        toast.error('Échec du clonage');
      }
    } catch {
      toast.dismiss();
      toast.error('Erreur lors du clonage');
    }
  };

  // Action: Delete Page
  const handleOpenDelete = (page: PageItem) => {
    setSelectedPage(page);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedPage) return;
    if (selectedPage.isSystem) {
      toast.error('La page principale ne peut pas être supprimée');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/site-web/pages/${selectedPage.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toast.success(`Page "${selectedPage.name}" supprimée.`);
        setIsDeleteOpen(false);
        setPagesList((prev) => prev.filter((p) => p.id !== selectedPage.id));
        await fetchPages();
      } else {
        toast.error('Erreur lors de la suppression');
      }
    } catch {
      toast.error('Erreur réseau');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-[#8a8880] mb-2 font-mono">
          <Globe className="h-3.5 w-3.5 text-emerald-500" />
          <span>Site Web Public · Gestion des Pages</span>
        </div>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#111] tracking-tight">
              Pages du Site & Éditeur Visuel
            </h1>
            <p className="text-[13.5px] text-[#6b6a66] mt-1 max-w-2xl leading-relaxed">
              Consultez, modifiez, clonez ou supprimez les pages de votre site web. Chaque page peut être éditée en direct grâce à l'éditeur visuel (CMS style Elementor).
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                setFormName('');
                setFormSlug('');
                setFormDesc('');
                setIsCreateOpen(true);
              }}
              className="flex items-center gap-2 text-[12px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Créer une page</span>
            </button>
            <button
              type="button"
              onClick={() => {
                checkStatus();
                fetchPages();
              }}
              className="flex items-center gap-1.5 text-[12px] font-semibold text-[#6b6a66] border border-[#d8d6d0] hover:border-[#111] hover:text-[#111] bg-white px-3 py-2.5 rounded-xl transition-colors cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Actualiser</span>
            </button>
            <Link
              href="/web"
              target="_blank"
              className="flex items-center gap-1.5 text-[12px] font-semibold text-white bg-[#111] hover:bg-black px-4 py-2.5 rounded-xl transition-colors"
            >
              <Globe className="h-3.5 w-3.5" />
              <span>Voir le site</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#e7e5df] rounded-xl p-4 flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-[11px] uppercase tracking-wider text-[#8a8880] font-semibold">Total Pages Actives</div>
            <div className="text-xl font-bold text-[#111]">{pagesList.length}</div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-[#e7e5df] rounded-xl p-4 flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-[11px] uppercase tracking-wider text-[#8a8880] font-semibold">Statut CMS Serveur</div>
            <div className="text-sm font-bold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Opérationnel
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Server className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-[#e7e5df] rounded-xl p-4 flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-[11px] uppercase tracking-wider text-[#8a8880] font-semibold">Persistance & Sauvegarde</div>
            <div className="text-xs font-mono text-[#6b6a66]">JSON Serveur Synchronisé</div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
            <FileJson className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Pages Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-[#111]">Catalogue des pages</h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[#f4f2ed] text-[#6b6a66] border border-[#e5e3dc]">
              {pagesList.length}
            </span>
          </div>
          <span className="text-[11px] text-[#8a8880] font-mono hidden sm:inline">
            Cliquez sur « Ouvrir l'éditeur » pour activer le mode Elementor sur la page
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {pagesList.map((page) => (
            <div
              key={page.id}
              className="bg-white border border-[#e7e5df] rounded-2xl overflow-hidden flex flex-col hover:border-[#111]/30 hover:shadow-md transition-all group"
            >
              {/* Card Header */}
              <div className="p-5 border-b border-[#f0eee9] flex items-start justify-between gap-3 bg-[#faf9f6]/60">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#111] text-[15px] group-hover:text-emerald-700 transition-colors">
                      {page.name}
                    </span>
                    {page.badge && (
                      <span className="text-[9.5px] font-mono uppercase px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                        {page.badge}
                      </span>
                    )}
                  </div>
                  <div className="text-[11.5px] text-[#8a8880] font-mono flex items-center gap-1.5">
                    <span>{page.slug}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {/* Clone Button */}
                  <button
                    type="button"
                    onClick={() => handleClonePage(page)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-[#7a7a76] hover:text-[#111] hover:bg-white border border-transparent hover:border-[#d8d6d0] transition-colors cursor-pointer"
                    title="Cloner cette page"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>

                  {/* Edit Metadata Button */}
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(page)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-[#7a7a76] hover:text-[#111] hover:bg-white border border-transparent hover:border-[#d8d6d0] transition-colors cursor-pointer"
                    title="Modifier les informations"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete Button (disabled for home) */}
                  {!page.isSystem && (
                    <button
                      type="button"
                      onClick={() => handleOpenDelete(page)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                      title="Supprimer cette page"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <p className="text-[13px] text-[#6b6a66] leading-relaxed line-clamp-3">
                  {page.description}
                </p>

                <div className="flex items-center justify-between text-[11px] font-mono text-[#8a8880] pt-3 border-t border-[#f0eee9]">
                  <span className="flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-[#111]" />
                    {page.sectionsCount || 1} sections éditables
                  </span>
                  <span className="text-emerald-600 font-semibold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> CMS Actif
                  </span>
                </div>
              </div>

              {/* Card Actions */}
              <div className="p-4 bg-[#faf9f6] border-t border-[#f0eee9] flex items-center gap-2">
                <Link
                  href={page.editorPath}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#C3F910] hover:bg-[#b0e20e] text-[#0a0a09] font-bold text-[12px] py-2.5 rounded-xl transition-all shadow-sm"
                >
                  <PenSquare className="h-3.5 w-3.5" />
                  <span>Ouvrir l’éditeur</span>
                </Link>

                <Link
                  href={page.slug}
                  target="_blank"
                  title="Voir la page publique"
                  className="w-10 h-10 flex items-center justify-center rounded-xl border border-[#d8d6d0] hover:border-[#111] text-[#6b6a66] hover:text-[#111] bg-white transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal: Create Page */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-2xl border border-[#e7e5df] shadow-2xl overflow-hidden p-6 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-lg text-[#111]">
                <Plus className="w-5 h-5 text-emerald-600" />
                <span>Créer une nouvelle page</span>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#7a7a76] hover:text-[#111] hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePage} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#111] mb-1">Nom de la page *</label>
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
                  placeholder="Ex: Conditions de Garantie"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#d8d6d0] focus:border-emerald-600 focus:outline-none text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#111] mb-1">Slug URL (chemin d'accès) *</label>
                <input
                  type="text"
                  required
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                  placeholder="Ex: /conditions-garantie"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#d8d6d0] focus:border-emerald-600 focus:outline-none font-mono text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#111] mb-1">Description courte (SEO / CMS)</label>
                <textarea
                  rows={3}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Présentation des garanties constructeur et engagement technique..."
                  className="w-full px-3.5 py-2 rounded-xl border border-[#d8d6d0] focus:border-emerald-600 focus:outline-none text-xs leading-relaxed"
                />
              </div>

              <div className="pt-3 border-t border-[#f0eee9] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#d8d6d0] text-[#6b6a66] hover:text-[#111] font-semibold transition-colors cursor-pointer"
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

      {/* Modal: Edit Page Metadata */}
      {isEditOpen && selectedPage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-2xl border border-[#e7e5df] shadow-2xl overflow-hidden p-6 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-lg text-[#111]">
                <Edit3 className="w-5 h-5 text-blue-600" />
                <span>Modifier les paramètres de la page</span>
              </div>
              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#7a7a76] hover:text-[#111] hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdatePage} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#111] mb-1">Nom de la page *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#d8d6d0] focus:border-blue-600 focus:outline-none text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#111] mb-1">Slug URL *</label>
                <input
                  type="text"
                  required
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#d8d6d0] focus:border-blue-600 focus:outline-none font-mono text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#111] mb-1">Description courte (SEO / CMS)</label>
                <textarea
                  rows={3}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#d8d6d0] focus:border-blue-600 focus:outline-none text-xs leading-relaxed"
                />
              </div>

              <div className="pt-3 border-t border-[#f0eee9] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#d8d6d0] text-[#6b6a66] hover:text-[#111] font-semibold transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Enregistrement…' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Delete Confirmation */}
      {isDeleteOpen && selectedPage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white rounded-2xl border border-red-200 shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-11 h-11 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="text-center space-y-1.5">
              <h3 className="text-base font-bold text-[#111]">Supprimer cette page ?</h3>
              <p className="text-xs text-[#6b6a66] leading-relaxed">
                Êtes-vous sûr de vouloir supprimer définitivement la page <strong>"{selectedPage.name}"</strong> ({selectedPage.slug}) ? Cette action est irréversible.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => setIsDeleteOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-[#d8d6d0] text-[#6b6a66] hover:text-[#111] font-semibold text-xs transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={submitting}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Suppression…' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
