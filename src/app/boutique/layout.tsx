import { redirect } from 'next/navigation';
import { getSettings } from '@/app/actions/public-actions';
import { PixiaFooterCredit } from '@/components/PixiaFooterCredit';

export const dynamic = 'force-dynamic';

export default async function BoutiqueLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  if (settings.isBoutiqueEnabled === false) {
    redirect('/');
  }
  return (
    <div className="min-h-screen flex flex-col justify-between">
      <div className="flex-1">
        {children}
      </div>
      <PixiaFooterCredit />
    </div>
  );
}
