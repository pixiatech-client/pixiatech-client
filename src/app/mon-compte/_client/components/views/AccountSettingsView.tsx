'use client';

import React, { useState, useRef } from 'react';
import {
  UserCheck,
  Building2,
  Lock,
  ShieldCheck,
  Camera,
  KeyRound,
  Phone,
  Mail,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  X,
  FileCheck2,
  HelpCircle,
  Upload
} from 'lucide-react';
import type { UserProfile, ClientProfile } from '../../types';
import { SlidingSwitch } from '../SlidingSwitch';
import { clientApi } from '../../lib/api';

interface AccountSettingsViewProps {
  user?: UserProfile;
  onUpdateUser?: (updatedFields: Partial<UserProfile>) => void;
  onDeleteAccount?: () => void;
  onOpenSiretModal: () => void;
  onOpenEmailModal: () => void;
  profile?: ClientProfile | null;
  onRefreshProfile?: () => void;
  showToast?: (type: 'success' | 'error', message: string) => void;
}

export const AccountSettingsView: React.FC<AccountSettingsViewProps> = ({
  user: initialUser,
  onUpdateUser,
  onDeleteAccount,
  onOpenSiretModal,
  onOpenEmailModal,
  profile,
  onRefreshProfile,
  showToast
}) => {
  // Resolve unified user profile — neutral empty fallbacks, never fake data.
  const user: UserProfile = initialUser || {
    id: profile?.id || '',
    name: profile ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim() : '',
    email: profile?.email || '',
    emailVerified: profile?.emailVerified ?? false,
    phone: profile?.phone || '',
    avatarUrl: profile?.avatarUrl || '',
    personalAddress: profile?.address || '',
    personalPostalCode: profile?.postalCode || '',
    personalCity: profile?.city || '',
    siretVerified: Boolean(profile?.siretVerified || profile?.siret),
    siret: profile?.siret || undefined,
    companyName: profile?.companyName || undefined,
    vatNumber: profile?.vatNumber || undefined,
    companyAddress: profile?.companyAddress || undefined,
    postalCode: profile?.postalCode || undefined,
    city: profile?.city || undefined,
    legalStatus: profile?.legalForm || undefined,
    role: 'client'
  };

  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'danger'>('profile');

  // Contact fields state
  const [phoneNumber, setPhoneNumber] = useState<string>(user.phone || '');
  const [isSavingPhone, setIsSavingPhone] = useState<boolean>(false);
  const [phoneSavedSuccess, setPhoneSavedSuccess] = useState<boolean>(false);

  // Password fields state
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');
  const [passwordSuccess, setPasswordSuccess] = useState<boolean>(false);

  // Delete account confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle avatar upload — resize client-side, persist to server, then update UI
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') return;
      const image = new Image();
      image.onload = async () => {
        const MAX_SIZE = 256;
        const scale = Math.min(1, MAX_SIZE / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        try {
          const res = await clientApi.updateAvatar(dataUrl);
          onUpdateUser?.({ avatarUrl: res.avatarUrl });
          showToast?.('success', 'Photo de profil mise à jour');
        } catch (err) {
          showToast?.('error', err instanceof Error ? err.message : "Impossible d'enregistrer la photo.");
        }
      };
      image.onerror = () => {
        showToast?.('error', "Impossible de lire l'image sélectionnée.");
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSavePhone = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPhone(true);
    try {
      const res = await clientApi.updatePhone(phoneNumber);
      onUpdateUser?.({ phone: res.phone });
      setPhoneSavedSuccess(true);
      showToast?.('success', 'Numéro de téléphone mis à jour');
      setTimeout(() => setPhoneSavedSuccess(false), 3000);
    } catch (err) {
      showToast?.('error', err instanceof Error ? err.message : "Impossible d'enregistrer le numéro.");
    } finally {
      setIsSavingPhone(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    if (!currentPassword) {
      setPasswordError('Veuillez saisir votre mot de passe actuel.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('Le nouveau mot de passe doit comporter au moins 8 caractères.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('La confirmation ne correspond pas au nouveau mot de passe.');
      return;
    }

    try {
      await clientApi.changePassword(currentPassword, newPassword);
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast?.('success', 'Mot de passe modifié avec succès');
      setTimeout(() => setPasswordSuccess(false), 4000);
    } catch (err: any) {
      const msg = err?.message || 'Erreur lors du changement de mot de passe.';
      setPasswordError(msg);
      showToast?.('error', msg);
    }
  };

  return (
    <div id="pixiatech-account-settings" className="space-y-6">
      {/* 1. Header Card */}
      <div className="bg-white rounded-3xl border border-neutral-200/80 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#0A0D0E] text-white flex items-center justify-center shrink-0 shadow-md">
            <UserCheck className="w-6 h-6 text-[#38E044]" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
              Paramètres du Compte
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
              Gestion de votre profil, sécurité, coordonnées de contact et informations certifiées.
            </p>
          </div>
        </div>

        {/* Sliding Switch for Tabs */}
        <SlidingSwitch
          options={[
            { id: 'profile', label: 'Profil & Coordonnées' },
            { id: 'security', label: 'Sécurité & Accès' },
            { id: 'danger', label: 'Compte' }
          ]}
          activeId={activeTab}
          onChange={(tab) => setActiveTab(tab as any)}
          size="md"
        />
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: PROFIL & COORDONNÉES                                           */}
      {/* ===================================================================== */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Photo de profil & Identité (1 col) */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-neutral-200/80 p-6 shadow-xs text-center space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400 text-left">
                Photo de profil
              </h2>

              <div className="relative inline-block mx-auto group">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-28 h-28 rounded-3xl object-cover border-2 border-neutral-200 shadow-md"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-28 h-28 rounded-3xl border-2 border-neutral-200 shadow-md bg-neutral-100 flex items-center justify-center overflow-hidden">
                    <span className="text-4xl font-bold text-neutral-400 select-none">
                      {(user.name || 'C').charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-2 -right-2 p-2.5 rounded-xl bg-[#0A0D0E] text-white hover:bg-neutral-800 shadow-lg transition-transform hover:scale-105 cursor-pointer"
                  title="Changer la photo de profil"
                >
                  <Camera className="w-4 h-4 text-[#38E044]" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>

              <div>
                <div className="font-bold text-base text-neutral-900">{user.name}</div>
                <div className="text-xs text-neutral-500">{user.email}</div>
                <span className="inline-block mt-2 text-[10px] font-bold uppercase tracking-wider bg-neutral-100 text-neutral-700 px-2.5 py-1 rounded-full border border-neutral-200">
                  {user.siretVerified && user.companyName ? user.companyName : 'Compte Client'}
                </span>
              </div>

              <div className="pt-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2 px-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Remplacer ma photo</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Données certifiées (SIRET verrouillé) & Contact (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* 1. INFORMATIONS PERSONNELLES & FISCALES */}
            <div className="bg-white rounded-3xl border border-neutral-200/80 p-6 shadow-xs space-y-5">
              <div className="pb-3 border-b border-neutral-100">
                <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-neutral-700" />
                  <span>Informations du Client</span>
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Informations certifiées conformes pour vos achats et factures.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="text-neutral-500 font-semibold flex items-center justify-between">
                    <span>Nom & Prénom</span>
                    <span className="text-[10px] text-neutral-400 font-mono">READ ONLY</span>
                  </label>
                  <input
                    type="text"
                    value={user.name}
                    disabled
                    readOnly
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-100/90 border border-neutral-300/80 text-neutral-600 font-medium cursor-not-allowed select-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-neutral-500 font-semibold flex items-center justify-between">
                    <span>Adresse personnelle</span>
                    <span className="text-[10px] text-neutral-400 font-mono">READ ONLY</span>
                  </label>
                  <input
                    type="text"
                    value={[user.personalAddress, user.personalPostalCode, user.personalCity].filter(Boolean).join(', ')}
                    disabled
                    readOnly
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-100/90 border border-neutral-300/80 text-neutral-600 font-medium cursor-not-allowed select-none"
                  />
                </div>
              </div>
            </div>

            {/* 2. INFORMATIONS ENTREPRISE & SIRET (Système de vérification) */}
            <div className="bg-white rounded-3xl border border-neutral-200/80 p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                <div>
                  <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-neutral-700" />
                    <span>Entreprise & SIRET (Facturation Professionnelle)</span>
                  </h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Système de vérification officielle INSEE pour les factures adressées à une entreprise.
                  </p>
                </div>

                {user.siretVerified && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                    <Lock className="w-3 h-3 text-emerald-600" />
                    <span>Verrouillé Définitivement</span>
                  </span>
                )}
              </div>

              {user.siretVerified && user.siret ? (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-xs flex items-start gap-2.5 text-emerald-950">
                    <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-semibold">
                        SIRET validé et définitivement associé au compte
                      </strong>
                      <span>
                        Conformément à la réglementation fiscale, vos factures professionnelles sont rattachées de manière immuable à cette entité juridique. Aucune modification manuelle n'est autorisée.
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    {/* Raison Sociale -> GRISÉ / READ ONLY */}
                    <div className="space-y-1">
                      <label className="text-neutral-500 font-semibold flex items-center justify-between">
                        <span>Raison Sociale</span>
                        <span className="text-[10px] text-neutral-400 font-mono">READ ONLY</span>
                      </label>
                      <input
                        type="text"
                        value={user.companyName || ''}
                        disabled
                        readOnly
                        className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-100/90 border border-neutral-300/80 text-neutral-600 font-bold cursor-not-allowed select-none"
                      />
                    </div>

                    {/* SIRET -> GRISÉ / READ ONLY */}
                    <div className="space-y-1">
                      <label className="text-neutral-500 font-semibold flex items-center justify-between">
                        <span>Numéro SIRET (14 chiffres)</span>
                        <span className="text-[10px] text-neutral-400 font-mono">READ ONLY</span>
                      </label>
                      <input
                        type="text"
                        value={user.siret || ''}
                        disabled
                        readOnly
                        className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-100/90 border border-neutral-300/80 text-neutral-600 font-mono font-bold cursor-not-allowed select-none"
                      />
                    </div>

                    {/* TVA Intracommunautaire -> GRISÉ / READ ONLY */}
                    <div className="space-y-1">
                      <label className="text-neutral-500 font-semibold flex items-center justify-between">
                        <span>TVA Intracommunautaire</span>
                        <span className="text-[10px] text-neutral-400 font-mono">READ ONLY</span>
                      </label>
                      <input
                        type="text"
                        value={user.vatNumber || ''}
                        disabled
                        readOnly
                        className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-100/90 border border-neutral-300/80 text-neutral-600 font-mono font-bold cursor-not-allowed select-none"
                      />
                    </div>

                    {/* Forme juridique -> GRISÉ / READ ONLY */}
                    <div className="space-y-1">
                      <label className="text-neutral-500 font-semibold flex items-center justify-between">
                        <span>Forme juridique</span>
                        <span className="text-[10px] text-neutral-400 font-mono">READ ONLY</span>
                      </label>
                      <input
                        type="text"
                        value={user.legalStatus || ''}
                        disabled
                        readOnly
                        className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-100/90 border border-neutral-300/80 text-neutral-600 cursor-not-allowed select-none"
                      />
                    </div>

                    {/* Adresse du siège -> GRISÉ / READ ONLY */}
                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-neutral-500 font-semibold flex items-center justify-between">
                        <span>Adresse officielle du siège social</span>
                        <span className="text-[10px] text-neutral-400 font-mono">READ ONLY</span>
                      </label>
                      <input
                        type="text"
                        value={`${user.companyAddress || ''}, ${user.postalCode || ''} ${user.city || ''}`}
                        disabled
                        readOnly
                        className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-100/90 border border-neutral-300/80 text-neutral-600 cursor-not-allowed select-none"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-5 rounded-2xl bg-neutral-50 border border-neutral-200 text-xs space-y-3">
                  <div className="font-bold text-sm text-neutral-900">
                    Aucune entreprise enregistrée pour le moment
                  </div>
                  <p className="text-neutral-600 leading-relaxed">
                    Si vous avez une entreprise et souhaitez émettre des factures au nom de votre société avec récupération de TVA, effectuez la vérification officielle de votre SIRET.
                  </p>
                  <button
                    type="button"
                    onClick={onOpenSiretModal}
                    className="px-4 py-2.5 rounded-xl bg-black text-white font-bold hover:bg-neutral-800 transition-colors cursor-pointer"
                  >
                    Vérifier une entreprise (SIRET)
                  </button>
                </div>
              )}
            </div>

            {/* 3. CONTACT (TÉLÉPHONE MODIFIABLE & E-MAIL NON MODIFIABLE) */}
            <div className="bg-white rounded-3xl border border-neutral-200/80 p-6 shadow-xs space-y-5">
              <div className="pb-3 border-b border-neutral-100">
                <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                  <Phone className="w-5 h-5 text-neutral-700" />
                  <span>Coordonnées de Contact</span>
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Votre téléphone est modifiable pour les avis de passage du livreur. L'e-mail est verrouillé.
                </p>
              </div>

              <form onSubmit={handleSavePhone} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Email: NON MODIFIABLE */}
                  <div className="space-y-1">
                    <label className="text-neutral-500 font-semibold flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-neutral-400" />
                        <span>Adresse e-mail (Identifiant & Factures)</span>
                      </span>
                      <span className="text-[10px] text-neutral-400 font-mono">NON MODIFIABLE</span>
                    </label>
                    <input
                      type="email"
                      value={user.email}
                      disabled
                      readOnly
                      className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-100 border border-neutral-200 text-neutral-500 cursor-not-allowed"
                    />
                  </div>

                  {/* Phone: MODIFIABLE */}
                  <div className="space-y-1">
                    <label className="text-neutral-700 font-semibold flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-neutral-500" />
                      <span>Numéro de téléphone (Contact livreur)</span>
                    </label>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+33 6 00 00 00 00"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-neutral-400 font-mono text-neutral-900"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div>
                    {phoneSavedSuccess && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 animate-in fade-in">
                        <CheckCircle2 className="w-4 h-4" />
                        Numéro de téléphone mis à jour avec succès !
                      </span>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingPhone}
                    className="px-5 py-2.5 rounded-xl bg-[#0A0D0E] text-white font-bold text-xs hover:bg-neutral-800 transition-all shadow-sm cursor-pointer"
                  >
                    {isSavingPhone ? 'Enregistrement...' : 'Enregistrer le numéro'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: SÉCURITÉ & ACCÈS                                               */}
      {/* ===================================================================== */}
      {activeTab === 'security' && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="bg-white rounded-3xl border border-neutral-200/80 p-6 shadow-xs space-y-5">
            <div className="pb-3 border-b border-neutral-100">
              <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-neutral-700" />
                <span>Modifier le mot de passe</span>
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Pour assurer la sécurité de votre compte et de vos données de facturation, choisissez un mot de passe robuste.
              </p>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-neutral-700 font-semibold">Mot de passe actuel</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-neutral-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-neutral-700 font-semibold">Nouveau mot de passe</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 caractères"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-neutral-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-neutral-700 font-semibold">Confirmer le nouveau mot de passe</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-neutral-400"
                />
              </div>

              {passwordError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-2 text-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              {passwordSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>Votre mot de passe a été modifié avec succès !</span>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#0A0D0E] text-white font-bold text-xs hover:bg-neutral-800 transition-all shadow-sm cursor-pointer"
                >
                  Mettre à jour le mot de passe
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: ZONE DANGEREUSE & SUPPRESSION                                   */}
      {/* ===================================================================== */}
      {activeTab === 'danger' && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="bg-white rounded-3xl border border-red-200/80 p-6 shadow-xs space-y-5">
            <div className="pb-3 border-b border-red-100 flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-red-100 text-red-700">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-red-950">
                  Zone Dangereuse : Suppression du Compte
                </h2>
                <p className="text-xs text-red-700/80 mt-0.5">
                  La suppression de votre compte est irréversible et clôture vos accès.
                </p>
              </div>
            </div>

            <p className="text-xs text-neutral-600 leading-relaxed">
              La suppression de votre compte effacera vos identifiants d'accès. Conformément aux dispositions légales du Code de Commerce et du Code Général des Impôts, les factures déjà émises sont archivées de manière sécurisée et ne peuvent être supprimées.
            </p>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-colors shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Demander la suppression du compte</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMATION DE SUPPRESSION */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 border border-neutral-200">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <div className="flex items-center gap-2 text-red-600 font-bold text-base">
                <AlertTriangle className="w-5 h-5" />
                <span>Confirmation Requise</span>
              </div>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-black cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-neutral-600 leading-relaxed">
              Êtes-vous absolument certain de vouloir supprimer le compte{' '}
              <strong className="text-neutral-900">{user.email}</strong> ? Cette opération est définitive.
            </p>

            <div className="space-y-1.5 text-xs">
              <label className="text-neutral-700 font-medium">
                Veuillez taper <strong className="text-red-600 font-mono">SUPPRIMER</strong> pour confirmer :
              </label>
              <input
                type="text"
                value={deleteConfirmationInput}
                onChange={(e) => setDeleteConfirmationInput(e.target.value)}
                placeholder="SUPPRIMER"
                className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 font-mono text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-600 hover:bg-neutral-100 cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={deleteConfirmationInput !== 'SUPPRIMER'}
                onClick={() => {
                  setShowDeleteModal(false);
                  onDeleteAccount?.();
                }}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                  deleteConfirmationInput === 'SUPPRIMER'
                    ? 'bg-red-600 text-white hover:bg-red-700 shadow-md cursor-pointer'
                    : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                }`}
              >
                Confirmer la suppression
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
