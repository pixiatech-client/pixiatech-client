'use client';

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  GripVertical,
  Link2,
  Loader2,
  Menu as MenuIcon,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import seedData from '../../../../../../data/mega-menu-seed.json';
import {
  emptyMegaMenu,
  generateId,
  menuSummary,
  sanitizeMegaMenu,
} from '@/lib/products/mega-menu';
import { isValidSlug, type MegaMenu, type MegaMenuItem, type MegaMenuColumn } from '@/lib/products/types';

interface ProductListItem {
  slug: string;
  name: string;
  status: 'draft' | 'published' | 'deleted';
}

type SaveState = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';

type RefState =
  | { kind: 'prod-published'; slug: string }
  | { kind: 'prod-draft'; slug: string }
  | { kind: 'missing'; slug: string }
  | { kind: 'legacy'; slug: string }
  | { kind: 'none' };

function refState(item: MegaMenuItem, product: ProductListItem | null): RefState {
  if (item.productSlug) {
    if (!product) {
      return { kind: 'missing', slug: item.productSlug };
    }
    return product.status === 'published'
      ? { kind: 'prod-published', slug: item.productSlug }
      : { kind: 'prod-draft', slug: item.productSlug };
  }
  if (item.catalogSlug) return { kind: 'legacy', slug: item.catalogSlug };
  return { kind: 'none' };
}

function refBadge(state: RefState): { text: string; className: string } {
  switch (state.kind) {
    case 'prod-published':
      return {
        text: `Ref. produit : ${state.slug}`,
        className: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30',
      };
    case 'prod-draft':
      return {
        text: `Brouillon (invisible publi.) : ${state.slug}`,
        className: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
      };
    case 'missing':
      return {
        text: `Référence inactive — produit introuvable : ${state.slug}`,
        className: 'bg-rose-500/15 text-rose-400 border-rose-500/40',
      };
    case 'legacy':
      return {
        text: `Réf. legacy (indisponible) : ${state.slug}`,
        className: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
      };
    default:
      return {
        text: 'Aucune référence produit',
        className: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
      };
  }
}

function cloneColumns(columns: MegaMenuColumn[]): MegaMenuColumn[] {
  return columns.map((c) => ({ ...c, items: c.items.map((i) => ({ ...i })) }));
}

const seedMenu = (): MegaMenuColumn[] =>
  cloneColumns(((seedData as { menu: MegaMenu }).menu).columns);

