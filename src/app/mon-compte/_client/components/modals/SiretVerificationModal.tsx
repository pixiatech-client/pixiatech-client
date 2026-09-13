'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Building2, CheckCircle2, Loader2, X } from 'lucide-react';
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
      showToast('error', 'Saisissez un numÃ©ro SIRET valide Ã  14 chiffres.');
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
      showToast('error', err.message || 'Impossible de vÃ©rifier le SIRET.');
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
      showToast('success', 'Votre SIRET a Ã©tÃ© vÃ©rifiÃ© avec succÃ¨s.');
      onVerified();
      onClose();
      setStep('input');
      setSiret('');
      setResult(null);
    } catch (err: any) {
      showToast('error', err.message || "Impossible d'enregistrer la vÃ©rification.");
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
            className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-neutral-900">VÃ©rifier mon SIRET</h2>
                <p className="mt-0.5 text-sm text-neutral-500">
                  Nous vÃ©rifions votre entreprise auprÃ¨s de la base officielle (INSEE / Recherche Entreprises).
                </p>
              </div>
              <button type="button" onClick={onClose} className="rounded-xl p-2 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700" aria-label="Fermer">
                <X size={20} />
              </button>
            </div>

            {step === 'input' && (
              <div className="mt-5 space-y-4">
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-neutral-500">NumÃ©ro SIRET</span>
                  <input
                    value={siret}
                    onChange={(e) => setSiret(e.target.value.replace(/[^\d]/g, ''))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') lookUp();
                    }}
                    placeholder="000 000 000 00000"
                    maxLength={14}
                    inputMode="numeric"
                    className="w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-3 text-base font-semibold tracking-widest outline-none transition focus:border-neutral-400"
                  />
                </label>
                <button
                  type="button"
                  onClick={lookUp}
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0A0D0E] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                >
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  VÃ©rifier
                </button>
              </div>
            )}

            {step === 'result' && result && (
              <div className="mt-5 space-y-4">
                <div className="overflow-hidden rounded-2xl border border-emerald-100">
                  <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-700">
                    <CheckCircle2 size={15} /> Entreprise trouvÃ©e â€” SIRET valide
                  </div>
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#0A0D0E] text-white">
                        <Building2 size={20} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-base font-extrabold text-neutral-900">{result.companyName || result.legalName}</p>
                        <p className="text-xs text-neutral-500">SIRET {result.siret} Â· SIREN {result.siren}</p>
                        {result.vatNumber && (
                          <p className="mt-0.5 text-xs text-neutral-500">NÂ° TVA : {result.vatNumber}</p>
                        )}
                      </div>
                      {result.active ? (
                        <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">Active</span>
                      ) : (
                        <span className="shrink-0 rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-semibold text-red-600">Inactive</span>
                      )}
                    </div>
                    <dl className="mt-3 space-y-1.5 border-t border-neutral-100 pt-3 text-xs">
                      <div className="flex justify-between gap-3">
                        <dt className="text-neutral-400">Adresse</dt>
                        <dd className="text-right font-medium text-neutral-800">
                          {result.address} {result.postcode} {result.city}
                        </dd>
                      </div>
                      {result.department && (
                        <div className="flex justify-between gap-3">
                          <dt className="text-neutral-400">DÃ©partement</dt>
                          <dd className="font-medium text-neutral-800">{result.department}</dd>
                        </div>
                      )}
                      {result.state && (
                        <div className="flex justify-between gap-3">
                          <dt className="text-neutral-400">RÃ©gion</dt>
                          <dd className="font-medium text-neutral-800">{result.state}</dd>
                        </div>
                      )}
                      {result.nafCode && (
                        <div className="flex justify-between gap-3">
                          <dt className="text-neutral-400">ActivitÃ© principale</dt>
                          <dd className="font-medium text-neutral-800">{result.nafCode}</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep('input')}
                    disabled={saving}
                    className="rounded-xl border border-neutral-200 px-4 py-3 text-sm font-semibold text-neutral-600 transition hover:bg-neutral-50 disabled:opacity-40"
                  >
                    Modifier
                  </button>
                  <button
                    type="button"
                    onClick={confirm}
                    disabled={saving}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#0A0D0E] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                  >
                    {saving && <Loader2 size={16} className="animate-spin" />}
                    Confirmer la vÃ©rification
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}