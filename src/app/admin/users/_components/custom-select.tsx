'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

export const CustomSelect: React.FC<CustomSelectProps> = ({
  options,
  value,
  onChange,
  placeholder,
  icon,
  label,
  isActive,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex flex-col gap-1.5" ref={containerRef}>
      {label && (
        <div className="flex items-center gap-2 px-1">
          {icon}
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</span>
        </div>
      )}

      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center justify-between w-full bg-gray-50 border rounded-2xl px-4 py-2.5 transition-all text-left ${
            isOpen || isActive ? 'border-blue-500 ring-2 ring-blue-500/10' : 'border-gray-200 hover:border-blue-500/50'
          }`}
        >
          <div className="flex items-center gap-2 truncate">
            {selectedOption?.color && (
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: selectedOption.color }}
              />
            )}
            <span className={`text-sm font-semibold truncate ${selectedOption ? 'text-gray-900' : 'text-gray-400'}`}>
              {selectedOption ? selectedOption.label : placeholder}
            </span>
          </div>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 5, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute z-[100] w-full bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden p-1.5"
            >
              <div className="max-h-60 overflow-y-auto custom-scrollbar">
                {options.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className={`flex items-center justify-between w-full px-3 py-2.5 rounded-xl transition-all group ${
                      value === option.value ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {option.color && (
                        <div
                          className="w-3 h-3 rounded-full shadow-sm"
                          style={{ backgroundColor: option.color }}
                        />
                      )}
                      <span className={`text-sm font-semibold ${value === option.value ? 'text-blue-600' : 'text-gray-700'}`}>
                        {option.label}
                      </span>
                    </div>
                    {value === option.value && <Check className="w-4 h-4" />}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