export function MenuEditor() {
  const [columns, setColumns] = useState<MegaMenuColumn[] | null>(null);
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [savedRef, setSavedRef] = useState<MegaMenu | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [activeDrag, setActiveDrag] = useState<null | {
    type: 'col' | 'item';
    id: string;
    fromColumnId?: string;
  }>(null);
  const [confirm, setConfirm] = useState<null | {
    kind: 'seed' | 'empty' | 'delete' | 'dup';
    title: string;
    body: string;
    product?: ProductListItem;
  }>(null);
  const [activeColumnId, setActiveColumnId] = useState<string>('');

  useEffect(() => {
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAll = useCallback(async () => {
    setError(null);
    setSaveState('idle');
    try {
      const [menuRes, productsRes] = await Promise.all([
        fetch('/api/site-web/mega-menu', { credentials: 'include' }),
        fetch('/api/site-web/products', { credentials: 'include' }),
      ]);
      const menuJson = (await menuRes.json()) as {
        success: boolean;
        menu?: MegaMenu | null;
        error?: string;
      };
      if (!menuRes.ok || !menuJson.success) {
        setError(menuJson.error ?? 'Impossible de charger le méga-menu.');
        setSaveState('error');
        return;
      }
      const menu = menuJson.menu;
      if (menu && Array.isArray(menu.columns) && menu.columns.length > 0) {
        const next = cloneColumns(sanitizeForEdition(menu).columns);
        setColumns(next);
        setActiveColumnId(next[0]?.id ?? '');
        setSavedRef(menu);
      } else {
        setColumns([]);
        setActiveColumnId('');
        setSavedRef(null);
      }
      const prodJson = (await productsRes.json()) as { success: boolean; products?: ProductListItem[] };
      if (prodJson.success && Array.isArray(prodJson.products)) {
        setProducts(prodJson.products);
      }
      setSaveState('saved');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement.');
      setSaveState('error');
    }
  }, []);

  const markDirty = useCallback((next: MegaMenuColumn[]) => {
    setColumns(next);
    setSaveState('dirty');
    setError(null);
  }, []);

  const patchItem = useCallback(
    (columnId: string, itemId: string, patch: Partial<MegaMenuItem>) => {
      if (!columns) return;
      markDirty(
        columns.map((c) =>
          c.id === columnId
            ? { ...c, items: c.items.map((i) => (i.id === itemId ? { ...i, ...patch } : i)) }
            : c
        )
      );
    },
    [columns, markDirty]
  );

  const toggleItem = useCallback(
    (columnId: string, itemId: string) => {
      if (!columns) return;
      markDirty(
        columns.map((c) =>
          c.id === columnId
            ? {
                ...c,
                items: c.items.map((i) =>
                  i.id === itemId ? { ...i, visible: i.visible === false ? true : false } : i
                ),
              }
            : c
        )
      );
    },
    [columns, markDirty]
  );

  const removeItem = useCallback(
    (columnId: string, itemId: string) => {
      if (!columns) return;
      markDirty(
        columns.map((c) =>
          c.id === columnId ? { ...c, items: c.items.filter((i) => i.id !== itemId) } : c
        )
      );
    },
    [columns, markDirty]
  );

  const addItemToColumn = useCallback(
    (columnId: string, item: MegaMenuItem) => {
      if (!columns) return;
      const existCol = columns.find((c) => c.id === columnId);
      const targetId = existCol ? columnId : (columns[0]?.id ?? '');
      if (!targetId) return;
      markDirty(
        columns.map((c) => (c.id === targetId ? { ...c, items: [...c.items, item] } : c))
      );
    },
    [columns, markDirty]
  );

  const patchColumn = useCallback(
    (columnId: string, patch: Partial<Pick<MegaMenuColumn, 'titleEn' | 'titleFr'>>) => {
      if (!columns) return;
      markDirty(columns.map((c) => (c.id === columnId ? { ...c, ...patch } : c)));
    },
    [columns, markDirty]
  );

  const addColumn = useCallback(() => {
    if (!columns) return;
    const next = [
      ...columns,
      { id: generateId('col'), titleEn: 'NEW COLUMN', titleFr: 'NOUVELLE COLONNE', items: [] },
    ];
    markDirty(next);
    setActiveColumnId(next[next.length - 1].id);
  }, [columns, markDirty]);

  const removeColumn = useCallback(
    (columnId: string) => {
      if (!columns) return;
      markDirty(columns.filter((c) => c.id !== columnId));
      setActiveColumnId((prev) => (prev === columnId ? columns[0]?.id ?? '' : prev));
    },
    [columns, markDirty]
  );

  const moveColumn = useCallback(
    (columnId: string, dir: -1 | 1) => {
      if (!columns) return;
      const idx = columns.findIndex((c) => c.id === columnId);
      const to = idx + dir;
      if (idx < 0 || to < 0 || to >= columns.length) return;
      const next = [...columns];
      const [col] = next.splice(idx, 1);
      next.splice(to, 0, col);
      markDirty(next);
    },
    [columns, markDirty]
  );

  const findContainer = useCallback(
    (id: string): string | null => {
      if (!columns) return null;
      if (columns.some((c) => c.id === id)) return id;
      return columns.find((c) => c.items.some((i) => i.id === id))?.id ?? null;
    },
    [columns]
  );

  const onDragStart = useCallback(
    (event: DragStartEvent) => {
      const id = String(event.active.id);
      if (!columns) return;
      if (columns.some((c) => c.id === id)) {
        setActiveDrag({ type: 'col', id });
      } else {
        setActiveDrag({ type: 'item', id, fromColumnId: findContainer(id) ?? undefined });
      }
    },
    [columns, findContainer]
  );

  const onDragOver = useCallback(
    (event: DragOverEvent) => {
      if (activeDrag?.type !== 'item') return;
      const { active, over } = event;
      if (!over) return;
      const activeId = String(active.id);
      const overId = String(over.id);
      const fromContainer = activeDrag.fromColumnId;
      const overContainer = findContainer(overId);
      if (!fromContainer || !overContainer || fromContainer === overContainer) return;
      if (!columns) return;
      const fromIdx = columns.findIndex((c) => c.id === fromContainer);
      const toIdx = columns.findIndex((c) => c.id === overContainer);
      if (fromIdx < 0 || toIdx < 0) return;
      const item = columns[fromIdx].items.find((i) => i.id === activeId);
      if (!item) return;
      const next = columns.map((c) => ({ ...c, items: [...c.items] }));
      next[fromIdx].items = next[fromIdx].items.filter((i) => i.id !== activeId);
      const overIndex = next[toIdx].items.findIndex((i) => i.id === overId);
      if (overId === overContainer || overIndex < 0) {
        next[toIdx].items = [...next[toIdx].items, item];
      } else {
        next[toIdx].items.splice(overIndex, 0, item);
      }
      setColumns(next);
      setActiveDrag((d) => (d ? { ...d, fromColumnId: overContainer } : d));
    },
    [activeDrag, findContainer, columns]
  );

  const onDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over) {
        setActiveDrag(null);
        return;
      }
      const activeId = String(active.id);
      const overId = String(over.id);
      if (activeDrag?.type === 'col') {
        if (columns && activeId !== overId) {
          const from = columns.findIndex((c) => c.id === activeId);
          const to = columns.findIndex((c) => c.id === overId);
          if (from >= 0 && to >= 0) {
            markDirty(arrayMove(columns, from, to));
          }
        }
      } else if (activeDrag?.type === 'item') {
        const container = findContainer(activeId);
        if (!container || !columns) {
          setActiveDrag(null);
          return;
        }
        const overContainer = findContainer(overId);
        const idx = columns.findIndex((c) => c.id === container);
        if (idx < 0) {
          setActiveDrag(null);
          return;
        }
        const col = columns[idx];
        const activeIndex = col.items.findIndex((i) => i.id === activeId);
        if (activeIndex < 0) {
          setActiveDrag(null);
          return;
        }
        if (container === overContainer) {
          const overIndex = col.items.findIndex((i) => i.id === overId);
          if (overIndex >= 0 && overIndex !== activeIndex) {
            const next = [...columns];
            next[idx] = { ...col, items: arrayMove(col.items, activeIndex, overIndex) };
            markDirty(next);
          }
        }
      }
      setActiveDrag(null);
    },
    [activeDrag, findContainer, columns, markDirty]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const bySlug = useMemo(() => new Map(products.map((p) => [p.slug, p])), [products]);
  const configuredProductSlugs = useMemo(() => {
    const set = new Set<string>();
    columns?.forEach((c) => c.items.forEach((i) => i.productSlug && set.add(i.productSlug)));
    return set;
  }, [columns]);

  const placementsOf = useCallback(
    (slug: string) => {
      const out: { columnTitle: string; itemId: string; visible: boolean }[] = [];
      columns?.forEach((c) =>
        c.items.forEach((i) => {
          if (i.productSlug === slug) {
            out.push({ columnTitle: c.titleFr || c.titleEn, itemId: i.id, visible: i.visible !== false });
          }
        })
      );
      return out;
    },
    [columns]
  );

  const handleAddProduct = useCallback(
    (product: ProductListItem) => {
      const targetId = activeColumnId || (columns && columns.length > 0 ? columns[0].id : '');
      if (!targetId) {
        setError('Ajoutez d’abord une colonne pour référencer ce produit.');
        return;
      }
      const already = configuredProductSlugs.has(product.slug);
      if (already) {
        setConfirm({
          kind: 'dup',
          title: 'Référence déjà placée',
          body: `« ${product.name} » est déjà référencé dans le menu. Souhaitez-vous l’ajouter une seconde fois (référence explicite) ?`,
          product,
        });
        return;
      }
      addProductTo(targetId, product);
    },
    [activeColumnId, columns, configuredProductSlugs, addItemToColumn]
  );

  const addProductTo = useCallback(
    (columnId: string, product: ProductListItem) => {
      addItemToColumn(columnId, {
        id: generateId('item'),
        label: product.name,
        productSlug: product.slug,
        catalogSlug: null,
        visible: true,
      });
    },
    [addItemToColumn]
  );

  const save = useCallback(async () => {
    if (!columns) return;
    setSaveState('saving');
    setError(null);
    setSavedNotice(null);
    try {
      const menu: MegaMenu = { columns: cloneColumns(columns) };
      sanitizeMegaMenu(menu);
      const res = await fetch('/api/site-web/mega-menu', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(menu),
      });
      const json = (await res.json()) as { success: boolean; menu?: MegaMenu; message?: string; error?: string };
      if (!res.ok || !json.success) {
        throw new Error(json.message ?? json.error ?? 'Enregistrement impossible.');
      }
      setSavedRef(json.menu ?? menu);
      setSaveState('saved');
      setSavedNotice(json.message ?? 'Méga-menu enregistré.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Enregistrement impossible.');
      setSaveState('error');
    }
  }, [columns]);

  const applySeed = useCallback(() => {
    const next = seedMenu();
    markDirty(next);
    setActiveColumnId(next[0]?.id ?? '');
    setConfirm(null);
    setSavedNotice('Menu de référence appliqué — pensez à enregistrer.');
  }, [markDirty]);

  const applyEmpty = useCallback(() => {
    const next = emptyMegaMenu().columns;
    markDirty(next);
    setActiveColumnId(next[0]?.id ?? '');
    setConfirm(null);
    setSavedNotice('Nouveau menu vide créé — pensez à enregistrer.');
  }, [markDirty]);

  const deleteMenu = useCallback(async () => {
    setConfirm(null);
    setSaveState('saving');
    setError(null);
    try {
      const res = await fetch('/api/site-web/mega-menu', {
        method: 'DELETE',
        credentials: 'include',
      });
      const json = (await res.json()) as { success: boolean; message?: string; error?: string };
      if (!res.ok || !json.success) {
        throw new Error(json.message ?? json.error ?? 'Suppression impossible.');
      }
      setColumns([]);
      setActiveColumnId('');
      setSavedRef(null);
      setSaveState('saved');
      setSavedNotice(json.message ?? 'Méga-menu supprimé.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Suppression impossible.');
      setSaveState('error');
    }
  }, []);

  const openSeedConfirm = useCallback(() => {
    if (!columns) return;
    const summary = menuSummary({ columns: seedMenu() });
    setConfirm({
      kind: 'seed',
      title: 'Réinitialiser depuis la référence ?',
      body: `Remplace l’ensemble du menu par la référence de base (${summary.columns} sections, ${summary.items} éléments). Toute modification non enregistrée sera perdue.`,
    });
  }, [columns]);

  const statusPill: Record<SaveState, { text: string; className: string }> = {
    idle: { text: 'Chargement…', className: 'bg-zinc-500/20 text-zinc-300' },
    dirty: {
      text: 'Modifications non enregistrées',
      className: 'bg-amber-500/15 text-amber-400 border border-amber-500/40',
    },
    saving: { text: 'Enregistrement…', className: 'bg-zinc-500/20 text-zinc-300' },
    saved: {
      text: 'Enregistré sur le site',
      className: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/40',
    },
    error: { text: 'Erreur', className: 'bg-rose-500/15 text-rose-400 border border-rose-500/40' },
  };

  if (saveState === 'idle' && columns === null) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
        <span className="ml-3 text-sm text-neutral-400">Chargement du méga-menu…</span>
      </div>
    );
  }

  const colIds = (columns ?? []).map((c) => c.id);

  return (
    <div className="space-y-6">
      <div className="bg-[#0A0D0E] border border-neutral-800 rounded-3xl p-5 sm:p-6 text-white">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-[#141B1E] border border-neutral-700 flex items-center justify-center shrink-0">
            <MenuIcon className="w-6 h-6 text-[#38E044]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold tracking-tight">Méga-menu du site</h1>
              <span className="text-[10px] font-mono font-extrabold bg-[#38E044] text-black px-2.5 py-0.5 rounded-full shadow-[0_0_10px_rgba(56,224,68,0.4)]">
                BACKOFFICE
              </span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${statusPill[saveState].className}`}>
                {saveState === 'saving' && <Loader2 className="w-3 h-3 animate-spin" />}
                {saveState === 'saved' && <CheckCircle2 className="w-3 h-3" />}
                {statusPill[saveState].text}
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Le menu <span className="font-bold text-emerald-400">référence</span> les produits par leur slug —
              aucune donnée produit n’est dupliquée ici. Produit supprimé&nbsp;: référence inactive affichée.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap shrink-0 mt-4 sm:mt-0 sm:ml-auto">
          <button
            type="button"
            onClick={() => void loadAll()}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 text-white text-xs font-bold border border-white/10 transition-all cursor-pointer shadow-sm active:scale-95"
            title="Recharger depuis Firestore"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#38E044] ${saveState === 'idle' ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </button>
          <button
            type="button"
            onClick={openSeedConfirm}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 text-white text-xs font-bold border border-white/10 transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Réinitialiser depuis la référence</span>
          </button>
          <button
            type="button"
            onClick={() =>
              setConfirm({
                kind: 'delete',
                title: 'Supprimer le méga-menu ?',
                body: 'Le site public retombera sur le méga-menu de référence (MEGA_COLUMNS), non cliquable pour les références sans produit. Action réversible : vous pourrez ré-enregistrer un menu.',
              })
            }
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-neutral-800/80 hover:bg-rose-900/60 text-white text-xs font-bold border border-white/10 transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span>Retour au fallback</span>
          </button>
          <button
            type="button"
            onClick={() => void save()}
            disabled={saveState === 'saving' || saveState === 'idle'}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#38E044] hover:bg-[#2fcb3c] text-black text-xs font-extrabold transition-all cursor-pointer shadow-[0_0_16px_rgba(56,224,68,0.35)] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saveState === 'saving' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{saveState === 'saving' ? 'Enregistrement…' : 'Enregistrer sur le site'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-300 text-xs font-semibold">
          <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
          <span className="flex-1">{error}</span>
          <button
            type="button"
            onClick={() => void loadAll()}
            className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold transition-colors cursor-pointer"
          >
            Réessayer
          </button>
        </div>
      )}

      {savedNotice && !error && (
        <div className="flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="flex-1">{savedNotice}</span>
          <button
            type="button"
            onClick={() => setSavedNotice(null)}
            className="text-emerald-300/70 hover:text-emerald-200 transition-colors cursor-pointer"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {columns !== null && columns.length === 0 && savedRef === null && (
        <div className="flex flex-col items-center gap-4 py-14 rounded-3xl bg-white dark:bg-zinc-900 border border-neutral-200/80 dark:border-white/10 text-center px-6">
          <p className="text-sm text-neutral-600 dark:text-neutral-300 max-w-lg">
            Aucun méga-menu enregistré sur ce site. Le public voit actuellement le menu de référence
            (<span className="font-mono">MEGA_COLUMNS</span>), dont les entrées sans produit sont grisées.
            Initialisez depuis la référence ou partez d’un menu vide.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={openSeedConfirm}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#38E044] hover:bg-[#2fcb3c] text-black text-xs font-extrabold transition-all cursor-pointer active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Initialiser depuis la référence</span>
            </button>
            <button
              type="button"
              onClick={() =>
                setConfirm({
                  kind: 'empty',
                  title: 'Partir d’un menu vide ?',
                  body: 'Crée une structure vide : vous ajouterez ensuite les colonnes et références.',
                })
              }
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 text-white text-xs font-bold border border-white/10 transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Menu vide</span>
            </button>
          </div>
        </div>
      )}

      {columns !== null && columns.length > 0 && (
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6 items-start">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragEnd={onDragEnd}
            onDragCancel={() => setActiveDrag(null)}
          >
            <SortableContext items={colIds} strategy={verticalListSortingStrategy}>
              <div className="space-y-4">
                {columns.map((col, index) => (
                  <ColumnCard
                    key={col.id}
                    column={col}
                    index={index}
                    total={columns.length}
                    bySlug={bySlug}
                    isActive={activeColumnId === col.id}
                    onSelect={() => setActiveColumnId(col.id)}
                    onPatchColumn={(patch) => patchColumn(col.id, patch)}
                    onRemoveColumn={() => removeColumn(col.id)}
                    onMoveColumn={(dir) => moveColumn(col.id, dir)}
                    onPatchItem={(itemId, patch) => patchItem(col.id, itemId, patch)}
                    onToggleItem={(itemId) => toggleItem(col.id, itemId)}
                    onRemoveItem={(itemId) => removeItem(col.id, itemId)}
                    onAddItemColumn={() => addItemToColumn(col.id, { id: generateId('item'), label: 'Nouvel élément', productSlug: null, catalogSlug: null, visible: true })}
                  />
                ))}
                <button
                  type="button"
                  onClick={addColumn}
                  className="w-full flex items-center justify-center gap-2 px-4 py-4 rounded-2xl border border-dashed border-neutral-300 dark:border-white/15 text-xs font-bold text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:border-neutral-400 dark:hover:border-white/40 transition-all cursor-pointer bg-white dark:bg-zinc-900"
                >
                  <Plus className="w-4 h-4" />
                  <span>Ajouter une section</span>
                </button>
              </div>
            </SortableContext>
          </DndContext>

          <div className="bg-white dark:bg-zinc-900 border border-neutral-200/80 dark:border-white/10 rounded-3xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-neutral-200 dark:border-white/10">
              <h2 className="text-sm font-bold text-neutral-800 dark:text-white">Produits disponibles</h2>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                Sources : Firestore <span className="font-mono">site_web_products</span> (le menu n’en stocke
                que les slug).
              </p>
              {(columns.length > 0 && (
                <label className="mt-3 block">
                  <span className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400">
                    Ajouter les nouveaux produits dans la colonne&nbsp;:
                  </span>
                  <select
                    value={activeColumnId}
                    onChange={(e) => setActiveColumnId(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-xs rounded-xl bg-neutral-50 dark:bg-zinc-800 border border-neutral-200 dark:border-white/10 text-neutral-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-neutral-400"
                  >
                    {columns.map((c, i) => (
                      <option key={c.id} value={c.id}>
                        {i + 1}. {c.titleFr || c.titleEn || c.id}
                      </option>
                    ))}
                  </select>
                </label>
              )) || (
                <p className="mt-3 text-[11px] text-amber-600 dark:text-amber-400">
                  Ajoutez d’abord une section pour pouvoir référencer des produits.
                </p>
              )}
              <div className="mt-3 flex items-center gap-1.5 text-[11px] text-zinc-500">
                <Link2 className="w-3.5 h-3.5" />
                <span>
                  {configuredProductSlugs.size}/{products.length} produits référencés
                </span>
              </div>
            </div>
            <div className="max-h-[70vh] overflow-y-auto divide-y divide-neutral-100 dark:divide-white/5">
              {products.length === 0 ? (
                <p className="p-6 text-xs text-neutral-400">
                  Aucun produit Firestore trouvé. Créez d’abord des produits dans « Produits du site web ».
                </p>
              ) : (
                products.map((p) => {
                  const placements = placementsOf(p.slug);
                  const placed = placements.length > 0;
                  return (
                    <div key={p.slug} className="p-4 flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-neutral-800 dark:text-white truncate">
                            {p.name}
                          </span>
                          {p.status === 'published' && (
                            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 uppercase">
                              Publié
                            </span>
                          )}
                          {p.status === 'draft' && (
                            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 uppercase">
                              Brouillon
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-mono text-neutral-400">{p.slug}</div>
                        {placed && (
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {placements.map((pl) => (
                              <span
                                key={pl.itemId}
                                className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25"
                              >
                                {pl.columnTitle}
                                {pl.visible ? '' : ' · masqué'}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddProduct(p)}
                        disabled={saveState === 'saving'}
                        className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${
                          placed
                            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/40 hover:bg-amber-500/25'
                            : 'bg-[#38E044]/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 hover:bg-[#38E044]/25'
                        }`}
                        title={placed ? 'Déjà placé — ajouter une référence explicite' : 'Ajouter au menu'}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        {placed ? 'Re-référencer' : 'Ajouter'}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {confirm && (
        <div
          className="fixed inset-0 z-[400] flex items-center justify-center bg-black/70 backdrop-blur-sm p-6"
          onClick={() => setConfirm(null)}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-white/15 rounded-3xl p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">{confirm.title}</h3>
            <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">{confirm.body}</p>
            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirm(null)}
                className="px-4 py-2.5 rounded-xl bg-neutral-800/10 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 text-xs font-bold transition-colors cursor-pointer hover:bg-neutral-800/20 dark:hover:bg-neutral-700"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm.kind === 'seed') applySeed();
                  else if (confirm.kind === 'empty') applyEmpty();
                  else if (confirm.kind === 'delete') void deleteMenu();
                  else if (confirm.kind === 'dup' && confirm.product) {
                    addProductTo(activeColumnId, confirm.product);
                    setConfirm(null);
                  }
                }}
                className={`px-4 py-2.5 rounded-xl text-xs font-extrabold text-white transition-colors cursor-pointer ${
                  confirm.kind === 'delete'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-[#38E044] hover:bg-[#2fcb3c] text-black'
                }`}
              >
                {confirm.kind === 'delete' ? 'Supprimer' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function sanitizeForEdition(menu: MegaMenu): MegaMenu {
  try {
    return sanitizeMegaMenu(menu);
  } catch {
    return { columns: menu.columns.map((c) => ({ ...c, items: c.items.map((i) => ({ ...i })) })) };
  }
}

function ColumnCard(props: {
  column: MegaMenuColumn;
  index: number;
  total: number;
  bySlug: Map<string, ProductListItem>;
  isActive: boolean;
  onSelect: () => void;
  onPatchColumn: (patch: Partial<Pick<MegaMenuColumn, 'titleEn' | 'titleFr'>>) => void;
  onRemoveColumn: () => void;
  onMoveColumn: (dir: -1 | 1) => void;
  onPatchItem: (itemId: string, patch: Partial<MegaMenuItem>) => void;
  onToggleItem: (itemId: string) => void;
  onRemoveItem: (itemId: string) => void;
  onAddItemColumn: () => void;
}) {
  const {
    column,
    index,
    total,
    bySlug,
    isActive,
    onSelect,
    onPatchColumn,
    onRemoveColumn,
    onMoveColumn,
    onPatchItem,
    onToggleItem,
    onRemoveItem,
    onAddItemColumn,
  } = props;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: column.id,
  });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const itemIds = column.items.map((i) => i.id);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-2xl border bg-white dark:bg-zinc-900 overflow-hidden transition-all ${
        isDragging ? 'opacity-40 z-50 shadow-2xl' : ''
      } ${
        isActive
          ? 'border-[#38E044]/70 shadow-[0_0_0_1px_rgba(56,224,68,0.4)]'
          : 'border-neutral-200/80 dark:border-white/10'
      }`}
    >
      <div className="flex items-center gap-2 p-3 bg-neutral-50 dark:bg-white/[0.03] border-b border-neutral-200 dark:border-white/10">
        <span
          className="flex items-center gap-1 px-2 py-1 rounded-lg rounded-l bg-neutral-100 dark:bg-white/5 text-neutral-500 dark:text-neutral-400 cursor-grab active:cursor-grabbing"
          {...attributes}
          {...listeners}
          title="Glisser pour réorganiser la section"
        >
          <GripVertical className="w-4 h-4" />
        </span>
        <span className="px-2 py-1 rounded-lg rounded-l bg-neutral-100 dark:bg-white/5 text-[10px] font-mono font-bold text-neutral-500">
          {index + 1}/{total}
        </span>
        <input
          type="text"
          value={column.titleFr}
          onChange={(e) => onPatchColumn({ titleFr: e.target.value })}
          className="w-1/2 min-w-0 px-2 py-1 text-xs font-bold bg-transparent rounded-lg border border-transparent focus:border-emerald-500/50 focus:outline-none text-neutral-900 dark:text-white"
          placeholder="Titre FR"
          aria-label="Titre français"
        />
        <input
          type="text"
          value={column.titleEn}
          onChange={(e) => onPatchColumn({ titleEn: e.target.value })}
          className="w-1/2 min-w-0 px-2 py-1 text-xs font-mono uppercase tracking-wide bg-transparent rounded-lg border border-transparent focus:border-emerald-500/50 focus:outline-none text-neutral-500 dark:text-neutral-400"
          placeholder="Titre EN"
          aria-label="Titre anglais"
        />
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => onSelect()}
            title="Colonne cible d'ajout"
            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
              isActive
                ? 'bg-[#38E044] text-black'
                : 'bg-neutral-100 dark:bg-white/5 text-neutral-500 hover:text-neutral-700 dark:hover:text-white'
            }`}
          >
            cible
          </button>
          <button
            type="button"
            onClick={() => onMoveColumn(-1)}
            disabled={index === 0}
            className="p-1.5 rounded-lg bg-neutral-100 dark:bg-white/5 text-neutral-500 hover:text-white cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Monter la section"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onMoveColumn(1)}
            disabled={index === total - 1}
            className="p-1.5 rounded-lg bg-neutral-100 dark:bg-white/5 text-neutral-500 hover:text-white cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Descendre la section"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onRemoveColumn}
            className="p-1.5 rounded-lg bg-neutral-100 dark:bg-white/5 text-neutral-500 hover:text-rose-400 cursor-pointer transition-colors"
            aria-label="Supprimer la section"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="p-3">
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {column.items.length === 0 && (
              <p className="text-[11px] text-neutral-400 px-1">Aucun élément — référencez un produit à droite.</p>
            )}
            {column.items.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  product={item.productSlug ? (bySlug.get(item.productSlug) ?? null) : null}
                  onPatch={(patch) => onPatchItem(item.id, patch)}
                  onToggle={() => onToggleItem(item.id)}
                  onRemove={() => onRemoveItem(item.id)}
                />
            ))}
            <button
              type="button"
              onClick={onAddItemColumn}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-dashed border-neutral-300 dark:border-white/15 text-[11px] font-bold text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:border-neutral-400 dark:hover:border-white/40 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ajouter un élément</span>
            </button>
          </div>
        </SortableContext>
      </div>
    </div>
  );
}

