'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

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

export function CustomSelect({ 
  options, 
  value, 
  onChange, 
  placeholder = "Sélectionner...", 
  label,
  icon,
  className,
  isDark = false 
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(o => o.value === value);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <>
      <div className={cn("relative flex flex-col gap-1.5", className)}>
        {label && (
          <div className="flex items-center gap-2 px-1">
            {icon}
            <span className={cn("text-[10px] font-black uppercase tracking-widest", isDark ? "text-gray-500" : "text-gray-400")}>
              {label}
            </span>
          </div>
        )}
        {/* Desktop / Tablet Select */}
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={cn(
            "w-full flex items-center justify-between px-4 py-2 rounded-xl border text-xs font-bold transition-all duration-200 outline-none",
            isDark 
              ? "bg-blue-950/50 border-blue-800 text-blue-400 hover:bg-blue-900/50 hover:border-blue-700" 
              : "bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100 hover:border-blue-300"
          )}
        >
          <span className={cn("truncate font-medium", selectedOption?.color)}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown className={cn("w-4 h-4 ml-2 transition-transform duration-300", isOpen ? "rotate-180" : "")} />
        </button>

        {/* Desktop Dropdown */}
        <AnimatePresence>
          {isOpen && (
            <div className="hidden md:block">
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setIsOpen(false)} 
              />
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 5, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className={cn(
                  "absolute left-0 right-0 z-50 rounded-2xl border shadow-2xl overflow-hidden",
                  isDark ? "bg-zinc-900 border-white/10" : "bg-white border-gray-100"
                )}
              >
                <div className="p-1 max-h-[300px] overflow-y-auto custom-scrollbar">
                  {options.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleSelect(option.value)}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all",
                        value === option.value 
                          ? (isDark ? "bg-white/10 text-white" : "bg-gray-100 text-gray-900")
                          : (isDark ? "text-gray-400 hover:bg-white/5 hover:text-white" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900")
                      )}
                    >
                      <span className={cn("font-medium", option.color)}>{option.label}</span>
                      {value === option.value && <Check className="w-4 h-4 text-blue-500" />}
                    </button>
                  ))}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile Bottom Sheet */}
      <AnimatePresence>
        {isOpen && (
          <div className="md:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className={cn(
                "fixed left-0 right-0 bottom-0 z-[101] rounded-t-[32px] shadow-2xl flex flex-col",
                "max-h-[75vh]",
                isDark ? "bg-[#141414] border-t border-white/5" : "bg-white border-t border-gray-100"
              )}
            >
              {/* Header — fixe */}
              <div className="shrink-0 flex items-center justify-between px-6 pt-6 pb-4">
                <div>
                  <h3 className={cn("text-lg font-bold", isDark ? "text-white" : "text-gray-900")}>
                    {placeholder}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">Faites votre choix</p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "p-2 rounded-full transition-colors",
                    isDark ? "bg-white/5 hover:bg-white/10 text-gray-400" : "bg-gray-100 hover:bg-gray-200 text-gray-500"
                  )}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Options — scrollable */}
              <div
                className="flex-1 overflow-y-auto overscroll-contain px-6 pb-10 space-y-2"
                style={{ WebkitOverflowScrolling: 'touch' }}
              >
                {options.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={cn(
                      "w-full flex items-center justify-between p-5 rounded-2xl text-left transition-all active:scale-[0.98]",
                      value === option.value 
                        ? (isDark ? "bg-white/10 ring-1 ring-white/20" : "bg-blue-50 ring-1 ring-blue-500/20")
                        : (isDark ? "bg-white/5 hover:bg-white/10" : "bg-gray-50 hover:bg-gray-100")
                    )}
                  >
                    <span className={cn("text-base font-bold", option.color || (isDark ? "text-white" : "text-gray-900"))}>
                      {option.label}
                    </span>
                    {value === option.value && (
                      <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
