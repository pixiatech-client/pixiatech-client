'use client';

import { useState } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';
import { CITIES } from '@/lib/cities';
import { useI18n } from '@/lib/i18n';

interface CityInputProps {
  value: string;
  onChange: (cityName: string, postcode: string, cityId: string) => void;
  error?: boolean;
  errorMessage?: string;
}

export default function CityInput({ value, onChange, error, errorMessage }: CityInputProps) {
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState(value || '');
  const [selectedId, setSelectedId] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const filtered = CITIES.filter(
    c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
         c.postalCode.includes(searchQuery)
  );

  const handleSelect = (city: typeof CITIES[number]) => {
    setSelectedId(city.id);
    setSearchQuery(`${city.name} (${city.postalCode})`);
    onChange(city.name, city.postalCode, city.id);
    setIsOpen(false);
  };

  return (
    <div className="space-y-1.5 relative">
      <div className="flex items-center gap-2">
        <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wide">{t('common.city')}</label>
        <span className="text-[9px] bg-orange-100 text-orange-700 border border-orange-200/60 px-2 py-0.5 rounded-md font-extrabold uppercase tracking-wider">{t('common.important')}</span>
      </div>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
          <Search size={14} />
        </div>
        <input type="text" placeholder={t('common.cityPlaceholder')}
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          className={`w-full rounded-xl pl-10 pr-10 py-3 text-sm font-medium border transition-all focus:outline-none focus:ring-2 focus:ring-gray-900/10 ${
            error ? 'border-red-300 bg-red-50/30' : 'border-gray-200/70 bg-gray-50/30'
          }`} />
        <button type="button" onClick={() => setIsOpen(!isOpen)}
          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600">
          <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>
      {error && errorMessage && <p className="text-red-500 text-[10px] font-bold">▲ {errorMessage}</p>}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto divide-y divide-gray-50">
          {filtered.length > 0 ? (
            filtered.map(c => (
              <button key={c.id} type="button"
                onClick={() => handleSelect(c)}
                className="w-full text-left px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-between transition-colors">
                <span>{c.name} ({c.postalCode})</span>
                {selectedId === c.id && <Check size={14} className="text-gray-900" />}
              </button>
            ))
          ) : (
            <div className="text-center p-4 text-sm text-gray-400">{t('common.noCityFound')}</div>
          )}
        </div>
      )}
    </div>
  );
}
