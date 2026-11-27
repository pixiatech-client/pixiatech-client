import crypto from 'node:crypto';

const SIGNING_SECRET = process.env.PIXIA_SIGNING_SECRET || crypto.randomBytes(32).toString('hex');

export interface OtpChallengeRecord {
  quoteId: string;
  otpHash: string;
  expiresAt: number;
  attempts: number;
  maxAttempts: number;
  resendCount: number;
  maxResends: number;
  lastSentAt: number;
  cooldownSeconds: number;
  locked: boolean;
}

export interface SimulatedOtpEmail {
  quoteId: string;
  to: string;
  code: string;
  expiresAt: number;
  sentAt: number;
}

const challenges = new Map<string, OtpChallengeRecord>();
// Strictly used only in non-production preview when no SMTP server is configured
const devSimulatedInbox = new Map<string, SimulatedOtpEmail>();

export function isDevEmailSimulationEnabled(): boolean {
  return process.env.NODE_ENV !== 'production' && !process.env.SMTP_HOST;
}

function hashOtp(quoteId: string, code: string): string {
  return crypto
    .createHmac('sha256', SIGNING_SECRET)
    .update(`${quoteId}:${code}`)
    .digest('hex');
}

function constantTimeEqualHex(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function createOtpChallenge(params: {
  quoteId: string;
  recipientEmail: string;
  validityMinutes: number;
  resendCount?: number;
}): {
  expiresAt: number;
  cooldownSeconds: number;
  resendAttemptsLeft: number;
} {
  const code = String(crypto.randomInt(100000, 1000000));
  const now = Date.now();
  const expiresAt = now + Math.max(1, params.validityMinutes) * 60_000;
  const resendCount = params.resendCount ?? 0;
  const maxResends = 3;
  const cooldownSeconds = 300;

  challenges.set(params.quoteId, {
    quoteId: params.quoteId,
    otpHash: hashOtp(params.quoteId, code),
    expiresAt,
    attempts: 0,
    maxAttempts: 3,
    resendCount,
    maxResends,
    lastSentAt: now,
    cooldownSeconds,
    locked: false,
  });

  if (isDevEmailSimulationEnabled()) {
    devSimulatedInbox.set(params.quoteId, {
      quoteId: params.quoteId,
      to: params.recipientEmail,
      code,
      expiresAt,
      sentAt: now,
    });
    console.info(`[PIXIA DEV-SMTP-SIM] Quote ${params.quoteId} -> ${params.recipientEmail} | OTP: ${code}`);
  }

  return {
    expiresAt,
    cooldownSeconds,
    resendAttemptsLeft: Math.max(0, 2 - resendCount),
  };
}

export function verifyOtpCode(quoteId: string, submittedCode: string): {
  success: boolean;
  errorCode?: 'NOT_FOUND' | 'LOCKED' | 'EXPIRED' | 'INVALID_CODE';
  attemptsLeft: number;
} {
  const record = challenges.get(quoteId);
  if (!record) {
    return { success: false, errorCode: 'NOT_FOUND', attemptsLeft: 0 };
  }
  if (record.locked || record.attempts >= record.maxAttempts) {
    record.locked = true;
    return { success: false, errorCode: 'LOCKED', attemptsLeft: 0 };
  }
  if (Date.now() > record.expiresAt) {
    return {
      success: false,
      errorCode: 'EXPIRED',
      attemptsLeft: Math.max(0, record.maxAttempts - record.attempts),
    };
  }

  const normalized = submittedCode.trim();
  const candidateHash = hashOtp(quoteId, normalized);
  if (constantTimeEqualHex(candidateHash, record.otpHash)) {
    challenges.delete(quoteId);
    devSimulatedInbox.delete(quoteId);
    return { success: true, attemptsLeft: record.maxAttempts - record.attempts };
  }

  record.attempts += 1;
  const attemptsLeft = Math.max(0, record.maxAttempts - record.attempts);
  if (attemptsLeft === 0) {
    record.locked = true;
  }
  return {
    success: false,
    errorCode: record.locked ? 'LOCKED' : 'INVALID_CODE',
    attemptsLeft,
  };
}

export function resendOtpChallenge(params: {
  quoteId: string;
  recipientEmail: string;
  validityMinutes: number;
}): {
  success: boolean;
  errorCode?: 'NOT_FOUND' | 'MAX_RESENDS' | 'COOLDOWN';
  retryAfterSeconds?: number;
  resendAttemptsLeft?: number;
} {
  const record = challenges.get(params.quoteId);
  if (!record) {
    return { success: false, errorCode: 'NOT_FOUND' };
  }
  if (record.resendCount >= record.maxResends || record.resendCount >= 2) {
    return { success: false, errorCode: 'MAX_RESENDS', resendAttemptsLeft: 0 };
  }
  const elapsedSeconds = Math.floor((Date.now() - record.lastSentAt) / 1000);
  if (elapsedSeconds < record.cooldownSeconds) {
    return {
      success: false,
      errorCode: 'COOLDOWN',
      retryAfterSeconds: record.cooldownSeconds - elapsedSeconds,
      resendAttemptsLeft: Math.max(0, 2 - record.resendCount),
    };
  }

  const nextResendCount = record.resendCount + 1;
  const created = createOtpChallenge({
    quoteId: params.quoteId,
    recipientEmail: params.recipientEmail,
    validityMinutes: params.validityMinutes,
    resendCount: nextResendCount,
  });

  return {
    success: true,
    resendAttemptsLeft: created.resendAttemptsLeft,
  };
}

export function getSimulatedDevEmail(quoteId: string): SimulatedOtpEmail | null {
  if (!isDevEmailSimulationEnabled()) return null;
  return devSimulatedInbox.get(quoteId) ?? null;
}

export function signCapabilityToken(quoteId: string): string {
  const exp = Date.now() + 2 * 60 * 60_000;
  const payload = `${quoteId}.${exp}`;
  const sig = crypto
    .createHmac('sha256', SIGNING_SECRET)
    .update(payload)
    .digest('hex');
  return `${payload}.${sig}`;
}

export function verifyCapabilityToken(quoteId: string, token: string | undefined): boolean {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const [tokenQuoteId, expStr, sig] = parts;
  if (tokenQuoteId !== quoteId) return false;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || Date.now() > exp) return false;
  const expectedSig = crypto
    .createHmac('sha256', SIGNING_SECRET)
    .update(`${tokenQuoteId}.${expStr}`)
    .digest('hex');
  return constantTimeEqualHex(sig, expectedSig);
}
