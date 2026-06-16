'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, Search, MessageSquare, Shield, User, Send, Mic, Paperclip, Video, MoreVertical, Ban, ImageIcon, Trash2, ChevronUp, ChevronDown, Mail, Image, FileText, Settings, CheckCircle2, Link2Off } from 'lucide-react';
import { UserProfileChat as UserProfile, Chat, Message } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import ChatWindow from './ChatWindow';
import ContactList from './ContactList';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, updateDoc } from 'firebase/firestore';
import { firestore as db } from '@/firebase/config';
import { getAvatarUrl } from '@/lib/avatar';

interface MiniChatProps {
  isOpen: boolean;
  onClose: () => void;
  users: UserProfile[];
  currentUser: UserProfile;
  chats: Chat[];
  onChatSelect: (chatId: string) => void;
  onStartChat: (userId: string) => Promise<string | undefined>;
  buttonPos: { x: number, y: number };
  pinnedUserIds: string[];
  onPinUser: (userId: string) => void;
  totalUnreadCount: number;
  selectedUserIds?: string[];
  onSelectedUsersChange?: (userIds: string[]) => void;
  onForward?: (msg: Message) => void;
  activeChatId?: string | null;
}

export default function MiniChat({ 
  isOpen, 
  onClose, 
  users, 
  currentUser, 
  chats, 
  onChatSelect, 
  onStartChat, 
  buttonPos, 
  pinnedUserIds, 
  onPinUser, 
  totalUnreadCount, 
  selectedUserIds = [], 
  onSelectedUsersChange,
  onForward, 
  activeChatId: propActiveChatId 
}: MiniChatProps) {
  const { t } = useI18n();
  const [step, setStep] = useState<'contacts' | 'discussion'>('contacts');
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isDeployed, setIsDeployed] = useState(false);
  const [page, setPage] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const chatWindowRef = useRef<HTMLDivElement>(null);
  const itemsPerPage = 9;

  // Sync with prop
  useEffect(() => {
    if (propActiveChatId) {
      setActiveChatId(propActiveChatId);
      setStep('discussion');
    } else if (step === 'discussion') {
      setStep('contacts');
      setActiveChatId(null);
    }
  }, [propActiveChatId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const isOutsideMenu = menuRef.current && !menuRef.current.contains(event.target as Node);
      const isOutsideChat = !chatWindowRef.current || !chatWindowRef.current.contains(event.target as Node);
      
      if (isOutsideMenu && isOutsideChat) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const allContacts = users.filter(u => {
    const isMe = u.uid === currentUser.uid;
    if (isMe) return false;

    if (currentUser.restrictedContacts?.includes(u.uid)) return false;

    if (currentUser.role === 'admin') return true;

    if (u.isIsolated) return false;
    if (currentUser.isIsolated && u.role !== 'admin') return false;

    if (currentUser.role === 'commercial') {
      const isAdmin = u.role === 'admin';
      const isAssignedSupplier = u.role === 'prestataire'
        && !u.adminOnly
        && currentUser.assignedSuppliers?.includes(u.uid);
      return isAdmin || isAssignedSupplier;
    }

    if (currentUser.role === 'prestataire') {
      const isAdmin = u.role === 'admin';
      const isAssignedCommercial = u.role === 'commercial'
        && u.assignedSuppliers?.includes(currentUser.uid);
      return isAdmin || isAssignedCommercial;
    }

    return true;
  });
  // Sort contacts: Unread messages first, then pinned, then alphabetical
  const displayContacts = [...allContacts].sort((a, b) => {
    const chatA = chats.find(c => c.participants.includes(a.uid) && c.participants.includes(currentUser.uid));
    const chatB = chats.find(c => c.participants.includes(b.uid) && c.participants.includes(currentUser.uid));
    
    const unreadA = chatA?.unreadCount[currentUser.uid] || 0;
    const unreadB = chatB?.unreadCount[currentUser.uid] || 0;
    
    // 1. Unread first
    if (unreadA > 0 && unreadB === 0) return -1;
    if (unreadA === 0 && unreadB > 0) return 1;
    
    // 2. Pinned second
    const isPinnedA = pinnedUserIds.includes(a.uid);
    const isPinnedB = pinnedUserIds.includes(b.uid);
    if (isPinnedA && !isPinnedB) return -1;
    if (!isPinnedA && isPinnedB) return 1;
    
    // 3. Alphabetical
    return a.displayName.localeCompare(b.displayName);
  });
  const totalPages = Math.ceil(displayContacts.length / itemsPerPage);
  const currentContacts = displayContacts.slice(page * itemsPerPage, (page + 1) * itemsPerPage);

  // Center vertically on the right side of the screen
  const absoluteY = typeof window !== 'undefined' ? window.innerHeight / 2 : 500;

  // Calculate dynamic height and position to stay within viewport
  const margin = 20;
  const maxMenuHeight = 880;
  const menuHeight = Math.min(maxMenuHeight, window.innerHeight - margin * 2);
  const halfHeight = menuHeight / 2;

  let topOffset = 0;
  if (absoluteY - halfHeight < margin) {
    topOffset = margin - (absoluteY - halfHeight);
  } else if (absoluteY + halfHeight > window.innerHeight - margin) {
    topOffset = (window.innerHeight - margin) - (absoluteY + halfHeight);
  }

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setIsDeployed(true), 100);
      return () => clearTimeout(timer);
    } else {
      setIsDeployed(false);
      setStep('contacts');
      setActiveChatId(null);
    }
  }, [isOpen]);

  const handleSelectContact = async (userId: string) => {
    const chatId = await onStartChat(userId);
    if (chatId) {
      setActiveChatId(chatId);
      setStep('discussion');
      onChatSelect(chatId);
    }
  };

  const handleBack = () => {
    setStep('contacts');
    setActiveChatId(null);
    onChatSelect(null);
  };

  const toggleSelect = (userId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onSelectedUsersChange) return;
    onSelectedUsersChange(
      selectedUserIds.includes(userId) ? selectedUserIds.filter(id => id !== userId) : [...selectedUserIds, userId]
    );
  };

  const handlePairwiseIsolation = async () => {
    if (selectedUserIds.length < 2 || !currentUser) return;
    for (let i = 0; i < selectedUserIds.length; i++) {
      for (let j = i + 1; j < selectedUserIds.length; j++) {
        const userA = users.find(u => u.uid === selectedUserIds[i]);
        const userB = users.find(u => u.uid === selectedUserIds[j]);
        if (userA && userB) {
          const newRestrictedA = userA.restrictedContacts?.includes(selectedUserIds[j])
            ? userA.restrictedContacts.filter(id => id !== selectedUserIds[j])
            : [...(userA.restrictedContacts || []), selectedUserIds[j]];
          await updateDoc(doc(db, 'users', selectedUserIds[i]), { restrictedContacts: newRestrictedA });
          
          const newRestrictedB = userB.restrictedContacts?.includes(selectedUserIds[i])
            ? userB.restrictedContacts.filter(id => id !== selectedUserIds[i])
            : [...(userB.restrictedContacts || []), selectedUserIds[i]];
          await updateDoc(doc(db, 'users', selectedUserIds[j]), { restrictedContacts: newRestrictedB });
        }
      }
    }
    onSelectedUsersChange?.([]);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.6)]';
      case 'prestataire': return 'border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.6)]';
      case 'commercial': return 'border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.6)]';
      default: return 'border-gray-500';
    }
  };

  const getStatusColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-blue-400';
      case 'prestataire': return 'bg-green-400';
      case 'commercial': return 'bg-orange-400';
      default: return 'bg-gray-400';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] pointer-events-none">
          {/* Restored Backdrop with Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto"
          />

          {/* Split Animation Container (Dynamic Position - M1 Menu) */}
          <div 
            ref={menuRef}
            className="absolute pointer-events-auto flex flex-col items-end justify-center"
            style={{ 
              right: typeof window !== 'undefined' && window.innerWidth < 768 ? '16px' : '0', 
              top: absoluteY,
              transform: `translate(0, calc(-50% + ${topOffset}px))`
            }}
          >
            {/* Top Half of Pill */}
            <motion.div
              initial={{ y: 0, opacity: 1 }}
              animate={{ y: isDeployed ? -(menuHeight / 2 - 40) : 0, opacity: isDeployed ? 0 : 1 }}
              transition={{ type: 'spring', damping: 15, stiffness: 200 }}
              className="w-20 h-10 bg-[#0a0b0d] rounded-t-[28px] border-t border-x border-white/5 flex items-center justify-center relative"
            >
              <motion.div
                animate={{ 
                  rotate: isDeployed ? [0, -10, 10, -10, 10, 0] : 0,
                  opacity: isDeployed ? 1 : 0.4
                }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              >
                <Mail size={24} className="text-blue-500" />
              </motion.div>
              
              {/* Notification Badge (Top-Right Overlay) */}
              <AnimatePresence>
                {totalUnreadCount > 0 && (
                  <motion.div 
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="absolute -top-2 -right-2 z-50"
                  >
                    {/* Pulse Effect Layer */}
                    <motion.div 
                      animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                      className="absolute inset-0 bg-blue-500 rounded-full blur-md"
                    />
                    
                    {/* Main Badge */}
                    <motion.div 
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                      className="relative h-9 w-9 bg-blue-600 rounded-full flex items-center justify-center text-sm font-black shadow-[0_4px_20px_rgba(37,99,235,0.8)] border border-blue-400/50 text-white"
                    >
                      {totalUnreadCount}
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Bottom Half of Pill */}
            <motion.div
              initial={{ y: 0, opacity: 1 }}
              animate={{ y: isDeployed ? (menuHeight / 2 - 40) : 0, opacity: isDeployed ? 0 : 1 }}
              transition={{ type: 'spring', damping: 15, stiffness: 200 }}
              className="w-20 h-10 bg-[#0a0b0d] rounded-b-[28px] border-b border-x border-white/5 flex items-center justify-center text-sm font-black text-white relative"
            />

            {/* Main Content (Vertical Pill - Step 04/05) */}
            <motion.div 
              initial={{ height: 80, opacity: 0, scale: 0.8, y: 0 }}
              animate={{ 
                height: isDeployed && step === 'contacts' ? menuHeight : 80, 
                opacity: isDeployed && step === 'contacts' ? 1 : 0,
                scale: isDeployed && step === 'contacts' ? 1 : 0.8,
                y: 0
              }}
              exit={{ height: 80, opacity: 0, scale: 0.8 }}
              transition={{ type: 'spring', damping: 18, stiffness: 250 }}
              className={cn(
                "absolute w-24 bg-[#0a0b0d] rounded-[29px] shadow-[0_0_80px_rgba(0,0,0,0.9)] border border-[#0078ff] flex flex-col items-center pt-6 pb-6 overflow-hidden z-50",
                step === 'discussion' && "pointer-events-none"
              )}
            >
              {/* Retract Button (Step 06 - Handle from Image 2) */}
              <div className="mb-1">
                <button 
                  onClick={onClose}
                  className="w-12 h-1.5 bg-[#333] rounded-full hover:bg-[#444] transition-colors"
                />
              </div>

              {/* Isolation Action Button (MiniChat) */}
              {selectedUserIds.length >= 2 && currentUser.role === 'admin' && (
                <div className="mt-4 px-2 w-full">
                  <button 
                    onClick={handlePairwiseIsolation}
                    className="w-full flex flex-col items-center gap-1 p-2 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 hover:bg-red-500 hover:text-white transition-all group"
                  >
                    <Link2Off size={16} className="group-hover:scale-110 transition-transform" />
                    <span className="text-[7px] font-black uppercase tracking-widest">{t('chat.isolate')} ({selectedUserIds.length})</span>
                  </button>
                </div>
              )}

              {/* Navigation Up Arrow (Image 2) - Centered */}
              <div className="mb-4 p-2 flex justify-center w-full">
                <button 
                  onClick={() => setPage(prev => Math.max(0, prev - 1))}
                  disabled={page === 0}
                  className={cn(
                    "transition-all duration-300",
                    page === 0 ? "opacity-20 cursor-not-allowed" : "text-[#0078ff] hover:scale-125 hover:drop-shadow-[0_0_10px_rgba(0,120,255,0.8)]"
                  )}
                >
                  <ChevronUp size={32} strokeWidth={3} />
                </button>
              </div>

              {/* Contact List (M1 Menu - Pinned First) */}
              <div className="flex-1 w-full px-2 py-4 relative overflow-hidden">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={page}
                    initial={{ y: 40, opacity: 0, filter: 'blur(10px)' }}
                    animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                    exit={{ y: -40, opacity: 0, filter: 'blur(10px)' }}
                    transition={{ type: 'spring', damping: 20, stiffness: 200 }}
                    className="flex flex-col items-center gap-2 h-full no-scrollbar"
                  >
                    {currentContacts.map((contact, index) => {
                      const isPinned = pinnedUserIds.includes(contact.uid);
                      const isBlockedByOther = contact.blockedUsers?.includes(currentUser.uid);
                      const chat = chats.find(c => c.participants.includes(contact.uid) && c.participants.includes(currentUser.uid));
                      const unreadCount = chat?.unreadCount[currentUser.uid] || 0;
                      return (
                        <motion.div
                          key={contact.uid}
                          initial={{ scale: 0.7, opacity: 0, filter: 'blur(15px)', y: 30 }}
                          animate={{ scale: 1, opacity: 1, filter: 'blur(0px)', y: 0 }}
                          transition={{ 
                            delay: index * 0.04,
                            duration: 0.3,
                            type: 'spring',
                            damping: 12
                          }}
                          className="relative group flex-shrink-0"
                        >
                          <button
                            onClick={() => handleSelectContact(contact.uid)}
                            className="relative"
                          >
                            {/* Avatar with Ring (Image 2) - Enlarged */}
                            <div className={cn(
                              "w-16 h-16 rounded-full border-2 p-1 transition-all duration-500",
                              selectedUserIds.includes(contact.uid) ? "border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.8)] scale-110" :
                              currentUser.blockedUsers?.includes(contact.uid) ? "border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.8)]" :
                              isBlockedByOther ? "border-gray-400 shadow-[0_0_20px_rgba(156,163,175,0.8)]" :
                              isPinned ? "border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.8)]" :
                              contact.role === 'admin' ? "border-[#0078ff] shadow-[0_0_15px_rgba(0,120,255,0.4)]" :
                              contact.role === 'prestataire' ? "border-[#a2ff00] shadow-[0_0_15px_rgba(162,255,0,0.4)]" :
                              "border-[#ff8400] shadow-[0_0_15px_rgba(255,132,0,0.4)]"
                            )}>
                              <div className="w-full h-full rounded-full overflow-hidden bg-gray-900 relative">
                                <img 
                                  src={getAvatarUrl(contact.photoURL, contact.role, contact.displayName || '')} 
                                  alt={contact.displayName}
                                  className={cn(
                                    "w-full h-full rounded-full object-cover",
                                    (currentUser.blockedUsers?.includes(contact.uid) || isBlockedByOther) && "grayscale brightness-75",
                                    selectedUserIds.includes(contact.uid) && "brightness-50"
                                  )}
                                  referrerPolicy="no-referrer"
                                />
                                {selectedUserIds.includes(contact.uid) && (
                                  <div className="absolute inset-0 flex items-center justify-center text-blue-500">
                                    <CheckCircle2 size={24} strokeWidth={3} />
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Selection Toggle (Small Circle) */}
                            {currentUser.role === 'admin' && (
                              <button
                                onClick={(e) => toggleSelect(contact.uid, e)}
                                className={cn(
                                  "absolute -top-1 -left-1 h-6 w-6 rounded-full border-2 border-[#0a0b0d] z-20 flex items-center justify-center transition-all",
                                  selectedUserIds.includes(contact.uid) ? "bg-blue-500 scale-110" : "bg-white/10 opacity-0 group-hover:opacity-100"
                                )}
                              >
                                {selectedUserIds.includes(contact.uid) ? <CheckCircle2 size={12} className="text-white" /> : <div className="h-2 w-2 rounded-full bg-white/40" />}
                              </button>
                            )}

                            {/* Status Dot (Image 2 - Bottom Right) */}
                            {(contact.isOnline || unreadCount > 0) && !currentUser.blockedUsers?.includes(contact.uid) && !isBlockedByOther && (
                              <div className={cn(
                                "absolute bottom-0 right-0 rounded-full border-2 border-[#0a0b0d] z-10 flex items-center justify-center text-[9px] font-black text-white transition-all",
                                unreadCount > 0 
                                  ? (contact.isOnline ? "bg-[#a2ff00] h-5 w-5" : "bg-black h-5 w-5")
                                  : (isPinned ? "bg-purple-500 h-4 w-4" :
                                    contact.role === 'admin' ? "bg-[#0078ff] h-4 w-4" :
                                    contact.role === 'prestataire' ? "bg-[#a2ff00] h-4 w-4" :
                                    "bg-[#ff8400] h-4 w-4")
                              )}>
                                {unreadCount > 0 && unreadCount}
                              </div>
                            )}

                            {/* Pin Indicator Overlay */}
                            {isPinned && (
                              <div className="absolute -top-1 -right-1 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center border-2 border-[#0a0b0d] z-20">
                                <Paperclip size={12} className="text-white rotate-45" />
                              </div>
                            )}
                          </button>

                          {/* Pin Action Button (Hover Effect) */}
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              onPinUser(contact.uid);
                            }}
                            className={cn(
                              "absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all z-30 border border-white/5",
                              isPinned 
                                ? "bg-purple-600 text-white opacity-100 hover:bg-red-500 group-hover:scale-110" 
                                : "bg-white/10 hover:bg-[#0078ff] text-white opacity-0 group-hover:opacity-100"
                            )}
                          >
                            <div className="relative">
                              <Paperclip size={14} className={cn("rotate-45 transition-all", isPinned && "group-hover:opacity-0")} />
                              {isPinned && (
                                <X size={14} className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all text-white" />
                              )}
                            </div>
                          </button>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Navigation Down Arrow (Image 2) - Centered */}
              <div className="mt-4 p-2 flex justify-center w-full">
                <button 
                  onClick={() => setPage(prev => Math.min(totalPages - 1, prev + 1))}
                  disabled={page === totalPages - 1}
                  className={cn(
                    "transition-all duration-300",
                    page === totalPages - 1 ? "opacity-20 cursor-not-allowed" : "text-[#0078ff] hover:scale-125 hover:drop-shadow-[0_0_10px_rgba(0,120,255,0.8)]"
                  )}
                >
                  <ChevronDown size={32} strokeWidth={3} />
                </button>
              </div>
            </motion.div>
          </div>

          {/* Chat Window Overlay (Slides from right - Step 07) */}
          <AnimatePresence>
            {step === 'discussion' && activeChatId && (
              <motion.div
                ref={chatWindowRef}
                initial={{ x: '100%', y: '-50%', opacity: 0 }}
                animate={{ x: 0, y: '-50%', opacity: 1 }}
                exit={{ x: '100%', y: '-50%', opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 150 }}
                onClick={(e) => e.stopPropagation()}
                className="fixed right-0 md:right-4 top-1/2 -translate-y-1/2 w-full md:w-[450px] h-[100dvh] md:h-[85vh] bg-[#0f1113] shadow-[0_0_80px_rgba(0,0,0,0.9)] z-[210] border border-white/10 md:rounded-[48px] overflow-hidden pointer-events-auto"
              >
                <ChatWindow 
                  chatId={activeChatId} 
                  onBack={handleBack} 
                  currentUser={currentUser}
                  onShowAdmin={() => {}}
                  onShowInfo={() => {}}
                  isMiniChat
                  pinnedUserIds={pinnedUserIds}
                  onPinUser={onPinUser}
                  selectedUserIds={selectedUserIds}
                  onForward={onForward}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </AnimatePresence>
  );
}
