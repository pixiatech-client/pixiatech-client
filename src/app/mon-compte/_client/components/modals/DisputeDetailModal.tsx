'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, Send, X } from 'lucide-react';
import type { ClientDispute } from '../../types';
import { clientApi } from '../../lib/api';
import { formatDate } from '../../lib/format';

interface DisputeDetailModalProps {
  dispute: ClientDispute | null;
  onClose: () => void;
  onReplied: (dispute: ClientDispute) => void;
  showToast: (type: 'success' | 'error', message: string) => void;
}

export function DisputeDetailModal({ dispute, onClose, onReplied, showToast }: DisputeDetailModalProps) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  async function reply() {
    if (!dispute || !text.trim()) return;
    setSending(true);
    try {
      await clientApi.replyDispute(dispute.id, text.trim());
      const updated = {
        ...dispute,
        unreadByClient: false,
        lastResponseDate: new Date().toISOString(),
        messages: [
          ...dispute.messages,
          {
            id: `${dispute.messages.length}`,
            sender: 'customer' as const,
            senderName: 'Vous',
            message: text.trim(),
            date: formatDate(new Date().toISOString()),
            time: `${String(new Date().getHours()).padStart(2, '0')}h${String(new Date().getMinutes()).padStart(2, '0')}`,
          },
        ],
      };
      onReplied(updated);
      setText('');
      showToast('success', 'Votre message a Ã©tÃ© envoyÃ©.');
    } catch (err: any) {
      showToast('error', err.message || "Impossible d'envoyer votre message.");
    } finally {
      setSending(false);
    }
  }

  return (
    <AnimatePresence>
      {dispute && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-xs sm:items-center sm:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-neutral-100 p-5">
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wide text-neutral-400">
                  {dispute.orderNumber || 'Demande'} Â· {dispute.reasonLabel}
                </p>
                <h2 className="truncate text-lg font-extrabold text-neutral-900">
                  {dispute.productName || 'Mon litige'}
                </h2>
                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 font-semibold text-amber-700">{dispute.statusLabel}</span>
                  {!dispute.unreadByClient && <span>Mise Ã  jour le {formatDate(dispute.lastResponseDate)}</span>}
                </div>
              </div>
              <button type="button" onClick={onClose} className="rounded-xl p-2 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700" aria-label="Fermer">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto bg-[#fafafa] p-5">
              {dispute.messages.length === 0 && (
                <p className="py-8 text-center text-sm text-neutral-500">Aucun message pour le moment.</p>
              )}
              {dispute.messages.map((m) => {
                const fromCustomer = m.sender === 'customer';
                return (
                  <div key={m.id} className={`flex ${fromCustomer ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${fromCustomer ? 'bg-[#0A0D0E] text-white' : 'border border-neutral-200 bg-white text-neutral-800'}`}>
                      <p className="text-[11px] font-semibold opacity-70">{m.senderName}</p>
                      <p className="mt-0.5 whitespace-pre-wrap text-sm leading-relaxed">{m.message}</p>
                      <p className={`mt-1.5 text-right text-[11px] ${fromCustomer ? 'opacity-50' : 'text-neutral-400'}`}>
                        {m.date} Â· {m.time}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-neutral-100 p-4">
              <div className="flex items-end gap-2">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={2}
                  placeholder="Ã‰crivez votre rÃ©ponseâ€¦"
                  className="flex-1 resize-none rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-neutral-400"
                />
                <button
                  type="button"
                  onClick={reply}
                  disabled={sending || !text.trim()}
                  className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#0A0D0E] text-white transition hover:opacity-90 disabled:opacity-40"
                  aria-label="Envoyer"
                >
                  {sending ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
                </button>
              </div>
              <p className="mt-2 text-[11px] text-neutral-400">
                {dispute.statusLabel === 'RÃ©solu' || dispute.statusLabel === 'FermÃ©'
                  ? 'Ce litige est clÃ´turÃ©. Pour rouvrir, ouvrez un nouveau litige.'
                  : 'Notre Ã©quipe rÃ©pond sous 24h ouvrÃ©es.'}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}