'use client';

import React, { useState } from 'react';
import { MoreVertical, Eye, Edit2, Shield, CheckCircle, Ban, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { RoleBadge } from './role-badge';
import { StatusBadge } from './status-badge';
import type { AdaptedUser } from './user-card';
import { useAdminT } from '@/hooks/useAdminT';

interface UserRowProps {
  user: AdaptedUser;
  onEdit: (user: AdaptedUser) => void;
  onDelete: (uid: string) => void;
  isAdmin: boolean;
}

export const UserRow: React.FC<UserRowProps> = ({
  user,
  onEdit,
  onDelete,
  isAdmin,
}) => {
  const { t } = useAdminT();
  const [showActions, setShowActions] = useState(false);

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return t('N/A');
    }
  };

  return (
    <tr className="group hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-none relative">
      <td className="py-4 px-4">
        <div className="flex items-center gap-3">
          <img
            src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName)}&background=random`}
            alt={user.displayName}
            className="w-10 h-10 rounded-full border border-gray-200 object-cover"
            referrerPolicy="no-referrer"
          />
          <div>
            <div className="text-sm font-semibold text-gray-900">{user.displayName}</div>
            <div className="text-xs text-gray-500">{user.email}</div>
          </div>
        </div>
      </td>
      <td className="py-4 px-4">
        <RoleBadge roleName={user.roleName} roleColor={user.roleColor} />
      </td>
      <td className="py-4 px-4">
        <StatusBadge status={user.status} />
      </td>
      <td className="py-4 px-4 text-sm text-gray-500">{user.phone || '—'}</td>
      <td className="py-4 px-4 text-right relative">
        <button
          onClick={() => setShowActions(!showActions)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
        >
          <MoreVertical className="w-5 h-5" />
        </button>

        <AnimatePresence>
          {showActions && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowActions(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                className="absolute right-4 top-12 w-48 bg-white border border-gray-200 rounded-xl shadow-xl z-20 py-1 overflow-hidden"
              >
                <button
                  onClick={() => { onEdit(user); setShowActions(false); }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                                  <Edit2 className="w-4 h-4" /> {t('Edit')}
                </button>
                {isAdmin && (
                  <button
                    onClick={() => { onDelete(user.uid); setShowActions(false); }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-rose-400 hover:bg-rose-400/10 transition-colors"
                  >
                                    <Trash2 className="w-4 h-4" /> {t('Delete')}
                  </button>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </td>
    </tr>
  );
};
