'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Building2, CheckCircle2, Info, Loader2, Lock, Search, X } from 'lucide-react';
import { clientApi } from '../../lib/api';

interface SiretVerificationModalProps {
  open: boolean;
  onClose: () => void;
  onVerified: () => void;
  showToast: (type: 'success' | 'error', message: string) => void;
}

interface CompanyResult {
  companyName: string;
  legalName: string;
  siren: string;
  siret: string;
  vatNumber: string;
  address: string;
  addressDetail: string;
  city: string;
  state: string;
  department: string;
  postcode: string;
  country: string;
  active: boolean;
  createdAt: string;
  nafCode: string;
}

export function SiretVerificationModal({ open, onClose, onVerified, showToast }: SiretVerificationModalProps) {
  const [siret, setSiret] = useState('');
  const [step, setStep] = useState<'input' | 'result'>('input');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<CompanyResult | null>(null);

  async function lookUp() {
    const clean = siret.replace(/\s+/g, '');
    if (!/^\d{14}$/.test(clean)) {
      showToast('error', 'Saisissez un numéro SIRET valide à 14 chiffres.');
      return;
    }
    setLoading(true);
    try {
      const res = await clientApi.lookupSiret(clean);
      if ((res as { error?: string }).error) {
        showToast('error', (res as { error: string }).error);
        return;
      }
      setResult(res as unknown as CompanyResult);
      setStep('result');
    } catch (err: any) {
      showToast('error', err.message || 'Impossible de vérifier le SIRET.');
    } finally {
      setLoading(false);
    }
  }

  async function confirm() {
    if (!result) return;
    setSaving(true);
    try {
      await clientApi.verifySiret({
        siret: result.siret,
        companyName: result.companyName || result.legalName,
        address: result.address,
        postcode: result.postcode,
        city: result.city,
        country: result.country,
        vatNumber: result.vatNumber,
        nafCode: result.nafCode,
        state: result.state,
      });
      showToast('success', 'Votre SIRET a été vérifié avec succès.');
      onVerified();
      onClose();
      setStep('input');
      setSiret('');
      setResult(null);
    } catch (err: any) {
      showToast('error', err.message || "Impossible d'enregistrer la vérification.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-xs sm:items-center sm:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl border border-neutral-200 bg-white shadow-2xl sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-neutral-100 p-5 pb-3">
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[#0A0D0E] text-white">
                  <Building2 className="size-5 text-[#38E044]" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-neutral-900">Vérification Entreprise par SIRET</h2>
                  <p className="text-xs text-neutral-500">Interrogation directe du registre INSEE / SIRENE</p>
                </div>
              </div>
              <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-neutral-400 transition hover:bg-neutral-100 hover:text-black" aria-label="Fermer">
                <X className="size-5" />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              <div className="flex items-start gap-2.5 rounded-2xl border border-neutral-200/80 bg-neutral-50 p-3.5 text-xs text-neutral-600">
                <Info className="mt-0.5 size-4 shrink-0 text-neutral-500" />
                <span>
                  Saisissez votre SIRET à 14 chiffres. Nous récupérons automatiquement les informations légales de votre société.
                </span>
              </div>

              {step === 'input' && (
                <div className="space-y-1.5">
                  <label className="flex items-center justify-between text-xs font-semibold text-neutral-700">
                    <span>Numéro SIRET de l'entreprise</span>
                    <span className="font-mono text-[11px] font-normal text-neutral-400">14 chiffres</span>
                  </label>
                  <div className="relative">
                    <input
                      value={siret}
                      onChange={(e) => setSiret(e.target.value.replace(/[^\d]/g, ''))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') lookUp();
                      }}
                      placeholder="Ex : 849 203 119 00024"
                      maxLength={14}
                      inputMode="numeric"
                      className="w-full rounded-xl border border-neutral-300 px-3.5 py-2.5 text-sm font-bold tracking-wider text-neutral-900 outline-none transition focus:border-neutral-500 focus:ring-2 focus:ring-black/10"
                    />
                    <button
                      type="button"
                      onClick={lookUp}
                      disabled={loading}
                      className="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center gap-1.5 rounded-lg bg-[#0A0D0E] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-neutral-800 disabled:opacity-50"
                    >
                      {loading ? <Loader2 className="size-3.5 animate-spin text-[#38E044]" /> : <Search className="size-3.5 text-[#38E044]" />}
                      <span>{loading ? 'Recherche…' : 'Vérifier'}</span>
                    </button>
                  </div>
                </div>
              )}

              {step === 'result' && result && (
                <div className="space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4">
                  <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                      <CheckCircle2 className="size-4 text-emerald-600" />
                      Entreprise identifiée avec succès
                    </span>
                    <span className="rounded bg-emerald-100 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-800">SIRENE VALIDÉ</span>
                  </div>

                  <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
                    <div>
                      <span className="block text-[10px] text-neutral-400">Raison Sociale</span>
                      <strong className="font-semibold text-neutral-900">{result.companyName || result.legalName}</strong>
                    </div>
                    <div>
                      <span className="block text-[10px] text-neutral-400">SIRET certifié</span>
                      <strong className="font-mono text-neutral-900">{result.siret} · SIREN {result.siren}</strong>
                    </div>
                    <div>
                      <span className="block text-[10px] text-neutral-400">N° TVA Intracommunautaire</span>
                      <strong className="font-mono text-neutral-900">{result.vatNumber || 'Non renseigné'}</strong>
                    </div>
                    <div>
                      <span className="block text-[10px] text-neutral-400">Activité (Code NAF)</span>
                      <span className="text-neutral-700">{result.nafCode || 'Non renseigné'}</span>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="block text-[10px] text-neutral-400">Siège social</span>
                      <span className="text-neutral-700">
                        {result.address} {result.postcode} {result.city}
                        {result.department ? ` · ${result.department}` : ''}
                      </span>
                    </div>
                    {result.active !== undefined && (
                      <div className="sm:col-span-2">
                        <span className="mr-2 text-[10px] text-neutral-400">Statut</span>
                        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${result.active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                          {result.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-start gap-1.5 border-t border-emerald-200/80 pt-2 text-[11px] text-emerald-950">
                    <Lock className="mt-0.5 size-3.5 shrink-0 text-emerald-700" />
                    <span>
                      <strong>Avertissement légal :</strong> une fois vérifié, ce SIRET sera rattaché à votre compte pour la facturation B2B et le taux de TVA applicable.
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 border-t border-neutral-100 p-4">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-neutral-600 transition hover:bg-neutral-100 disabled:opacity-40"
              >
                Fermer
              </button>
              {step === 'result' && result ? (
                <>
                  <button
                    type="button"
                    onClick={() => setStep('input')}
                    disabled={saving}
                    className="rounded-xl px-4 py-2 text-xs font-semibold text-neutral-600 transition hover:bg-neutral-100 disabled:opacity-40"
                  >
                    Modifier
                  </button>
                  <button
                    type="button"
                    onClick={confirm}
                    disabled={saving}
                    className="flex items-center gap-2 rounded-xl bg-[#0A0D0E] px-5 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-neutral-800 disabled:opacity-50"
                  >
                    {saving && <Loader2 className="size-3.5 animate-spin text-[#38E044]" />}
                    <Lock className="size-3.5 text-[#38E044]" />
                    Confirmer la vérification
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={lookUp}
                  disabled={loading}
                  className="flex items-center gap-2 rounded-xl bg-[#0A0D0E] px-5 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-neutral-800 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="size-3.5 animate-spin text-[#38E044]" /> : <Search className="size-3.5 text-[#38E044]" />}
                  Vérifier mon SIRET
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}