'use client';

import {
  Briefcase,
  CalendarDays,
  Eye,
  FileCheck2,
  Grid3x3,
  Layers,
  Maximize2,
  MessageSquare,
  Monitor,
  Pencil,
  Sun,
  Truck,
  User,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { t } from '../../../core/i18n/translations';
import { computeAreaSqm, computeRentalDays } from '../../../core/pricing/pricing-engine';
import { STEP, type BootstrapPayload } from '../../../core/types';
import { getStepProgress, type PixiaEngineState } from '../pixia-fsm-bridge';

interface SpecificationSummaryProps {
  engine: PixiaEngineState;
  bootstrap: BootstrapPayload;
  onEditStep?: (step: STEP) => void;
}

export interface TimelineRow {
  key: string;
  label: string;
  shortLabel: string;
  value: string;
  icon: LucideIcon;
  mono?: boolean;
  editStep?: STEP;
  completed: boolean;
  isCurrent: boolean;
}

export interface SpecificationTimelineData {
  rows: TimelineRow[];
  visibleRows: TimelineRow[];
  currentRow: TimelineRow;
  completedCount: number;
  lineRatio: number;
  progress: { current: number; total: number };
  pct: number;
  priceDisplay: string;
  isLockedPostContract: boolean;
  visitedSteps: Set<STEP>;
}

export function buildSpecificationTimeline(
  engine: PixiaEngineState,
  bootstrap: BootstrapPayload
): SpecificationTimelineData {
  const { lang, configState, form, includeDelivery, includeInstallation, history, step } = engine;
  const progress = getStepProgress(engine);
  const area =
    configState.width && configState.height
      ? computeAreaSqm(configState.width, configState.height)
      : null;
  const totalArea = area !== null ? Math.round(area * (configState.quantity || 1) * 100) / 100 : null;
  const rentalDays =
    configState.projectType === 'location'
      ? computeRentalDays(configState.rentalStartDate, configState.rentalEndDate)
      : null;

  const envLabel =
    configState.environment === 'interieur'
      ? t(lang, 'bot.envIndoor')
      : configState.environment === 'semi-exterieur'
        ? t(lang, 'bot.envSemiOutdoor')
        : configState.environment === 'exterieur'
          ? t(lang, 'bot.envOutdoor')
          : '';

  const priceDisplay = bootstrap.settings.isPriceHidden
    ? t(lang, 'ui.priceHidden')
    : t(lang, 'ui.onQuote');

  const isLockedPostContract =
    step === STEP.SECURITE || step === STEP.FELICITATIONS || step === STEP.SUCCESS;
  const visitedSteps = new Set(history.map((h) => h.step));

  const rows: TimelineRow[] = [
    {
      key: 'projectType',
      label: lang === 'fr' ? 'Type de projet' : 'Project type',
      shortLabel: lang === 'fr' ? 'Type projet' : 'Project',
      value: configState.projectType
        ? configState.projectType === 'location'
          ? t(lang, 'bot.optionRental')
          : t(lang, 'bot.optionSale')
        : lang === 'fr'
          ? 'Sélection en cours…'
          : 'Selecting…',
      icon: Briefcase,
      editStep: STEP.PROJECT_TYPE,
      completed: Boolean(configState.projectType),
      isCurrent: step === STEP.PROJECT_TYPE,
    },
    ...(configState.projectType === 'location'
      ? [
          {
            key: 'rentalPeriod',
            label: lang === 'fr' ? 'Période location' : 'Rental period',
            shortLabel: lang === 'fr' ? 'Période' : 'Dates',
            value:
              configState.rentalStartDate && configState.rentalEndDate
                ? `${configState.rentalStartDate} → ${configState.rentalEndDate} (${rentalDays} j)`
                : lang === 'fr'
                  ? 'Dates à définir…'
                  : 'Pick dates…',
            icon: CalendarDays,
            mono: true,
            editStep: STEP.RENTAL_PERIOD,
            completed: Boolean(configState.rentalStartDate && configState.rentalEndDate),
            isCurrent: step === STEP.RENTAL_PERIOD,
          },
        ]
      : []),
    {
      key: 'environment',
      label: lang === 'fr' ? 'Environnement' : 'Environment',
      shortLabel: lang === 'fr' ? 'Environnement' : 'Environment',
      value: envLabel || (lang === 'fr' ? 'En attente…' : 'Pending…'),
      icon: Sun,
      editStep: STEP.ENVIRONMENT,
      completed: Boolean(envLabel),
      isCurrent: step === STEP.ENVIRONMENT,
    },
    {
      key: 'dimensions',
      label: lang === 'fr' ? 'Dimensions' : 'Dimensions',
      shortLabel: lang === 'fr' ? 'Dimensions' : 'Size',
      value:
        configState.width && configState.height
          ? `${configState.width}m × ${configState.height}m (${area} m²)${
            configState.screenShape
                ? ` · ${
                    configState.screenShape === 'curved'
                      ? `${lang === 'fr' ? 'Incurvé' : 'Curved'}${
                          typeof configState.curveLeft === 'number' &&
                          typeof configState.curveRight === 'number'
                            ? ` (${lang === 'fr' ? 'G' : 'L'} ${
                                configState.curveLeft > 0
                                  ? `+${configState.curveLeft}`
                                  : configState.curveLeft
                              }° / ${lang === 'fr' ? 'D' : 'R'} ${
                                configState.curveRight > 0
                                  ? `+${configState.curveRight}`
                                  : configState.curveRight
                              }°)`
                            : ''
                        }`
                      : configState.screenShape === '360'
                        ? '360°'
                        : lang === 'fr'
                          ? 'Plat'
                          : 'Flat'
                  }`
                : ''
            }`
          : lang === 'fr'
            ? 'Largeur × Hauteur…'
            : 'Width × Height…',
      icon: Maximize2,
      mono: true,
      editStep: STEP.DIMENSIONS,
      completed: Boolean(configState.width && configState.height),
      isCurrent: step === STEP.DIMENSIONS,
    },
    {
      key: 'distance',
      label: lang === 'fr' ? 'Distance vue' : 'Viewing distance',
      shortLabel: lang === 'fr' ? 'Distance' : 'Distance',
      value: configState.distance ?? (lang === 'fr' ? 'En attente…' : 'Pending…'),
      icon: Eye,
      mono: true,
      editStep: STEP.DISTANCE,
      completed: Boolean(configState.distance),
      isCurrent: step === STEP.DISTANCE,
    },
    {
      key: 'pitch',
      label: lang === 'fr' ? 'Pas de pixel' : 'Pixel pitch',
      shortLabel: lang === 'fr' ? 'Pixel Pitch' : 'Pitch',
      value:
        configState.pixelPitch !== null
          ? `P${configState.pixelPitch}`
          : lang === 'fr'
            ? 'En attente…'
            : 'Pending…',
      icon: Grid3x3,
      mono: true,
      editStep: STEP.PITCH,
      completed: configState.pixelPitch !== null,
      isCurrent: step === STEP.PITCH,
    },
    {
      key: 'product',
      label: lang === 'fr' ? 'Modèle retenu' : 'Selected model',
      shortLabel: lang === 'fr' ? 'Modèle LED' : 'Model',
      value:
        configState.selectedProduct?.name ?? (lang === 'fr' ? 'Choix catalogue…' : 'Select model…'),
      icon: Monitor,
      editStep: STEP.PRODUCTS,
      completed: Boolean(configState.selectedProduct),
      isCurrent: step === STEP.PRODUCTS || step === STEP.SUMMARY || step === STEP.GENERATING,
    },
    {
      key: 'quantity',
      label: lang === 'fr' ? 'Quantité & surface' : 'Quantity & area',
      shortLabel: lang === 'fr' ? 'Quantité' : 'Quantity',
      value:
        configState.selectedProduct && totalArea !== null && visitedSteps.has(STEP.QUANTITY)
          ? `${configState.quantity} × (${totalArea} m²)`
          : lang === 'fr'
            ? 'En attente…'
            : 'Pending…',
      icon: Layers,
      mono: true,
      editStep: STEP.QUANTITY,
      completed: Boolean(configState.selectedProduct && visitedSteps.has(STEP.QUANTITY)),
      isCurrent: step === STEP.QUANTITY || step === STEP.SITE_PHOTO,
    },
    {
      key: 'client',
      label: lang === 'fr' ? 'Client' : 'Client',
      shortLabel: lang === 'fr' ? 'Coordonnées' : 'Client',
      value: form.company
        ? form.representative
          ? `${form.company} · ${form.representative}`
          : form.company
        : lang === 'fr'
          ? 'Identification…'
          : 'Client details…',
      icon: User,
      editStep: STEP.CLIENT_ACCOUNT,
      completed: Boolean(form.company && form.email && form.phone),
      isCurrent:
        step === STEP.CLIENT_ACCOUNT ||
        step === STEP.FORM_COMPANY ||
        step === STEP.FORM_REPRESENTATIVE ||
        step === STEP.FORM_EMAIL ||
        step === STEP.FORM_PHONE ||
        step === STEP.FORM_ADDRESS,
    },
    {
      key: 'delivery',
      label: lang === 'fr' ? 'Livraison' : 'Delivery',
      shortLabel: lang === 'fr' ? 'Livraison' : 'Delivery',
      value:
        includeDelivery === null
          ? form.deliveryCity || (lang === 'fr' ? 'Ville à préciser…' : 'City…')
          : includeDelivery
            ? `${t(lang, 'bot.yes')} (${form.deliveryCity})`
            : t(lang, 'bot.no'),
      icon: Truck,
      editStep: STEP.DELIVERY_CHOICE,
      completed: includeDelivery !== null,
      isCurrent: step === STEP.DELIVERY || step === STEP.DELIVERY_CHOICE,
    },
    {
      key: 'installation',
      label: lang === 'fr' ? 'Installation' : 'Installation',
      shortLabel: lang === 'fr' ? 'Installation' : 'Install',
      value:
        includeInstallation === null
          ? lang === 'fr'
            ? 'Pose optionnelle…'
            : 'Optional install…'
          : includeInstallation
            ? t(lang, 'bot.yes')
            : t(lang, 'bot.no'),
      icon: Wrench,
      editStep: STEP.INSTALLATION,
      completed: includeInstallation !== null,
      isCurrent: step === STEP.INSTALLATION,
    },
    ...(configState.projectType === 'location'
      ? [
          {
            key: 'rentalComment',
            label: lang === 'fr' ? 'Commentaire' : 'Comment',
            shortLabel: lang === 'fr' ? 'Remarque' : 'Notes',
            value: configState.rentalComment?.trim()
              ? configState.rentalComment
              : visitedSteps.has(STEP.RENTAL_COMMENT)
                ? lang === 'fr'
                  ? 'Aucun commentaire'
                  : 'No comment'
                : lang === 'fr'
                  ? 'Remarque optionnelle…'
                  : 'Optional comment…',
            icon: MessageSquare,
            editStep: STEP.RENTAL_COMMENT,
            completed: visitedSteps.has(STEP.RENTAL_COMMENT),
            isCurrent: step === STEP.RENTAL_COMMENT,
          },
        ]
      : []),
    {
      key: 'validation',
      label: lang === 'fr' ? 'Signature & PDF' : 'Contract & PDF',
      shortLabel:
        step === STEP.SUCCESS || step === STEP.FELICITATIONS
          ? lang === 'fr'
            ? 'Estimation validée'
            : 'Estimate ready'
          : step === STEP.SECURITE
            ? lang === 'fr'
              ? 'Code OTP'
              : 'OTP Code'
            : lang === 'fr'
              ? 'Signature'
              : 'Signature',
      value:
        step === STEP.SUCCESS || step === STEP.FELICITATIONS
          ? lang === 'fr'
            ? 'Estimation validée ✓'
            : 'Estimate issued ✓'
          : step === STEP.SECURITE
            ? lang === 'fr'
              ? 'Vérification code…'
              : 'Code verification…'
            : lang === 'fr'
              ? 'Signature requise…'
              : 'Signature required…',
      icon: FileCheck2,
      completed: step === STEP.FELICITATIONS || step === STEP.SUCCESS,
      isCurrent:
        step === STEP.CONTRAT ||
        step === STEP.SECURITE ||
        step === STEP.FELICITATIONS ||
        step === STEP.SUCCESS,
    },
  ];

  const visibleRows = rows.filter((row) => row.completed || row.isCurrent);
  const completedCount = visibleRows.filter((r) => r.completed).length;
  const lineRatio =
    visibleRows.length <= 1
      ? completedCount > 0
        ? 1
        : 0
      : Math.min(1, completedCount / Math.max(1, visibleRows.length - 0.15));
  const pct = Math.min(100, Math.round((progress.current / progress.total) * 100));
  const currentRow =
    rows.find((r) => r.isCurrent) ??
    visibleRows[visibleRows.length - 1] ??
    rows[0];

  return {
    rows,
    visibleRows,
    currentRow,
    completedCount,
    lineRatio,
    progress,
    pct,
    priceDisplay,
    isLockedPostContract,
    visitedSteps,
  };
}

export function SpecificationSummary({
  engine,
  bootstrap,
  onEditStep,
}: SpecificationSummaryProps) {
  const { lang } = engine;
  const {
    visibleRows,
    lineRatio,
    progress,
    pct,
    priceDisplay,
    isLockedPostContract,
    visitedSteps,
  } = buildSpecificationTimeline(engine, bootstrap);

  return (
    <motion.aside
      layout
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-[24px] border border-white/10 bg-[#17171A]/95 p-5 space-y-4 text-[#F4F4F5] shadow-[0_20px_55px_rgba(0,0,0,0.62)] backdrop-blur-md"
    >
      {/* Progress Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-[#A1A1AA]">
          <span className="font-semibold text-white">{t(lang, 'ui.summaryTitle')}</span>
          <span className="font-mono tabular-nums">
            {t(lang, 'ui.step', { current: progress.current, total: progress.total })}
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-[#3f9b78] via-[#10B981] to-[#6EE7B7]"
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </div>

      {/* Progressive Opening Timeline with Vertical Line Turning Green & Rounded-Square Section Icons */}
      <div className="relative space-y-1.5 px-0.5">
        {visibleRows.length > 1 && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-[15px] top-4 bottom-4 w-[2px] rounded-full bg-white/10 overflow-hidden"
          >
            <motion.div
              className="w-full origin-top rounded-full bg-gradient-to-b from-[#3f9b78] via-[#10B981] to-[#34D399]"
              initial={false}
              animate={{ height: `${Math.round(lineRatio * 100)}%` }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        )}

        <AnimatePresence initial={false}>
          {visibleRows.map((row) => {
            const RowIcon = row.icon;
            const canEdit =
              Boolean(onEditStep) &&
              !isLockedPostContract &&
              Boolean(row.editStep && visitedSteps.has(row.editStep));

            return (
              <motion.div
                key={row.key}
                layout
                initial={{ opacity: 0, height: 0, y: -6 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                className="relative flex items-center gap-2.5 overflow-hidden py-0.5"
              >
                <span
                  aria-hidden="true"
                  className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border transition-colors duration-300 ${
                    row.completed
                      ? 'border-[#34D399]/55 bg-[#0F2A1F] text-[#34D399]'
                      : 'border-[#C084FC]/60 bg-[#211930] text-[#C084FC]'
                  }`}
                >
                  <RowIcon className="h-3.5 w-3.5" />
                </span>

                <div className="min-w-0 flex-1">
                  {canEdit && row.editStep ? (
                    <button
                      type="button"
                      onClick={() => onEditStep?.(row.editStep!)}
                      title={lang === 'fr' ? `Modifier : ${row.label}` : `Edit: ${row.label}`}
                      className={`group w-full flex items-baseline justify-between gap-2.5 rounded-xl px-2.5 py-1.5 hover:bg-white/[0.06] transition-colors cursor-pointer text-left ${
                        row.isCurrent ? 'bg-white/[0.04] border border-white/[0.06]' : ''
                      }`}
                    >
                      <span className="text-xs text-[#9E9EA7] group-hover:text-white shrink-0 transition-colors">
                        {row.label}
                      </span>
                      <span
                        className={`flex items-center gap-1.5 text-right text-xs font-medium text-white truncate ${
                          row.mono ? 'font-mono tabular-nums' : ''
                        }`}
                      >
                        <span className="truncate">{row.value}</span>
                        <Pencil className="h-3 w-3 text-[#34D399] opacity-75 group-hover:opacity-100 shrink-0" />
                      </span>
                    </button>
                  ) : (
                    <div
                      className={`flex items-baseline justify-between gap-2.5 rounded-xl px-2.5 py-1.5 ${
                        row.isCurrent ? 'bg-white/[0.04] border border-white/[0.06]' : ''
                      }`}
                    >
                      <span className="text-xs text-[#9E9EA7] shrink-0">{row.label}</span>
                      <span
                        className={`text-right text-xs font-medium truncate ${
                          row.completed ? 'text-white' : 'text-[#C084FC]'
                        } ${row.mono ? 'font-mono tabular-nums' : ''}`}
                      >
                        {row.value}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Pricing Footer (with Temporary Test Demo Toggle Breakdown) */}
      <div className="pt-3 border-t border-white/10 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-[#9E9EA7]">
            {lang === 'fr' ? 'Estimation tarifaire' : 'Quote estimate'}
          </span>

          <span className="inline-flex items-center rounded-full border border-[#38BDF8]/30 bg-[#38BDF8]/10 px-2.5 py-0.5 text-xs font-semibold text-[#BAE6FD] backdrop-blur-xs">
            {priceDisplay}
          </span>
        </div>
      </div>
    </motion.aside>
  );
}
