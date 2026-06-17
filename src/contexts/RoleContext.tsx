'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { useFirestore, useCollection, useAuth, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { UserRole } from '@/lib/types';

interface RoleContextValue {
  roles: UserRole[];
  isLoading: boolean;
  getRoleTemplate: (roleIdOrName: string) => string | undefined;
  getRoleColor: (roleIdOrName: string) => string;
  getRoleName: (roleIdOrName: string) => string;
}

const RoleContext = createContext<RoleContextValue | undefined>(undefined);

const DEFAULT_ROLES: UserRole[] = [
  { id: 'admin', name: 'Administrateur', color: '#ef4444', isDefault: true, roleTemplate: 'admin' },
  { id: 'fournisseur', name: 'Fournisseur', color: '#22c55e', isDefault: true, roleTemplate: 'fournisseur' },
  { id: 'commercial', name: 'Commercial', color: '#f97316', isDefault: true, roleTemplate: 'commercial' },
];

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const firestore = useFirestore();
  const auth = useAuth();
  const { isUserLoading } = useUser();

  const rolesQuery = useMemoFirebase(() => {
    if (firestore && auth.currentUser && !isUserLoading) {
      return query(collection(firestore, 'roles'), orderBy('name'));
    }
    return null;
  }, [firestore, auth.currentUser, isUserLoading]);

  const { data: customRoles, isLoading: isCustomRolesLoading } = useCollection<UserRole>(rolesQuery, { suppressPermissionError: true });

  const roles = useMemo(() => {
    // Merge defaults with custom roles
    const custom = customRoles || [];
    const merged = [...DEFAULT_ROLES];
    
    // Add custom roles, prioritizing them over defaults if there's an ID match
    custom.forEach(cr => {
      const existingIndex = merged.findIndex(r => r.id === cr.id);
      if (existingIndex >= 0) {
        // Always preserve isDefault from the hardcoded list so Firestore can't un-pin base roles
        merged[existingIndex] = { ...cr, isDefault: merged[existingIndex].isDefault };
      } else {
        merged.push(cr);
      }
    });

    return merged;
  }, [customRoles]);

  const getRoleTemplate = (roleIdOrName: string) => {
    if (!roleIdOrName) return undefined;
    const r = roles.find(r => r.id === roleIdOrName || r.name.toLowerCase() === roleIdOrName.toLowerCase());
    return r?.roleTemplate;
  };

  const getRoleColor = (roleIdOrName: string) => {
    const r = roles.find(r => r.id === roleIdOrName || r.name.toLowerCase() === roleIdOrName.toLowerCase());
    return r?.color || '#3b82f6'; // default blue
  };

  const getRoleName = (roleIdOrName: string) => {
    const r = roles.find(r => r.id === roleIdOrName || r.name.toLowerCase() === roleIdOrName.toLowerCase());
    return r?.name || roleIdOrName;
  };

  return (
    <RoleContext.Provider value={{ roles, isLoading: isCustomRolesLoading, getRoleTemplate, getRoleColor, getRoleName }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRoles() {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRoles must be used within a RoleProvider');
  }
  return context;
}
