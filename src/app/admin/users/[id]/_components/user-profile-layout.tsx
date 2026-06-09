'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Lock, LogOut } from 'lucide-react';
import type { UserProfile, UserRole } from '@/lib/types';
import { UserProfileForm } from './user-profile-form';
import { UserPasswordForm } from './user-password-form';
import { logout } from '@/app/admin/actions';
import { useFirestore, useAuth, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { RoleBadge } from '@/app/admin/users/_components/role-badge';
import { StatusBadge } from '@/app/admin/users/_components/status-badge';
import { useI18n } from '@/lib/i18n';

interface UserProfileLayoutProps {
  user: UserProfile;
}

export function UserProfileLayout({ user: initialUser }: UserProfileLayoutProps) {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<'personal' | 'password'>('personal');
  const [user, setUser] = useState(initialUser);
  const { userProfile: currentAdminUser } = useUser();

  const firestore = useFirestore();
  const auth = useAuth();
  const rolesQuery = useMemoFirebase(
    () => firestore && auth.currentUser ? query(collection(firestore, 'roles'), orderBy('name')) : null,
    [firestore, auth.currentUser]
  );
  const { data: allRoles } = useCollection<UserRole>(rolesQuery, { suppressPermissionError: true });

  const handleProfileUpdate = (updatedData: Partial<UserProfile>) => {
    setUser(prev => ({ ...prev, ...updatedData }));
  };

  const creationDate = user.createdAt
    ? new Date(typeof user.createdAt === 'string' ? user.createdAt : user.createdAt?.toDate?.()?.toISOString() || Date.now()).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
      : t('profile.unknownDate');

  const roleObj = allRoles?.find(r => r.id === user.role);
  const isCurrentUser = currentAdminUser?.uid === user.uid;

  return (
    <div className="w-full max-w-6xl mx-auto">

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="md:col-span-1">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-theme-card border border-theme-card-border rounded-[2rem] p-6 flex flex-col items-center text-center sticky top-24 shadow-xl"
          >
            <div className="w-24 h-24 rounded-3xl border-4 border-white overflow-hidden bg-theme-card shadow-xl mb-4">
              <img
                src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName)}&background=random&size=96`}
                alt={user.displayName}
                className="w-full h-full object-cover"
              />
            </div>
            <h2 className="text-xl font-bold text-theme-card-text">{user.displayName}</h2>
            <p className="text-sm text-theme-card-text/60 mt-1">{t('profile.memberSince', { date: creationDate })}</p>

            <div className="flex items-center gap-2 mt-4">
              {roleObj && <RoleBadge roleName={roleObj.name} roleColor={roleObj.color} />}
              <StatusBadge status={user.status} />
            </div>

            <div className="w-full space-y-2 mt-8 text-left" role="tablist" aria-label={t('profile.tabsLabel')}>
              <button
                role="tab"
                aria-selected={activeTab === 'personal'}
                aria-controls="tabpanel-personal"
                id="tab-personal"
                onClick={() => setActiveTab('personal')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${
                  activeTab === 'personal'
                    ? 'bg-theme-sidebar-active-bg text-theme-sidebar-active-text'
                    : 'text-theme-card-text/60 hover:bg-theme-hover hover:text-theme-card-text'
                }`}
              >
                <User className="h-4 w-4" />
                {t('profile.info')}
              </button>
              <button
                role="tab"
                aria-selected={activeTab === 'password'}
                aria-controls="tabpanel-password"
                id="tab-password"
                onClick={() => setActiveTab('password')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${
                  activeTab === 'password'
                    ? 'bg-theme-sidebar-active-bg text-theme-sidebar-active-text'
                    : 'text-theme-card-text/60 hover:bg-theme-hover hover:text-theme-card-text'
                }`}
              >
                <Lock className="h-4 w-4" />
                {t('profile.password')}
              </button>
              {!isCurrentUser && (
                <form action={logout}>
                  <button
                    type="submit"
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium text-rose-500 hover:bg-rose-50/20"
                  >
                    <LogOut className="h-4 w-4" />
                    {t('profile.logOut')}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </div>

        {/* Content */}
        <div className="md:col-span-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-theme-card border border-theme-card-border rounded-[2rem] shadow-xl"
          >
            <div className="p-6 border-b border-theme-card-border">
              <h2 id={`tabpanel-${activeTab}-title`} className="text-xl font-bold text-theme-card-text">
                {activeTab === 'personal' ? t('profile.personalInfo') : t('profile.loginPassword')}
              </h2>
              <p className="text-sm text-theme-card-text/60 mt-1">
                {activeTab === 'personal'
                  ? t('profile.updateInfo')
                  : t('profile.managePassword')}
              </p>
            </div>
            <div
              className="p-6"
              role="tabpanel"
              id={`tabpanel-${activeTab}`}
              aria-labelledby={`tab-${activeTab}`}
            >
              {activeTab === 'personal' && <UserProfileForm user={user} onUpdate={handleProfileUpdate} />}
              {activeTab === 'password' && <UserPasswordForm userId={user.uid} />}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
