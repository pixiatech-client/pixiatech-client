'use client';

import React, { useState, useRef } from 'react';
import { format } from 'date-fns';
import { Check, CheckCheck, Video, Paperclip, Mic, Play, Pause, Share2, Trash2 } from 'lucide-react';
import { cn, formatTimestamp } from '@/lib/utils';
import { Message, MessageOption } from '@/lib/types';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { useRoles } from '@/contexts/RoleContext';
import { useI18n } from '@/lib/i18n';
import { getAvatarUrl } from '@/lib/avatar';

const translateOption = (option: MessageOption | string, translateFn: (key: string, params?: Record<string, string | number>) => string): string => {
  if (typeof option === 'string') return option;
  if (option.translationKey) {
    return translateFn(option.translationKey, option.translationParams);
  }
  return option.label;
};

const TypewriterText = ({ content, isMine }: { content: string; isMine: boolean }) => {
  // Split by HTML tags, entities, or spaces, keeping the separators
  const tokens = content.split(/(<[^>]*>|&[a-z0-9#]+;|\s+)/).filter(t => t.length > 0);
  const [visibleCount, setVisibleCount] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setVisibleCount(prev => {
        if (prev >= tokens.length) {
          clearInterval(timer);
          return prev;
        }
        return prev + 1;
      });
    }, 25);
    return () => clearInterval(timer);
  }, [tokens.length]);

  const displayedContent = tokens.slice(0, visibleCount).join('');
  
  return (
    <span 
      className="inline"
      dangerouslySetInnerHTML={{ __html: displayedContent }}
    />
  );
};

interface MessageItemProps {
  msg: Message;
  isMine: boolean;
  isMiniChat?: boolean;
  onMediaClick?: (url: string, type: 'image' | 'video') => void;
  otherUserPhotoURL?: string;
  currentUserPhotoURL?: string;
  onForward?: (msg: Message) => void;
  onReact?: (messageId: string, emoji: string) => Promise<void>;
  selectedUserCount?: number;
  isBotAvatar?: boolean;
  onDelete?: (messageId: string) => void;
  isAdmin?: boolean;
  isOpen?: boolean;
  onSwipeOpen?: () => void;
}

