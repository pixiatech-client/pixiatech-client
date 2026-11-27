import { useRef } from 'react';
import { motion } from 'motion/react';
import { RollingNumber } from './KineticTierSlider';

interface SpringValueSliderProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  displayValue: string;
  unit: string;
  accent?: 'amber' | 'blue';
  onChange: (nextValue: number) => void;
}

export function SpringValueSlider({
  id,
  label,
  value,
  min,
  max,
  step,
  displayValue,
  unit,
  accent = 'amber',
  onChange,
}: SpringValueSliderProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);

  const clamped = Math.max(min, Math.min(max, value));
  const ratio = max > min ? (clamped - min) / (max - min) : 0;
  const pct = ratio * 100;

  const snapValue = (raw: number) => {
    const stepped = Math.round((raw - min) / step) * step + min;
    const decimals = (step.toString().split('.')[1] || '').length;
    return Number(Math.max(min, Math.min(max, stepped)).toFixed(decimals));
  };

  const updateFromPointer = (clientX: number) => {
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const r = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const next = snapValue(min + r * (max - min));
    if (next !== value) {
      onChange(next);
    }
  };

  const barStyle =
    accent === 'amber'
      ? {
          background:
            'linear-gradient(90deg, rgba(107,166,255,0.35) 0%, rgba(var(--tessera-accent-rgb),0.68) 65%, rgba(var(--tessera-accent-rgb),0.95) 100%)',
        }
      : {
          background:
            'linear-gradient(90deg, rgba(56,189,248,0.30) 0%, rgba(107,166,255,0.65) 65%, rgba(107,166,255,0.92) 100%)',
        };

  const pillBorder =
    accent === 'amber' ? 'border-[var(--tessera-accent)]' : 'border-[#6BA6FF]';

  const valueColor =
    accent === 'amber' ? 'text-[var(--tessera-accent)]' : 'text-[#6BA6FF]';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between px-0.5 text-[11px]">
        <label htmlFor={id} className="font-medium text-[#B4BAC6]">
          {label}
        </label>
        <div className="inline-flex items-baseline gap-1 font-mono tabular-nums">
          <RollingNumber value={displayValue} className={`text-xs font-semibold ${valueColor}`} />
          <span className="text-[10px] text-[#8E95A3]">{unit}</span>
        </div>
      </div>

      <div
        id={id}
        ref={trackRef}
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={clamped}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          updateFromPointer(e.clientX);
        }}
        onPointerMove={(e) => {
          if (e.buttons === 1 || e.currentTarget.hasPointerCapture(e.pointerId)) {
            updateFromPointer(e.clientX);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
            e.preventDefault();
            onChange(snapValue(clamped + step));
          } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
            e.preventDefault();
            onChange(snapValue(clamped - step));
          }
        }}
        className="relative h-7 w-full rounded-xl tessera-glass-well p-1 flex items-center cursor-pointer touch-none overflow-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--tessera-accent)]"
      >
        {/* Living Gradient Bar Fill */}
        <motion.div
          animate={{ width: `${Math.max(4, pct)}%` }}
          transition={{ type: 'spring', stiffness: 360, damping: 32 }}
          style={barStyle}
          className="h-full rounded-lg pointer-events-none"
        />

        {/* Subtle Tick Marks */}
        <div className="absolute inset-x-3 flex justify-between pointer-events-none">
          {[0, 1, 2, 3, 4].map((tick) => (
            <span key={tick} className="w-0.5 h-1.5 rounded-full bg-white/15" />
          ))}
        </div>

        {/* Rounded Spring-Animated Magnetic Pill Handle */}
        <motion.div
          animate={{ left: `calc(${pct}% - ${pct * 0.16}px)` }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className={`absolute top-1 bottom-1 w-4 rounded-lg bg-[#F4F4F5] border-2 ${pillBorder} shadow-md pointer-events-none`}
        />
      </div>
    </div>
  );
}
