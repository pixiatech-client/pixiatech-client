import { Language } from '@/web/xeron-translations';

export interface LegalSection {
  id: string;
  badge?: string;
  title: string;
  subtitle?: string;
  body?: string;
  bullets?: string[];
  cards?: Array<{
    label: string;
    value: string;
    sub?: string;
  }>;
}

export interface LegalPageData {
  id: string;
  name: string;
  slug: string;
  updatedAt: string;
  meta: {
    title: string;
    description: string;
  };
  header: {
    badge: string;
    title: string;
    subtitle: string;
    lastUpdated: string;
  };
  sections: Record<string, LegalSection>;
  sectionOrder: string[];
}

/* =========================================================================
   1. MENTIONS LÉGALES & CGV / CGL
   ========================================================================= */

export const DEFAULT_MENTIONS_LEGALES_FR: LegalPageData = {
  id: 'mentions_legales',
  name: 'Mentions Légales',
  slug: '/mentions-legales',
  updatedAt: new Date().toISOString(),
  meta: {
    title: 'Mentions Légales & CGV/CGL · PIXIATECH',
    description: 'Conditions générales de vente, de services et de location, informations légales de la société PIXIATECH SASU.',
  },
  header: {
    badge: 'PIXIATECH / JURIDIQUE',
    title: 'Mentions Légales',
    subtitle: 'CONDITIONS GÉNÉRALES DE VENTE, DE SERVICES ET DE LOCATION (CGV/CGL)',
    lastUpdated: '30/11/2025',
  },
  sections: {
    presentation: {
      id: 'presentation',
      badge: 'ARTICLE 1',
      title: 'Présentation et Champ d’Application',
      body: "Les présentes conditions générales régissent l'ensemble des relations commerciales (vente, prestation de service, location) entre la société PIXIATECH (ci-après « PIXIATECH ») et ses clients (ci-après « le Client »), qu'ils soient professionnels ou consommateurs.\nLa validation de toute commande (en ligne ou sur devis) implique l'adhésion entière et sans réserve aux présentes conditions.",
    },
    identity: {
      id: 'identity',
      badge: 'IDENTITÉ SOCIÉTÉ',
      title: 'Informations Légales & Siège',
      cards: [
        { label: 'Dénomination', value: 'PIXIATECH (SASU)', sub: 'Société par Actions Simplifiée Unipersonnelle' },
        { label: 'Siège social', value: '5 Rue La Fontaine', sub: '93400 Saint-Ouen-sur-Seine, FRANCE' },
        { label: 'RCS & Immatriculation', value: 'Bobigny 993 747 161', sub: 'Greffe du Tribunal de Commerce' },
        { label: 'TVA Intracommunautaire', value: 'FR39993747161', sub: 'Numéro d’identification fiscal' },
        { label: 'Contact Téléphone', value: '+33 7 56 81 66 26', sub: 'Ligne directe commerciale' },
        { label: 'Courriel officiel', value: 'contact@pixiatech.com', sub: 'Service juridique & relations clients' },
      ],
    },
    article2: {
      id: 'article2',
      badge: 'ARTICLE 2',
      title: 'Vente : Produits et Modèle Logistique',
      body: "Les caractéristiques des produits (écrans LED, éclairage, solutions numériques) sont indiquées sur le site ou le devis.",
      subtitle: 'Expédition Directe (Modèle Logistique)',
      bullets: [
        "Afin de garantir la disponibilité des produits et des tarifs compétitifs, PIXIATECH fonctionne en flux tendu.",
        "Certains produits sont expédiés directement depuis les entrepôts de fabrication partenaires (Union Européenne ou hors UE).",
        "Le Client accepte expressément que sa commande puisse être livrée en plusieurs colis échelonnés selon la provenance logistique.",
      ],
    },
    article3: {
      id: 'article3',
      badge: 'ARTICLE 3',
      title: 'Prix & Tarification',
      body: "Les prix sont libellés en Euros (€). PIXIATECH se réserve le droit de modifier ses tarifs à tout moment. Le prix applicable est celui en vigueur au moment de la validation de la commande.",
      bullets: [
        "Particuliers (B2C) : Prix affichés toutes taxes comprises (TTC).",
        "Professionnels (B2B) : Prix affichés hors taxes (HT). La TVA applicable est ajoutée lors de la finalisation.",
      ],
    },
    article4: {
      id: 'article4',
      badge: 'ARTICLE 4',
      title: 'Modalités de Paiement (Vente et Prestation)',
      bullets: [
        "Commandes en ligne : Paiement 100 % exigible au jour de la commande. Traitement et mise en production après encaissement complet.",
        "Commandes sur devis (B2B) : Acompte de 60 % à la signature du devis ; Solde de 40 % avant expédition des marchandises.",
        "Clause de réserve de propriété : En cas de non-paiement du solde, PIXIATECH demeure propriétaire exclusif du matériel jusqu'au paiement intégral.",
      ],
    },
    article5: {
      id: 'article5',
      badge: 'ARTICLE 5',
      title: 'Livraison et Formalités Douanières',
      bullets: [
        "Délais : Les délais de livraison sont fournis à titre indicatif. Un retard éventuel ne saurait justifier l'annulation de la commande (sauf dispositions impératives du Code de la consommation pour les particuliers).",
        "Douanes Particuliers (B2C) : Expédition en mode DDP (Delivered Duty Paid) = aucun frais douanier supplémentaire à la charge de l'acheteur.",
        "Douanes Professionnels (B2B) : Droits de douane, taxes d'importation et TVA à l'importation demeurent à la charge du client professionnel.",
      ],
    },
    article6: {
      id: 'article6',
      badge: 'ARTICLE 6',
      title: 'Droit de Rétractation',
      bullets: [
        "Particuliers (Consommateurs) : Délai légal de 14 jours calendaires à compter de la réception. Les frais directs de retour sont à la charge exclusive du client. Le produit doit être impérativement neuf, complet et dans son emballage d'origine scellé. Contact préalable obligatoire avec notre support.",
        "Professionnels (B2B) : Conformément au Code de commerce, le droit de rétractation ne s'applique pas entre professionnels. Toute commande est ferme et définitive.",
      ],
    },
    article7: {
      id: 'article7',
      badge: 'ARTICLE 7',
      title: 'Prestation d’Installation & Support Technique',
      bullets: [
        "Périmètre géographique : Prestation standard disponible dans un rayon de 150 km autour du siège social. Au-delà, un devis spécifique incluant les frais de déplacement et d'hébergement est établi.",
        "Réception des travaux : Un Bon de Réception signé par les deux parties marque l'achèvement de l'installation et le transfert de la garde de l'ouvrage au client.",
        "Installation autonome par le client : PIXIATECH décline toute responsabilité en cas de dommages, de court-circuit ou de panne résultant d'une pose ou d'un branchement non conforme effectué par le client ou un tiers.",
      ],
    },
    article8: {
      id: 'article8',
      badge: 'ARTICLE 8',
      title: 'Conditions de Location de Matériel LED',
      bullets: [
        "Retard de restitution : Toute journée de retard non convenue entraîne une pénalité forfaitaire de 200 % du tarif journalier en vigueur.",
        "Dépôt de garantie (Caution) : Une caution bancaire est exigée avant la mise à disposition. Elle est immédiatement encaissable en cas de sinistre, dégradation, perte ou non-restitution.",
        "Responsabilité & Assurance : Le client est désigné gardien juridique et technique du matériel loué pour toute la durée de la mise à disposition.",
        "Montage / Démontage : Accès sécurisé au site d'installation garanti par le client. PIXIATECH se réserve le droit d'annuler ou reporter l'installation en cas de risque avéré pour la sécurité des équipes.",
      ],
    },
    article9: {
      id: 'article9',
      badge: 'ARTICLE 9',
      title: 'Garanties Légales et Contractuelles',
      bullets: [
        "Particuliers : Garantie légale de conformité (2 ans) et garantie des vices cachés selon les articles L. 217-4 et suivants du Code de la consommation et 1641 du Code civil.",
        "Professionnels : Garantie constructeur limitée aux pièces détachées (modules LED, alimentations, cartes de réception). Main d'œuvre et déplacement exclus sauf contrat de maintenance souscrit.",
      ],
    },
    article10: {
      id: 'article10',
      badge: 'ARTICLE 10',
      title: 'Limitation de Responsabilité',
      body: "En relation B2B, la responsabilité de PIXIATECH est strictement plafonnée au montant effectif hors taxes payé par le client au titre de la commande concernée. PIXIATECH ne saurait être tenue responsable des pertes d'exploitation, manques à gagner ou préjudices indirects.",
    },
    article11: {
      id: 'article11',
      badge: 'ARTICLE 11',
      title: 'Données Personnelles & Conformité RGPD',
      body: "Les données recueillies font l'objet d'un traitement informatique destiné à la gestion des commandes, devis et livraisons. Conformément au RGPD et à la loi Informatique et Libertés, le client dispose d'un droit d'accès, de rectification et de suppression de ses données.",
    },
    article12: {
      id: 'article12',
      badge: 'ARTICLE 12',
      title: 'Droit Applicable et Juridiction Compétente',
      bullets: [
        "Particuliers : Application du droit français. Possibilité de recourir à un médiateur de la consommation ou aux tribunaux territorialement compétents selon le Code de procédure civile.",
        "Professionnels : De convention expresse, tout litige relatif à la formation, l'exécution ou l'interprétation des présentes conditions relève de la compétence exclusive du Tribunal de Commerce de Bobigny (France), même en cas de référé ou de pluralité de défendeurs.",
      ],
    },
  },
  sectionOrder: [
    'presentation',
    'identity',
    'article2',
    'article3',
    'article4',
    'article5',
    'article6',
    'article7',
    'article8',
    'article9',
    'article10',
    'article11',
    'article12',
  ],
};

