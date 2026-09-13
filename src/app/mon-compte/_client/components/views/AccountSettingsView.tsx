'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BadgeCheck,
  Eye,
  EyeOff,
  Loader2,
  Mail,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import type { ClientProfile } from '../../types';
import { clientApi } from '../../lib/api';
import { SlidingSwitch } from '../SlidingSwitch';

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
    <div id="pixiatech-account-settings" className="space-y-6">
      <div className="bg-white rounded-3xl border border-neutral-200/80 p-5 sm:p-6 shadow-xs flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-13 h-13 rounded-2xl bg-[#0A0D0E] text-white flex items-center justify-center shrink-0 shadow-md">
            <UserCheck className="w-6 h-6 text-[#38E044]" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">Paramètres du Compte</h1>
            <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
              Gestion de votre profil, sécurité, coordonnées de contact et informations certifiées.
            </p>
          </div>
        </div>

        <SlidingSwitch
          options={[
            { id: 'profile', label: 'Profil & Coordonnées' },
            { id: 'security', label: 'Sécurité & Accès' },
            { id: 'danger', label: 'Compte' },
          ]}
          activeId={tab}
          onChange={(id) => setTab(id as Tab)}
          size="md"
        />
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
          {tab === 'security' && <SecurityTab profile={profile} onRefreshProfile={onRefreshProfile} showToast={showToast} />}
          {tab === 'danger' && <DangerTab email={profile?.email || ''} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function ProfileTab({ profile, onRefreshProfile, onOpenSiretModal, onOpenEmailModal, showToast }: AccountSettingsViewProps) {
  const [saving, setSaving] = useState(false);
  const [civility, setCivility] = useState(profile?.civility || '');
  const fullName = profile?.name || profile?.email?.split('@')[0] || '';
  const [firstName, setFirstName] = useState(fullName.split(' ')[0] || '');
  const [lastName, setLastName] = useState(fullName.split(' ').slice(1).join(' ') || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [companyName, setCompanyName] = useState(profile?.companyName || '');
  const [companyAddress, setCompanyAddress] = useState(profile?.companyAddress || '');

  async function save() {
    setSaving(true);
    try {
      await clientApi.updateAddress({
        firstName,
        lastName,
        email: profile?.email || '',
        phone,
        civility,
        companyName,
        companyAddress,
      });
      showToast('success', 'Vos informations ont été enregistrées.');
      onRefreshProfile();
    } catch (err: any) {
      showToast('error', err.message || "Impossible d'enregistrer vos informations.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-xs">
            <h2 className="text-base font-bold text-neutral-900">Informations personnelles</h2>
            <p className="mt-0.5 text-sm text-neutral-500">
              Ces informations sont utilisées pour vos livraisons et votre facturation.
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-neutral-500">Civilité</span>
                <select
                  value={civility}
                  onChange={(e) => setCivility(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-neutral-400"
                >
                  <option value="">Non précisée</option>
                  <option value="M.">M.</option>
                  <option value="Mme">Mme</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-neutral-500">E-mail (non modifiable)</span>
                <input
                  type="email"
                  value={profile?.email || ''}
                  disabled
                  className="w-full rounded-xl border border-neutral-100 bg-neutral-50 px-3.5 py-2.5 text-sm text-neutral-400 outline-none"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-neutral-500">Prénom</span>
                <input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-neutral-400"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-neutral-500">Nom</span>
                <input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-neutral-400"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-xs font-medium text-neutral-500">Téléphone</span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+33 6 12 34 56 78"
                  className="w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-neutral-400"
                />
              </label>
            </div>
            <div className="mt-5 rounded-xl border border-neutral-100 bg-neutral-50/60 px-4 py-3 text-xs text-neutral-500">
              Besoin d'un changement d'adresse de livraison ? Il s'applique à vos prochaines commandes.
            </div>
          </section>

          <section className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-xs">
            <h2 className="text-base font-bold text-neutral-900">Informations professionnelles</h2>
            <p className="mt-0.5 text-sm text-neutral-500">
              Renseignez votre société pour bénéficier de la facturation B2B.{' '}
              {profile?.siretVerified ? 'Votre SIRET est vérifié.' : ''}
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-neutral-500">Raison sociale</span>
                <input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-neutral-400"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-neutral-500">Adresse société</span>
                <input
                  value={companyAddress}
                  onChange={(e) => setCompanyAddress(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-neutral-400"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-neutral-500">SIRET</span>
                <input
                  value={profile?.siret || ''}
                  disabled
                  className="w-full rounded-xl border border-neutral-100 bg-neutral-50 px-3.5 py-2.5 text-sm text-neutral-400 outline-none"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-neutral-500">N° TVA</span>
                <input
                  value={profile?.vatNumber || ''}
                  disabled
                  className="w-full rounded-xl border border-neutral-100 bg-neutral-50 px-3.5 py-2.5 text-sm text-neutral-400 outline-none"
                />
              </label>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-xs">
            <h2 className="mb-4 text-base font-bold text-neutral-900">Vérifications</h2>
            <div className="space-y-3">
              <VerificationCard
                icon={<Mail size={17} />}
                title="Adresse e-mail"
                verified={profile?.emailVerified === true}
                onVerify={onOpenEmailModal}
              />
              <VerificationCard
                icon={<ShieldCheck size={17} />}
                title="SIRET professionnel"
                verified={profile?.siretVerified === true}
                onVerify={onOpenSiretModal}
                detail={profile?.siret || undefined}
              />
            </div>
          </section>

          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0A0D0E] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {saving && <Loader2 size={15} className="animate-spin" />}
            Enregistrer mes informations
          </button>
        </div>
      </div>
    </div>
  );
}

function VerificationCard({
  icon,
  title,
  verified,
  onVerify,
  detail,
}: {
  icon: React.ReactNode;
  title: string;
  verified: boolean;
  onVerify: () => void;
  detail?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-neutral-100 bg-neutral-50/60 p-4">
      <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${verified ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-200 text-neutral-500'}`}>
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-neutral-900">{title}</p>
        <p className="truncate text-xs text-neutral-500">
          {verified ? 'Vérifié' : 'Non vérifié'}
          {detail && !verified ? ` · ${detail}` : ''}
        </p>
      </div>
      {verified ? (
        <BadgeCheck size={20} className="text-emerald-500" />
      ) : (
        <button
          type="button"
          onClick={onVerify}
          className="rounded-lg bg-[#0A0D0E] px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90"
        >
          Vérifier
        </button>
      )}
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
  const [mismatch, setMismatch] = useState(false);

  async function submit() {
    if (next.length < 8) {
      showToast('error', 'Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (next !== confirm) {
      setMismatch(true);
      showToast('error', 'Les mots de passe ne correspondent pas.');
      return;
    }
    setMismatch(false);
    setBusy(true);
    try {
      await clientApi.changePassword(current, next);
      showToast('success', 'Mot de passe mis à jour.');
      setCurrent('');
      setNext('');
      setConfirm('');
      onRefreshProfile();
    } catch (err: any) {
      showToast('error', err.message || 'Impossible de modifier le mot de passe.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-xl">
      <section className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-xs">
        <h2 className="text-base font-bold text-neutral-900">Mot de passe</h2>
        {!profile?.hasPassword ? (
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50/70 p-4 text-sm text-amber-800">
            <ShieldAlert size={18} className="mt-0.5 shrink-0" />
            <p>
              Vous n'avez pas encore de mot de passe. Utilisez un lien de connexion reçu par e-mail pour en définir un
              définitivement (lien « Définir un mot de passe »).
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-neutral-500">Mot de passe actuel</span>
              <PasswordInput value={current} onChange={setCurrent} show={show} onToggleShow={() => setShow(!show)} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-neutral-500">Nouveau mot de passe</span>
              <PasswordInput value={next} onChange={setNext} show={show} onToggleShow={() => setShow(!show)} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-neutral-500">Confirmer le nouveau mot de passe</span>
              <PasswordInput value={confirm} onChange={setConfirm} show={show} onToggleShow={() => setShow(!show)} mismatch={mismatch} />
            </label>
            <button
              type="button"
              onClick={submit}
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0A0D0E] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {busy && <Loader2 size={15} className="animate-spin" />}
              Mettre à jour mon mot de passe
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

function PasswordInput({
  value,
  onChange,
  show,
  onToggleShow,
  mismatch,
}: {
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggleShow: () => void;
  mismatch?: boolean;
}) {
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-xl border bg-white px-3.5 py-2.5 pr-11 text-sm outline-none transition focus:border-neutral-400 ${
          mismatch ? 'border-red-300' : 'border-neutral-200'
        }`}
      />
      <button
        type="button"
        onClick={onToggleShow}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 transition hover:text-neutral-700"
        aria-label={show ? 'Masquer' : 'Afficher'}
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

function DangerTab({ email }: { email: string }) {
  return (
    <div className="max-w-xl">
      <section className="rounded-2xl border border-red-100 bg-white p-6 shadow-xs">
        <h2 className="text-base font-bold text-red-600">Zone de danger</h2>
        <p className="mt-0.5 text-sm text-neutral-500">
          La suppression de compte n'est pas disponible en libre-service. Contactez-nous à partir de l'adresse associée à
          votre compte.
        </p>
        <a
          href={`mailto:support@pixiatech.com?subject=Suppression%20de%20mon%20compte&body=Bonjour,%20je%20souhaite%20supprimer%20mon%20compte%20(${encodeURIComponent(email)}).`}
          className="mt-4 inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
        >
          Contacter le support
        </a>
      </section>
    </div>
  );
}