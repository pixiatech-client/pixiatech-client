'use client';

import { usePathname } from 'next/navigation';
import { SystemMessageBanner } from './system-message-banner';

export function SiteBanners() {
  const pathname = usePathname();

  const isHomepage = pathname === '/';
  const isBoutique = pathname.startsWith('/boutique');
  const isMonCompte = pathname.startsWith('/mon-compte');
  const isAdmin = pathname.startsWith('/admin');

  if (isAdmin) return null;

  return (
    <div className="space-y-2" data-banners="root">
      {isHomepage && <SystemMessageBanner location="homepage" />}
      {isBoutique && <SystemMessageBanner location="boutique" />}
      {isMonCompte && <SystemMessageBanner location="client-area" />}
    </div>
  );
}