export const DEFAULT_MENTIONS_LEGALES_EN: LegalPageData = {
  id: 'mentions_legales',
  name: 'Legal Notice & Terms',
  slug: '/mentions-legales',
  updatedAt: new Date().toISOString(),
  meta: {
    title: 'Legal Notice, Terms & Conditions (GTC) · PIXIATECH',
    description: 'General terms and conditions of sale, services, and rental, statutory legal information for PIXIATECH SASU.',
  },
  header: {
    badge: 'PIXIATECH / LEGAL',
    title: 'Legal Notice & Terms',
    subtitle: 'GENERAL TERMS AND CONDITIONS OF SALE, SERVICES, AND RENTAL (GTC/GTR)',
    lastUpdated: '11/30/2025',
  },
  sections: {
    presentation: {
      id: 'presentation',
      badge: 'ARTICLE 1',
      title: 'Introduction and Scope of Application',
      body: "These general terms and conditions govern all commercial transactions (sales, professional services, rental) between PIXIATECH (hereinafter 'PIXIATECH') and its clients (hereinafter 'the Client'), whether business entities or individual consumers.\nValidation of any order (placed online or through an accepted formal quotation) entails full, unreserved acceptance of these terms.",
    },
    identity: {
      id: 'identity',
      badge: 'COMPANY IDENTITY',
      title: 'Legal Identity & Registered Office',
      cards: [
        { label: 'Legal Entity', value: 'PIXIATECH (SASU)', sub: 'Single-Member Simplified Joint-Stock Company' },
        { label: 'Registered Office', value: '5 Rue La Fontaine', sub: '93400 Saint-Ouen-sur-Seine, FRANCE' },
        { label: 'Commercial Registry', value: 'Bobigny 993 747 161', sub: 'Commercial Court Registry (RCS)' },
        { label: 'Intra-Community VAT', value: 'FR39993747161', sub: 'Tax Identification Number' },
        { label: 'Direct Phone', value: '+33 7 56 81 66 26', sub: 'Commercial Sales Line' },
        { label: 'Official Email', value: 'contact@pixiatech.com', sub: 'Legal & Customer Relations' },
      ],
    },
    article2: {
      id: 'article2',
      badge: 'ARTICLE 2',
      title: 'Sales: Products & Logistics Model',
      body: "Product specifications (LED panels, architectural lighting, digital hardware solutions) are set forth on our website or the agreed quotation.",
      subtitle: 'Direct Factory Fulfillment (Logistics Model)',
      bullets: [
        "To ensure reliable product availability and competitive wholesale rates, PIXIATECH operates on a streamlined just-in-time logistics model.",
        "Certain products ship directly from our certified manufacturing and assembly partners (within the European Union or internationally).",
        "The Client expressly acknowledges and agrees that orders may be delivered in multiple staggered shipments depending on logistical origin.",
      ],
    },
    article3: {
      id: 'article3',
      badge: 'ARTICLE 3',
      title: 'Pricing & Currency',
      body: "All prices are stated in Euros (€). PIXIATECH reserves the right to adjust its pricing schedule at any time. The applicable price is the one in effect at the moment of formal order validation.",
      bullets: [
        "Consumers (B2C): Displayed prices are inclusive of all taxes (TTC / VAT included).",
        "Businesses (B2B): Displayed prices are net of tax (HT / VAT excluded). Applicable VAT is calculated and added upon checkout.",
      ],
    },
    article4: {
      id: 'article4',
      badge: 'ARTICLE 4',
      title: 'Payment Terms (Sales & Services)',
      bullets: [
        "Online Orders: 100% due upon order placement. Processing and manufacturing launch upon confirmed receipt of full payment.",
        "Quotation Orders (B2B): 60% deposit upon formal quotation signing; 40% balance prior to equipment dispatch.",
        "Retention of Title: In the event of incomplete or unpaid balances, PIXIATECH retains full and exclusive ownership of all equipment until complete payment has been settled.",
      ],
    },
    article5: {
      id: 'article5',
      badge: 'ARTICLE 5',
      title: 'Delivery & Customs Formalities',
      bullets: [
        "Lead Times: Delivery timeframes are provided on an indicative basis. Unforeseen carrier delays do not justify order cancellation (subject to mandatory consumer protection laws).",
        "Consumer Shipments (B2C): Dispatched on a DDP (Delivered Duty Paid) basis = no additional customs clearance fees or duties charged to the consumer.",
        "Business Shipments (B2B): Customs tariffs, import duties, and import VAT remain the responsibility of the purchasing professional entity.",
      ],
    },
    article6: {
      id: 'article6',
      badge: 'ARTICLE 6',
      title: 'Right of Withdrawal',
      bullets: [
        "Consumers (B2C): Statutory 14-calendar-day withdrawal period starting upon delivery receipt. Direct return shipping fees are borne exclusively by the client. Returned goods must be pristine, complete, and in original sealed packaging with prior customer service authorization.",
        "Businesses (B2B): Pursuant to the French Commercial Code, statutory rights of withdrawal do not apply between commercial entities. All business orders are final and binding.",
      ],
    },
    article7: {
      id: 'article7',
      badge: 'ARTICLE 7',
      title: 'Installation Services & Technical Support',
      bullets: [
        "Geographic Scope: Standard on-site installation is available within a 150 km radius of our registered office. Beyond this zone, a dedicated quote incorporating travel and lodging expenses will be issued.",
        "Commissioning: A formal Handover Acceptance Certificate signed by both parties validates completed commissioning and transfers technical custody to the client.",
        "Self-Installation: PIXIATECH disclaims all liability for electrical faults, structural damages, or equipment failure caused by improper mounting or non-compliant wiring performed by the client or unauthorized third parties.",
      ],
    },
    article8: {
      id: 'article8',
      badge: 'ARTICLE 8',
      title: 'LED Equipment Rental Terms',
      bullets: [
        "Late Returns: Any unapproved delay in returning rented equipment incurs a mandatory late fee penalty equivalent to 200% of the active daily rental rate.",
        "Security Deposit: A formal bank guarantee deposit is required prior to equipment release. The deposit is immediately redeemable in case of loss, physical degradation, or failure to return.",
        "Liability & Custody: The client is deemed legal and technical custodian of all rented hardware for the entire duration of the rental agreement.",
        "Assembly & Site Access: Safe premises access must be guaranteed by the client. PIXIATECH reserves the right to postpone or cancel installation in case of identified safety hazards for technicians.",
      ],
    },
    article9: {
      id: 'article9',
      badge: 'ARTICLE 9',
      title: 'Legal & Contractual Warranties',
      bullets: [
        "Consumers: Protected by statutory 2-year legal conformity warranties and latent defect warranties pursuant to French consumer law and Civil Code.",
        "Businesses: Manufacturer warranty restricted to spare replacement components (LED modules, power supply units, receiving cards). On-site labor and travel are excluded unless an active service-level agreement (SLA) is contracted.",
      ],
    },
    article10: {
      id: 'article10',
      badge: 'ARTICLE 10',
      title: 'Limitation of Liability',
      body: "In B2B commercial dealings, PIXIATECH's financial liability is strictly capped at the net pre-tax amount actually paid by the client for the order in dispute. Under no circumstances shall PIXIATECH be liable for operating losses, lost revenue, business interruption, or consequential indirect damages.",
    },
    article11: {
      id: 'article11',
      badge: 'ARTICLE 11',
      title: 'Personal Data & GDPR Compliance',
      body: "Collected data undergoes automated processing designed for managing quotes, client accounts, orders, and logistics. Under GDPR and relevant data protection laws, clients retain full rights to access, amend, and delete their stored personal records.",
    },
    article12: {
      id: 'article12',
      badge: 'ARTICLE 12',
      title: 'Governing Law and Jurisdiction',
      bullets: [
        "Consumers: Governed by French law. Option to invoke a certified consumer mediator or file through competent regional civil jurisdictions.",
        "Businesses: By express mutual covenant, any dispute relating to the interpretation, performance, or termination of these terms falls under the exclusive jurisdiction of the Commercial Court of Bobigny (France).",
      ],
    },
  },
  sectionOrder: [
    'presentation',
    'identity',
    'article2',
    'article3',
    'article4',
    'article5',
    'article6',
    'article7',
    'article8',
    'article9',
    'article10',
    'article11',
    'article12',
  ],
};

