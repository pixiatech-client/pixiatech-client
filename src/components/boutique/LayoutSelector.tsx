'use client';

import { useState } from 'react';

import './layout-selector.css';

export type LayoutMode = 1 | 2 | 3 | 4;

interface LayoutSelectorProps {
  value?: LayoutMode;
  onChange?: (value: LayoutMode) => void;
}

export default function LayoutSelector({
  value: controlledValue,
  onChange,
}: LayoutSelectorProps) {
  const [internalValue, setInternalValue] = useState<LayoutMode>(3);

  const value = controlledValue ?? internalValue;

  const changeLayout = (next: LayoutMode) => {
    if (!controlledValue) {
      setInternalValue(next);
    }

    onChange?.(next);
  };

  const handleClick = () => {
    const next = value === 4 ? 1 : ((value + 1) as LayoutMode);
    changeLayout(next);
  };

  return (
    <button
      type="button"
      className={`layout-selector layout-mode-${value} relative flex items-center justify-center size-11 rounded-[10px] border border-gray-200/80 bg-white shadow-xs text-gray-500 hover:text-gray-800 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 shrink-0 cursor-pointer`}
      onClick={handleClick}
      aria-label={
        value === 1
          ? 'Affichage 1 colonne'
          : value === 2
            ? 'Affichage 2 colonnes'
            : value === 3
              ? 'Affichage 3 colonnes'
              : 'Affichage liste'
      }
    >
      <span className="layout-selector-icon">
        {/* GRID */}
        <span className="grid-icon">
          <span className="grid-square square-1" />
          <span className="grid-square square-2" />
          <span className="grid-square square-3" />
          <span className="grid-square square-4" />
        </span>

        {/* LIST */}
        <span className="list-icon">
          <span />
          <span />
          <span />
          <span />
        </span>
      </span>
    </button>
  );
}
