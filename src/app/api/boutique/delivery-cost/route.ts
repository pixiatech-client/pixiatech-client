import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import type { DeliverySettings, City } from '@/lib/types';

export async function GET(req: NextRequest) {
  try {
    const postcode = req.nextUrl.searchParams.get('postcode') || '';
    const city = req.nextUrl.searchParams.get('city') || '';
    const subtotalStr = req.nextUrl.searchParams.get('subtotal') || '0';
    const subtotal = parseFloat(subtotalStr) || 0;

    const { adminDb } = getFirebaseAdmin();

    // 1. Read delivery settings
    const settingsDoc = await adminDb.collection('settings').doc('delivery').get();
    const defaults: DeliverySettings = {
      defaultFee: 600,
      isDefaultFeeEnabled: false,
      isFreeDeliveryEnabled: false,
      freeDeliveryThreshold: 10000,
      deliveryFeeRules: [],
      isTotalFreeDeliveryEnabled: false,
      unconfiguredZoneMessage: '',
    };
    const settings: DeliverySettings = settingsDoc.exists
      ? { ...defaults, ...settingsDoc.data() }
      : defaults;

    // 2. Check total free delivery
    if (settings.isTotalFreeDeliveryEnabled) {
      return NextResponse.json({ deliveryCost: 0, label: 'Livraison offerte', isFree: true });
    }

    // 3. Check free delivery threshold
    if (settings.isFreeDeliveryEnabled && subtotal >= settings.freeDeliveryThreshold) {
      return NextResponse.json({ deliveryCost: 0, label: 'Livraison offerte', isFree: true });
    }

    // 4. Look up city by postal code
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

    // 5. Find matching delivery fee rule
    let deliveryCost = settings.defaultFee;

    if (matchedCity?.zoneId && settings.deliveryFeeRules.length > 0) {
      // First try city-specific rule
      const cityRule = settings.deliveryFeeRules.find(
        r => r.zoneId === matchedCity!.zoneId && r.cityId === matchedCity!.id
      );
      if (cityRule) {
        deliveryCost = cityRule.fee;
      } else {
        // Then try zone-wide rule
        const zoneRule = settings.deliveryFeeRules.find(
          r => r.zoneId === matchedCity!.zoneId && !r.cityId
        );
        if (zoneRule) {
          deliveryCost = zoneRule.fee;
        }
      }
    } else if (settings.isDefaultFeeEnabled) {
      deliveryCost = settings.defaultFee;
    } else {
      deliveryCost = 0;
    }

    // 6. If no zone matched and no default fee, cost is 0
    if (!matchedCity?.zoneId && !settings.isDefaultFeeEnabled) {
      deliveryCost = 0;
    }

    return NextResponse.json({
      deliveryCost,
      label: deliveryCost === 0 ? 'Livraison offerte' : `Livraison Express`,
      isFree: deliveryCost === 0,
      zoneName: matchedCity?.zoneId || null,
    });

  } catch (err: any) {
    console.error('[DeliveryCost] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
