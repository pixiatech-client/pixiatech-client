import { parsePhoneNumberWithError as parseLib, CountryCode } from 'libphonenumber-js';
import rawMetadata from 'libphonenumber-js/metadata.min.json';

const metadata = (rawMetadata as any)?.default || rawMetadata;

export interface PhoneValidationResult {
  isValid: boolean;
  normalized?: string;
  country?: string;
  error?: string;
}

// Regex to detect common fake patterns
const FAKE_PATTERNS = [
  /^(.)\1{5,}$/,         // 6+ identical characters (e.g., 0000000, 1111111)
  /0123456/,             // Sequence 0123456
  /1234567/,             // Sequence 1234567
  /9876543/,             // Sequence 9876543
];

/**
 * Validates and normalizes a phone number using libphonenumber-js.
 * Also checks against common fake number sequences.
 * 
 * @param phone - The raw phone string input from the user
 * @param defaultCountry - Default country code (e.g., 'FR', 'DZ') if the number doesn't have an international prefix
 * @returns Validation result including the normalized E.164 format if valid
 */
export function validatePhone(phone: string, defaultCountry: CountryCode = 'FR'): PhoneValidationResult {
  if (!phone) {
    return { isValid: false, error: 'Le numéro est vide.' };
  }

  // 1. Basic cleanup: remove all non-numeric characters except '+'
  const cleaned = phone.replace(/[^\d+]/g, '');

  if (cleaned.length < 8) {
    return { isValid: false, error: 'Le numéro est trop court.' };
  }
  
  if (cleaned.length > 15) {
    return { isValid: false, error: 'Le numéro est trop long.' };
  }

  // 2. Anti-fake number heuristics (applied to the digits only)
  const digitsOnly = cleaned.replace(/\+/g, '');
  for (const pattern of FAKE_PATTERNS) {
    if (pattern.test(digitsOnly)) {
      return { isValid: false, error: 'Ce numéro semble invalide ou factice.' };
    }
  }

  // 3. Strict validation with libphonenumber-js
  try {
    const phoneNumber = (parseLib as any)(cleaned, { defaultCountry }, metadata);

    // libphonenumber-js considers some short codes valid. We want strict full numbers.
    if (!phoneNumber.isValid()) {
      return { isValid: false, error: 'Le format du numéro est invalide pour le pays détecté.' };
    }

    return {
      isValid: true,
      normalized: phoneNumber.format('E.164'), // e.g., +33612345678
      country: phoneNumber.country,
    };


  } catch (error: any) {
    const msg = error?.message || String(error);
    switch (msg) {
      case 'INVALID_COUNTRY':
        return { isValid: false, error: 'Le code pays est invalide.' };
      case 'NOT_A_NUMBER':
        return { isValid: false, error: 'Ce n\'est pas un numéro valide.' };
      case 'TOO_SHORT':
      case 'TOO_SHORT_NSN':
        return { isValid: false, error: 'Le numéro est trop court.' };
      case 'TOO_LONG':
        return { isValid: false, error: 'Le numéro est trop long.' };
      default:
        return { isValid: false, error: 'Format de numéro incorrect.' };
    }
  }
}


export interface CountryConfig {
  code: CountryCode | string;
  /** Path to an SVG flag image served from /public/flags/ */
  flagSrc: string;
  /** Alt text for the flag image */
  flagAlt: string;
  /** International dial code (e.g. +33, +86) */
  dialCode: string;
  prefixes: string[];
}

export const SUPPORTED_COUNTRIES: CountryConfig[] = [
  {
    code: 'FR',
    flagSrc: '/flags/fr.svg',
    flagAlt: 'France',
    dialCode: '+33',
    prefixes: ['06', '07', '+33', '33'],
  },
  {
    code: 'CN',
    flagSrc: '/flags/cn.svg',
    flagAlt: 'China',
    dialCode: '+86',
    prefixes: ['+86', '86'],
  },
];

/**
 * Detects the country config (including SVG flag path) for a phone string.
 * Returns null if no country is recognized.
 */
export function detectCountryConfig(phone: string): CountryConfig | null {
  if (!phone) return null;

  const cleaned = phone.replace(/\s+/g, '').trim();
  if (!cleaned) return null;

  // 1. Fast prefix matching for real-time typing feedback
  for (const country of SUPPORTED_COUNTRIES) {
    for (const prefix of country.prefixes) {
      if (prefix.startsWith('+')) {
        if (cleaned.startsWith(prefix)) {
          return country;
        }
      } else {
        // Local prefix (e.g., '06', '07') - only if user hasn't typed an international '+'
        if (!cleaned.startsWith('+') && cleaned.startsWith(prefix)) {
          return country;
        }
      }
    }
  }

  // 2. Fallback: try parsing with libphonenumber-js if number starts with '+'
  if (cleaned.startsWith('+')) {
    try {
      const phoneNumber = (parseLib as any)(cleaned, metadata);
      const parsedCountry = phoneNumber?.country;
      if (parsedCountry) {
        const found = SUPPORTED_COUNTRIES.find((c) => c.code === parsedCountry);
        if (found) return found;
      }
    } catch {
      // Ignore parse errors while user is typing
    }
  }

  return null;
}

