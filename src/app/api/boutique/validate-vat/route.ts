import { NextRequest, NextResponse } from 'next/server';

const EU_COUNTRIES: Record<string, string> = {
  AT: 'Austria', BE: 'Belgium', BG: 'Bulgaria', CY: 'Cyprus', CZ: 'Czech Republic',
  DE: 'Germany', DK: 'Denmark', EE: 'Estonia', ES: 'Spain', FI: 'Finland',
  FR: 'France', GR: 'Greece', HR: 'Croatia', HU: 'Hungary', IE: 'Ireland',
  IT: 'Italy', LT: 'Lithuania', LU: 'Luxembourg', LV: 'Latvia', MT: 'Malta',
  NL: 'Netherlands', PL: 'Poland', PT: 'Portugal', RO: 'Romania', SE: 'Sweden',
  SI: 'Slovenia', SK: 'Slovakia',
};

function formatVatNumber(raw: string): { countryCode: string; number: string } | null {
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
    const response = await fetch(
      `https://ec.europa.eu/taxation_customs/vies/rest-api/check-vat-number/${countryCode}/${vatNumber}`,
      { signal: AbortSignal.timeout(10000) }
    );
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      console.warn(`[VIES] HTTP ${response.status}: ${text}`);
      return { valid: false };
    }
    const data = await response.json();
    return {
      valid: data.valid === true,
      name: data.name || undefined,
      address: data.address || undefined,
    };
  } catch (err) {
    console.warn('[VIES] Network error, using fallback validation:', err);
    return { valid: false };
  }
}

export async function POST(req: NextRequest) {
  try {
    const { vatNumber } = await req.json();
    if (!vatNumber || typeof vatNumber !== 'string') {
      return NextResponse.json({ valid: false, error: 'Numéro de TVA requis' }, { status: 400 });
    }

    const parsed = formatVatNumber(vatNumber);
    if (!parsed) {
      return NextResponse.json({ valid: false, error: 'Format de numéro de TVA invalide' }, { status: 400 });
    }

    const { countryCode, number } = parsed;

    if (!EU_COUNTRIES[countryCode]) {
      return NextResponse.json({ valid: false, error: `Pays non reconnu: ${countryCode}` }, { status: 400 });
    }

    const result = await checkVies(countryCode, number);

    return NextResponse.json({
      valid: result.valid,
      vatNumber: `${countryCode}${number}`,
      countryCode,
      countryName: EU_COUNTRIES[countryCode],
      name: result.name || null,
      address: result.address || null,
    });
  } catch (err: any) {
    return NextResponse.json({ valid: false, error: err.message }, { status: 500 });
  }
}
