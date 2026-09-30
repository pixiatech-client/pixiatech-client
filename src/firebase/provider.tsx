
'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, doc, getDoc } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged } from 'firebase/auth';
import { FirebaseStorage } from 'firebase/storage';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import type { UserProfile } from '@/lib/types';

interface UserAuthState {
  user: User | null;
  userProfile: UserProfile | null;
  isUserLoading: boolean;
  userError: Error | null;
}

export interface FirebaseContextState extends UserAuthState {
  areServicesAvailable: boolean;
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
  storage: FirebaseStorage | null;
}

export interface FirebaseServicesAndUser extends UserAuthState {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  storage: FirebaseStorage;
}

export interface UserHookResult extends UserAuthState {}

export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

/**
 * FirebaseProvider manages authentication state and provides Firebase services to the application.
 * It renders its children directly, allowing specific layouts (like AdminLayout) to handle their
 * own detailed loading states, which prevents UI flashes.
 */
export const FirebaseProvider: React.FC<{ children: ReactNode; firebaseApp: FirebaseApp | null; firestore: Firestore | null; auth: Auth | null; storage: FirebaseStorage | null; }> = ({
  children,
  firebaseApp,
  firestore,
  auth,
  storage,
}) => {
  const [userAuthState, setUserAuthState] = useState<UserAuthState>({
    user: null,
    userProfile: null,
    isUserLoading: true,
    userError: null,
  });
  
  useEffect(() => {
    if (!auth || !firestore) {
      setUserAuthState({ user: null, userProfile: null, isUserLoading: false, userError: new Error("Auth or Firestore service not provided.") });
      return;
    }

    // annulé si l'effet est nettoyé ou si l'auth change entre-temps
    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    /**
     * Lecture du document `users/{uid}`.
     *
     * Un échec transitoire (Firestore qui se réinitialise, coupure réseau,
     * permission le temps de la réhydratation après un aller-retour vers
     * PixiaTech Web) ne doit PAS laisser `userProfile` à null DEFINITIVEMENT :
     * sans rôle, le menu latéral se vide et le tableau de bord ne charge plus,
     * alors que la session est parfaitement valide. On réessaie donc avec un
     * petit recul, et `userProfile` n'est écrasé que si une lecture aboutit.
     */
    const loadProfile = async (firebaseUser: User, attempt = 0) => {
      try {
        const userDocSnap = await getDoc(doc(firestore, 'users', firebaseUser.uid));
        if (cancelled) return;

        if (userDocSnap.exists()) {
          setUserAuthState({ user: firebaseUser, userProfile: userDocSnap.data() as UserProfile, isUserLoading: false, userError: null });
          return;
        }

        // Le compte existe dans Auth mais pas dans Firestore : état
        // réellement incohérent, on ne boucle pas indéfiniment.
        setUserAuthState({ user: firebaseUser, userProfile: null, isUserLoading: false, userError: null });
      } catch (error) {
        if (cancelled) return;
        const MAX_ATTEMPTS = 4;
        if (attempt < MAX_ATTEMPTS) {
          // On garde l'utilisateur connecté et on retente : un menu vide vaut
          // moins qu'un état transitoire visible.
          setUserAuthState((prev) => ({ ...prev, user: firebaseUser, isUserLoading: true }));
          retryTimer = setTimeout(() => {
            void loadProfile(firebaseUser, attempt + 1);
          }, 500 * 2 ** attempt);
          return;
        }
        console.error("Error fetching user profile:", error);
        setUserAuthState({ user: firebaseUser, userProfile: null, isUserLoading: false, userError: error as Error });
      }
    };

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        if (firebaseUser.isAnonymous) {
           setUserAuthState({ user: firebaseUser, userProfile: null, isUserLoading: false, userError: null });
           return;
        }
        await loadProfile(firebaseUser);
      } else {
        setUserAuthState({ user: null, userProfile: null, isUserLoading: false, userError: null });
      }
    }, (error) => {
      console.error("FirebaseProvider: onAuthStateChanged error:", error);
      setUserAuthState({ user: null, userProfile: null, isUserLoading: false, userError: error });
    });

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
      unsubscribe();
    };
  }, [auth, firestore]);

  /**
   * Reconstruction de l'état au retour sur l'onglet.
   *
   * Scénario de la mission (POINT 3) : connecté en Admin → « Accéder au site »
   * → navigation sur PixiaTech Web → retour Admin. Le document peut avoir été
   * restauré depuis le bfcache, ou Firestore s'être réinitialisé pendant la
   * visite : le profil doit donc être relu, pas considéré comme définitif.
   */
  useEffect(() => {
    if (!auth || !firestore) return;

    const revalidate = () => {
      if (document.visibilityState !== 'visible') return;
      const current = auth.currentUser;
      if (!current || current.isAnonymous) return;
      setUserAuthState((prev) => (prev.userProfile ? prev : { ...prev, isUserLoading: true }));
      void (async () => {
        try {
          const snap = await getDoc(doc(firestore, 'users', current.uid));
          if (!snap.exists()) return;
          setUserAuthState((prev) => {
            // Un rechargement plus récent a pu avoir eu lieu entre-temps.
            if (prev.user && prev.user.uid !== current.uid) return prev;
            return { user: current, userProfile: snap.data() as UserProfile, isUserLoading: false, userError: null };
          });
        } catch {
          // Réseau indisponible : l'état précédent reste affiché, la
          // revalidation suivante reprendra.
        }
      })();
    };

    document.addEventListener('visibilitychange', revalidate);
    window.addEventListener('pageshow', revalidate);
    window.addEventListener('focus', revalidate);
    window.addEventListener('online', revalidate);
    return () => {
      document.removeEventListener('visibilitychange', revalidate);
      window.removeEventListener('pageshow', revalidate);
      window.removeEventListener('focus', revalidate);
      window.removeEventListener('online', revalidate);
    };
  }, [auth, firestore]);

  const contextValue = useMemo((): FirebaseContextState => {
    const servicesAvailable = !!(firebaseApp && firestore && auth && storage);
    return {
      areServicesAvailable: servicesAvailable,
      firebaseApp: servicesAvailable ? firebaseApp : null,
      firestore: servicesAvailable ? firestore : null,
      auth: servicesAvailable ? auth : null,
      storage: servicesAvailable ? storage : null,
      ...userAuthState,
    };
  }, [firebaseApp, firestore, auth, storage, userAuthState]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};


