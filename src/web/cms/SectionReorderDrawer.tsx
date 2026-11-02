'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { X, GripVertical, ChevronUp, ChevronDown, Check, RotateCcw } from 'lucide-react';
import { useCms } from '@/lib/site-web/cms-context';
import { getRegisteredSections, getSectionLabel } from './section-registry';

/** Libellés statiques pour les sections non enregistrées via EditableWrapper */
const FALLBACK_LABELS: Record<string, string> = {
  hero: 'Hero',
  manifesto: 'Manifeste',
  showreel: 'Showreel 3D',
  markets: 'Marchés',
  kinetic: 'Cinétique',
  products: 'Produits',
  technology: 'Technologie',
  pitch: 'Pitch',
  projects: 'Projets',
  process: 'Processus',
  experience: 'Centre d\'expérience',
  insights: 'Insights',
  contact: 'Contact',
  header: 'En-tête',
  footer: 'Pied de page',
};

function getLabel(key: string): string {
  return getSectionLabel(key) || FALLBACK_LABELS[key] || key;
}

interface SectionReorderDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function SectionReorderDrawer({ open, onClose }: SectionReorderDrawerProps) {
  const { currentPageData, updateSectionOrder, saveCurrentPage } = useCms();

  // Reconstruit l'ordre à partir des sections enregistrées + sectionOrder sauvegardé
  const buildInitialOrder = useCallback((): string[] => {
    const registered = getRegisteredSections().map((r) => r.sectionKey);
    const saved: string[] = currentPageData?.sectionOrder ?? [];

    if (saved.length > 0) {
      // On prend l'ordre sauvegardé, on ajoute les clés absentes à la fin
      const missing = registered.filter((k) => !saved.includes(k));
      return [...saved.filter((k) => registered.includes(k) || FALLBACK_LABELS[k]), ...missing];
    }
    return registered.length > 0 ? registered : Object.keys(FALLBACK_LABELS);
  }, [currentPageData]);

  const [order, setOrder] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Réinitialise l'ordre à chaque ouverture
  useEffect(() => {
    if (open) {
      setOrder(buildInitialOrder());
      setSaved(false);
    }
  }, [open, buildInitialOrder]);

