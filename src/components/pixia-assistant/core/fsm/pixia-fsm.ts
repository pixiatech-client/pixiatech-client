import { getAvailableDistances, getAvailablePitches, matchProducts } from '../catalog/pitch-matcher';
import { t } from '../i18n/translations';
import { computeAreaSqm } from '../pricing/pricing-engine';
import {
  STEP,
  type BootstrapPayload,
  type ChatMessage,
  type ClientFormState,
  type ClientProfile,
  type ConfigState,
  type EnvironmentType,
  type Language,
  type MessageOption,
  type Product,
  type ProjectType,
  type ScreenShape,
  type SecurityState,
  type StepSnapshot,
} from '../types';
import {
  evaluateErrorEscalation,
  validateAddress,
  validateDeliveryCity,
  validateDimensions,
  validateEmail,
  validateNonEmptyText,
  validatePhone,
  validateQuantity,
} from '../validation/validators';

export const STEP_ORDER_SALE: STEP[] = [
  STEP.PROJECT_TYPE,
  STEP.ENVIRONMENT,
  STEP.DIMENSIONS,
  STEP.DISTANCE,
  STEP.PITCH,
  STEP.SUMMARY,
  STEP.GENERATING,
  STEP.PRODUCTS,
  STEP.QUANTITY,
  STEP.SITE_PHOTO,
  STEP.CLIENT_ACCOUNT,
  STEP.FORM_COMPANY,
  STEP.FORM_REPRESENTATIVE,
  STEP.FORM_EMAIL,
  STEP.FORM_PHONE,
  STEP.FORM_ADDRESS,
  STEP.DELIVERY,
  STEP.DELIVERY_CHOICE,
  STEP.INSTALLATION,
  STEP.CONTRAT,
  STEP.SECURITE,
  STEP.FELICITATIONS,
  STEP.SUCCESS,
];

export const STEP_ORDER_RENTAL: STEP[] = [
  STEP.PROJECT_TYPE,
  STEP.RENTAL_PERIOD,
  STEP.ENVIRONMENT,
  STEP.DIMENSIONS,
  STEP.DISTANCE,
  STEP.PITCH,
  STEP.SUMMARY,
  STEP.GENERATING,
  STEP.PRODUCTS,
  STEP.QUANTITY,
  STEP.SITE_PHOTO,
  STEP.CLIENT_ACCOUNT,
  STEP.FORM_COMPANY,
  STEP.FORM_REPRESENTATIVE,
  STEP.FORM_EMAIL,
  STEP.FORM_PHONE,
  STEP.FORM_ADDRESS,
  STEP.DELIVERY,
  STEP.DELIVERY_CHOICE,
  STEP.INSTALLATION,
  STEP.RENTAL_COMMENT,
  STEP.CONTRAT,
  STEP.SECURITE,
  STEP.FELICITATIONS,
  STEP.SUCCESS,
];

export interface PixiaEngineState {
  lang: Language;
  step: STEP;
  messages: ChatMessage[];
  history: StepSnapshot[];
  configState: ConfigState;
  form: ClientFormState;
  includeDelivery: boolean | null;
  includeInstallation: boolean | null;
  security: SecurityState;
  recommendedProducts: Product[];
  isFallbackCatalog: boolean;
  quoteId: string | null;
  quoteReference: string | null;
  capabilityToken: string | null;
  errorCount: number;
  shouldAutoClose: boolean;
}

let msgSeq = 0;
function nextMsgId(prefix: 'bot' | 'user'): string {
  msgSeq += 1;
  return `${prefix}-${Date.now()}-${msgSeq}`;
}

export function createInitialConfigState(): ConfigState {
  return {
    projectType: null,
    environment: null,
    width: null,
    height: null,
    screenShape: 'flat',
    distance: null,
    pixelPitch: null,
    pitchLabel: null,
    selectedProduct: null,
    quantity: 1,
    installationPhoto: null,
    rentalStartDate: null,
    rentalEndDate: null,
    rentalStartTime: '08:00',
    rentalEndTime: '18:00',
    rentalComment: '',
  };
}

export function createInitialFormState(): ClientFormState {
  return {
    company: '',
    representative: '',
    email: '',
    phone: '',
    address: '',
    deliveryCity: '',
    deliveryPostcode: '',
  };
}

export function createInitialSecurityState(): SecurityState {
  return {
    contractAccepted: false,
    contractReadApproved: false,
    signatureValidated: false,
    signatureDataUrl: null,
    otpVerified: false,
    otpAttemptsLeft: 3,
    resendAttemptsLeft: 2,
    otpCooldownSeconds: 0,
    pdfUrl: null,
  };
}