function ItemRow(props: {
  item: MegaMenuItem;
  product: ProductListItem | null;
  onPatch: (patch: Partial<MegaMenuItem>) => void;
  onToggle: () => void;
  onRemove: () => void;
}) {
  const { item, product, onPatch, onToggle, onRemove } = props;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const state = refState(item, product);
  const badge = refBadge(state);
  const slugInvalid = !!item.productSlug && !isValidSlug(item.productSlug);
  const masked = item.visible === false;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 rounded-xl border bg-neutral-50 dark:bg-white/[0.03] px-2.5 py-2 transition-opacity ${
        isDragging ? 'opacity-40 z-40 shadow-lg' : ''
      } ${masked ? 'border-amber-500/40' : 'border-neutral-200 dark:border-white/10'}`}
    >
      <span
        className="text-neutral-400 cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
        title="Glisser (également entre sections)"
      >
        <GripVertical className="w-4 h-4" />
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={item.label}
            onChange={(e) => onPatch({ label: e.target.value })}
            className="w-full min-w-0 px-2 py-1 text-xs font-bold bg-transparent rounded-lg border border-transparent focus:border-emerald-500/50 focus:outline-none text-neutral-900 dark:text-white"
            placeholder="Libellé affiché"
            aria-label="Libellé"
          />
          <button
            type="button"
            onClick={onToggle}
            className={`shrink-0 p-1.5 rounded-lg transition-colors cursor-pointer ${
              masked
                ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                : 'bg-neutral-100 dark:bg-white/5 text-neutral-400 hover:text-white'
            }`}
            title={masked ? 'Masqué — cliquer pour rendre visible' : 'Visible — cliquer pour masquer'}
            aria-label="Basculer la visibilité"
          >
            {masked ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="shrink-0 p-1.5 rounded-lg bg-neutral-100 dark:bg-white/5 text-neutral-500 hover:text-rose-400 cursor-pointer transition-colors"
            aria-label="Retirer l'élément"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex items-center gap-2 px-2 mt-1">
          <input
            type="text"
            value={item.productSlug ?? ''}
            onChange={(e) => onPatch({ productSlug: e.target.value === '' ? null : e.target.value })}
            className={`w-40 px-2 py-1 text-[11px] font-mono bg-transparent rounded-lg border focus:outline-none text-neutral-600 dark:text-neutral-300 ${
              slugInvalid
                ? 'border-rose-500/60 text-rose-500'
                : 'border-neutral-200 dark:border-white/10 focus:border-emerald-500/50'
            }`}
            placeholder="productSlug (référence Firestore)"
            aria-label="productSlug"
          />
          <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-mono font-bold border uppercase ${badge.className}`}>
            {badge.text}
          </span>
        </div>
        {item.catalogSlug && item.catalogSlug !== (item.productSlug ?? '') && (
          <div className="px-2 mt-1 text-[10px] font-mono text-neutral-400">
            catalogSlug (legacy) : {item.catalogSlug}
          </div>
        )}
      </div>
    </div>
  );
}