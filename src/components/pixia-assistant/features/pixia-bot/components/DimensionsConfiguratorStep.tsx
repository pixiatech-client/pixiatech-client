'use client';

import { ArrowRight, Circle, Layers, Maximize2, RectangleHorizontal } from 'lucide-react';
import { useMemo, useState } from 'react';
import { t } from '../../../core/i18n/translations';
import type { Language, ScreenShape } from '../../../core/types';
import { LedWall3DSimulator } from './LedWall3DSimulator';
import { RollingNumberStepper } from './RollingNumberStepper';

interface DimensionsConfiguratorStepProps {
  lang: Language;
  initialWidth?: number | null;
  initialHeight?: number | null;
  initialShape?: ScreenShape;
  initialCurveLeft?: number;
  initialCurveRight?: number;
  onConfirm: (
    widthRaw: string,
    heightRaw: string,
    screenShape: ScreenShape,
    curveLeft?: number,
    curveRight?: number
  ) => void;
}

interface ShapeOption {
  id: ScreenShape;
  labelFr: string;
  labelEn: string;
  hintFr: string;
  hintEn: string;
}

const SHAPE_OPTIONS: ShapeOption[] = [
  {
    id: 'flat',
    labelFr: 'Plat',
    labelEn: 'Flat',
    hintFr: 'Mur LED droit classique',
    hintEn: 'Classic straight LED wall',
  },
  {
    id: 'curved',
    labelFr: 'Incurvé',
    labelEn: 'Curved',
    hintFr: 'Incurvé avant, arrière ou forme en S',
    hintEn: 'Concave, convex, or S-shaped wall',
  },
  {
    id: '360',
    labelFr: '360°',
    labelEn: '360°',
    hintFr: 'Cylindre panoramique 360°',
    hintEn: '360° cylindrical LED screen',
  },
];

const QUICK_PRESETS: Array<{ w: number; h: number; label: string }> = [
  { w: 3, h: 2, label: '3×2 m' },
  { w: 4, h: 2.5, label: '4×2.5 m' },
  { w: 5, h: 3, label: '5×3 m' },
  { w: 6, h: 3.5, label: '6×3.5 m' },
  { w: 8, h: 4.5, label: '8×4.5 m' },
];

function computeAspectLabel(w: number, h: number, lang: Language): string {
  if (w <= 0 || h <= 0) return '—';
  const ratio = w / h;
  if (Math.abs(ratio - 16 / 9) < 0.09) return '16:9';
  if (Math.abs(ratio - 16 / 10) < 0.08) return '16:10';
  if (Math.abs(ratio - 4 / 3) < 0.07) return '4:3';
  if (Math.abs(ratio - 1) < 0.06) return '1:1';
  if (Math.abs(ratio - 21 / 9) < 0.14) return '21:9';
  return `${ratio.toFixed(2)}:1 (${lang === 'fr' ? 'Libre' : 'Custom'})`;
}

function clamp(num: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, num));
}

