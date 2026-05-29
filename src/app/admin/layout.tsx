
'use client';

import { useUser } from '@/firebase';
import { AdminLayoutContent } from './_components/admin-layout-content';
import { usePathname, useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect, useTransition } from 'react';
import { logout } from './actions';

function AdminGatedLayout({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const pathname = usePathname();
  const [ isLoggingOut, startLogout ] = useTransition();

  const isAuthPage = pathname.startsWith('/admin/login') || pathname.startsWith('/admin/register');

  useEffect(() => {
    if (!isUserLoading && !isAuthPage && (!user || user.isAnonymous)) {
      startLogout(() => {
        logout();
      });
    }
  }, [isUserLoading, isAuthPage, user]);

  // While loading, show a skeleton to avoid flashes of content, except on auth pages.
  if (isUserLoading && !isAuthPage) {
     return <AdminLayoutContent>{children}</AdminLayoutContent>;
  }

  // If on an auth page, render the minimal layout.
  // The middleware will handle redirecting away if the user is already logged in.
  if (isAuthPage) {
    return <>{children}</>;
  }

  // If on a protected admin page and there is a non-anonymous user, show admin content.
  if (!isAuthPage && user && !user.isAnonymous) {
     return <AdminLayoutContent>{children}</AdminLayoutContent>;
  }
  
  // If not authenticated for a protected page, the middleware should have redirected.
  // We show a loader as a fallback during the transition.
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
