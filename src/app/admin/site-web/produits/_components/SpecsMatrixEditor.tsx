'use client';

/**
 * SpecsMatrixEditor — Tableau comparatif complet et éditable des variantes (backend admin)
 *
 * Reproduit la structure et l'apparence exacte de `SpecsSection` (frontend) :
 *  - En-tête avec les colonnes des modèles/variantes (nom, tag, suppression)
 *  - Lignes regroupées par catégories (Général, Écran, Mécanique, Optique, etc.)
 *  - Cellules modifiables en direct avec persistance dans l'état des modèles
 *  - Ajout / suppression / renommage de groupes
 *  - Ajout / suppression / renommage de caractéristiques (lignes)
 *  - Ajout et suppression de variantes
 *  - Défilement horizontal avec boutons gauche/droite et compteur de modèles
 */

import React, { useRef, useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  Pencil,
  Check,
  X,
  Search,
} from 'lucide-react';
import type { ProductSpecModel, ProductSpecGroup } from '@/lib/products/types';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  models: ProductSpecModel[];
  setModels: React.Dispatch<React.SetStateAction<ProductSpecModel[]>>;
  groups: ProductSpecGroup[];
  setGroups: React.Dispatch<React.SetStateAction<ProductSpecGroup[]>>;
  onAddVariant?: () => void;
  onDeleteVariant?: (variantName: string) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function labelToKey(label: string): string {
  return (
    label
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '') || `row_${Date.now()}`
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sous-composant : Cellule éditable
// ─────────────────────────────────────────────────────────────────────────────

function EditableCell({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder ?? '—'}
      className="w-full min-w-0 bg-transparent border border-transparent rounded-lg px-2 py-1 text-xs text-neutral-800 dark:text-neutral-100 placeholder:text-neutral-300 dark:placeholder:text-neutral-600 hover:border-neutral-300 dark:hover:border-white/20 focus:outline-none focus:border-[#38E044]/70 focus:bg-white dark:focus:bg-white/5 transition-colors"
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sous-composant : Éditeur de label de groupe
// ─────────────────────────────────────────────────────────────────────────────

function GroupLabelEditor({
  label,
  onRename,
  onDelete,
}: {
  label: string;
  onRename: (next: string) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(label);

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed) onRename(trimmed);
    else setDraft(label);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1 flex-1 min-w-0">
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') {
              setDraft(label);
              setEditing(false);
            }
          }}
          onBlur={commit}
          className="flex-1 min-w-0 bg-white dark:bg-white/5 border border-[#38E044]/60 rounded-lg px-2 py-0.5 text-xs font-bold text-neutral-900 dark:text-white focus:outline-none"
        />
        <button
          type="button"
          onClick={commit}
          className="p-1 text-[#38E044] hover:text-[#2fcb3c] cursor-pointer"
        >
          <Check className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => {
            setDraft(label);
            setEditing(false);
          }}
          className="p-1 text-neutral-400 hover:text-rose-500 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 flex-1 min-w-0">
      <span className="text-xs font-bold uppercase tracking-wider text-[#38E044] dark:text-[#38E044] truncate">
        {label || 'GÉNÉRAL'}
      </span>
      <button
        type="button"
        onClick={() => {
          setDraft(label);
          setEditing(true);
        }}
        className="shrink-0 p-1 rounded opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-opacity cursor-pointer"
        title="Renommer ce groupe"
      >
        <Pencil className="w-3 h-3" />
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="shrink-0 p-1 rounded opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-rose-500 transition-opacity cursor-pointer"
        title="Supprimer ce groupe"
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sous-composant : Éditeur de label de ligne
// ─────────────────────────────────────────────────────────────────────────────

