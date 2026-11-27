import { describe, expect, it } from 'vitest';
import {
  getAvailableDistances,
  getAvailablePitches,
  getPitchRangeForDistance,
  matchProducts,
} from '../src/core/catalog/pitch-matcher.ts';
import {
  completeContractCreation,
  completeOtpVerification,
  completePdfAndFinish,
  completeProductSearch,
  confirmClientAccountProfile,
  createInitialEngineState,
  proceedToManualForm,
  rewindToStep,
  selectDeliveryChoice,
  selectDistance,
  selectEnvironment,
  selectInstallationChoice,
  selectPitch,
  selectProduct,
  selectProjectType,
  startProductSearch,
  stepBack,
  submitDeliveryCity,
  submitDimensions,
  submitFormAddress,
  submitFormCompany,
  submitFormEmail,
  submitFormPhone,
  submitFormRepresentative,
  submitQuantity,
  submitRentalComment,
  submitRentalPeriod,
  submitSitePhoto,
  switchEngineLanguage,
} from '../src/core/fsm/pixia-fsm.ts';
import { resolveLanguage } from '../src/core/i18n/translations.ts';
import { buildPriceSnapshot, computeAreaSqm, computeRentalDays } from '../src/core/pricing/pricing-engine.ts';
import { STEP, type BootstrapPayload } from '../src/core/types.ts';
import { inspectEmail } from '../src/core/validation/validators.ts';
import {
  DEMO_DELIVERY_SETTINGS,
  DEMO_LABOR_SETTINGS,
  DEMO_LOCATIONS,
  DEMO_PDF_SETTINGS,
  DEMO_PRODUCTS,
  DEMO_SETTINGS,
  DEMO_WIZARD_SETTINGS,
  getDemoBlockedPeriods,
} from '../server/demo-data.ts';
import { createOtpChallenge, resendOtpChallenge, verifyOtpCode } from '../server/otp-service.ts';
import { EXCLUDED_FLOATING_ROUTES, shouldRenderFloatingChat } from '../src/surfaces/pixia-events.ts';

const MOCK_BOOTSTRAP: BootstrapPayload = {
  demoMode: true,
  pricingFormulaStatus: 'on_quote_isolated',
  emailMode: 'dev-simulated',
  settings: DEMO_SETTINGS,
  wizardSettings: DEMO_WIZARD_SETTINGS,
  deliverySettings: DEMO_DELIVERY_SETTINGS,
  laborSettings: DEMO_LABOR_SETTINGS,
  products: DEMO_PRODUCTS,
  locations: DEMO_LOCATIONS,
  blockedPeriods: getDemoBlockedPeriods(),
  pdfSettings: DEMO_PDF_SETTINGS,
};

