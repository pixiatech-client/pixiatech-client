'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function OrderFilters() {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-2">
        <span className="text-[12px] font-semibold tracking-wider uppercase text-gray-400">
          Filtrer par :
        </span>
        <Select defaultValue="all">
          <SelectTrigger className="w-auto min-w-[160px] h-9 bg-white border border-gray-200 rounded-lg px-3 text-[13px] text-gray-900 font-medium focus:ring-2 focus:ring-[#004ac6]/20 focus:border-[#004ac6] shadow-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="border-gray-200 rounded-lg shadow-lg p-1">
            <SelectItem value="all" className="text-[13px] rounded-md focus:bg-gray-50 focus:text-gray-900">Toutes les commandes</SelectItem>
            <SelectItem value="in_progress" className="text-[13px] rounded-md focus:bg-gray-50 focus:text-gray-900">En cours</SelectItem>
            <SelectItem value="delivered" className="text-[13px] rounded-md focus:bg-gray-50 focus:text-gray-900">Livré</SelectItem>
            <SelectItem value="cancelled" className="text-[13px] rounded-md focus:bg-gray-50 focus:text-gray-900">Annulé</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[12px] font-semibold tracking-wider uppercase text-gray-400">
          Période :
        </span>
        <Select defaultValue="week">
          <SelectTrigger className="w-auto min-w-[140px] h-9 bg-white border border-gray-200 rounded-lg px-3 text-[13px] text-gray-900 font-medium focus:ring-2 focus:ring-[#004ac6]/20 focus:border-[#004ac6] shadow-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="border-gray-200 rounded-lg shadow-lg p-1">
            <SelectItem value="week" className="text-[13px] rounded-md focus:bg-gray-50 focus:text-gray-900">Cette semaine</SelectItem>
            <SelectItem value="month" className="text-[13px] rounded-md focus:bg-gray-50 focus:text-gray-900">Ce mois-ci</SelectItem>
            <SelectItem value="3months" className="text-[13px] rounded-md focus:bg-gray-50 focus:text-gray-900">Derniers 3 mois</SelectItem>
            <SelectItem value="year" className="text-[13px] rounded-md focus:bg-gray-50 focus:text-gray-900">Année en cours</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
