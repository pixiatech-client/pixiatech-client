import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import express, { type Request, type Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { buildPriceSnapshot } from './src/core/pricing/pricing-engine.ts';
import type {
  BootstrapPayload,
  ClientProfile,
  EnvironmentType,
  Language,
  ProjectType,
  QuoteRecord,
} from './src/core/types.ts';
import {
  validateAddress,
  validateDeliveryCity,
  validateEmail,
  validateNonEmptyText,
  validatePhone,
  validateQuantity,
} from './src/core/validation/validators.ts';
import {
  DEMO_CLIENT_ACCOUNT,
  DEMO_DELIVERY_SETTINGS,
  DEMO_IMAGES,
  DEMO_LABOR_SETTINGS,
  DEMO_LOCATIONS,
  DEMO_PDF_SETTINGS,
  DEMO_PRODUCTS,
  DEMO_SETTINGS,
  DEMO_WIZARD_SETTINGS,
  getDemoBlockedPeriods,
} from './server/demo-data.ts';
import {
  createOtpChallenge,
  getSimulatedDevEmail,
  isDevEmailSimulationEnabled,
  resendOtpChallenge,
  signCapabilityToken,
  verifyCapabilityToken,
  verifyOtpCode,
} from './server/otp-service.ts';
import { quoteStore } from './server/quote-store.ts';

dotenv.config();

const PORT = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';

function parseCookies(cookieHeader?: string): Record<string, string> {
  if (!cookieHeader) return {};
  const out: Record<string, string> = {};
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx > 0) {
      const k = part.slice(0, idx).trim();
      const v = decodeURIComponent(part.slice(idx + 1).trim());
      out[k] = v;
    }
  }
  return out;
}

