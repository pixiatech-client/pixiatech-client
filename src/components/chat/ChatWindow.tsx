'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, MoreVertical, Ban, Paperclip, Video, Mic, Send, Mail, Image as ImageIcon, Trash2, StopCircle, Play, Pause, Search, Shield, Users, ChevronLeft, Phone, MessageSquare, Settings, UserX, Bell, BellOff, Eye, EyeOff, ShieldOff, ChevronDown } from 'lucide-react';
import { doc, updateDoc, onSnapshot, collection, query, orderBy, limit, addDoc, serverTimestamp, getDoc, getDocs, deleteDoc, increment, arrayUnion } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { firestore as db, storage } from '@/firebase/config';
import { UserProfileChat as UserProfile, Message, MessageType, Chat } from '@/lib/types';
import { cn } from '@/lib/utils';
import MessageItem from './MessageItem';
import ConfirmModal from './ConfirmModal';
import { motion, AnimatePresence } from 'framer-motion';
import { useMediaQuery } from '@/hooks/use-media-query';

interface ChatWindowProps {
  chatId: string;
  onBack: () => void;
  currentUser: UserProfile;
  onShowAdmin: () => void;
  onShowInfo?: () => void;
  isMiniChat?: boolean;
  pinnedUserIds?: string[];
  onPinUser?: (userId: string) => void;
  selectedUserIds?: string[];
  onForward?: (msg: Message) => void;
}

