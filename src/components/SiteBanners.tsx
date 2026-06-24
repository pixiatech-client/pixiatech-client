'use client';

import { usePathname } from 'next/navigation';
import { B2BProfileSelector } from './B2BProfileSelector';
import { SystemMessageBanner } from './system-message-banner';

export function SiteBanners() {
  const pathname = usePathname();

  const isHomepage = pathname === '/';
  const isBoutique = pathname.startsWith('/boutique');
  const isMonCompte = pathname.startsWith('/mon-compte');
  const isAdmin = pathname.startsWith('/admin');

  if (isAdmin) return null;

  return (
    <div className="space-y-2 mb-4">
      {isHomepage && (
        <>
          <B2BProfileSelector />
          <SystemMessageBanner location="homepage" />
        </>
      )}
      {isBoutique && (
        <>
          <B2BProfileSelector />
          <SystemMessageBanner location="boutique" />
        </>
      )}
      {isMonCompte && (
        <>
          <B2BProfileSelector />
          <SystemMessageBanner location="client-area" />
        </>
      )}
    </div>
  );
}
