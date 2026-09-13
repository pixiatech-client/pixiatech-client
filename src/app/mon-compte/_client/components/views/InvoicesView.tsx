'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Download, FileText, Loader2, ShieldCheck } from 'lucide-react';
import type { ClientInvoice, EligibleOrder, OrderDraftOption } from '../../types';
import { clientApi } from '../../lib/api';
import { formatDate, formatMoney, formatMonthYear, formatShortDate } from '../../lib/format';
import { formatOrderNumber } from '@/lib/client-status';
import { SlidingSwitch } from '../SlidingSwitch';

interface InvoicesViewProps {
  invoices: ClientInvoice[];
  onOpenInvoice: (invoiceId: string) => void;
  onDone: () => void;
  onRequireProfessionalInfo: () => void;
  showToast: (type: 'success' | 'error', message: string) => void;
}

type Tab = 'history' | 'request';
type StatusFilter = 'all' | 'available' | 'pending';
type Step = 'draft' | 'company' | 'summary' | 'done';

interface CompanyForm {
  companyName: string;
  siret: string;
  vatNumber: string;
  address: string;
  city: string;
  postcode: string;
  country: string;
  officePhone: string;
  companyEmail: string;
  position: string;
  employees: string;
  website: string;
}

interface GenerationResult {
  orderId: string;
  invoiceNumber?: string;
  error?: string;
}

const downloadStatuses = ['sent', 'completed', 'archived', 'generated'];

function buildOptions(eligible: EligibleOrder[]): OrderDraftOption[] {
  const refOf = (o: EligibleOrder) => ({
    orderId: o.orderId,
    orderType: o.orderType,
    label: `${formatOrderNumber(o.orderType, o.orderId, o.createdAt)} — ${o.productName || 'Commande'}`,
    date: o.createdAt,
    amount: o.totalTtc ?? 0,
  });

  const sum = (list: EligibleOrder[]) => ({
    totalHT: list.reduce((s, o) => s + (o.subtotal ?? 0), 0),
    totalVAT: list.reduce((s, o) => s + (o.vat ?? 0), 0),
    totalTTC: list.reduce((s, o) => s + (o.totalTtc ?? 0), 0),
  });

  const all = [...eligible].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const options: OrderDraftOption[] = [];
  const allTotals = sum(all);
  options.push({
    key: 'all',
    label: 'Toutes mes commandes éligibles',
    periodLabel: `${all.length} commande${all.length > 1 ? 's' : ''}`,
    typeLabel: 'Toutes confondues',
    count: all.length,
    ...allTotals,
    orders: all.map(refOf),
  });

  const byMonth = new Map<string, EligibleOrder[]>();
  for (const o of all) {
    const key = formatMonthYear(o.createdAt) || 'Autres';
    if (!byMonth.has(key)) byMonth.set(key, []);
    byMonth.get(key)!.push(o);
  }
  for (const [month, list] of Array.from(byMonth.entries())) {
    const totals = sum(list);
    options.push({
      key: `month:${month}`,
      label: `Commandes de ${month}`,
      periodLabel: `${list.length} commande${list.length > 1 ? 's' : ''}`,
      typeLabel: month,
      count: list.length,
      ...totals,
      orders: list.map(refOf),
    });
  }

  for (const o of all) {
    options.push({
      key: `order:${o.orderId}`,
      label: `Commande ${formatOrderNumber(o.orderType, o.orderId, o.createdAt)}`,
      periodLabel: formatShortDate(o.createdAt),
      typeLabel: o.productName || 'Commande',
      count: 1,
      totalHT: o.subtotal ?? 0,
      totalVAT: o.vat ?? 0,
      totalTTC: o.totalTtc ?? 0,
      orders: [refOf(o)],
    });
  }

  return options;
}

const EMPTY_COMPANY: CompanyForm = {
  companyName: '',
  siret: '',
  vatNumber: '',
  address: '',
  city: '',
  postcode: '',
  country: 'France',
  officePhone: '',
  companyEmail: '',
  position: '',
  employees: '',
  website: '',
};