export default function ChatWindow({ chatId, onBack, currentUser, onShowAdmin, onShowInfo, isMiniChat, pinnedUserIds = [], onPinUser, selectedUserIds = [], onForward }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [otherUser, setOtherUser] = useState<UserProfile | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const isMobile = useMediaQuery('(max-width: 1024px)');
  const [selectedMedia, setSelectedMedia] = useState<{ url: string, type: 'image' | 'video' } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [unsubOtherUser, setUnsubOtherUser] = useState<(() => void) | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    onConfirm: () => void;
    variant: 'danger' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: '',
    onConfirm: () => {},
    variant: 'danger'
  });

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShowScrollButton(!isAtBottom);
  };

  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Votre navigateur ne supporte pas l'enregistrement audio.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Better mime type detection for cross-platform support (iOS/Android/PC)
      const types = ['audio/mp4', 'audio/aac', 'audio/mpeg', 'audio/webm;codecs=opus', 'audio/webm'];
      const mimeType = types.find(type => MediaRecorder.isTypeSupported(type)) || '';
      
      if (!mimeType) {
        alert("Aucun format audio supporté trouvé sur cet appareil.");
        return;
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const extension = mimeType.includes('mp4') ? 'mp4' : 
                         mimeType.includes('aac') ? 'aac' : 
                         mimeType.includes('mpeg') ? 'mp3' : 'webm';
                         
        const blob = new Blob(chunks, { type: mimeType });
        
        try {
          const storageRef = ref(storage, `chats/${chatId}/audio_${Date.now()}.${extension}`);
          await uploadBytes(storageRef, blob);
          const downloadURL = await getDownloadURL(storageRef);
          await sendVoiceMessage(downloadURL);
        } catch (uploadError) {
          console.error('Error uploading audio:', uploadError);
          alert('Erreur lors de l\'envoi du message vocal');
        } finally {
          // Stop all tracks to release the microphone
          stream.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorder.start(1000); // Collect data every second for safety
      setIsRecording(true);
      setRecordingTime(0);
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      const errorMsg = err instanceof Error ? err.message : "Inconnue";
      alert(`Impossible d'accéder au micro : ${errorMsg}. Vérifiez les réglages de votre navigateur.`);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const sendVoiceMessage = async (url: string) => {
    if (!currentUser.permissions?.canChat && currentUser.role !== 'admin') return;
    
    const msgData: Partial<Message> = {
      chatId,
      senderId: currentUser.uid,
      senderName: currentUser.displayName,
      senderRole: currentUser.role,
      content: 'Message vocal',
      type: 'audio',
      fileUrl: url,
      status: 'sent',
      createdAt: serverTimestamp()
    };
    await addDoc(collection(db, 'chats', chatId, 'messages'), msgData);
    
    const chatSnap = await getDoc(doc(db, 'chats', chatId));
    if (chatSnap.exists()) {
      const chat = chatSnap.data() as Chat;
      const updates: any = {
        lastMessage: '[audio]',
        lastMessageAt: serverTimestamp()
      };
      chat.participants.forEach(pId => {
        if (pId !== currentUser.uid) {
          updates[`unreadCount.${pId}`] = increment(1);
        }
      });
      await updateDoc(doc(db, 'chats', chatId), updates);
      
      chat.participants.forEach(async (pId) => {
        if (pId !== currentUser.uid) {
           addDoc(collection(db, 'notifications'), {
            userId: pId,
            type: 'message',
            title: `Nouveau message vocal de ${currentUser.displayName || 'quelqu\'un'}`,
            description: 'Message vocal',
            href: '/admin/messages',
            read: false,
            createdAt: serverTimestamp()
          });
        }
      });
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !chatId) return;
    if (!currentUser.permissions?.canChat && currentUser.role !== 'admin') return;

    setIsUploading(true);
    
    let type: MessageType = 'file';
    if (file.type.startsWith('image/')) type = 'image';
    else if (file.type.startsWith('video/')) type = 'video';
    else if (file.type.startsWith('audio/')) type = 'audio';

    try {
      // Upload file to Firebase Storage
      const storageRef = ref(storage, `chats/${chatId}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      const msgData: Partial<Message> = {
        chatId,
        senderId: currentUser.uid,
        senderName: currentUser.displayName,
        senderRole: currentUser.role,
        content: file.name,
        type,
        fileUrl: downloadURL,
        status: 'sent',
        createdAt: serverTimestamp()
      };
      await addDoc(collection(db, 'chats', chatId, 'messages'), msgData);
      
      const chatSnap = await getDoc(doc(db, 'chats', chatId));
      if (chatSnap.exists()) {
        const chat = chatSnap.data() as Chat;
        const updates: any = {
          lastMessage: `[${type}]`,
          lastMessageAt: serverTimestamp()
        };
        chat.participants.forEach(pId => {
          if (pId !== currentUser.uid) {
            updates[`unreadCount.${pId}`] = increment(1);
          }
        });
        await updateDoc(doc(db, 'chats', chatId), updates);
        
        chat.participants.forEach(async (pId) => {
          if (pId !== currentUser.uid) {
             addDoc(collection(db, 'notifications'), {
              userId: pId,
              type: 'message',
              title: `Nouveau fichier de ${currentUser.displayName || 'quelqu\'un'}`,
              description: file.name,
              href: '/admin/messages',
              read: false,
              createdAt: serverTimestamp()
            });
          }
        });
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    }
    
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!chatId || !currentUser.uid) return;

    // Ensure user is in participants list
    const ensurePart = async () => {
      try {
        const snap = await getDoc(doc(db, 'chats', chatId));
        if (snap.exists()) {
          const chatData = snap.data();
          const participants = chatData.participants || [];
          if (!participants.includes(currentUser.uid)) {
            await updateDoc(doc(db, 'chats', chatId), {
              participants: arrayUnion(currentUser.uid),
            });
          }
        }
      } catch (error) {
        console.error('Error ensuring participant:', error);
      }
    };
    ensurePart();

    // Cleanup previous subscription
    if (unsubOtherUser) unsubOtherUser();

    // Fetch other user from chat
    const fetchOtherUser = async () => {
      try {
        const snap = await getDoc(doc(db, 'chats', chatId));
        if (!snap.exists()) return;
        const chat = snap.data() as Chat;
        const otherId = chat.participants.find(id => id !== currentUser.uid);
        if (otherId) {
          const unsub = onSnapshot(doc(db, 'users', otherId), (uSnap) => {
            setOtherUser(uSnap.data() as UserProfile);
          });
          setUnsubOtherUser(() => unsub);
        }
      } catch (error) {
        console.error('Error fetching other user:', error);
      }
    };
    fetchOtherUser();

    // Subscribe to messages
    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'desc'),
      limit(100)
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      const newMessages = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message)).reverse();
      setMessages(newMessages);
      updateDoc(doc(db, 'chats', chatId), { [`unreadCount.${currentUser.uid}`]: 0 });
    });

    return () => {
      unsubscribe();
      if (unsubOtherUser) unsubOtherUser();
    };
  }, [chatId, currentUser.uid]);

  const sendMessage = async (e?: React.FormEvent, directText?: string) => {
    e?.preventDefault();
    
    // Check if current user has chat access (admins always have access)
    if (!currentUser.permissions?.canChat && currentUser.role !== 'admin') {
      return;
    }
    
    if (isRecording) {
      stopRecording();
      return;
    }

    const content = directText || inputText;
    if (!content.trim()) return;

    if (!directText) setInputText('');
    
    const msgData: Partial<Message> = {
      chatId,
      senderId: currentUser.uid,
      senderName: currentUser.displayName,
      senderRole: currentUser.role,
      content,
      type: 'text',
      status: 'sent',
      createdAt: serverTimestamp()
    };

    await addDoc(collection(db, 'chats', chatId, 'messages'), msgData);
    
    // Get chat to find all participants
    const chatSnap = await getDoc(doc(db, 'chats', chatId));
    if (chatSnap.exists()) {
      const chat = chatSnap.data() as Chat;
      const updates: any = {
        lastMessage: content,
        lastMessageAt: serverTimestamp()
      };
      
      // Increment unread for all participants except sender
      chat.participants.forEach(pId => {
        if (pId !== currentUser.uid) {
          updates[`unreadCount.${pId}`] = increment(1);
        }
      });
      
      await updateDoc(doc(db, 'chats', chatId), updates);
      
      // Create notification for recipients (best effort, maybe only for main recipient or all)
      // Here we notify everyone else
      chat.participants.forEach(async (pId) => {
        if (pId !== currentUser.uid) {
           addDoc(collection(db, 'notifications'), {
            userId: pId,
            type: 'message',
            title: `Nouveau message de ${currentUser.displayName || 'quelqu\'un'}`,
            description: content.length > 100 ? content.substring(0, 100) + '...' : content,
            href: '/admin/messages',
            read: false,
            createdAt: serverTimestamp()
          });
        }
      });
    }
  };

  const handleClearHistory = async () => {
    setModalConfig({
      isOpen: true,
      title: "Effacer l'historique",
      message: "Voulez-vous vraiment supprimer tout l'historique ? Cela supprimera aussi tous les fichiers et médias partagés. Cette action est irréversible.",
      confirmText: "Effacer tout",
      variant: 'danger',
      onConfirm: async () => {
        try {
          console.log("Starting history clearing for chat:", chatId);
          const q = query(collection(db, 'chats', chatId, 'messages'));
          const messagesSnapshot = await getDocs(q);
          
          const deletePromises = messagesSnapshot.docs.map(mDoc => 
            deleteDoc(doc(db, 'chats', chatId, 'messages', mDoc.id))
          );
          if (deletePromises.length > 0) {
            await Promise.all(deletePromises);
          }
          
          try {
            const { listAll, deleteObject } = await import('firebase/storage');
            const chatStorageRef = ref(storage, `chats/${chatId}`);
            const filesResult = await listAll(chatStorageRef);
            const storagePromises = filesResult.items.map(file => deleteObject(file));
            if (storagePromises.length > 0) {
              await Promise.all(storagePromises);
            }
          } catch (storageErr) {
            console.log('No storage files to delete');
          }
          
          await updateDoc(doc(db, 'chats', chatId), {
            lastMessage: 'Historique effacé',
            lastMessageAt: serverTimestamp()
          });

          setShowMenu(false);
        } catch (err) {
          console.error('Error clearing history:', err);
        }
      }
    });
  };

  const handleBlockUser = async () => {
    if (!otherUser) return;
    const newBlockedUsers = currentUser.blockedUsers?.includes(otherUser.uid)
      ? currentUser.blockedUsers.filter(id => id !== otherUser.uid)
      : [...(currentUser.blockedUsers || []), otherUser.uid];
    await updateDoc(doc(db, 'users', currentUser.uid), { blockedUsers: newBlockedUsers });
    setShowMenu(false);
  };

  const handleRemoveAccess = async () => {
    if (!otherUser) return;
    const newPermissions = { ...otherUser.permissions, canChat: !otherUser.permissions?.canChat };
    await updateDoc(doc(db, 'users', otherUser.uid), { permissions: newPermissions });
    setShowMenu(false);
  };

  const handleToggleNotifications = async () => {
    const newBlocked = !currentUser.notificationsBlocked;
    await updateDoc(doc(db, 'users', currentUser.uid), { notificationsBlocked: newBlocked });
  };

  const handleToggleMute = async () => {
    if (!otherUser) return;
    const newMutedUsers = currentUser.mutedUsers?.includes(otherUser.uid)
      ? currentUser.mutedUsers.filter(id => id !== otherUser.uid)
      : [...(currentUser.mutedUsers || []), otherUser.uid];
    await updateDoc(doc(db, 'users', currentUser.uid), { mutedUsers: newMutedUsers });
  };

  const handleToggleAdminOnly = async () => {
    if (!otherUser) return;
    await updateDoc(doc(db, 'users', otherUser.uid), { adminOnly: !otherUser.adminOnly });
  };

  const handleReact = async (messageId: string, emoji: string) => {
    const msgRef = doc(db, 'chats', chatId, 'messages', messageId);
    const msgSnap = await getDoc(msgRef);
    if (msgSnap.exists()) {
      const msg = msgSnap.data() as Message;
      const reactions = msg.reactions || {};
      const users = reactions[emoji] || [];
      
      if (users.includes(currentUser.uid)) {
        reactions[emoji] = users.filter(id => id !== currentUser.uid);
        if (reactions[emoji].length === 0) delete reactions[emoji];
      } else {
        reactions[emoji] = [...users, currentUser.uid];
      }
      
      await updateDoc(msgRef, { reactions });
    }
  };
  
  const handleDeleteChat = async () => {
    setModalConfig({
      isOpen: true,
      title: "Supprimer la discussion",
      message: "Voulez-vous vraiment supprimer cette discussion ? Tous les messages et médias seront perdus pour toujours.",
      confirmText: "Supprimer définitivement",
      variant: 'danger',
      onConfirm: async () => {
        try {
          const q = query(collection(db, 'chats', chatId, 'messages'));
          const messagesSnapshot = await getDocs(q);
          
          const deletePromises = messagesSnapshot.docs.map(mDoc => 
            deleteDoc(doc(db, 'chats', chatId, 'messages', mDoc.id))
          );
          await Promise.all(deletePromises);
          await deleteDoc(doc(db, 'chats', chatId));
          onBack();
        } catch (error) {
          console.error("Error deleting chat:", error);
        }
      }
    });
  };

  const handleDeleteMessage = async (messageId: string) => {
    setModalConfig({
      isOpen: true,
      title: "Supprimer le message",
      message: "Voulez-vous vraiment supprimer ce message ? Cette action est irréversible.",
      confirmText: "Supprimer",
      variant: 'danger',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'chats', chatId, 'messages', messageId));
        } catch (error) {
          console.error("Error deleting message:", error);
        }
      }
    });
  };

  const isUserBlocked = otherUser && currentUser.blockedUsers?.includes(otherUser.uid);
  const isBlockedByOther = otherUser && otherUser.blockedUsers?.includes(currentUser.uid);
  const isAccessRevoked = otherUser && !otherUser.permissions?.canChat;

  return (
    <div className={cn(
      "flex h-full flex-col relative overflow-hidden bg-white",
      isMiniChat ? "bg-[#0f1113] text-white" : "h-full w-full"
    )}>
      {/* Side Menu Overlay */}
      <AnimatePresence>
        {showMenu && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMenu(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={isMobile ? { y: '100%' } : { x: '100%' }}
              animate={isMobile ? { y: 0 } : { x: 0 }}
              exit={isMobile ? { y: '100%' } : { x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={cn(
                "absolute bg-[#0f1113] border-white/10 z-[70] flex flex-col shadow-2xl",
                isMobile 
                  ? "bottom-0 left-0 w-full h-[85%] rounded-t-[40px] border-t p-6" 
                  : "top-0 right-0 w-80 h-full border-l p-8"
              )}
            >
              <div className={cn("flex items-center justify-between", isMobile ? "mb-6" : "mb-10")}>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-[0.3em] text-blue-500 mb-1">Gestion</h4>
                  <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Options de discussion</p>
                </div>
                <button 
                  onClick={() => setShowMenu(false)}
                  className="h-11 w-11 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:text-blue-500 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className={cn("flex items-center justify-center gap-6", isMobile ? "mb-6" : "mb-10")}>
                <button 
                  onClick={handleBlockUser}
                  className={cn(
                    "rounded-2xl flex items-center justify-center transition-all border",
                    isMobile ? "h-12 w-12" : "h-14 w-14",
                    isUserBlocked 
                      ? "bg-red-500/20 border-red-500/40 text-red-500" 
                      : "bg-white/5 border-white/5 text-white/40 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-500"
                  )}
                >
                  <Ban size={isMobile ? 20 : 24} />
                </button>
                {currentUser.role === 'admin' && (
                  <button 
                    onClick={handleRemoveAccess}
                    className={cn(
                      "rounded-2xl flex items-center justify-center transition-all border",
                      isMobile ? "h-12 w-12" : "h-14 w-14",
                      isAccessRevoked 
                        ? "bg-orange-500/20 border-orange-500/40 text-orange-500" 
                        : "bg-white/5 border-white/5 text-white/40 hover:bg-orange-500/10 hover:border-orange-500/30 hover:text-orange-500"
                    )}
                  >
                    <UserX size={isMobile ? 20 : 24} />
                  </button>
                )}
                <button 
                  onClick={handleToggleMute}
                  className={cn(
                    "rounded-2xl flex items-center justify-center transition-all border",
                    isMobile ? "h-12 w-12" : "h-14 w-14",
                    otherUser && currentUser.mutedUsers?.includes(otherUser.uid)
                      ? "bg-purple-500/20 border-purple-500/40 text-purple-500" 
                      : "bg-white/5 border-white/5 text-white/40 hover:bg-purple-500/10 hover:border-purple-500/30 hover:text-purple-500"
                  )}
                >
                  {otherUser && currentUser.mutedUsers?.includes(otherUser.uid) ? <BellOff size={isMobile ? 20 : 24} /> : <Bell size={isMobile ? 20 : 24} />}
                </button>
              </div>

              <div className={cn("space-y-2", !isMobile && "space-y-3")}>
                <button 
                  onClick={handleBlockUser}
                  className={cn(
                    "w-full flex items-center gap-4 rounded-2xl border transition-all group",
                    isMobile ? "p-3" : "p-4",
                    isUserBlocked 
                      ? "bg-red-500/10 border-red-500/20" 
                      : "bg-white/5 border-white/5 hover:bg-white/10"
                  )}
                >
                  <div className={cn(
                    "h-10 w-10 rounded-xl flex items-center justify-center",
                    isUserBlocked ? "bg-red-500/20 text-red-500" : "bg-white/5 text-white/40"
                  )}>
                    <Ban size={20} />
                  </div>
                  <span className="font-bold text-sm text-white/80">Bloqué</span>
                </button>

                {currentUser.role === 'admin' && (
                  <button 
                    onClick={handleRemoveAccess}
                    className={cn(
                      "w-full flex items-center gap-4 p-4 rounded-2xl border transition-all group",
                      isAccessRevoked 
                        ? "bg-orange-500/10 border-orange-500/20" 
                        : "bg-white/5 border-white/5 hover:bg-white/10"
                    )}
                  >
                    <div className={cn(
                      "h-10 w-10 rounded-xl flex items-center justify-center",
                      isAccessRevoked ? "bg-orange-500/20 text-orange-500" : "bg-white/5 text-white/40"
                    )}>
                      <UserX size={20} />
                    </div>
                    <span className="font-bold text-sm text-white/80">Retirer l'accès</span>
                  </button>
                )}

                <button 
                  onClick={handleToggleMute}
                  className={cn(
                    "w-full flex items-center gap-4 p-4 rounded-2xl border transition-all group",
                    otherUser && currentUser.mutedUsers?.includes(otherUser.uid)
                      ? "bg-purple-500/10 border-purple-500/20" 
                      : "bg-white/5 border-white/5 hover:bg-white/10"
                  )}
                >
                  <div className={cn(
                    "h-10 w-10 rounded-xl flex items-center justify-center",
                    otherUser && currentUser.mutedUsers?.includes(otherUser.uid) ? "bg-purple-500/20 text-purple-400" : "bg-white/5 text-white/40"
                  )}>
                    {otherUser && currentUser.mutedUsers?.includes(otherUser.uid) ? <BellOff size={20} /> : <Bell size={20} />}
                  </div>
                  <span className="font-bold text-sm text-white/80">Bloc notifications</span>
                </button>

                <button 
                  onClick={handleClearHistory}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl border border-white/5 bg-white/5 hover:bg-red-500/10 hover:border-red-500/20 transition-all group"
                >
                  <div className="h-10 w-10 rounded-xl bg-white/5 text-white/40 flex items-center justify-center group-hover:text-red-500 group-hover:bg-red-500/20">
                    <Trash2 size={20} />
                  </div>
                  <span className="font-bold text-sm text-white/80 group-hover:text-red-500">Effacer historique</span>
                </button>

              </div>

              {currentUser.role === 'admin' && otherUser?.role === 'prestataire' && (
                <div className="mt-6 space-y-3">
                  <div className="px-4 py-2">
                    <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Administration</h5>
                  </div>
                  <button 
                    onClick={handleToggleAdminOnly}
                    className={cn(
                      "w-full flex items-center justify-between p-4 rounded-2xl border transition-all group",
                      otherUser.adminOnly 
                        ? "bg-indigo-500/10 border-indigo-500/30 hover:bg-indigo-500/20" 
                        : "bg-white/5 border-white/5 hover:bg-white/10"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "h-12 w-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
                        otherUser.adminOnly ? "bg-indigo-500/20 text-indigo-400" : "bg-blue-500/10 text-blue-400"
                      )}>
                        <Shield size={24} />
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-sm text-white/80">Fournisseur Top Secret</p>
                        <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Visible seulement par Admin</p>
                      </div>
                    </div>
                    <div className={cn(
                      "w-10 h-5 rounded-full relative transition-colors",
                      otherUser.adminOnly ? "bg-indigo-500" : "bg-white/10"
                    )}>
                      <motion.div 
                        animate={{ x: otherUser.adminOnly ? 20 : 2 }}
                        className="absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm"
                      />
                    </div>
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>


      {/* Header */}
      <div className={cn(
        "px-6 py-4 flex items-center justify-between border-b sticky top-0 z-[100] flex-shrink-0 transition-all duration-500",
        isMiniChat ? "bg-[#0f1113] border-white/5" : "bg-white border-gray-100 shadow-sm"
      )}>
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack} 
            className={cn(
              "h-11 w-11 rounded-xl transition-all border border-white/10 flex items-center justify-center", 
              isMiniChat ? "bg-black text-[#15bcd7] hover:text-blue-500 hover:border-blue-500/50 hover:bg-blue-500/5" : "bg-gray-100/50 hover:bg-gray-100 text-gray-700"
            )}
          >
            <ChevronLeft size={24} />
          </button>
          <div className="relative">
            <div className={cn(
              "h-12 w-12 rounded-full border-2 p-0.5 transition-all duration-500",
              otherUser?.role === 'admin' ? "border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]" :
              otherUser?.role === 'prestataire' ? "border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]" :
              "border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.3)]"
            )}>
              <img 
                src={otherUser?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${chatId}`} 
                alt="" 
                className={cn(
                  "h-full w-full rounded-full object-cover",
                  isUserBlocked && "grayscale brightness-75"
                )} 
                referrerPolicy="no-referrer"
              />
            </div>
            {otherUser?.isOnline && !isUserBlocked && (
              <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-[#0f1113] bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
              {!isMobile && (
                <h1 className="text-lg md:text-2xl font-bold text-heading truncate">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r to-emerald-600 from-sky-400">
                    {otherUser?.displayName || 'Utilisateur'}
                  </span>
                </h1>
              )}
              <div className="flex flex-wrap gap-1">
                {isUserBlocked && (
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-red-500/10 border border-red-500/20 rounded-full shrink-0">
                    <Ban size={10} className="text-red-500" />
                    <span className="text-[8px] font-black uppercase text-red-500 tracking-wider">Bloqué</span>
                  </div>
                )}
                {isBlockedByOther && (
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-gray-500/10 border border-gray-500/20 rounded-full shrink-0">
                    <Shield size={10} className="text-gray-500" />
                    <span className="text-[8px] font-black uppercase text-gray-500 tracking-wider">Vous a bloqué</span>
                  </div>
                )}
                {isAccessRevoked && (
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-orange-500/10 border border-orange-500/20 rounded-full shrink-0">
                    <UserX size={10} className="text-orange-500" />
                    <span className="text-[8px] font-black uppercase text-orange-500 tracking-wider">Accès Retiré</span>
                  </div>
                )}
                {otherUser && currentUser.mutedUsers?.includes(otherUser.uid) && (
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 rounded-full shrink-0">
                    <BellOff size={10} className="text-purple-500" />
                    <span className="text-[8px] font-black uppercase text-purple-500 tracking-wider">Mute</span>
                  </div>
                )}
              </div>
            </div>
            <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">
              {otherUser?.isOnline && !isUserBlocked ? 'En ligne maintenant' : 'Hors ligne'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {currentUser.role === 'admin' && otherUser && !isMiniChat && !isMobile && (
            <div className="flex items-center gap-1 mr-2">
              <button 
                onClick={handleBlockUser}
                className={cn(
                  "h-10 w-10 rounded-xl transition-all flex items-center justify-center",
                  isUserBlocked 
                    ? "bg-red-500/20 text-red-500" 
                    : "text-gray-400 hover:bg-red-500/10 hover:text-red-500"
                )}
              >
                <Ban size={20} />
              </button>
              <button 
                onClick={handleRemoveAccess}
                className={cn(
                  "h-10 w-10 rounded-xl transition-all flex items-center justify-center",
                  isAccessRevoked 
                    ? "bg-orange-500/20 text-orange-500" 
                    : "text-gray-400 hover:bg-orange-500/10 hover:text-orange-500"
                )}
              >
                <UserX size={20} />
              </button>
              <button 
                onClick={handleToggleMute}
                className={cn(
                  "h-10 w-10 rounded-xl transition-all flex items-center justify-center",
                  otherUser && currentUser.mutedUsers?.includes(otherUser.uid)
                    ? "bg-purple-500/20 text-purple-500" 
                    : "text-gray-400 hover:bg-purple-500/10 hover:text-purple-500"
                )}
              >
                {otherUser && currentUser.mutedUsers?.includes(otherUser.uid) ? <BellOff size={20} /> : <Bell size={20} />}
              </button>
              <button 
                onClick={handleDeleteChat}
                className="h-10 w-10 rounded-xl transition-all flex items-center justify-center text-gray-400 hover:bg-red-500/10 hover:text-red-500"
                title="Supprimer la discussion"
              >
                <Trash2 size={20} />
              </button>
            </div>
          )}
          {currentUser.role === 'admin' && (
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className={cn(
                "h-11 w-11 rounded-full transition-all border border-white/10 flex items-center justify-center", 
                isMiniChat ? "text-white/60 hover:text-blue-500 hover:border-blue-500/50 hover:bg-blue-500/5" : "hover:bg-gray-100 text-gray-400"
              )}
            >
              <MoreVertical size={20} />
            </button>
          )}
        </div>
      </div>

{/* Messages Area */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className={cn(
          "flex-1 overflow-y-auto p-6 pb-32 space-y-6 custom-scrollbar relative min-h-0",
          isMiniChat ? "bg-[#0f1113]" : "bg-[#f4f1de] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-repeat opacity-90"
        )}
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center opacity-20">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4">
              <MessageSquare size={40} />
            </div>
            <p className="text-sm font-medium">Aucun message</p>
          </div>
        )}
        
        {messages.map((msg) => (
          <MessageItem 
            key={msg.id} 
            msg={msg} 
            isMine={msg.senderId === currentUser.uid} 
            isMiniChat={isMiniChat}
            onMediaClick={(url, type) => setSelectedMedia({ url, type })}
            otherUserPhotoURL={otherUser?.photoURL}
            currentUserPhotoURL={currentUser.photoURL}
            onReact={handleReact}
            onForward={onForward}
            selectedUserCount={selectedUserIds.length}
            onDelete={handleDeleteMessage}
            isAdmin={currentUser.role === 'admin'}
          />
        ))}

        {/* Bot Interactive Options (Wizard Step) */}
        {messages.length > 0 && messages[messages.length - 1].options && messages[messages.length - 1].senderId !== currentUser.uid && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap gap-3 justify-center pt-2"
          >
              {messages[messages.length - 1].options?.map((option, index) => {
                const label = typeof option === 'string' ? option : option.label;
                const value = typeof option === 'string' ? option : option.value;
                return (
                  <button
                    key={value || index}
                    onClick={() => sendMessage(undefined, value)}
                    className={cn(
                      "px-8 py-3 rounded-2xl font-bold transition-all shadow-lg active:scale-95 border border-white/10",
                      isMiniChat 
                        ? "bg-white text-black hover:bg-gray-100" 
                        : "bg-white text-gray-900 border-gray-200 hover:bg-gray-50"
                    )}
                  >
                    {label}
                  </button>
                );
              })}
          </motion.div>
        )}

        {otherUser?.isTyping && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-4"
          >
            <div className="h-10 w-10 rounded-full overflow-hidden border border-white/10 shadow-lg">
              <img src={otherUser.photoURL} alt="" className="h-full w-full object-cover" />
            </div>
            <div className="bg-[#1a1d21] p-4 rounded-3xl rounded-tl-none border border-white/5 flex gap-1.5 shadow-xl">
              <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />

        <AnimatePresence>
          {showScrollButton && (
            <motion.button
              initial={{ opacity: 0, scale: 0.5, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.5, y: 20 }}
              onClick={scrollToBottom}
              className="fixed bottom-32 right-12 h-12 w-12 rounded-full bg-[#1a1d21] text-white shadow-2xl flex items-center justify-center hover:scale-110 active:scale-90 transition-all z-[40] border border-white/10"
            >
              <ChevronDown size={24} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Input Area (Absolute position for true glass effect) */}
      <div className={cn(
        "absolute bottom-0 left-0 right-0 z-[60] bg-transparent",
        isMobile ? "px-2 pb-4" : "px-6 pb-8"
      )}>
        {isUserBlocked ? (
          <div className={cn(
            "flex flex-col items-center justify-center bg-red-500/5 rounded-2xl border border-red-500/20 gap-2",
            isMobile ? "py-3 px-3 mx-2" : "py-6 px-6"
          )}>
            <div className="h-10 w-10 rounded-full bg-red-500/20 flex items-center justify-center text-red-500">
              <Ban size={20} />
            </div>
            <p className="font-bold text-red-500 text-center leading-relaxed text-xs max-w-[240px]">
              Vous avez bloqué ce contact. Débloquez-le pour lui envoyer un message.
            </p>
            <button 
              onClick={handleBlockUser}
              className="px-6 py-2 bg-red-500 text-white text-[9px] font-black uppercase tracking-[0.2em] rounded-full hover:bg-red-600 transition-all shadow-lg active:scale-95"
            >
              Débloquer
            </button>
          </div>
        ) : isBlockedByOther ? (
          <div className={cn(
            "flex flex-col items-center justify-center bg-gray-500/5 rounded-2xl border border-gray-500/20 gap-2",
            isMobile ? "py-3 px-3 mx-2" : "py-6 px-6"
          )}>
            <div className="h-10 w-10 rounded-full bg-gray-500/20 flex items-center justify-center text-gray-500">
              <Shield size={20} />
            </div>
            <p className="font-bold text-gray-500 text-center leading-relaxed text-xs max-w-[240px]">
              Ce contact vous a bloqué. Vous ne pouvez pas le contacter.
            </p>
          </div>
        ) : isAccessRevoked ? (
          <div className={cn(
            "flex flex-col items-center justify-center bg-orange-500/5 rounded-2xl border border-orange-500/20 gap-2",
            isMobile ? "py-3 px-3 mx-2" : "py-6 px-6"
          )}>
            <div className="h-10 w-10 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500">
              <UserX size={20} />
            </div>
            <p className="font-bold text-orange-500 text-center leading-relaxed text-xs max-w-[240px]">
              Votre accès à cette discussion a été retiré.
            </p>
          </div>
        ) : (
          <>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleFileUpload}
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
            />
            <>
              {/* External Glass Container (Wizard Style) */}
              <div className="bg-white/5 backdrop-blur-3xl border border-white/10 p-2 md:p-3 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center gap-2 md:gap-4">
                
                {/* Microphone Button (Squared Style) */}
                <button 
                  type="button"
                  onClick={isRecording ? stopRecording : startRecording}
                  className={cn(
                    "rounded-[22px] flex items-center justify-center transition-all flex-shrink-0 bg-[#0f1113] border border-white/5 shadow-xl",
                    isMobile ? "h-12 w-12" : "h-14 w-14",
                    isRecording 
                      ? "bg-red-500 text-white animate-pulse" 
                      : "text-[#a2ff00] hover:bg-black hover:scale-105 active:scale-95"
                  )}
                >
                  {isRecording ? <StopCircle size={24} /> : <Mic size={24} />}
                </button>

                {/* Main Input Bar (Squared Style) */}
                <div className={cn(
                  "flex-1 bg-[#0f1113] rounded-[22px] border border-white/5 p-1.5 flex items-center gap-3 transition-all relative overflow-hidden h-12 md:h-14",
                  isRecording && "border-red-500/50"
                )}>
                  {/* Paperclip / Attachment */}
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading || isRecording}
                    className="h-10 w-10 flex items-center justify-center text-[#a2ff00] hover:bg-white/5 rounded-xl transition-all flex-shrink-0 ml-1"
                  >
                    {isUploading ? (
                      <div className="h-5 w-5 border-2 border-[#a2ff00] border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Paperclip size={20} />
                    )}
                  </button>

                  {/* Vertical Separator */}
                  <div className="w-[1.5px] h-6 bg-[#a2ff00]/20 rounded-full flex-shrink-0" />

                  {isRecording ? (
                    <div className="flex-1 flex items-center gap-3 px-2">
                      <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
                      <span className="text-[#a2ff00] font-black text-xs tracking-widest font-mono uppercase">{formatTime(recordingTime)}</span>
                      <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          animate={{ x: ['-100%', '100%'] }}
                          transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                          className="w-1/2 h-full bg-[#a2ff00]/20"
                        />
                      </div>
                    </div>
                  ) : (
                    <textarea
                      rows={1}
                      placeholder="MESSAGE"
                      className={cn(
                        "flex-1 bg-transparent border-none outline-none text-[#a2ff00] resize-none max-h-32 no-scrollbar placeholder:text-[#a2ff00]/20 font-black uppercase tracking-[0.1em] font-mono",
                        isMobile ? "py-2 px-1 text-[13px]" : "py-2 px-1 text-[15px]"
                      )}
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                    />
                  )}

                  {/* Send Button (Wizard Style - Squared) */}
                  <button 
                    onClick={() => sendMessage()}
                    disabled={(!inputText.trim() && !isRecording) || isUploading}
                    className={cn(
                      "h-10 w-10 md:h-11 md:w-11 rounded-[18px] flex items-center justify-center transition-all shadow-lg active:scale-90 flex-shrink-0 mr-1",
                      (inputText.trim() || isRecording) 
                        ? "bg-[#a2ff00] text-black shadow-[#a2ff00]/30" 
                        : "bg-white/5 text-[#a2ff00]/20"
                    )}
                  >
                    <ChevronDown size={24} className="-rotate-90 stroke-[3px]" />
                  </button>
                </div>
              </div>
            </>
          </>
        )}
      </div>

      <AnimatePresence>
        {selectedMedia && !selectedMedia.url.startsWith('blob:') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-4 md:p-10"
            onClick={() => setSelectedMedia(null)}
          >
            <button 
              className="absolute top-6 right-6 h-12 w-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all z-[210]"
              onClick={() => setSelectedMedia(null)}
            >
              <X size={24} />
            </button>
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-full max-h-full flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              {selectedMedia.type === 'image' ? (
                <img 
                  src={selectedMedia.url} 
                  alt="Full screen" 
                  className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <video 
                  src={selectedMedia.url} 
                  controls 
                  autoPlay
                  className="max-w-full max-h-[90vh] rounded-2xl shadow-2xl"
                />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <ConfirmModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={modalConfig.onConfirm}
        title={modalConfig.title}
        message={modalConfig.message}
        confirmText={modalConfig.confirmText}
        variant={modalConfig.variant}
      />
    </div>
  );
}