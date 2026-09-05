export interface CustomerInfoValues {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  postcode: string;
  city: string;
  country: string;
  companyName: string;
  siren: string;
  vatNumber: string;
}

export type CustomerInfoField = keyof CustomerInfoValues;

export const NAME_RE = /^[\p{L}\s'-]{2,}$/u;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const PHONE_RE = /^[\d\s+()]{8,}$/;
export const POSTCODE_RE = /^\d{5}$/;

export function defaultCustomerValues(): CustomerInfoValues {
  return {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    postcode: '',
    city: '',
    country: 'FR',
    companyName: '',
    siren: '',
    vatNumber: '',
  };
}

export const DEFAULT_COUNTRY_OPTIONS: { value: string; label: string }[] = [
  { value: 'FR', label: 'France' },
  { value: 'BE', label: 'Belgique' },
  { value: 'CH', label: 'Suisse' },
  { value: 'LU', label: 'Luxembourg' },
  { value: 'DE', label: 'Allemagne' },
  { value: 'ES', label: 'Espagne' },
  { value: 'IT', label: 'Italie' },
  { value: 'NL', label: 'Pays-Bas' },
  { value: 'PT', label: 'Portugal' },
  { value: 'GB', label: 'Royaume-Uni' },
  { value: 'AT', label: 'Autriche' },
  { value: 'IE', label: 'Irlande' },
  { value: 'DK', label: 'Danemark' },
  { value: 'SE', label: 'Suède' },
  { value: 'FI', label: 'Finlande' },
  { value: 'PL', label: 'Pologne' },
  { value: 'CZ', label: 'République Tchèque' },
  { value: 'SK', label: 'Slovaquie' },
  { value: 'HU', label: 'Hongrie' },
  { value: 'GR', label: 'Grèce' },
  { value: 'RO', label: 'Roumanie' },
  { value: 'BG', label: 'Bulgarie' },
  { value: 'HR', label: 'Croatie' },
  { value: 'SI', label: 'Slovénie' },
  { value: 'LT', label: 'Lituanie' },
  { value: 'LV', label: 'Lettonie' },
  { value: 'EE', label: 'Estonie' },
  { value: 'CY', label: 'Chypre' },
  { value: 'MT', label: 'Malte' },
];

export function validateCustomerField(field: CustomerInfoField, value: string): string {
  switch (field) {
    case 'firstName':
    case 'lastName':
      if (!value.trim()) return '';
      if (!NAME_RE.test(value.trim())) return 'Veuillez saisir un prénom valide.';
      return '';
    case 'email':
      if (!value.trim()) return '';
      if (!EMAIL_RE.test(value.trim())) return 'Veuillez saisir une adresse e-mail valide.';
      return '';
    case 'phone':
      if (!value.trim()) return '';
      const digits = value.replace(/[^0-9]/g, '');
      if (digits.length < 8 || !PHONE_RE.test(value.trim())) return 'Veuillez saisir un numéro de téléphone valide.';
      return '';
    case 'addressLine1':
      if (!value.trim()) return '';
      if (value.trim().length < 6) return 'Merci de saisir une adresse complète.';
      if (!/\d/.test(value)) return 'Merci de saisir une adresse complète.';
      if (!/[a-zA-Z\u00C0-\u024F]{2,}/.test(value)) return 'Merci de saisir une adresse complète.';
      return '';
    case 'city':
      if (!value.trim()) return '';
      if (value.trim().length < 2) return 'Veuillez saisir une ville valide.';
      if (/^\d+$/.test(value.trim())) return 'Veuillez saisir une ville valide.';
      return '';
    case 'postcode':
      if (!value.trim()) return '';
      if (!POSTCODE_RE.test(value.trim())) return 'Veuillez saisir un code postal valide.';
      return '';
    case 'companyName':
      if (!value.trim()) return '';
      if (value.trim().length < 2) return 'Veuillez saisir une raison sociale valide.';
      return '';
    case 'siren':
      if (!value.trim()) return '';
      const sirenDigits = value.replace(/[^0-9]/g, '');
      if (sirenDigits.length < 9) return 'Le SIREN doit contenir au moins 9 chiffres.';
      return '';
    default:
      return '';
  }
}

export function isCustomerInfoComplete(values: CustomerInfoValues, isB2B: boolean): boolean {
  return !!(
    values.firstName && values.lastName && values.email && values.phone &&
    values.addressLine1 && values.postcode && values.city && values.country &&
    (!isB2B || (values.companyName && values.siren))
  );
}

export function fieldMeta(
  errors: Record<string, string>,
  touched: Record<string, boolean>,
  field: string,
  value: string
) {
  const error = errors[field] || '';
  const isTouched = touched[field];
  const hasError = isTouched && !!error;
  const isValid = isTouched && !error && value.trim().length > 0;
  return { error, hasError, isValid };
}

export interface ClientSessionProfile {
  email?: string;
  displayName?: string;
  companyName?: string;
  phone?: string;
  officePhone?: string;
  companyAddress?: string;
  country?: string;
  city?: string;
  zipCode?: string;
}

export interface FiscalProfile {
  companyName?: string;
  siret?: string;
  vatNumber?: string;
}

function normalizeCountry(value: string): string {
  return (value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z]/g, '');
}

