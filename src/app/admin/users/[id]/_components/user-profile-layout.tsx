'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Lock, LogOut, Mail, Phone, Shield, Clock, Calendar } from 'lucide-react';
import type { UserProfile, UserRole } from '@/lib/types';
import { UserProfileForm } from './user-profile-form';
import { UserPasswordForm } from './user-password-form';
import { logout } from '@/app/admin/actions';
import { useFirestore, useAuth, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { RoleBadge } from '@/app/admin/users/_components/role-badge';
import { StatusBadge } from '@/app/admin/users/_components/status-badge';

interface UserProfileLayoutProps {
  user: UserProfile;
}

export function UserProfileLayout({ user: initialUser }: UserProfileLayoutProps) {
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
    : 'Date inconnue';

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
            className="bg-white border border-gray-200 rounded-[2rem] p-6 flex flex-col items-center text-center sticky top-24 shadow-sm"
          >
            <div className="w-24 h-24 rounded-3xl border-4 border-white overflow-hidden bg-gray-100 shadow-xl mb-4">
              <img
                src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName)}&background=random&size=96`}
                alt={user.displayName}
                className="w-full h-full object-cover"
              />
            </div>
            <h2 className="text-xl font-bold text-gray-900">{user.displayName}</h2>
            <p className="text-sm text-gray-400 mt-1">Inscrit le {creationDate}</p>

            <div className="flex items-center gap-2 mt-4">
              {roleObj && <RoleBadge roleName={roleObj.name} roleColor={roleObj.color} />}
              <StatusBadge status={user.status} />
            </div>

            <div className="w-full space-y-2 mt-8 text-left">
              <button
                onClick={() => setActiveTab('personal')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${
                  activeTab === 'personal'
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                }`}
              >
                <User className="h-4 w-4" />
                Informations
              </button>
              <button
                onClick={() => setActiveTab('password')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${
                  activeTab === 'password'
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                }`}
              >
                <Lock className="h-4 w-4" />
                Mot de passe
              </button>
              {!isCurrentUser && (
                <form action={logout}>
                  <button
                    type="submit"
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium text-rose-500 hover:bg-rose-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Se déconnecter
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
            className="bg-white border border-gray-200 rounded-[2rem] shadow-sm"
          >
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">
                {activeTab === 'personal' ? 'Informations Personnelles' : 'Connexion & Mot de passe'}
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                {activeTab === 'personal'
                  ? "Mettez à jour les informations de l'utilisateur."
                  : 'Gérez le mot de passe de l\'utilisateur.'}
              </p>
            </div>
            <div className="p-6">
              {activeTab === 'personal' && <UserProfileForm user={user} onUpdate={handleProfileUpdate} />}
              {activeTab === 'password' && <UserPasswordForm userId={user.uid} />}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
