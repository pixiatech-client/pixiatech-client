
export type TranslatedString = {
  fr: string;
  en: string;
}

export type Zone = {
  id: string;
  name: string;
  color?: string;
};

export type DeliveryFeeRule = {
  id: string;
  zoneId: string;
  cityId?: string; // Optional: for city-specific overrides
  fee: number;
};

export type DeliverySettings = {
  defaultFee: number;
  isDefaultFeeEnabled: boolean;
  isFreeDeliveryEnabled: boolean;
  freeDeliveryThreshold: number;
  deliveryFeeRules: DeliveryFeeRule[];
  isTotalFreeDeliveryEnabled?: boolean;
  unconfiguredZoneMessage: string;
};

export type Product = {
  id: string;
  name: string;
  type: ('indoor' | 'outdoor' | 'showcase')[];
  availableFor: ('sale' | 'rental')[];
  productUrl?: string;
  videoUrl?: string;
  oldPrice?: number;
  salePricePerSqM?: number;
  rentalPricePerDay?: number;
  rentalPricePerHour?: number;
  rentalStock?: number;
  tileWidth?: number; 
  tileHeight?: number; 
  pricePerTile?: number; 
  maxRentalArea?: number;
  hasDimensions?: boolean;
  dimensionsEnabled?: boolean;
  minArea?: number;
  pitch?: string;
  distance?: string;
  imageUrl?: string;
  image?: string;
  environment?: string;
  specSheetUrl?: string;
  manualUrl?: string;
  specs?: Record<string, string>;
  selectedChars?: { id: string | number; name?: string; value: string }[];
  distancePitches?: Record<string, string[]>;
  isHidden?: boolean;
  upsellFor?: string[];
};

export type ProductSpec = {
  id: string;
  key: string;
  value: string;
}

export type ScreenLayout = 'flat' | 'curved' | 'cylindrical';

export type ConfiguredProduct = {
  id: string; 
  productId: string;
  productType: 'indoor' | 'outdoor' | 'showcase';
  width: number;
  height: number;
  quantity: number;
  transactionType: 'sale' | 'rental';
  rentalDuration: number;
  rentalUnit: 'day' | 'hour';
  rentalPeriod?: {
    from: Date;
    to: Date;
  };
  rentalDate?: Date;
  rentalStartTime?: string;
  rentalEndTime?: string;
  tileWidth?: number;
  tileHeight?: number;
  pricePerTile?: number;
  nombreEcrans?: number;
  dimensionsEnabled?: boolean;
  installationPhoto?: string;
  // Screen layout fields
  screenLayout?: ScreenLayout;
  isCurved?: boolean;
  is360?: boolean;
  diameter?: number;
  cabinetAngle?: number;
  curveLeft?: number;
  curveRight?: number;
};

export type QuoteDetails = {
  products: (ConfiguredProduct & { productName: string; lineTotal: number })[];
  screenType: 'indoor' | 'outdoor' | 'showcase'; 
  transactionType: 'sale' | 'rental';
  includeInstallation: boolean;
  installationCost: number; // Added to capture the calculated cost
  techniciansRequired: number;
  includeDelivery: boolean;
  isDeliveryCostFinal?: boolean; // Added this property
  deliveryCost?: number;
  selectedCityId?: string | null;
  unconfiguredCityQuery?: string;
  totalQuote: number;
  totalClient?: number;
  productDiscount?: number;
  deliveryDiscount?: number;
  laborCost?: number;
  laborDiscount?: number;
  globalDiscount?: number;
  width: number;
  height: number;
  productName: string;
  rentalUnit?: 'day' | 'hour' | null;
  rentalDuration?: number | null;
  rentalPeriod?: {
    from: Date;
    to: Date;
  };
  lang: 'fr' | 'en';
  sitePhoto?: string;
  taxRate?: number;
  configuratorType?: 'guided' | 'manual' | 'lumi';
  // Screen layout propagated from wizard
  screenLayout?: ScreenLayout;
  isCurved?: boolean;
  is360?: boolean;
  diameter?: number;
  cabinetAngle?: number;
};

export type MessagingSettings = {
  enabled: boolean;
  allowCommercialMessaging: boolean;
  allowSupplierMessaging: boolean;
}

export type HintBubbleSettings = {
  enabled: boolean;
  text: string;
  desktopBottom: number;
  desktopRight: number;
  mobileBottom: number;
  mobileRight: number;
  duration: number;
}

