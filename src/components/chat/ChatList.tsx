'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Pin, MoreVertical, Image, Video, Mic, FileText, Settings, Mail, Trash2 } from 'lucide-react';
import { motion, PanInfo, useMotionValue, useTransform, animate, useAnimation } from 'framer-motion';
import { format } from 'date-fns';
import { UserProfileChat as UserProfile, Chat } from '@/lib/types';
import { cn, formatTimestamp } from '@/lib/utils';
import { firestore as db } from '@/firebase/config';
import { doc, getDoc, deleteDoc, collection, query, getDocs, writeBatch, onSnapshot } from 'firebase/firestore';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useRoles } from '@/contexts/RoleContext';
import ConfirmModal from './ConfirmModal';

interface ChatListProps {
  chats: Chat[];
  activeChatId: string | null;
  onChatSelect: (id: string) => void;
  currentUser: UserProfile;
  allUsers: UserProfile[];
  pinnedUserIds: string[];
  onPinUser: (userId: string) => void;
  isMiniChatHidden: boolean;
  onToggleMiniChatVisibility: () => void;
}

export default function ChatList({ 
  chats, 
  activeChatId, 
  onChatSelect, 
  currentUser, 
  allUsers,
  pinnedUserIds, 
  onPinUser,
  isMiniChatHidden,
  onToggleMiniChatVisibility
}: ChatListProps) {
  const isMobile = useMediaQuery('(max-width: 1024px)');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSwipeId, setActiveSwipeId] = useState<string | null>(null);
  const [chatToDelete, setChatToDelete] = useState<Chat | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { roles, getRoleName, getRoleColor } = useRoles();

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

  const filteredChats = chats.filter(chat => {
    const otherId = chat.participants.find(id => id !== currentUser.uid);
    if (!otherId) return true;
    const otherUser = allUsers.find(u => u.uid === otherId);
    if (!otherUser) return true;
    return otherUser.displayName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const sortedChats = [...filteredChats].sort((a, b) => {
    const aUnread = a.unreadCount[currentUser.uid] || 0;
    const bUnread = b.unreadCount[currentUser.uid] || 0;
    
    // 1. Unread messages always come first
    if (aUnread > 0 && bUnread === 0) return -1;
    if (aUnread === 0 && bUnread > 0) return 1;
    
    // 2. Then pinned chats
    const aIsPinned = a.participants.some(id => pinnedUserIds.includes(id));
    const bIsPinned = b.participants.some(id => pinnedUserIds.includes(id));
    if (aIsPinned && !bIsPinned) return -1;
    if (!aIsPinned && bIsPinned) return 1;
    
    // 3. Finally by last message time
    const aTime = a.lastMessageAt?.toMillis?.() || (a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0);
    const bTime = b.lastMessageAt?.toMillis?.() || (b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0);
    return bTime - aTime;
  });

  const groupedChats = sortedChats.reduce((acc, chat) => {
    const otherId = chat.participants.find(id => id !== currentUser.uid);
    const otherUser = allUsers.find(u => u.uid === otherId);
    const roleId = otherUser?.role || 'autre';
    if (!acc[roleId]) acc[roleId] = [];
    acc[roleId].push(chat);
    return acc;
  }, {} as Record<string, Chat[]>);

  const roleOrder = useMemo(() => {
    const activeRoleIds = Object.keys(groupedChats);
    return activeRoleIds.sort((a, b) => {
      const roleA = roles.find(r => r.id === a);
      const roleB = roles.find(r => r.id === b);
      
      if (roleA?.isDefault && !roleB?.isDefault) return -1;
      if (!roleA?.isDefault && roleB?.isDefault) return 1;
      
      const nameA = getRoleName(a);
      const nameB = getRoleName(b);
      return nameA.localeCompare(nameB);
    });
  }, [groupedChats, roles, getRoleName]);

  return (
    <div className={cn(
      "bg-white h-full flex flex-col border-r border-gray-100 overflow-hidden",
      isMobile ? "w-full" : "w-80"
    )}>
      {!isMobile && (
        <div className="p-6 border-b border-gray-50 flex-shrink-0">
          <h1 className="text-4xl font-black tracking-tighter text-[#15bcd7] leading-none">
            Discussion
          </h1>
        </div>
      )}
      {!isMobile && (
        <div className="px-6 py-4 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative group">
              <input
                type="text"
                placeholder="Rechercher"
                className="w-full rounded-2xl bg-white py-3 px-5 text-sm outline-none border border-transparent focus:border-blue-500/30 shadow-sm transition-all placeholder:text-gray-300 font-medium"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="h-11 w-11 rounded-2xl bg-black flex items-center justify-center text-[#15bcd7] shadow-lg shadow-black/10 hover:scale-105 active:scale-95 transition-all border border-[#15bcd7]/20">
              <Search size={22} />
            </button>
          </div>
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar px-2 pb-4 min-h-0">
        <div className="space-y-6">
          {roleOrder.map(role => {
            const chatsInRole = groupedChats[role];
            if (!chatsInRole || chatsInRole.length === 0) return null;

            return (
              <div key={role} className="space-y-2">
                <div className="px-4 flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: getRoleColor(role) }} />
                  <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                    {getRoleName(role).endsWith('s') ? getRoleName(role) : `${getRoleName(role)}s`}
                  </h2>
                  <div className="flex-1 h-[1px] bg-gray-100 ml-2" />
                </div>
                <div className="space-y-1">
                  {chatsInRole.map((chat) => (
                    <SwipeableChat 
                      key={chat.id}
                      chat={chat}
                      isActive={activeChatId === chat.id}
                      onClick={() => onChatSelect(chat.id)}
                      currentUser={currentUser}
                      isPinned={chat.participants.some(id => pinnedUserIds.includes(id))}
                      onPin={() => {
                        const otherId = chat.participants.find(id => id !== currentUser.uid);
                        if (otherId) onPinUser(otherId);
                      }}
                      onDelete={() => setChatToDelete(chat)}
                      isMobile={isMobile}
                      isOpen={activeSwipeId === chat.id}
                      onSwipeOpen={() => setActiveSwipeId(chat.id)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <ConfirmModal
          isOpen={!!chatToDelete}
          onClose={() => setChatToDelete(null)}
          onConfirm={async () => {
            if (!chatToDelete) return;
            setIsDeleting(true);
            try {
              const messagesRef = collection(db, 'chats', chatToDelete.id, 'messages');
              const messagesSnapshot = await getDocs(messagesRef);
              
              const batch = writeBatch(db);
              
              // Delete all messages
              messagesSnapshot.docs.forEach((mDoc) => {
                batch.delete(mDoc.ref);
              });
              
              // Delete the chat document itself
              batch.delete(doc(db, 'chats', chatToDelete.id));
              
              await batch.commit();
              console.log("Chat deleted successfully");
            } catch (error) {
              console.error("Error deleting chat:", error);
            } finally {
              setIsDeleting(false);
              setChatToDelete(null);
            }
          }}
          title="Supprimer la discussion"
          message="Voulez-vous vraiment supprimer définitivement cette discussion ? Cette action est irréversible et supprimera tous les messages."
          confirmText={isDeleting ? "Suppression..." : "Supprimer"}
        />
      </div>
    </div>
  );
}

function SwipeableChat({ chat, isActive, onClick, currentUser, isPinned, onPin, onDelete, isMobile, isOpen, onSwipeOpen }: any) {
  const controls = useAnimation();
  
  useEffect(() => {
    if (!isOpen) {
      controls.start({ x: 0 });
    }
  }, [isOpen, controls]);

  if (!isMobile) {
    return <ChatItem chat={chat} isActive={isActive} onClick={onClick} currentUser={currentUser} isPinned={isPinned} onPin={onPin} onDelete={onDelete} />;
  }

  return (
    <div className="relative overflow-hidden rounded-2xl group mb-1">
      {/* Background Actions */}
      <div className="absolute inset-y-0 right-0 flex items-center gap-2 px-3">
        {/* Pin Action */}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onPin();
            controls.start({ x: 0 });
          }}
          className={cn(
            "h-14 w-14 rounded-[22px] flex flex-col items-center justify-center transition-all border",
            "bg-emerald-500/5 border-emerald-500/10",
            isPinned ? "text-violet-500" : "text-blue-500"
          )}
        >
          <Pin size={22} strokeWidth={2} className={cn(isPinned && "fill-violet-500")} />
        </button>

        {/* Delete Action */}
        {onDelete && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
              controls.start({ x: 0 });
            }}
            className="h-14 w-14 rounded-[22px] bg-red-500/5 border border-red-500/10 flex items-center justify-center text-[#ff3b3b]"
          >
            <Trash2 size={22} strokeWidth={2} />
          </button>
        )}
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
        className="relative z-10 bg-[#f4f4f9]"
      >
        <ChatItem chat={chat} isActive={isActive} onClick={onClick} currentUser={currentUser} isPinned={isPinned} onPin={onPin} />
      </motion.div>
    </div>
  );
}

function ChatItem({ chat, isActive, onClick, currentUser, isPinned, onPin, onDelete }: { chat: Chat, isActive: boolean, onClick: () => void, currentUser: UserProfile, isPinned: boolean, onPin: () => void, onDelete?: () => void }) {
  const [otherUser, setOtherUser] = useState<UserProfile | null>(null);
  const unreadCount = chat.unreadCount[currentUser.uid] || 0;
  const isMobile = useMediaQuery('(max-width: 1024px)');

  useEffect(() => {
    const otherId = chat.participants.find(id => id !== currentUser.uid);
    if (!otherId) return;

    getDoc(doc(db, 'users', otherId)).then(snap => {
      if (snap.exists()) setOtherUser(snap.data() as UserProfile);
    });
  }, [chat, currentUser.uid]);

  if (!otherUser) return null;

  const isBlocked = currentUser.blockedUsers?.includes(otherUser.uid);
  const isBlockedByOther = otherUser.blockedUsers?.includes(currentUser.uid);

  const renderLastMessage = (message: string) => {
    if (!message) return 'Nouvelle conversation';
    
    const isMe = message.startsWith('Vous : ') || message.startsWith('You: ');
    const prefix = isMe ? (message.startsWith('Vous : ') ? 'Vous : ' : 'You: ') : '';
    const content = isMe ? message.substring(prefix.length) : message;

    if (content === '[image]') return <span className="flex items-center gap-1.5">{prefix}<Image size={14} className="text-blue-500" /> Photo</span>;
    if (content === '[video]') return <span className="flex items-center gap-1.5">{prefix}<Video size={14} className="text-purple-500" /> Vidéo</span>;
    if (content === '[audio]') return <span className="flex items-center gap-1.5">{prefix}<Mic size={14} className="text-green-500" /> Audio</span>;
    if (content === '[file]') return <span className="flex items-center gap-1.5">{prefix}<FileText size={14} className="text-orange-500" /> Fichier</span>;
    
    return message;
  };

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        "w-full flex items-center gap-3 p-3 rounded-2xl transition-all group relative cursor-pointer",
        isActive ? "bg-black shadow-lg" : "hover:bg-black border-transparent hover:border-white/20",
        isMobile && "bg-white border border-gray-100"
      )}
    >
      <div className="relative flex-shrink-0">
        <div className={cn(
          "h-12 w-12 rounded-2xl p-0.5 border-2 transition-all",
          isBlocked ? "border-red-500" : "border-transparent"
        )}>
          <img 
            src={otherUser.photoURL} 
            alt="" 
            className={cn(
              "h-full w-full rounded-[14px] object-cover",
              isBlocked && "grayscale brightness-75"
            )} 
            referrerPolicy="no-referrer"
          />
        </div>
        {otherUser.isOnline && !isBlocked && (
          <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-green-500" />
        )}
      </div>
      
      <div className="flex-1 text-left min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span className={cn(
            "font-bold truncate text-sm transition-colors",
            isBlocked ? "text-red-500" : isBlockedByOther ? "text-gray-400" : (isActive ? "text-white" : "text-[#1a1d21]"),
            "group-hover:text-white"
          )}>{otherUser.displayName}</span>
          <div className="flex items-center gap-1">
            {isBlockedByOther && (
              <span className="text-[8px] font-black uppercase text-gray-400 tracking-wider px-1.5 py-0.5 bg-gray-100 rounded-full border border-gray-200">
                Bloqué
              </span>
            )}
            <span className="text-[10px] font-medium text-gray-400">
              {formatTimestamp(chat.lastMessageAt)}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className={cn(
            "truncate text-xs flex-1 transition-colors",
            unreadCount > 0 ? "text-blue-500 font-semibold" : (isActive ? "text-white/60" : "text-gray-500"),
            "group-hover:text-white/80"
          )}>
            {otherUser.isTyping ? "En train d'écrire..." : renderLastMessage(chat.lastMessage)}
          </div>
          <div className="flex items-center gap-1.5">
            {unreadCount > 0 && (
              <span className="flex h-6 min-w-[24px] items-center justify-center rounded-full bg-orange-500 px-1.5 text-[11px] font-black text-white shadow-lg shadow-orange-500/30">
                {unreadCount}
              </span>
            )}
            {!isMobile && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onDelete) onDelete();
                  }}
                  className={cn(
                    "h-8 w-8 rounded-xl flex items-center justify-center transition-all shadow-sm",
                    isActive 
                      ? "text-red-400 hover:bg-red-500/20" 
                      : "text-gray-300 opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-500/10 hover:shadow-red-500/10"
                  )}
                  title="Supprimer la discussion"
                >
                  <Trash2 size={16} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onPin();
                  }}
                  className={cn(
                    "p-1 rounded-lg transition-all",
                    isPinned ? "text-purple-500" : cn("text-gray-300", isActive ? "opacity-100 hover:bg-white/10" : "opacity-0 group-hover:opacity-100 hover:bg-gray-100")
                  )}
                >
                  <Pin size={14} className={cn(isPinned && "fill-purple-500")} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
