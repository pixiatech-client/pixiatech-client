export const ANALYTICS_EVENTS_COLLECTION = 'analytics_events';
export const ANALYTICS_SESSIONS_COLLECTION = 'analytics_sessions';

export const ANALYTICS_EVENT_TYPES = [
  'session_start',
  'page_view',
  'product_view',
  'product_click',
  'contact_click',
  'form_submit',
  'phone_click',
  'email_click',
  'whatsapp_click',
  'download',
  'heartbeat',
] as const;
export type AnalyticsEventType = (typeof ANALYTICS_EVENT_TYPES)[number];

export const ANALYTICS_ACTION_TYPES: readonly AnalyticsEventType[] = [
  'product_click',
  'contact_click',
  'form_submit',
  'phone_click',
  'email_click',
  'whatsapp_click',
  'download',
];

export type AnalyticsSource = 'direct' | 'search' | 'social' | 'referral' | 'campaign' | 'other';

export const SID_RE = /^[A-Za-z0-9_-]{8,80}$/;
export const VID_RE = /^[A-Za-z0-9_-]{8,80}$/;

// Limites de longueur pour éviter tout stockage de payloads anormaux.
export const MAX_STRLEN = 500;