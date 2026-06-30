import { NextResponse } from 'next/server';
import { saveTrackingStatus } from '@/lib/tracking/service';

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
    const body: WebhookEvent | WebhookEvent[] = await req.json();
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
