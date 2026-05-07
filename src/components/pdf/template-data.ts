export const DEFAULT_DATA = {
  company: {
    name: "PIXIATECH",
    tagline: "Solutions LED innovantes",
    address: "123 Rue de l'Innovation, 75001 Paris",
    phone: "+33 1 23 45 67 89",
    email: "contact@pixiatech.fr",
    website: "www.pixiatech.fr",
    siret: "SIRET: 123 456 789 00012",
  },
  quote: {
    title: "ESTIMATION",
    numero: "EST-2026-042",
    date: "23/04/2026",
    validite: "30 jours",
  },
  client: {
    name: "BILAMA",
    address: "456 Avenue du Commerce",
    city: "69001 Lyon",
    phone: "+33 6 12 34 56 78",
    email: "contact@client.fr",
  },
  items: [
    {
      id: 1,
      description: "Écran LED intérieur P3",
      details: "Type: Indoor | Dimensions: 3m × 2m | Période: Installation comprise",
      qty: 2,
      unitPrice: 4500,
    },
    {
      id: 2,
      description: "Structure de support aluminium",
      details: "Type: Mural | Dimensions: Sur mesure | Période: Garantie 2 ans",
      qty: 1,
      unitPrice: 1200,
    },
    {
      id: 3,
      description: "Contrôleur Nova Star MSD600",
      details: "Type: Contrôleur | Dimensions: Standard 19\" | Période: Support 12 mois",
      qty: 1,
      unitPrice: 800,
    },
  ],
  technical: {
    surface: "6 m²",
    resolution: "1920 × 1280 px",
    modules: "192 modules",
    puissanceMax: "3 600 W",
    puissanceMoy: "1 800 W",
    disjoncteur: "25A triphasé",
    typeProjet: "Affichage dynamique",
    environnement: "Intérieur",
    distance: "3m – 15m",
    pitch: "P3 mm",
  },
  summary: {
    sousTotal: 11000,
    installation: 1500,
    livraison: 350,
    vatRate: 0,
    tva: 0,
    totalTTC: 12850,
  },
  information: `Cette estimation est valable 30 jours à compter de sa date d'émission. 
Tout acompte versé est non remboursable. 
Les délais de livraison sont estimatifs et non contractuels.`,
  paymentTerms: `50% à la commande, 50% à la livraison. 
Paiement par virement bancaire uniquement. 
TVA applicable selon la législation en vigueur.`,
  badges: [
    { id: 'b1', icon: 'CheckSquare', text: 'Matériel professionnel Haute qualité' },
    { id: 'b2', icon: 'Diamond', text: 'Accompagnement personnalisé' },
    { id: 'b3', icon: 'Lock', text: 'Installation sécurisée' }
  ]
};