function buildProjectTypeOptions(lang: Language, data: BootstrapPayload): MessageOption[] {
  const opts: MessageOption[] = [];
  if (data.wizardSettings.projectTypes.vente.enabled !== false) {
    opts.push({
      id: 'vente',
      value: 'vente',
      label: t(lang, 'bot.optionSale'),
      labelKey: 'bot.optionSale',
      description: t(lang, 'bot.optionSaleDesc'),
      imageUrl: data.wizardSettings.projectTypes.vente.imageUrl,
    });
  }
  if (data.wizardSettings.projectTypes.location.enabled !== false) {
    opts.push({
      id: 'location',
      value: 'location',
      label: t(lang, 'bot.optionRental'),
      labelKey: 'bot.optionRental',
      description: t(lang, 'bot.optionRentalDesc'),
      imageUrl: data.wizardSettings.projectTypes.location.imageUrl,
    });
  }
  return opts;
}

function buildEnvironmentOptions(lang: Language, data: BootstrapPayload): MessageOption[] {
  const envs: Array<{ key: EnvironmentType; labelKey: string; descKey: string }> = [
    { key: 'interieur', labelKey: 'bot.envIndoor', descKey: 'bot.envIndoorDesc' },
    { key: 'semi-exterieur', labelKey: 'bot.envSemiOutdoor', descKey: 'bot.envSemiOutdoorDesc' },
    { key: 'exterieur', labelKey: 'bot.envOutdoor', descKey: 'bot.envOutdoorDesc' },
  ];
  const active = envs.filter((e) => data.wizardSettings.environments[e.key]?.enabled !== false);
  const finalList = active.length > 0 ? active : envs;
  return finalList.map((e) => ({
    id: e.key,
    value: e.key,
    label: t(lang, e.labelKey),
    labelKey: e.labelKey,
    description: t(lang, e.descKey),
    imageUrl: data.wizardSettings.environments[e.key]?.imageUrl,
  }));
}

function createBotMessage(
  lang: Language,
  translationKey: string,
  options?: {
    translationParams?: Record<string, string | number>;
    literalContent?: string;
    choices?: MessageOption[];
  }
): ChatMessage {
  return {
    id: nextMsgId('bot'),
    senderId: 'bot',
    content: options?.literalContent ?? t(lang, translationKey, options?.translationParams),
    translationKey: options?.literalContent ? undefined : translationKey,
    translationParams: options?.translationParams,
    options: options?.choices,
    optionsDisabled: false,
    createdAt: Date.now(),
  };
}

function lockPreviousBotOptions(messages: ChatMessage[]): ChatMessage[] {
  let locked = false;
  const result = [...messages];
  for (let i = result.length - 1; i >= 0; i -= 1) {
    if (result[i].senderId === 'bot' && result[i].options && !locked) {
      result[i] = { ...result[i], optionsDisabled: true };
      locked = true;
      break;
    }
  }
  return result;
}

function appendUserMessage(
  messages: ChatMessage[],
  content: string,
  fileUrl?: string,
  selectedProduct?: Product
): ChatMessage[] {
  const locked = lockPreviousBotOptions(messages);
  return [
    ...locked,
    {
      id: nextMsgId('user'),
      senderId: 'user',
      content,
      fileUrl,
      selectedProduct,
      createdAt: Date.now(),
    },
  ];
}

function pushSnapshot(state: PixiaEngineState): StepSnapshot[] {
  const snapshot: StepSnapshot = {
    step: state.step,
    messages: state.messages.map((m) => ({
      ...m,
      options: m.options ? m.options.map((o) => ({ ...o })) : undefined,
    })),
    configState: { ...state.configState },
    form: { ...state.form },
    includeDelivery: state.includeDelivery,
    includeInstallation: state.includeInstallation,
    errorCount: state.errorCount,
  };
  return [...state.history, snapshot];
}

export function createInitialEngineState(lang: Language, data: BootstrapPayload): PixiaEngineState {
  const customWelcome = data.settings.botWelcomeMessage?.trim();
  const welcomeMsg = createBotMessage(lang, 'bot.welcome', {
    literalContent: customWelcome || undefined,
  });
  const questionMsg = createBotMessage(lang, 'bot.questionType', {
    choices: buildProjectTypeOptions(lang, data),
  });

  return {
    lang,
    step: STEP.PROJECT_TYPE,
    messages: [welcomeMsg, questionMsg],
    history: [],
    configState: createInitialConfigState(),
    form: createInitialFormState(),
    includeDelivery: null,
    includeInstallation: null,
    security: createInitialSecurityState(),
    recommendedProducts: [],
    isFallbackCatalog: false,
    quoteId: null,
    quoteReference: null,
    capabilityToken: null,
    errorCount: 0,
    shouldAutoClose: false,
  };
}

