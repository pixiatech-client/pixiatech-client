import { NextRequest, NextResponse } from 'next/server';
import { getClientSessionCustomerId } from '@/lib/client-session';
import { getProfessionalInfo } from '@/lib/professional-info';

export async function GET(req: NextRequest) {
  try {
    const customerId = await getClientSessionCustomerId(req);
    if (!customerId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const info = await getProfessionalInfo(customerId);
    return NextResponse.json({ professionalInfo: info });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}