'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useUser } from '@/firebase';
import { collection, query, orderBy, where, addDoc, serverTimestamp, onSnapshot, doc, getDocs, updateDoc, limit } from 'firebase/firestore';
import { firestore as db } from '@/firebase/config';
import { UserProfileChat, Chat, Message } from '@/lib/types';
import MiniChat from '@/components/chat/MiniChat';
import ChatWindow from '@/components/chat/ChatWindow';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  isDark?: boolean;
  initialChatId?: string | null;
}

export function ChatPanel({ isOpen, onClose, isDark = false, initialChatId = null }: ChatPanelProps) {
  const { user, userProfile: basicProfile } = useUser();
  const [users, setUsers] = useState<UserProfileChat[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfileChat | null>(null);
  const [pinnedUserIds, setPinnedUserIds] = useState<string[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(initialChatId);
  const [isGuestMode, setIsGuestMode] = useState(false);

  // 1. Fetch Real-time Current User Profile or Handle Guest
  useEffect(() => {
    if (!user?.uid) return;

    const profileRef = doc(db, 'users', user.uid);
    return onSnapshot(profileRef, async (snap) => {
      if (snap.exists()) {
        setCurrentUser({ uid: snap.id, ...snap.data() } as UserProfileChat);
        setPinnedUserIds(snap.data().pinnedUserIds || []);
        setIsGuestMode(false);
      } else if (user.isAnonymous) {
        // Handle Anonymous Guest
        setIsGuestMode(true);
        const guestProfile: UserProfileChat = {
          uid: user.uid,
          email: 'guest@pixiatech.com',
          displayName: 'Visiteur',
          role: 'client',
          status: 'approved',
          createdAt: serverTimestamp(),
          isOnline: true,
          isTyping: false,
          blockedUsers: [],
          mutedUsers: [],
          restrictedContacts: [],
          permissions: {
            canChat: true,
            canBlock: false,
            canDisableNotifications: false,
            canRemoveChat: false
          },
          avatar: isOpen 
            ? "h-14 w-14 rounded-full flex items-center justify-center bg-[#1a1d21] text-white rotate-90 shadow-2xl" 
            : "h-32 w-32 flex items-center justify-center bg-transparent"
        } as UserProfileChat;
        setCurrentUser(guestProfile);
      }
    });
  }, [user]);

  // 2. Fetch All Users (or just Admin for Guests)
  useEffect(() => {
    if (!currentUser) return;
    
    const q = isGuestMode 
      ? query(collection(db, 'users'), where('role', '==', 'admin'), limit(5))
      : collection(db, 'users');

    return onSnapshot(q, (snap) => {
      const u = snap.docs.map(d => ({ uid: d.id, ...d.data() }) as UserProfileChat);
      setUsers(u);
    });
  }, [currentUser, isGuestMode]);

  // 3. Fetch Chats (where current user is a participant)
  useEffect(() => {
    if (!currentUser?.uid) return;
    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', currentUser.uid),
      orderBy('lastMessageAt', 'desc')
    );
    return onSnapshot(q, (snap) => {
      const c = snap.docs.map(d => ({ id: d.id, ...d.data() }) as Chat);
      setChats(c);
      
      // Auto-open discussion if guest and there's a chat
      if (isGuestMode && c.length > 0 && !activeChatId) {
        setActiveChatId(c[0].id);
      }
    });
  }, [currentUser?.uid, isGuestMode]);

  // 4. Auto-start chat with admin for guests
  useEffect(() => {
    if (isGuestMode && users.length > 0 && chats.length === 0 && isOpen && !activeChatId) {
      const admin = users.find(u => u.role === 'admin') || users[0];
      if (admin) {
        onStartChat(admin.uid);
      }
    }
  }, [isGuestMode, users, chats, isOpen]);

  const onStartChat = async (userId: string) => {
    if (!currentUser) return;
    
    const existing = chats.find(c => 
      c.participants.length === 2 && 
      c.participants.includes(userId) && 
      c.participants.includes(currentUser.uid)
    );
    
    if (existing) {
      setActiveChatId(existing.id);
      return existing.id;
    }

    try {
      const docRef = await addDoc(collection(db, 'chats'), {
        participants: [currentUser.uid, userId],
        createdAt: serverTimestamp(),
        lastMessageAt: serverTimestamp(),
        lastMessage: 'Bot Lumi',
        unreadCount: {
          [currentUser.uid]: 0,
          [userId]: 0
        },
        isGroup: false
      });

      // Send automated welcome messages ONLY for guests (Bot Lumi flow)
      if (isGuestMode) {
        const messagesRef = collection(db, 'chats', docRef.id, 'messages');
        
        // Message 1: Welcome
        await addDoc(messagesRef, {
          chatId: docRef.id,
          senderId: userId,
          senderName: 'Bot Lumi',
          senderRole: 'admin',
          content: 'Bonjour ! 👋 Je suis votre assistant pour votre projet d\'écran LED.',
          type: 'text',
          status: 'sent',
          createdAt: serverTimestamp()
        });

        // Message 2: Question with options
        await addDoc(messagesRef, {
          chatId: docRef.id,
          senderId: userId,
          senderName: 'Bot Lumi',
          senderRole: 'admin',
          content: 'Commençons par le début : s\'agit-il d\'un projet de location ou d\'un achat définitif ?',
          type: 'text',
          status: 'sent',
          createdAt: serverTimestamp(),
          options: ['Location', 'Achat'] // Adding options to message
        });

        await updateDoc(doc(db, 'chats', docRef.id), {
          lastMessage: 'Commençons par le début...',
          lastMessageAt: serverTimestamp()
        });
      }

      setActiveChatId(docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  };

  const onChatSelect = (chatId: string | null) => {
    setActiveChatId(chatId);
  };

  const onPinUser = async (userId: string) => {
    if (!currentUser || isGuestMode) return;
    const newPinned = pinnedUserIds.includes(userId)
      ? pinnedUserIds.filter(id => id !== userId)
      : [...pinnedUserIds, userId];
    await updateDoc(doc(db, 'users', currentUser.uid), { pinnedUserIds: newPinned });
  };

  const totalUnreadCount = useMemo(() => {
    if (!currentUser) return 0;
    return chats.reduce((acc, chat) => acc + (chat.unreadCount[currentUser.uid] || 0), 0);
  }, [chats, currentUser]);

  if (!currentUser) return null;

  if (isGuestMode) {
    return (
      <AnimatePresence>
        {isOpen && activeChatId && (
          <div className="fixed inset-0 z-[200] pointer-events-none">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto"
            />
            <motion.div
              initial={{ x: '100%', y: '-50%', opacity: 0 }}
              animate={{ x: 0, y: '-50%', opacity: 1 }}
              exit={{ x: '100%', y: '-50%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 150 }}
              onClick={(e) => e.stopPropagation()}
              className="fixed right-0 md:right-4 top-1/2 md:top-[calc(50%-4vh)] w-full md:w-[450px] h-[100dvh] md:h-[85vh] bg-[#f8f9fb] shadow-2xl z-[210] border border-slate-200 md:rounded-[48px] overflow-hidden pointer-events-auto"
            >
              <ChatWindow 
                chatId={activeChatId} 
                onBack={onClose} 
                currentUser={currentUser}
                onShowAdmin={() => {}}
                onShowInfo={() => {}}
                isMiniChat={false}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    );
  }

  return (
    <MiniChat
      isOpen={isOpen}
      onClose={onClose}
      users={users}
      currentUser={currentUser}
      chats={chats}
      onChatSelect={onChatSelect}
      onStartChat={onStartChat}
      pinnedUserIds={pinnedUserIds}
      onPinUser={onPinUser}
      totalUnreadCount={totalUnreadCount}
      activeChatId={activeChatId}
      buttonPos={{ x: typeof window !== 'undefined' ? window.innerWidth - 80 : 0, y: typeof window !== 'undefined' ? window.innerHeight - 80 : 0 }}
    />
  );
}