describe('PIXIA Core FSM & Rules', () => {
  it('completes a full Sale flow across all sale steps through PDF completion', () => {
    let s = createInitialEngineState('fr', MOCK_BOOTSTRAP);
    expect(s.step).toBe(STEP.PROJECT_TYPE);

    s = selectProjectType(s, 'vente', MOCK_BOOTSTRAP);
    expect(s.step).toBe(STEP.ENVIRONMENT);

    s = selectEnvironment(s, 'interieur');
    expect(s.step).toBe(STEP.DIMENSIONS);

    s = submitDimensions(s, '4', '2.5', MOCK_BOOTSTRAP);
    expect(s.step).toBe(STEP.DISTANCE);
    expect(s.configState.width).toBe(4);
    expect(s.configState.height).toBe(2.5);

    s = selectDistance(s, '2-5m', MOCK_BOOTSTRAP);
    expect(s.step).toBe(STEP.PITCH);

    s = selectPitch(s, 2.5, 'P2.5 • Full HD Polyvalent');
    expect(s.step).toBe(STEP.SUMMARY);

    s = startProductSearch(s);
    expect(s.step).toBe(STEP.GENERATING);

    s = completeProductSearch(s, MOCK_BOOTSTRAP);
    expect(s.step).toBe(STEP.PRODUCTS);
    expect(s.recommendedProducts.length).toBeGreaterThan(0);

    s = selectProduct(s, s.recommendedProducts[0]);
    expect(s.step).toBe(STEP.QUANTITY);

    s = submitQuantity(s, '2');
    expect(s.step).toBe(STEP.SITE_PHOTO);

    s = submitSitePhoto(s, null);
    expect(s.step).toBe(STEP.FORM_COMPANY);

    s = submitFormCompany(s, 'Atelier Lumière');
    expect(s.step).toBe(STEP.FORM_REPRESENTATIVE);

    s = submitFormRepresentative(s, 'Camille Laurent');
    expect(s.step).toBe(STEP.FORM_EMAIL);

    s = submitFormEmail(s, 'camille@atelier.fr');
    expect(s.step).toBe(STEP.FORM_PHONE);

    s = submitFormPhone(s, '+33 6 12 34 56 78');
    expect(s.step).toBe(STEP.FORM_ADDRESS);
    expect(s.form.phone).toBe('+33612345678');

    s = submitFormAddress(s, '18 Avenue de la République, Lyon');
    expect(s.step).toBe(STEP.DELIVERY);

    s = submitDeliveryCity(s, 'Lyon', '69000');
    expect(s.step).toBe(STEP.DELIVERY_CHOICE);

    s = selectDeliveryChoice(s, true);
    expect(s.step).toBe(STEP.INSTALLATION);

    s = selectInstallationChoice(s, true);
    expect(s.step).toBe(STEP.CONTRAT);

    s = completeContractCreation(s, {
      quoteId: 'qt_test1',
      quoteReference: 'PX-2026-TEST1',
      signatureDataUrl: 'data:image/png;base64,AA==',
      otpRequired: true,
      capabilityToken: null,
    });
    expect(s.step).toBe(STEP.SECURITE);

    s = completeOtpVerification(s, 'tok_signed');
    expect(s.step).toBe(STEP.FELICITATIONS);

    s = completePdfAndFinish(s, '/api/pixia/quotes/qt_test1/pdf');
    expect(s.step).toBe(STEP.SUCCESS);
    expect(s.security.pdfUrl).toBe('/api/pixia/quotes/qt_test1/pdf');
  });

  it('completes a Rental flow with RENTAL_PERIOD -> ENVIRONMENT and RENTAL_COMMENT right before CONTRAT', () => {
    let s = createInitialEngineState('en', MOCK_BOOTSTRAP);
    s = selectProjectType(s, 'location', MOCK_BOOTSTRAP);
    expect(s.step).toBe(STEP.RENTAL_PERIOD);

    s = submitRentalPeriod(
      s,
      {
        startDate: '2026-12-10',
        endDate: '2026-12-12',
        startTime: '08:00',
        endTime: '18:00',
      },
      MOCK_BOOTSTRAP
    );
    expect(s.step).toBe(STEP.ENVIRONMENT);
    expect(s.configState.rentalStartDate).toBe('2026-12-10');
    expect(computeRentalDays('2026-12-10', '2026-12-12')).toBe(3);

    s = selectEnvironment(s, 'exterieur');
    s = submitDimensions(s, '4', '2.5', MOCK_BOOTSTRAP);
    s = selectDistance(s, '2-5m', MOCK_BOOTSTRAP);
    s = selectPitch(s, 2.5, 'P2.5');
    s = startProductSearch(s);
    s = completeProductSearch(s, MOCK_BOOTSTRAP);
    s = selectProduct(s, s.recommendedProducts[0]);
    s = submitQuantity(s, '1');
    s = submitSitePhoto(s, null);
    s = submitFormCompany(s, 'Expo Lyon');
    s = submitFormRepresentative(s, 'Camille Laurent');
    s = submitFormEmail(s, 'camille@expolyon.fr');
    s = submitFormPhone(s, '+33612345678');
    s = submitFormAddress(s, '18 Rue de la République');
    s = submitDeliveryCity(s, 'Lyon', '69000');
    s = selectDeliveryChoice(s, true);
    s = selectInstallationChoice(s, true);
    expect(s.step).toBe(STEP.RENTAL_COMMENT);

    s = submitRentalComment(s, 'Accès camion requis avant 8h', MOCK_BOOTSTRAP);
    expect(s.step).toBe(STEP.CONTRAT);
    expect(s.configState.rentalComment).toBe('Accès camion requis avant 8h');
  });

  it('restores exact snapshot on Back and disables options of previous bot messages', () => {
    let s = createInitialEngineState('fr', MOCK_BOOTSTRAP);
    s = selectProjectType(s, 'vente', MOCK_BOOTSTRAP);
    expect(s.messages.find((m) => m.options)?.optionsDisabled).toBe(true);

    s = selectEnvironment(s, 'exterieur');
    expect(s.step).toBe(STEP.DIMENSIONS);

    s = stepBack(s);
    expect(s.step).toBe(STEP.ENVIRONMENT);
    expect(s.configState.environment).toBeNull();

    s = stepBack(s);
    expect(s.step).toBe(STEP.PROJECT_TYPE);
    expect(s.configState.projectType).toBeNull();
  });

  it('rewinds directly to any previously answered step via rewindToStep', () => {
    let s = createInitialEngineState('fr', MOCK_BOOTSTRAP);
    s = selectProjectType(s, 'vente', MOCK_BOOTSTRAP);
    s = selectEnvironment(s, 'interieur');
    s = submitDimensions(s, '5', '3', MOCK_BOOTSTRAP);
    expect(s.step).toBe(STEP.DISTANCE);

    s = rewindToStep(s, STEP.ENVIRONMENT);
    expect(s.step).toBe(STEP.ENVIRONMENT);
    expect(s.configState.environment).toBeNull();
    expect(s.configState.width).toBeNull();
  });

  it('triggers 3-tier validation escalation and auto-closes on 6th consecutive failure', () => {
    let s = createInitialEngineState('fr', MOCK_BOOTSTRAP);
    s = selectProjectType(s, 'vente', MOCK_BOOTSTRAP);
    s = selectEnvironment(s, 'interieur');
    s = submitDimensions(s, '4', '2', MOCK_BOOTSTRAP);
    s = selectDistance(s, '2-5m', MOCK_BOOTSTRAP);
    s = selectPitch(s, 2.5, 'P2.5');
    s = startProductSearch(s);
    s = completeProductSearch(s, MOCK_BOOTSTRAP);
    s = selectProduct(s, s.recommendedProducts[0]);

    for (let i = 1; i <= 5; i += 1) {
      s = submitQuantity(s, '0');
      expect(s.errorCount).toBe(i);
      expect(s.shouldAutoClose).toBe(false);
    }
    s = submitQuantity(s, '0');
    expect(s.errorCount).toBe(6);
    expect(s.shouldAutoClose).toBe(true);
  });

  it('switches FR <-> EN cleanly and invalidates cached pdfUrl', () => {
    let s = createInitialEngineState('fr', MOCK_BOOTSTRAP);
    s = {
      ...s,
      security: { ...s.security, pdfUrl: '/api/pixia/quotes/123/pdf' },
    };
    s = switchEngineLanguage(s, 'en', MOCK_BOOTSTRAP);
    expect(s.lang).toBe('en');
    expect(s.security.pdfUrl).toBeNull();
    expect(resolveLanguage('fr')).toBe('fr');
    expect(resolveLanguage('es')).toBe('en');
    expect(resolveLanguage(undefined)).toBe('en');
  });

  it('enforces distance-to-pitch ranges, product tolerance 1.5, and floating route exclusions', () => {
    expect(getPitchRangeForDistance('0.5-2m')).toEqual({ min: 0, max: 2.9 });
    expect(getPitchRangeForDistance('+20m')).toEqual({ min: 16, max: 99 });

    const distances = getAvailableDistances(DEMO_PRODUCTS, 'vente', DEMO_WIZARD_SETTINGS);
    expect(distances.length).toBeGreaterThan(0);

    const pitches = getAvailablePitches('2-5m', DEMO_WIZARD_SETTINGS, 'fr');
    expect(pitches.some((p) => p.isDontKnow && p.value === 2.5)).toBe(true);

    const matched = matchProducts(DEMO_PRODUCTS, 2.5);
    expect(matched.isFallbackCatalog).toBe(false);
    expect(matched.matches.every((p) => p.pitch === null || Math.abs(p.pitch - 2.5) <= 1.5)).toBe(
      true
    );

    expect(computeAreaSqm(4, 2.5)).toBe(10);
    const snap = buildPriceSnapshot({
      product: DEMO_PRODUCTS[0],
      width: 4,
      height: 2.5,
      quantity: 2,
      transactionType: 'vente',
      rentalStartDate: null,
      rentalEndDate: null,
      includeDelivery: true,
      includeInstallation: true,
      deliveryCity: 'Lyon',
      locations: DEMO_LOCATIONS,
      deliverySettings: DEMO_DELIVERY_SETTINGS,
      laborSettings: DEMO_LABOR_SETTINGS,
      settings: DEMO_SETTINGS,
    });
    expect(snap.displayMode).toBe('on_quote');
    expect(snap.totalAreaSqm).toBe(20);
    expect(snap.destination.cityName).toBe('Lyon');

    for (const excluded of EXCLUDED_FLOATING_ROUTES) {
      expect(shouldRenderFloatingChat(excluded, true)).toBe(false);
    }
    expect(shouldRenderFloatingChat('/', true)).toBe(true);
    expect(shouldRenderFloatingChat('/', false)).toBe(false);
  });

  it('enforces server-side OTP attempt lockout (3 failures) and 300s resend cooldown', () => {
    const quoteId = 'qt_otp_sec_test';
    createOtpChallenge({
      quoteId,
      recipientEmail: 'sec@pixia.test',
      validityMinutes: 10,
    });

    const r1 = verifyOtpCode(quoteId, '000000');
    expect(r1.success).toBe(false);
    expect(r1.attemptsLeft).toBe(2);

    const r2 = verifyOtpCode(quoteId, '000000');
    expect(r2.attemptsLeft).toBe(1);

    const r3 = verifyOtpCode(quoteId, '000000');
    expect(r3.errorCode).toBe('LOCKED');
    expect(r3.attemptsLeft).toBe(0);

    const resendBlocked = resendOtpChallenge({
      quoteId,
      recipientEmail: 'sec@pixia.test',
      validityMinutes: 10,
    });
    expect(resendBlocked.success).toBe(false);
    expect(resendBlocked.errorCode).toBe('COOLDOWN');
    expect(resendBlocked.retryAfterSeconds).toBeGreaterThan(290);
  });

  it('supports STEP.CLIENT_ACCOUNT with profile autofill skip and manual fallback', () => {
    let s = createInitialEngineState('fr', MOCK_BOOTSTRAP);
    s = selectProjectType(s, 'vente', MOCK_BOOTSTRAP);
    s = selectEnvironment(s, 'interieur');
    s = submitDimensions(s, '4', '2.5', MOCK_BOOTSTRAP);
    s = selectDistance(s, '2-5m', MOCK_BOOTSTRAP);
    s = selectPitch(s, 2.5, 'P2.5');
    s = startProductSearch(s);
    s = completeProductSearch(s, MOCK_BOOTSTRAP);
    s = selectProduct(s, s.recommendedProducts[0]);
    s = submitQuantity(s, '1');

    // Enable account check after site photo
    s = submitSitePhoto(s, null, { enableAccountStep: true, isLoggedIn: true });
    expect(s.step).toBe(STEP.CLIENT_ACCOUNT);

    const skipped = confirmClientAccountProfile(s, {
      id: 'cli_demo',
      company: 'Atelier Lumière SAS',
      representative: 'Camille Laurent',
      email: 'camille.laurent@atelier-lumiere.fr',
      phone: '+33612345678',
      address: '18 Avenue de la République, 69002 Lyon',
      deliveryCity: 'Lyon',
      deliveryPostcode: '69002',
      avatarUrl: '/avatar.png',
    });
    expect(skipped.step).toBe(STEP.DELIVERY_CHOICE);
    expect(skipped.form.company).toBe('Atelier Lumière SAS');
    expect(skipped.form.phone).toBe('+33612345678');

    const manual = proceedToManualForm(s);
    expect(manual.step).toBe(STEP.FORM_COMPANY);
  });

  it('detects common email typos (.co, .coms, missing @, spaces) and offers corrections', () => {
    expect(inspectEmail('camille@atelier.fr').valid).toBe(true);
    expect(inspectEmail('john@company.com').valid).toBe(true);

    const coTypo = inspectEmail('client@gmail.co');
    expect(coTypo.valid).toBe(false);
    expect(coTypo.suggestedEmail).toBe('client@gmail.com');

    const comsTypo = inspectEmail('client@entreprise.coms');
    expect(comsTypo.valid).toBe(false);
    expect(comsTypo.suggestedEmail).toBe('client@entreprise.com');

    expect(inspectEmail('invalid-email').valid).toBe(false);
    expect(inspectEmail('john doe@company.com').valid).toBe(false);
  });
});
