'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { DISPUTE_REASON_LABELS } from '@/lib/client-status';
import type { ClientOrder } from '../../types';
import { clientApi } from '../../lib/api';

interface DisputeModalProps {
  open: boolean;
  defaultOrderId?: string;
  orders: ClientOrder[];
  onClose: () => void;
  onCreated: (disputeId: string) => void;
  showToast: (type: 'success' | 'error', message: string) => void;
}

export function DisputeModal({ open, defaultOrderId, orders, onClose, onCreated, showToast }: DisputeModalProps) {
  const [reason, setReason] = useState('');
  const [orderId, setOrderId] = useState(defaultOrderId || '');
  const [description, setDescription] = useState('');
  const [sending, setSending] = useState(false);

  const selectableOrders = orders.filter((o) => o.statusKey === 'delivered' || o.statusKey === 'in_transit');

  async function submit() {
    if (!reason || !description.trim()) {
      showToast('error', 'Merci de choisir un motif et de dÃ©crire le problÃ¨me.');
      return;
    }
    setSending(true);
    try {
      const selected = orders.find((o) => o.id === orderId);
      const res = await clientApi.createDispute({
        reason,
        description: description.trim(),
        orderId: selected ? orderId : undefined,
        orderType: selected?.type,
      });
      showToast('success', 'Votre litige a Ã©tÃ© ouvert. Notre Ã©quipe vous rÃ©pondra sous 24h ouvrÃ©es.');
      onCreated(res.disputeId);
      onClose();
      setReason('');
      setOrderId('');
      setDescription('');
    } catch (err: any) {
      showToast('error', err.message || "Impossible d'ouvrir le litige.");
    } finally {
      setSending(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
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
            className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-neutral-900">Ouvrir un litige</h2>
                <p className="mt-0.5 text-sm text-neutral-500">DÃ©crivez le problÃ¨me rencontrÃ© avec votre commande.</p>
              </div>
              <button type="button" onClick={onClose} className="rounded-xl p-2 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700" aria-label="Fermer">
                <X size={20} />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-neutral-500">Motif du litige</span>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-neutral-400"
                >
                  <option value="">Choisir un motifâ€¦</option>
                  {Object.entries(DISPUTE_REASON_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-medium text-neutral-500">Commande concernÃ©e (facultatif)</span>
                <select
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-neutral-400"
                >
                  <option value="">Aucune commande</option>
                  {selectableOrders.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.number} â€” {o.items[0]?.title || o.kindLabel}
                    </option>
                  ))}
                </select>
                <span className="mt-1 block text-[11px] text-neutral-400">Seules les commandes livrÃ©es ou en cours d'acheminement sont listÃ©es.</span>
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-medium text-neutral-500">Description dÃ©taillÃ©e</span>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  placeholder="DÃ©crivez le problÃ¨me rencontrÃ© (date de livraison, rÃ©fÃ©rence, photos si nÃ©cessaireâ€¦)"
                  className="w-full resize-none rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-neutral-400"
                />
              </label>

              <button
                type="button"
                onClick={submit}
                disabled={sending}
                className="flex w-full items-center justify-center rounded-xl bg-[#0A0D0E] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
              >
                {sending ? 'Ouvertureâ€¦' : 'Ouvrir mon litige'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}