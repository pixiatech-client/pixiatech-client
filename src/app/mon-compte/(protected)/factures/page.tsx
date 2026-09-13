'use client';

import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, ShoppingBag, FileText, XCircle, CheckCircle2, History } from 'lucide-react';
import { toast } from 'sonner';
import { InvoiceStepper, type InvoiceStepConfig } from '@/components/invoices/InvoiceStepper';
import { ProfessionalInfoStep } from '@/components/invoices/ProfessionalInfoStep';
import { OrderSelectorStep } from '@/components/invoices/OrderSelectorStep';
import { InvoiceSummaryStep } from '@/components/invoices/InvoiceSummaryStep';
import { InvoiceTable } from '@/components/invoices/InvoiceTable';
import { ClientPageHeader } from '@/components/client-ui/client-page-header';
import type { EligibleOrder } from '@/services/invoiceService';
import type { ProfessionalInfo } from '@/services/professionalInfoService';

const STEPS: InvoiceStepConfig[] = [
  { id: 0, label: 'Informations professionnelles', icon: Building2 },
  { id: 1, label: 'Choix de la commande', icon: ShoppingBag },
  { id: 2, label: 'Génération de la facture', icon: FileText },
];

export default function FacturesPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [professionalInfo, setProfessionalInfo] = useState<ProfessionalInfo | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<EligibleOrder | null>(null);
  const [invoicesRefreshKey, setInvoicesRefreshKey] = useState(0);
  const [ordersRefreshKey, setOrdersRefreshKey] = useState(0);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const historyRef = useRef<HTMLDivElement>(null);

  const canGoToStep = (step: number) => step <= currentStep;

  const handleProfessionalInfoComplete = (info: ProfessionalInfo) => {
    setProfessionalInfo(info);
    setCurrentStep(1);
  };

  const handleContinueOrder = () => {
    if (selectedOrder) setCurrentStep(2);
  };

  const handleGenerated = (invoiceNumber: string) => {
    toast.success('Votre facture a été générée avec succès !');
    setSuccessMessage(
      `Votre facture ${invoiceNumber ? `n°${invoiceNumber} ` : ''}a été générée avec succès ! Elle a été envoyée à votre email professionnel.`
    );
    setCurrentStep(0);
    setSelectedOrder(null);
    setInvoicesRefreshKey((k) => k + 1);
    requestAnimationFrame(() => {
      historyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const handleAlreadyInvoiced = (message: string) => {
    toast.error(message);
    setSelectedOrder(null);
    setCurrentStep(1);
    setInvoicesRefreshKey((k) => k + 1);
    setOrdersRefreshKey((k) => k + 1);
  };

  return (
    <div className="w-full max-w-[1536px] mx-auto px-4 sm:px-6 py-6">
      <ClientPageHeader
        title="Mes factures"
        subtitle="Générez et retrouvez vos factures en quelques clics."
        icon={FileText}
      />

      {successMessage && (
        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-sm text-emerald-800">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="leading-relaxed font-medium flex-1">
            <span className="inline-block w-1.5 h-1.5 bg-[#38E044] rounded-full mr-2 align-middle shadow-[0_0_8px_#38E044]" />
            {successMessage}
          </p>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-500 hover:text-emerald-700 transition-colors"
            aria-label="Fermer"
          >
            <XCircle className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="mt-5">
        <InvoiceStepper
          steps={STEPS}
          currentStep={currentStep}
          onStepClick={(step) => canGoToStep(step) && setCurrentStep(step)}
        />
      </div>

      <div className="mt-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            {currentStep === 0 && <ProfessionalInfoStep key="step-0" onComplete={handleProfessionalInfoComplete} />}

            {currentStep === 1 && (
              <OrderSelectorStep
                key="step-1"
                selectedOrder={selectedOrder}
                onSelectOrder={setSelectedOrder}
                onBack={() => canGoToStep(0) && setCurrentStep(0)}
                onContinue={handleContinueOrder}
                refreshKey={ordersRefreshKey}
              />
            )}

            {currentStep === 2 && professionalInfo && selectedOrder && (
              <InvoiceSummaryStep
                key="step-2"
                professionalInfo={professionalInfo}
                order={selectedOrder}
                onBack={() => canGoToStep(1) && setCurrentStep(1)}
                onGenerated={handleGenerated}
                onAlreadyInvoiced={handleAlreadyInvoiced}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div ref={historyRef} className="mt-12 scroll-mt-24">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-9 h-9 rounded-xl bg-[#0A0D0E] flex items-center justify-center shrink-0">
            <History className="w-4 h-4 text-[#38E044]" />
          </div>
          <h3 className="text-lg font-bold text-neutral-900">Historique des factures</h3>
        </div>
        <InvoiceTable refreshKey={invoicesRefreshKey} />
      </div>
    </div>
  );
}