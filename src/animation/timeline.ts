export interface TimelineConfig {
  /** Core intro sequence duration in ms before resting on the final logo */
  readonly totalDurationMs: number;
  /** Hold + reset duration appended when continuous loop mode is active */
  readonly loopTailMs: number;
}

export const DEFAULT_TIMELINE_CONFIG: TimelineConfig = {
  totalDurationMs: 2850,
  loopTailMs: 1800,
};

export interface AnimationPhaseState {
  readonly cycleProgress: number;
  readonly phase:
    | 'blueprint'
    | 'emblem'
    | 'emblem-morph'
    | 'wireframe'
    | 'reveal'
    | 'complete'
    | 'reset';
  readonly gridProgress: number;
  readonly compassProgress: number;
  readonly diagonalsProgress: number;
  readonly emblemOpacity: number;
  readonly emblemScale: number;
  readonly emblemWireProgress: number;
  readonly emblemWireOpacity: number;
  readonly emblemWireScale: number;
  readonly emblemHorizonStretch: number;
  readonly wireframeProgress: number;
  readonly blueprintOpacity: number;
  readonly fillProgress: number;
  readonly logoOpacity: number;
  readonly logoScale: number;
}

export function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
}

export function easeOutCubic(t: number): number {
  const x = clamp01(t);
  return 1 - Math.pow(1 - x, 3);
}

export function easeInOutQuart(t: number): number {
  const x = clamp01(t);
  return x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2;
}

export function easeOutExpo(t: number): number {
  const x = clamp01(t);
  return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
}

export function segmentProgress(
  elapsedMs: number,
  startMs: number,
  endMs: number,
): number {
  if (endMs <= startMs) return elapsedMs >= endMs ? 1 : 0;
  return clamp01((elapsedMs - startMs) / (endMs - startMs));
}

export function computePhaseState(
  elapsedMs: number,
  reducedMotion = false,
  config: TimelineConfig = DEFAULT_TIMELINE_CONFIG,
  looping = false,
): AnimationPhaseState {
  if (reducedMotion) {
    return {
      cycleProgress: 1,
      phase: 'complete',
      gridProgress: 0,
      compassProgress: 0,
      diagonalsProgress: 0,
      emblemOpacity: 0,
      emblemScale: 1,
      emblemWireProgress: 0,
      emblemWireOpacity: 0,
      emblemWireScale: 1,
      emblemHorizonStretch: 0,
      wireframeProgress: 1,
      blueprintOpacity: 0,
      fillProgress: 1,
      logoOpacity: 1,
      logoScale: 1,
    };
  }

  const total = Math.max(1000, config.totalDurationMs);
  const loopCycle = total + Math.max(400, config.loopTailMs);
  const t = looping
    ? ((elapsedMs % loopCycle) + loopCycle) % loopCycle
    : Math.max(0, Math.min(elapsedMs, total));

  const cycleProgress = Math.min(1, t / total);

  const gridProgress = easeOutCubic(segmentProgress(t, 0, 520));
  const compassProgress = easeOutCubic(segmentProgress(t, 60, 620));
  const diagonalsProgress = easeOutCubic(segmentProgress(t, 90, 660));

  const emblemEnter = easeOutCubic(segmentProgress(t, 280, 620));
  const emblemColorFadeOut = easeInOutQuart(segmentProgress(t, 1020, 1420));
  const emblemOpacity = clamp01(emblemEnter * (1 - emblemColorFadeOut));
  const emblemScale =
    0.88 + 0.12 * easeOutExpo(segmentProgress(t, 280, 680)) + 0.03 * emblemColorFadeOut;

  const emblemWireDraw = easeOutCubic(segmentProgress(t, 880, 1260));
  const emblemWireExpand = easeOutCubic(segmentProgress(t, 1100, 1650));
  const emblemWireFade = easeOutCubic(segmentProgress(t, 1340, 1720));
  const emblemWireProgress = emblemWireDraw;
  const emblemWireOpacity = clamp01(
    segmentProgress(t, 860, 1040) * (1 - emblemWireFade),
  );
  const emblemWireScale = 1 + 0.07 * emblemWireExpand;
  const emblemHorizonStretch = easeInOutQuart(segmentProgress(t, 1060, 1620));

  const wireframeProgress = easeInOutQuart(segmentProgress(t, 1240, 2240));

  const fillProgress = easeInOutQuart(segmentProgress(t, 2060, 2660));
  const guideFadeOut = easeOutCubic(segmentProgress(t, 2220, 2840));

  const loopResetFade = looping
    ? easeInOutQuart(segmentProgress(t, total + 1250, loopCycle - 80))
    : 0;

  const blueprintOpacity = clamp01(1 - guideFadeOut) * clamp01(1 - loopResetFade);
  const logoOpacity = clamp01(1 - loopResetFade);
  const logoScale = 0.985 + 0.015 * easeOutExpo(segmentProgress(t, 2020, 2820));

  let phase: AnimationPhaseState['phase'] = 'blueprint';
  if (looping && t >= total + 1250) {
    phase = 'reset';
  } else if (t >= total) {
    phase = 'complete';
  } else if (t >= 2060) {
    phase = 'reveal';
  } else if (t >= 1280) {
    phase = 'wireframe';
  } else if (t >= 1020) {
    phase = 'emblem-morph';
  } else if (t >= 280) {
    phase = 'emblem';
  }

  return {
    cycleProgress,
    phase,
    gridProgress,
    compassProgress,
    diagonalsProgress,
    emblemOpacity,
    emblemScale,
    emblemWireProgress,
    emblemWireOpacity,
    emblemWireScale,
    emblemHorizonStretch,
    wireframeProgress,
    blueprintOpacity,
    fillProgress,
    logoOpacity,
    logoScale,
  };
}
