import { NextResponse } from 'next/server';
import { getPayPalSettings } from '@/lib/paypal-settings-service';

export async function GET() {
  try {
    const settings = await getPayPalSettings();

    // Credentials carte : si vide → fallback sur les credentials principaux
    const cardClientId = settings.card.clientId || settings.clientId;
    const cardEnvironment = settings.card.environment || settings.environment;
    // Détermine si les deux modes partagent le même compte
    const cardSharesMainAccount = !settings.card.clientId || settings.card.clientId === settings.clientId;

    return NextResponse.json({
      // Mode compte PayPal
      clientId: settings.clientId,
      environment: settings.environment,
      enablePaypal: settings.enablePaypal,
      // Mode carte bancaire
      enableCardPayments: settings.enableCardPayments,
      cardClientId,
      cardEnvironment,
      cardSharesMainAccount,
    });
  } catch (error) {
    console.error('Failed to fetch PayPal client ID:', error);
    return NextResponse.json({
      clientId: '',
      environment: 'sandbox',
      enablePaypal: true,
      enableCardPayments: false,
      cardClientId: '',
      cardEnvironment: 'sandbox',
      cardSharesMainAccount: true,
    });
  }
}
