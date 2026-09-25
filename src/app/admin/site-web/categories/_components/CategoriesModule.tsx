'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  RefreshCw,
  Inbox,
  Check,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { slugify } from '@/lib/products/types';
import type { ProductCategory, ProductCategoryGroup } from '@/lib/products/types';
import { useI18n } from '@/lib/i18n';

type GroupEditorState =
  | { mode: 'new' }
  | { mode: 'edit'; group: ProductCategoryGroup }
  | null;

type OptionEditorState =
  | { mode: 'new'; groupKey: string }
  | { mode: 'edit'; category: ProductCategory; groupKey: string }
  | null;

interface BlockedGroupDelete {
  group: ProductCategoryGroup;
  categoryCount: number;
  usage: number;
}

async function listCategories(): Promise<ProductCategory[]> {
  const res = await fetch('/api/site-web/categories', { credentials: 'include' });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || data.error || 'Impossible de charger les catégories.');
  }
  return data.categories as ProductCategory[];
}

async function listGroups(): Promise<ProductCategoryGroup[]> {
  const res = await fetch('/api/site-web/category-groups', { credentials: 'include' });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || data.error || 'Impossible de charger les groupes de filtres.');
  }
  return data.groups as ProductCategoryGroup[];
}

function request(url: string, init: RequestInit): Promise<any> {
  return fetch(url, { ...init, credentials: 'include' }).then(async (res) => {
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
      const err = new Error(data.message || data.error || 'Requête échouée.') as Error & {
        status?: number;
        usage?: number;
        categoryCount?: number;
      };
      err.status = res.status;
      if (typeof data.usage === 'number') err.usage = data.usage;
      if (typeof data.categoryCount === 'number') err.categoryCount = data.categoryCount;
      throw err;
    }
    return data;
  });
}

function sortByOrder<T extends { order?: number }>(list: T[]): T[] {
  return [...list].sort((a, b) => {
    const oa = typeof a.order === 'number' ? a.order : Number.MAX_SAFE_INTEGER;
    const ob = typeof b.order === 'number' ? b.order : Number.MAX_SAFE_INTEGER;
    if (oa !== ob) return oa - ob;
    return String((a as { label?: string; name?: string }).label ?? (a as { name?: string }).name ?? '').localeCompare(
      String((b as { label?: string; name?: string }).label ?? (b as { name?: string }).name ?? ''),
      'fr'
    );
  });
}

