'use client';

import { useState } from 'react';

export function DisputeForm({ orderId, orderRef }: { orderId: string; orderRef: string }) {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason || !description) return;
    setSending(true);
    setError('');
    try {
      const res = await fetch('/api/boutique/litige', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: `${reason} (Commande #${orderRef})`, description }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur');
      }
      setSent(true);
    } catch (err: any) {
      setError(err.message);
    }
    setSending(false);
  };

  if (sent) {
    return (
      <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 font-medium">
        Votre litige a été envoyé. Nous vous répondrons sous 48h.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
      <div>
        <select
          value={reason}
          onChange={e => setReason(e.target.value)}
          required
          className="w-full h-9 px-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900/20"
        >
          <option value="">Motif du litige</option>
          <option value="produit_non_recu">Produit non reçu</option>
          <option value="produit_endommage">Produit endommagé</option>
          <option value="produit_non_conforme">Produit non conforme</option>
          <option value="livraison_tardive">Livraison tardive</option>
          <option value="probleme_paiement">Problème de paiement</option>
          <option value="autre">Autre</option>
        </select>
      </div>
      <div>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          required
          placeholder="Décrivez votre problème..."
          rows={3}
          className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900/20 resize-none"
        />
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={sending}
          className="px-4 py-2 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
        >
          {sending ? 'Envoi...' : 'Envoyer le litige'}
        </button>
      </div>
    </form>
  );
}