export const DEFAULT_MENTIONS_LEGALES = DEFAULT_MENTIONS_LEGALES_FR;

/* =========================================================================
   2. POLITIQUE DE CONFIDENTIALITÉ & RGPD
   ========================================================================= */

export const DEFAULT_POLITIQUE_CONFIDENTIALITE_FR: LegalPageData = {
  id: 'politique_confidentialite',
  name: 'Politique de Confidentialité',
  slug: '/politique-confidentialite',
  updatedAt: new Date().toISOString(),
  meta: {
    title: 'Politique de Confidentialité & RGPD · PIXIATECH',
    description: 'Engagement de protection des données personnelles, conformité RGPD et politique de transparence de PIXIATECH.',
  },
  header: {
    badge: 'PIXIATECH / RGPD',
    title: 'Politique de Confidentialité',
    subtitle: 'POLITIQUE DE PROTECTION DES DONNÉES PERSONNELLES & RGPD',
    lastUpdated: '30/11/2025',
  },
  sections: {
    intro: {
      id: 'intro',
      badge: 'ENGAGEMENT',
      title: 'Protection de la Vie Privée',
      body: "La présente politique vise à vous informer en toute transparence de la manière dont la société PIXIATECH collecte, utilise et protège vos données à caractère personnel lors de votre navigation sur notre site et de l'utilisation de nos services (Vente, Devis, Location, Installation d'écrans LED).",
    },
    responsable: {
      id: 'responsable',
      badge: '1. RESPONSABLE DE TRAITEMENT',
      title: 'Responsable du Traitement & Délégué aux Données',
      cards: [
        { label: 'Responsable de traitement', value: 'PIXIATECH (SASU)', sub: 'Société par Actions Simplifiée Unipersonnelle' },
        { label: 'Siège social', value: '5 Rue La Fontaine', sub: '93400 Saint-Ouen-sur-Seine, France' },
        { label: 'RCS Bobigny', value: '993 747 161', sub: 'Numéro d’immatriculation légal' },
        { label: 'Téléphone direct', value: '+33 7 56 81 66 26', sub: 'Accueil téléphonique' },
        { label: 'Courriel du DPO', value: 'contact@pixiatech.com', sub: 'Délégué à la Protection des Données' },
      ],
    },
    donnees: {
      id: 'donnees',
      badge: '2. DONNÉES COLLECTÉES',
      title: 'Quelles Données Collectons-Nous ?',
      body: "Nous collectons uniquement les informations strictement indispensables à l'exercice de notre activité et au traitement qualitatif de vos demandes :",
      bullets: [
        "Identité : Nom, prénom, civilité, raison sociale de l'entreprise, numéro SIRET, numéro de TVA intracommunautaire.",
        "Contact : Adresse postale de livraison, adresse de facturation, adresse électronique (email), numéros de téléphone.",
        "Paiement : Historique des commandes passées, factures d'achat, détails de transaction bancaire. Remarque : nous ne stockons aucun numéro complet de carte bancaire, les paiements étant traités par des prestataires certifiés PCI-DSS (Stripe, PayPal).",
        "Données Techniques : Adresse IP, données de connexion, identifiants de session et cookies techniques de navigation.",
        "Location & Installation spécifique : Pour les dossiers de location de matériel LED, transmission requise d'une copie de pièce d'identité officielle et d'un justificatif de domicile pour la constitution du dossier de garantie.",
      ],
    },
    finalites: {
      id: 'finalites',
      badge: '3. FINALITÉS DU TRAITEMENT',
      title: 'Pourquoi Utilisons-Nous Vos Données ?',
      body: "Vos données personnelles sont traitées selon les bases légales suivantes :",
      bullets: [
        "Exécution du contrat (Base principale) : Traitement de vos commandes, préparation logistique, expédition, livraison, installation sur site, facturation et gestion du SAV.",
        "Obligations légales : Tenue comptable obligatoire, conservation des pièces de facturation pendant 10 ans, prévention et lutte contre la fraude.",
        "Intérêt légitime : Optimisation ergonomique de nos plateformes, analyses statistiques de fréquentation et réponses aux demandes de contact et de devis.",
        "Consentement : Envoi de communications par email ou offres techniques réservées (uniquement si vous avez expressément coché la case d'acceptation).",
      ],
    },
    destinataires: {
      id: 'destinataires',
      badge: '4. DESTINATAIRES DES DONNÉES',
      title: 'Qui a Accès à Vos Données ?',
      body: "Vos données personnelles ne sont jamais vendues, cédées ou louées à des tiers à des fins publicitaires. Elles sont transmises exclusivement aux sous-traitants et partenaires indispensables à l'exécution de vos commandes :",
      bullets: [
        "Fournisseurs et Logistique (Direct Usine / Flux Tendu) : Vos nom, adresse et téléphone sont communiqués à nos usines de fabrication et entrepôts logistiques partenaires (situés dans l'UE ou hors UE) afin d'assurer l'acheminement direct de vos écrans.",
        "Transporteurs & Messageries : La Poste, DHL, UPS, Geodis et transporteurs fret spécialisés pour la livraison sécurisée des panneaux LED volumineux.",
        "Passerelles de paiement : Établissements bancaires et passerelles sécurisées (Stripe, PayPal).",
        "Prestataires techniques : Hébergement serveur sécurisé (LWS) et cabinet d'expertise comptable agréé.",
        "Transfert hors Union Européenne : Dans le cadre de notre approvisionnement direct constructeur, certaines données transitent vers des partenaires situés hors UE. Ce transfert est strictement circonscrit aux données de livraison et s'appuie sur l'article 49 du RGPD (nécessité d'exécution du contrat conclu dans votre intérêt).",
      ],
    },
    conservation: {
      id: 'conservation',
      badge: '5. DURÉE DE CONSERVATION',
      title: 'Combien de Temps Sont Conservées Vos Données ?',
      bullets: [
        "Données de compte client actif : Conservées pendant toute la durée d'activité du compte et jusqu'à 3 ans après la dernière commande enregistrée.",
        "Factures et pièces comptables : 10 ans (obligation légale selon l'article L. 123-22 du Code de commerce).",
        "Pièces d'identité (Location de matériel) : Définitivement détruites dès la restitution complète du matériel et la clôture du dossier de caution.",
        "Traceurs et cookies : 13 mois maximum conformément aux recommandations de la CNIL.",
      ],
    },
    securite: {
      id: 'securite',
      badge: '6. SÉCURITÉ TECHNIQUE',
      title: 'Sécurité & Intégrité des Données',
      body: "PIXIATECH déploie un ensemble de protocoles rigoureux pour protéger vos données contre toute destruction, altération, vol ou accès non autorisé : chiffrement SSL/TLS (HTTPS) 256 bits, serveurs surveillés H24, politiques strictes de contrôle d'accès administrateur et sauvegardes redondantes chiffrées.",
    },
    droits: {
      id: 'droits',
      badge: '7. VOS DROITS RGPD',
      title: 'Vos Droits & Exercice Direct',
      body: "Conformément au Règlement (UE) 2016/679 (RGPD), vous disposez des droits suivants sur l'ensemble de vos données :",
      bullets: [
        "Droit d’accès : Obtenir confirmation du traitement et copie de vos données.",
        "Droit de rectification : Corriger toute information inexacte ou obsolète.",
        "Droit à l’effacement (« Droit à l'oubli ») : Demander la suppression de vos données personnelles sous réserve des obligations légales de conservation.",
        "Droit à la limitation du traitement & Portabilité : Recevoir vos données dans un format structuré et réutilisable.",
        "Droit d’opposition : Vous opposer à tout moment au traitement de vos données à des fins de prospection commerciale.",
      ],
      subtitle: 'Pour exercer vos droits :',
      cards: [
        { label: 'Email direct RGPD', value: 'contact@pixiatech.com', sub: 'Réponse sous 30 jours ouvrés' },
        { label: 'Courrier postal', value: 'PIXIATECH - DPO', sub: '5 Rue La Fontaine, 93400 Saint-Ouen-sur-Seine' },
      ],
    },
  },
  sectionOrder: [
    'intro',
    'responsable',
    'donnees',
    'finalites',
    'destinataires',
    'conservation',
    'securite',
    'droits',
  ],
};

