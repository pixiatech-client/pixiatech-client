'use client';

import { useEffect, useRef, useState } from 'react';
import {
  CONSTRUCTION_CIRCLES,
  DIAGONAL_TRIPLE_GROUPS,
  HORIZONTAL_GUIDES,
  PIXIATECH_GLYPHS,
  RADIAL_DOTTED_AXES,
  STAGE_VIEWBOX,
  VERTICAL_GUIDES,
  WORD_BOUNDS,
} from '../animation/pixiatechGeometry';
import {
  clamp01,
  computePhaseState,
  DEFAULT_TIMELINE_CONFIG,
  easeOutCubic,
  segmentProgress,
} from '../animation/timeline';

const EMBLEM_CLIP_RADIUS = 204;
const EMBLEM_IMAGE_SIZE = Math.round((EMBLEM_CLIP_RADIUS * 2) / 0.912);
const MORPH_RING_RADII = [204, 174, 146] as const;

export function PixiaLogoStage({ onComplete }: { onComplete?: () => void }) {
  const stageRef = useRef<HTMLElement | null>(null);
  const blueprintGroupRef = useRef<SVGGElement | null>(null);
  const emblemGroupRef = useRef<SVGGElement | null>(null);
  const emblemWireGroupRef = useRef<SVGGElement | null>(null);
  const emblemRingRefs = useRef<(SVGCircleElement | null)[]>([]);
  const emblemHorizonGroupRef = useRef<SVGGElement | null>(null);
  const emblemHorizonRayRefs = useRef<(SVGLineElement | null)[]>([]);
  const logoGroupRef = useRef<SVGGElement | null>(null);

  const horizRefs = useRef<(SVGLineElement | null)[]>([]);
  const vertRefs = useRef<(SVGLineElement | null)[]>([]);
  const diagRefs = useRef<(SVGLineElement | null)[]>([]);
  const radialRefs = useRef<(SVGLineElement | null)[]>([]);
  const circleMaskRefs = useRef<(SVGCircleElement | null)[]>([]);
  const circleGroupRefs = useRef<(SVGGElement | null)[]>([]);

  const glyphOuterHaloRefs = useRef<(SVGPathElement | null)[]>([]);
  const glyphKnockoutRefs = useRef<(SVGPathElement | null)[]>([]);
  const glyphCoreRefs = useRef<(SVGPathElement | null)[]>([]);
  const glyphFillRefs = useRef<(SVGPathElement | null)[]>([]);
  const glyphTickRefs = useRef<(SVGGElement | null)[]>([]);

  const glyphLengthsRef = useRef<number[]>([]);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const loopingRef = useRef<boolean>(false);
  const completedRef = useRef<boolean>(false);
  const onCompleteRef = useRef(onComplete);

  const [reducedMotion, setReducedMotion] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    glyphLengthsRef.current = glyphCoreRefs.current.map((el) => {
      if (!el) return 600;
      try {
        return Math.max(1, el.getTotalLength());
      } catch {
        return 600;
      }
    });

    const params = new URLSearchParams(window.location.search);
    const frozenMsParam = params.get('t');
    const frozenMs = frozenMsParam !== null ? Number(frozenMsParam) : null;
    if (params.get('loop') === '1') {
      loopingRef.current = true;
    }

    const applyFrame = (elapsedMs: number) => {
      const isLooping = loopingRef.current;
      const state = computePhaseState(
        elapsedMs,
        reducedMotion,
        DEFAULT_TIMELINE_CONFIG,
        isLooping,
      );

      if (stageRef.current) {
        stageRef.current.dataset.phase = state.phase;
        stageRef.current.dataset.progress = state.cycleProgress.toFixed(3);
        stageRef.current.dataset.looping = isLooping ? 'true' : 'false';
      }

      if (blueprintGroupRef.current) {
        blueprintGroupRef.current.style.opacity = String(state.blueprintOpacity);
      }

      if (emblemGroupRef.current) {
        emblemGroupRef.current.style.opacity = String(state.emblemOpacity);
        emblemGroupRef.current.style.transform = `scale(${state.emblemScale.toFixed(5)})`;
      }

      if (emblemWireGroupRef.current) {
        emblemWireGroupRef.current.style.opacity = String(state.emblemWireOpacity);
        emblemWireGroupRef.current.style.transform = `scale(${state.emblemWireScale.toFixed(5)})`;
      }

      MORPH_RING_RADII.forEach((radius, idx) => {
        const ringEl = emblemRingRefs.current[idx];
        if (!ringEl) return;
        const localP = easeOutCubic(
          segmentProgress(state.emblemWireProgress, idx * 0.14, 1),
        );
        const circ = 2 * Math.PI * radius;
        ringEl.style.strokeDasharray = `${circ.toFixed(2)}`;
        ringEl.style.strokeDashoffset = `${(circ * (1 - localP)).toFixed(2)}`;
      });

      if (emblemHorizonGroupRef.current) {
        emblemHorizonGroupRef.current.style.opacity = String(state.emblemWireOpacity);
      }

      emblemHorizonRayRefs.current.forEach((rayEl, idx) => {
        if (!rayEl) return;
        const localP = easeOutCubic(
          segmentProgress(state.emblemHorizonStretch, idx * 0.08, 1),
        );
        const span = 560 * localP;
        rayEl.setAttribute('x1', (STAGE_VIEWBOX.cx - span).toFixed(2));
        rayEl.setAttribute('x2', (STAGE_VIEWBOX.cx + span).toFixed(2));
      });

      if (logoGroupRef.current) {
        logoGroupRef.current.style.opacity = String(state.logoOpacity);
        logoGroupRef.current.style.transform = `scale(${state.logoScale.toFixed(5)})`;
      }

      HORIZONTAL_GUIDES.forEach((guide, idx) => {
        const el = horizRefs.current[idx];
        if (!el) return;
        const localP = easeOutCubic(
          segmentProgress(state.gridProgress, guide.delayWeight, 1),
        );
        const halfSpan = (STAGE_VIEWBOX.width / 2) * localP;
        el.setAttribute('x1', (STAGE_VIEWBOX.cx - halfSpan).toFixed(2));
        el.setAttribute('x2', (STAGE_VIEWBOX.cx + halfSpan).toFixed(2));
        el.style.opacity = String(guide.opacity * clamp01(localP * 1.4));
      });

      VERTICAL_GUIDES.forEach((guide, idx) => {
        const el = vertRefs.current[idx];
        if (!el) return;
        const localP = easeOutCubic(
          segmentProgress(state.gridProgress, guide.delayWeight, 1),
        );
        const halfSpan = (STAGE_VIEWBOX.height / 2) * localP;
        el.setAttribute('y1', (STAGE_VIEWBOX.cy - halfSpan).toFixed(2));
        el.setAttribute('y2', (STAGE_VIEWBOX.cy + halfSpan).toFixed(2));
        el.style.opacity = String(guide.opacity * clamp01(localP * 1.4));
      });

      CONSTRUCTION_CIRCLES.forEach((circle, idx) => {
        const maskCircle = circleMaskRefs.current[idx];
        const group = circleGroupRefs.current[idx];
        if (!maskCircle || !group) return;
        const localP = easeOutCubic(
          segmentProgress(state.compassProgress, circle.delayWeight, 1),
        );
        const circumference = 2 * Math.PI * circle.r;
        maskCircle.style.strokeDasharray = `${circumference.toFixed(2)}`;
        maskCircle.style.strokeDashoffset = `${(circumference * (1 - localP)).toFixed(2)}`;
        group.style.opacity = String(circle.opacity * clamp01(localP * 1.6));
      });

      RADIAL_DOTTED_AXES.forEach((axis, idx) => {
        const el = radialRefs.current[idx];
        if (!el) return;
        const localP = easeOutCubic(
          segmentProgress(state.compassProgress, 0.08 + idx * 0.05, 1),
        );
        const len = Math.hypot(axis.x2 - axis.x1, axis.y2 - axis.y1);
        el.style.opacity = String(0.26 * localP);
        el.style.strokeDashoffset = `${(len * (1 - localP)).toFixed(2)}`;
      });

      let diagIdx = 0;
      DIAGONAL_TRIPLE_GROUPS.forEach((group, groupIdx) => {
        const groupScale = groupIdx >= 4 ? 0.52 : 1;
        group.lines.forEach((seg, subIdx) => {
          const el = diagRefs.current[diagIdx++];
          if (!el) return;
          const stagger = group.delayWeight + subIdx * 0.06;
          const localP = easeOutCubic(
            segmentProgress(state.diagonalsProgress, stagger, 1),
          );
          const len = Math.hypot(seg.x2 - seg.x1, seg.y2 - seg.y1);
          el.style.strokeDasharray = `${len.toFixed(2)}`;
          el.style.strokeDashoffset = `${(len * (1 - localP)).toFixed(2)}`;
          const baseOp = (subIdx === 1 ? 0.68 : 0.42) * groupScale;
          el.style.opacity = String(baseOp * clamp01(localP * 1.4));
        });
      });

      const glyphCount = PIXIATECH_GLYPHS.length;
      const centerIdx = (glyphCount - 1) / 2;
      PIXIATECH_GLYPHS.forEach((_, idx) => {
        const len = glyphLengthsRef.current[idx] || 600;
        const distFromCenter = Math.abs(idx - centerIdx) / centerIdx;
        const startOffset = distFromCenter * 0.28;
        const endOffset = startOffset + 0.72;
        const wireP = easeOutCubic(
          segmentProgress(state.wireframeProgress, startOffset, endOffset),
        );

        const dashStr = `${len.toFixed(2)}`;
        const offsetStr = `${(len * (1 - wireP)).toFixed(2)}`;

        const halo = glyphOuterHaloRefs.current[idx];
        const knockout = glyphKnockoutRefs.current[idx];
        const core = glyphCoreRefs.current[idx];
        const fill = glyphFillRefs.current[idx];
        const ticks = glyphTickRefs.current[idx];

        const wireFade = 1 - clamp01(state.fillProgress * 0.88);
        const wireVisible = wireP > 0.005 ? 1 : 0;

        if (halo) {
          halo.style.strokeDasharray = dashStr;
          halo.style.strokeDashoffset = offsetStr;
          halo.style.opacity = String(0.45 * wireVisible * wireFade);
        }
        if (knockout) {
          knockout.style.strokeDasharray = dashStr;
          knockout.style.strokeDashoffset = offsetStr;
          knockout.style.opacity = String(wireVisible * wireFade);
        }
        if (core) {
          core.style.strokeDasharray = dashStr;
          core.style.strokeDashoffset = offsetStr;
          core.style.opacity = String(0.95 * wireVisible * wireFade);
        }
        if (ticks) {
          ticks.style.opacity = String(
            0.55 * clamp01(wireP * 2) * (1 - state.fillProgress),
          );
        }
        if (fill) {
          const fillStart = distFromCenter * 0.22;
          const fillLocal = easeOutCubic(
            segmentProgress(state.fillProgress, fillStart, fillStart + 0.78),
          );
          fill.style.opacity = String(fillLocal);
        }
      });

      const done = !isLooping && state.phase === 'complete';
      if (done && !completedRef.current) {
        completedRef.current = true;
        onCompleteRef.current?.();
      }
      return done;
    };

    if (frozenMs !== null && Number.isFinite(frozenMs)) {
      applyFrame(frozenMs);
      return;
    }

    if (reducedMotion) {
      applyFrame(DEFAULT_TIMELINE_CONFIG.totalDurationMs);
      return;
    }

    const startPlayback = () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
      startTimeRef.current = performance.now();
      const tick = (now: number) => {
        if (startTimeRef.current === null) {
          startTimeRef.current = now;
        }
        const elapsed = now - startTimeRef.current;
        const done = applyFrame(elapsed);
        if (!done) {
          rafRef.current = requestAnimationFrame(tick);
        } else {
          rafRef.current = null;
        }
      };
      rafRef.current = requestAnimationFrame(tick);
    };

    startPlayback();

    const el = stageRef.current;
    const onActivateLoop = () => {
      loopingRef.current = true;
      startPlayback();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter' || e.key.toLowerCase() === 'r') {
        e.preventDefault();
        onActivateLoop();
      }
    };

    el?.addEventListener('click', onActivateLoop);
    el?.addEventListener('keydown', onKey);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
      el?.removeEventListener('click', onActivateLoop);
      el?.removeEventListener('keydown', onKey);
    };
  }, [reducedMotion]);

  let diagCounter = 0;

  return (
    <main
      ref={stageRef}
      data-testid="pixia-logo-stage"
      data-phase="blueprint"
      data-looping="false"
      aria-label="PixiaTech"
      tabIndex={0}
      className="relative flex h-dvh w-screen cursor-pointer items-center justify-center overflow-hidden bg-black outline-none select-none"
    >
      <div className="blueprint-edge-mask flex h-full w-full items-center justify-center">
        <svg
          viewBox={`0 0 ${STAGE_VIEWBOX.width} ${STAGE_VIEWBOX.height}`}
          preserveAspectRatio="xMidYMid meet"
          className="h-full w-full max-h-dvh max-w-screen"
          role="img"
          aria-label="PIXIATECH"
        >
          <defs>
            <linearGradient
              id="pixia-vert-fade"
              gradientUnits="userSpaceOnUse"
              x1="0"
              y1="30"
              x2="0"
              y2="870"
            >
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
              <stop offset="15%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="85%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>

            <linearGradient
              id="pixia-diag-fade"
              gradientUnits="userSpaceOnUse"
              x1="0"
              y1="20"
              x2="0"
              y2="880"
            >
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
              <stop offset="12%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="88%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>

            <clipPath id="pixia-emblem-clip">
              <circle
                cx={STAGE_VIEWBOX.cx}
                cy={STAGE_VIEWBOX.cy}
                r={EMBLEM_CLIP_RADIUS}
              />
            </clipPath>

            {CONSTRUCTION_CIRCLES.map((circle, idx) => (
              <mask key={circle.id} id={`circle-mask-${circle.id}`}>
                <circle
                  ref={(el) => {
                    circleMaskRefs.current[idx] = el;
                  }}
                  cx={circle.cx}
                  cy={circle.cy}
                  r={circle.r}
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth={circle.strokeWidth + 4}
                  transform={`rotate(-90 ${circle.cx} ${circle.cy})`}
                />
              </mask>
            ))}
          </defs>

          <g ref={blueprintGroupRef}>
            <g>
              {HORIZONTAL_GUIDES.map((guide, idx) => (
                <line
                  key={guide.id}
                  ref={(el) => {
                    horizRefs.current[idx] = el;
                  }}
                  x1={STAGE_VIEWBOX.cx}
                  y1={guide.y}
                  x2={STAGE_VIEWBOX.cx}
                  y2={guide.y}
                  stroke="#ffffff"
                  strokeWidth={guide.strokeWidth}
                  style={{ opacity: 0 }}
                />
              ))}
            </g>

            <g>
              {VERTICAL_GUIDES.map((guide, idx) => (
                <line
                  key={guide.id}
                  ref={(el) => {
                    vertRefs.current[idx] = el;
                  }}
                  x1={guide.x}
                  y1={STAGE_VIEWBOX.cy}
                  x2={guide.x}
                  y2={STAGE_VIEWBOX.cy}
                  stroke="url(#pixia-vert-fade)"
                  strokeWidth={guide.strokeWidth}
                  style={{ opacity: 0 }}
                />
              ))}
            </g>

            <g>
              {RADIAL_DOTTED_AXES.map((axis, idx) => (
                <line
                  key={`radial-${idx}`}
                  ref={(el) => {
                    radialRefs.current[idx] = el;
                  }}
                  x1={axis.x1}
                  y1={axis.y1}
                  x2={axis.x2}
                  y2={axis.y2}
                  stroke="url(#pixia-diag-fade)"
                  strokeWidth={0.8}
                  strokeDasharray="2.5 6"
                  style={{ opacity: 0 }}
                />
              ))}
            </g>

            <g>
              {CONSTRUCTION_CIRCLES.map((circle, idx) => (
                <g
                  key={circle.id}
                  ref={(el) => {
                    circleGroupRefs.current[idx] = el;
                  }}
                  mask={`url(#circle-mask-${circle.id})`}
                  style={{ opacity: 0 }}
                >
                  <circle
                    cx={circle.cx}
                    cy={circle.cy}
                    r={circle.r}
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth={circle.strokeWidth}
                    strokeDasharray={circle.dashed ? '2.4 5.6' : undefined}
                  />
                </g>
              ))}
            </g>

            <g>
              {DIAGONAL_TRIPLE_GROUPS.map((group) =>
                group.lines.map((seg, subIdx) => {
                  const refIdx = diagCounter++;
                  return (
                    <line
                      key={`${group.id}-${subIdx}`}
                      ref={(el) => {
                        diagRefs.current[refIdx] = el;
                      }}
                      x1={seg.x1}
                      y1={seg.y1}
                      x2={seg.x2}
                      y2={seg.y2}
                      stroke="url(#pixia-diag-fade)"
                      strokeWidth={subIdx === 1 ? 0.95 : 0.65}
                      style={{ opacity: 0 }}
                    />
                  );
                }),
              )}
            </g>

            <g opacity={0.45}>
              <line
                x1={WORD_BOUNDS.x1 - 16}
                y1={WORD_BOUNDS.y1}
                x2={WORD_BOUNDS.x1 - 5}
                y2={WORD_BOUNDS.y1}
                stroke="#ffffff"
                strokeWidth={0.75}
              />
              <line
                x1={WORD_BOUNDS.x2 + 5}
                y1={WORD_BOUNDS.y1}
                x2={WORD_BOUNDS.x2 + 16}
                y2={WORD_BOUNDS.y1}
                stroke="#ffffff"
                strokeWidth={0.75}
              />
              <line
                x1={WORD_BOUNDS.x1 - 16}
                y1={WORD_BOUNDS.y2}
                x2={WORD_BOUNDS.x1 - 5}
                y2={WORD_BOUNDS.y2}
                stroke="#ffffff"
                strokeWidth={0.75}
              />
              <line
                x1={WORD_BOUNDS.x2 + 5}
                y1={WORD_BOUNDS.y2}
                x2={WORD_BOUNDS.x2 + 16}
                y2={WORD_BOUNDS.y2}
                stroke="#ffffff"
                strokeWidth={0.75}
              />
            </g>
          </g>

          <g
            ref={emblemGroupRef}
            data-testid="pixia-emblem"
            style={{
              opacity: 0,
              transformOrigin: `${STAGE_VIEWBOX.cx}px ${STAGE_VIEWBOX.cy}px`,
            }}
          >
            <image
              href="/favicon.png"
              x={STAGE_VIEWBOX.cx - EMBLEM_IMAGE_SIZE / 2}
              y={STAGE_VIEWBOX.cy - EMBLEM_IMAGE_SIZE / 2}
              width={EMBLEM_IMAGE_SIZE}
              height={EMBLEM_IMAGE_SIZE}
              clipPath="url(#pixia-emblem-clip)"
              preserveAspectRatio="xMidYMid slice"
            />
          </g>

          <g
            ref={emblemWireGroupRef}
            data-testid="pixia-emblem-morph"
            style={{
              opacity: 0,
              transformOrigin: `${STAGE_VIEWBOX.cx}px ${STAGE_VIEWBOX.cy}px`,
            }}
          >
            {MORPH_RING_RADII.map((radius, idx) => (
              <circle
                key={`morph-ring-${radius}`}
                ref={(el) => {
                  emblemRingRefs.current[idx] = el;
                }}
                cx={STAGE_VIEWBOX.cx}
                cy={STAGE_VIEWBOX.cy}
                r={radius}
                fill="none"
                stroke="#f5f4f0"
                strokeWidth={idx === 0 ? 1.5 : 0.9}
                strokeOpacity={idx === 0 ? 0.9 : 0.55}
                transform={`rotate(-90 ${STAGE_VIEWBOX.cx} ${STAGE_VIEWBOX.cy})`}
              />
            ))}
          </g>

          <g ref={emblemHorizonGroupRef} style={{ opacity: 0 }}>
            {[WORD_BOUNDS.y1, STAGE_VIEWBOX.cy, WORD_BOUNDS.y2].map((yPos, idx) => (
              <line
                key={`morph-ray-${yPos}`}
                ref={(el) => {
                  emblemHorizonRayRefs.current[idx] = el;
                }}
                x1={STAGE_VIEWBOX.cx}
                y1={yPos}
                x2={STAGE_VIEWBOX.cx}
                y2={yPos}
                stroke="#ffffff"
                strokeWidth={idx === 1 ? 0.8 : 1.1}
                strokeOpacity={0.65}
              />
            ))}
          </g>

          <g
            ref={logoGroupRef}
            style={{
              transformOrigin: `${STAGE_VIEWBOX.cx}px ${STAGE_VIEWBOX.cy}px`,
            }}
          >
            {PIXIATECH_GLYPHS.map((glyph, idx) => (
              <g key={`${glyph.ch}-${glyph.index}`}>
                <path
                  ref={(el) => {
                    glyphOuterHaloRefs.current[idx] = el;
                  }}
                  d={glyph.d}
                  fill="none"
                  stroke="#dcdcd8"
                  strokeWidth={5.2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  style={{ opacity: 0 }}
                />
                <path
                  ref={(el) => {
                    glyphKnockoutRefs.current[idx] = el;
                  }}
                  d={glyph.d}
                  fill="none"
                  stroke="#000000"
                  strokeWidth={3.1}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  style={{ opacity: 0 }}
                />
                <path
                  ref={(el) => {
                    glyphCoreRefs.current[idx] = el;
                  }}
                  d={glyph.d}
                  fill="none"
                  stroke="#f5f4f0"
                  strokeWidth={1.3}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  style={{ opacity: 0 }}
                />

                <g
                  ref={(el) => {
                    glyphTickRefs.current[idx] = el;
                  }}
                  style={{ opacity: 0 }}
                >
                  <circle cx={glyph.x1} cy={glyph.y1} r={1.6} fill="#ffffff" />
                  <circle cx={glyph.x2} cy={glyph.y2} r={1.6} fill="#ffffff" />
                </g>

                <path
                  ref={(el) => {
                    glyphFillRefs.current[idx] = el;
                  }}
                  d={glyph.d}
                  fill="#f5f4f0"
                  fillRule="evenodd"
                  style={{ opacity: 0 }}
                />
              </g>
            ))}
          </g>
        </svg>
      </div>
    </main>
  );
}