export function switchEngineLanguage(state: PixiaEngineState, nextLang: Language, data: BootstrapPayload): PixiaEngineState {
  if (state.lang === nextLang) return state;

  const translatedMessages = state.messages.map((msg) => {
    const content = msg.translationKey
      ? t(nextLang, msg.translationKey, msg.translationParams)
      : msg.content;
    const options = msg.options?.map((opt) => ({
      ...opt,
      label: opt.labelKey ? t(nextLang, opt.labelKey) : opt.label,
    }));
    return { ...msg, content, options };
  });

  const translatedHistory = state.history.map((snap) => ({
    ...snap,
    messages: snap.messages.map((msg) => ({
      ...msg,
      content: msg.translationKey ? t(nextLang, msg.translationKey, msg.translationParams) : msg.content,
      options: msg.options?.map((opt) => ({
        ...opt,
        label: opt.labelKey ? t(nextLang, opt.labelKey) : opt.label,
      })),
    })),
  }));

  // Refresh dynamic options if currently on PITCH or PROJECT_TYPE or ENVIRONMENT
  if (state.step === STEP.PROJECT_TYPE && translatedMessages.length > 0) {
    const last = translatedMessages[translatedMessages.length - 1];
    if (last.senderId === 'bot') {
      translatedMessages[translatedMessages.length - 1] = {
        ...last,
        options: buildProjectTypeOptions(nextLang, data),
      };
    }
  } else if (state.step === STEP.ENVIRONMENT && translatedMessages.length > 0) {
    const last = translatedMessages[translatedMessages.length - 1];
    if (last.senderId === 'bot') {
      translatedMessages[translatedMessages.length - 1] = {
        ...last,
        options: buildEnvironmentOptions(nextLang, data),
      };
    }
  } else if (state.step === STEP.PITCH && translatedMessages.length > 0) {
    const last = translatedMessages[translatedMessages.length - 1];
    if (last.senderId === 'bot') {
      const pitchChoices = getAvailablePitches(state.configState.distance, data.wizardSettings, nextLang);
      translatedMessages[translatedMessages.length - 1] = {
        ...last,
        options: pitchChoices.map((p) => ({
          id: `${p.value}-${p.isDontKnow ? 'idk' : 'std'}`,
          value: String(p.value),
          label: p.label,
        })),
      };
    }
  }

  return {
    ...state,
    lang: nextLang,
    messages: translatedMessages,
    history: translatedHistory,
    security: {
      ...state.security,
      pdfUrl: null, // Invalidate cached PDF on language change per audit spec §11
    },
  };
}

export function stepBack(state: PixiaEngineState): PixiaEngineState {
  if (state.history.length === 0) return state;
  const previous = state.history[state.history.length - 1];
  return {
    ...state,
    step: previous.step,
    messages: previous.messages,
    history: state.history.slice(0, -1),
    configState: previous.configState,
    form: previous.form,
    includeDelivery: previous.includeDelivery,
    includeInstallation: previous.includeInstallation,
    errorCount: previous.errorCount,
    shouldAutoClose: false,
  };
}

export function rewindToStep(state: PixiaEngineState, targetStep: STEP): PixiaEngineState {
  for (let i = state.history.length - 1; i >= 0; i -= 1) {
    const snap = state.history[i];
    if (snap.step === targetStep) {
      return {
        ...state,
        step: snap.step,
        messages: snap.messages,
        history: state.history.slice(0, i),
        configState: snap.configState,
        form: snap.form,
        includeDelivery: snap.includeDelivery,
        includeInstallation: snap.includeInstallation,
        errorCount: snap.errorCount,
        shouldAutoClose: false,
      };
    }
  }
  return state;
}

export function selectProjectType(
  state: PixiaEngineState,
  projectType: ProjectType,
  data: BootstrapPayload
): PixiaEngineState {
  if (state.step !== STEP.PROJECT_TYPE) return state;
  const history = pushSnapshot(state);
  const label = projectType === 'vente' ? t(state.lang, 'bot.optionSale') : t(state.lang, 'bot.optionRental');
  let messages = appendUserMessage(state.messages, label);

  if (projectType === 'location') {
    messages = [
      ...messages,
      createBotMessage(state.lang, 'bot.perfectRental'),
      createBotMessage(state.lang, 'bot.promptRentalPeriod'),
    ];
    return {
      ...state,
      history,
      step: STEP.RENTAL_PERIOD,
      messages,
      configState: { ...state.configState, projectType },
      errorCount: 0,
    };
  }

  messages = [
    ...messages,
    createBotMessage(state.lang, 'bot.perfectSale'),
    createBotMessage(state.lang, 'bot.promptEnvironment', {
      choices: buildEnvironmentOptions(state.lang, data),
    }),
  ];
  return {
    ...state,
    history,
    step: STEP.ENVIRONMENT,
    messages,
    configState: { ...state.configState, projectType },
    errorCount: 0,
  };
}

