import { UserProfile, Order, Invoice, Dispute, NotificationItem, OrderItem } from './types';

export const STORE_CATALOG: OrderItem[] = [
  {
    productId: 'prod-001',
    productName: 'Mur LED Intérieur Modulaire PixiaWall P1.86 UHD (Cabinet 640x480mm)',
    productImage: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&auto=format&fit=crop&q=80',
    productDescription: 'Cabinet aluminium moulé sous pression haute précision, pitch 1.86mm, luminosité 1000 nits, rafraîchissement 3840Hz et maintenance frontale magnétique.',
    quantity: 1,
    unitPriceHT: 1250.00,
    vatRate: 0.20,
    unitPriceTTC: 1500.00,
    category: 'Murs LED Intérieurs'
  },
  {
    productId: 'prod-002',
    productName: 'Mur LED Événementiel Extérieur Rental PixiaStage P3.91 (500x1000mm IP65)',
    productImage: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&auto=format&fit=crop&q=80',
    productDescription: 'Panneau scénique et événementiel étanche IP65, châssis magnésium ultraléger 12kg, système de fixation rapide Fast-Lock et haute luminosité 5500 nits.',
    quantity: 1,
    unitPriceHT: 825.00,
    vatRate: 0.20,
    unitPriceTTC: 990.00,
    category: 'Murs LED Événementiels'
  },
  {
    productId: 'prod-003',
    productName: 'Totem d\'Affichage Dynamique LED 4K PixiaTotem 65" Ultra-Slim',
    productImage: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&auto=format&fit=crop&q=80',
    productDescription: 'Totem vidéo haute luminosité 2500 nits anti-reflet avec lecteur multimédia Android/Cloud intégré et pilotage d\'affichage dynamique 24/7 à distance.',
    quantity: 2,
    unitPriceHT: 1850.00,
    vatRate: 0.20,
    unitPriceTTC: 2220.00,
    category: 'Affichage Dynamique'
  },
  {
    productId: 'prod-004',
    productName: 'Processeur Vidéo & Contrôleur LED PixiaMaster 4K UHD (Engine NovaStar)',
    productImage: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&auto=format&fit=crop&q=80',
    productDescription: 'Processeur vidéo mural multi-écrans HDMI 2.0 / DP 1.2 / 12G-SDI avec mapping matriciel temps réel, compensation de latence et calibration colorimétrique.',
    quantity: 1,
    unitPriceHT: 1450.00,
    vatRate: 0.20,
    unitPriceTTC: 1740.00,
    category: 'Processeurs & Régies Vidéo'
  }
];

export const INITIAL_USER: UserProfile = {
  id: 'usr-client-01',
  name: 'Alexandre Mercier',
  email: 'a.mercier@techsolutions-paris.fr',
  phone: '+33 6 42 89 12 04',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  emailVerified: true,
  personalAddress: '142 Avenue des Champs-Élysées',
  personalCity: 'Paris',
  personalPostalCode: '75008',
  personalCountry: 'France',
  siret: '84920311900024',
  siretVerified: true,
  companyName: 'TECHSOLUTIONS FRANCE SAS',
  vatNumber: 'FR82849203119',
  companyAddress: '142 Avenue des Champs-Élysées',
  legalStatus: 'Société par actions simplifiée (SAS)',
  nafCode: '62.02A - Conseil en systèmes et logiciels informatiques',
  city: 'Paris',
  postalCode: '75008'
};

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'cmd-001',
    orderNumber: 'CMD-2025-0842',
    date: '2025-09-02',
    status: 'delivered',
    items: [STORE_CATALOG[0]],
    subtotalHT: 1250.00,
    vatAmount: 250.00,
    discountCode: 'PIXIA-LED-PRO',
    discountAmount: 125.00,
    totalTTC: 1375.00,
    deliveryAddress: '142 Avenue des Champs-Élysées, 75008 Paris',
    carrier: 'Chronopost Spécialiste Frêt',
    trackingNumber: '8P002934892FR',
    deliveryPinCode: '7394',
    estimatedDeliveryDate: '2025-09-04',
    actualDeliveryDate: '2025-09-04T11:22:00',
    hasInvoice: true,
    invoiceId: 'fac-001',
    invoiceStatus: 'FACTURE DISPONIBLE'
  },
  {
    id: 'cmd-002',
    orderNumber: 'CMD-2025-0895',
    date: '2025-09-08',
    status: 'in_transit',
    items: [STORE_CATALOG[1]],
    subtotalHT: 825.00,
    vatAmount: 165.00,
    totalTTC: 990.00,
    deliveryAddress: '142 Avenue des Champs-Élysées, 75008 Paris',
    carrier: 'DHL Freight Logistics',
    trackingNumber: 'DHL-94827103',
    deliveryPinCode: '4821',
    estimatedDeliveryDate: '2025-09-14',
    hasInvoice: false
  },
  {
    id: 'cmd-003',
    orderNumber: 'CMD-2025-0911',
    date: '2025-09-10',
    status: 'processing',
    items: [STORE_CATALOG[2]],
    subtotalHT: 3700.00,
    vatAmount: 740.00,
    totalTTC: 4440.00,
    deliveryAddress: '142 Avenue des Champs-Élysées, 75008 Paris',
    carrier: 'Geodis Calberson Frêt',
    trackingNumber: '6C029481729',
    deliveryPinCode: '9012',
    estimatedDeliveryDate: '2025-09-16',
    hasInvoice: false
  }
];

