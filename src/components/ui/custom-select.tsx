'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { BottomSheetSelect, type BottomSheetOption } from '@/components/ui/bottom-sheet';

interface Option {
  value: string;
  label: string;
  color?: string;
  bgColor?: string;
  icon?: any;
}

interface CustomSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  icon?: React.ReactNode;
  className?: string;
  isDark?: boolean;
  isActive?: boolean;
}

/**
 * Ancien sélecteur « blue » : conserve son API publique mais délègue désormais
 * au système unifié. Desktop garde son menu ancré, mobile ouvre le Bottom Sheet
 * global (drag, Safe Areas, focus, recherche, validation).
 */
export function CustomSelect({
  options,
  value,
  onChange,
  placeholder = 'Sélectionner...',
  label,
  icon,
  className,
  isDark = false,
}: CustomSelectProps) {
  const mapped: BottomSheetOption[] = options.map((option) => {
    let renderedIcon: React.ReactNode = undefined;
    if (option.icon) {
      if (React.isValidElement(option.icon)) {
        renderedIcon = option.icon;
      } else if (typeof option.icon === 'function' || (typeof option.icon === 'object' && option.icon !== null)) {
        const IconComponent = option.icon as React.ComponentType<{ className?: string }>;
        renderedIcon = <IconComponent className="h-4 w-4 shrink-0" />;
      }
    }

    return {
      value: option.value,
      label: option.color ? <span className={option.color}>{option.label}</span> : option.label,
      searchText: option.label,
      icon: renderedIcon ? <span className="flex h-5 w-5 items-center justify-center shrink-0">{renderedIcon}</span> : undefined,
    };
  });

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <div className="flex items-center gap-2 px-1">
          {icon}
          <span
            className={cn(
              'text-[10px] font-black uppercase tracking-widest',
              isDark ? 'text-gray-500' : 'text-gray-400',
            )}
          >
            {label}
          </span>
        </div>
      )}
      <BottomSheetSelect
        options={mapped}
        value={value}
        onChange={(next) => onChange(String(next))}
        title={label ?? placeholder}
        placeholder={placeholder}
        tone={isDark ? 'dark' : 'light'}
        searchable={options.length > 8}
        searchPlaceholder="Rechercher une option"
        triggerClassName={
          isDark
            ? 'border-blue-800 bg-blue-950/50 text-blue-300 hover:bg-blue-900/50'
            : 'border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100'
        }
      />
    </div>
  );
}

export default CustomSelect;
