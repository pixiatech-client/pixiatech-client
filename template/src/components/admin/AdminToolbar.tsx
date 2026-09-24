import React from 'react';
import { Save, RotateCcw, Eye, EyeOff, Check, AlertCircle, Sparkles, X } from 'lucide-react';
import { useProduct } from '../../context/ProductContext';

export const AdminToolbar: React.FC = () => {
  const {
    isEditMode,
    setIsEditMode,
    isVisitorPreview,
    setIsVisitorPreview,
    hasUnsavedChanges,
    isSaving,
    hiddenCount,
    saveChanges,
    resetToFactory
  } = useProduct();

  if (!isEditMode) {
    return null;
  }

  return (
    <aside aria-label="Panneau d'administration" className="sticky top-0 z-50 w-full bg-[#0a0c12]/95 backdrop-blur-md border-b border-[#c6ff00]/30 shadow-2xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Mode badge & status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#c6ff00]/15 border border-[#c6ff00]/40 text-[#c6ff00] text-xs font-mono font-bold tracking-wider uppercase">
            <span className="w-2 h-2 rounded-full bg-[#c6ff00] animate-ping" />
            <span className="hidden sm:inline">ÉDITEUR WYSIWYG PIXIATECH</span>
            <span className="sm:hidden">ÉDITEUR</span>
          </div>

          {/* Unsaved indicator */}
          {hasUnsavedChanges ? (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Modifications non enregistrées</span>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
              <Check className="w-3 h-3" />
              <span>Synchronisé</span>
            </div>
          )}

          {/* Hidden items counter */}
          {hiddenCount > 0 && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono">
              <EyeOff className="w-3 h-3" />
              <span>{hiddenCount} élément{hiddenCount > 1 ? 's' : ''} masqué{hiddenCount > 1 ? 's' : ''}</span>
            </div>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Visitor Preview Toggle */}
          <button
            type="button"
            onClick={() => setIsVisitorPreview(!isVisitorPreview)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              isVisitorPreview
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
            }`}
            title="Tester l'affichage public sans quitter le mode éditeur"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {isVisitorPreview ? 'Retour Édition' : 'Aperçu Visiteur'}
            </span>
          </button>

          {/* Reset Factory */}
          <button
            type="button"
            onClick={() => resetToFactory()}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-colors disabled:opacity-50"
            title="Réinitialiser toutes les données aux valeurs de référence"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Réinitialiser</span>
          </button>

          {/* Save button */}
          <button
            type="button"
            onClick={() => saveChanges()}
            disabled={isSaving}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-lg ${
              hasUnsavedChanges
                ? 'bg-[#c6ff00] hover:bg-[#b5eb00] text-black glow-neon-sm font-semibold'
                : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
            } disabled:opacity-50`}
          >
            <Save className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{isSaving ? 'Enregistrement...' : 'Enregistrer'}</span>
          </button>

          {/* Exit Edit Mode */}
          <button
            type="button"
            onClick={() => setIsEditMode(false)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors ml-1"
            title="Quitter le mode édition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
