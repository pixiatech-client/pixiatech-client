import React from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calculator, 
  Info, 
  Grid, 
  Maximize2, 
  Layout as LayoutIcon, 
  Monitor,
  RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ScreenViewer from './Screen3D';

export interface ConfigState {
  width: number;
  height: number;
  isCurved: boolean;
  curveLeft: number;
  curveRight: number;
  envColor: string;
  gridColor: string;
}

interface StepDimensionsProps {
  state: ConfigState;
  updateState: (val: Partial<ConfigState>) => void;
  setIsInteracting?: (val: boolean) => void;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  t: (key: string, params?: any) => string;
}

export default function StepDimensions({ state, updateState, setIsInteracting, isDarkMode, setIsDarkMode, t }: StepDimensionsProps) {
  
  const calculateRatio = (w: number, h: number) => {
    const gcd = (a: number, b: number): number => b ? gcd(b, a % b) : a;
    const factor = gcd(Math.round(w * 100), Math.round(h * 100));
    const rW = Math.round(w * 100) / factor;
    const rH = Math.round(h * 100) / factor;
    return `${rW}:${rH}`;
  };

  const curveOptions = [-30, -15, 0, 15, 30];

  return (
    <div className="flex flex-col space-y-6 bg-transparent max-w-7xl mx-auto px-4 py-4">
      {/* Header */}
      <div className="w-full mb-4">
        <h2 className="text-[32px] md:text-[40px] font-black text-center tracking-tight leading-none uppercase text-slate-900">
          Dimensions de l'écran
        </h2>
        <p className="text-center text-[14px] font-medium mt-3 text-slate-500">
          Ajustez la largeur et la hauteur pour votre projet.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: Controls */}
        <div className="lg:col-span-12 xl:col-span-5 flex flex-col gap-4">
          <div className="bg-white rounded-[3rem] p-10 flex flex-col gap-8 shadow-xl border-[4px] border-white relative overflow-hidden h-full">
            {/* Subtle glass effect for the card */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />

            
            {/* Flat vs Curved Toggle */}
            <div className="space-y-3 relative z-10">
              <label className="text-[11px] uppercase tracking-wider font-bold ml-2 text-slate-600">
                Configuration de l'Écran
              </label>
              <div className="p-1 bg-slate-900/5 backdrop-blur-md rounded-2xl border border-slate-900/10 flex gap-1">
                <button
                  onClick={() => updateState({ isCurved: false, curveLeft: 0, curveRight: 0 })}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all duration-300 font-bold text-xs ${
                    !state.isCurved 
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                    : 'text-slate-400 hover:bg-white/50'
                  }`}
                >
                  <LayoutIcon className="w-4 h-4" />
                  PLAT
                </button>
                <button
                  onClick={() => updateState({ isCurved: true })}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all duration-300 font-bold text-xs ${
                    state.isCurved 
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                    : 'text-slate-400 hover:bg-white/50'
                  }`}
                >
                  <RotateCcw className="w-4 h-4 rotate-45" />
                  INCURVÉ
                </button>
              </div>
            </div>

            {/* Dimension Sliders */}
            <div
              onPointerDown={(e) => { e.stopPropagation(); setIsInteracting?.(true); }}
              onPointerUp={() => setIsInteracting?.(false)}
              onPointerLeave={() => setIsInteracting?.(false)}
              className="space-y-6"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] uppercase tracking-[0.2em] font-black text-slate-500 ml-2">Largeur Totale (m)</span>
                    <div className="flex items-center bg-white rounded-full border border-slate-200 px-3 py-1 shadow-sm">
                      <button 
                        onClick={() => updateState({ width: Math.max(0.5, state.width - 0.5) })}
                        className="p-1 text-slate-400 hover:text-slate-900 transition-colors"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <input 
                        type="number"
                        step="0.01"
                        value={state.width}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (!isNaN(val)) updateState({ width: val });
                        }}
                        className="w-20 text-center text-lg font-black text-slate-800 bg-transparent border-none appearance-none focus:outline-none focus:ring-0"
                      />
                      <button 
                        onClick={() => updateState({ width: Math.min(50, state.width + 0.5) })}
                        className="p-1 text-slate-400 hover:text-slate-900 transition-colors"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                </div>
                <div className="relative group px-2">
                  <input
                    type="range" min="0.5" max="20" step="0.5"
                    value={state.width}
                    onChange={(e) => updateState({ width: parseFloat(e.target.value) })}
                    className="w-full h-3 bg-slate-200 rounded-full appearance-none cursor-pointer accent-[#c6ff00]"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] uppercase tracking-[0.2em] font-black text-slate-500 ml-2">Hauteur Totale (m)</span>
                    <div className="flex items-center bg-white rounded-full border border-slate-200 px-3 py-1 shadow-sm">
                      <button 
                        onClick={() => updateState({ height: Math.max(0.5, state.height - 0.5) })}
                        className="p-1 text-slate-400 hover:text-slate-900 transition-colors"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <input 
                        type="number"
                        step="0.01"
                        value={state.height}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (!isNaN(val)) updateState({ height: val });
                        }}
                        className="w-20 text-center text-lg font-black text-slate-800 bg-transparent border-none appearance-none focus:outline-none focus:ring-0"
                      />
                      <button 
                        onClick={() => updateState({ height: Math.min(20, state.height + 0.5) })}
                        className="p-1 text-slate-400 hover:text-slate-900 transition-colors"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                </div>
                <div className="relative group px-2">
                  <input
                    type="range" min="0.5" max="12" step="0.5"
                    value={state.height}
                    onChange={(e) => updateState({ height: parseFloat(e.target.value) })}
                    className="w-full h-3 bg-slate-200 rounded-full appearance-none cursor-pointer accent-[#c6ff00]"
                  />
                </div>
              </div>

              {/* Color Controls (Enabled in light mode, disabled in dark mode) */}
              <div className={`grid grid-cols-2 gap-4 pt-2 transition-all duration-500 ${isDarkMode ? "opacity-30 pointer-events-none grayscale" : "opacity-100"}`}>
                <div className="space-y-3">
                  <label className="text-[10px] uppercase tracking-wider font-bold text-slate-500 ml-1">Décor (Fond)</label>
                  <div className="flex items-center gap-3 p-2 bg-white/50 rounded-2xl border border-slate-200">
                    <input 
                      type="color" 
                      value={state.envColor} 
                      onChange={(e) => updateState({ envColor: e.target.value })}
                      disabled={isDarkMode}
                      className="w-8 h-8 rounded-lg overflow-hidden cursor-pointer border-none bg-transparent"
                    />
                    <span className="text-[10px] font-mono text-slate-400 uppercase">{state.envColor}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] uppercase tracking-wider font-bold text-slate-500 ml-1">Traits Sol</label>
                  <div className="flex items-center gap-3 p-2 bg-white/50 rounded-2xl border border-slate-200">
                    <input 
                      type="color" 
                      value={state.gridColor} 
                      onChange={(e) => updateState({ gridColor: e.target.value })}
                      disabled={isDarkMode}
                      className="w-8 h-8 rounded-lg overflow-hidden cursor-pointer border-none bg-transparent"
                    />
                    <span className="text-[10px] font-mono text-slate-400 uppercase">{state.gridColor}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Curvature Controls (Conditional) */}
            <AnimatePresence mode="wait">
              {state.isCurved && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-6 p-5 bg-white/30 rounded-3xl border border-white/50 overflow-hidden"
                >
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-600" />
                    Ajustement de Courbure
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
                      <span>Inclinaison de Gauche</span>
                      <span className="bg-white/80 px-2 py-0.5 rounded text-slate-900 border border-slate-200">
                        {state.curveLeft > 0 ? `+${state.curveLeft}` : state.curveLeft}°
                      </span>
                    </div>
                    <input
                      type="range" min="-30" max="30" step="1"
                      value={state.curveLeft}
                      onChange={(e) => updateState({ curveLeft: parseInt(e.target.value) })}
                      className="w-full h-1.5 bg-slate-300/50 rounded-full appearance-none cursor-pointer accent-[#c6ff00]"
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
                      <span>Inclinaison de Droite</span>
                      <span className="bg-white/80 px-2 py-0.5 rounded text-slate-900 border border-slate-200">
                        {state.curveRight > 0 ? `+${state.curveRight}` : state.curveRight}°
                      </span>
                    </div>
                    <input
                      type="range" min="-30" max="30" step="1"
                      value={state.curveRight}
                      onChange={(e) => updateState({ curveRight: parseInt(e.target.value) })}
                      className="w-full h-1.5 bg-slate-300/50 rounded-full appearance-none cursor-pointer accent-[#c6ff00]"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Info Display - Styled like Image 3 */}
            <div className="flex flex-col gap-4">
              {/* Ratio Section */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-blue-600 font-black text-xs uppercase tracking-wider">
                  <Calculator className="w-4 h-4" />
                  Ratio d'aspect actuel
                </div>
                <div className="text-slate-800 font-bold text-sm ml-6">
                  {calculateRatio(state.width, state.height)} (Calculé)
                </div>
              </div>

              {/* Note Section */}
              <div className="flex items-start gap-2 text-blue-500 font-medium text-[10px] uppercase tracking-wide ml-1">
                <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <p>Note: Les dimensions sont basées sur des modules (Dalles) de 50cm x 50cm.</p>
              </div>

              {/* Dalles Section - Neutral headers as requested */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2 text-blue-600 font-black text-xs uppercase tracking-wider">
                  <Grid className="w-4 h-4" />
                  Configuration Dalles
                </div>
                {(() => {
                  const DALLE_SIZE_M = 0.5;
                  const dallesLargeur = Math.ceil(state.width / DALLE_SIZE_M);
                  const dallesHauteur = Math.ceil(state.height / DALLE_SIZE_M);
                  const totalDalles = dallesLargeur * dallesHauteur;
                  return (
                    <div className="flex items-start gap-2 text-blue-500 font-medium text-[10px] uppercase tracking-wide ml-1">
                      <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      <p>Cette configuration utilise <span className="font-black text-blue-600">{totalDalles} dalles</span> ({dallesLargeur} × {dallesHauteur})</p>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: 3D Preview (7/12 width) */}
        <div className="lg:col-span-12 xl:col-span-7 flex flex-col h-full">
          <div 
            className={`rounded-[3.5rem] shadow-xl relative overflow-hidden flex flex-col transition-all duration-700 ease-in-out border-[4px] h-full ${
              isDarkMode ? "bg-slate-950 border-white/5" : "bg-white border-white shadow-xl"
            }`}
            style={{ 
              minHeight: state.isCurved ? '680px' : '500px',
            }}
          >
            <ScreenViewer
              width={state.width}
              height={state.height}
              isCurved={state.isCurved}
              curveLeft={state.curveLeft}
              curveRight={state.curveRight}
              envColor={state.envColor}
              gridColor={state.gridColor}
              isDarkMode={isDarkMode}
              setIsDarkMode={setIsDarkMode}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
