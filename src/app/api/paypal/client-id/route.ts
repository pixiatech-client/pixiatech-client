import { NextResponse } from 'next/server';
import { getPayPalSettings } from '@/lib/paypal-settings-service';

export async function GET() {
  try {
    const settings = await getPayPalSettings();
    return NextResponse.json({ clientId: settings.clientId, environment: settings.environment });
  } catch (error) {
    console.error('Failed to fetch PayPal client ID:', error);
    return NextResponse.json({ clientId: '', environment: 'sandbox' });
  }
}
