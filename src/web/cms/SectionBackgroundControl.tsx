'use client';

import React, { useRef, useState } from 'react';
import { AlertTriangle, Image as ImageIcon, Loader2, Palette, RotateCcw, Settings, Sparkles, Trash2, Upload, X } from 'lucide-react';
import { useCms } from '@/lib/site-web/cms-context';

interface SectionBackgroundControlProps {
  sectionKey: string;
  sectionLabel: string;
  visible: boolean;
}

export const SectionBackgroundControl: React.FC<SectionBackgroundControlProps> = ({
  sectionKey,
  sectionLabel,
  visible,
}) => {
  const { currentPageData, updateSectionField, saveCurrentPage, uploadMedia, setSelectedBlockId } = useCms();
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sectionData = (currentPageData?.sections?.[sectionKey] as Record<string, unknown> | undefined) || {};
  const layout = (sectionData.layout as Record<string, unknown> | undefined) || {};

  const bgColor = String(sectionData.bgColor ?? layout.bgColor ?? '');
  const bgImage = String(sectionData.bgImage ?? layout.bgImage ?? '');
  const bgParallax = Boolean(sectionData.bgParallax ?? layout.bgParallax ?? false);

  const persistField = async (patch: Record<string, unknown>) => {
    for (const [k, v] of Object.entries(patch)) {
      updateSectionField(sectionKey, k, v);
    }
    setSaving(true);
    try {
      await saveCurrentPage();
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadMedia(file);
      if (url) {
        await persistField({ bgImage: url });
      }
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleReset = async () => {
    await persistField({
      bgColor: '',
      bgImage: '',
      bgParallax: false,
    });
  };

  const handleDeleteSection = async () => {
    await persistField({
      visible: false,
      deleted: true,
    });
    setSelectedBlockId(null);
    setConfirmDelete(false);
    setOpen(false);
  };

  return (
    <div
      data-cms-ui="true"
      onClick={(e) => e.stopPropagation()}
      className="absolute right-0 top-1/2 -translate-y-1/2 z-[140] flex items-center pointer-events-none"
    >
      {/* Panneau compact d'arrière-plan (couleur, photo, parallaxe) */}
      {open && (
        <div
          data-cms-ui="true"
          className="pointer-events-auto mr-2 w-[272px] rounded-xl bg-[#0D0D0C]/95 backdrop-blur-xl border border-[#2B2B28] shadow-2xl p-3.5 text-[#F5F4F0] font-sans text-xs space-y-3"
        >
          <div className="flex items-center justify-between border-b border-[#242422] pb-2">
            <div className="min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-wider text-[#8A8880]">
                Arrière-plan
              </p>
              <p className="font-semibold text-white truncate">{sectionLabel}</p>
            </div>
            <div className="flex items-center gap-1">
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin text-[color:var(--ui-accent)]" />}
              <button
                type="button"
                onClick={handleReset}
                title="Réinitialiser l'arrière-plan"
                className="p-1 rounded hover:bg-white/10 text-[#9A9A94] hover:text-white transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                title="Fermer"
                className="p-1 rounded hover:bg-white/10 text-[#9A9A94] hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Couleur de fond */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-[11px] font-medium text-[#C9C7C1]">
              <Palette className="w-3.5 h-3.5 text-[color:var(--ui-accent)]" />
              <span>Couleur de fond</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={/^#[0-9a-fA-F]{6}$/.test(bgColor) ? bgColor : '#080808'}
                onChange={(e) => void persistField({ bgColor: e.target.value })}
                className="w-8 h-8 rounded border border-[#2B2B28] bg-transparent cursor-pointer shrink-0"
              />
              <input
                type="text"
                value={bgColor}
                placeholder="#080808 (défaut)"
                onChange={(e) => updateSectionField(sectionKey, 'bgColor', e.target.value)}
                onBlur={() => void saveCurrentPage()}
                className="flex-1 min-w-0 px-2.5 py-1.5 rounded bg-[#161615] border border-[#2B2B28] text-white font-mono text-[11px] focus:outline-none focus:border-[color:var(--ui-accent)]"
              />
              {bgColor && (
                <button
                  type="button"
                  onClick={() => void persistField({ bgColor: '' })}
                  className="px-2 py-1.5 rounded bg-[#1A1A18] hover:bg-white/10 text-[#9A9A94] hover:text-white text-[10px] cursor-pointer"
                >
                  Effacer
                </button>
              )}
            </div>
          </div>

          {/* Photo d'arrière-plan */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-[11px] font-medium text-[#C9C7C1]">
              <ImageIcon className="w-3.5 h-3.5 text-[color:var(--ui-accent)]" />
              <span>Photo d&apos;arrière-plan</span>
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={bgImage}
                placeholder="https://... ou /uploads/..."
                onChange={(e) => updateSectionField(sectionKey, 'bgImage', e.target.value)}
                onBlur={() => void saveCurrentPage()}
                className="flex-1 min-w-0 px-2.5 py-1.5 rounded bg-[#161615] border border-[#2B2B28] text-white font-mono text-[11px] focus:outline-none focus:border-[color:var(--ui-accent)]"
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                title="Importer une image"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-[color:var(--ui-accent)] text-black font-semibold text-[11px] hover:opacity-90 transition-opacity cursor-pointer shrink-0 disabled:opacity-50"
              >
                {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              </button>
            </div>
            {bgImage && (
              <div className="flex items-center justify-between gap-2 pt-1">
                <div className="h-10 w-16 rounded overflow-hidden border border-[#2B2B28] bg-black shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={bgImage} alt="" className="w-full h-full object-cover" />
                </div>
                <button
                  type="button"
                  onClick={() => void persistField({ bgImage: '', bgParallax: false })}
                  className="text-[11px] text-red-400 hover:text-red-300 cursor-pointer"
                >
                  Retirer la photo
                </button>
              </div>
            )}
          </div>

          {/* Option Parallaxe */}
          <div className="flex items-center justify-between pt-1 border-t border-[#242422]">
            <span className="flex items-center gap-1.5 text-[11px] text-[#C9C7C1]">
              <Sparkles className="w-3.5 h-3.5 text-[color:var(--ui-accent)]" />
              Effet parallaxe
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={bgParallax}
              onClick={() => void persistField({ bgParallax: !bgParallax })}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
                bgParallax ? 'bg-[color:var(--ui-accent)]' : 'bg-[#2B2B28]'
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-black transition-transform ${
                  bgParallax ? 'translate-x-4.5' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Suppression de la section avec message d'avertissement */}
          <div className="pt-2 border-t border-[#242422]">
            {!confirmDelete ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-red-500/35 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 text-[11px] font-medium transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Supprimer cette section</span>
              </button>
            ) : (
              <div className="rounded-lg border border-red-500/50 bg-red-950/50 p-2.5 space-y-2">
                <div className="flex items-start gap-2 text-[11px] text-red-200 leading-snug">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>
                    Attention : la section « {sectionLabel} » sera supprimée de cette page. Continuer ?
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="flex-1 px-2.5 py-1.5 rounded bg-[#1E1E1C] hover:bg-[#2A2A27] text-[#D4D4D8] text-[11px] font-medium cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void handleDeleteSection()}
                    className="flex-1 px-2.5 py-1.5 rounded bg-red-600 hover:bg-red-500 text-white text-[11px] font-semibold cursor-pointer disabled:opacity-50"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bouton carré sur le bord droit qui sort de droite vers la gauche avec icône engrenage animée */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title={`Arrière-plan de « ${sectionLabel} »`}
        aria-label={`Paramètres d'arrière-plan de ${sectionLabel}`}
        className={`pointer-events-auto group/cog flex items-center justify-center w-9 h-9 rounded-l-lg border border-r-0 shadow-xl transition-all duration-300 cursor-pointer ${
          open
            ? 'translate-x-0 bg-[color:var(--ui-accent)] text-black border-[color:var(--ui-accent)]'
            : visible
            ? 'translate-x-0 bg-[#121211]/95 text-[color:var(--ui-accent)] border-[#353532] hover:bg-[#1B1B19]'
            : 'translate-x-7 opacity-40 hover:translate-x-0 hover:opacity-100 bg-[#121211]/90 text-[#C9C7C1] border-[#2B2B28]'
        }`}
      >
        <Settings
          className={`w-4 h-4 transition-transform duration-700 ${open ? 'rotate-90' : ''}`}
          style={open ? undefined : { animation: 'spin 24s linear infinite' }}
        />
      </button>
    </div>
  );
};
