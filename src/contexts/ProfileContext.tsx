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
  forceB2B: boolean;
}

const ProfileContext = createContext<ProfileContextValue>({
  profileType: null,
  setProfileType: () => {},
  showHT: false,
  showTTC: false,
  priceLabel: '',
  isB2B: false,
  hydrated: false,
  forceB2B: false,
});

const STORAGE_KEY = 'pixia_profile_type';

export function ProfileProvider({ children, initialBoutiqueB2B = false }: { children: ReactNode; initialBoutiqueB2B?: boolean }) {
  const [hydrated, setHydrated] = useState(false);
  const [forceB2B, setForceB2B] = useState(initialBoutiqueB2B);

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
    if (initialBoutiqueB2B) {
      setProfileTypeState('entreprise');
      localStorage.setItem(STORAGE_KEY, 'entreprise');
      return;
    }
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'entreprise' || saved === 'particulier') {
      setProfileTypeState(saved);
    }
  }, []);

  const setProfileType = useCallback((type: ProfileType) => {
    if (forceB2B && type !== 'entreprise') return;
    setProfileTypeState(type);
    if (type) {
      localStorage.setItem(STORAGE_KEY, type);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [forceB2B]);

  const resolvedType = forceB2B ? 'entreprise' : profileType;
  const isB2B = resolvedType === 'entreprise';
  const showHT = resolvedType !== 'particulier'; // true par défaut (null) et pour entreprise
  const showTTC = resolvedType === 'particulier';
  const priceLabel = isB2B ? 'Prix hors taxes' : 'TVA incluse';

  return (
    <ProfileContext.Provider value={{ profileType: resolvedType, setProfileType, showHT, showTTC, priceLabel, isB2B, hydrated, forceB2B }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  return useContext(ProfileContext);
}
