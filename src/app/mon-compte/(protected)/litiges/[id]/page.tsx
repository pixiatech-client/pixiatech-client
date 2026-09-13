import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';
import { getServerT } from '@/lib/server-i18n';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, LifeBuoy, Lock } from 'lucide-react';
import { ClientDisputeConversation } from './client-conversation';
import { ClientPageHeader } from '@/components/client-ui/client-page-header';
import { ClientStatusBadge } from '@/components/client-ui/client-status-badge';

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

  const toneFor: Record<string, 'red' | 'amber' | 'emerald' | 'neutral'> = {
    open: 'red',
    in_progress: 'amber',
    resolved: 'emerald',
    closed: 'neutral',
  };

  return (
    <div className="w-full max-w-[1536px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      <Link
        href="/mon-compte/litiges"
        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-neutral-200 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 hover:border-neutral-300 shadow-xs transition-all"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        {t('client.dispute.backToAll')}
      </Link>

      <ClientPageHeader
        title={t('client.dispute.title').replace('{reason}', dispute.reason)}
        subtitle={
          isClosed
            ? t('client.dispute.closedBanner')
            : undefined
        }
        icon={LifeBuoy}
        iconClassName="text-amber-400"
        online={isClosed ? false : undefined}
        action={
          <ClientStatusBadge
            label={statusLabel[dispute.status] || dispute.status}
            tone={toneFor[dispute.status] || 'neutral'}
            dot
          />
        }
      />

      {isClosed && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-xs font-medium text-neutral-600">
          <Lock className="w-3.5 h-3.5" />
          {t('client.dispute.closedBanner')}
        </div>
      )}

      <ClientDisputeConversation
        disputeId={id}
        messages={messages}
        isClosed={isClosed}
      />
    </div>
  );
}
