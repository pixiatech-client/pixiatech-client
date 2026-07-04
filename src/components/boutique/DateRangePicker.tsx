'use client';

import { useState, useEffect, useRef } from 'react';
import { CalendarDays, ArrowLeft, ArrowRight } from 'lucide-react';

interface DateRangePickerProps {
  startDate: string;
  endDate?: string;
  onStartDateChange: (v: string) => void;
  onEndDateChange?: (v: string) => void;
  attemptedSubmit?: boolean;
  label?: string;
  mode?: 'range' | 'single';
  singleDate?: string;
  onSingleDateChange?: (v: string) => void;
  className?: string;
}

export default function DateRangePicker({
  startDate, endDate, onStartDateChange, onEndDateChange,
  attemptedSubmit, label, mode = 'range', singleDate, onSingleDateChange,
  className = '',
}: DateRangePickerProps) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();
  const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else { setCurrentMonth(m => m - 1); }
  };
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else { setCurrentMonth(m => m + 1); }
  };

  const isToday = (d: number) => {
    const date = new Date(currentYear, currentMonth, d);
    const t = new Date();
    return date.getDate() === t.getDate() && date.getMonth() === t.getMonth() && date.getFullYear() === t.getFullYear();
  };

  const isPast = (d: number) => {
    const date = new Date(currentYear, currentMonth, d);
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return date.getTime() < t.getTime();
  };

  const isInRange = (d: number) => {
    if (!startDate || !endDate) return false;
    const date = new Date(currentYear, currentMonth, d).toISOString().split('T')[0];
    return date >= startDate && date <= endDate;
  };

  const isStart = (d: number) => {
    return startDate === new Date(currentYear, currentMonth, d).toISOString().split('T')[0];
  };

  const isEnd = (d: number) => {
    return endDate === new Date(currentYear, currentMonth, d).toISOString().split('T')[0];
  };

  const isSelected = (d: number) => {
    if (mode === 'single' && singleDate) {
      return singleDate === new Date(currentYear, currentMonth, d).toISOString().split('T')[0];
    }
    return false;
  };

  const handleDayClick = (d: number) => {
    const dateStr = new Date(currentYear, currentMonth, d).toISOString().split('T')[0];
    if (isPast(d)) return;

    if (mode === 'single') {
      onSingleDateChange?.(dateStr);
      setIsOpen(false);
      return;
    }

    if (!startDate || (startDate && endDate)) {
      onStartDateChange(dateStr);
      onEndDateChange?.('');
    } else {
      if (dateStr < startDate) {
        onStartDateChange(dateStr);
      } else {
        onEndDateChange?.(dateStr);
      }
    }
  };

  const formatLabel = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const blanks = Array.from({ length: firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1 });
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const headerLabel = label || (mode === 'single' ? 'Date' : 'Période');

  const displayValue = mode === 'single' && singleDate ? formatLabel(singleDate)
    : (startDate ? formatLabel(startDate) + (endDate ? ` → ${formatLabel(endDate)}` : '') : '');

  return (
    <div className={`bg-gray-900 rounded-2xl p-5 space-y-4 ${className}`} ref={panelRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2"
      >
        <div className="flex items-center gap-2">
          <CalendarDays size={14} className="text-gray-400" />
          <span className="text-[11px] font-black text-gray-400 uppercase tracking-[0.15em]">{headerLabel}</span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          {displayValue && (
            <span className="text-white font-semibold">{displayValue}</span>
          )}
          <svg className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {!displayValue && (
        <div className="text-gray-500 text-xs text-left -mt-2">
          {mode === 'single' ? 'Sélectionnez une date' : 'Sélectionnez une période'}
        </div>
      )}

      {attemptedSubmit && mode === 'range' && !startDate && <p className="text-red-400 text-[10px] font-bold -mt-2">▲ Requis</p>}
      {attemptedSubmit && mode === 'single' && !singleDate && <p className="text-red-400 text-[10px] font-bold -mt-2">▲ Requis</p>}

      {isOpen && (
        <div className="border-t border-gray-800 pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <button type="button" onClick={prevMonth} className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all">
              <ArrowLeft size={16} />
            </button>
            <span className="text-sm font-bold text-white">{monthNames[currentMonth]} {currentYear}</span>
            <button type="button" onClick={nextMonth} className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all">
              <ArrowRight size={16} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-0.5 text-center">
            {['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'].map(d => (
              <div key={d} className="text-[10px] font-bold text-gray-500 uppercase tracking-wider py-1">{d}</div>
            ))}
            {blanks.map((_, i) => <div key={`b${i}`} />)}
            {days.map(d => {
              const past = isPast(d);
              const inRange = mode === 'range' && isInRange(d);
              const rangeStart = mode === 'range' && isStart(d);
              const rangeEnd = mode === 'range' && isEnd(d);
              const sel = mode === 'single' && isSelected(d);
              const today_ = isToday(d);
              return (
                <button
                  key={d}
                  type="button"
                  disabled={past}
                  onClick={() => handleDayClick(d)}
                  className={`relative text-sm font-medium rounded-lg py-1.5 transition-all ${
                    past ? 'text-gray-700 cursor-not-allowed' :
                    sel || rangeStart || rangeEnd ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-600/30 z-10' :
                    inRange ? 'bg-blue-600/20 text-blue-300' :
                    today_ ? 'text-white ring-1 ring-gray-600' :
                    'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  {d}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-800">
            <div className="flex items-center gap-4 text-[10px] text-gray-500">
              {mode === 'range' && startDate && <span>Début : <span className="text-white font-semibold">{formatLabel(startDate)}</span></span>}
              {mode === 'range' && endDate && <span>Fin : <span className="text-white font-semibold">{formatLabel(endDate)}</span></span>}
              {mode === 'single' && singleDate && <span>Sélection : <span className="text-white font-semibold">{formatLabel(singleDate)}</span></span>}
            </div>
            <button type="button" onClick={() => setIsOpen(false)}
              className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-all">
              Valider
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
