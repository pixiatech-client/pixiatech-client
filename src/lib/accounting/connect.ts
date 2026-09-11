import type { ConnectInvoicePayload, ConnectInvoiceResult } from './types';

const CONNECT_PRE_URL = 'https://ais-pre-arhb7jlfdn7rfcrnjdjf3l-322486946140.europe-west2.run.app/api/v1/accounting/invoices';
const CONNECT_DEV_URL = 'https://ais-dev-arhb7jlfdn7rfcrnjdjf3l-322486946140.europe-west2.run.app/api/v1/accounting/invoices';

const TIMEOUT_MS = 10_000;

function resolveConnectUrl(): string | null {
  const configured = process.env.PIXIATECH_CONNECT_API_URL;
  if (configured) return configured;
  const mode = process.env.PIXIATECH_ENV?.toLowerCase();
  if (mode === 'dev' || mode === 'development') return CONNECT_DEV_URL;
  return CONNECT_PRE_URL;
}

export async function sendInvoiceToConnect(payload: ConnectInvoicePayload): Promise<ConnectInvoiceResult> {
  const url = resolveConnectUrl();
  const apiKey = process.env.MODULE_API_KEY;

  if (!url) {
    return { ok: false, status: 0, error: 'PIXIATECH_CONNECT_API_URL non configuré' };
  }
  if (!apiKey) {
    return { ok: false, status: 0, error: 'MODULE_API_KEY non configuré' };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const text = await res.text();
    let data: unknown = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }

    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        data,
        error: `PIXIATECH Connect responded ${res.status}: ${(text || '').slice(0, 500)}`,
      };
    }

    return { ok: true, status: res.status, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, status: 0, error: `PIXIATECH Connect call failed: ${message}` };
  } finally {
    clearTimeout(timeout);
  }
}