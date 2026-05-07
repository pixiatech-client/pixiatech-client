'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, ChevronRight, Users, Shield, Truck, UserCircle, LogIn } from 'lucide-react';
import { toast } from 'sonner';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, where } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';

interface ImpersonationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onImpersonate: (userId: string) => Promise<void>;
  currentUserId?: string;
  userRole?: string;
}

const roleConfig: Record<string, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
  admin: { label: 'Administrateur', color: '#a855f7', bgColor: '#2e1065', icon: Shield },
  fournisseur: { label: 'Fournisseur', color: '#3b82f6', bgColor: '#1e293b', icon: Truck },
  commercial: { label: 'Commercial', color: '#f59e0b', bgColor: '#2a1f00', icon: UserCircle },
};

export function ImpersonationDrawer({ isOpen, onClose, onImpersonate, currentUserId, userRole }: ImpersonationDrawerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRoles, setExpandedRoles] = useState<Set<string>>(new Set(['admin']));
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isImpersonating, setIsImpersonating] = useState(false);

  const firestore = useFirestore();
  const usersQuery = useMemoFirebase(
    () => firestore && isOpen && userRole === 'admin' ? query(collection(firestore, 'users'), orderBy('displayName')) : null,
    [firestore, isOpen, userRole]
  );
  const { data: allUsers } = useCollection<UserProfile>(usersQuery, { suppressPermissionError: true });

  const filteredUsers = allUsers?.filter(u =>
    u.uid !== currentUserId &&
    u.status === 'approved' &&
    (u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     u.email?.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  const usersByRole = filteredUsers.reduce((acc, user) => {
    const role = user.role || 'commercial';
    if (!acc[role]) acc[role] = [];
    acc[role].push(user);
    return acc;
  }, {} as Record<string, UserProfile[]>);

  const toggleRole = (role: string) => {
    const newSet = new Set(expandedRoles);
    if (newSet.has(role)) newSet.delete(role);
    else newSet.add(role);
    setExpandedRoles(newSet);
  };

  const handleImpersonate = async () => {
    if (!selectedUser) return;
    setIsImpersonating(true);
    try {
      await onImpersonate(selectedUser.uid);
      onClose();
    } catch (error) {
      toast.error("Erreur lors de l'impersonation");
    } finally {
      setIsImpersonating(false);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
      setSelectedUser(null);
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-black border-l border-zinc-800 shadow-2xl z-[60] flex flex-col"
          >
            <div className="p-6 border-b border-zinc-800">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Se connecter en tant que</h2>
                <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-xl transition-colors">
                  <X className="w-5 h-5 text-zinc-500" />
                </button>
              </div>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Rechercher un utilisateur..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#95d230]/20 focus:border-[#95d230] text-sm text-white placeholder-zinc-500"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {Object.entries(roleConfig).map(([role, config]) => {
                const users = usersByRole[role] || [];
                const isExpanded = expandedRoles.has(role);
                const Icon = config.icon;

                return (
                  <div key={role} className="rounded-2xl border border-zinc-800 overflow-hidden">
                    <button
                      onClick={() => toggleRole(role)}
                      className="w-full flex items-center justify-between p-4 hover:bg-zinc-900 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: config.bgColor }}
                        >
                          <Icon className="w-4 h-4" style={{ color: config.color }} />
                        </div>
                        <span className="text-sm font-bold text-white">{config.label}</span>
                        <span className="text-xs text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded-full">{users.length}</span>
                      </div>
                      <ChevronRight className={`w-4 h-4 text-zinc-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {isExpanded && users.length > 0 && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-3 space-y-1">
                            {users.map((user) => (
                              <button
                                key={user.uid}
                                onClick={() => setSelectedUser(user)}
                                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                                  selectedUser?.uid === user.uid
                                    ? 'bg-[#95d230]/10 border border-[#95d230]/30'
                                    : 'hover:bg-zinc-900 border border-transparent'
                                }`}
                              >
                                {user.photoURL ? (
                                  <img
                                    src={user.photoURL}
                                    alt={user.displayName}
                                    className="w-9 h-9 rounded-full object-cover"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <div
                                    className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm"
                                    style={{ backgroundColor: config.color }}
                                  >
                                    {user.displayName?.charAt(0)?.toUpperCase() || '?'}
                                  </div>
                                )}
                                <div className="flex-1 min-w-0 text-left">
                                  <div className="text-sm font-semibold text-white truncate">{user.displayName || 'Sans nom'}</div>
                                  <div className="text-xs text-zinc-500 truncate">{user.email}</div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}

              {filteredUsers.length === 0 && (
                <div className="py-12 text-center text-zinc-600">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Aucun utilisateur trouvé</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-zinc-800 space-y-3">
              {selectedUser && (
                <div className="flex items-center gap-3 p-3 bg-zinc-900 rounded-xl border border-zinc-800">
                  {selectedUser.photoURL ? (
                    <img
                      src={selectedUser.photoURL}
                      alt={selectedUser.displayName}
                      className="w-10 h-10 rounded-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-white font-bold">
                      {selectedUser.displayName?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-white">{selectedUser.displayName}</div>
                    <div className="text-xs text-zinc-500">{selectedUser.email}</div>
                  </div>
                </div>
              )}
              <button
                onClick={handleImpersonate}
                disabled={!selectedUser || isImpersonating}
                className="w-full py-4 bg-black hover:bg-zinc-800 text-white border border-zinc-800 hover:border-[#95d230] rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed group"
              >
                <LogIn className="w-4 h-4 group-hover:text-[#95d230] transition-colors" />
                {isImpersonating ? 'Connexion...' : 'Se connecter'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