function setCapabilityCookie(res: Response, quoteId: string, token: string): void {
  const cookieName = `cap_quote_${quoteId}`;
  const attrs = [
    `${cookieName}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'Max-Age=7200',
  ];
  if (isProduction) {
    attrs.push('Secure', 'SameSite=None', 'Partitioned');
  } else {
    attrs.push('SameSite=Lax');
  }
  res.setHeader('Set-Cookie', attrs.join('; '));
}

function readClientSession(req: Request): ClientProfile | null {
  const cookies = parseCookies(req.headers.cookie);
  const raw = cookies.pixia_client_session;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as ClientProfile;
    if (parsed && typeof parsed.email === 'string' && typeof parsed.company === 'string') {
      return parsed;
    }
  } catch {
    return null;
  }
  return null;
}

function setClientSessionCookie(res: Response, profile: ClientProfile | null): void {
  const attrs = [
    `pixia_client_session=${profile ? encodeURIComponent(JSON.stringify(profile)) : ''}`,
    'Path=/',
    'HttpOnly',
    profile ? 'Max-Age=604800' : 'Max-Age=0',
  ];
  if (isProduction) {
    attrs.push('Secure', 'SameSite=None', 'Partitioned');
  } else {
    attrs.push('SameSite=Lax');
  }
  res.setHeader('Set-Cookie', attrs.join('; '));
}

function hasQuoteAuthorization(req: Request, quote: QuoteRecord): boolean {
  const cookies = parseCookies(req.headers.cookie);
  const cookieToken = cookies[`cap_quote_${quote.id}`];
  if (verifyCapabilityToken(quote.id, cookieToken)) return true;

  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const bearerToken = authHeader.slice(7).trim();
    if (verifyCapabilityToken(quote.id, bearerToken)) return true;
  }

  return !quote.otpRequired && quote.emailVerified;
}

function isValidImageDataUrl(value: unknown, maxBytes: number): boolean {
  if (typeof value !== 'string') return false;
  if (!/^data:image\/(png|jpeg|jpg|webp);base64,[A-Za-z0-9+/=]+$/.test(value)) {
    return false;
  }
  return Buffer.byteLength(value, 'utf8') <= maxBytes;
}

export function createPixiaApp() {
  const app = express();
  app.set('trust proxy', 1);
  app.use(express.json({ limit: '8mb' }));

  app.get('/api/pixia/health', (_req, res) => {
    res.json({ ok: true, mode: isProduction ? 'production' : 'development' });
  });

  app.get('/api/pixia/bootstrap', (req, res) => {
    const settings = {
      ...DEMO_SETTINGS,
      isWizardBotEnabled:
        req.query.botEnabled !== undefined
          ? req.query.botEnabled !== 'false'
          : DEMO_SETTINGS.isWizardBotEnabled,
      isEmailVerificationEnabled:
        req.query.otpEnabled !== undefined
          ? req.query.otpEnabled !== 'false'
          : DEMO_SETTINGS.isEmailVerificationEnabled,
      isPriceHidden:
        req.query.priceHidden !== undefined
          ? req.query.priceHidden === 'true'
          : DEMO_SETTINGS.isPriceHidden,
      botWelcomeMessage:
        typeof req.query.welcome === 'string' ? req.query.welcome : DEMO_SETTINGS.botWelcomeMessage,
    };

    const payload: BootstrapPayload = {
      demoMode: true,
      pricingFormulaStatus: 'on_quote_isolated',
      emailMode: isDevEmailSimulationEnabled() ? 'dev-simulated' : 'smtp',
      settings,
      wizardSettings: DEMO_WIZARD_SETTINGS,
      deliverySettings: DEMO_DELIVERY_SETTINGS,
      laborSettings: DEMO_LABOR_SETTINGS,
      products: DEMO_PRODUCTS,
      locations: DEMO_LOCATIONS,
      blockedPeriods: getDemoBlockedPeriods(),
      pdfSettings: DEMO_PDF_SETTINGS,
      clientProfile: readClientSession(req),
    };

    res.json(payload);
  });

  app.post('/api/pixia/auth/login', (req, res) => {
    const email = String(req.body?.email ?? '').trim().toLowerCase();
    const password = String(req.body?.password ?? '');
    if (!validateEmail(email).valid || password.length < 4) {
      return res.status(401).json({
        success: false,
        error: 'Identifiants invalides (email valide et mot de passe requis).',
      });
    }

    const profile: ClientProfile =
      email === DEMO_CLIENT_ACCOUNT.email.toLowerCase()
        ? DEMO_CLIENT_ACCOUNT
        : {
            id: `client-${crypto.createHash('sha1').update(email).digest('hex').slice(0, 8)}`,
            avatarUrl: DEMO_IMAGES.avatar,
            company:
              email
                .split('@')[1]
                ?.split('.')[0]
                ?.replace(/^./, (c) => c.toUpperCase()) || 'Client Pixiatech',
            representative:
              email
                .split('@')[0]
                ?.replace(/[._-]+/g, ' ')
                .replace(/\b\w/g, (c) => c.toUpperCase()) || 'Client',
            email,
            phone: '+33612345678',
            address: '12 Rue de la Technologie, 75011 Paris',
            deliveryCity: 'Paris',
            deliveryPostcode: '75011',
          };

    setClientSessionCookie(res, profile);
    return res.json({ success: true, profile });
  });

  app.post('/api/pixia/auth/logout', (_req, res) => {
    setClientSessionCookie(res, null);
    return res.json({ success: true });
  });

  app.post('/api/pixia/quotes', async (req, res) => {
    try {
      const body = req.body ?? {};
      const lang: Language = body.language === 'fr' ? 'fr' : 'en';
      const client = body.clientDetails ?? {};
      const config = body.configState ?? {};
      const otpEnabledOverride =
        typeof body.otpEnabledOverride === 'boolean'
          ? body.otpEnabledOverride
          : DEMO_SETTINGS.isEmailVerificationEnabled;

      if (!validateNonEmptyText(String(client.company ?? '')).valid) {
        return res.status(400).json({ error: 'Invalid company name' });
      }
      if (!validateNonEmptyText(String(client.representative ?? '')).valid) {
        return res.status(400).json({ error: 'Invalid representative name' });
      }
      if (!validateEmail(String(client.email ?? '')).valid) {
        return res.status(400).json({ error: 'Invalid email address' });
      }
      const phoneCheck = validatePhone(String(client.phone ?? ''));
      if (!phoneCheck.valid || !phoneCheck.normalized) {
        return res.status(400).json({ error: 'Invalid phone number' });
      }
      if (!validateAddress(String(client.address ?? '')).valid) {
        return res.status(400).json({ error: 'Invalid street address' });
      }
      if (!validateDeliveryCity(String(client.deliveryCity ?? '')).valid) {
        return res.status(400).json({ error: 'Invalid delivery city' });
      }

      const projectType: ProjectType = config.projectType === 'location' ? 'location' : 'vente';
      const environment: EnvironmentType =
        config.environment === 'exterieur' || config.environment === 'semi-exterieur'
          ? config.environment
          : 'interieur';
      const width = Number(config.width);
      const height = Number(config.height);
      if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
        return res.status(400).json({ error: 'Invalid screen dimensions' });
      }
      const qtyCheck = validateQuantity(config.quantity ?? 1);
      if (!qtyCheck.valid || !qtyCheck.quantity) {
        return res.status(400).json({ error: 'Invalid quantity' });
      }

      const product = DEMO_PRODUCTS.find((p) => p.id === config.productId);
      if (!product) {
        return res.status(400).json({ error: 'Selected product not found' });
      }

      if (!isValidImageDataUrl(body.signatureDataUrl, 2 * 1024 * 1024)) {
        return res.status(400).json({ error: 'Invalid electronic signature' });
      }
      if (config.installationPhoto && !isValidImageDataUrl(config.installationPhoto, 6 * 1024 * 1024)) {
        return res.status(400).json({ error: 'Invalid installation photo format or size' });
      }

      const includeDelivery = Boolean(body.includeDelivery);
      const includeInstallation = Boolean(body.includeInstallation);

      const priceSnapshot = buildPriceSnapshot({
        product,
        width,
        height,
        quantity: qtyCheck.quantity,
        transactionType: projectType,
        rentalStartDate: config.rentalStartDate ?? null,
        rentalEndDate: config.rentalEndDate ?? null,
        includeDelivery,
        includeInstallation,
        deliveryCity: String(client.deliveryCity),
        locations: DEMO_LOCATIONS,
        deliverySettings: DEMO_DELIVERY_SETTINGS,
        laborSettings: DEMO_LABOR_SETTINGS,
        settings: DEMO_SETTINGS,
      });

      const id = `qt_${crypto.randomBytes(8).toString('hex')}`;
      const reference = `PX-${new Date().getFullYear()}-${id.slice(-6).toUpperCase()}`;
      const quote: QuoteRecord = {
        id,
        reference,
        configuratorType: 'lumi',
        status: otpEnabledOverride ? 'pending' : 'verified',
        createdAt: new Date().toISOString(),
        language: lang,
        clientDetails: {
          company: String(client.company).trim(),
          representative: String(client.representative).trim(),
          email: String(client.email).trim(),
          phone: phoneCheck.normalized,
          address: String(client.address).trim(),
          deliveryCity: priceSnapshot.destination.cityName,
          deliveryPostcode: priceSnapshot.destination.postcode || String(client.deliveryPostcode ?? '').trim(),
        },
        configState: {
          projectType,
          environment,
          width,
          height,
          distance: String(config.distance ?? ''),
          pixelPitch: Number(config.pixelPitch ?? product.pitch ?? 2.5),
          pitchLabel: String(config.pitchLabel ?? ''),
          productId: product.id,
          productName: product.name,
          quantity: qtyCheck.quantity,
          hasInstallationPhoto: Boolean(config.installationPhoto),
          rentalPeriod:
            projectType === 'location' && config.rentalStartDate && config.rentalEndDate
              ? {
                  startDate: String(config.rentalStartDate),
                  endDate: String(config.rentalEndDate),
                  startTime: String(config.rentalStartTime ?? '08:00'),
                  endTime: String(config.rentalEndTime ?? '18:00'),
                }
              : null,
        },
        includeDelivery,
        includeInstallation,
        priceSnapshot,
        signatureDataUrl: String(body.signatureDataUrl),
        otpRequired: otpEnabledOverride,
        emailVerified: !otpEnabledOverride,
        pdfUrl: null,
      };

      await quoteStore.saveQuote(quote);

      let capabilityToken: string | null = null;
      if (otpEnabledOverride) {
        createOtpChallenge({
          quoteId: quote.id,
          recipientEmail: quote.clientDetails.email,
          validityMinutes: DEMO_SETTINGS.emailVerification.validityMinutes,
        });
      } else {
        capabilityToken = signCapabilityToken(quote.id);
        setCapabilityCookie(res, quote.id, capabilityToken);
      }

      return res.status(201).json({
        success: true,
        quoteId: quote.id,
        reference: quote.reference,
        otpRequired: otpEnabledOverride,
        emailMode: isDevEmailSimulationEnabled() ? 'dev-simulated' : 'smtp',
        capabilityToken,
        priceSnapshot,
      });
    } catch (error) {
      console.error('Failed to create quote:', error);
      return res.status(500).json({ error: 'Unable to create quote' });
    }
  });

  app.post('/api/pixia/quotes/:id/otp/verify', async (req, res) => {
    const quote = await quoteStore.getQuote(req.params.id);
    if (!quote) {
      return res.status(404).json({ success: false, error: 'Quote not found' });
    }
    const code = String(req.body?.code ?? '');
    if (!/^\d{6}$/.test(code.trim())) {
      return res.status(400).json({ success: false, error: 'INVALID_FORMAT' });
    }

    const verification = verifyOtpCode(quote.id, code);
    if (!verification.success) {
      const status = verification.errorCode === 'LOCKED' ? 429 : 400;
      return res.status(status).json({
        success: false,
        error: verification.errorCode,
        attemptsLeft: verification.attemptsLeft,
      });
    }

    await quoteStore.markEmailVerified(quote.id);
    const capabilityToken = signCapabilityToken(quote.id);
    setCapabilityCookie(res, quote.id, capabilityToken);

    return res.json({
      success: true,
      capabilityToken,
    });
  });

  app.post('/api/pixia/quotes/:id/otp/resend', async (req, res) => {
    const quote = await quoteStore.getQuote(req.params.id);
    if (!quote) {
      return res.status(404).json({ success: false, error: 'Quote not found' });
    }

    const result = resendOtpChallenge({
      quoteId: quote.id,
      recipientEmail: quote.clientDetails.email,
      validityMinutes: DEMO_SETTINGS.emailVerification.validityMinutes,
    });

    if (!result.success) {
      return res.status(429).json({
        success: false,
        error: result.errorCode,
        retryAfterSeconds: result.retryAfterSeconds ?? 0,
        resendAttemptsLeft: result.resendAttemptsLeft ?? 0,
      });
    }

    return res.json({
      success: true,
      cooldownSeconds: 300,
      resendAttemptsLeft: result.resendAttemptsLeft ?? 0,
    });
  });

  app.get('/api/pixia/dev/simulated-inbox/:id', async (req, res) => {
    if (!isDevEmailSimulationEnabled()) {
      return res.status(404).json({ error: 'Not available' });
    }
    const email = getSimulatedDevEmail(req.params.id);
    if (!email) {
      return res.status(404).json({ error: 'No simulated OTP message found for this quote' });
    }
    return res.json({
      devSimulation: true,
      to: email.to,
      code: email.code,
      expiresAt: email.expiresAt,
      sentAt: email.sentAt,
    });
  });

  app.post('/api/pixia/quotes/:id/pdf', async (req, res) => {
    const quote = await quoteStore.getQuote(req.params.id);
    if (!quote) {
      return res.status(404).json({ error: 'Quote not found' });
    }
    if (!hasQuoteAuthorization(req, quote)) {
      return res.status(403).json({ error: 'Unauthorized PDF mutation' });
    }

    const pdfBase64 = String(req.body?.pdfBase64 ?? '');
    if (!pdfBase64 || pdfBase64.length > 8 * 1024 * 1024) {
      return res.status(400).json({ error: 'Invalid PDF payload' });
    }

    const cleaned = pdfBase64.replace(/^data:application\/pdf;[^,]+,/, '');
    const bytes = Buffer.from(cleaned, 'base64');
    if (bytes.subarray(0, 4).toString('ascii') !== '%PDF') {
      return res.status(400).json({ error: 'Malformed PDF binary' });
    }

    const pdfUrl = await quoteStore.savePdfBytes(quote.id, bytes);
    await quoteStore.updateQuotePdf(quote.id, pdfUrl);
    return res.json({ success: true, pdfUrl });
  });

  app.get('/api/pixia/quotes/:id/pdf', async (req, res) => {
    const quote = await quoteStore.getQuote(req.params.id);
    if (!quote) {
      return res.status(404).json({ error: 'Quote not found' });
    }
    if (!hasQuoteAuthorization(req, quote)) {
      return res.status(403).json({ error: 'Unauthorized PDF access' });
    }

    const bytes = await quoteStore.readPdfBytes(quote.id);
    if (!bytes) {
      return res.status(404).json({ error: 'PDF not generated yet' });
    }

    const safeCompany = quote.clientDetails.company.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `Pixiatech_Devis_${safeCompany || quote.reference}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `${req.query.download === '1' ? 'attachment' : 'inline'}; filename="${filename}"`
    );
    return res.send(bytes);
  });

  app.get('/api/pixia/quotes/:id', async (req, res) => {
    const quote = await quoteStore.getQuote(req.params.id);
    if (!quote) return res.status(404).json({ error: 'Quote not found' });
    if (!hasQuoteAuthorization(req, quote)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    return res.json({ quote });
  });

  return app;
}