function RowLabelEditor({
  label,
  onRename,
  onDelete,
}: {
  label: string;
  onRename: (next: string) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(label);

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed) onRename(trimmed);
    else setDraft(label);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') {
              setDraft(label);
              setEditing(false);
            }
          }}
          onBlur={commit}
          className="flex-1 min-w-0 px-2 py-0.5 rounded-lg border border-[#38E044]/50 bg-white dark:bg-white/5 text-xs focus:outline-none"
        />
        <button
          type="button"
          onClick={commit}
          className="p-1 text-[#38E044] cursor-pointer"
        >
          <Check className="w-3 h-3" />
        </button>
        <button
          type="button"
          onClick={() => {
            setDraft(label);
            setEditing(false);
          }}
          className="p-1 text-neutral-400 hover:text-rose-500 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 group/label">
      <span
        className="flex-1 min-w-0 text-xs font-medium text-neutral-700 dark:text-neutral-300 truncate"
        title={label}
      >
        {label}
      </span>
      <button
        type="button"
        onClick={() => {
          setDraft(label);
          setEditing(true);
        }}
        className="shrink-0 p-0.5 opacity-0 group-hover/label:opacity-100 text-neutral-400 hover:text-neutral-700 dark:hover:text-white transition-opacity cursor-pointer"
        title="Renommer la caractéristique"
      >
        <Pencil className="w-2.5 h-2.5" />
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="shrink-0 p-0.5 opacity-0 group-hover/label:opacity-100 text-neutral-400 hover:text-rose-500 transition-opacity cursor-pointer"
        title="Supprimer cette caractéristique"
      >
        <Trash2 className="w-2.5 h-2.5" />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Composant principal : SpecsMatrixEditor
// ─────────────────────────────────────────────────────────────────────────────

