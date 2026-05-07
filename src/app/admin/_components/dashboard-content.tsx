'use client';

import { Dashboard } from './dashboard-new/Dashboard';
import { FournisseurDashboard } from './dashboard-new/FournisseurDashboard';
import { CommercialDashboard } from './dashboard-new/CommercialDashboard';
import { useTheme } from 'next-themes';
import { useUser } from '@/firebase';

export function DashboardContent() {
  const { theme } = useTheme();
  const { userProfile } = useUser();
  const currentTheme = theme === 'dark' ? 'dark' : 'light';
  const isDark = currentTheme === 'dark';

  const roleName = userProfile?.role === 'admin' ? 'Administrateur'
    : userProfile?.role === 'fournisseur' ? 'Fournisseur'
    : userProfile?.role === 'commercial' ? 'Commercial'
    : 'Utilisateur';

  if (userProfile?.role === 'fournisseur') {
    return (
      <FournisseurDashboard
        userName={userProfile?.displayName}
        userAvatar={userProfile?.photoURL}
        isDark={isDark}
      />
    );
  }

  if (userProfile?.role === 'commercial') {
    return (
      <CommercialDashboard
        userName={userProfile?.displayName}
        userAvatar={userProfile?.photoURL}
        isDark={isDark}
      />
    );
  }

  return (
    <Dashboard 
      theme={currentTheme} 
      onOpenChat={() => {}} 
      userName={userProfile?.displayName}
      userAvatar={userProfile?.photoURL}
      userRole={roleName}
      rawRole={userProfile?.role}
    />
  );
}
