'use client';

import { useState } from 'react';
import { useMediaQuery } from 'usehooks-ts';

import './layout-selector.css';

export type LayoutMode = 1 | 2 | 3 | 4;

interface LayoutSelectorProps {
  value?: LayoutMode;
  onChange?: (value: LayoutMode) => void;
  isMobile?: boolean;
}

export default function LayoutSelector({
  value: controlledValue,
  onChange,
  isMobile: isMobileProp,
}: LayoutSelectorProps) {
  const [internalValue, setInternalValue] = useState<LayoutMode>(3);
  const isMobileMedia = useMediaQuery('(max-width: 767px)');
  const isMobile = isMobileProp ?? isMobileMedia;

  const value = controlledValue ?? internalValue;

  const changeLayout = (next: LayoutMode) => {
    if (!controlledValue) {
      setInternalValue(next);
    }

    onChange?.(next);
  };

  const handleClick = () => {
    let next: LayoutMode;
    if (isMobile) {
      // Sur mobile : 3 choix uniquement (1 colonne -> 2 colonnes -> ligne/liste -> 1 colonne)
      // On saute la vue 3 colonnes qui est inadaptée aux petits écrans
      if (value === 1) {
        next = 2;
      } else if (value === 2) {
        next = 4;
      } else {
        next = 1;
      }
    } else {
      // Sur PC / Desktop : les 4 choix complets (1 -> 2 -> 3 -> 4 -> 1)
      next = value === 4 ? 1 : ((value + 1) as LayoutMode);
    }
    changeLayout(next);
  };

  return (
    <button
      type="button"
      className={`layout-selector layout-mode-${value} relative flex items-center justify-center size-10 rounded-[14px] border border-gray-200/80 bg-white shadow-xs text-gray-500 hover:text-gray-800 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 shrink-0 cursor-pointer`}
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
