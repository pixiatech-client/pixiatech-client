import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';
import { getServerT } from '@/lib/server-i18n';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { redirect } from 'next/navigation';
import { ClientDisputesView } from '@/components/client-disputes-view';

export default async function MesLitigesPage() {
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

  const statusLabels: Record<string, string> = {
    open: t('client.disputes.statusOpen'),
    in_progress: t('client.disputes.statusInProgress'),
    resolved: t('client.disputes.statusResolved'),
    closed: t('client.disputes.statusClosed'),
  };

  const { adminDb } = getFirebaseAdmin();
  const disputesSnap = await adminDb.collection('disputes')
    .where('customerId', '==', customerId)
    .get();

  const disputes = disputesSnap.docs.map(d => {
    const data = d.data();
    return {
      id: d.id,
      reason: data.reason,
      description: data.description,
      status: data.status,
      createdAt: data.createdAt,
      unreadByClient: data.unreadByClient || false,
      messageCount: (data.messages || []).length,
    };
  }).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));

  const openCount = disputes.filter(d => d.status === 'open' || d.status === 'in_progress').length;

  return (
    <ClientDisputesView
      disputes={disputes}
      statusLabels={statusLabels}
      openCount={openCount}
      title={t('client.disputes.title')}
      subtitle={openCount > 0
        ? t('client.disputes.openCount').replace('{count}', String(openCount))
        : t('client.disputes.noOpen')}
      backLabel={t('client.disputes.backToDashboard')}
      emptyLabel={t('client.disputes.empty')}
      backToDashboardLabel={t('client.disputes.backToDashboardLink')}
      newReplyLabel={t('client.disputes.newReply')}
      messageCountLabel={t('client.disputes.messageCount')}
    />
  );
}
