import { NextRequest, NextResponse } from 'next/server';
import { getPayPalSettings } from '@/lib/paypal-settings-service';
import { requireAdminFresh } from '@/lib/auth-guards';

const SANDBOX_API = 'https://api-m.sandbox.paypal.com';
const LIVE_API = 'https://api-m.paypal.com';

/**
 * POST /api/paypal/test-connection
 * Body: { mode: 'paypal' | 'card' }
 *
 * Tente d'obtenir un token PayPal avec les credentials du mode demandé.
 * Réservé aux administrateurs authentifiés.
 * Ne retourne jamais les secrets dans la réponse.
 */
export async function POST(req: NextRequest) {
  // Seuls les administrateurs peuvent tester la connexion
  try {
    await requireAdminFresh();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { mode } = await req.json();
    if (mode !== 'paypal' && mode !== 'card') {
      return NextResponse.json({ error: 'mode must be "paypal" or "card"' }, { status: 400 });
    }

    const settings = await getPayPalSettings();

    // Résolution des credentials selon le mode
    let clientId: string;
    let clientSecret: string;
    let environment: 'sandbox' | 'live';

    if (mode === 'card') {
      // Fallback sur les credentials principaux si le mode carte n'a pas ses propres credentials
      clientId = settings.card.clientId || settings.clientId;
      clientSecret = settings.card.clientSecret || settings.clientSecret;
      environment = settings.card.environment || settings.environment;
    } else {
      clientId = settings.clientId;
      clientSecret = settings.clientSecret;
      environment = settings.environment;
    }

    if (!clientId || !clientSecret) {
      return NextResponse.json({
        success: false,
        error: 'Identifiants manquants. Veuillez renseigner le Client ID et le Secret.',
      });
    }

    const apiUrl = environment === 'live' ? LIVE_API : SANDBOX_API;
    const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const tokenRes = await fetch(`${apiUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basic}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
      // Timeout via AbortController
      signal: AbortSignal.timeout(10_000),
    });

    if (!tokenRes.ok) {
      // Si Live échoue, on peut tenter le fallback Sandbox pour aider au diagnostic
      if (environment === 'live') {
        const sandboxRes = await fetch(`${SANDBOX_API}/v1/oauth2/token`, {
          method: 'POST',
          headers: {
            Authorization: `Basic ${basic}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: 'grant_type=client_credentials',
          signal: AbortSignal.timeout(10_000),
        });
        if (sandboxRes.ok) {
          return NextResponse.json({
            success: false,
            error: `Connexion Live échouée (${tokenRes.status}). Ces identifiants semblent valides en Sandbox — vérifiez l'environnement configuré.`,
            detectedEnvironment: 'sandbox',
          });
        }
      }
      const errText = await tokenRes.text().catch(() => '');
      return NextResponse.json({
        success: false,
        error: `Connexion échouée (${tokenRes.status}). Vérifiez votre Client ID et votre Secret.`,
        details: errText.slice(0, 200),
      });
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // Récupère les informations du compte PayPal pour confirmation
    let accountEmail: string | null = null;
    try {
      const userInfoRes = await fetch(`${apiUrl}/v1/identity/openidconnect/userinfo?schema=openid`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        signal: AbortSignal.timeout(5_000),
      });
      if (userInfoRes.ok) {
        const userInfo = await userInfoRes.json();
        accountEmail = userInfo.email || userInfo.emails?.[0]?.value || null;
      }
    } catch {
      // Non bloquant — l'essentiel est que le token soit valide
    }

    return NextResponse.json({
      success: true,
      environment,
      accountEmail,
      mode,
    });
  } catch (error: any) {
    if (error?.name === 'TimeoutError' || error?.code === 'ABORT_ERR') {
      return NextResponse.json({
        success: false,
        error: 'Délai dépassé lors de la connexion à PayPal. Vérifiez votre connexion.',
      });
    }
    return NextResponse.json({
      success: false,
      error: error.message || 'Erreur inattendue lors du test de connexion.',
    });
  }
}
