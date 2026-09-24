import { NextRequest, NextResponse } from 'next/server';
import { patchMessageStatus, deleteMessage } from '@/lib/site-web/firestore';
import { requireAdmin } from '@/lib/site-web/auth';
import type { ContactMessage } from '@/lib/site-web/types';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const { id } = await params;
    const { status } = await request.json();
    if (!status || !['unread', 'read', 'replied', 'archived'].includes(status)) {
      return NextResponse.json({ success: false, message: 'Statut invalide.' }, { status: 400 });
    }
    const updated = await patchMessageStatus(id, status as ContactMessage['status']);
    if (!updated) {
      return NextResponse.json({ success: false, message: 'Message introuvable.' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: updated });
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const { id } = await params;
    const deleted = await deleteMessage(id);
    if (!deleted) {
      return NextResponse.json({ success: false, message: 'Message non trouvé.' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'Message supprimé avec succès.' });
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}