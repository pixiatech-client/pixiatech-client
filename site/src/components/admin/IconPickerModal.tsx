import React, { useState } from 'react';
import { Search, X, Check } from 'lucide-react';
import { DynamicIcon, POPULAR_ICONS } from '../ui/DynamicIcon';

interface IconPickerModalProps {
  isOpen: boolean;
  currentIcon: string;
  onSelect: (iconName: string) => void;
  onClose: () => void;
  title?: string;
}

export const IconPickerModal: React.FC<IconPickerModalProps> = ({
  isOpen,
  currentIcon,
  onSelect,
  onClose,
  title = 'Sélectionner une icône'
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tous');

  if (!isOpen) return null;

  const categories = ['Tous', 'Optique', 'Structure', 'Performance', 'Fiabilité', 'Secteurs', 'Connectivité', 'Contact'];

  const filteredIcons = POPULAR_ICONS.filter(icon => {
    const matchesSearch = icon.name.toLowerCase().includes(search.toLowerCase()) || 
                          icon.category.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'Tous' || icon.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="bg-[#0e1118] border border-white/10 rounded-2xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#c6ff00]/10 border border-[#c6ff00]/30 flex items-center justify-center text-[#c6ff00]">
              <DynamicIcon name={currentIcon} className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-tech text-base text-white tracking-wide">{title}</h3>
              <p className="text-xs text-slate-400">Icône actuelle : <span className="text-[#c6ff00] font-mono">{currentIcon}</span></p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Categories */}
        <div className="p-4 space-y-3 border-b border-white/5 bg-white/[0.01]">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher une icône (ex: Sun, Eye, Zap, Store...)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-black/40 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#c6ff00] transition-colors"
              autoFocus
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg transition-all whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-[#c6ff00] text-black font-semibold shadow-sm'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Icons Grid */}
        <div className="p-4 overflow-y-auto max-h-[50vh] grid grid-cols-4 sm:grid-cols-6 gap-2">
          {filteredIcons.map((icon) => {
            const isCurrent = currentIcon === icon.name;
            return (
              <button
                key={icon.name}
                onClick={() => {
                  onSelect(icon.name);
                  onClose();
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all group relative ${
                  isCurrent 
                    ? 'border-[#c6ff00] bg-[#c6ff00]/10 text-[#c6ff00]' 
                    : 'border-white/5 bg-white/[0.02] text-slate-300 hover:border-white/20 hover:bg-white/5 hover:text-white'
                }`}
                title={`${icon.name} (${icon.category})`}
              >
                {isCurrent && (
                  <div className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-[#c6ff00] text-black flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                )}
                <div className="w-8 h-8 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                  <DynamicIcon name={icon.name} className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono truncate w-full">{icon.name}</span>
              </button>
            );
          })}

          {filteredIcons.length === 0 && (
            <div className="col-span-full py-8 text-center text-slate-500 text-sm">
              Aucune icône trouvée pour « {search} »
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-white/10 bg-white/[0.02] flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