export type Settings = {
  defaultWidth: number;
  defaultHeight: number;
  maxWidth: number;
  maxHeight: number;
  maxRentalWidth?: number;
  maxRentalHeight?: number;
  maxProductsPerQuote?: number;
  previewScreenImageUrl?: string;
  previewScreenVideoUrl?: string;
  emergencyStopEnabled?: boolean;
  emergencyReturnUrl?: string;
  emergencyStopMessage?: string;
  congratulationsTitle?: TranslatedString;
  congratulationsMessage?: TranslatedString;
  deliveryTitle?: TranslatedString;
  deliveryMessage?: TranslatedString;
  installationTitle?: TranslatedString;
  installationMessage?: TranslatedString;
  disclaimerMessage?: TranslatedString;
  quoteFormNotesPlaceholder?: TranslatedString;
  isDeliveryStepEnabled?: boolean;
  isInstallationStepEnabled?: boolean;
  isEmailVerificationEnabled?: boolean;
  isPriceHidden?: boolean;
  isWizardBotEnabled?: boolean;
  isGuidedConfigEnabled?: boolean;
  isManualConfigEnabled?: boolean;
  isSingleSessionEnabled?: boolean;
  zoomMaxDistance?: number;
  zoomMinDistance?: number;
  hintBubble?: HintBubbleSettings;
  lightThemeId?: string;
  darkThemeId?: string;
  sidebarOrder?: string[];
  logoConfig?: {
    text: string;
    letter: string;
    color: string;
    image: string | null;
  };
  messaging?: MessagingSettings;
  performanceResetAt?: string;
  configuratorStatsResetAt?: string;
  emailVerification?: {
    companyName: string;
    companySlogan: string;
    documentLabel: string;
    messageStyle: string;
    validityMinutes: number;
    previewTheme?: string;
  };

  estimationFlow?: {
    enableRentalPeriod: boolean;
    enableDigitalSignature: boolean;
    enableContractEditing: boolean;
    companySignatureDataUrl?: string;
    saleContractTemplate?: string;
    rentalContractTemplate?: string;
    taxEnabled: boolean;
    taxRate: number;
    taxMode: 'ht' | 'ttc';
    sale: {
      maxProductsPerQuote: number;
      flatScreen: { maxWidth: number; maxHeight: number };
      curvedScreen: { maxWidth: number; maxHeight: number; curveMin: number; curveMax: number };
      screen360: { maxDiameter: number; maxHeight: number };
    };
    rental: {
      flatScreen: { maxWidth: number; maxHeight: number };
      curvedScreen: { maxWidth: number; maxHeight: number; curveMin: number; curveMax: number };
      screen360: { maxDiameter: number; maxHeight: number };
    };
  };
};

export type City = {
  id: string;
  name: string;
  postalCode: string;
  zoneId?: string; // Link to the zone
};

export type Locations = {
    villes: City[];
};

export type LaborRule = {
  id: string;
  minSqM: number;
  technicians: number;
  price: number;
};

export type LaborSettings = {
  rules: LaborRule[];
};

export type PdfSettings = {
    logoUrl?: string;
    logoWidth?: number;
    backgroundUrl?: string;
    companyName: string;
    siret?: string;
    capital?: string;
    address: string;
    phone: string;
    email: string;
    textColor?: string;
    titleColor?: string;
    headerColor?: string;
    quoteTitle?: string;
    quoteNumberPrefix?: string;
    termsAndConditions?: string;
    bgColor?: string;
    themeId?: string;
};

export type UserRole = {
  id: string;
  name: string;
  color: string;
  isDefault?: boolean;
  roleTemplate?: string;
  customPermissions?: Record<string, boolean>;
};

export type ThemeSettings = {
  cardBg: string;
  cardBorder: string;
  cardText: string;
  btnPrimaryBg: string;
  btnPrimaryText: string;
  btnPrimaryHover: string;
  btnSecondaryBg: string;
  btnSecondaryText: string;
  btnSecondaryHover: string;
  accentPrimary: string;
  pageBg: string;
  navBg: string;
  navText: string;
  sidebarBg: string;
  sidebarText: string;
  sidebarBorder: string;
  sidebarAccent: string;
  sidebarActiveBg: string;
  sidebarActiveText: string;
};

