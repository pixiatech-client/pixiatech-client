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
  Image as ImageIcon,
  Link2,
  Loader2,
  Globe,
  Plus,
  RefreshCw,
  Save,
  SlidersHorizontal,
  Trash2,
  X,
  Layers,
  Menu as MenuIcon,
  LayoutGrid,
  FileText,
  Settings2,
} from 'lucide-react';
import {
  emptyMegaMenu,
  generateId,
  sanitizeMegaMenu,
} from '@/lib/products/mega-menu';
import {
  isValidSlug,
  type MegaMenu,
  type MegaMenuItem,
  type MegaMenuColumn,
  type Product,
  type MainNavItem,
  DEFAULT_MAIN_NAV_ITEMS,
} from '@/lib/products/types';

interface ProductListItem {
  slug: string;
  name: string;
  status: 'draft' | 'published' | 'deleted';
  img?: string;
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
        text: `Réf. inactive — introuvable : ${state.slug}`,
        className: 'bg-rose-500/15 text-rose-400 border-rose-500/40',
      };
    case 'legacy':
      return {
        text: `Réf. legacy : ${state.slug}`,
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

export function MenuEditor() {
  const [activeTab, setActiveTab] = useState<'main' | 'mega'>('main');
  const [headerMenuType, setHeaderMenuType] = useState<'classic' | 'mega'>('mega');
  const [descriptionMode, setDescriptionMode] = useState<'individual' | 'global'>('individual');
  const [globalMessageFr, setGlobalMessageFr] = useState<string>('');
  const [globalMessageEn, setGlobalMessageEn] = useState<string>('');
  const [insightsSlug, setInsightsSlug] = useState<string>('nos-conseils');
  const [mainNavItems, setMainNavItems] = useState<MainNavItem[]>(DEFAULT_MAIN_NAV_ITEMS);

  const [columns, setColumns] = useState<MegaMenuColumn[] | null>(null);
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [savedRef, setSavedRef] = useState<MegaMenu | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [activeDrag, setActiveDrag] = useState<null | {
    type: 'col' | 'item' | 'nav';
    id: string;
    fromColumnId?: string;
  }>(null);
  const [confirm, setConfirm] = useState<null | {
    kind: 'empty' | 'delete' | 'dup';
    title: string;
    body: string;
    product?: ProductListItem;
  }>(null);
  const [activeColumnId, setActiveColumnId] = useState<string>('');

  useEffect(() => {
    void loadAll();
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
        setError(menuJson.error ?? 'Impossible de charger les menus.');
        setSaveState('error');
        return;
      }
      const menu = menuJson.menu;
      if (menu) {
        setHeaderMenuType(menu.headerMenuType === 'classic' ? 'classic' : 'mega');
        setDescriptionMode(menu.descriptionMode === 'global' ? 'global' : 'individual');
        setGlobalMessageFr(menu.globalMessageFr ?? '');
        setGlobalMessageEn(menu.globalMessageEn ?? '');
        setInsightsSlug(menu.insightsSlug || 'nos-conseils');
        if (Array.isArray(menu.mainNavItems) && menu.mainNavItems.length > 0) {
          setMainNavItems(menu.mainNavItems);
        } else {
          setMainNavItems(DEFAULT_MAIN_NAV_ITEMS);
        }

        if (Array.isArray(menu.columns) && menu.columns.length > 0) {
          const next = cloneColumns(sanitizeMegaMenu(menu).columns);
          setColumns(next);
          setActiveColumnId(next[0]?.id ?? '');
        } else {
          setColumns([]);
          setActiveColumnId('');
        }
        setSavedRef(menu);
      } else {
        setHeaderMenuType('mega');
        setDescriptionMode('individual');
        setGlobalMessageFr('');
        setGlobalMessageEn('');
        setInsightsSlug('nos-conseils');
        setMainNavItems(DEFAULT_MAIN_NAV_ITEMS);
        setColumns([]);
        setActiveColumnId('');
        setSavedRef(null);
      }

      const prodJson = (await productsRes.json()) as {
        success: boolean;
        products?: Array<ProductListItem & { media?: Product['media'] }>;
      };
      if (prodJson.success && Array.isArray(prodJson.products)) {
        setProducts(
          prodJson.products.map((p) => ({
            slug: p.slug,
            name: p.name,
            status: p.status,
            img: p.media?.photos?.find((ph) => ph.url)?.url ?? undefined,
          }))
        );
      }
      setSaveState('saved');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement.');
      setSaveState('error');
    }
  }, []);

  const markDirty = useCallback(() => {
    setSaveState('dirty');
    setError(null);
  }, []);

  const patchColumn = useCallback(
    (columnId: string, patch: Partial<Pick<MegaMenuColumn, 'titleEn' | 'titleFr' | 'descFr' | 'descEn'>>) => {
      if (!columns) return;
      setColumns(columns.map((c) => (c.id === columnId ? { ...c, ...patch } : c)));
      markDirty();
    },
    [columns, markDirty]
  );

  const patchItem = useCallback(
    (columnId: string, itemId: string, patch: Partial<MegaMenuItem>) => {
      if (!columns) return;
      setColumns(
        columns.map((c) =>
          c.id === columnId
            ? { ...c, items: c.items.map((i) => (i.id === itemId ? { ...i, ...patch } : i)) }
            : c
        )
      );
      markDirty();
    },
    [columns, markDirty]
  );

  const toggleItem = useCallback(
    (columnId: string, itemId: string) => {
      if (!columns) return;
      setColumns(
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
      markDirty();
    },
    [columns, markDirty]
  );

  const removeItem = useCallback(
    (columnId: string, itemId: string) => {
      if (!columns) return;
      setColumns(
        columns.map((c) =>
          c.id === columnId ? { ...c, items: c.items.filter((i) => i.id !== itemId) } : c
        )
      );
      markDirty();
    },
    [columns, markDirty]
  );

  const addItemToColumn = useCallback(
    (columnId: string, item: MegaMenuItem) => {
      if (!columns) return;
      const existCol = columns.find((c) => c.id === columnId);
      const targetId = existCol ? columnId : (columns[0]?.id ?? '');
      if (!targetId) return;
      setColumns(
        columns.map((c) => (c.id === targetId ? { ...c, items: [...c.items, item] } : c))
      );
      markDirty();
    },
    [columns, markDirty]
  );

  const addColumn = useCallback(() => {
    if (!columns) return;
    const next = [
      ...columns,
      { id: generateId('col'), titleEn: 'NEW COLUMN', titleFr: 'NOUVELLE COLONNE', items: [] },
    ];
    setColumns(next);
    setActiveColumnId(next[next.length - 1].id);
    markDirty();
  }, [columns, markDirty]);

  const removeColumn = useCallback(
    (columnId: string) => {
      if (!columns) return;
      setColumns(columns.filter((c) => c.id !== columnId));
      setActiveColumnId((prev) => (prev === columnId ? columns[0]?.id ?? '' : prev));
      markDirty();
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
      setColumns(next);
      markDirty();
    },
    [columns, markDirty]
  );

  const patchNavItem = useCallback((id: string, patch: Partial<MainNavItem>) => {
    setMainNavItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
    markDirty();
  }, [markDirty]);

  const moveNavItem = useCallback((id: string, dir: -1 | 1) => {
    setMainNavItems((prev) => {
      const idx = prev.findIndex((i) => i.id === id);
      const to = idx + dir;
      if (idx < 0 || to < 0 || to >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(idx, 1);
      next.splice(to, 0, item);
      return next.map((it, i) => ({ ...it, order: i + 1 }));
    });
    markDirty();
  }, [markDirty]);

  const addNavItem = useCallback(() => {
    setMainNavItems((prev) => [
      ...prev,
      {
        id: generateId('nav'),
        labelFr: 'Nouveau lien',
        labelEn: 'New link',
        href: '/',
        type: 'page',
        order: prev.length + 1,
        visibleOnHome: true,
        visibleOnInner: true,
        enabled: true,
      },
    ]);
    markDirty();
  }, [markDirty]);

  const removeNavItem = useCallback((id: string) => {
    setMainNavItems((prev) => prev.filter((i) => i.id !== id));
    markDirty();
  }, [markDirty]);

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
      markDirty();
    },
    [activeDrag, findContainer, columns, markDirty]
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
            setColumns(arrayMove(columns, from, to));
            markDirty();
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
            setColumns(next);
            markDirty();
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
          body: `« ${product.name} » est déjà référencé. Ajouter une référence supplémentaire ?`,
          product,
        });
        return;
      }
      addProductTo(targetId, product);
    },
    [activeColumnId, columns, configuredProductSlugs]
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
    setSaveState('saving');
    setError(null);
    setSavedNotice(null);
    try {
      const payload: MegaMenu = {
        columns: columns ? cloneColumns(columns) : [],
        headerMenuType,
        descriptionMode,
        globalMessageFr,
        globalMessageEn,
        insightsSlug,
        mainNavItems,
      };
      sanitizeMegaMenu(payload);
      const res = await fetch('/api/site-web/mega-menu', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as { success: boolean; menu?: MegaMenu; message?: string; error?: string };
      if (!res.ok || !json.success) {
        throw new Error(json.message ?? json.error ?? 'Enregistrement impossible.');
      }
      setSavedRef(json.menu ?? payload);
      setSaveState('saved');
      setSavedNotice(json.message ?? 'Configuration des menus enregistrée avec succès.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Enregistrement impossible.');
      setSaveState('error');
    }
  }, [columns, headerMenuType, descriptionMode, globalMessageFr, globalMessageEn, insightsSlug, mainNavItems]);

  const applyEmpty = useCallback(() => {
    const next = emptyMegaMenu().columns;
    setColumns(next);
    setActiveColumnId(next[0]?.id ?? '');
    setConfirm(null);
    markDirty();
    setSavedNotice('Menu réinitialisé — pensez à enregistrer.');
  }, [markDirty]);

  const statusPill: Record<SaveState, { text: string; className: string }> = {
    idle: { text: 'Chargement…', className: 'bg-zinc-500/20 text-zinc-300' },
    dirty: {
      text: 'Modifications non enregistrées',
      className: 'bg-amber-500/15 text-amber-400 border border-amber-500/40',
    },
    saving: { text: 'Enregistrement en cours', className: 'bg-zinc-500/20 text-zinc-300' },
    saved: {
      text: 'Enregistré sur le site',
      className: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/40',
    },
    error: { text: 'Erreur d’enregistrement', className: 'bg-rose-500/15 text-rose-400 border border-rose-500/40' },
  };

  if (saveState === 'idle' && columns === null) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
        <span className="ml-3 text-sm text-neutral-400">Chargement des menus…</span>
      </div>
    );
  }

  const colIds = (columns ?? []).map((c) => c.id);

  return (
    <div className="space-y-6">
      {/* En-tête principal */}
      <div className="bg-[#0A0D0E] border border-neutral-800 rounded-3xl p-5 sm:p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-[#141B1E] border border-neutral-700 flex items-center justify-center shrink-0">
              <Globe className="w-6 h-6 text-[color:var(--ui-accent)]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold tracking-tight">Gestion des menus</h1>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${statusPill[saveState].className}`}>
                  {saveState === 'saving' && <Loader2 className="w-3 h-3 animate-spin" />}
                  {saveState === 'saved' && <CheckCircle2 className="w-3 h-3" />}
                  {statusPill[saveState].text}
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-1">
                Configurez la navigation du site web : menu classique ou méga-menu, liens personnalisés et descriptions dynamiques.
              </p>
            </div>
          </div>

          {/* Switch de mode de menu principal : Classique vs Mega */}
          <div className="flex items-center gap-2 bg-[#141B1E] p-1.5 rounded-2xl border border-neutral-800 self-start md:self-auto">
            <button
              type="button"
              onClick={() => {
                setHeaderMenuType('classic');
                markDirty();
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                headerMenuType === 'classic'
                  ? 'bg-[color:var(--ui-accent)] text-black shadow-md'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <MenuIcon className="w-3.5 h-3.5" />
              <span>Menu classique</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setHeaderMenuType('mega');
                markDirty();
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                headerMenuType === 'mega'
                  ? 'bg-[color:var(--ui-accent)] text-black shadow-md'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Méga menu</span>
            </button>
          </div>
        </div>
      </div>

      {/* Barre d'actions & Onglets */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 bg-neutral-100 dark:bg-zinc-900 p-1 rounded-2xl border border-neutral-200 dark:border-white/10">
          <button
            type="button"
            onClick={() => setActiveTab('main')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'main'
                ? 'bg-white dark:bg-zinc-800 text-neutral-900 dark:text-white shadow-sm border border-neutral-200 dark:border-white/10'
                : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-[color:var(--ui-accent)]" />
            <span>1. Navigation principale</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('mega')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'mega'
                ? 'bg-white dark:bg-zinc-800 text-neutral-900 dark:text-white shadow-sm border border-neutral-200 dark:border-white/10'
                : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-white'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5 text-[color:var(--ui-accent)]" />
            <span>2. Méga menu Produits</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void loadAll()}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-white/5 dark:hover:bg-white/10 text-neutral-700 dark:text-neutral-100 text-xs font-bold border border-neutral-300/80 dark:border-white/15 transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[color:var(--ui-accent)] ${saveState === 'idle' ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </button>
          <button
            type="button"
            onClick={() => void save()}
            disabled={saveState === 'saving'}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[color:var(--ui-accent)] hover:bg-[color:var(--ui-accent-hover)] text-black text-xs font-extrabold transition-all cursor-pointer shadow-[0_0_16px_rgba(var(--ui-accent-rgb),0.35)] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
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
        </div>
      )}

      {savedNotice && !error && (
        <div className="flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="flex-1">{savedNotice}</span>
          <button type="button" onClick={() => setSavedNotice(null)} className="cursor-pointer text-emerald-300/70 hover:text-emerald-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ONGLET 1 : NAVIGATION PRINCIPALE */}
      {activeTab === 'main' && (
        <div className="space-y-6">
          {/* Card Options Générales */}
          <div className="bg-white dark:bg-zinc-900 border border-neutral-200/80 dark:border-white/10 rounded-3xl p-5 sm:p-6 shadow-sm">
            <h2 className="text-sm font-bold text-neutral-800 dark:text-white flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-[color:var(--ui-accent)]" />
              <span>Paramètres généraux de la navigation</span>
            </h2>
            <div className="mt-4 max-w-md">
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                Slug de la page « Nos conseils »
              </label>
              <p className="text-[11px] text-neutral-400 mb-2">
                URL publique de la page de conseils (ex: <code className="font-mono">nos-conseils</code> ou <code className="font-mono">insights</code>).
              </p>
              <input
                type="text"
                value={insightsSlug}
                onChange={(e) => {
                  setInsightsSlug(e.target.value);
                  markDirty();
                }}
                placeholder="nos-conseils"
                className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-neutral-50 dark:bg-zinc-800 border border-neutral-200 dark:border-white/10 text-neutral-800 dark:text-white"
              />
            </div>
          </div>

          {/* Liste des Liens du Menu */}
          <div className="bg-white dark:bg-zinc-900 border border-neutral-200/80 dark:border-white/10 rounded-3xl p-5 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div>
                <h2 className="text-sm font-bold text-neutral-800 dark:text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[color:var(--ui-accent)]" />
                  <span>Liens du menu principal</span>
                </h2>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Gérez la visibilité selon le contexte (Accueil One-Page vs Pages intérieures).
                </p>
              </div>
              <button
                type="button"
                onClick={addNavItem}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[rgba(var(--ui-accent-rgb),0.15)] text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 text-xs font-bold hover:bg-[rgba(var(--ui-accent-rgb),0.25)] transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajouter un lien</span>
              </button>
            </div>

            <div className="space-y-3">
              {mainNavItems.map((item, index) => (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    item.enabled
                      ? 'bg-neutral-50 dark:bg-white/[0.02] border-neutral-200 dark:border-white/10'
                      : 'bg-neutral-100/50 dark:bg-white/[0.01] border-neutral-200/50 dark:border-white/5 opacity-60'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-xs font-mono font-bold text-neutral-400 w-6 shrink-0">
                        {index + 1}.
                      </span>
                      <input
                        type="text"
                        value={item.labelFr}
                        onChange={(e) => patchNavItem(item.id, { labelFr: e.target.value })}
                        placeholder="Libellé FR"
                        className="px-2.5 py-1 text-xs font-bold rounded-lg bg-white dark:bg-zinc-800 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white w-36"
                      />
                      <input
                        type="text"
                        value={item.labelEn}
                        onChange={(e) => patchNavItem(item.id, { labelEn: e.target.value })}
                        placeholder="Libellé EN"
                        className="px-2.5 py-1 text-xs font-bold rounded-lg bg-white dark:bg-zinc-800 border border-neutral-200 dark:border-white/10 text-neutral-500 dark:text-neutral-400 w-36"
                      />
                      <input
                        type="text"
                        value={item.href}
                        onChange={(e) => patchNavItem(item.id, { href: e.target.value })}
                        placeholder="/route ou #ancre"
                        className="px-2.5 py-1 text-xs font-mono rounded-lg bg-white dark:bg-zinc-800 border border-neutral-200 dark:border-white/10 text-neutral-700 dark:text-neutral-300 flex-1 min-w-[140px]"
                      />
                    </div>

                    <div className="flex items-center gap-3 self-end md:self-auto flex-wrap">
                      <label className="flex items-center gap-1.5 text-[11px] font-medium text-neutral-600 dark:text-neutral-400 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.visibleOnHome}
                          onChange={(e) => patchNavItem(item.id, { visibleOnHome: e.target.checked })}
                          className="rounded border-neutral-300 text-emerald-500 focus:ring-emerald-400"
                        />
                        <span>Accueil</span>
                      </label>

                      <label className="flex items-center gap-1.5 text-[11px] font-medium text-neutral-600 dark:text-neutral-400 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.visibleOnInner}
                          onChange={(e) => patchNavItem(item.id, { visibleOnInner: e.target.checked })}
                          className="rounded border-neutral-300 text-emerald-500 focus:ring-emerald-400"
                        />
                        <span>Pages intérieures</span>
                      </label>

                      <button
                        type="button"
                        onClick={() => patchNavItem(item.id, { enabled: !item.enabled })}
                        className={`p-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                          item.enabled
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                            : 'bg-neutral-200 dark:bg-zinc-800 text-neutral-400'
                        }`}
                        title={item.enabled ? 'Lien actif' : 'Lien désactivé'}
                      >
                        {item.enabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => moveNavItem(item.id, -1)}
                          className="p-1.5 rounded-lg bg-neutral-200/70 dark:bg-zinc-800 text-neutral-500 hover:text-white cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={index === mainNavItems.length - 1}
                          onClick={() => moveNavItem(item.id, 1)}
                          className="p-1.5 rounded-lg bg-neutral-200/70 dark:bg-zinc-800 text-neutral-500 hover:text-white cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeNavItem(item.id)}
                          className="p-1.5 rounded-lg bg-neutral-200/70 dark:bg-zinc-800 text-neutral-500 hover:text-rose-400 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ONGLET 2 : MÉGA MENU PRODUITS */}
      {activeTab === 'mega' && (
        <div className="space-y-6">
          {/* Section 14 : Gestion des Descriptions */}
          <div className="bg-white dark:bg-zinc-900 border border-neutral-200/80 dark:border-white/10 rounded-3xl p-5 sm:p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-sm font-bold text-neutral-800 dark:text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[color:var(--ui-accent)]" />
                  <span>Gestion des descriptions du panneau latéral</span>
                </h2>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Choisissez comment le texte de description s'affiche lors du survol d'un produit dans le méga-menu.
                </p>
              </div>

              {/* Toggle Mode 1 vs Mode 2 */}
              <div className="flex items-center gap-2 bg-neutral-100 dark:bg-zinc-800 p-1 rounded-2xl border border-neutral-200 dark:border-white/10 self-start md:self-auto">
                <button
                  type="button"
                  onClick={() => {
                    setDescriptionMode('individual');
                    markDirty();
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    descriptionMode === 'individual'
                      ? 'bg-[color:var(--ui-accent)] text-black shadow-sm'
                      : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-white'
                  }`}
                >
                  Mode 2 : Description individuelle
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDescriptionMode('global');
                    markDirty();
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    descriptionMode === 'global'
                      ? 'bg-[color:var(--ui-accent)] text-black shadow-sm'
                      : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-white'
                  }`}
                >
                  Mode 1 : Message global fixe
                </button>
              </div>
            </div>

            {/* Détail du mode sélectionné */}
            {descriptionMode === 'global' ? (
              <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/20 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-sky-600 dark:text-sky-400">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Mode 1 actif : Ce message unique sera affiché pour toute la série, quel que soit le produit survolé.</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      Message global fixe (Français)
                    </label>
                    <textarea
                      rows={3}
                      value={globalMessageFr}
                      onChange={(e) => {
                        setGlobalMessageFr(e.target.value);
                        markDirty();
                      }}
                      placeholder="Rédigez un paragraphe commun qui présente l’ensemble de vos solutions…"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-zinc-800 border border-neutral-200 dark:border-white/10 text-neutral-800 dark:text-white resize-y"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      Message global fixe (Anglais)
                    </label>
                    <textarea
                      rows={3}
                      value={globalMessageEn}
                      onChange={(e) => {
                        setGlobalMessageEn(e.target.value);
                        markDirty();
                      }}
                      placeholder="Write a common paragraph introducing all your solutions…"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-zinc-800 border border-neutral-200 dark:border-white/10 text-neutral-800 dark:text-white resize-y"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-neutral-100/60 dark:bg-white/[0.02] border border-neutral-200 dark:border-white/10 text-xs text-neutral-600 dark:text-neutral-400">
                <p>
                  <span className="font-bold text-emerald-500">● Mode 2 actif :</span> Chaque produit utilise sa propre description configurée ci-dessous. Si un produit n’a pas de texte spécifique, il hérite automatiquement de la description de sa colonne ou de sa fiche produit.
                </p>
              </div>
            )}
          </div>

          {/* Grille des colonnes et produits */}
          {columns !== null && columns.length === 0 && savedRef === null && (
            <div className="flex flex-col items-center gap-4 py-14 rounded-3xl bg-white dark:bg-zinc-900 border border-neutral-200/80 dark:border-white/10 text-center px-6">
              <p className="text-sm text-neutral-600 dark:text-neutral-300 max-w-lg">
                <span className="font-bold">Aucun méga-menu configuré.</span> Créez un menu pour organiser vos produits en colonnes.
              </p>
              <button
                type="button"
                onClick={applyEmpty}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[color:var(--ui-accent)] hover:bg-[color:var(--ui-accent-hover)] text-black text-xs font-extrabold transition-all cursor-pointer shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>Créer un méga-menu</span>
              </button>
            </div>
          )}

          {columns !== null && columns.length > 0 && (
            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-6 items-start">
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
                        onAddItemColumn={() =>
                          addItemToColumn(col.id, {
                            id: generateId('item'),
                            label: 'Nouvel élément',
                            productSlug: null,
                            catalogSlug: null,
                            visible: true,
                          })
                        }
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

              {/* Colonne latérale des produits disponibles */}
              <div className="xl:sticky xl:top-[88px] xl:self-start xl:h-[calc(100dvh-88px-2rem)] xl:flex xl:flex-col bg-white dark:bg-zinc-900 border border-neutral-200/80 dark:border-white/10 rounded-3xl overflow-hidden shadow-sm">
                <div className="shrink-0 p-4 border-b border-neutral-200 dark:border-white/10">
                  <h2 className="text-sm font-bold text-neutral-800 dark:text-white">Produits disponibles</h2>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Sources : Firestore <span className="font-mono">site_web_products</span>.
                  </p>
                  {columns.length > 0 && (
                    <label className="mt-3 block">
                      <span className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400">
                        Ajouter les nouveaux produits dans la colonne&nbsp;:
                      </span>
                      <select
                        value={activeColumnId}
                        onChange={(e) => setActiveColumnId(e.target.value)}
                        className="w-full mt-1 px-3 py-2 text-xs rounded-xl bg-neutral-50 dark:bg-zinc-800 border border-neutral-200 dark:border-white/10 text-neutral-800 dark:text-white focus:outline-none"
                      >
                        {columns.map((c, i) => (
                          <option key={c.id} value={c.id}>
                            {i + 1}. {c.titleFr || c.titleEn || c.id}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  <div className="mt-3 flex items-center gap-1.5 text-[11px] text-zinc-500">
                    <Link2 className="w-3.5 h-3.5" />
                    <span>
                      {configuredProductSlugs.size}/{products.length} produits référencés
                    </span>
                  </div>
                </div>
                <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-neutral-100 dark:divide-white/5">
                  {products.length === 0 ? (
                    <p className="p-6 text-xs text-neutral-400">Aucun produit Firestore trouvé.</p>
                  ) : (
                    products.map((p) => {
                      const placements = placementsOf(p.slug);
                      const placed = placements.length > 0;
                      return (
                        <div key={p.slug} className="p-4 flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            {p.img ? (
                              <img
                                src={p.img}
                                alt=""
                                loading="lazy"
                                className="w-14 h-14 shrink-0 rounded-lg object-cover bg-white dark:bg-zinc-800 border border-neutral-200 dark:border-white/10"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-14 h-14 shrink-0 rounded-lg bg-neutral-200/70 dark:bg-white/5 border border-neutral-200 dark:border-white/10 flex items-center justify-center text-neutral-400">
                                <ImageIcon className="w-5 h-5" />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold text-neutral-800 dark:text-white truncate">
                                  {p.name}
                                </span>
                              </div>
                              <div className="text-[10px] font-mono text-neutral-400">{p.slug}</div>
                              {placed ? (
                                <div className="mt-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                  ✓ Placé dans {placements.map((pl) => pl.columnTitle).join(', ')}
                                </div>
                              ) : (
                                <div className="mt-1 text-[10px] text-neutral-400">Non placé</div>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAddProduct(p)}
                            disabled={saveState === 'saving'}
                            className={`shrink-0 px-2.5 py-1.5 rounded-xl text-[10px] font-extrabold transition-all cursor-pointer ${
                              placed
                                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/40'
                                : 'bg-[rgba(var(--ui-accent-rgb),0.15)] text-emerald-600 dark:text-emerald-400 border border-emerald-500/40'
                            }`}
                          >
                            {placed ? 'Re-placer' : '+ Ajouter'}
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}
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
                className="px-4 py-2.5 rounded-xl bg-neutral-800/10 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 text-xs font-bold transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm.kind === 'empty') applyEmpty();
                  else if (confirm.kind === 'dup' && confirm.product) {
                    addProductTo(activeColumnId, confirm.product);
                    setConfirm(null);
                  }
                }}
                className="px-4 py-2.5 rounded-xl text-xs font-extrabold bg-[color:var(--ui-accent)] hover:bg-[color:var(--ui-accent-hover)] text-black cursor-pointer"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ColumnCard(props: {
  column: MegaMenuColumn;
  index: number;
  total: number;
  bySlug: Map<string, ProductListItem>;
  isActive: boolean;
  onSelect: () => void;
  onPatchColumn: (patch: Partial<Pick<MegaMenuColumn, 'titleEn' | 'titleFr' | 'descFr' | 'descEn'>>) => void;
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
          ? 'border-[rgba(var(--ui-accent-rgb),0.7)] shadow-[0_0_0_1px_rgba(var(--ui-accent-rgb),0.4)]'
          : 'border-neutral-200/80 dark:border-white/10'
      }`}
    >
      <div className="flex items-center gap-2 p-3 bg-neutral-50 dark:bg-white/[0.03] border-b border-neutral-200 dark:border-white/10">
        <span
          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-neutral-100 dark:bg-white/5 text-neutral-500 cursor-grab active:cursor-grabbing"
          {...attributes}
          {...listeners}
          title="Glisser pour réorganiser"
        >
          <GripVertical className="w-4 h-4" />
        </span>
        <span className="px-2 py-1 rounded-lg bg-neutral-100 dark:bg-white/5 text-[10px] font-mono font-bold text-neutral-500">
          {index + 1}/{total}
        </span>
        <div className="flex items-center gap-1 flex-1 min-w-0">
          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shrink-0">
            FR
          </span>
          <input
            type="text"
            value={column.titleFr}
            onChange={(e) => onPatchColumn({ titleFr: e.target.value })}
            className="w-full min-w-0 px-2 py-1 text-xs font-bold bg-transparent rounded-lg border border-transparent focus:border-emerald-500/50 focus:outline-none text-neutral-900 dark:text-white"
            placeholder="Titre colonne en français"
            title="Titre de la colonne affiché aux visiteurs francophones"
          />
        </div>
        <div className="flex items-center gap-1 flex-1 min-w-0">
          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30 shrink-0">
            EN
          </span>
          <input
            type="text"
            value={column.titleEn}
            onChange={(e) => onPatchColumn({ titleEn: e.target.value })}
            className="w-full min-w-0 px-2 py-1 text-xs font-mono uppercase tracking-wide bg-transparent rounded-lg border border-transparent focus:border-emerald-500/50 focus:outline-none text-neutral-500 dark:text-neutral-400"
            placeholder="Titre colonne en anglais (site en EN)"
            title="Titre de la colonne affiché si le visiteur passe le site en anglais (bouton EN)"
          />
        </div>
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => onSelect()}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
              isActive
                ? 'bg-[color:var(--ui-accent)] text-black'
                : 'bg-neutral-100 dark:bg-white/5 text-neutral-500 hover:text-neutral-700 dark:hover:text-white'
            }`}
          >
            cible
          </button>
          <button
            type="button"
            onClick={() => onMoveColumn(-1)}
            disabled={index === 0}
            className="p-1.5 rounded-lg bg-neutral-100 dark:bg-white/5 text-neutral-500 hover:text-white cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onMoveColumn(1)}
            disabled={index === total - 1}
            className="p-1.5 rounded-lg bg-neutral-100 dark:bg-white/5 text-neutral-500 hover:text-white cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onRemoveColumn}
            className="p-1.5 rounded-lg bg-neutral-100 dark:bg-white/5 text-neutral-500 hover:text-rose-400 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="px-3 py-1.5 bg-neutral-100/60 dark:bg-white/[0.02] border-b border-neutral-200 dark:border-white/10 flex items-center gap-2">
        <span className="text-[10px] font-mono font-bold uppercase text-neutral-400 shrink-0">
          Desc. commune :
        </span>
        <input
          type="text"
          value={column.descFr ?? ''}
          onChange={(e) => onPatchColumn({ descFr: e.target.value })}
          placeholder="Description commune héritée par les produits sans description propre..."
          className="w-full min-w-0 px-2 py-0.5 text-xs bg-transparent rounded border border-transparent focus:border-emerald-500/50 focus:outline-none text-neutral-700 dark:text-neutral-300"
        />
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
                columnDescFr={column.descFr ?? ''}
                onPatch={(patch) => onPatchItem(item.id, patch)}
                onToggle={() => onToggleItem(item.id)}
                onRemove={() => onRemoveItem(item.id)}
              />
            ))}
            <button
              type="button"
              onClick={onAddItemColumn}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-dashed border-neutral-300 dark:border-white/15 text-[11px] font-bold text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-white transition-all cursor-pointer"
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
  columnDescFr?: string;
  onPatch: (patch: Partial<MegaMenuItem>) => void;
  onToggle: () => void;
  onRemove: () => void;
}) {
  const { item, product, columnDescFr, onPatch, onToggle, onRemove } = props;
  const [expanded, setExpanded] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const state = refState(item, product);
  const badge = refBadge(state);
  const slugInvalid = !!item.productSlug && !isValidSlug(item.productSlug);
  const masked = item.visible === false;
  const displayImg = (item.customImg && item.customImg.trim()) || product?.img;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-xl border bg-neutral-50 dark:bg-white/[0.03] p-2.5 transition-opacity ${
        isDragging ? 'opacity-40 z-40 shadow-lg' : ''
      } ${masked ? 'border-amber-500/40' : 'border-neutral-200 dark:border-white/10'}`}
    >
      <div className="flex items-center gap-2">
        <span
          className="text-neutral-400 cursor-grab active:cursor-grabbing"
          {...attributes}
          {...listeners}
          title="Glisser pour réorganiser"
        >
          <GripVertical className="w-4 h-4" />
        </span>
        {displayImg ? (
          <img
            src={displayImg}
            alt=""
            loading="lazy"
            className="w-14 h-14 shrink-0 rounded-lg object-cover bg-white dark:bg-zinc-800 border border-neutral-200 dark:border-white/10"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-14 h-14 shrink-0 rounded-lg bg-neutral-200/70 dark:bg-white/5 border border-neutral-200 dark:border-white/10 flex items-center justify-center text-neutral-400">
            <ImageIcon className="w-5 h-5" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={item.label}
              onChange={(e) => onPatch({ label: e.target.value })}
              className="w-full min-w-0 px-2 py-1 text-xs font-bold bg-transparent rounded-lg border border-transparent focus:border-emerald-500/50 focus:outline-none text-neutral-900 dark:text-white"
              placeholder="Libellé affiché"
            />
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className={`shrink-0 p-1.5 rounded-lg transition-colors cursor-pointer ${
                expanded || item.descFr || item.environment || item.customUrl || item.customImg
                  ? 'bg-[rgba(var(--ui-accent-rgb),0.2)] text-[color:var(--ui-accent)]'
                  : 'bg-neutral-100 dark:bg-white/5 text-neutral-400 hover:text-white'
              }`}
              title="Personnaliser"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onToggle}
              className={`shrink-0 p-1.5 rounded-lg transition-colors cursor-pointer ${
                masked
                  ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                  : 'bg-neutral-100 dark:bg-white/5 text-neutral-400 hover:text-white'
              }`}
              title={masked ? 'Masqué' : 'Visible'}
            >
              {masked ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={onRemove}
              className="shrink-0 p-1.5 rounded-lg bg-neutral-100 dark:bg-white/5 text-neutral-500 hover:text-rose-400 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex items-center gap-2 px-2 mt-1 flex-wrap">
            <input
              type="text"
              value={item.productSlug ?? ''}
              onChange={(e) => onPatch({ productSlug: e.target.value === '' ? null : e.target.value })}
              className={`w-36 px-2 py-0.5 text-[10px] font-mono bg-transparent rounded border focus:outline-none text-neutral-600 dark:text-neutral-300 ${
                slugInvalid ? 'border-rose-500/60 text-rose-500' : 'border-neutral-200 dark:border-white/10'
              }`}
              placeholder="productSlug"
            />
            <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border uppercase ${badge.className}`}>
              {badge.text}
            </span>
            <select
              value={item.environment ?? ''}
              onChange={(e) =>
                onPatch({
                  environment: (e.target.value === '' ? null : e.target.value) as 'indoor' | 'outdoor' | 'both' | null,
                })
              }
              className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg bg-white dark:bg-zinc-800 border border-neutral-300 dark:border-white/10 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-emerald-500/50 cursor-pointer"
              title="Tag affiché dans le méga menu à côté du nom (ex: INTÉRIEUR, EXTÉRIEUR)"
            >
              <option value="">Tag : Aucun / Hérité</option>
              <option value="indoor">Tag : INTÉRIEUR</option>
              <option value="outdoor">Tag : EXTÉRIEUR</option>
              <option value="both">Tag : INT. & EXT.</option>
            </select>
            {item.descFr && item.descFr.trim() ? (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                Desc. individuelle
              </span>
            ) : columnDescFr && columnDescFr.trim() ? (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-neutral-500/15 text-neutral-500 dark:text-neutral-400 border border-neutral-500/30">
                Desc. commune
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-white/10 space-y-3 px-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                Environnement
              </label>
              <select
                value={item.environment ?? ''}
                onChange={(e) =>
                  onPatch({
                    environment: (e.target.value === '' ? null : e.target.value) as 'indoor' | 'outdoor' | 'both' | null,
                  })
                }
                className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-zinc-800 border border-neutral-200 dark:border-white/10 text-neutral-800 dark:text-white"
              >
                <option value="">Non spécifié / hérité</option>
                <option value="indoor">Intérieur</option>
                <option value="outdoor">Extérieur</option>
                <option value="both">Intérieur et extérieur</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                Titre de présentation (si différent)
              </label>
              <input
                type="text"
                value={item.previewTitleFr ?? ''}
                onChange={(e) => onPatch({ previewTitleFr: e.target.value || null })}
                placeholder={item.label || product?.name || 'Identique au nom affiché'}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-zinc-800 border border-neutral-200 dark:border-white/10 text-neutral-800 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                Lien personnalisé
              </label>
              <input
                type="text"
                value={item.customUrl ?? ''}
                onChange={(e) => onPatch({ customUrl: e.target.value || null })}
                placeholder={item.productSlug ? '/product/' + item.productSlug : '/web/products'}
                className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg bg-white dark:bg-zinc-800 border border-neutral-200 dark:border-white/10 text-neutral-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                Image personnalisée
              </label>
              <input
                type="text"
                value={item.customImg ?? ''}
                onChange={(e) => onPatch({ customImg: e.target.value || null })}
                placeholder="https://..."
                className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg bg-white dark:bg-zinc-800 border border-neutral-200 dark:border-white/10 text-neutral-800 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
              Description individuelle (Mode 2)
            </label>
            <textarea
              value={item.descFr ?? ''}
              onChange={(e) => onPatch({ descFr: e.target.value || null })}
              rows={2}
              placeholder="Texte spécifique au produit dans le panneau du méga-menu..."
              className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-zinc-800 border border-neutral-200 dark:border-white/10 text-neutral-800 dark:text-white resize-y"
            />
          </div>
        </div>
      )}
    </div>
  );
}
