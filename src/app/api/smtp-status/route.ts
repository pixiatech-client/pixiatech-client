import { NextResponse } from 'next/server';

export async function GET() {
  const host = process.env.SMTP_HOST || process.env.MAIL_HOST || '';
  const user = process.env.SMTP_USER || process.env.MAIL_USER || process.env.MAIL_USERNAME || '';
  const pass = process.env.SMTP_PASS || process.env.MAIL_PASS || process.env.MAIL_PASSWORD || '';

  const configured = !!(host && user && pass);

  return NextResponse.json({
    configured,
  });
}
