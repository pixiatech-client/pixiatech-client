'use client';

import { useState } from 'react';
import Link from 'next/link';
import { LifeBuoy } from 'lucide-react';

interface DisputeItem {
  id: string;
  reason: string;
  status: string;
  createdAt: string;
  unreadByClient?: boolean;
}

export function DashboardNotifications({
  customerId,
  disputes,
}: {
  customerId: string;
  disputes: DisputeItem[];
}) {
  const openDisputes = disputes.filter(d => d.status === 'open' || d.status === 'in_review' || d.status === 'in_progress');
  const [showNewForm, setShowNewForm] = useState(false);
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
        body: JSON.stringify({ reason, description }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur');
      }
      setSent(true);
      setTimeout(() => {
        setShowNewForm(false);
        setSent(false);
        setReason('');
        setDescription('');
        window.location.reload();
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    }
    setSending(false);
  };

  return (
    <div className="space-y-4">
      {openDisputes.length > 0 && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-[13px] font-semibold text-red-700 mb-2 flex items-center gap-2">
            Litiges en cours ({openDisputes.length})
            {(() => {
              const unreadCount = openDisputes.filter(d => d.unreadByClient).length;
              if (unreadCount === 0) return null;
              return (
                <span className="text-[10px] font-bold text-white bg-red-600 px-1.5 py-0.5 rounded-full">
                  {unreadCount} nouveau{unreadCount > 1 ? 'x' : ''}
                </span>
              );
            })()}
          </p>
          <div className="space-y-2">
            {openDisputes.map(d => (
              <Link
                key={d.id}
                href={`/mon-compte/litiges/${d.id}`}
                className={`block text-xs hover:underline ${d.unreadByClient ? 'text-red-700 font-bold' : 'text-red-600 hover:text-red-800'}`}
              >
                {d.unreadByClient && (
                  <span className="inline-block w-1.5 h-1.5 bg-red-500 rounded-full mr-1.5 align-middle" />
                )}
                <span className="font-medium">{d.reason}</span> —{' '}
                {d.status === 'in_progress' || d.status === 'in_review' ? 'En cours de traitement' : 'Ouvert'}
              </Link>
            ))}
          </div>
        </div>
      )}

      {!showNewForm ? (
        <button
          onClick={() => setShowNewForm(true)}
          className="w-full p-3 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-red-300 hover:text-red-600 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          Signaler un problème
        </button>
      ) : sent ? (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 font-medium text-center">
          Votre litige a été envoyé. Nous vous répondrons sous 48h.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <p className="text-[13px] font-semibold text-gray-900">Nouveau litige</p>
          <div>
            <select
              value={reason}
              onChange={e => setReason(e.target.value)}
              required
              className="w-full h-9 px-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/20"
            >
              <option value="">Motif du litige</option>
              <option value="produit_non_recu">Produit non reçu</option>
              <option value="produit_endommage">Produit endommagé</option>
              <option value="produit_non_conforme">Produit non conforme</option>
              <option value="livraison_tardive">Livraison tardive</option>
              <option value="probleme_paiement">Problème de paiement</option>
              <option value="service_client">Service client</option>
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
              className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/20 resize-none"
            />
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={sending}
              className="px-4 py-2 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {sending ? 'Envoi...' : 'Envoyer'}
            </button>
            <button
              type="button"
              onClick={() => { setShowNewForm(false); setError(''); }}
              className="px-4 py-2 border border-gray-200 text-gray-600 text-xs font-semibold rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      <div className="pt-3 border-t border-gray-100 flex flex-col gap-2">
        <Link
          href="/mon-compte/litiges"
          className="inline-flex items-center gap-2 w-full px-4 py-2.5 text-xs font-semibold rounded-xl border border-red-200 bg-white text-red-600 hover:bg-red-50 hover:border-red-300 shadow-sm transition-all"
        >
          <LifeBuoy className="h-3.5 w-3.5" />
          Voir tous mes litiges
          <svg className="w-3 h-3 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>

      </div>
    </div>
  );
}
