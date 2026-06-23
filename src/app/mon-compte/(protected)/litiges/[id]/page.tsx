import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';
import { getServerT } from '@/lib/server-i18n';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ClientDisputeConversation } from './client-conversation';

export default async function LitigeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('client_session')?.value;
  if (!sessionCookie) redirect('/mon-compte/connexion');

  let customerId = '';
  try {
    const payload = await decrypt(sessionCookie);
    customerId = payload.customerId;
  } catch {
    redirect('/mon-compte/connexion');
  }

  const t = await getServerT();

  const { id } = await params;
  const { adminDb } = getFirebaseAdmin();
  const snap = await adminDb.collection('disputes').doc(id).get();
  if (!snap.exists) redirect('/mon-compte/litiges');

  const dispute = { id: snap.id, ...snap.data() } as any;
  if (dispute.customerId !== customerId) redirect('/mon-compte/litiges');

  const messages = (dispute.messages || []) as Array<{ sender: string; text: string; createdAt: string }>;
  const isClosed = dispute.status === 'closed';

  const statusLabel: Record<string, string> = {
    open: t('client.dispute.statusOpen'),
    in_progress: t('client.dispute.statusInProgress'),
    resolved: t('client.dispute.statusResolved'),
    closed: t('client.dispute.statusClosed'),
  };

  const statusColor: Record<string, string> = {
    open: 'bg-red-100 text-red-700 border-red-200',
    in_progress: 'bg-amber-100 text-amber-700 border-amber-200',
    resolved: 'bg-green-100 text-green-700 border-green-200',
    closed: 'bg-gray-100 text-gray-600 border-gray-200',
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link
          href="/mon-compte/litiges"
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300 shadow-sm transition-all mb-4"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t('client.dispute.backToAll')}
        </Link>
        <h1 className="text-xl font-semibold text-gray-900">{t('client.dispute.title').replace('{reason}', dispute.reason)}</h1>
        <span className={`inline-block mt-2 text-xs font-bold px-3 py-1 rounded-full border ${statusColor[dispute.status]}`}>
          {statusLabel[dispute.status]}
        </span>
      </div>

      <ClientDisputeConversation
        disputeId={id}
        messages={messages}
        isClosed={isClosed}
      />
    </div>
  );
}
