import React from 'react';
import { Star, Clock, Calendar, MessageSquare, Bookmark, MoreHorizontal, Phone, Mail, User as UserIcon, Contact, Trash2, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, UserStatus } from './types';
import { RoleBadge } from './RoleBadge';
import { StatusBadge } from './StatusBadge';

interface UserCardProps {
  user: User;
  onEdit: (user: User) => void;
  onDelete: (id: string) => void;
  onApprove: (id: string) => void;
  onSuspend: (id: string) => void;
  onChangeRole: (user: User) => void;
  isDeleting?: boolean;
}

export const UserCard: React.FC<UserCardProps> = ({
  user,
  onEdit,
  onDelete,
  onApprove,
  onSuspend,
  onChangeRole,
  isDeleting = false,
}) => {
  const [isConfirmingDelete, setIsConfirmingDelete] = React.useState(false);

  return (
    <motion.div
      layout
      whileHover={!isDeleting && !isConfirmingDelete ? { y: -5 } : {}}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={isDeleting
        ? { x: -100, opacity: 0, scale: 0.8 }
        : { x: 0, opacity: 1, scale: 1 }
      }
      transition={{ duration: 0.4, ease: "easeInOut" }}
      className={`group relative w-full max-w-sm rounded-[32px] p-5 transition-all duration-500 shadow-sm overflow-hidden border ${
        isDeleting || isConfirmingDelete
          ? "bg-[#ff2d55] border-[#ff2d55] shadow-2xl shadow-rose-500/40"
          : "bg-white hover:bg-[#141414] border-gray-100 hover:border-white/10 hover:shadow-2xl"
      }`}
    >
      {/* Deleting Overlay */}
      {isDeleting && (
        <div className="absolute inset-0 z-50 bg-[#ff2d55] flex flex-col items-center justify-center text-white p-6 text-center animate-in fade-in duration-300">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
            <AlertTriangle size={32} />
          </div>
          <h3 className="text-lg font-bold mb-1">Suppression...</h3>
          <p className="text-xs opacity-70">Action irréversible</p>
        </div>
      )}

      {/* Confirmation Overlay (Image 3) */}
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

            <h3 className="text-xl font-black uppercase tracking-tighter mb-2">Supprimer l'utilisateur ?</h3>
            <p className="text-xs font-medium opacity-90 leading-relaxed mb-8 px-4">
              Êtes-vous sûr de vouloir supprimer <span className="font-bold">"{user.name}"</span> ? Cette action est irréversible.
            </p>

            <div className="flex gap-3 w-full">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsConfirmingDelete(false);
                }}
                className="flex-1 py-3.5 bg-[#ff2d55] border-2 border-white/30 hover:bg-white/10 text-white rounded-2xl font-bold text-sm transition-all active:scale-[0.98]"
              >
                Annuler
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(user.id);
                  setIsConfirmingDelete(false);
                }}
                className="flex-1 py-3.5 bg-black text-white rounded-2xl font-bold text-sm transition-all shadow-xl shadow-black/20 active:scale-[0.98]"
              >
                Supprimer
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Image Area */}
      <div className="relative h-32 w-full rounded-2xl overflow-hidden mb-12">
        {user.backgroundImage ? (
          <img
            src={user.backgroundImage}
            alt="background"
            className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

        {/* Status Badge - Bottom Right of Header */}
        <div className="absolute bottom-3 right-3 z-20">
          <StatusBadge status={user.status} variant="glass" />
        </div>

        {/* Delete Button - Top Right */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsConfirmingDelete(true);
          }}
          className="absolute top-3 right-3 z-30 p-2 bg-white/20 hover:bg-rose-500 backdrop-blur-md rounded-xl text-white transition-all opacity-0 group-hover:opacity-100"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Avatar - Overlapping */}
      <div className="absolute top-[100px] left-8">
        <div className="relative">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="w-16 h-16 rounded-full border-4 border-white group-hover:border-[#141414] transition-colors object-cover shadow-lg"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-16 h-16 rounded-full border-4 border-white group-hover:border-[#141414] transition-colors bg-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
              {user.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
          )}
          <div className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-white group-hover:border-[#141414] rounded-full transition-colors" />
        </div>
      </div>

      {/* Bookmark Icon */}
      <button className="absolute top-[170px] right-8 p-2.5 bg-gray-50 group-hover:bg-white/5 group-hover:hover:bg-white/10 rounded-full text-gray-400 hover:text-gray-600 group-hover:hover:text-white transition-all">
        <Bookmark className="w-5 h-5" />
      </button>

      {/* Content */}
      <div className="mt-2 mb-6 flex flex-col gap-1">
        <h3 className={`text-xl font-bold transition-colors ${isDeleting ? "text-white" : "text-gray-900 group-hover:text-white"}`}>
          {user.name}
        </h3>
        <div className="flex">
          <RoleBadge role={user.role} />
        </div>
      </div>

      {/* Info Grid (Image 3) */}
      <div className="grid grid-cols-1 gap-3 mb-8">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-xl transition-colors ${isDeleting ? "bg-white/10" : "bg-gray-50 group-hover:bg-white/5"}`}>
            <MessageSquare className={`w-4 h-4 ${isDeleting ? "text-white" : "text-blue-500"}`} />
          </div>
          <div className="flex flex-col">
            <span className={`text-[10px] uppercase tracking-wider font-bold ${isDeleting ? "text-white/60" : "text-gray-400 group-hover:text-gray-500"}`}>Description</span>
            <p className={`text-xs line-clamp-1 ${isDeleting ? "text-white/80" : "text-gray-600 group-hover:text-gray-300"}`}>
              {user.description || "Aucune description fournie."}
            </p>
          </div>
        </div>

        <a
          href={`tel:${user.phone}`}
          onClick={(e) => e.stopPropagation()}
          className="flex items-start gap-3 group/item"
        >
          <div className={`p-2 rounded-xl transition-colors ${isDeleting ? "bg-white/10" : "bg-gray-50 group-hover:bg-white/5 group-hover/item:bg-emerald-50"}`}>
            <Phone className={`w-4 h-4 ${isDeleting ? "text-white" : "text-emerald-500"}`} />
          </div>
          <div className="flex flex-col">
            <span className={`text-[10px] uppercase tracking-wider font-bold ${isDeleting ? "text-white/60" : "text-gray-400 group-hover:text-gray-500"}`}>Numéro de téléphone</span>
            <p className={`text-xs transition-colors ${isDeleting ? "text-white/80" : "text-gray-600 group-hover:text-gray-300 group-hover/item:text-emerald-600"}`}>
              {user.phone || "Non renseigné"}
            </p>
          </div>
        </a>

        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-xl transition-colors ${isDeleting ? "bg-white/10" : "bg-gray-50 group-hover:bg-white/5"}`}>
            <Mail className={`w-4 h-4 ${isDeleting ? "text-white" : "text-purple-500"}`} />
          </div>
          <div className="flex flex-col">
            <span className={`text-[10px] uppercase tracking-wider font-bold ${isDeleting ? "text-white/60" : "text-gray-400 group-hover:text-gray-500"}`}>Email</span>
            <p className={`text-xs line-clamp-1 ${isDeleting ? "text-white/80" : "text-gray-600 group-hover:text-gray-300"}`}>
              {user.email}
            </p>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={() => onEdit(user)}
        disabled={isDeleting}
        className={`w-full py-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-3 group/btn relative overflow-hidden backdrop-blur-md ${
          isDeleting
            ? "bg-white/10 text-white cursor-not-allowed"
            : "bg-blue-600/80 hover:bg-black text-white shadow-lg shadow-blue-500/20 active:scale-[0.98]"
        }`}
      >
        <Contact size={18} className={`transition-colors ${isDeleting ? "text-white" : "text-white group-hover/btn:text-blue-400"}`} />
        <span className="relative z-10">{isDeleting ? "Suppression..." : "Gérer le profil"}</span>
      </button>
    </motion.div>
  );
};

const CheckCircleIcon = ({ size, color }: { size: number; color: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
