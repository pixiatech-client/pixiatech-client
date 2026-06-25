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
        <div>
          {b2bActive ? (
            <B2BProfileSelector onDismiss={() => setB2bDismissed(true)} />
          ) : (
            <SystemMessageBanner location="homepage" />
          )}
        </div>
      )}
      {isBoutique && (
        <div>
          {b2bActive ? (
            <B2BProfileSelector onDismiss={() => setB2bDismissed(true)} />
          ) : (
            <SystemMessageBanner location="boutique" />
          )}
        </div>
      )}
      {isMonCompte && (
        <div>
          {b2bActive ? (
            <B2BProfileSelector onDismiss={() => setB2bDismissed(true)} />
          ) : (
            <SystemMessageBanner location="client-area" />
          )}
        </div>
      )}
    </div>
  );
}
