'use client';

import { Loader2, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { UserProfileLayout } from './_components/user-profile-layout';
import { useDoc, useMemoFirebase } from '@/firebase';
import { doc, getFirestore } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';
import { useI18n } from '@/lib/i18n';

export default function UserProfilePage({ params }: { params: { id: string } }) {
  const { t } = useI18n();
  const db = getFirestore();
  const userRef = useMemoFirebase(() => doc(db, 'users', params.id), [db, params.id]);
  const { data: user, isLoading, error } = useDoc<UserProfile>(userRef);

  if (isLoading) {
    return (
      <div className="w-full max-w-6xl mx-auto flex justify-center items-center p-20">
        <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg mx-auto"
      >
        <div className="bg-white border border-gray-200 rounded-[2rem] p-8 shadow-sm">
          <div className="flex flex-col items-center justify-center text-center gap-4">
            <div className="w-20 h-20 bg-rose-50 rounded-[1.5rem] flex items-center justify-center">
              <AlertTriangle className="h-10 w-10 text-rose-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">{t('profile.userNotFound')}</h2>
            <p className="text-sm text-gray-400">
              {t('profile.unableToFindUser')} {params.id}
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  return <UserProfileLayout user={user} />;
}
