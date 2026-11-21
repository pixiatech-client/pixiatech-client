'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Archive,
  Building2,
  CheckCheck,
  Clock,
  History,
  Inbox,
  Loader2,
  Mail,
  MailOpen,
  Phone,
  RefreshCw,
  Reply,
  RotateCcw,
  Search,
  Trash,
  Trash2,
  User,
} from 'lucide-react';
import { toast } from 'sonner';
import type { ContactMessage } from '@/lib/site-web/types';
import { BTN_GHOST, CARD, FIELD_INPUT, TOOLBAR_ROW, tabPillClass } from './ContactAdminTabs';
import { ContactConfirmModal } from './ContactConfirmModal';
import { ReplyModal } from './ReplyModal';

type InboxFilter = 'all' | 'unread' | 'read' | 'replied' | 'archived' | 'trash';

const STATUS_LABEL: Record<ContactMessage['status'], string> = {
  unread: 'Non lu',
  read: 'Lu',
  replied: 'Traité',
  archived: 'Archivé',
  trash: 'Corbeille',
};

const STATUS_BADGE: Record<ContactMessage['status'], string> = {
  unread: 'bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-300',
  read: 'bg-neutral-200 text-neutral-700 dark:bg-white/10 dark:text-neutral-300',
  replied: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300',
  archived: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300',
  trash: 'bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300',
};

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

interface InboxTabProps {
  refreshToken: number;
  /** Notifié à chaque changement de statut pour rafraîchir le badge du bandeau. */
  onUnreadChange?: (count: number) => void;
}

