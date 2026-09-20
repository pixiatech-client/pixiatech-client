'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Shield, User, Clock, AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n, IntlHelpers } from '@/lib/i18n';
import type { Dispute, DisputeMessage } from '@/lib/types';

interface LitigeConversationProps {
  dispute: Dispute;
  onSendReply: (disputeId: string, text: string) => Promise<void>;
  onReopen: (disputeId: string) => Promise<void>;
  isSending: boolean;
}

function formatDate(iso?: string, locale?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return String(iso);
  return IntlHelpers.formatDate(d, (locale as any) || 'fr', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function LitigeConversation({
  dispute,
  onSendReply,
  onReopen,
  isSending,
}: LitigeConversationProps) {
  const { t, locale } = useI18n();
  const [replyText, setReplyText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const messages = dispute.messages || [];

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || isSending) return;
    const textToSend = replyText.trim();
    setReplyText('');
    await onSendReply(dispute.id, textToSend);
  };

  const isClosed = dispute.status === 'closed';

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-white">
      {/* Messages Scroll Area */}
      <div className="p-5 flex-1 overflow-y-auto space-y-4 max-h-[480px] bg-neutral-50/40">
        {/* Initial statement from client */}
        <div className="p-4 rounded-2xl bg-white border border-neutral-200 text-xs space-y-2 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 font-semibold text-[11px] flex-wrap gap-1">
            <span className="flex items-center gap-1.5 text-neutral-800">
              <User className="w-3.5 h-3.5 text-neutral-600" />
              <span>{t('admin.litiges.initialReport', { email: dispute.customerEmail })}</span>
            </span>
            <span className="text-neutral-400">{formatDate(dispute.createdAt, locale)}</span>
          </div>

          <div className="text-neutral-900 font-semibold pt-1">
            {t('admin.litiges.reasonLabel')} <span className="font-normal text-neutral-700">{dispute.reason}</span>
          </div>

          <p className="text-neutral-800 leading-relaxed whitespace-pre-wrap bg-neutral-50 p-3 rounded-xl border border-neutral-100">
            {dispute.description}
          </p>
        </div>

        {/* Thread messages */}
        {messages.length > 0 ? (
          messages.map((msg, idx) => {
            const isAdmin = msg.sender === 'admin';
            return (
              <div
                key={idx}
                className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'} space-y-1`}
              >
                <div className="flex items-center gap-2 text-[11px] text-neutral-400 px-1">
                  <span className="font-semibold text-neutral-700">
                    {isAdmin ? t('admin.litiges.adminSupport') : dispute.customerEmail}
                  </span>
                  <span>•</span>
                  <span>{formatDate(msg.createdAt, locale)}</span>
                  {isAdmin && (
                    <span className="px-1.5 py-0.2 bg-[#0A0D0E] text-white text-[9px] font-bold rounded">
                      ADMIN
                    </span>
                  )}
                </div>

                <div
                  className={`max-w-[88%] sm:max-w-[80%] p-4 rounded-2xl text-xs leading-relaxed ${
                    isAdmin
                      ? 'bg-[#0A0D0E] text-white rounded-tr-xs shadow-xs'
                      : 'bg-white border border-neutral-200/90 text-neutral-800 rounded-tl-xs shadow-xs'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-6 text-center text-xs text-neutral-400">
            {t('admin.litiges.noMessages')}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Reply or Closed notice */}
      {isClosed ? (
        <div className="p-4 border-t border-neutral-200 bg-neutral-50/80 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-neutral-600">
            <AlertCircle className="w-4 h-4 text-neutral-400 shrink-0" />
            <span>{t('admin.litiges.closedNotice')}</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onReopen(dispute.id)}
            className="rounded-xl border-neutral-200 text-xs font-bold gap-1.5 bg-white hover:bg-neutral-100 shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t('admin.litiges.reopenCase')}</span>
          </Button>
        </div>
      ) : (
        <form
          onSubmit={handleSend}
          className="p-4 border-t border-neutral-200/80 bg-white flex items-end gap-3"
        >
          <div className="flex-1">
            <label htmlFor="admin-dispute-reply" className="sr-only">
              {t('admin.litiges.replySrLabel')}
            </label>
            <textarea
              id="admin-dispute-reply"
              rows={2}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={t('admin.litiges.replyPlaceholder')}
              className="w-full px-4 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-800 placeholder-neutral-400 focus:outline-hidden focus:ring-2 focus:ring-black focus:bg-white resize-none transition-all"
            />
          </div>

          <Button
            type="submit"
            disabled={!replyText.trim() || isSending}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs transition-all shrink-0 cursor-pointer ${
              replyText.trim() && !isSending
                ? 'bg-[#0A0D0E] text-white hover:bg-neutral-800 shadow-md'
                : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
            }`}
          >
            <span>{isSending ? t('admin.litiges.sending') : t('admin.litiges.send')}</span>
            <Send className="w-3.5 h-3.5 text-[#38E044]" />
          </Button>
        </form>
      )}
    </div>
  );
}
