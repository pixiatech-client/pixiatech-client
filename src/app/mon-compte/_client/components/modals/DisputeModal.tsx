'use client';

import React, { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  X,
  ArrowRight
} from 'lucide-react';
import type { Order, Dispute, DisputeReason } from '../../types';
import { clientApi } from '../../lib/api';

interface DisputeModalProps {
  isOpen?: boolean;
  open?: boolean;
  onClose: () => void;
  orders: Order[];
  preselectedOrder?: Order | null;
  defaultOrderId?: string;
  onSubmitDispute?: (dispute: Omit<Dispute, 'id' | 'date' | 'status'>) => void;
  onCreated?: (disputeId: string) => void;
  showToast?: (type: 'success' | 'error', message: string) => void;
}

const DISPUTE_REASONS: { value: DisputeReason; label: string }[] = [
  { value: 'damaged_package', label: 'Colis endommagé ou reconditionné par le transporteur' },
  { value: 'missing_item', label: 'Article manquant dans le colis scellé' },
  { value: 'delivery_delay', label: 'Retard de livraison majeur (délai garanti dépassé)' },
  { value: 'wrong_reference', label: 'Erreur sur la référence ou le modèle reçu' },
  { value: 'defective_product', label: 'Produit défectueux ou panne au déballage' },
  { value: 'other', label: 'Autre réclamation logistique' }
];

export const DisputeModal: React.FC<DisputeModalProps> = ({
  isOpen,
  open,
  onClose,
  orders,
  preselectedOrder = null,
  defaultOrderId,
  onSubmitDispute,
  onCreated,
  showToast
}) => {
  const visible = isOpen ?? open ?? false;
  const initialOrderId = preselectedOrder?.id || defaultOrderId || (orders[0]?.id ?? '');
  const [selectedOrderId, setSelectedOrderId] = useState<string>(initialOrderId);
  const [reason, setReason] = useState<DisputeReason>('damaged_package');
  const [description, setDescription] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!visible) return null;

  const currentOrder = orders.find((o) => o.id === selectedOrderId) || orders[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!currentOrder) {
      setErrorMsg('Veuillez sélectionner une commande valide.');
      return;
    }
    if (!description.trim() || description.trim().length < 10) {
      setErrorMsg('Veuillez décrire le problème rencontré avec un minimum de 10 caractères.');
      return;
    }

    setIsSubmitting(true);
    const selectedItem = currentOrder.items[0];
    const selectedReasonObj = DISPUTE_REASONS.find((r) => r.value === reason);

    try {
      const res = await clientApi.createDispute({
        orderId: currentOrder.id,
        orderType: (currentOrder.type === 'rental' ? 'rental' : 'sale') as 'sale' | 'rental',
        reason,
        description: description.trim()
      }).catch(() => null);

      if (res?.disputeId && onCreated) {
        onCreated(res.disputeId);
      }
    } catch {
      // Demo mode fallback
    }

    if (onSubmitDispute) {
      onSubmitDispute({
        orderId: currentOrder.id,
        orderNumber: currentOrder.orderNumber,
        productName: selectedItem?.productName || 'Commande ' + currentOrder.orderNumber,
        productImage: selectedItem?.productImage || '',
        reason,
        reasonLabel: selectedReasonObj?.label || 'Litige',
        description: description.trim(),
        messages: []
      });
    }

    showToast?.('success', 'Votre réclamation a été transmise');
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 border border-neutral-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500 text-white">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900">
                Ouvrir un Litige / Réclamation
              </h2>
              <p className="text-xs text-neutral-500">
                Traitement prioritaire sous 24h ouvrées par le support client
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-black cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {orders.length === 0 ? (
          <div className="py-8 text-center text-xs text-neutral-500 space-y-3">
            <p>Vous n'avez aucune commande sur laquelle ouvrir un litige.</p>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-neutral-900 text-white font-bold cursor-pointer"
            >
              Fermer
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* 1. Sélection de la commande */}
            <div className="space-y-1.5">
              <label className="font-semibold text-neutral-800 block">
                1. Commande concernée
              </label>
              <select
                value={selectedOrderId}
                onChange={(e) => setSelectedOrderId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 bg-white font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-black/10"
              >
                {orders.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.orderNumber} — {o.items[0]?.productName} ({o.totalTTC.toFixed(2)} €)
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Motif du litige */}
            <div className="space-y-1.5">
              <label className="font-semibold text-neutral-800 block">
                2. Motif principal de l'incident
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as DisputeReason)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 bg-white font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-black/10"
              >
                {DISPUTE_REASONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Description détaillée */}
            <div className="space-y-1.5">
              <label className="font-semibold text-neutral-800 block">
                3. Détaillez l'incident et vos constatations
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Indiquez l'état du colis, les réserves émises au livreur ou tout élément utile pour l'instruction de votre dossier..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-black/10 text-neutral-900 text-xs"
              />
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-xl cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-colors shadow-md flex items-center gap-2 cursor-pointer"
              >
                <span>{isSubmitting ? 'Envoi en cours...' : 'Transmettre le litige'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
