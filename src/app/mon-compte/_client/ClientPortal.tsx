'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { ClientDispute, ClientInvoice, ClientOrder, ClientProfile } from './types';
import { clientApi, type SessionStatusPayload } from './lib/api';
import { Header } from './components/Header';
import { SidebarNav } from './components/SidebarNav';
import { NoticeBanner } from './components/NoticeBanner';
import { DashboardView } from './components/views/DashboardView';
import { OrdersView } from './components/views/OrdersView';
import { InvoicesView } from './components/views/InvoicesView';
import { DisputesView } from './components/views/DisputesView';
import { AccountSettingsView } from './components/views/AccountSettingsView';
import { DisputeModal } from './components/modals/DisputeModal';
import { DisputeDetailModal } from './components/modals/DisputeDetailModal';
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

interface ToastState {
  type: 'success' | 'error';
  message: string;
}

export function ClientPortal({ initialTab, initialDisputeId }: ClientPortalProps) {
  const router = useRouter();
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
  const [selectedDispute, setSelectedDispute] = useState<{ id: string; open: boolean }>({ id: '', open: false });
  const [siretModal, setSiretModal] = useState(false);
  const [emailModal, setEmailModal] = useState(false);
  const [boutiqueModal, setBoutiqueModal] = useState(false);

  const [bannerDismissed, setBannerDismissed] = useState<{ siret: boolean; email: boolean }>({ siret: false, email: false });

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
        setTab('disputes');
        setSelectedDispute({ id: initialDisputeId, open: true });
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

  const unreadDisputes = useMemo(() => disputes.filter((d) => d.unreadByClient).length, [disputes]);

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

  const openDisputeDetail = useCallback((id: string) => {
    setSelectedDispute({ id, open: true });
    const d = disputes.find((x) => x.id === id);
    if (d?.unreadByClient) {
      clientApi.markDisputeRead(id).catch(() => undefined);
      setDisputes((list) => list.map((x) => (x.id === id ? { ...x, unreadByClient: false } : x)));
    }
  }, [disputes]);

  const selectedDisputeData = useMemo(
    () => disputes.find((d) => d.id === selectedDispute.id) || null,
    [disputes, selectedDispute.id]
  );

  const showEmailBanner = profile && !profile.emailVerified && !bannerDismissed.email;
  const showSiretBanner = profile && !profile.siretVerified && !bannerDismissed.siret;

  return (
    <div className="min-h-screen w-full bg-[#f5f5f5]">
      <Header name={profile?.name || ''} unreadDisputes={unreadDisputes} onDisputes={() => setTab('disputes')} />

      <div className="mx-auto max-w-7xl px-4 pb-16 pt-[96px] sm:px-6">
        <AnimatePresence>
          {showEmailBanner && (
            <NoticeBanner
              key="email"
              kind="email"
              title="Vérifiez votre adresse e-mail"
              subtitle="Sécurisez votre compte et recevez vos notifications importantes."
              ctaLabel="Vérifier"
              onCta={() => setEmailModal(true)}
              onDismiss={() => setBannerDismissed((b) => ({ ...b, email: true }))}
            />
          )}
          {showSiretBanner && (
            <NoticeBanner
              key="siret"
              kind="siret"
              title="Vérifiez votre SIRET professionnel"
              subtitle="Accédez à la facturation B2B et aux tarifs professionnels."
              ctaLabel="Vérifier mon SIRET"
              onCta={() => setSiretModal(true)}
              onDismiss={() => setBannerDismissed((b) => ({ ...b, siret: true }))}
            />
          )}
        </AnimatePresence>

        <div className="grid gap-8 lg:grid-cols-[auto_minmax(0,1fr)]">
          <SidebarNav active={tab} onChange={setTab} unreadDisputes={unreadDisputes} onOpenBoutique={() => setBoutiqueModal(true)} />

          <div className="min-w-0">
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
                      disputes={{ total: disputes.length, open: disputes.filter((d) => d.statusLabel === 'Ouvert' || d.statusLabel === 'En cours' || d.statusLabel === 'En attente').length }}
                      onNavigate={(v) => setTab(v)}
                      onOpenBoutique={() => setBoutiqueModal(true)}
                      onOpenDispute={() => setDisputeModal({ open: true })}
                      onOpenInvoice={openInvoice}
                    />
                  )}
                  {tab === 'orders' && (
                    <OrdersView
                      orders={orders}
                      ordersCount={orders.length}
                      onOpenInvoice={openInvoice}
                      onOpenDispute={(id) => setDisputeModal({ open: true, defaultOrderId: id })}
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
                    <DisputesView disputes={disputes} onSelectDispute={openDisputeDetail} onNewDispute={() => setDisputeModal({ open: true })} />
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
          </div>
        </div>
      </div>

      <DisputeModal
        open={disputeModal.open}
        defaultOrderId={disputeModal.defaultOrderId}
        orders={orders}
        onClose={() => setDisputeModal({ open: false })}
        onCreated={(disputeId) => {
          refreshAll({ silent: true });
          setTab('disputes');
          setSelectedDispute({ id: disputeId, open: true });
        }}
        showToast={showToast}
      />

      <DisputeDetailModal
        dispute={selectedDisputeData}
        onClose={() => setSelectedDispute({ id: '', open: false })}
        onReplied={(d) => {
          setDisputes((list) => list.map((x) => (x.id === d.id ? d : x)));
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

      <BoutiqueModal open={boutiqueModal} onClose={() => setBoutiqueModal(false)} />

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
            <p className={`text-sm font-medium ${toast.type === 'success' ? 'text-neutral-800' : 'text-neutral-800'}`}>
              {toast.message}
            </p>
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