export const INITIAL_INVOICES: Invoice[] = [
  {
    id: 'fac-001',
    invoiceNumber: 'FAC-2025-0042',
    orderId: 'cmd-001',
    orderNumber: 'CMD-2025-0842',
    productId: STORE_CATALOG[0].productId,
    productName: STORE_CATALOG[0].productName,
    productImage: STORE_CATALOG[0].productImage,
    productUrl: 'https://app.pixiatech.com/boutique',
    issueDate: '2025-09-04',
    dueDate: '2025-10-04',
    subtotalHT: 1250.00,
    vatRate: 0.20,
    vatAmount: 250.00,
    discountCode: 'PIXIA-LED-PRO',
    discountAmount: 125.00,
    totalTTC: 1375.00,
    status: 'FACTURE DISPONIBLE',
    definitiveDocumentUploaded: true,
    uploadedAt: '2025-09-04T14:30:00',
    billingType: 'entreprise',
    clientSnapshot: {
      billingType: 'entreprise',
      clientName: 'Alexandre Mercier',
      email: 'a.mercier@techsolutions-paris.fr',
      siret: '84920311900024',
      companyName: 'TECHSOLUTIONS FRANCE SAS',
      vatNumber: 'FR82849203119',
      billingAddress: '142 Avenue des Champs-Élysées',
      city: 'Paris',
      postalCode: '75008',
      country: 'France'
    }
  }
];

export const INITIAL_DISPUTES: Dispute[] = [
  {
    id: 'lit-001',
    orderId: 'cmd-001',
    orderNumber: 'CMD-2025-0842',
    productName: STORE_CATALOG[0].productName,
    productImage: STORE_CATALOG[0].productImage,
    date: '05/09/2025',
    lastResponseDate: '06/09/2025',
    reason: 'delivery_delay',
    reasonLabel: 'Retard de livraison sur flight cases',
    description: 'Les flight cases renforcés du mur LED PixiaWall P1.86 ont été remis avec 24h de retard avant le montage du stand.',
    status: 'Résolu',
    messages: [
      {
        id: 'msg-1',
        sender: 'client',
        senderName: 'Alexandre Mercier',
        message: 'Bonjour, les flight cases renforcés pour le mur LED P1.86 sont arrivés avec plus de 24h de retard par rapport au créneau initialement convenu pour l\'événement.',
        date: '05/09/2025',
        time: '09:42'
      },
      {
        id: 'msg-2',
        sender: 'admin',
        senderName: 'Support Client PIXIATECH',
        message: 'Bonjour Monsieur Mercier. Nous avons vérifié auprès du transporteur Chronopost Frêt. Un dysfonctionnement sur le hub de Chilly-Mazarin a en effet causé ce décalage. Nous vous présentons nos sincères excuses.',
        date: '05/09/2025',
        time: '14:15'
      },
      {
        id: 'msg-3',
        sender: 'admin',
        senderName: 'Administration PIXIATECH',
        message: 'Afin de compenser ce désagrément, un avoir commercial de 125,00 € TTC a été crédité sur votre compte et sera déductible de votre prochaine commande. Le litige est désormais résolu.',
        date: '06/09/2025',
        time: '10:05'
      }
    ]
  },
  {
    id: 'lit-002',
    orderId: 'cmd-002',
    orderNumber: 'CMD-2025-0895',
    productName: STORE_CATALOG[1].productName,
    productImage: STORE_CATALOG[1].productImage,
    date: '10/09/2025',
    lastResponseDate: '10/09/2025',
    reason: 'damaged_package',
    reasonLabel: 'Emballage cartonné légèrement enfoncé',
    description: 'Le film protecteur et le coin supérieur droit du carton extérieur présentent une perforation lors de la prise en charge.',
    status: 'En cours',
    messages: [
      {
        id: 'msg-201',
        sender: 'client',
        senderName: 'Alexandre Mercier',
        message: 'Bonjour, le chauffeur DHL a émis une réserve sur la lettre de voiture concernant le coin supérieur droit du flight case extérieur. Merci de vérifier avec leur assurance.',
        date: '10/09/2025',
        time: '16:10'
      },
      {
        id: 'msg-202',
        sender: 'admin',
        senderName: 'Support Logistique PIXIATECH',
        message: 'Bonjour, nous avons bien pris note de votre signalement et ouvert une enquête sous le dossier #DHL-94827103. Le colis est sous scellés assurés. Nous attendons le retour de l\'expert DHL sous 48h.',
        date: '10/09/2025',
        time: '17:30'
      }
    ]
  }
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Facture Mur LED disponible',
    message: 'Votre facture certifiée FAC-2025-0042 (1 375,00 € TTC) pour le mur LED PixiaWall P1.86 est prête au téléchargement.',
    date: 'Il y a 2 jours',
    read: false,
    type: 'invoice',
    linkTab: 'invoices',
    invoiceId: 'fac-001'
  },
  {
    id: 'notif-2',
    title: 'Expédition en cours - Mur LED Scénique',
    message: 'Votre commande CMD-2025-0895 (PixiaStage P3.91 Rental) a été prise en charge par DHL Freight Logistics.',
    date: 'Hier à 14h20',
    read: false,
    type: 'delivery',
    linkTab: 'orders'
  },
  {
    id: 'notif-3',
    title: 'Litige transport résolu',
    message: 'Le litige sur la commande CMD-2025-0842 a été clôturé avec émission d\'un avoir commercial de 125 €.',
    date: 'Le 06/09/2025',
    read: true,
    type: 'dispute',
    linkTab: 'disputes',
    disputeId: 'lit-001'
  }
];

