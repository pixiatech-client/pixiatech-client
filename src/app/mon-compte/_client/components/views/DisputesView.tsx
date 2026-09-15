'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  MessageSquare,
  Clock,
  CheckCircle2,
  Send,
  Package,
  ChevronRight,
  ShieldAlert,
  AlertCircle,
  HelpCircle,
  Truck,
  Building2,
  User,
  Paperclip,
  ExternalLink
} from 'lucide-react';
import type { Dispute, DisputeMessage, Order, UserProfile, DisputeStatus } from '../../types';

interface DisputesViewProps {
  disputes: Dispute[];
  orders?: Order[];
  user?: UserProfile;
  onOpenDisputeModal?: () => void;
  onSendMessage: (disputeId: string, text: string) => void;
  onSelectDispute?: (id: string) => void;
  onNewDispute?: () => void;
}

export const DisputesView: React.FC<DisputesViewProps> = ({
  disputes,
  orders = [],
  user = {
    id: 'usr-default',
    name: 'Client',
    email: 'client@pixiatech.com',
    emailVerified: true,
    siretVerified: false,
    role: 'client'
  },
  onOpenDisputeModal,
  onSendMessage,
  onSelectDispute,
  onNewDispute
}) => {
  const [filter, setFilter] = useState<'all' | 'open' | 'resolved'>('all');
  const [selectedDisputeId, setSelectedDisputeId] = useState<string>(
    disputes[0]?.id || ''
  );
  const [replyText, setReplyText] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);

  const handleOpenModal = () => {
    if (onOpenDisputeModal) {
      onOpenDisputeModal();
    } else if (onNewDispute) {
      onNewDispute();
    }
  };

  const filteredDisputes = disputes.filter((d) => {
    if (filter === 'open') {
      return d.status === 'Ouvert' || d.status === 'En cours' || d.status === 'En attente';
    }
    if (filter === 'resolved') {
      return d.status === 'Résolu' || d.status === 'Fermé';
    }
    return true;
  });

  const activeDispute = disputes.find((d) => d.id === selectedDisputeId) || filteredDisputes[0];

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeDispute) return;

    setIsSending(true);
    const textToSend = replyText.trim();
    setReplyText('');

    setTimeout(() => {
      onSendMessage(activeDispute.id, textToSend);
      setIsSending(false);
    }, 300);
  };

  const getStatusBadge = (status: DisputeStatus | string) => {
    switch (status) {
      case 'Résolu':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Résolu</span>
          </span>
        );
      case 'En cours':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-800 border border-sky-200">
            <Clock className="w-3.5 h-3.5 text-sky-600 animate-spin" />
            <span>En cours d'instruction</span>
          </span>
        );
      case 'En attente':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>En attente de réponse</span>
          </span>
        );
      case 'Fermé':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-neutral-100 text-neutral-600 border border-neutral-200">
            <span>Dossier clos</span>
          </span>
        );
      case 'Ouvert':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
            <AlertCircle className="w-3.5 h-3.5 text-blue-600" />
            <span>Dossier ouvert</span>
          </span>
        );
    }
  };

  const openDisputesCount = disputes.filter(
    (d) => d.status === 'Ouvert' || d.status === 'En cours' || d.status === 'En attente'
  ).length;
  const resolvedCount = disputes.filter((d) => d.status === 'Résolu').length;

  return (
    <div id="pixiatech-disputes-view" className="space-y-6">
      {/* 1. Header Card */}
      <div className="bg-white rounded-3xl border border-neutral-200/80 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#0A0D0E] text-white flex items-center justify-center shrink-0 shadow-md">
            <AlertTriangle className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
                Litiges & Réclamations
              </h1>
              {openDisputesCount > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-amber-50 text-amber-800 px-2.5 py-0.5 rounded-full border border-amber-200">
                  {openDisputesCount} en cours
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
              Suivi contradictoire de vos signalements, litiges transport et échanges directs avec le support PIXIATECH.
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenModal}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0A0D0E] text-white text-xs font-bold hover:bg-neutral-800 transition-all shadow-sm cursor-pointer shrink-0"
        >
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <span>Ouvrir une nouvelle réclamation</span>
        </button>
      </div>

      {/* 2. Key Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-neutral-200/80 p-4 shadow-xs flex items-center gap-3">
          <div className="p-3 rounded-xl bg-neutral-100 text-neutral-700">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-neutral-500 font-medium">Total Réclamations</div>
            <div className="text-xl font-black text-neutral-900 font-mono">{disputes.length}</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-200/80 p-4 shadow-xs flex items-center gap-3">
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/60">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-neutral-500 font-medium">Dossiers en traitement</div>
            <div className="text-xl font-black text-amber-700 font-mono">{openDisputesCount}</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-200/80 p-4 shadow-xs flex items-center gap-3">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/60">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-neutral-500 font-medium">Litiges résolus</div>
            <div className="text-xl font-black text-emerald-700 font-mono">{resolvedCount}</div>
          </div>
        </div>
      </div>

      {/* 3. Main Workspace: Split View with List on Left and Conversation on Right */}
      {disputes.length === 0 ? (
        <div className="bg-white rounded-3xl border border-neutral-200/80 p-12 text-center shadow-xs">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-neutral-100 flex items-center justify-center text-neutral-400 mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h3 className="text-lg font-bold text-neutral-900">
            Aucun litige en cours
          </h3>
          <p className="text-xs sm:text-sm text-neutral-500 max-w-md mx-auto mt-1 mb-6">
            Toutes vos commandes sont conformes et sans incident signalé. En cas d'anomalie de livraison ou de produit endommagé, vous pouvez ouvrir une réclamation à tout moment.
          </p>
          {orders.length > 0 && (
            <button
              onClick={handleOpenModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0A0D0E] text-white font-bold text-xs hover:bg-neutral-800 transition-all shadow-md cursor-pointer"
            >
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Déclarer un incident sur une commande</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Disputes List (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Filter Chips */}
            <div className="flex items-center gap-2 p-1.5 bg-neutral-100/80 rounded-2xl border border-neutral-200/60 text-xs">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`flex-1 py-1.5 px-3 rounded-xl font-bold transition-all cursor-pointer ${
                  filter === 'all'
                    ? 'bg-white text-neutral-900 shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                Tous ({disputes.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter('open')}
                className={`flex-1 py-1.5 px-3 rounded-xl font-bold transition-all cursor-pointer ${
                  filter === 'open'
                    ? 'bg-white text-neutral-900 shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                En cours ({openDisputesCount})
              </button>
              <button
                type="button"
                onClick={() => setFilter('resolved')}
                className={`flex-1 py-1.5 px-3 rounded-xl font-bold transition-all cursor-pointer ${
                  filter === 'resolved'
                    ? 'bg-white text-neutral-900 shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                Résolus ({resolvedCount})
              </button>
            </div>

            {/* List Cards */}
            <div className="space-y-3 max-h-[700px] overflow-y-auto pr-1">
              {filteredDisputes.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-neutral-200 text-xs text-neutral-400">
                  Aucun litige dans cette catégorie.
                </div>
              ) : (
                filteredDisputes.map((dispute) => {
                  const isSelected = activeDispute?.id === dispute.id;
                  const messageCount = dispute.messages?.length || 0;
                  return (
                    <div
                      key={dispute.id}
                      onClick={() => {
                        setSelectedDisputeId(dispute.id);
                        onSelectDispute?.(dispute.id);
                      }}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-3 ${
                        isSelected
                          ? 'bg-white border-[#0A0D0E] ring-2 ring-black/10 shadow-sm'
                          : 'bg-white border-neutral-200/80 hover:border-neutral-300 hover:bg-neutral-50/50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono font-bold text-xs text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded-md">
                            {dispute.orderNumber}
                          </span>
                          <span className="text-[11px] text-neutral-400">• {dispute.date}</span>
                        </div>
                        {getStatusBadge(dispute.status)}
                      </div>

                      <div className="flex items-start gap-3">
                        <img
                          src={dispute.productImage}
                          alt={dispute.productName}
                          className="w-12 h-12 rounded-xl object-cover border border-neutral-200 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-xs text-neutral-900 truncate">
                            {dispute.reasonLabel}
                          </div>
                          <div className="text-[11px] text-neutral-500 line-clamp-2 mt-0.5">
                            {dispute.description}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-neutral-100 text-[11px] text-neutral-400">
                        <span className="flex items-center gap-1 font-medium text-neutral-600">
                          <MessageSquare className="w-3.5 h-3.5" />
                          {messageCount} message(s) échangé(s)
                        </span>
                        <span className="text-neutral-500 flex items-center gap-0.5">
                          Consulter l'échange <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Conversation Thread & Details (7 cols) */}
          <div className="lg:col-span-7">
            {activeDispute ? (
              <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-xs overflow-hidden flex flex-col min-h-[640px]">
                {/* Thread Header */}
                <div className="p-5 border-b border-neutral-200/80 bg-neutral-50/50 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold text-neutral-900">
                          Dossier de réclamation #{activeDispute.id}
                        </h2>
                        {getStatusBadge(activeDispute.status)}
                      </div>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        Rattaché à la commande{' '}
                        <strong className="text-neutral-800 font-mono">
                          {activeDispute.orderNumber}
                        </strong>{' '}
                        • Déclaré le {activeDispute.date}
                      </p>
                    </div>

                    <a
                      href="/boutique"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-neutral-600 hover:text-black"
                    >
                      <span>Boutique PIXIATECH</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  {/* Summary card inside thread */}
                  <div className="p-3.5 rounded-2xl bg-white border border-neutral-200 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={activeDispute.productImage}
                        alt={activeDispute.productName}
                        className="w-10 h-10 rounded-xl object-cover border border-neutral-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-neutral-800 truncate">
                          {activeDispute.productName}
                        </div>
                        <div className="text-neutral-500 text-[11px]">
                          Motif : <strong className="text-neutral-700">{activeDispute.reasonLabel}</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Carrier note if applicable */}
                  {activeDispute.carrierNote && (
                    <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-xs flex items-start gap-2.5 text-amber-900">
                      <Truck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Remarque logistique / transporteur : </span>
                        <span>{activeDispute.carrierNote}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Thread Messages Body */}
                <div className="p-5 flex-1 overflow-y-auto space-y-4 max-h-[420px] bg-neutral-50/30">
                  {/* Initial dispute statement */}
                  <div className="p-4 rounded-2xl bg-neutral-100/90 border border-neutral-200 text-xs space-y-2">
                    <div className="flex items-center justify-between text-neutral-500 font-semibold text-[11px]">
                      <span className="flex items-center gap-1.5 text-neutral-800">
                        <User className="w-3.5 h-3.5 text-neutral-600" />
                        Signalement initial du client ({user.name})
                      </span>
                      <span>{activeDispute.date}</span>
                    </div>
                    <p className="text-neutral-800 leading-relaxed">
                      {activeDispute.description}
                    </p>
                  </div>

                  {/* Thread messages */}
                  {activeDispute.messages && activeDispute.messages.length > 0 ? (
                    activeDispute.messages.map((msg) => {
                      const isClient = msg.sender === 'client';
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isClient ? 'items-end' : 'items-start'} space-y-1`}
                        >
                          <div className="flex items-center gap-2 text-[11px] text-neutral-400 px-1">
                            <span className="font-semibold text-neutral-600">
                              {msg.senderName}
                            </span>
                            <span>•</span>
                            <span>
                              {msg.date} à {msg.time}
                            </span>
                            {!isClient && (
                              <span className="px-1.5 py-0.2 bg-[#0A0D0E] text-white text-[9px] font-bold rounded">
                                OFFICIEL
                              </span>
                            )}
                          </div>

                          <div
                            className={`max-w-[85%] sm:max-w-[75%] p-4 rounded-2xl text-xs leading-relaxed ${
                              isClient
                                ? 'bg-[#0A0D0E] text-white rounded-tr-xs shadow-xs'
                                : 'bg-white border border-neutral-200/90 text-neutral-800 rounded-tl-xs shadow-xs'
                            }`}
                          >
                            <p className="whitespace-pre-wrap">{msg.message}</p>
                            {msg.attachment && (
                              <div className="mt-2 pt-2 border-t border-white/20 text-[10px] flex items-center gap-1 opacity-80">
                                <Paperclip className="w-3 h-3" />
                                <span>Pièce jointe : {msg.attachment}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-8 text-center text-xs text-neutral-400">
                      Aucun message supplémentaire pour ce dossier.
                    </div>
                  )}
                </div>

                {/* Reply Form */}
                <form
                  onSubmit={handleSendReply}
                  className="p-4 border-t border-neutral-200/80 bg-white flex items-end gap-3"
                >
                  <div className="flex-1">
                    <label htmlFor="dispute-reply-input" className="sr-only">
                      Répondre au support PIXIATECH
                    </label>
                    <textarea
                      id="dispute-reply-input"
                      rows={2}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Écrivez votre message ou précisez les détails de l'incident..."
                      className="w-full px-4 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-800 placeholder-neutral-400 focus:outline-hidden focus:ring-2 focus:ring-black focus:bg-white resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!replyText.trim() || isSending}
                    className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs transition-all shrink-0 ${
                      replyText.trim() && !isSending
                        ? 'bg-[#0A0D0E] text-white hover:bg-neutral-800 shadow-md cursor-pointer'
                        : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                    }`}
                  >
                    <span>Envoyer</span>
                    <Send className="w-3.5 h-3.5 text-[#38E044]" />
                  </button>
                </form>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-neutral-200/80 p-12 text-center text-xs text-neutral-400">
                Sélectionnez un litige à gauche pour afficher la conversation.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
