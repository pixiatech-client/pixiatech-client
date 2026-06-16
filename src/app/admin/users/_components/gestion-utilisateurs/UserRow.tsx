import React, { useState } from 'react';
import { MoreVertical, Eye, Edit2, Shield, CheckCircle, Ban, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, UserStatus } from './types';
import { RoleBadge } from './RoleBadge';
import { StatusBadge } from './StatusBadge';
import { useAdminT } from '@/hooks/useAdminT';
import { getAvatarUrl } from '@/lib/avatar';

interface UserRowProps {
  user: User;
  onEdit: (user: User) => void;
  onDelete: (id: string) => void;
  onApprove: (id: string) => void;
  onSuspend: (id: string) => void;
  onChangeRole: (user: User) => void;
}

export const UserRow: React.FC<UserRowProps> = ({
  user,
  onEdit,
  onDelete,
  onApprove,
  onSuspend,
  onChangeRole,
}) => {
  const { t } = useAdminT();
  const [showActions, setShowActions] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <tr className="group hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-none relative">
      <td className="py-4 px-4 text-xs font-mono text-gray-500">{user.id}</td>
      <td className="py-4 px-4">
        <div className="flex items-center gap-3">
          <img
            src={user.avatar || getAvatarUrl('', user.role, user.name)}
            alt={user.name}
            className="w-10 h-10 rounded-full border border-gray-200 object-cover"
            referrerPolicy="no-referrer"
          />
          <div>
            <div className="text-sm font-semibold text-gray-900">{user.name}</div>
            <div className="text-xs text-gray-500">{user.email}</div>
          </div>
        </div>
      </td>
      <td className="py-4 px-4">
        <RoleBadge role={user.role} />
      </td>
      <td className="py-4 px-4">
        <StatusBadge status={user.status} />
      </td>
      <td className="py-4 px-4 text-sm text-gray-500">{formatDate(user.lastLogin)}</td>
      <td className="py-4 px-4 text-sm text-gray-500">{formatDate(user.createdAt)}</td>
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
                <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                  <Eye className="w-4 h-4" /> {t('View profile')}
                </button>
                <button
                  onClick={() => {
                    onEdit(user);
                    setShowActions(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Edit2 className="w-4 h-4" /> {t('Edit')}
                </button>
                <button
                  onClick={() => {
                    onChangeRole(user);
                    setShowActions(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Shield className="w-4 h-4" /> {t('Change role')}
                </button>
                {user.status === UserStatus.PENDING && (
                  <button
                    onClick={() => {
                      onApprove(user.id);
                      setShowActions(false);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-emerald-400 hover:bg-emerald-400/10 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" /> {t('Approve')}
                  </button>
                )}
                {user.status !== UserStatus.SUSPENDED && (
                  <button
                    onClick={() => {
                      onSuspend(user.id);
                      setShowActions(false);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-orange-400 hover:bg-orange-400/10 transition-colors"
                  >
                    <Ban className="w-4 h-4" /> {t('Suspend')}
                  </button>
                )}
                <button
                  onClick={() => {
                    onDelete(user.id);
                    setShowActions(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-rose-400 hover:bg-rose-400/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" /> {t('Delete')}
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </td>
    </tr>
  );
};