export const DEFAULT_POLITIQUE_CONFIDENTIALITE_EN: LegalPageData = {
  id: 'politique_confidentialite',
  name: 'Privacy Policy',
  slug: '/politique-confidentialite',
  updatedAt: new Date().toISOString(),
  meta: {
    title: 'Privacy Policy & GDPR Compliance · PIXIATECH',
    description: 'Our transparent commitment to personal data protection, GDPR standards, and user privacy rights at PIXIATECH.',
  },
  header: {
    badge: 'PIXIATECH / GDPR',
    title: 'Privacy Policy',
    subtitle: 'PERSONAL DATA PROTECTION POLICY & GENERAL DATA PROTECTION REGULATION (GDPR)',
    lastUpdated: '11/30/2025',
  },
  sections: {
    intro: {
      id: 'intro',
      badge: 'COMMITMENT',
      title: 'Protection of Personal Privacy',
      body: "This privacy policy provides complete transparency regarding how PIXIATECH collects, processes, and safeguards your personal data when browsing our website and using our digital services (LED Display Sales, Quotations, Rental, and Installation Services).",
    },
    responsable: {
      id: 'responsable',
      badge: '1. DATA CONTROLLER',
      title: 'Data Controller & Data Protection Officer',
      cards: [
        { label: 'Data Controller', value: 'PIXIATECH (SASU)', sub: 'Single-Member Simplified Joint-Stock Company' },
        { label: 'Registered Office', value: '5 Rue La Fontaine', sub: '93400 Saint-Ouen-sur-Seine, France' },
        { label: 'Commercial Registry', value: 'Bobigny 993 747 161', sub: 'Official Business Registration' },
        { label: 'Direct Telephone', value: '+33 7 56 81 66 26', sub: 'Customer Support Line' },
        { label: 'DPO Email', value: 'contact@pixiatech.com', sub: 'Data Protection Officer Contact' },
      ],
    },
    donnees: {
      id: 'donnees',
      badge: '2. DATA COLLECTED',
      title: 'What Information Do We Collect?',
      body: "We strictly collect information indispensable to executing our commercial operations and servicing your requests effectively:",
      bullets: [
        "Identity: Full name, title, corporate company name, registration number (SIRET/Registration ID), Intra-Community VAT number.",
        "Contact Details: Delivery address, billing address, email address, landline and mobile telephone numbers.",
        "Financial & Payment: Past order history, invoices, transaction references. Note: we never store complete credit card numbers; payment data is handled exclusively by PCI-DSS certified providers (Stripe, PayPal).",
        "Technical Data: IP addresses, access logs, session tokens, and essential browsing cookies.",
        "Rental & On-Site Verification: For LED equipment rental agreements, an official government ID copy and proof of address are collected solely to compile the deposit and guarantee record.",
      ],
    },
    finalites: {
      id: 'finalites',
      badge: '3. PURPOSES OF PROCESSING',
      title: 'Why Do We Process Your Data?',
      body: "Your personal information is processed on the basis of the following lawful legal grounds:",
      bullets: [
        "Contract Execution (Primary Ground): Processing your orders, logistics coordination, dispatch, direct delivery, on-site commissioning, invoicing, and warranty support.",
        "Statutory Obligations: Mandatory accounting compliance, 10-year archival of billing records, fraud prevention and risk management.",
        "Legitimate Interests: Enhancing platform usability, traffic performance analytics, and promptly replying to custom quotation requests.",
        "Consent: Sending optional product newsletters or privileged technical promotions (strictly subject to your explicit opt-in confirmation).",
      ],
    },
    destinataires: {
      id: 'destinataires',
      badge: '4. DATA RECIPIENTS',
      title: 'Who Can Access Your Personal Data?',
      body: "Your personal data is never sold, leased, or transferred to third parties for commercial advertising. Data is shared exclusively with necessary partners and subcontractors:",
      bullets: [
        "Manufacturers & Logistics (Direct Factory / Just-in-Time): Recipient name, delivery address, and phone number are transmitted to partner assembly hubs (EU or international) to ensure prompt direct dispatch of LED equipment.",
        "Shipping & Freight: DHL, UPS, Geodis, national postal services, and specialized heavy freight operators for the secure transit of modular LED panels.",
        "Payment Gateways: Certified banking institutions and payment processing intermediaries (Stripe, PayPal).",
        "Technical Infrastructure: Secure cloud and dedicated server hosting (LWS) and accredited public accounting firms.",
        "International Transfers: Under our manufacturer direct model, delivery details may transit to non-EU facilities pursuant to Article 49 of the GDPR (necessary for the execution of a contract concluded in your interest).",
      ],
    },
    conservation: {
      id: 'conservation',
      badge: '5. DATA RETENTION',
      title: 'How Long Do We Retain Your Information?',
      bullets: [
        "Active Client Accounts: Maintained throughout account activity and up to 3 years after the last recorded purchase or interaction.",
        "Invoices & Accounting Documents: Retained for 10 years (statutory requirement under Article L. 123-22 of the French Commercial Code).",
        "Identity Verification (Rental Hardware): Permanently destroyed upon full inspection and return of the equipment and final closure of the deposit file.",
        "Browsing Trackers & Cookies: Maximum retention of 13 months pursuant to CNIL recommendations.",
      ],
    },
    securite: {
      id: 'securite',
      badge: '6. TECHNICAL SECURITY',
      title: 'Security & Data Integrity Protocols',
      body: "PIXIATECH implements multi-layered security measures to guard against accidental destruction, loss, alteration, or unauthorized access: 256-bit SSL/TLS (HTTPS) data encryption in transit, continuously monitored redundant servers, stringent role-based access rights, and encrypted daily backups.",
    },
    droits: {
      id: 'droits',
      badge: '7. YOUR GDPR RIGHTS',
      title: 'Your Rights & Direct Enforcement',
      body: "Under EU Regulation 2016/679 (GDPR), you hold enforceable rights across all personal data in our custody:",
      bullets: [
        "Right of Access: Obtain formal confirmation of processing and request an exhaustive copy of your stored records.",
        "Right to Rectification: Promptly correct incomplete, outdated, or inaccurate information.",
        "Right to Erasure ('Right to Be Forgotten'): Request the deletion of your personal records, subject to statutory retention duties.",
        "Right to Restriction & Data Portability: Receive your data in a structured, portable, standard machine-readable format.",
        "Right to Object: Object at any time to the processing of your data for direct marketing or commercial profiling.",
      ],
      subtitle: 'To exercise any of these statutory rights:',
      cards: [
        { label: 'Direct GDPR Email', value: 'contact@pixiatech.com', sub: 'Response guaranteed within 30 working days' },
        { label: 'Postal Address', value: 'PIXIATECH - DPO Office', sub: '5 Rue La Fontaine, 93400 Saint-Ouen-sur-Seine, France' },
      ],
    },
  },
  sectionOrder: [
    'intro',
    'responsable',
    'donnees',
    'finalites',
    'destinataires',
    'conservation',
    'securite',
    'droits',
  ],
};