export default function CategoriesModule() {
  const { t } = useI18n();
  const [groups, setGroups] = useState<ProductCategoryGroup[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [groupEditor, setGroupEditor] = useState<GroupEditorState>(null);
  const [optionEditor, setOptionEditor] = useState<OptionEditorState>(null);
  const [blockedDelete, setBlockedDelete] = useState<BlockedGroupDelete | null>(null);
  const [optionDelete, setOptionDelete] = useState<{ category: ProductCategory; usage: number } | null>(null);

  // Formulaire groupe
  const [gLabel, setGLabel] = useState('');
  const [gKey, setGKey] = useState('');
  const [gKeyAuto, setGKeyAuto] = useState(true);
  const [gLabelFr, setGLabelFr] = useState('');
  const [gLabelEn, setGLabelEn] = useState('');
  const [gOrder, setGOrder] = useState(1);
  const [gActive, setGActive] = useState(true);

  // Formulaire option
  const [oName, setOName] = useState('');
  const [oSlug, setOSlug] = useState('');
  const [oSlugTouched, setOSlugTouched] = useState(false);
  const [oNameFr, setONameFr] = useState('');
  const [oNameEn, setONameEn] = useState('');
  const [oOrder, setOOrder] = useState(1);
  const [oActive, setOActive] = useState(true);
  const [oMoveType, setOMoveType] = useState('');

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [g, c] = await Promise.all([listGroups(), listCategories()]);
      setGroups(sortByOrder(g));
      setCategories(c);
    } catch (err: unknown) {
      toast.error(err instanceof Error && err.message ? err.message : t('admin.categories.toastLoadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Échap ferme l'éditeur / dialogue ouvert.
  useEffect(() => {
    if (!groupEditor && !optionEditor && !blockedDelete && !optionDelete) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setGroupEditor(null);
        setOptionEditor(null);
        setBlockedDelete(null);
        setOptionDelete(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [groupEditor, optionEditor, blockedDelete, optionDelete]);

  // ── Groupes ──────────────────────────────────────────────────────────────

  const openNewGroup = () => {
    setGLabel('');
    setGKey('');
    setGKeyAuto(true);
    setGLabelFr('');
    setGLabelEn('');
    setGOrder(groups.length + 1);
    setGActive(true);
    setGroupEditor({ mode: 'new' });
  };

  const openEditGroup = (group: ProductCategoryGroup) => {
    setGLabel(group.label);
    setGKey(group.key);
    setGKeyAuto(false);
    setGLabelFr(group.labelFr ?? '');
    setGLabelEn(group.labelEn ?? '');
    setGOrder(group.order ?? groups.length + 1);
    setGActive(group.active);
    setGroupEditor({ mode: 'edit', group });
  };

  const submitGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    const label = gLabel.trim();
    if (!label) {
      toast.error(t('admin.categories.toastNameRequired'));
      return;
    }
    const key = gKeyAuto ? slugify(label) : gKey.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
    if (!key) {
      toast.error(t('admin.categories.toastNameRequired'));
      return;
    }
    setSaving(true);
    try {
      if (groupEditor?.mode === 'edit') {
        await request(`/api/site-web/category-groups/${groupEditor.group.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            label,
            labelFr: gLabelFr.trim() || null,
            labelEn: gLabelEn.trim() || null,
            active: gActive,
            order: gOrder,
          }),
        });
        toast.success(t('admin.categories.toastGroupUpdated', { name: label }));
      } else {
        await request('/api/site-web/category-groups', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key,
            label,
            labelFr: gLabelFr.trim() || null,
            labelEn: gLabelEn.trim() || null,
            active: gActive,
            order: gOrder,
          }),
        });
        toast.success(t('admin.categories.toastGroupCreated', { name: label }));
      }
      setGroupEditor(null);
      void load(true);
    } catch (err: unknown) {
      toast.error(err instanceof Error && err.message ? err.message : t('admin.categories.toastSaveError'));
    } finally {
      setSaving(false);
    }
  };

  const onDeleteGroup = async (group: ProductCategoryGroup) => {
    try {
      await request(`/api/site-web/category-groups/${group.id}`, { method: 'DELETE' });
      toast.success(t('admin.categories.toastGroupDeleted', { name: group.label }));
      void load(true);
    } catch (err: unknown) {
      const e = err as Error & { status?: number; categoryCount?: number; usage?: number };
      if (e.status === 409 && typeof e.categoryCount === 'number') {
        setBlockedDelete({ group, categoryCount: e.categoryCount, usage: e.usage ?? 0 });
      } else {
        toast.error(e.message || t('admin.categories.toastGroupDeleteError'));
      }
    }
  };

  const deactivateGroup = async (group: ProductCategoryGroup) => {
    setSaving(true);
    try {
      await request(`/api/site-web/category-groups/${group.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: false }),
      });
      toast.success(t('admin.categories.toastGroupUpdated', { name: group.label }));
      setBlockedDelete(null);
      void load(true);
    } catch (err: unknown) {
      toast.error(err instanceof Error && err.message ? err.message : t('admin.categories.toastSaveError'));
    } finally {
      setSaving(false);
    }
  };

  /** Réordonne les groupes : chaque flèche normalise l'ordre de tous les
   *  groupes sur leur position (index+1), puis les groupe touchés descendent/
   *  remontent d'un cran. */
  const moveGroup = async (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= sorted.length) return;
    setSaving(true);
    try {
      const reordered = [...sorted];
      const [item] = reordered.splice(index, 1);
      reordered.splice(target, 0, item);
      await Promise.all(
        reordered.map((g, i) =>
          request(`/api/site-web/category-groups/${g.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order: i + 1 }),
          })
        )
      );
      void load(true);
    } catch (err: unknown) {
      toast.error(err instanceof Error && err.message ? err.message : t('admin.categories.toastSaveError'));
    } finally {
      setSaving(false);
    }
  };

  const toggleGroupActive = async (group: ProductCategoryGroup) => {
    setSaving(true);
    try {
      await request(`/api/site-web/category-groups/${group.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !group.active }),
      });
      void load(true);
    } catch (err: unknown) {
      toast.error(err instanceof Error && err.message ? err.message : t('admin.categories.toastSaveError'));
    } finally {
      setSaving(false);
    }
  };

  // ── Options ──────────────────────────────────────────────────────────────

  const openNewOption = (groupKey: string) => {
    setOName('');
    setOSlug('');
    setOSlugTouched(false);
    setONameFr('');
    setONameEn('');
    setOOrder(1);
    setOActive(true);
    setOMoveType(groupKey);
    setOptionEditor({ mode: 'new', groupKey });
  };

  const openEditOption = (category: ProductCategory) => {
    setOName(category.name);
    setOSlug(category.slug);
    setOSlugTouched(true);
    setONameFr(category.nameFr ?? '');
    setONameEn(category.nameEn ?? '');
    setOOrder(category.order ?? 1);
    setOActive(category.active);
    setOMoveType(category.type);
    setOptionEditor({ mode: 'edit', category, groupKey: category.type });
  };

  const onONameChange = (value: string) => {
    setOName(value);
    if (!oSlugTouched) setOSlug(slugify(value));
  };

  const submitOption = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = oName.trim();
    if (!name) {
      toast.error(t('admin.categories.toastNameRequired'));
      return;
    }
    const slug = oSlug.trim() || slugify(name);
    const type = oMoveType;
    setSaving(true);
    try {
      if (optionEditor?.mode === 'edit') {
        const moved = type !== optionEditor.category.type;
        await request(`/api/site-web/categories/${optionEditor.category.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            slug,
            type,
            active: oActive,
            order: oOrder,
            nameFr: oNameFr.trim() || null,
            nameEn: oNameEn.trim() || null,
          }),
        });
        toast.success(
          moved
            ? t('admin.categories.toastOptionMoved', { group: typeLabel(type) })
            : t('admin.categories.toastUpdated', { name })
        );
      } else {
        await request('/api/site-web/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            slug,
            type,
            active: oActive,
            order: oOrder,
            nameFr: oNameFr.trim() || null,
            nameEn: oNameEn.trim() || null,
          }),
        });
        toast.success(t('admin.categories.toastCreated', { name }));
      }
      setOptionEditor(null);
      void load(true);
    } catch (err: unknown) {
      toast.error(err instanceof Error && err.message ? err.message : t('admin.categories.toastSaveError'));
    } finally {
      setSaving(false);
    }
  };

  const typeLabel = (key: string) => groups.find((g) => g.key === key)?.label ?? key;

  /** Suppression d'une option : sonde d'abord l'API — en cas de 409 (référencée
   *  par des produits), on propose désactivation ou suppression + désassociation. */
  const onDeleteOption = async (c: ProductCategory) => {
    try {
      await request(`/api/site-web/categories/${c.id}`, { method: 'DELETE' });
      toast.success(t('admin.categories.toastDeleted', { name: c.name }));
      void load(true);
    } catch (err: unknown) {
      const e = err as Error & { status?: number; usage?: number };
      if (e.status === 409 && typeof e.usage === 'number') {
        setOptionDelete({ category: c, usage: e.usage });
      } else {
        toast.error(e.message || t('admin.categories.toastDeleteError'));
      }
    }
  };

  const deactivateOption = async () => {
    if (!optionDelete) return;
    setSaving(true);
    try {
      await request(`/api/site-web/categories/${optionDelete.category.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: false }),
      });
      toast.success(t('admin.categories.toastDeactivated', { name: optionDelete.category.name }));
      setOptionDelete(null);
      void load(true);
    } catch (err: unknown) {
      toast.error(err instanceof Error && err.message ? err.message : t('admin.categories.toastDeactivateError'));
    } finally {
      setSaving(false);
    }
  };

  const deleteOptionUnlink = async () => {
    if (!optionDelete) return;
    setSaving(true);
    try {
      await request(`/api/site-web/categories/${optionDelete.category.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ removeFromProducts: true }),
      });
      toast.success(t('admin.categories.toastDeletedUnlinked', { name: optionDelete.category.name }));
      setOptionDelete(null);
      void load(true);
    } catch (err: unknown) {
      toast.error(err instanceof Error && err.message ? err.message : t('admin.categories.toastDeleteError'));
    } finally {
      setSaving(false);
    }
  };

  // ── Regroupement (groupes → options) ─────────────────────────────────────

  const sorted = sortByOrder(groups);

  const rows = useMemo(
    () =>
      sorted.map((group) => {
        const opts = categories.filter((c) => c.type === group.key);
        const sortedOpts = sortByOrder(opts);
        return { group, options: sortedOpts };
      }),
    [sorted, categories]
  );

  const OptionRow: React.FC<{ c: ProductCategory }> = ({ c }) => (
    <div className="flex items-center gap-3 px-5 py-3 border-b border-neutral-200 dark:border-white/5 last:border-0">
      <span className={`h-2 w-2 rounded-full shrink-0 ${c.active ? 'bg-emerald-500' : 'bg-neutral-400'}`} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-neutral-900 dark:text-white">{c.name}</span>
          {!c.active && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-500 dark:text-neutral-400">
              {t('admin.categories.inactiveBadge')}
            </span>
          )}
        </div>
        {(c.nameFr || c.nameEn) && (
          <div className="flex flex-wrap items-center gap-1.5 mt-1">
            {c.nameFr && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-500/30">
                FR · {c.nameFr}
              </span>
            )}
            {c.nameEn && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-500/30">
                EN · {c.nameEn}
              </span>
            )}
          </div>
        )}
      </div>
      <code className="hidden sm:inline text-[11px] font-mono text-neutral-500 dark:text-neutral-400">{c.slug}</code>
      <span className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400">#{c.order ?? '—'}</span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          title={t('admin.categories.edit')}
          onClick={() => openEditOption(c)}
          className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-white/10 text-neutral-600 dark:text-neutral-300 transition-colors cursor-pointer"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          type="button"
          title={t('admin.categories.delete')}
          onClick={() => onDeleteOption(c)}
          className="p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 text-neutral-600 dark:text-neutral-300 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  const inputCls =
    'mt-1.5 w-full px-3 py-2.5 bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10 rounded-xl text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-[#38E044]/50 outline-none transition-all';

  const fieldLabelCls = 'text-xs font-bold text-neutral-600 dark:text-neutral-300 uppercase tracking-wider';

  const selectCls =
    'mt-1.5 w-full px-3 py-2.5 bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10 rounded-xl text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-[#38E044]/50 outline-none transition-all';

  const btnPrimaryCls =
    'px-3 py-2 rounded-xl bg-[#38E044] hover:bg-[#4af257] text-black text-xs font-black transition-colors flex items-center gap-2 cursor-pointer';

  const btnGhostCls =
    'px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer';

  const btnNeutralCls =
    'px-4 py-2 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-black transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center gap-2 cursor-pointer';

  return (
    <div className="space-y-6">
      <div className="bg-[#0A0D0E] border border-neutral-800 rounded-3xl p-5 sm:p-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-widest text-[#38E044] mb-1">{t('admin.categories.eyebrow')}</div>
          <h1 className="text-2xl font-bold tracking-tight">{t('admin.categories.title')}</h1>
          <p className="text-sm text-white/50 mt-1 max-w-2xl">{t('admin.categories.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button type="button" onClick={() => void load()} className={btnGhostCls}>
            <RefreshCw className="h-3.5 w-3.5" />
            {t('admin.categories.refresh')}
          </button>
          <button type="button" onClick={openNewGroup} className={btnPrimaryCls}>
            <Plus className="h-4 w-4" />
            {t('admin.categories.newGroup')}
          </button>
        </div>
      </div>

      {/* Éditeur de groupe */}
      {groupEditor && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setGroupEditor(null)}
        >
          <div
            className="w-full max-w-lg rounded-3xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#0A0D0E] shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="group-editor-title"
          >
            <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-neutral-200 dark:border-white/10 bg-neutral-50/60 dark:bg-white/[0.04]">
              <h2 id="group-editor-title" className="text-base font-black tracking-tight text-neutral-900 dark:text-white">
                {groupEditor.mode === 'edit'
                  ? t('admin.categories.editGroupTitle')
                  : t('admin.categories.newGroupTitle')}
              </h2>
              <code className="shrink-0 text-[11px] font-mono px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-500 dark:text-neutral-400">
                {groupEditor.mode === 'edit' ? gKey : 'grp_…'}
              </code>
            </div>
            <form onSubmit={submitGroup} className="p-6 space-y-5">
              <label className="block">
                <span className={fieldLabelCls}>{t('admin.categories.groupLabelField')}</span>
                <input
                  autoFocus
                  value={gLabel}
                  onChange={(ev) => {
                    setGLabel(ev.target.value);
                    if (gKeyAuto) setGKey(slugify(ev.target.value));
                  }}
                  placeholder={t('admin.categories.groupLabelPlaceholder')}
                  className={inputCls}
                />
                <p className="mt-1.5 text-[11px] text-neutral-400 dark:text-neutral-500">{t('admin.categories.groupLabelHint')}</p>
              </label>
              <div className="block">
                <span className={fieldLabelCls}>{t('admin.categories.localizedLabel')}</span>
                <div className="mt-1.5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{t('admin.categories.groupNameFrLabel')}</span>
                    <input
                      value={gLabelFr}
                      onChange={(ev) => setGLabelFr(ev.target.value)}
                      placeholder={t('admin.categories.groupNameFrPlaceholder')}
                      className={inputCls}
                    />
                  </label>
                  <label className="block">
                    <span className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{t('admin.categories.groupNameEnLabel')}</span>
                    <input
                      value={gLabelEn}
                      onChange={(ev) => setGLabelEn(ev.target.value)}
                      placeholder={t('admin.categories.groupNameEnPlaceholder')}
                      className={inputCls}
                    />
                  </label>
                </div>
              </div>
              <label className="block">
                <span className={fieldLabelCls}>{t('admin.categories.groupKeyLabel')}</span>
                {groupEditor.mode === 'edit' ? (
                  <div className={`${inputCls} font-mono flex items-center justify-between gap-3 text-neutral-500 dark:text-neutral-400 select-text bg-neutral-100 dark:bg-white/[0.03]`}>
                    <code className="truncate">{gKey}</code>
                    <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">—</span>
                  </div>
                ) : (
                  <input
                    value={gKey}
                    onChange={(ev) => {
                      setGKeyAuto(false);
                      setGKey(ev.target.value);
                    }}
                    className={`${inputCls} font-mono`}
                  />
                )}
                <p className="mt-1.5 text-[11px] text-neutral-400 dark:text-neutral-500">{t('admin.categories.groupKeyHint')}</p>
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className={fieldLabelCls}>{t('admin.categories.orderLabel')}</span>
                  <input
                    type="number"
                    value={gOrder}
                    onChange={(ev) => setGOrder(Number(ev.target.value) || 1)}
                    min={1}
                    className={inputCls}
                  />
                </label>
                <label className="block">
                  <span className={fieldLabelCls}>{t('admin.categories.statusLabel')}</span>
                  <select
                    value={gActive ? 'active' : 'inactive'}
                    onChange={(ev) => setGActive(ev.target.value === 'active')}
                    className={selectCls}
                  >
                    <option value="active">{t('admin.categories.active')}</option>
                    <option value="inactive">{t('admin.categories.inactive')}</option>
                  </select>
                </label>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-200 dark:border-white/10 -mx-6 -mb-6 px-6 py-4 bg-neutral-50/60 dark:bg-white/[0.03]">
                <button
                  type="button"
                  onClick={() => setGroupEditor(null)}
                  disabled={saving}
                  className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-white/10 text-neutral-700 dark:text-neutral-200 text-xs font-bold transition-colors hover:bg-neutral-50 dark:hover:bg-white/5 disabled:opacity-50 cursor-pointer"
                >
                  {t('admin.categories.cancel')}
                </button>
                <button type="submit" disabled={saving} className={btnNeutralCls}>
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  {groupEditor.mode === 'edit' ? t('admin.categories.save') : t('admin.categories.create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Éditeur d'option */}
      {optionEditor && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setOptionEditor(null)}
        >
          <div
            className="w-full max-w-lg rounded-3xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#0A0D0E] shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="option-editor-title"
          >
            <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-neutral-200 dark:border-white/10 bg-neutral-50/60 dark:bg-white/[0.04]">
              <h2 id="option-editor-title" className="text-base font-black tracking-tight text-neutral-900 dark:text-white">
                {optionEditor.mode === 'edit' ? t('admin.categories.editOptionTitle') : t('admin.categories.newOptionTitle')}
              </h2>
              <code className="shrink-0 text-[11px] font-mono px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-500 dark:text-neutral-400">
                {typeLabel(optionEditor.groupKey)}
              </code>
            </div>
            <form onSubmit={submitOption} className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="block">
                  <span className={fieldLabelCls}>{t('admin.categories.nameLabel')}</span>
                  <input
                    autoFocus
                    value={oName}
                    onChange={(ev) => onONameChange(ev.target.value)}
                    placeholder={t('admin.categories.namePlaceholder')}
                    className={inputCls}
                  />
                </label>
                <label className="block">
                  <span className={fieldLabelCls}>{t('admin.categories.moveGroupLabel')}</span>
                  <select value={oMoveType} onChange={(ev) => setOMoveType(ev.target.value)} className={selectCls}>
                    {sorted.map((g) => (
                      <option key={g.id} value={g.key}>
                        {g.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="block">
                <span className={fieldLabelCls}>{t('admin.categories.localizedLabel')}</span>
                <div className="mt-1.5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{t('admin.categories.nameFrLabel')}</span>
                    <input
                      value={oNameFr}
                      onChange={(ev) => setONameFr(ev.target.value)}
                      placeholder={t('admin.categories.nameFrPlaceholder')}
                      className={inputCls}
                    />
                  </label>
                  <label className="block">
                    <span className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{t('admin.categories.nameEnLabel')}</span>
                    <input
                      value={oNameEn}
                      onChange={(ev) => setONameEn(ev.target.value)}
                      placeholder={t('admin.categories.nameEnPlaceholder')}
                      className={inputCls}
                    />
                  </label>
                </div>
                <p className="mt-1.5 text-[11px] text-neutral-400 dark:text-neutral-500">{t('admin.categories.localizedHint')}</p>
              </div>
              <label className="block">
                <span className={fieldLabelCls}>{t('admin.categories.slugLabel')}</span>
                <input
                  value={oSlug}
                  onChange={(ev) => {
                    setOSlugTouched(true);
                    setOSlug(ev.target.value);
                  }}
                  placeholder={t('admin.categories.slugPlaceholder')}
                  className={`${inputCls} font-mono`}
                />
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className={fieldLabelCls}>{t('admin.categories.orderLabel')}</span>
                  <input
                    type="number"
                    value={oOrder}
                    onChange={(ev) => setOOrder(Number(ev.target.value) || 1)}
                    min={1}
                    className={inputCls}
                  />
                </label>
                <label className="block">
                  <span className={fieldLabelCls}>{t('admin.categories.statusLabel')}</span>
                  <select
                    value={oActive ? 'active' : 'inactive'}
                    onChange={(ev) => setOActive(ev.target.value === 'active')}
                    className={selectCls}
                  >
                    <option value="active">{t('admin.categories.active')}</option>
                    <option value="inactive">{t('admin.categories.inactive')}</option>
                  </select>
                </label>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-200 dark:border-white/10 -mx-6 -mb-6 px-6 py-4 bg-neutral-50/60 dark:bg-white/[0.03]">
                <button
                  type="button"
                  onClick={() => setOptionEditor(null)}
                  disabled={saving}
                  className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-white/10 text-neutral-700 dark:text-neutral-200 text-xs font-bold transition-colors hover:bg-neutral-50 dark:hover:bg-white/5 disabled:opacity-50 cursor-pointer"
                >
                  {t('admin.categories.cancel')}
                </button>
                <button type="submit" disabled={saving} className={btnNeutralCls}>
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  {optionEditor.mode === 'edit' ? t('admin.categories.save') : t('admin.categories.create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-neutral-400 gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm font-mono">{t('admin.categories.loading')}</span>
        </div>
      ) : sorted.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-neutral-300 dark:border-white/10 bg-white dark:bg-white/[0.02] p-12 flex flex-col items-center justify-center gap-3 text-center">
          <Inbox className="h-8 w-8 text-neutral-300 dark:text-neutral-600" />
          <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">{t('admin.categories.emptyTitle')}</p>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-sm">{t('admin.categories.emptyHint')}</p>
          <button type="button" onClick={openNewGroup} className={btnPrimaryCls}>
            <Plus className="h-4 w-4" />
            {t('admin.categories.newGroup')}
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {rows.map(({ group, options }, index) => {
            const activeCount = options.filter((c) => c.active).length;
            return (
              <section
                key={group.id}
                className="rounded-3xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-white/[0.03] overflow-hidden"
              >
                <div className="px-5 py-3 border-b border-neutral-200 dark:border-white/10">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex flex-col">
                      <button
                        type="button"
                        title="↑"
                        aria-label="↑"
                        onClick={() => void moveGroup(index, -1)}
                        disabled={index === 0 || saving}
                        className="p-0.5 rounded text-neutral-400 hover:text-neutral-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      >
                        <ChevronUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        title="↓"
                        aria-label="↓"
                        onClick={() => void moveGroup(index, 1)}
                        disabled={index === sorted.length - 1 || saving}
                        className="p-0.5 rounded text-neutral-400 hover:text-neutral-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      >
                        <ChevronDown className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleGroupActive(group)}
                      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border transition-colors cursor-pointer ${
                        group.active
                          ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30'
                          : 'bg-neutral-100 dark:bg-white/5 text-neutral-500 dark:text-neutral-400 border-neutral-200 dark:border-white/10'
                      }`}
                      title={group.active ? t('admin.categories.active') : t('admin.categories.inactive')}
                    >
                      {group.active ? t('admin.categories.active') : t('admin.categories.inactiveBadge')}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-sm font-black uppercase tracking-wider text-neutral-900 dark:text-white">
                          {group.label}
                        </h2>
                        {group.labelFr && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-500/30">
                            FR · {group.labelFr}
                          </span>
                        )}
                        {group.labelEn && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-500/30">
                            EN · {group.labelEn}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <code className="text-[10px] font-mono text-neutral-400 dark:text-neutral-500">{group.key}</code>
                        <span className="text-[10px] font-mono text-neutral-400 dark:text-neutral-500">
                          {t('admin.categories.groupActiveOptions', { active: activeCount, total: options.length })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        title={t('admin.categories.edit')}
                        onClick={() => openEditGroup(group)}
                        className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-white/10 text-neutral-600 dark:text-neutral-300 transition-colors cursor-pointer"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        title={t('admin.categories.delete')}
                        onClick={() => onDeleteGroup(group)}
                        className="p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 text-neutral-600 dark:text-neutral-300 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openNewOption(group.key)}
                        className="inline-flex items-center gap-1.5 ml-1 px-3 py-1.5 rounded-xl text-[11px] font-black bg-[#38E044] text-black hover:bg-[#4af257] transition-colors cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        {t('admin.categories.addGroupOption')}
                      </button>
                    </div>
                  </div>
                </div>
                {options.length === 0 ? (
                  <div className="px-5 py-8 text-center text-sm text-neutral-400">{t('admin.categories.groupEmptyOptions')}</div>
                ) : (
                  <div>
                    {options.map((c) => (
                      <OptionRow key={c.id} c={c} />
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      {/* Suppression de groupe bloquée */}
      {blockedDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#0A0D0E] p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
              {t('admin.categories.groupDeleteTitle', { name: blockedDelete.group.label })}
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-2 space-y-2">
              {blockedDelete.categoryCount > 0 && (
                <span className="block">
                  {t('admin.categories.groupHasOptions', { count: blockedDelete.categoryCount })}
                </span>
              )}
              {blockedDelete.categoryCount === 0 && blockedDelete.usage > 0 && (
                <span className="block">
                  {t('admin.categories.groupInUse', { count: blockedDelete.usage })}
                </span>
              )}
            </p>
            <div className="mt-5 grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => deactivateGroup(blockedDelete.group)}
                disabled={saving}
                className="px-4 py-2.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-black transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer"
              >
                {saving ? t('admin.categories.inProgress') : t('admin.categories.deactivateRecommended')}
              </button>
              <button
                type="button"
                onClick={() => setBlockedDelete(null)}
                disabled={saving}
                className="px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-white/10 text-neutral-700 dark:text-neutral-200 text-xs font-bold transition-colors hover:bg-neutral-50 dark:hover:bg-white/5 disabled:opacity-50 cursor-pointer"
              >
                {t('admin.categories.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suppression d'option référencée */}
      {optionDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#0A0D0E] p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
              {t('admin.categories.deleteTitle', { name: optionDelete.category.name })}
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-2">
              {t('admin.categories.deleteMessage', { count: optionDelete.usage })}
            </p>
            <div className="mt-5 grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={deactivateOption}
                disabled={saving}
                className="px-4 py-2.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-black transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer"
              >
                {saving ? t('admin.categories.inProgress') : t('admin.categories.deactivateRecommended')}
              </button>
              <button
                type="button"
                onClick={deleteOptionUnlink}
                disabled={saving}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black transition-colors disabled:opacity-50 cursor-pointer"
              >
                {t('admin.categories.deleteAndUnlink', { count: optionDelete.usage })}
              </button>
              <button
                type="button"
                onClick={() => setOptionDelete(null)}
                disabled={saving}
                className="px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-white/10 text-neutral-700 dark:text-neutral-200 text-xs font-bold transition-colors hover:bg-neutral-50 dark:hover:bg-white/5 disabled:opacity-50 cursor-pointer"
              >
                {t('admin.categories.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}