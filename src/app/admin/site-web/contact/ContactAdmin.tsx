'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Building2, Inbox, Mail, RefreshCw } from 'lucide-react';
import { InboxTab } from './_components/InboxTab';
import { PublicInfoTab } from './_components/PublicInfoTab';
import { SmtpTab } from './_components/SmtpTab';
import {
  BACKOFFICE_BADGE,
  BACKOFFICE_HEADER,
  BTN_SECONDARY,
  HEADER_ICON_TILE,
  TOOLBAR_ROW,
  tabPillClass,
} from './_components/ContactAdminTabs';

/**
 * Module Contact du back-office PixiaTech Web.
 *
 * Remplace l'ancien éditeur visuel de la page Contact par trois onglets
 * d'administration alignés sur le langage visuel du module Produits :
 *   1. SMTP & envoi        → `siteWeb/smtp`
 *   2. Boîte de réception  → `siteWebMessages`
 *   3. Coordonnées publiques → `siteWeb/contactInfo` (lu par la page publique)
 *
 * La logique métier (Firestore, Nodemailer, routes API) est inchangée : seule
 * l'interface est refaite.
 */

type ContactTab = 'smtp' | 'inbox' | 'info';

const TABS: { id: ContactTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'smtp', label: 'SMTP & envoi', icon: Mail },
  { id: 'inbox', label: 'Boîte de réception', icon: Inbox },
  { id: 'info', label: 'Coordonnées publiques', icon: Building2 },
];

export function ContactAdmin() {
  const [activeTab, setActiveTab] = useState<ContactTab>('smtp');
  const [refreshToken, setRefreshToken] = useState(0);
  const [unreadCount, setUnreadCount] = useState<number | null>(null);

  /**
   * Compteur de non-lus du bandeau. Lu via la même route que la boîte de
   * réception (donc également protégé par `requireAdmin`).
   */
  const loadUnreadCount = useCallback(async () => {
    try {
      const res = await fetch('/api/site-web/contact/messages', { cache: 'no-store' });
      const json = await res.json();
      if (res.ok && json?.success && typeof json.unreadCount === 'number') {
        setUnreadCount(json.unreadCount);
      }
    } catch {
      /* Le badge est décoratif : on le laisse à sa valeur précédente. */
    }
  }, []);

  useEffect(() => {
    loadUnreadCount();
  }, [loadUnreadCount, refreshToken]);

  const handleRefresh = () => setRefreshToken((value) => value + 1);

  return (
    <div className="space-y-6">
      {/* Bandeau titre backoffice — même composition que la page Produits. */}
      <div className={`bg-[#0A0D0E] border border-neutral-800 rounded-3xl p-5 sm:p-6 text-white ${BACKOFFICE_HEADER}`}>
        <div className="flex items-center gap-4 min-w-0">
          <div className={HEADER_ICON_TILE}>
            <Mail className="w-6 h-6 text-[#38E044]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold tracking-tight">Contact</h1>
              <span className={BACKOFFICE_BADGE}>BACKOFFICE</span>
            </div>
            <p className="text-xs text-neutral-400 mt-1 truncate">
              Envoi des demandes du formulaire, boîte de réception et coordonnées affichées sur la
              page Contact du site.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          <button type="button" onClick={handleRefresh} className={BTN_SECONDARY} title="Actualiser">
            <RefreshCw className="w-3.5 h-3.5 text-[#38E044]" />
            <span>Actualiser</span>
          </button>
        </div>
      </div>

      {/* Onglets principaux */}
      <div className={TOOLBAR_ROW}>
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-semibold">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={tabPillClass(activeTab === id, id === 'inbox' ? 'sky' : 'neutral')}
              aria-current={activeTab === id ? 'page' : undefined}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{label}</span>
              {id === 'inbox' && unreadCount !== null && unreadCount > 0 && (
                <span className="px-1.5 rounded-full text-[10px] font-extrabold bg-sky-600 text-white">
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'smtp' && <SmtpTab refreshToken={refreshToken} />}
      {activeTab === 'inbox' && (
        <InboxTab refreshToken={refreshToken} onUnreadChange={setUnreadCount} />
      )}
      {activeTab === 'info' && <PublicInfoTab refreshToken={refreshToken} onSaved={handleRefresh} />}
    </div>
  );
}