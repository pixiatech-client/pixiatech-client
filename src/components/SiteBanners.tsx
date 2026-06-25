'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { B2BProfileSelector } from './B2BProfileSelector';
import { SystemMessageBanner } from './system-message-banner';
import { useProfile } from '@/contexts/ProfileContext';

export function SiteBanners() {
  const pathname = usePathname();
  const { profileType, hydrated } = useProfile();
  const [b2bDismissed, setB2bDismissed] = useState(false);

  const isHomepage = pathname === '/';
  const isBoutique = pathname.startsWith('/boutique');
  const isMonCompte = pathname.startsWith('/mon-compte');
  const isAdmin = pathname.startsWith('/admin');

  if (isAdmin) return null;

  const b2bActive = hydrated && !profileType && !b2bDismissed;

  return (
    <div className="space-y-2">
      {isHomepage && (
        <>
          <div className="min-h-[120px] md:min-h-[88px]">
            <B2BProfileSelector onDismiss={() => setB2bDismissed(true)} />
          </div>
          {!b2bActive && <SystemMessageBanner location="homepage" />}
        </>
      )}
      {isBoutique && (
        <>
          <div className="min-h-[120px] md:min-h-[88px]">
            <B2BProfileSelector onDismiss={() => setB2bDismissed(true)} />
          </div>
          {!b2bActive && <SystemMessageBanner location="boutique" />}
        </>
      )}
      {isMonCompte && (
        <>
          <div className="min-h-[120px] md:min-h-[88px]">
            <B2BProfileSelector onDismiss={() => setB2bDismissed(true)} />
          </div>
          {!b2bActive && <SystemMessageBanner location="client-area" />}
        </>
      )}
    </div>
  );
}
