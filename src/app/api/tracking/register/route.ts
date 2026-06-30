import { NextResponse } from 'next/server';
import { getActive17TrackKey, saveTrackingToOrder } from '@/lib/tracking/service';
import { registerTrackingNumber } from '@/lib/tracking/api';

export async function POST(req: Request) {
  try {
    const { trackingNumber, carrier, orderId, orderType } = await req.json();

    if (!trackingNumber) {
      return NextResponse.json({ error: 'Numéro de suivi requis' }, { status: 400 });
    }

    const apiKey = await getActive17TrackKey();
    if (!apiKey) {
      return NextResponse.json({ error: 'API 17TRACK non configurée' }, { status: 400 });
    }

    const payload = carrier
      ? [{ number: trackingNumber, carrier }]
      : [{ number: trackingNumber }];

    const result = await registerTrackingNumber(apiKey, payload);

    if (result.data?.accepted?.length) {
      const accepted = result.data.accepted[0];

      if (orderId && orderType) {
        await saveTrackingToOrder(
          orderId,
          orderType as 'sale' | 'rental',
          trackingNumber,
          accepted.carrier,
          `17TRACK (carrier ${accepted.carrier})`
        );
      }

      return NextResponse.json({
        success: true,
        carrier: accepted.carrier,
      });
    }

    const rejected = result.data?.rejected?.[0];
    return NextResponse.json(
      { error: rejected?.error?.message || 'Enregistrement refusé', details: result.data?.rejected },
      { status: 422 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
