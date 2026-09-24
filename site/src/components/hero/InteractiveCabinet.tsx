import React, { useState } from 'react';
import { Sparkles, Power, Eye, Info, Check } from 'lucide-react';
import { useProduct } from '../../context/ProductContext';
import { EditableText } from '../admin/EditableText';
import { Hotspot } from '../../types/product';

export const InteractiveCabinet: React.FC = () => {
  const { data, updateData, isEditMode, isVisitorPreview } = useProduct();
  const [activeHotspotId, setActiveHotspotId] = useState<string>('hs-module');
  const [displayMode, setDisplayMode] = useState<'active' | 'transparent'>('active');

  const hotspots = data.hero.hotspots || [];

  const handleUpdateHotspot = (id: string, field: keyof Hotspot, value: string) => {
    updateData((prev) => ({
      ...prev,
      hero: {
        ...prev.hero,
        hotspots: prev.hero.hotspots.map((hs) =>
          hs.id === id ? { ...hs, [field]: value } : hs
        )
      }
    }));
  };

  const activeHotspot = hotspots.find((h) => h.id === activeHotspotId) || hotspots[0];

  return (
    <div className="relative w-full rounded-3xl border border-white/10 bg-[#090b10] overflow-hidden shadow-2xl p-4 sm:p-6 lg:p-8">
      {/* Top Controls on the 3D visual */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#c6ff00] animate-pulse" />
          <span className="font-tech text-xs tracking-wider text-white uppercase">
            Rendu Numérique 3D • Caisson WP Modulaire 1000 x 500 mm
          </span>
        </div>

        {/* Display simulator toggle: Active vs 85% Transparent */}
        <div className="flex items-center gap-1 p-1 bg-black/60 rounded-xl border border-white/10 text-xs">
          <button
            type="button"
            onClick={() => setDisplayMode('active')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition-all ${
              displayMode === 'active'
                ? 'bg-[#c6ff00] text-black font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            <span>Flux Vidéo Actif</span>
          </button>
          <button
            type="button"
            onClick={() => setDisplayMode('transparent')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition-all ${
              displayMode === 'transparent'
                ? 'bg-white/20 text-white font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Transparence 85%</span>
          </button>
        </div>
      </div>

      {/* Main Visual Display Stage */}
      <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] max-h-[460px] rounded-2xl bg-gradient-to-b from-[#0e121a] to-[#06080c] border border-white/10 overflow-hidden flex items-center justify-center shadow-inner">
        {/* Architectural Background behind the transparent display (Luxury store interior simulation) */}
        <div className="absolute inset-0 z-0 opacity-40 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/40 via-slate-950/80 to-black">
          {/* Simulated interior silhouettes */}
          <div className="absolute inset-0 flex items-center justify-around opacity-30 pointer-events-none">
            <div className="w-32 h-64 border-r border-white/10" />
            <div className="w-48 h-56 rounded-lg bg-amber-500/5 blur-xl" />
            <div className="w-32 h-64 border-l border-white/10" />
          </div>
        </div>

        {/* LED Cabinet Chassis Frame */}
        <div className="relative z-10 w-[88%] h-[84%] rounded-xl border-2 border-slate-600/80 bg-black/40 backdrop-blur-[2px] shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col justify-between p-3">
          {/* Top Hanging Bar & Anodized Frame */}
          <div className="w-full flex items-center justify-between pb-2 border-b border-white/10 text-[10px] font-mono text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#c6ff00]" />
              CHÂSSIS ALUMINUM DIE-CAST PIXIATECH
            </span>
            <span>FAST-LOCK SYSTEM • SLIM 12KG/M²</span>
          </div>

          {/* LED Bar Array (Simulating transparent slats) */}
          <div className="relative flex-1 w-full my-2 flex flex-col justify-between overflow-hidden">
            {Array.from({ length: 14 }).map((_, i) => (
              <div
                key={i}
                className={`relative w-full h-[3px] rounded-full transition-all duration-500 ${
                  displayMode === 'active'
                    ? i % 2 === 0
                      ? 'bg-gradient-to-r from-transparent via-[#c6ff00] to-transparent shadow-[0_0_12px_rgba(198,255,0,0.8)] opacity-90'
                      : 'bg-gradient-to-r from-purple-500/80 via-rose-500/80 to-amber-500/80 shadow-[0_0_8px_rgba(244,63,94,0.6)] opacity-80'
                    : 'bg-slate-700/30 opacity-40'
                }`}
              />
            ))}

            {/* Glowing Holographic Brand Hologram when active */}
            {displayMode === 'active' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none animate-pulse">
                <div className="px-6 py-3 rounded-2xl bg-black/60 border border-[#c6ff00]/40 backdrop-blur-md text-center shadow-[0_0_30px_rgba(198,255,0,0.3)]">
                  <span className="font-tech text-xs tracking-widest text-[#c6ff00] font-bold block">
                    PIXIATECH SÉRIE WP
                  </span>
                  <span className="font-tech text-xl sm:text-2xl font-black text-white tracking-wider">
                    6 500 NITS
                  </span>
                  <span className="text-[10px] text-slate-300 font-mono block mt-0.5">
                    TRANSPARENCE OPTIQUE 85%
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Module Profile & Power integration */}
          <div className="w-full flex items-center justify-between pt-2 border-t border-white/10 text-[9px] font-mono text-slate-500">
            <span>PAS DE PIXEL P3.91mm (Standard Élite)</span>
            <span>ALIMENTATION SANS VENTILATEUR COLDLED™</span>
          </div>

          {/* Interactive Hotspot Buttons */}
          {hotspots.map((hs) => {
            const isActive = hs.id === activeHotspotId;
            return (
              <div
                key={hs.id}
                style={{ top: hs.top, left: hs.left }}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-30"
              >
                <button
                  type="button"
                  onClick={() => setActiveHotspotId(hs.id)}
                  className={`group relative flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all ${
                    isActive
                      ? 'bg-[#c6ff00] border-white text-black scale-110 shadow-[0_0_20px_#c6ff00]'
                      : 'bg-black/90 border-[#c6ff00] text-[#c6ff00] hover:scale-110 hover:bg-[#c6ff00]/20'
                  }`}
                  title={hs.title}
                >
                  <span className="animate-ping absolute inset-0 rounded-full bg-[#c6ff00] opacity-40" />
                  <span className="font-mono text-xs font-black">
                    {hs.id === 'hs-module' ? '1' : hs.id === 'hs-power' ? '2' : '3'}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hotspots Detailed Explanatory Cards */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
        {hotspots.map((hs, index) => {
          const isActive = hs.id === activeHotspotId;
          return (
            <div
              key={hs.id}
              onClick={() => setActiveHotspotId(hs.id)}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                isActive
                  ? 'bg-white/[0.05] border-[#c6ff00] shadow-[0_0_15px_rgba(198,255,0,0.15)]'
                  : 'bg-white/[0.02] border-white/5 hover:border-white/20'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold ${
                  isActive ? 'bg-[#c6ff00] text-black' : 'bg-white/10 text-slate-400'
                }`}>
                  {index + 1}
                </span>
                <EditableText
                  value={hs.title}
                  onSave={(val) => handleUpdateHotspot(hs.id, 'title', val)}
                  className="font-tech text-xs font-bold text-white tracking-wide"
                  tag="span"
                />
              </div>
              <EditableText
                value={hs.description}
                onSave={(val) => handleUpdateHotspot(hs.id, 'description', val)}
                className="text-xs text-slate-400 leading-relaxed"
                tag="p"
                multiline
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
