/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Pack, RenterDetails } from '@/lib/signature-types';
import { FileText, Calendar, Building, MapPin, User, ShieldAlert } from 'lucide-react';

interface ContractDocumentProps {
  pack: Pack;
  renter: RenterDetails;
  signatureDataUrl: string | null;
  isValidated: boolean;
  projectMode?: 'vente' | 'location';
  rentalPeriod?: { from: Date | string; to: Date | string };
  rentalStartTime?: string | null;
  rentalEndTime?: string | null;
}

export default function ContractDocument({
  pack,
  renter,
  signatureDataUrl,
  isValidated,
  projectMode = 'location',
  rentalPeriod,
  rentalStartTime,
  rentalEndTime
}: ContractDocumentProps) {
  // Use current date
  const contractDate = "29 mai 2026";

  // Format rental period dates
  const formatRentalDate = (d: Date | string | undefined) => {
    if (!d) return '';
    const date = d instanceof Date ? d : new Date(d);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };
  const rentalFrom = rentalPeriod?.from ? formatRentalDate(rentalPeriod.from) : '';
  const rentalTo = rentalPeriod?.to ? formatRentalDate(rentalPeriod.to) : '';
  const rentalPeriodStr = rentalFrom && rentalTo ? `${rentalFrom} – ${rentalTo}` : '';
  const rentalHours = (rentalStartTime || rentalEndTime) ? `${rentalStartTime || '08:00'} à ${rentalEndTime || '18:00'}` : '';

  return (
    <div className="w-full flex flex-col">
      {/* Scrollable Container with document simulation */}
      <div 
        className="w-full max-h-[500px] overflow-y-auto border border-zinc-200 rounded-xl bg-zinc-50/40 p-4 sm:p-6 text-xs sm:text-sm text-zinc-700 leading-relaxed custom-scrollbar shadow-inner"
        id="document-scroll-viewport"
      >
        <div className="max-w-2xl mx-auto bg-white border border-zinc-200/80 p-6 sm:p-10 rounded-lg font-sans shadow-md text-zinc-800">
          
          {/* Header */}
          <div className="text-center mb-8 border-b border-zinc-100 pb-5">
            <h1 className="text-sm sm:text-base font-bold text-zinc-900 tracking-tight font-heading uppercase leading-snug">
              CONDITIONS GÉNÉRALES DE VENTE, DE SERVICES ET DE LOCATION (CGV/CGL)
            </h1>
            <p className="text-[10px] text-zinc-400 font-mono mt-1.5 tracking-widest uppercase">
              PIXIATECH • France • Dernière mise à jour : 30/11/2025
            </p>
          </div>

          {/* Section: Parties */}
          <div className="space-y-4 mb-6 text-[11px] sm:text-xs leading-relaxed text-zinc-600">
            <div>
              <h2 className="font-bold text-zinc-500 mb-2 font-heading tracking-wide text-[10px] uppercase">
                ENTRE LES SOUSSIGNÉ(E)S :
              </h2>
              <p className="pl-3 border-l-2 border-zinc-200">
                La société <strong className="text-zinc-900">PIXIATECH</strong>, Société par actions simplifiée à associé unique (SASU), dont le siège social se situe <span className="text-zinc-900 font-medium">5 Rue La Fontaine, 93400 Saint-Ouen-sur-Seine, FRANCE</span>, immatriculée au RCS de Bobigny sous le numéro <span className="text-zinc-900 font-medium">993 747 161</span>, TVA Intracommunautaire numéro <span className="text-zinc-900 font-medium">FR39993747161</span>, contact : <span className="text-zinc-900 underline font-medium">contact@pixiatech.com</span> / <span className="text-zinc-900 font-medium">07 56 81 66 26</span>.
                <br />
                <span className="italic text-zinc-400 mt-1 block">Ci-après dénommée, « PIXIATECH » ou le « Bailleur ».</span>
              </p>
            </div>

            <div className="text-center font-semibold text-zinc-400 tracking-widest text-[9px] my-3">
              D'UNE PART,
            </div>

            <div>
              <p className="pl-3 border-l-2 border-zinc-200">
                La société <strong className="text-zinc-900">{renter.company || 'bilama'}</strong>, représentée par <span className="text-zinc-900 font-medium">{renter.representative || 'Ayanhil 103'}</span>, domiciliée au <span className="text-zinc-950">{renter.address || 'fsedfdsfdfdsfdf hghfgh'}</span>, {renter.postcode || '31100'}, {renter.city || 'lille'}, email : <span className="text-zinc-950 underline font-medium">{renter.email || 'ayanhil103@gmail.com'}</span>, téléphone : <span className="text-zinc-950 font-medium">{renter.phone || '0777000000'}</span>.
                <br />
                <span className="italic text-zinc-400 mt-1 block">Ci-après dénommé(e), « le Client » ou le « Preneur ».</span>
              </p>
            </div>

            <div className="text-center font-semibold text-zinc-400 tracking-widest text-[9px] my-3">
              D'AUTRE PART,
            </div>

            <p className="italic text-zinc-400">
              PIXIATECH et le Client sont collectivement dénommés les « Parties » et individuellement dénommés une « Partie ».
            </p>
          </div>

          {/* Sleek Blue Box for Biens Loues */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 sm:p-5 mb-8 text-zinc-700">
            <h3 className="font-bold text-blue-900 mb-2.5 flex items-center gap-1.5 font-heading text-xs sm:text-sm">
              <span className="w-1.5 h-4 bg-blue-600 rounded-full block"></span>
              RÉCAPITULATIF DE LA LOCATION DE MATÉRIEL :
            </h3>
            <ul className="space-y-1.5 text-[11px] sm:text-xs">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>
                  Matériel loué : <strong className="text-zinc-900">{pack.name}</strong> • Surface d'affichage : <strong className="text-zinc-900">{pack.surface}</strong>
                </span>
              </li>
              {projectMode === 'location' && rentalPeriodStr && (
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>
                    Période de location : <strong className="text-zinc-900">{rentalPeriodStr}</strong>
                  </span>
                </li>
              )}
              {projectMode === 'location' && rentalHours && (
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>
                    Horaires : <strong className="text-zinc-900">{rentalHours}</strong>
                  </span>
                </li>
              )}
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>
                  Loyer mensuel : <strong className="text-zinc-900">{pack.price.toLocaleString('fr-FR')}€ TTC/mois</strong> (Sans engagement de durée)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>
                  Dépôt de garantie requis (Caution) : <strong className="text-zinc-900">{pack.deposit.toLocaleString('fr-FR')}€ TTC</strong>
                </span>
              </li>
            </ul>
          </div>

          {/* Section: Exposé */}
          <div className="text-[11px] sm:text-[12px] text-zinc-650 space-y-5 font-normal mt-6 border-t border-zinc-100 pt-5 text-left">
            <p className="italic font-medium text-zinc-800">
              IL A ÉTÉ EXPOSÉ ET CONVENU CE QUI SUIT :
            </p>

            <div className="space-y-5 text-zinc-600">
              <div>
                <h4 className="font-bold text-zinc-900 text-xs mb-1">ARTICLE 1 – PRÉSENTATION ET CHAMP D’APPLICATION</h4>
                <p>
                  Les présentes conditions générales régissent l’ensemble des relations commerciales (vente, prestation de service, location) entre la société PIXIATECH (ci-après « PIXIATECH ») et ses clients (ci-après « le Client »), qu’ils soient professionnels ou consommateurs.
                </p>
                <div className="my-2 pl-3 border-l-2 border-zinc-200 text-zinc-500 space-y-0.5">
                  <p>• <strong>Dénomination :</strong> PIXIATECH (SASU)</p>
                  <p>• <strong>Siège social :</strong> 5 Rue La Fontaine, 93400 Saint-Ouen-sur-Seine, FRANCE</p>
                  <p>• <strong>RCS :</strong> Bobigny 993 747 161</p>
                  <p>• <strong>TVA Intracommunautaire :</strong> FR39993747161</p>
                  <p>• <strong>Contact E-Mail :</strong> contact@pixiatech.com | E-Téléphone : 07 56 81 66 26</p>
                </div>
                <p className="mt-1">
                  La validation de toute commande (en ligne ou sur devis) implique l’adhésion entière et sans réserve aux présentes conditions.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-zinc-900 text-xs mb-1">ARTICLE 2 – VENTE : PRODUITS ET MODÈLE LOGISTIQUE</h4>
                <p>
                  Les caractéristiques des produits (écrans LED, éclairage, solutions numériques) sont indiquées sur le site ou le devis.
                </p>
                <p className="font-semibold text-zinc-800 mt-1.5 mb-0.5">Expédition Directe (Modèle Logistique)</p>
                <p>
                  Afin de garantir la disponibilité des produits et des tarifs compétitifs, PIXIATECH fonctionne en flux tendu. Certains produits sont expédiés directement depuis les entrepôts de fabrication partenaires (UE ou hors UE). Le Client accepte que sa commande puisse être livrée en plusieurs colis selon la provenance logistique.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-zinc-900 text-xs mb-1">ARTICLE 3 – PRIX</h4>
                <p>
                  Les prix sont indiqués en Euros.
                  <br />- <strong>Particuliers :</strong> prix TTC.
                  <br />- <strong>Professionnels :</strong> prix HT. PIXIATECH peut modifier les tarifs à tout moment. Le prix applicable est celui au moment de la commande.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-zinc-900 text-xs mb-1">ARTICLE 4 – PAIEMENT (VENTE ET PRESTATION)</h4>
                <p>
                  <strong>4.1 Commandes en ligne :</strong> Paiement 100 % exigible au jour de la commande. Traitement après encaissement complet.
                  <br />
                  <strong>4.2 Commandes sur devis (B2B) :</strong> Acompte de 60 % à la signature. Solde de 40 % avant expédition. En cas de non-paiement du solde, PIXIATECH reste propriétaire du matériel.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-zinc-900 text-xs mb-1">ARTICLE 5 – LIVRAISON ET DOUANES</h4>
                <p>
                  <strong>5.1 Délais :</strong> Les délais sont indicatifs. Un retard ne justifie pas une annulation (sauf dispositions légales B2C).
                  <br />
                  <strong>5.2 Douanes :</strong> Pour les particuliers, mode DDP = aucun frais supplémentaire, prix final. Pour les professionnels, droits de douane et TVA à l’importation sont entièrement à la charge du client.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-zinc-900 text-xs mb-1">ARTICLE 6 – DROIT DE RÉTRACTATION</h4>
                <p>
                  <strong>6.1 Particuliers :</strong> Délai de 14 jours. Frais de retour à la charge exclusive du client. Le produit doit être neuf, complet et l'emballage intact. Un contact préalable obligatoire est exigé.
                  <br />
                  <strong>6.2 Professionnels :</strong> Pas de droit de rétractation possible en B2B. La commande est ferme et définitive.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-zinc-900 text-xs mb-1">ARTICLE 7 – PRESTATION D’INSTALLATION</h4>
                <p>
                  <strong>7.1 Périmètre :</strong> Installation disponible dans un rayon de 150 km autour du siège. Au-delà, sur devis uniquement.
                  <br />
                  <strong>7.2 Réception :</strong> Un Bon de Réception formalisé marque la fin définitive de l’installation. Le client en devient l'unique responsable et gardien juridique.
                  <br />
                  <strong>7.3 Installation par le Client :</strong> PIXIATECH décline catégoriquement toute responsabilité en cas de mauvaise installation ou dysfonctionnement causé par le client.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-zinc-900 text-xs mb-1">ARTICLE 8 – LOCATION</h4>
                <p>
                  <strong>8.1 Retard :</strong> Pénalité de restitution fixée à 200 % du tarif journalier contractuel par jour de retard.
                  <br />
                  <strong>8.2 Caution :</strong> Caution entièrement encaissable en cas de dommages du matériel, perte ou dégradation.
                  <br />
                  <strong>8.3 Assurance :</strong> Le client est désigné gardien juridique exclusif du matériel loué pour toute sa durée de détention.
                  <br />
                  <strong>8.4 Montage / Démontage :</strong> Accès sécurisé des lieux obligatoirement garanti par le client. La responsabilité est transférée après installation complète. PIXIATECH se réserve le droit d’annuler en cas de risque évident de sécurité.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-zinc-900 text-xs mb-1">ARTICLE 9 – GARANTIES</h4>
                <p>
                  - Pour les <strong>Particuliers :</strong> 2 ans de garantie légale de conformité.
                  <br />- Pour les <strong>Professionnels :</strong> Garantie constructeur limitée (pièces détachées d'usure uniquement).
                </p>
              </div>

              <div>
                <h4 className="font-bold text-zinc-900 text-xs mb-1">ARTICLE 10 – LIMITATION DE RESPONSABILITÉ</h4>
                <p>
                  En contexte commercial professionnel B2B, la responsabilité globale de PIXIATECH est expressément plafonnée au montant net de la commande.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-zinc-900 text-xs mb-1">ARTICLE 11 – DONNÉES PERSONNELLES</h4>
                <p>
                  Les données transmises sont uniquement récoltées et stockées pour traiter et expédier la commande, en stricte conformité réglementaire RGPD.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-zinc-900 text-xs mb-1">ARTICLE 12 – DROIT APPLICABLE ET LITIGES</h4>
                <p>
                  Le présent contrat est soumis au droit français.
                  <br />- Pour les <strong>Particuliers :</strong> Compétence légale ou médiation amiable de la consommation.
                  <br />- Pour les <strong>Professionnels :</strong> Juridiction compétente exclusive attribuée au <strong>Tribunal de Commerce de Bobigny</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* Footer Signature Details */}
          <div className="mt-10 pt-6 border-t border-zinc-150 text-zinc-700 text-[11px] sm:text-xs">
            <p className="text-center text-zinc-400 mb-6 font-medium">
              Fait à Saint-Ouen-sur-Seine, le <span className="text-zinc-950 font-bold">{contractDate}</span>, en version électronique certifiée.
            </p>

            <div className="grid grid-cols-2 gap-6 relative font-sans">
              
              {/* Le Bailleur Column */}
              <div className="flex flex-col items-center text-center">
                <span className="text-zinc-400 font-mono text-[9px] uppercase">Pour PIXIATECH</span>
                <strong className="text-zinc-900 mt-1 block font-heading">PIXIATECH (SASU)</strong>
                
                {/* Stamp Graphic */}
                <div className="relative w-32 h-24 my-2 flex items-center justify-center bg-zinc-50 rounded-lg border border-zinc-200 overflow-hidden">
                  {/* Digital Signature Wave */}
                  <svg className="absolute w-24 h-12 text-blue-600 opacity-95 stroke-current fill-none stroke-[1.5]" viewBox="0 0 100 50">
                    <path d="M10,25 C20,10 25,45 35,28 C45,10 50,42 62,30 C75,15 80,40 90,25" />
                  </svg>
                  {/* Official Stamp */}
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

              {/* Le Preneur Column */}
              <div className="flex flex-col items-center text-center">
                <span className="text-zinc-400 font-mono text-[9px] uppercase">Le Client</span>
                <strong className="text-zinc-900 mt-1 block">{renter.company || 'bilama'}</strong>
                
                {/* Preneur signature spot */}
                <div className="relative w-32 h-24 my-2 flex items-center justify-center bg-zinc-50 border border-zinc-200 rounded-lg overflow-hidden">
                  {signatureDataUrl ? (
                    <img 
                      src={signatureDataUrl} 
                      alt="Signature Preneur" 
                      className="max-w-full max-h-full object-contain mix-blend-multiply transition-all duration-300 animate-fade-in"
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
                  {renter.representative || 'Ayanhil 103'} <br />
                  <span className="underline text-zinc-400">{renter.email || 'ayanhil103@gmail.com'}</span> <br />
                  {isValidated ? (
                    <span className="text-blue-600 font-semibold">Signé électroniquement</span>
                  ) : signatureDataUrl ? (
                    <span className="text-blue-550 font-medium italic">Signature en cours...</span>
                  ) : (
                    <span className="text-amber-600 font-medium italic">Signature requise</span>
                  )}
                </div>
              </div>
            </div>

            {/* PandaDoc Footer seal */}
            <div className="mt-8 border-t border-zinc-150 pt-3 text-center">
              <span className="text-[8px] text-zinc-400 tracking-wider inline-flex items-center gap-1 bg-zinc-50 border border-zinc-200 px-3 py-1 rounded-full uppercase">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block animate-pulse"></span>
                Certifié sécurisé PandaDoc e-Sign — Valeur juridique
              </span>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
