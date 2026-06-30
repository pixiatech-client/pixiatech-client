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

interface TrackingInfoResponse {
  code: number;
  data: {
    accepted: Array<{
      number: string;
      carrier: number;
      track: {
        transit: boolean;
        latest_status: {
          status: TrackingStatus;
          sub_status: string;
        };
        latest_event: {
          time: string;
          time_iso: string;
          location: { city: string; country: string };
          description: string;
        };
        origin_info: {
          received_days: number;
          reference_number: string;
          pickup_time: string;
          delivery_time: string;
          wechat_ship_time: string;
          other_info: string;
          track_info: string;
        };
        destination_info: {
          recipient: string;
          country: string;
          city: string;
          address: string;
          postal_code: string;
        };
        last_mile_info: string;
        milestones: Array<{
          id: string;
          action: string;
          status: string;
          sub_status: string;
          time: string;
          time_iso: string;
          location: { city: string; country: string };
        }>;
        events: Array<{
          id: string;
          time: string;
          time_iso: string;
          time_raw: string;
          location: { city: string; country: string };
          description: string;
          status: string;
          sub_status: string;
          signed_by: string;
        }>;
        origin_country: string;
        destination_country: string;
        est_delivery_time: string;
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
  const track = data.track;
  if (!track || !track.events) return [];

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
