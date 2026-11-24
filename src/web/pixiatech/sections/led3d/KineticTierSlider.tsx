import { useRef } from 'react';
import { motion } from 'framer-motion';

export interface MatrixStep {
  cols: number;
  rows: number;
  tierId: 'studio' | 'galerie' | 'scene' | 'monumental';
}

export const MATRIX_STEPS: MatrixStep[] = [
  { cols: 8, rows: 5, tierId: 'studio' },
  { cols: 9, rows: 5, tierId: 'studio' },
  { cols: 10, rows: 6, tierId: 'studio' },
  { cols: 11, rows: 7, tierId: 'galerie' },
  { cols: 12, rows: 7, tierId: 'galerie' },
  { cols: 13, rows: 8, tierId: 'galerie' },
  { cols: 14, rows: 8, tierId: 'scene' },
  { cols: 15, rows: 9, tierId: 'scene' },
  { cols: 16, rows: 10, tierId: 'scene' },
  { cols: 17, rows: 10, tierId: 'monumental' },
  { cols: 18, rows: 11, tierId: 'monumental' },
  { cols: 19, rows: 11, tierId: 'monumental' },
  { cols: 20, rows: 12, tierId: 'monumental' },
];

interface TierMeta {
  id: MatrixStep['tierId'];
  label: string;
  rangeText: string;
  defaultStepIndex: number;
  startIndex: number;
  endIndex: number;
}

const TIERS: TierMeta[] = [
  { id: 'studio', label: 'Studio', rangeText: '40–60 caissons', defaultStepIndex: 2, startIndex: 0, endIndex: 2 },
  { id: 'galerie', label: 'Galerie', rangeText: '77–104 caissons', defaultStepIndex: 4, startIndex: 3, endIndex: 5 },
  { id: 'scene', label: 'Scène', rangeText: '112–160 caissons', defaultStepIndex: 7, startIndex: 6, endIndex: 8 },
  { id: 'monumental', label: 'Monumental', rangeText: '170–240 caissons', defaultStepIndex: 12, startIndex: 9, endIndex: 12 },
];

const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

function RollingDigit({ char }: { char: string }) {
  const numeric = Number(char);
  if (Number.isNaN(numeric)) {
    return <span className="inline-block">{char}</span>;
  }

  return (
    <span className="inline-block relative h-[1.25em] w-[0.62em] overflow-hidden align-bottom">
      <motion.span
        animate={{ y: `-${numeric * 10}%` }}
        transition={{ type: 'spring', stiffness: 260, damping: 26, mass: 0.75 }}
        className="flex flex-col leading-[1.25em] will-change-transform"
      >
        {DIGITS.map((d) => (
          <span key={d} className="h-[1.25em] flex items-center justify-center">
            {d}
          </span>
        ))}
      </motion.span>
    </span>
  );
}

