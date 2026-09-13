'use client';

import { ArrowRight, FileText, HelpCircle, MessageSquareWarning, MousePointerClick, ShoppingBag } from 'lucide-react';
import type { ClientOrder, ClientProfile } from '../../types';
import { formatDate, formatMoney, formatShortDate } from '../../lib/format';

interface DashboardViewProps {
  profile: ClientProfile | null;
  orders: ClientOrder[];
  disputes: { total: number; open: number };
  onNavigate: (view: 'orders' | 'invoices' | 'disputes') => void;
  onOpenBoutique: () => void;
  onOpenDispute: () => void;
  onOpenInvoice: (invoiceId: string) => void;
}

function StatusPill({ label, tone }: { label: string; tone: 'neutral' | 'green' | 'amber' | 'red' }) {
  const tones: Record<string, string> = {
    neutral: 'bg-neutral-100 text-neutral-700',
    green: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-amber-100 text-amber-700',
    red: 'bg-red-100 text-red-600',
  };
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${tones[tone]}`}>{label}</span>
  );
}

function statusTone(key: string) {
  if (key === 'delivered') return 'green';
  if (key === 'in_transit') return 'amber';
  if (key === 'cancelled') return 'red';
  return 'neutral';
}

export function DashboardView({ profile, orders, disputes, onNavigate, onOpenBoutique, onOpenDispute, onOpenInvoice }: DashboardViewProps) {
  const firstName = profile?.name?.split(' ')[0] || 'Client';
  const totalTTC = orders.reduce((sum, o) => sum + o.totalTTC, 0);
  const recentOrders = [...orders].slice(0, 3);

  const metrics = [
    { label: 'Commandes', value: String(orders.length), icon: <ShoppingBag size={18} /> },
    { label: 'Total dÃ©pensÃ© TTC', value: formatMoney(totalTTC), icon: <MousePointerClick size={18} /> },
    { label: 'Litiges actifs', value: String(disputes.open), icon: <MessageSquareWarning size={18} /> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-neutral-900">
          Bon retour parmi nous, {firstName}
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Bienvenue dans votre espace client. Retrouvez vos commandes, factures et litiges.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-600">
                {m.icon}
              </span>
              <div>
                <p className="text-xs font-medium text-neutral-400">{m.label}</p>
                <p className="text-lg font-extrabold text-neutral-900">{m.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-xs">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-neutral-900">Mes derniÃ¨res commandes</h2>
              <button
                type="button"
                onClick={() => onNavigate('orders')}
                className="flex items-center gap-1 text-sm font-semibold text-neutral-900 hover:underline"
              >
                Tout voir <ArrowRight size={15} />
              </button>
            </div>

            {recentOrders.length === 0 ? (
              <EmptyState
                title="Aucune commande pour le moment"
                subtitle="DÃ©couvrez nos produits en boutique pour passer votre premiÃ¨re commande."
                actionLabel="Aller Ã  la boutique"
                onAction={onOpenBoutique}
              />
            ) : (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center gap-4 rounded-2xl border border-neutral-100 bg-neutral-50/60 p-4">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#0A0D0E] text-xs font-bold uppercase text-white">
                      {order.kindLabel === 'Achat' ? 'Ach' : 'Loc'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-neutral-900">{order.items[0]?.title || order.number}</p>
                      <p className="text-xs text-neutral-500">
                        {order.number} Â· {formatShortDate(order.date)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-neutral-900">{formatMoney(order.totalTTC)}</p>
                      <StatusPill label={order.statusLabel} tone={statusTone(order.statusKey)} />
                    </div>
                    {order.hasInvoice && order.invoiceId ? (
                      <button
                        type="button"
                        onClick={() => onOpenInvoice(order.invoiceId!)}
                        className="rounded-xl bg-[#0A0D0E] px-3 py-2 text-xs font-semibold text-white transition hover:opacity-90"
                      >
                        Facture
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onNavigate('invoices')}
                        className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-50"
                      >
                        <FileText size={13} className="inline -translate-y-px" /> Demander
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-xs">
            <h2 className="mb-4 text-base font-bold text-neutral-900">Mes donnÃ©es</h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-neutral-400">E-mail</dt>
                <dd className="truncate font-medium text-neutral-900">{profile?.email || 'â€”'}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-neutral-400">TÃ©lÃ©phone</dt>
                <dd className="font-medium text-neutral-900">{profile?.phone || 'â€”'}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-neutral-400">Membre depuis</dt>
                <dd className="font-medium text-neutral-900">{profile?.lastLoginAt ? formatDate(profile.lastLoginAt) : 'â€”'}</dd>
              </div>
              {profile?.siret && (
                <div className="flex justify-between gap-3">
                  <dt className="text-neutral-400">SIRET</dt>
                  <dd className="font-medium text-neutral-900">{profile.siret}</dd>
                </div>
              )}
            </dl>
          </div>

          <div className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-xs">
            <h2 className="mb-4 text-base font-bold text-neutral-900">Bon Ã  savoir</h2>
            <div className="grid gap-3">
              <button
                type="button"
                onClick={onOpenBoutique}
                className="flex items-center gap-3 rounded-xl border border-neutral-100 bg-neutral-50/60 p-3 text-left transition hover:bg-neutral-100"
              >
                <ShoppingBag size={18} className="text-neutral-500" />
                <span className="flex-1 text-sm font-medium text-neutral-700">DÃ©couvrir la boutique</span>
              </button>
              <a
                href="/estimation"
                className="flex items-center gap-3 rounded-xl border border-neutral-100 bg-neutral-50/60 p-3 text-left transition hover:bg-neutral-100"
              >
                <HelpCircle size={18} className="text-neutral-500" />
                <span className="flex-1 text-sm font-medium text-neutral-700">Demander un devis</span>
              </a>
              <button
                type="button"
                onClick={onOpenDispute}
                className="flex items-center gap-3 rounded-xl border border-neutral-100 bg-neutral-50/60 p-3 text-left transition hover:bg-neutral-100"
              >
                <MessageSquareWarning size={18} className="text-neutral-500" />
                <span className="flex-1 text-sm font-medium text-neutral-700">Ouvrir un litige</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ title, subtitle, actionLabel, onAction }: { title: string; subtitle: string; actionLabel: string; onAction: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-200 py-12 text-center">
      <p className="text-sm font-bold text-neutral-700">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-neutral-500">{subtitle}</p>
      <button
        type="button"
        onClick={onAction}
        className="mt-4 rounded-xl bg-[#0A0D0E] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
      >
        {actionLabel}
      </button>
    </div>
  );
}