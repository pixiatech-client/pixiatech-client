'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { UserProfile } from '@/lib/types';
import { auth } from '@/firebase/config';
import { signInWithCustomToken } from 'firebase/auth';

interface Session {
  originalUser: UserProfile | null;
  currentUser: UserProfile;
  isImpersonating: boolean;
}

interface SessionContextValue {
  session: Session | null;
  isLoading: boolean;
  impersonate: (userId: string) => Promise<boolean>;
  revertToOriginal: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

export function SessionProvider({ children, adminUser }: { children: React.ReactNode; adminUser: UserProfile | null }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkImpersonation = useCallback(async () => {
    if (!auth.currentUser) {
      setSession(null);
      setIsLoading(false);
      return;
    }

    try {
      const tokenResult = await auth.currentUser.getIdTokenResult();
      const originalAdminUid = tokenResult.claims.original_admin_uid as string | undefined;

      if (originalAdminUid && adminUser) {
        const impersonatedUid = auth.currentUser.uid;
        if (impersonatedUid !== adminUser.uid) {
          const { doc, getDoc } = await import('firebase/firestore');
          const { firestore } = await import('@/firebase/config');
          if (firestore) {
            const userDocRef = doc(firestore, 'users', impersonatedUid);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
              const currentUserProfile = userDocSnap.data() as UserProfile;
              setSession({
                originalUser: adminUser,
                currentUser: currentUserProfile,
                isImpersonating: true,
              });
              setIsLoading(false);
              return;
            }
          }
        }
      }

      if (adminUser) {
        setSession({
          originalUser: null,
          currentUser: adminUser,
          isImpersonating: false,
        });
      } else {
        setSession(null);
      }
    } catch (error) {
      console.error('Error checking impersonation:', error);
      if (adminUser) {
        setSession({
          originalUser: null,
          currentUser: adminUser,
          isImpersonating: false,
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [adminUser]);

  useEffect(() => {
    checkImpersonation();
  }, [checkImpersonation]);

  const impersonate = useCallback(async (userId: string): Promise<boolean> => {
    try {
      const { impersonateUser } = await import('@/app/admin/actions');
      const result = await impersonateUser(userId);
      if (result.success && result.token) {
        await signInWithCustomToken(auth, result.token);
        await checkImpersonation();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Impersonation error:', error);
      return false;
    }
  }, [checkImpersonation]);

  const revertToOriginal = useCallback(async () => {
    window.location.href = '/admin/login';
  }, []);

  const refreshSession = useCallback(async () => {
    await checkImpersonation();
  }, [checkImpersonation]);

  return (
    <SessionContext.Provider value={{ session, isLoading, impersonate, revertToOriginal, refreshSession }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}