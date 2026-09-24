import React, { useState } from "react";
import { useCms } from "../../context/CmsContext";
import { Lock, Key, ShieldCheck, X, ArrowRight, Sparkles } from "lucide-react";

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { login, settings } = useCms();
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(password)) {
      setError(false);
      setPassword("");
      onClose();
    } else {
      setError(true);
    }
  };

  const handleQuickDemo = () => {
    login("admin");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[350] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-[#0e0e0d] border border-[#2b2b28] text-[#f5f4f0] p-6 sm:p-8 rounded-2xl shadow-2xl font-sans">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-[#7a7a76] hover:text-white p-1 rounded transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#C3F910]/15 border border-[#C3F910]/30 flex items-center justify-center text-[#C3F910]">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold tracking-tight text-white m-0">
              Espace Administration
            </h3>
            <p className="text-xs font-mono text-[#7a7a76] m-0">
              {settings.companyName} • {settings.backendName}
            </p>
          </div>
        </div>

        <p className="text-xs text-[#9a9a94] mb-6 leading-relaxed">
          Connectez-vous avec vos droits administrateur pour activer le mode
          d'édition en direct style Elementor et gérer toutes les pages de votre
          site.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-mono text-[#9a9a94] uppercase tracking-wider mb-1.5">
              Mot de passe administrateur
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(false);
                }}
                placeholder="Entrez le mot de passe..."
                className="w-full bg-[#171715] border border-[#2b2b28] rounded-xl px-4 py-3 text-sm text-white font-mono focus:border-[#C3F910] focus:outline-none transition-colors"
                autoFocus
              />
              <Key className="w-4 h-4 text-[#7a7a76] absolute right-3.5 top-3.5" />
            </div>
            {error && (
              <p className="text-xs text-red-400 mt-2 font-mono">
                Mot de passe incorrect. (Indice : tapez <code>admin</code>)
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-[#C3F910] hover:bg-[#b0e20e] text-[#080808] font-bold text-xs font-mono py-3.5 rounded-xl transition-all cursor-pointer shadow-[0_0_20px_rgba(195,249,16,0.25)]"
          >
            <span>ACCÉDER AU MODE ÉDITEUR</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Demo Login */}
        <div className="mt-6 pt-5 border-t border-[#222220] flex items-center justify-between">
          <span className="text-[11px] text-[#7a7a76] font-mono">
            Accès rapide immédiat :
          </span>
          <button
            type="button"
            onClick={handleQuickDemo}
            className="inline-flex items-center gap-1.5 text-xs text-[#C3F910] hover:underline font-mono font-bold cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Connexion 1-Clic</span>
          </button>
        </div>
      </div>
    </div>
  );
};
