/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */


import { Pack, RenterDetails } from '@/lib/signature-types';
import { useI18n } from '@/lib/i18n';
import { getContractTemplate } from '@/lib/contract-templates';

interface ContractDocumentProps {
  pack: Pack;
  renter: RenterDetails;
  signatureDataUrl: string | null;
  isValidated: boolean;
  companySignatureDataUrl?: string | null;
  projectMode?: 'vente' | 'location';
  rentalPeriod?: { from: Date | string; to: Date | string };
  rentalStartTime?: string | null;
  rentalEndTime?: string | null;
  productImage?: string | null;
  allPacks?: Pack[];
  saleContractTemplate?: string;
  rentalContractTemplate?: string;
  isPdfMode?: boolean;
}

export default function ContractDocument({
  pack,
  renter,
  signatureDataUrl,
  isValidated,
  companySignatureDataUrl,
  projectMode = 'location',
  rentalPeriod,
  rentalStartTime,
  rentalEndTime,
  productImage,
  allPacks,
  saleContractTemplate,
  rentalContractTemplate,
  isPdfMode = false
}: ContractDocumentProps) {
  const { t, locale } = useI18n();
  const contractDate = "29 mai 2026";

  const isVente = projectMode === 'vente';

  const formatRentalDate = (d: Date | string | undefined) => {
    if (!d) return '';
    const date = d instanceof Date ? d : new Date(d);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };
  const rentalFrom = rentalPeriod?.from ? formatRentalDate(rentalPeriod.from) : '';
  const rentalTo = rentalPeriod?.to ? formatRentalDate(rentalPeriod.to) : '';
  const rentalPeriodStr = rentalFrom && rentalTo ? `${rentalFrom} – ${rentalTo}` : '';
  const rentalHours = (rentalStartTime || rentalEndTime) ? `${rentalStartTime || '08:00'}${t('signature.timeTo')}${rentalEndTime || '18:00'}` : '';

  const defaultText = getContractTemplate(projectMode, locale);

  const templateText = isVente
    ? (locale === 'fr' ? (saleContractTemplate || defaultText) : defaultText)
    : (locale === 'fr' ? (rentalContractTemplate || defaultText) : defaultText);

  const fillTemplate = (text: string) => {
    return text
      .replace(/\{\{renter\.company}}/g, renter.company || 'bilama')
      .replace(/\{\{renter\.representative}}/g, renter.representative || t('signature.representativeDefault'))
      .replace(/\{\{renter\.address}}/g, renter.address || t('signature.addressNotProvided'))
      .replace(/\{\{renter\.postcode}}/g, renter.postcode || '75000')
      .replace(/\{\{renter\.city}}/g, renter.city || 'Paris')
      .replace(/\{\{renter\.email}}/g, renter.email || 'contact@client.com')
      .replace(/\{\{renter\.phone}}/g, renter.phone || t('signature.notSpecified'))
      .replace(/\{\{pack\.name}}/g, pack.name)
      .replace(/\{\{pack\.surface}}/g, pack.surface)
      .replace(/\{\{rentalPeriod}}/g, rentalPeriodStr)
      .replace(/\{\{rentalHours}}/g, rentalHours)
      .replace(/\{\{pack\.price}}/g, pack.price.toLocaleString('fr-FR'))
      .replace(/\{\{pack\.deposit}}/g, pack.deposit.toLocaleString('fr-FR'))
      .replace(/\{\{contractDate}}/g, contractDate)
      .replace(/\{\{taxLabel}}/g, 'TTC');
  };

  return (
    <div className="w-full flex flex-col">
      <div
        className={isPdfMode
          ? "w-full text-xs sm:text-sm text-zinc-700 leading-relaxed bg-white p-6"
          : "w-full max-h-[500px] overflow-y-auto border border-zinc-200 rounded-xl bg-zinc-50/40 p-4 sm:p-6 text-xs sm:text-sm text-zinc-700 leading-relaxed custom-scrollbar shadow-inner"
        }
        id={isPdfMode ? undefined : "document-scroll-viewport"}
      >
        <div className={isPdfMode
          ? "max-w-2xl mx-auto bg-white font-sans text-zinc-800"
          : "max-w-2xl mx-auto bg-white border border-zinc-200/80 p-6 sm:p-10 rounded-lg font-sans shadow-md text-zinc-800"
        }>

          <div className="text-center mb-8 border-b border-zinc-100 pb-5">
            <h1 className="text-sm sm:text-base font-bold text-zinc-900 tracking-tight font-heading uppercase leading-snug">
              {t('signature.contractDocTitle')}
            </h1>
            <p className="text-[10px] text-zinc-400 font-mono mt-1.5 tracking-widest uppercase">
              {t('signature.contractDocSubtitle')}
            </p>
          </div>

          <div className="text-[11px] sm:text-xs text-zinc-600 leading-relaxed whitespace-pre-wrap font-mono">
            {fillTemplate(templateText)}
          </div>

          {!isVente ? (
            <div className="mt-10 pt-6 border-t border-zinc-150 text-zinc-700 text-[11px] sm:text-xs">
              <p className="text-center text-zinc-400 mb-6 font-medium">
                {t('signature.contractDocSigned', { date: contractDate })}
              </p>

              <div className="grid grid-cols-2 gap-6 relative font-sans">

                <div className="flex flex-col items-center text-center">
                  <span className="text-zinc-400 font-mono text-[9px] uppercase">
                    {t('signature.forPixiatech')}
                  </span>
                  <strong className="text-zinc-900 mt-1 block font-heading">PIXIATECH (SASU)</strong>

                  <div className="relative w-32 h-24 my-2 flex items-center justify-center bg-zinc-50 rounded-lg border border-zinc-200 overflow-hidden">

                    {companySignatureDataUrl ? (
                      <img
                        src={companySignatureDataUrl}
                        alt="Signature PIXIATECH"
                        className="max-w-full max-h-full object-contain mix-blend-multiply transition-all duration-300"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <>
                        <svg className="absolute w-24 h-12 text-blue-600 opacity-95 stroke-current fill-none stroke-[1.5]" viewBox="0 0 100 50">
                          <path d="M10,25 C20,10 25,45 35,28 C45,10 50,42 62,30 C75,15 80,40 90,25" />
                        </svg>

                        <div className="absolute w-18 h-18 border-2 border-double border-blue-600/50 rounded-full flex flex-col items-center justify-center text-blue-600/75 rotate-12 scale-90 pointer-events-none">
                          <span className="text-[5px] font-bold font-mono tracking-widest uppercase">PIXIATECH</span>
                          <span className="text-[6px] font-extrabold font-sans">ST-OUEN</span>
                          <span className="text-[4px] font-mono">93400 - FRANCE</span>
                        </div>
                      </>
                    )}

                  </div>

                  <div className="text-[8px] text-zinc-400 font-mono leading-tight">
                    PIXIATECH SASU <br />
                    5 Rue La Fontaine <br />
                    93400 Saint-Ouen-sur-Seine <br />
                    RCS Bobigny 993 747 161
                  </div>
                </div>

                <div className="flex flex-col items-center text-center">
                  <span className="text-zinc-400 font-mono text-[9px] uppercase">
                    {t('signature.theClient')}
                  </span>
                  <strong className="text-zinc-900 mt-1 block">{renter.company || 'bilama'}</strong>

                  <div className="relative w-32 h-24 my-2 flex items-center justify-center bg-zinc-50 border border-zinc-200 rounded-lg overflow-hidden">

                    {isValidated && signatureDataUrl ? (
                      <img
                        src={signatureDataUrl}
                        alt={t('signature.clientSignatureAlt')}
                        className="max-w-full max-h-full object-contain mix-blend-multiply transition-all duration-300"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center p-2 text-zinc-400 text-center pointer-events-none select-none">
                        <div className="w-10 h-0.5 border-t border-dashed border-zinc-300 mb-1"></div>
                        <span className="text-[8px] font-mono tracking-wide uppercase">{t('signature.pending')}</span>
                        <span className="text-[7px] text-zinc-400 mt-1 leading-none">{t('signature.completeBelow')}</span>
                      </div>
                    )}

                  </div>

                  <div className="text-[8px] text-zinc-400 font-mono leading-tight">
                    {renter.representative || t('signature.representativeDefault')} <br />
                    <span className="underline text-zinc-400">{renter.email || 'contact@client.com'}</span> <br />
                    {isValidated ? (
                      <span className="text-blue-600 font-semibold">{t('signature.signedElectronically')}</span>
                    ) : (
                      <span className="text-amber-600 font-medium italic">{t('signature.signatureRequired')}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-8 border-t border-zinc-150 pt-3 text-center">
                <span className="text-[8px] text-zinc-400 tracking-wider inline-flex items-center gap-1 bg-zinc-50 border border-zinc-200 px-3 py-1 rounded-full uppercase">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block animate-pulse"></span>
                  {t('signature.certifiedSecure')}
                </span>
              </div>

            </div>
          ) : (
            <div className="mt-8 pt-4 border-t border-zinc-150 text-center text-[10px] text-zinc-400 font-mono">
              {t('signature.contractAccepted')}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
