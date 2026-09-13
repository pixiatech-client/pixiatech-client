'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import type { ClientDispute, ClientInvoice, ClientNotification, ClientOrder, ClientProduct, ClientProfile } from './types';
import { clientApi, type SessionStatusPayload } from './lib/api';
import { formatDate, formatShortDate } from './lib/format';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { NoticeBanner } from './components/NoticeBanner';
import { DashboardView } from './components/views/DashboardView';
import { OrdersView } from './components/views/OrdersView';
import { InvoicesView } from './components/views/InvoicesView';
import { DisputesView } from './components/views/DisputesView';
import { AccountSettingsView } from './components/views/AccountSettingsView';
import { DisputeModal } from './components/modals/DisputeModal';
import { SiretVerificationModal } from './components/modals/SiretVerificationModal';
import { EmailVerificationModal } from './components/modals/EmailVerificationModal';
import { BoutiqueModal } from './components/modals/BoutiqueModal';
import { InvoiceDetailModal } from './components/modals/InvoiceDetailModal';

interface ClientPortalProps {
  initialTab?: string;
  initialDisputeId?: string;
}

export type ClientTab = 'dashboard' | 'orders' | 'invoices' | 'disputes' | 'settings';

const VALID_TABS: ClientTab[] = ['dashboard', 'orders', 'invoices', 'disputes', 'settings'];

function toProfile(p: SessionStatusPayload): ClientProfile {
  const displayName = p.displayName || p.name || '';
  const name = displayName || p.email || 'Client';
  return {
    name,
    email: p.email || '',
    phone: p.phone || '',
    avatarUrl: p.avatarUrl || '',
    emailVerified: p.emailVerified === true,
    siretVerified: p.siretVerified === true,
    vatValidated: p.vatValidated === true,
    hasPassword: p.hasPassword === true,
    civility: p.civility || '',
    companyName: p.companyName || '',
    companyAddress: p.companyAddress || '',
    companyCity: p.city || '',
    companyPostalCode: p.zipCode || '',
    companyCountry: p.country || '',
    legalStatus: p.legalStatus || '',
    vatNumber: p.vatNumber || '',
    siret: p.siret || '',
    nafCode: p.nafCode || '',
    officePhone: p.officePhone || '',
    personalAddress: {
      street: p.companyAddress || '',
      postalCode: p.zipCode || '',
      city: p.city || '',
      country: p.country || '',
    },
    createdAt: p.createdAt,
    lastLoginAt: p.lastLoginAt,
  };
}

