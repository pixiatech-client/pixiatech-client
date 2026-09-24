'use client';
import React, { useState, useEffect } from 'react';
import { 
  X, Sliders, Mail, Inbox, Building2, Check, AlertCircle, 
  Loader2, Trash2, Eye, EyeOff, Send, RefreshCw, CheckCircle2, ShieldCheck, HelpCircle, Edit3 
} from 'lucide-react';
import type { SmtpConfig, ContactInfo, ContactMessage } from '@/lib/site-web/types';

interface SmtpSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshParent: () => void;
  onOpenVisualEditor?: () => void;
}

const SMTP_PRESETS = [
  { name: 'PixiaTech Mail (Port 465 SSL)', host: 'mail.pixiatech.com', port: 465, secure: true, user: 'contact@pixiatech.com' },
  { name: 'PixiaTech LWS Panel (mail89.lwspanel.com)', host: 'mail89.lwspanel.com', port: 465, secure: true, user: 'contact@pixiatech.com' },
  { name: 'PixiaTech Port 587 (STARTTLS)', host: 'mail.pixiatech.com', port: 587, secure: false, user: 'contact@pixiatech.com' },
  { name: 'Gmail', host: 'smtp.gmail.com', port: 587, secure: false, user: '' },
  { name: 'Microsoft 365', host: 'smtp.office365.com', port: 587, secure: false, user: '' },
  { name: 'OVH Telecom', host: 'ssl0.ovh.net', port: 587, secure: false, user: '' },
];