export function submitRentalPeriod(
  state: PixiaEngineState,
  payload: { startDate: string; endDate: string; startTime: string; endTime: string },
  data: BootstrapPayload
): PixiaEngineState {
  if (state.step !== STEP.RENTAL_PERIOD) return state;
  if (!payload.startDate || !payload.endDate || payload.endDate < payload.startDate) {
    return {
      ...state,
      messages: [...state.messages, createBotMessage(state.lang, 'bot.errorDatesInvalid')],
    };
  }

  const history = pushSnapshot(state);
  const userText = `${payload.startDate} → ${payload.endDate} (${payload.startTime}–${payload.endTime})`;
  let messages = appendUserMessage(state.messages, userText);
  messages = [
    ...messages,
    createBotMessage(state.lang, 'bot.periodNoted', {
      translationParams: {
        start: payload.startDate,
        end: payload.endDate,
        startTime: payload.startTime,
        endTime: payload.endTime,
      },
    }),
    createBotMessage(state.lang, 'bot.promptEnvironment', {
      choices: buildEnvironmentOptions(state.lang, data),
    }),
  ];

  return {
    ...state,
    history,
    step: STEP.ENVIRONMENT,
    messages,
    configState: {
      ...state.configState,
      rentalStartDate: payload.startDate,
      rentalEndDate: payload.endDate,
      rentalStartTime: payload.startTime,
      rentalEndTime: payload.endTime,
    },
    errorCount: 0,
  };
}

export function submitRentalComment(
  state: PixiaEngineState,
  comment: string | null,
  _data?: BootstrapPayload
): PixiaEngineState {
  if (state.step !== STEP.RENTAL_COMMENT) return state;
  const trimmed = (comment ?? '').trim();
  const history = pushSnapshot(state);
  const userText = trimmed || t(state.lang, 'bot.rentalCommentSkipped');
  let messages = appendUserMessage(state.messages, userText);
  messages = [...messages, createBotMessage(state.lang, 'bot.terms')];

  return {
    ...state,
    history,
    step: STEP.CONTRAT,
    messages,
    configState: {
      ...state.configState,
      rentalComment: trimmed,
    },
    errorCount: 0,
  };
}

export function selectEnvironment(
  state: PixiaEngineState,
  environment: EnvironmentType
): PixiaEngineState {
  if (state.step !== STEP.ENVIRONMENT) return state;
  const history = pushSnapshot(state);
  const labelKey =
    environment === 'interieur'
      ? 'bot.envIndoor'
      : environment === 'semi-exterieur'
        ? 'bot.envSemiOutdoor'
        : 'bot.envOutdoor';

  let messages = appendUserMessage(state.messages, t(state.lang, labelKey));
  messages = [
    ...messages,
    createBotMessage(state.lang, 'bot.dimensions'),
  ];

  return {
    ...state,
    history,
    step: STEP.DIMENSIONS,
    messages,
    configState: { ...state.configState, environment },
    errorCount: 0,
  };
}

const SHAPE_LABELS: Record<ScreenShape, { fr: string; en: string }> = {
  flat: { fr: 'Plat', en: 'Flat' },
  curved: { fr: 'Incurvé', en: 'Curved' },
  '360': { fr: '360°', en: '360°' },
};

