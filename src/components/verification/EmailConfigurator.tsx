'use client';

import { useState } from 'react';
import { RefreshCw, Timer, ShieldCheck, Sparkles, Users, Sliders, Layers } from 'lucide-react';
import type { MessageStyle, PreviewTheme, LogAction } from './types';

interface EmailConfiguratorProps {
  code: string;
  onCodeChange: (code: string) => void;
  validityMinutes: number;
  onValidityChange: (minutes: number) => void;
  messageStyle: MessageStyle;
  onMessageStyleChange: (style: MessageStyle) => void;
  companyName: string;
  onCompanyNameChange: (name: string) => void;
  companySlogan: string;
  onCompanySloganChange: (slogan: string) => void;
  documentLabel: string;
  onDocumentLabelChange: (label: string) => void;
  previewTheme: PreviewTheme;
  onPreviewThemeChange: (theme: PreviewTheme) => void;
  autoSimulatedDark: boolean;
  onAutoSimulatedDarkChange: (dark: boolean) => void;
  timeLeft: number;
  onRandomizeCode: () => void;
  onResetTimer: () => void;
  onTogglePause: () => void;
  isPlaying: boolean;
}

export function EmailConfigurator({
  code, onCodeChange, validityMinutes, onValidityChange,
  messageStyle, onMessageStyleChange,
  companyName, onCompanyNameChange,
  companySlogan, onCompanySloganChange,
  documentLabel, onDocumentLabelChange,
  previewTheme, onPreviewThemeChange,
  autoSimulatedDark, onAutoSimulatedDarkChange,
  timeLeft, onRandomizeCode, onResetTimer, onTogglePause, isPlaying,
}: EmailConfiguratorProps) {
  const [logs, setLogs] = useState<LogAction[]>([
    { id: "1", time: new Date().toLocaleTimeString("fr-FR"), text: "Configurateur initialisé.", type: "info" },
  ]);
  const [soundEnabled] = useState(true);

  const addLog = (text: string, type: "success" | "info" | "warning" = "info") => {
    const now = new Date();
    const formattedTime = now.toLocaleTimeString("fr-FR", { hour12: false });
    const newLog: LogAction = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Math.random()),
      time: formattedTime, text, type
    };
    setLogs(prev => [newLog, ...prev].slice(0, 10));
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-indigo-400 font-mono text-xs font-semibold uppercase tracking-wider">
          <Sliders className="w-4 h-4" />
          <span>Pupitre de Contrôle</span>
        </div>
        <span className="text-xs bg-indigo-500/10 text-indigo-400 px-2.5 py-1 rounded-full border border-indigo-500/15 font-medium">
          Administration
        </span>
      </div>

      {/* Config Card */}
      <div className="bg-white border border-slate-200 rounded-[28px] p-6 shadow-sm space-y-6">
        {/* Code de validation */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold tracking-wide uppercase text-slate-500 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              Code de Validation (6 chiffres)
            </label>
            <button
              type="button"
              onClick={() => {
                const digits = Math.floor(100000 + Math.random() * 900000).toString();
                onCodeChange(digits);
                onResetTimer();
                addLog(`Nouveau code généré : ${digits}`, "success");
              }}
              className="text-xs flex items-center gap-1 text-indigo-500 hover:text-indigo-700 transition-colors font-medium cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              Changer le code
            </button>
          </div>
          <div className="relative">
            <input
              type="text"
              maxLength={6}
              value={code}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "");
                onCodeChange(val);
              }}
              placeholder="Ex: 523807"
              className="w-full tracking-widest font-mono text-xl bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-center text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-semibold"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono">
              {code.length}/6
            </div>
          </div>
        </div>

        {/* Durée de validité */}
        <div className="space-y-3">
          <label className="text-xs font-bold tracking-wide uppercase text-slate-500 flex items-center gap-1.5">
            <Timer className="w-3.5 h-3.5 text-indigo-500" />
            Durée de validité du code
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[1, 5, 10, 15].map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => {
                  onValidityChange(mins);
                  addLog(`Durée configurée sur ${mins} minutes.`, "info");
                }}
                className={`py-2 text-xs rounded-xl font-mono font-bold border transition-all cursor-pointer ${
                  validityMinutes === mins
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                    : "bg-white border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600"
                }`}
              >
                {mins} Min
              </button>
            ))}
          </div>
          <div className="flex gap-2 items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${timeLeft === 0 ? 'bg-slate-400' : 'bg-rose-500'} animate-pulse`} />
              <span className="text-xs font-mono text-slate-500">Rebours :</span>
              <span className="text-xs font-mono font-bold text-slate-900">{formatTime(timeLeft)}</span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onTogglePause}
                className="px-2.5 py-1 text-[11px] font-bold bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-600 transition-all cursor-pointer"
              >
                {isPlaying ? "Pause" : "Démarrer"}
              </button>
              <button
                type="button"
                onClick={onResetTimer}
                className="px-2.5 py-1 text-[11px] font-bold bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-500 transition-all cursor-pointer"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Formulation de sécurité */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold tracking-wide uppercase text-slate-500 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
              Formulation de sécurité
            </label>
            <span className="text-[9px] bg-indigo-50 text-indigo-600 border border-indigo-200 px-2 py-0.5 rounded-full font-mono font-semibold">
              Sans Triangle
            </span>
          </div>
          <div className="space-y-2">
            {[
              {
                id: "collaborative_trust" as MessageStyle,
                label: "Option A : Co-Responsabilité",
                desc: "Implication collaborative des équipes et du client."
              },
              {
                id: "ultra_secure_2026" as MessageStyle,
                label: "Option B : Confidentialité Absolue",
                desc: "Politique stricte, signature électronique sécurisée."
              },
              {
                id: "classic_refinement" as MessageStyle,
                label: "Option C : Point de Contrôle",
                desc: "Gouvernance interne et sécurité de base."
              }
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  onMessageStyleChange(opt.id);
                  addLog(`Wording : ${opt.label}`, "info");
                }}
                className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-start gap-3 cursor-pointer ${
                  messageStyle === opt.id
                    ? "bg-indigo-50 border-indigo-300 text-slate-800"
                    : "bg-white border-slate-200 text-slate-500 hover:border-indigo-200 hover:text-slate-700"
                }`}
              >
                <div className="mt-0.5">
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    messageStyle === opt.id ? "border-indigo-500" : "border-slate-300"
                  }`}>
                    {messageStyle === opt.id && <div className="w-2 h-2 rounded-full bg-indigo-600" />}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-700">{opt.label}</div>
                  <div className="text-[11px] text-slate-400 mt-1">{opt.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Thèmes */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-500" />
              Thèmes du Courriel
            </label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { key: "auto_adaptive" as PreviewTheme, label: "Détecteur Auto ✨" },
              { key: "glass_frosted" as PreviewTheme, label: "Glassmorphic" },
              { key: "light_premium" as PreviewTheme, label: "Blanc Épuré" },
              { key: "dark_luxury" as PreviewTheme, label: "Sombre Luxe" },
            ].map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => {
                  onPreviewThemeChange(t.key);
                  addLog(`Thème : ${t.label}`, "info");
                }}
                className={`py-2 px-1 text-[10px] font-bold rounded-xl border transition-all cursor-pointer ${
                  previewTheme === t.key
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                    : "bg-white border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          {previewTheme === "auto_adaptive" && (
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2 mt-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-indigo-600 font-mono font-bold uppercase">Simulateur OS</span>
                <span className="text-[9px] px-1.5 py-0.5 bg-indigo-100 text-indigo-700 uppercase rounded font-bold font-mono">Media Query</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-normal">
                Simule <code className="text-pink-600 bg-pink-50 px-1 py-0.5 rounded">@media (prefers-color-scheme: dark)</code>
              </p>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-600">Thème OS simulateur :</span>
                <div className="flex bg-slate-200 rounded-lg p-0.5">
                  <button
                    type="button"
                    onClick={() => onAutoSimulatedDarkChange(false)}
                    className={`px-2 py-1 text-[10px] rounded font-bold transition-all cursor-pointer ${
                      !autoSimulatedDark ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    Clair
                  </button>
                  <button
                    type="button"
                    onClick={() => onAutoSimulatedDarkChange(true)}
                    className={`px-2 py-1 text-[10px] rounded font-bold transition-all cursor-pointer ${
                      autoSimulatedDark ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    Sombre
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Company name fields */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-mono">Entreprise</span>
              <input
                type="text"
                className="w-full bg-white border border-slate-200 text-xs px-2.5 py-2 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-500"
                value={companyName}
                onChange={(e) => onCompanyNameChange(e.target.value.toUpperCase())}
              />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-mono">Slogan Logo</span>
              <input
                type="text"
                className="w-full bg-white border border-slate-200 text-xs px-2.5 py-2 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-500"
                value={companySlogan}
                onChange={(e) => onCompanySloganChange(e.target.value.toUpperCase())}
              />
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 uppercase font-mono">Objet du Document</span>
            <input
              type="text"
              className="w-full bg-white border border-slate-200 text-xs px-2.5 py-2 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-500"
              value={documentLabel}
              onChange={(e) => onDocumentLabelChange(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Logs */}
      <div className="bg-white border border-slate-100 rounded-[22px] p-4 font-mono text-xs shadow-sm">
        <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider pb-2 border-b border-slate-100 mb-2">
          <span className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full bg-indigo-500 ${logs.length > 0 ? 'animate-ping' : ''}`} />
            <span className="text-slate-500 flex items-center gap-1"><Users className="w-3 h-3" /> Journal d'Actions</span>
          </span>
          <button
            type="button"
            onClick={() => setLogs([{ id: "1", time: "maintenant", text: "Journal vidé.", type: "info" }])}
            className="hover:text-slate-700 transition-colors cursor-pointer"
          >
            Effacer
          </button>
        </div>
        <div className="space-y-1.5 max-h-32 overflow-y-auto">
          {logs.map((log) => (
            <div key={log.id} className="flex gap-2 items-start text-[11px] text-slate-600">
              <span className="text-slate-400">[{log.time}]</span>
              <span className={
                log.type === "success" ? "text-emerald-600" :
                log.type === "warning" ? "text-rose-500" :
                "text-indigo-600"
              }>
                {log.type === "success" && "✓ "}
                {log.type === "warning" && "⚠ "}
                {log.text}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
