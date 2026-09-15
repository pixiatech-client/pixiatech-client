'use client';

import React from 'react';
import {
  Package,
  FileText,
  Truck,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldCheck,
  Building2,
  ChevronRight,
  Info,
  KeyRound,
  AlertCircle
} from 'lucide-react';
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
  onOpenEmailModal
}) => {
  const pendingOrders = orders.filter((o) => o.status !== 'delivered');
  const deliveredOrders = orders.filter((o) => o.status === 'delivered');
  const totalSpentTTC = orders.reduce((acc, curr) => acc + curr.totalTTC, 0);

  return (
    <div id="pixiatech-dashboard-view" className="space-y-6">
      {/* 1. Header Card (Matching Visual Reference from Connect Screenshot) */}
      <div className="bg-white rounded-3xl border border-neutral-200/80 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#0A0D0E] text-white flex items-center justify-center shrink-0 shadow-md">
            <Package className="w-6 h-6 text-[#38E044]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
                Tableau de bord Client
              </h1>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-[#38E044]" />
                En ligne
              </span>
            </div>
            <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
              Bienvenue, <strong className="text-neutral-800">{user.name}</strong>. Suivez vos commandes, vos factures et vos livraisons en temps réel.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenStore}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0A0D0E] text-white text-xs font-bold hover:bg-neutral-800 transition-all shadow-sm cursor-pointer"
        >
          <span>Accéder à la boutique</span>
          <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
        </button>
      </div>

      {/* 2. Key Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-neutral-200/80 p-5 shadow-xs hover:border-neutral-300 transition-all">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Commandes Totales</span>
            <div className="p-2 rounded-xl bg-neutral-100 text-neutral-700">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-neutral-900 font-mono">
            {orders.length}
          </div>
          <div className="mt-2 text-xs text-neutral-500 flex items-center justify-between">
            <span>{deliveredOrders.length} livrée(s)</span>
            <span className="text-emerald-600 font-medium">
              {pendingOrders.length > 0 ? `${pendingOrders.length} en transit` : 'Toutes remises'}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-200/80 p-5 shadow-xs hover:border-neutral-300 transition-all">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Factures Disponibles</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-neutral-900 font-mono">
            {invoices.length}
          </div>
          <div className="mt-2 text-xs text-neutral-500 flex items-center justify-between">
            <span>Conformes TVA 20%</span>
            <button
              onClick={() => onNavigate('invoices')}
              className="text-[#15803d] hover:underline font-semibold flex items-center gap-0.5"
            >
              Consulter <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-200/80 p-5 shadow-xs hover:border-neutral-300 transition-all">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Commandes TTC</span>
            <div className="p-2 rounded-xl bg-neutral-100 text-neutral-700">
              <span className="font-bold text-xs">€</span>
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-neutral-900 font-mono">
            {totalSpentTTC.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
          </div>
          <div className="mt-2 text-xs text-neutral-500">
            Dépenses globales validées
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-200/80 p-5 shadow-xs hover:border-neutral-300 transition-all">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Litiges & Réclamations</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-neutral-900 font-mono">
            {disputes.length}
          </div>
          <div className="mt-2 text-xs text-neutral-500 flex items-center justify-between">
            <span>
              {disputes.filter((d) => d.status === 'Résolu').length} résolu(s)
            </span>
            <button
              onClick={onOpenDisputeModal}
              className="text-amber-700 hover:underline font-semibold flex items-center gap-0.5"
            >
              Déclarer <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column: Commandes Récentes & Actions (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Orders Card */}
          <div className="bg-white rounded-3xl border border-neutral-200/80 p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <div className="flex items-center gap-2.5">
                <Package className="w-5 h-5 text-neutral-900" />
                <h2 className="text-base font-bold text-neutral-900">
                  Mes Dernières Commandes
                </h2>
              </div>
              {orders.length > 0 && (
                <button
                  onClick={() => onNavigate('orders')}
                  className="text-xs font-semibold text-neutral-600 hover:text-black flex items-center gap-1 cursor-pointer"
                >
                  <span>Voir toutes les commandes</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {orders.length === 0 ? (
              /* Empty state as requested by Screenshot 1 */
              <div className="py-12 text-center">
                <div className="w-14 h-14 mx-auto rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400 mb-3">
                  <Package className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-neutral-900">
                  Aucune commande pour le moment
                </h3>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1 mb-5">
                  Vous n'avez pas encore passé de commande sur notre boutique. Explorez nos produits haute performance dès maintenant.
                </p>
                <button
                  type="button"
                  onClick={onOpenStore}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0A0D0E] text-white font-bold text-xs hover:bg-neutral-800 transition-all shadow-md cursor-pointer"
                >
                  <span>Découvrir la boutique</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#38E044]" />
                </button>
              </div>
            ) : (
              <div className="divide-y divide-neutral-100">
                {orders.slice(0, 3).map((order) => {
                  const firstItem = order.items[0];
                  if (!firstItem) return null;
                  return (
                    <div
                      key={order.id}
                      className="py-4.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <img
                          src={firstItem.productImage}
                          alt={firstItem.productName}
                          className="w-14 h-14 rounded-2xl object-cover border border-neutral-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-neutral-900">
                              {order.orderNumber}
                            </span>
                            <span className="text-[11px] text-neutral-400">
                              • {order.date}
                            </span>
                          </div>
                          <h4 className="text-sm font-semibold text-neutral-800 truncate mt-0.5">
                            {firstItem.productName}
                          </h4>
                          <div className="text-xs text-neutral-500 mt-0.5">
                            {order.items.length > 1
                              ? `+ ${order.items.length - 1} autre(s) article(s)`
                              : `Qté : ${firstItem.quantity}`}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 shrink-0">
                        <div className="text-right">
                          <div className="text-sm font-extrabold text-neutral-900 font-mono">
                            {order.totalTTC.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                          </div>
                          <span
                            className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 ${
                              order.status === 'delivered'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : order.status === 'in_transit'
                                ? 'bg-sky-50 text-sky-700 border border-sky-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {order.status === 'delivered'
                              ? '✓ Livré'
                              : order.status === 'in_transit'
                              ? '🚚 En cours d\'acheminement'
                              : '⏳ En préparation'}
                          </span>
                        </div>

                        <button
                          onClick={() => onNavigate('orders')}
                          className="p-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-colors cursor-pointer"
                          title="Détails"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Invoices Quick Access */}
          <div className="bg-white rounded-3xl border border-neutral-200/80 p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-neutral-900" />
                <h2 className="text-base font-bold text-neutral-900">
                  Mes Factures Certifiées
                </h2>
              </div>
              <button
                onClick={() => onNavigate('invoices')}
                className="text-xs font-semibold text-neutral-600 hover:text-black flex items-center gap-1 cursor-pointer"
              >
                <span>Accéder à l'espace factures</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {invoices.length === 0 ? (
              <div className="py-6 text-center text-xs text-neutral-500">
                <p>Aucune facture émise pour le moment.</p>
                <p className="mt-1 text-neutral-400">
                  {orders.length > 0
                    ? 'Vous pouvez générer une facture pour vos commandes validées depuis l\'onglet "Mes factures".'
                    : 'Vous devez avoir passé une commande avant de pouvoir demander une facture.'}
                </p>
                {orders.length > 0 && (
                  <button
                    onClick={() => onNavigate('invoices')}
                    className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0A0D0E] text-white font-semibold text-xs hover:bg-neutral-800 transition-colors cursor-pointer"
                  >
                    <span>Demander une facture</span>
                    <ChevronRight className="w-3.5 h-3.5 text-[#38E044]" />
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                {invoices.slice(0, 2).map((invoice) => (
                  <div
                    key={invoice.id}
                    onClick={() => onViewInvoiceDetails(invoice)}
                    className="p-4 rounded-2xl border border-neutral-200 hover:border-neutral-300 hover:shadow-md transition-all cursor-pointer bg-neutral-50/50"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          {invoice.invoiceNumber}
                        </span>
                        <h4 className="text-xs font-bold text-neutral-800 mt-2 line-clamp-1">
                          {invoice.productName}
                        </h4>
                        <div className="text-[11px] text-neutral-500 mt-0.5">
                          Émise le {invoice.issueDate}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-extrabold text-neutral-900 font-mono">
                          {invoice.totalTTC.toFixed(2)} €
                        </span>
                        <span className="block text-[10px] text-neutral-400">TTC</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Profil & Quick Tools (1 col) */}
        <div className="space-y-6">
          {/* Account Status Card */}
          <div className="bg-white rounded-3xl border border-neutral-200/80 p-6 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-4">
              Identité & Conformité Client
            </h3>

            <div className="space-y-3.5 text-xs">
              <div className="p-3 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-1">
                <div className="font-bold text-neutral-900">{user.name}</div>
                <div className="text-neutral-500">{user.email || '—'}</div>
                <div className="text-neutral-500">{user.phone || '—'}</div>
              </div>

              {user.siretVerified && user.companyName ? (
                <div className="space-y-2">
                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-emerald-50/50 border border-emerald-200/80">
                    <Building2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-neutral-900">{user.companyName}</div>
                      <div className="text-neutral-600 mt-0.5 font-mono">
                        SIRET : {user.siret}
                      </div>
                      <div className="text-[11px] text-neutral-500 mt-0.5 font-mono">
                        TVA : {user.vatNumber || '—'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs">
                    <span className="text-neutral-600">Vérification Entreprise</span>
                    <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-100/70 px-2.5 py-0.5 rounded-full text-[11px]">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Certifié INSEE
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-neutral-50 border border-neutral-200/80 text-neutral-600">
                  <div className="flex items-center justify-between">
                    <span>Statut de facturation :</span>
                    <span className="font-semibold text-neutral-800">Particulier</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-1">
                    Vous pouvez vérifier une entreprise lors de l'émission d'une facture.
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={() => onNavigate('settings')}
              className="w-full mt-4 py-2.5 px-4 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Gérer les paramètres du compte</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Litige Box */}
          <div className="bg-amber-50/60 rounded-3xl border border-amber-200/80 p-6 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-500 text-white shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-amber-950">
                  Un problème avec une livraison ?
                </h4>
                <p className="text-xs text-amber-800/90 mt-1">
                  Colis endommagé, retard ou erreur ? Notre support dédié traite vos réclamations sous 24h ouvrées.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    id="btn-open-dispute-dashboard"
                    type="button"
                    onClick={onOpenDisputeModal}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-900 hover:bg-amber-950 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Ouvrir un litige</span>
                  </button>
                  {disputes.length > 0 && (
                    <button
                      type="button"
                      onClick={() => onNavigate('disputes')}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/80 hover:bg-white text-amber-900 text-xs font-semibold border border-amber-300 transition-colors cursor-pointer"
                    >
                      <span>Suivi réclamations ({disputes.length})</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
