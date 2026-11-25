export function validateDimensions(widthRaw: string, heightRaw: string): {
  valid: boolean;
  width?: number;
  height?: number;
  errorKey?: string;
} {
  const width = parseFloat(widthRaw.replace(',', '.'));
  const height = parseFloat(heightRaw.replace(',', '.'));
  if (!widthRaw.trim() || !heightRaw.trim() || !Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return { valid: false, errorKey: 'bot.errorDimensionsInvalid' };
  }
  return { valid: true, width: Math.round(width * 100) / 100, height: Math.round(height * 100) / 100 };
}

export function validateQuantity(raw: string | number): {
  valid: boolean;
  quantity?: number;
  errorKey?: string;
} {
  const num = typeof raw === 'number' ? raw : Number(String(raw).trim());
  if (!Number.isInteger(num) || num < 1) {
    return { valid: false, errorKey: 'bot.errorQuantityZero' };
  }
  return { valid: true, quantity: num };
}

export interface EmailInspection {
  valid: boolean;
  reasonFr?: string;
  reasonEn?: string;
  highlightSegment?: string;
  suggestedEmail?: string;
}

const DOMAIN_TYPOS: Record<string, string> = {
  'gmail.co': 'gmail.com',
  'gmail.con': 'gmail.com',
  'gmail.coms': 'gmail.com',
  'gmail.cmo': 'gmail.com',
  'gmial.com': 'gmail.com',
  'gmal.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'yahoo.co': 'yahoo.com',
  'yahoo.con': 'yahoo.com',
  'yahoo.coms': 'yahoo.com',
  'yaho.fr': 'yahoo.fr',
  'hotmail.co': 'hotmail.com',
  'hotmail.con': 'hotmail.com',
  'hotmail.coms': 'hotmail.com',
  'hotmal.com': 'hotmail.com',
  'outlook.co': 'outlook.com',
  'outlook.con': 'outlook.com',
  'outlook.coms': 'outlook.com',
  'outlok.com': 'outlook.com',
  'icloud.co': 'icloud.com',
  'icloud.coms': 'icloud.com',
  'orange.frr': 'orange.fr',
  'wanadoo.frr': 'wanadoo.fr',
  'free.frr': 'free.fr',
};

const TLD_TYPOS: Record<string, string> = {
  coms: 'com',
  con: 'com',
  cmo: 'com',
  ocm: 'com',
  comm: 'com',
  cop: 'com',
  frr: 'fr',
  rf: 'fr',
  orgg: 'org',
  nett: 'net',
};

