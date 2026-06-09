'use client';

import { useState } from 'react';
import { Check, Copy, ShieldCheck, LockKeyhole, Users, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { MessageStyle, PreviewTheme } from './types';

interface EmailTemplatePreviewProps {
  code: string;
  timeLeft: number;
  previewTheme: PreviewTheme;
  autoSimulatedDark: boolean;
  messageStyle: MessageStyle;
  companyName: string;
  companySlogan: string;
  documentLabel: string;
  onCopyCode: () => void;
  onRandomizeCode: () => void;
  copied: boolean;
}

function getSecurityContent(style: MessageStyle) {
  switch (style) {
    case "collaborative_trust":
      return {
        title: "SÉCURITÉ ET CO-RESPONSABILITÉ",
        badge: "Engagement collaboratif",
        body: "La protection absolue de vos données et de votre estimation implique autant nos conseillers que votre propre vigilance. Conformément à nos protocoles, aucun membre ni collaborateur de l'entreprise n'est autorisé à vous solliciter pour obtenir ce code. Il reste strictement crypté à votre unique usage.",
        Icon: Users,
        accentColor: "text-indigo-400",
        borderColor: "border-indigo-500/20",
        bgColor: "bg-white/[0.03]",
      };
    case "ultra_secure_2026":
      return {
        title: "POLITIQUE DE CONFIDENTIALITÉ ABSOLUE",
        badge: "Signature Électronique",
        body: "Ce code secret sert de certificat numérique pour signer votre document. Pour prévenir toute usurpation d'identité, veillez à ne jamais le divulguer. Aucun collaborateur de Pixiatech n'est habilité à vous le demander, que ce soit par appel, SMS ou e-mail.",
        Icon: ShieldCheck,
        accentColor: "text-blue-400",
        borderColor: "border-blue-500/20",
        bgColor: "bg-white/[0.03]",
      };
    case "classic_refinement":
      return {
        title: "VOTRE SÉCURITÉ EN LIGNE",
        badge: "Point de contrôle",
        body: "Ce code de validation temporaire est strictement privé. Il sert à la vérification de conformité immédiate. Les règles de gouvernance de notre réseau interdisent formellement son partage avec tout tiers ou conseiller.",
        Icon: LockKeyhole,
        accentColor: "text-slate-400",
        borderColor: "border-slate-500/20",
        bgColor: "bg-white/[0.03]",
      };
  }
}

const formatTimeDisplay = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

export function EmailTemplatePreview({
  code, timeLeft, previewTheme, autoSimulatedDark, messageStyle,
  companyName, companySlogan, documentLabel,
  onCopyCode, onRandomizeCode, copied,
}: EmailTemplatePreviewProps) {
  const resolvedTheme = previewTheme === "auto_adaptive"
    ? (autoSimulatedDark ? "dark_luxury" : "light_premium")
    : previewTheme;
  const security = getSecurityContent(messageStyle);
  const isExpired = timeLeft === 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between text-slate-500 text-xs">
        <span className="flex items-center gap-1.5 font-mono">
          <Eye className="w-4 h-4 text-indigo-500" />
          <span>Rendu Final du Mail</span>
        </span>
        <span className="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 font-mono text-[10px] text-slate-500">
          500px responsive
        </span>
      </div>

      {/* Email Shell */}
      <div className="bg-white border border-slate-200 rounded-[32px] shadow-sm overflow-hidden">
        {/* Browser bar */}
        <div className="bg-slate-50 px-5 py-3.5 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5 mr-2">
              <span className="w-3 h-3 rounded-full bg-[#ff5f56]" />
              <span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
              <span className="w-3 h-3 rounded-full bg-[#27c93f]" />
            </div>
            <span className="text-[10px] font-mono tracking-widest text-slate-500 font-semibold uppercase">
              MESSAGERIE INTERNE SECURE
            </span>
          </div>
          <div className="px-2.5 py-0.5 bg-indigo-50 border border-indigo-200 text-[9px] text-indigo-600 font-mono rounded-full font-bold">
            AES-256 ENCRYPTED
          </div>
        </div>

        {/* Envelope */}
        <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-200 text-xs text-slate-500">
          <div className="mb-1.5 flex justify-between items-center">
            <span>
              <strong className="text-slate-400">De : </strong>
              <span className="text-slate-700 font-semibold">{companyName || "Pixiatech"} Security &lt;validation@pixiatech.eu&gt;</span>
            </span>
            <span className="text-slate-400 font-mono text-[10px] hidden sm:inline">Reçu : Aujourd'hui</span>
          </div>
          <div>
            <strong className="text-slate-400">Objet : </strong>
            <span className="text-indigo-600 font-medium font-sans">Votre code de validation temporaire {companyName}</span>
          </div>
        </div>

        {/* Email Content */}
        <div className={`p-4 sm:p-10 flex items-center justify-center transition-all duration-300 ${
          resolvedTheme === "light_premium"
            ? "bg-[#f4f6fa]"
            : resolvedTheme === "dark_luxury"
            ? "bg-[#0b0c0f]"
            : "bg-gradient-to-br from-[#0c0d14] via-[#090a0f] to-[#040507]"
        }`}>
          <div className={`w-full max-w-[500px] mx-auto transition-all duration-300 ${
            resolvedTheme === "light_premium"
              ? "bg-white border border-slate-200 shadow-xl rounded-[28px] p-6 sm:p-10"
              : resolvedTheme === "dark_luxury"
              ? "bg-[#121318]/90 border border-white/5 shadow-2xl rounded-[32px] p-6 sm:p-10"
              : "backdrop-blur-2xl bg-white/5 border border-white/10 rounded-[40px] p-6 sm:p-10 shadow-2xl relative"
          }`}>
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <div className="bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center p-[2px] shadow-lg shadow-indigo-500/20 max-w-[280px] w-full">
                <div className="w-full bg-[#0a0f1b]/95 rounded-[14px] py-3.5 px-6 flex items-center justify-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 via-blue-500 to-purple-600 p-[1.5px] relative shrink-0">
                    <div className="w-full h-full rounded-full bg-[#0d1222] flex flex-col items-center justify-center relative overflow-hidden">
                      <span className="text-[8px] font-black tracking-tighter text-white">PIXIA</span>
                      <span className="text-[5.5px] font-bold text-indigo-400 font-mono tracking-widest leading-none -mt-0.5">TECH</span>
                    </div>
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-sm font-black text-white tracking-widest leading-none">
                      {companyName || "PIXIATECH"}
                    </span>
                    <span className="text-[8px] font-bold text-indigo-400 font-mono tracking-widest uppercase mt-0.5">
                      {companySlogan || "TECHNOLOGY PRO"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Header Title */}
            <div className="text-center space-y-2 mb-6 select-none">
              <h2 className={`font-bold tracking-widest text-lg uppercase ${
                resolvedTheme === "light_premium" ? "text-slate-800" : "text-white"
              }`}>
                Code de Validation
              </h2>
              <p className={`text-xs max-w-sm mx-auto leading-relaxed ${
                resolvedTheme === "light_premium" ? "text-slate-500" : "text-slate-400"
              }`}>
                Pour finaliser et signer de façon sécurisée votre{" "}
                <span className={`font-bold ${resolvedTheme === "light_premium" ? "text-indigo-600" : "text-indigo-400"}`}>
                  {documentLabel || "estimation du projet"}
                </span>
                , veuillez copier le jeton numérique temporaire ci-dessous.
              </p>
            </div>

            {/* Validation Card */}
            <div className={`border rounded-[30px] p-6 w-full mb-6 relative group text-center transition-all ${
              resolvedTheme === "light_premium"
                ? "bg-slate-50/80 border-slate-200"
                : "bg-[#040406]/55 border-white/5"
            }`}>
              {/* Header with countdown */}
              <div className="flex justify-between items-center mb-5 select-none">
                <span className={`text-[9px] uppercase tracking-[0.2em] font-bold ${
                  resolvedTheme === "light_premium" ? "text-slate-400" : "text-indigo-400"
                }`}>
                  Session Temporaire
                </span>
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${
                  isExpired
                    ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
                    : timeLeft < 60
                    ? "bg-rose-500/10 border-rose-500/20 text-rose-400 animate-pulse"
                    : resolvedTheme === "light_premium"
                    ? "bg-slate-100 border-slate-200 text-slate-600"
                    : "bg-white/5 border-white/10 text-slate-300"
                }`}>
                  <span className={`w-2 h-2 rounded-full ${isExpired ? "bg-slate-400" : "bg-rose-500"} animate-pulse`} />
                  <span className="text-xs font-mono font-bold">
                    {isExpired ? "Expiré !" : formatTimeDisplay(timeLeft)}
                  </span>
                </div>
              </div>

              {/* Digit containers */}
              <div
                onClick={onCopyCode}
                className="flex gap-2.5 justify-center mb-6 cursor-pointer transform hover:scale-[1.01] transition-all group/digits relative"
              >
                {code.split("").map((digit, index) => (
                  <div
                    key={index}
                    className={`w-11 h-16 rounded-2xl flex items-center justify-center text-2xl font-mono font-extrabold shadow-inner transition-all select-none relative ${
                      isExpired
                        ? "bg-slate-200/50 text-slate-400 border border-slate-200"
                        : copied
                        ? "bg-emerald-500/10 border-emerald-500 text-emerald-500"
                        : resolvedTheme === "light_premium"
                        ? "bg-white border border-slate-200 text-slate-800 hover:border-indigo-400"
                        : "bg-white/10 border border-white/10 text-white hover:border-indigo-500"
                    }`}
                  >
                    {digit}
                  </div>
                ))}
                <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 opacity-0 group-hover/digits:opacity-100 transition-opacity bg-black/80 text-white text-[9px] px-2 py-0.5 rounded-md font-medium tracking-wider whitespace-nowrap z-10">
                  1-CLIC COPIE DIRECTE
                </div>
              </div>

              {/* Copy button */}
              <button
                type="button"
                onClick={onCopyCode}
                disabled={isExpired}
                className={`w-full py-3.5 font-sans font-black text-xs uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] ${
                  isExpired
                    ? "bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed"
                    : copied
                    ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                    : resolvedTheme === "light_premium"
                    ? "bg-slate-900 text-white hover:bg-slate-800"
                    : "bg-white text-black hover:bg-slate-200 hover:shadow-xl shadow-white/5"
                }`}
              >
                <AnimatePresence mode="wait">
                  {copied ? (
                    <motion.span
                      key="copied"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="flex items-center gap-2"
                    >
                      <Check className="w-4.5 h-4.5" />
                      Code copié dans le presse-papier !
                    </motion.span>
                  ) : (
                    <motion.span
                      key="copy"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="flex items-center gap-2"
                    >
                      <Copy className="w-4.5 h-4.5" />
                      Copier le code
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
              <p className={`text-[10px] mt-3.5 leading-relaxed font-sans ${
                resolvedTheme === "light_premium" ? "text-slate-400" : "text-slate-500"
              }`}>
                Pas besoin de sélectionner : cliquez n'importe où sur l'encart ou sur le bouton pour copier instantanément.
              </p>
            </div>

            {/* Security message */}
            <div className={`border rounded-2xl p-5 text-left transition-all ${security.bgColor} ${security.borderColor}`}>
              <div className="flex items-center gap-2 mb-2">
                <security.Icon className={`w-4 h-4 ${security.accentColor}`} />
                <span className={`text-[10px] tracking-wider uppercase font-mono font-black ${security.accentColor}`}>
                  {security.badge}
                </span>
              </div>
              <p className={`text-[11px] leading-relaxed transition-colors ${
                resolvedTheme === "light_premium" ? "text-slate-600" : "text-slate-300"
              }`}>
                {security.body}
              </p>
            </div>

            {/* Footer */}
            <div className="flex items-center gap-4 text-left w-full border-t border-white/10 pt-6 mt-6 select-none">
              <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex-shrink-0 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <p className={`text-[10px] ${resolvedTheme === "light_premium" ? "text-slate-400" : "text-slate-500"}`}>
                  Ce code a été généré pour votre sécurité absolue.
                </p>
                <p className={`text-xs font-bold ${resolvedTheme === "light_premium" ? "text-slate-700" : "text-slate-300"}`}>
                  L'équipe Infrastructure &bull; Sécurité Globale
                </p>
              </div>
            </div>

            {/* Legal footer */}
            <div className="mt-8 pt-4 border-t border-white/5 text-center text-[10px] text-slate-500 space-y-1">
              <p>Ce mail automatique est crypté. PandaDoc Secure Shield 2026.</p>
              <p>&copy; 2026 {companyName || "Pixiatech"} Europe. <a href="#" className="text-indigo-400 hover:text-indigo-300 underline">Contacter le support</a></p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom controls */}
      <div className="flex gap-3 justify-center">
        <button
          type="button"
          onClick={onCopyCode}
          className="px-6 py-3 cursor-pointer select-none font-bold text-xs uppercase tracking-widest rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg hover:shadow-indigo-500/20 active:scale-95 transition-all flex items-center gap-2"
        >
          <Copy className="w-4 h-4" />
          {copied ? "Copié !" : "Tester la Copie Directe"}
        </button>
        <button
          type="button"
          onClick={onRandomizeCode}
          className="px-5 py-3 cursor-pointer select-none font-bold text-xs uppercase tracking-widest rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition-all flex items-center gap-2"
        >
          <Copy className="w-4 h-4 rotate-90" />
          Générer nouveau code
        </button>
      </div>
    </div>
  );
}
