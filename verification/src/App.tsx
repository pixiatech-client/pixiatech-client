import React, { useState, useEffect, useMemo } from "react";
import { 
  Check, 
  Copy, 
  Timer, 
  RefreshCw, 
  ShieldCheck, 
  LockKeyhole, 
  Info, 
  Sparkles, 
  Sliders, 
  CheckCircle2, 
  MousePointerClick, 
  Volume2, 
  VolumeX, 
  Layers, 
  Eye,
  Inbox,
  Lock,
  Users,
  Code
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Types
type MessageStyle = "ultra_secure_2026" | "collaborative_trust" | "classic_refinement";
type PreviewTheme = "glass_frosted" | "light_premium" | "dark_luxury" | "auto_adaptive";

interface LogAction {
  id: string;
  time: string;
  text: string;
  type: "success" | "info" | "warning";
}

export default function App() {
  // App states
  const [currentCode, setCurrentCode] = useState<string>("523807");
  const [timeLeft, setTimeLeft] = useState<number>(600); // 10 minutes = 600s
  const [initialTime, setInitialTime] = useState<number>(600);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [logoText, setLogoText] = useState<string>("PIXIATECH");
  const [logoSubtitle, setLogoSubtitle] = useState<string>("TECHNOLOGY PRO");
  const [messageStyle, setMessageStyle] = useState<MessageStyle>("collaborative_trust");
  const [previewTheme, setPreviewTheme] = useState<PreviewTheme>("auto_adaptive");
  const [autoSimulatedDark, setAutoSimulatedDark] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [logs, setLogs] = useState<LogAction[]>([
    { id: "1", time: "14:19:53", text: "Simulateur initialisé en Détection Automatique de Thème.", type: "info" },
    { id: "2", time: "14:20:00", text: "Thème dynamique : s'adapte aux préférences (Sombre/Clair) du client de messagerie.", type: "info" },
  ]);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [estimationValue, setEstimationValue] = useState<string>("estimation du projet Pixiatech");

  // Format Helper for Logs
  const addLog = (text: string, type: "success" | "info" | "warning" = "info") => {
    const now = new Date();
    const formattedTime = now.toLocaleTimeString("fr-FR", { hour12: false });
    const newLog: LogAction = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Math.random()),
      time: formattedTime,
      text,
      type
    };
    setLogs(prev => [newLog, ...prev].slice(0, 10)); // keep last 10 logs
  };

  // System Preferred Dark Mode Sync
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setAutoSimulatedDark(mediaQuery.matches);
    
    const handler = (e: MediaQueryListEvent) => {
      setAutoSimulatedDark(e.matches);
      addLog(`Détecteur Client Mail : environnement système passé au mode ${e.matches ? "sombre" : "clair"}.`, "info");
    };
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  const resolvedTheme = previewTheme === "auto_adaptive"
    ? (autoSimulatedDark ? "dark_luxury" : "light_premium")
    : previewTheme;

  // Timer Countdown Effect
  useEffect(() => {
    let interval: any = null;
    if (isPlaying && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsPlaying(false);
            addLog("Sécurité : Le code de validation a expiré.", "warning");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, timeLeft]);

  // Format seconds to MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Function to randomize code
  const handleRandomizeCode = () => {
    const digits = Math.floor(100000 + Math.random() * 900000).toString();
    setCurrentCode(digits);
    setTimeLeft(initialTime);
    setIsPlaying(true);
    setCopied(false);
    
    // Play subtle audio synthetic note if supported & enabled
    if (soundEnabled) {
      playBeep(440, "sine", 0.08);
      setTimeout(() => playBeep(880, "sine", 0.12), 100);
    }

    addLog(`Nouveau code de validation généré : ${digits}`, "success");
  };

  // Trigger copy action
  const handleCopyCode = () => {
    if (timeLeft === 0) {
      addLog("Erreur : Impossible de copier un code expiré !", "warning");
      return;
    }

    // Modern browser clipboard writing
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(currentCode)
        .then(() => {
          processCopySuccess();
        })
        .catch(() => {
          fallbackCopyText(currentCode);
        });
    } else {
      fallbackCopyText(currentCode);
    }
  };

  const processCopySuccess = () => {
    setCopied(true);
    addLog(`Code de validation (${currentCode}) copié directement dans le presse-papier !`, "success");
    
    if (soundEnabled) {
      playBeep(587.33, "triangle", 0.08); // D5
      setTimeout(() => playBeep(880, "sine", 0.15), 60); // A5
    }

    // Reset copy state after 2.5s
    setTimeout(() => {
      setCopied(false);
    }, 2500);
  };

  const fallbackCopyText = (text: string) => {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed"; 
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    try {
      const successful = document.execCommand("copy");
      if (successful) {
        processCopySuccess();
      } else {
        addLog("Impossible de copier automatiquement le code.", "warning");
      }
    } catch (err) {
      addLog("Erreur de compatibilité lors de la copie.", "warning");
    }
    document.body.removeChild(textarea);
  };

  // Simple Web Audio API Synthesizer beep
  const playBeep = (freq: number, type: OscillatorType, duration: number) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      // Ignored
    }
  };

  // Handle Preset Reset time
  const handleSetTimePreset = (minutes: number) => {
    const secs = minutes * 60;
    setInitialTime(secs);
    setTimeLeft(secs);
    setIsPlaying(true);
    addLog(`Temps d'expiration configuré sur ${minutes} minutes.`, "info");
  };

  // Tab state for right panel
  const [rightTab, setRightTab] = useState<"preview" | "html">("preview");
  const [htmlCopied, setHtmlCopied] = useState(false);

  // Generate email-safe HTML for the "Gabarit HTML" tab
  const generateEmailHtml = useMemo(() => {
    const securityTitle = messageStyle === "collaborative_trust" ? "ENGAGEMENT COLLABORATIF" : messageStyle === "ultra_secure_2026" ? "SIGNATURE ÉLECTRONIQUE" : "POINT DE CONTRÔLE";

    return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <style type="text/css">
    body { margin: 0; padding: 0; min-width: 100%; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important; background-color: #f4f6fa; }
    table, td { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { border: 0; height: auto; outline: none; text-decoration: none; }
    @media only screen and (max-width: 480px) {
      .container-table { width: 100% !important; max-width: 480px !important; }
      .code-display { font-size: 26px !important; padding: 10px 18px !important; letter-spacing: 3px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; width: 100%; background-color: #f4f6fa; font-family: Arial, sans-serif;">
  <table width="100%" bgcolor="#f4f6fa" cellpadding="0" cellspacing="0" border="0" style="table-layout: fixed; background-color: #f4f6fa; padding: 40px 10px;">
    <tr>
      <td align="center">
        <table class="container-table" width="480" cellpadding="0" cellspacing="0" border="0" style="width: 480px; max-width: 480px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 24px; padding: 35px 25px; text-align: center;">

          <tr>
            <td align="center" style="padding-bottom: 25px;">
              <table bgcolor="#0a0f1b" align="center" cellpadding="0" cellspacing="0" border="0" style="background-color: #0a0f1b; border-radius: 14px; padding: 12px 24px; margin: 0 auto; text-align: left;">
                <tr>
                  <td style="padding-right: 12px; vertical-align: middle;">
                    <table cellpadding="0" cellspacing="0" border="0" bgcolor="#0d1222" style="background-color: #0d1222; border: 1px solid #4f46e5; border-radius: 50%; width: 28px; height: 28px; text-align: center;">
                      <tr>
                        <td align="center" valign="middle" style="color: #ffffff; font-size: 8px; font-weight: bold; font-family: sans-serif; line-height: 1.2; padding: 0;">
                          PIXIA<br/><span style="color: #6366f1; font-size: 5px;">TECH</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td style="vertical-align: middle; padding: 0;">
                    <span style="font-size: 13px; font-weight: 900; color: #ffffff; letter-spacing: 2px; font-family: sans-serif; line-height: 1.1; display: block; margin: 0;">${logoText || "PIXIATECH"}</span>
                    <span style="font-size: 6px; font-weight: bold; color: #6366f1; font-family: monospace; letter-spacing: 2px; text-transform: uppercase; margin-top: 1px; line-height: 1; display: block; margin: 0;">${logoSubtitle || "TECHNOLOGY PRO"}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding-bottom: 20px;">
              <h2 style="font-size: 18px; font-weight: 800; color: #0f172a; letter-spacing: 3px; text-transform: uppercase; margin: 0 0 10px 0; font-family: Arial, sans-serif;">CODE DE VALIDATION</h2>
              <p style="font-size: 11.5px; color: #475569; line-height: 1.6; max-width: 380px; margin: 0 auto; font-family: Arial, sans-serif;">
                Pour finaliser et signer de fa\u00e7on s\u00e9curis\u00e9e votre <span style="font-weight: bold; color: #4f46e5;">${estimationValue || "estimation du projet"}</span>, veuillez copier ou noter le code num\u00e9rique temporaire ci-dessous et le saisir dans la zone de validation de l'application.
              </p>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding-bottom: 25px;">
              <table bgcolor="#f8fafc" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 20px; padding: 24px; text-align: center;">
                <tr>
                  <td align="center" style="padding-bottom: 8px; font-family: sans-serif; font-size: 10px; font-weight: bold; color: #64748b; letter-spacing: 2px; text-transform: uppercase;">
                    VOTRE CODE UNIQUE DE S\u00c9CURIT\u00c9
                  </td>
                </tr>

                <tr>
                  <td align="center" style="padding: 12px 0;">
                    <span class="code-display" style="font-family: Courier, monospace; font-size: 32px; font-weight: bold; color: #0f172a; letter-spacing: 4px; background-color: #ffffff; border: 1.5px dashed #cbd5e1; border-radius: 12px; padding: 10px 24px; display: inline-block; text-align: center; mso-line-height-rule: exactly;">${currentCode}</span>
                  </td>
                </tr>

                <tr>
                  <td align="center" style="padding-top: 10px; font-family: Arial, sans-serif; font-size: 11px; color: #ef4444; line-height: 1.5; font-weight: bold;">
                    ⚠️ Ce code est valide pour une dur\u00e9e stricte de 10 minutes.<br/>
                    <span style="font-weight: normal; color: #64748b;">Apr\u00e8s ce d\u00e9lai, la transaction sera annul\u00e9e et vous devrez g\u00e9n\u00e9rer un nouveau code.</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td align="left" style="padding-bottom: 25px;">
              <table bgcolor="#f8fafc" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc; border: 1px solid #f1f5f9; border-radius: 14px; padding: 16px; width: 100%;">
                <tr>
                  <td align="left" style="font-size: 10px; font-family: monospace; font-weight: bold; color: #4f46e5; text-transform: uppercase; padding-bottom: 6px; letter-spacing: 0.5px;">
                    🛡️ ${securityTitle}
                  </td>
                </tr>
                <tr>
                  <td align="left" style="font-size: 11px; color: #334155; line-height: 1.6; text-align: left; font-family: Arial, sans-serif; margin: 0;">
                    ${getSecurityMessage()?.body}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td align="left" style="border-top: 1px solid #f1f5f9; padding-top: 18px;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td width="32" style="vertical-align: middle; padding-right: 12px;">
                    <table cellpadding="0" cellspacing="0" border="0" bgcolor="#e0e7ff" style="background-color: #e0e7ff; border-radius: 50%; width: 28px; height: 28px; text-align: center;">
                      <tr>
                        <td align="center" valign="middle" style="color: #4f46e5; font-size: 13px; font-weight: bold; font-family: Arial, sans-serif; padding: 0;">✓</td>
                      </tr>
                    </table>
                  </td>
                  <td align="left" style="vertical-align: middle; padding: 0;">
                    <div style="font-size: 9px; color: #64748b; line-height: 1.2; font-family: Arial, sans-serif; margin: 0;">Ce code a \u00e9t\u00e9 g\u00e9n\u00e9r\u00e9 pour votre s\u00e9curit\u00e9 absolue.</div>
                    <div style="font-size: 11px; font-weight: bold; color: #1e293b; margin-top: 2px; font-family: Arial, sans-serif; margin: 0;">L'\u00e9quipe Infrastructure \u2014 S\u00e9curit\u00e9 Globale</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td align="center" style="border-top: 1px solid #f1f5f9; padding-top: 18px; margin-top: 18px; font-size: 9.5px; color: #94a3b8; line-height: 1.6; font-family: Arial, sans-serif;">
              Ce mail automatique est crypt\u00e9. PandaDoc Secure Shield 2026.<br />
              &copy; 2026 ${logoText || "Pixiatech"} Europe. <a href="https://votre-app.com/support" target="_blank" style="color: #4f46e5; text-decoration: underline;">Contacter le support</a>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }, [currentCode, messageStyle, logoText, logoSubtitle, estimationValue]);

  // Get active text and styling guidelines for the security block matching 2026 UX
  const getSecurityMessage = () => {
    switch (messageStyle) {
      case "collaborative_trust":
        return {
          title: "SÉCURITÉ ET CO-RESPONSABILITÉ",
          badge: "Engagement collaboratif",
          body: "La protection absolue de vos données et de votre estimation implique autant nos conseillers que votre propre vigilance. Conformément à nos protocoles, aucun membre ni collaborateur de l'entreprise n’est autorisé à vous solliciter pour obtenir ce code. Il reste strictement crypté à votre unique usage.",
          icon: Users,
          colorClass: "bg-white/[0.03] border-indigo-500/20 text-indigo-200",
          accentColor: "text-indigo-400"
        };
      case "ultra_secure_2026":
        return {
          title: "POLITIQUE DE CONFIDENTIALITÉ ABSOLUE",
          badge: "Signature Électronique",
          body: "Ce code secret sert de certificat numérique pour signer votre document. Pour prévenir toute usurpation d'identité, veillez à ne jamais le divulguer. Aucun collaborateur de Pixiatech n'est habilité à vous le demander, que ce soit par appel, SMS ou e-mail.",
          icon: ShieldCheck,
          colorClass: "bg-white/[0.03] border-blue-500/20 text-blue-200",
          accentColor: "text-blue-400"
        };
      case "classic_refinement":
        return {
          title: "VOTRE SÉCURITÉ EN LIGNE",
          badge: "Point de contrôle",
          body: "Ce code de validation temporaire est strictement privé. Il sert à de la vérification de conformité immédiate. Les règles de gouvernance de notre réseau interdisent formellement son partage avec tout tiers ou conseiller.",
          icon: LockKeyhole,
          colorClass: "bg-white/[0.03] border-slate-500/20 text-slate-300",
          accentColor: "text-slate-400"
        };
    }
  };

  const securityContent = getSecurityMessage();

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-slate-200 font-sans selection:bg-indigo-500/30 selection:text-indigo-100 relative overflow-x-hidden">
      
      {/* Decorative background glows from the Frosted Glass design template */}
      <div className="absolute w-[600px] h-[600px] bg-indigo-600/15 rounded-full blur-[120px] -top-40 -left-40 pointer-events-none z-0"></div>
      <div className="absolute w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[100px] bottom-0 right-0 pointer-events-none z-0"></div>

      {/* Header Bar branded */}
      <header className="relative border-b border-white/10 bg-[#0a0a0c]/60 backdrop-blur-xl px-6 py-4 z-20">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] tracking-widest text-indigo-400 font-bold uppercase">EXPÉRIENCE CLIENT 2026</span>
                <span className="px-2 py-0.5 text-[9px] bg-white/5 rounded-full font-semibold text-slate-400 border border-white/5">Frosted UI</span>
              </div>
              <h1 className="text-lg font-display font-extrabold text-white tracking-tight">
                Simulateur de Validation <span className="text-indigo-400">Pixiatech</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                addLog(`Sons interactifs ${!soundEnabled ? "activés" : "désactivés"}.`, "info");
              }}
              className={`p-2 rounded-xl border transition-all ${
                soundEnabled 
                  ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-300" 
                  : "bg-white/5 border-white/5 text-slate-500 hover:text-slate-300 hover:border-white/10"
              }`}
              title={soundEnabled ? "Couper le retour sonore" : "Activer le retour sonore"}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            
            <div className="text-xs text-right hidden sm:block">
              <div className="font-mono text-slate-300">Statut de test: Actif</div>
              <span className="text-[10px] text-slate-500">Chiffrement direct &agrave; la copie</span>
            </div>
          </div>

        </div>
      </header>

      {/* Main Workspace Frame */}
      <main className="relative max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-10 z-10">
        <div id="simulator_layout" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT SIDEBAR: CONFIGURATION PANEL */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-400 font-mono text-xs font-semibold uppercase tracking-wider">
                <Sliders className="w-4 h-4" />
                <span>Pupitre de Contrôle</span>
              </div>
              <span className="text-xs bg-indigo-500/10 text-indigo-400 px-2.5 py-1 rounded-full border border-indigo-500/15 font-medium">
                Simulateur Pro
              </span>
            </div>

            {/* Config Card using Frosted style */}
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-[28px] p-6 shadow-xl space-y-6">
              
              {/* Option 1: Validation Code input */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label id="lbl_code_input" className="text-xs font-bold tracking-wide uppercase text-slate-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    Code de Validation (6 chiffres)
                  </label>
                  <button 
                    onClick={handleRandomizeCode}
                    className="text-xs flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition-colors font-medium cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3 animate-spin-slow" />
                    Changer le code
                  </button>
                </div>
                
                <div className="relative">
                  <input
                    type="text"
                    maxLength={6}
                    id="txt_auth_code_input"
                    value={currentCode}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      setCurrentCode(val);
                      if (val.length === 6) {
                        addLog(`Code de validation mis à jour manuellement : ${val}`, "info");
                      }
                    }}
                    placeholder="Ex: 523807"
                    className="w-full tracking-widest font-mono text-xl bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-center text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-semibold"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-mono">
                    {currentCode.length}/6
                  </div>
                </div>
              </div>

              {/* Option 2: Expiry countdown presets & speed control */}
              <div className="space-y-3">
                <label className="text-xs font-bold tracking-wide uppercase text-slate-400 flex items-center gap-1.5">
                  <Timer className="w-3.5 h-3.5 text-indigo-400" />
                  Dur&eacute;e de validit&eacute; du code
                </label>
                
                <div className="grid grid-cols-4 gap-2">
                  {[1, 5, 10, 15].map((mins) => (
                    <button
                      key={mins}
                      onClick={() => handleSetTimePreset(mins)}
                      className={`py-2 text-xs rounded-xl font-mono font-bold border transition-all ${
                        initialTime === mins * 60 
                          ? "bg-white text-black border-white shadow-lg"
                          : "bg-black/30 border-white/5 text-slate-400 hover:border-white/15 hover:text-slate-200"
                      }`}
                    >
                      {mins} Min
                    </button>
                  ))}
                </div>

                <div className="flex gap-2 items-center justify-between bg-black/30 p-3 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    <span className="text-xs font-mono text-slate-400">Rebours Actif :</span>
                    <span className="text-xs font-mono font-bold text-white">{formatTime(timeLeft)}</span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setIsPlaying(!isPlaying);
                        addLog(isPlaying ? "Compte à rebours suspendu." : "Compte à rebours relancé.", "info");
                      }}
                      className="px-2.5 py-1 text-[11px] font-bold bg-white/5 hover:bg-white/10 rounded-lg text-slate-200 transition-all"
                    >
                      {isPlaying ? "Pause" : "Démarrer"}
                    </button>
                    <button
                      onClick={() => {
                        setTimeLeft(initialTime);
                        setIsPlaying(true);
                        addLog("Compte à rebours réinitialisé.", "info");
                      }}
                      className="px-2.5 py-1 text-[11px] font-bold bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 transition-all"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div>

              {/* Option 3: Elegant message words (The request from user) */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold tracking-wide uppercase text-slate-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                    Formulation de s&eacute;curit&eacute;
                  </label>
                  <span className="text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full font-mono font-semibold">
                    Sans Triangle
                  </span>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setMessageStyle("collaborative_trust");
                      addLog("Wording sélectionné : Co-responsabilité collaborateurs & client.", "info");
                    }}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-start gap-3 ${
                      messageStyle === "collaborative_trust"
                        ? "bg-indigo-500/10 border-indigo-500/30 text-slate-100"
                        : "bg-black/20 border-white/5 text-slate-400 hover:border-white/10 hover:text-slate-250"
                    }`}
                  >
                    <div className="mt-0.5">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        messageStyle === "collaborative_trust" ? "border-indigo-400" : "border-white/10"
                      }`}>
                        {messageStyle === "collaborative_trust" && <div className="w-2 h-2 rounded-full bg-indigo-400" />}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-200">Option A : Co-Responsabilité Equipes</div>
                      <div className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                        Mentionne explicitement l'implication de nos collaborateurs et la vigilance partagée.
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setMessageStyle("ultra_secure_2026");
                      addLog("Wording sélectionné : Confidentialité absolue.", "info");
                    }}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-start gap-3 ${
                      messageStyle === "ultra_secure_2026"
                        ? "bg-indigo-500/10 border-indigo-500/30 text-slate-100"
                        : "bg-black/20 border-white/5 text-slate-400 hover:border-white/10 hover:text-slate-250"
                    }`}
                  >
                    <div className="mt-0.5">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        messageStyle === "ultra_secure_2026" ? "border-indigo-400" : "border-white/10"
                      }`}>
                        {messageStyle === "ultra_secure_2026" && <div className="w-2 h-2 rounded-full bg-indigo-400" />}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-200">Option B : Confidentialit&eacute; Absolue</div>
                      <div className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                        Politique de confidentialité stricte. Signature électronique hautement sécurisée.
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setMessageStyle("classic_refinement");
                      addLog("Wording sélectionné : Signature de conformité règlementaire.", "info");
                    }}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-start gap-3 ${
                      messageStyle === "classic_refinement"
                        ? "bg-indigo-500/10 border-indigo-500/30 text-slate-100"
                        : "bg-black/20 border-white/5 text-slate-400 hover:border-white/10 hover:text-slate-250"
                    }`}
                  >
                    <div className="mt-0.5">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        messageStyle === "classic_refinement" ? "border-indigo-400" : "border-white/10"
                      }`}>
                        {messageStyle === "classic_refinement" && <div className="w-2 h-2 rounded-full bg-indigo-400" />}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-200">Option C : Point de Contrôle Standard</div>
                      <div className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                        Gouvernance interne d'organisation et sécurité de base.
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Theme Settings switcher */}
              <div className="space-y-4 pt-4 border-t border-white/5">
                <div className="flex justify-between items-center animate-pulse">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-indigo-400" />
                    Th&egrave;mes du Courriel
                  </label>
                  <span className="text-[9px] text-slate-500">Choisissez le rendu</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: "auto_adaptive", label: "Détecteur Auto ✨" },
                    { key: "glass_frosted", label: "Glassmorphic" },
                    { key: "light_premium", label: "Blanc Épuré" },
                    { key: "dark_luxury", label: "Sombre Luxe" }
                  ].map((t) => (
                    <button
                      key={t.key}
                      onClick={() => {
                        setPreviewTheme(t.key as PreviewTheme);
                        addLog(`Thème de rendu du mail modifié : ${t.label}`, "info");
                      }}
                      className={`py-2 px-1 text-[10px] font-bold rounded-xl border transition-all ${
                        previewTheme === t.key
                          ? "bg-white text-black border-white shadow-md font-extrabold"
                          : "bg-black/20 border-white/5 text-slate-400 hover:border-white/10 hover:text-slate-200"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {previewTheme === "auto_adaptive" && (
                  <div className="bg-white/5 p-3 rounded-2xl border border-white/10 space-y-2 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-indigo-300 font-mono font-bold uppercase">Simulateur de Messagerie</span>
                      <span className="text-[9px] px-1.5 py-0.5 bg-indigo-500/20 text-indigo-300 uppercase rounded font-bold font-mono">Media Query</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-normal">
                      Simule l'effet CSS <code className="text-pink-400 bg-black/30 px-1 py-0.5 rounded">@media (prefers-color-scheme: dark)</code>. Modifiez l'état de l'OS simulé pour tester les rendus.
                    </p>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-slate-300">Thème de l'OS du destinataire :</span>
                      <div className="flex bg-black/20 rounded-lg p-0.5 border border-white/5">
                        <button
                          type="button"
                          onClick={() => {
                            setAutoSimulatedDark(false);
                            addLog("Simulation : Boîte de messagerie passée en mode CLAIR (Blanc Épuré).", "info");
                          }}
                          className={`px-2 py-1 text-[10px] rounded font-bold transition-all ${
                            !autoSimulatedDark ? "bg-white text-black" : "text-slate-400 hover:text-white"
                          }`}
                        >
                          Clair
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAutoSimulatedDark(true);
                            addLog("Simulation : Boîte de messagerie passée en mode SOMBRE (Sombre Luxe).", "info");
                          }}
                          className={`px-2 py-1 text-[10px] rounded font-bold transition-all ${
                            autoSimulatedDark ? "bg-indigo-500 text-white" : "text-slate-400 hover:text-white"
                          }`}
                        >
                          Sombre
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Little details in sidebar: Name editor */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-mono">Entreprise</span>
                    <input
                      type="text"
                      className="w-full bg-black/40 text-xs px-2.5 py-2 rounded-xl border border-white/5 text-white focus:outline-none focus:border-indigo-500"
                      value={logoText}
                      onChange={(e) => setLogoText(e.target.value.toUpperCase())}
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-mono">Slogan Logo</span>
                    <input
                      type="text"
                      className="w-full bg-black/40 text-xs px-2.5 py-2 rounded-xl border border-white/5 text-white focus:outline-none focus:border-indigo-500"
                      value={logoSubtitle}
                      onChange={(e) => setLogoSubtitle(e.target.value.toUpperCase())}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-mono">Objet du Document (&Eacute;l&eacute;ment)</span>
                  <input
                    type="text"
                    className="w-full bg-black/40 text-xs px-2.5 py-2 rounded-xl border border-white/5 text-white focus:outline-none focus:border-indigo-500"
                    value={estimationValue}
                    onChange={(e) => setEstimationValue(e.target.value)}
                  />
                </div>

              </div>

            </div>

            {/* Live simulation logger console */}
            <div className="bg-black/60 border border-white/5 rounded-[22px] p-4 font-mono text-xs">
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider pb-2 border-b border-white/5 mb-2">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
                  Journal d'Actions Client
                </span>
                <button 
                  onClick={() => setLogs([{ id: "1", time: "Maintenant", text: "Journal vidé.", type: "info" }])}
                  className="hover:text-white transition-colors"
                >
                  Effacer
                </button>
              </div>

              <div className="space-y-1.5 max-h-32 overflow-y-auto custom-scrollbar">
                {logs.map((log) => (
                  <div key={log.id} className="flex gap-2 items-start text-[11px] text-slate-300">
                    <span className="text-slate-600">[{log.time}]</span>
                    <span className={
                      log.type === "success" ? "text-emerald-400" :
                      log.type === "warning" ? "text-rose-400" :
                      "text-indigo-300"
                    }>
                      {log.type === "success" && "✓ "}
                      {log.type === "warning" && "🗲 "}
                      {log.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* RIGHT VIEW: PRESTIGE FROSTED GLASS EMAIL PREVIEW VIEWPORT */}
          <div className="lg:col-span-7 space-y-4">

            {/* Tab switcher: Preview vs HTML */}
            <div className="flex items-center gap-2 bg-black/30 border border-white/5 rounded-2xl p-1 w-full">
              <button
                type="button"
                onClick={() => setRightTab("preview")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                  rightTab === "preview"
                    ? "bg-white text-black shadow-lg"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Eye className="w-4 h-4" />
                2. Aperçu
              </button>
              <button
                type="button"
                onClick={() => setRightTab("html")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                  rightTab === "html"
                    ? "bg-white text-black shadow-lg"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Code className="w-4 h-4" />
                3. Gabarit HTML E-mail Safe
              </button>
            </div>

            {rightTab === "preview" && (
            <div className="space-y-4">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="flex items-center gap-1.5 font-mono">
                <Eye className="w-4 h-4 text-indigo-400" />
                <span>Rendu Final du Mail (Sécurité 2026)</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/5 font-mono text-[10px]">600px width responsive</span>
            </div>

            {/* Webmail Shell with clean header */}
            <div className="bg-[#0e0f12] rounded-[32px] border border-white/10 shadow-3xl overflow-hidden relative">
              
              {/* Browser control header bar */}
              <div className="bg-black/50 px-5 py-3.5 border-b border-white/10 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5 mr-2">
                    <span className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                    <span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                    <span className="w-3 h-3 rounded-full bg-[#27c93f]" />
                  </div>
                  <span className="text-[10px] font-mono tracking-widest text-slate-400 font-semibold uppercase">
                    MESSAGERIE INTERNE SECURE
                  </span>
                </div>
                
                <div className="px-2.5 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-[9px] text-indigo-400 font-mono rounded-full font-bold">
                  AES-MD5 ENCRYPTED
                </div>
              </div>

              {/* Envelope properties */}
              <div className="bg-black/30 px-6 py-4 border-b border-white/5 text-xs text-slate-400">
                <div className="mb-1.5 flex justify-between items-center">
                  <span>
                    <strong className="text-slate-500">De : </strong>
                    <span className="text-slate-300 font-semibold">Pixiatech Security &lt;validation@pixiatech.eu&gt;</span>
                  </span>
                  <span className="text-slate-500 font-mono text-[10px] hidden sm:inline">Re&ccedil;u : Aujourd'hui (F&eacute;v 2026)</span>
                </div>
                <div>
                  <strong className="text-slate-500">Objet : </strong>
                  <span className="text-indigo-400 font-medium font-sans">Votre code de validation temporaire Pixiatech</span>
                </div>
              </div>

              {/* EMAIL CONTENT COMPONENT CONTAINER */}
              {/* Dynamically Styled based on resolvedTheme state */}
              <div className={`p-4 sm:p-10 flex items-center justify-center transition-all duration-300 ${
                resolvedTheme === "light_premium" 
                  ? "bg-[#f4f6fa] text-slate-700" 
                  : resolvedTheme === "dark_luxury"
                  ? "bg-[#0b0c0f] text-slate-200"
                  : "bg-gradient-to-br from-[#0c0d14] via-[#090a0f] to-[#040507] text-slate-200"
              }`}>
                
                {/* Simulated Physical Newsletter Frame with Glass theme variables */}
                <div className={`w-full max-w-[500px] mx-auto transition-all duration-300 ${
                  resolvedTheme === "light_premium"
                    ? "bg-white border border-slate-200 shadow-xl rounded-[28px] p-6 sm:p-10"
                    : resolvedTheme === "dark_luxury"
                    ? "bg-[#121318]/90 border border-white/5 shadow-2xl rounded-[32px] p-6 sm:p-10"
                    : "backdrop-blur-2xl bg-white/5 border border-white/10 rounded-[40px] p-6 sm:p-10 shadow-2xl relative"
                }`}>

                  {/* LOGO PIXIATECH (Logo is placed absolutely first at top as user asked) */}
                  <div className="flex justify-center mb-6">
                    <div className="bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center p-[2px] shadow-lg shadow-indigo-500/20 max-w-[280px] w-full">
                      <div className="w-full bg-[#0a0f1b]/95 rounded-[14px] py-3.5 px-6 flex items-center justify-center gap-3">
                        {/* CSS recreated Pixiatech Graphic circular mark */}
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 via-blue-500 to-purple-600 p-[1.5px] relative shrink-0">
                          <div className="w-full h-full rounded-full bg-[#0d1222] flex flex-col items-center justify-center relative overflow-hidden">
                            <span className="text-[8px] font-black tracking-tighter text-white">PIXIA</span>
                            <span className="text-[5.5px] font-bold text-indigo-400 font-mono tracking-widest leading-none -mt-0.5">TECH</span>
                          </div>
                        </div>

                        {/* Right Text Block */}
                        <div className="flex flex-col text-left">
                          <span className="text-sm font-black text-white tracking-widest leading-none font-display">
                            {logoText || "PIXIATECH"}
                          </span>
                          <span className="text-[8px] font-bold text-indigo-400 font-mono tracking-widest uppercase mt-0.5">
                            {logoSubtitle || "TECHNOLOGY PRO"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Header Title block */}
                  <div className="text-center space-y-2 mb-6 select-none">
                    <h2 className={`font-display font-extrabold tracking-widest text-lg uppercase ${
                      resolvedTheme === "light_premium" ? "text-slate-800" : "text-white"
                    }`}>
                      Code de Validation
                    </h2>
                    
                    <p className={`text-xs max-w-sm mx-auto leading-relaxed ${
                      resolvedTheme === "light_premium" ? "text-slate-500" : "text-slate-400"
                    }`}>
                      Pour finaliser et signer de façon sécurisée votre{" "}
                      <span className={`font-bold ${resolvedTheme === "light_premium" ? "text-indigo-600" : "text-indigo-400"}`}>
                        {estimationValue || "estimation du projet"}
                      </span>
                      , veuillez copier le jeton numérique temporaire ci-dessous.
                    </p>
                  </div>

                  {/* INTERACTIVE COMPOSITE FROSTED SESSION CARD */}
                  <div className={`border rounded-[30px] p-6 w-full mb-6 relative group text-center transition-all ${
                    resolvedTheme === "light_premium" 
                      ? "bg-slate-50/80 border-slate-200" 
                      : "bg-[#040406]/55 border-white/5"
                  }`}>
                    
                    {/* Header line inside the validation box */}
                    <div className="flex justify-between items-center mb-5 select-none">
                      <span className={`text-[9px] uppercase tracking-[0.2em] font-bold ${
                        resolvedTheme === "light_premium" ? "text-slate-400" : "text-indigo-400"
                      }`}>
                        Session Temporaire
                      </span>
                      
                      {/* Countdown badge: REAL-TIME SECONDS COUNTER (Always count-down) */}
                      <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${
                        timeLeft === 0
                          ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
                          : timeLeft < 60
                          ? "bg-rose-500/10 border-rose-500/20 text-rose-400 animate-pulse"
                          : resolvedTheme === "light_premium"
                          ? "bg-slate-100 border-slate-200 text-slate-600"
                          : "bg-white/5 border-white/10 text-slate-300"
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${
                          timeLeft === 0 ? "bg-slate-400" : "bg-rose-500"
                        } animate-pulse`} />
                        
                        <span className="text-xs font-mono font-bold">
                          {timeLeft === 0 ? "Expiré !" : formatTime(timeLeft)}
                        </span>
                      </div>
                    </div>

                    {/* DIGITS CONTAINER (Allows direct 1-click clipboard Copy by clicking on the whole box or any digit) */}
                    <div 
                      onClick={handleCopyCode}
                      title="Cliquez pour copier instantanément"
                      className="flex gap-2.5 justify-center mb-6 cursor-pointer transform hover:scale-[1.01] transition-all group/digits relative"
                    >
                      {currentCode.split("").map((digit, index) => (
                        <div 
                          key={index}
                          className={`w-11 h-16 rounded-2xl flex items-center justify-center text-2.5xl font-mono font-extrabold shadow-inner transition-all select-none relative ${
                            timeLeft === 0
                              ? "bg-slate-200/50 text-slate-400 border border-slate-200"
                              : copied
                              ? "bg-emerald-500/10 border-emerald-500 text-emerald-400"
                              : resolvedTheme === "light_premium"
                              ? "bg-white border border-slate-200 text-slate-800 hover:border-indigo-400"
                              : "bg-white/10 border border-white/10 text-white hover:border-indigo-500"
                          }`}
                        >
                          {digit}
                        </div>
                      ))}

                      {currentCode.length === 0 && (
                        <div className="text-slate-400 font-mono italic text-sm py-4">Saisissez un code...</div>
                      )}

                      {/* Micro interaction copy tooltip overlay */}
                      <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 opacity-0 group-hover/digits:opacity-100 transition-opacity bg-black/80 text-white text-[9px] px-2 py-0.5 rounded-md font-medium tracking-wider whitespace-nowrap">
                        1-CLIC DE COPIE DIRECTE
                      </div>
                    </div>

                    {/* CLIC COPY BUTTON DIRECTLY (No selects required, copies text inside clipboard seamlessly) */}
                    <button
                      onClick={handleCopyCode}
                      disabled={timeLeft === 0}
                      className={`w-full py-3.5 font-sans font-black text-xs uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] ${
                        timeLeft === 0
                          ? "bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed"
                          : copied
                          ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                          : resolvedTheme === "light_premium"
                          ? "bg-slate-900 text-white hover:bg-slate-800"
                          : "bg-white text-black hover:bg-slate-250 hover:shadow-xl shadow-white/5"
                      }`}
                    >
                      {copied ? (
                        <>
                          <Check className="w-4.5 h-4.5 text-white" />
                          Code copié dans le presse-papier !
                        </>
                      ) : (
                        <>
                          <Copy className="w-4.5 h-4.5" />
                          Copier le code
                        </>
                      )}
                    </button>
                    
                    {/* Tiny secure copy disclaimer */}
                    <p className={`text-[10px] mt-3.5 leading-relaxed font-sans ${
                      resolvedTheme === "light_premium" ? "text-slate-400" : "text-slate-500"
                    }`}>
                      Pas besoin de sélectionner : cliquez n'importe où sur l'encart ou sur le bouton pour copier instantanément.
                    </p>

                  </div>

                  {/* SECURITY AND RESPONSIBILITY CARD WITHOUT ANNOYING TRIANGLES
                      Premium, clean, fully interactive, and supportive card block (No triangle is requested) */}
                  <div className={`border rounded-2xl p-5 text-left transition-all ${securityContent.colorClass}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <securityContent.icon className={`w-4 h-4 ${securityContent.accentColor}`} />
                      <span className={`text-[10px] tracking-wider uppercase font-mono font-black ${securityContent.accentColor}`}>
                        {securityContent.badge}
                      </span>
                    </div>
                    
                    <p className={`text-[11px] leading-relaxed transition-colors ${
                      resolvedTheme === "light_premium" ? "text-slate-600" : "text-slate-300"
                    }`}>
                      {securityContent.body}
                    </p>
                  </div>

                  {/* Footer with avatar element from the provided glass theme HTML */}
                  <div className="flex items-center gap-4 text-left w-full border-t border-white/10 pt-6 mt-6 select-none">
                    
                    <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex-shrink-0 flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5 text-indigo-400" />
                    </div>

                    <div>
                      <p className={`text-[10px] ${
                        resolvedTheme === "light_premium" ? "text-slate-400" : "text-slate-500"
                      }`}>
                        Ce code a été généré pour votre sécurité absolue.
                      </p>
                      
                      <p className={`text-xs font-bold ${
                        resolvedTheme === "light_premium" ? "text-slate-700" : "text-slate-300"
                      }`}>
                        L&apos;&eacute;quipe Infrastructure &bull; S&eacute;curit&eacute; Globale
                      </p>
                    </div>

                  </div>

                  {/* Standard legal e-mail footer content */}
                  <div className="mt-8 pt-4 border-t border-white/5 text-center text-[10px] text-slate-500 space-y-1">
                    <p>Ce mail automatique est crypt&eacute;. PandaDoc Secure Shield 2026.</p>
                    <p>
                      &copy; 2026 {logoText || "Pixiatech"} Europe.{" "}
                      <a 
                        href="#support" 
                        onClick={(e) => {
                          e.preventDefault();
                          addLog("Demande d'aide support (Simulation)", "info");
                        }}
                        className="text-indigo-400 hover:text-indigo-300 underline"
                      >
                        Contacter le support
                      </a>
                    </p>
                  </div>

                </div>

              </div>

            </div>

            {/* Bottom auxiliary trigger buttons for the previewer */}
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleCopyCode}
                className="px-6 py-3 cursor-pointer select-none font-bold text-xs uppercase tracking-widest rounded-xl bg-gradient-to-r from-indigo-550 to-purple-550 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg hover:shadow-indigo-500/20 active:scale-95 transition-all flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                {copied ? "Copié !" : "Tester la Copie Directe"}
              </button>

              <button
                onClick={handleRandomizeCode}
                className="px-5 py-3 cursor-pointer select-none font-bold text-xs uppercase tracking-widest rounded-xl bg-black/40 hover:bg-black/30 border border-white/10 text-slate-300 hover:text-white transition-all flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4 animate-spin-slow" />
                G&eacute;n&eacute;rer nouveau code
              </button>
            </div>

            </div>
            )}

            {rightTab === "html" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span className="flex items-center gap-1.5 font-mono">
                    <Code className="w-4 h-4 text-indigo-400" />
                    <span>Gabarit HTML E-mail Safe</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/5 font-mono text-[10px]">
                    {generateEmailHtml.length.toLocaleString()} chars
                  </span>
                </div>

                <div className="bg-[#0e0f12] rounded-[32px] border border-white/10 overflow-hidden">
                  <div className="bg-black/50 px-5 py-3.5 border-b border-white/10 flex items-center justify-between">
                    <span className="flex items-center gap-2 text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      HTML généré — prêt pour envoi SMTP
                    </span>
                    <span className="text-[9px] text-slate-500 font-mono">
                      {generateEmailHtml.length.toLocaleString()} caractères
                    </span>
                  </div>
                  <textarea
                    readOnly
                    value={generateEmailHtml}
                    className="w-full h-[500px] font-mono text-[11px] leading-relaxed p-5 bg-[#0a0a0c] text-emerald-300 border-0 resize-none focus:outline-none selection:bg-indigo-500/30"
                    onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                  />
                </div>

                <div className="flex gap-3 justify-center">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        if (navigator.clipboard?.writeText) {
                          await navigator.clipboard.writeText(generateEmailHtml);
                        } else {
                          const ta = document.createElement("textarea");
                          ta.value = generateEmailHtml;
                          ta.style.position = "fixed";
                          document.body.appendChild(ta);
                          ta.focus();
                          ta.select();
                          document.execCommand("copy");
                          document.body.removeChild(ta);
                        }
                        setHtmlCopied(true);
                        setTimeout(() => setHtmlCopied(false), 2500);
                        addLog("Code HTML copié dans le presse-papier !", "success");
                      } catch {}
                    }}
                    className="px-6 py-3 cursor-pointer select-none font-bold text-xs uppercase tracking-widest rounded-xl bg-gradient-to-r from-indigo-550 to-purple-550 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg hover:shadow-indigo-500/20 active:scale-95 transition-all flex items-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    {htmlCopied ? "HTML Copié !" : "Copier le code HTML"}
                  </button>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-xs text-amber-300/90 leading-relaxed">
                  <strong className="font-black uppercase tracking-wide">💡 Intégration SMTP :</strong> Ce HTML est généré en temps réel avec les variables de la colonne de configuration.
                  Copiez-le et injectez-le dans votre corps d&apos;email via Nodemailer, SendGrid, Mailgun, ou tout serveur SMTP.
                </div>
              </div>
            )}

          </div>

        </div>
      </main>

      {/* Embedded CSS Scrollbar and other styling tweaks */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.1);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.2);
        }
        .animate-spin-slow {
          animation: spin 8s linear infinite;
        }
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>

    </div>
  );
}
