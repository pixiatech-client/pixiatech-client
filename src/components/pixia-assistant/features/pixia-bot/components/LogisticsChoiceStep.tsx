'use client';

import { AlertTriangle, ArrowRight, Layers, Truck } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { t } from '../../../core/i18n/translations';
import { resolveDestination } from '../../../core/pricing/pricing-engine';
import type { BootstrapPayload, Language } from '../../../core/types';

interface DeliveryChoiceStepProps {
  lang: Language;
  deliveryCity: string;
  bootstrap: BootstrapPayload;
  initialValue?: boolean | null;
  onExpandChange?: () => void;
  onConfirm: (includeDelivery: boolean) => void;
}

export function DeliveryChoiceStep({
  lang,
  deliveryCity,
  bootstrap,
  initialValue = null,
  onExpandChange,
  onConfirm,
}: DeliveryChoiceStepProps) {
  const [selected, setSelected] = useState<boolean | null>(initialValue);

  const destination = resolveDestination(deliveryCity, bootstrap.locations.villes);
  const matchedZone = destination.zoneId
    ? bootstrap.deliverySettings.zones.find((z) => z.id === destination.zoneId)
    : undefined;
  const hasConfiguredDeliveryRate = Boolean(
    destination.matched &&
      matchedZone &&
      typeof matchedZone.baseCost === 'number' &&
      Number.isFinite(matchedZone.baseCost)
  );

  const handleSelect = (val: boolean) => {
    setSelected(val);
    onExpandChange?.();
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-[#202025] p-3.5 space-y-3">
      <div className="flex items-start gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[#38BDF8]/35 bg-[#132234] text-[#38BDF8]">
          <Truck className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-white">
            {lang === 'fr' ? 'Livraison' : 'Delivery'}
          </p>
          <p className="text-xs text-[#9E9EA7] leading-snug">
            {lang === 'fr'
              ? 'Souhaitez-vous que PixiaTech assure la livraison ?'
              : 'Would you like PixiaTech to handle delivery?'}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {/* Option: Oui, inclure la livraison */}
        <button
          type="button"
          onClick={() => handleSelect(true)}
          className={`w-full rounded-xl border p-3 text-left transition-all cursor-pointer ${
            selected === true
              ? hasConfiguredDeliveryRate
                ? 'border-[#38BDF8]/80 bg-[#142030] shadow-[0_0_18px_rgba(56,189,248,0.16)]'
                : 'border-[#F59E0B]/85 bg-[#241C12] shadow-[0_0_18px_rgba(245,158,11,0.16)]'
              : 'border-white/10 bg-[#151519] hover:border-white/25'
          }`}
        >
          <div className="flex items-start justify-between gap-2.5">
            <div className="min-w-0 space-y-0.5">
              <p className="text-[13px] font-semibold text-white">
                {lang === 'fr' ? 'Oui, inclure la livraison' : 'Yes, include delivery'}
              </p>
              <p className="text-[11.5px] text-[#9E9EA7]">
                {lang === 'fr' ? 'Nous livrons et installons.' : 'We deliver and set up.'}
              </p>
            </div>
            <span
              aria-hidden="true"
              className={`mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                selected === true
                  ? hasConfiguredDeliveryRate
                    ? 'border-[#38BDF8] bg-[#38BDF8]/20'
                    : 'border-[#F59E0B] bg-[#F59E0B]/20'
                  : 'border-white/25'
              }`}
            >
              {selected === true && (
                <span
                  className={`h-2 w-2 rounded-full ${
                    hasConfiguredDeliveryRate ? 'bg-[#38BDF8]' : 'bg-[#F59E0B]'
                  }`}
                />
              )}
            </span>
          </div>

          <AnimatePresence initial={false}>
            {selected === true && !hasConfiguredDeliveryRate && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <div className="mt-2.5 pt-2.5 border-t border-[#F59E0B]/30 text-[11.5px] font-medium leading-relaxed text-[#FCD34D]">
                  {lang === 'fr'
                    ? 'La ville sélectionnée n’a pas encore de tarif de livraison configuré. Un tarif personnalisé vous sera communiqué après vérification.'
                    : 'The selected city does not have a configured delivery rate yet. A custom rate will be communicated after verification.'}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </button>

        {/* Option: Non, pas de livraison */}
        <button
          type="button"
          onClick={() => handleSelect(false)}
          className={`w-full rounded-xl border p-3 text-left transition-all cursor-pointer ${
            selected === false
              ? 'border-[#38BDF8]/80 bg-[#142030] shadow-[0_0_18px_rgba(56,189,248,0.16)]'
              : 'border-white/10 bg-[#151519] hover:border-white/25'
          }`}
        >
          <div className="flex items-start justify-between gap-2.5">
            <div className="min-w-0 space-y-0.5">
              <p className="text-[13px] font-semibold text-white">
                {lang === 'fr' ? 'Non, pas de livraison' : 'No, no delivery'}
              </p>
              <p className="text-[11.5px] text-[#9E9EA7]">
                {lang === 'fr'
                  ? 'Vous vous chargez de la récupération.'
                  : 'You will handle pickup yourself.'}
              </p>
            </div>
            <span
              aria-hidden="true"
              className={`mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                selected === false ? 'border-[#38BDF8] bg-[#38BDF8]/20' : 'border-white/25'
              }`}
            >
              {selected === false && <span className="h-2 w-2 rounded-full bg-[#38BDF8]" />}
            </span>
          </div>
        </button>
      </div>

      <button
        type="button"
        disabled={selected === null}
        onClick={() => {
          if (selected !== null) onConfirm(selected);
        }}
        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-[#141416] hover:bg-[#E4E4E7] disabled:bg-white/20 disabled:text-white/40 transition-colors cursor-pointer min-h-[42px]"
      >
        <span>{t(lang, 'ui.continue')}</span>
        <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

interface InstallationChoiceStepProps {
  lang: Language;
  initialValue?: boolean | null;
  onExpandChange?: () => void;
  onConfirm: (includeInstallation: boolean) => void;
}

export function InstallationChoiceStep({
  lang,
  initialValue = null,
  onExpandChange,
  onConfirm,
}: InstallationChoiceStepProps) {
  const [selected, setSelected] = useState<boolean | null>(initialValue);

  const handleSelect = (val: boolean) => {
    setSelected(val);
    onExpandChange?.();
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-[#202025] p-3.5 space-y-3">
      <div className="flex items-start gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[#818CF8]/35 bg-[#1B1D36] text-[#93C5FD]">
          <Layers className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-white">
              {lang === 'fr' ? 'Installation' : 'Installation'}
            </p>
            <span className="rounded-md bg-[#0F2A1F] border border-[#34D399]/35 px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-[#34D399]">
              {lang === 'fr' ? 'Recommandé' : 'Recommended'}
            </span>
          </div>
          <p className="text-xs text-[#9E9EA7] leading-snug mt-0.5">
            {lang === 'fr'
              ? 'Souhaitez-vous inclure l’installation par nos techniciens ?'
              : 'Would you like to include installation by our technicians?'}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {/* Option: Oui, inclure l'installation */}
        <button
          type="button"
          onClick={() => handleSelect(true)}
          className={`w-full rounded-xl border p-3 text-left transition-all cursor-pointer ${
            selected === true
              ? 'border-[#38BDF8]/80 bg-[#142030] shadow-[0_0_18px_rgba(56,189,248,0.16)]'
              : 'border-white/10 bg-[#151519] hover:border-white/25'
          }`}
        >
          <div className="flex items-start justify-between gap-2.5">
            <div className="min-w-0 space-y-0.5">
              <p className="text-[13px] font-semibold text-white">
                {lang === 'fr' ? 'Oui, inclure l’installation' : 'Yes, include installation'}
              </p>
              <p className="text-[11.5px] text-[#9E9EA7]">
                {lang === 'fr'
                  ? 'Nos experts s’occupent de tout.'
                  : 'Our experts take care of everything.'}
              </p>
            </div>
            <span
              aria-hidden="true"
              className={`mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                selected === true ? 'border-[#38BDF8] bg-[#38BDF8]/20' : 'border-white/25'
              }`}
            >
              {selected === true && <span className="h-2 w-2 rounded-full bg-[#38BDF8]" />}
            </span>
          </div>
        </button>

        {/* Option: Non, je m'en occupe */}
        <button
          type="button"
          onClick={() => handleSelect(false)}
          className={`w-full rounded-xl border p-3 text-left transition-all cursor-pointer ${
            selected === false
              ? 'border-[#38BDF8]/80 bg-[#142030] shadow-[0_0_18px_rgba(56,189,248,0.16)]'
              : 'border-white/10 bg-[#151519] hover:border-white/25'
          }`}
        >
          <div className="flex items-start justify-between gap-2.5">
            <div className="min-w-0 space-y-0.5">
              <p className="text-[13px] font-semibold text-white">
                {lang === 'fr' ? 'Non, je m’en occupe' : 'No, I’ll handle it'}
              </p>
              <p className="text-[11.5px] text-[#9E9EA7]">
                {lang === 'fr'
                  ? 'Vous gérez l’installation vous-même.'
                  : 'You manage the installation yourself.'}
              </p>
            </div>
            <span
              aria-hidden="true"
              className={`mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                selected === false ? 'border-[#38BDF8] bg-[#38BDF8]/20' : 'border-white/25'
              }`}
            >
              {selected === false && <span className="h-2 w-2 rounded-full bg-[#38BDF8]" />}
            </span>
          </div>
        </button>

        {/* Warning Box when Non, je m'en occupe is selected */}
        <AnimatePresence initial={false}>
          {selected === false && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -4 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -4 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="rounded-xl border border-[#EF4444]/40 bg-[#2A1215]/80 p-3 flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 shrink-0 text-[#FB7185] mt-0.5" />
                <div className="space-y-0.5 text-[11.5px] leading-relaxed">
                  <p className="font-bold uppercase tracking-wide text-[#FDA4AF]">
                    {lang === 'fr' ? 'Attention' : 'Warning'}
                  </p>
                  <p className="text-[#FECDD3]/90">
                    {lang === 'fr'
                      ? 'L’entreprise PIXIATECH décline toute responsabilité en cas de problème lié à une installation non effectuée par ses techniciens.'
                      : 'PIXIATECH declines all liability for any issue resulting from an installation not carried out by its technicians.'}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <button
        type="button"
        disabled={selected === null}
        onClick={() => {
          if (selected !== null) onConfirm(selected);
        }}
        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-[#141416] hover:bg-[#E4E4E7] disabled:bg-white/20 disabled:text-white/40 transition-colors cursor-pointer min-h-[42px]"
      >
        <span>{t(lang, 'ui.continue')}</span>
        <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
