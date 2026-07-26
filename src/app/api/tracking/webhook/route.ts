import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { saveTrackingStatus } from '@/lib/tracking/service';

// Verify the HMAC-SHA256 signature on incoming webhooks to ensure they originate
// from the trusted carrier (17Track). Set TRACKING_WEBHOOK_SECRET in your env
// to a value shared with the carrier. If unset, we fail-closed (reject all).
function verifyWebhookSignature(rawBody: string, signatureHeader: string | null): boolean {
  const secret = process.env.TRACKING_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[tracking-webhook] TRACKING_WEBHOOK_SECRET not set — rejecting all webhooks');
    return false;
  }
  if (!signatureHeader) return false;
  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody, 'utf8')
    .digest('hex');
  // Constant-time compare to prevent timing attacks
  const a = Buffer.from(expected, 'hex');
  const b = Buffer.from(signatureHeader.trim(), 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

interface WebhookEvent {
  event: 'TRACKING_UPDATED' | 'TRACKING_REGISTERED' | 'CHECKPOINT';
  number: string;
  carrier: number;
  status: string;
  sub_status: string;
  milestones?: Array<{
    id: string;
    action: string;
    status: string;
    sub_status: string;
    time: string;
    location: Record<string, string>;
  }>;
  events?: Array<{
    id: string;
    time: string;
    location: { city: string; country: string };
    description: string;
    status: string;
    sub_status: string;
  }>;
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-tracking-signature') || req.headers.get('x-17track-signature');
    if (!verifyWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const body: WebhookEvent | WebhookEvent[] = JSON.parse(rawBody);
    const events = Array.isArray(body) ? body : [body];

    for (const evt of events) {
      if (evt.number && evt.status) {
        const parsedEvents = (evt.events || []).map((e) => ({
          time: e.time,
          timeRaw: e.time,
          location: [e.location?.city, e.location?.country].filter(Boolean).join(', '),
          description: e.description || '',
          subStatus: e.sub_status || '',
          status: e.status as any,
        }));

        await saveTrackingStatus(evt.number, {
          status: evt.status,
          subStatus: evt.sub_status || '',
          events: parsedEvents,
          carrier: evt.carrier,
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
