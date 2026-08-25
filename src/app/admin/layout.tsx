
'use client';

import { useUser, useFirebase } from '@/firebase';
import { AdminLayoutContent } from './_components/admin-layout-content';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useTransition, useCallback } from 'react';
import { getSessionUid, clearSession, verifySession } from './actions';
import { ThemeProvider } from '@/contexts/ThemeProvider';
import { signOut, getAuth } from 'firebase/auth';
import { SessionKickedModal } from '@/components/ui/SessionKickedModal';
import { NetworkErrorModal } from '@/components/ui/NetworkErrorModal';

function AdminContent({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const { userError } = useFirebase();
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, startLogout] = useTransition();

  const [sessionUid, setSessionUid] = useState<string | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [sessionKicked, setSessionKicked] = useState(false);
  const [sessionCreatedAt, setSessionCreatedAt] = useState<number | null>(null);
  const [isNetworkError, setIsNetworkError] = useState(false);
  const mountedAt = useRef(Date.now());

  const isAuthPage = pathname.startsWith('/admin/login') || pathname.startsWith('/admin/register');

  useEffect(() => {
    const handleOffline = () => setIsNetworkError(true);
    const handleOnline = () => setIsNetworkError(false);

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setIsNetworkError(true);
    }

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  useEffect(() => {
    if (userError && 'code' in userError && (userError as any).code === 'auth/network-request-failed') {
      setIsNetworkError(true);
    }
  }, [userError]);

  // Filter out Firebase SDK console noise (errors already handled gracefully)
  useEffect(() => {
    const origError = console.error;
    console.error = (...args: any[]) => {
      const msg = args.join(' ');
      if (
        (msg.includes('Firestore') && msg.includes('permission-denied')) ||
        msg.includes('INTERNAL ASSERTION FAILED')
      ) return;
      origError.apply(console, args);
    };
    return () => { console.error = origError; };
  }, []);

  const handleRetry = useCallback(() => {
    setIsNetworkError(false);
    window.location.reload();
  }, []);

  // Fetch session cookie UID on mount + re-validate periodically
  useEffect(() => {
    const refreshSessionUid = async () => {
      try {
        const result = await getSessionUid();
        // If the first attempt returned null (server action failed transiently),
        // retry once before accepting it as "no session". A transient failure
        // (HMR, dev restart, network hiccup) must not be treated as session death.
        if (!result.uid) {
          try {
            const retry = await getSessionUid();
            setSessionUid(retry.uid);
          } catch {
            setSessionUid(null);
          }
        } else {
          setSessionUid(result.uid);
        }
      } catch {
        setSessionUid(null);
      }
      setSessionLoading(false);
    };
    refreshSessionUid();
  }, []);

  // Periodic session validity check (for single-session enforcement)
  // Uses ref-based polling so it never gets blocked by React state changes
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (isAuthPage) return;

    const check = async () => {
      try {
        // Re-validate sessionUid alongside the session check
        const uidResult = await getSessionUid().catch(() => ({ uid: null }));
        setSessionUid(uidResult.uid);

        const result = await verifySession();
        if (result.valid) return;

        // Handle session mismatch (kicked by another tab) — show modal
        if (result.reason === 'session_mismatch') {
          if (pollingRef.current) clearInterval(pollingRef.current);
          setSessionCreatedAt((result as any).sessionCreatedAt ?? null);
          setSessionKicked(true);
          return;
        }

        // Handle expired/revoked session — redirect to login with message
        const expiredReasons = [
          'expired', 'error', 'unknown_error',
          'auth/session-cookie-expired', 'auth/session-cookie-revoked',
          'auth/id-token-expired', 'auth/id-token-revoked',
          'auth/argument-error', 'auth/invalid-auth-token',
          'user_not_found', 'no_session'
        ];
        if (expiredReasons.includes(result.reason)) {
          if (pollingRef.current) clearInterval(pollingRef.current);
          try { localStorage.clear(); } catch {}
          try { sessionStorage.clear(); } catch {}
          try { await signOut(getAuth()); } catch {}
          await clearSession();
          router.push('/admin/login?reason=session_expired');
          return;
        }
      } catch (err) {
        console.error('[AdminLayout] Session check error:', err);
      }
    };

    // Check on visibility change (user returns to tab)
    const onVisibility = () => {
      if (document.visibilityState === 'visible' && !sessionKicked) check();
    };
    document.addEventListener('visibilitychange', onVisibility);

    // Immediate check + periodic poll every 60s
    const timeout = setTimeout(check, 2000);
    pollingRef.current = setInterval(check, 60000);

    return () => {
      clearTimeout(timeout);
      if (pollingRef.current) clearInterval(pollingRef.current);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [isAuthPage, sessionKicked]);

  const handleSessionKickedConfirm = async () => {
    setSessionKicked(false);
    await performLogout('/admin/login');
  };

  /** Centralized logout: clears client state + server cookies, then redirects. */
  const performLogout = async (target: string) => {
    try { localStorage.clear(); } catch {}
    try { sessionStorage.clear(); } catch {}
    try { await signOut(getAuth()); } catch {}
    await clearSession();
    router.push(target);
  };

  // Logout guard: only logout if genuinely unauthenticated, never during Firebase resolution race
  useEffect(() => {
    if (isAuthPage || sessionLoading || isLoggingOut) return;

    // Zombie state: Firebase is still loading but sessionUid = null.
    // A null sessionUid can mean either "no session" OR "getSessionUid() failed transiently".
    // Verify server-side before concluding the session is dead.
    if (isUserLoading && sessionUid === null) {
      let cancelled = false;
      (async () => {
        try {
          const result = await verifySession();
          if (cancelled) return;
          // Only logout if the server explicitly confirms the session is dead.
          // Transient errors (HMR, dev restart, network) → do NOT logout, let next poll retry.
          const confirmedDead = !result.valid && [
            'expired', 'user_not_found', 'no_session',
            'auth/session-cookie-expired', 'auth/session-cookie-revoked',
          ].includes(result.reason);
          if (confirmedDead) {
            startLogout(() => { performLogout('/admin/login?reason=session_expired'); });
          }
        } catch {
          // verifySession() itself failed (server unavailable) — do NOT logout.
          // The session may still be valid; next polling cycle will retry.
        }
      })();
      return () => { cancelled = true; };
    }

    // Standard guard: wait for Firebase to resolve
    if (isUserLoading) return;

    const hasSession = sessionUid !== null;
    const hasValidFirebaseUser = user && !user.isAnonymous;

    // Security: UID mismatch between session cookie and Firebase auth
    if (hasValidFirebaseUser && hasSession && user.uid !== sessionUid) {
      console.warn(
        '[AdminContent] Session UID mismatch: cookie=',
        sessionUid,
        'firebase=',
        user.uid
      );
      startLogout(() => { clearSession(); });
      return;
    }

    const elapsed = Date.now() - mountedAt.current;
    const GUARD_GRACE_MS = 30000;

    // Session exists but Firebase hasn't resolved yet — wait during loading + long debounce
    if (hasSession && !hasValidFirebaseUser) {
      if (isUserLoading || sessionLoading || elapsed < GUARD_GRACE_MS) return;
      // Firebase still null after 30s; rely on the 60s polling to detect real session death
      return;
    }

    // Session exists and Firebase resolved — all good
    if (hasSession && hasValidFirebaseUser) return;

    // No session and no Firebase user — genuinely logged out
    if (elapsed < 5000 && !hasSession) return;

    // Session cookie missing but Firebase client still has stale user.
    // sessionUid can be null from a transient getSessionUid() failure — verify before logout.
    if (!hasSession && hasValidFirebaseUser) {
      let cancelled = false;
      (async () => {
        try {
          const result = await verifySession();
          if (cancelled) return;
          const confirmedDead = !result.valid && [
            'expired', 'user_not_found', 'no_session',
            'auth/session-cookie-expired', 'auth/session-cookie-revoked',
          ].includes(result.reason);
          if (confirmedDead) {
            startLogout(() => { performLogout('/admin/login?reason=session_expired'); });
          }
        } catch {
          // verifySession() failed — do NOT logout, let next poll retry.
        }
      })();
      return () => { cancelled = true; };
    }

    // Both session cookie AND Firebase user are gone — genuinely logged out
    if (!hasSession && !hasValidFirebaseUser) {
      startLogout(() => { performLogout('/admin/login'); });
    }
  }, [isUserLoading, isAuthPage, user, sessionUid, sessionLoading, isLoggingOut]);

  // Auth pages: minimal layout (middleware handles redirect if already logged in)
  if (isAuthPage) {
    return <>{children}</>;
  }

  // Protected pages: always show AdminLayoutContent (sidebar, header, etc.)
  // ThemeProvider wraps at the top level so the theme never resets between states
  return (
    <>
      <AdminLayoutContent>{children}</AdminLayoutContent>
      <SessionKickedModal
        open={sessionKicked}
        sessionCreatedAt={sessionCreatedAt}
        onConfirm={handleSessionKickedConfirm}
      />
      <NetworkErrorModal
        open={isNetworkError && !sessionKicked}
        onRetry={handleRetry}
      />
    </>
  );
}


export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <AdminContent>
        {children}
      </AdminContent>
    </ThemeProvider>
  );
}
