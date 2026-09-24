import React from 'react';
import { ArrowDown, Download, Sparkles, Shield, ChevronRight, FileText } from 'lucide-react';
import { useProduct } from '../../context/ProductContext';
import { EditableText } from '../admin/EditableText';
import { CardSwitch, HiddenOverlayBadge } from '../admin/CardSwitch';
import { InteractiveCabinet } from './InteractiveCabinet';

export const HeroSection: React.FC = () => {
  const {
    data,
    updateField,
    toggleSectionVisibility,
    isEditMode,
    isVisitorPreview,
    setIsQuoteModalOpen,
    setIsSpecSheetModalOpen
  } = useProduct();

  const hero = data.hero;

  if (!hero.visible && (!isEditMode || isVisitorPreview)) {
    return null;
  }

  const scrollToConfigurator = () => {
    const el = document.getElementById('configurator');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      setIsQuoteModalOpen(true);
    }
  };

  return (
    <section id="hero" className={`relative pt-8 pb-16 lg:pt-14 lg:pb-24 overflow-hidden ${
      !hero.visible ? 'opacity-40 border-2 border-dashed border-red-500/40 p-4 rounded-3xl m-4' : ''
    }`}>
      <HiddenOverlayBadge visible={hero.visible} />

      {/* Admin visibility switch */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-4 flex justify-end">
        <CardSwitch
          visible={hero.visible}
          onToggle={() => toggleSectionVisibility('hero')}
          label="Section Hero"
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* Left Column: Copy & Actions */}
          <div className="w-full lg:w-1/2 flex flex-col items-start text-left">
            {/* Neon Glow Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#c6ff00]/10 border border-[#c6ff00]/30 text-[#c6ff00] text-xs font-mono font-bold tracking-wider mb-6 glow-neon-sm">
              <span className="w-2 h-2 rounded-full bg-[#c6ff00] animate-ping" />
              <EditableText
                value={hero.badge}
                onSave={(val) => updateField('hero', 'badge', val)}
                className="uppercase"
                tag="span"
              />
            </div>

            {/* Immersive Main Title */}
            <h1 className="font-tech text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-black text-white tracking-tight leading-[1.15] mb-6">
              <EditableText
                value={hero.title}
                onSave={(val) => updateField('hero', 'title', val)}
                tag="span"
                multiline
              />
            </h1>

            {/* Subtitle & Technology pitch */}
            <div className="text-base sm:text-lg text-slate-300 leading-relaxed mb-8 max-w-xl">
              <EditableText
                value={hero.subtitle}
                onSave={(val) => updateField('hero', 'subtitle', val)}
                tag="p"
                multiline
              />
            </div>

            {/* Quick Spec Tags */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full mb-8">
              {hero.quickHighlights?.map((item, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-white/[0.03] border border-white/5 backdrop-blur-sm">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">{item.label}</div>
                  <div className="font-tech text-sm sm:text-base font-bold text-[#c6ff00]">{item.value}</div>
                  <div className="text-[10px] text-slate-500 truncate">{item.sub}</div>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
              <button
                type="button"
                onClick={scrollToConfigurator}
                className="gradient-pixiatech hover:opacity-95 text-white font-tech font-bold text-sm px-6 py-3.5 rounded-xl shadow-[0_0_25px_rgba(239,68,68,0.3)] flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <span>{hero.primaryCta}</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setIsSpecSheetModalOpen(true)}
                className="px-6 py-3.5 rounded-xl border border-white/15 bg-white/[0.04] hover:bg-white/10 text-white font-medium text-sm flex items-center justify-center gap-2 transition-all hover:border-[#c6ff00]/40"
              >
                <Download className="w-4 h-4 text-[#c6ff00]" />
                <span>{hero.secondaryCta}</span>
              </button>
            </div>
          </div>

          {/* Right Column: 3D Interactive Cabinet */}
          <div className="w-full lg:w-1/2">
            <InteractiveCabinet />
          </div>
        </div>
      </div>
    </section>
  );
};
