'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  Trash2,
  User,
  X,
} from 'lucide-react';
import type { ClientProfile } from '../../types';
import { clientApi } from '../../lib/api';

interface AccountSettingsViewProps {
  profile: ClientProfile | null;
  onRefreshProfile: () => void;
  onOpenSiretModal: () => void;
  onOpenEmailModal: () => void;
  showToast: (type: 'success' | 'error', message: string) => void;
}

type Tab = 'profile' | 'security' | 'danger';

export function AccountSettingsView({
  profile,
  onRefreshProfile,
  onOpenSiretModal,
  onOpenEmailModal,
  showToast,
}: AccountSettingsViewProps) {
  const [tab, setTab] = useState<Tab>('profile');

  return (
    <div id="pixiatech-settings-view" className="space-y-6">
      <div className="bg-white rounded-3xl border border-neutral-200/80 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-13 h-13 rounded-2xl bg-[#0A0D0E] text-white flex items-center justify-center shrink-0 shadow-md">
            <User className="w-6 h-6 text-[#38E044]" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">Paramètres du Compte</h1>
            <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
              Identité client certifiée, conformité fiscale INSEE, sécurité et coordonnées.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 p-1.5 bg-neutral-100/80 rounded-2xl border border-neutral-200/60 text-xs">
          <TabButton active={tab === 'profile'} onClick={() => setTab('profile')}>
            Profil & Entreprise
          </TabButton>
          <TabButton active={tab === 'security'} onClick={() => setTab('security')}>
            Sécurité
          </TabButton>
          <TabButton danger active={tab === 'danger'} onClick={() => setTab('danger')}>
            Zone critique
          </TabButton>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
        >
          {tab === 'profile' && (
            <ProfileTab
              profile={profile}
              onRefreshProfile={onRefreshProfile}
              onOpenSiretModal={onOpenSiretModal}
              onOpenEmailModal={onOpenEmailModal}
              showToast={showToast}
            />
          )}
          {tab === 'security' && (
            <SecurityTab profile={profile} onRefreshProfile={onRefreshProfile} showToast={showToast} />
          )}
          {tab === 'danger' && <DangerTab email={profile?.email || ''} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function TabButton({
  active,
  danger,
  onClick,
  children,
}: {
  active: boolean;
  danger?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const base = 'py-1.5 px-3 rounded-xl font-bold transition-all cursor-pointer';
  const activeCls = danger ? 'bg-red-600 text-white shadow-xs' : 'bg-[#0A0D0E] text-white shadow-xs';
  const idleCls = danger ? 'text-red-700 hover:bg-red-50' : 'text-neutral-600 hover:text-neutral-900';
  return (
    <button type="button" onClick={onClick} className={`${base} ${active ? activeCls : idleCls}`}>
      {children}
    </button>
  );
}

function ProfileTab({
  profile,
  onRefreshProfile,
  onOpenSiretModal,
  onOpenEmailModal,
  showToast,
}: AccountSettingsViewProps) {
  const [phoneInput, setPhoneInput] = useState(profile?.phone || '');
  const [phoneSaved, setPhoneSaved] = useState(false);
  const [savingPhone, setSavingPhone] = useState(false);

  async function handleSavePhone(e: React.FormEvent) {
    e.preventDefault();
    setSavingPhone(true);
    try {
      await clientApi.updatePhone(phoneInput);
      setPhoneSaved(true);
      setTimeout(() => setPhoneSaved(false), 2000);
      showToast('success', 'Numéro de téléphone enregistré.');
      onRefreshProfile();
    } catch (err: any) {
      showToast('error', err?.message || "Impossible d'enregistrer le numéro de téléphone.");
    } finally {
      setSavingPhone(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-3xl border border-neutral-200/80 p-6 shadow-xs space-y-5">
        <div className="pb-3 border-b border-neutral-100 flex items-center gap-2.5">
          <User className="w-5 h-5 text-neutral-900" />
          <h2 className="text-base font-bold text-neutral-900">Coordonnées de Contact</h2>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <label className="text-neutral-500 font-semibold block mb-1">Nom et Prénom</label>
            <input
              type="text"
              disabled
              value={profile?.name || ''}
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 bg-neutral-100/60 font-semibold text-neutral-700 cursor-not-allowed"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-neutral-500 font-semibold">Adresse e-mail du compte</label>
              {profile?.emailVerified ? (
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Vérifiée
                </span>
              ) : (
                <button
                  type="button"
                  onClick={onOpenEmailModal}
                  className="text-[11px] font-bold text-amber-700 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <AlertTriangle className="w-3 h-3" />
                  Vérifier par PIN
                </button>
              )}
            </div>
            <div className="relative">
              <input
                type="email"
                disabled
                value={profile?.email || ''}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 bg-neutral-100/60 font-mono text-neutral-700 cursor-not-allowed pr-10"
              />
              <Lock className="w-4 h-4 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <form onSubmit={handleSavePhone} className="space-y-3 pt-2 border-t border-neutral-100">
            <div>
              <label className="text-neutral-700 font-semibold block mb-1">
                Numéro de téléphone (modifiable)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="+33 6 12 34 56 78"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-neutral-300 font-mono text-neutral-900 focus:outline-none focus:ring-2 focus:ring-black/10 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              {phoneSaved ? (
                <span className="text-emerald-700 font-bold flex items-center gap-1.5 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Numéro enregistré !
                </span>
              ) : (
                <span />
              )}

              <button
                type="submit"
                disabled={savingPhone}
                className="px-4 py-2 rounded-xl bg-[#0A0D0E] text-white font-bold text-xs hover:bg-neutral-800 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
              >
                {savingPhone ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#38E044]" />
                ) : (
                  <Save className="w-3.5 h-3.5 text-[#38E044]" />
                )}
                <span>Sauvegarder le téléphone</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-neutral-200/80 p-6 shadow-xs space-y-5">
        <div className="pb-3 border-b border-neutral-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <Building2 className="w-5 h-5 text-neutral-900 shrink-0" />
            <h2 className="text-base font-bold text-neutral-900">Rattachement Entreprise (SIRET)</h2>
          </div>
          {profile?.siretVerified && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100/70 border border-emerald-200 px-2.5 py-0.5 rounded-full shrink-0">
              <ShieldCheck className="w-3.5 h-3.5" />
              Certifié INSEE
            </span>
          )}
        </div>

        {profile?.siretVerified && profile?.companyName ? (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-emerald-200/60 gap-3">
                <span className="font-bold text-emerald-950 text-sm truncate">{profile.companyName}</span>
                <span className="font-mono text-[11px] bg-emerald-200/70 text-emerald-900 px-2 py-0.5 rounded font-bold shrink-0">
                  VERROUILLÉ
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-neutral-400 block text-[10px]">Numéro SIRET</span>
                  <span className="font-mono font-bold text-neutral-900 break-all">{profile.siret || '—'}</span>
                </div>
                <div>
                  <span className="text-neutral-400 block text-[10px]">N° TVA Intracommunautaire</span>
                  <span className="font-mono font-bold text-neutral-900 break-all">{profile.vatNumber || '—'}</span>
                </div>
                <div>
                  <span className="text-neutral-400 block text-[10px]">Code NAF</span>
                  <span className="text-neutral-800 font-semibold">{profile.nafCode || '—'}</span>
                </div>
                <div>
                  <span className="text-neutral-400 block text-[10px]">Forme Juridique</span>
                  <span className="text-neutral-800 font-semibold">{profile.legalStatus || '—'}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-emerald-200/60">
                <span className="text-neutral-400 block text-[10px]">Siège Social</span>
                <span className="text-neutral-700">
                  {profile.companyAddress}
                  {profile.companyPostalCode || profile.companyCity ? `, ${profile.companyPostalCode} ${profile.companyCity}` : ''}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 text-[11px] text-neutral-500 flex items-start gap-2">
              <Lock className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
              <span>
                Conformément aux règles de conformité fiscale, les données légales d'entreprise validées auprès
                de l'INSEE sont verrouillées. Pour toute modification suite à un changement de Kbis, contactez
                notre support officiel.
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            <div className="p-5 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-3">
              <div className="font-bold text-neutral-800">Aucune entreprise rattachée</div>
              <p className="text-neutral-500 leading-relaxed">
                Vous êtes actuellement enregistré en tant que client particulier. Si vous réalisez des achats pour
                le compte d'une société, effectuez la vérification INSEE pour obtenir des factures avec TVA
                récupérable.
              </p>
              <button
                type="button"
                onClick={onOpenSiretModal}
                className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0A0D0E] text-white font-bold text-xs hover:bg-neutral-800 transition-colors shadow-xs cursor-pointer"
              >
                <Building2 className="w-4 h-4 text-[#38E044]" />
                <span>Lancer la vérification SIRET</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SecurityTab({
  profile,
  onRefreshProfile,
  showToast,
}: {
  profile: ClientProfile | null;
  onRefreshProfile: () => void;
  showToast: (t: 'success' | 'error', m: string) => void;
}) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!current) {
      setErrorMsg('Veuillez renseigner votre mot de passe actuel.');
      return;
    }
    if (next.length < 8) {
      setErrorMsg('Le nouveau mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (next !== confirm) {
      setErrorMsg('Les deux nouveaux mots de passe ne correspondent pas.');
      return;
    }

    setBusy(true);
    try {
      await clientApi.changePassword(current, next);
      setSuccessMsg('Votre mot de passe a été mis à jour avec succès.');
      setCurrent('');
      setNext('');
      setConfirm('');
      onRefreshProfile();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Impossible de modifier le mot de passe.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl border border-neutral-200/80 p-6 shadow-xs space-y-5">
        <div className="pb-3 border-b border-neutral-100 flex items-center gap-2.5">
          <KeyRound className="w-5 h-5 text-neutral-900" />
          <h2 className="text-base font-bold text-neutral-900">Modification du Mot de Passe</h2>
        </div>

        {!profile?.hasPassword ? (
          <div className="flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50/70 p-4 text-xs text-amber-800">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <p>
              Vous n'avez pas encore de mot de passe. Utilisez un lien de connexion reçu par e-mail (lien
              « Définir un mot de passe ») pour en créer un définitivement.
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="text-neutral-700 font-semibold block">Mot de passe actuel</label>
              <PasswordInput value={current} onChange={setCurrent} show={show} onToggleShow={() => setShow(!show)} />
            </div>

            <div className="space-y-1.5">
              <label className="text-neutral-700 font-semibold block">Nouveau mot de passe</label>
              <PasswordInput value={next} onChange={setNext} show={show} onToggleShow={() => setShow(!show)} />
            </div>

            <div className="space-y-1.5">
              <label className="text-neutral-700 font-semibold block">Confirmer le nouveau mot de passe</label>
              <PasswordInput value={confirm} onChange={setConfirm} show={show} onToggleShow={() => setShow(!show)} />
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 text-red-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={busy}
                className="px-5 py-2.5 rounded-xl bg-[#0A0D0E] text-white font-bold text-xs hover:bg-neutral-800 transition-colors shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {busy ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[#38E044]" />
                ) : (
                  <KeyRound className="w-4 h-4 text-[#38E044]" />
                )}
                <span>Mettre à jour le mot de passe</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function PasswordInput({
  value,
  onChange,
  show,
  onToggleShow,
}: {
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggleShow: () => void;
}) {
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="••••••••••••"
        className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-black/10 pr-11"
      />
      <button
        type="button"
        onClick={onToggleShow}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 transition hover:text-neutral-700"
        aria-label={show ? 'Masquer' : 'Afficher'}
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

function DangerTab({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');

  function confirmDelete() {
    setOpen(false);
    const subject = encodeURIComponent('Suppression de mon compte');
    const body = encodeURIComponent(`Bonjour, je souhaite supprimer mon compte (${email}).`);
    window.location.href = `mailto:support@pixiatech.com?subject=${subject}&body=${body}`;
    setInput('');
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl border border-red-200/80 p-6 shadow-xs space-y-5">
        <div className="pb-3 border-b border-red-100 flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-red-100 text-red-700">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-red-950">Zone Critique : Suppression du Compte</h2>
            <p className="text-xs text-red-700/80 mt-0.5">
              La suppression de votre compte est irréversible et clôture vos accès.
            </p>
          </div>
        </div>

        <p className="text-xs text-neutral-600 leading-relaxed">
          La suppression de votre compte effacera vos identifiants d'accès. Conformément aux dispositions légales
          du Code de Commerce et du Code Général des Impôts, les factures déjà émises sont archivées de manière
          sécurisée et ne peuvent être supprimées.
        </p>

        <div className="pt-2">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-colors shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Demander la suppression du compte</span>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-xs sm:items-center sm:p-4"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl border border-neutral-200 bg-white shadow-2xl sm:rounded-3xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-neutral-100 p-5 pb-3">
                <div className="flex items-center gap-2 text-red-600 font-bold text-base">
                  <AlertTriangle className="w-5 h-5" />
                  <span>Confirmation Requise</span>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg p-1.5 text-neutral-400 transition hover:bg-neutral-100 hover:text-black"
                  aria-label="Fermer"
                >
                  <X className="size-5" />
                </button>
              </div>

              <div className="flex-1 space-y-5 p-5">
                <p className="text-xs text-neutral-600 leading-relaxed">
                  Êtes-vous absolument certain de vouloir supprimer le compte{' '}
                  <strong className="text-neutral-900">{email}</strong> ? Cette opération est définitive.
                </p>

                <div className="space-y-1.5 text-xs">
                  <label className="text-neutral-700 font-medium">
                    Veuillez taper <strong className="text-red-600 font-mono">SUPPRIMER</strong> pour confirmer :
                  </label>
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="SUPPRIMER"
                    className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 font-mono text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 border-t border-neutral-100 p-4">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-neutral-600 transition hover:bg-neutral-100"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  disabled={input !== 'SUPPRIMER'}
                  onClick={confirmDelete}
                  className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                    input === 'SUPPRIMER'
                      ? 'bg-red-600 text-white hover:bg-red-700 shadow-md cursor-pointer'
                      : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                  }`}
                >
                  Confirmer la suppression
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}