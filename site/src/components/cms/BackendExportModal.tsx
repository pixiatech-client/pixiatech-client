import React, { useState } from "react";
import { useCms } from "../../context/CmsContext";
import {
  X,
  Copy,
  Check,
  Download,
  Server,
  Code,
  CheckCircle2,
  ExternalLink,
  BookOpen,
} from "lucide-react";

interface BackendExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BackendExportModal: React.FC<BackendExportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    exportPagesJson,
    backendConnected,
    settings,
    updateSettings,
    currentPageId,
  } = useCms();

  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"json" | "endpoints" | "config">("json");
  const [customApiUrl, setCustomApiUrl] = useState(settings.backendApiUrl || "/api/pixel-tech-web");

  if (!isOpen) return null;

  const jsonContent = exportPagesJson();

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const blob = new Blob([jsonContent], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pixel-tech-web-pages-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveConfig = () => {
    updateSettings({ backendApiUrl: customApiUrl });
    alert("Configuration de l'URL Pixel Tech Web enregistrée !");
  };

  return (
    <div className="fixed inset-0 z-[360] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-[#0E0E0D] border border-[#2B2B28] text-[#F5F4F0] rounded-2xl shadow-2xl flex flex-col font-sans overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#141413] border-b border-[#222220]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#C3F910]/20 text-[#C3F910] flex items-center justify-center">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white m-0 font-mono tracking-wide">
                CONSOLE DÉVELOPPEUR • {settings.backendName.toUpperCase()}
              </h3>
              <p className="text-[11px] text-[#7A7A76] m-0 font-mono">
                Schémas de données pour l'équipe de développement & intégration backend
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-[#7A7A76] hover:text-white p-1 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab navigation */}
        <div className="flex border-b border-[#222220] bg-[#121211] px-6 text-xs font-mono">
          <button
            type="button"
            onClick={() => setActiveTab("json")}
            className={`py-3 px-4 border-b-2 font-semibold transition-colors cursor-pointer ${
              activeTab === "json"
                ? "border-[#C3F910] text-[#C3F910]"
                : "border-transparent text-[#7A7A76] hover:text-white"
            }`}
          >
            Données JSON Exportables
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("endpoints")}
            className={`py-3 px-4 border-b-2 font-semibold transition-colors cursor-pointer ${
              activeTab === "endpoints"
                ? "border-[#C3F910] text-[#C3F910]"
                : "border-transparent text-[#7A7A76] hover:text-white"
            }`}
          >
            Endpoints REST & Spécifications
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("config")}
            className={`py-3 px-4 border-b-2 font-semibold transition-colors cursor-pointer ${
              activeTab === "config"
                ? "border-[#C3F910] text-[#C3F910]"
                : "border-transparent text-[#7A7A76] hover:text-white"
            }`}
          >
            Paramètres Serveur API
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs font-mono">
          {activeTab === "json" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-[#9A9A94]">
                  Toutes les modifications faites dans l'éditeur Elementor sont compilées ci-dessous :
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 bg-[#1C1C1A] hover:bg-[#2A2A26] text-white px-3 py-1.5 rounded border border-[#333] transition-colors cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#C3F910]" />
                        <span className="text-[#C3F910]">Copié !</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copier JSON</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleDownload}
                    className="flex items-center gap-1.5 bg-[#C3F910] hover:bg-[#b0e20e] text-[#080808] font-bold px-3 py-1.5 rounded transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Télécharger .json</span>
                  </button>
                </div>
              </div>

              <pre className="bg-[#080808] border border-[#222220] p-4 rounded-xl text-[#A6E22E] text-[11px] overflow-x-auto max-h-[440px] leading-normal font-mono select-all">
                {jsonContent}
              </pre>
            </div>
          )}

          {activeTab === "endpoints" && (
            <div className="space-y-4 text-[#EDEBE6]">
              <p className="text-xs text-[#9A9A94] leading-relaxed">
                Votre équipe de développement peut brancher l'application sur votre backend{" "}
                <strong className="text-white">Pixel Tech Web</strong> via ces routes REST standard :
              </p>

              <div className="space-y-3">
                <div className="p-3.5 rounded-lg bg-[#141412] border border-[#262624]">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="px-2 py-0.5 rounded bg-blue-900/40 text-blue-400 font-bold text-[10px]">
                      GET
                    </span>
                    <code className="text-white">/api/pixel-tech-web/pages</code>
                  </div>
                  <p className="text-[11px] text-[#7A7A76] m-0">
                    Récupère la totalité des pages, textes, images et paramètres modifiés.
                  </p>
                </div>

                <div className="p-3.5 rounded-lg bg-[#141412] border border-[#262624]">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="px-2 py-0.5 rounded bg-amber-900/40 text-amber-400 font-bold text-[10px]">
                      PUT
                    </span>
                    <code className="text-white">/api/pixel-tech-web/pages/:pageId</code>
                  </div>
                  <p className="text-[11px] text-[#7A7A76] m-0">
                    Enregistre les modifications d'une page spécifique (ex: <code>home</code> ou{" "}
                    <code>product_wp</code>).
                  </p>
                </div>

                <div className="p-3.5 rounded-lg bg-[#141412] border border-[#262624]">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="px-2 py-0.5 rounded bg-emerald-900/40 text-emerald-400 font-bold text-[10px]">
                      POST
                    </span>
                    <code className="text-white">/api/pixel-tech-web/upload</code>
                  </div>
                  <p className="text-[11px] text-[#7A7A76] m-0">
                    Reçoit les photos uploadées depuis l'ordinateur de l'admin (en base64 ou multipart)
                    et renvoie l'URL publique hébergée.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "config" && (
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] text-[#9A9A94] uppercase mb-1.5">
                  URL de base de l'API Pixel Tech Web
                </label>
                <input
                  type="text"
                  value={customApiUrl}
                  onChange={(e) => setCustomApiUrl(e.target.value)}
                  className="w-full bg-[#171715] border border-[#2B2B28] rounded-lg p-3 text-white focus:border-[#C3F910] focus:outline-none"
                  placeholder="https://votre-domaine.com/api/pixel-tech-web"
                />
                <p className="text-[10px] text-[#7A7A76] mt-1.5">
                  Par défaut : <code>/api/pixel-tech-web</code> (géré par le serveur Express intégré).
                </p>
              </div>

              <button
                type="button"
                onClick={handleSaveConfig}
                className="bg-[#C3F910] hover:bg-[#b0e20e] text-[#080808] font-bold px-4 py-2.5 rounded-lg transition-colors cursor-pointer"
              >
                ENREGISTRER L'ENDPOINT
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#141413] border-t border-[#222220] flex items-center justify-between text-[11px] text-[#7A7A76] font-mono">
          <span>PIXIATECH • Pixel Tech Web Architecture v2.4</span>
          <button
            type="button"
            onClick={onClose}
            className="hover:text-white transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