export const useFirebase = (): FirebaseServicesAndUser => {
  const context = useContext(FirebaseContext);

  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider.');
  }

  if (!context.areServicesAvailable || !context.firebaseApp || !context.firestore || !context.auth || !context.storage) {
    throw new Error('Firebase core services not available. Check FirebaseProvider props.');
  }

  return {
    firebaseApp: context.firebaseApp,
    firestore: context.firestore,
    auth: context.auth,
    storage: context.storage,
    user: context.user,
    userProfile: context.userProfile,
    isUserLoading: context.isUserLoading,
    userError: context.userError,
  };
};

export const useAuth = (): Auth => {
  const { auth } = useFirebase();
  return auth;
};

export const useFirestore = (): Firestore => {
  const { firestore } = useFirebase();
  return firestore;
};

export const useStorage = (): FirebaseStorage => {
  const { storage } = useFirebase();
  return storage;
};

export const useFirebaseApp = (): FirebaseApp => {
  const { firebaseApp } = useFirebase();
  return firebaseApp;
};

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const memoized = useMemo(factory, deps);

    if (memoized && typeof memoized === 'object') {
        try {
            Object.defineProperty(memoized, '__memo', {
                value: true,
                writable: false,
                enumerable: false,
            });
        } catch (e) {
        }
    }
    
    return memoized;
}

export const useUser = (): UserHookResult => {
  const { user, userProfile, isUserLoading, userError } = useFirebase();
  return { user, userProfile, isUserLoading, userError };
};
