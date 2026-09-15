import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { requireRole } from '@/lib/auth-guards';
import { INVOICES_COLLECTION } from '@/lib/invoices';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole('admin', 'commercial');

    const { id } = await params;
    if (!id || !/^(sale|rental)_/.test(id)) {
      return NextResponse.json({ error: 'Identifiant de facture invalide' }, { status: 400 });
    }

    const { adminDb } = getFirebaseAdmin();
    const snap = await adminDb.collection(INVOICES_COLLECTION).doc(id).get();
    if (!snap.exists) {
      return NextResponse.json({ error: 'Facture introuvable' }, { status: 404 });
    }

    const doc = snap.data() || {};
    const pdfContent = doc.pdfContent;
    if (typeof pdfContent !== 'string' || !pdfContent) {
      return NextResponse.json({ error: 'PDF non disponible' }, { status: 500 });
    }

    const pdfBuffer = Buffer.from(pdfContent, 'base64');
    const invoiceNumber = String(doc.invoiceNumber || id);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="facture-${invoiceNumber}.pdf"`,
        'Content-Length': String(pdfBuffer.length),
        'Cache-Control': 'no-store',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err?.status || 500 });
  }
}