import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import type { DeliverySettings, City } from '@/lib/types';
import { computeDeliveryCostDetails } from '@/lib/pricing-engine';

/**
 * GET /api/shipping-methods?country=FR&postal_code=75006&city=Paris&subtotal=120
 *
 * Liste des modes de livraison pour l'adresse de checkout, dérivée de la
 * configuration réelle `settings/delivery` via le moteur de pricing partagé.
 *
 * Aucun tarif n'est inventé : chaque méthode provient exclusivement des règles
 * configurées par l'administrateur (règle zone/ville, tarif par défaut activé,
 * offre globale/seuil). La liste est structurée en tableau, pré-selectionnable
 * côté client et prête à être étendue (d'autres transporteurs).
 */
export async function GET(req: NextRequest) {
  try {
    const country = req.nextUrl.searchParams.get('country') || 'FR';
    const postcode = req.nextUrl.searchParams.get('postal_code') || '';
    const city = req.nextUrl.searchParams.get('city') || '';
    const subtotalStr = req.nextUrl.searchParams.get('subtotal') || '0';
    const subtotal = parseFloat(subtotalStr) || 0;

    const { adminDb } = getFirebaseAdmin();

    // 1. Config livraison — source de vérité. DEFAULTS sécurité : aucun tarif
    //    par défaut inventé tant que l'administrateur n'a rien configuré.
    const settingsDoc = await adminDb.collection('settings').doc('delivery').get();
    const defaults: DeliverySettings = {
      defaultFee: 0,
      isDefaultFeeEnabled: false,
      isFreeDeliveryEnabled: false,
      freeDeliveryThreshold: 0,
      deliveryFeeRules: [],
      isTotalFreeDeliveryEnabled: false,
      unconfiguredZoneMessage: '',
    };
    const settings: DeliverySettings = settingsDoc.exists
      ? { ...defaults, ...settingsDoc.data() }
      : defaults;

    // 2. Résolution de la ville de destination (par code postal sinon par nom).
    let matchedCity: City | null = null;
    if (postcode || city) {
      const citiesQuery = adminDb.collection('cities');
      const snapshot = postcode
        ? await citiesQuery.where('postalCode', '==', postcode).limit(1).get()
        : await citiesQuery.where('name', '==', city).limit(1).get();
      if (!snapshot.empty) {
        matchedCity = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as City;
      }
    }

    // 3. Unique mode réellement configuré : le coût calculé pour cette adresse.
    const { cost, reason } = computeDeliveryCostDetails(settings, {
      subtotal,
      zoneId: matchedCity?.zoneId ?? null,
      cityId: matchedCity?.id ?? null,
    });

    // Libellé du mode — reflète honnêtement la configuration appliquée.
    let name = 'Livraison standard';
    let isFree = false;
    if (reason === 'total-free' || reason === 'threshold-free' || (reason === 'rule' && cost === 0)) {
      name = 'Livraison offerte';
      isFree = true;
    } else if (reason === 'unconfigured') {
      name = settings.unconfiguredZoneMessage || 'Livraison gratuite';
    }

    // Délai d'affichage : valeur admin si configurée, sinon libellé générique.
    const delayLabel =
      typeof (settings as any).delayLabel === 'string' && (settings as any).delayLabel.trim()
        ? (settings as any).delayLabel
        : '2-3 jours ouvrés';

    const methods = [
      {
        id: 'standard',
        name,
        delay: delayLabel,
        price: cost,
        deliveryCost: cost,
        isFree,
        reason,
        zoneName: matchedCity?.zoneId ?? null,
      },
    ];

    return NextResponse.json({ country, methods, zoneName: matchedCity?.zoneId ?? null });
  } catch (err: any) {
    console.error('[ShippingMethods] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}