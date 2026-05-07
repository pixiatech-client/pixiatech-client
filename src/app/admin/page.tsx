'use client';

import { useUser } from '@/firebase';
import { DashboardContent } from './_components/dashboard-content';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminPage() {
  const { userProfile, isUserLoading } = useUser();

  if (isUserLoading || !userProfile) {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Skeleton className="h-36 rounded-[2rem]" />
                <Skeleton className="h-36 rounded-[2rem]" />
                <Skeleton className="h-36 rounded-[2rem]" />
            </div>
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Skeleton className="h-80 rounded-[2rem]" />
                    <Skeleton className="h-64 rounded-[2rem]" />
                </div>
                <div className="space-y-6">
                    <Skeleton className="h-64 rounded-[2rem]" />
                    <Skeleton className="h-64 rounded-[2rem]" />
                </div>
            </div>
        </div>
    );
  }

  // All roles (admin, fournisseur, commercial) can access the dashboard at /admin
  return <DashboardContent />;
}