export function submitDimensions(
  state: PixiaEngineState,
  widthRaw: string,
  heightRaw: string,
  data: BootstrapPayload,
  screenShape: ScreenShape = 'flat',
  curveLeft?: number,
  curveRight?: number
): PixiaEngineState {
  if (state.step !== STEP.DIMENSIONS) return state;
  const check = validateDimensions(widthRaw, heightRaw);
  if (!check.valid || check.width === undefined || check.height === undefined) {
    const esc = evaluateErrorEscalation(state.errorCount, check.errorKey ?? 'bot.errorDimensionsInvalid');
    return {
      ...state,
      errorCount: esc.nextErrorCount,
      shouldAutoClose: esc.shouldAutoClose,
      messages: [...state.messages, createBotMessage(state.lang, esc.messageKey)],
    };
  }

  const history = pushSnapshot(state);
  const area = computeAreaSqm(check.width, check.height);
  const distances = getAvailableDistances(data.products, state.configState.projectType, data.wizardSettings);
  const shapeLabel = (SHAPE_LABELS[screenShape] ?? SHAPE_LABELS.flat)[state.lang];
  const hasCurveAngles =
    screenShape === 'curved' &&
    typeof curveLeft === 'number' &&
    typeof curveRight === 'number';
  const formatDeg = (v: number) => (v > 0 ? `+${v}°` : `${v}°`);
  const curveDetail = hasCurveAngles
    ? ` (${state.lang === 'fr' ? 'G' : 'L'} ${formatDeg(curveLeft)} / ${state.lang === 'fr' ? 'D' : 'R'} ${formatDeg(curveRight)})`
    : '';
  let messages = appendUserMessage(
    state.messages,
    `${check.width}m × ${check.height}m · ${shapeLabel}${curveDetail}`
  );
  messages = [
    ...messages,
    createBotMessage(state.lang, 'bot.dimensionsNoted', {
      translationParams: { width: check.width, height: check.height, area },
    }),
    createBotMessage(state.lang, 'bot.promptDistance', {
      choices: distances.map((d) => ({ id: d, value: d, label: d })),
    }),
  ];

  return {
    ...state,
    history,
    step: STEP.DISTANCE,
    messages,
    configState: {
      ...state.configState,
      width: check.width,
      height: check.height,
      screenShape,
      curveLeft: screenShape === 'curved' ? (curveLeft ?? 18) : undefined,
      curveRight: screenShape === 'curved' ? (curveRight ?? 18) : undefined,
    },
    errorCount: 0,
  };
}

export function selectDistance(
  state: PixiaEngineState,
  distance: string,
  data: BootstrapPayload
): PixiaEngineState {
  if (state.step !== STEP.DISTANCE) return state;
  const history = pushSnapshot(state);
  const pitches = getAvailablePitches(distance, data.wizardSettings, state.lang);
  let messages = appendUserMessage(state.messages, distance);
  messages = [
    ...messages,
    createBotMessage(state.lang, 'bot.promptPitch', {
      choices: pitches.map((p) => ({
        id: `${p.value}-${p.isDontKnow ? 'idk' : 'std'}`,
        value: String(p.value),
        label: p.label,
      })),
    }),
  ];

  return {
    ...state,
    history,
    step: STEP.PITCH,
    messages,
    configState: { ...state.configState, distance },
    errorCount: 0,
  };
}

export function selectPitch(
  state: PixiaEngineState,
  pitchValue: number,
  pitchLabel: string
): PixiaEngineState {
  if (state.step !== STEP.PITCH) return state;
  const history = pushSnapshot(state);
  let messages = appendUserMessage(state.messages, pitchLabel);
  messages = [...messages, createBotMessage(state.lang, 'bot.excellentChoice')];

  return {
    ...state,
    history,
    step: STEP.SUMMARY,
    messages,
    configState: {
      ...state.configState,
      pixelPitch: pitchValue,
      pitchLabel,
    },
    errorCount: 0,
  };
}

export function startProductSearch(state: PixiaEngineState): PixiaEngineState {
  if (state.step !== STEP.SUMMARY) return state;
  const history = pushSnapshot(state);
  const messages = [...state.messages, createBotMessage(state.lang, 'bot.searching')];
  return {
    ...state,
    history,
    step: STEP.GENERATING,
    messages,
  };
}

export function completeProductSearch(
  state: PixiaEngineState,
  data: BootstrapPayload
): PixiaEngineState {
  if (state.step !== STEP.GENERATING) return state;
  const requestedPitch = state.configState.pixelPitch ?? 2.5;
  const { matches, isFallbackCatalog } = matchProducts(data.products, requestedPitch);
  const botMsg = isFallbackCatalog
    ? createBotMessage(state.lang, 'bot.noMatch')
    : createBotMessage(state.lang, 'bot.recommendation', {
        translationParams: { count: matches.length },
      });

  return {
    ...state,
    step: STEP.PRODUCTS,
    recommendedProducts: matches,
    isFallbackCatalog,
    messages: [...state.messages, botMsg],
  };
}

export function selectProduct(state: PixiaEngineState, product: Product): PixiaEngineState {
  if (state.step !== STEP.PRODUCTS) return state;
  const history = pushSnapshot(state);
  let messages = appendUserMessage(state.messages, product.name, undefined, product);
  messages = [...messages, createBotMessage(state.lang, 'bot.quantity')];

  return {
    ...state,
    history,
    step: STEP.QUANTITY,
    messages,
    configState: { ...state.configState, selectedProduct: product, quantity: 1 },
    errorCount: 0,
  };
}