export interface SiretLookupResult {
  valid: boolean;
  message?: string;
  data?: {
    companyName: string;
    siret: string;
    vatNumber: string;
    companyAddress: string;
    legalStatus: string;
    nafCode: string;
    city: string;
    postalCode: string;
  };
}

export function lookupSiret(inputSiret: string): SiretLookupResult {
  const cleaned = inputSiret.replace(/\s+/g, '');
  if (!/^\d{14}$/.test(cleaned)) {
    return {
      valid: false,
      message: 'Le numéro SIRET doit comporter exactement 14 chiffres.'
    };
  }

  const sirenDb: Record<string, any> = {
    '84920311900024': {
      companyName: 'TECHSOLUTIONS FRANCE SAS',
      siret: '849 203 119 00024',
      vatNumber: 'FR82849203119',
      companyAddress: '142 Avenue des Champs-Élysées',
      legalStatus: 'Société par actions simplifiée (SAS)',
      nafCode: '62.02A - Conseil en systèmes et logiciels informatiques',
      city: 'Paris',
      postalCode: '75008'
    },
    '52288888800012': {
      companyName: 'PIXIATECH HOLDING DIGITAL',
      siret: '522 888 888 00012',
      vatNumber: 'FR44522888888',
      companyAddress: '32 Boulevard Haussmann',
      legalStatus: 'Société à Responsabilité Limitée (SARL)',
      nafCode: '62.01Z - Programmation informatique',
      city: 'Paris',
      postalCode: '75009'
    }
  };

  if (sirenDb[cleaned]) {
    return {
      valid: true,
      data: sirenDb[cleaned]
    };
  }

  const siren = cleaned.substring(0, 9);
  const nic = cleaned.substring(9);
  const tvaKey = (12 + 3 * (parseInt(siren, 10) % 97)) % 97;
  const vatNumber = `FR${String(tvaKey).padStart(2, '0')}${siren}`;
  const formattedSiret = `${cleaned.substring(0, 3)} ${cleaned.substring(3, 6)} ${cleaned.substring(6, 9)} ${nic}`;

  return {
    valid: true,
    data: {
      companyName: `ENTREPRISE ${siren} (REGISTRE SIRENE)`,
      siret: formattedSiret,
      vatNumber,
      companyAddress: '48 Rue de la Bourse',
      legalStatus: 'Société par Actions Simplifiée (SAS)',
      nafCode: '62.01Z - Programmation informatique',
      city: 'Lyon',
      postalCode: '69002'
    }
  };
}
