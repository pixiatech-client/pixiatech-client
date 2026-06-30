'use client';

import { useState } from 'react';
import { TrackingDetailDrawer } from '@/components/tracking/tracking-detail-drawer';

export function TrackingLink({ trackingNumber, carrier, children }: {
  trackingNumber?: string | null;
  carrier?: number;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  if (!trackingNumber) return children || <span className="text-[13px] text-gray-400">—</span>;
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-[13px] font-semibold text-[#004ac6] hover:underline cursor-pointer text-left"
      >
        {children || trackingNumber}
      </button>
      <TrackingDetailDrawer
        open={open}
        onClose={() => setOpen(false)}
        trackingNumber={trackingNumber}
        carrier={carrier}
      />
    </>
  );
}