export type UserProfile = {
  uid: string;
  email: string;
  displayName: string;
  phone?: string;
  description?: string;
  photoURL?: string;
  backgroundImage?: string;
  role: string;
  roleTemplate?: string;
  status: 'pending' | 'approved';
  createdAt: any; 
  originalAdminUid?: string;
  activeSessionId?: string;
  lastLoginAt?: any;
  lastLoginIp?: string;
  themeSettings?: ThemeSettings;
};

export type NotificationFirestore = {
  id: string;
  userId: string;
  type: 'estimation' | 'user' | 'message' | 'delivery' | 'estimation_sent' | 'estimation_rejected' | 'order_created' | 'estimation_archived' | 'estimation_unarchived';
  title: string;
  description: string;
  href: string;
  read: boolean;
  createdAt: any;
  quoteRequestId?: string;
  supplierId?: string;
};

export type QuoteHistoryEntry = {
  userId: string;
  userName: string;
  userPhotoUrl?: string;
  action: string;
  timestamp: Date;
  details: string;
};

export type ActivityLogEntry = {
  id: string;
  userId: string;
  userName: string;
  userPhotoUrl?: string;
  userRole?: string;
  action: string;
  category: 'user' | 'quote' | 'product' | 'settings' | 'auth' | 'signature' | 'counter' | 'other';
  details: string;
  targetId?: string;
  targetName?: string;
  timestamp: Date;
  createdAt: any;
};


export type QuoteRequest = Omit<QuoteDetails, 'products' | 'rentalPeriod'> & {
  id: string;
  number?: string;
  createdAt: Date; 
  updatedAt?: Date;
  updatedBy?: string;
  isRead: boolean;
  status: 'pending' | 'processed' | 'trashed' | 'in_progress' | 'sent' | 'delivered' | 'archived' | 'returned' | 'rented';
  rentalPeriod?: {
    from: Date;
    to: Date;
  };
  rentalStartTime?: string;
  rentalEndTime?: string;
  client: {
    companyName: string;
    email: string;
    phone: string;
    address: string;
    notes: string;
    sitePhoto?: string;
  };
  userId?: string;
  emailVerified: boolean;
  verificationToken?: string;
  verificationTokenExpires?: any;
  history?: QuoteHistoryEntry[];
  products: (ConfiguredProduct & { productName: string; lineTotal: number; pricePerTile?: number; nombreEcrans?: number; rentalPeriod?: { from: Date, to: Date }, rentalDate?: Date, rentalStartTime?: string; rentalEndTime?: string; })[];
  installationCost: number;
  unconfiguredCityQuery?: string;
  selectedCityId?: string | null;
  supplierId?: string;
  trackingNumber?: string;
  trackingInfo?: { number: string; deliveryDate: string; receiptDate: string };
  assignedAt?: Date;
  supplierNotes?: string;
  supplierTechDetails?: any;
  lang: 'fr' | 'en';
  pdfSettings?: PdfSettings;
  pdfUrl?: string;
  contractUrl?: string;
  // New fields for message tracking
  treatedBy?: string;
  treatedByName?: string;
  treatedByRole?: string;
  treatedAt?: any;
  isReturned?: boolean;
  returnReason?: string;
  previousStatus?: string | null;
  isLocked?: boolean;
  configuratorType?: 'guided' | 'manual' | 'lumi';
};

export type Theme = {
  id: string;
  name: string;
  description?: string;
  category?: 'pastel' | 'audacieux';
  mode?: 'light' | 'dark';
  colors: {
    adminBackground: string;
    background: string;
    foreground: string;
    primary: string;
    primaryForeground: string;
    secondary: string;
    secondaryForeground: string;
    accent: string;
    accentForeground: string;
    muted: string;
    mutedForeground: string;
    card: string;
    cardForeground: string;
    cardBorder: string;
    popover: string;
    popoverForeground: string;
    sidebarBg: string;
    sidebarText: string;
    sidebarBorder: string;
    sidebarActiveBg: string;
    sidebarActiveText: string;
    sidebarAccent: string;
    navBg: string;
    navText: string;
    btnPrimaryBg: string;
    btnPrimaryText: string;
    btnPrimaryHover: string;
    btnSecondaryBg: string;
    btnSecondaryText: string;
    btnSecondaryHover: string;
    success: string;
    warning: string;
    error: string;
    info: string;
    border: string;
    input: string;
    ring: string;
    shadowSm: string;
    shadowMd: string;
    shadowLg: string;
    radiusSm: string;
    radiusMd: string;
    radiusLg: string;
  };
  isDefault?: boolean;
  createdAt?: any;
}

