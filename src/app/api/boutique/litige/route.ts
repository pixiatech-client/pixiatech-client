import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/auth';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get('client_session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Non connecté' }, { status: 401 });
    }

    let customerId = '';
    let customerEmail = '';
    try {
      const payload = await decrypt(sessionCookie);
      customerId = payload.customerId;
      customerEmail = payload.email;
    } catch {
      return NextResponse.json({ error: 'Session invalide' }, { status: 401 });
    }

    const { reason, description } = await req.json();
    if (!reason || !description) {
      return NextResponse.json({ error: 'Motif et description requis' }, { status: 400 });
    }

    const { adminDb, FieldValue } = getFirebaseAdmin();

    // Create the dispute
    const disputeRef = adminDb.collection('disputes').doc();
    await disputeRef.set({
      customerId,
      customerEmail,
      reason,
      description,
      status: 'open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      unreadByClient: false,
      messages: [{
        sender: 'customer',
        text: `Motif : ${reason}\n\n${description}`,
        createdAt: new Date().toISOString(),
      }],
    });

    // Notify all admins
    const adminsSnap = await adminDb.collection('users').get();
    if (!adminsSnap.empty) {
      const notifBatch = adminDb.batch();
      const customerSnap = await adminDb.collection('customers').doc(customerId).get();
      const customerName = customerSnap.exists ? (customerSnap.data()?.displayName || customerEmail) : customerEmail;

      adminsSnap.forEach(adminDoc => {
        const notifRef = adminDb.collection('notifications').doc();
        notifBatch.set(notifRef, {
          userId: adminDoc.id,
          type: 'order_created',
          title: 'Nouveau litige client',
          description: `${customerName} a ouvert un litige : ${reason}`,
          href: '/admin/litiges',
          read: false,
          createdAt: FieldValue.serverTimestamp(),
        });
      });
      await notifBatch.commit();
    }

    return NextResponse.json({ success: true, disputeId: disputeRef.id });
  } catch (err: any) {
    console.error('[Litige] Error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
