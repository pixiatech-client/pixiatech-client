/**
 * Validation structurelle d'un bootstrap destiné au module Assistant Bot Pixia.
 *
 * Cette couche ne remplace pas la confiance dans le serveur (le bootstrap est
 * construit côté serveur), mais elle empêche qu'un payload incomplet, un mode
 * démonstration ou une réponse d'API plus ancienne soit consommé par le widget.
 */

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isNumberOrNull(value: unknown): value is number | null {
  return value === null || typeof value === 'number';
}

function isStringOrNull(value: unknown): value is string | null {
  return value === null || typeof value === 'string';
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isString);
}

function isDateString(value: unknown): value is string {
  return isString(value) && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isToggleOption(value: unknown): boolean {
  return (
    isObject(value) &&
    typeof value.enabled === 'boolean' &&
    isString(value.imageUrl)
  );
}

function isClientProfile(value: unknown): boolean {
  return (
    isObject(value) &&
    isString(value.id) &&
    isString(value.avatarUrl) &&
    isString(value.company) &&
    isString(value.representative) &&
    isString(value.email) &&
    isString(value.phone) &&
    isString(value.address) &&
    isString(value.deliveryCity) &&
    isString(value.deliveryPostcode)
  );
}

export function isBootstrapPayloadValid(value: unknown): boolean {
  if (!isObject(value)) return false;

  // Un bootstrap de démonstration ne peut jamais alimenter le parcours réel.
  if (value.demoMode !== false) return false;
  if (
    value.pricingFormulaStatus !== 'on_quote_isolated' &&
    value.pricingFormulaStatus !== 'configured'
  ) {
    return false;
  }
  // Un mode de simulation d'e-mails n'est jamais un bootstrap de production.
  if (value.emailMode !== 'smtp') return false;

  const settings = value.settings;
  if (
    !isObject(settings) ||
    typeof settings.isWizardBotEnabled !== 'boolean' ||
    typeof settings.isEmailVerificationEnabled !== 'boolean' ||
    typeof settings.isPriceHidden !== 'boolean' ||
    !isString(settings.botWelcomeMessage)
  ) {
    return false;
  }
  const estimationFlow = settings.estimationFlow;
  if (
    !isObject(estimationFlow) ||
    (estimationFlow.taxMode !== 'ht' && estimationFlow.taxMode !== 'ttc') ||
    typeof estimationFlow.taxEnabled !== 'boolean' ||
    typeof estimationFlow.taxRate !== 'number' ||
    !isString(estimationFlow.contractTemplateFr) ||
    estimationFlow.contractTemplateFr.length === 0 ||
    !isString(estimationFlow.contractTemplateEn) ||
    estimationFlow.contractTemplateEn.length === 0
  ) {
    return false;
  }
  const emailVerification = settings.emailVerification;
  if (
    !isObject(emailVerification) ||
    typeof emailVerification.validityMinutes !== 'number'
  ) {
    return false;
  }

  const wizardSettings = value.wizardSettings;
  if (!isObject(wizardSettings)) return false;
  const projectTypes = wizardSettings.projectTypes;
  const environments = wizardSettings.environments;
  if (
    !isObject(projectTypes) ||
    !isToggleOption(projectTypes.location) ||
    !isToggleOption(projectTypes.vente) ||
    !isObject(environments) ||
    !isToggleOption(environments.interieur) ||
    !isToggleOption(environments['semi-exterieur']) ||
    !isToggleOption(environments.exterieur) ||
    !isStringArray(wizardSettings.viewingDistances) ||
    !Array.isArray(wizardSettings.pixelPitches) ||
    !wizardSettings.pixelPitches.every(
      (pitch) =>
        isObject(pitch) &&
        typeof pitch.value === 'number' &&
        isString(pitch.label) &&
        isString(pitch.marketingLabelFr) &&
        isString(pitch.marketingLabelEn)
    )
  ) {
    return false;
  }

  const deliverySettings = value.deliverySettings;
  if (
    !isObject(deliverySettings) ||
    deliverySettings.currency !== 'EUR' ||
    !Array.isArray(deliverySettings.zones) ||
    !deliverySettings.zones.every(
      (zone) =>
        isObject(zone) &&
        isString(zone.id) &&
        isString(zone.name) &&
        isNumberOrNull(zone.baseCost)
    )
  ) {
    return false;
  }

  const laborSettings = value.laborSettings;
  if (
    !isObject(laborSettings) ||
    !isNumberOrNull(laborSettings.baseTechnicianRate)
  ) {
    return false;
  }

  if (!Array.isArray(value.products)) return false;
  for (const product of value.products) {
    if (
      !isObject(product) ||
      !isString(product.id) ||
      product.id.length === 0 ||
      !isString(product.name) ||
      !isString(product.sku) ||
      !isNumberOrNull(product.pitch) ||
      !isStringOrNull(product.distance) ||
      !isStringArray(product.availableFor) ||
      !isStringArray(product.environments) ||
      typeof product.tileWidthMm !== 'number' ||
      typeof product.tileHeightMm !== 'number' ||
      typeof product.brightnessNits !== 'number' ||
      typeof product.refreshRateHz !== 'number' ||
      !isString(product.ipRating) ||
      typeof product.weightKgPerSqm !== 'number' ||
      !isNumberOrNull(product.salePricePerSqm) ||
      !isNumberOrNull(product.rentalPricePerSqmDay) ||
      !isStringArray(product.images) ||
      !isString(product.descriptionFr) ||
      !isString(product.descriptionEn)
    ) {
      return false;
    }
  }

  const locations = value.locations;
  if (
    !isObject(locations) ||
    !Array.isArray(locations.villes) ||
    !locations.villes.every(
      (city) =>
        isObject(city) &&
        isString(city.id) &&
        isString(city.name) &&
        isString(city.postcode) &&
        isString(city.zoneId)
    )
  ) {
    return false;
  }

  if (
    !Array.isArray(value.blockedPeriods) ||
    !value.blockedPeriods.every(
      (period) =>
        isObject(period) &&
        isString(period.id) &&
        isDateString(period.from) &&
        isDateString(period.to) &&
        isString(period.reasonFr) &&
        isString(period.reasonEn)
    )
  ) {
    return false;
  }

  const pdfSettings = value.pdfSettings;
  if (
    !isObject(pdfSettings) ||
    !isString(pdfSettings.companyName) ||
    !isString(pdfSettings.companyAddress) ||
    !isString(pdfSettings.companyEmail) ||
    !isString(pdfSettings.companyPhone) ||
    !isString(pdfSettings.siret) ||
    !isString(pdfSettings.footerFr) ||
    !isString(pdfSettings.footerEn)
  ) {
    return false;
  }

  if (
    value.clientProfile !== undefined &&
    value.clientProfile !== null &&
    !isClientProfile(value.clientProfile)
  ) {
    return false;
  }

  return true;
}
