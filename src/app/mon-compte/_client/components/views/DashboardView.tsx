'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Package,
  FileText,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldCheck,
  Building2,
  ChevronRight,
  AlertCircle,
  TrendingUp,
  Zap,
  Star,
  ShoppingBag,
  Truck,
  BarChart3,
  Activity,
  User,
  Mail,
  Phone,
  MapPin,
  Sparkles,
  ArrowUpRight,
  Circle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { UserProfile, Order, Invoice, Dispute, ActiveTab } from '../../types';

interface DashboardViewProps {
  user: UserProfile;
  orders: Order[];
  invoices: Invoice[];
  disputes: Dispute[];
  onNavigate: (tab: ActiveTab) => void;
  onOpenDisputeModal: () => void;
  onOpenStore: () => void;
  onViewInvoiceDetails: (invoice: Invoice) => void;
  onOpenSiretModal?: () => void;
  onOpenEmailModal?: () => void;
}

/* ─── Animated count-up hook ─────────────────────────────────────────────── */
function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(0);
  const start = useRef(0);
  const raf = useRef<ReturnType<typeof requestAnimationFrame> | null>(null);

  useEffect(() => {
    const from = start.current;
    const startTime = performance.now();
    const animate = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(from + (target - from) * eased));
      if (progress < 1) raf.current = requestAnimationFrame(animate);
      else start.current = target;
    };
    raf.current = requestAnimationFrame(animate);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [target, duration]);

  return value;
}

/* ─── Status badge ───────────────────────────────────────────────────────── */
function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { label: string; cls: string }> = {
    delivered:   { label: 'Livré',           cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
    in_transit:  { label: 'En acheminement', cls: 'bg-sky-500/15 text-sky-400 border-sky-500/30' },
    pending:     { label: 'En préparation',  cls: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  };
  const { label, cls } = cfg[status] ?? cfg.pending;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border ${cls}`}>
      <Circle className="w-1.5 h-1.5 fill-current" />
      {label}
    </span>
  );
}

/* ─── KPI Card ───────────────────────────────────────────────────────────── */
interface KpiCardProps {
  label: string;
  value: number;
  suffix?: string;
  sub: string;
  accent: string;
  icon: React.ReactNode;
  delay?: number;
  onClick?: () => void;
  isCurrency?: boolean;
}

function KpiCard({ label, value, suffix = '', sub, accent, icon, delay = 0, onClick, isCurrency = false }: KpiCardProps) {
  const animated = useCountUp(isCurrency ? Math.round(value) : value);
  const displayValue = isCurrency
    ? animated.toLocaleString('fr-FR')
    : animated;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: [0.22, 1, 0.36, 1] }}
      onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0F1214] p-5 shadow-lg transition-all duration-200 select-none ${onClick ? 'cursor-pointer hover:border-white/10 hover:bg-[#141719]' : ''}`}
    >
      {/* Subtle glow on hover */}
      <div className={`pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${accent.replace('text-', 'bg-').replace(/\[.*?\]/, '[#38E044]')}`}
        style={{ background: `radial-gradient(ellipse at top left, ${accent.includes('emerald') ? 'rgba(56,224,68,0.06)' : accent.includes('sky') ? 'rgba(56,189,248,0.06)' : 'rgba(251,191,36,0.06)'} 0%, transparent 70%)` }}
      />

      <div className="relative z-10">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-neutral-500">{label}</span>
          <div className={`flex h-8 w-8 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.04] ${accent}`}>
            {icon}
          </div>
        </div>

        <div className="flex items-end gap-1">
          <span className="font-mono text-3xl font-extrabold leading-none text-white tabular-nums">
            {displayValue}
          </span>
          {suffix && <span className="mb-0.5 font-mono text-lg font-bold text-white/60">{suffix}</span>}
        </div>

        <p className="mt-2 text-[11px] text-neutral-500">{sub}</p>
      </div>
    </motion.div>
  );
}

