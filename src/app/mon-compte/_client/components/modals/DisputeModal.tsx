'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, AlertTriangle, ArrowRight, X } from 'lucide-react';
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
      showToast('error', 'Merci de choisir un motif et de décrire le problème.');
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
      showToast('success', 'Votre litige a été ouvert. Notre équipe vous répondra sous 24h ouvrées.');
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
            className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-neutral-200 bg-white shadow-2xl sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-neutral-100 p-5 pb-3">
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white">
                  <AlertCircle className="size-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-neutral-900">Ouvrir un Litige / Réclamation</h2>
                  <p className="text-xs text-neutral-500">Traitement prioritaire sous 24h ouvrées par le support client</p>
                </div>
              </div>
              <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-neutral-400 transition hover:bg-neutral-100 hover:text-black" aria-label="Fermer">
                <X className="size-5" />
              </button>
            </div>

            {orders.length === 0 ? (
              <div className="space-y-3 p-8 text-center text-xs text-neutral-500">
                <AlertCircle className="mx-auto size-8 shrink-0 text-neutral-300" />
                <p>Vous n'avez aucune commande sur laquelle ouvrir un litige.</p>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl bg-neutral-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-neutral-800"
                >
                  Fermer
                </button>
              </div>
            ) : (
              <>
                <div className="flex-1 space-y-4 overflow-y-auto p-5 text-xs">
                  <label className="block space-y-1.5">
                    <span className="font-semibold text-neutral-800">
                      1. Commande concernée <span className="font-normal text-neutral-400">(facultatif)</span>
                    </span>
                    <select
                      value={orderId}
                      onChange={(e) => setOrderId(e.target.value)}
                      className="w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 font-medium text-neutral-900 outline-none transition focus:border-neutral-500 focus:ring-2 focus:ring-black/10"
                    >
                      <option value="">Aucune commande</option>
                      {selectableOrders.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.number} — {o.items[0]?.title || o.kindLabel}
                        </option>
                      ))}
                    </select>
                    <span className="block text-[11px] text-neutral-400">
                      Seules les commandes livrées ou en cours d'acheminement sont listées.
                    </span>
                  </label>

                  <label className="block space-y-1.5">
                    <span className="font-semibold text-neutral-800">2. Motif principal de l'incident</span>
                    <select
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 font-medium text-neutral-900 outline-none transition focus:border-neutral-500 focus:ring-2 focus:ring-black/10"
                    >
                      <option value="">Choisir un motif…</option>
                      {Object.entries(DISPUTE_REASON_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </label>

                  <label className="block space-y-1.5">
                    <span className="font-semibold text-neutral-800">3. Détaillez l'incident et vos constatations</span>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                      placeholder="Indiquez l'état du colis, les réserves émises au livreur ou tout élément utile pour l'instruction de votre dossier…"
                      className="w-full resize-none rounded-xl border border-neutral-300 px-3.5 py-2.5 text-xs text-neutral-900 outline-none transition focus:border-neutral-500 focus:ring-2 focus:ring-black/10"
                    />
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2.5 border-t border-neutral-100 p-4">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={sending}
                    className="rounded-xl px-4 py-2 text-xs font-semibold text-neutral-600 transition hover:bg-neutral-100 disabled:opacity-40"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={submit}
                    disabled={sending}
                    className="flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-amber-700 disabled:opacity-50"
                  >
                    {sending && <AlertTriangle className="size-3.5 animate-pulse" />}
                    <span>{sending ? 'Envoi en cours…' : 'Transmettre le litige'}</span>
                    {!sending && <ArrowRight className="size-3.5" />}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}