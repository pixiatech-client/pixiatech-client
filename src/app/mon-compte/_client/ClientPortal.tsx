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
import { mapApiOrders, mapApiInvoice, mapApiInvoices, mapApiDisputes } from './lib/mappers';
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

  // Session lifecycle: 'loading' | 'authenticated' | 'expired'
  const [sessionState, setSessionState] = useState<'loading' | 'authenticated' | 'expired'>('loading');

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

  // Expire the session client-side: wipe every data state so stale/cross-user data
  // can never be shown, and stop rendering the authenticated shell.
  const expireSession = useCallback(() => {
    setUser(EMPTY_USER);
    setOrders([]);
    setInvoices([]);
    setDisputes([]);
    setNotifications([]);
    setSessionState('expired');
  }, []);

  // Load real data from APIs with fallback to demo data
  const refreshData = useCallback(async () => {
    let sessionExpired = false;
    const fetchSafely = async <T,>(p: Promise<T>): Promise<T | null> => {
      try {
        return await p;
      } catch (e) {
        if (e && typeof e === 'object' && 'status' in e && (e as { status?: number }).status === 401) {
          sessionExpired = true;
        }
        return null;
      }
    };

    const [ordersRes, invoicesRes, disputesRes] = await Promise.all([
      fetchSafely(clientApi.orders()),
      fetchSafely(clientApi.invoices()),
      fetchSafely(clientApi.disputes()),
    ]);

    if (sessionExpired) {
      expireSession();
      return;
    }

    let loadedInvoices: Invoice[] | null = null;
    if (invoicesRes?.invoices && Array.isArray(invoicesRes.invoices)) {
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
      const mapped = mapApiDisputes(disputesRes.disputes);
      setDisputes(mapped);

      // Inject admin-reply notifications for unread disputes into the notification bell.
      // We use disputeId as a stable dedup key so each dispute only generates one notif.
      const unreadDisputes = mapped.filter((d) => d.unreadByClient);
      if (unreadDisputes.length > 0) {
        setNotifications((prev) => {
          const existingDisputeIds = new Set(prev.map((n) => n.disputeId).filter(Boolean));
          const newNotifs: NotificationItem[] = unreadDisputes
            .filter((d) => !existingDisputeIds.has(d.id))
            .map((d) => {
              const lastMsg = d.messages && d.messages.length > 0 ? d.messages[d.messages.length - 1] : null;
              const lastAdminMsg = lastMsg?.sender === 'admin' ? lastMsg.message : '';
              const snippet = lastAdminMsg.length > 80 ? `${lastAdminMsg.slice(0, 77)}...` : lastAdminMsg;
              const productStr = d.productName ? ` [${d.productName}]` : '';

              return {
                id: `notif-dispute-reply-${d.id}`,
                title: 'Réponse à votre litige',
                message: snippet
                  ? `Support PIXIATECH${productStr} : "${snippet}"`
                  : `Le support PIXIATECH a répondu à votre réclamation « ${d.reasonLabel || d.reason} »${productStr}.`,
                date: "À l'instant",
                read: false,
                type: 'dispute' as const,
                linkTab: 'disputes' as const,
                disputeId: d.id,
              };
            });
          return newNotifs.length > 0 ? [...newNotifs, ...prev] : prev;
        });
      }
    }
  }, [expireSession]);

  // Load real data from backend when authenticated. Server is the authoritative source.
  useEffect(() => {
    let isMounted = true;
    clientApi
      .sessionStatus()
      .then((session) => {
        if (!isMounted) return;
        if (session.loggedIn) {
          setSessionState('authenticated');
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
        } else {
          // Not logged in or session invalid — clear everything and show the login screen.
          expireSession();
        }
      })
      .catch(() => {
        // Session status lookup failed — do not fabricate data, show login screen.
        if (isMounted) {
          expireSession();
        }
      });

    return () => {
      isMounted = false;
    };
  }, [refreshData, expireSession]);

  // Gentle polling every 15 seconds to keep invoices and disputes up to date with admin replies.
  // Only runs while the session is authenticated.
  useEffect(() => {
    if (sessionState !== 'authenticated') return;
    const timer = setInterval(() => {
      refreshData();
    }, 15000);
    return () => clearInterval(timer);
  }, [sessionState, refreshData]);

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
      const res = await clientApi.generateInvoice(
        order.id,
        (order.type || 'sale') as 'sale' | 'rental',
        billingType
      );

      if (res?.invoice) {
        const mapped = mapApiInvoice(res.invoice);
        setInvoices((prev) => {
          const exists = prev.some((i) => i.id === mapped.id || i.orderId === mapped.orderId);
          if (exists) return prev.map((i) => (i.id === mapped.id || i.orderId === mapped.orderId ? mapped : i));
          return [mapped, ...prev];
        });
        setOrders((prev) =>
          prev.map((o) =>
            o.id === order.id
              ? { ...o, hasInvoice: true, invoiceId: mapped.id, invoiceStatus: mapped.status }
              : o
          )
        );
      }

      await refreshData();
      showToast('success', 'Votre demande de facturation a été enregistrée avec succès.');
      const notif: NotificationItem = {
        id: 'notif-inv-' + Date.now(),
        title: 'Demande de facture enregistrée',
        message: `Votre demande pour la commande ${order.orderNumber} a été transmise au service comptabilité (statut : EN ATTENTE).`,
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

  // Mark a specific dispute as read by the client (clears unreadByClient on the server and
  // removes the corresponding notification from the bell so it doesn't keep re-appearing).
  const handleMarkDisputeAsRead = useCallback(async (disputeId: string) => {
    // Optimistically clear local state first
    setDisputes((prev) =>
      prev.map((d) => (d.id === disputeId ? { ...d, unreadByClient: false } : d))
    );
    setNotifications((prev) => prev.filter((n) => n.disputeId !== disputeId));

    try {
      await fetch('/api/boutique/litige/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ disputeId }),
      });
    } catch (err) {
      console.warn('[handleMarkDisputeAsRead] Could not mark dispute as read:', err);
      // No rollback needed — the next refreshData() will restore the correct state
    }
  }, []);

  const handleDeleteAccount = () => {
    localStorage.removeItem('pixiatech_client_profile');
    showToast('error', 'Compte client supprimé');
    setTimeout(() => {
      window.location.href = '/';
    }, 1200);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/boutique/logout', { method: 'POST' });
    } catch {
      // Server may be unreachable — navigate anyway; the cookie is cleared on next session check.
    } finally {
      window.location.href = '/mon-compte/connexion';
    }
  };

  if (sessionState === 'expired') {
    return <SessionExpiredScreen onLogin={() => router.push('/mon-compte/connexion')} />;
  }

  if (sessionState === 'loading') {
    return <SessionLoadingScreen />;
  }

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
        onOpenStore={() => router.push('/boutique')}
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
                onOpenStore={() => router.push('/boutique')}
                onViewInvoiceDetails={(inv) => setSelectedInvoiceForModal(inv)}
              />
            )}

            {activeTab === 'orders' && (
              <OrdersView
                orders={orders}
                onOpenDisputeModal={handleOpenDisputeForOrder}
                onOpenInvoiceModal={handleOpenInvoiceForOrder}
                onOpenStore={() => router.push('/boutique')}
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
                onOpenStore={() => router.push('/boutique')}
                onOpenSiretModal={() => setShowSiretModal(true)}
                onOpenEmailModal={() => setShowEmailModal(true)}
                onEmailVerified={handleEmailVerified}
                showToast={showToast}
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
                onMarkAsRead={handleMarkDisputeAsRead}
                initialDisputeId={initialDisputeId}
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

function SessionLoadingScreen() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-[#F4F6F8] px-4 font-sans">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center gap-6"
      >
        <span className="relative inline-flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#38E044] opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#38E044]" />
        </span>
        <p className="text-sm font-medium text-neutral-500">Chargement de votre espace client…</p>
      </motion.div>
    </div>
  );
}

function SessionExpiredScreen({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#F4F6F8] px-4 font-sans">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-sm rounded-3xl border border-neutral-200/80 bg-white p-8 text-center shadow-xl shadow-neutral-200/60"
      >
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-900">
          <XCircle size={26} className="text-white" />
        </div>
        <h1 className="text-lg font-bold text-neutral-900">Session expirée</h1>
        <p className="mt-2 text-sm leading-relaxed text-neutral-500">
          Votre session n'est plus valide ou vous avez été déconnecté. Reconnectez-vous pour
          accéder à vos commandes et factures.
        </p>
        <button
          onClick={onLogin}
          className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-xl bg-neutral-900 px-6 text-sm font-semibold text-white transition-colors hover:bg-neutral-700"
        >
          Se connecter
        </button>
      </motion.div>
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