/* ─── Quick Action Button ────────────────────────────────────────────────── */
function QuickAction({
  icon,
  label,
  sub,
  onClick,
  accent = 'border-white/[0.06]',
  delay = 0,
}: {
  icon: React.ReactNode;
  label: string;
  sub: string;
  onClick: () => void;
  accent?: string;
  delay?: number;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay }}
      className={`group flex w-full items-center gap-3.5 rounded-2xl border ${accent} bg-[#0F1214] p-4 text-left transition-all duration-200 hover:bg-[#141719] hover:border-white/10 cursor-pointer`}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-neutral-300 transition-transform duration-200 group-hover:scale-110">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-sm font-semibold text-white">{label}</div>
        <div className="text-[11px] text-neutral-500 leading-tight mt-0.5">{sub}</div>
      </div>
      <ArrowUpRight className="ml-auto h-4 w-4 shrink-0 text-neutral-600 transition-all duration-200 group-hover:text-neutral-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
    </motion.button>
  );
}

/* ─── Section header ─────────────────────────────────────────────────────── */
function SectionHeader({
  icon,
  title,
  action,
  onAction,
}: {
  icon: React.ReactNode;
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <span className="text-[#38E044]">{icon}</span>
        <h2 className="text-sm font-bold text-white">{title}</h2>
      </div>
      {action && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="flex items-center gap-1 text-[11px] font-semibold text-neutral-500 transition-colors hover:text-[#38E044] cursor-pointer"
        >
          {action}
          <ArrowRight className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

/* ─── Main Dashboard ─────────────────────────────────────────────────────── */
export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  orders,
  invoices,
  disputes,
  onNavigate,
  onOpenDisputeModal,
  onOpenStore,
  onViewInvoiceDetails,
  onOpenSiretModal,
  onOpenEmailModal,
}) => {
  const pendingOrders   = orders.filter((o) => o.status !== 'delivered');
  const deliveredOrders = orders.filter((o) => o.status === 'delivered');
  const totalSpentTTC   = orders.reduce((a, c) => a + c.totalTTC, 0);
  const openDisputes    = disputes.filter((d) => d.status !== 'Résolu').length;
  const resolvedDisp    = disputes.filter((d) => d.status === 'Résolu').length;
  const recentOrders    = orders.slice(0, 4);
  const recentInvoices  = invoices.slice(0, 3);
  const greet = (() => {
    const h = new Date().getHours();
    if (h < 6)  return 'Bonne nuit';
    if (h < 12) return 'Bonjour';
    if (h < 18) return 'Bon après-midi';
    return 'Bonsoir';
  })();

  const firstName = user.name ? user.name.split(' ')[0] : 'Client';

  return (
    <div id="pixiatech-dashboard-view" className="space-y-6 pb-8">

      {/* ── Hero Welcome Banner ───────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-3xl border border-white/[0.07] bg-[#0A0D0E] px-6 py-5 shadow-2xl sm:px-8 sm:py-6"
      >
        {/* Background grid pattern */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />
        {/* Green radial glow top-right */}
        <div className="pointer-events-none absolute -top-12 -right-12 h-48 w-48 rounded-full bg-[#38E044]/10 blur-3xl" />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="h-12 w-12 rounded-2xl object-cover ring-2 ring-[#38E044]/30 shrink-0"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#38E044]/10 ring-2 ring-[#38E044]/30">
                <span className="font-mono text-xl font-extrabold text-[#38E044]">
                  {(user.name || 'C').charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold tracking-tight text-white sm:text-2xl">
                  {greet}, <span className="text-[#38E044]">{firstName}</span>
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full border border-[#38E044]/30 bg-[#38E044]/10 px-2 py-0.5 text-[10px] font-bold text-[#38E044]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#38E044] shadow-[0_0_6px_#38E044]" />
                  En ligne
                </span>
              </div>
              <p className="mt-0.5 text-xs text-neutral-500">
                Portail client sécurisé — Suivez vos commandes, factures et livraisons en temps réel.
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {!user.emailVerified && onOpenEmailModal && (
              <button
                type="button"
                onClick={onOpenEmailModal}
                className="flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2 text-xs font-semibold text-amber-400 transition-all hover:bg-amber-500/15 cursor-pointer"
              >
                <Mail className="h-3.5 w-3.5" />
                Vérifier e-mail
              </button>
            )}
            {!user.siretVerified && onOpenSiretModal && (
              <button
                type="button"
                onClick={onOpenSiretModal}
                className="flex items-center gap-1.5 rounded-xl border border-sky-500/30 bg-sky-500/10 px-3.5 py-2 text-xs font-semibold text-sky-400 transition-all hover:bg-sky-500/15 cursor-pointer"
              >
                <Building2 className="h-3.5 w-3.5" />
                Certifier entreprise
              </button>
            )}
            <button
              type="button"
              onClick={onOpenStore}
              className="flex items-center gap-2 rounded-xl bg-[#38E044] px-4 py-2 text-xs font-extrabold text-black shadow-lg shadow-[#38E044]/20 transition-all hover:bg-[#2fcf3a] hover:shadow-[#38E044]/30 cursor-pointer"
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              Boutique
              <ExternalLink className="h-3 w-3 opacity-70" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* ── KPI Metrics ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          label="Commandes"
          value={orders.length}
          sub={`${deliveredOrders.length} livrée(s) · ${pendingOrders.length} en transit`}
          accent="text-[#38E044]"
          icon={<Package className="h-4 w-4" />}
          delay={0.05}
          onClick={() => onNavigate('orders')}
        />
        <KpiCard
          label="Factures"
          value={invoices.length}
          sub="Conformes TVA 20% · Art. 289 CGI"
          accent="text-sky-400"
          icon={<FileText className="h-4 w-4" />}
          delay={0.1}
          onClick={() => onNavigate('invoices')}
        />
        <KpiCard
          label="Total dépensé"
          value={totalSpentTTC}
          suffix=" €"
          isCurrency
          sub="Toutes commandes TTC"
          accent="text-violet-400"
          icon={<BarChart3 className="h-4 w-4" />}
          delay={0.15}
        />
        <KpiCard
          label="Litiges"
          value={disputes.length}
          sub={`${resolvedDisp} résolu(s) · ${openDisputes} ouvert(s)`}
          accent="text-amber-400"
          icon={<AlertTriangle className="h-4 w-4" />}
          delay={0.2}
          onClick={() => onNavigate('disputes')}
        />
      </div>

      {/* ── Main Content Grid ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* Left 2/3 column */}
        <div className="space-y-6 lg:col-span-2">

          {/* Recent Orders */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.25 }}
            className="rounded-3xl border border-white/[0.06] bg-[#0F1214] p-6 shadow-lg"
          >
            <SectionHeader
              icon={<Package className="h-4 w-4" />}
              title="Commandes Récentes"
              action={orders.length > 0 ? 'Tout voir' : undefined}
              onAction={() => onNavigate('orders')}
            />

            {recentOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.04] text-neutral-600">
                  <Package className="h-8 w-8" />
                </div>
                <p className="text-sm font-semibold text-neutral-400">Aucune commande pour le moment</p>
                <p className="mt-1 max-w-xs text-xs text-neutral-600">
                  Explorez notre boutique et passez votre première commande.
                </p>
                <button
                  type="button"
                  onClick={onOpenStore}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#38E044] px-5 py-2.5 text-xs font-extrabold text-black shadow-lg shadow-[#38E044]/20 transition hover:bg-[#2fcf3a] cursor-pointer"
                >
                  Découvrir la boutique
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {recentOrders.map((order, idx) => {
                  const item = order.items[0];
                  if (!item) return null;
                  return (
                    <motion.div
                      key={order.id || idx}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.25, delay: 0.28 + idx * 0.06 }}
                      className="group flex items-center gap-4 py-4"
                    >
                      <div className="relative h-12 w-12 shrink-0">
                        <img
                          src={item.productImage}
                          alt={item.productName}
                          className="h-full w-full rounded-xl object-cover ring-1 ring-white/10"
                        />
                        {order.status === 'in_transit' && (
                          <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-sky-400 ring-2 ring-[#0F1214] shadow-[0_0_6px_#38BDF8]" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-neutral-300">{order.orderNumber}</span>
                          <span className="text-[10px] text-neutral-600">· {order.date}</span>
                        </div>
                        <p className="mt-0.5 truncate text-sm font-semibold text-white">{item.productName}</p>
                        {order.items.length > 1 && (
                          <p className="text-[11px] text-neutral-600">+{order.items.length - 1} article(s)</p>
                        )}
                      </div>

                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        <span className="font-mono text-sm font-extrabold text-white">
                          {order.totalTTC.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                        </span>
                        <StatusBadge status={order.status} />
                      </div>

                      <button
                        type="button"
                        onClick={() => onNavigate('orders')}
                        className="ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] text-neutral-600 transition hover:bg-white/[0.08] hover:text-neutral-300 cursor-pointer"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>

          {/* Recent Invoices */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.3 }}
            className="rounded-3xl border border-white/[0.06] bg-[#0F1214] p-6 shadow-lg"
          >
            <SectionHeader
              icon={<FileText className="h-4 w-4" />}
              title="Factures Certifiées"
              action={invoices.length > 0 ? 'Espace factures' : undefined}
              onAction={() => onNavigate('invoices')}
            />

            {recentInvoices.length === 0 ? (
              <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] p-5 text-center text-xs text-neutral-600">
                {orders.length > 0
                  ? 'Générez une facture depuis l\'onglet "Mes factures" pour vos commandes validées.'
                  : 'Passez votre première commande pour pouvoir demander une facture.'}
                {orders.length > 0 && (
                  <button
                    type="button"
                    onClick={() => onNavigate('invoices')}
                    className="mt-3 flex items-center gap-1.5 mx-auto rounded-xl border border-white/[0.06] px-4 py-2 text-xs font-semibold text-neutral-300 transition hover:bg-white/[0.06] cursor-pointer"
                  >
                    Demander une facture <ChevronRight className="h-3.5 w-3.5 text-[#38E044]" />
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {recentInvoices.map((inv, idx) => {
                  const statusCls: Record<string, string> = {
                    'PAYÉE':      'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
                    'EN ATTENTE': 'bg-amber-500/10 text-amber-400 border-amber-500/25',
                    'ANNULÉE':    'bg-red-500/10 text-red-400 border-red-500/25',
                  };
                  const cls = statusCls[inv.status] ?? statusCls['EN ATTENTE'];
                  return (
                    <motion.div
                      key={inv.id || idx}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: 0.32 + idx * 0.05 }}
                      onClick={() => onViewInvoiceDetails(inv)}
                      className="group cursor-pointer rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 transition-all hover:bg-white/[0.04] hover:border-white/10"
                    >
                      <div className="mb-3 flex items-start justify-between gap-2">
                        <span className="font-mono text-[11px] font-bold text-[#38E044] bg-[#38E044]/10 px-2 py-0.5 rounded-md">
                          {inv.invoiceNumber}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cls}`}>
                          {inv.status}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-white line-clamp-1">{inv.productName}</p>
                      <p className="mt-0.5 text-[11px] text-neutral-600">Émise le {inv.issueDate}</p>
                      <p className="mt-2 font-mono text-sm font-extrabold text-white">{inv.totalTTC.toFixed(2)} €</p>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>

        {/* Right 1/3 column */}
        <div className="space-y-5">

          {/* Profile / Identity card */}
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: 0.22 }}
            className="rounded-3xl border border-white/[0.06] bg-[#0F1214] p-5 shadow-lg"
          >
            <div className="mb-4 flex items-center gap-2.5">
              <span className="text-[#38E044]"><User className="h-4 w-4" /></span>
              <h3 className="text-sm font-bold text-white">Identité & Conformité</h3>
            </div>

            <div className="space-y-2.5 text-xs">
              {/* User info */}
              <div className="rounded-2xl border border-white/[0.05] bg-white/[0.03] p-3.5 space-y-2">
                <p className="font-bold text-white text-sm">{user.name || '—'}</p>
                <div className="flex items-center gap-2 text-neutral-500">
                  <Mail className="h-3 w-3 shrink-0" />
                  <span className="truncate">{user.email || '—'}</span>
                  {user.emailVerified && (
                    <CheckCircle2 className="ml-auto h-3.5 w-3.5 shrink-0 text-[#38E044]" />
                  )}
                </div>
                {user.phone && (
                  <div className="flex items-center gap-2 text-neutral-500">
                    <Phone className="h-3 w-3 shrink-0" />
                    <span>{user.phone}</span>
                  </div>
                )}
              </div>

              {/* Company / Siret */}
              {user.siretVerified && user.companyName ? (
                <div className="rounded-2xl border border-[#38E044]/20 bg-[#38E044]/5 p-3.5 space-y-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-[#38E044] shrink-0" />
                    <span className="font-bold text-white truncate">{user.companyName}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-mono text-neutral-400">SIRET : {user.siret}</span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-[#38E044]/30 bg-[#38E044]/10 px-2 py-0.5 text-[10px] font-bold text-[#38E044]">
                      <ShieldCheck className="h-3 w-3" />
                      Certifié INSEE
                    </span>
                  </div>
                  {user.vatNumber && (
                    <p className="font-mono text-[11px] text-neutral-600">TVA : {user.vatNumber}</p>
                  )}
                </div>
              ) : (
                <div className="rounded-2xl border border-white/[0.05] bg-white/[0.03] p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">Facturation :</span>
                    <span className="font-semibold text-neutral-300">Particulier</span>
                  </div>
                  {onOpenSiretModal && (
                    <button
                      type="button"
                      onClick={onOpenSiretModal}
                      className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/[0.06] px-3 py-2 text-[11px] font-semibold text-neutral-400 transition hover:border-sky-500/30 hover:bg-sky-500/10 hover:text-sky-400 cursor-pointer"
                    >
                      <Building2 className="h-3 w-3" />
                      Certifier mon entreprise
                    </button>
                  )}
                </div>
              )}

              {/* Email verification nudge */}
              {!user.emailVerified && onOpenEmailModal && (
                <button
                  type="button"
                  onClick={onOpenEmailModal}
                  className="w-full flex items-center gap-2 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-3.5 text-left transition hover:bg-amber-500/10 cursor-pointer"
                >
                  <AlertCircle className="h-4 w-4 shrink-0 text-amber-400" />
                  <div>
                    <p className="text-xs font-semibold text-amber-400">E-mail non vérifié</p>
                    <p className="text-[11px] text-amber-500/70 leading-tight">Cliquez pour vérifier votre adresse</p>
                  </div>
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => onNavigate('settings')}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.05] bg-white/[0.03] px-4 py-2.5 text-xs font-semibold text-neutral-400 transition hover:bg-white/[0.06] hover:text-neutral-200 cursor-pointer"
            >
              Gérer les paramètres
              <ChevronRight className="h-3.5 w-3.5 text-[#38E044]" />
            </button>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: 0.28 }}
            className="rounded-3xl border border-white/[0.06] bg-[#0F1214] p-5 shadow-lg"
          >
            <div className="mb-4 flex items-center gap-2.5">
              <span className="text-[#38E044]"><Zap className="h-4 w-4" /></span>
              <h3 className="text-sm font-bold text-white">Actions Rapides</h3>
            </div>

            <div className="space-y-2">
              <QuickAction
                icon={<ShoppingBag className="h-5 w-5 text-[#38E044]" />}
                label="Boutique PIXIATECH"
                sub="Matériel informatique haute performance"
                onClick={onOpenStore}
                delay={0.3}
              />
              <QuickAction
                icon={<FileText className="h-5 w-5 text-sky-400" />}
                label="Mes factures"
                sub={invoices.length > 0 ? `${invoices.length} facture(s) disponible(s)` : 'Demander une facture'}
                onClick={() => onNavigate('invoices')}
                delay={0.33}
              />
              <QuickAction
                icon={<AlertTriangle className="h-5 w-5 text-amber-400" />}
                label="Ouvrir un litige"
                sub="Support réactif sous 24h ouvrées"
                onClick={onOpenDisputeModal}
                delay={0.36}
              />
            </div>
          </motion.div>

          {/* Dispute / Support CTA */}
          {disputes.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
              className="rounded-3xl border border-amber-500/20 bg-amber-500/5 p-5"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/20">
                  <AlertCircle className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-amber-300">
                    {openDisputes > 0 ? `${openDisputes} litige(s) en cours` : 'Tous vos litiges sont résolus'}
                  </p>
                  <p className="mt-0.5 text-[11px] text-amber-500/80">
                    {openDisputes > 0
                      ? 'Notre équipe traite vos réclamations.'
                      : 'Aucun incident signalé actuellement.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => onNavigate('disputes')}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-1.5 text-[11px] font-semibold text-amber-400 transition hover:bg-amber-500/20 cursor-pointer"
                  >
                    Suivi réclamations
                    <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Trust / Security badge */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.44 }}
            className="rounded-2xl border border-white/[0.04] bg-white/[0.02] p-4"
          >
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] text-neutral-600">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-3 w-3 text-[#38E044]" />
                TLS 1.3
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3 w-3 text-sky-500" />
                Art. 289 CGI
              </span>
              <span className="flex items-center gap-1.5">
                <Building2 className="h-3 w-3 text-violet-400" />
                INSEE / SIRENE
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
