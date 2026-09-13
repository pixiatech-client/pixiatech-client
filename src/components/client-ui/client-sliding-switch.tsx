'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface SwitchOption {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

interface ClientSlidingSwitchProps {
  options: SwitchOption[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  pillLayoutId?: string;
}

const sizeClasses = {
  sm: 'text-xs py-1.5 px-3',
  md: 'text-sm py-2 px-4',
  lg: 'text-base py-2.5 px-6',
};

export function ClientSlidingSwitch({
  options,
  activeId,
  onChange,
  className = '',
  size = 'md',
  pillLayoutId = 'client-sliding-switch-pill',
}: ClientSlidingSwitchProps) {
  return (
    <div className={cn('inline-flex items-center p-1.5 rounded-2xl bg-neutral-100/80 border border-neutral-200/80 shadow-xs relative select-none', className)}>
      {options.map((option) => {
        const isActive = option.id === activeId;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={cn(
              'relative flex items-center justify-center gap-2 font-medium transition-colors duration-150 z-10 rounded-xl cursor-pointer',
              sizeClasses[size],
              isActive ? 'text-white' : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/50',
            )}
          >
            {isActive && (
              <motion.div
                layoutId={pillLayoutId}
                className="absolute inset-0 bg-[#0A0D0E] rounded-xl shadow-md border border-neutral-800 pointer-events-none z-0"
                transition={{ type: 'spring', stiffness: 360, damping: 28, mass: 0.7 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              {isActive && (
                <span className="w-2 h-2 rounded-full bg-[#38E044] shadow-[0_0_8px_#38E044] shrink-0" />
              )}
              {option.icon && (
                <span className={cn('shrink-0', isActive ? 'text-white' : 'text-neutral-500')}>
                  {option.icon}
                </span>
              )}
              <span className="whitespace-nowrap font-semibold tracking-tight">{option.label}</span>
              {option.badge !== undefined && (
                <span
                  className={cn(
                    'ml-1 text-xs px-2 py-0.5 rounded-full font-bold leading-none',
                    isActive
                      ? 'bg-neutral-800 text-neutral-200 border border-neutral-700'
                      : 'bg-neutral-200 text-neutral-700',
                  )}
                >
                  {option.badge}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}