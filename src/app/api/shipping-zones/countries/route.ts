import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { DEFAULT_COUNTRY_OPTIONS } from '@/lib/customer-form-utils';

function normalizeCountry(raw: unknown): string {
  const v = typeof raw === 'string' ? raw : '';
  const cleaned = v.trim().toUpperCase();
  return cleaned.length === 2 ? cleaned : 'FR';
}

/**
 * Liste des pays disponibles pour la livraison.
 *
 * Un pays est « disponible » dès qu'il possède au moins une ville rattachée à
 * une zone de livraison active dans le back-end :
 *   - zone ayant une règle tarifaire (settings/delivery.deliveryFeeRules),
 *   - OU frais généraux actifs (isDefaultFeeEnabled),
 *   - OU livraison offerte active (isFreeDeliveryEnabled).
 *
 * Les villes portent un champ `country` (ISO 3166-1 alpha-2), FR par défaut.
 * L'admin « Gestion des villes » l'enregistre ; les pays listés sont la fusion
 * de la liste canonique (DEFAULT_COUNTRY_OPTIONS) et des codes réellement
 * présents sur les villes en base — un pays ajouté plus tard devient donc
 * automatiquement visible puis sélectionnable dès qu'une de ses villes a une
 * zone active, sans modification du code front-end.
 */
export async function GET() {
  try {
    const { adminDb } = getFirebaseAdmin();

    const [citiesSnap, settingsDoc] = await Promise.all([
      adminDb.collection('cities').get(),
      adminDb.collection('settings').doc('delivery').get(),
    ]);

    const settings = settingsDoc.exists ? (settingsDoc.data() || {}) : {};
    const rules = Array.isArray(settings.deliveryFeeRules) ? settings.deliveryFeeRules : [];
    const activeZoneIds = new Set<string>(
      (rules as Array<{ zoneId?: string }>)
        .map(r => r.zoneId)
        .filter((z): z is string => typeof z === 'string' && z.length > 0)
    );
    const defaultFeeEnabled = !!settings.isDefaultFeeEnabled;
    const freeDeliveryEnabled = !!settings.isFreeDeliveryEnabled;

    const zoneActive = (zoneId: unknown): boolean => {
      if (defaultFeeEnabled || freeDeliveryEnabled) return true;
      return typeof zoneId === 'string' && activeZoneIds.has(zoneId);
    };

    // Pays présents en base (toutes villes confondues) + pays disponibles.
    const countriesInDb = new Set<string>();
    const availableCountries = new Set<string>();

    citiesSnap.docs.forEach(doc => {
      const data = doc.data();
      const country = normalizeCountry(data.country);
      countriesInDb.add(country);
      if (data.zoneId && zoneActive(data.zoneId)) {
        availableCountries.add(country);
      }
    });

    // Fusion : liste canonique + codes découverts en base (dynamique).
    const labelByCode = new Map(DEFAULT_COUNTRY_OPTIONS.map(o => [o.value, o.label]));
    const seen = new Set<string>();
    const countries: { code: string; label: string; is_available: boolean }[] = [];

    for (const opt of DEFAULT_COUNTRY_OPTIONS) {
      seen.add(opt.value);
      countries.push({ code: opt.value, label: opt.label, is_available: availableCountries.has(opt.value) });
    }
    for (const code of Array.from(countriesInDb)) {
      if (seen.has(code)) continue;
      seen.add(code);
      countries.push({ code, label: labelByCode.get(code) || code, is_available: availableCountries.has(code) });
    }

    return NextResponse.json({ countries });
  } catch (err: any) {
    console.error('[ShippingZonesCountries] Error:', err);
    return NextResponse.json({ error: 'Erreur lors de la récupération des pays' }, { status: 500 });
  }
}