export function submitQuantity(state: PixiaEngineState, quantityRaw: string | number): PixiaEngineState {
  if (state.step !== STEP.QUANTITY) return state;
  const check = validateQuantity(quantityRaw);
  if (!check.valid || check.quantity === undefined) {
    const esc = evaluateErrorEscalation(state.errorCount, check.errorKey ?? 'bot.errorQuantityZero');
    return {
      ...state,
      errorCount: esc.nextErrorCount,
      shouldAutoClose: esc.shouldAutoClose,
      messages: [...state.messages, createBotMessage(state.lang, esc.messageKey)],
    };
  }

  const history = pushSnapshot(state);
  let messages = appendUserMessage(state.messages, String(check.quantity));
  messages = [
    ...messages,
    createBotMessage(state.lang, 'bot.photo'),
  ];

  return {
    ...state,
    history,
    step: STEP.SITE_PHOTO,
    messages,
    configState: { ...state.configState, quantity: check.quantity },
    errorCount: 0,
  };
}

export function submitSitePhoto(
  state: PixiaEngineState,
  photoDataUrl: string | null,
  options?: { enableAccountStep?: boolean; isLoggedIn?: boolean }
): PixiaEngineState {
  if (state.step !== STEP.SITE_PHOTO) return state;
  const history = pushSnapshot(state);
  const userText = photoDataUrl
    ? (state.lang === 'fr' ? 'Photo du site ajoutée' : 'Site photo attached')
    : t(state.lang, 'bot.skip');

  const goAccount = Boolean(options?.enableAccountStep);
  const nextStep = goAccount ? STEP.CLIENT_ACCOUNT : STEP.FORM_COMPANY;
  const botKey = goAccount
    ? options?.isLoggedIn
      ? 'bot.clientRecognized'
      : 'bot.clientHasAccount'
    : 'bot.formCompany';

  let messages = appendUserMessage(state.messages, userText, photoDataUrl ?? undefined);
  messages = [...messages, createBotMessage(state.lang, botKey)];

  return {
    ...state,
    history,
    step: nextStep,
    messages,
    configState: { ...state.configState, installationPhoto: photoDataUrl },
    errorCount: 0,
  };
}

export function confirmClientAccountProfile(
  state: PixiaEngineState,
  profile: ClientProfile
): PixiaEngineState {
  if (state.step !== STEP.CLIENT_ACCOUNT) return state;
  const history = pushSnapshot(state);
  const userText =
    state.lang === 'fr'
      ? `Oui, c’est bien moi (${profile.representative} — ${profile.company})`
      : `Yes, that’s me (${profile.representative} — ${profile.company})`;

  let messages = appendUserMessage(state.messages, userText);
  messages = [
    ...messages,
    createBotMessage(state.lang, 'bot.clientConfirmed', {
      translationParams: { company: profile.company },
    }),
  ];

  const hasCity = profile.deliveryCity.trim().length >= 2;
  if (hasCity) {
    messages = [...messages, createBotMessage(state.lang, 'bot.installation')];
  } else {
    messages = [...messages, createBotMessage(state.lang, 'bot.delivery')];
  }

  return {
    ...state,
    history,
    step: hasCity ? STEP.DELIVERY_CHOICE : STEP.DELIVERY,
    messages,
    form: {
      company: profile.company,
      representative: profile.representative,
      email: profile.email,
      phone: profile.phone,
      address: profile.address,
      deliveryCity: profile.deliveryCity,
      deliveryPostcode: profile.deliveryPostcode,
    },
    errorCount: 0,
  };
}

export function proceedToManualForm(state: PixiaEngineState): PixiaEngineState {
  if (state.step !== STEP.CLIENT_ACCOUNT) return state;
  const history = pushSnapshot(state);
  const userText =
    state.lang === 'fr' ? 'Saisir mes coordonnées manuellement' : 'Enter my details manually';
  let messages = appendUserMessage(state.messages, userText);
  messages = [
    ...messages,
    createBotMessage(state.lang, 'bot.clientManual'),
    createBotMessage(state.lang, 'bot.formCompany'),
  ];

  return {
    ...state,
    history,
    step: STEP.FORM_COMPANY,
    messages,
    errorCount: 0,
  };
}