const COUNTRY_LABEL_TO_ISO = (() => {
  const map: Record<string, string> = {};
  for (const opt of DEFAULT_COUNTRY_OPTIONS) {
    map[normalizeCountry(opt.label)] = opt.value;
  }
  return map;
})();

export function toCountryISO(value: string): string {
  const v = (value || '').trim();
  if (!v) return '';
  const upper = v.toUpperCase();
  const isIso = DEFAULT_COUNTRY_OPTIONS.some(opt => opt.value === upper);
  if (isIso) return upper;
  return COUNTRY_LABEL_TO_ISO[normalizeCountry(v)] || '';
}

export function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const trimmed = (fullName || '').trim();
  if (!trimmed) return { firstName: '', lastName: '' };
  const spaceIdx = trimmed.indexOf(' ');
  if (spaceIdx !== -1) {
    return { firstName: trimmed.slice(0, spaceIdx).trim(), lastName: trimmed.slice(spaceIdx + 1).trim() };
  }
  // Un seul mot : on le met en lastName pour que NAME_RE passe
  return { firstName: '', lastName: trimmed };
}

export function siretToSiren(siret: string): string {
  const digits = (siret || '').replace(/[^0-9]/g, '');
  return digits.length >= 9 ? digits.slice(0, 9) : '';
}

export function profileToCustomerValues(profile: ClientSessionProfile): Partial<CustomerInfoValues> {
  const values: Partial<CustomerInfoValues> = {};
  const name = splitFullName(profile.displayName || '');
  if (name.firstName) values.firstName = name.firstName;
  if (name.lastName) values.lastName = name.lastName;
  if (profile.email) values.email = profile.email;
  const phone = (profile.phone || profile.officePhone || '').trim();
  if (phone) values.phone = phone;
  if (profile.companyAddress) values.addressLine1 = profile.companyAddress;
  if (profile.companyName) values.companyName = profile.companyName;
  if (profile.city) values.city = profile.city;
  if (profile.zipCode) values.postcode = profile.zipCode;
  const country = toCountryISO(profile.country || '');
  if (country) values.country = country;
  return values;
}

export function fiscalProfileToCustomerValues(fiscal: FiscalProfile): Partial<CustomerInfoValues> {
  const values: Partial<CustomerInfoValues> = {};
  const siren = siretToSiren(fiscal.siret || '');
  if (siren) values.siren = siren;
  if (fiscal.vatNumber) values.vatNumber = fiscal.vatNumber;
  return values;
}
