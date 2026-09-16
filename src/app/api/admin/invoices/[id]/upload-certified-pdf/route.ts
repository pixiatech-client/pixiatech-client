import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { requireRole } from '@/lib/auth-guards';
import { INVOICES_COLLECTION } from '@/lib/invoices';

const MAX_PDF_BYTES = 15 * 1024 * 1024; // 15 Mo max

/**
 * POST /api/admin/invoices/[id]/upload-certified-pdf
 *
 * Permet à l'administrateur d'uploader un PDF certifié pour une facture.
 * Écrase le PDF généré par défaut (`pdfContent`), marque `hasCustomCertPdf: true`
 * et enregistre le nom du fichier. Le client recevra alors ce fichier certifié.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole('admin', 'commercial');

    const { id } = await params;
    if (!id || !/^(sale|rental)_/.test(id)) {
      return NextResponse.json({ error: 'Identifiant de facture invalide' }, { status: 400 });
    }

    const { adminDb } = getFirebaseAdmin();
    if (!adminDb) {
      return NextResponse.json({ error: 'Base de données indisponible' }, { status: 500 });
    }

    const invoiceRef = adminDb.collection(INVOICES_COLLECTION).doc(id);
    const snap = await invoiceRef.get();
    if (!snap.exists) {
      return NextResponse.json({ error: 'Facture introuvable' }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 });
    }

    const fileName = file.name || 'facture-certifiee.pdf';
    const isPdf = file.type === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      return NextResponse.json({ error: 'Format de fichier non supporté. Veuillez sélectionner un fichier PDF.' }, { status: 400 });
    }

    if (file.size > MAX_PDF_BYTES) {
      return NextResponse.json({ error: 'Le fichier dépasse la taille maximale autorisée (15 Mo)' }, { status: 413 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');

    const currentData = snap.data() || {};
    // RÈGLE MÉTIER : L'upload du PDF certifié NE DOIT PAS passer la facture en "completed".
    // La facture reste ou passe à "in_progress". Seul le bouton 3 déclenchera la publication client.
    const currentStatus = currentData.status || 'pending';
    const newStatus = currentStatus === 'completed' ? 'completed' : 'in_progress';

    await invoiceRef.update({
      pdfContent: base64,
      pdfSize: buffer.length,
      hasCustomCertPdf: true,
      certPdfName: fileName,
      hasPdf: true,
      status: newStatus,
      certifiedUploadedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    try {
      revalidatePath('/admin/factures');
    } catch {
      // Non-bloquant si le contexte revalidate n'est pas disponible
    }

    return NextResponse.json({
      success: true,
      certPdfName: fileName,
      pdfSize: buffer.length,
      status: newStatus,
    });
  } catch (err: any) {
    console.error('[UploadCertifiedPdf] Error:', err);
    return NextResponse.json({ error: err.message || 'Erreur lors du téléversement du PDF certifié' }, { status: 500 });
  }
}
