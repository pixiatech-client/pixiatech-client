import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { getClientSessionCustomerId } from '@/lib/client-session';
import { getReasonLabel } from '@/lib/client-status';

export async function POST(req: NextRequest) {
  try {
    const customerId = await getClientSessionCustomerId(req);
    if (!customerId) {
      return NextResponse.json({ error: 'Non connecté' }, { status: 401 });
    }

    const { disputeId, text } = await req.json();
    if (!disputeId || !text) {
      return NextResponse.json({ error: 'disputeId et text requis' }, { status: 400 });
    }

    const { adminDb, FieldValue } = getFirebaseAdmin();

    const disputeRef = adminDb.collection('disputes').doc(disputeId);
    const dispute = await disputeRef.get();
    if (!dispute.exists || dispute.data()?.customerId !== customerId) {
      return NextResponse.json({ error: 'Litige introuvable' }, { status: 404 });
    }

    await disputeRef.update({
      messages: FieldValue.arrayUnion({
        sender: 'customer',
        text,
        createdAt: new Date().toISOString(),
      }),
      unreadByClient: false,
      updatedAt: new Date().toISOString(),
    });

    // Notify all admins of the reply
    const adminsSnap = await adminDb.collection('users').get();
    console.log(`[Litige Reply] users collection has ${adminsSnap.size} documents`);
    if (!adminsSnap.empty) {
      const notifBatch = adminDb.batch();
      const disputeData = dispute.data()!;
      const customerEmail = disputeData.customerEmail || customerId;
      let customerName = customerEmail;
      try {
        const custDoc = await adminDb.collection('customers').doc(customerId).get();
        if (custDoc.exists && custDoc.data()?.displayName) {
          customerName = custDoc.data()!.displayName;
        }
      } catch {}

      const productInfo = disputeData.productName
        ? ` [${disputeData.productName}]`
        : (disputeData.orderNumber ? ` [Cmd ${disputeData.orderNumber}]` : '');

      const truncatedMsg = text.length > 100 ? `${text.slice(0, 97)}...` : text;

      let notifCount = 0;
      adminsSnap.forEach(adminDoc => {
        const notifRef = adminDb.collection('notifications').doc();
        notifBatch.set(notifRef, {
          userId: adminDoc.id,
          type: 'message',
          title: 'Nouvelle réponse client',
          description: `${customerName}${productInfo} : "${truncatedMsg}"`,
          href: '/admin/litiges',
          read: false,
          createdAt: FieldValue.serverTimestamp(),
        });
        notifCount++;
      });
      console.log(`[Litige Reply] committing ${notifCount} notification(s)`);
      await notifBatch.commit();
      console.log('[Litige Reply] notifications committed successfully');
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[Litige Reply] Error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
