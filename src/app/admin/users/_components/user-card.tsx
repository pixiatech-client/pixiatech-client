'use client';

import React from 'react';
import { Phone, Mail, Contact, Trash2, AlertTriangle, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { RoleBadge } from './role-badge';
import { StatusBadge } from './status-badge';
import { useAdminT } from '@/hooks/useAdminT';
import { getAvatarUrl } from '@/lib/avatar';

export interface AdaptedUser {
  uid: string;
  displayName: string;
  email: string;
  phone?: string;
  photoURL?: string;
  role: string;
  roleName: string;
  roleColor?: string;
  status: 'pending' | 'approved';
  createdAt: string;
}

interface UserCardProps {
  user: AdaptedUser;
  onEdit: (user: AdaptedUser) => void;
  onDelete: (uid: string) => void;
  isDeleting?: boolean;
  isAdmin: boolean;
}

export const UserCard: React.FC<UserCardProps> = ({
  user,
  onEdit,
  onDelete,
  isDeleting = false,
  isAdmin,
}) => {
  const [isConfirmingDelete, setIsConfirmingDelete] = React.useState(false);
  const { t } = useAdminT();

  return (
    <motion.div
      layout
      whileHover={!isDeleting && !isConfirmingDelete ? { y: -5 } : {}}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={isDeleting
        ? { x: -100, opacity: 0, scale: 0.8 }
        : { x: 0, opacity: 1, scale: 1 }
      }
      transition={{ duration: 0.4, ease: 'easeInOut' }}
      className={`group relative w-full max-w-sm rounded-[2rem] p-5 transition-all duration-500 shadow-sm overflow-hidden border ${
        isDeleting || isConfirmingDelete
          ? 'bg-[#ff2d55] border-[#ff2d55] shadow-2xl shadow-rose-500/40'
          : 'bg-white hover:bg-[#141414] border-gray-100 hover:border-white/10 hover:shadow-2xl'
      }`}
    >
      {isDeleting && (
        <div className="absolute inset-0 z-50 bg-[#ff2d55] flex flex-col items-center justify-center text-white p-6 text-center animate-in fade-in duration-300">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
            <AlertTriangle size={32} />
          </div>
          <h3 className="text-lg font-bold mb-1">{t('Deleting...')}</h3>
          <p className="text-xs opacity-70">{t('Irreversible action')}</p>
        </div>
      )}

      <AnimatePresence>
        {isConfirmingDelete && !isDeleting && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute inset-0 z-40 bg-[#ff2d55] flex flex-col items-center justify-center text-white p-6 text-center"
          >
            <div className="w-20 h-20 bg-white/20 rounded-[24px] flex items-center justify-center mb-6">
              <AlertTriangle size={40} strokeWidth={2.5} />
            </div>
            <h3 className="text-xl font-bold uppercase tracking-tight mb-2">{t('Delete user?')}</h3>
            <p className="text-xs font-medium opacity-90 leading-relaxed mb-8 px-4">
              Are you sure you want to delete <span className="font-bold">&quot;{user.displayName}&quot;</span>? This action is irreversible.
            </p>
            <div className="flex gap-3 w-full">
              <button
                onClick={(e) => { e.stopPropagation(); setIsConfirmingDelete(false); }}
                className="flex-1 py-3.5 bg-[#ff2d55] border-2 border-white/30 hover:bg-white/10 text-white rounded-2xl font-bold text-sm transition-all active:scale-[0.98]"
              >
                {t('Cancel')}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(user.uid); setIsConfirmingDelete(false); }}
                className="flex-1 py-3.5 bg-black text-white rounded-2xl font-bold text-sm transition-all shadow-xl shadow-black/20 active:scale-[0.98]"
              >
                {t('Delete')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative h-32 w-full rounded-2xl overflow-hidden mb-12">
        <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 opacity-90 group-hover:opacity-100 transition-opacity" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-3 right-3 z-20">
          <StatusBadge status={user.status} variant="glass" />
        </div>
        {isAdmin && (
          <button
            onClick={(e) => { e.stopPropagation(); setIsConfirmingDelete(true); }}
            className="absolute top-3 right-3 z-30 p-2 bg-white/20 hover:bg-rose-500 backdrop-blur-md rounded-xl text-white transition-all opacity-0 group-hover:opacity-100"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      <div className="absolute top-[100px] left-8">
        <div className="relative">
          <img
            src={getAvatarUrl(user.photoURL, user.role, user.displayName)}
            alt={user.displayName}
            className="w-16 h-16 rounded-full border-4 border-white group-hover:border-[#141414] transition-colors object-cover shadow-lg"
            referrerPolicy="no-referrer"
          />
          <div className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-white group-hover:border-[#141414] rounded-full transition-colors" />
        </div>
      </div>

      <div className="mt-2 mb-6 flex flex-col gap-1">
        <h3 className={`text-xl font-bold transition-colors ${isDeleting ? 'text-white' : 'text-gray-900 group-hover:text-white'}`}>
          {user.displayName}
        </h3>
        <div className="flex">
          <RoleBadge roleName={user.roleName} roleColor={user.roleColor} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 mb-8">
        <a
          href={`tel:${user.phone}`}
          onClick={(e) => e.stopPropagation()}
          className="flex items-start gap-3 group/item"
        >
          <div className={`p-2 rounded-xl transition-colors ${isDeleting ? 'bg-white/10' : 'bg-gray-50 group-hover:bg-white/5 group-hover/item:bg-emerald-50'}`}>
            <Phone className={`w-4 h-4 ${isDeleting ? 'text-white' : 'text-emerald-500'}`} />
          </div>
          <div className="flex flex-col">
            <span className={`text-[10px] uppercase tracking-wider font-bold ${isDeleting ? 'text-white/60' : 'text-gray-400 group-hover:text-gray-500'}`}>{t('Phone')}</span>
            <p className={`text-xs transition-colors ${isDeleting ? 'text-white/80' : 'text-gray-600 group-hover:text-gray-300 group-hover/item:text-emerald-600'}`}>
              {user.phone || t('Not provided')}
            </p>
          </div>
        </a>

        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-xl transition-colors ${isDeleting ? 'bg-white/10' : 'bg-gray-50 group-hover:bg-white/5'}`}>
            <Mail className={`w-4 h-4 ${isDeleting ? 'text-white' : 'text-purple-500'}`} />
          </div>
          <div className="flex flex-col">
            <span className={`text-[10px] uppercase tracking-wider font-bold ${isDeleting ? 'text-white/60' : 'text-gray-400 group-hover:text-gray-500'}`}>{t('Email')}</span>
            <p className={`text-xs line-clamp-1 ${isDeleting ? 'text-white/80' : 'text-gray-600 group-hover:text-gray-300'}`}>
              {user.email}
            </p>
          </div>
        </div>
      </div>

      <button
        onClick={() => onEdit(user)}
        disabled={isDeleting}
        className={`w-full py-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-3 group/btn relative overflow-hidden ${
          isDeleting
            ? 'bg-white/10 text-white cursor-not-allowed'
            : 'bg-blue-600/80 hover:bg-black text-white shadow-lg shadow-blue-500/20 active:scale-[0.98]'
        }`}
      >
        <Contact size={18} className={`transition-colors ${isDeleting ? 'text-white' : 'text-white group-hover/btn:text-blue-400'}`} />
        <span className="relative z-10">{isDeleting ? t('Deleting...') : t('Manage profile')}</span>
      </button>
    </motion.div>
  );
};