export const DEFAULT_POLITIQUE_CONFIDENTIALITE = DEFAULT_POLITIQUE_CONFIDENTIALITE_FR;

/* =========================================================================
   3. GESTION DES COOKIES & TRACEURS
   ========================================================================= */

export const DEFAULT_GESTION_COOKIES_FR: LegalPageData = {
  id: 'gestion_cookies',
  name: 'Gestion des Cookies',
  slug: '/gestion-cookies',
  updatedAt: new Date().toISOString(),
  meta: {
    title: 'Gestion des Cookies & Traceurs · PIXIATECH',
    description: 'Politique officielle de gestion des traceurs et cookies, transparence et paramétrage de vos préférences chez PIXIATECH.',
  },
  header: {
    badge: 'PIXIATECH / PRIVACY',
    title: 'Gestion des Cookies',
    subtitle: 'POLITIQUE DE GESTION DES TRACEURS ET GESTION DE VOS PRÉFÉRENCES (CNIL & RGPD)',
    lastUpdated: '30/11/2025',
  },
  sections: {
    definition: {
      id: 'definition',
      badge: '1. DÉFINITION',
      title: 'Qu’est-ce qu’un Cookie ?',
      body: "Un « cookie » est un traceur ou un petit fichier texte alphanumérique déposé et lu sur votre terminal (ordinateur, smartphone, tablette) lors de votre consultation de notre site internet PIXIATECH.\nIl permet de mémoriser temporairement des données de session afin de faciliter votre navigation, sécuriser votre accès et activer des fonctionnalités interactives comme la sauvegarde de votre panier d'achat ou vos configurations d'écrans LED.",
    },
    emetteurs: {
      id: 'emetteurs',
      badge: '2. ÉMETTEURS',
      title: 'Qui Dépose les Cookies sur ce Site ?',
      body: "Les cookies peuvent être déposés soit directement par PIXIATECH (cookies internes nécessaires au fonctionnement de la plateforme), soit par des tiers partenaires certifiés (mesure d'audience anonyme, modules cartographiques, sécurisation bancaire).",
    },
    types: {
      id: 'types',
      badge: '3. CATÉGORIES',
      title: 'Quels Types de Cookies Utilisons-Nous ?',
      bullets: [
        "A. Cookies Strictement Nécessaires (Obligatoires) : Ces traceurs techniques sont indispensables au fonctionnement intrinsèque du site. Ils permettent de sécuriser l'authentification à votre espace client, d'assurer la persistance de votre panier et d'équilibrer la charge des serveurs. Conformément aux directives de la CNIL, ils sont exemptés du recueil de consentement et ne peuvent être désactivés sans bloquer le site.",
        "B. Cookies de Fonctionnalité & Préférences : Ils conservent en mémoire vos réglages ergonomiques (choix de langue FR/EN, devises, affichage du thème sombre ou clair) pour une expérience fluide et personnalisée.",
        "C. Cookies de Mesure d’Audience & Statistiques : Nous exploitons des outils analytiques permettant d'agréger anonymement le nombre de visites, le temps passé sur chaque page et les performances d'affichage afin d'améliorer en continu nos interfaces.",
        "D. Cookies Marketing & Réseaux Sociaux : Éventuellement déposés par nos partenaires marketing pour vous suggérer des solutions d'affichage LED adaptées à vos centres d'intérêt lors de votre navigation future.",
      ],
    },
    choix: {
      id: 'choix',
      badge: '4. VOS CHOIX',
      title: 'Comment Exercer Vos Choix ?',
      body: "Lors de votre première visite sur le site PIXIATECH, un bandeau d'information conforme aux standards CNIL vous offre un choix équitable et immédiat :",
      bullets: [
        "« Tout accepter » : Vous consentez au dépôt de l'ensemble des cookies (fonctionnels, analytiques, marketing).",
        "« Tout refuser » : Seuls les cookies techniques indispensables au bon fonctionnement du site seront conservés.",
        "« Personnaliser » : Vous modulez vos préférences catégorie par catégorie via notre interface dédiée.",
        "Modification ultérieure : Vous pouvez à tout instant réouvrir le panneau de consentement et modifier vos choix en cliquant sur « Gestion des cookies » en pied de page ou sur le bouton ci-dessous.",
      ],
    },
    duree: {
      id: 'duree',
      badge: '5. DURÉE DE VIE',
      title: 'Durée de Conservation de Vos Choix',
      bullets: [
        "Conservation du consentement : Vos choix (acceptation ou refus) sont conservés sur votre terminal pendant une période de 6 mois, conformément aux recommandations de la CNIL. À l'issue de cette période, le bandeau de consentement vous sera à nouveau présenté.",
        "Durée de vie des cookies analytiques : 13 mois maximum à compter de leur dépôt initial.",
      ],
    },
    navigateurs: {
      id: 'navigateurs',
      badge: '6. CONFIGURATION NAVIGATEUR',
      title: 'Paramétrage Direct Dans Votre Navigateur',
      body: "Vous pouvez également configurer votre logiciel de navigation pour refuser systématiquement l'enregistrement des cookies ou être alerté avant tout dépôt :",
      cards: [
        { label: 'Google Chrome', value: 'Paramètres > Confidentialité et sécurité > Cookies tiers', sub: 'support.google.com/chrome' },
        { label: 'Apple Safari', value: 'Préférences > Confidentialité > Bloquer tous les cookies', sub: 'support.apple.com/safari' },
        { label: 'Mozilla Firefox', value: 'Paramètres > Vie privée et sécurité > Protection renforcée', sub: 'support.mozilla.org/firefox' },
        { label: 'Microsoft Edge', value: 'Paramètres > Cookies et autorisations de site', sub: 'support.microsoft.com/edge' },
      ],
    },
    contact: {
      id: 'contact',
      badge: '7. CONTACT',
      title: 'Question Relative aux Traceurs ?',
      body: "Pour toute interrogation concernant notre utilisation des cookies ou l'application de la réglementation CNIL/RGPD, notre équipe de conformité se tient à votre entière disposition à l'adresse contact@pixiatech.com.",
    },
  },
  sectionOrder: [
    'definition',
    'emetteurs',
    'types',
    'choix',
    'duree',
    'navigateurs',
    'contact',
  ],
};