export function inspectEmail(email: string): EmailInspection {
  const trimmed = email.trim();
  if (!trimmed) {
    return {
      valid: false,
      reasonFr: 'Veuillez saisir votre adresse e-mail.',
      reasonEn: 'Please enter your email address.',
    };
  }
  if (/\s/.test(trimmed)) {
    return {
      valid: false,
      reasonFr: 'L’adresse e-mail ne doit contenir aucun espace.',
      reasonEn: 'Email address cannot contain spaces.',
      highlightSegment: ' ',
      suggestedEmail: trimmed.replace(/\s+/g, ''),
    };
  }
  const atIndex = trimmed.indexOf('@');
  if (atIndex === -1) {
    return {
      valid: false,
      reasonFr: 'Il manque le symbole « @ » dans votre adresse.',
      reasonEn: 'Missing the "@" symbol in your email.',
      highlightSegment: trimmed,
    };
  }
  if (trimmed.indexOf('@', atIndex + 1) !== -1) {
    return {
      valid: false,
      reasonFr: 'Un seul symbole « @ » est autorisé.',
      reasonEn: 'Only one "@" symbol is allowed.',
      highlightSegment: '@',
    };
  }
  const local = trimmed.slice(0, atIndex);
  const domain = trimmed.slice(atIndex + 1).toLowerCase();
  if (!local) {
    return {
      valid: false,
      reasonFr: 'Indiquez votre identifiant avant « @ ».',
      reasonEn: 'Enter a name before "@".',
      highlightSegment: `@${domain}`,
    };
  }
  if (!domain || !domain.includes('.')) {
    return {
      valid: false,
      reasonFr: 'Nom de domaine incomplet après « @ » (ex: entreprise.fr).',
      reasonEn: 'Incomplete domain after "@" (e.g. company.com).',
      highlightSegment: domain || '@',
    };
  }
  const parts = domain.split('.');
  const tld = parts[parts.length - 1] ?? '';
  const prevPart = parts[parts.length - 2] ?? '';
  if (!prevPart) {
    return {
      valid: false,
      reasonFr: 'Format de domaine invalide près du point « . ».',
      reasonEn: 'Invalid domain format near the dot ".".',
      highlightSegment: domain,
    };
  }
  if (DOMAIN_TYPOS[domain]) {
    const fixedDomain = DOMAIN_TYPOS[domain];
    return {
      valid: false,
      reasonFr: `Faute détectée dans « @${domain} » — vouliez-vous écrire « @${fixedDomain} » ?`,
      reasonEn: `Typo detected in "@${domain}" — did you mean "@${fixedDomain}"?`,
      highlightSegment: domain,
      suggestedEmail: `${local}@${fixedDomain}`,
    };
  }
  if (TLD_TYPOS[tld]) {
    const fixedTld = TLD_TYPOS[tld];
    const fixedDomain = [...parts.slice(0, -1), fixedTld].join('.');
    return {
      valid: false,
      reasonFr: `Extension « .${tld} » incorrecte — vouliez-vous dire « .${fixedTld} » ?`,
      reasonEn: `Incorrect extension ".${tld}" — did you mean ".${fixedTld}"?`,
      highlightSegment: `.${tld}`,
      suggestedEmail: `${local}@${fixedDomain}`,
    };
  }
  if (tld.length < 2 || !/^[a-z]{2,12}$/.test(tld)) {
    return {
      valid: false,
      reasonFr: `Extension de domaine « .${tld || '?'} » invalide.`,
      reasonEn: `Invalid domain extension ".${tld || '?'}".`,
      highlightSegment: `.${tld}`,
    };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return {
      valid: false,
      reasonFr: 'Format d’adresse e-mail invalide.',
      reasonEn: 'Invalid email format.',
    };
  }
  return { valid: true };
}

export function validateEmail(email: string): { valid: boolean; errorKey?: string } {
  const check = inspectEmail(email);
  if (!check.valid) {
    return { valid: false, errorKey: 'bot.errorEmailInvalid' };
  }
  return { valid: true };
}

export function validatePhone(phone: string): { valid: boolean; normalized?: string; errorKey?: string } {
  const stripped = phone.replace(/\s+/g, '');
  if (!/^\+?[0-9]{10,14}$/.test(stripped)) {
    return { valid: false, errorKey: 'bot.errorPhoneInvalid' };
  }
  return { valid: true, normalized: stripped };
}

export function validateAddress(address: string): { valid: boolean; errorKey?: string } {
  if (address.trim().length < 8) {
    return { valid: false, errorKey: 'bot.errorAddressShort' };
  }
  return { valid: true };
}

export function validateDeliveryCity(city: string): { valid: boolean; errorKey?: string } {
  if (city.trim().length < 2) {
    return { valid: false, errorKey: 'bot.errorAddressShort' };
  }
  return { valid: true };
}

export function validateNonEmptyText(value: string): { valid: boolean; errorKey?: string } {
  if (value.trim().length < 2) {
    return { valid: false, errorKey: 'bot.errorAddressShort' };
  }
  return { valid: true };
}

export interface EscalationDecision {
  nextErrorCount: number;
  messageKey: string;
  shouldAutoClose: boolean;
}

export function evaluateErrorEscalation(
  currentErrorCount: number,
  specificErrorKey: string,
  allowAutoClose = true
): EscalationDecision {
  const nextErrorCount = currentErrorCount + 1;
  if (nextErrorCount >= 6) {
    return {
      nextErrorCount,
      messageKey: 'bot.errorValidation',
      shouldAutoClose: allowAutoClose,
    };
  }
  if (nextErrorCount >= 3) {
    return {
      nextErrorCount,
      messageKey: 'bot.errorHelp',
      shouldAutoClose: false,
    };
  }
  return {
    nextErrorCount,
    messageKey: specificErrorKey,
    shouldAutoClose: false,
  };
}
