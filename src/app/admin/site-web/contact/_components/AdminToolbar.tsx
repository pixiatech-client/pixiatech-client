'use client';
import React from 'react';
import { 
  Save, RotateCcw, Eye, Edit3, CheckCircle2, 
  Loader2, Sliders, Shield, Layers, HelpCircle 
} from 'lucide-react';

interface AdminToolbarProps {
  isAdminMode: boolean;
  onToggleAdminMode: () => void;
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  onSave: () => void;
  onReset: () => void;
  onOpenSmtpModal: () => void;
  saveSuccessMessage?: string | null;
  hiddenCount: number;
}

export const AdminToolbar: React.FC<AdminToolbarProps> = ({
  isAdminMode,
  onToggleAdminMode,
  hasUnsavedChanges,
  isSaving,
  onSave,
  onReset,
  onOpenSmtpModal,
  saveSuccessMessage,
  hiddenCount,
}) => {
  return (
    <div className="sticky top-0 z-50 w-full bg-gray-950 text-white border-b border-gray-800 shadow-xl px-4 py-2.5 transition-all">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Left: Mode Title & Switch */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-gray-900 border border-gray-800 rounded-full px-3 py-1">
            <Shield size={14} className="text-[#c6ff00]" />
            <span className="text-[11px] font-black uppercase tracking-wider text-gray-200">
              Console d'Édition PixiaTech
            </span>
          </div>

          {/* Mode Switch Toggle Button */}
          <button
            type="button"
            onClick={onToggleAdminMode}
            className={`flex items-center space-x-2 text-xs font-semibold px-3.5 py-1.5 rounded-xl border transition-all ${
              isAdminMode 
                ? 'bg-[#c6ff00] text-black border-[#c6ff00] shadow-sm' 
                : 'bg-gray-900 text-gray-300 border-gray-700 hover:bg-gray-800'
            }`}
          >
            {isAdminMode ? (
              <>
                <Edit3 size={13} className="text-black" />
                <span>Mode Édition Directe (Actif)</span>
              </>
            ) : (
              <>
                <Eye size={13} className="text-gray-400" />
                <span>Aperçu Visiteur (Passer en mode édition)</span>
              </>
            )}
          </button>

          {isAdminMode && (
            <span className="hidden sm:inline-flex items-center space-x-1.5 text-[11px] text-gray-400 bg-gray-900/80 px-2.5 py-1 rounded-lg border border-gray-800">
              <Layers size={12} className="text-amber-400" />
              <span>{hiddenCount} carte(s) masquée(s)</span>
            </span>
          )}
        </div>

        {/* Center: Live feedback helper */}
        {isAdminMode && (
          <div className="hidden lg:flex items-center space-x-2 text-xs text-gray-300">
            <span className="h-2 w-2 rounded-full bg-[#c6ff00] animate-ping" />
            <span>Cliquez sur n'importe quel texte pour le modifier • Utilisez les switchs pour masquer des éléments</span>
          </div>
        )}

        {/* Right: Actions */}
        <div className="flex items-center space-x-2">
          {saveSuccessMessage && (
            <div className="flex items-center space-x-1.5 text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-3 py-1 rounded-lg">
              <CheckCircle2 size={13} />
              <span>{saveSuccessMessage}</span>
            </div>
          )}

          {isAdminMode && (
            <>
              {/* Reset to defaults button */}
              <button
                type="button"
                onClick={onReset}
                className="flex items-center space-x-1.5 bg-gray-900 hover:bg-gray-800 text-gray-300 border border-gray-800 px-3 py-1.5 rounded-xl text-xs transition-colors"
                title="Rétablir les textes d'origine"
              >
                <RotateCcw size={12} />
                <span className="hidden md:inline">Rétablir par défaut</span>
              </button>

              {/* Save Button */}
              <button
                type="button"
                onClick={onSave}
                disabled={isSaving}
                className={`flex items-center space-x-2 text-white font-bold px-4 py-1.5 rounded-xl text-xs transition-all shadow-md active:scale-95 ${
                  hasUnsavedChanges 
                    ? 'ring-2 ring-emerald-400/50 hover:brightness-110' 
                    : 'hover:brightness-105'
                }`}
                style={{
                  background: 'linear-gradient(90deg, #7c3aed 0%, #ef4444 50%, #f97316 100%)'
                }}
              >
                {isSaving ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Sauvegarde...</span>
                  </>
                ) : (
                  <>
                    <Save size={13} />
                    <span>Sauvegarder</span>
                    {hasUnsavedChanges && (
                      <span className="h-1.5 w-1.5 rounded-full bg-[#c6ff00]" />
                    )}
                  </>
                )}
              </button>
            </>
          )}

          {/* Quick open SMTP / Settings */}
          <button
            type="button"
            onClick={onOpenSmtpModal}
            className="flex items-center space-x-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 px-3 py-1.5 rounded-xl text-xs transition-colors"
            title="Ouvrir la configuration SMTP et les messages"
          >
            <Sliders size={12} className="text-gray-400" />
            <span>Espace Membre</span>
          </button>
        </div>
      </div>
    </div>
  );
};