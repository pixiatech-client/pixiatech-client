'use client';

import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

export interface SwitchOption {
  id: string;
  label: string;
  icon?: ReactNode;
  badge?: string | number;
}

interface SlidingSwitchProps {
  options: SwitchOption[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_CLASSES: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'text-xs py-1.5 px-3',
  md: 'text-sm py-2 px-4',
  lg: 'text-base py-2.5 px-6',
};

export function SlidingSwitch({ options, activeId, onChange, className = '', size = 'md' }: SlidingSwitchProps) {
  return (
    <div
      id="pixiatech-sliding-switch"
      className={`inline-flex items-center rounded-2xl border border-neutral-200/80 bg-neutral-100/80 p-1.5 shadow-xs select-none ${className}`}
    >
      {options.map((option) => {
        const isActive = option.id === activeId;
        return (
          <button
            key={option.id}
            id={`switch-option-${option.id}`}
            type="button"
            onClick={() => onChange(option.id)}
            className={`relative z-10 flex cursor-pointer items-center justify-center gap-2 rounded-xl font-medium transition-colors duration-150 ${SIZE_CLASSES[size]} ${
              isActive ? 'text-white' : 'text-neutral-600 hover:bg-neutral-200/50 hover:text-neutral-900'
            }`}
          >
            {isActive && (
              <motion.div
                layoutId={`active-switch-pill-${options.map((o) => o.id).join('-')}`}
                className="pointer-events-none absolute inset-0 z-0 rounded-xl border border-neutral-800 bg-[#0A0D0E] shadow-md"
                transition={{ type: 'spring', stiffness: 360, damping: 28, mass: 0.7 }}
              />
            )}

            <div className="relative z-10 flex items-center gap-2">
              {/* Always reserve space for the dot to prevent layout shift */}
              <span className={`h-2 w-2 shrink-0 rounded-full transition-all ${isActive ? 'bg-[#38E044] shadow-[0_0_8px_#38E044]' : 'opacity-0'}`} />

              {option.icon && <span className={`shrink-0 ${isActive ? 'text-white' : 'text-neutral-500'}`}>{option.icon}</span>}

              <span className="font-semibold tracking-tight whitespace-nowrap">{option.label}</span>

              {option.badge !== undefined && (
                <span
                  className={`ml-1 rounded-full px-2 py-0.5 text-xs font-bold leading-none ${
                    isActive ? 'border border-neutral-700 bg-neutral-800 text-neutral-200' : 'bg-neutral-200 text-neutral-700'
                  }`}
                >
                  {option.badge}
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}