export function SpecsMatrixEditor({
  models,
  setModels,
  groups,
  setGroups,
  onAddVariant,
  onDeleteVariant,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Filtre de recherche dans les caractéristiques
  const [searchQuery, setSearchQuery] = useState('');

  // États locaux d'ajout
  const [addingRowForGroup, setAddingRowForGroup] = useState<number | null>(null);
  const [newRowLabel, setNewRowLabel] = useState('');
  const [addingGroup, setAddingGroup] = useState(false);
  const [newGroupLabel, setNewGroupLabel] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Set<number>>(new Set());

  // Gestion du défilement horizontal
  const updateScrollState = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [models.length, groups.length]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const offset = direction === 'left' ? -300 : 300;
    scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
  };

  // ── Mise à jour d'une cellule ─────────────────────────────────────────────
  const updateCell = (modelName: string, rowKey: string, value: string) => {
    setModels((prev) =>
      prev.map((m) =>
        m.name === modelName
          ? { ...m, specs: { ...m.specs, [rowKey]: value } }
          : m
      )
    );
  };

  // ── Ajout d'une ligne dans un groupe ──────────────────────────────────────
  const addRow = (groupIdx: number) => {
    const trimmed = newRowLabel.trim();
    if (!trimmed) return;
    const key = labelToKey(trimmed);
    const existingKeys = groups.flatMap((g) => g.rows.map((r) => r.key));
    const finalKey = existingKeys.includes(key) ? `${key}_${Date.now()}` : key;

    setGroups((prev) =>
      prev.map((g, gi) =>
        gi === groupIdx
          ? { ...g, rows: [...g.rows, { key: finalKey, label: trimmed }] }
          : g
      )
    );
    setNewRowLabel('');
    setAddingRowForGroup(null);
  };

  // ── Suppression d'une ligne ───────────────────────────────────────────────
  const deleteRow = (groupIdx: number, rowIdx: number, rowKey: string) => {
    setGroups((prev) =>
      prev.map((g, gi) =>
        gi === groupIdx
          ? { ...g, rows: g.rows.filter((_, ri) => ri !== rowIdx) }
          : g
      )
    );
    setModels((prev) =>
      prev.map((m) => {
        const { [rowKey]: _removed, ...rest } = m.specs;
        return { ...m, specs: rest };
      })
    );
  };

  // ── Ajout d'un groupe ─────────────────────────────────────────────────────
  const addGroup = () => {
    const trimmed = newGroupLabel.trim();
    if (!trimmed) return;
    setGroups((prev) => [...prev, { label: trimmed, rows: [] }]);
    setNewGroupLabel('');
    setAddingGroup(false);
  };

  // ── Suppression d'un groupe ───────────────────────────────────────────────
  const deleteGroup = (groupIdx: number) => {
    const keysToRemove = groups[groupIdx]?.rows.map((r) => r.key) ?? [];
    setGroups((prev) => prev.filter((_, gi) => gi !== groupIdx));
    if (keysToRemove.length > 0) {
      setModels((prev) =>
        prev.map((m) => {
          const specs = { ...m.specs };
          keysToRemove.forEach((k) => delete specs[k]);
          return { ...m, specs };
        })
      );
    }
  };

  // ── Renommage d'un groupe ─────────────────────────────────────────────────
  const renameGroup = (groupIdx: number, next: string) => {
    setGroups((prev) =>
      prev.map((g, gi) => (gi === groupIdx ? { ...g, label: next } : g))
    );
  };

  // ── Renommage du label d'une ligne ────────────────────────────────────────
  const renameRow = (groupIdx: number, rowIdx: number, next: string) => {
    setGroups((prev) =>
      prev.map((g, gi) =>
        gi === groupIdx
          ? {
              ...g,
              rows: g.rows.map((r, ri) =>
                ri === rowIdx ? { ...r, label: next } : r
              ),
            }
          : g
      )
    );
  };

  // ── Basculer visibilité d'un groupe ──────────────────────────────────────
  const toggleGroup = (gi: number) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(gi)) next.delete(gi);
      else next.add(gi);
      return next;
    });
  };

  // Filtrage selon la recherche
  const filterQuery = searchQuery.trim().toLowerCase();

  const COL_W = 200; // largeur d'une colonne variante
  const ROW_LABEL_W = 240; // largeur de la colonne caractéristique (identique au frontend)

  if (models.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-300 dark:border-white/10 p-8 text-center bg-neutral-50/50 dark:bg-white/[0.02] space-y-3">
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          Aucune variante configurée pour ce produit.
        </p>
        {onAddVariant && (
          <button
            type="button"
            onClick={onAddVariant}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#38E044] hover:bg-[#2fcb3c] text-black text-xs font-extrabold transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Ajouter une variante</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* ── Barre d'outils supérieure : recherche, compteur et défilement ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            <span className="text-[#38E044] font-extrabold">
              {String(models.length).padStart(2, '0')}
            </span>{' '}
            modèle{models.length > 1 ? 's' : ''} configuré{models.length > 1 ? 's' : ''}
          </span>

          {/* Recherche rapide */}
          <div className="relative">
            <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filtrer une caractéristique…"
              className="pl-7 pr-2.5 py-1 text-xs rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-white/5 text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400 focus:outline-none focus:border-[#38E044]/60 w-48 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onAddVariant && (
            <button
              type="button"
              onClick={onAddVariant}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#38E044] hover:bg-[#2fcb3c] text-black text-xs font-extrabold transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ajouter une variante</span>
            </button>
          )}

          {/* Boutons de défilement horizontal */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleScroll('left')}
              disabled={!canScrollLeft}
              className={`p-1.5 rounded-xl border transition-all ${
                canScrollLeft
                  ? 'border-neutral-300 dark:border-white/20 text-neutral-800 dark:text-white hover:border-[#38E044] hover:text-[#38E044] cursor-pointer'
                  : 'border-neutral-200 dark:border-white/5 text-neutral-300 dark:text-neutral-700 cursor-not-allowed'
              }`}
              title="Faire défiler vers la gauche"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleScroll('right')}
              disabled={!canScrollRight}
              className={`p-1.5 rounded-xl border transition-all ${
                canScrollRight
                  ? 'border-neutral-300 dark:border-white/20 text-neutral-800 dark:text-white hover:border-[#38E044] hover:text-[#38E044] cursor-pointer'
                  : 'border-neutral-200 dark:border-white/5 text-neutral-300 dark:text-neutral-700 cursor-not-allowed'
              }`}
              title="Faire défiler vers la droite"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Tableau complet de la matrice ── */}
      <div
        ref={scrollRef}
        className="overflow-x-auto rounded-2xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#0A0D0E] shadow-sm scroll-smooth"
      >
        <table
          className="border-collapse w-full"
          style={{ minWidth: ROW_LABEL_W + models.length * COL_W }}
        >
          {/* ── En-tête : MODÈLES (variantes) ── */}
          <thead>
            <tr className="bg-neutral-50 dark:bg-[#0E1214] border-b border-neutral-200 dark:border-white/10">
              <th
                className="sticky left-0 z-20 bg-neutral-50 dark:bg-[#0E1214] border-r border-neutral-200 dark:border-white/10 px-4 py-3 text-left shadow-[4px_0_12px_-4px_rgba(0,0,0,0.1)] dark:shadow-[4px_0_12px_-4px_rgba(0,0,0,0.6)]"
                style={{ width: ROW_LABEL_W, minWidth: ROW_LABEL_W }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
                    Caractéristique
                  </span>
                  <span className="text-[10px] text-neutral-400 dark:text-neutral-600 font-medium">
                    (Édition)
                  </span>
                </div>
              </th>

              {models.map((model) => (
                <th
                  key={model.name}
                  className="px-3 py-3 text-left border-r last:border-r-0 border-neutral-200 dark:border-white/10"
                  style={{ width: COL_W, minWidth: COL_W }}
                >
                  <div className="flex items-center justify-between gap-1 group/th">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="text-xs font-bold text-neutral-900 dark:text-white truncate"
                          title={model.name}
                        >
                          {model.name}
                        </span>
                        {model.tag && (
                          <span className="shrink-0 text-[9px] font-bold uppercase tracking-wider text-[#38E044] px-1 py-0.2 rounded bg-[#38E044]/10">
                            {model.tag}
                          </span>
                        )}
                      </div>
                    </div>

                    {onDeleteVariant && (
                      <button
                        type="button"
                        onClick={() => onDeleteVariant(model.name)}
                        className="shrink-0 p-1 rounded opacity-0 group-hover/th:opacity-100 text-neutral-400 hover:text-rose-500 transition-opacity cursor-pointer"
                        title={`Supprimer la variante « ${model.name} »`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* ── Corps : Groupes et caractéristiques ── */}
          <tbody>
            {groups.length === 0 ? (
              <tr>
                <td
                  colSpan={models.length + 1}
                  className="p-8 text-center text-xs text-neutral-400 dark:text-neutral-500"
                >
                  Aucun groupe de spécifications. Cliquez sur &quot;Ajouter une catégorie&quot; ci-dessous.
                </td>
              </tr>
            ) : (
              groups.map((group, gi) => {
                const collapsed = collapsedGroups.has(gi);
                const visibleRows = filterQuery
                  ? group.rows.filter((r) =>
                      r.label.toLowerCase().includes(filterQuery)
                    )
                  : group.rows;

                // Si recherche active et aucune ligne correspondante dans ce groupe, masquer le groupe
                if (filterQuery && visibleRows.length === 0) return null;

                return (
                  <React.Fragment key={`group-${gi}`}>
                    {/* ── Ligne d'en-tête de catégorie/groupe ── */}
                    <tr className="group bg-neutral-100/80 dark:bg-[#121619] border-b border-neutral-200 dark:border-white/10">
                      <td
                        colSpan={models.length + 1}
                        className="sticky left-0 px-3 py-2 border-l-4 border-l-[#38E044]"
                      >
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => toggleGroup(gi)}
                            className="shrink-0 p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-white cursor-pointer"
                            title={collapsed ? 'Développer' : 'Réduire'}
                          >
                            {collapsed ? (
                              <ChevronDown className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronUp className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <GripVertical className="w-3.5 h-3.5 shrink-0 text-neutral-300 dark:text-neutral-600" />
                          <GroupLabelEditor
                            label={group.label}
                            onRename={(next) => renameGroup(gi, next)}
                            onDelete={() => deleteGroup(gi)}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setAddingRowForGroup(gi);
                              setNewRowLabel('');
                            }}
                            className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-600 dark:text-neutral-300 hover:border-[#38E044]/60 hover:text-[#38E044] transition-colors cursor-pointer shadow-2xs"
                            title="Ajouter une caractéristique dans cette catégorie"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Caractéristique</span>
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* ── Ligne d'ajout d'une nouvelle caractéristique ── */}
                    {!collapsed && addingRowForGroup === gi && (
                      <tr className="bg-[#38E044]/5 border-b border-neutral-200 dark:border-white/10">
                        <td
                          className="sticky left-0 bg-[#38E044]/10 dark:bg-[#38E044]/[0.06] px-3 py-2 border-r border-neutral-200 dark:border-white/10"
                          style={{ width: ROW_LABEL_W }}
                        >
                          <div className="flex items-center gap-1.5">
                            <input
                              autoFocus
                              value={newRowLabel}
                              onChange={(e) => setNewRowLabel(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') addRow(gi);
                                if (e.key === 'Escape') {
                                  setAddingRowForGroup(null);
                                  setNewRowLabel('');
                                }
                              }}
                              placeholder="ex. Luminosité (nits)…"
                              className="flex-1 min-w-0 px-2 py-1 rounded-lg border border-[#38E044]/50 bg-white dark:bg-zinc-900 text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-[#38E044]"
                            />
                            <button
                              type="button"
                              onClick={() => addRow(gi)}
                              className="p-1 text-[#38E044] hover:text-[#2fcb3c] cursor-pointer"
                              title="Valider"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setAddingRowForGroup(null);
                                setNewRowLabel('');
                              }}
                              className="p-1 text-neutral-400 hover:text-rose-500 cursor-pointer"
                              title="Annuler"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                        {models.map((m) => (
                          <td
                            key={m.name}
                            className="px-3 py-2 border-r last:border-r-0 border-neutral-200 dark:border-white/10 text-[11px] text-neutral-300 dark:text-neutral-600 text-center"
                          >
                            —
                          </td>
                        ))}
                      </tr>
                    )}

                    {/* ── Lignes de données des caractéristiques ── */}
                    {!collapsed &&
                      visibleRows.map((row, ri) => (
                        <tr
                          key={`${gi}-${row.key}`}
                          className="group/row border-b last:border-b-0 border-neutral-200 dark:border-white/10 hover:bg-neutral-50/60 dark:hover:bg-white/[0.02] transition-colors"
                        >
                          {/* Label de la caractéristique */}
                          <td
                            className="sticky left-0 bg-white dark:bg-[#0A0D0E] group-hover/row:bg-neutral-50/90 dark:group-hover/row:bg-[#0E1214] border-r border-neutral-200 dark:border-white/10 px-3 py-1.5 transition-colors shadow-[4px_0_12px_-4px_rgba(0,0,0,0.06)] dark:shadow-[4px_0_12px_-4px_rgba(0,0,0,0.5)]"
                            style={{ width: ROW_LABEL_W }}
                          >
                            <RowLabelEditor
                              label={row.label}
                              onRename={(next) => renameRow(gi, ri, next)}
                              onDelete={() => deleteRow(gi, ri, row.key)}
                            />
                          </td>

                          {/* Cellules par variante */}
                          {models.map((m) => {
                            const raw = m.specs[row.key] ?? '';
                            return (
                              <td
                                key={m.name}
                                className="border-r last:border-r-0 border-neutral-200 dark:border-white/10 px-2 py-1"
                                style={{ width: COL_W }}
                              >
                                <EditableCell
                                  value={raw}
                                  onChange={(val) =>
                                    updateCell(m.name, row.key, val)
                                  }
                                  placeholder="—"
                                />
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Ajout d'une catégorie / groupe de spécifications ── */}
      {addingGroup ? (
        <div className="flex items-center gap-2 p-3 bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200 dark:border-white/10 rounded-2xl">
          <input
            autoFocus
            value={newGroupLabel}
            onChange={(e) => setNewGroupLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') addGroup();
              if (e.key === 'Escape') {
                setAddingGroup(false);
                setNewGroupLabel('');
              }
            }}
            placeholder="Nom de la nouvelle catégorie (ex. Alimentation & Consommation)…"
            className="flex-1 px-3 py-1.5 rounded-xl border border-neutral-300 dark:border-white/20 bg-white dark:bg-zinc-900 text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-[#38E044]/60"
          />
          <button
            type="button"
            onClick={addGroup}
            className="px-3 py-1.5 rounded-xl bg-[#38E044] text-black text-xs font-bold cursor-pointer hover:bg-[#2fcb3c] transition-colors"
          >
            Créer la catégorie
          </button>
          <button
            type="button"
            onClick={() => {
              setAddingGroup(false);
              setNewGroupLabel('');
            }}
            className="px-3 py-1.5 rounded-xl border border-neutral-300 dark:border-white/20 text-xs cursor-pointer text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors"
          >
            Annuler
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAddingGroup(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-dashed border-neutral-300 dark:border-white/15 text-neutral-600 dark:text-neutral-300 text-xs font-bold hover:border-[#38E044]/60 hover:text-[#38E044] transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Ajouter une catégorie de spécifications</span>
        </button>
      )}
    </div>
  );
}