export default function MessageItem({ msg, isMine, isMiniChat, onMediaClick, otherUserPhotoURL, currentUserPhotoURL, onReact, onForward, selectedUserCount = 0, isBotAvatar, onDelete, isAdmin, isOpen, onSwipeOpen }: MessageItemProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showForwardConfirm, setShowForwardConfirm] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const controls = useAnimation();
  const { getRoleColor, getRoleName } = useRoles();
  const { t } = useI18n();

  const getTranslatedContent = () => {
    if (msg.translationKey) {
      return t(msg.translationKey, msg.translationParams);
    }
    return msg.content;
  };

  React.useEffect(() => {
    if (!isOpen) {
      controls.start({ x: 0 });
    }
  }, [isOpen, controls]);

  const toggleAudio = () => {
    if (!msg.fileUrl) return;
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      audioRef.current = null;
      setIsPlaying(false);
      return;
    }
    const audio = new Audio(`/api/audio?url=${encodeURIComponent(msg.fileUrl)}`);
    audio.onended = () => { setIsPlaying(false); audioRef.current = null; };
    audio.onerror = () => { setIsPlaying(false); };
    audio.play().then(() => {
      setIsPlaying(true);
      audioRef.current = audio;
    }).catch(() => setIsPlaying(false));
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    // Only allow deletion if it's my message OR if I am admin
    if (!isMine && !isAdmin) return;
    
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };


  return (
    <div className="relative group/message mb-1 w-full">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', damping: 20, stiffness: 200 }}
        className={cn("flex flex-col gap-1 w-full relative z-10", isMine ? "items-end" : "items-start")}
      >
        <div className={cn("flex items-end gap-2 relative", isMine ? "flex-row-reverse" : "flex-row")}>
          {!isMine && isBotAvatar ? (
            <motion.div 
              animate={{ y: [-3, 3, -3] }} 
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              className="w-16 h-16 flex-shrink-0 drop-shadow-md z-10"
            >
              <img 
                src={msg.botImage || otherUserPhotoURL} 
                alt={t('chat.botAvatar')} 
                className="w-full h-full object-contain scale-[1.3] origin-bottom" 
              />
            </motion.div>
          ) : (
            <div className="h-12 w-12 rounded-full overflow-hidden flex-shrink-0 shadow-xl border-2 border-white/20">
              <img 
                src={isMine ? currentUserPhotoURL : otherUserPhotoURL} 
                alt="" 
                className="h-full w-full object-cover" 
              />
            </div>
          )}
          <div className={cn("flex flex-col gap-1", isMine ? "items-end" : "items-start")}>
            {!isMine && (msg.senderName || msg.senderRole) && (
              <div className="flex items-center gap-2 px-1">
                {msg.senderRole && (
                  <span 
                    className="text-[8px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded-full"
                    style={{ 
                      backgroundColor: msg.senderRole === 'bot' ? 'rgba(99, 102, 241, 0.2)' : `${getRoleColor(msg.senderRole)}33`, 
                      color: msg.senderRole === 'bot' ? '#818cf8' : getRoleColor(msg.senderRole) 
                    }}
                  >
                    {msg.senderRole === 'bot' ? t('chat.bot') : getRoleName(msg.senderRole)}
                  </span>
                )}
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">{msg.senderName || t('common.user')}</span>
              </div>
            )}
          <div
            onContextMenu={handleContextMenu}
            className={cn(
              "w-full max-w-full rounded-[32px] p-4 text-sm shadow-2xl relative group cursor-pointer transition-all active:scale-[0.98]",
              isMine 
                ? "bg-[#6366f1] text-white rounded-br-none shadow-indigo-900/10" 
                : "bg-white text-slate-900 rounded-bl-none shadow-sm border border-slate-100"
            )}
          >


            {msg.type === 'video' && msg.fileUrl && !msg.fileUrl.startsWith('blob:') && (
              <div 
                className="mb-2 overflow-hidden rounded-2xl bg-black/40 cursor-pointer hover:opacity-90 transition-all relative group"
                onClick={(e) => {
                  e.stopPropagation();
                  onMediaClick?.(msg.fileUrl!, 'video');
                }}
              >
                <video src={msg.fileUrl} className="max-h-60 w-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-all">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30">
                    <Video size={24} className="text-white fill-white" />
                  </div>
                </div>
              </div>
            )}
            
            {msg.type === 'image' && msg.fileUrl && !msg.fileUrl.startsWith('blob:') && (
              <div 
                className="mb-2 overflow-hidden rounded-2xl bg-black/40 cursor-pointer hover:opacity-90 transition-all"
                onClick={(e) => {
                  e.stopPropagation();
                  onMediaClick?.(msg.fileUrl!, 'image');
                }}
              >
                <img src={msg.fileUrl} alt="" className="max-h-60 w-full object-cover hover:scale-105 transition-transform" referrerPolicy="no-referrer" />
              </div>
            )}

            {msg.type === 'file' && msg.fileUrl && !msg.fileUrl.startsWith('blob:') && (
              <a 
                href={msg.fileUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className={cn(
                  "mb-2 flex items-center gap-3 p-3 rounded-2xl border transition-all",
                  isMine ? "bg-white/10 border-white/10 hover:bg-white/20" : "bg-white/5 border-white/5 hover:bg-white/10"
                )}
              >
                <div className="h-10 w-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                  <Paperclip size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{msg.content || t('chat.document')}</p>
                  <p className="text-[10px] opacity-60 font-bold uppercase tracking-wider">PDF • 1.2 MB</p>
                </div>
              </a>
            )}

            {msg.type === 'audio' && msg.fileUrl && !msg.fileUrl.startsWith('blob:') && (
              <div 
                onClick={(e) => e.stopPropagation()}
                className={cn("mb-2 flex items-center gap-4 min-w-[260px] p-3 rounded-2xl bg-black/20 backdrop-blur-md border border-white/5")}
              >
                <button 
                  onClick={toggleAudio}
                  className={cn("h-10 w-10 rounded-full flex items-center justify-center transition-all active:scale-90 shadow-lg", isMine ? "bg-white/20 hover:bg-white/30" : "bg-[#4f46e5] text-white hover:bg-[#4338ca]")}
                >
                  {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-1" />}
                </button>

                <div className="flex-1 h-10 flex items-center gap-1">
                  {[...Array(24)].map((_, i) => (
                    <div 
                      key={i} 
                      className={cn("w-0.5 rounded-full transition-all duration-300", isMine ? "bg-white/30" : "bg-blue-500/30")} 
                      style={{ 
                        height: `${30 + Math.random() * 70}%`,
                        opacity: isPlaying ? 1 : 0.5
                      }} 
                    />
                  ))}
                </div>
                <span className="text-[10px] font-black opacity-60 font-mono">
                  {msg.duration ? `${Math.floor(msg.duration / 60)}:${(msg.duration % 60).toString().padStart(2, '0')}` : '0:00'}
                </span>
              </div>
            )}

            {msg.type === 'text' && (
              <div className="leading-relaxed font-medium text-[15px]">
                {!isMine && !msg.fileUrl ? (
                  <TypewriterText content={getTranslatedContent()} isMine={isMine} />
                ) : (
                  <div dangerouslySetInnerHTML={{ __html: getTranslatedContent() }} />
                )}
              </div>
            )}

            {msg.type === 'summary' && msg.summaryData && (
              <div className="w-full min-w-[280px] bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mb-2">
                <h3 className="text-[#0078ff] font-bold text-lg mb-3 border-b border-slate-100 pb-2">{t('common.projectSummary')}</h3>
                <div className="flex flex-col gap-2">
                  {Object.entries(msg.summaryData).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-slate-500 text-sm font-medium">{key}:</span>
                      <span className="text-slate-900 text-sm font-bold">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}


            
            <div className={cn("mt-2 flex items-center justify-end gap-2 text-[10px] opacity-60 font-bold")}>
              <span>{formatTimestamp(msg.createdAt)}</span>
              {isMine && (
                msg.status === 'seen' ? (
                  <CheckCheck size={14} className="text-blue-400 opacity-100" />
                ) : (
                  <Check size={14} className="text-white/40" />
                )
              )}
            </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Context Menu */}
      <AnimatePresence>
        {contextMenu && (
          <>
            <div 
              className="fixed inset-0 z-[150]" 
              onClick={() => setContextMenu(null)}
              onContextMenu={(e) => { e.preventDefault(); setContextMenu(null); }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              style={{ top: contextMenu.y, left: contextMenu.x }}
              className="fixed z-[160] min-w-[160px] bg-[#0f1113]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden py-1.5"
            >
              <button
                onClick={() => {
                  onDelete?.(msg.id);
                  setContextMenu(null);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-red-500 hover:bg-red-500/10 transition-colors text-left"
              >
                <Trash2 size={16} />
                <span className="text-xs font-black uppercase tracking-wider">{t('common.delete')}</span>
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
