import { NextResponse } from 'next/server';
import { getActive17TrackKey, saveTrackingStatus, getCachedTracking } from '@/lib/tracking/service';
import { getTrackingInfo, parseTrackingEvents } from '@/lib/tracking/api';

export async function POST(req: Request) {
  try {
    const { trackingNumber, carrier } = await req.json();
    if (!trackingNumber) {
      return NextResponse.json({ error: 'Numéro de suivi requis' }, { status: 400 });
    }

    const cached = await getCachedTracking(trackingNumber);
    const FIVE_MIN = 5 * 60 * 1000;
    if (cached && cached.lastUpdatedAt) {
      const elapsed = Date.now() - new Date(cached.lastUpdatedAt).getTime();
      if (elapsed < FIVE_MIN) {
        return NextResponse.json({ data: cached, cached: true });
      }
    }

    const apiKey = await getActive17TrackKey();
    if (!apiKey) {
      return NextResponse.json({ error: 'API 17TRACK non configurée' }, { status: 400 });
    }

    const result = await getTrackingInfo(apiKey, trackingNumber, carrier);

    if (result.data?.accepted?.length) {
      const trackData = result.data.accepted[0];
      const events = parseTrackingEvents(trackData);
      const track = trackData.track;

      const data = {
        status: track?.latest_status?.status || 'NotFound',
        subStatus: track?.latest_status?.sub_status || '',
        events,
        carrier: trackData.carrier,
        estimatedDelivery: track?.est_delivery_time || null,
        pickupTime: track?.origin_info?.pickup_time || null,
        deliveryTime: track?.origin_info?.delivery_time || null,
        recipient: track?.destination_info?.recipient || null,
        originCountry: track?.origin_country || null,
        destinationCountry: track?.destination_country || null,
        carrierLabel: `17TRACK (carrier ${trackData.carrier})`,
      };

      await saveTrackingStatus(trackingNumber, {
        status: data.status,
        subStatus: data.subStatus,
        events: data.events,
        carrier: data.carrier,
      });

      return NextResponse.json({ data });
    }

    const rejected = result.data?.rejected?.[0];
    return NextResponse.json(
      { error: rejected?.error?.message || 'Aucune info disponible' },
      { status: 404 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
