'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useUser } from '@/firebase';
import { collection, query, where, orderBy, onSnapshot, doc, addDoc, serverTimestamp, getDoc, updateDoc } from 'firebase/firestore';
import { firestore as db } from '@/firebase/config';
import { UserProfileChat, Chat, Message } from '@/lib/types';
import ChatList from '@/components/chat/ChatList';
import ChatWindow from '@/components/chat/ChatWindow';
import ContactList from '@/components/chat/ContactList';
import { MessageSquare, Shield, LogOut, Users } from 'lucide-react';
import { useAdminT } from '@/hooks/useAdminT';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import MiniChat from '@/components/chat/MiniChat';
import { useMediaQuery } from '@/hooks/use-media-query';

export default function MessagesPage() {
  const { userProfile: basicProfile } = useUser();
  const [user, setUser] = useState<UserProfileChat | null>(null);
  const [allUsers, setAllUsers] = useState<UserProfileChat[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isContactsCollapsed, setIsContactsCollapsed] = useState(false);
  const [contactListWidth, setContactListWidth] = useState(384);
  const [isResizing, setIsResizing] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState<'discussions' | 'annuaire' | 'chat'>('discussions');
  const [isMiniChatOpen, setIsMiniChatOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 1024px)');
  const { t: adt } = useAdminT();
  const { t } = useI18n();

  // 1. Real-time Current User
  useEffect(() => {
    if (!basicProfile?.uid) return;
    return onSnapshot(doc(db, 'users', basicProfile.uid), (snap) => {
      if (snap.exists()) {
        setUser({ uid: snap.id, ...snap.data() } as UserProfileChat);
      }
    }, (error) => {
      console.error('User doc listener error:', error);
    });
  }, [basicProfile?.uid]);

  // 2. Real-time All Users
  useEffect(() => {
    if (!user) return;
    return onSnapshot(collection(db, 'users'), (snap) => {
      const u = snap.docs.map(d => ({ uid: d.id, ...d.data() }) as UserProfileChat);
      setAllUsers(u);
    }, (error) => {
      console.error('Users listener error:', error);
    });
  }, [user]);

  // 3. Real-time Chats
  useEffect(() => {
    if (!user?.uid) return;
    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid)
    );
    return onSnapshot(q, (snap) => {
      const c = snap.docs.map(d => ({ id: d.id, ...d.data() } as Chat));
      // ✅ Sort on client-side to avoid missing index errors
      const sorted = c.sort((a, b) => {
        const timeA = a.lastMessageAt?.toMillis?.() || 0;
        const timeB = b.lastMessageAt?.toMillis?.() || 0;
        return timeB - timeA;
      });
      setChats(sorted);
    }, (error) => {
      console.error('Chats listener error:', error);
    });
  }, [user?.uid]);

  const handleStartChat = async (userId: string, quoteId?: string, quoteNumber?: string) => {
    if (!user) return;
    const existing = chats.find(c => 
      c.participants.includes(userId) && 
      c.participants.includes(user.uid) && 
      (quoteId ? c.quoteId === quoteId : !c.quoteId)
    );
    if (existing) {
      setActiveChatId(existing.id);
      return existing.id;
    }
    const docRef = await addDoc(collection(db, 'chats'), {
      participants: [user.uid, userId],
      lastMessage: '',
      lastMessageAt: serverTimestamp(),
      unreadCount: { [user.uid]: 0, [userId]: 0 },
      isGroup: false,
      ...(quoteId ? { quoteId, quoteNumber } : {})
    });
    setActiveChatId(docRef.id);
    return docRef.id;
  };

  const handleForwardMessage = async (message: Message) => {
    if (selectedUserIds.length === 0 || !user) return;
    for (const targetId of selectedUserIds) {
      const chatId = await handleStartChat(targetId);
      if (chatId) {
        await addDoc(collection(db, 'chats', chatId, 'messages'), {
          chatId,
          senderId: user.uid,
          senderName: user.displayName,
          senderRole: user.role,
          content: message.content,
          type: message.type || 'text',
          fileUrl: message.fileUrl || null,
          status: 'sent',
          createdAt: serverTimestamp()
        });
      }
    }
    setSelectedUserIds([]);
  };

  const onPinUser = async (userId: string) => {
    if (!user) return;
    const pinned = user.pinnedUserIds || [];
    const newPinned = pinned.includes(userId) ? pinned.filter(id => id !== userId) : [...pinned, userId];
    await updateDoc(doc(db, 'users', user.uid), { pinnedUserIds: newPinned });
  };

  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing) {
        const newWidth = window.innerWidth - e.clientX;
        if (newWidth > 200 && newWidth < 600) setContactListWidth(newWidth);
      }
    };
    const handleMouseUp = () => setIsResizing(false);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  if (!user) return <div className="h-full flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;

  if (user.role !== 'admin' && user.permissions?.canChat === false) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-[40px] bg-white p-10 shadow-2xl border border-gray-100 text-center">
          <div className="mb-8 flex justify-center text-red-600"><Shield size={48} /></div>
          <h1 className="mb-4 text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-emerald-600">{adt('Access Denied')}</h1>
          <p className="text-gray-500 font-medium">{adt('The administrator has removed your access to Chat.')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex flex-col relative overflow-hidden bg-white",
      isMobile 
        ? "w-full fixed top-24 bottom-0 left-0 right-0 z-40" 
        : "h-full w-full rounded-3xl shadow-2xl border border-gray-100"
    )}>
      {/* Mobile Top Switcher - Premium Segmented Control */}
      {isMobile && activeMobileTab !== 'chat' && (
        <div className="flex-shrink-0 p-4 bg-white border-b border-gray-100 flex justify-center z-[70]">
          <div className="bg-gray-100 p-1.5 rounded-[22px] flex w-full max-w-sm relative h-[60px] shadow-inner border border-gray-200/50">
            {/* Sliding background */}
            <motion.div 
              className="absolute h-[calc(100%-12px)] bg-black rounded-[18px] shadow-[0_4px_15px_rgba(0,0,0,0.3)] z-0"
              initial={false}
              animate={{
                width: 'calc(50% - 10px)',
                left: activeMobileTab === 'discussions' ? '6px' : 'calc(50% + 4px)',
              }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
            <button 
              onClick={() => setActiveMobileTab('discussions')}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-0.5 rounded-xl text-[10px] font-black transition-all duration-300 relative z-10",
                activeMobileTab === 'discussions' ? "text-white scale-105" : "text-gray-400 hover:text-gray-500"
              )}
            >
              <MessageSquare 
                size={18} 
                strokeWidth={3} 
                className={cn(activeMobileTab === 'discussions' ? "text-[#15bcd7]" : "text-gray-400")}
              />
              <span className="uppercase tracking-[0.15em]">{t('chat.discussions')}</span>
            </button>
            <button 
              onClick={() => setActiveMobileTab('annuaire')}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-0.5 rounded-xl text-[10px] font-black transition-all duration-300 relative z-10",
                activeMobileTab === 'annuaire' ? "text-white scale-105" : "text-gray-400 hover:text-gray-500"
              )}
            >
              <Users 
                size={18} 
                strokeWidth={3} 
                className={cn(activeMobileTab === 'annuaire' ? "text-[#15bcd7]" : "text-gray-400")}
              />
              <span className="uppercase tracking-[0.15em]">{t('chat.directory')}</span>
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden min-h-0 h-full">
        <div className={cn(
          "w-80 flex-shrink-0 h-full border-r border-gray-100",
          isMobile && activeMobileTab !== 'discussions' && "hidden",
          isMobile && activeMobileTab === 'discussions' && "w-full"
        )}>
          <ChatList 
            chats={chats} 
            activeChatId={activeChatId} 
            onChatSelect={(id) => {
              setActiveChatId(id);
              if (isMobile) setActiveMobileTab('chat');
            }} 
            currentUser={user} 
            allUsers={allUsers}
            pinnedUserIds={user.pinnedUserIds || []}
            onPinUser={onPinUser}
            isMiniChatHidden={!isMiniChatOpen}
            onToggleMiniChatVisibility={() => setIsMiniChatOpen(!isMiniChatOpen)}
          />
        </div>
        
        <div className={cn(
          "flex-1 flex flex-col bg-white",
          isMobile && activeMobileTab !== 'chat' && "hidden"
        )}>
          {activeChatId ? (
            <ChatWindow 
              chatId={activeChatId} 
              onBack={() => {
                setActiveChatId(null);
                if (isMobile) setActiveMobileTab('discussions');
              }} 
              currentUser={user}
              onShowAdmin={() => {}}
              pinnedUserIds={user.pinnedUserIds || []}
              onPinUser={onPinUser}
              selectedUserIds={selectedUserIds}
              onForward={handleForwardMessage}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-24 h-24 bg-white rounded-[32px] flex items-center justify-center text-blue-600 mb-6 shadow-xl"><MessageSquare size={48} /></div>
              <h2 className="text-4xl font-black text-[#1a1d21] tracking-tighter">{t('chat.selectConversation')}</h2>
              <p className="text-gray-400 max-w-sm mt-4 text-lg font-medium leading-relaxed">{t('chat.selectConversationDesc')}</p>
            </div>
          )}
        </div>

        <div className={cn(
          "relative border-l border-gray-100 bg-white",
          isMobile && activeMobileTab !== 'annuaire' && "hidden",
          isMobile && activeMobileTab === 'annuaire' && "w-full border-l-0"
        )} style={{ width: isMobile ? '100%' : contactListWidth }}>
          <ContactList 
            users={allUsers} 
            onSelectContact={async (uid, quote) => {
              const chatId = await handleStartChat(uid, quote?.id, quote?.number);
              if (chatId && isMobile) setActiveMobileTab('chat');
            }} 
            currentUser={user}
            selectedUsers={selectedUserIds}
            onSelectedUsersChange={setSelectedUserIds}
            activeChatId={activeChatId}
          />
          {!isMobile && <div onMouseDown={startResizing} className="absolute left-0 top-0 w-1 h-full cursor-col-resize hover:bg-blue-500/30 transition-colors z-50" />}
        </div>
      </div>

      {/* MiniChat Overlay */}
      <MiniChat 
        isOpen={isMiniChatOpen}
        onClose={() => setIsMiniChatOpen(false)}
        users={allUsers}
        currentUser={user}
        chats={chats}
        onChatSelect={(id) => {
          setActiveChatId(id);
          setIsMiniChatOpen(false);
          if (isMobile) setActiveMobileTab('chat');
        }}
        onStartChat={handleStartChat}
        buttonPos={{ x: 0, y: 0 }} // Managed by MiniChat usually
        pinnedUserIds={user.pinnedUserIds || []}
        onPinUser={onPinUser}
        totalUnreadCount={chats.reduce((acc, c) => acc + (c.unreadCount[user.uid] || 0), 0)}
        activeChatId={activeChatId}
      />
    </div>
  );
}