import { SEVENTEEN_TRACK_API_BASE } from './constants';
import type { TrackingStatus, TrackingEvent } from './types';

interface RegisterPayload {
  number: string;
  carrier?: number;
  lang?: string;
  order_no?: string;
}

interface RegisterResponse {
  code: number;
  data: {
    accepted: Array<{
      number: string;
      carrier: number;
      origin: number;
    }>;
    rejected: Array<{
      number: string;
      carrier: number;
      error: { code: number; message: string };
    }>;
  };
}

interface V2ProviderEvent {
  time_iso: string | null;
  time_utc: string | null;
  time_raw: { date: string | null; time: string | null; timezone: string | null } | null;
  description: string;
  description_translation?: { lang: string; description: string };
  location: string | null;
  stage: string;
  sub_status: string;
}

interface TrackingInfoResponse {
  code: number;
  data: {
    accepted: Array<{
      number: string;
      carrier: number;
      tag?: string | null;
      lang?: string | null;
      origin_country?: string | null;
      destination_country?: string | null;
      // v2.4 format
      track_info?: {
        latest_status?: { status: string; sub_status: string };
        latest_event?: Record<string, any>;
        time_metrics?: {
          estimated_delivery_date?: { from?: string; to?: string };
        };
        shipping_info?: {
          shipper_address?: { country?: string };
          recipient_address?: { country?: string };
        };
        tracking?: {
          providers?: Array<{
            provider?: { key?: number; name?: string };
            events?: V2ProviderEvent[];
          }>;
        };
      };
      // v2.2 fallback
      track?: {
        latest_status?: { status: string; sub_status: string };
        events?: Array<{
          time: string;
          time_iso: string;
          time_raw: string;
          location: { city: string; country: string };
          description: string;
          status: string;
          sub_status: string;
        }>;
        origin_country?: string;
        destination_country?: string;
        est_delivery_time?: string;
        origin_info?: { pickup_time?: string; delivery_time?: string };
        destination_info?: { recipient?: string };
      };
    }>;
    rejected: Array<{
      number: string;
      error: { code: number; message: string };
    }>;
  };
}

function buildHeaders(apiKey: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    '17token': apiKey,
  };
}

export async function registerTrackingNumber(
  apiKey: string,
  numbers: RegisterPayload[]
): Promise<RegisterResponse> {
  const res = await fetch(`${SEVENTEEN_TRACK_API_BASE}/register`, {
    method: 'POST',
    headers: buildHeaders(apiKey),
    body: JSON.stringify(numbers),
  });
  if (!res.ok) {
    throw new Error(`17TRACK register failed: ${res.status}`);
  }
  return res.json();
}

export async function getTrackingInfo(
  apiKey: string,
  number: string,
  carrier?: number,
  lang: string = 'fr'
): Promise<TrackingInfoResponse> {
  const payload = carrier
    ? [{ number, carrier, lang }]
    : [{ number, lang }];

  const res = await fetch(`${SEVENTEEN_TRACK_API_BASE}/gettrackinfo`, {
    method: 'POST',
    headers: buildHeaders(apiKey),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`17TRACK gettrackinfo failed: ${res.status}`);
  }
  return res.json();
}

export function parseTrackingEvents(data: TrackingInfoResponse['data']['accepted'][0]): TrackingEvent[] {
  // v2.4 format: track_info.tracking.providers[].events[]
  if (data.track_info?.tracking?.providers) {
    const all: TrackingEvent[] = [];
    for (const p of data.track_info.tracking.providers) {
      if (!p.events) continue;
      for (const evt of p.events) {
        all.push({
          time: evt.time_iso || evt.time_utc || '',
          timeRaw: evt.time_raw ? `${evt.time_raw.date || ''} ${evt.time_raw.time || ''}`.trim() : '',
          location: evt.location || '',
          description: evt.description_translation?.description || evt.description || '',
          subStatus: evt.sub_status || '',
          status: evt.stage as TrackingStatus || 'InfoReceived',
        });
      }
    }
    return all;
  }

  // v2.2 fallback: track.events[]
  const track = data.track;
  if (!track?.events) return [];

  return track.events.map((evt) => ({
    time: evt.time_iso || evt.time,
    timeRaw: evt.time_raw || '',
    location: [evt.location?.city, evt.location?.country].filter(Boolean).join(', '),
    description: evt.description || '',
    subStatus: evt.sub_status || '',
    status: (evt.status as TrackingStatus) || 'InfoReceived',
  }));
}

export async function testConnection(apiKey: string): Promise<boolean> {
  try {
    const res = await fetch(`${SEVENTEEN_TRACK_API_BASE}/gettrackinfo`, {
      method: 'POST',
      headers: buildHeaders(apiKey),
      body: JSON.stringify([{ number: 'TEST', lang: 'fr' }]),
    });
    return res.status !== 401;
  } catch {
    return false;
  }
}

export { type RegisterPayload, type RegisterResponse, type TrackingInfoResponse };
