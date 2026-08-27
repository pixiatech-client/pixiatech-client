import { redirect } from 'next/navigation';
import { getSettings } from '@/app/actions/public-actions';

export const dynamic = 'force-dynamic';

export default async function BoutiqueLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  if (settings.isBoutiqueEnabled === false) {
    redirect('/');
  }
  return <>{children}</>;
}