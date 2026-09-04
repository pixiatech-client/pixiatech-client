import { getPayPalSettings } from './paypal-settings-service';

const SANDBOX_API = 'https://api-m.sandbox.paypal.com';
const LIVE_API = 'https://api-m.paypal.com';

async function getPayPalConfig() {
  const settings = await getPayPalSettings();
  const apiUrl = settings.environment === 'live' ? LIVE_API : SANDBOX_API;
  return { ...settings, apiUrl };
}

async function getAuthAndApi(): Promise<{ token: string; apiUrl: string }> {
  const config = await getPayPalConfig();
  const basic = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');

  let res = await fetch(`${config.apiUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  let activeApiUrl = config.apiUrl;
  if (!res.ok && res.status === 401) {
    const fallbackApiUrl = config.apiUrl === LIVE_API ? SANDBOX_API : LIVE_API;
    console.warn(`[PayPal] Auth failed on ${config.apiUrl} (401), attempting fallback to ${fallbackApiUrl}...`);
    try {
      const fallbackRes = await fetch(`${fallbackApiUrl}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${basic}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
      });
      if (fallbackRes.ok) {
        res = fallbackRes;
        activeApiUrl = fallbackApiUrl;
        console.log(`[PayPal] Successfully authenticated on fallback: ${fallbackApiUrl}`);
      }
    } catch (e) {
      // Ignore fallback network errors and throw original error
    }
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PayPal auth failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  return { token: data.access_token, apiUrl: activeApiUrl };
}

export async function createPayPalOrder(amount: number) {
  const { token, apiUrl } = await getAuthAndApi();

  const res = await fetch(`${apiUrl}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: 'EUR',
          value: amount.toFixed(2),
        },
      }],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PayPal create order failed: ${res.status} ${text}`);
  }

  return res.json();
}

export async function capturePayPalOrder(orderId: string) {
  const { token, apiUrl } = await getAuthAndApi();

  const res = await fetch(`${apiUrl}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PayPal capture failed: ${res.status} ${text}`);
  }

  return res.json();
}