export const SmtpSettingsModal: React.FC<SmtpSettingsModalProps> = ({
  isOpen,
  onClose,
  onRefreshParent,
  onOpenVisualEditor,
}) => {
  const [activeTab, setActiveTab] = useState<'smtp' | 'inbox' | 'info'>('smtp');

  // SMTP form state
  const [smtpForm, setSmtpForm] = useState<SmtpConfig>({
    host: 'mail.pixiatech.com',
    port: 465,
    secure: true,
    user: 'contact@pixiatech.com',
    pass: 'fF5@gBQBmfH2$P_',
    fromEmail: 'PIXIATECH <contact@pixiatech.com>',
    recipientEmail: 'contact@pixiatech.com',
    enabled: true,
  });
  const [hasStoredPassword, setHasStoredPassword] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [testRecipient, setTestRecipient] = useState('');
  const [isTestingSmtp, setIsTestingSmtp] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isSavingSmtp, setIsSavingSmtp] = useState(false);
  const [saveSmtpSuccess, setSaveSmtpSuccess] = useState(false);

  // Messages Inbox state
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'unread' | 'read'>('all');

  // Contact Info state
  const [contactInfoForm, setContactInfoForm] = useState<ContactInfo | null>(null);
  const [isSavingInfo, setIsSavingInfo] = useState(false);
  const [saveInfoSuccess, setSaveInfoSuccess] = useState(false);

  // Load backend data when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchSmtpSettings();
      fetchMessages();
      fetchContactInfo();
    }
  }, [isOpen]);

  const fetchSmtpSettings = async () => {
    try {
      const res = await fetch('/api/site-web/contact/settings');
      const json = await res.json();
      if (json.success && json.data) {
        setSmtpForm(prev => ({
          ...prev,
          host: json.data.host || 'mail.pixiatech.com',
          port: json.data.port || 465,
          secure: json.data.secure !== undefined ? Boolean(json.data.secure) : true,
          user: json.data.user || 'contact@pixiatech.com',
          pass: json.data.pass || prev.pass || 'fF5@gBQBmfH2$P_',
          fromEmail: json.data.fromEmail || 'PIXIATECH <contact@pixiatech.com>',
          recipientEmail: json.data.recipientEmail || 'contact@pixiatech.com',
          enabled: json.data.enabled !== undefined ? Boolean(json.data.enabled) : true,
        }));
        setHasStoredPassword(Boolean(json.data.hasPassword || json.data.pass));
      }
    } catch (err) {
      console.error('Failed to fetch SMTP settings:', err);
    }
  };

  const fetchMessages = async () => {
    setIsLoadingMessages(true);
    try {
      const res = await fetch('/api/site-web/contact/messages');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setMessages(json.data);
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const fetchContactInfo = async () => {
    try {
      const res = await fetch('/api/site-web/contact/info');
      const json = await res.json();
      if (json.success && json.data) {
        setContactInfoForm(json.data);
      }
    } catch (err) {
      console.error('Failed to load contact info:', err);
    }
  };

  const handleApplyPreset = (preset: typeof SMTP_PRESETS[0]) => {
    setSmtpForm(prev => ({
      ...prev,
      host: preset.host,
      port: preset.port,
      secure: preset.secure,
      user: preset.user || prev.user,
    }));
  };

  const handleSaveSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSmtp(true);
    setSaveSmtpSuccess(false);
    setTestResult(null);

    try {
      const res = await fetch('/api/site-web/contact/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(smtpForm),
      });
      const json = await res.json();
      if (json.success) {
        setSaveSmtpSuccess(true);
        setHasStoredPassword(Boolean(smtpForm.pass || hasStoredPassword));
        setTimeout(() => setSaveSmtpSuccess(false), 3000);
        onRefreshParent();
      }
    } catch (err) {
      console.error('Error saving SMTP settings:', err);
    } finally {
      setIsSavingSmtp(false);
    }
  };

  const handleTestSmtp = async () => {
    setIsTestingSmtp(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/site-web/contact/test-smtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testRecipient: testRecipient.trim() || smtpForm.recipientEmail,
          customConfig: smtpForm,
        }),
      });
      const json = await res.json();
      setTestResult({
        success: json.success,
        message: json.message || (json.success ? 'Connexion SMTP réussie !' : 'Échec du test SMTP.'),
      });
    } catch (err: unknown) {
      setTestResult({
        success: false,
        message: `Erreur : ${(err as Error).message}`,
      });
    } finally {
      setIsTestingSmtp(false);
    }
  };

  const handleMessageStatus = async (id: string, status: ContactMessage['status']) => {
    try {
      const res = await fetch(`/api/site-web/contact/messages/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (json.success) {
        setMessages(prev => prev.map(m => (m.id === id ? { ...m, status } : m)));
        if (selectedMessage?.id === id) {
          setSelectedMessage(prev => (prev ? { ...prev, status } : null));
        }
        onRefreshParent();
      }
    } catch (err) {
      console.error('Failed to update message status:', err);
    }
  };

  const handleDeleteMessage = async (id: string) => {
    if (!confirm('Supprimer définitivement ce message de la boîte de réception ?')) return;

    try {
      const res = await fetch(`/api/site-web/contact/messages/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setMessages(prev => prev.filter(m => m.id !== id));
        if (selectedMessage?.id === id) {
          setSelectedMessage(null);
        }
        onRefreshParent();
      }
    } catch (err) {
      console.error('Failed to delete message:', err);
    }
  };

  const handleSaveContactInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactInfoForm) return;

    setIsSavingInfo(true);
    setSaveInfoSuccess(false);

    try {
      const res = await fetch('/api/site-web/contact/info', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactInfoForm),
      });
      const json = await res.json();
      if (json.success) {
        setSaveInfoSuccess(true);
        setTimeout(() => setSaveInfoSuccess(false), 3000);
        onRefreshParent();
      }
    } catch (err) {
      console.error('Failed to save contact info:', err);
    } finally {
      setIsSavingInfo(false);
    }
  };

  if (!isOpen) return null;

  const filteredMessages = messages.filter(m => {
    if (filterStatus === 'unread') return m.status === 'unread';
    if (filterStatus === 'read') return m.status !== 'unread';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="relative flex h-[90vh] w-full max-w-5xl flex-col rounded-xl border border-white/15 bg-[#0d1017] shadow-2xl text-slate-100 overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 bg-[#11141d]">
          <div className="flex items-center space-x-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-400">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-tech text-base font-bold uppercase tracking-wider text-white">
                  Console Backend & Paramètres Contact
                </h2>
                <span className="rounded bg-cyan-500/20 px-2 py-0.5 font-mono text-[10px] text-cyan-300">
                  NODE.JS EXPRESS
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Gérez vos passerelles SMTP, coordonnées et messages entrants en temps réel
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
            title="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-white/10 bg-[#0a0c12] px-6">
          <button
            onClick={() => setActiveTab('smtp')}
            className={`flex items-center space-x-2 border-b-2 py-3.5 px-4 font-mono text-xs font-semibold uppercase tracking-wider transition-colors ${
              activeTab === 'smtp'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Mail className="h-4 w-4" />
            <span>Passerelle SMTP & Envoi</span>
          </button>

          <button
            onClick={() => setActiveTab('inbox')}
            className={`flex items-center space-x-2 border-b-2 py-3.5 px-4 font-mono text-xs font-semibold uppercase tracking-wider transition-colors ${
              activeTab === 'inbox'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Inbox className="h-4 w-4" />
            <span>Boîte de réception ({messages.length})</span>
            {messages.filter(m => m.status === 'unread').length > 0 && (
              <span className="rounded-full bg-cyan-500 px-1.5 py-0.2 font-mono text-[9px] font-bold text-slate-950">
                {messages.filter(m => m.status === 'unread').length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('info')}
            className={`flex items-center space-x-2 border-b-2 py-3.5 px-4 font-mono text-xs font-semibold uppercase tracking-wider transition-colors ${
              activeTab === 'info'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Building2 className="h-4 w-4" />
            <span>Coordonnées Publiques</span>
          </button>

          {onOpenVisualEditor && (
            <button
              type="button"
              onClick={() => {
                onOpenVisualEditor();
                onClose();
              }}
              className="ml-auto my-auto flex items-center space-x-1.5 bg-[#c6ff00] text-black font-bold py-1.5 px-3.5 rounded-lg text-xs hover:bg-[#b5eb00] transition-colors shadow-sm"
              title="Passer en mode édition directe sur la page publique"
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>Ouvrir l'Éditeur Visuel (Clic & Switch)</span>
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* TAB 1: SMTP SETTINGS */}
          {activeTab === 'smtp' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              {/* Notification Banner with Exact Screenshot Details */}
              <div className="rounded-xl border border-blue-500/30 bg-blue-950/20 p-5 text-xs text-slate-300">
                <div className="flex items-start space-x-3">
                  <ShieldCheck className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
                  <div className="w-full">
                    <span className="font-bold text-white text-sm">Paramètres de configuration mail PIXIATECH (LWS Panel) :</span>
                    <p className="mt-1 leading-relaxed text-slate-300">
                      Vos paramètres SSL/TLS recommandés détectés depuis votre interface de messagerie :
                    </p>

                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[11px] bg-black/60 rounded-lg p-3 border border-white/10">
                      <div>
                        <span className="text-slate-400">Nom d’utilisateur :</span>{' '}
                        <span className="text-[#c6ff00] font-bold">contact@pixiatech.com</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Serveur sortant (SMTP) :</span>{' '}
                        <span className="text-white font-bold">mail.pixiatech.com</span> ou <span className="text-slate-300">mail89.lwspanel.com</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Port SMTP sécurisé :</span>{' '}
                        <span className="text-emerald-400 font-bold">465 (SSL)</span> ou <span className="text-slate-300">587 (STARTTLS)</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Authentification :</span>{' '}
                        <span className="text-white">Requise (Mot de passe du compte)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Presets Bar */}
              <div>
                <span className="font-mono text-xs text-slate-400">Pré-configurations rapides en un clic :</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {SMTP_PRESETS.map(preset => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className="rounded border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[11px] text-slate-300 transition-colors hover:border-cyan-500/40 hover:bg-cyan-500/10 hover:text-cyan-300"
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSaveSmtp} className="space-y-4">
                {/* Active Checkbox */}
                <div className="flex items-center space-x-3 rounded-lg border border-white/10 bg-[#121620] p-4">
                  <input
                    id="smtp-enabled"
                    type="checkbox"
                    checked={smtpForm.enabled}
                    onChange={e => setSmtpForm(prev => ({ ...prev, enabled: e.target.checked }))}
                    className="h-4 w-4 rounded border-white/20 bg-[#141821] text-cyan-500 focus:ring-cyan-400"
                  />
                  <label htmlFor="smtp-enabled" className="text-xs font-semibold text-white cursor-pointer">
                    Activer l'envoi SMTP en direct des formulaires reçus
                  </label>
                  <span className="font-mono text-[11px] text-slate-400">
                    (Si désactivé, les messages restent consultables dans l'onglet Boîte de réception)
                  </span>
                </div>

                {/* Host & Port */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="sm:col-span-2">
                    <label className="block font-mono text-xs uppercase tracking-wider text-slate-400">
                      Hôte SMTP (Serveur)
                    </label>
                    <input
                      type="text"
                      placeholder="smtp.gmail.com ou mail.mondomaine.com"
                      value={smtpForm.host}
                      onChange={e => setSmtpForm(prev => ({ ...prev, host: e.target.value }))}
                      className="mt-1 w-full rounded-md border border-white/10 bg-[#141821] px-3 py-2 font-mono text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-xs uppercase tracking-wider text-slate-400">
                      Port
                    </label>
                    <input
                      type="number"
                      placeholder="587"
                      value={smtpForm.port}
                      onChange={e => setSmtpForm(prev => ({ ...prev, port: parseInt(e.target.value, 10) || 587 }))}
                      className="mt-1 w-full rounded-md border border-white/10 bg-[#141821] px-3 py-2 font-mono text-xs text-white focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                </div>

                {/* SSL/TLS Toggle */}
                <div className="flex items-center space-x-2 text-xs text-slate-300">
                  <input
                    id="smtp-secure"
                    type="checkbox"
                    checked={smtpForm.secure}
                    onChange={e => setSmtpForm(prev => ({ ...prev, secure: e.target.checked }))}
                    className="h-4 w-4 rounded border-white/20 bg-[#141821] text-cyan-500"
                  />
                  <label htmlFor="smtp-secure" className="cursor-pointer">
                    Connexion SSL/TLS directe (Port 465). Laissez décoché pour STARTTLS standard (Port 587).
                  </label>
                </div>

                {/* User & Password */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block font-mono text-xs uppercase tracking-wider text-slate-400">
                      Utilisateur SMTP / Compte
                    </label>
                    <input
                      type="text"
                      placeholder="expediteur@pixiatech.com"
                      value={smtpForm.user}
                      onChange={e => setSmtpForm(prev => ({ ...prev, user: e.target.value }))}
                      className="mt-1 w-full rounded-md border border-white/10 bg-[#141821] px-3 py-2 font-mono text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-xs uppercase tracking-wider text-slate-400">
                      Mot de passe SMTP / App Password
                    </label>
                    <div className="relative mt-1">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder={hasStoredPassword ? '•••••••• (Mot de passe configuré)' : 'Mot de passe SMTP'}
                        value={smtpForm.pass || ''}
                        onChange={e => setSmtpForm(prev => ({ ...prev, pass: e.target.value }))}
                        className="w-full rounded-md border border-white/10 bg-[#141821] px-3 py-2 pr-10 font-mono text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* From & Recipient */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block font-mono text-xs uppercase tracking-wider text-slate-400">
                      Email Expéditeur (From Header)
                    </label>
                    <input
                      type="text"
                      placeholder="PIXIATECH <contact@pixiatech.com>"
                      value={smtpForm.fromEmail}
                      onChange={e => setSmtpForm(prev => ({ ...prev, fromEmail: e.target.value }))}
                      className="mt-1 w-full rounded-md border border-white/10 bg-[#141821] px-3 py-2 font-mono text-xs text-white focus:border-cyan-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-xs uppercase tracking-wider text-slate-400">
                      Email Destinataire des Formulaires
                    </label>
                    <input
                      type="email"
                      placeholder="contact@pixiatech.com"
                      value={smtpForm.recipientEmail}
                      onChange={e => setSmtpForm(prev => ({ ...prev, recipientEmail: e.target.value }))}
                      className="mt-1 w-full rounded-md border border-white/10 bg-[#141821] px-3 py-2 font-mono text-xs text-white focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/10">
                  <button
                    type="submit"
                    disabled={isSavingSmtp}
                    className="inline-flex items-center space-x-2 rounded-md bg-cyan-500 px-5 py-2.5 font-mono text-xs font-bold text-slate-950 transition-colors hover:bg-cyan-400 disabled:opacity-50"
                  >
                    {isSavingSmtp ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : saveSmtpSuccess ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Sliders className="h-4 w-4" />
                    )}
                    <span>{saveSmtpSuccess ? 'Paramètres sauvegardés !' : 'Enregistrer la configuration'}</span>
                  </button>

                  {/* Test Box */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="email"
                      placeholder="Email de test (optionnel)"
                      value={testRecipient}
                      onChange={e => setTestRecipient(e.target.value)}
                      className="rounded-md border border-white/10 bg-[#141821] px-3 py-2 font-mono text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none w-56"
                    />
                    <button
                      type="button"
                      onClick={handleTestSmtp}
                      disabled={isTestingSmtp}
                      className="inline-flex items-center space-x-1.5 rounded-md border border-white/20 bg-white/5 px-3.5 py-2 font-mono text-xs font-medium text-slate-200 transition-colors hover:border-cyan-400 hover:text-cyan-300 disabled:opacity-50"
                    >
                      {isTestingSmtp ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-400" />
                      ) : (
                        <Send className="h-3.5 w-3.5" />
                      )}
                      <span>Tester la passerelle</span>
                    </button>
                  </div>
                </div>

                {/* Test Feedback */}
                {testResult && (
                  <div
                    className={`mt-3 flex items-start space-x-3 rounded-lg border p-3.5 text-xs ${
                      testResult.success
                        ? 'border-emerald-500/30 bg-emerald-950/30 text-emerald-300'
                        : 'border-red-500/30 bg-red-950/30 text-red-300'
                    }`}
                  >
                    {testResult.success ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="font-bold">
                        {testResult.success ? 'Validation SMTP réussie' : 'Échec de connexion SMTP'}
                      </div>
                      <p className="mt-0.5 text-[11px] leading-relaxed opacity-90">{testResult.message}</p>
                    </div>
                  </div>
                )}
              </form>
            </div>
          )}

          {/* TAB 2: INBOX */}
          {activeTab === 'inbox' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setFilterStatus('all')}
                    className={`rounded px-3 py-1 font-mono text-xs ${
                      filterStatus === 'all' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Tous ({messages.length})
                  </button>
                  <button
                    onClick={() => setFilterStatus('unread')}
                    className={`rounded px-3 py-1 font-mono text-xs ${
                      filterStatus === 'unread' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Non lus ({messages.filter(m => m.status === 'unread').length})
                  </button>
                  <button
                    onClick={() => setFilterStatus('read')}
                    className={`rounded px-3 py-1 font-mono text-xs ${
                      filterStatus === 'read' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Traités ({messages.filter(m => m.status !== 'unread').length})
                  </button>
                </div>

                <button
                  onClick={fetchMessages}
                  disabled={isLoadingMessages}
                  className="inline-flex items-center space-x-1 font-mono text-xs text-slate-400 hover:text-cyan-400"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isLoadingMessages ? 'animate-spin text-cyan-400' : ''}`} />
                  <span>Actualiser</span>
                </button>
              </div>

              {/* Grid 2 panes: list & detail */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
                {/* List */}
                <div className="space-y-2 md:col-span-5 max-h-[55vh] overflow-y-auto pr-1">
                  {filteredMessages.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-white/10 p-8 text-center text-xs text-slate-500">
                      Aucun message dans cette vue.
                    </div>
                  ) : (
                    filteredMessages.map(msg => (
                      <div
                        key={msg.id}
                        onClick={() => setSelectedMessage(msg)}
                        className={`cursor-pointer rounded-lg border p-3.5 transition-all text-left ${
                          selectedMessage?.id === msg.id
                            ? 'border-cyan-400 bg-cyan-950/30'
                            : msg.status === 'unread'
                            ? 'border-white/15 bg-[#141821] hover:border-white/30'
                            : 'border-white/5 bg-[#0f1219]/60 opacity-80 hover:opacity-100'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-tech text-xs font-bold text-white truncate max-w-[180px]">
                            {msg.name}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400">
                            {new Date(msg.createdAt).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        <div className="mt-1 font-mono text-[11px] text-cyan-300 truncate">
                          {msg.subject || msg.projectType}
                        </div>

                        <p className="mt-1 line-clamp-2 text-xs text-slate-400">
                          {msg.message}
                        </p>

                        <div className="mt-2 flex items-center justify-between text-[10px]">
                          <span
                            className={`rounded px-1.5 py-0.5 font-mono font-semibold ${
                              msg.status === 'unread'
                                ? 'bg-cyan-500/20 text-cyan-300'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {msg.status === 'unread' ? 'NON LU' : 'CONSULTÉ'}
                          </span>

                          <span className="text-slate-500 font-mono">
                            {msg.emailDeliveryStatus === 'sent' ? '✓ Email envoyé' : 'Archivé localement'}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Detail View */}
                <div className="rounded-lg border border-white/10 bg-[#121620] p-5 md:col-span-7 flex flex-col justify-between max-h-[55vh] overflow-y-auto">
                  {selectedMessage ? (
                    <div className="space-y-4">
                      <div className="flex items-start justify-between border-b border-white/10 pb-3">
                        <div>
                          <h3 className="font-tech text-base font-bold text-white">
                            {selectedMessage.subject || 'Message de contact'}
                          </h3>
                          <div className="mt-1 text-xs text-slate-400">
                            Reçu le {new Date(selectedMessage.createdAt).toLocaleString('fr-FR')}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() =>
                              handleMessageStatus(
                                selectedMessage.id,
                                selectedMessage.status === 'unread' ? 'read' : 'unread'
                              )
                            }
                            className="rounded border border-white/10 px-2.5 py-1 font-mono text-[11px] text-slate-300 hover:border-white/30"
                          >
                            {selectedMessage.status === 'unread' ? 'Marquer lu' : 'Marquer non lu'}
                          </button>

                          <button
                            onClick={() => handleDeleteMessage(selectedMessage.id)}
                            className="rounded p-1.5 text-red-400 hover:bg-red-950/40"
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Sender Meta */}
                      <div className="grid grid-cols-2 gap-2 rounded-md bg-[#0a0c12] p-3 font-mono text-xs text-slate-300">
                        <div>
                          <span className="text-slate-500">Expéditeur :</span> {selectedMessage.name}
                        </div>
                        <div>
                          <span className="text-slate-500">Email :</span>{' '}
                          <a
                            href={`mailto:${selectedMessage.email}`}
                            className="text-cyan-400 hover:underline"
                          >
                            {selectedMessage.email}
                          </a>
                        </div>
                        <div>
                          <span className="text-slate-500">Téléphone :</span>{' '}
                          {selectedMessage.phone || 'Non renseigné'}
                        </div>
                        <div>
                          <span className="text-slate-500">Entreprise :</span>{' '}
                          {selectedMessage.company || 'Non renseignée'}
                        </div>
                        <div className="col-span-2">
                          <span className="text-slate-500">Projet :</span>{' '}
                          <span className="text-cyan-300">{selectedMessage.projectType}</span>
                        </div>
                      </div>

                      {/* Delivery note */}
                      <div className="rounded border border-white/5 bg-black/40 p-2.5 font-mono text-[11px] text-slate-400">
                        <span className="text-slate-500">Acheminement SMTP :</span>{' '}
                        {selectedMessage.deliveryNote || selectedMessage.emailDeliveryStatus}
                      </div>

                      {/* Body */}
                      <div className="rounded-md border border-white/5 bg-[#141821] p-4 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                        {selectedMessage.message}
                      </div>

                      {/* Reply shortcut */}
                      <div className="pt-2">
                        <a
                          href={`mailto:${selectedMessage.email}?subject=Re: ${encodeURIComponent(
                            selectedMessage.subject || 'Votre demande PIXIATECH'
                          )}`}
                          className="inline-flex items-center space-x-2 rounded-md bg-cyan-500 px-4 py-2 font-mono text-xs font-bold text-slate-950 hover:bg-cyan-400"
                        >
                          <Mail className="h-3.5 w-3.5" />
                          <span>Répondre par email à {selectedMessage.name}</span>
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-64 flex-col items-center justify-center text-slate-500">
                      <Inbox className="h-10 w-10 stroke-1" />
                      <p className="mt-2 text-xs">Sélectionnez un message dans la liste pour afficher le contenu.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CONTACT INFO EDIT */}
          {activeTab === 'info' && contactInfoForm && (
            <form onSubmit={handleSaveContactInfo} className="space-y-5 max-w-3xl mx-auto">
              <div className="rounded-lg border border-cyan-500/20 bg-cyan-950/20 p-4 text-xs text-slate-300">
                <span className="font-semibold text-white">Mise à jour des coordonnées officielles :</span>
                <p className="mt-1 text-slate-400">
                  Modifiez les adresses, numéros de téléphone et horaires affichés sur la page Contactez-nous sans avoir à modifier le code source.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block font-mono text-xs uppercase tracking-wider text-slate-400">
                    Nom de l'entreprise
                  </label>
                  <input
                    type="text"
                    value={contactInfoForm.companyName}
                    onChange={e => setContactInfoForm({ ...contactInfoForm, companyName: e.target.value })}
                    className="mt-1 w-full rounded-md border border-white/10 bg-[#141821] px-3 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-mono text-xs uppercase tracking-wider text-slate-400">
                    Slogan / Spécialisation
                  </label>
                  <input
                    type="text"
                    value={contactInfoForm.tagline}
                    onChange={e => setContactInfoForm({ ...contactInfoForm, tagline: e.target.value })}
                    className="mt-1 w-full rounded-md border border-white/10 bg-[#141821] px-3 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <label className="block font-mono text-xs uppercase tracking-wider text-slate-400">
                    Adresse
                  </label>
                  <input
                    type="text"
                    value={contactInfoForm.address}
                    onChange={e => setContactInfoForm({ ...contactInfoForm, address: e.target.value })}
                    className="mt-1 w-full rounded-md border border-white/10 bg-[#141821] px-3 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-mono text-xs uppercase tracking-wider text-slate-400">
                    Code Postal & Ville
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={contactInfoForm.postalCode}
                      onChange={e => setContactInfoForm({ ...contactInfoForm, postalCode: e.target.value })}
                      placeholder="93400"
                      className="mt-1 w-24 rounded-md border border-white/10 bg-[#141821] px-3 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none"
                    />
                    <input
                      type="text"
                      value={contactInfoForm.city}
                      onChange={e => setContactInfoForm({ ...contactInfoForm, city: e.target.value })}
                      placeholder="Saint-Ouen"
                      className="mt-1 flex-1 rounded-md border border-white/10 bg-[#141821] px-3 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block font-mono text-xs uppercase tracking-wider text-slate-400">
                    Email Principal
                  </label>
                  <input
                    type="email"
                    value={contactInfoForm.primaryEmail}
                    onChange={e => setContactInfoForm({ ...contactInfoForm, primaryEmail: e.target.value })}
                    className="mt-1 w-full rounded-md border border-white/10 bg-[#141821] px-3 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-mono text-xs uppercase tracking-wider text-slate-400">
                    WhatsApp (avec indicatif sans +)
                  </label>
                  <input
                    type="text"
                    value={contactInfoForm.whatsappNumber}
                    onChange={e => setContactInfoForm({ ...contactInfoForm, whatsappNumber: e.target.value })}
                    placeholder="33756816626"
                    className="mt-1 w-full rounded-md border border-white/10 bg-[#141821] px-3 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block font-mono text-xs uppercase tracking-wider text-slate-400">
                    Téléphone Ligne 1
                  </label>
                  <input
                    type="text"
                    value={contactInfoForm.phone1}
                    onChange={e => setContactInfoForm({ ...contactInfoForm, phone1: e.target.value })}
                    className="mt-1 w-full rounded-md border border-white/10 bg-[#141821] px-3 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-mono text-xs uppercase tracking-wider text-slate-400">
                    Téléphone Ligne 2
                  </label>
                  <input
                    type="text"
                    value={contactInfoForm.phone2}
                    onChange={e => setContactInfoForm({ ...contactInfoForm, phone2: e.target.value })}
                    className="mt-1 w-full rounded-md border border-white/10 bg-[#141821] px-3 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono text-xs uppercase tracking-wider text-slate-400">
                  Horaires d'ouverture & Permanence
                </label>
                <input
                  type="text"
                  value={contactInfoForm.workingHours}
                  onChange={e => setContactInfoForm({ ...contactInfoForm, workingHours: e.target.value })}
                  className="mt-1 w-full rounded-md border border-white/10 bg-[#141821] px-3 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-white/10">
                <button
                  type="submit"
                  disabled={isSavingInfo}
                  className="inline-flex items-center space-x-2 rounded-md bg-cyan-500 px-5 py-2.5 font-mono text-xs font-bold text-slate-950 transition-colors hover:bg-cyan-400 disabled:opacity-50"
                >
                  {isSavingInfo ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : saveInfoSuccess ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Building2 className="h-4 w-4" />
                  )}
                  <span>{saveInfoSuccess ? 'Coordonnées enregistrées !' : 'Enregistrer les coordonnées'}</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-white/10 px-6 py-3 bg-[#0a0c12] text-xs text-slate-500">
          <span>PIXIATECH Express Server v1.0 • Node.js SMTP Hub</span>
          <button
            onClick={onClose}
            className="rounded px-3 py-1 font-mono text-xs text-slate-400 hover:text-white"
          >
            Fermer la console
          </button>
        </div>
      </div>
    </div>
  );
};