import type { CSSProperties } from 'react';
import type { PresentationModelId, PresentationModelSpec } from '../types/models';

interface ModelSwitchRowProps {
  model: PresentationModelSpec;
  index: number;
  isActive: boolean;
  activationPulseCount: number;
  onToggle: (id: PresentationModelId) => void;
}

export function ModelSwitchRow({
  model,
  index,
  isActive,
  activationPulseCount,
  onToggle,
}: ModelSwitchRowProps) {
  const staggerStyle = {
    '--wave-delay': `${index * 70}ms`,
  } as CSSProperties;

  return (
    <li className="relative overflow-hidden border-b border-white/[0.06] last:border-b-0">
      <button
        type="button"
        role="switch"
        aria-checked={isActive}
        aria-label={model.name}
        onClick={() => onToggle(model.id)}
        style={staggerStyle}
        className={`group relative w-full min-h-[54px] px-3 sm:px-4 py-2.5 flex items-center justify-between gap-2.5 sm:gap-3 text-left transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-400 animate-row-settle cursor-pointer ${
          isActive
            ? 'bg-gradient-to-r from-amber-500/[0.11] via-amber-400/[0.04] to-transparent'
            : 'bg-transparent hover:bg-white/[0.03]'
        }`}
      >
        {/* Initial staggered wave-of-light sweep (Animorio inspiration) */}
        <span
          aria-hidden="true"
          style={staggerStyle}
          className="pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-amber-300/[0.14] to-transparent animate-wave-sweep"
        />

        {/* Activation wave-of-light sweep when toggled ON */}
        {isActive && activationPulseCount > 0 && (
          <span
            key={activationPulseCount}
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 w-2/3 bg-gradient-to-r from-transparent via-amber-400/[0.22] to-transparent animate-wave-activate"
          />
        )}

        {/* Left: Index + Model Name + Compact Spec */}
        <div className="relative z-10 flex items-center gap-2.5 sm:gap-3 min-w-0">
          <span
            className={`font-mono text-xs tabular-nums shrink-0 transition-colors duration-150 ${
              isActive ? 'text-amber-400 font-semibold' : 'text-slate-500 group-hover:text-slate-400'
            }`}
          >
            {model.indexLabel}
          </span>

          <div className="min-w-0">
            <div
              className={`font-display text-sm font-semibold tracking-[-0.01em] truncate transition-colors duration-150 ${
                isActive ? 'text-white' : 'text-slate-200 group-hover:text-white'
              }`}
            >
              {model.name}
            </div>
            <div className="text-[11px] sm:text-xs text-slate-400 truncate">
              {model.dimensions}
            </div>
          </div>
        </div>

        {/* Right: Explicit ON/OFF text + Modern Toggle Switch */}
        <div className="relative z-10 flex items-center gap-2 sm:gap-3 shrink-0">
          <span
            className={`font-mono text-[11px] font-semibold tracking-wider tabular-nums w-7 text-right transition-colors duration-150 ${
              isActive ? 'text-emerald-400' : 'text-slate-500'
            }`}
          >
            {isActive ? 'ON' : 'OFF'}
          </span>

          <span
            aria-hidden="true"
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors duration-200 ${
              isActive
                ? 'bg-amber-500 border-amber-400 shadow-[0_0_16px_-4px_rgba(245,158,11,0.65)]'
                : 'bg-[#171C26] border-white/[0.14] group-hover:border-white/[0.24]'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                isActive ? 'translate-x-[22px]' : 'translate-x-[3px]'
              }`}
            />
          </span>
        </div>
      </button>
    </li>
  );
}
