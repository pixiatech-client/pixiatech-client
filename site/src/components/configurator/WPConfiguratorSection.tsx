import React, { useState, useMemo } from 'react';
import { Sliders, Cpu, Zap, Maximize, Gauge, FileText, Check, ArrowRight } from 'lucide-react';
import { useProduct } from '../../context/ProductContext';
import { EditableText } from '../admin/EditableText';
import { CardSwitch, HiddenOverlayBadge } from '../admin/CardSwitch';

export const WPConfiguratorSection: React.FC = () => {
  const {
    data,
    updateField,
    toggleSectionVisibility,
    isEditMode,
    isVisitorPreview,
    setIsQuoteModalOpen,
    setQuotePrefillData
  } = useProduct();

  const configurator = data.configurator;

  const [selectedPitchId, setSelectedPitchId] = useState<string>(configurator.defaultPitch || 'P3.91');
  const [widthMeters, setWidthMeters] = useState<number>(configurator.defaultWidth || 3.0);
  const [heightMeters, setHeightMeters] = useState<number>(configurator.defaultHeight || 2.0);

  if (!configurator.visible && (!isEditMode || isVisitorPreview)) {
    return null;
  }

  const selectedPitch = useMemo(() => {
    return configurator.pitchOptions.find((p) => p.id === selectedPitchId) || configurator.pitchOptions[0];
  }, [configurator.pitchOptions, selectedPitchId]);

  // Calculations
  const metrics = useMemo(() => {
    const surfaceM2 = parseFloat((widthMeters * heightMeters).toFixed(2));
    
    // Pixel resolution calculation based on pitch in mm
    // Pixel pitch horizontal: pitchOption.pixelPitchH, vertical: pixelPitchV
    const pixelsW = Math.round((widthMeters * 1000) / (selectedPitch.pixelPitchH || 3.91));
    const pixelsH = Math.round((heightMeters * 1000) / (selectedPitch.pixelPitchV || 7.81));
    const totalPixels = pixelsW * pixelsH;

    // Cabinet counts (standard 1.0m x 0.5m)
    const cabinetsCols = Math.max(1, Math.round(widthMeters / 1.0));
    const cabinetsRows = Math.max(1, Math.round(heightMeters / 0.5));
    const totalCabinets = cabinetsCols * cabinetsRows;

    // Weight estimate: ~12kg / m²
    const totalWeightKg = Math.round(surfaceM2 * 12.0);

    // Power consumption: ~240W avg, 720W max per m²
    const avgPowerWatts = Math.round(surfaceM2 * 240);
    const maxPowerWatts = Math.round(surfaceM2 * 720);

    return {
      surfaceM2,
      pixelsW,
      pixelsH,
      totalPixels,
      totalCabinets,
      totalWeightKg,
      avgPowerWatts,
      maxPowerWatts
    };
  }, [widthMeters, heightMeters, selectedPitch]);

  const handleOpenQuote = () => {
    setQuotePrefillData({
      pitch: selectedPitch.name,
      widthMeters,
      heightMeters,
      surfaceM2: metrics.surfaceM2,
      resolutionPx: `${metrics.pixelsW} x ${metrics.pixelsH} px (${metrics.totalPixels.toLocaleString('fr-FR')} px)`,
      cabinets: metrics.totalCabinets,
      totalWeightKg: metrics.totalWeightKg,
      avgPowerWatts: metrics.avgPowerWatts
    });
    setIsQuoteModalOpen(true);
  };

  return (
    <section id="configurator" className={`py-16 border-t border-white/5 relative ${
      !configurator.visible ? 'opacity-40 border-2 border-dashed border-red-500/40 p-4 rounded-3xl m-4' : ''
    }`}>
      <HiddenOverlayBadge visible={configurator.visible} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#c6ff00]/10 border border-[#c6ff00]/20 text-[#c6ff00] text-xs font-mono font-bold tracking-wider mb-3">
              <EditableText
                value={configurator.badge}
                onSave={(val) => updateField('configurator', 'badge', val)}
              />
            </div>
            <h2 className="font-tech text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              <EditableText
                value={configurator.title}
                onSave={(val) => updateField('configurator', 'title', val)}
                multiline
              />
            </h2>
            <div className="text-slate-400 text-sm sm:text-base mt-2">
              <EditableText
                value={configurator.subtitle}
                onSave={(val) => updateField('configurator', 'subtitle', val)}
                multiline
              />
            </div>
          </div>

          <CardSwitch
            visible={configurator.visible}
            onToggle={() => toggleSectionVisibility('configurator')}
            label="Section Configurateur"
          />
        </div>

        {/* Configurator Box */}
        <div className="rounded-3xl border border-white/10 bg-[#0c0f16] p-6 sm:p-8 lg:p-10 shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            {/* Left Column: Sliders & Pitch options (7 cols) */}
            <div className="lg:col-span-7 space-y-8">
              {/* Pitch Selector */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-3">
                  1. Choisissez le pas de pixel (Pitch)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {configurator.pitchOptions.map((pitch) => {
                    const isSelected = pitch.id === selectedPitchId;
                    return (
                      <button
                        key={pitch.id}
                        type="button"
                        onClick={() => setSelectedPitchId(pitch.id)}
                        className={`p-4 rounded-xl border text-left transition-all relative ${
                          isSelected
                            ? 'bg-[#c6ff00]/10 border-[#c6ff00] shadow-[0_0_20px_rgba(198,255,0,0.15)]'
                            : 'bg-white/[0.02] border-white/10 hover:border-white/20'
                        }`}
                      >
                        {isSelected && (
                          <span className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-[#c6ff00] text-black flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </span>
                        )}
                        <div className="font-tech text-base font-bold text-white mb-1">
                          {pitch.name}
                        </div>
                        <div className="text-xs text-[#c6ff00] font-mono font-medium">
                          {pitch.transparency}% Transparence
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1">
                          Recul : {pitch.minDistance}
                        </div>
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-slate-400 mt-2 italic">
                  Recommandé pour : <span className="text-slate-200">{selectedPitch.bestFor}</span>
                </p>
              </div>

              {/* Dimension Sliders */}
              <div className="space-y-6 bg-white/[0.02] p-6 rounded-2xl border border-white/5">
                {/* Width Slider */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-mono uppercase tracking-wider text-slate-300">
                      2. Largeur de la vitrine (mètres)
                    </span>
                    <span className="font-mono font-bold text-lg text-[#c6ff00]">
                      {widthMeters.toFixed(1)} m
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="10.0"
                    step="0.5"
                    value={widthMeters}
                    onChange={(e) => setWidthMeters(parseFloat(e.target.value))}
                    className="w-full accent-[#c6ff00] cursor-pointer h-2 bg-slate-800 rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
                    <span>1.0 m (1 dalle)</span>
                    <span>5.0 m</span>
                    <span>10.0 m (Grande façade)</span>
                  </div>
                </div>

                {/* Height Slider */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-mono uppercase tracking-wider text-slate-300">
                      3. Hauteur de la vitrine (mètres)
                    </span>
                    <span className="font-mono font-bold text-lg text-[#c6ff00]">
                      {heightMeters.toFixed(1)} m
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="6.0"
                    step="0.5"
                    value={heightMeters}
                    onChange={(e) => setHeightMeters(parseFloat(e.target.value))}
                    className="w-full accent-[#c6ff00] cursor-pointer h-2 bg-slate-800 rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
                    <span>1.0 m</span>
                    <span>3.0 m</span>
                    <span>6.0 m</span>
                  </div>
                </div>
              </div>

              {/* Disclaimer */}
              <div className="text-xs text-slate-500 leading-relaxed">
                <EditableText
                  value={configurator.disclaimer}
                  onSave={(val) => updateField('configurator', 'disclaimer', val)}
                  multiline
                />
              </div>
            </div>

            {/* Right Column: Live Calculated Results & Instant Quote (5 cols) */}
            <div className="lg:col-span-5 flex flex-col justify-between p-6 sm:p-8 rounded-2xl bg-gradient-to-b from-[#131722] to-[#090b10] border border-white/10 shadow-inner">
              <div>
                <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/10">
                  <span className="font-tech text-xs tracking-wider text-slate-300 uppercase">
                    Bilan Technique Instantané
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#c6ff00]/15 text-[#c6ff00] text-[10px] font-mono font-bold">
                    TEMPS RÉEL
                  </span>
                </div>

                {/* Grid of calculations */}
                <div className="space-y-4 mb-8">
                  {/* Surface */}
                  <div className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-xs text-slate-400 flex items-center gap-2">
                      <Maximize className="w-3.5 h-3.5 text-slate-500" /> Surface d'affichage
                    </span>
                    <span className="font-tech text-base font-bold text-white">
                      {metrics.surfaceM2} m²
                    </span>
                  </div>

                  {/* Resolution */}
                  <div className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-xs text-slate-400 flex items-center gap-2">
                      <Cpu className="w-3.5 h-3.5 text-slate-500" /> Résolution matrice
                    </span>
                    <div className="text-right">
                      <div className="font-tech text-base font-bold text-[#c6ff00]">
                        {metrics.pixelsW} × {metrics.pixelsH} px
                      </div>
                      <div className="text-[10px] font-mono text-slate-500">
                        {metrics.totalPixels.toLocaleString('fr-FR')} pixels au total
                      </div>
                    </div>
                  </div>

                  {/* Estimated cabinets */}
                  <div className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-xs text-slate-400 flex items-center gap-2">
                      <Sliders className="w-3.5 h-3.5 text-slate-500" /> Modules dalles WP
                    </span>
                    <span className="font-tech text-sm font-bold text-white">
                      ~ {metrics.totalCabinets} dalles modulaires
                    </span>
                  </div>

                  {/* Weight */}
                  <div className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-xs text-slate-400 flex items-center gap-2">
                      <Gauge className="w-3.5 h-3.5 text-slate-500" /> Poids total structure
                    </span>
                    <span className="font-tech text-sm font-bold text-white">
                      ~ {metrics.totalWeightKg} kg
                    </span>
                  </div>

                  {/* Power consumption */}
                  <div className="flex justify-between items-center py-2">
                    <span className="text-xs text-slate-400 flex items-center gap-2">
                      <Zap className="w-3.5 h-3.5 text-slate-500" /> Puissance estimée
                    </span>
                    <div className="text-right">
                      <div className="font-tech text-sm font-bold text-white">
                        {metrics.avgPowerWatts} W (moy.)
                      </div>
                      <div className="text-[10px] font-mono text-slate-500">
                        Max {metrics.maxPowerWatts} W
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div>
                <button
                  type="button"
                  onClick={handleOpenQuote}
                  className="w-full gradient-pixiatech hover:opacity-95 text-white font-tech font-bold text-sm py-4 rounded-xl shadow-[0_0_25px_rgba(239,68,68,0.3)] flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all"
                >
                  <FileText className="w-4 h-4" />
                  <span>Obtenir mon devis chiffré personnalisé</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <p className="text-[11px] text-center text-slate-400 mt-2">
                  Devis gratuit sous 2h • Modélisation 3D offerte de votre vitrine
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
