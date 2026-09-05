import { NextRequest, NextResponse } from 'next/server';
import { getClientSessionCustomerId } from '@/lib/client-session';
import { upsertProfessionalInfo } from '@/lib/professional-info';
import { validateVatNumber } from '@/lib/vies';

const FIELD_NAMES = [
  'companyName',
  'siret',
  'vatNumber',
  'address',
  'city',
  'state',
  'postcode',
  'country',
  'officePhone',
  'companyEmail',
  'position',
  'employees',
  'website',
  'fax',
] as const;

export async function POST(req: NextRequest) {
  try {
    const customerId = await getClientSessionCustomerId(req);
    if (!customerId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 });
    }

    const cleaned: Record<string, string> = {};
    for (const field of FIELD_NAMES) {
      const value = body[field];
      cleaned[field] = typeof value === 'string' ? value.trim() : value == null ? '' : String(value);
    }

    let vatValidated = false;
    let vatRate: 0 | 0.2 = 0.2;
    const rawVat = cleaned.vatNumber || '';
    if (rawVat) {
      try {
        const result = await validateVatNumber(rawVat);
        if (result && result.valid) {
          vatValidated = true;
          vatRate = 0;
          cleaned.vatNumber = result.vatNumber;
        }
      } catch (err) {
        // VIES service failure fallback : on garde le profil enregistré mais
        // non validé, on ne bloque jamais la sauvegarde du profil.
        console.error('[UpdateProfessionalInfo] VIES check failed:', err);
      }
    }

    const saved = await upsertProfessionalInfo(customerId, {
      ...cleaned,
      vatValidated,
      vatRate,
    } as any);

    return NextResponse.json(saved);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}