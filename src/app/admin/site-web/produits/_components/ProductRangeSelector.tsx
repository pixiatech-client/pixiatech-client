'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Loader2, Pencil, Plus, Trash2, X } from 'lucide-react';
import type { ProductRange } from '@/lib/products/types';

interface ProductRangeSelectorProps {
  ranges: ProductRange[];
  rangeId: string;
  rangeName: string;
  onSelect: (id: string, name: string) => void;
  onRangesChange: (nextRanges: ProductRange[]) => void;
  onRequestCreate: () => void;
  onNotify?: {
    success: (msg: string) => void;
    error: (msg: string) => void;
  };
  buttonClassName?: string;
}

export const ProductRangeSelector: React.FC<ProductRangeSelectorProps> = ({
  ranges,
  rangeId,
  rangeName,
  onSelect,
  onRangesChange,
  onRequestCreate,
  onNotify,
  buttonClassName,
}) => {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setEditingId(null);
        setConfirmDeleteId(null);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const currentLabel =
    ranges.find((r) => r.id === rangeId)?.name || rangeName || '— Sans gamme —';

  const handleSaveEdit = async (range: ProductRange) => {
    const trimmed = editValue.trim();
    if (!trimmed || trimmed === range.name) {
      setEditingId(null);
      return;
    }
    setBusyId(range.id);
    try {
      const res = await fetch(`/api/site-web/ranges/${encodeURIComponent(range.id)}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      });
      const data = (await res.json()) as { success?: boolean; message?: string; range?: ProductRange };
      if (!res.ok || !data.success || !data.range) {
        throw new Error(data.message || 'Échec de la modification.');
      }
      const next = ranges.map((r) => (r.id === range.id ? data.range! : r));
      onRangesChange(next);
      if (rangeId === range.id) {
        onSelect(range.id, data.range.name);
      }
      setEditingId(null);
      onNotify?.success(`Gamme renommée en « ${data.range.name} ».`);
    } catch (err) {
      onNotify?.error((err as Error).message || 'Erreur lors de la modification.');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (range: ProductRange) => {
    setBusyId(range.id);
    try {
      const res = await fetch(`/api/site-web/ranges/${encodeURIComponent(range.id)}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = (await res.json()) as { success?: boolean; message?: string };
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Échec de la suppression.');
      }
      const next = ranges.filter((r) => r.id !== range.id);
      onRangesChange(next);
      if (rangeId === range.id) {
        onSelect('', '');
      }
      setConfirmDeleteId(null);
      onNotify?.success(`Gamme « ${range.name} » supprimée.`);
    } catch (err) {
      onNotify?.error((err as Error).message || 'Erreur lors de la suppression.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div ref={rootRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={
          buttonClassName ||
          'w-full flex items-center justify-between gap-2 px-3 py-3 bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10 rounded-xl text-sm text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-[color:rgba(var(--ui-accent-rgb),0.5)] cursor-pointer text-left'
        }
      >
        <span className="truncate">{currentLabel}</span>
        <ChevronDown
          className={`w-4 h-4 text-neutral-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 mt-1.5 z-50 rounded-xl bg-white dark:bg-[#171715] border border-neutral-200 dark:border-white/15 shadow-xl overflow-hidden">
          <div className="max-h-72 overflow-y-auto py-1">
            <button
              type="button"
              onClick={() => {
                onSelect('', '');
                setOpen(false);
              }}
              className={`w-full px-3 py-2 text-left text-sm transition-colors cursor-pointer ${
                !rangeId
                  ? 'bg-sky-500/15 text-sky-700 dark:text-sky-300 font-semibold'
                  : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/5'
              }`}
            >
              — Sans gamme —
            </button>

            {ranges.map((r) => {
              const isSelected = r.id === rangeId;
              const isEditingRow = editingId === r.id;
              const isConfirmingDelete = confirmDeleteId === r.id;
              const isBusy = busyId === r.id;

              if (isEditingRow) {
                return (
                  <div
                    key={r.id}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-neutral-50 dark:bg-white/5 border-y border-neutral-200/70 dark:border-white/10"
                  >
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          void handleSaveEdit(r);
                        } else if (e.key === 'Escape') {
                          setEditingId(null);
                        }
                      }}
                      autoFocus
                      className="flex-1 min-w-0 px-2 py-1 text-xs rounded-lg bg-white dark:bg-black/40 border border-neutral-300 dark:border-white/20 text-neutral-900 dark:text-white outline-none"
                    />
                    <button
                      type="button"
                      disabled={isBusy || !editValue.trim()}
                      onClick={() => void handleSaveEdit(r)}
                      title="Enregistrer"
                      className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25 disabled:opacity-40 cursor-pointer"
                    >
                      {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => setEditingId(null)}
                      title="Annuler"
                      className="p-1.5 rounded-lg text-neutral-500 hover:bg-neutral-200 dark:hover:bg-white/10 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              }

              return (
                <div
                  key={r.id}
                  className={`group flex items-center justify-between gap-1 px-3 py-1.5 text-sm transition-colors ${
                    isSelected
                      ? 'bg-sky-500/15 text-sky-700 dark:text-sky-300 font-semibold'
                      : 'text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/5'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(r.id, r.name);
                      setOpen(false);
                    }}
                    className="flex-1 min-w-0 text-left truncate py-0.5 cursor-pointer"
                  >
                    {r.name}
                  </button>

                  {isConfirmingDelete ? (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => void handleDelete(r)}
                        className="px-2 py-0.5 rounded bg-rose-600 text-white text-[11px] font-bold hover:bg-rose-700 disabled:opacity-50 cursor-pointer"
                        title="Confirmer la suppression"
                      >
                        {isBusy ? '…' : 'Supprimer'}
                      </button>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => setConfirmDeleteId(null)}
                        className="p-1 rounded text-neutral-500 hover:bg-neutral-200 dark:hover:bg-white/10 cursor-pointer"
                        title="Annuler"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-0.5 shrink-0 opacity-75 group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDeleteId(null);
                          setEditingId(r.id);
                          setEditValue(r.name);
                        }}
                        title={`Modifier « ${r.name} »`}
                        className="p-1 rounded-md text-neutral-500 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-500/10 cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingId(null);
                          setConfirmDeleteId(r.id);
                        }}
                        title={`Supprimer « ${r.name} »`}
                        className="p-1 rounded-md text-neutral-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onRequestCreate();
            }}
            className="w-full flex items-center gap-1.5 px-3 py-2.5 text-left text-xs font-bold text-sky-600 dark:text-sky-400 border-t border-neutral-200 dark:border-white/10 hover:bg-neutral-50 dark:hover:bg-white/5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Créer une gamme…</span>
          </button>
        </div>
      )}
    </div>
  );
};
