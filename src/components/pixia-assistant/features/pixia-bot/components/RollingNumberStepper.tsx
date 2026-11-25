'use client';

import { Minus, Plus } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef } from 'react';

interface RollingNumberStepperProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  onChange: (nextValue: number) => void;
  ariaLabel?: string;
  compact?: boolean;
}

export function RollingNumberStepper({
  value,
  min = 1,
  max = 999,
  step = 1,
  unit,
  onChange,
  ariaLabel,
  compact = false,
}: RollingNumberStepperProps) {
  const prevValueRef = useRef(value);
  const direction = value >= prevValueRef.current ? 1 : -1;

  useEffect(() => {
    prevValueRef.current = value;
  }, [value]);

  const formatNum = (n: number) => {
    const rounded = Math.round(n * 100) / 100;
    return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  };

  const formatted = formatNum(value);
  const chars = formatted.split('');

  const handleDecrement = () => {
    const next = Math.max(min, Math.round((value - step) * 100) / 100);
    onChange(next);
  };

  const handleIncrement = () => {
    const next = Math.min(max, Math.round((value + step) * 100) / 100);
    onChange(next);
  };

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={`inline-flex items-center justify-between rounded-xl border border-white/12 bg-[#141417] ${
        compact ? 'h-9 px-1 gap-1' : 'h-11 px-1.5 gap-2'
      }`}
    >
      <button
        type="button"
        onClick={handleDecrement}
        disabled={value <= min}
        aria-label="Diminuer"
        className={`inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/[0.06] text-white hover:bg-white/15 active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer ${
          compact ? 'h-7 w-7' : 'h-8 w-8'
        }`}
      >
        <Minus className="h-3.5 w-3.5" />
      </button>

      {/* Rolling animated characters (Animorio upward/downward digit roll) */}
      <div
        className={`relative flex items-center justify-center overflow-hidden font-mono font-semibold tabular-nums text-white select-none ${
          compact ? 'min-w-[46px] text-xs px-1' : 'min-w-[54px] text-sm px-2'
        }`}
      >
        <div className="inline-flex items-center">
          {chars.map((ch, idx) => (
            <span
              key={`slot-${idx}`}
              className="relative inline-flex h-5 items-center justify-center overflow-hidden"
            >
              <AnimatePresence mode="popLayout" initial={false} custom={direction}>
                <motion.span
                  key={`${idx}-${ch}`}
                  custom={direction}
                  initial={{ y: direction > 0 ? 14 : -14, opacity: 0, filter: 'blur(2px)' }}
                  animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                  exit={{ y: direction > 0 ? -14 : 14, opacity: 0, filter: 'blur(2px)' }}
                  transition={{ type: 'spring', stiffness: 420, damping: 28, mass: 0.6 }}
                  className="inline-block leading-none"
                >
                  {ch}
                </motion.span>
              </AnimatePresence>
            </span>
          ))}
          {unit && <span className="ml-1 text-[11px] font-normal text-[#8E8E98]">{unit}</span>}
        </div>
      </div>

      <button
        type="button"
        onClick={handleIncrement}
        disabled={value >= max}
        aria-label="Augmenter"
        className={`inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/[0.06] text-white hover:bg-white/15 active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer ${
          compact ? 'h-7 w-7' : 'h-8 w-8'
        }`}
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
