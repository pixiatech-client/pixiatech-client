'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { usePermissions } from '@/hooks/usePermissions';
import { canAccessRoute, ROLE_LABELS, type Permission } from '@/lib/permissions';
import { Shield, ArrowLeft, Loader2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AccessControlProps {
  children: React.ReactNode;
}

export function AccessControl({ children }: AccessControlProps) {
  const { user, isLoading } = usePermissions();
  const router = useRouter();
  const pathname = usePathname();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  const role = user.role as 'admin' | 'fournisseur' | 'commercial';
  
  if (!canAccessRoute(role, pathname)) {
    return <AccessDenied role={role} currentPath={pathname} />;
  }

  return <>{children}</>;
}

interface AccessDeniedProps {
  role: 'admin' | 'fournisseur' | 'commercial';
  currentPath: string;
}

function AccessDenied({ role, currentPath }: AccessDeniedProps) {
  const { push } = useRouter();
  
  const getRedirectPath = () => {
    if (role === 'admin') return '/admin';
    if (role === 'fournisseur' || role === 'commercial') return '/admin/quote-requests';
    return '/admin';
  };

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="w-20 h-20 mx-auto bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
          <Shield className="w-10 h-10 text-red-500" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Accès refusé
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Vous n'avez pas la permission d'accéder à cette page.
          </p>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl space-y-2">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Votre rôle: <span className="font-bold">{ROLE_LABELS[role]}</span>
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Page: <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">{currentPath}</code>
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Button
            onClick={() => push(getRedirectPath())}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au tableau de bord
          </Button>
        </div>
      </div>
    </div>
  );
}

interface PermissionGateProps {
  permission: Permission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PermissionGate({ permission, children, fallback = null }: PermissionGateProps) {
  const { can, isLoading } = usePermissions();

  if (isLoading) {
    return <div className="animate-pulse h-8 bg-gray-200 rounded" />;
  }

  if (!can(permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

interface AccessHintProps {
  permission: Permission;
  children: React.ReactNode;
}

export function AccessHint({ permission, children }: AccessHintProps) {
  const { can } = usePermissions();

  if (!can(permission)) {
    return (
      <div className="flex items-center gap-2 text-gray-400 text-sm">
        <Lock className="w-3 h-3" />
        <span>Accès restreint</span>
      </div>
    );
  }

  return <>{children}</>;
}