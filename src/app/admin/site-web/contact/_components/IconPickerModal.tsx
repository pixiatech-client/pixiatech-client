'use client';
import React, { useState, useMemo } from 'react';
import { X, Search, Check, Sparkles } from 'lucide-react';
import { AVAILABLE_ICONS, IconRenderer } from './IconRenderer';

interface IconPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentIcon: string;
  onSelectIcon: (iconName: string) => void;
  title?: string;
}

const CATEGORIES = ['Tous', 'Contact', 'Social', 'Tech', 'Confiance', 'Général'];

export const IconPickerModal: React.FC<IconPickerModalProps> = ({
  isOpen,
  onClose,
  currentIcon,
  onSelectIcon,
  title = "Choisir une icône",
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tous');

  const filteredIcons = useMemo(() => {
    return AVAILABLE_ICONS.filter(icon => {
      const matchesCategory = selectedCategory === 'Tous' || icon.category === selectedCategory;
      const matchesSearch = 
        icon.name.toLowerCase().includes(search.toLowerCase()) || 
        icon.label.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [search, selectedCategory]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="relative flex h-[80vh] max-h-[640px] w-full max-w-2xl flex-col rounded-2xl border border-white/20 bg-slate-900 shadow-2xl text-white overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#c6ff00]/15 text-[#c6ff00] border border-[#c6ff00]/30">
              <IconRenderer name={currentIcon} className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-tech text-base font-bold text-white uppercase tracking-wider">
                {title}
              </h3>
              <p className="text-xs text-slate-400">
                Icône actuellement active : <span className="font-mono text-[#c6ff00] font-bold">{currentIcon}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="border-b border-white/10 p-4 bg-slate-900/80 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher une icône (ex: phone, mail, instagram, screen, map...)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-black/40 py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500 focus:border-[#c6ff00] focus:outline-none focus:ring-1 focus:ring-[#c6ff00]"
              autoFocus
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-white"
              >
                Effacer
              </button>
            )}
          </div>

          {/* Categories pills */}
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map(category => (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={`rounded-full px-3 py-1 text-[11px] font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-[#c6ff00] text-black font-bold'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Icons Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {filteredIcons.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-sm">
              <Sparkles className="h-8 w-8 text-slate-600 mb-2" />
              <span>Aucune icône trouvée pour « {search} »</span>
              <button
                type="button"
                onClick={() => { setSearch(''); setSelectedCategory('Tous'); }}
                className="mt-3 text-xs text-[#c6ff00] hover:underline"
              >
                Réinitialiser la recherche
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {filteredIcons.map(icon => {
                const isSelected = currentIcon === icon.name;
                return (
                  <button
                    key={icon.name}
                    type="button"
                    onClick={() => {
                      onSelectIcon(icon.name);
                      onClose();
                    }}
                    className={`flex items-center space-x-3 p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-[#c6ff00] bg-[#c6ff00]/10 text-white shadow-md'
                        : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/30 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                      isSelected ? 'bg-[#c6ff00] text-black' : 'bg-black/50 text-[#c6ff00]'
                    }`}>
                      <IconRenderer name={icon.name} className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold truncate">
                          {icon.name}
                        </span>
                        {isSelected && <Check className="h-3.5 w-3.5 text-[#c6ff00] shrink-0 ml-1" />}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {icon.label}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="border-t border-white/10 px-6 py-3 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
          <span>{filteredIcons.length} icônes disponibles</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};