  // ─── Drag & Drop ────────────────────────────────────────────────────────────
  const dragIndexRef = useRef<number | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  const handleDragStart = useCallback((index: number) => {
    dragIndexRef.current = index;
    setDragIndex(index);
    setDropIndex(index);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndexRef.current !== null) setDropIndex(index);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, targetIndex: number) => {
      e.preventDefault();
      const from = dragIndexRef.current;
      if (from === null || from === targetIndex) {
        dragIndexRef.current = null;
        setDragIndex(null);
        setDropIndex(null);
        return;
      }
      setOrder((prev) => {
        const next = [...prev];
        const [moved] = next.splice(from, 1);
        next.splice(targetIndex, 0, moved);
        return next;
      });
      dragIndexRef.current = null;
      setDragIndex(null);
      setDropIndex(null);
    },
    []
  );

  const handleDragEnd = useCallback(() => {
    dragIndexRef.current = null;
    setDragIndex(null);
    setDropIndex(null);
  }, []);

  // ─── Flèches haut / bas ──────────────────────────────────────────────────
  const moveUp = useCallback((index: number) => {
    if (index === 0) return;
    setOrder((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  }, []);

  const moveDown = useCallback((index: number) => {
    setOrder((prev) => {
      if (index >= prev.length - 1) return prev;
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  }, []);

  // ─── Position numérique ───────────────────────────────────────────────────
  const handlePositionInput = useCallback(
    (index: number, raw: string) => {
      const parsed = parseInt(raw, 10);
      if (isNaN(parsed)) return;
      const target = Math.max(1, Math.min(order.length, parsed)) - 1; // 1-based → 0-based
      if (target === index) return;
      setOrder((prev) => {
        const next = [...prev];
        const [moved] = next.splice(index, 1);
        next.splice(target, 0, moved);
        return next;
      });
    },
    [order.length]
  );

  // ─── Réinitialiser ────────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    setOrder(buildInitialOrder());
    setSaved(false);
  }, [buildInitialOrder]);

  // ─── Appliquer ────────────────────────────────────────────────────────────
  const handleApply = useCallback(async () => {
    setSaving(true);
    try {
      updateSectionOrder(order);
      await saveCurrentPage();
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        onClose();
      }, 900);
    } catch (err) {
      console.error('[SectionReorderDrawer] Échec de la sauvegarde :', err);
    } finally {
      setSaving(false);
    }
  }, [order, updateSectionOrder, saveCurrentPage, onClose]);

  // ─── Fermeture par Échap ─────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      {/* Fond semi-transparent (clic = fermer) */}
      <div
        data-cms-ui="true"
        className="fixed inset-0 z-[290] bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panneau latéral droit */}
      <div
        data-cms-ui="true"
        role="dialog"
        aria-label="Réorganiser les sections"
        className="fixed right-0 top-0 bottom-0 z-[291] flex flex-col w-[320px] bg-[#0e0e0d] border-l border-[#262624] shadow-2xl font-mono text-[#F5F4F0] select-none"
        style={{ paddingTop: 'var(--admin-bar-h, 0px)' }}
      >
        {/* En-tête */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#262624]">
          <span className="flex items-center gap-2 text-[#C3F910] font-bold text-[12px] tracking-wider uppercase">
            <GripVertical className="w-4 h-4" />
            Réorganiser les sections
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-[#6b6b64] hover:text-[#F5F4F0] transition-colors cursor-pointer"
            title="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Instruction */}
        <p className="px-4 py-2 text-[10px] text-[#6b6b64] border-b border-[#1a1a18]">
          Glissez-déposez · Flèches · ou saisissez un numéro de position
        </p>

        {/* Liste des sections */}
        <div className="flex-1 overflow-y-auto py-2">
          {order.map((key, index) => {
            const isDragging = dragIndex === index;
            const isDropTarget = dropIndex === index && dragIndex !== null && dragIndex !== index;

            return (
              <div
                key={key}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={[
                  'flex items-center gap-2 px-3 py-2 mx-2 my-0.5 rounded border transition-all',
                  isDragging
                    ? 'opacity-40 border-[#C3F910]/50 bg-[#C3F910]/10'
                    : isDropTarget
                    ? 'border-[#C3F910] bg-[#C3F910]/15 scale-[1.02]'
                    : 'border-[#2B2B28] bg-[#141413] hover:border-[#3a3a36] hover:bg-[#1a1a18]',
                ].join(' ')}
              >
                {/* Numéro de position (input) */}
                <input
                  type="number"
                  min={1}
                  max={order.length}
                  value={index + 1}
                  onChange={(e) => handlePositionInput(index, e.target.value)}
                  onBlur={(e) => handlePositionInput(index, e.target.value)}
                  className="w-9 text-center bg-[#0a0a09] border border-[#2B2B28] rounded text-[10px] text-[#C3F910] py-0.5 font-mono focus:outline-none focus:border-[#C3F910]/70"
                  title="Numéro de position (1-based)"
                />

                {/* Poignée drag */}
                <GripVertical className="w-3.5 h-3.5 text-[#4a4a44] cursor-grab flex-shrink-0" />

                {/* Libellé */}
                <span className="flex-1 text-[11px] text-[#D4D3CC] truncate font-semibold uppercase tracking-wide">
                  {getLabel(key)}
                </span>

                {/* Flèches */}
                <div className="flex flex-col gap-0.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => moveUp(index)}
                    disabled={index === 0}
                    className="w-5 h-4 flex items-center justify-center rounded text-[#6b6b64] hover:text-[#C3F910] disabled:opacity-20 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    title="Déplacer vers le haut"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveDown(index)}
                    disabled={index === order.length - 1}
                    className="w-5 h-4 flex items-center justify-center rounded text-[#6b6b64] hover:text-[#C3F910] disabled:opacity-20 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    title="Déplacer vers le bas"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pied de panneau */}
        <div className="flex items-center gap-2 px-4 py-3 border-t border-[#262624]">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1 px-3 py-1.5 rounded border border-[#2B2B28] text-[#9A9A94] hover:text-[#F5F4F0] hover:border-[#3a3a36] text-[11px] transition-colors cursor-pointer"
            title="Annuler les modifications"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Réinitialiser
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={saving}
            className={[
              'flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded border text-[11px] font-bold transition-all cursor-pointer',
              saved
                ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-400'
                : 'bg-[#C3F910] border-[#C3F910] text-[#080808] hover:bg-[#d4ff20] active:scale-[0.98]',
              saving ? 'opacity-60 cursor-wait' : '',
            ].join(' ')}
          >
            {saved ? (
              <>
                <Check className="w-3.5 h-3.5" />
                Sauvegardé !
              </>
            ) : saving ? (
              'Sauvegarde…'
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                Appliquer les modifications
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}

