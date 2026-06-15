
'use client';

import { useUser } from '@/firebase';
import { AdminLayoutContent } from './_components/admin-layout-content';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';
import { getSessionUid, clearSession, verifySession } from './actions';
import { ThemeProvider } from '@/contexts/ThemeProvider';
import { signOut, getAuth } from 'firebase/auth';
import { SessionKickedModal } from '@/components/ui/SessionKickedModal';

function AdminContent({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, startLogout] = useTransition();

  const [sessionUid, setSessionUid] = useState<string | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [sessionKicked, setSessionKicked] = useState(false);
  const [sessionCreatedAt, setSessionCreatedAt] = useState<number | null>(null);
  const mountedAt = useRef(Date.now());

  const isAuthPage = pathname.startsWith('/admin/login') || pathname.startsWith('/admin/register');

  // Fetch session cookie UID on mount (server-side verification)
  useEffect(() => {
    getSessionUid()
      .then((result) => {
        setSessionUid(result.uid);
        setSessionLoading(false);
      })
      .catch(() => {
        setSessionUid(null);
        setSessionLoading(false);
      });
  }, []);

  // Periodic session validity check (for single-session enforcement)
  // Uses ref-based polling so it never gets blocked by React state changes
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (isAuthPage) return;

    const check = async () => {
      try {
        const result = await verifySession();
        if (result.valid) return;
        if (result.reason !== 'session_mismatch') return;

        // Stop polling and show the kicked modal
        if (pollingRef.current) clearInterval(pollingRef.current);
        setSessionCreatedAt((result as any).sessionCreatedAt ?? null);
        setSessionKicked(true);
      } catch (err) {
        console.error('[AdminLayout] Session check error:', err);
      }
    };

    // Check on visibility change (user returns to tab)
    const onVisibility = () => {
      if (document.visibilityState === 'visible' && !sessionKicked) check();
    };
    document.addEventListener('visibilitychange', onVisibility);

    // Immediate check + periodic poll every 3s
    const timeout = setTimeout(check, 2000);
    pollingRef.current = setInterval(check, 3000);

    return () => {
      clearTimeout(timeout);
      if (pollingRef.current) clearInterval(pollingRef.current);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [isAuthPage, sessionKicked]);

  const handleSessionKickedConfirm = async () => {
    setSessionKicked(false);
    try { localStorage.clear(); } catch {}
    try { sessionStorage.clear(); } catch {}
    try { await signOut(getAuth()); } catch {}
    await clearSession();
    router.push('/admin/login');
  };

  // Logout guard: only logout if genuinely unauthenticated, never during Firebase resolution race
  useEffect(() => {
    if (isAuthPage || isUserLoading || sessionLoading || isLoggingOut) return;

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

    // Session exists but Firebase hasn't resolved yet — wait during loading + 4s debounce
    if (hasSession && !hasValidFirebaseUser) {
      if (isUserLoading || sessionLoading || elapsed < 4000) return;
    }

    // Session exists and Firebase resolved — all good
    if (hasSession && hasValidFirebaseUser) return;

    // No session and no Firebase user — genuinely logged out
    if (elapsed < 2000 && !hasSession) return;

    // Stale session or no Firebase user: clear the stale cookie and redirect
    if (!hasValidFirebaseUser) {
      startLogout(async () => {
        await clearSession();
        router.push('/admin/login');
      });
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
