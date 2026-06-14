export type UserRole = 'admin' | 'fournisseur' | 'commercial';

export type Permission = 
  | '*'
  | 'dashboard:view'
  | 'users:list'
  | 'users:read'
  | 'users:create'
  | 'users:update'
  | 'users:delete'
  | 'users:impersonate'
  | 'users:permanent-delete'
  | 'quotes:list'
  | 'quotes:read'
  | 'quotes:create'
  | 'quotes:update'
  | 'quotes:delete'
  | 'quotes:assign-supplier'
  | 'quotes:change-status'
  | 'quotes:permanent-delete'
  | 'quotes:view:pending'
  | 'quotes:view:processed'
  | 'quotes:view:supplier'
  | 'quotes:view:delivery'
  | 'quotes:view:archive'
  | 'quotes:view:trash'
  | 'products:list'
  | 'products:read'
  | 'products:create'
  | 'products:update'
  | 'products:delete'
  | 'settings:read'
  | 'settings:update'
  | 'notifications:list'
  | 'notifications:read'
  | 'notifications:create'
  | 'notifications:update'
  | 'notifications:delete'
  | 'delivery:list'
  | 'delivery:read'
  | 'delivery:create'
  | 'delivery:update'
  | 'delivery:delete'
  | 'labor:list'
  | 'labor:read'
  | 'labor:create'
  | 'labor:update'
  | 'labor:delete'
  | 'profile:read'
  | 'profile:update';

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    '*',
    'dashboard:view',
    'users:list',
    'users:read',
    'users:create',
    'users:update',
    'users:delete',
    'users:impersonate',
    'users:permanent-delete',
    'quotes:list',
    'quotes:read',
    'quotes:create',
    'quotes:update',
    'quotes:delete',
    'quotes:assign-supplier',
    'quotes:change-status',
    'quotes:permanent-delete',
    'quotes:view:pending',
    'quotes:view:processed',
    'quotes:view:supplier',
    'quotes:view:delivery',
    'quotes:view:archive',
    'quotes:view:trash',
    'products:list',
    'products:read',
    'products:create',
    'products:update',
    'products:delete',
    'settings:read',
    'settings:update',
    'notifications:list',
    'notifications:read',
    'notifications:create',
    'notifications:update',
    'notifications:delete',
    'delivery:list',
    'delivery:read',
    'delivery:create',
    'delivery:update',
    'delivery:delete',
    'labor:list',
    'labor:read',
    'labor:create',
    'labor:update',
    'labor:delete',
    'profile:read',
    'profile:update',
  ],
  fournisseur: [
    'dashboard:view',
    'quotes:read',
    'quotes:update',
    'quotes:view:supplier',
    'quotes:view:delivery',
    'notifications:read',
    'profile:read',
    'profile:update',
  ],
  commercial: [
    'dashboard:view',
    'quotes:list',
    'quotes:read',
    'quotes:create',
    'quotes:update',
    'quotes:view:pending',
    'quotes:view:processed',
    'quotes:view:delivery',
    'quotes:view:archive',
    'quotes:view:trash',
    'notifications:read',
    'profile:read',
    'profile:update',
  ],
};

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrateur',
  fournisseur: 'Fournisseur',
  commercial: 'Commercial',
};

export const ROLE_COLORS: Record<UserRole, string> = {
  admin: 'bg-purple-500',
  fournisseur: 'bg-blue-500',
  commercial: 'bg-amber-500',
};

export function hasPermission(role: UserRole | undefined, permission: Permission): boolean {
  if (!role) return false;
  
  const permissions = ROLE_PERMISSIONS[role];
  
  if (permissions.includes('*')) return true;
  
  return permissions.includes(permission);
}

export function canAccess(role: UserRole | undefined, permission: Permission): boolean {
  return hasPermission(role, permission);
}

export function canAccessRoute(role: UserRole | undefined, route: string): boolean {
  if (!role) return false;

  // Restrict products and history pages to admin only
  if (route.startsWith('/admin/products') || route.startsWith('/admin/history') || route.startsWith('/admin/amine') || route.startsWith('/admin/locations')) {
    return hasPermission(role, '*');
  }

  const routePermissions: Record<string, Permission[]> = {
    '/admin': ['dashboard:view'],
    '/admin/users': ['users:list'],
    '/admin/quote-requests': ['quotes:list'],
    '/admin/settings': ['settings:read'],
    '/admin/wizard': ['settings:read'],
    '/admin/delivery': ['delivery:list'],
    '/admin/labor': ['labor:list'],
    '/admin/pdf-settings': ['settings:read'],
  };

  // Exact match for /admin/users (user list - admin only)
  if (route === '/admin/users') {
    return hasPermission(role, 'users:list');
  }

  // Profile pages - only admin or own profile (will be checked in component)
  if (route.startsWith('/admin/users/') && route !== '/admin/users') {
    return hasPermission(role, 'users:list') || hasPermission(role, 'profile:read');
  }

  for (const [path, requiredPermissions] of Object.entries(routePermissions)) {
    if (route.startsWith(path)) {
      return requiredPermissions.some(p => hasPermission(role, p));
    }
  }

  // Default: require dashboard or quotes access
  return hasPermission(role, 'dashboard:view') || hasPermission(role, 'quotes:list');
}

export function canAccessUserProfile(role: UserRole | undefined, targetUserId: string, currentUserId?: string): boolean {
  if (!role || !currentUserId) return false;
  
  if (role === 'admin') return true;
  
  return targetUserId === currentUserId;
}

export function canPermanentlyDelete(role: UserRole | undefined): boolean {
  return hasPermission(role, 'quotes:permanent-delete');
}

export function canImpersonate(role: UserRole | undefined): boolean {
  return hasPermission(role, 'users:impersonate');
}

export const QUOTE_STATUS_VISIBILITY: Record<UserRole, string[]> = {
  admin: ['en_attente', 'traite', 'fournisseur', 'livraison', 'archive', 'corbeille'],
  fournisseur: ['fournisseur', 'livraison'],
  commercial: ['en_attente', 'traite', 'livraison', 'archive', 'corbeille'],
};