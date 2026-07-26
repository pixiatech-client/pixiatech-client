import { NextResponse } from 'next/server';
import { getActive17TrackKey, saveTrackingToOrder } from '@/lib/tracking/service';
import { registerTrackingNumber } from '@/lib/tracking/api';
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

export async function POST(req: Request) {
  try {
    const authErr = await requireAdminSession(req);
    if (authErr) return authErr;

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
