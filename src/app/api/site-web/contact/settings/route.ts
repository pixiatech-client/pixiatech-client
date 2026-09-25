import { NextRequest, NextResponse } from 'next/server';
import { getSmtpConfig, setSmtpConfig } from '@/lib/site-web/firestore';
import { requireAdmin } from '@/lib/site-web/auth';
import type { SmtpConfig } from '@/lib/site-web/types';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const config = await getSmtpConfig();
    return NextResponse.json({ success: true, data: serialize(config) });
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const body = (await request.json()) as Partial<SmtpConfig>;
    const config = await setSmtpConfig(body);
    return NextResponse.json({
      success: true,
      message: 'Paramètres SMTP enregistrés avec succès.',
      data: serialize(config),
    });
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}

function serialize(config: SmtpConfig) {
  return {
    host: config.host,
    port: config.port,
    secure: config.secure,
    user: config.user,
    hasPassword: Boolean(config.pass && config.pass.length > 0),
    fromEmail: config.fromEmail,
    recipientEmail: config.recipientEmail,
    enabled: config.enabled,
  };
}
