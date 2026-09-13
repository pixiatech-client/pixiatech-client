'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface NavCapsuleItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

interface ClientNavCapsuleProps {
  items: NavCapsuleItem[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
  pillLayoutId?: string;
}

export function ClientNavCapsule({
  items,
  activeId,
  onChange,
  className,
  pillLayoutId = 'client-nav-capsule-pill',
}: ClientNavCapsuleProps) {
  return (
    <nav
      className={cn(
        'w-full flex items-center gap-1.5 p-1.5 rounded-2xl bg-white border border-neutral-200/90 shadow-xs overflow-x-auto select-none',
        className,
      )}
    >
      {items.map((item) => {
        const isActive = item.id === activeId;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={cn(
              'relative px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors duration-150 cursor-pointer select-none shrink-0',
              isActive ? 'text-white' : 'text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100/80',
            )}
          >
            {isActive && (
              <motion.div
                layoutId={pillLayoutId}
                className="absolute inset-0 bg-[#0A0D0E] rounded-xl shadow-md border border-neutral-800 pointer-events-none"
                transition={{ type: 'spring', stiffness: 360, damping: 28, mass: 0.7 }}
              />
            )}

            <span className="relative z-10 flex items-center gap-2 whitespace-nowrap">
              {isActive && (
                <span className="w-2 h-2 rounded-full bg-[#38E044] shadow-[0_0_8px_#38E044] shrink-0" />
              )}
              {item.icon && (
                <span className={cn(isActive ? 'text-white' : 'text-neutral-500')}>{item.icon}</span>
              )}
              <span>{item.label}</span>
              {item.badge !== undefined && (
                <span
                  className={cn(
                    'ml-1 text-[11px] px-2 py-0.5 rounded-full font-bold',
                    isActive
                      ? 'bg-neutral-800 text-[#38E044] border border-neutral-700'
                      : 'bg-neutral-100 text-neutral-600 border border-neutral-200',
                  )}
                >
                  {item.badge}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </nav>
  );
}