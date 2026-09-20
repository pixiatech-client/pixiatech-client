'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  XCircle,
  Download,
  ExternalLink,
  ShieldCheck,
  Building2,
  User,
  ShoppingBag,
  ArrowRight,
  ChevronRight,
  Clock,
  Printer,
  FileCheck2,
  Lock,
  Tag,
  Sparkles,
  Eye,
  ImageIcon,
  Mail,
  KeyRound,
  ChevronDown,
  ChevronUp,
  Send,
  Check
} from 'lucide-react';
import type { UserProfile, Order, Invoice, OrderItem, BillingType, InvoiceStatus } from '../../types';
import { SlidingSwitch } from '../SlidingSwitch';
import { clientApi } from '../../lib/api';
import { useProductCatalog } from '../../lib/useProductStatus';

interface InvoicesViewProps {
  user: UserProfile;
  orders: Order[];
  invoices: Invoice[];
  onCreateInvoice: (order: Order, item: OrderItem, billingType: BillingType) => void;
  onOpenStore?: () => void;
  onOpenSiretModal: () => void;
  onOpenEmailModal?: () => void;
  onEmailVerified?: () => void;
  onViewProductInStore?: (item: OrderItem) => void;
  onViewInvoiceDetails: (invoice: Invoice) => void;
  initialSelectedOrder?: Order | null;
  onOpenInvoice?: (invoiceId: string) => void;
  onDone?: () => void;
  onRequireProfessionalInfo?: () => void;
  showToast?: (type: 'success' | 'error', message: string) => void;
}

