import { useSession } from '@/contexts/SessionContext';
import { hasPermission, canAccessRoute, type Permission, type UserRole } from '@/lib/permissions';

export function usePermissions() {
  const { session, isLoading: isSessionLoading } = useSession();
  
  const user = session?.currentUser;
  // Use roleTemplate if available, fallback to role, default to commercial
  const role = (user?.roleTemplate || user?.role || 'commercial') as UserRole;
  const isImpersonating = session?.isImpersonating || false;
  const originalUser = session?.originalUser;
  
  return {
    user,
    role,
    isLoading: isSessionLoading,
    isImpersonating,
    originalUser,
    can: (permission: Permission) => hasPermission(role, permission),
    canAccess: (path: string) => canAccessRoute(role, path),
    isAdmin: role === 'admin',
    isFournisseur: role === 'fournisseur',
    isCommercial: role === 'commercial',
  };
}

export function useRequirePermission(permission: Permission): boolean {
  const { can } = usePermissions();
  return can(permission);
}

export function useRequireRole(allowedRoles: UserRole[]): boolean {
  const { role } = usePermissions();
  return allowedRoles.includes(role);
}