function timeFromIso(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}h${String(d.getMinutes()).padStart(2, '0')}`;
}

interface ToastState {
  type: 'success' | 'error';
  message: string;
}

export function ClientPortal({ initialTab, initialDisputeId }: ClientPortalProps) {
  const router = useRouter();
  const { addItem } = useCart();
  const initial = useRef(true);

  const [tab, setTabState] = useState<ClientTab>(() => {
    const t = (initialTab || 'dashboard') as ClientTab;
    return VALID_TABS.includes(t) ? t : 'dashboard';
  });
  const [initialLoading, setInitialLoading] = useState(true);
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [orders, setOrders] = useState<ClientOrder[]>([]);
  const [invoices, setInvoices] = useState<ClientInvoice[]>([]);
  const [disputes, setDisputes] = useState<ClientDispute[]>([]);

  const [showToastState, setShowToastState] = useState<ToastState | null>(null);
  const [invoiceDetail, setInvoiceDetail] = useState<ClientInvoice | null>(null);
  const [disputeModal, setDisputeModal] = useState<{ open: boolean; defaultOrderId?: string }>({ open: false });
  const [siretModal, setSiretModal] = useState(false);
  const [emailModal, setEmailModal] = useState(false);
  const [boutiqueModal, setBoutiqueModal] = useState(false);

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setShowToastState({ type, message });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setShowToastState(null), 4200);
  }, []);

  const setTab = useCallback((key: string) => {
    const t = VALID_TABS.includes(key as ClientTab) ? (key as ClientTab) : 'dashboard';
    setTabState(t);
    router.replace(`/mon-compte?tab=${t === 'dashboard' ? '' : t}`, { scroll: false });
  }, [router]);

  const loadSession = useCallback(async () => {
    const data = await clientApi.sessionStatus();
    if (!data.loggedIn) {
      window.location.href = '/mon-compte/connexion';
      return null;
    }
    return toProfile(data);
  }, []);

  const refreshAll = useCallback(async (opts: { silent?: boolean } = {}) => {
    if (!opts.silent) setInitialLoading(true);
    try {
      const [sessionData, ordersRes, invoicesRes, disputesRes] = await Promise.all([
        clientApi.sessionStatus(),
        clientApi.orders(),
        clientApi.invoices(),
        clientApi.disputes(),
      ]);
      if (!sessionData.loggedIn) {
        window.location.href = '/mon-compte/connexion';
        return;
      }
      setProfile(toProfile(sessionData));
      setOrders(ordersRes.orders || []);
      setInvoices(invoicesRes.invoices || []);
      setDisputes(disputesRes.disputes || []);
    } catch (err: any) {
      if (err?.status === 401) {
        window.location.href = '/mon-compte/connexion';
        return;
      }
      showToast('error', err?.message || 'Impossible de charger vos données.');
    } finally {
      setInitialLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (!initial.current) return;
    initial.current = false;
    refreshAll().then(() => {
      if (initialDisputeId) {
        clientApi.markDisputeRead(initialDisputeId).catch(() => undefined);
        setDisputes((list) => {
          const target = list.find((d) => d.id === initialDisputeId);
          if (!target) return list;
          return [target, ...list.filter((d) => d.id !== initialDisputeId)];
        });
        setTab('disputes');
      }
    });
  }, [refreshAll, initialDisputeId, setTab]);

  const refreshProfile = useCallback(async () => {
    try {
      const data = await loadSession();
      if (data) setProfile(data);
    } catch {
      // Silencieux : le prochain chargement complet rafraîchira le profil.
    }
  }, [loadSession]);

  const notifications = useMemo<ClientNotification[]>(() => {
    return disputes
      .filter((d) => d.unreadByClient)
      .map((d) => ({
        id: `dispute-${d.id}`,
        type: 'dispute' as const,
        title: d.orderNumber ? `Litige n° ${d.orderNumber}` : 'Réponse du support client',
        message: `${d.reasonLabel} — un nouveau message vous attend dans votre espace litiges.`,
        date: d.lastResponseDate ? formatShortDate(d.lastResponseDate) : formatDate(d.date),
        read: false,
        linkTab: 'disputes',
        disputeId: d.id,
      }));
  }, [disputes]);

  const markNotificationsRead = useCallback(() => {
    disputes.forEach((d) => {
      if (d.unreadByClient) clientApi.markDisputeRead(d.id).catch(() => undefined);
    });
    setDisputes((list) => list.map((x) => (x.unreadByClient ? { ...x, unreadByClient: false } : x)));
  }, [disputes]);

  const handleLogout = useCallback(() => {
    fetch('/api/boutique/logout', { method: 'POST' }).catch(() => undefined);
    window.location.href = '/mon-compte/connexion';
  }, []);

  const openInvoice = useCallback(async (invoiceId: string) => {
    let found = invoices.find((i) => i.id === invoiceId);
    if (!found) {
      try {
        const res = await clientApi.invoices();
        setInvoices(res.invoices || []);
        found = res.invoices?.find((i) => i.id === invoiceId);
      } catch {
        found = undefined;
      }
    }
    if (found) {
      setInvoiceDetail(found);
    } else {
      showToast('error', 'Facture introuvable.');
    }
  }, [invoices, showToast]);

  const handleSelectDispute = useCallback(
    (id: string) => {
      const d = disputes.find((x) => x.id === id);
      if (d?.unreadByClient) {
        clientApi.markDisputeRead(id).catch(() => undefined);
        setDisputes((list) => list.map((x) => (x.id === id ? { ...x, unreadByClient: false } : x)));
      }
    },
    [disputes]
  );

  const sendDisputeMessage = useCallback(
    async (disputeId: string, text: string) => {
      try {
        await clientApi.replyDispute(disputeId, text);
        const now = new Date().toISOString();
        setDisputes((list) =>
          list.map((d) =>
            d.id === disputeId
              ? {
                  ...d,
                  unreadByClient: false,
                  lastResponseDate: now,
                  messages: [
                    ...d.messages,
                    {
                      id: `m-${Date.now()}`,
                      sender: 'customer' as const,
                      senderName: profile?.name || 'Vous',
                      message: text,
                      date: formatDate(now),
                      time: timeFromIso(now),
                    },
                  ],
                }
              : d
          )
        );
      } catch (err: any) {
        showToast('error', err?.message || "Impossible d'envoyer votre message.");
      }
    },
    [profile?.name, showToast]
  );

  const openDisputeModal = useCallback((defaultOrderId?: string) => {
    setDisputeModal({ open: true, defaultOrderId });
  }, []);

  const handleOrderProduct = useCallback(
    (product: ClientProduct) => {
      // Parcours de commande réel PIXIATECH : ajout au panier + check-out boutique.
      // Le serveur re-résout le prix et le stock dans /api/boutique/verify-cart et
      // /api/paypal/create-order (autorité = Firestore boutique_products).
      addItem({
        productId: product.id,
        name: product.name,
        price: product.price,
        image: product.image || null,
        category: product.category || '',
        type: 'purchase',
      });
      setBoutiqueModal(false);
      router.push('/boutique/commande');
    },
    [addItem, router]
  );

  return (
    <div className="flex min-h-screen flex-col bg-[#F4F6F8] font-sans text-neutral-900 antialiased selection:bg-[#38E044] selection:text-black">
      <Header
        user={profile}
        notifications={notifications}
        onNavigate={setTab}
        onLogout={handleLogout}
        onMarkNotificationsAsRead={markNotificationsRead}
      />

      <NoticeBanner user={profile} onOpenSiretModal={() => setSiretModal(true)} />

      <Navigation
        activeTab={tab}
        onNavigate={setTab}
        ordersCount={orders.length}
        invoicesCount={invoices.length}
        onOpenDisputeModal={() => openDisputeModal()}
        onOpenStore={() => setBoutiqueModal(true)}
        onLogout={handleLogout}
        user={profile}
      />

      <main className="mx-auto w-full max-w-[1536px] flex-1 px-4 py-4 sm:px-6 sm:py-6">
        {initialLoading ? (
          <LoadingSkeleton />
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              {tab === 'dashboard' && (
                <DashboardView
                  profile={profile}
                  orders={orders}
                  invoices={invoices}
                  disputes={{ total: disputes.length, open: disputes.filter((d) => d.statusLabel === 'Ouvert' || d.statusLabel === 'En cours' || d.statusLabel === 'En attente').length }}
                  onNavigate={setTab}
                  onOpenBoutique={() => setBoutiqueModal(true)}
                  onOpenDispute={() => openDisputeModal()}
                  onOpenInvoice={openInvoice}
                />
              )}
              {tab === 'orders' && (
                <OrdersView
                  orders={orders}
                  ordersCount={orders.length}
                  onOpenInvoice={openInvoice}
                  onOpenDispute={openDisputeModal}
                  onNavigate={setTab}
                />
              )}
              {tab === 'invoices' && (
                <InvoicesView
                  invoices={invoices}
                  onOpenInvoice={openInvoice}
                  onDone={() => refreshAll({ silent: true })}
                  onRequireProfessionalInfo={() => setSiretModal(true)}
                  showToast={showToast}
                />
              )}
              {tab === 'disputes' && (
                <DisputesView
                  disputes={disputes}
                  onSelectDispute={handleSelectDispute}
                  onNewDispute={() => openDisputeModal()}
                  onSendMessage={sendDisputeMessage}
                />
              )}
              {tab === 'settings' && (
                <AccountSettingsView
                  profile={profile}
                  onRefreshProfile={refreshProfile}
                  onOpenSiretModal={() => setSiretModal(true)}
                  onOpenEmailModal={() => setEmailModal(true)}
                  showToast={showToast}
                />
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      <footer className="mt-12 w-full border-t border-neutral-200/80 bg-white py-6 text-xs text-neutral-500">
        <div className="mx-auto flex max-w-[1536px] flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-neutral-900">PIXIATECH CLIENT</span>
            <span>—</span>
            <span>Portail client sécurisé & facturation certifiée</span>
          </div>
          <div className="flex items-center gap-4 text-neutral-400">
            <span>Conformité fiscale Art. 289 CGI</span>
            <span>•</span>
            <span>Chiffrement TLS 1.3</span>
            <span>•</span>
            <span>Registre INSEE / SIRENE</span>
          </div>
        </div>
      </footer>

      <BoutiqueModal open={boutiqueModal} onClose={() => setBoutiqueModal(false)} onOrderProduct={handleOrderProduct} />
      <DisputeModal
        open={disputeModal.open}
        defaultOrderId={disputeModal.defaultOrderId}
        orders={orders}
        onClose={() => setDisputeModal({ open: false })}
        onCreated={(disputeId) => {
          refreshAll({ silent: true });
          setTab('disputes');
          setDisputes((list) => {
            const created = list.find((d) => d.id === disputeId);
            if (!created) return list;
            return [created, ...list.filter((d) => d.id !== disputeId)];
          });
        }}
        showToast={showToast}
      />
      <SiretVerificationModal
        open={siretModal}
        onClose={() => setSiretModal(false)}
        onVerified={() => {
          refreshProfile();
          refreshAll({ silent: true });
        }}
        showToast={showToast}
      />
      <EmailVerificationModal
        open={emailModal}
        onClose={() => setEmailModal(false)}
        onVerified={() => {
          refreshProfile();
          refreshAll({ silent: true });
        }}
        showToast={showToast}
        email={profile?.email}
      />
      <InvoiceDetailModal invoice={invoiceDetail} onClose={() => setInvoiceDetail(null)} />

      <ToastView toast={showToastState} />
    </div>
  );
}

function ToastView({ toast }: { toast: ToastState | null }) {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="fixed bottom-5 left-1/2 z-[60] w-full max-w-sm -translate-x-1/2 px-4"
        >
          <div className={`flex items-start gap-3 rounded-2xl border px-4 py-3.5 shadow-2xl backdrop-blur-xl ${
            toast.type === 'success'
              ? 'border-emerald-100 bg-white/95'
              : 'border-red-100 bg-white/95'
          }`}>
            {toast.type === 'success' ? (
              <CheckCircle2 size={19} className="mt-0.5 shrink-0 text-emerald-600" />
            ) : (
              <XCircle size={19} className="mt-0.5 shrink-0 text-red-500" />
            )}
            <p className="text-sm font-medium text-neutral-800">{toast.message}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-56 animate-pulse rounded-xl bg-neutral-200/70" />
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="h-24 animate-pulse rounded-2xl bg-neutral-200/60" />
        <div className="h-24 animate-pulse rounded-2xl bg-neutral-200/60" />
        <div className="h-24 animate-pulse rounded-2xl bg-neutral-200/60" />
      </div>
      <div className="h-64 animate-pulse rounded-2xl bg-neutral-200/60" />
    </div>
  );
}