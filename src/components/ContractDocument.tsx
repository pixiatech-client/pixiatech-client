/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Pack, RenterDetails } from '@/lib/signature-types';

interface ContractDocumentProps {
  pack: Pack;
  renter: RenterDetails;
  signatureDataUrl: string | null;
  isValidated: boolean;
  projectMode?: 'vente' | 'location';
  rentalPeriod?: { from: Date | string; to: Date | string };
  rentalStartTime?: string | null;
  rentalEndTime?: string | null;
  productImage?: string | null;
  allPacks?: Pack[];
  saleContractTemplate?: string;
  rentalContractTemplate?: string;
}

export default function ContractDocument({
  pack,
  renter,
  signatureDataUrl,
  isValidated,
  projectMode = 'location',
  rentalPeriod,
  rentalStartTime,
  rentalEndTime,
  productImage,
  allPacks,
  saleContractTemplate,
  rentalContractTemplate
}: ContractDocumentProps) {
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
  const rentalHours = (rentalStartTime || rentalEndTime) ? `${rentalStartTime || '08:00'} à ${rentalEndTime || '18:00'}` : '';

  const defaultRentalText = [
    'CONDITIONS GÉNÉRALES DE VENTE, DE SERVICES ET DE LOCATION (CGV/CGL)',
    'PIXIATECH • France • Dernière mise à jour : 30/11/2025',
    '',
    'ENTRE LES SOUSSIGNÉ(E)S :',
    'La société PIXIATECH, SASU, 5 Rue La Fontaine, 93400 Saint-Ouen-sur-Seine, FRANCE, RCS Bobigny 993 747 161, TVA FR39993747161, contact@pixiatech.com / 07 56 81 66 26, ci-après « PIXIATECH » ou le « Bailleur ».',
    '',
    "D'UNE PART,",
    '',
    'Le client, ci-après « le Client » ou « le Preneur ».',
    '',
    "D'AUTRE PART,",
    '',
    'PIXIATECH et le Client sont collectivement dénommés les « Parties ».',
    '',
    'RÉCAPITULATIF DE LA LOCATION DE MATÉRIEL :',
    '- Matériel loué : {{pack.name}} • Surface : {{pack.surface}}',
    '- Période de location : {{rentalPeriod}}',
    '- Horaires : {{rentalHours}}',
    "- Coût de la période : {{pack.price}}€ TTC (Sans engagement de durée)",
    '- Dépôt de garantie requis (Caution) : {{pack.deposit}}€ TTC',
    '',
    'IL A ÉTÉ EXPOSÉ ET CONVENU CE QUI SUIT :',
    '',
    'ARTICLE 1 – PRÉSENTATION ET CHAMP D\'APPLICATION',
    'Les présentes conditions générales régissent l\'ensemble des relations commerciales (vente, prestation de service, location) entre la société PIXIATECH (ci-après « PIXIATECH ») et ses clients (ci-après « le Client »), qu\'ils soient professionnels ou consommateurs.',
    '',
    '• Dénomination : PIXIATECH (SASU)',
    '• Siège social : 5 Rue La Fontaine, 93400 Saint-Ouen-sur-Seine, FRANCE.',
    '• RCS : Bobigny 993 747 161',
    '• TVA Intracommunautaire : FR39993747161',
    '• Contact E-Mail : contact@pixiatech.com',
    '• Contact Téléphone : 07 56 81 66 26',
    '',
    'La validation de toute commande implique l\'adhésion entière et sans réserve aux présentes conditions.',
    '',
    'ARTICLE 2 – VENTE : PRODUITS ET MODÈLE LOGISTIQUE',
    'Les caractéristiques des produits sont indiquées sur le site ou le devis. PIXIATECH fonctionne en flux tendu. Certains produits sont expédiés directement depuis les entrepôts de fabrication partenaires.',
    '',
    'ARTICLE 3 – PRIX',
    'Les prix sont indiqués en Euros.',
    '- Particuliers : prix TTC.',
    '- Professionnels : prix HT.',
    '',
    'ARTICLE 4 – PAIEMENT (VENTE ET PRESTATION)',
    '4.1 Commandes en ligne : Paiement 100 % exigible au jour de la commande.',
    '4.2 Commandes sur devis (B2B) : Acompte : 60 % à la signature. Solde : 40 % avant expédition.',
    '',
    'ARTICLE 5 – LIVRAISON ET DOUANES',
    '5.1 Délais : Les délais sont indicatifs.',
    '5.2 Douanes : Particuliers : Mode DDP = aucun frais supplémentaire. Professionnels : Droits de douane et TVA à l\'importation à la charge du client.',
    '',
    'ARTICLE 6 – DROIT DE RÉTRACTATION',
    '6.1 Particuliers : Délai : 14 jours.',
    '6.2 Professionnels : Pas de rétractation en B2B. Commande ferme.',
    '',
    'ARTICLE 7 – PRESTATION D\'INSTALLATION',
    '7.1 Périmètre : Installation disponible dans un rayon de 150 km.',
    '7.2 Réception : Un Bon de Réception marque la fin de l\'installation.',
    "7.3 Installation par le Client : PIXIATECH décline toute responsabilité.",
    '',
    'ARTICLE 8 – LOCATION',
    '8.1 Retard : Pénalité : 200 % du tarif/jour.',
    '8.2 Caution : Caution encaissable en cas de dommages ou perte.',
    '8.3 Assurance : Le client est gardien juridique du matériel loué.',
    '8.4 Montage / Démontage : Accès garanti par le client.',
    '',
    'ARTICLE 9 – GARANTIES',
    '- Particuliers : 2 ans de garantie légale.',
    '- Professionnels : Garantie constructeur (pièces uniquement).',
    '',
    'ARTICLE 10 – LIMITATION DE RESPONSABILITÉ',
    'En B2B, responsabilité plafonnée au montant de la commande.',
    '',
    'ARTICLE 11 – DONNÉES PERSONNELLES',
    'Données utilisées pour traiter la commande. Conformité RGPD.',
    '',
    'ARTICLE 12 – DROIT APPLICABLE ET LITIGES',
    '- Particuliers : juridiction du défendeur ou médiation.',
    '- Professionnels : Tribunal de Commerce de Bobigny.',
    '',
    'Fait à Saint-Ouen-sur-Seine, le {{contractDate}}, en version électronique certifiée.',
    '',
    'Pour PIXIATECH (Bailleur)',
    'PIXIATECH (SASU)',
    '5 Rue La Fontaine, 93400 Saint-Ouen-sur-Seine',
    'RCS Bobigny 993 747 161',
    '',
    'Le Client (Preneur)',
    '{{renter.company}}',
    '{{renter.representative}}',
    '{{renter.email}}',
  ].join('\n');

  const defaultSaleText = [
    'CONDITIONS GÉNÉRALES DE VENTE, DE SERVICES ET DE LOCATION (CGV/CGL)',
    'PIXIATECH • France • Dernière mise à jour : 30/11/2025',
    '',
    'ARTICLE 1 – PRÉSENTATION ET CHAMP D\'APPLICATION',
    'Les présentes conditions générales régissent l\'ensemble des relations commerciales...',
    '',
    'ARTICLE 2 – PRIX',
    'Les prix sont indiqués en Euros. Particuliers : prix TTC. Professionnels : prix HT.',
    '',
    'ARTICLE 3 – PAIEMENT',
    'Paiement 100 % exigible au jour de la commande.',
    '',
    'ARTICLE 4 – LIVRAISON ET DOUANES',
    'Les délais sont indicatifs.',
    '',
    'ARTICLE 5 – DROIT DE RÉTRACTATION',
    'Particuliers : 14 jours. Professionnels : Pas de rétractation.',
    '',
    'ARTICLE 6 – GARANTIES',
    'Particuliers : 2 ans. Professionnels : Garantie constructeur (pièces).',
    '',
    'ARTICLE 7 – DONNÉES PERSONNELLES',
    'Conformité RGPD.',
    '',
    'ARTICLE 8 – DROIT APPLICABLE ET LITIGES',
    'Tribunal de Commerce de Bobigny.',
    '',
    'Considéré comme accepté suite à la validation du consentement de traitement des données commerciales.',
  ].join('\n');

  const templateText = isVente ? (saleContractTemplate || defaultSaleText) : (rentalContractTemplate || defaultRentalText);

  const fillTemplate = (text: string) => {
    return text
      .replace(/\{\{renter\.company}}/g, renter.company || 'bilama')
      .replace(/\{\{renter\.representative}}/g, renter.representative || 'Un représentant')
      .replace(/\{\{renter\.address}}/g, renter.address || 'Adresse non renseignée')
      .replace(/\{\{renter\.postcode}}/g, renter.postcode || '75000')
      .replace(/\{\{renter\.city}}/g, renter.city || 'Paris')
      .replace(/\{\{renter\.email}}/g, renter.email || 'contact@client.com')
      .replace(/\{\{renter\.phone}}/g, renter.phone || 'Non spécifié')
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
        className="w-full max-h-[500px] overflow-y-auto border border-zinc-200 rounded-xl bg-zinc-50/40 p-4 sm:p-6 text-xs sm:text-sm text-zinc-700 leading-relaxed custom-scrollbar shadow-inner"
        id="document-scroll-viewport"
      >
        <div className="max-w-2xl mx-auto bg-white border border-zinc-200/80 p-6 sm:p-10 rounded-lg font-sans shadow-md text-zinc-800">
          
          <div className="text-center mb-8 border-b border-zinc-100 pb-5">
            <h1 className="text-sm sm:text-base font-bold text-zinc-900 tracking-tight font-heading uppercase leading-snug">
              CONDITIONS GÉNÉRALES DE VENTE, DE SERVICES ET DE LOCATION (CGV/CGL)
            </h1>
            <p className="text-[10px] text-zinc-400 font-mono mt-1.5 tracking-widest uppercase">
              PIXIATECH • France • Dernière mise à jour : 30/11/2025
            </p>
          </div>

          <div className="text-[11px] sm:text-xs text-zinc-600 leading-relaxed whitespace-pre-wrap font-mono">
            {fillTemplate(templateText)}
          </div>

          {!isVente ? (
            <div className="mt-10 pt-6 border-t border-zinc-150 text-zinc-700 text-[11px] sm:text-xs">
              <p className="text-center text-zinc-400 mb-6 font-medium">
                Fait à Saint-Ouen-sur-Seine, le <span className="text-zinc-950 font-bold">{contractDate}</span>, en version électronique certifiée.
              </p>

              <div className="grid grid-cols-2 gap-6 relative font-sans">
                
                <div className="flex flex-col items-center text-center">
                  <span className="text-zinc-400 font-mono text-[9px] uppercase">
                    Pour PIXIATECH (Bailleur)
                  </span>
                  <strong className="text-zinc-900 mt-1 block font-heading">PIXIATECH (SASU)</strong>
                  
                  <div className="relative w-32 h-24 my-2 flex items-center justify-center bg-zinc-50 rounded-lg border border-zinc-200 overflow-hidden">
                    
                    <svg className="absolute w-24 h-12 text-blue-600 opacity-95 stroke-current fill-none stroke-[1.5]" viewBox="0 0 100 50">
                      <path d="M10,25 C20,10 25,45 35,28 C45,10 50,42 62,30 C75,15 80,40 90,25" />
                    </svg>
                    
                    <div className="absolute w-18 h-18 border-2 border-double border-blue-600/50 rounded-full flex flex-col items-center justify-center text-blue-600/75 rotate-12 scale-90 pointer-events-none">
                      <span className="text-[5px] font-bold font-mono tracking-widest uppercase">PIXIATECH</span>
                      <span className="text-[6px] font-extrabold font-sans">ST-OUEN</span>
                      <span className="text-[4px] font-mono">93400 - FRANCE</span>
                    </div>

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
                    Le Client (Preneur)
                  </span>
                  <strong className="text-zinc-900 mt-1 block">{renter.company || 'bilama'}</strong>
                  
                  <div className="relative w-32 h-24 my-2 flex items-center justify-center bg-zinc-50 border border-zinc-200 rounded-lg overflow-hidden">
                    
                    {isValidated && signatureDataUrl ? (
                      <img 
                        src={signatureDataUrl} 
                        alt="Signature Preneur" 
                        className="max-w-full max-h-full object-contain mix-blend-multiply transition-all duration-300"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center p-2 text-zinc-400 text-center pointer-events-none select-none">
                        <div className="w-10 h-0.5 border-t border-dashed border-zinc-300 mb-1"></div>
                        <span className="text-[8px] font-mono tracking-wide uppercase">En attente</span>
                        <span className="text-[7px] text-zinc-400 mt-1 leading-none">Complétez ci-dessous</span>
                      </div>
                    )}

                  </div>

                  <div className="text-[8px] text-zinc-400 font-mono leading-tight">
                    {renter.representative || 'Un représentant'} <br />
                    <span className="underline text-zinc-400">{renter.email || 'contact@client.com'}</span> <br />
                    {isValidated ? (
                      <span className="text-blue-600 font-semibold">Signé électroniquement</span>
                    ) : (
                      <span className="text-amber-600 font-medium italic">Signature requise</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-8 border-t border-zinc-150 pt-3 text-center">
                <span className="text-[8px] text-zinc-400 tracking-wider inline-flex items-center gap-1 bg-zinc-50 border border-zinc-200 px-3 py-1 rounded-full uppercase">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block animate-pulse"></span>
                  Certifié sécurisé PandaDoc e-Sign — Valeur juridique
                </span>
              </div>

            </div>
          ) : (
            <div className="mt-8 pt-4 border-t border-zinc-150 text-center text-[10px] text-zinc-400 font-mono">
              Considéré comme accepté suite à la validation du consentement de traitement des données commerciales.
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
