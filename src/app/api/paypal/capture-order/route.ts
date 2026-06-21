import { NextRequest, NextResponse } from 'next/server';
import { capturePayPalOrder } from '@/lib/paypal';

export async function POST(req: NextRequest) {
  try {
    const { orderId } = await req.json();
    const capture = await capturePayPalOrder(orderId);
    return NextResponse.json(capture);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
