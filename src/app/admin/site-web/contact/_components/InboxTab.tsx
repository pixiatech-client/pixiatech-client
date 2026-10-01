'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Archive,
  Building2,
  CheckCheck,
  Inbox,
  Loader2,
  Mail,
  MailOpen,
  Phone,
  RefreshCw,
  Reply,
  Search,
  Trash2,
  User,
} from 'lucide-react';
import { toast } from 'sonner';
import type { ContactMessage } from '@/lib/site-web/types';
import { BTN_GHOST, CARD, FIELD_INPUT, TOOLBAR_ROW, tabPillClass } from './ContactAdminTabs';

/**
 * Onglet « Boîte de réception ».
 *
 * Centralise les messages enregistrés par `POST /api/site-web/contact/send`
 * dans la collection Firestore `siteWebMessages`. Statuts et actions sont ceux
 * déjà acceptés par `PATCH/DELETE /api/site-web/contact/messages/[id]`
 * (`unread`, `read`, `replied`, `archived`) : aucune valeur inventée.
 */

type InboxFilter = 'all' | 'unread' | 'read' | 'archived';

/** `replied` est résolu par le back comme traité ; on le garde lisible ici. */
const STATUS_LABEL: Record<ContactMessage['status'], string> = {
  unread: 'Non lu',
  read: 'Lu',
  replied: 'Traité',
  archived: 'Traité',
};

const STATUS_BADGE: Record<ContactMessage['status'], string> = {
  unread: 'bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-300',
  read: 'bg-neutral-200 text-neutral-700 dark:bg-white/10 dark:text-neutral-300',
  replied: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300',
  archived: 'bg-neutral-200 text-neutral-700 dark:bg-white/10 dark:text-neutral-300',
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
      all: messages.length,
      unread: messages.filter((m) => m.status === 'unread').length,
      read: messages.filter((m) => m.status === 'read').length,
      done: messages.filter((m) => m.status === 'replied' || m.status === 'archived').length,
    }),
    [messages]
  );

  useEffect(() => {
    onUnreadChange?.(counts.unread);
  }, [counts.unread, onUnreadChange]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return messages.filter((m) => {
      if (filter === 'unread' && m.status !== 'unread') return false;
      if (filter === 'read' && m.status !== 'read') return false;
      if (filter === 'archived' && m.status !== 'replied' && m.status !== 'archived') return false;
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

  const setStatus = async (id: string, status: ContactMessage['status']) => {
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
    } catch (err) {
      toast.error((err as Error).message || 'Impossible de joindre le serveur.');
    } finally {
      setBusyId(null);
    }
  };

  /** Ouvrir un message non lu le marque automatiquement comme lu. */
  const openMessage = (message: ContactMessage) => {
    setSelectedId(message.id);
    if (message.status === 'unread') void setStatus(message.id, 'read');
  };

  const removeMessage = async (id: string) => {
    if (!window.confirm('Supprimer définitivement ce message ?')) return;
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
      toast.success('Message supprimé.');
    } catch (err) {
      toast.error((err as Error).message || 'Impossible de joindre le serveur.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
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
            onClick={() => setFilter('archived')}
            className={tabPillClass(filter === 'archived', 'emerald')}
          >
            Traités ({counts.done})
          </button>
        </div>

        <div className="flex items-center gap-2">
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
                Aucun message dans cette vue
              </p>
              <p className="mt-1 text-[11px] text-neutral-400">
                Les demandes envoyées depuis la page Contact apparaîtront ici.
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
                          ? 'border-[#38E044]/60 bg-emerald-50 dark:bg-emerald-500/10'
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

        {/* Détail */}
        <div className={`${CARD} lg:col-span-7 p-5 sm:p-6`}>
          {selected ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-neutral-200/70 dark:border-white/10">
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-neutral-900 dark:text-white truncate">
                    {selected.subject || 'Message de contact'}
                  </h2>
                  <p className="mt-1 text-[11px] text-neutral-400">
                    Reçu le {formatDate(selected.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
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
                  <button
                    type="button"
                    onClick={() => setStatus(selected.id, 'archived')}
                    disabled={busyId === selected.id || selected.status === 'archived'}
                    className={BTN_GHOST}
                    title="Archiver"
                  >
                    <Archive className="w-3.5 h-3.5" />
                    <span>Archiver</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => removeMessage(selected.id)}
                    disabled={busyId === selected.id}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                    title="Supprimer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

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

              <div className="px-4 py-3.5 rounded-xl bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200/70 dark:border-white/[0.06] text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed whitespace-pre-wrap">
                {selected.message}
              </div>

              <a
                href={`mailto:${selected.email}?subject=${encodeURIComponent(
                  `Re: ${selected.subject || 'Votre demande PIXIATECH'}`
                )}`}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#38E044] hover:bg-[#2fcb3c] text-black text-xs font-extrabold transition-all cursor-pointer shadow-[0_0_16px_rgba(56,224,68,0.35)] active:scale-95"
              >
                <Reply className="w-3.5 h-3.5" />
                <span>Répondre par email</span>
              </a>
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
          <a href={href} className="block text-xs font-semibold text-[#38E044] hover:underline truncate">
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