export function submitFormCompany(state: PixiaEngineState, company: string): PixiaEngineState {
  if (state.step !== STEP.FORM_COMPANY) return state;
  const check = validateNonEmptyText(company);
  if (!check.valid) {
    const esc = evaluateErrorEscalation(state.errorCount, check.errorKey ?? 'bot.errorAddressShort');
    return {
      ...state,
      errorCount: esc.nextErrorCount,
      shouldAutoClose: esc.shouldAutoClose,
      messages: [...state.messages, createBotMessage(state.lang, esc.messageKey)],
    };
  }
  const history = pushSnapshot(state);
  let messages = appendUserMessage(state.messages, company.trim());
  messages = [...messages, createBotMessage(state.lang, 'bot.formRepresentative')];
  return {
    ...state,
    history,
    step: STEP.FORM_REPRESENTATIVE,
    messages,
    form: { ...state.form, company: company.trim() },
    errorCount: 0,
  };
}

export function submitFormRepresentative(state: PixiaEngineState, representative: string): PixiaEngineState {
  if (state.step !== STEP.FORM_REPRESENTATIVE) return state;
  const check = validateNonEmptyText(representative);
  if (!check.valid) {
    const esc = evaluateErrorEscalation(state.errorCount, check.errorKey ?? 'bot.errorAddressShort');
    return {
      ...state,
      errorCount: esc.nextErrorCount,
      shouldAutoClose: esc.shouldAutoClose,
      messages: [...state.messages, createBotMessage(state.lang, esc.messageKey)],
    };
  }
  const history = pushSnapshot(state);
  let messages = appendUserMessage(state.messages, representative.trim());
  messages = [...messages, createBotMessage(state.lang, 'bot.formEmail')];
  return {
    ...state,
    history,
    step: STEP.FORM_EMAIL,
    messages,
    form: { ...state.form, representative: representative.trim() },
    errorCount: 0,
  };
}

export function submitFormEmail(state: PixiaEngineState, email: string): PixiaEngineState {
  if (state.step !== STEP.FORM_EMAIL) return state;
  const check = validateEmail(email);
  if (!check.valid) {
    const esc = evaluateErrorEscalation(state.errorCount, check.errorKey ?? 'bot.errorEmailInvalid');
    return {
      ...state,
      errorCount: esc.nextErrorCount,
      shouldAutoClose: esc.shouldAutoClose,
      messages: [...state.messages, createBotMessage(state.lang, esc.messageKey)],
    };
  }
  const history = pushSnapshot(state);
  let messages = appendUserMessage(state.messages, email.trim());
  messages = [...messages, createBotMessage(state.lang, 'bot.formPhone')];
  return {
    ...state,
    history,
    step: STEP.FORM_PHONE,
    messages,
    form: { ...state.form, email: email.trim() },
    errorCount: 0,
  };
}

export function submitFormPhone(state: PixiaEngineState, phone: string): PixiaEngineState {
  if (state.step !== STEP.FORM_PHONE) return state;
  const check = validatePhone(phone);
  if (!check.valid || !check.normalized) {
    const esc = evaluateErrorEscalation(state.errorCount, check.errorKey ?? 'bot.errorPhoneInvalid');
    return {
      ...state,
      errorCount: esc.nextErrorCount,
      shouldAutoClose: esc.shouldAutoClose,
      messages: [...state.messages, createBotMessage(state.lang, esc.messageKey)],
    };
  }
  const history = pushSnapshot(state);
  let messages = appendUserMessage(state.messages, check.normalized);
  messages = [...messages, createBotMessage(state.lang, 'bot.formAddress')];
  return {
    ...state,
    history,
    step: STEP.FORM_ADDRESS,
    messages,
    form: { ...state.form, phone: check.normalized },
    errorCount: 0,
  };
}

export function submitFormAddress(state: PixiaEngineState, address: string): PixiaEngineState {
  if (state.step !== STEP.FORM_ADDRESS) return state;
  const check = validateAddress(address);
  if (!check.valid) {
    const esc = evaluateErrorEscalation(state.errorCount, check.errorKey ?? 'bot.errorAddressShort');
    return {
      ...state,
      errorCount: esc.nextErrorCount,
      shouldAutoClose: esc.shouldAutoClose,
      messages: [...state.messages, createBotMessage(state.lang, esc.messageKey)],
    };
  }
  const history = pushSnapshot(state);
  let messages = appendUserMessage(state.messages, address.trim());
  messages = [...messages, createBotMessage(state.lang, 'bot.delivery')];
  return {
    ...state,
    history,
    step: STEP.DELIVERY,
    messages,
    form: { ...state.form, address: address.trim() },
    errorCount: 0,
  };
}

