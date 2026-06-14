
'use client';

import { useUser } from '@/firebase';
import { AdminLayoutContent } from './_components/admin-layout-content';
import { usePathname, useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect, useRef, useState, useTransition } from 'react';
import { getSessionUid, logout, clearSession } from './actions';
import { ThemeProvider } from '@/contexts/ThemeProvider';

function AdminGatedLayout({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, startLogout] = useTransition();

  const [sessionUid, setSessionUid] = useState<string | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const mountedAt = useRef(Date.now());

  const isAuthPage = pathname.startsWith('/admin/login') || pathname.startsWith('/admin/register');

  // Fetch session cookie UID on mount (server-side verification)
  useEffect(() => {
    getSessionUid().then((result) => {
      setSessionUid(result.uid);
      setSessionLoading(false);
    });
  }, []);

  // Logout guard: only logout if genuinely unauthenticated, never during Firebase resolution race
  useEffect(() => {
    if (isAuthPage || isUserLoading || sessionLoading || isLoggingOut) return;

    const hasSession = sessionUid !== null;
    const hasValidFirebaseUser = user && !user.isAnonymous;

    // Security: UID mismatch between session cookie and Firebase auth
    if (hasValidFirebaseUser && hasSession && user.uid !== sessionUid) {
      console.warn(
        '[AdminGatedLayout] Session UID mismatch: cookie=',
        sessionUid,
        'firebase=',
        user.uid
      );
      startLogout(() => { clearSession(); });
      return;
    }

    const elapsed = Date.now() - mountedAt.current;

    // Session exists but Firebase hasn't resolved yet — wait during loading + 4s debounce
    // (Firebase onAuthStateChanged can lag behind session cookie after login)
    if (hasSession && !hasValidFirebaseUser) {
      if (isUserLoading || sessionLoading || elapsed < 4000) return;
    }

    // Session exists and Firebase resolved — all good
    if (hasSession && hasValidFirebaseUser) return;

    // No session and no Firebase user — genuinely logged out
    // Short debounce prevents logout during navigation where Firebase briefly goes null
    if (elapsed < 2000 && !hasSession) return;

    // Stale session or no Firebase user: clear the stale cookie and redirect
    if (!hasValidFirebaseUser) {
      startLogout(async () => {
        await clearSession();
        router.push('/admin/login');
      });
    }
  }, [isUserLoading, isAuthPage, user, sessionUid, sessionLoading, isLoggingOut]);

  // While loading Firebase or session, show skeleton (except on auth pages)
  if ((isUserLoading || sessionLoading) && !isAuthPage) {
    return (
      <ThemeProvider>
        <AdminLayoutContent>{children}</AdminLayoutContent>
      </ThemeProvider>
    );
  }

  // Auth pages render minimal layout (middleware handles redirect if already logged in)
  if (isAuthPage) {
    return <>{children}</>;
  }

  // Protected page with a valid user
  if (!isAuthPage && user && !user.isAnonymous && !sessionLoading) {
    return (
      <ThemeProvider>
        <AdminLayoutContent>{children}</AdminLayoutContent>
      </ThemeProvider>
    );
  }

  // Fallback: middleware should have redirected, show loader during transition
  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4 bg-muted/40">
      <Skeleton className="h-48 w-full max-w-sm rounded-2xl" />
    </div>
  );
}


export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGatedLayout>
        {children}
    </AdminGatedLayout>
  );
}
