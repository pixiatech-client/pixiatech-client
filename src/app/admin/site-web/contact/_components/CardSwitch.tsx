'use client';
import React from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface CardSwitchProps {
  label: string;
  checked: boolean;
  onChange: (newChecked: boolean) => void;
  isAdmin: boolean;
  compact?: boolean;
}

export const CardSwitch: React.FC<CardSwitchProps> = ({
  label,
  checked,
  onChange,
  isAdmin,
  compact = false,
}) => {
  if (!isAdmin) return null;

  return (
    <div 
      className={`inline-flex items-center space-x-2 select-none ${
        compact 
          ? 'py-0.5 px-2 bg-gray-900/90 text-white rounded-lg text-[10px] shadow-sm' 
          : 'py-1 px-3 bg-white border border-gray-200 rounded-xl shadow-sm text-xs'
      }`}
      onClick={(e) => e.stopPropagation()}
    >
      <span className="flex items-center space-x-1.5 font-medium">
        {checked ? (
          <Eye size={compact ? 11 : 13} className="text-emerald-500" />
        ) : (
          <EyeOff size={compact ? 11 : 13} className="text-rose-500" />
        )}
        <span className={checked ? 'text-gray-700' : 'text-gray-400 line-through'}>
          {label}
        </span>
      </span>

      {/* Switch Toggle */}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-4 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
          checked ? 'bg-[#c6ff00]' : 'bg-gray-300'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-black shadow-md ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-4' : 'translate-x-0 bg-white'
          }`}
        />
      </button>

      <span className={`text-[10px] font-bold uppercase tracking-wider ${checked ? 'text-emerald-600' : 'text-rose-500'}`}>
        {checked ? 'Visible' : 'Masqué'}
      </span>
    </div>
  );
};

export const CardHiddenNotice: React.FC<{
  title: string;
  onRestore: () => void;
}> = ({ title, onRestore }) => {
  return (
    <div className="w-full mb-3 rounded-xl border border-amber-300 bg-amber-50/90 px-4 py-2.5 flex items-center justify-between text-xs text-amber-900 shadow-sm animate-in fade-in">
      <div className="flex items-center space-x-2">
        <EyeOff size={14} className="text-amber-600 shrink-0" />
        <span>
          <strong>{title}</strong> est actuellement <strong>masqué</strong> pour les visiteurs publics.
        </span>
      </div>
      <button
        type="button"
        onClick={onRestore}
        className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold text-[11px] transition-colors shadow-sm"
      >
        Réafficher cette carte
      </button>
    </div>
  );
};
