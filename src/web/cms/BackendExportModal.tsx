'use client';

import React, { useState } from 'react';
import { useCms } from '@/lib/site-web/cms-context';
import { X, Copy, Check, Download, Server, Code, ExternalLink, BookOpen } from 'lucide-react';

interface BackendExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BackendExportModal: React.FC<BackendExportModalProps> = ({ isOpen, onClose }) => {
  const { exportPagesJson, backendConnected, settings, updateSettings, saveSettings } = useCms();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'json' | 'endpoints' | 'config'>('json');
  const [companyName, setCompanyName] = useState(settings.companyName);

  if (!isOpen) return null;

  const jsonContent = exportPagesJson();

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `site-web-pages-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveConfig = async () => {
    updateSettings({ companyName });
    const ok = await saveSettings();
    if (ok) {
      alert(`Configuration ${settings.backendName} enregistrée !`);
    } else {
      alert("Échec de l'enregistrement des paramètres sur le serveur (vérifiez la session administrateur).");
    }
  };

  return (
    <div
      id="backend-export-modal"
      data-cms-ui="true"
      className="fixed inset-0 z-[360] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-[#0E0E0D] border border-[#2B2B28] text-[#F5F4F0] rounded-2xl shadow-2xl flex flex-col font-sans overflow-hidden">
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
          <button type="button" onClick={onClose} className="text-[#7A7A76] hover:text-white p-1 rounded transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b border-[#222220] bg-[#121211] px-6 text-xs font-mono">
          {(
            [
              { key: 'json', label: 'Données JSON Exportables' },
              { key: 'endpoints', label: 'Endpoints REST & Spécifications' },
              { key: 'config', label: 'Paramètres Serveur API' },
            ] as const
          ).map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`py-3 px-4 border-b-2 font-semibold transition-colors cursor-pointer ${
                activeTab === key ? 'border-[#C3F910] text-[#C3F910]' : 'border-transparent text-[#7A7A76] hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs font-mono">
          {activeTab === 'json' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-[#9A9A94]">
                  Toutes les modifications faites dans l'éditeur sont compilées ci-dessous :
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

          {activeTab === 'endpoints' && (
            <div className="space-y-4 text-[#EDEBE6]">
              <p className="text-xs text-[#9A9A94] leading-relaxed">
                Le CMS Site Web s'appuie sur les routes REST suivantes (intégrées dans l'application Next.js) :
              </p>
              <div className="space-y-3">
                <div className="p-3.5 rounded-lg bg-[#141412] border border-[#262624]">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="px-2 py-0.5 rounded bg-blue-900/40 text-blue-400 font-bold text-[10px]">GET</span>
                    <code className="text-white">/api/site-web/pages</code>
                  </div>
                  <p className="text-[11px] text-[#7A7A76] m-0">
                    Récupère les pages, textes, images et paramètres. Public (rendu du site public).
                  </p>
                </div>
                <div className="p-3.5 rounded-lg bg-[#141412] border border-[#262624]">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="px-2 py-0.5 rounded bg-amber-900/40 text-amber-400 font-bold text-[10px]">PUT</span>
                    <code className="text-white">/api/site-web/pages/:pageId</code>
                  </div>
                  <p className="text-[11px] text-[#7A7A76] m-0">
                    Enregistre les modifications d'une page. Admin uniquement.
                  </p>
                </div>
                <div className="p-3.5 rounded-lg bg-[#141412] border border-[#262624]">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="px-2 py-0.5 rounded bg-emerald-900/40 text-emerald-400 font-bold text-[10px]">POST</span>
                    <code className="text-white">/api/site-web/upload</code>
                  </div>
                  <p className="text-[11px] text-[#7A7A76] m-0">
                    Upload des photos (base64). Admin uniquement. Renvoie l'URL publique hébergée.
                  </p>
                </div>
                <div className="p-3.5 rounded-lg bg-[#141412] border border-[#262624]">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="px-2 py-0.5 rounded bg-purple-900/40 text-purple-400 font-bold text-[10px]">GET</span>
                    <code className="text-white">/api/site-web/status</code>
                  </div>
                  <p className="text-[11px] text-[#7A7A76] m-0">
                    Vérifie la session administrateur (source de vérité pour activer l'éditeur). Admin uniquement.
                  </p>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <span className="px-2.5 py-1 rounded bg-[#C3F910]/10 border border-[#C3F910]/30 text-[#C3F910] text-[10px] flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" /> Authentification unique : session admin Next.js existante
                </span>
                <span className="px-2.5 py-1 rounded bg-[#171715] border border-[#2B2B28] text-[#9A9A94] text-[10px] flex items-center gap-1.5">
                  <Code className="w-3.5 h-3.5" /> Persistance : data/pixel-tech-web-pages.json
                </span>
              </div>
            </div>
          )}

          {activeTab === 'config' && (
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] text-[#9A9A94] uppercase mb-1.5">Nom de la société</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full bg-[#171715] border border-[#2B2B28] rounded-lg p-3 text-white focus:border-[#C3F910] focus:outline-none"
                  placeholder="PIXIATECH"
                />
                <p className="text-[10px] text-[#7A7A76] mt-1.5">
                  Endpoint API : <code>{settings.backendApiUrl}</code> (géré par les route handlers Next.js).
                </p>
              </div>
              <button
                type="button"
                onClick={handleSaveConfig}
                className="bg-[#C3F910] hover:bg-[#b0e20e] text-[#080808] font-bold px-4 py-2.5 rounded-lg transition-colors cursor-pointer"
              >
                ENREGISTRER LES PARAMÈTRES
              </button>
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-[#141413] border-t border-[#222220] flex items-center justify-between text-[11px] text-[#7A7A76] font-mono">
          <span>PIXIATECH • Site Web CMS v3</span>
          <button type="button" onClick={onClose} className="hover:text-white transition-colors cursor-pointer">
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
