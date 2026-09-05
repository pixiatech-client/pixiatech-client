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
    <div className="p-4 sm:p-6">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div>
          <h2 className="text-[24px] font-semibold tracking-tight text-gray-900">Mes factures</h2>
          <p className="text-[13px] text-gray-500 mt-1">Générez et retrouvez vos factures en quelques clics.</p>
        </div>
      </div>

      {successMessage && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-sm text-emerald-800">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="leading-relaxed font-medium flex-1">{successMessage}</p>
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

      <InvoiceStepper
        steps={STEPS}
        currentStep={currentStep}
        onStepClick={(step) => canGoToStep(step) && setCurrentStep(step)}
      />

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

      <div ref={historyRef} className="mt-12 scroll-mt-20">
        <div className="flex items-center gap-2.5 mb-4">
          <History className="w-5 h-5 text-[#004ac6]" />
          <h3 className="text-[17px] font-semibold text-gray-900">Historique des factures</h3>
        </div>
        <InvoiceTable refreshKey={invoicesRefreshKey} />
      </div>
    </div>
  );
}