export function InvoicesView({ invoices, onOpenInvoice, onDone, onRequireProfessionalInfo, showToast }: InvoicesViewProps) {
  const [tab, setTab] = useState<Tab>('history');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const historyInvoices = useMemo(() => {
    const sorted = [...invoices].sort((a, b) => b.date.localeCompare(a.date));
    if (statusFilter === 'all') return sorted;
    if (statusFilter === 'available') return sorted.filter((i) => downloadStatuses.includes(i.status));
    return sorted.filter((i) => !downloadStatuses.includes(i.status));
  }, [invoices, statusFilter]);

  const [eligible, setEligible] = useState<EligibleOrder[] | null>(null);
  const [eligibleLoading, setEligibleLoading] = useState(false);
  const [step, setStep] = useState<Step>('draft');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [company, setCompany] = useState<CompanyForm>(EMPTY_COMPANY);
  const [generating, setGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState({ done: 0, total: 0 });
  const [results, setResults] = useState<GenerationResult[]>([]);
  const [vatValidated, setVatValidated] = useState(false);

  const loadEligible = useCallback(async () => {
    setEligibleLoading(true);
    try {
      const res = await clientApi.eligibleOrders();
      setEligible(res.orders);
      if (res.orders.length > 0) setSelectedKey(null);
    } catch (err: any) {
      showToast('error', err.message || "Impossible de charger les commandes éligibles.");
    } finally {
      setEligibleLoading(false);
    }
  }, [showToast]);

  const loadProfessionalInfo = useCallback(async () => {
    try {
      const res = await clientApi.professionalInfo();
      const p = res.professionalInfo || {};
      setCompany({
        companyName: String(p.companyName || ''),
        siret: String(p.siret || ''),
        vatNumber: String(p.vatNumber || ''),
        address: String(p.address || ''),
        city: String(p.city || ''),
        postcode: String(p.postcode || ''),
        country: String(p.country || 'France'),
        officePhone: String(p.officePhone || ''),
        companyEmail: String(p.companyEmail || ''),
        position: String(p.position || ''),
        employees: String(p.employees || ''),
        website: String(p.website || ''),
      });
      setVatValidated(p.vatValidated === true);
    } catch {
      // Les infos pro sont optionnelles : on démarre le formulaire vide.
    }
  }, []);

  useEffect(() => {
    if (tab === 'request') {
      if (eligible === null) loadEligible();
      loadProfessionalInfo();
    }
  }, [tab, eligible, loadEligible, loadProfessionalInfo]);

  const options = useMemo(() => (eligible ? buildOptions(eligible) : []), [eligible]);

  const selectedOption = useMemo(
    () => (selectedKey ? options.find((o) => o.key === selectedKey) : undefined),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedKey, eligible]
  );

  const saveCompany = async () => {
    try {
      const res = await clientApi.updateProfessionalInfo({
        companyName: company.companyName,
        siret: company.siret,
        vatNumber: company.vatNumber,
        address: company.address,
        city: company.city,
        state: '',
        postcode: company.postcode,
        country: company.country,
        officePhone: company.officePhone,
        companyEmail: company.companyEmail,
        position: company.position,
        employees: company.employees,
        website: company.website,
        fax: '',
      });
      setVatValidated(res.vatValidated === true);
      setStep('summary');
      showToast('success', 'Vos informations professionnelles ont été enregistrées.');
    } catch (err: any) {
      showToast('error', err.message || "Impossible d'enregistrer vos informations.");
    }
  };

  const generate = async () => {
    if (!selectedOption) return;
    const orders = selectedOption.orders;
    setGenerating(true);
    setResults([]);
    setGenerationProgress({ done: 0, total: orders.length });
    const out: GenerationResult[] = [];

    for (let i = 0; i < orders.length; i += 1) {
      const { orderId, orderType } = orders[i];
      try {
        const res = await clientApi.generateInvoice(orderId, orderType);
        const invoice = res.invoice as Record<string, unknown>;
        out.push({ orderId, invoiceNumber: String(invoice.invoiceNumber || '') });
      } catch (err: any) {
        out.push({ orderId, error: err.message || 'Erreur de génération' });
      }
      setResults([...out]);
      setGenerationProgress({ done: i + 1, total: orders.length });
    }

    setGenerating(false);
    setStep('done');
    onDone();
  };

  return (
    <div id="pixiatech-invoices-view" className="space-y-6">
      <div className="bg-white rounded-3xl border border-neutral-200/80 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-13 h-13 rounded-2xl bg-[#0A0D0E] text-white flex items-center justify-center shrink-0 shadow-md">
            <FileText className="w-6 h-6 text-[#38E044]" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">Mes Factures</h1>
            <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
              Consultez et téléchargez vos factures certifiées, ou demandez-en de nouvelles pour vos commandes éligibles.
            </p>
          </div>
        </div>

        <SlidingSwitch
          options={[
            { id: 'history', label: 'Mes factures', icon: <FileText size={15} /> },
            { id: 'request', label: 'Demander une facture', icon: <Download size={15} /> },
          ]}
          activeId={tab}
          onChange={(id) => setTab(id as Tab)}
          size="sm"
        />
      </div>

      {tab === 'history' && (
        <div className="space-y-4">
          <SlidingSwitch
            options={[
              { id: 'all', label: 'Tout' },
              { id: 'available', label: 'Disponibles' },
              { id: 'pending', label: 'En attente' },
            ]}
            activeId={statusFilter}
            onChange={(id) => setStatusFilter(id as StatusFilter)}
            size="sm"
          />

          {historyInvoices.length === 0 ? (
            <div className="flex flex-col items-center rounded-2xl border border-dashed border-neutral-200 bg-white py-16 text-center shadow-xs">
              <FileText size={36} className="text-neutral-300" />
              <p className="mt-3 text-sm font-bold text-neutral-700">
                Aucune facture {statusFilter !== 'all' ? 'dans cette catégorie' : 'pour le moment'}
              </p>
              <p className="mt-1 max-w-sm text-sm text-neutral-500">
                Vos factures apparaîtront ici après une demande, ou utilisez l'onglet « Demander une facture ».
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {historyInvoices.map((invoice) => {
                const downloadable = downloadStatuses.includes(invoice.status);
                return (
                  <button
                    key={invoice.id}
                    type="button"
                    onClick={() => onOpenInvoice(invoice.id)}
                    className="flex w-full items-center gap-4 rounded-2xl border border-neutral-200/80 bg-white p-5 text-left shadow-xs transition hover:border-neutral-300"
                  >
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-500">
                      <FileText size={19} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-neutral-900">{invoice.number || 'Facture'}</p>
                      <p className="text-xs text-neutral-500">
                        {formatDate(invoice.date)} · {invoice.companyName || 'PIXIATECH'}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                            downloadable ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {invoice.statusLabel || (downloadable ? 'Disponible' : 'En attente')}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-neutral-900">{formatMoney(invoice.totalTTC)}</p>
                      <p className="text-xs text-neutral-500">
                        HT {formatMoney(invoice.totalHT)} · TVA {formatMoney(invoice.totalVAT)}
                      </p>
                    </div>
                    {downloadable && (
                      <span className="flex items-center gap-1.5 rounded-xl bg-[#0A0D0E] px-3 py-2 text-xs font-semibold text-white">
                        <Download size={13} /> PDF
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === 'request' && (
        <div className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-xs">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
            >
              {step === 'draft' && (
                <DraftStep
                  loading={eligibleLoading}
                  options={options}
                  selectedKey={selectedKey}
                  onSelect={(key) => setSelectedKey(key)}
                  onContinue={() => setStep('company')}
                  canContinue={!!selectedKey}
                />
              )}

              {step === 'company' && (
                <CompanyStep
                  company={company}
                  onChange={setCompany}
                  onBack={() => setStep('draft')}
                  onContinue={saveCompany}
                  onOpenSiret={onRequireProfessionalInfo}
                />
              )}

              {step === 'summary' && selectedOption && (
                <SummaryStep
                  option={selectedOption}
                  vatValidated={vatValidated}
                  generating={generating}
                  progress={generationProgress}
                  onBack={() => setStep('company')}
                  onGenerate={generate}
                />
              )}

              {step === 'done' && (
                <DoneStep
                  results={results}
                  onViewHistory={() => {
                    setTab('history');
                    setStep('draft');
                    onDone();
                  }}
                  onDismiss={() => {
                    setStep('draft');
                    setEligible(null);
                    loadEligible();
                  }}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function OptionRow({ option, selected, onSelect }: { option: OrderDraftOption; selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition ${
        selected ? 'border-neutral-900 ring-1 ring-neutral-900' : 'border-neutral-100 hover:border-neutral-300'
      }`}
    >
      <span
        className={`flex size-5 shrink-0 items-center justify-center rounded-full border ${
          selected ? 'border-neutral-900 bg-neutral-900' : 'border-neutral-300'
        }`}
      >
        {selected && <span className="size-2 rounded-full bg-[#38E044]" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-neutral-900">{option.label}</p>
        <p className="text-xs text-neutral-500">{option.periodLabel} · {option.typeLabel}</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-bold text-neutral-900">{formatMoney(option.totalTTC)}</p>
        <p className="text-xs text-neutral-500">HT {formatMoney(option.totalHT)} · TVA {formatMoney(option.totalVAT)}</p>
      </div>
    </button>
  );
}

function DraftStep({
  loading,
  options,
  selectedKey,
  onSelect,
  onContinue,
  canContinue,
}: {
  loading: boolean;
  options: OrderDraftOption[];
  selectedKey: string | null;
  onSelect: (key: string) => void;
  onContinue: () => void;
  canContinue: boolean;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-bold text-neutral-900">Choisissez la période de facturation</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Sélectionnez les commandes à facturer. Les factures sont générées immédiatement et envoyées par e-mail.
        </p>
      </div>

      {loading && (
        <div className="flex items-center gap-3 rounded-2xl border border-neutral-100 bg-neutral-50/60 p-6 text-sm text-neutral-500">
          <Loader2 size={18} className="animate-spin" /> Chargement de vos commandes éligibles…
        </div>
      )}

      {!loading && options.length === 0 && (
        <div className="rounded-2xl border border-dashed border-neutral-200 p-10 text-center">
          <CheckCircle2 size={34} className="mx-auto text-emerald-500" />
          <p className="mt-3 text-sm font-bold text-neutral-900">Toutes vos commandes ont déjà été facturées</p>
          <p className="mt-1 text-sm text-neutral-500">
            Aucune commande éligible pour le moment. Les nouvelles commandes validées apparaîtront ici.
          </p>
        </div>
      )}

      {!loading && options.length > 0 && (
        <>
          <div className="space-y-3">
            {options.map((option) => (
              <OptionRow key={option.key} option={option} selected={selectedKey === option.key} onSelect={() => onSelect(option.key)} />
            ))}
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-neutral-100 bg-neutral-50/60 px-4 py-3 text-xs text-neutral-500">
            <ShieldCheck size={16} className="shrink-0 text-emerald-600" />
            Vos factures sont signées et émises au nom de PIXIATECH. TVA appliquée selon votre statut.
          </div>
          <button
            type="button"
            onClick={onContinue}
            disabled={!canContinue}
            className="w-full rounded-xl bg-[#0A0D0E] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Continuer
          </button>
        </>
      )}
    </div>
  );
}

function CompanyStep({
  company,
  onChange,
  onBack,
  onContinue,
  onOpenSiret,
}: {
  company: CompanyForm;
  onChange: (c: CompanyForm) => void;
  onBack: () => void;
  onContinue: () => void;
  onOpenSiret: () => void;
}) {
  const [checked, setChecked] = useState(false);
  const fields: Array<{ key: keyof CompanyForm; label: string; placeholder?: string; type?: string; className?: string }> = [
    { key: 'companyName', label: 'Raison sociale', placeholder: 'Ex : Ma Société' },
    { key: 'siret', label: 'Numéro SIRET', placeholder: '14 chiffres', className: 'sm:col-span-1' },
    { key: 'vatNumber', label: 'N° TVA intracommunautaire', placeholder: 'Ex : FR12345678901', className: 'sm:col-span-1' },
    { key: 'address', label: 'Adresse', className: 'sm:col-span-2' },
    { key: 'postcode', label: 'Code postal', className: 'sm:col-span-1' },
    { key: 'city', label: 'Ville', className: 'sm:col-span-1' },
    { key: 'country', label: 'Pays', className: 'sm:col-span-1' },
    { key: 'officePhone', label: 'Téléphone du siège', className: 'sm:col-span-1' },
    { key: 'companyEmail', label: 'E-mail de la société', className: 'sm:col-span-1' },
    { key: 'position', label: 'Votre fonction', className: 'sm:col-span-1' },
    { key: 'employees', label: "Nombre d'employés", className: 'sm:col-span-1' },
    { key: 'website', label: 'Site web', className: 'sm:col-span-2' },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-bold text-neutral-900">Informations de facturation</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Ces informations figureront sur vos factures. Le numéro de TVA est vérifié automatiquement (VIES).
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {fields.map((f) => (
          <label key={f.key} className={`block ${f.className || ''}`}>
            <span className="mb-1 block text-xs font-medium text-neutral-500">{f.label}</span>
            <input
              type={f.type || 'text'}
              value={company[f.key]}
              onChange={(e) => onChange({ ...company, [f.key]: e.target.value })}
              placeholder={f.placeholder}
              className="w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200"
            />
          </label>
        ))}
      </div>

      <button
        type="button"
        onClick={onOpenSiret}
        className="flex items-center gap-2 rounded-xl border border-neutral-200 px-3.5 py-2 text-xs font-semibold text-neutral-600 transition hover:bg-neutral-50"
      >
        <ShieldCheck size={14} /> Vérifier mon SIRET
      </button>

      <label className="flex items-start gap-3 rounded-xl border border-neutral-100 bg-neutral-50/60 p-4">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          className="mt-0.5 size-4 accent-neutral-900"
        />
        <span className="text-sm text-neutral-600">
          Je certifie l'exactitude de ces informations et j'accepte qu'elles soient utilisées pour l'émission de mes factures.
        </span>
      </label>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded-xl border border-neutral-200 px-4 py-3 text-sm font-semibold text-neutral-600 transition hover:bg-neutral-50"
        >
          Retour
        </button>
        <button
          type="button"
          onClick={onContinue}
          disabled={!checked || !company.companyName.trim() || !company.siret.trim()}
          className="flex-1 rounded-xl bg-[#0A0D0E] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Continuer
        </button>
      </div>
    </div>
  );
}

function SummaryStep({
  option,
  vatValidated,
  generating,
  progress,
  onBack,
  onGenerate,
}: {
  option: OrderDraftOption;
  vatValidated: boolean;
  generating: boolean;
  progress: { done: number; total: number };
  onBack: () => void;
  onGenerate: () => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-bold text-neutral-900">Récapitulatif</h2>
        <p className="mt-1 text-sm text-neutral-500">{option.label} · {option.periodLabel}</p>
      </div>

      <div className="rounded-2xl border border-neutral-100 bg-neutral-50/60 p-5">
        <dl className="space-y-2.5 text-sm">
          <div className="flex justify-between">
            <dt className="text-neutral-500">Nombre de commandes</dt>
            <dd className="font-semibold text-neutral-900">{option.count}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-neutral-500">Total HT</dt>
            <dd className="font-semibold text-neutral-900">{formatMoney(option.totalHT)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-neutral-500">TVA</dt>
            <dd className="font-semibold text-neutral-900">{formatMoney(option.totalVAT)}</dd>
          </div>
          <div className="flex justify-between border-t border-neutral-200 pt-2.5">
            <dt className="font-bold text-neutral-900">Total TTC</dt>
            <dd className="font-bold text-neutral-900">{formatMoney(option.totalTTC)}</dd>
          </div>
        </dl>
      </div>

      {vatValidated && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50/70 px-4 py-3 text-xs text-emerald-700">
          <ShieldCheck size={16} className="mt-0.5 shrink-0" />
          Votre numéro de TVA est validé : la TVA sera autoliquidée sur ces factures (taux 0%).
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={generating}
          className="rounded-xl border border-neutral-200 px-4 py-3 text-sm font-semibold text-neutral-600 transition hover:bg-neutral-50 disabled:opacity-40"
        >
          Retour
        </button>
        <button
          type="button"
          onClick={onGenerate}
          disabled={generating}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#0A0D0E] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {generating ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Génération en cours… {progress.done}/{progress.total}
            </>
          ) : (
            <>Générer {option.count > 1 ? `mes ${option.count} factures` : 'ma facture'}</>
          )}
        </button>
      </div>
    </div>
  );
}

function DoneStep({
  results,
  onViewHistory,
  onDismiss,
}: {
  results: GenerationResult[];
  onViewHistory: () => void;
  onDismiss: () => void;
}) {
  const ok = results.filter((r) => r.invoiceNumber).length;
  const failed = results.length - ok;
  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
        <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-emerald-600" />
        <div>
          <p className="text-sm font-bold text-emerald-800">
            {ok} facture{ok > 1 ? 's' : ''} générée{ok > 1 ? 's' : ''} avec succès
          </p>
          <p className="text-xs text-emerald-700">
            {failed > 0 ? `${failed} en échec. ` : ''}Les factures sont disponibles dans l'onglet « Mes factures » et
            envoyées par e-mail.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {results.map((r, i) => (
          <div key={i} className="flex items-center justify-between rounded-xl border border-neutral-100 bg-neutral-50/60 px-4 py-3 text-sm">
            <span className="text-neutral-600">Commande #{r.orderId.slice(-6)}</span>
            <span className={r.invoiceNumber ? 'font-semibold text-emerald-700' : 'font-semibold text-red-500'}>
              {r.invoiceNumber || r.error || 'Erreur'}
            </span>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onViewHistory}
        className="w-full rounded-xl bg-[#0A0D0E] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
      >
        Voir mes factures
      </button>
      <button
        type="button"
        onClick={onDismiss}
        className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm font-semibold text-neutral-600 transition hover:bg-neutral-50"
      >
        Faire une autre demande
      </button>
    </div>
  );
}