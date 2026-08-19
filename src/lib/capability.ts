/**
 * Capability cookie for S1-5 IDOR prevention.
 *
 * After OTP/token verification, a short-lived HMAC-signed cookie proves the
 * caller verified ownership of a specific quote. Server actions that mutate
 * quote URLs (`updateQuotePdfUrl`, `updateQuoteContractUrl`) check this cookie
 * before executing.
 *
 * Cookie properties:
 *   - Name: `cap_quote_<quoteId>` (scoped per quote)
 *   - HttpOnly: true, Secure: true (prod), SameSite: Lax
 *   - Max-Age: 900 seconds (15 min)
 *   - Value: HMAC-SHA256 hex digest
 *
 * Key management:
 *   - HMAC key comes exclusively from CAPABILITY_SECRET env var (server-side only).
 *   - If CAPABILITY_SECRET is absent or empty → fail closed (throw, never fallback).
 *   - CAPABILITY_SECRET must be >= 32 bytes, generated randomly per environment.
 */

import { createHmac } from 'crypto';
import { cookies } from 'next/headers';

const COOKIE_PREFIX = 'cap_quote_';
const MAX_AGE_SECONDS = 15 * 60; // 15 minutes

function getHmacKey(): string {
  const secret = process.env.CAPABILITY_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      '[S1-5] CAPABILITY_SECRET is missing or too short (< 32 chars). ' +
      'Set a random 64-byte hex string in .env.local. Capability operations will fail.'
    );
  }
  return secret;
}

function hmac(data: string): string {
  return createHmac('sha256', getHmacKey()).update(data).digest('hex');
}

/**
 * Payload format: `${quoteId}:${issuedAt}`
 * Signature: HMAC-SHA256 of the payload.
 */
export function signCapability(quoteId: string): string {
  const issuedAt = Date.now();
  const payload = `${quoteId}:${issuedAt}`;
  const signature = hmac(payload);
  return `${payload}:${signature}`;
}

export function verifyCapability(quoteId: string, capabilityValue: string): boolean {
  const parts = capabilityValue.split(':');
  if (parts.length !== 3) return false;

  const [capQuoteId, issuedAtStr, signature] = parts;
  if (capQuoteId !== quoteId) return false;

  // Check expiry
  const issuedAt = parseInt(issuedAtStr, 10);
  if (isNaN(issuedAt)) return false;
  const elapsed = (Date.now() - issuedAt) / 1000;
  if (elapsed > MAX_AGE_SECONDS) return false;

  // Verify HMAC
  const expectedPayload = `${capQuoteId}:${issuedAtStr}`;
  const expectedSignature = hmac(expectedPayload);
  // Constant-time comparison
  if (signature.length !== expectedSignature.length) return false;
  let mismatch = 0;
  for (let i = 0; i < signature.length; i++) {
    mismatch |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
  }
  return mismatch === 0;
}

/**
 * Issue a capability cookie. Must be called from a Server Action context
 * (uses `cookies()` from next/headers).
 */
export async function issueCapabilityCookie(quoteId: string): Promise<void> {
  const cookieStore = await cookies();
  const capability = signCapability(quoteId);
  cookieStore.set(`${COOKIE_PREFIX}${quoteId}`, capability, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: MAX_AGE_SECONDS,
    path: '/',
  });
}

/**
 * Check if a valid capability cookie exists for the given quoteId.
 * Reads from the cookie header server-side.
 */
export async function checkQuoteCapability(quoteId: string): Promise<boolean> {
  const cookieStore = await cookies();
  const cookieName = `${COOKIE_PREFIX}${quoteId}`;
  const value = cookieStore.get(cookieName)?.value;
  if (!value) return false;
  return verifyCapability(quoteId, value);
}