export const InvoicesView: React.FC<InvoicesViewProps> = ({
  user,
  orders,
  invoices,
  onCreateInvoice,
  onOpenStore,
  onOpenSiretModal,
  onOpenEmailModal,
  onEmailVerified,
  showToast,
  onViewProductInStore,
  onViewInvoiceDetails,
  initialSelectedOrder = null
}) => {
  const [activeTab, setActiveTab] = useState<'history' | 'request'>('history');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'pending'>('all');
  const { getProductStatus } = useProductCatalog();

  // Multi-step request state
  const [selectedOrderId, setSelectedOrderId] = useState<string>(initialSelectedOrder?.id || '');
  const [step, setStep] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [lastRequestedOrderId, setLastRequestedOrderId] = useState<string>('');

  // Email verification accordion state for Particulier
  const [showEmailAccordion, setShowEmailAccordion] = useState<boolean>(false);
  const [emailCodeDigits, setEmailCodeDigits] = useState<string[]>(['', '', '', '']);
  const [isSendingCode, setIsSendingCode] = useState<boolean>(false);
  const [codeSent, setCodeSent] = useState<boolean>(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState<boolean>(false);
  const [codeError, setCodeError] = useState<string>('');
  const [codeSuccess, setCodeSuccess] = useState<boolean>(false);

  const handleSendEmailCode = async () => {
    setIsSendingCode(true);
    setCodeError('');
    try {
      await clientApi.requestEmailCode();
      setCodeSent(true);
      showToast?.('success', `Un code à 4 chiffres a été envoyé à ${user.email}`);
    } catch (err: any) {
      setCodeError(err?.message || "Impossible d'envoyer le code. Réessayez dans un instant.");
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleDigitChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const updated = [...emailCodeDigits];
    updated[index] = digit;
    setEmailCodeDigits(updated);
    setCodeError('');
    if (digit && index < 3) {
      const nextInput = document.getElementById(`email-code-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !emailCodeDigits[index] && index > 0) {
      const prevInput = document.getElementById(`email-code-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerifyEmailCode = async () => {
    const code = emailCodeDigits.join('').trim();
    if (code.length !== 4) {
      setCodeError('Veuillez saisir les 4 chiffres du code.');
      return;
    }
    setIsVerifyingCode(true);
    setCodeError('');
    try {
      const res = await clientApi.verifyEmailCode(code);
      if (res?.verified || res?.success) {
        setCodeSuccess(true);
        onEmailVerified?.();
        showToast?.('success', 'Votre adresse e-mail a été validée avec succès !');
        setTimeout(() => {
          setShowEmailAccordion(false);
        }, 1200);
      } else {
        setCodeError('Code incorrect. Veuillez réessayer.');
      }
    } catch (err: any) {
      setCodeError(err?.message || 'Code incorrect ou expiré.');
    } finally {
      setIsVerifyingCode(false);
    }
  };

  // Billing Type: Entreprise vs Particulier (chosen at invoice request time)
  const [billingType, setBillingType] = useState<BillingType>(
    user.siretVerified && user.siret ? 'entreprise' : 'particulier'
  );

  // Filter orders that don't have an invoice yet
  const availableOrdersForInvoice = orders.filter((o) => !o.hasInvoice);
  const selectedOrder = orders.find((o) => o.id === selectedOrderId);

  // Verification requirements: Entreprise requires SIRET; Particulier requires email verified
  const isProfileReady =
    billingType === 'entreprise'
      ? Boolean(user.siretVerified && user.siret)
      : Boolean(user.emailVerified);

  const handleConfirmInvoiceRequest = () => {
    if (!selectedOrder) return;
    setIsProcessing(true);

    setTimeout(() => {
      const targetItem = selectedOrder.items[0];
      setLastRequestedOrderId(selectedOrder.id);
      onCreateInvoice(selectedOrder, targetItem, billingType);
      setIsProcessing(false);
      setStep(4); // Success step
    }, 600);
  };

  const getStatusPill = (status: InvoiceStatus) => {
    switch (status) {
      case 'FACTURE DISPONIBLE':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Facture disponible</span>
          </span>
        );
      case 'EN COURS':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-800 bg-sky-50 border border-sky-200 px-3 py-1 rounded-full">
            <Clock className="w-3.5 h-3.5 text-sky-600 animate-spin" />
            <span>Traitement en cours</span>
          </span>
        );
      case 'EN ATTENTE':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Demande en attente</span>
          </span>
        );
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    if (statusFilter === 'available') {
      return inv.status === 'FACTURE DISPONIBLE';
    }
    if (statusFilter === 'pending') {
      return inv.status === 'EN ATTENTE' || inv.status === 'EN COURS';
    }
    return true;
  });

  const availableCount = invoices.filter((i) => i.status === 'FACTURE DISPONIBLE').length;
  const pendingCount = invoices.filter((i) => i.status === 'EN ATTENTE' || i.status === 'EN COURS').length;

  return (
    <div id="pixiatech-invoices-view" className="space-y-6">
      {/* 1. Header Card */}
      <div className="bg-white rounded-3xl border border-neutral-200/80 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#0A0D0E] text-white flex items-center justify-center shrink-0 shadow-md">
            <FileText className="w-6 h-6 text-[#38E044]" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
              Mes Factures
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
              Émission, validation administrative et téléchargement de vos factures certifiées conformes.
            </p>
          </div>
        </div>

        {/* Reusable Sliding Switch */}
        <SlidingSwitch
          options={[
            { id: 'history', label: 'Toutes mes factures', badge: invoices.length },
            {
              id: 'request',
              label: 'Demander une facture',
              badge: availableOrdersForInvoice.length > 0 ? availableOrdersForInvoice.length : undefined
            }
          ]}
          activeId={activeTab}
          onChange={(tab) => {
            setActiveTab(tab as 'history' | 'request');
            if (tab === 'request' && step === 4) {
              setStep(1);
            }
          }}
          size="md"
        />
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: HISTORIQUE DES FACTURES                                            */}
      {/* ========================================================================= */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {invoices.length > 0 && (
            <div className="flex items-center gap-2 p-1.5 bg-white rounded-2xl border border-neutral-200/80 w-fit text-sm">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`py-2 px-4 rounded-xl font-bold transition-all cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-[#0A0D0E] text-white shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                Toutes ({invoices.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('available')}
                className={`py-2 px-4 rounded-xl font-bold transition-all cursor-pointer ${
                  statusFilter === 'available'
                    ? 'bg-[#0A0D0E] text-white shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                Disponibles ({availableCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('pending')}
                className={`py-2 px-4 rounded-xl font-bold transition-all cursor-pointer ${
                  statusFilter === 'pending'
                    ? 'bg-[#0A0D0E] text-white shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                En attente & En cours ({pendingCount})
              </button>
            </div>
          )}

          {invoices.length === 0 ? (
            <div className="bg-white rounded-3xl border border-neutral-200/80 p-12 text-center shadow-xs">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-neutral-100 flex items-center justify-center text-neutral-400 mb-4">
                <FileText className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-neutral-900">
                Aucune facture enregistrée
              </h3>
              <p className="text-sm text-neutral-500 max-w-md mx-auto mt-1 mb-6">
                {orders.length === 0
                  ? 'Vous devez avoir passé une commande avant de pouvoir demander une facture.'
                  : 'Vous possédez des commandes pour lesquelles vous pouvez demander une facture fiscale certifiée.'}
              </p>

              {orders.length === 0 ? (
                <a
                  href="/boutique"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0A0D0E] text-white font-bold text-sm hover:bg-neutral-800 transition-all shadow-md cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4 text-[#38E044]" />
                  <span>Découvrez notre boutique</span>
                  <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
                </a>
              ) : (
                <button
                  onClick={() => setActiveTab('request')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0A0D0E] text-white font-bold text-sm hover:bg-neutral-800 transition-all shadow-md cursor-pointer"
                >
                  <FileCheck2 className="w-4 h-4 text-[#38E044]" />
                  <span>Demander ma première facture</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredInvoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="bg-white rounded-3xl border border-neutral-200/80 p-6 shadow-xs hover:border-neutral-300 transition-all space-y-4"
                >
                  {/* Top line of Invoice Card */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-neutral-100">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-extrabold text-sm text-neutral-900 bg-neutral-100 px-3 py-1 rounded-xl">
                        {invoice.invoiceNumber}
                      </span>
                      <span className="text-sm text-neutral-400">
                        • Rattachée à la commande{' '}
                        <strong className="text-neutral-700 font-mono">{invoice.orderNumber}</strong>
                      </span>
                      <span className="text-sm text-neutral-400">• Demandée le {invoice.issueDate}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {getStatusPill(invoice.status)}

                      {invoice.status === 'FACTURE DISPONIBLE' ? (
                        <button
                          onClick={() => {
                            if (invoice.id) {
                              window.open(clientApi.invoicePdf(invoice.id), '_blank');
                            } else {
                              onViewInvoiceDetails(invoice);
                            }
                          }}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-sm font-semibold transition-colors cursor-pointer"
                          title="Consulter et télécharger la facture certifiée"
                        >
                          <Download className="w-4 h-4 text-[#38E044]" />
                          <span>Télécharger PDF</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => onViewInvoiceDetails(invoice)}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-sm font-semibold transition-colors cursor-pointer"
                          title="Voir le récapitulatif de la demande"
                        >
                          <Eye className="w-4 h-4" />
                          <span>Voir le récapitulatif</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Product Details inside Invoice */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-neutral-50/70 border border-neutral-100">
                    <div className="flex items-center gap-4 min-w-0">
                      {invoice.productImage ? (
                        <img
                          src={invoice.productImage}
                          alt={invoice.productName}
                          className="w-20 h-20 rounded-2xl object-cover border border-neutral-200 shrink-0"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-2xl bg-neutral-100 border border-neutral-200 shrink-0 flex items-center justify-center">
                          <ImageIcon className="w-6 h-6 text-neutral-400" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <a
                          href="/boutique"
                          className="text-left font-bold text-sm text-neutral-900 hover:text-emerald-700 hover:underline flex items-center gap-1.5 cursor-pointer group"
                        >
                          <span className="truncate">{invoice.productName}</span>
                          <ExternalLink className="w-3.5 h-3.5 text-neutral-400 group-hover:text-emerald-700 shrink-0" />
                        </a>

                        <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-500 mt-1.5">
                          <span>
                            Montant HT : <strong className="font-mono text-neutral-800">{invoice.subtotalHT.toFixed(2)} €</strong>
                          </span>
                          <span>•</span>
                          <span>
                            TVA 20% : <strong className="font-mono text-neutral-800">{invoice.vatAmount.toFixed(2)} €</strong>
                          </span>
                          {invoice.discountCode && (
                            <>
                              <span>•</span>
                              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                                <Tag className="w-3.5 h-3.5" />
                                Promo : {invoice.discountCode} (-{invoice.discountAmount?.toFixed(2)} €)
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-lg font-extrabold text-neutral-900 font-mono">
                        {invoice.totalTTC.toFixed(2)} € TTC
                      </div>
                      <span className="text-xs text-neutral-400">TVA acquittée</span>
                    </div>
                  </div>

                  {/* Workflow Status */}
                  {(invoice.status === 'EN ATTENTE' || invoice.status === 'EN COURS') && (
                    <div
                      className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm ${
                        invoice.status === 'EN COURS'
                          ? 'bg-sky-50/70 border-sky-200'
                          : 'bg-amber-50/70 border-amber-200'
                      }`}
                    >
                      <div
                        className={`flex items-start gap-2 ${
                          invoice.status === 'EN COURS' ? 'text-sky-900' : 'text-amber-900'
                        }`}
                      >
                        <Clock
                          className={`w-4 h-4 mt-0.5 shrink-0 ${
                            invoice.status === 'EN COURS' ? 'text-sky-600' : 'text-amber-600'
                          }`}
                        />
                        <div>
                          <strong className="block font-semibold">
                            {invoice.status === 'EN ATTENTE'
                              ? "Demande soumise à l'administration"
                              : 'Service comptabilité en cours de traitement'}
                          </strong>
                          <span className={invoice.status === 'EN COURS' ? 'text-sky-800' : 'text-amber-800'}>
                            {invoice.status === 'EN ATTENTE'
                              ? 'En attente de prise en charge par le service comptabilité PIXIATECH.'
                              : 'Vérification légale effectuée. En attente de dépôt du PDF certifié.'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Immutable historical snapshot preview */}
                  <div className="text-xs text-neutral-400 flex items-center justify-between pt-1.5 border-t border-neutral-100">
                    <span className="flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5 text-neutral-400" />
                      Client facturé :{' '}
                      <strong className="text-neutral-600">
                        {invoice.clientSnapshot.companyName || invoice.clientSnapshot.clientName}
                      </strong>
                      {invoice.clientSnapshot.siret && (
                        <span> (SIRET : {invoice.clientSnapshot.siret})</span>
                      )}
                    </span>
                    <span>Snapshot fiscal certifié</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: DEMANDER UNE FACTURE — WORKFLOW RÉEL                               */}
      {/* ========================================================================= */}
      {activeTab === 'request' && (
        <div className="space-y-6">
          {orders.length === 0 ? (
            <div className="bg-white rounded-3xl border border-neutral-200/80 p-10 text-center shadow-xs space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
                <AlertCircle className="w-8 h-8" />
              </div>

              <div className="max-w-md mx-auto">
                <h3 className="text-lg font-bold text-neutral-900">
                  Aucune commande disponible
                </h3>
                <p className="text-sm text-neutral-600 mt-2">
                  <strong>Vous devez avoir une commande avant de pouvoir demander une facture.</strong>
                </p>
                <p className="text-xs text-neutral-400 mt-1">
                  Le système de facturation légale PIXIATECH exige le rattachement obligatoire à une commande validée et réglée.
                </p>
              </div>

              <div className="pt-3">
                <a
                  href="/boutique"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#0A0D0E] text-white font-bold text-sm hover:bg-neutral-800 transition-all shadow-md cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4 text-[#38E044]" />
                  <span>Découvrez notre boutique</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Stepper Navigation Indicators */}
              <div className="bg-white rounded-3xl border border-neutral-200/80 p-4 shadow-xs">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-sm">
                  <div
                    className={`flex items-center gap-2 p-2.5 rounded-xl ${
                      step >= 1 ? 'bg-neutral-100 text-neutral-900 font-bold' : 'text-neutral-400'
                    }`}
                  >
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-sm ${
                        step >= 1 ? 'bg-[#0A0D0E] text-white' : 'bg-neutral-200 text-neutral-600'
                      }`}
                    >
                      1
                    </span>
                    <span>Vérification Client</span>
                  </div>

                  <div
                    className={`flex items-center gap-2 p-2.5 rounded-xl ${
                      step >= 2 ? 'bg-neutral-100 text-neutral-900 font-bold' : 'text-neutral-400'
                    }`}
                  >
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-sm ${
                        step >= 2 ? 'bg-[#0A0D0E] text-white' : 'bg-neutral-200 text-neutral-600'
                      }`}
                    >
                      2
                    </span>
                    <span>Choix de la commande</span>
                  </div>

                  <div
                    className={`flex items-center gap-2 p-2.5 rounded-xl ${
                      step >= 3 ? 'bg-neutral-100 text-neutral-900 font-bold' : 'text-neutral-400'
                    }`}
                  >
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-sm ${
                        step >= 3 ? 'bg-[#0A0D0E] text-white' : 'bg-neutral-200 text-neutral-600'
                      }`}
                    >
                      3
                    </span>
                    <span>Récapitulatif</span>
                  </div>

                  <div
                    className={`flex items-center gap-2 p-2.5 rounded-xl ${
                      step >= 4 ? 'bg-amber-50 text-amber-900 font-bold' : 'text-neutral-400'
                    }`}
                  >
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-sm ${
                        step >= 4 ? 'bg-amber-600 text-white' : 'bg-neutral-200 text-neutral-600'
                      }`}
                    >
                      ✓
                    </span>
                    <span>Demande transmise</span>
                  </div>
                </div>
              </div>

              {/* ÉTAPE 1 : Choix et vérification du type de facturation */}
              {step === 1 && (
                <div className="bg-white rounded-3xl border border-neutral-200/80 p-6 shadow-xs space-y-6">
                  <div>
                    <h2 className="text-base font-bold text-neutral-900">
                      1. Type de facturation & Destinataire
                    </h2>
                    <p className="text-sm text-neutral-500 mt-0.5">
                      Choisissez si cette facture doit être adressée à une entreprise ou émise à titre particulier.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Option Particulier */}
                    <div
                      id="opt-billing-particulier"
                      onClick={() => setBillingType('particulier')}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                        billingType === 'particulier'
                          ? 'bg-neutral-50 border-black ring-2 ring-black/10 shadow-sm'
                          : 'bg-white border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                          billingType === 'particulier'
                            ? 'border-black bg-black text-white'
                            : 'border-neutral-300 bg-white'
                        }`}
                      >
                        {billingType === 'particulier' && (
                          <span className="w-2 h-2 rounded-full bg-[#38E044]" />
                        )}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-neutral-700" />
                          <span className="font-bold text-sm text-neutral-900">Particulier</span>
                        </div>
                        <p className="text-sm text-neutral-500">
                          Facturation à titre personnel, sans mention d'entreprise.
                        </p>
                      </div>
                    </div>

                    {/* Option Entreprise */}
                    <div
                      id="opt-billing-entreprise"
                      onClick={() => setBillingType('entreprise')}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                        billingType === 'entreprise'
                          ? 'bg-neutral-50 border-black ring-2 ring-black/10 shadow-sm'
                          : 'bg-white border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                          billingType === 'entreprise'
                            ? 'border-black bg-black text-white'
                            : 'border-neutral-300 bg-white'
                        }`}
                      >
                        {billingType === 'entreprise' && (
                          <span className="w-2 h-2 rounded-full bg-[#38E044]" />
                        )}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-neutral-700" />
                          <span className="font-bold text-sm text-neutral-900">Entreprise</span>
                        </div>
                        <p className="text-sm text-neutral-500">
                          Facturation destinée à une société avec TVA et SIRET vérifié.
                        </p>
                      </div>
                    </div>
                  </div>

                  {billingType === 'entreprise' ? (
                    <div className="p-5 rounded-2xl bg-neutral-50/80 border border-neutral-200 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <Building2 className="w-5 h-5 text-neutral-700" />
                          <span className="font-bold text-sm text-neutral-900">
                            Destinataire : Facturation Entreprise
                          </span>
                        </div>
                        {user.siretVerified && user.siret ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                            <ShieldCheck className="w-4 h-4" />
                            SIRET Vérifié & Conforme
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-amber-800 bg-amber-100 px-3 py-1 rounded-full">
                            Vérification requise
                          </span>
                        )}
                      </div>

                      {user.siretVerified && user.siret ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                          <div className="p-3 bg-white rounded-xl border border-neutral-200">
                            <span className="text-neutral-400 block font-medium">Raison Sociale :</span>
                            <span className="font-bold text-neutral-800">{user.companyName}</span>
                          </div>
                          <div className="p-3 bg-white rounded-xl border border-neutral-200">
                            <span className="text-neutral-400 block font-medium">Numéro SIRET :</span>
                            <span className="font-mono font-bold text-neutral-800">{user.siret}</span>
                          </div>
                          <div className="p-3 bg-white rounded-xl border border-neutral-200">
                            <span className="text-neutral-400 block font-medium">TVA Intracommunautaire :</span>
                            <span className="font-mono font-bold text-neutral-800">{user.vatNumber}</span>
                          </div>
                          <div className="p-3 bg-white rounded-xl border border-neutral-200">
                            <span className="text-neutral-400 block font-medium">Siège social :</span>
                            <span className="font-bold text-neutral-800">
                              {user.companyAddress}, {user.postalCode} {user.city}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm space-y-2">
                          <p className="font-bold text-amber-900">
                            Système de vérification entreprise obligatoire
                          </p>
                          <p className="text-amber-700">
                            Pour émettre une facture destinée à une entreprise avec mention de TVA déductible, vous devez obligatoirement vérifier le SIRET auprès de l'INSEE.
                          </p>
                          <button
                            type="button"
                            onClick={onOpenSiretModal}
                            className="mt-2 px-4 py-2 rounded-xl bg-black text-white font-bold hover:bg-neutral-800 transition-colors cursor-pointer"
                          >
                            Vérifier mon entreprise (SIRET)
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-5 rounded-2xl bg-neutral-50/80 border border-neutral-200 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <User className="w-5 h-5 text-neutral-700" />
                          <span className="font-bold text-sm text-neutral-900">
                            Destinataire : Client Particulier
                          </span>
                        </div>
                        {user.emailVerified ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                            <CheckCircle2 className="w-4 h-4" />
                            Compte vérifié
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setShowEmailAccordion((prev) => !prev)}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 px-3 py-1 rounded-full cursor-pointer transition-colors shadow-xs"
                            title="Cliquez pour valider votre adresse e-mail"
                          >
                            <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                            <span>E-mail non validé</span>
                            {showEmailAccordion ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />}
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div className="p-3 bg-white rounded-xl border border-neutral-200">
                          <span className="text-neutral-400 block font-medium">Nom complet :</span>
                          <span className="font-bold text-neutral-800">{user.name}</span>
                        </div>
                        <div className="p-3 bg-white rounded-xl border border-neutral-200">
                          <span className="text-neutral-400 block font-medium">Adresse e-mail :</span>
                          <span className="font-bold text-neutral-800">{user.email}</span>
                        </div>
                        <div className="p-3 bg-white rounded-xl border border-neutral-200 sm:col-span-2">
                          <span className="text-neutral-400 block font-medium">Adresse de facturation :</span>
                          <span className="font-bold text-neutral-800">
                            {user.personalAddress || '142 Avenue des Champs-Élysées'}, {user.personalPostalCode || '75008'} {user.personalCity || 'Paris'}
                          </span>
                        </div>
                      </div>

                      {/* Accordéon de validation par code 4 chiffres */}
                      {!user.emailVerified && (
                        <div className={`transition-all duration-200 overflow-hidden ${showEmailAccordion ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                          <div className="p-4 rounded-xl bg-amber-50/90 border border-amber-300/80 space-y-3.5 text-left">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs sm:text-sm">
                                <KeyRound className="w-4 h-4 text-amber-700" />
                                <span>Validation de votre adresse e-mail ({user.email})</span>
                              </div>
                              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-amber-200/70 text-amber-900">
                                Code à 4 chiffres
                              </span>
                            </div>

                            <p className="text-xs text-amber-800 leading-relaxed">
                              Pour demander votre facture en tant que particulier, votre adresse e-mail doit être validée. Cliquez ci-dessous pour recevoir un code à 4 chiffres par e-mail.
                            </p>

                            {!codeSent ? (
                              <div>
                                <button
                                  type="button"
                                  disabled={isSendingCode}
                                  onClick={handleSendEmailCode}
                                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0A0D0E] text-white text-xs font-bold hover:bg-neutral-800 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                                >
                                  <Send className="w-3.5 h-3.5 text-[#38E044]" />
                                  <span>{isSendingCode ? 'Envoi du code...' : 'Recevoir le code à 4 chiffres'}</span>
                                </button>
                              </div>
                            ) : (
                              <div className="space-y-3 pt-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-xs font-semibold text-neutral-700">Code reçu :</span>
                                  <div className="flex items-center gap-1.5">
                                    {[0, 1, 2, 3].map((idx) => (
                                      <input
                                        key={idx}
                                        id={`email-code-${idx}`}
                                        type="text"
                                        maxLength={1}
                                        value={emailCodeDigits[idx]}
                                        onChange={(e) => handleDigitChange(idx, e.target.value)}
                                        onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                                        className="w-10 h-11 text-center font-mono font-bold text-base bg-white border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 shadow-xs"
                                        placeholder="•"
                                      />
                                    ))}
                                  </div>

                                  <button
                                    type="button"
                                    disabled={isVerifyingCode || emailCodeDigits.join('').length !== 4}
                                    onClick={handleVerifyEmailCode}
                                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#38E044] text-black text-xs font-extrabold hover:bg-[#2ecc3a] transition-all shadow-sm cursor-pointer disabled:opacity-50"
                                  >
                                    {isVerifyingCode ? (
                                      <span>Vérification...</span>
                                    ) : (
                                      <>
                                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                                        <span>Valider le code</span>
                                      </>
                                    )}
                                  </button>
                                </div>

                                <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-1">
                                  <span>Un code valide 15 minutes a été envoyé à <strong>{user.email}</strong>.</span>
                                  <button
                                    type="button"
                                    disabled={isSendingCode}
                                    onClick={handleSendEmailCode}
                                    className="text-amber-800 font-semibold hover:underline cursor-pointer"
                                  >
                                    Renvoyer le code
                                  </button>
                                </div>
                              </div>
                            )}

                            {codeError && (
                              <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 p-2 rounded-lg font-medium flex items-center gap-1.5">
                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                <span>{codeError}</span>
                              </div>
                            )}

                            {codeSuccess && (
                              <div className="text-xs text-emerald-700 bg-emerald-100 border border-emerald-300 p-2 rounded-lg font-bold flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                                <span>Adresse e-mail validée avec succès ! Vous pouvez continuer.</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl font-medium">
                        ✓ C'est bon : Votre facture sera directement émise à votre nom personnel.
                      </p>
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    <button
                      disabled={!isProfileReady}
                      onClick={() => setStep(2)}
                      className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs transition-all ${
                        isProfileReady
                          ? 'bg-[#0A0D0E] text-white hover:bg-neutral-800 shadow-md cursor-pointer'
                          : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                      }`}
                    >
                      <span>Continuer vers le choix de la commande</span>
                      <ArrowRight className="w-4 h-4 text-[#38E044]" />
                    </button>
                  </div>
                </div>
              )}

              {/* ÉTAPE 2 : Sélection de la commande */}
              {step === 2 && (
                <div className="bg-white rounded-3xl border border-neutral-200/80 p-6 shadow-xs space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                    <div>
                      <h2 className="text-base font-bold text-neutral-900">
                        2. Sélection de la commande à facturer
                      </h2>
                      <p className="text-sm text-neutral-500 mt-0.5">
                        Choisissez la commande pour laquelle vous souhaitez demander la facture officielle.
                      </p>
                    </div>
                    <button
                      onClick={() => setStep(1)}
                      className="text-xs text-neutral-500 hover:text-black cursor-pointer"
                    >
                      ← Modifier les informations
                    </button>
                  </div>

                  {availableOrdersForInvoice.length === 0 ? (
                    <div className="p-8 text-center bg-neutral-50 rounded-2xl border border-neutral-200 space-y-2">
                      <FileCheck2 className="w-8 h-8 text-neutral-400 mx-auto" />
                      <div className="font-bold text-sm text-neutral-800">
                        Toutes vos commandes disposent déjà d'une demande ou facture associée.
                      </div>
                      <p className="text-sm text-neutral-500">
                        Consultez l'onglet "Toutes mes factures" pour suivre l'état de traitement de vos demandes.
                      </p>
                      <button
                        onClick={() => setActiveTab('history')}
                        className="mt-2 text-sm font-bold text-emerald-700 hover:underline cursor-pointer"
                      >
                        Voir mes factures et demandes →
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {availableOrdersForInvoice.map((order) => {
                        const isSelected = selectedOrderId === order.id;
                        const item = order.items[0];

                        return (
                          <div
                            key={order.id}
                            onClick={() => setSelectedOrderId(order.id)}
                            className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                              isSelected
                                ? 'bg-neutral-50/90 border-[#0A0D0E] ring-2 ring-black/10 shadow-sm'
                                : 'bg-white border-neutral-200 hover:border-neutral-300'
                            }`}
                          >
                            <div className="flex items-center gap-3.5 min-w-0">
                              <div
                                className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                                  isSelected
                                    ? 'border-black bg-black text-white'
                                    : 'border-neutral-300 bg-white'
                                }`}
                              >
                                {isSelected && <span className="w-2 h-2 rounded-full bg-[#38E044]" />}
                              </div>

                              <img
                                src={item.productImage}
                                alt={item.productName}
                                className="w-14 h-14 rounded-xl object-cover border border-neutral-200 shrink-0"
                              />

                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-sm text-neutral-900">
                                    {order.orderNumber}
                                  </span>
                                  <span className="text-xs text-neutral-400">
                                    • {order.date}
                                  </span>
                                </div>
                                <div className="font-bold text-sm text-neutral-800 truncate mt-0.5">
                                  {item.productName}
                                </div>
                                <div className="text-sm text-neutral-500 mt-0.5">
                                  Qté : {item.quantity} • Statut : {order.status === 'delivered' ? 'Livré' : 'En cours'}
                                </div>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <div className="font-mono font-extrabold text-sm text-neutral-900">
                                {order.totalTTC.toFixed(2)} € TTC
                              </div>
                              <span className="text-xs text-neutral-400">
                                Dont {order.vatAmount.toFixed(2)} € TVA
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
                    <span className="text-xs text-neutral-500">
                      {selectedOrderId
                        ? '1 commande sélectionnée'
                        : 'Veuillez sélectionner une commande ci-dessus pour continuer.'}
                    </span>

                    <button
                      id="btn-continue-to-recap"
                      disabled={!selectedOrderId}
                      onClick={() => setStep(3)}
                      className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
                        selectedOrderId
                          ? 'bg-[#0A0D0E] text-white hover:bg-neutral-800 shadow-md cursor-pointer'
                          : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                      }`}
                    >
                      <span>Vérifier le récapitulatif</span>
                      <ArrowRight className="w-4 h-4 text-[#38E044]" />
                    </button>
                  </div>
                </div>
              )}

              {/* ÉTAPE 3 : Demande de facture & Récapitulatif financier */}
              {step === 3 && selectedOrder && (
                <div className="bg-white rounded-3xl border border-neutral-200/80 p-6 shadow-xs space-y-6">
                  <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                    <div>
                      <h2 className="text-base font-bold text-neutral-900">
                        3. Récapitulatif de la demande de facture
                      </h2>
                      <p className="text-sm text-neutral-500 mt-0.5">
                        Vérifiez les mentions légales avant de transmettre votre demande au service comptabilité.
                      </p>
                    </div>
                    <button
                      onClick={() => setStep(2)}
                      className="text-sm text-neutral-500 hover:text-black cursor-pointer"
                    >
                      ← Changer de commande
                    </button>
                  </div>

                  {/* Facture preview card */}
                  <div className="p-5 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-4">
                    <div className="flex items-start justify-between border-b border-neutral-200 pb-3">
                      <div>
                        <div className="font-mono font-bold text-xs text-neutral-500">
                          ÉMETTEUR
                        </div>
                        <div className="font-bold text-sm text-neutral-900">
                          PIXIATECH DISTRIBUTION SAS
                        </div>
                        <div className="text-sm text-neutral-500">
                          SIRET : 522 888 888 00012 • TVA : FR44522888888
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-mono font-bold text-xs text-neutral-500">
                          CLIENT FACTURÉ ({billingType === 'entreprise' ? 'ENTREPRISE' : 'PARTICULIER'})
                        </div>
                        <div className="font-bold text-sm text-neutral-900">
                          {billingType === 'entreprise'
                            ? (user.companyName || user.name)
                            : user.name}
                        </div>
                        <div className="text-sm text-neutral-500">
                          {billingType === 'entreprise'
                            ? (user.siret ? `SIRET : ${user.siret}` : 'Entreprise certifiée')
                            : `E-mail : ${user.email}`}
                        </div>
                      </div>
                    </div>

                    {/* Product line item */}
                    <div className="flex items-center justify-between gap-4 py-2">
                      <div className="flex items-center gap-3">
                        <img
                          src={selectedOrder.items[0].productImage}
                          alt={selectedOrder.items[0].productName}
                          className="w-12 h-12 rounded-xl object-cover border border-neutral-200"
                        />
                        <div>
                          <div className="font-bold text-sm text-neutral-900">
                            {selectedOrder.items[0].productName}
                          </div>
                          <div className="text-xs text-neutral-500">
                            Quantité : {selectedOrder.items[0].quantity}
                          </div>
                        </div>
                      </div>

                      <div className="text-right font-mono text-sm">
                        <div>HT : {selectedOrder.subtotalHT.toFixed(2)} €</div>
                        <div>TVA 20% : {selectedOrder.vatAmount.toFixed(2)} €</div>
                        {selectedOrder.discountCode && (
                          <div className="text-emerald-700">
                            Code : {selectedOrder.discountCode} (-{selectedOrder.discountAmount?.toFixed(2)} €)
                          </div>
                        )}
                        <div className="font-bold text-sm text-neutral-900 pt-1">
                          Total TTC : {selectedOrder.totalTTC.toFixed(2)} €
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-sky-50 border border-sky-200 text-sm text-sky-900 flex items-start gap-2.5">
                    <Clock className="w-4 h-4 text-sky-600 mt-0.5 shrink-0" />
                    <div>
                      <strong className="block font-semibold">Parcours de demande & validation légale</strong>
                      <span>
                        En cliquant sur confirmer, votre demande sera enregistrée avec le statut <strong>EN ATTENTE</strong>. L'administration PIXIATECH vérifiera les mentions fiscales et associera le document officiel certifié (statut <strong>FACTURE DISPONIBLE</strong>).
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
<button
                    onClick={() => setStep(2)}
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-neutral-600 hover:bg-neutral-100 cursor-pointer"
                  >
                    Annuler
                  </button>

                  <button
                    id="btn-confirm-invoice-creation"
                    disabled={isProcessing}
                    onClick={handleConfirmInvoiceRequest}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0A0D0E] text-white font-bold text-sm hover:bg-neutral-800 transition-all shadow-md cursor-pointer"
                  >
                      {isProcessing ? (
                        <span>Transmission en cours...</span>
                      ) : (
                        <>
                          <span>Transmettre la demande de facture</span>
                          <CheckCircle2 className="w-4 h-4 text-[#38E044]" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* ÉTAPE 4 : Confirmation de la Demande */}
              {step === 4 && (
                <div className="bg-white rounded-3xl border border-neutral-200/80 p-8 text-center shadow-xs space-y-5 animate-in fade-in zoom-in-95 duration-200">
                  <div className="w-16 h-16 mx-auto rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                    <Clock className="w-8 h-8" />
                  </div>

                  <h3 className="text-xl font-bold text-neutral-900">
                    Votre demande de facture a été enregistrée avec succès !
                  </h3>

                  <div className="max-w-md mx-auto space-y-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span>Statut actuel : EN ATTENTE DE TRAITEMENT</span>
                    </span>
                    <p className="text-sm text-neutral-500">
                      Votre demande a été transmise au service comptabilité PIXIATECH. L'administration va instruire votre dossier et y associer le véritable document certifié.
                    </p>
                  </div>

                  <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
                    <button
                      onClick={() => {
                        setActiveTab('history');
                        setStep(1);
                      }}
                      className="px-5 py-2.5 rounded-xl bg-[#0A0D0E] text-white text-sm font-bold hover:bg-neutral-800 transition-all shadow-md cursor-pointer"
                    >
                      Suivre mes demandes dans l'historique
                    </button>

                    <button
                      onClick={() => {
                        setSelectedOrderId('');
                        setStep(1);
                      }}
                      className="px-5 py-2.5 rounded-xl bg-neutral-100 text-neutral-700 text-sm font-semibold hover:bg-neutral-200 transition-all cursor-pointer"
                    >
                      Faire une autre demande
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