export const DEFAULT_GESTION_COOKIES_EN: LegalPageData = {
  id: 'gestion_cookies',
  name: 'Cookie Policy',
  slug: '/gestion-cookies',
  updatedAt: new Date().toISOString(),
  meta: {
    title: 'Cookie Policy & Tracker Preferences · PIXIATECH',
    description: 'Official tracker and cookie management policy, full transparency, and consent preferences settings at PIXIATECH.',
  },
  header: {
    badge: 'PIXIATECH / PRIVACY',
    title: 'Cookie Policy',
    subtitle: 'TRACKER MANAGEMENT POLICY & PREFERENCE MANAGEMENT (CNIL & GDPR COMPLIANT)',
    lastUpdated: '11/30/2025',
  },
  sections: {
    definition: {
      id: 'definition',
      badge: '1. DEFINITION',
      title: 'What is a Cookie or Tracker?',
      body: "A 'cookie' is a tracker or small alphanumeric data file deposited on and retrieved from your device (computer, smartphone, tablet) while navigating our PIXIATECH website.\nIt temporarily retains session state information to smooth navigation, maintain security, and enable interactive tools such as preserving active shopping baskets or real-time LED screen dimension configurations.",
    },
    emetteurs: {
      id: 'emetteurs',
      badge: '2. ISSUERS',
      title: 'Who Places Cookies on This Website?',
      body: "Cookies may be placed directly by PIXIATECH (first-party cookies essential to platform operations) or by verified third-party technical partners (anonymous audience analytics, interactive mapping services, secure payment validation).",
    },
    types: {
      id: 'types',
      badge: '3. CATEGORIES',
      title: 'What Categories of Cookies Do We Employ?',
      bullets: [
        "A. Strictly Necessary Cookies (Mandatory): Technical trackers indispensable to basic website operation. They secure account authentication, preserve shopping cart integrity, and distribute server load. Pursuant to CNIL guidelines, they are exempt from consent requirements and cannot be disabled without disrupting the platform.",
        "B. Functional & Preference Cookies: These record your ergonomic choices (FR/EN language settings, currency, dark or light visual theme) to guarantee a fluid, tailored experience.",
        "C. Audience Measurement & Analytics: We deploy aggregated analytics tools to record visitor counts, average page duration, and rendering performance to continually improve interface speed and reliability.",
        "D. Marketing & Social Network Cookies: May be deposited by trusted advertising partners to recommend LED display solutions tailored to your professional interests during future browsing.",
      ],
    },
    choix: {
      id: 'choix',
      badge: '4. YOUR CHOICES',
      title: 'How Can You Exercise Your Preferences?',
      body: "Upon your first visit to PIXIATECH, an informative consent banner designed according to CNIL standards presents a clear and balanced choice:",
      bullets: [
        "'Accept All': You consent to the deposit of all cookie categories (functional, analytics, marketing).",
        "'Decline All': Only strictly necessary technical cookies essential to site operations will be stored.",
        "'Customize Preferences': You adjust your consent category by category through our dedicated interface.",
        "Subsequent Changes: You can reopen the consent center and revise your choices at any moment by clicking 'Cookie Policy' in the footer or using the button below.",
      ],
    },
    duree: {
      id: 'duree',
      badge: '5. RETENTION LIFESPAN',
      title: 'How Long Are Your Choices Stored?',
      bullets: [
        "Consent Preference Lifetime: Your choices (acceptance or decline) are remembered on your device for 6 months pursuant to CNIL recommendations. Upon expiry, the consent banner will be shown again.",
        "Analytics Cookies Expiry: Maximum 13 months following initial deposit.",
      ],
    },
    navigateurs: {
      id: 'navigateurs',
      badge: '6. BROWSER CONTROLS',
      title: 'Direct Browser Configuration',
      body: "You can also configure your web browser directly to systematically decline cookies or receive alerts prior to any storage:",
      cards: [
        { label: 'Google Chrome', value: 'Settings > Privacy and security > Third-party cookies', sub: 'support.google.com/chrome' },
        { label: 'Apple Safari', value: 'Preferences > Privacy > Block all cookies', sub: 'support.apple.com/safari' },
        { label: 'Mozilla Firefox', value: 'Settings > Privacy & Security > Enhanced Tracking Protection', sub: 'support.mozilla.org/firefox' },
        { label: 'Microsoft Edge', value: 'Settings > Cookies and site permissions', sub: 'support.microsoft.com/edge' },
      ],
    },
    contact: {
      id: 'contact',
      badge: '7. CONTACT',
      title: 'Questions Regarding Our Cookie Policy?',
      body: "For any inquiry regarding our tracker management or regulatory CNIL/GDPR compliance, our data privacy team is directly reachable at contact@pixiatech.com.",
    },
  },
  sectionOrder: [
    'definition',
    'emetteurs',
    'types',
    'choix',
    'duree',
    'navigateurs',
    'contact',
  ],
};

export const DEFAULT_GESTION_COOKIES = DEFAULT_GESTION_COOKIES_FR;

/* =========================================================================
   4. REGISTRY & HELPER
   ========================================================================= */

export const LEGAL_PAGES_REGISTRY: Record<string, Record<Language, LegalPageData>> = {
  mentions_legales: {
    FR: DEFAULT_MENTIONS_LEGALES_FR,
    EN: DEFAULT_MENTIONS_LEGALES_EN,
  },
  politique_confidentialite: {
    FR: DEFAULT_POLITIQUE_CONFIDENTIALITE_FR,
    EN: DEFAULT_POLITIQUE_CONFIDENTIALITE_EN,
  },
  gestion_cookies: {
    FR: DEFAULT_GESTION_COOKIES_FR,
    EN: DEFAULT_GESTION_COOKIES_EN,
  },
};

export function getLegalPageData(pageKey: string, lang: Language): LegalPageData {
  const pageMap = LEGAL_PAGES_REGISTRY[pageKey];
  if (!pageMap) {
    return DEFAULT_MENTIONS_LEGALES_FR;
  }
  return pageMap[lang] || pageMap.FR;
}
