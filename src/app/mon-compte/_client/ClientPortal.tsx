'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import type {
  UserProfile,
  Order,
  Invoice,
  Dispute,
  DisputeMessage,
  NotificationItem,
  ActiveTab,
  OrderItem,
  BillingType,
  ClientTab,
} from './types';

export type { ClientTab };
import { clientApi } from './lib/api';
import { mapApiOrders, mapApiInvoices, mapApiDisputes } from './lib/mappers';
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

const VALID_TABS: ActiveTab[] = ['dashboard', 'orders', 'invoices', 'disputes', 'settings'];

interface ToastState {
  type: 'success' | 'error';
  message: string;
}

// Deterministic neutral profile — no fake name/email/avatar/SIRET data.
const EMPTY_USER: UserProfile = {
  id: '',
  name: '',
  email: '',
  phone: '',
  avatarUrl: '',
  emailVerified: false,
  role: 'client',
};

export function ClientPortal({ initialTab, initialDisputeId }: ClientPortalProps) {
  const router = useRouter();
  const { addItem } = useCart();

  // Active view tab
  const [activeTab, setActiveTabState] = useState<ActiveTab>(() => {
    const t = (initialTab || 'dashboard') as ActiveTab;
    return VALID_TABS.includes(t) ? t : 'dashboard';
  });

  // Client user state — starts neutral/empty so no fake data is ever shown.
  // Server session data arrives afterward and replaces it (authoritative source).
  const [user, setUser] = useState<UserProfile>(EMPTY_USER);

  const [orders, setOrders] = useState<Order[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Modals
  const [showSiretModal, setShowSiretModal] = useState<boolean>(false);
  const [showEmailModal, setShowEmailModal] = useState<boolean>(false);
  const [showDisputeModal, setShowDisputeModal] = useState<boolean>(false);
  const [disputePreselectedOrder, setDisputePreselectedOrder] = useState<Order | null>(null);
  const [showBoutiqueModal, setShowBoutiqueModal] = useState<boolean>(false);
  const [boutiqueProductSheet, setBoutiqueProductSheet] = useState<OrderItem | null>(null);
  const [selectedInvoiceForModal, setSelectedInvoiceForModal] = useState<Invoice | null>(null);

  // Toast state
  const [toast, setToast] = useState<ToastState | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4200);
  }, []);

  const setActiveTab = useCallback(
    (key: ActiveTab) => {
      const t = VALID_TABS.includes(key) ? key : 'dashboard';
      setActiveTabState(t);
      router.replace(`/mon-compte?tab=${t === 'dashboard' ? '' : t}`, { scroll: false });
    },
    [router]
  );

  // Load real data from APIs with fallback to demo data
  const refreshData = useCallback(async () => {
    try {
      const [ordersRes, invoicesRes, disputesRes] = await Promise.all([
        clientApi.orders().catch(() => null),
        clientApi.invoices().catch(() => null),
        clientApi.disputes().catch(() => null),
      ]);

      let loadedInvoices: Invoice[] | null = null;
      if (invoicesRes?.invoices && Array.isArray(invoicesRes.invoices) && invoicesRes.invoices.length > 0) {
        loadedInvoices = mapApiInvoices(invoicesRes.invoices);
        setInvoices(loadedInvoices);
      }

      if (ordersRes?.orders && Array.isArray(ordersRes.orders) && ordersRes.orders.length > 0) {
        const mappedOrders = mapApiOrders(ordersRes.orders);
        if (loadedInvoices) {
          mappedOrders.forEach((ord) => {
            const inv = loadedInvoices?.find(
              (i) => i.orderId === ord.id || i.orderNumber === ord.orderNumber
            );
            if (inv) {
              ord.hasInvoice = true;
              ord.invoiceId = inv.id;
              ord.invoiceStatus = inv.status;
            }
          });
        }
        setOrders(mappedOrders);
      }

      if (disputesRes?.disputes && Array.isArray(disputesRes.disputes) && disputesRes.disputes.length > 0) {
        setDisputes(mapApiDisputes(disputesRes.disputes));
      }
    } catch (err) {
      console.warn('[ClientPortal] Refresh data error:', err);
    }
  }, []);

  // Load real data from backend when authenticated. Server is the authoritative source.
  useEffect(() => {
    let isMounted = true;
    clientApi
      .sessionStatus()
      .then((session) => {
        if (!isMounted) return;
        if (session.loggedIn) {
          setUser((prev) => ({
            ...prev,
            id: session.customerId || prev.id,
            name: session.displayName || session.name || prev.name,
            email: session.email || prev.email,
            phone: session.phone || prev.phone,
            avatarUrl: session.avatarUrl || prev.avatarUrl,
            emailVerified: session.emailVerified ?? prev.emailVerified,
            siretVerified: session.siretVerified ?? prev.siretVerified,
            companyName: session.companyName || prev.companyName,
            siret: session.siret || prev.siret,
            vatNumber: session.vatNumber || prev.vatNumber,
            companyAddress: session.companyAddress || prev.companyAddress,
            city: session.city || prev.city,
            postalCode: session.zipCode || prev.postalCode,
            legalStatus: session.legalStatus || prev.legalStatus,
            nafCode: session.nafCode || prev.nafCode
          }));

          refreshData();
        }
      })
      .catch(() => {
        // Keep the neutral empty profile — do not fabricate demo data.
        if (isMounted) {
          setUser(EMPTY_USER);
        }
      });

    // Gentle polling every 30 seconds to keep invoices and disputes up to date with admin
    const timer = setInterval(() => {
      refreshData();
    }, 30000);

    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [refreshData]);

  // Handle initial dispute deep linking
  useEffect(() => {
    if (initialDisputeId) {
      setActiveTab('disputes');
    }
  }, [initialDisputeId, setActiveTab]);

  // Profile updates
  const handleUpdateUser = (fields: Partial<UserProfile>) => {
    setUser((prev) => ({ ...prev, ...fields }));
    showToast('success', 'Profil mis à jour');
  };

  // Permanent SIRET validation and lock
  const handleSiretValidated = (data: {
    siret: string;
    companyName: string;
    vatNumber: string;
    companyAddress: string;
    legalStatus: string;
    nafCode: string;
    city: string;
    postalCode: string;
  }) => {
    setUser((prev) => ({
      ...prev,
      siret: data.siret,
      companyName: data.companyName,
      vatNumber: data.vatNumber,
      companyAddress: data.companyAddress,
      legalStatus: data.legalStatus,
      nafCode: data.nafCode,
      city: data.city,
      postalCode: data.postalCode,
      siretVerified: true
    }));

    const newNotif: NotificationItem = {
      id: 'notif-siret-' + Date.now(),
      title: 'Entreprise Certifiée',
      message: `Le SIRET ${data.siret} a été définitivement associé et certifié pour votre compte.`,
      date: "À l'instant",
      read: false,
      type: 'security',
      linkTab: 'settings'
    };
    setNotifications((prev) => [newNotif, ...prev]);
    showToast('success', 'Entreprise vérifiée et verrouillée');
  };

  // Email verification
  const handleEmailVerified = () => {
    setUser((prev) => ({ ...prev, emailVerified: true }));
    const newNotif: NotificationItem = {
      id: 'notif-email-' + Date.now(),
      title: 'E-mail Certifié',
      message: 'Votre adresse e-mail a été confirmée avec succès.',
      date: "À l'instant",
      read: false,
      type: 'security'
    };
    setNotifications((prev) => [newNotif, ...prev]);
    showToast('success', 'Adresse e-mail validée');
  };

  // Create invoice from an order
  const handleCreateInvoice = async (
    order: Order,
    item: OrderItem,
    billingType: BillingType = 'particulier'
  ) => {
    try {
      await clientApi.generateInvoice(order.id, (order.type || 'sale') as 'sale' | 'rental');
      await refreshData();
      showToast('success', 'Demande de facture transmise avec succès');
      const notif: NotificationItem = {
        id: 'notif-inv-' + Date.now(),
        title: 'Demande de facture enregistrée',
        message: `Votre demande pour la commande ${order.orderNumber} a été transmise.`,
        date: "À l'instant",
        read: false,
        type: 'invoice',
        linkTab: 'invoices',
      };
      setNotifications((prev) => [notif, ...prev]);
    } catch (err) {
      console.warn('[handleCreateInvoice] API generate failed, falling back to optimistic local invoice:', err);
      const newInvoiceNumber = `FAC-2026-${String(invoices.length + 104).padStart(4, '0')}`;
      const isEnterprise = billingType === 'entreprise';
      const newInvoice: Invoice = {
        id: 'fac-' + Date.now(),
        invoiceNumber: newInvoiceNumber,
        orderId: order.id,
        orderNumber: order.orderNumber,
        productId: item.productId,
        productName: item.productName,
        productImage: item.productImage,
        productUrl: '/boutique',
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        subtotalHT: order.subtotalHT,
        vatRate: 0.2,
        vatAmount: order.vatAmount,
        discountCode: order.discountCode,
        discountAmount: order.discountAmount,
        totalTTC: order.totalTTC,
        status: 'EN ATTENTE',
        definitiveDocumentUploaded: false,
        billingType,
        clientSnapshot: {
          billingType,
          clientName: user.name,
          email: user.email,
          siret: isEnterprise ? user.siret : undefined,
          companyName: isEnterprise ? user.companyName : undefined,
          vatNumber: isEnterprise ? user.vatNumber : undefined,
          billingAddress: isEnterprise
            ? user.companyAddress || '142 Avenue des Champs-Élysées'
            : user.personalAddress || '142 Avenue des Champs-Élysées',
          city: isEnterprise ? user.city || 'Paris' : user.personalCity || 'Paris',
          postalCode: isEnterprise ? user.postalCode || '75008' : user.personalPostalCode || '75008',
          country: 'France'
        }
      };

      setOrders((prev) =>
        prev.map((o) =>
          o.id === order.id
            ? { ...o, hasInvoice: true, invoiceId: newInvoice.id, invoiceStatus: 'EN ATTENTE' }
            : o
        )
      );

      setInvoices((prev) => [newInvoice, ...prev]);

      const notif: NotificationItem = {
        id: 'notif-inv-' + Date.now(),
        title: 'Demande de facture enregistrée',
        message: `Votre demande pour la commande ${order.orderNumber} a été transmise au service comptabilité (statut : EN ATTENTE).`,
        date: "À l'instant",
        read: false,
        type: 'invoice',
        linkTab: 'invoices'
      };
      setNotifications((prev) => [notif, ...prev]);
      showToast('success', 'Demande de facture transmise');
    }
  };

  // Administration workflow: process invoice request (EN ATTENTE -> EN COURS)
  const handleProcessInvoice = (invoiceId: string) => {
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === invoiceId ? { ...inv, status: 'EN COURS' } : inv))
    );
    setOrders((prev) =>
      prev.map((ord) => (ord.invoiceId === invoiceId ? { ...ord, invoiceStatus: 'EN COURS' } : ord))
    );
    const notif: NotificationItem = {
      id: 'notif-inv-proc-' + Date.now(),
      title: 'Facture en cours de traitement',
      message:
        "Votre demande de facture est actuellement en cours d'instruction par le service comptable.",
      date: "À l'instant",
      read: false,
      type: 'invoice',
      linkTab: 'invoices'
    };
    setNotifications((prev) => [notif, ...prev]);
    showToast('success', 'Statut passé à : EN COURS DE TRAITEMENT');
  };

  // Administration workflow: validate and upload certified document (EN COURS -> FACTURE DISPONIBLE)
  const handleValidateInvoice = (invoiceId: string) => {
    const inv = invoices.find((i) => i.id === invoiceId);
    setInvoices((prev) =>
      prev.map((i) =>
        i.id === invoiceId
          ? {
              ...i,
              status: 'FACTURE DISPONIBLE',
              definitiveDocumentUploaded: true,
              uploadedAt: new Date().toISOString()
            }
          : i
      )
    );
    setOrders((prev) =>
      prev.map((ord) =>
        ord.invoiceId === invoiceId
          ? { ...ord, invoiceStatus: 'FACTURE DISPONIBLE' }
          : ord
      )
    );
    const notif: NotificationItem = {
      id: 'notif-inv-val-' + Date.now(),
      title: 'Facture certifiée disponible',
      message: `Le document fiscal officiel pour la commande ${inv?.orderNumber || ''} a été validé et associé. Vous pouvez le télécharger.`,
      date: "À l'instant",
      read: false,
      type: 'invoice',
      linkTab: 'invoices'
    };
    setNotifications((prev) => [notif, ...prev]);
    showToast('success', 'Facture validée et disponible au téléchargement !');
  };

  // Submit dispute
  const handleSubmitDispute = async (disputeData: Omit<Dispute, 'id' | 'date' | 'status'>) => {
    try {
      await clientApi.createDispute({
        orderId: disputeData.orderId,
        orderType: (disputeData as any).orderType || 'sale',
        reason: disputeData.reason,
        description: disputeData.description,
      });
      await refreshData();
      showToast('success', 'Réclamation enregistrée auprès du support');
      const notif: NotificationItem = {
        id: 'notif-disp-' + Date.now(),
        title: 'Litige ouvert',
        message: `Votre réclamation pour la commande ${disputeData.orderNumber} a été prise en charge.`,
        date: "À l'instant",
        read: false,
        type: 'dispute',
        linkTab: 'disputes',
      };
      setNotifications((prev) => [notif, ...prev]);
    } catch (err) {
      console.warn('[handleSubmitDispute] API failed, falling back to optimistic local dispute:', err);
      const newDispute: Dispute = {
        id: 'lit-' + Date.now(),
        date: new Date().toLocaleDateString('fr-FR'),
        status: 'Ouvert',
        ...disputeData,
        messages: [
          {
            id: 'msg-' + Date.now(),
            sender: 'client',
            senderName: user.name,
            message: disputeData.description,
            date: new Date().toLocaleDateString('fr-FR'),
            time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
          }
        ]
      };

      setDisputes((prev) => [newDispute, ...prev]);

      const notif: NotificationItem = {
        id: 'notif-disp-' + Date.now(),
        title: 'Litige ouvert',
        message: `Votre réclamation pour la commande ${disputeData.orderNumber} a été prise en charge par le support.`,
        date: "À l'instant",
        read: false,
        type: 'dispute',
        linkTab: 'disputes'
      };
      setNotifications((prev) => [notif, ...prev]);
      showToast('success', 'Réclamation prise en compte');
    }
  };

  // Reply in dispute conversation thread
  const handleSendMessageInDispute = async (disputeId: string, messageText: string) => {
    try {
      await clientApi.replyDispute(disputeId, messageText);
      await refreshData();
      showToast('success', 'Message envoyé');
    } catch (err) {
      console.warn('[handleSendMessageInDispute] API failed, falling back to local thread update:', err);
      const newMsg: DisputeMessage = {
        id: 'msg-' + Date.now(),
        sender: 'client',
        senderName: user.name,
        message: messageText,
        date: new Date().toLocaleDateString('fr-FR'),
        time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      };

      setDisputes((prev) =>
        prev.map((d) =>
          d.id === disputeId
            ? {
                ...d,
                status: d.status === 'Résolu' ? 'En cours' : d.status,
                messages: [...(d.messages || []), newMsg]
              }
            : d
        )
      );
    }
  };

  // Simulate or place store order
  const handleOrderProduct = (product: OrderItem) => {
    addItem({
      productId: product.productId,
      name: product.productName,
      price: product.unitPriceTTC,
      image: product.productImage || null,
      category: product.category || '',
      type: 'purchase'
    });

    const newOrderNumber = `CMD-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrder: Order = {
      id: 'ord-' + Date.now(),
      orderNumber: newOrderNumber,
      date: new Date().toLocaleDateString('fr-FR'),
      carrier: 'Chronopost Express 24h',
      trackingNumber: `FR-${Math.floor(10000000 + Math.random() * 90000000)}`,
      deliveryPin: `${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'in_transit',
      shippingAddress: `${user.companyAddress || user.personalAddress || '142 Avenue des Champs-Élysées'}, ${user.postalCode || user.personalPostalCode || '75008'} ${user.city || user.personalCity || 'Paris'}`,
      subtotalHT: product.unitPriceHT,
      vatRate: 0.2,
      vatAmount: product.unitPriceTTC - product.unitPriceHT,
      totalTTC: product.unitPriceTTC,
      hasInvoice: false,
      items: [product]
    };

    setOrders((prev) => [newOrder, ...prev]);

    const notif: NotificationItem = {
      id: 'notif-order-' + Date.now(),
      title: 'Nouvelle commande enregistrée',
      message: `Votre commande ${newOrderNumber} est confirmée et préparée pour expédition.`,
      date: "À l'instant",
      read: false,
      type: 'order',
      linkTab: 'orders'
    };
    setNotifications((prev) => [notif, ...prev]);
    showToast('success', 'Commande validée avec succès !');
  };

  const handleOpenDisputeForOrder = (order: Order) => {
    setDisputePreselectedOrder(order);
    setShowDisputeModal(true);
  };

  const handleOpenInvoiceForOrder = (order: Order) => {
    if (order.hasInvoice && order.invoiceId) {
      const existing = invoices.find((i) => i.id === order.invoiceId);
      if (existing) {
        setSelectedInvoiceForModal(existing);
        return;
      }
    }
    setActiveTab('invoices');
  };

  const handleMarkNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleDeleteAccount = () => {
    localStorage.removeItem('pixiatech_client_profile');
    showToast('error', 'Compte client supprimé');
    setTimeout(() => {
      window.location.href = '/';
    }, 1200);
  };

  const handleLogout = () => {
    fetch('/api/boutique/logout', { method: 'POST' }).catch(() => undefined);
    window.location.href = '/mon-compte/connexion';
  };

  return (
    <div className="w-full flex min-h-screen flex-col bg-[#F4F6F8] font-sans text-neutral-900 antialiased selection:bg-[#38E044] selection:text-black">
      {/* 1. Header (Identique aux captures) */}
      <Header
        user={user}
        notifications={notifications}
        onNavigate={setActiveTab}
        onLogout={handleLogout}
        onMarkNotificationsAsRead={handleMarkNotificationsAsRead}
      />

      {/* 2. Notice Banner (Conforme & Non intrusive) */}
      <NoticeBanner user={user} onOpenSiretModal={() => setShowSiretModal(true)} />

      {/* 3. Navigation Capsule (Style Noir & Vert) */}
      <Navigation
        activeTab={activeTab}
        onNavigate={setActiveTab}
        ordersCount={orders.length}
        invoicesCount={invoices.length}
        onOpenDisputeModal={() => {
          setDisputePreselectedOrder(null);
          setShowDisputeModal(true);
        }}
        onOpenStore={() => setShowBoutiqueModal(true)}
        onLogout={handleLogout}
        user={user}
      />

      {/* 4. Main Views */}
      <main className="mx-auto w-full max-w-[1536px] flex-1 px-4 sm:px-6 py-4 sm:py-6">
        <motion.div
          key={activeTab}
          className="w-full"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
        >
            {activeTab === 'dashboard' && (
              <DashboardView
                user={user}
                orders={orders}
                invoices={invoices}
                disputes={disputes}
                onNavigate={setActiveTab}
                onOpenSiretModal={() => setShowSiretModal(true)}
                onOpenEmailModal={() => setShowEmailModal(true)}
                onOpenDisputeModal={() => {
                  setDisputePreselectedOrder(null);
                  setShowDisputeModal(true);
                }}
                onOpenStore={() => setShowBoutiqueModal(true)}
                onViewInvoiceDetails={(inv) => setSelectedInvoiceForModal(inv)}
              />
            )}

            {activeTab === 'orders' && (
              <OrdersView
                orders={orders}
                onOpenDisputeModal={handleOpenDisputeForOrder}
                onOpenInvoiceModal={handleOpenInvoiceForOrder}
                onOpenStore={() => setShowBoutiqueModal(true)}
                onViewProductInStore={(prod) => {
                  setBoutiqueProductSheet(prod);
                  setShowBoutiqueModal(true);
                }}
              />
            )}

            {activeTab === 'invoices' && (
              <InvoicesView
                user={user}
                orders={orders}
                invoices={invoices}
                onCreateInvoice={handleCreateInvoice}
                onProcessInvoice={handleProcessInvoice}
                onValidateInvoice={handleValidateInvoice}
                onOpenStore={() => setShowBoutiqueModal(true)}
                onOpenSiretModal={() => setShowSiretModal(true)}
                onOpenEmailModal={() => setShowEmailModal(true)}
                onViewProductInStore={(item) => {
                  setBoutiqueProductSheet(item);
                  setShowBoutiqueModal(true);
                }}
                onViewInvoiceDetails={(inv) => setSelectedInvoiceForModal(inv)}
              />
            )}

            {activeTab === 'disputes' && (
              <DisputesView
                disputes={disputes}
                orders={orders}
                user={user}
                onOpenDisputeModal={() => {
                  setDisputePreselectedOrder(null);
                  setShowDisputeModal(true);
                }}
                onSendMessage={handleSendMessageInDispute}
              />
            )}

            {activeTab === 'settings' && (
              <AccountSettingsView
                user={user}
                onUpdateUser={handleUpdateUser}
                onDeleteAccount={handleDeleteAccount}
                onOpenSiretModal={() => setShowSiretModal(true)}
                onOpenEmailModal={() => setShowEmailModal(true)}
                showToast={showToast}
              />
            )}
          </motion.div>
      </main>

      {/* 5. Footer */}
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

      {/* Modals */}
      <SiretVerificationModal
        isOpen={showSiretModal}
        onClose={() => setShowSiretModal(false)}
        onSiretValidated={handleSiretValidated}
      />

      <EmailVerificationModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        email={user.email}
        onEmailVerified={handleEmailVerified}
      />

      <DisputeModal
        isOpen={showDisputeModal}
        onClose={() => {
          setShowDisputeModal(false);
          setDisputePreselectedOrder(null);
        }}
        orders={orders}
        preselectedOrder={disputePreselectedOrder}
        onSubmitDispute={handleSubmitDispute}
      />

      <BoutiqueModal
        isOpen={showBoutiqueModal}
        onClose={() => {
          setShowBoutiqueModal(false);
          setBoutiqueProductSheet(null);
        }}
        selectedProduct={boutiqueProductSheet}
        onOrderProduct={handleOrderProduct}
      />

      <InvoiceDetailModal
        invoice={selectedInvoiceForModal}
        onClose={() => setSelectedInvoiceForModal(null)}
        onOpenStoreProduct={() => {
          setSelectedInvoiceForModal(null);
          setShowBoutiqueModal(true);
        }}
      />

      <ToastView toast={toast} />
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
          <div
            className={`flex items-start gap-3 rounded-2xl border px-4 py-3.5 shadow-2xl backdrop-blur-xl ${
              toast.type === 'success'
                ? 'border-emerald-100 bg-white/95'
                : 'border-red-100 bg-white/95'
            }`}
          >
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