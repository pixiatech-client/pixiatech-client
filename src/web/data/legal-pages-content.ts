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

export const DEFAULT_MENTIONS_LEGALES: LegalPageData = {
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

export const DEFAULT_POLITIQUE_CONFIDENTIALITE: LegalPageData = {
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

export const DEFAULT_GESTION_COOKIES: LegalPageData = {
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