async function startServer() {
  const app = createPixiaApp();

  const staticAssetExts = /\.(webm|mp4|png|jpe?g|webp|gif|svg|ico)$/i;
  const staticRoot = isProduction
    ? path.resolve(process.cwd(), 'dist')
    : path.resolve(process.cwd(), 'public');

  app.use((req, res, next) => {
    if (req.method === 'GET' && staticAssetExts.test(req.path)) {
      const candidate = path.resolve(staticRoot, req.path.replace(/^\/+/, ''));
      if (candidate.startsWith(staticRoot + path.sep) && !fs.existsSync(candidate)) {
        // Let Vite /src/assets imports pass through if outside public; only short-circuit missing root/public assets
        if (!req.path.startsWith('/src/') && !req.path.startsWith('/@')) {
          return res.status(404).end();
        }
      }
    }
    return next();
  });

  if (!isProduction) {
    app.use(express.static(staticRoot));
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.info(`PIXIA server listening on http://0.0.0.0:${PORT}`);
  });
}

const isMainModule =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(import.meta.filename ?? '');

if (isMainModule || process.env.PIXIA_START_SERVER === 'true') {
  startServer().catch((err) => {
    console.error('Failed to start PIXIA server:', err);
    process.exit(1);
  });
} else if (!process.env.VITEST) {
  startServer().catch((err) => {
    console.error('Failed to start PIXIA server:', err);
    process.exit(1);
  });
}
