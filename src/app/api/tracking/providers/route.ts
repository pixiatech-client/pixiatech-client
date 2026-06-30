import { NextResponse } from 'next/server';
import { getProviderSettings, saveProviderSettings } from '@/lib/tracking/service';

export async function GET() {
  try {
    const providers = await getProviderSettings();
    return NextResponse.json(providers);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, provider, label, apiKey, enabled, webhookUrl, lastTestAt, lastTestOk } = body;

    if (!provider) {
      return NextResponse.json({ error: 'Provider requis' }, { status: 400 });
    }

    await saveProviderSettings(id || null, {
      provider,
      label,
      apiKey,
      enabled,
      webhookUrl,
      lastTestAt,
      lastTestOk,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