export function InboxTab({ refreshToken, onUnreadChange }: InboxTabProps) {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<InboxFilter>('all');
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Modales
  const [trashConfirmId, setTrashConfirmId] = useState<string | null>(null);
  const [permanentDeleteId, setPermanentDeleteId] = useState<string | null>(null);
  const [emptyTrashConfirmOpen, setEmptyTrashConfirmOpen] = useState(false);
  const [replyingMessage, setReplyingMessage] = useState<ContactMessage | null>(null);
  const [isEmptyingTrash, setIsEmptyingTrash] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/site-web/contact/messages', { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok || !json?.success || !Array.isArray(json.data)) {
        setError(json?.error || json?.message || 'Réponse inattendue du serveur.');
        return;
      }
      setMessages(json.data as ContactMessage[]);
    } catch (err) {
      setError((err as Error).message || 'Impossible de joindre le serveur.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshToken]);

  const counts = useMemo(
    () => ({
      all: messages.filter((m) => m.status !== 'trash').length,
      unread: messages.filter((m) => m.status === 'unread').length,
      read: messages.filter((m) => m.status === 'read').length,
      replied: messages.filter((m) => m.status === 'replied').length,
      archived: messages.filter((m) => m.status === 'archived').length,
      trash: messages.filter((m) => m.status === 'trash').length,
    }),
    [messages]
  );

  useEffect(() => {
    onUnreadChange?.(counts.unread);
  }, [counts.unread, onUnreadChange]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return messages.filter((m) => {
      if (filter === 'all' && m.status === 'trash') return false;
      if (filter === 'unread' && m.status !== 'unread') return false;
      if (filter === 'read' && m.status !== 'read') return false;
      if (filter === 'replied' && m.status !== 'replied') return false;
      if (filter === 'archived' && m.status !== 'archived') return false;
      if (filter === 'trash' && m.status !== 'trash') return false;
      if (!needle) return true;
      return [m.name, m.email, m.subject, m.company, m.message]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle));
    });
  }, [messages, filter, query]);

  const selected = useMemo(
    () => filtered.find((m) => m.id === selectedId) ?? messages.find((m) => m.id === selectedId) ?? null,
    [filtered, messages, selectedId]
  );

  const setStatus = async (id: string, status: ContactMessage['status'], successMessage?: string) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/site-web/contact/messages/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        toast.error(json?.message || json?.error || 'Impossible de changer le statut.');
        return;
      }
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, status } : m)));
      if (successMessage) {
        toast.success(successMessage);
      }
    } catch (err) {
      toast.error((err as Error).message || 'Impossible de joindre le serveur.');
    } finally {
      setBusyId(null);
    }
  };

  /** Ouvrir un message non lu le marque automatiquement comme lu. */
  const openMessage = (message: ContactMessage) => {
    setSelectedId(message.id);
    if (message.status === 'unread') {
      void setStatus(message.id, 'read');
    }
  };

  /** Déplacer vers la corbeille */
  const handleMoveToTrash = async (id: string) => {
    await setStatus(id, 'trash', 'Message déplacé dans la corbeille.');
    setTrashConfirmId(null);
  };

  /** Restaurer un message vers 'Non lus' */
  const handleRestore = async (id: string) => {
    await setStatus(id, 'unread', 'Message restauré avec succès dans les Non lus.');
  };

  /** Suppression définitive d'un message unique (depuis la corbeille) */
  const handlePermanentDelete = async (id: string) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/site-web/contact/messages/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        toast.error(json?.message || json?.error || 'Suppression impossible.');
        return;
      }
      setMessages((prev) => prev.filter((m) => m.id !== id));
      setSelectedId((prev) => (prev === id ? null : prev));
      toast.success('Message supprimé définitivement.');
    } catch (err) {
      toast.error((err as Error).message || 'Impossible de joindre le serveur.');
    } finally {
      setBusyId(null);
      setPermanentDeleteId(null);
    }
  };

  /** Vider toute la corbeille */
  const handleEmptyTrash = async () => {
    setIsEmptyingTrash(true);
    try {
      const res = await fetch('/api/site-web/contact/messages/empty-trash', { method: 'POST' });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        toast.error(json?.message || json?.error || 'Échec du vidage de la corbeille.');
        return;
      }
      setMessages((prev) => prev.filter((m) => m.status !== 'trash'));
      setSelectedId(null);
      toast.success(json.message || 'La corbeille a été vidée.');
    } catch (err) {
      toast.error((err as Error).message || 'Impossible de joindre le serveur.');
    } finally {
      setIsEmptyingTrash(false);
      setEmptyTrashConfirmOpen(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Barre d'onglets de filtrage */}
      <div className={TOOLBAR_ROW}>
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-semibold">
          <button type="button" onClick={() => setFilter('all')} className={tabPillClass(filter === 'all')}>
            Tous ({counts.all})
          </button>
          <button
            type="button"
            onClick={() => setFilter('unread')}
            className={tabPillClass(filter === 'unread', 'sky')}
          >
            Non lus ({counts.unread})
          </button>
          <button
            type="button"
            onClick={() => setFilter('read')}
            className={tabPillClass(filter === 'read', 'neutral')}
          >
            Lus ({counts.read})
          </button>
          <button
            type="button"
            onClick={() => setFilter('replied')}
            className={tabPillClass(filter === 'replied', 'emerald')}
          >
            Traités ({counts.replied})
          </button>
          <button
            type="button"
            onClick={() => setFilter('archived')}
            className={tabPillClass(filter === 'archived', 'amber')}
          >
            Archive ({counts.archived})
          </button>

          {/* Séparateur visuel pour la Corbeille */}
          <span className="w-px h-5 bg-neutral-200 dark:bg-white/10 mx-1 shrink-0" />

          {/* Onglet Corbeille distinctif */}
          <button
            type="button"
            onClick={() => setFilter('trash')}
            className={tabPillClass(filter === 'trash', 'rose')}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Corbeille</span>
            {counts.trash > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-600 text-white">
                {counts.trash}
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
          {/* Bouton vider la corbeille visible uniquement dans l'onglet corbeille */}
          {filter === 'trash' && counts.trash > 0 && (
            <button
              type="button"
              onClick={() => setEmptyTrashConfirmOpen(true)}
              disabled={isEmptyingTrash}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              <Trash className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">Vider la corbeille</span>
            </button>
          )}

          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher un message"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={`${FIELD_INPUT} !py-1.5 !text-xs pl-9`}
            />
          </div>
          <button type="button" onClick={load} disabled={isLoading} className={BTN_GHOST}>
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </button>
        </div>
      </div>

      {/* Banderole contextuelle pour la Corbeille */}
      {filter === 'trash' && (
        <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-300 text-xs font-semibold">
          <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
          <span className="flex-1">
            <strong>Zone Corbeille :</strong> Les messages ci-dessous ont été supprimés temporairement.
            Vous pouvez les <strong>restaurer</strong> vers la boîte de réception ou les effacer de façon
            définitive.
          </span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-300 text-xs font-semibold">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span className="flex-1">{error}</span>
          <button
            type="button"
            onClick={load}
            className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold transition-colors cursor-pointer"
          >
            Réessayer
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Liste */}
        <div className={`${CARD} lg:col-span-5 p-2 max-h-[70vh] overflow-y-auto`}>
          {isLoading ? (
            <div className="flex min-h-[30vh] items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <Inbox className="w-8 h-8 mx-auto text-neutral-300 dark:text-neutral-600 stroke-1" />
              <p className="mt-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                {filter === 'trash' ? 'La corbeille est vide' : 'Aucun message dans cette vue'}
              </p>
              <p className="mt-1 text-[11px] text-neutral-400">
                {filter === 'trash'
                  ? 'Aucun message en attente de suppression définitive.'
                  : 'Les demandes envoyées depuis la page Contact apparaîtront ici.'}
              </p>
            </div>
          ) : (
            <ul className="space-y-1">
              {filtered.map((message) => {
                const isSelected = message.id === selectedId;
                return (
                  <li key={message.id}>
                    <button
                      type="button"
                      onClick={() => openMessage(message)}
                      className={`w-full text-left px-3.5 py-3 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[rgba(var(--ui-accent-rgb),0.6)] bg-emerald-50 dark:bg-emerald-500/10'
                          : 'border-transparent hover:border-neutral-200 hover:bg-neutral-50 dark:hover:border-white/10 dark:hover:bg-white/[0.03]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-xs truncate ${
                            message.status === 'unread'
                              ? 'font-extrabold text-neutral-900 dark:text-white'
                              : 'font-semibold text-neutral-600 dark:text-neutral-300'
                          }`}
                        >
                          {message.name}
                        </span>
                        <span className="text-[10px] font-mono text-neutral-400 shrink-0">
                          {formatDate(message.createdAt)}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <span
                          className={`text-[11px] truncate ${
                            message.status === 'unread'
                              ? 'font-bold text-neutral-800 dark:text-neutral-100'
                              : 'text-neutral-500 dark:text-neutral-400'
                          }`}
                        >
                          {message.subject || message.projectType}
                        </span>
                        <span
                          className={`shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${STATUS_BADGE[message.status]}`}
                        >
                          {STATUS_LABEL[message.status]}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-[11px] text-neutral-500 dark:text-neutral-400">
                        {message.message}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Détail du message sélectionné */}
        <div className={`${CARD} lg:col-span-7 p-5 sm:p-6`}>
          {selected ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-neutral-200/70 dark:border-white/10 flex-wrap">
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-neutral-900 dark:text-white truncate">
                    {selected.subject || 'Message de contact'}
                  </h2>
                  <p className="mt-1 text-[11px] text-neutral-400">
                    Reçu le {formatDate(selected.createdAt)}
                  </p>
                </div>

                {/* Actions contextuelles */}
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  {/* Si le message est dans la corbeille ou archivé : bouton Restaurer vers Non lus */}
                  {(selected.status === 'trash' || selected.status === 'archived') && (
                    <button
                      type="button"
                      onClick={() => handleRestore(selected.id)}
                      disabled={busyId === selected.id}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                      title="Restaurer ce message dans les Non lus"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restaurer</span>
                    </button>
                  )}

                  {/* Actions standard pour les messages non corbeille */}
                  {selected.status !== 'trash' && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          setStatus(selected.id, selected.status === 'unread' ? 'read' : 'unread')
                        }
                        disabled={busyId === selected.id}
                        className={BTN_GHOST}
                        title={selected.status === 'unread' ? 'Marquer comme lu' : 'Marquer comme non lu'}
                      >
                        {selected.status === 'unread' ? (
                          <MailOpen className="w-3.5 h-3.5" />
                        ) : (
                          <Mail className="w-3.5 h-3.5" />
                        )}
                        <span>{selected.status === 'unread' ? 'Marquer lu' : 'Marquer non lu'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setStatus(selected.id, 'replied')}
                        disabled={busyId === selected.id || selected.status === 'replied'}
                        className={BTN_GHOST}
                        title="Marquer comme traité"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span>Traité</span>
                      </button>

                      {selected.status !== 'archived' && (
                        <button
                          type="button"
                          onClick={() => setStatus(selected.id, 'archived', 'Message archivé.')}
                          disabled={busyId === selected.id}
                          className={BTN_GHOST}
                          title="Déplacer vers l'archive"
                        >
                          <Archive className="w-3.5 h-3.5" />
                          <span>Archiver</span>
                        </button>
                      )}

                      {/* Bouton mettre à la corbeille (déclenche la confirmation in-app) */}
                      <button
                        type="button"
                        onClick={() => setTrashConfirmId(selected.id)}
                        disabled={busyId === selected.id}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-100 hover:bg-rose-50 dark:bg-white/5 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold border border-neutral-200 dark:border-white/10 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                        title="Déplacer dans la corbeille"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}

                  {/* Dans la vue corbeille : bouton de suppression définitive */}
                  {selected.status === 'trash' && (
                    <button
                      type="button"
                      onClick={() => setPermanentDeleteId(selected.id)}
                      disabled={busyId === selected.id}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                      title="Supprimer définitivement ce message"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Supprimer définitivement</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Métadonnées du client */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <MetaRow icon={User} label="Nom" value={selected.name} />
                <MetaRow
                  icon={Mail}
                  label="Email"
                  value={selected.email}
                  href={`mailto:${selected.email}`}
                />
                <MetaRow icon={Phone} label="Téléphone" value={selected.phone || 'Non renseigné'} />
                <MetaRow
                  icon={Building2}
                  label="Entreprise"
                  value={selected.company || 'Non renseignée'}
                />
                <MetaRow icon={AlertTriangle} label="Type de projet" value={selected.projectType} />
                <MetaRow
                  icon={CheckCheck}
                  label="Envoi SMTP"
                  value={
                    selected.emailDeliveryStatus === 'sent'
                      ? 'Email envoyé'
                      : selected.emailDeliveryStatus === 'failed'
                        ? 'Échec de l’envoi'
                        : selected.emailDeliveryStatus === 'disabled'
                          ? 'Envoi désactivé'
                          : 'Archivé localement'
                  }
                />
              </div>

              {selected.deliveryNote && (
                <p className="px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200/70 dark:border-white/[0.06] text-[11px] text-neutral-500 dark:text-neutral-400">
                  {selected.deliveryNote}
                </p>
              )}

              {/* Contenu du message initial */}
              <div className="px-4 py-3.5 rounded-xl bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200/70 dark:border-white/[0.06] text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed whitespace-pre-wrap">
                {selected.message}
              </div>

              {/* Historique des réponses email envoyées */}
              {selected.replies && selected.replies.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    <History className="w-3.5 h-3.5 text-[color:var(--ui-accent)]" />
                    <span>Historique des réponses ({selected.replies.length})</span>
                  </div>
                  <div className="space-y-2">
                    {selected.replies.map((rep) => (
                      <div
                        key={rep.id}
                        className="rounded-xl bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200/80 dark:border-white/10 p-3.5 text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-[11px] text-neutral-400">
                          <span className="font-bold text-neutral-700 dark:text-neutral-200">
                            {rep.subject}
                          </span>
                          <span className="font-mono flex items-center gap-1">
                            <Clock className="w-3 h-3 text-[color:var(--ui-accent)]" />
                            {formatDate(rep.sentAt)}
                          </span>
                        </div>
                        <p className="text-neutral-600 dark:text-neutral-300 whitespace-pre-wrap leading-relaxed">
                          {rep.message}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bouton Répondre par email (ouvre le panneau / modal intégré PixiaTech) */}
              {selected.status !== 'trash' && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setReplyingMessage(selected)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[color:var(--ui-accent)] hover:bg-[color:var(--ui-accent-hover)] text-black text-xs font-extrabold transition-all cursor-pointer shadow-[0_0_16px_rgba(var(--ui-accent-rgb),0.35)] active:scale-95"
                  >
                    <Reply className="w-3.5 h-3.5" />
                    <span>Répondre par email</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex min-h-[40vh] flex-col items-center justify-center text-neutral-400">
              <Inbox className="w-10 h-10 stroke-1" />
              <p className="mt-3 text-xs font-semibold">
                Sélectionnez un message pour afficher son contenu
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modale 1 : Déplacer vers la corbeille */}
      <ContactConfirmModal
        open={Boolean(trashConfirmId)}
        title="Déplacer vers la corbeille ?"
        description="Ce message sera déplacé dans la corbeille. Vous pourrez le restaurer à tout moment dans la boîte de réception."
        confirmLabel="Déplacer"
        cancelLabel="Annuler"
        variant="danger"
        isBusy={busyId === trashConfirmId}
        onConfirm={() => trashConfirmId && handleMoveToTrash(trashConfirmId)}
        onCancel={() => setTrashConfirmId(null)}
      />

      {/* Modale 2 : Suppression définitive (depuis la corbeille) */}
      <ContactConfirmModal
        open={Boolean(permanentDeleteId)}
        title="Supprimer définitivement ce message ?"
        description="Cette action est irréversible. Le message et toutes les informations associées seront définitivement supprimés de la base de données."
        confirmLabel="Supprimer définitivement"
        cancelLabel="Annuler"
        variant="danger"
        isBusy={busyId === permanentDeleteId}
        onConfirm={() => permanentDeleteId && handlePermanentDelete(permanentDeleteId)}
        onCancel={() => setPermanentDeleteId(null)}
      />

      {/* Modale 3 : Vider toute la corbeille */}
      <ContactConfirmModal
        open={emptyTrashConfirmOpen}
        title="Vider toute la corbeille ?"
        description={`Tous les ${counts.trash} message(s) présents dans la corbeille seront définitivement effacés de la base de données. Cette opération est irréversible.`}
        confirmLabel="Vider la corbeille"
        cancelLabel="Annuler"
        variant="danger"
        isBusy={isEmptyingTrash}
        onConfirm={handleEmptyTrash}
        onCancel={() => setEmptyTrashConfirmOpen(false)}
      />

      {/* Modale 4 : Répondre au client par email intégré via SMTP */}
      <ReplyModal
        open={Boolean(replyingMessage)}
        message={replyingMessage}
        onClose={() => setReplyingMessage(null)}
        onReplied={(updated) => {
          setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
        }}
      />
    </div>
  );
}

function MetaRow({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  href?: string;
}) {
  return (
    <div className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200/70 dark:border-white/[0.06] min-w-0">
      <Icon className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
      <div className="min-w-0">
        <span className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400">
          {label}
        </span>
        {href ? (
          <a href={href} className="block text-xs font-semibold text-[color:var(--ui-accent)] hover:underline truncate">
            {value}
          </a>
        ) : (
          <span className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate">
            {value}
          </span>
        )}
      </div>
    </div>
  );
}
