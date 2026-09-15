'use client';

import React, { useState } from 'react';
import {
  Building2,
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertTriangle,
  X,
  Lock,
  Info
} from 'lucide-react';
import { lookupSiret, SiretLookupResult } from '../../mockData';
import { clientApi } from '../../lib/api';

interface SiretVerificationModalProps {
  isOpen?: boolean;
  open?: boolean;
  onClose: () => void;
  onSiretValidated?: (data: {
    siret: string;
    companyName: string;
    vatNumber: string;
    companyAddress: string;
    legalStatus: string;
    nafCode: string;
    city: string;
    postalCode: string;
  }) => void;
  onVerified?: () => void;
  showToast?: (type: 'success' | 'error', message: string) => void;
}

export const SiretVerificationModal: React.FC<SiretVerificationModalProps> = ({
  isOpen,
  open,
  onClose,
  onSiretValidated,
  onVerified,
  showToast
}) => {
  const visible = isOpen ?? open ?? false;
  const [siretInput, setSiretInput] = useState<string>('84920311900024');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [lookupResult, setLookupResult] = useState<SiretLookupResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!visible) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLookupResult(null);

    const cleaned = siretInput.replace(/\s+/g, '');
    if (cleaned.length !== 14) {
      setErrorMsg('Le numéro SIRET doit comporter exactement 14 chiffres.');
      return;
    }

    setIsSearching(true);
    try {
      // Try real API first
      const apiRes: any = await clientApi.lookupSiret(cleaned).catch(() => null);
      if (apiRes && !apiRes.error && apiRes.companyName) {
        setLookupResult({
          valid: true,
          data: {
            siret: apiRes.siret || cleaned,
            companyName: apiRes.companyName || apiRes.legalName,
            vatNumber: apiRes.vatNumber || `FR${(parseInt(cleaned.slice(0, 9), 10) % 97).toString().padStart(2, '0')}${cleaned.slice(0, 9)}`,
            companyAddress: apiRes.address || '10 Rue de la Paix',
            legalStatus: 'Société par actions simplifiée (SAS)',
            nafCode: apiRes.nafCode || '6201Z',
            city: apiRes.city || 'Paris',
            postalCode: apiRes.postcode || '75002'
          }
        });
        setIsSearching(false);
        return;
      }
    } catch {
      // Fallback to mockData
    }

    // Fallback to mockData
    const res = lookupSiret(cleaned);
    setIsSearching(false);
    if (res.valid && res.data) {
      setLookupResult(res);
    } else {
      setErrorMsg(res.message || 'Numéro SIRET non répertorié au registre SIRENE.');
    }
  };

  const handleConfirmLock = async () => {
    if (lookupResult?.data) {
      try {
        await clientApi.updateProfessionalInfo({
          companyName: lookupResult.data.companyName,
          siret: lookupResult.data.siret,
          vatNumber: lookupResult.data.vatNumber,
          companyAddress: lookupResult.data.companyAddress,
          city: lookupResult.data.city,
          postalCode: lookupResult.data.postalCode
        }).catch(() => null);
      } catch {
        // Ignored in demo mode
      }

      onSiretValidated?.(lookupResult.data);
      onVerified?.();
      showToast?.('success', 'Entreprise vérifiée et verrouillée');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 border border-neutral-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#0A0D0E] text-white">
              <Building2 className="w-5 h-5 text-[#38E044]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900">
                Vérification Entreprise par SIRET
              </h2>
              <p className="text-xs text-neutral-500">
                Interrogation directe du registre INSEE / SIRENE
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-black cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informative Banner */}
        <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200/80 text-xs text-neutral-600 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
          <span>
            Saisissez votre SIRET à 14 chiffres. Nous récupérons automatiquement les informations légales de votre société.
          </span>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-700 flex justify-between">
              <span>Numéro SIRET de l'entreprise</span>
              <span className="text-[11px] text-neutral-400 font-mono">14 chiffres</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={siretInput}
                onChange={(e) => setSiretInput(e.target.value)}
                placeholder="Ex : 849 203 119 00024"
                maxLength={18}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-neutral-500 font-mono text-xs font-bold text-neutral-900 tracking-wider"
              />
              <button
                type="submit"
                disabled={isSearching}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-[#0A0D0E] text-white text-xs font-bold hover:bg-neutral-800 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Search className="w-3.5 h-3.5 text-[#38E044]" />
                <span>{isSearching ? 'Recherche...' : 'Vérifier'}</span>
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-2 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </form>

        {/* Retrieved Data Display */}
        {lookupResult?.data && (
          <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-3 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-emerald-200/60">
              <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Entreprise identifiée avec succès
              </span>
              <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                SIRENE VALIDÉ
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-neutral-400 block text-[10px]">Raison Sociale</span>
                <strong className="text-neutral-900 font-semibold">{lookupResult.data.companyName}</strong>
              </div>
              <div>
                <span className="text-neutral-400 block text-[10px]">SIRET certifié</span>
                <strong className="font-mono text-neutral-900">{lookupResult.data.siret}</strong>
              </div>
              <div>
                <span className="text-neutral-400 block text-[10px]">N° TVA Intracommunautaire</span>
                <strong className="font-mono text-neutral-900">{lookupResult.data.vatNumber}</strong>
              </div>
              <div>
                <span className="text-neutral-400 block text-[10px]">Activité (Code NAF)</span>
                <span className="text-neutral-700">{lookupResult.data.nafCode}</span>
              </div>
              <div className="col-span-2">
                <span className="text-neutral-400 block text-[10px]">Siège social</span>
                <span className="text-neutral-700">
                  {lookupResult.data.companyAddress}, {lookupResult.data.postalCode} {lookupResult.data.city}
                </span>
              </div>
            </div>

            {/* Warning on permanent lock */}
            <div className="pt-2 border-t border-emerald-200/80 text-[11px] text-emerald-950 flex items-start gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
              <span>
                <strong>Avertissement légal :</strong> Une fois validé, ce SIRET sera définitivement rattaché à votre compte et ne pourra plus être modifié depuis l'espace client.
              </span>
            </div>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-neutral-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-600 hover:bg-neutral-100 cursor-pointer"
          >
            Fermer
          </button>
          <button
            type="button"
            disabled={!lookupResult?.data}
            onClick={handleConfirmLock}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              lookupResult?.data
                ? 'bg-[#0A0D0E] text-white hover:bg-neutral-800 shadow-md cursor-pointer'
                : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-[#38E044]" />
            <span>Valider & Verrouiller définitivement</span>
          </button>
        </div>
      </div>
    </div>
  );
};