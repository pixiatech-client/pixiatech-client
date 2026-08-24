import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calculator,
  Info,
  Grid,
  Layout as LayoutIcon,
  RotateCcw,
  Circle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';

const ScreenViewer = dynamic(() => import('./Screen3D'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[380px] sm:min-h-[480px] xl:min-h-[600px] flex items-center justify-center bg-slate-900 text-white font-bold uppercase tracking-widest text-[10px] animate-pulse rounded-[3.5rem]">
      Loading 3D...
    </div>
  )
});

interface ConfigState {
  width: number;
  height: number;
  isCurved: boolean;
  curveLeft: number;
  curveRight: number;
  is360: boolean;
  diameter: number;
  cabinetAngle: number;
  envColor: string;
  gridColor: string;
}

interface StepDimensionsProps {
  state: ConfigState;
  updateState: (val: Partial<ConfigState>) => void;
  setIsInteracting?: (val: boolean) => void;
  isDarkMode?: boolean;
  setIsDarkMode?: (val: boolean) => void;
  t: (key: string, params?: any) => string;
  settings?: any;
  isInChat?: boolean;
}

export default function StepDimensions({
  state,
  updateState,
  setIsInteracting,
  isDarkMode: externalIsDarkMode,
  setIsDarkMode: externalSetIsDarkMode,
  t,
  settings,
  isInChat = false
}: StepDimensionsProps) {

  // Local state fallback for dark mode (e.g. inside chatbot wizard flow)
  const [localIsDarkMode, setLocalIsDarkMode] = React.useState(false);
  const isDarkMode = externalIsDarkMode !== undefined ? externalIsDarkMode : localIsDarkMode;
  const setIsDarkMode = externalSetIsDarkMode !== undefined ? externalSetIsDarkMode : setLocalIsDarkMode;

  const maxWidth = state.is360
    ? (settings?.estimationFlow?.sale?.screen360?.maxDiameter ?? settings?.maxWidth ?? 20)
    : state.isCurved
      ? (settings?.estimationFlow?.sale?.curvedScreen?.maxWidth ?? settings?.maxWidth ?? 20)
      : (settings?.estimationFlow?.sale?.flatScreen?.maxWidth ?? settings?.maxWidth ?? 20);
  const maxHeight = state.is360
    ? (settings?.estimationFlow?.sale?.screen360?.maxHeight ?? settings?.maxHeight ?? 10)
    : state.isCurved
      ? (settings?.estimationFlow?.sale?.curvedScreen?.maxHeight ?? settings?.maxHeight ?? 10)
      : (settings?.estimationFlow?.sale?.flatScreen?.maxHeight ?? settings?.maxHeight ?? 10);
  const maxDiameter = settings?.estimationFlow?.sale?.screen360?.maxDiameter ?? 10;
  const curveMin = settings?.estimationFlow?.sale?.curvedScreen?.curveMin ?? -30;
  const curveMax = settings?.estimationFlow?.sale?.curvedScreen?.curveMax ?? 30;

  // Detect desktop breakpoint (xl = 1280px) to apply fixed height on mobile/tablet
  const [isDesktop, setIsDesktop] = React.useState(false);
  const [isDimensionsExpanded, setIsDimensionsExpanded] = React.useState(false);
  React.useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1280);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const calculateRatio = (w: number, h: number) => {
    const gcd = (a: number, b: number): number => b ? gcd(b, a % b) : a;
    const factor = gcd(Math.round(w * 100), Math.round(h * 100));
    const rW = Math.round(w * 100) / factor;
    const rH = Math.round(h * 100) / factor;
    return `${rW}:${rH}`;
  };

  const handleUpdateState = (updates: Partial<ConfigState>) => {
    const nextState = { ...state, ...updates };
    
    if (nextState.is360) {
      const d = nextState.diameter !== undefined ? nextState.diameter : (state.diameter || 1.0);
      const isInterior = nextState.cabinetAngle !== undefined 
        ? nextState.cabinetAngle > 0 
        : (state.cabinetAngle ? state.cabinetAngle > 0 : false);
      
      const modulesX = Math.round((Math.PI * d) / 0.5);
      updates.width = modulesX * 0.5;
      
      const angleStepDeg = 360 / modulesX;
      updates.cabinetAngle = isInterior ? angleStepDeg : -angleStepDeg;
      updates.diameter = d;
    }
    
    updateState(updates);
  };

  return (
    <div className={`flex flex-col space-y-4 bg-transparent w-full mx-auto ${
      isInChat 
        ? "p-0" 
        : "max-w-[1550px] xl:mx-auto xl:pl-16 xl:pr-4"
    }`}>
      {/* Header */}
      {!isInChat && (
        <div className="w-full">
          <h2 className="text-[28px] md:text-[36px] font-black text-center tracking-tight leading-none uppercase text-slate-900">
            {t('wizard.dimensions.title')}
          </h2>
          <p className="text-center text-[13px] font-medium mt-2 text-slate-500">
            {t('wizard.dimensions.description')}
          </p>
        </div>
      )}

      <div className={`grid items-stretch ${isInChat
          ? "grid-cols-1 gap-4"
          : "grid-cols-1 lg:grid-cols-12 lg:gap-6 md:gap-8"
        }`}>
        {/* Configuration Column */}
        <div className={
          isInChat
            ? "flex flex-col gap-4 order-2"
            : "w-full lg:col-span-4 flex flex-col gap-4 order-2 lg:order-1"
        }>
          <div className="flex flex-col gap-5 relative lg:bg-white lg:rounded-3xl lg:p-8 lg:shadow-xl lg:border-[4px] lg:border-white lg:overflow-hidden lg:h-full px-3 py-4">
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />

            {/* Flat vs Curved vs 360 Toggle */}
            <div className="space-y-3 relative z-10">
              <label className="text-[11px] uppercase tracking-wider font-bold ml-2 text-slate-600">
                {t('wizard.dimensions.screenConfig')}
              </label>
              <div className="p-1 bg-slate-900/5 backdrop-blur-md rounded-xl border border-slate-900/10 flex gap-1">
                <button
                  type="button"
                  onClick={() => handleUpdateState({ isCurved: false, is360: false, curveLeft: 0, curveRight: 0, width: 12.0, height: 6.5 })}
                  className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg transition-all duration-300 font-bold text-[10px] sm:text-xs ${!state.isCurved && !state.is360
                      ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                      : 'text-slate-400 hover:bg-white/50'
                    }`}
                >
                  <LayoutIcon className="w-3 h-3" />
                  {t('wizard.dimensions.flat')}
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateState({ isCurved: true, is360: false, width: 12.0, height: 6.5 })}
                  className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg transition-all duration-300 font-bold text-[10px] sm:text-xs ${state.isCurved && !state.is360
                      ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                      : 'text-slate-400 hover:bg-white/50'
                    }`}
                >
                  <RotateCcw className="w-3.5 h-3.5 rotate-45" />
                  {t('wizard.dimensions.curved')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const defaultD = 1.0;
                    const modulesX = Math.round((Math.PI * defaultD) / 0.5);
                    const angleStepDeg = 360 / modulesX;
                    handleUpdateState({
                      isCurved: false,
                      is360: true,
                      height: 2.5,
                      diameter: defaultD,
                      cabinetAngle: -angleStepDeg,
                      curveLeft: 0,
                      curveRight: 0
                    });
                  }}
                  className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg transition-all duration-300 font-bold text-[10px] sm:text-xs ${state.is360
                      ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                      : 'text-slate-400 hover:bg-white/50'
                    }`}
                >
                  <Circle className="w-3 h-3" />
                  {t('wizard.dimensions.360') || '360°'}
                </button>
              </div>
            </div>

            {/* Dimension Sliders Wrapper */}
            <div className="flex flex-col">
              {/* Toggle Button (Mobile only, when curved or 360) */}
              {(state.isCurved || state.is360) && !isDesktop && (
                <button 
                  type="button"
                  onClick={() => setIsDimensionsExpanded(!isDimensionsExpanded)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 font-bold text-xs uppercase tracking-wider transition-all hover:bg-slate-50"
                >
                  <span className="flex items-center gap-2">
                    <LayoutIcon className="w-4 h-4" />
                    {t('wizard.dimensions.dimensionsLabel')}
                  </span>
                  <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isDimensionsExpanded ? 'rotate-90' : ''}`} />
                </button>
              )}

              {/* Dimension Sliders (Accordion) */}
              <div className={`grid transition-[grid-template-rows,opacity,margin,transform] duration-500 ease-in-out origin-top ${
                (!(state.isCurved || state.is360) || isDesktop || isDimensionsExpanded) 
                  ? "grid-rows-[1fr] opacity-100 scale-y-100 " + ((state.isCurved || state.is360) && !isDesktop ? "mt-4" : "mt-0")
                  : "grid-rows-[0fr] opacity-0 scale-y-95 mt-0"
              }`}>
              <div
                onPointerDown={(e) => { e.stopPropagation(); setIsInteracting?.(true); }}
                onPointerUp={() => setIsInteracting?.(false)}
                onPointerLeave={() => setIsInteracting?.(false)}
                className="overflow-hidden"
              >
                <div className="space-y-5 pb-1">
                  {state.is360 ? (
                    <>
                      {/* Cabinet Orientation Selector */}
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-wider font-bold text-slate-500 ml-1">
                          {t('wizard.dimensions.circularView')}
                        </label>
                        <div className="grid grid-cols-2 gap-1 bg-slate-900/5 p-1 rounded-lg border border-slate-900/10">
                          <button
                            type="button"
                            onClick={() => {
                              const d = state.diameter || 1.0;
                              const modulesX = Math.round((Math.PI * d) / 0.5);
                              const angleStepDeg = 360 / modulesX;
                              handleUpdateState({ cabinetAngle: angleStepDeg });
                            }}
                            className={`py-1.5 rounded-md text-xs font-bold transition-all ${
                              state.cabinetAngle > 0
                                ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                                : "text-slate-400 hover:bg-white/50"
                            }`}
                          >
                            {t('wizard.dimensions.interior')}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const d = state.diameter || 1.0;
                              const modulesX = Math.round((Math.PI * d) / 0.5);
                              const angleStepDeg = 360 / modulesX;
                              handleUpdateState({ cabinetAngle: -angleStepDeg });
                            }}
                            className={`py-1.5 rounded-md text-xs font-bold transition-all ${
                              state.cabinetAngle <= 0
                                ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                                : "text-slate-400 hover:bg-white/50"
                            }`}
                          >
                            {t('wizard.dimensions.exterior')}
                          </button>
                        </div>
                      </div>

                      {/* Diameter Slider */}
                      <div className="space-y-3 relative">
                        <div className="flex justify-between items-center">
                          <span className="text-[11px] uppercase tracking-[0.2em] font-black text-slate-500 ml-2">
                            {t('wizard.dimensions.diameterTotal')}
                          </span>
                          <div className="flex items-center bg-white rounded-full border border-slate-200 px-2 py-0.5 shadow-sm transition-all duration-300">
                            <button
                              type="button"
                              onClick={() => handleUpdateState({ diameter: Math.max(1.0, (state.diameter || 1.0) - 0.5) })}
                              className="p-0.5 text-slate-400 hover:text-slate-900 transition-colors"
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                            <input
                              type="number"
                              step="0.5"
                              min="1.0"
                              max={maxDiameter}
                              value={state.diameter || 1.0}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                if (!isNaN(val)) handleUpdateState({ diameter: Math.min(maxDiameter, Math.max(1.0, val)) });
                              }}
                              className="w-10 sm:w-16 text-center text-sm sm:text-base font-black text-slate-800 bg-transparent border-none appearance-none focus:outline-none focus:ring-0"
                            />
                            <button
                              type="button"
                              onClick={() => handleUpdateState({ diameter: Math.min(maxDiameter, (state.diameter || 1.0) + 0.5) })}
                              className="p-0.5 text-slate-400 hover:text-slate-900 transition-colors"
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className="relative group px-2 transition-all duration-300 opacity-100">
                          <input
                            type="range" min="1.0" max={maxDiameter} step="0.5"
                            value={state.diameter || 1.0}
                            onChange={(e) => handleUpdateState({ diameter: parseFloat(e.target.value) })}
                            className="w-full h-3 bg-slate-200 rounded-full appearance-none cursor-pointer accent-[#c6ff00]"
                          />
                        </div>
                      </div>

                      {/* Standard Height Buttons */}
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-wider font-bold text-slate-500 ml-1">
                          {t('wizard.dimensions.standardHeights')}
                        </label>
                        <div className="flex gap-2">
                          {[2.5, 3.0].map((h) => (
                            <button
                              key={h}
                              type="button"
                              onClick={() => handleUpdateState({ height: h })}
                              className={`flex-1 py-1 rounded-lg border text-[10px] sm:text-xs font-bold transition-all ${
                                Math.abs(state.height - h) < 0.05
                                  ? "bg-black text-[#c6ff00] border-black shadow-md"
                                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                              }`}
                            >
                              {h.toFixed(1)} M
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    /* Width Slider */
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] uppercase tracking-[0.2em] font-black text-slate-500 ml-2">{t('wizard.dimensions.widthTotal')}</span>
                        <div className="flex items-center bg-white rounded-full border border-slate-200 px-2 py-0.5 shadow-sm">
                          <button
                            type="button"
                            onClick={() => handleUpdateState({ width: Math.max(0.5, state.width - 0.5) })}
                            className="p-0.5 text-slate-400 hover:text-slate-900 transition-colors"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>
                          <input
                            type="number"
                            step="0.01"
                            min="0.5"
                            max={maxWidth}
                            value={state.width}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              if (!isNaN(val)) handleUpdateState({ width: Math.min(maxWidth, Math.max(0.5, val)) });
                            }}
                            className="w-10 sm:w-16 text-center text-sm sm:text-base font-black text-slate-800 bg-transparent border-none appearance-none focus:outline-none focus:ring-0"
                          />
                          <button
                            type="button"
                            onClick={() => handleUpdateState({ width: Math.min(maxWidth, state.width + 0.5) })}
                            className="p-0.5 text-slate-400 hover:text-slate-900 transition-colors"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="relative group px-2">
                        <input
                          type="range" min="0.5" max={maxWidth} step="0.5"
                          value={state.width}
                          onChange={(e) => handleUpdateState({ width: parseFloat(e.target.value) })}
                          className="w-full h-3 bg-slate-200 rounded-full appearance-none cursor-pointer accent-[#c6ff00]"
                        />
                      </div>
                    </div>
                  )}

                  {/* Height Slider (Used for both normal and 360 modes) */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] uppercase tracking-[0.2em] font-black text-slate-500 ml-2">
                        {state.is360 ? t('wizard.dimensions.heightStandard') : t('wizard.dimensions.heightTotal')}
                      </span>
                      <div className="flex items-center bg-white rounded-full border border-slate-200 px-2 py-0.5 shadow-sm">
                        <button
                          type="button"
                          onClick={() => handleUpdateState({ height: Math.max(0.5, state.height - 0.5) })}
                          className="p-0.5 text-slate-400 hover:text-slate-900 transition-colors"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <input
                          type="number"
                          step="0.01"
                          min="0.5"
                          max={maxHeight}
                          value={state.height}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val)) handleUpdateState({ height: Math.min(maxHeight, Math.max(0.5, val)) });
                          }}
                          className="w-10 sm:w-16 text-center text-sm sm:text-base font-black text-slate-800 bg-transparent border-none appearance-none focus:outline-none focus:ring-0"
                        />
                        <button
                          type="button"
                          onClick={() => handleUpdateState({ height: Math.min(maxHeight, state.height + 0.5) })}
                          className="p-0.5 text-slate-400 hover:text-slate-900 transition-colors"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="relative group px-2">
                      <input
                        type="range" min="0.5" max={maxHeight} step="0.5"
                        value={state.height}
                        onChange={(e) => handleUpdateState({ height: parseFloat(e.target.value) })}
                        className="w-full h-3 bg-slate-200 rounded-full appearance-none cursor-pointer accent-[#c6ff00]"
                      />
                    </div>
                  </div>


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
                  className="space-y-4 p-4 bg-slate-50 rounded-3xl border border-slate-100 overflow-hidden"
                >
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-teal-600" />
                    {t('wizard.dimensions.curvatureAdjust')}
                  </h3>

                  <div className="space-y-3">
                    <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
                      <span>{t('wizard.dimensions.leftIncline')}</span>
                      <span className="bg-white/80 px-2 py-0.5 rounded text-slate-900 border border-slate-200">
                        {state.curveLeft > 0 ? `+${state.curveLeft}` : state.curveLeft}°
                      </span>
                    </div>
                    <input
                      type="range" min={curveMin} max={curveMax} step="1"
                      value={state.curveLeft}
                      onChange={(e) => handleUpdateState({ curveLeft: parseInt(e.target.value) })}
                      className="w-full h-1.5 bg-slate-300/50 rounded-full appearance-none cursor-pointer accent-[#c6ff00]"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
                      <span>{t('wizard.dimensions.rightIncline')}</span>
                      <span className="bg-white/80 px-2 py-0.5 rounded text-slate-900 border border-slate-200">
                        {state.curveRight > 0 ? `+${state.curveRight}` : state.curveRight}°
                      </span>
                    </div>
                    <input
                      type="range" min={curveMin} max={curveMax} step="1"
                      value={state.curveRight}
                      onChange={(e) => handleUpdateState({ curveRight: parseInt(e.target.value) })}
                      className="w-full h-1.5 bg-slate-300/50 rounded-full appearance-none cursor-pointer accent-[#c6ff00]"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Info Display */}
            <div className="flex flex-col gap-3 pt-2 border-t border-slate-100">
              {/* Ratio Section */}
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-teal-700 font-black text-xs uppercase tracking-wider">
                  <Calculator className="w-4 h-4" />
                  {t('wizard.dimensions.aspectRatio')}
                </div>
                <div className="text-slate-800 font-bold text-sm ml-6">
                  {calculateRatio(state.width, state.height)} ({t('wizard.dimensions.calculated')})
                </div>
              </div>

              {/* Surface totale */}
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-teal-700 font-black text-xs uppercase tracking-wider">
                  <Calculator className="w-4 h-4" />
                  {t('wizard.dimensions.totalSurface')}
                </div>
                <div className="text-slate-800 font-bold text-sm ml-6 font-mono">
                  {(state.width * state.height).toFixed(2)} m²
                </div>
              </div>

              {/* Note Section */}
              <div className="flex items-start gap-2 text-slate-500 font-medium text-[10px] uppercase tracking-wide ml-1">
                <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <p>{t('wizard.dimensions.note')}</p>
              </div>

              {/* Dalles Section */}
              <div className="space-y-1 pt-1 border-t border-slate-100">
                <div className="flex items-center gap-2 text-teal-700 font-black text-xs uppercase tracking-wider">
                  <Grid className="w-4 h-4" />
                  {t('wizard.dimensions.tileConfig')}
                </div>
                {(() => {
                  const DALLE_SIZE_M = 0.5;
                  const dallesLargeur = Math.ceil(state.width / DALLE_SIZE_M);
                  const dallesHauteur = Math.ceil(state.height / DALLE_SIZE_M);
                  const totalDalles = dallesLargeur * dallesHauteur;
                  return (
                    <div className="flex items-start gap-2 text-slate-500 font-medium text-[10px] uppercase tracking-wide ml-1">
                      <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      <p dangerouslySetInnerHTML={{
                        __html: t('wizard.dimensions.tileCount', {
                          count: totalDalles.toString(),
                          w: dallesLargeur.toString(),
                          h: dallesHauteur.toString()
                        })
                      }} />
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>

        {/* 3D Preview Column */}
        <div className={
          isInChat
            ? "flex flex-col order-1"
            : "w-full lg:col-span-8 flex flex-col lg:h-full order-1 lg:order-2"
        }>
          <div
            className={`relative overflow-hidden flex flex-col transition-all duration-700 ease-in-out rounded-3xl shadow-xl border-[4px] ${
              isDarkMode
                ? "bg-slate-950 border-white/5"
                : "bg-white border-white"
            } ${isInChat ? "" : "lg:h-full"}`}
            style={{
              height: !isDesktop && !isInChat ? '280px' : undefined,
              minHeight: isInChat
                ? ((state.isCurved || state.is360) ? '280px' : '200px')
                : (isDesktop ? ((state.isCurved || state.is360) ? '680px' : 'auto') : '280px'),
            }}
          >
            <ScreenViewer
              width={state.width}
              height={state.height}
              isCurved={state.isCurved}
              is360={state.is360}
              diameter={state.diameter}
              cabinetAngle={state.cabinetAngle}
              curveLeft={state.curveLeft}
              curveRight={state.curveRight}
              envColor={state.envColor}
              gridColor={state.gridColor}
              isDarkMode={isDarkMode}
              setIsDarkMode={setIsDarkMode}
              videoUrl={settings?.previewScreenVideoUrl || settings?.previewScreenImageUrl}
              t={t}
              maxDistance={settings?.zoomMaxDistance}
              minDistance={settings?.zoomMinDistance}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
