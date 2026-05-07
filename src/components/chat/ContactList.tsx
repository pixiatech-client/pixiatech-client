'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, User, Shield, MessageSquare, MoreVertical, Ban, BellOff, Trash2, CheckCircle2, UserX, EyeOff, Link2Off, X, Calendar, Info, Edit3, Eye, MessageCircle, UserMinus, Pin } from 'lucide-react';
import { UserProfileChat as UserProfile } from '@/lib/types';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { firestore as db } from '@/firebase/config';
import { useMediaQuery } from '@/hooks/use-media-query';

interface ContactListProps {
  users: UserProfile[];
  onSelectContact: (userId: string) => void;
  currentUser: UserProfile;
  isMiniChat?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  selectedUsers?: string[];
  onSelectedUsersChange?: (userIds: string[]) => void;
  activeChatId?: string | null;
  buttonPos?: { x: number, y: number };
}

export default function ContactList({ 
  users, 
  onSelectContact, 
  currentUser, 
  isMiniChat, 
  isCollapsed, 
  onToggleCollapse,
  selectedUsers = [],
  onSelectedUsersChange,
  activeChatId,
  buttonPos
}: ContactListProps) {
  const isMobile = useMediaQuery('(max-width: 1024px)');
  const [searchQuery, setSearchQuery] = useState('');
  const [contextMenuUser, setContextMenuUser] = useState<string | null>(null);
  const [selectedExclusionUserId, setSelectedExclusionUserId] = useState<string | null>(null);
  const [editingReasonId, setEditingReasonId] = useState<string | null>(null);
  const [activeSwipeId, setActiveSwipeId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (activeSwipeId) setActiveSwipeId(null);
    };
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', handleScroll);
      return () => el.removeEventListener('scroll', handleScroll);
    }
  }, [activeSwipeId]);

  useEffect(() => {
    if (activeChatId) {
      setSelectedExclusionUserId(null);
    }
  }, [activeChatId]);

  const selectedExclusionUser = users.find(u => u.uid === selectedExclusionUserId);

  const filteredUsers = users.filter(u => {
    const isMe = u.uid === currentUser.uid;
    const matchesSearch = u.displayName.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (currentUser.role === 'commercial' && u.role === 'prestataire' && u.adminOnly) return false;
    if (currentUser.role === 'prestataire' && currentUser.adminOnly && u.role !== 'admin') return false;
    if (currentUser.restrictedContacts?.includes(u.uid)) return false;
    
     if (currentUser.role === 'admin') {
       // Admin sees all users
       return !isMe && matchesSearch;
     }

     // Non-admin isolation checks
     if (currentUser.isIsolated && u.role !== 'admin') return false;
     if (u.isIsolated) return false;

     return !isMe && matchesSearch;
  });

  const groupedUsers = filteredUsers.reduce((acc, user) => {
    let role = user.role || 'autre';
    if (role === 'fournisseur') role = 'prestataire';
    if (!acc[role]) acc[role] = [];
    acc[role].push(user);
    return acc;
  }, {} as Record<string, UserProfile[]>);

  const roleLabels: Record<string, string> = {
    admin: 'Administrateurs',
    prestataire: 'Fournisseurs',
    commercial: 'Commerciaux',
    autre: 'Autres',
    fournisseur: 'Fournisseurs'
  };

  const roleOrder = ['admin', 'prestataire', 'commercial', 'autre'];

  const toggleSelect = (userId: string, e?: React.MouseEvent) => {
    if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
    if (!onSelectedUsersChange) return;
    onSelectedUsersChange(
      selectedUsers.includes(userId) ? selectedUsers.filter(id => id !== userId) : [...selectedUsers, userId]
    );
  };

  const handleAction = async (action: string, userId: string) => {
    const target = users.find(u => u.uid === userId);
    if (!target) return;

    if (action === 'block') {
      const newBlockedUsers = currentUser.blockedUsers?.includes(userId)
        ? currentUser.blockedUsers.filter(id => id !== userId)
        : [...(currentUser.blockedUsers || []), userId];
      await updateDoc(doc(db, 'users', currentUser.uid), { blockedUsers: newBlockedUsers });
    } else if (action === 'revoke') {
      const newPermissions = { ...target.permissions, canChat: !target.permissions?.canChat };
      await updateDoc(doc(db, 'users', userId), { permissions: newPermissions });
    } else if (action === 'identification') {
      await updateDoc(doc(db, 'users', userId), { identificationBlocked: !target.identificationBlocked });
    } else if (action === 'adminOnly') {
      await updateDoc(doc(db, 'users', userId), { adminOnly: !target.adminOnly });
    } else if (action === 'isolation') {
      await updateDoc(doc(db, 'users', userId), { isIsolated: !target.isIsolated });
    } else if (action === 'notifications') {
      await updateDoc(doc(db, 'users', userId), { notificationsBlocked: !target.notificationsBlocked });
    } else if (action === 'clear_restrictions') {
      await updateDoc(doc(db, 'users', userId), { restrictedContacts: [], exclusionMetadata: {} });
    } else if (action === 'pairwise_isolation') {
      if (selectedUsers.length < 2) return;
      for (let i = 0; i < selectedUsers.length; i++) {
        for (let j = i + 1; j < selectedUsers.length; j++) {
          const userA = users.find(u => u.uid === selectedUsers[i]);
          const userB = users.find(u => u.uid === selectedUsers[j]);
          if (userA && userB) {
            const newRestrictedA = userA.restrictedContacts?.includes(selectedUsers[j])
              ? userA.restrictedContacts.filter(id => id !== selectedUsers[j])
              : [...(userA.restrictedContacts || []), selectedUsers[j]];
            await updateDoc(doc(db, 'users', selectedUsers[i]), { restrictedContacts: newRestrictedA });
            
            const newRestrictedB = userB.restrictedContacts?.includes(selectedUsers[i])
              ? userB.restrictedContacts.filter(id => id !== selectedUsers[i])
              : [...(userB.restrictedContacts || []), selectedUsers[i]];
            await updateDoc(doc(db, 'users', selectedUsers[j]), { restrictedContacts: newRestrictedB });
          }
        }
      }
      onSelectedUsersChange?.([]);
    } else if (action === 'annoying') {
      await updateDoc(doc(db, 'users', userId), { isAnnoying: !target.isAnnoying });
    } else if (action === 'discussion') {
      await updateDoc(doc(db, 'users', userId), { isInDiscussion: !target.isInDiscussion });
    } else if (action === 'pin') {
      const currentPinned = currentUser.pinnedUserIds || [];
      const newPinned = currentPinned.includes(userId) ? currentPinned.filter(id => id !== userId) : [...currentPinned, userId];
      await updateDoc(doc(db, 'users', currentUser.uid), { pinnedUserIds: newPinned });
    }
    setContextMenuUser(null);
  };

  const updateExclusionMetadata = async (targetId: string, metadata: { reason?: string, isPublic?: boolean }) => {
    if (!selectedExclusionUserId) return;
    const user = users.find(u => u.uid === selectedExclusionUserId);
    if (!user) return;
    const exclusionMetadata = { ...user.exclusionMetadata } as any;
    exclusionMetadata[targetId] = { ...exclusionMetadata[targetId], ...metadata };
    await updateDoc(doc(db, 'users', selectedExclusionUserId), { exclusionMetadata });
  };

  return (
    <div className={cn(
      "h-full flex flex-col transition-all duration-500 relative overflow-hidden",
      isMiniChat ? "bg-[#0f1113] text-white" : "w-full bg-white border-l border-gray-100"
    )}>
      {!isMiniChat && onToggleCollapse && (
        <button 
          onClick={onToggleCollapse}
          className="absolute -left-5 top-1/2 -translate-y-1/2 z-50 h-10 w-10 bg-white border border-gray-100 rounded-xl shadow-lg flex items-center justify-center text-gray-400 hover:text-blue-500 transition-all hover:scale-110"
        >
          <motion.div animate={{ rotate: isCollapsed ? 180 : 0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </motion.div>
        </button>
      )}

      <div className={cn(
        "p-6 border-b transition-all duration-500 flex-shrink-0", 
        isMiniChat ? "border-white/5" : "border-gray-50",
        isCollapsed && "px-2 items-center flex flex-col"
      )}>
        {!isCollapsed ? (
          <>
            {(selectedUsers.length > 0 || !isMobile) && (
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-4xl font-black tracking-tighter text-[#15bcd7]">
                  {selectedUsers.length > 0 ? selectedUsers.length : "Annuaire"}
                </h1>
                <div className="flex items-center gap-3">
                  {selectedUsers.length >= 2 && currentUser.role === 'admin' && (
                    <button 
                      onClick={() => handleAction('pairwise_isolation', '')}
                      className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-500/10"
                    >
                      <Link2Off size={14} className="shrink-0" /> <span className={cn(isMobile && "hidden")}>Isoler entre eux</span>
                    </button>
                  )}
                  {selectedUsers.length > 0 && (
                    <button 
                      onClick={() => onSelectedUsersChange?.([])}
                      className="text-[10px] font-black text-blue-500 hover:text-blue-400 uppercase tracking-widest"
                    >
                      {isMobile ? "Annuler" : "Tout désélectionner"}
                    </button>
                  )}
                </div>
              </div>
            )}
            
            {!isMobile && (
              <div className="flex items-center gap-2">
                <div className="flex-1 relative group">
                  <input
                    type="text"
                    placeholder="Rechercher un contact..."
                    className={cn(
                      "w-full rounded-2xl py-3 px-5 text-sm outline-none border transition-all shadow-sm placeholder:text-gray-300 font-medium",
                      isMiniChat ? "bg-white/5 border-transparent focus:border-blue-500/20 text-white" : "bg-white border-transparent focus:border-blue-500/30 text-[#1a1d21]"
                    )}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <button className={cn(
                  "h-11 w-11 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-black/10 hover:scale-105 active:scale-95 transition-all flex-shrink-0",
                  isMiniChat ? "bg-white/10" : "bg-[#1a1d21]"
                )}>
                  <Search size={18} />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="h-10 flex items-center justify-center"><Search size={20} className="text-gray-400" /></div>
        )}
      </div>

      <div 
        ref={scrollRef}
        className={cn(
          "flex-1 overflow-y-auto p-4 md:p-6 lg:pb-6 custom-scrollbar space-y-6 min-h-0",
          isMobile ? "pb-6" : "pb-24",
          isCollapsed && "px-2"
        )}
      >
        <AnimatePresence>
          {roleOrder.map(role => {
            const usersInRole = groupedUsers[role];
            if (!usersInRole || usersInRole.length === 0) return null;
            return (
              <div key={role} className="space-y-2">
                {!isCollapsed && (
                  <div className="px-4 flex items-center gap-2">
                    <div className={cn("h-1.5 w-1.5 rounded-full", role === 'admin' ? "bg-blue-500" : role === 'prestataire' ? "bg-green-500" : "bg-orange-500")} />
                    <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{roleLabels[role]}</h2>
                    <div className="flex-1 h-[1px] bg-gray-100 ml-2" />
                  </div>
                )}
                <div className="space-y-2">
                  {usersInRole.map((user) => (
                    <React.Fragment key={user.uid}>
                      <ContactItem 
                        user={user} 
                        currentUser={currentUser}
                        isSelected={selectedUsers.includes(user.uid)}
                        onSelect={() => selectedUsers.length === 0 ? onSelectContact(user.uid) : toggleSelect(user.uid, {} as any)}
                        toggleSelect={toggleSelect}
                        onContextMenu={(e: any) => {
                          if (currentUser.role === 'admin') {
                            e.preventDefault();
                            setContextMenuUser(user.uid);
                          }
                        }}
                        isMiniChat={isMiniChat}
                        isCollapsed={isCollapsed}
                        selectedUsers={selectedUsers}
                        setContextMenuUser={setContextMenuUser}
                      />
                      <AnimatePresence>
                        {contextMenuUser === user.uid && (
                          <>
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[120]" onClick={() => setContextMenuUser(null)} />
                            <motion.div
                              drag={isMobile ? "y" : false}
                              dragConstraints={{ top: 0, bottom: 0 }}
                              dragElastic={0.1}
                              onDragEnd={(_, info) => {
                                if (isMobile && info.offset.y > 100) {
                                  setContextMenuUser(null);
                                }
                              }}
                              initial={isMobile ? { y: '100%' } : { opacity: 0, scale: 0.9, y: -10 }}
                              animate={isMobile ? { y: 0 } : { opacity: 1, scale: 1, y: 0 }}
                              exit={isMobile ? { y: '100%' } : { opacity: 0, scale: 0.9, y: -10 }}
                              transition={{ type: "spring", damping: 25, stiffness: 300 }}
                              className={cn(
                                "z-[130] bg-[#1a1d21] border border-white/10 shadow-2xl overflow-hidden p-2",
                                isMobile 
                                  ? "fixed bottom-0 left-0 right-0 rounded-t-[40px] p-8 pb-12" 
                                  : "absolute right-4 top-16 w-64 rounded-xl"
                              )}
                            >
                              {isMobile && (
                                <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-8 cursor-grab active:cursor-grabbing" />
                              )}
                              
                              <button onClick={() => handleAction('annoying', user.uid)} className="w-full flex items-center gap-4 p-4 rounded-2xl transition-all text-base font-bold text-gray-300 hover:bg-white/5">
                                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                                  <UserMinus size={22} />
                                </div>
                                <span>{user.isAnnoying ? "Désactiver Ne pas déranger" : "Ne pas déranger"}</span>
                              </button>

                              <button onClick={() => handleAction('discussion', user.uid)} className="w-full flex items-center gap-4 p-4 rounded-2xl transition-all text-base font-bold text-gray-300 hover:bg-white/5">
                                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                                  <MessageCircle size={22} />
                                </div>
                                <span>{user.isInDiscussion ? "Quitter la discussion" : "En discussion"}</span>
                              </button>

                              <button onClick={() => handleAction('block', user.uid)} className="w-full flex items-center gap-4 p-4 rounded-2xl text-[#ff3b3b] hover:bg-red-500/10 transition-all text-base font-bold">
                                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                                  <Ban size={22} className="text-[#ff3b3b]" />
                                </div>
                                <span>Bloquer le contact</span>
                              </button>
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

function SwipeableContact({ user, currentUser, isSelected, onSelect, toggleSelect, onContextMenu, handleAction, isMobile, isOpen, onSwipeOpen, isMiniChat, isCollapsed, selectedUsers, setContextMenuUser }: any) {
  const controls = useAnimation();
  
  useEffect(() => {
    if (!isOpen) {
      controls.start({ x: 0 });
    }
  }, [isOpen, controls]);

  if (!isMobile) {
    return <ContactItem user={user} currentUser={currentUser} isSelected={isSelected} onSelect={onSelect} toggleSelect={toggleSelect} onContextMenu={onContextMenu} isMiniChat={isMiniChat} isCollapsed={isCollapsed} selectedUsers={selectedUsers} setContextMenuUser={setContextMenuUser} />;
  }

  return (
    <div className="relative overflow-hidden rounded-2xl group mb-2">
      <div className="absolute inset-y-0 right-0 flex items-center rounded-r-2xl overflow-hidden">
        <button 
          onClick={(e) => { 
            e.stopPropagation(); 
            handleAction('pin', user.uid); 
            controls.start({ x: 0 });
          }} 
          className={cn(
            "h-full px-6 flex items-center justify-center transition-all", 
            currentUser.pinnedUserIds?.includes(user.uid) ? "bg-amber-500 text-white" : "bg-blue-600 text-white"
          )}
        >
          <Pin size={24} strokeWidth={2.5} className={cn(currentUser.pinnedUserIds?.includes(user.uid) && "fill-current")} />
        </button>
        <button 
          onClick={(e) => { 
            e.stopPropagation(); 
            handleAction('revoke', user.uid); 
            controls.start({ x: 0 });
          }} 
          className="h-full px-6 bg-red-600 flex items-center justify-center text-white"
        >
          <Trash2 size={24} strokeWidth={2.5} />
        </button>
      </div>
      <motion.div
        drag="x"
        animate={controls}
        dragConstraints={{ left: -140, right: 0 }}
        dragElastic={0.05}
        onDragStart={() => onSwipeOpen()}
        onDragEnd={(_, info) => { 
          if (info.offset.x > -70) {
            controls.start({ x: 0 });
          }
        }}
        className="relative z-10 bg-white"
      >
        <ContactItem user={user} currentUser={currentUser} isSelected={isSelected} onSelect={onSelect} toggleSelect={toggleSelect} onContextMenu={onContextMenu} isMiniChat={isMiniChat} isCollapsed={isCollapsed} selectedUsers={selectedUsers} setContextMenuUser={setContextMenuUser} />
      </motion.div>
    </div>
  );
}

function ContactItem({ user, currentUser, isMiniChat, isCollapsed, selectedUsers, onSelect, toggleSelect, contextMenuUser, setContextMenuUser }: any) {
  return (
    <div
      onClick={onSelect}
      onContextMenu={(e) => {
        if (currentUser.role === 'admin') {
          e.preventDefault();
          setContextMenuUser(user.uid);
        }
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        "w-full flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-[24px] md:rounded-3xl transition-all group text-left border relative overflow-hidden cursor-pointer",
        "hover:bg-black border-transparent hover:border-white/20",
        selectedUsers.includes(user.uid) && (isMiniChat ? "bg-blue-500/10 border-blue-500/30" : "bg-blue-50 border-blue-500/20"),
        isCollapsed && "p-2 justify-center"
      )}
    >
      {!isCollapsed && (
        <div 
          onClick={(e) => toggleSelect(user.uid, e)}
          className={cn(
            "h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all",
            selectedUsers.includes(user.uid) 
              ? "bg-blue-600 border-blue-600 text-white" 
              : isMiniChat ? "border-white/10" : "border-gray-200"
          )}
        >
          {selectedUsers.includes(user.uid) && <CheckCircle2 size={14} />}
        </div>
      )}

      <div className="relative">
        <div className={cn(
          "h-12 w-12 md:h-14 md:w-14 rounded-full border-2 p-0.5 transition-all duration-300 group-hover:scale-110",
          currentUser.blockedUsers?.includes(user.uid) ? "border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]" :
          user.blockedUsers?.includes(currentUser.uid) ? "border-gray-400 shadow-[0_0_10px_rgba(156,163,175,0.4)]" :
          user.role === 'admin' ? "border-[#0078ff] shadow-[0_0_10px_rgba(0,120,255,0.4)]" :
          user.role === 'prestataire' ? "border-[#a2ff00] shadow-[0_0_10px_rgba(162,255,0,0.4)]" :
          "border-[#ff8400] shadow-[0_0_10px_rgba(255,132,0,0.4)]",
          isCollapsed && "h-10 w-10"
        )}>
          <img 
            src={user.photoURL} 
            alt="" 
            className={cn(
              "h-full w-full rounded-full object-cover",
              (currentUser.blockedUsers?.includes(user.uid) || user.blockedUsers?.includes(currentUser.uid)) && "grayscale brightness-75"
            )} 
            referrerPolicy="no-referrer" 
          />
        </div>
        {user.isOnline && !currentUser.blockedUsers?.includes(user.uid) && !user.blockedUsers?.includes(currentUser.uid) && (
          <div className={cn(
            "absolute -top-1 -right-1 h-4 w-4 rounded-full border-2 border-[#0f1113] shadow-[0_0_10px_rgba(0,0,0,0.5)]",
            user.role === 'admin' ? "bg-[#0078ff]" :
            user.role === 'prestataire' ? "bg-[#a2ff00]" :
            "bg-[#ff8400]"
          )}>
            <div className="absolute inset-0 rounded-full animate-ping opacity-75 bg-inherit" />
          </div>
        )}
      </div>
      
      {!isCollapsed && (
        <>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className={cn(
                  "text-sm font-bold transition-colors", 
                  isMiniChat ? "text-white" : "text-[#1a1d21]",
                  "group-hover:text-white",
                  currentUser.blockedUsers?.includes(user.uid) && "text-red-500",
                  user.blockedUsers?.includes(currentUser.uid) && "text-gray-400"
                )}>{user.displayName}</p>
                {user.role === 'admin' && <Shield size={12} className="text-[#0078ff]" />}
                {user.adminOnly && <Shield size={12} className="text-purple-500" />}
                {user.isIsolated && <EyeOff size={12} className="text-red-500" />}
                {user.blockedUsers?.includes(currentUser.uid) && (
                  <div className="flex items-center gap-1 px-1.5 py-0.5 bg-gray-500/10 border border-gray-500/20 rounded-full">
                    <Shield size={8} className="text-gray-500" />
                    <span className="text-[7px] font-black uppercase text-gray-500 tracking-wider">Bloqué</span>
                  </div>
                )}
                {user.isAnnoying && <div className="h-1.5 w-1.5 rounded-full bg-red-500" />}
                {user.isInDiscussion && <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />}
              </div>
              <div className="flex items-center gap-2">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest group-hover:text-gray-400 transition-colors">{user.role}</p>
              </div>
            </div>

          {currentUser.role === 'admin' && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setContextMenuUser(contextMenuUser === user.uid ? null : user.uid);
              }}
              className="p-2 text-gray-500 hover:text-white transition-colors"
            >
              <MoreVertical size={18} />
            </button>
          )}
        </>
      )}
    </div>
  );
}