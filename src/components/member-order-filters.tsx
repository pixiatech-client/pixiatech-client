'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown, Check } from 'lucide-react';
import { useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const statusOptions = [
  { value: 'all', label: 'Toutes les commandes' },
  { value: 'in_progress', label: 'En cours' },
  { value: 'delivered', label: 'Livré' },
  { value: 'cancelled', label: 'Annulé' },
] as const;

const periodOptions = [
  { value: 'week', label: 'Cette semaine' },
  { value: 'month', label: 'Ce mois-ci' },
  { value: '3months', label: 'Derniers 3 mois' },
  { value: 'year', label: 'Année en cours' },
] as const;

function FilterBottomSheet({ open, onClose, title, options, value, onChange }: {
  open: boolean;
  onClose: () => void;
  title: string;
  options: readonly { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white shadow-2xl flex flex-col rounded-t-3xl max-h-[75vh]"
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-100 shrink-0">
              <div className="w-8 h-1 rounded-full bg-gray-300 mx-auto absolute left-1/2 -translate-x-1/2 top-2" />
              <h3 className="text-[17px] font-semibold text-gray-900">{title}</h3>
              <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 pb-8">
              {options.map((opt) => {
                const selected = value === opt.value
                return (
                  <button
                    key={opt.value}
                    onClick={() => { onChange(opt.value); onClose() }}
                    className={`w-full text-left px-4 py-3.5 rounded-xl flex items-center justify-between transition-all ${
                      selected
                        ? 'bg-[#004ac6]/5 text-[#004ac6] font-semibold'
                        : 'text-gray-900 font-medium hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-[15px]">{opt.label}</span>
                    {selected && (
                      <div className="w-6 h-6 rounded-full bg-[#004ac6] flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export function OrderFilters() {
  const [status, setStatus] = useState('all')
  const [period, setPeriod] = useState('week')
  const [statusOpen, setStatusOpen] = useState(false)
  const [periodOpen, setPeriodOpen] = useState(false)

  const currentStatusLabel = statusOptions.find(o => o.value === status)?.label || 'Filtrer'
  const currentPeriodLabel = periodOptions.find(o => o.value === period)?.label || 'Période'

  return (
    <>
      {/* Mobile */}
      <div className="flex items-center gap-3 md:hidden w-full">
        <button
          onClick={() => setStatusOpen(true)}
          className="flex-1 flex items-center justify-between gap-2 h-11 px-4 bg-white border border-gray-200 rounded-xl text-[13px] font-medium text-gray-700 shadow-sm"
        >
          <span className="truncate">{currentStatusLabel}</span>
          <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
        </button>
        <button
          onClick={() => setPeriodOpen(true)}
          className="flex-1 flex items-center justify-between gap-2 h-11 px-4 bg-white border border-gray-200 rounded-xl text-[13px] font-medium text-gray-700 shadow-sm"
        >
          <span className="truncate">{currentPeriodLabel}</span>
          <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
        </button>
      </div>

      {/* Desktop */}
      <div className="hidden md:flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-semibold tracking-wider uppercase text-gray-400">
            Filtrer par :
          </span>
          <Select defaultValue="all" onValueChange={setStatus}>
            <SelectTrigger className="w-auto min-w-[160px] h-9 bg-white border border-gray-200 rounded-lg px-3 text-[13px] text-gray-900 font-medium focus:ring-2 focus:ring-[#004ac6]/20 focus:border-[#004ac6] shadow-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-gray-200 rounded-lg shadow-lg p-1">
              {statusOptions.map(o => (
                <SelectItem key={o.value} value={o.value} className="text-[13px] rounded-md focus:bg-gray-50 focus:text-gray-900">{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-semibold tracking-wider uppercase text-gray-400">
            Période :
          </span>
          <Select defaultValue="week" onValueChange={setPeriod}>
            <SelectTrigger className="w-auto min-w-[140px] h-9 bg-white border border-gray-200 rounded-lg px-3 text-[13px] text-gray-900 font-medium focus:ring-2 focus:ring-[#004ac6]/20 focus:border-[#004ac6] shadow-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-gray-200 rounded-lg shadow-lg p-1">
              {periodOptions.map(o => (
                <SelectItem key={o.value} value={o.value} className="text-[13px] rounded-md focus:bg-gray-50 focus:text-gray-900">{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Bottom sheets */}
      <FilterBottomSheet
        open={statusOpen}
        onClose={() => setStatusOpen(false)}
        title="Filtrer par"
        options={statusOptions}
        value={status}
        onChange={setStatus}
      />
      <FilterBottomSheet
        open={periodOpen}
        onClose={() => setPeriodOpen(false)}
        title="Période"
        options={periodOptions}
        value={period}
        onChange={setPeriod}
      />
    </>
  );
}
