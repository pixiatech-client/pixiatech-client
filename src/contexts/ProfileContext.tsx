'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export type ProfileType = 'entreprise' | 'particulier' | null;

interface ProfileContextValue {
  profileType: ProfileType;
  setProfileType: (type: ProfileType) => void;
  showHT: boolean;
  showTTC: boolean;
  priceLabel: string;
  isB2B: boolean;
  hydrated: boolean;
}

const ProfileContext = createContext<ProfileContextValue>({
  profileType: null,
  setProfileType: () => {},
  showHT: false,
  showTTC: false,
  priceLabel: '',
  isB2B: false,
  hydrated: false,
});

const STORAGE_KEY = 'pixia_profile_type';

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);

  const [profileType, setProfileTypeState] = useState<ProfileType>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY) as ProfileType;
        if (stored === 'entreprise' || stored === 'particulier') return stored;
      } catch {}
    }
    return null;
  });

  useEffect(() => {
    setHydrated(true);
  }, []);

  const setProfileType = useCallback((type: ProfileType) => {
    setProfileTypeState(type);
    if (type) {
      localStorage.setItem(STORAGE_KEY, type);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const isB2B = profileType === 'entreprise';
  const showHT = profileType === 'entreprise';
  const showTTC = profileType === 'particulier';
  const priceLabel = isB2B ? 'Prix hors taxes' : 'TVA incluse';

  return (
    <ProfileContext.Provider value={{ profileType, setProfileType, showHT, showTTC, priceLabel, isB2B, hydrated }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  return useContext(ProfileContext);
}