export function DimensionsConfiguratorStep({
  lang,
  initialWidth,
  initialHeight,
  initialShape = 'flat',
  initialCurveLeft,
  initialCurveRight,
  onConfirm,
}: DimensionsConfiguratorStepProps) {
  const normalizedInitialShape: ScreenShape =
    initialShape === 'curved' || initialShape === '360' ? initialShape : 'flat';
  const [shape, setShape] = useState<ScreenShape>(normalizedInitialShape);
  const [curveLeft, setCurveLeft] = useState<number>(initialCurveLeft ?? 20);
  const [curveRight, setCurveRight] = useState<number>(initialCurveRight ?? 20);
  const [widthStr, setWidthStr] = useState<string>(String(initialWidth ?? 4));
  const [heightStr, setHeightStr] = useState<string>(String(initialHeight ?? 2.5));

  const parsedW = parseFloat(widthStr.replace(',', '.'));
  const parsedH = parseFloat(heightStr.replace(',', '.'));
  const safeW = Number.isFinite(parsedW) && parsedW > 0 ? clamp(parsedW, 0.5, 25) : 4;
  const safeH = Number.isFinite(parsedH) && parsedH > 0 ? clamp(parsedH, 0.5, 15) : 2.5;

  const sliderW = clamp(safeW, 1, 12);
  const sliderH = clamp(safeH, 1, 8);

  const area = useMemo(() => Math.round(safeW * safeH * 100) / 100, [safeW, safeH]);
  const tilesCols = Math.max(1, Math.round(safeW / 0.5));
  const tilesRows = Math.max(1, Math.round(safeH / 0.5));
  const totalTiles = tilesCols * tilesRows;
  const aspectLabel = useMemo(() => computeAspectLabel(safeW, safeH, lang), [safeW, safeH, lang]);

  const activeShapeMeta = SHAPE_OPTIONS.find((s) => s.id === shape) ?? SHAPE_OPTIONS[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(
      widthStr.replace(',', '.'),
      heightStr.replace(',', '.'),
      shape,
      shape === 'curved' ? curveLeft : undefined,
      shape === 'curved' ? curveRight : undefined
    );
  };

  const renderShapeIcon = (id: ScreenShape) => {
    if (id === 'flat') return <RectangleHorizontal className="h-3.5 w-3.5" />;
    if (id === 'curved') return <Layers className="h-3.5 w-3.5" />;
    return <Circle className="h-3.5 w-3.5" />;
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-white/12 bg-[#202025] p-3.5 space-y-3"
    >
      {/* Title + Shape Hint */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h4 className="text-xs font-semibold text-white">
            {lang === 'fr' ? 'Dimensions de l’écran' : 'Screen dimensions'}
          </h4>
          <p className="text-[11px] text-[#9E9EA7]">
            {lang === 'fr' ? activeShapeMeta.hintFr : activeShapeMeta.hintEn}
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full border border-[#38BDF8]/40 bg-[#38BDF8]/12 px-2.5 py-0.5 text-[10.5px] font-mono font-semibold text-[#93C5FD] tabular-nums">
          <Maximize2 className="h-3 w-3" />
          {area} m²
        </span>
      </div>

      {/* Screen Form / Geometry Selector (Flat / Curved / 360°) */}
      <div className="grid grid-cols-3 gap-2">
        {SHAPE_OPTIONS.map((opt) => {
          const active = shape === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setShape(opt.id)}
              className={`flex flex-col items-center justify-center gap-1 rounded-xl border px-2 py-2 text-center transition-all cursor-pointer ${
                active
                  ? 'border-[#38BDF8]/70 bg-[#38BDF8]/14 text-white shadow-[0_0_12px_rgba(56,189,248,0.18)]'
                  : 'border-white/10 bg-[#151519] text-[#A1A1AA] hover:border-white/25 hover:text-white'
              }`}
            >
              <span className={active ? 'text-[#38BDF8]' : 'text-[#8E8E98]'}>
                {renderShapeIcon(opt.id)}
              </span>
              <span className="text-[10.5px] font-medium leading-tight truncate max-w-full">
                {lang === 'fr' ? opt.labelFr : opt.labelEn}
              </span>
            </button>
          );
        })}
      </div>

      {/* Interactive 3D Simulator Stage + Live Telemetry Chips */}
      <div className="relative rounded-xl border border-white/10 bg-[#121216] p-2 overflow-hidden">
        <LedWall3DSimulator
          lang={lang}
          width={safeW}
          height={safeH}
          shape={shape}
          curveLeft={curveLeft}
          curveRight={curveRight}
          onCurveLeftChange={setCurveLeft}
          onCurveRightChange={setCurveRight}
        />

        {/* Live Telemetry Chips below simulator */}
        <div className="relative z-10 mt-2 grid grid-cols-3 gap-1.5 border-t border-white/8 pt-2 text-center">
          <div>
            <p className="text-[9.5px] uppercase tracking-wider text-[#71717A]">
              {lang === 'fr' ? 'Surface' : 'Area'}
            </p>
            <p className="text-xs font-mono font-semibold text-white tabular-nums">{area} m²</p>
          </div>
          <div>
            <p className="text-[9.5px] uppercase tracking-wider text-[#71717A]">
              {lang === 'fr' ? 'Dalles 50cm' : 'Tiles 50cm'}
            </p>
            <p className="text-xs font-mono font-semibold text-[#93C5FD] tabular-nums">
              {totalTiles} ({tilesCols}×{tilesRows})
            </p>
          </div>
          <div>
            <p className="text-[9.5px] uppercase tracking-wider text-[#71717A]">Ratio</p>
            <p className="text-xs font-mono font-semibold text-[#C084FC] tabular-nums">
              {aspectLabel.split(' ')[0]}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Size Presets */}
      <div className="flex flex-wrap gap-1.5">
        {QUICK_PRESETS.map((preset) => {
          const isCurrent = Math.abs(safeW - preset.w) < 0.05 && Math.abs(safeH - preset.h) < 0.05;
          return (
            <button
              key={preset.label}
              type="button"
              onClick={() => {
                setWidthStr(String(preset.w));
                setHeightStr(String(preset.h));
              }}
              className={`rounded-lg border px-2 py-1 text-[10.5px] font-mono tabular-nums transition-colors cursor-pointer ${
                isCurrent
                  ? 'border-[#38BDF8] bg-[#38BDF8]/15 text-[#BAE6FD] font-semibold'
                  : 'border-white/10 bg-[#141417] text-[#A1A1AA] hover:text-white hover:border-white/25'
              }`}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      {/* Width & Height Synchronized Sliders + Rolling Digit Steppers */}
      <div className="space-y-3 pt-0.5">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-medium text-[#D4D4D8]">
              {t(lang, 'ui.widthLabel')}
            </span>
            <RollingNumberStepper
              value={safeW}
              min={0.5}
              max={25}
              step={0.5}
              unit="m"
              compact
              ariaLabel={t(lang, 'ui.widthLabel')}
              onChange={(next) => setWidthStr(String(next))}
            />
          </div>
          <input
            type="range"
            min="1"
            max="12"
            step="0.5"
            value={sliderW}
            onChange={(e) => setWidthStr(e.target.value)}
            aria-label={t(lang, 'ui.widthLabel')}
            className="w-full h-1.5 rounded-full accent-[#38BDF8] bg-white/10 cursor-pointer"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-medium text-[#D4D4D8]">
              {t(lang, 'ui.heightLabel')}
            </span>
            <RollingNumberStepper
              value={safeH}
              min={0.5}
              max={15}
              step={0.5}
              unit="m"
              compact
              ariaLabel={t(lang, 'ui.heightLabel')}
              onChange={(next) => setHeightStr(String(next))}
            />
          </div>
          <input
            type="range"
            min="1"
            max="8"
            step="0.5"
            value={sliderH}
            onChange={(e) => setHeightStr(e.target.value)}
            aria-label={t(lang, 'ui.heightLabel')}
            className="w-full h-1.5 rounded-full accent-[#C084FC] bg-white/10 cursor-pointer"
          />
        </div>
      </div>

      <button
        type="submit"
        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-[#141416] hover:bg-[#E4E4E7] transition-colors cursor-pointer min-h-[42px]"
      >
        <span>{t(lang, 'ui.validateDimensions')}</span>
        <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </form>
  );
}
