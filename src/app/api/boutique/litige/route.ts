import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/auth';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { getClientSessionCustomerId } from '@/lib/client-session';
import {
  formatOrderNumber,
  getDisputeStatusLabel,
  getReasonLabel,
  isDisputeOpen,
} from '@/lib/client-status';

const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});
const timeFormatter = new Intl.DateTimeFormat('fr-FR', {
  hour: '2-digit',
  minute: '2-digit',
});

function toDisplayDate(value: unknown): string {
  if (!value) return '';
  const d = new Date(String(value));
  return isNaN(d.getTime()) ? String(value) : dateFormatter.format(d);
}

function toDisplayTime(value: unknown): string {
  if (!value) return '';
  const d = new Date(String(value));
  return isNaN(d.getTime()) ? '' : timeFormatter.format(d);
}

function formatMessage(id: string, raw: { sender?: string; text?: string; createdAt?: unknown }, customerLabel: string) {
  const sender = raw.sender === 'admin' ? 'admin' : 'customer';
  return {
    id,
    sender,
    senderName: sender === 'admin' ? 'Service Client PIXIATECH' : customerLabel,
    message: String(raw.text || ''),
    date: toDisplayDate(raw.createdAt),
    time: toDisplayTime(raw.createdAt).replace(':', 'h'),
  };
}

export async function GET(req: NextRequest) {
  try {
    const customerId = await getClientSessionCustomerId(req);
    if (!customerId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { adminDb } = getFirebaseAdmin();

    const disputeSnap = await adminDb
      .collection('disputes')
      .where('customerId', '==', customerId)
      .orderBy('updatedAt', 'desc')
      .get();

    const orderContext = new Map<string, { number: string; productName?: string; productImage?: string }>();
    const [saleSnap, rentalSnap] = await Promise.all([
      adminDb.collection('sale_orders').where('customerId', '==', customerId).get(),
      adminDb.collection('rental_orders').where('customerId', '==', customerId).get(),
    ]);
    saleSnap.docs.forEach((d) => {
      const data = d.data();
      orderContext.set(`sale_${d.id}`, {
        number: formatOrderNumber('sale', d.id, data.createdAt),
        productName: typeof data.productName === 'string' ? data.productName : undefined,
        productImage: typeof data.productImage === 'string' ? data.productImage : undefined,
      });
    });
    rentalSnap.docs.forEach((d) => {
      const data = d.data();
      orderContext.set(`rental_${d.id}`, {
        number: formatOrderNumber('rental', d.id, data.createdAt),
        productName: typeof data.productName === 'string' ? data.productName : undefined,
        productImage: typeof data.productImage === 'string' ? data.productImage : undefined,
      });
    });

    const customerSnap = await adminDb.collection('customers').doc(customerId).get();
    const customerName = customerSnap.exists
      ? String(customerSnap.data()?.displayName || customerSnap.data()?.email || 'Client')
      : 'Client';

    const disputes = disputeSnap.docs.map((doc) => {
      const data = doc.data();
      const status = String(data.status || 'open');
      const orderId = typeof data.orderId === 'string' ? data.orderId : undefined;
      const orderType = typeof data.orderType === 'string' ? data.orderType : undefined;
      const ctx = orderId && orderType ? orderContext.get(`${orderType}_${orderId}`) : undefined;

      const messages = Array.isArray(data.messages)
        ? data.messages.map((m, i) => formatMessage(String(i), (m as Record<string, unknown>) || {}, customerName))
        : [];

      return {
        id: doc.id,
        customerId,
        reason: String(data.reason || 'other'),
        reasonLabel: getReasonLabel(String(data.reason || 'other')),
        description: String(data.description || ''),
        status,
        statusLabel: getDisputeStatusLabel(status),
        unreadByClient: data.unreadByClient === true,
        isOpen: isDisputeOpen(status),
        date: toDisplayDate(data.createdAt),
        lastResponseDate: toDisplayDate(data.updatedAt),
        orderId,
        orderType,
        orderNumber: ctx?.number || (typeof data.orderNumber === 'string' ? data.orderNumber : undefined),
        productName: ctx?.productName || (typeof data.productName === 'string' ? data.productName : undefined),
        productImage: ctx?.productImage || (typeof data.productImage === 'string' ? data.productImage : undefined),
        carrierNote: '',
        messages,
      };
    });

    return NextResponse.json({ disputes });
  } catch (err: any) {
    console.error('[Litige GET] Error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

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

    const body = await req.json();
    const { reason, description } = body;
    if (!reason || !description) {
      return NextResponse.json({ error: 'Motif et description requis' }, { status: 400 });
    }

    const orderId = typeof body.orderId === 'string' && body.orderId ? body.orderId : undefined;
    const orderType =
      typeof body.orderType === 'string' && (body.orderType === 'sale' || body.orderType === 'rental')
        ? body.orderType
        : undefined;

    const { adminDb, FieldValue } = getFirebaseAdmin();

    // Contexte commande (facultatif) : vérifie la propriété si un orderId est fourni
    // et copie les métadonnées produit pour l'affichage côté client.
    let orderNumber: string | undefined;
    let productName: string | undefined;
    let productImage: string | undefined;
    if (orderId && orderType) {
      const orderSnap = await adminDb.collection(orderType === 'sale' ? 'sale_orders' : 'rental_orders').doc(orderId).get();
      if (orderSnap.exists) {
        const orderData = orderSnap.data() || {};
        const ownerId = String(orderData.customerId || '');
        if (ownerId && ownerId !== customerId) {
          return NextResponse.json({ error: 'Commande non accessible' }, { status: 403 });
        }
      }
      const orderRef = adminDb.collection(orderType === 'sale' ? 'sale_orders' : 'rental_orders').doc(orderId);
      const orderDoc = (await orderRef.get()).data();
      productName = typeof orderDoc?.productName === 'string' ? orderDoc.productName : undefined;
      productImage = typeof orderDoc?.productImage === 'string' ? orderDoc.productImage : undefined;
    }

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
      orderId: orderId || null,
      orderType: orderType || null,
      productName: productName || null,
      productImage: productImage || null,
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

    return NextResponse.json({
      success: true,
      disputeId: disputeRef.id,
      orderNumber,
      productName,
      productImage,
    });
  } catch (err: any) {
    console.error('[Litige] Error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}