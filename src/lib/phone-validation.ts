import { parsePhoneNumberWithError, ParseError, CountryCode } from 'libphonenumber-js';

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
    const phoneNumber = parsePhoneNumberWithError(cleaned, defaultCountry);

    // libphonenumber-js considers some short codes valid. We want strict full numbers.
    if (!phoneNumber.isValid()) {
      return { isValid: false, error: 'Le format du numéro est invalide pour le pays détecté.' };
    }

    return {
      isValid: true,
      normalized: phoneNumber.format('E.164'), // e.g., +33612345678
      country: phoneNumber.country,
    };

  } catch (error) {
    if (error instanceof ParseError) {
      // Return translated or clean error messages based on ParseError type
      switch (error.message) {
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
    return { isValid: false, error: 'Erreur lors de la validation du numéro.' };
  }
}
