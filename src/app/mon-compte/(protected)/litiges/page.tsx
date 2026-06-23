import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';
import { getServerT } from '@/lib/server-i18n';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { LifeBuoy, MessageSquare, ArrowRight } from 'lucide-react';

function formatDate(iso: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

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

  const statusConfig: Record<string, { label: string; color: string }> = {
    open: { label: t('client.disputes.statusOpen'), color: 'bg-red-100 text-red-700 border-red-200' },
    in_progress: { label: t('client.disputes.statusInProgress'), color: 'bg-amber-100 text-amber-700 border-amber-200' },
    resolved: { label: t('client.disputes.statusResolved'), color: 'bg-green-100 text-green-700 border-green-200' },
    closed: { label: t('client.disputes.statusClosed'), color: 'bg-gray-100 text-gray-600 border-gray-200' },
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
      updatedAt: data.updatedAt,
      unreadByClient: data.unreadByClient || false,
      messageCount: (data.messages || []).length,
    };
  }).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));

  const openCount = disputes.filter(d => d.status === 'open' || d.status === 'in_progress').length;

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link
          href="/mon-compte/tableau-de-bord"
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300 shadow-sm transition-all mb-4"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t('client.disputes.backToDashboard')}
        </Link>
        <div className="flex items-center gap-3">
          <LifeBuoy className="h-6 w-6 text-red-500" />
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{t('client.disputes.title')}</h1>
            <p className="text-sm text-gray-500">
              {openCount > 0
                ? t('client.disputes.openCount').replace('{count}', String(openCount))
                : t('client.disputes.noOpen')}
            </p>
          </div>
        </div>
      </div>

      {disputes.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <LifeBuoy className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">{t('client.disputes.empty')}</p>
          <Link href="/mon-compte/tableau-de-bord" className="text-sm font-medium text-[#004ac6] hover:underline mt-2 inline-block">
            {t('client.disputes.backToDashboardLink')}
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {disputes.map(d => {
            const config = statusConfig[d.status] || statusConfig.open;
            return (
              <Link
                key={d.id}
                href={`/mon-compte/litiges/${d.id}`}
                className={`block bg-white border border-gray-200 rounded-xl p-4 hover:border-red-200 hover:shadow-sm transition-all ${d.unreadByClient ? 'border-red-300 bg-red-50/30' : ''}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-gray-900">{d.reason}</h3>
                      {d.unreadByClient && (
                        <span className="text-[10px] font-bold text-white bg-red-600 px-1.5 py-0.5 rounded-full">
                          {t('client.disputes.newReply')}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2 mb-2">{d.description}</p>
                    <div className="flex items-center gap-3 text-[11px] text-gray-400">
                      <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full border ${config.color}`}>
                        {config.label}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {t('client.disputes.messageCount').replace('{count}', String(d.messageCount))}
                      </span>
                      <span>{formatDate(d.createdAt)}</span>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-300 shrink-0 mt-1" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