export function submitDeliveryCity(
  state: PixiaEngineState,
  city: string,
  postcode = ''
): PixiaEngineState {
  if (state.step !== STEP.DELIVERY) return state;
  const check = validateDeliveryCity(city);
  if (!check.valid) {
    // Per audit §6.3: DELIVERY does not auto-close on 6 errors
    const esc = evaluateErrorEscalation(state.errorCount, check.errorKey ?? 'bot.errorAddressShort', false);
    return {
      ...state,
      errorCount: esc.nextErrorCount,
      shouldAutoClose: false,
      messages: [...state.messages, createBotMessage(state.lang, esc.messageKey)],
    };
  }
  const history = pushSnapshot(state);
  let messages = appendUserMessage(state.messages, city.trim());
  messages = [...messages, createBotMessage(state.lang, 'bot.installation')];
  return {
    ...state,
    history,
    step: STEP.DELIVERY_CHOICE,
    messages,
    form: {
      ...state.form,
      deliveryCity: city.trim(),
      deliveryPostcode: postcode.trim(),
    },
    errorCount: 0,
  };
}

export function selectDeliveryChoice(state: PixiaEngineState, includeDelivery: boolean): PixiaEngineState {
  if (state.step !== STEP.DELIVERY_CHOICE) return state;
  const history = pushSnapshot(state);
  const labelKey = includeDelivery ? 'bot.deliveryYes' : 'bot.deliveryNo';
  let messages = appendUserMessage(state.messages, t(state.lang, labelKey));
  messages = [...messages, createBotMessage(state.lang, 'bot.promptInstallation')];
  return {
    ...state,
    history,
    step: STEP.INSTALLATION,
    messages,
    includeDelivery,
    errorCount: 0,
  };
}

export function selectInstallationChoice(state: PixiaEngineState, includeInstallation: boolean): PixiaEngineState {
  if (state.step !== STEP.INSTALLATION) return state;
  const history = pushSnapshot(state);
  const labelKey = includeInstallation ? 'bot.installYes' : 'bot.installNo';
  let messages = appendUserMessage(state.messages, t(state.lang, labelKey));

  if (state.configState.projectType === 'location') {
    messages = [...messages, createBotMessage(state.lang, 'bot.promptRentalComment')];
    return {
      ...state,
      history,
      step: STEP.RENTAL_COMMENT,
      messages,
      includeInstallation,
      errorCount: 0,
    };
  }

  messages = [...messages, createBotMessage(state.lang, 'bot.terms')];
  return {
    ...state,
    history,
    step: STEP.CONTRAT,
    messages,
    includeInstallation,
    errorCount: 0,
  };
}

export function completeContractCreation(
  state: PixiaEngineState,
  payload: {
    quoteId: string;
    quoteReference: string;
    signatureDataUrl: string;
    otpRequired: boolean;
    capabilityToken: string | null;
  }
): PixiaEngineState {
  if (state.step !== STEP.CONTRAT) return state;
  const history = pushSnapshot(state);
  const nextStep = payload.otpRequired ? STEP.SECURITE : STEP.FELICITATIONS;
  const nextBotKey = payload.otpRequired ? 'bot.securityPrompt' : 'bot.congratulations';

  return {
    ...state,
    history,
    step: nextStep,
    quoteId: payload.quoteId,
    quoteReference: payload.quoteReference,
    capabilityToken: payload.capabilityToken,
    errorCount: 0,
    messages: [...state.messages, createBotMessage(state.lang, nextBotKey)],
    security: {
      ...state.security,
      contractAccepted: true,
      contractReadApproved: true,
      signatureValidated: true,
      signatureDataUrl: payload.signatureDataUrl,
      otpVerified: !payload.otpRequired,
      otpAttemptsLeft: 3,
      resendAttemptsLeft: 2,
      otpCooldownSeconds: payload.otpRequired ? 300 : 0,
    },
  };
}

export function completeOtpVerification(
  state: PixiaEngineState,
  capabilityToken: string | null
): PixiaEngineState {
  if (state.step !== STEP.SECURITE) return state;
  const history = pushSnapshot(state);
  return {
    ...state,
    history,
    step: STEP.FELICITATIONS,
    capabilityToken: capabilityToken ?? state.capabilityToken,
    errorCount: 0,
    messages: [...state.messages, createBotMessage(state.lang, 'bot.congratulations')],
    security: {
      ...state.security,
      otpVerified: true,
    },
  };
}

export function completePdfAndFinish(state: PixiaEngineState, pdfUrl: string): PixiaEngineState {
  return {
    ...state,
    step: STEP.SUCCESS,
    security: {
      ...state.security,
      pdfUrl,
    },
  };
}

export function getStepProgress(state: PixiaEngineState): { current: number; total: number } {
  const order = state.configState.projectType === 'location' ? STEP_ORDER_RENTAL : STEP_ORDER_SALE;
  const idx = order.indexOf(state.step);
  return {
    current: idx >= 0 ? idx + 1 : 1,
    total: order.length,
  };
}
