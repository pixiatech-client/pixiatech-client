import { NextResponse } from 'next/server';
import { testConnection } from '@/lib/tracking/api';

export async function POST(req: Request) {
  try {
    const { provider, apiKey } = await req.json();

    if (!provider || !apiKey) {
      return NextResponse.json({ error: 'Provider et API key requis' }, { status: 400 });
    }

    if (provider === '17track') {
      const ok = await testConnection(apiKey);
      if (!ok) {
        return NextResponse.json({ error: 'Connexion échouée' }, { status: 401 });
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: `Test non supporté pour ${provider}` }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
