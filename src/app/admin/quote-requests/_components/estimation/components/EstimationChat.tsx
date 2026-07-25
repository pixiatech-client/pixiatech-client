'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Paperclip, MoreVertical, Phone, Video, Shield, Mic, StopCircle } from 'lucide-react';
import { 
  doc, 
  collection, 
  query,
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  updateDoc, 
  getDoc, 
  setDoc,
  increment,
  arrayUnion
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { firestore as db, storage } from '@/firebase/config';
import { Estimation } from '../types';
import { useAdminT } from '@/hooks/useAdminT';

interface SimpleUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'admin' | 'prestataire' | 'commercial';
}

interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName?: string;
  senderRole?: string;
  content: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'file';
  fileUrl?: string;
  createdAt: any;
}

interface EstimationChatProps {
  isOpen: boolean;
  onClose: () => void;
  estimation: Estimation;
  currentUser: SimpleUser;
  suppliers: any[];
  onMessageSent?: () => void;
}

export const EstimationChat: React.FC<EstimationChatProps> = ({
  isOpen,
  onClose,
  estimation,
  currentUser,
  suppliers,
  onMessageSent,
}) => {
  const { t: adt } = useAdminT();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [otherUser, setOtherUser] = useState<SimpleUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<{ url: string, type: 'image' | 'video' } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const chatId = `est_${estimation.id}`;

  const ensureParticipant = async () => {
    try {
      const chatRef = doc(db, 'chats', chatId);
      const chatDoc = await getDoc(chatRef);
      
      if (!chatDoc.exists()) {
        console.warn('[EstimationChat] Chat does not exist yet');
        return null;
      }
      
      const chatData = chatDoc.data();
      const participants = chatData.participants || [];
      
      if (!participants.includes(currentUser.uid)) {
        console.log('[EstimationChat] Adding user to participants:', currentUser.uid);
        await setDoc(chatRef, {
          participants: arrayUnion(currentUser.uid),
          [`unreadCount.${currentUser.uid}`]: 0,
        }, { merge: true });
        participants.push(currentUser.uid);
      }
      
      return { ...chatData, participants };
    } catch (error) {
      console.error('[EstimationChat] Error ensuring participant:', error);
      return null;
    }
  };

  useEffect(() => {
    if (estimation.supplierId) {
      const isCurrentUserSupplier = currentUser.uid === estimation.supplierId;
      
      if (isCurrentUserSupplier) {
        setOtherUser({
          uid: estimation.treatedBy || 'admin',
          email: '',
          displayName: estimation.treatedByName || adt('Admin'),
          photoURL: undefined,
          role: (estimation.treatedByRole as any) || 'admin',
        });
      } else {
        if (suppliers.length > 0) {
          const supplier = suppliers.find((s: any) => s.uid === estimation.supplierId);
          if (supplier) {
            setOtherUser({
              uid: supplier.uid,
              email: supplier.email,
              displayName: supplier.displayName || supplier.email,
              photoURL: supplier.photoURL,
              role: 'prestataire' as const,
            });
          } else {
            setOtherUser(null);
          }
        } else {
          setOtherUser(null);
        }
      }
    } else {
      setOtherUser(null);
    }
  }, [estimation.supplierId, estimation.treatedBy, estimation.treatedByName, estimation.treatedByRole, suppliers, currentUser.uid, currentUser.role]);

  useEffect(() => {
    if (!isOpen || !estimation) return;

    let unsubscribe: (() => void) | null = null;

    const init = async () => {
      setIsLoading(true);

      const chatData = await ensureParticipant();
      if (!chatData) {
        console.warn('[EstimationChat] Chat not accessible');
        setIsLoading(false);
        return;
      }

      const messagesRef = collection(db, 'chats', chatId, 'messages');
      const q = query(messagesRef, orderBy('createdAt', 'asc'));

      unsubscribe = onSnapshot(q, (snapshot) => {
        const msgs: ChatMessage[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          msgs.push({
            id: docSnap.id,
            chatId: data.chatId || chatId,
            senderId: data.senderId,
            senderName: data.senderName,
            senderRole: data.senderRole,
            content: data.content,
            type: data.type || 'text',
            fileUrl: data.fileUrl,
            createdAt: data.createdAt,
          });
        });
        setMessages(msgs);
        setIsLoading(false);

        setDoc(doc(db, 'chats', chatId), {
          [`unreadCount.${currentUser.uid}`]: 0
        }, { merge: true }).catch(() => {});

        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      });
    };

    init();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isOpen, estimation, chatId]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        
        try {
          const storageRef = ref(storage, `chats/${chatId}/audio_${Date.now()}.webm`);
          await uploadBytes(storageRef, blob);
          const downloadURL = await getDownloadURL(storageRef);
          
          await sendMediaMessage('audio', downloadURL, adt('Message vocal'));
        } catch (uploadError) {
          console.error('Error uploading audio:', uploadError);
        }
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Error accessing microphone:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
    }
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !estimation) return;

    setIsUploading(true);
    
    let type: 'image' | 'video' | 'file' = 'file';
    if (file.type.startsWith('image/')) type = 'image';
    else if (file.type.startsWith('video/')) type = 'video';

    try {
      const storageRef = ref(storage, `chats/${chatId}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      await sendMediaMessage(type, downloadURL, file.name);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert(adt('Erreur lors de l\'envoi du fichier'));
    }
    
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const sendMediaMessage = async (type: 'image' | 'video' | 'audio' | 'file', fileUrl: string, content: string) => {
    try {
      const targetUserId = currentUser.uid === estimation.supplierId
        ? estimation.treatedBy
        : estimation.supplierId;

      if (!targetUserId || targetUserId === currentUser.uid) {
        console.warn('[EstimationChat] Invalid target for message');
        return;
      }

      const messageData = {
        chatId,
        senderId: currentUser.uid,
        senderName: currentUser.displayName,
        senderRole: currentUser.role,
        content,
        type,
        fileUrl,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'chats', chatId, 'messages'), messageData);

      await setDoc(doc(db, 'chats', chatId), {
        lastMessage: `[${type}]`,
        lastMessageAt: serverTimestamp(),
        [`unreadCount.${targetUserId}`]: increment(1),
      }, { merge: true });

      scrollToBottom();
      onMessageSent?.();
    } catch (error) {
      console.error('[EstimationChat] Error sending media:', error);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !estimation) return;

    try {
      const targetUserId = currentUser.uid === estimation.supplierId
        ? estimation.treatedBy
        : estimation.supplierId;

      if (!targetUserId || targetUserId === currentUser.uid) {
        console.warn('[EstimationChat] Invalid target for message');
        return;
      }

      const messageData = {
        chatId,
        senderId: currentUser.uid,
        senderName: currentUser.displayName,
        senderRole: currentUser.role,
        content: inputText.trim(),
        type: 'text',
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'chats', chatId, 'messages'), messageData);

      await setDoc(doc(db, 'chats', chatId), {
        lastMessage: inputText.trim(),
        lastMessageAt: serverTimestamp(),
        [`unreadCount.${targetUserId}`]: increment(1),
      }, { merge: true });

      await addDoc(collection(db, 'notifications'), {
        userId: targetUserId,
        type: 'message',
        title: adt(`Nouveau message de ${currentUser.displayName || 'quelqu\'un'}`),
        description: inputText.trim().substring(0, 100),
        href: '/admin/quote-requests',
        read: false,
        createdAt: serverTimestamp()
      });

      setInputText('');
      scrollToBottom();
      onMessageSent?.();
    } catch (error) {
      console.error('[EstimationChat] Error sending message:', error);
      alert(adt('Erreur lors de l\'envoi du message'));
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const getOtherUserColor = (role: string) => {
    switch (role) {
      case 'admin': return 'border-blue-500';
      case 'prestataire': return 'border-green-500';
      case 'commercial': return 'border-orange-500';
      default: return 'border-gray-500';
    }
  };

  const renderMessageContent = (msg: ChatMessage) => {
    switch (msg.type) {
      case 'image':
        return (
          <img 
            src={msg.fileUrl} 
            alt={msg.content}
            className="max-w-[300px] rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => setSelectedMedia({ url: msg.fileUrl!, type: 'image' })}
          />
        );
      case 'video':
        return (
          <video 
            src={msg.fileUrl} 
            controls
            className="max-w-[300px] rounded-xl"
          />
        );
      case 'audio':
        return (
          <audio 
            src={msg.fileUrl} 
            controls
            className="max-w-[300px]"
          />
        );
      default:
        return <p className="text-sm leading-relaxed">{msg.content}</p>;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] pointer-events-none">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
          />

          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-[#0f1113] shadow-2xl border-l border-white/10 flex flex-col pointer-events-auto"
          >
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-zinc-900">
              <div className="flex items-center gap-3">
                <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg transition-all">
                  <X className="w-5 h-5 text-zinc-400" />
                </button>
                {otherUser && (
                  <>
                    <div className={`w-10 h-10 rounded-full border-2 p-0.5 ${getOtherUserColor(otherUser.role)}`}>
                      <div className="w-full h-full rounded-full overflow-hidden bg-gray-900">
                        {otherUser.photoURL ? (
                          <img 
                            src={otherUser.photoURL} 
                            alt={otherUser.displayName}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full rounded-full bg-[#95d230] flex items-center justify-center text-black font-bold text-sm">
                            {otherUser.displayName.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-white tracking-tight">{otherUser.displayName}</h2>
                      <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wide">{estimation.number}</p>
                    </div>
                  </>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button className="p-2 hover:bg-white/10 rounded-lg transition-all">
                  <Phone className="w-4 h-4 text-zinc-400" />
                </button>
                <button className="p-2 hover:bg-white/10 rounded-lg transition-all">
                  <Video className="w-4 h-4 text-zinc-400" />
                </button>
                <button className="p-2 hover:bg-white/10 rounded-lg transition-all">
                  <MoreVertical className="w-5 h-5 text-zinc-400" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-black">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-zinc-500 text-xs">{adt('Loading...')}</div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center mb-4">
                    <Shield className="w-8 h-8 text-zinc-600" />
                  </div>
                  <h3 className="text-zinc-300 text-sm font-bold mb-1">{adt('Start a conversation')}</h3>
                  <p className="text-zinc-600 text-xs">
                    {adt('Envoyez un message au')} {otherUser?.role === 'prestataire' ? adt('fournisseur') : adt('client')}
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMine = msg.senderId === currentUser.uid;
                  const senderName = msg.senderName || (isMine ? adt('Vous') : adt('Inconnu'));
                  const senderRole = msg.senderRole || (isMine ? currentUser.role : 'unknown');
                  const roleLabel = senderRole === 'admin' ? adt('Admin') : senderRole === 'prestataire' ? adt('Fournisseur') : adt('Commercial');
                  const roleColor = senderRole === 'admin' ? 'bg-blue-500/20 text-blue-400' : senderRole === 'prestataire' ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400';
                  
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                    >
                      {!isMine && (
                        <div className="flex items-center gap-2 mb-1.5 self-start">
                          <span className="text-[10px] font-bold text-zinc-300">{senderName}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${roleColor}`}>
                            {roleLabel}
                          </span>
                        </div>
                      )}
                      
                      <div
                        className={`max-w-[80%] p-3 rounded-2xl shadow-lg ${
                          isMine
                            ? 'bg-[#1447e6] text-white rounded-tr-none'
                            : 'bg-zinc-800 text-white rounded-tl-none'
                        }`}
                      >
                        {renderMessageContent(msg)}
                      </div>
                      <span className="text-[10px] text-zinc-500 mt-1 px-1">
                        {formatTime(msg.createdAt)}
                        {isMine && (
                          <span className="ml-1 text-[#95d230]">{adt('• Sent')}</span>
                        )}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-zinc-900 border-t border-white/10">
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleFileUpload}
                accept="image/*,video/*,.pdf,.doc,.docx"
              />
              <div className="flex items-end gap-2">
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading || isRecording}
                  className="p-2.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-all disabled:opacity-50 flex-shrink-0"
                >
                  {isUploading ? (
                    <div className="w-5 h-5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Paperclip className="w-5 h-5" />
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isUploading}
                  className={`p-2.5 rounded-lg transition-all flex-shrink-0 ${
                    isRecording
                      ? 'text-red-500 bg-red-500/10 hover:bg-red-500/20'
                      : 'text-zinc-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {isRecording ? <StopCircle className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
                
                <div className="flex-1 relative">
                  {isRecording && (
                    <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      <span className="text-red-500 text-xs font-mono">{adt('Recording... ')}{formatRecordingTime(recordingTime)}</span>
                    </div>
                  )}
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder={adt('Your message...')}
                    className="w-full p-3 bg-black border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none text-sm text-white min-h-[44px] max-h-[120px]"
                    rows={1}
                  />
                </div>
                
                <button
                  onClick={handleSendMessage}
                  disabled={!inputText.trim()}
                  className="p-3 bg-[#1447e6] text-white rounded-xl hover:bg-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>

            <AnimatePresence>
              {selectedMedia && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[300] bg-black/95 flex items-center justify-center p-4"
                  onClick={() => setSelectedMedia(null)}
                >
                  <button 
                    className="absolute top-6 right-6 h-12 w-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all z-[310]"
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
                        alt={adt('Full screen')} 
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
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default EstimationChat;