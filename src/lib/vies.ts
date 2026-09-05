const EU_COUNTRIES: Record<string, string> = {
  AT: 'Austria', BE: 'Belgium', BG: 'Bulgaria', CY: 'Cyprus', CZ: 'Czech Republic',
  DE: 'Germany', DK: 'Denmark', EE: 'Estonia', ES: 'Spain', FI: 'Finland',
  FR: 'France', GR: 'Greece', HR: 'Croatia', HU: 'Hungary', IE: 'Ireland',
  IT: 'Italy', LT: 'Lithuania', LU: 'Luxembourg', LV: 'Latvia', MT: 'Malta',
  NL: 'Netherlands', PL: 'Poland', PT: 'Portugal', RO: 'Romania', SE: 'Sweden',
  SI: 'Slovenia', SK: 'Slovakia',
};

export interface VatValidationResult {
  valid: boolean;
  vatNumber: string;
  countryCode: string;
  countryName: string;
  name: string | null;
  address: string | null;
}

export function formatVatNumber(raw: string): { countryCode: string; number: string } | null {
  const cleaned = raw.replace(/[\s\-.]+/g, '').toUpperCase();
  const match = cleaned.match(/^([A-Z]{2})(.+)$/);
  if (!match) {
    const prefixed = `FR${cleaned}`;
    const m2 = prefixed.match(/^([A-Z]{2})(.+)$/);
    if (!m2) return null;
    return { countryCode: m2[1], number: m2[2] };
  }
  return { countryCode: match[1], number: match[2] };
}

async function checkVies(countryCode: string, vatNumber: string): Promise<{ valid: boolean; name?: string; address?: string }> {
  try {
    const url = 'https://ec.europa.eu/taxation_customs/vies/rest-api/check-vat-number';
    const body = JSON.stringify({ countryCode, vatNumber });

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      console.warn('[VIES] HTTP Error:', response.status);
      return { valid: false };
    }

    const data = await response.json();
    return {
      valid: data.valid === true,
      name: data.name || undefined,
      address: data.address || undefined,
    };
  } catch (err: any) {
    console.error('[VIES] Network error:', err.message);
    return { valid: false };
  }
}

export async function validateVatNumber(rawVatNumber: string): Promise<VatValidationResult | null> {
  const parsed = formatVatNumber(rawVatNumber);
  if (!parsed || !EU_COUNTRIES[parsed.countryCode]) {
    return null;
  }

  const { countryCode, number } = parsed;
  const result = await checkVies(countryCode, number);

  return {
    valid: result.valid,
    vatNumber: `${countryCode}${number}`,
    countryCode,
    countryName: EU_COUNTRIES[countryCode],
    name: result.name || null,
    address: result.address || null,
  };
}