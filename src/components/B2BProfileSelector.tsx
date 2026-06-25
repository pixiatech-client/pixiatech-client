'use client';

import { useState, useEffect } from 'react';
import { X, Building2, User } from 'lucide-react';
import { useProfile } from '@/contexts/ProfileContext';

export function B2BProfileSelector({ onDismiss }: { onDismiss?: () => void }) {
  const { profileType, setProfileType, hydrated } = useProfile();
  const [dismissed, setDismissed] = useState(false);

  if (!hydrated) return null;
  if (profileType || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <div className="px-4 md:px-6 max-w-7xl mx-auto w-full">
      <div className="relative overflow-hidden rounded-2xl border border-blue-200/60 bg-gradient-to-br from-blue-50 via-blue-50/80 to-indigo-50/40 p-4 md:p-5 shadow-sm">
        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-400/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <button
          onClick={handleDismiss}
          className="absolute top-1 right-1 p-1.5 rounded-lg hover:bg-black/5 transition-colors text-gray-400 hover:text-gray-600"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="relative flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1">
            <p className="text-sm md:text-base font-bold text-gray-900">
              Cet espace est réservé aux professionnels (B2B)
            </p>
            <p className="text-xs md:text-sm text-gray-500 mt-1">
              Merci d&apos;indiquer votre profil afin d&apos;afficher les prix correspondants.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 shrink-0 md:justify-end">
            <button
              onClick={() => setProfileType('entreprise')}
              className="flex items-center gap-3 px-5 py-3 bg-gray-900 hover:bg-gray-800 active:bg-gray-950 text-white rounded-xl font-bold text-sm transition-all active:scale-[0.97] shadow-lg shadow-gray-900/25"
            >
              <Building2 className="w-5 h-5" />
              Je suis une entreprise
            </button>
            <button
              onClick={() => setProfileType('particulier')}
              className="flex items-center gap-3 px-5 py-3 bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-700 rounded-xl font-bold text-sm transition-all active:scale-[0.97] border border-gray-200 shadow-sm hover:shadow-md"
            >
              <User className="w-5 h-5" />
              Je suis un particulier
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PriceLabel() {
  const { profileType, priceLabel, hydrated } = useProfile();

  if (!hydrated) return null;
  if (!profileType) return null;

  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
      {priceLabel}
    </span>
  );
}
