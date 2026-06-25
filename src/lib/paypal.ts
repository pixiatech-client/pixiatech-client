import { getPayPalSettings } from './paypal-settings-service';

const SANDBOX_API = 'https://api-m.sandbox.paypal.com';
const LIVE_API = 'https://api-m.paypal.com';

async function getPayPalConfig() {
  const settings = await getPayPalSettings();
  const apiUrl = settings.environment === 'live' ? LIVE_API : SANDBOX_API;
  return { ...settings, apiUrl };
}

async function getAccessToken(): Promise<string> {
  const config = await getPayPalConfig();
  const basic = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');

  const res = await fetch(`${config.apiUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PayPal auth failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  return data.access_token;
}

export async function createPayPalOrder(amount: number) {
  const config = await getPayPalConfig();
  const token = await getAccessToken();

  const res = await fetch(`${config.apiUrl}/v2/checkout/orders`, {
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
  const config = await getPayPalConfig();
  const token = await getAccessToken();

  const res = await fetch(`${config.apiUrl}/v2/checkout/orders/${orderId}/capture`, {
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
