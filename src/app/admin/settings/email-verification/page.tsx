'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSettings, updateSettings } from '@/app/admin/actions';
import type { Settings as AppSettings } from '@/lib/types';
import { EmailConfigurator } from '@/components/verification/EmailConfigurator';
import { EmailTemplatePreview } from '@/components/verification/EmailTemplatePreview';
import type { MessageStyle, PreviewTheme } from '@/components/verification/types';
import { Loader2, Save } from 'lucide-react';

export default function EmailVerificationSettingsPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Local preview state
  const [code, setCode] = useState('523807');
  const [validityMinutes, setValidityMinutes] = useState(10);
  const [messageStyle, setMessageStyle] = useState<MessageStyle>('collaborative_trust');
  const [companyName, setCompanyName] = useState('PIXIATECH');
  const [companySlogan, setCompanySlogan] = useState('TECHNOLOGY PRO');
  const [documentLabel, setDocumentLabel] = useState('estimation du projet Pixiatech');
  const [previewTheme, setPreviewTheme] = useState<PreviewTheme>('auto_adaptive');
  const [autoSimulatedDark, setAutoSimulatedDark] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600);
  const [initialTime, setInitialTime] = useState(600);
  const [isPlaying, setIsPlaying] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const s = await getSettings();
        setSettings(s);
        if (s.emailVerification) {
          setCompanyName(s.emailVerification.companyName || 'PIXIATECH');
          setCompanySlogan(s.emailVerification.companySlogan || 'TECHNOLOGY PRO');
          setDocumentLabel(s.emailVerification.documentLabel || 'estimation du projet Pixiatech');
          setMessageStyle((s.emailVerification.messageStyle as MessageStyle) || 'collaborative_trust');
          setValidityMinutes(s.emailVerification.validityMinutes || 10);
        }
      } catch (err) {
        console.error('Failed to load settings', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  // Sync timeLeft when validityMinutes changes
  useEffect(() => {
    const secs = validityMinutes * 60;
    setInitialTime(secs);
    setTimeLeft(secs);
    setIsPlaying(true);
  }, [validityMinutes]);

  // Timer countdown
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isPlaying && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsPlaying(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isPlaying, timeLeft]);

  // OS dark mode detection for auto_adaptive
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    setAutoSimulatedDark(mq.matches);
    const handler = (e: MediaQueryListEvent) => setAutoSimulatedDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const handleCopyCode = useCallback(() => {
    if (timeLeft === 0) return;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(code).then(processCopySuccess).catch(() => fallbackCopy(code));
    } else {
      fallbackCopy(code);
    }
  }, [code, timeLeft]);

  const processCopySuccess = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const fallbackCopy = (text: string) => {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try { document.execCommand('copy') && processCopySuccess(); } catch {}
    document.body.removeChild(ta);
  };

  const handleRandomizeCode = () => {
    const digits = Math.floor(100000 + Math.random() * 900000).toString();
    setCode(digits);
    setTimeLeft(initialTime);
    setIsPlaying(true);
    setCopied(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings({
        ...settings,
        emailVerification: {
          companyName,
          companySlogan,
          documentLabel,
          messageStyle,
          validityMinutes,
          previewTheme,
        },
      });
    } catch (err) {
      console.error('Save failed', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 text-slate-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black text-slate-900 tracking-tight">Email Verification (PIXIA-VERIFY 2026)</h3>
          <p className="text-sm font-medium text-slate-500">Configurez le module de vérification par e-mail sécurisé.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-2 shadow-lg cursor-pointer disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        {/* Configurator */}
        <div className="lg:col-span-2">
          <EmailConfigurator
            code={code}
            onCodeChange={setCode}
            validityMinutes={validityMinutes}
            onValidityChange={(m) => { setValidityMinutes(m); setInitialTime(m * 60); setTimeLeft(m * 60); setIsPlaying(true); }}
            messageStyle={messageStyle}
            onMessageStyleChange={setMessageStyle}
            companyName={companyName}
            onCompanyNameChange={setCompanyName}
            companySlogan={companySlogan}
            onCompanySloganChange={setCompanySlogan}
            documentLabel={documentLabel}
            onDocumentLabelChange={setDocumentLabel}
            previewTheme={previewTheme}
            onPreviewThemeChange={setPreviewTheme}
            autoSimulatedDark={autoSimulatedDark}
            onAutoSimulatedDarkChange={setAutoSimulatedDark}
            timeLeft={timeLeft}
            onRandomizeCode={handleRandomizeCode}
            onResetTimer={() => { setTimeLeft(initialTime); setIsPlaying(true); }}
            onTogglePause={() => setIsPlaying(p => !p)}
            isPlaying={isPlaying}
          />
        </div>

        {/* Preview */}
        <div className="lg:col-span-3">
          <EmailTemplatePreview
            code={code}
            timeLeft={timeLeft}
            previewTheme={previewTheme}
            autoSimulatedDark={autoSimulatedDark}
            messageStyle={messageStyle}
            companyName={companyName}
            companySlogan={companySlogan}
            documentLabel={documentLabel}
            onCopyCode={handleCopyCode}
            onRandomizeCode={handleRandomizeCode}
            copied={copied}
          />
        </div>
      </div>
    </div>
  );
}
