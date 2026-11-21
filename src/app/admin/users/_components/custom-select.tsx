'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { BottomSheetSelect, type BottomSheetOption } from '@/components/ui/bottom-sheet';

interface Option {
  value: string;
  label: string;
  color?: string;
  bgColor?: string;
}

interface CustomSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  icon?: React.ReactNode;
  label?: string;
  isActive?: boolean;
}

/** Sélecteur partagé de l'administration : même Bottom Sheet que le reste. */
export const CustomSelect: React.FC<CustomSelectProps> = ({
  options,
  value,
  onChange,
  placeholder,
  icon,
  label,
  isActive,
}) => {
  const mapped: BottomSheetOption[] = options.map((option) => ({
    value: option.value,
    label: (
      <span className="flex items-center gap-2">
        {option.color && (
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: option.color }}
          />
        )}
        {option.label}
      </span>
    ),
    searchText: option.label,
  }));

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <div className="flex items-center gap-2 px-1">
          {icon}
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
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
        searchable={options.length > 8}
        searchPlaceholder="Rechercher"
        triggerClassName={cn(
          'bg-gray-50 text-sm',
          isActive ? 'border-blue-500 ring-2 ring-blue-500/10' : 'border-gray-200',
        )}
      />
    </div>
  );
};

export default CustomSelect;
