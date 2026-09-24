import { ProductWPData } from '../types/product';

export const defaultProductData: ProductWPData = {
  header: {
    brandName: "PIXIATECH",
    brandTagline: "INNOVATION LED SHOWROOM",
    navLinks: [
      { id: "nav-hero", label: "Présentation", href: "#hero" },
      { id: "nav-metrics", label: "Points Clés", href: "#metrics" },
      { id: "nav-tech", label: "Technologies", href: "#technologies" },
      { id: "nav-configurator", label: "Configurateur", href: "#configurator" },
      { id: "nav-applications", label: "Cas d'usage", href: "#applications" },
      { id: "nav-specs", label: "Fiche Technique", href: "#specifications" },
      { id: "nav-faq", label: "FAQ", href: "#faq" }
    ],
    cartCount: 0
  },
  hero: {
    badge: "SÉRIE WP • AFFICHAGE TRANSPARENT & VITRINE",
    title: "L'excellence visuelle sans obstruer la lumière du jour",
    subtitle: "Conçue pour les vitrines commerciales les plus exigeantes, la Série WP de PixiaTech allie une transparence exceptionnelle jusqu'à 85% et une luminosité jusqu'à 6 500 nits, garantissant une lisibilité parfaite même en plein soleil.",
    primaryCta: "Configurer mon écran sur-mesure",
    secondaryCta: "Fiche technique certifiée (PDF)",
    visible: true,
    quickHighlights: [
      { label: "Transparence", value: "85%", sub: "Lumière naturelle" },
      { label: "Luminosité", value: "6 500 nits", sub: "Plein soleil" },
      { label: "Poids plume", value: "12 kg/m²", sub: "Châssis Slim" },
      { label: "Refroidissement", value: "ColdLED™", sub: "100% Passif" }
    ],
    hotspots: [
      {
        id: "hs-module",
        title: "Dalles LED Bar Ultra-Fines",
        description: "Barrettes LED indépendantes montées sur circuit imprimé traversant pour une perméabilité maximale à la lumière.",
        top: "35%",
        left: "52%"
      },
      {
        id: "hs-power",
        title: "Boîtier d'Alimentation ColdLED™",
        description: "Dissipation thermique 100% passive en aluminium extrudé, totalement silencieux, sans ventilateur.",
        top: "78%",
        left: "76%"
      },
      {
        id: "hs-frame",
        title: "Structure Suspendue & Fixations Rapides",
        description: "Châssis profilé en alliage d'aluminium avec verrouillage Fast-Lock pour pose suspendue par câbles inox ou au sol.",
        top: "18%",
        left: "24%"
      }
    ]
  },
  metrics: {
    badge: "PERFORMANCE DE POINTE",
    title: "Spécifications optiques & structurelles de premier plan",
    subtitle: "Développée selon les standards des plus grandes marques internationales de luxe et d'architecture commerciale.",
    visible: true,
    cards: [
      {
        id: "met-transparency",
        value: "75% à 85%",
        unit: "TRANSPARENCE OPTIQUE",
        title: "Lumière Naturelle Intacte",
        description: "Laisse passer la clarté du jour à l'intérieur du point de vente et préserve la vue sur les produits exposés en boutique.",
        icon: "Eye",
        badge: "OPTICAL GRADE",
        visible: true
      },
      {
        id: "met-brightness",
        value: "6 500",
        unit: "CD/M² (NITS)",
        title: "Lisibilité Plein Soleil",
        description: "Haute intensité lumineuse étalonnée pour percer les reflets des baies vitrées les plus exposées au soleil direct.",
        icon: "Sun",
        badge: "DAYLIGHT PRO",
        visible: true
      },
      {
        id: "met-weight",
        value: "12",
        unit: "KG / M² ULTRA-SLIM",
        title: "Poids Plume & Finesse",
        description: "Installation suspendue par câbles d'acier discrets sans renfort de structure lourd ni modification de façade.",
        icon: "Feather",
        badge: "PROFILÉ SLIM",
        visible: true
      },
      {
        id: "met-pitch",
        value: "P2.8 - P7.8",
        unit: "MILLIMÈTRES",
        title: "Pitchs Haute Résolution",
        description: "Une netteté d'image sensationnelle dès 2 mètres de recul grâce à nos dalles fine pitch de dernière génération.",
        icon: "Layers",
        badge: "ULTRA DÉFINITION",
        visible: true
      }
    ]
  },
  features: {
    badge: "INNOVATIONS PIXIATECH",
    title: "Technologies embarquées de nouvelle génération",
    subtitle: "Chaque détail de la Série WP a été pensé pour maximiser la fiabilité, réduire les coûts d'exploitation et sublimer vos contenus.",
    visible: true,
    items: [
      {
        id: "feat-coldled",
        title: "Technologie ColdLED™ & Dissipation Passive",
        description: "Refroidissement 100% passif par conductivité thermique sans ventilateur mécanique. Zéro nuisance sonore pour votre clientèle, aucune aspiration de poussière et longévité des diodes LED étendue à plus de 100 000 heures.",
        tag: "BREVET THERMIQUE",
        icon: "ShieldCheck",
        visible: true
      },
      {
        id: "feat-maintenance",
        title: "Maintenance Front & Rear Express (10s)",
        description: "Système de fixation magnétique breveté permettant le déclipsage et remplacement d'une barrette LED ou d'un module en moins de 10 secondes, que ce soit par l'avant de la vitrine ou par l'arrière côté boutique.",
        tag: "HOT-SWAP 10S",
        icon: "Zap",
        visible: true
      },
      {
        id: "feat-cabling",
        title: "Câblage Invisible & Assemblage Modulaire",
        description: "Liaisons électriques et de données totalement intégrées dans les traverses structurelles en aluminium. Aucun câble apparent ne vient perturber l'élégance architecturale de vos baies vitrées.",
        tag: "DESIGN ÉPURÉ",
        icon: "Cable",
        visible: true
      },
      {
        id: "feat-energy",
        title: "Économie d'Énergie (-30%) & Capteur de Lumière",
        description: "Alimentations à haute efficacité couplées à une cellule photo-électrique intelligente qui ajuste la luminosité en temps réel selon l'éclairage ambiant jour/nuit pour une consommation minimale.",
        tag: "ÉCO-CONCEPTION",
        icon: "Battery",
        visible: true
      }
    ]
  },
  configurator: {
    badge: "SIMULATEUR DE PROJET",
    title: "Calculez votre écran Série WP sur-mesure",
    subtitle: "Ajustez les dimensions de votre baie vitrée et choisissez votre pitch pour obtenir instantanément la résolution, la surface, le poids et une estimation technique.",
    visible: true,
    disclaimer: "Dimensions calculées sur la base des dalles modulaires standard WP (1000 x 500 mm et 500 x 500 mm). Tolérance d'ajustement sur-mesure disponible sur demande.",
    defaultPitch: "P3.91",
    defaultWidth: 3.0,
    defaultHeight: 2.0,
    pitchOptions: [
      {
        id: "P2.8",
        name: "P2.8 (Ultra Fin)",
        pixelPitchH: 2.8,
        pixelPitchV: 5.6,
        brightness: 5500,
        transparency: 72,
        minDistance: "2 - 3 m",
        bestFor: "Vitrines de luxe, galeries marchandes, boutiques de joaillerie"
      },
      {
        id: "P3.91",
        name: "P3.91 (Standard Élite)",
        pixelPitchH: 3.91,
        pixelPitchV: 7.81,
        brightness: 6500,
        transparency: 80,
        minDistance: "3.5 - 5 m",
        bestFor: "Vitrines de mode, concessions automobiles, retail premium"
      },
      {
        id: "P7.82",
        name: "P7.82 (Haute Transparence)",
        pixelPitchH: 7.82,
        pixelPitchV: 7.82,
        brightness: 7000,
        transparency: 85,
        minDistance: "7 - 10 m",
        bestFor: "Grandes façades d'immeubles, aéroports, halls d'accueil"
      }
    ]
  },
  applications: {
    badge: "CAS D'USAGE RÉELS",
    title: "Sublimez tous vos espaces de vente",
    subtitle: "Découvrez comment les plus grandes enseignes utilisent les écrans transparents PixiaTech pour dynamiser leur fréquentation.",
    visible: true,
    cases: [
      {
        id: "app-retail",
        title: "Boutiques & Vitrines de Luxe",
        sector: "Retail & Prêt-à-porter",
        description: "Diffusez des animations vidéo saisissantes de vos nouvelles collections tout en laissant les passants admirer vos mannequins et l'intérieur du magasin.",
        icon: "Store",
        stats: "Jusqu'à +42% de trafic piéton en boutique",
        badge: "MEILLEURE VENTE",
        visible: true
      },
      {
        id: "app-auto",
        title: "Concessions & Showrooms Auto",
        sector: "Automobile & Mobilité",
        description: "Mettez en scène les véhicules exposés avec des effets visuels flottants en surimpression holographique visibles jour et nuit depuis la route.",
        icon: "Car",
        stats: "Visibilité garantie à 100 mètres même plein sud",
        badge: "IMPACT MAXIMAL",
        visible: true
      },
      {
        id: "app-corporate",
        title: "Façades Vitrées & Sièges Sociaux",
        sector: "Architecture & Immobilier",
        description: "Transformez une verrière ou un atrium d'entreprise en support de communication événementiel sans assombrir les bureaux des collaborateurs.",
        icon: "Building2",
        stats: "Lumière naturelle préservée à 85%",
        badge: "ARCHITECTURE",
        visible: true
      },
      {
        id: "app-events",
        title: "Salons & Événementiel Premium",
        sector: "Événements & Expositions",
        description: "Structure autoportante facile à monter et démonter pour vos stands d'exposition, lancements de produits et défilés de prestige.",
        icon: "Sparkles",
        stats: "Montage express sans outil spécialisé",
        badge: "FLEXIBLE",
        visible: true
      }
    ]
  },
  specifications: {
    badge: "DONNÉES TECHNIQUES CERTIFIÉES",
    title: "Spécifications techniques détaillées Série WP",
    subtitle: "Toutes les caractéristiques mesurées en laboratoire d'essai selon les normes CE, RoHS, EMC et classement feu.",
    visible: true,
    columns: ["Spécification", "Modèle WP P2.8", "Modèle WP P3.91", "Modèle WP P7.82"],
    rows: [
      { id: "spec-1", category: "Optique", param: "Pas de pixel (Pitch H/V)", p28: "2.8 x 5.6 mm", p39: "3.91 x 7.81 mm", p78: "7.82 x 7.82 mm", visible: true },
      { id: "spec-2", category: "Optique", param: "Transparence optique", p28: "72%", p39: "80%", p78: "85%", visible: true },
      { id: "spec-3", category: "Optique", param: "Luminosité maximale", p28: "5 500 cd/m²", p39: "6 500 cd/m²", p78: "7 000 cd/m²", visible: true },
      { id: "spec-4", category: "Optique", param: "Angle de vision (H / V)", p28: "160° / 160°", p39: "160° / 160°", p78: "160° / 160°", visible: true },
      { id: "spec-5", category: "Performance", param: "Fréquence de rafraîchissement", p28: "3 840 Hz (Anti-flicker)", p39: "3 840 Hz (Anti-flicker)", p78: "3 840 Hz (Anti-flicker)", visible: true },
      { id: "spec-6", category: "Performance", param: "Niveaux de gris (Gray scale)", p28: "16 bits (65 536 nuances)", p39: "16 bits (65 536 nuances)", p78: "16 bits (65 536 nuances)", visible: true },
      { id: "spec-7", category: "Structure", param: "Dimensions dalle standard", p28: "1000 x 500 mm / 500 x 500 mm", p39: "1000 x 500 mm / 500 x 500 mm", p78: "1000 x 500 mm / 500 x 500 mm", visible: true },
      { id: "spec-8", category: "Structure", param: "Poids au m²", p28: "12.5 kg / m²", p39: "12.0 kg / m²", p78: "11.2 kg / m²", visible: true },
      { id: "spec-9", category: "Énergie", param: "Consommation moyenne / max", p28: "260 W / 780 W par m²", p39: "240 W / 720 W par m²", p78: "190 W / 580 W par m²", visible: true },
      { id: "spec-10", category: "Fiabilité", param: "Indice de protection & Environnement", p28: "IP30 Intérieur Vitrine", p39: "IP30 Intérieur Vitrine", p78: "IP30 Intérieur Vitrine", visible: true },
      { id: "spec-11", category: "Fiabilité", param: "Durée de vie des LED", p28: "≥ 100 000 heures", p39: "≥ 100 000 heures", p78: "≥ 100 000 heures", visible: true },
      { id: "spec-12", category: "Contrôle", param: "Système de pilotage & Interfaces", p28: "Cloud 4G/WiFi + HDMI + Novastar", p39: "Cloud 4G/WiFi + HDMI + Novastar", p78: "Cloud 4G/WiFi + HDMI + Novastar", visible: true }
    ]
  },
  faq: {
    badge: "RÉPONSES EXPERTS",
    title: "Questions fréquentes sur les écrans transparents",
    subtitle: "Tout ce que vous devez savoir pour votre installation en vitrine, réglementation et maintenance.",
    visible: true,
    items: [
      {
        id: "faq-1",
        question: "Faut-il une autorisation spéciale en mairie pour installer un écran transparent en vitrine ?",
        answer: "Généralement, l'installation d'un écran transparent à l'intérieur de la vitrine (au-delà de 20 cm de la vitre) relève du domaine privé et non de l'enseigne extérieure soumise au Règlement Local de Publicité (RLP). Cependant, selon votre commune et la surface totale, nous vous accompagnons dans le dossier déclaratif pour respecter les plages horaires d'extinction nocturne obligatoires.",
        visible: true
      },
      {
        id: "faq-2",
        question: "La luminosité de 6 500 nits est-elle vraiment indispensable pour une vitrine ?",
        answer: "Absolument. Un écran standard de télévision plafonne à 350-500 nits et devient un miroir noir illisible face au soleil. Pour vaincre les reflets d'une baie vitrée exposée à la lumière du jour, 3 500 nits est le minimum légal de confort et 6 500 nits garantit un rendu éclatant même sous le soleil zénithal le plus ardent.",
        visible: true
      },
      {
        id: "faq-3",
        question: "Comment pilote-t-on les vidéos et contenus diffusés ?",
        answer: "La Série WP est fournie avec un contrôleur vidéo Novastar de dernière génération. Vous pouvez gérer vos contenus soit en direct par câble HDMI / DisplayPort, soit à distance via notre plateforme Cloud sécurisée (mise à jour des visuels depuis votre smartphone ou PC, programmation d'horaires et extinction automatique).",
        visible: true
      },
      {
        id: "faq-4",
        question: "Comment choisir entre le pitch P2.8, P3.91 et P7.82 ?",
        answer: "La règle générale est la distance de lecture : pour un flux piéton immédiat longeant le trottoir à 2-3 mètres, le P2.8 ou P3.91 offre une finesse photoréaliste incroyable. Pour une vitrine en étage ou visible depuis une avenue où les spectateurs sont à plus de 7 mètres, le P7.82 offre le meilleur ratio coût/transparence maximale (85%).",
        visible: true
      },
      {
        id: "faq-5",
        question: "Que se passe-t-il si une diode LED est endommagée ?",
        answer: "Grâce au système modulaire PixiaTech, vous n'avez jamais à remplacer l'écran complet. Les barrettes LED individuelles se changent en moins de 10 secondes grâce au système de maintenance rapide Front/Rear. Nous fournissons systématiquement un lot de pièces de rechange (spare parts) avec chaque installation.",
        visible: true
      }
    ]
  },
  footer: {
    showroomTitle: "SHOWROOM OFFICIEL PIXIATECH",
    showroomAddress: "14-16 Rue de l'Égalité, 93400 Saint-Ouen-sur-Seine (Grand Paris)",
    showroomDesc: "Venez tester et comparer en conditions réelles nos écrans LED Série WP, Série Poster et dalles Fine Pitch dans notre showroom de 400 m².",
    phone: "+33 1 84 25 80 80",
    email: "contact@pixiatech.com",
    openingHours: "Du Lundi au Vendredi : 09h00 - 19h00 (Sur rendez-vous)",
    techTags: [
      "COLDLED™ TECHNOLOGY",
      "WP TRANSPARENT",
      "ULTRA SLIM 12KG/M²",
      "6500 NITS DAYLIGHT",
      "FINE PITCH P2.8",
      "NOVASTAR 3840HZ",
      "100K HEURES",
      "FRONT & REAR 10S"
    ],
    copyright: "© 2026 PIXIATECH FRANCE. Tous droits réservés. Spécialiste français de l'affichage dynamique LED haute luminosité.",
    socials: [
      { name: "LinkedIn", icon: "Globe", url: "https://linkedin.com/company/pixiatech" },
      { name: "YouTube", icon: "Monitor", url: "https://youtube.com/@pixiatech" },
      { name: "Instagram", icon: "Sparkles", url: "https://instagram.com/pixiatech" }
    ]
  }
};