export function RollingNumber({
  value,
  className = '',
}: {
  value: string;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-baseline font-mono tabular-nums ${className}`}>
      {value.split('').map((ch, idx) => (
        <RollingDigit key={`${idx}-${ch === '.' || ch === ',' ? 'sep' : 'num'}`} char={ch} />
      ))}
    </span>
  );
}

interface KineticTierSliderProps {
  stepIndex: number;
  onChangeStep: (nextIndex: number) => void;
}

export function KineticTierSlider({ stepIndex, onChangeStep }: KineticTierSliderProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);

  const currentStep = MATRIX_STEPS[stepIndex] ?? MATRIX_STEPS[2];
  const cabinets = currentStep.cols * currentStep.rows;
  const surfaceM2 = (cabinets * 0.25).toFixed(1).replace('.', ',');
  const widthM = (currentStep.cols * 0.5).toFixed(1).replace('.', ',');
  const heightM = (currentStep.rows * 0.5).toFixed(1).replace('.', ',');
  const powerKw = ((cabinets * 0.25 * 145) / 1000).toFixed(2).replace('.', ',');

  const activeTierIndex = TIERS.findIndex((t) => t.id === currentStep.tierId);
  const progressPct = (stepIndex / (MATRIX_STEPS.length - 1)) * 100;

  const updateFromPointer = (clientX: number) => {
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const idx = Math.round(ratio * (MATRIX_STEPS.length - 1));
    if (idx !== stepIndex) {
      onChangeStep(idx);
    }
  };

  return (
    <div className="space-y-2">
      {/* Hidden SVG Gooey Filter for Tier-Thumb Liquid Fusion */}
      <svg className="sr-only" width="0" height="0" aria-hidden="true">
        <defs>
          <filter id="tessera-tier-fuse">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

      {/* Top Row: Rolling Odometer Counters */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2.5">
          <span className="text-[11px] text-[#71717A] font-medium">
            Envergure
          </span>
          <span className="font-mono text-[11px] tabular-nums text-[#D4D4D8]">
            {widthM} × {heightM} m ({currentStep.cols}×{currentStep.rows})
          </span>
        </div>

        <div className="flex items-center gap-3.5 font-mono text-xs tabular-nums">
          <div className="flex items-baseline gap-1.5">
            <RollingNumber
              value={String(cabinets)}
              className="text-sm font-semibold text-[#F4F4F5]"
            />
            <span className="text-[11px] text-[#A1A1AA]">caissons</span>
          </div>
          <span className="text-white/20" aria-hidden="true">
            ·
          </span>
          <div className="flex items-baseline gap-1">
            <RollingNumber
              value={surfaceM2}
              className="text-sm font-semibold text-[var(--tessera-accent)]"
            />
            <span className="text-[11px] text-[#A1A1AA]">m²</span>
          </div>
          <span className="hidden sm:inline text-white/20" aria-hidden="true">
            ·
          </span>
          <div className="hidden sm:flex items-baseline gap-1">
            <RollingNumber
              value={powerKw}
              className="text-sm font-semibold text-[#6BA6FF]"
            />
            <span className="text-[11px] text-[#A1A1AA]">kW moy.</span>
          </div>
        </div>
      </div>

      {/* Liquid Morphing Tier Pills (horizontally fusing between 1–2–3–4) */}
      <div className="relative pt-0.5">
        <div
          aria-hidden="true"
          className="relative h-8 pointer-events-none"
          style={{ filter: 'url(#tessera-tier-fuse)' }}
        >
          {/* Primary Active Tier Pill */}
          <motion.div
            animate={{
              left: `${(activeTierIndex / TIERS.length) * 100}%`,
              width: `${100 / TIERS.length}%`,
            }}
            transition={{ type: 'spring', stiffness: 360, damping: 28 }}
            className="absolute top-0 h-8 px-1"
          >
            <div className="w-full h-full rounded-xl bg-[var(--tessera-accent)]" />
          </motion.div>

          {/* Trailing Liquid Droplet Pill (creates horizontal liquid stretch when switching tiers) */}
          <motion.div
            animate={{
              left: `${(activeTierIndex / TIERS.length) * 100}%`,
              width: `${100 / TIERS.length}%`,
            }}
            transition={{ type: 'spring', stiffness: 175, damping: 22 }}
            className="absolute top-0.5 h-7 px-2"
          >
            <div className="w-full h-full rounded-xl bg-[var(--tessera-accent)]" />
          </motion.div>
        </div>

        {/* Crisp Interactive Tier Labels & Clickable Tabs */}
        <div className="absolute top-0.5 left-0 right-0 h-8 grid grid-cols-4 gap-1 z-10">
          {TIERS.map((tier, idx) => {
            const isActive = idx === activeTierIndex;
            return (
              <button
                key={tier.id}
                type="button"
                onClick={() => onChangeStep(tier.defaultStepIndex)}
                className={`h-8 px-2.5 rounded-xl flex items-center justify-between text-[11px] transition-colors cursor-pointer whitespace-nowrap overflow-hidden ${
                  isActive
                    ? 'text-white font-semibold'
                    : 'tessera-glass-well text-[#B4BAC6] hover:text-white hover:bg-white/[0.06]'
                }`}
              >
                <span className="truncate">{tier.label}</span>
                <span
                  className={`hidden md:inline font-mono text-[10px] tabular-nums ml-1 ${
                    isActive ? 'text-white/90' : 'text-[#8E95A3]'
                  }`}
                >
                  {tier.rangeText}
                </span>
              </button>
            );
          })}
        </div>

        {/* Independently Separated Draggable Precision Track & Thumb */}
        <div
          ref={trackRef}
          role="slider"
          tabIndex={0}
          aria-label="Envergure de la matrice cinétique en caissons"
          aria-valuemin={40}
          aria-valuemax={240}
          aria-valuenow={cabinets}
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
              onChangeStep(Math.min(MATRIX_STEPS.length - 1, stepIndex + 1));
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
              e.preventDefault();
              onChangeStep(Math.max(0, stepIndex - 1));
            }
          }}
          className="relative mt-2.5 h-6 flex items-center cursor-pointer touch-none z-20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--tessera-accent)] rounded"
        >
          {/* Base rail */}
          <div className="w-full h-1.5 tessera-glass-well rounded-full overflow-hidden">
            <motion.div
              animate={{ width: `${progressPct}%` }}
              transition={{ type: 'spring', stiffness: 360, damping: 30 }}
              className="h-full"
              style={{
                background: 'linear-gradient(90deg, #6BA6FF 0%, var(--tessera-accent) 100%)',
              }}
            />
          </div>

          {/* Step Detents */}
          <div className="absolute inset-x-0 flex justify-between pointer-events-none px-0.5">
            {MATRIX_STEPS.map((s, idx) => (
              <span
                key={`${s.cols}x${s.rows}`}
                className={`w-1 h-1 rounded-full ${
                  idx <= stepIndex ? 'bg-white/60' : 'bg-white/15'
                }`}
              />
            ))}
          </div>

          {/* Crisp Thumb Knob */}
          <motion.div
            animate={{ left: `${progressPct}%` }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className="absolute -translate-x-1/2 w-5 h-5 rounded-full bg-[#F4F4F5] border-2 border-[var(--tessera-accent)] shadow-md pointer-events-none"
          />
        </div>
      </div>
    </div>
  );
}
