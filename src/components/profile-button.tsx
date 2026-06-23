'use client';

import { Button } from '@/components/ui/button';

export function ProfileButton({ children }: { children: React.ReactNode }) {
  return (
    <Button
      type="button"
      variant="link"
      onClick={() => window.location.href = '/mon-compte/parametres/profil'}
      className="px-4 py-2 bg-gray-900 text-white text-[13px] font-medium rounded-lg hover:opacity-90 transition-all flex items-center gap-1.5"
    >
      {children}
    </Button>
  );
}
