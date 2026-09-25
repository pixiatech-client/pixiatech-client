import { ClientPortal } from './_client/ClientPortal';
import type { ClientTab } from './_client/ClientPortal';

export default async function MonComptePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; dispute?: string }>;
}) {
  const { tab, dispute } = await searchParams;
  const initialTab = (tab as ClientTab | undefined) || 'dashboard';
  return <ClientPortal initialTab={initialTab} initialDisputeId={dispute} />;
}