export type WizardProjectTypeSetting = {
    enabled: boolean;
    imageUrl?: string;
};

export type WizardEnvironmentSetting = {
    imageUrl?: string;
};

export type ViewingDistanceOption = {
  id: string;
  value: string;
  imageUrl?: string;
  recommended?: boolean;
};

export type PixelPitchOption = {
  id: string;
  value: string;
  recommended: boolean;
  imageUrl?: string;
};

export type SystemMessageType = 'info' | 'success' | 'warning' | 'alert';

export type SystemMessage = {
  id: string;
  type: SystemMessageType;
  title: string;
  content: string;
  color: string;
  icon: string;
  active: boolean;
  showHomepage: boolean;
  showBoutique: boolean;
  showClientArea: boolean;
  showAllPages: boolean;
  startDate: string | null;
  endDate: string | null;
  permanent: boolean;
  createdAt: any;
  updatedAt: any;
};

export type WizardSettings = {
    projectTypes: {
        location: WizardProjectTypeSetting;
        vente: WizardProjectTypeSetting;
    };
    environments: {
        interieur: WizardEnvironmentSetting;
        'semi-exterieur': WizardEnvironmentSetting;
        exterieur: WizardEnvironmentSetting;
    };
    viewingDistanceImageUrl?: string;
    viewingDistances: ViewingDistanceOption[];
    pixelPitchImageUrl?: string;
    pixelPitches: PixelPitchOption[];
};

export type UserRoleType = 'admin' | 'prestataire' | 'commercial';

export interface UserPermissions {
  canChat: boolean;
  canBlock: boolean;
  canDisableNotifications: boolean;
  canRemoveChat: boolean;
}

export interface UserProfileChat extends UserProfile {
  isOnline: boolean;
  isTyping: boolean;
  chatStatus?: string;
  blockedUsers: string[]; 
  mutedUsers: string[]; 
  restrictedContacts: string[]; 
  identificationBlocked?: boolean;
  notificationsBlocked?: boolean;
  adminOnly?: boolean; 
  isIsolated?: boolean; 
  isAnnoying?: boolean; 
  isInDiscussion?: boolean; 
  exclusionMetadata?: Record<string, { date: string, reason: string, isPublic?: boolean }>; 
  permissions: UserPermissions;
  lastSeen?: any; 
  pinnedUserIds?: string[];
  assignedSuppliers?: string[];
}

export type MessageType = 'text' | 'image' | 'video' | 'file' | 'audio' | 'summary';
export type MessageStatus = 'sent' | 'delivered' | 'seen';

export interface MessageOption {
  label: string;
  value: string;
  imageUrl?: string;
  description?: string;
  translationKey?: string;
  translationParams?: Record<string, string | number>;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderName?: string;
  senderRole?: string;
  content: string;
  type: MessageType;
  fileUrl?: string;
  status: MessageStatus;
  createdAt: any; 
  duration?: number; // seconds, for audio messages
  reactions?: Record<string, string[]>; 
  options?: MessageOption[]; // Interactive rich buttons for the wizard bot
  summaryData?: Record<string, string>; // Data for the wizard bot summary card
  botImage?: string; // Specific avatar image for this bot message
  translationKey?: string;
  translationParams?: Record<string, string | number>;
}

export interface Chat {
  id: string;
  participants: string[];
  lastMessage?: string;
  lastMessageAt?: any; 
  unreadCount: Record<string, number>;
  isGroup?: boolean;
  groupName?: string;
  quoteId?: string;
  quoteNumber?: string;
}

export interface AdminSettings {
  allowProviderChat: boolean;
  allowSalesChat: boolean;
  allowUserBlocking: boolean;
  allowNotifications: boolean;
  contactListWidth: number;
}

export interface DisputeMessage {
  sender: 'customer' | 'admin';
  text: string;
  createdAt: string;
}

export interface Dispute {
  id: string;
  customerId: string;
  customerEmail: string;
  reason: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  createdAt: string;
  updatedAt: string;
  messages?: DisputeMessage[];
  unreadByClient?: boolean;
}
