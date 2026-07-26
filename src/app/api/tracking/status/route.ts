import { NextResponse } from 'next/server';
import { getActive17TrackKey, saveTrackingStatus, getCachedTracking } from '@/lib/tracking/service';
import { getTrackingInfo, parseTrackingEvents, registerTrackingNumber } from '@/lib/tracking/api';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

// 17Track API quota is paid — gate this endpoint behind an admin session
// to prevent anonymous abuse and quota exhaustion.
async function requireAdminSession(req: Request): Promise<NextResponse | null> {
  const cookieHeader = req.headers.get('cookie') || '';
  const sessionMatch = cookieHeader.match(/(?:^|;\s*)session=([^;]+)/);
  if (!sessionMatch) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { adminAuth, adminDb } = getFirebaseAdmin();
    if (!adminAuth || !adminDb) {
      return NextResponse.json({ error: 'Admin SDK not initialized' }, { status: 500 });
    }
    const decoded = await adminAuth.verifySessionCookie(decodeURIComponent(sessionMatch[1]), true);
    const userDoc = await adminDb.collection('users').doc(decoded.uid).get();
    if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return null;
  } catch {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }
}

function extractItems(data: unknown): {
  items: any[];
  rejected: Array<Record<string, any>>;
} {
  if (Array.isArray(data)) {
    return { items: data, rejected: (data as any).rejected ?? [] };
  }
  const d = data as Record<string, any> | undefined;
  return {
    items: d?.accepted ?? [],
    rejected: d?.rejected ?? [],
  };
}

export async function POST(req: Request) {
  try {
    const authErr = await requireAdminSession(req);
    if (authErr) return authErr;

    const { trackingNumber, carrier } = await req.json();
    if (!trackingNumber) {
      return NextResponse.json({ error: 'Numéro de suivi requis' }, { status: 400 });
    }

    // Cache : on ignore si les événements sont vides
    const cached = await getCachedTracking(trackingNumber);
    const FIVE_MIN = 5 * 60 * 1000;
    if (cached && cached.lastUpdatedAt && cached.events?.length) {
      const elapsed = Date.now() - new Date(cached.lastUpdatedAt).getTime();
      if (elapsed < FIVE_MIN) {
        return NextResponse.json({ data: cached, cached: true });
      }
    }

    const apiKey = await getActive17TrackKey();
    if (!apiKey) {
      return NextResponse.json({ error: 'API 17TRACK non configurée' }, { status: 400 });
    }

    // Étape 1 : Enregistrer le numéro chez 17TRACK (idempotent)
    // Cela permet à 17TRACK d'ajouter le numéro à notre compte et de détecter le transporteur
    const registerPayload = carrier
      ? [{ number: trackingNumber, carrier }]
      : [{ number: trackingNumber }];
    const registerResult = await registerTrackingNumber(apiKey, registerPayload);
    const detectedCarrier = registerResult.data?.accepted?.[0]?.carrier || carrier;

    // Étape 2 : Récupérer les infos de suivi (avec le carrier détecté si disponible)
    const result = await getTrackingInfo(apiKey, trackingNumber, detectedCarrier);
    const { items, rejected } = extractItems(result.data);

    if (items.length) {
      const trackData = items[0];
      const events = parseTrackingEvents(trackData);
      const trackV2 = trackData.track_info || trackData.track || {};
      const effectiveCarrier = trackData.carrier || detectedCarrier || null;

      // Si toujours pas d'événements : 17TRACK n'a pas encore les données
      if (!events.length) {
        const data: Record<string, any> = {
          status: trackV2.latest_status?.status || 'NotFound',
          subStatus: trackV2.latest_status?.sub_status || '',
          events: [],
          carrier: effectiveCarrier,
          registered: true,
          carrierLabel: `17TRACK (carrier ${effectiveCarrier ?? '?'})`,
          message: 'Numéro enregistré, données de suivi en cours de récupération',
        };

        await saveTrackingStatus(trackingNumber, {
          status: data.status as string,
          subStatus: data.subStatus as string,
          events: data.events,
          carrier: (effectiveCarrier as number) ?? 0,
        });

        return NextResponse.json({ data });
      }

      // v2.4 estimated delivery
      const estimatedDelivery = trackV2.time_metrics?.estimated_delivery_date?.from
        || trackV2.est_delivery_time
        || null;

      const data = {
        status: trackV2.latest_status?.status || 'NotFound',
        subStatus: trackV2.latest_status?.sub_status || '',
        events,
        carrier: effectiveCarrier,
        estimatedDelivery,
        pickupTime: trackV2.shipping_info?.shipper_address?.country ? null : null,
        deliveryTime: null,
        recipient: null,
        originCountry: trackData.origin_country || trackV2.origin_country || trackV2.shipping_info?.shipper_address?.country || null,
        destinationCountry: trackData.destination_country || trackV2.destination_country || trackV2.shipping_info?.recipient_address?.country || null,
        carrierLabel: `17TRACK (carrier ${effectiveCarrier ?? '?'})`,
      };

      await saveTrackingStatus(trackingNumber, {
        status: data.status,
        subStatus: data.subStatus,
        events: data.events,
        carrier: effectiveCarrier ?? 0,
      });

      return NextResponse.json({ data });
    }

    const rejectedItem = rejected[0];
    return NextResponse.json(
      { error: rejectedItem?.error?.message || rejectedItem?.error || 'Aucune info disponible' },
      { status: 404 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
