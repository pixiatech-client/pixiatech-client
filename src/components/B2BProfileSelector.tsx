'use client';

import { useState, useEffect } from 'react';
import { X, Building2, User } from 'lucide-react';
import { useProfile } from '@/contexts/ProfileContext';

export function B2BProfileSelector() {
  const { profileType, setProfileType } = useProfile();
  const [dismissed, setDismissed] = useState(false);

  if (profileType || dismissed) return null;

  return (
    <div className="px-4 md:px-6 max-w-7xl mx-auto w-full">
      <div className="relative overflow-hidden rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50/50 p-4 md:p-6">
        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-400/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-3 right-3 p-1 rounded-full hover:bg-black/5 transition-colors text-gray-400 hover:text-gray-600"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="relative">
          <p className="text-sm md:text-base font-semibold text-gray-800 mb-1">
            Cet espace est réservé aux professionnels (B2B)
          </p>
          <p className="text-xs md:text-sm text-gray-500 mb-4">
            Merci d'indiquer votre profil afin d'afficher les prix correspondants.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setProfileType('entreprise')}
              className="flex items-center gap-3 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all active:scale-[0.98] shadow-lg shadow-blue-600/20"
            >
              <Building2 className="w-5 h-5" />
              Je suis une entreprise
            </button>
            <button
              onClick={() => setProfileType('particulier')}
              className="flex items-center gap-3 px-5 py-3 bg-white hover:bg-gray-50 text-gray-700 rounded-xl font-bold text-sm transition-all active:scale-[0.98] border border-gray-200 shadow-sm"
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
  const { profileType, priceLabel } = useProfile();

  if (!profileType) return null;

  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
      {priceLabel}
    </span>
  );
}
