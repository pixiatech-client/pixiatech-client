'use client';

import {
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Clock,
  Truck,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { t } from '../../../core/i18n/translations';
import { computeDemoTestEstimate, formatDemoEuro } from '../../../core/pricing/demo-test-pricing';
import { computeRentalDays } from '../../../core/pricing/pricing-engine';
import { createInitialConfigState } from '../../../core/fsm/pixia-fsm';
import type { BlockedPeriod, Language } from '../../../core/types';

interface RentalCalendarStepProps {
  lang: Language;
  blockedPeriods: BlockedPeriod[];
  isPriceHidden?: boolean;
  demoShowPrices?: boolean;
  sheetContainer?: HTMLElement | null;
  initialStart: string | null;
  initialEnd: string | null;
  initialStartTime: string;
  initialEndTime: string;
  onConfirm: (payload: {
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
  }) => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatReadableDate(iso: string, lang: Language): string {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatSlashDate(iso: string): string {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function formatDisplayTime(hhmm: string): string {
  const [hh = '08', mm = '00'] = hhmm.split(':');
  return `${hh}h${mm}`;
}

function isDateBlocked(iso: string, blockedPeriods: BlockedPeriod[]): BlockedPeriod | undefined {
  return blockedPeriods.find((b) => iso >= b.from && iso <= b.to);
}

function overlapsBlockedPeriod(
  start: string,
  end: string,
  blockedPeriods: BlockedPeriod[]
): BlockedPeriod | undefined {
  return blockedPeriods.find((b) => !(end < b.from || start > b.to));
}

export function RentalCalendarStep({
  lang,
  blockedPeriods,
  isPriceHidden = false,
  demoShowPrices = false,
  sheetContainer,
  initialStart,
  initialEnd,
  initialStartTime,
  initialEndTime,
  onConfirm,
}: RentalCalendarStepProps) {
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);
  const todayIso = toIsoDate(todayDate);

  const safeInitialStart = initialStart && initialStart > todayIso ? initialStart : '';
  const safeInitialEnd =
    safeInitialStart && initialEnd && initialEnd >= safeInitialStart ? initialEnd : '';

  const [viewYear, setViewYear] = useState(() => {
    if (safeInitialStart) return Number(safeInitialStart.slice(0, 4));
    return todayDate.getFullYear();
  });
  const [viewMonth, setViewMonth] = useState(() => {
    if (safeInitialStart) return Number(safeInitialStart.slice(5, 7)) - 1;
    return todayDate.getMonth();
  });

  const [startDate, setStartDate] = useState(safeInitialStart);
  const [endDate, setEndDate] = useState(safeInitialEnd);
  const [startTime, setStartTime] = useState(initialStartTime || '08:00');
  const [endTime, setEndTime] = useState(initialEndTime || '18:00');
  const [calendarOpen, setCalendarOpen] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Bottom-up custom time sheet state
  const [activeTimeTarget, setActiveTimeTarget] = useState<'start' | 'end' | null>(null);
  const [draftHour, setDraftHour] = useState('08');
  const [draftMinute, setDraftMinute] = useState('00');

  const hoursListRef = useRef<HTMLDivElement | null>(null);
  const minutesListRef = useRef<HTMLDivElement | null>(null);

  const weekdays =
    lang === 'fr'
      ? ['LU', 'MA', 'ME', 'JE', 'VE', 'SA', 'DI']
      : ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];

  const monthTitle = useMemo(() => {
    const dt = new Date(viewYear, viewMonth, 1);
    const label = dt.toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', {
      month: 'long',
      year: 'numeric',
    });
    return label.charAt(0).toUpperCase() + label.slice(1);
  }, [viewYear, viewMonth, lang]);

  const calendarCells = useMemo(() => {
    const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
    const startOffset = (firstDayOfMonth.getDay() + 6) % 7;
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: Array<{ day: number; iso: string } | null> = [];
    for (let i = 0; i < startOffset; i += 1) cells.push(null);
    for (let d = 1; d <= daysInMonth; d += 1) {
      cells.push({
        day: d,
        iso: `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      });
    }
    return cells;
  }, [viewYear, viewMonth]);

  const openTimeDrawer = (target: 'start' | 'end') => {
    const current = target === 'start' ? startTime : endTime;
    const [hh = '08', mm = '00'] = current.split(':');
    setDraftHour(hh);
    setDraftMinute(mm);
    setActiveTimeTarget(target);
  };

  useEffect(() => {
    if (!activeTimeTarget) return;
    const scrollId = window.requestAnimationFrame(() => {
      const hourEl = hoursListRef.current?.querySelector(`[data-hour="${draftHour}"]`) as HTMLElement | null;
      const minEl = minutesListRef.current?.querySelector(`[data-minute="${draftMinute}"]`) as HTMLElement | null;
      hourEl?.scrollIntoView({ block: 'center' });
      minEl?.scrollIntoView({ block: 'center' });
    });
    return () => window.cancelAnimationFrame(scrollId);
  }, [activeTimeTarget, draftHour, draftMinute]);

  const applyDraftTime = () => {
    const formatted = `${draftHour}:${draftMinute}`;
    if (activeTimeTarget === 'start') setStartTime(formatted);
    else if (activeTimeTarget === 'end') setEndTime(formatted);
    setActiveTimeTarget(null);
  };

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handlePrevYear = () => {
    setViewYear((y) => Math.max(todayDate.getFullYear(), y - 1));
  };

  const handleNextYear = () => {
    setViewYear((y) => y + 1);
  };

  const handleDayClick = (iso: string) => {
    // Same-day (today) and past dates are strictly disabled
    if (iso <= todayIso) return;
    const blocked = isDateBlocked(iso, blockedPeriods);
    if (blocked) {
      setError(
        lang === 'fr'
          ? `Date indisponible : ${blocked.reasonFr}`
          : `Unavailable date: ${blocked.reasonEn}`
      );
      return;
    }

    setError(null);

    // First click (or restarting a finished range): set startDate and clear endDate
    if (!startDate || (startDate && endDate)) {
      setStartDate(iso);
      setEndDate('');
      return;
    }

    // Second click across any future month/year (or clicking same day for 1-day rental)
    const nextStart = iso < startDate ? iso : startDate;
    const nextEnd = iso < startDate ? startDate : iso;
    const conflict = overlapsBlockedPeriod(nextStart, nextEnd, blockedPeriods);
    if (conflict) {
      setError(
        lang === 'fr'
          ? `Plage impossible (${conflict.from} → ${conflict.to} : ${conflict.reasonFr}).`
          : `Range overlaps blocked period (${conflict.from} → ${conflict.to}: ${conflict.reasonEn}).`
      );
      return;
    }
    setStartDate(nextStart);
    setEndDate(nextEnd);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || startDate <= todayIso) {
      setError(t(lang, 'bot.errorDatesInvalid'));
      return;
    }
    const resolvedEnd = endDate && endDate >= startDate ? endDate : startDate;
    const conflict = overlapsBlockedPeriod(startDate, resolvedEnd, blockedPeriods);
    if (conflict) {
      setError(
        lang === 'fr'
          ? `Période indisponible (${conflict.from} → ${conflict.to} : ${conflict.reasonFr}).`
          : `Unavailable period (${conflict.from} → ${conflict.to}: ${conflict.reasonEn}).`
      );
      return;
    }
    setError(null);
    onConfirm({ startDate, endDate: resolvedEnd, startTime, endTime });
  };

  const hasSelection = Boolean(startDate);
  const effectiveEndDate = startDate
    ? endDate && endDate >= startDate
      ? endDate
      : startDate
    : '';
  const isSingleDay = Boolean(startDate && effectiveEndDate === startDate);
  const daysCount = startDate ? computeRentalDays(startDate, effectiveEndDate) : 0;

  const demoRentalEstimate =
    demoShowPrices && startDate
      ? computeDemoTestEstimate({
          configState: {
            ...createInitialConfigState(),
            projectType: 'location',
            rentalStartDate: startDate,
            rentalEndDate: effectiveEndDate,
          },
          includeDelivery: true,
          includeInstallation: null,
        })
      : null;

  const bottomTimeSheet = (
    <AnimatePresence>
      {activeTimeTarget && (
        <motion.div
          key="time-drawer-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={() => setActiveTimeTarget(null)}
          className={`${
            sheetContainer ? 'absolute' : 'fixed'
          } inset-0 z-40 flex flex-col justify-end bg-black/60 backdrop-blur-[2px]`}
        >
          <motion.div
            key="time-drawer-sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 330, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full rounded-t-[24px] border-t border-white/15 bg-[#17171B] px-4 pt-3 pb-4 shadow-[0_-18px_45px_rgba(0,0,0,0.72)]"
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/20" />

            <div className="flex items-center justify-between gap-2 pb-3 border-b border-white/10">
              <div>
                <p className="text-[11px] font-semibold tracking-wider uppercase text-[#A1A1AA]">
                  {activeTimeTarget === 'start'
                    ? lang === 'fr'
                      ? 'Heure début'
                      : 'Start time'
                    : lang === 'fr'
                      ? 'Heure fin'
                      : 'End time'}
                </p>
                <p className="text-base font-bold font-mono tabular-nums text-white mt-0.5">
                  {draftHour}h{draftMinute}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTimeTarget(null)}
                  aria-label={lang === 'fr' ? 'Fermer' : 'Close'}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/12 bg-white/5 text-[#A1A1AA] hover:text-white cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={applyDraftTime}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-semibold text-[#141416] hover:bg-[#E4E4E7] cursor-pointer"
                >
                  <Check className="h-3.5 w-3.5" />
                  {lang === 'fr' ? 'Valider' : 'Done'}
                </button>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <p className="mb-1.5 text-center text-[10px] font-semibold uppercase tracking-wider text-[#71717A]">
                  {lang === 'fr' ? 'Heures' : 'Hours'}
                </p>
                <div
                  ref={hoursListRef}
                  className="h-44 overflow-y-auto rounded-xl border border-white/8 bg-[#101013] p-1 space-y-0.5"
                >
                  {HOURS.map((hh) => {
                    const active = hh === draftHour;
                    return (
                      <button
                        key={hh}
                        type="button"
                        data-hour={hh}
                        onClick={() => setDraftHour(hh)}
                        className={`w-full rounded-lg py-2 text-center text-xs font-mono tabular-nums transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#38BDF8] text-[#0B1120] font-bold shadow-[0_0_12px_rgba(56,189,248,0.4)]'
                            : 'text-[#D4D4D8] hover:bg-white/8'
                        }`}
                      >
                        {hh}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="mb-1.5 text-center text-[10px] font-semibold uppercase tracking-wider text-[#71717A]">
                  {lang === 'fr' ? 'Minutes' : 'Minutes'}
                </p>
                <div
                  ref={minutesListRef}
                  className="h-44 overflow-y-auto rounded-xl border border-white/8 bg-[#101013] p-1 space-y-0.5"
                >
                  {MINUTES.map((mm) => {
                    const active = mm === draftMinute;
                    return (
                      <button
                        key={mm}
                        type="button"
                        data-minute={mm}
                        onClick={() => setDraftMinute(mm)}
                        className={`w-full rounded-lg py-2 text-center text-xs font-mono tabular-nums transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#38BDF8] text-[#0B1120] font-bold shadow-[0_0_12px_rgba(56,189,248,0.4)]'
                            : 'text-[#D4D4D8] hover:bg-white/8'
                        }`}
                      >
                        {mm}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-2.5">
      {/* Custom Dark Inline Calendar */}
      <div className="rounded-2xl border border-white/10 bg-[#1B1B20] overflow-hidden shadow-[0_14px_35px_rgba(0,0,0,0.45)]">
        <button
          type="button"
          onClick={() => setCalendarOpen((o) => !o)}
          className="w-full px-3.5 py-2.5 flex items-center justify-between gap-2 border-b border-white/8 text-left hover:bg-white/[0.02] transition-colors cursor-pointer"
        >
          <span className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-wider uppercase text-[#A1A1AA] shrink-0">
            <CalendarDays className="h-3.5 w-3.5 text-[#38BDF8]" />
            {lang === 'fr' ? 'Période' : 'Period'}
          </span>

          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-white truncate">
            {startDate
              ? endDate && endDate !== startDate
                ? `${formatReadableDate(startDate, lang)} → ${formatReadableDate(endDate, lang)}`
                : `${formatReadableDate(startDate, lang)} (${lang === 'fr' ? '1 j' : '1 d'})`
              : lang === 'fr'
                ? 'Choisir les dates'
                : 'Select dates'}
            <ChevronDown
              className={`h-3.5 w-3.5 text-[#94A3B8] transition-transform shrink-0 ${
                calendarOpen ? 'rotate-180' : ''
              }`}
            />
          </span>
        </button>

        {calendarOpen && (
          <div className="p-2.5 space-y-2">
            {/* Month & Year Navigation Header */}
            <div className="flex items-center justify-between gap-1 px-0.5">
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={handlePrevYear}
                  aria-label={lang === 'fr' ? 'Année précédente' : 'Previous year'}
                  title={lang === 'fr' ? 'Année précédente' : 'Previous year'}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-[#64748B] hover:bg-white/8 hover:text-white cursor-pointer"
                >
                  <ChevronsLeft className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  aria-label={lang === 'fr' ? 'Mois précédent' : 'Previous month'}
                  title={lang === 'fr' ? 'Mois précédent' : 'Previous month'}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-[#94A3B8] hover:bg-white/8 hover:text-white cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              </div>

              <span className="text-xs font-semibold text-white">{monthTitle}</span>

              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={handleNextMonth}
                  aria-label={lang === 'fr' ? 'Mois suivant' : 'Next month'}
                  title={lang === 'fr' ? 'Mois suivant' : 'Next month'}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-[#94A3B8] hover:bg-white/8 hover:text-white cursor-pointer"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNextYear}
                  aria-label={lang === 'fr' ? 'Année suivante' : 'Next year'}
                  title={lang === 'fr' ? 'Année suivante' : 'Next year'}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-[#64748B] hover:bg-white/8 hover:text-white cursor-pointer"
                >
                  <ChevronsRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Weekdays */}
            <div className="grid grid-cols-7 text-center text-[10px] font-semibold tracking-wider text-[#64748B]">
              {weekdays.map((w) => (
                <span key={w} className="py-0.5">
                  {w}
                </span>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-y-0.5 text-center">
              {calendarCells.map((cell, idx) => {
                if (!cell) return <span key={`empty-${idx}`} />;
                const { day, iso } = cell;
                const isPastOrToday = iso <= todayIso;
                const blocked = isDateBlocked(iso, blockedPeriods);
                const isToday = iso === todayIso;
                const isDisabled = isPastOrToday || Boolean(blocked);
                const isStart = iso === startDate;
                const isEnd = iso === endDate && Boolean(endDate);
                const isInRange =
                  Boolean(startDate && endDate) && iso > startDate && iso < endDate;

                return (
                  <button
                    key={iso}
                    type="button"
                    disabled={isDisabled}
                    title={
                      blocked
                        ? lang === 'fr'
                          ? blocked.reasonFr
                          : blocked.reasonEn
                        : isToday
                          ? lang === 'fr'
                            ? 'Indisponible le jour même'
                            : 'Same-day booking unavailable'
                          : undefined
                    }
                    onClick={() => handleDayClick(iso)}
                    className={`relative h-7 w-full text-xs font-mono tabular-nums flex items-center justify-center transition-all ${
                      isToday
                        ? 'text-[#52525B] border border-white/10 rounded-full cursor-not-allowed line-through'
                        : isDisabled
                          ? 'text-[#3F3F46] cursor-not-allowed'
                          : isStart || isEnd
                            ? 'bg-[#38BDF8] text-[#0B1120] font-bold rounded-full shadow-[0_0_14px_rgba(56,189,248,0.45)] cursor-pointer'
                            : isInRange
                              ? 'bg-[#38BDF8]/18 text-[#E0F2FE] rounded-md cursor-pointer'
                              : 'text-[#D4D4D8] rounded-full hover:bg-white/10 cursor-pointer'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            {/* Bottom bar inside calendar */}
            <div className="pt-2 border-t border-white/8 flex items-center justify-between gap-2 text-[11px]">
              <div className="text-[#A1A1AA] truncate">
                {startDate && !endDate ? (
                  <span className="text-[#93C5FD]">
                    {lang === 'fr'
                      ? '1 jour sélectionné (ou cliquez une 2e date)'
                      : '1 day selected (or pick end date)'}
                  </span>
                ) : (
                  <>
                    <span>{lang === 'fr' ? 'Début : ' : 'Start: '}</span>
                    <strong className="text-white font-medium">
                      {startDate ? formatReadableDate(startDate, lang) : '—'}
                    </strong>
                    {endDate && endDate !== startDate && (
                      <>
                        <span className="mx-1.5">·</span>
                        <span>{lang === 'fr' ? 'Fin : ' : 'End: '}</span>
                        <strong className="text-white font-medium">
                          {formatReadableDate(endDate, lang)}
                        </strong>
                      </>
                    )}
                  </>
                )}
              </div>

              <button
                type="button"
                disabled={!hasSelection}
                onClick={() => setCalendarOpen(false)}
                className="rounded-full bg-white px-3.5 py-1 text-[11px] font-semibold text-[#141416] hover:bg-[#E4E4E7] disabled:opacity-40 cursor-pointer shrink-0"
              >
                {lang === 'fr' ? 'Valider' : 'Done'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Custom Time Selectors opening Bottom-Up Dark Drawer */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="space-y-1">
          <span className="block text-[10.5px] font-semibold tracking-wider uppercase text-[#A1A1AA]">
            {lang === 'fr' ? 'Heure début *' : 'Start time *'}
          </span>
          <button
            type="button"
            onClick={() => openTimeDrawer('start')}
            className="w-full rounded-xl border border-white/10 bg-[#1B1B20] px-3 py-2 text-xs font-mono tabular-nums text-white hover:border-[#38BDF8]/60 focus:border-[#38BDF8] focus:outline-none flex items-center justify-between transition-colors cursor-pointer"
          >
            <span>{formatDisplayTime(startTime)}</span>
            <Clock className="h-3.5 w-3.5 text-[#71717A]" />
          </button>
        </div>

        <div className="space-y-1">
          <span className="block text-[10.5px] font-semibold tracking-wider uppercase text-[#A1A1AA]">
            {lang === 'fr' ? 'Heure fin *' : 'End time *'}
          </span>
          <button
            type="button"
            onClick={() => openTimeDrawer('end')}
            className="w-full rounded-xl border border-white/10 bg-[#1B1B20] px-3 py-2 text-xs font-mono tabular-nums text-white hover:border-[#38BDF8]/60 focus:border-[#38BDF8] focus:outline-none flex items-center justify-between transition-colors cursor-pointer"
          >
            <span>{formatDisplayTime(endTime)}</span>
            <Clock className="h-3.5 w-3.5 text-[#71717A]" />
          </button>
        </div>
      </div>

      {/* Emerald Period Summary Card (enabled immediately on 1+ day selected) */}
      {hasSelection && (
        <div className="rounded-2xl border border-[#10B981]/35 bg-[#064E3B]/20 p-3 space-y-1.5 text-xs">
          <p className="text-[10.5px] font-bold tracking-wider uppercase text-[#34D399]">
            {lang === 'fr' ? 'Détail de la période' : 'Period summary'}
          </p>
          <p className="text-[#D1FAE5]">
            {isSingleDay
              ? lang === 'fr'
                ? `Location le ${formatSlashDate(startDate)}`
                : `Rental on ${formatSlashDate(startDate)}`
              : lang === 'fr'
                ? `Location du ${formatSlashDate(startDate)} au ${formatSlashDate(effectiveEndDate)}`
                : `Rental from ${formatSlashDate(startDate)} to ${formatSlashDate(effectiveEndDate)}`}
          </p>
          <p className="font-mono font-semibold tabular-nums text-[#6EE7B7]">
            {daysCount} {lang === 'fr' ? (daysCount > 1 ? 'jours' : 'jour') : daysCount > 1 ? 'days' : 'day'}{' '}
            · {formatDisplayTime(startTime)} → {formatDisplayTime(endTime)}
          </p>
          <div className="pt-1.5 border-t border-[#10B981]/25 space-y-1">
            <div className="flex items-center justify-between font-semibold text-white">
              <span>{lang === 'fr' ? 'Total location' : 'Rental total'}</span>
              <span className="text-[#34D399] font-mono tabular-nums">
                {demoRentalEstimate
                  ? formatDemoEuro(demoRentalEstimate.productGlobalPrice, lang)
                  : isPriceHidden
                    ? t(lang, 'ui.priceHidden')
                    : t(lang, 'ui.onQuote')}
              </span>
            </div>
            <div className="flex items-center justify-between text-[#A7F3D0]">
              <span className="inline-flex items-center gap-1.5">
                <Truck className="h-3.5 w-3.5" />
                {lang === 'fr' ? 'Livraison' : 'Delivery'}
              </span>
              <span className="font-mono tabular-nums">
                {demoRentalEstimate
                  ? formatDemoEuro(demoRentalEstimate.deliveryPrice, lang)
                  : lang === 'fr'
                    ? 'À confirmer'
                    : 'To confirm'}
              </span>
            </div>
          </div>
        </div>
      )}

      {error && <p className="text-xs font-medium text-[#FB7185]">{error}</p>}

      <button
        type="submit"
        disabled={!hasSelection}
        className="w-full rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#141416] hover:bg-[#E4E4E7] disabled:opacity-45 transition-colors cursor-pointer min-h-[42px]"
      >
        {t(lang, 'ui.validatePeriod')}
      </button>

      {sheetContainer ? createPortal(bottomTimeSheet, sheetContainer) : bottomTimeSheet}
    </form>
  );
}
