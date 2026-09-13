'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

export interface SwitchOption {
  key: string;
  label: string;
  icon?: ReactNode;
}

interface SlidingSwitchProps {
  options: SwitchOption[];
  active: string;
  onChange: (key: string) => void;
  className?: string;
}

export function SlidingSwitch({ options, active, onChange, className = '' }: SlidingSwitchProps) {
  const activeIndex = options.findIndex((o) => o.key === active);

  return (
    <div className={`relative flex items-stretch gap-1 rounded-2xl border border-neutral-200/80 bg-white p-1.5 shadow-xs ${className}`}>
      {options.map((option, index) => {
        const isActive = option.key === active;
        return (
          <button
            key={option.key}
            type="button"
            onClick={() => onChange(option.key)}
            className={`relative z-10 flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors duration-150 ${
              isActive ? 'text-white' : 'text-neutral-500 hover:text-neutral-900'
            }`}
            aria-pressed={isActive}
          >
            {isActive && index === activeIndex && (
              <motion.span
                layoutId="sliding-pill"
                className="absolute inset-0 -z-10 rounded-xl bg-[#0A0D0E]"
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              />
            )}
            {option.icon}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}