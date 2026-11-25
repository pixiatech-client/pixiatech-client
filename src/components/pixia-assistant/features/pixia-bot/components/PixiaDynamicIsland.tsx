'use client';

import { ChevronUp, Pencil, X } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion, type Transition } from 'framer-motion';
import { useEffect, useState } from 'react';
import { t } from '../../../core/i18n/translations';
import type { BootstrapPayload, STEP } from '../../../core/types';
import type { PixiaEngineState } from '../pixia-fsm-bridge';
import { buildSpecificationTimeline } from './SpecificationSummary';

const SPRING_ISLAND_OPEN: Transition = {
  type: 'spring',
  stiffness: 380,
  damping: 32,
  mass: 0.9,
};
const SPRING_SWAP: Transition = {
  type: 'spring',
  stiffness: 420,
  damping: 26,
  mass: 0.72,
};
const TWEEN_SWAP_ENTER: Transition = { duration: 0.2, ease: [0.22, 1, 0.36, 1] };
const TWEEN_SWAP_LEAVE: Transition = { duration: 0.14, ease: [0.4, 0, 1, 1] };

const pad2 = (n: number) => String(Math.max(0, n)).padStart(2, '0');

/** Rolling numeric slot: old digit jumps/blurs upward as the new digit springs up from below. */
function RollingDigit({ digit, widthClass = 'w-[8px]' }: { digit: string; widthClass?: string }) {
  const reduced = useReducedMotion();
  return (
    <span className={`relative inline-flex justify-center overflow-hidden tabular-nums ${widthClass}`}>
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={digit}
          className="inline-block"
          initial={reduced ? false : { y: 12, opacity: 0, filter: 'blur(4px)' }}
          animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
          exit={reduced ? { opacity: 0 } : { y: -12, opacity: 0, filter: 'blur(4px)' }}
          transition={reduced ? { duration: 0 } : SPRING_SWAP}
        >
          {digit}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

interface PixiaDynamicIslandPillProps {
  engine: PixiaEngineState;
  bootstrap: BootstrapPayload;
  expanded: boolean;
  onToggle: () => void;
}

/** Slim 28px-tall (CALL-sized) integrated frosted-glass Dynamic Island pill (Mobile / Compact). */
export function PixiaDynamicIslandPill({
  engine,
  bootstrap,
  expanded,
  onToggle,
}: PixiaDynamicIslandPillProps) {
  const reduced = useReducedMotion();
  const { lang } = engine;
  const { currentRow, progress } = buildSpecificationTimeline(engine, bootstrap);
  const ActiveIcon = currentRow.icon;
  const stepDigits = pad2(progress.current);
  const [stepPulse, setStepPulse] = useState(0);

  useEffect(() => {
    setStepPulse((n) => n + 1);
  }, [progress.current]);

  if (expanded) {
    return <div aria-hidden="true" className="h-7 w-[148px] sm:w-[172px] shrink-0" />;
  }

  return (
    <motion.button
      type="button"
      layoutId="pixia-dynamic-island"
      animate={
        reduced || stepPulse <= 1
          ? { scale: 1 }
          : { scale: [1, 1.06, 1] }
      }
      transition={{
        layout: reduced ? { duration: 0 } : SPRING_ISLAND_OPEN,
        scale: { duration: 0.34, ease: [0.22, 1, 0.36, 1] },
      }}
      onClick={onToggle}
      aria-expanded={false}
      aria-label={
        lang === 'fr'
          ? `Afficher la fiche technique (${currentRow.label})`
          : `Show technical sheet (${currentRow.label})`
      }
      style={{ borderRadius: 32 }}
      className="group relative flex h-7 max-w-[168px] sm:max-w-[200px] items-center gap-1.5 sm:gap-2 overflow-hidden border border-white/10 bg-white/[0.06] px-2 sm:px-2.5 text-[#F4F4F5] backdrop-blur-md hover:bg-white/[0.11] hover:border-white/20 transition-colors cursor-pointer pointer-events-auto shrink-0"
    >
      {/* Tiny section icon badge */}
      <span
        className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-[5px] border transition-colors ${
          currentRow.completed
            ? 'border-[#34D399]/50 bg-[#0F2A1F]/80 text-[#34D399]'
            : 'border-white/15 bg-white/[0.06] text-[#C084FC]'
        }`}
      >
        <ActiveIcon className="h-2.5 w-2.5" />
      </span>

      {/* Rolling step number */}
      <span className="inline-flex items-center text-[11px] font-semibold font-mono text-[#34D399] tabular-nums shrink-0">
        <RollingDigit digit={stepDigits[0]} widthClass="w-[7px]" />
        <RollingDigit digit={stepDigits[1]} widthClass="w-[7px]" />
      </span>

      {/* Current stage label */}
      <span className="min-w-0 flex-1 overflow-hidden text-left">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span
            key={currentRow.key + currentRow.shortLabel}
            initial={reduced ? false : { opacity: 0, y: 6, filter: 'blur(3px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: -6, filter: 'blur(3px)' }}
            transition={reduced ? { duration: 0 } : TWEEN_SWAP_ENTER}
            className="block truncate text-[11px] font-medium text-[#E4E4E7]"
          >
            {currentRow.shortLabel}
          </motion.span>
        </AnimatePresence>
      </span>
    </motion.button>
  );
}

interface PixiaDynamicIslandExpandedProps {
  engine: PixiaEngineState;
  bootstrap: BootstrapPayload;
  onClose: () => void;
  onEditStep?: (step: STEP) => void;
}

export function PixiaDynamicIslandExpanded({
  engine,
  bootstrap,
  onClose,
  onEditStep,
}: PixiaDynamicIslandExpandedProps) {
  const reduced = useReducedMotion();
  const { lang } = engine;
  const {
    rows,
    currentRow,
    completedCount,
    progress,
    pct,
    priceDisplay,
    isLockedPostContract,
    visitedSteps,
  } = buildSpecificationTimeline(engine, bootstrap);

  const ActiveIcon = currentRow.icon;
  const stepDigits = pad2(progress.current);
  const totalDigits = pad2(progress.total);
  const fullLineRatio = Math.min(1, completedCount / Math.max(1, rows.length - 0.5));

  return (
    <motion.div
      layoutId="pixia-dynamic-island"
      transition={reduced ? { duration: 0 } : SPRING_ISLAND_OPEN}
      role="dialog"
      aria-modal="true"
      aria-label={t(lang, 'ui.summaryTitle')}
      style={{ borderRadius: 26 }}
      className="absolute inset-2 z-50 flex flex-col overflow-hidden border border-white/14 bg-[#17171C]/96 text-[#F4F4F5] shadow-[0_26px_80px_rgba(0,0,0,0.88),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-2xl"
    >
      {/* Top Interactive Island Bar */}
      <button
        type="button"
        onClick={onClose}
        aria-label={lang === 'fr' ? 'Réduire la fiche technique' : 'Collapse specs sheet'}
        className="w-full flex items-center justify-between gap-2 border-b border-white/10 bg-white/[0.03] px-4 py-3 text-left hover:bg-white/[0.06] transition-colors cursor-pointer shrink-0"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#34D399]/50 bg-[#0F2A1F] text-[#34D399]">
            <ActiveIcon className="h-3.5 w-3.5" />
          </span>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-white truncate">
                {t(lang, 'ui.summaryTitle')}
              </span>
              <span className="inline-flex items-center text-[11px] font-mono font-semibold text-[#34D399] tabular-nums">
                <RollingDigit digit={stepDigits[0]} widthClass="w-[7px]" />
                <RollingDigit digit={stepDigits[1]} widthClass="w-[7px]" />
                <span className="mx-0.5 text-[#71717A]">/</span>
                <span className="text-[#A1A1AA]">{totalDigits}</span>
              </span>
            </div>
            <p className="text-[10.5px] text-[#9E9EA7] truncate">
              {currentRow.label} · {currentRow.value}
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/8 px-2.5 py-1 text-[11px] font-medium text-white shrink-0">
          <ChevronUp className="h-3 w-3" />
          <span>{lang === 'fr' ? 'Masquer' : 'Hide'}</span>
          <X className="h-3 w-3 text-[#A1A1AA]" />
        </span>
      </button>

      {/* Progress Bar */}
      <motion.div
        initial={reduced ? false : { opacity: 0, filter: 'blur(4px)' }}
        animate={{ opacity: 1, filter: 'blur(0px)' }}
        exit={reduced ? { opacity: 0 } : { opacity: 0, filter: 'blur(4px)', transition: TWEEN_SWAP_LEAVE }}
        transition={{ ...TWEEN_SWAP_ENTER, delay: 0.04 }}
        className="px-4 pt-3 pb-2 shrink-0"
      >
        <div className="flex items-center justify-between text-[11px] text-[#A1A1AA] mb-1.5">
          <span>
            {completedCount}/{rows.length}{' '}
            {lang === 'fr' ? 'sections complétées' : 'sections completed'}
          </span>
          <span className="font-mono tabular-nums text-[#34D399]">{pct}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-[#3f9b78] via-[#10B981] to-[#6EE7B7]"
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </motion.div>

      {/* Scrollable All-Steps Overview */}
      <motion.div
        initial={reduced ? false : { opacity: 0, y: 8, filter: 'blur(4px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        exit={reduced ? { opacity: 0 } : { opacity: 0, filter: 'blur(4px)', transition: TWEEN_SWAP_LEAVE }}
        transition={{ ...TWEEN_SWAP_ENTER, delay: 0.06 }}
        className="relative flex-1 min-h-0 overflow-y-auto px-4 py-2 space-y-1.5"
      >
        <div className="relative space-y-1.5">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-[13px] top-4 bottom-4 w-[2px] rounded-full bg-white/10 overflow-hidden"
          >
            <motion.div
              className="w-full origin-top rounded-full bg-gradient-to-b from-[#3f9b78] via-[#10B981] to-[#34D399]"
              initial={false}
              animate={{ height: `${Math.round(fullLineRatio * 100)}%` }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>

          {rows.map((row) => {
            const RowIcon = row.icon;
            const canEdit =
              Boolean(onEditStep) &&
              !isLockedPostContract &&
              Boolean(row.editStep && visitedSteps.has(row.editStep));

            return (
              <div key={row.key} className="relative flex items-center gap-2.5 py-0.5">
                <span
                  aria-hidden="true"
                  className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                    row.completed
                      ? 'border-[#34D399]/55 bg-[#0F2A1F] text-[#34D399]'
                      : row.isCurrent
                        ? 'border-[#38BDF8]/65 bg-[#0F2235] text-[#38BDF8]'
                        : 'border-white/10 bg-[#1B1B21] text-[#64748B]'
                  }`}
                >
                  <RowIcon className="h-3.5 w-3.5" />
                </span>

                <div className="min-w-0 flex-1">
                  {canEdit && row.editStep ? (
                    <button
                      type="button"
                      onClick={() => {
                        onEditStep?.(row.editStep!);
                        onClose();
                      }}
                      className={`group w-full flex items-baseline justify-between gap-2 rounded-xl px-2.5 py-1.5 hover:bg-white/[0.07] transition-colors cursor-pointer text-left ${
                        row.isCurrent ? 'bg-white/[0.06] border border-white/10' : ''
                      }`}
                    >
                      <span className="text-xs text-[#A1A1AA] group-hover:text-white shrink-0">
                        {row.label}
                      </span>
                      <span
                        className={`flex items-center gap-1.5 text-right text-xs font-medium text-white truncate ${
                          row.mono ? 'font-mono tabular-nums' : ''
                        }`}
                      >
                        <span className="truncate">{row.value}</span>
                        <Pencil className="h-3 w-3 text-[#34D399] opacity-80 group-hover:opacity-100 shrink-0" />
                      </span>
                    </button>
                  ) : (
                    <div
                      className={`flex items-baseline justify-between gap-2 rounded-xl px-2.5 py-1.5 ${
                        row.isCurrent ? 'bg-white/[0.05] border border-[#38BDF8]/25' : ''
                      }`}
                    >
                      <span
                        className={`text-xs shrink-0 ${
                          row.completed || row.isCurrent ? 'text-[#A1A1AA]' : 'text-[#52525B]'
                        }`}
                      >
                        {row.label}
                      </span>
                      <span
                        className={`text-right text-xs font-medium truncate ${
                          row.completed
                            ? 'text-white'
                            : row.isCurrent
                              ? 'text-[#93C5FD]'
                              : 'text-[#52525B]'
                        } ${row.mono ? 'font-mono tabular-nums' : ''}`}
                      >
                        {row.completed || row.isCurrent
                          ? row.value
                          : lang === 'fr'
                            ? 'À venir'
                            : 'Upcoming'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Footer prix : toujours sur estimation, sans chiffre de démonstration */}
      <div className="border-t border-white/10 bg-[#141418]/90 px-4 py-3 shrink-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] font-medium text-[#9E9EA7]">
            {lang === 'fr' ? 'Estimation tarifaire' : 'Quote estimate'}
          </p>
          <span className="inline-flex items-center rounded-full border border-[#38BDF8]/35 bg-[#38BDF8]/12 px-2.5 py-1 text-xs font-semibold text-[#BAE6FD] shrink-0">
            {priceDisplay}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
