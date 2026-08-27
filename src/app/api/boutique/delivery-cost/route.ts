import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import type { DeliverySettings, City } from '@/lib/types';
import { computeDeliveryCostDetails } from '@/lib/pricing-engine';

export async function GET(req: NextRequest) {
  try {
    const postcode = req.nextUrl.searchParams.get('postcode') || '';
    const city = req.nextUrl.searchParams.get('city') || '';
    const subtotalStr = req.nextUrl.searchParams.get('subtotal') || '0';
    const subtotal = parseFloat(subtotalStr) || 0;

    const { adminDb } = getFirebaseAdmin();

    // 1. Read delivery settings — configuration sûre : AUCUN tarif par défaut
    //    n'est inventé tant que l'administrateur n'a rien configuré.
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

    // 2. Look up city by postal code / name
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

    // 3. Calculate via the shared pricing engine — the SINGLE source of truth.
    const { cost: deliveryCost, reason } = computeDeliveryCostDetails(settings, {
      subtotal,
      zoneId: matchedCity?.zoneId ?? null,
      cityId: matchedCity?.id ?? null,
    });

    let label = `Livraison Express`;
    let isFree = false;
    if (reason === 'total-free' || reason === 'threshold-free' || (reason === 'rule' && deliveryCost === 0)) {
      label = 'Livraison offerte';
      isFree = true;
    } else if (reason === 'unconfigured') {
      // Aucun tarif configuré : coût 0 mais la zone n'est PAS "offerte" —
      // c'est un état non configuré, signalé honnêtement au client.
      label = settings.unconfiguredZoneMessage || 'Livraison gratuite';
    }

    return NextResponse.json({
      deliveryCost,
      label,
      isFree,
      zoneName: matchedCity?.zoneId || null,
    });

  } catch (err: any) {
    console.error('[DeliveryCost] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}