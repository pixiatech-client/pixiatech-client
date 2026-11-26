'use client';
import { RefObject, useRef, useState } from 'react';
import { motion, useDragControls, useMotionValue } from 'motion/react';
import { GripHorizontal, Layers, Minimize2, RotateCcw } from 'lucide-react';
import { ComponentPartId, KINETIC_COMPONENTS } from '../data/kineticData';

interface ComponentBlueprintPanelProps {
  selectedPart: ComponentPartId | null;
  onSelectPart: (part: ComponentPartId | null) => void;
  dragConstraintsRef: RefObject<HTMLElement | null>;
  initialPosition?: { x: number; y: number };
  initialMinimized?: boolean;
  onPositionChange?: (pos: { x: number; y: number }) => void;
  onMinimizedChange?: (minimized: boolean) => void;
}

export function ComponentBlueprintPanel({
  selectedPart,
  onSelectPart,
  dragConstraintsRef,
  initialPosition = { x: 0, y: 0 },
  initialMinimized = false,
  onPositionChange,
  onMinimizedChange,
}: ComponentBlueprintPanelProps) {
  const [minimized, setMinimized] = useState<boolean>(initialMinimized);
  const dragControls = useDragControls();
  const dragX = useMotionValue(initialPosition.x);
  const dragY = useMotionValue(initialPosition.y);
  const pointerDownPos = useRef<{ x: number; y: number } | null>(null);

  const toggleMinimized = (next: boolean) => {
    setMinimized(next);
    onMinimizedChange?.(next);
  };

  const activeInfo = KINETIC_COMPONENTS.find((c) => c.id === selectedPart) ?? null;

  const strokeFor = (part: ComponentPartId) =>
    selectedPart === part ? '#E87A24' : '#3E4452';
  const textFillFor = (part: ComponentPartId) =>
    selectedPart === part ? '#E87A24' : '#71717A';

  return (
    <motion.div
      drag
      dragListener={minimized}
      dragControls={dragControls}
      dragConstraints={dragConstraintsRef}
      dragMomentum={false}
      dragElastic={0.05}
      style={{ x: dragX, y: dragY }}
      onDragEnd={() => {
        onPositionChange?.({
          x: Math.round(dragX.get()),
          y: Math.round(dragY.get()),
        });
      }}
      className="absolute top-[184px] sm:top-[196px] left-4 sm:left-6 z-20 pointer-events-auto"
    >
      {minimized ? (
        <button
          type="button"
          onPointerDown={(e) => {
            pointerDownPos.current = { x: e.clientX, y: e.clientY };
          }}
          onClick={(e) => {
            if (pointerDownPos.current) {
              const dist = Math.hypot(
                e.clientX - pointerDownPos.current.x,
                e.clientY - pointerDownPos.current.y
              );
              if (dist > 6) return;
            }
            toggleMinimized(false);
          }}
          title="Afficher le schéma d’architecture (01–05)"
          aria-label="Afficher le schéma d’architecture"
          className="w-11 h-11 rounded-2xl tessera-glass hover:border-[rgba(var(--tessera-accent-rgb),0.6)] flex items-center justify-center text-[#F4F4F5] transition-colors cursor-pointer"
        >
          <Layers
            className={`w-5 h-5 ${selectedPart ? 'text-[var(--tessera-accent)]' : 'text-[#F4F4F5]'}`}
            aria-hidden="true"
          />
        </button>
      ) : (
        <div className="w-[272px] sm:w-[296px] tessera-glass rounded-2xl overflow-hidden">
          {/* Draggable Glossy Header Bar */}
          <div
            onPointerDown={(e) => dragControls.start(e)}
            className="tessera-glass-header flex items-center justify-between px-3 py-2.5 cursor-grab active:cursor-grabbing touch-none"
          >
            <div className="flex items-center gap-2 text-[11px] font-medium text-[#E4E4E7] pointer-events-none">
              <GripHorizontal className="w-3.5 h-3.5 text-[#71717A]" aria-hidden="true" />
              <span className="font-mono text-[var(--tessera-accent)]">01–05</span>
              <span>Architecture</span>
            </div>

            <div
              className="flex items-center gap-1"
              onPointerDown={(e) => e.stopPropagation()}
            >
              {selectedPart && (
                <button
                  type="button"
                  onClick={() => onSelectPart(null)}
                  className="inline-flex items-center gap-1 text-[10px] font-medium text-[#D4D4D8] hover:text-white px-2 py-1 rounded-lg tessera-glass-pill transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-2.5 h-2.5 text-[var(--tessera-accent)]" aria-hidden="true" />
                  Vue globale
                </button>
              )}

              <button
                type="button"
                onClick={() => toggleMinimized(true)}
                title="Réduire en icône"
                aria-label="Réduire en icône"
                className="w-6 h-6 inline-flex items-center justify-center rounded-lg text-[#A1A1AA] hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
              >
                <Minimize2 className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Interactive Side-View Cross-Section Schematic */}
          <div className="m-2.5 px-2.5 pt-2 pb-1.5 rounded-xl tessera-glass-well">
            <svg
              viewBox="0 0 280 148"
              className="w-full h-auto"
              role="img"
              aria-label="Schéma en coupe du caisson cinétique MK-250"
            >
              {/* Vertical Dimension Marker 250 MM */}
              <g stroke="#2F3542" strokeWidth="1">
                <line x1="28" y1="22" x2="28" y2="66" />
                <line x1="23" y1="22" x2="33" y2="22" />
                <line x1="23" y1="66" x2="33" y2="66" />
              </g>
              <text
                x="16"
                y="44"
                fill="#646B78"
                fontSize="7"
                fontFamily="JetBrains Mono, monospace"
                textAnchor="middle"
                transform="rotate(-90 16 44)"
              >
                250 MM
              </text>

              {/* Z-Axis Travel Dimension */}
              <g stroke="#2F3542" strokeWidth="1">
                <line x1="42" y1="120" x2="112" y2="120" />
                <line x1="42" y1="115" x2="42" y2="125" />
                <line x1="112" y1="115" x2="112" y2="125" />
              </g>
              <text
                x="77"
                y="132"
                fill="#646B78"
                fontSize="6.5"
                fontFamily="JetBrains Mono, monospace"
                textAnchor="middle"
              >
                COURSE AXIALE · CÔTÉ
              </text>

              {/* 05 — Die-Cast Cabinet Stacked Frames (Right) */}
              <g
                onClick={() =>
                  onSelectPart(selectedPart === 'die_cast_cabinet' ? null : 'die_cast_cabinet')
                }
                className="cursor-pointer"
              >
                <rect
                  x="188"
                  y="16"
                  width="34"
                  height="56"
                  fill={
                    selectedPart === 'die_cast_cabinet' ? 'rgba(232,122,36,0.12)' : 'transparent'
                  }
                  stroke={strokeFor('die_cast_cabinet')}
                  strokeWidth={selectedPart === 'die_cast_cabinet' ? 1.5 : 1}
                />
                <rect
                  x="188"
                  y="72"
                  width="34"
                  height="56"
                  fill={
                    selectedPart === 'die_cast_cabinet' ? 'rgba(232,122,36,0.12)' : 'transparent'
                  }
                  stroke={strokeFor('die_cast_cabinet')}
                  strokeWidth={selectedPart === 'die_cast_cabinet' ? 1.5 : 1}
                />
                <line x1="188" y1="136" x2="222" y2="136" stroke="#2F3542" strokeWidth="1" />
                <line x1="188" y1="132" x2="188" y2="140" stroke="#2F3542" strokeWidth="1" />
                <line x1="222" y1="132" x2="222" y2="140" stroke="#2F3542" strokeWidth="1" />
                <text
                  x="205"
                  y="145"
                  fill={textFillFor('die_cast_cabinet')}
                  fontSize="6.5"
                  fontFamily="JetBrains Mono, monospace"
                  textAnchor="middle"
                >
                  500 × 500 MM
                </text>
              </g>

              {/* 04 — Quick-Lock Top Alignment Pins */}
              <g
                onClick={() => onSelectPart(selectedPart === 'quick_lock' ? null : 'quick_lock')}
                className="cursor-pointer"
              >
                <circle
                  cx="198"
                  cy="11"
                  r="2.4"
                  fill="transparent"
                  stroke={strokeFor('quick_lock')}
                  strokeWidth="1.2"
                />
                <circle
                  cx="209"
                  cy="11"
                  r="2.4"
                  fill="transparent"
                  stroke={strokeFor('quick_lock')}
                  strokeWidth="1.2"
                />
                <line
                  x1="212"
                  y1="10"
                  x2="232"
                  y2="8"
                  stroke={strokeFor('quick_lock')}
                  strokeWidth="0.9"
                />
                <text
                  x="236"
                  y="10"
                  fill={textFillFor('quick_lock')}
                  fontSize="8"
                  fontFamily="JetBrains Mono, monospace"
                >
                  04
                </text>
              </g>

              {/* 02 — Linear Guide Rails & Ball-Screw Shaft */}
              <g
                onClick={() => onSelectPart(selectedPart === 'linear_rail' ? null : 'linear_rail')}
                className="cursor-pointer"
              >
                <line
                  x1="56"
                  y1="44"
                  x2="132"
                  y2="44"
                  stroke={strokeFor('linear_rail')}
                  strokeWidth="1.1"
                />
                <rect
                  x="132"
                  y="40"
                  width="56"
                  height="8"
                  fill={selectedPart === 'linear_rail' ? 'rgba(232,122,36,0.18)' : 'transparent'}
                  stroke={strokeFor('linear_rail')}
                  strokeWidth={selectedPart === 'linear_rail' ? 1.4 : 1}
                />
                <line
                  x1="106"
                  y1="96"
                  x2="146"
                  y2="96"
                  stroke={strokeFor('linear_rail')}
                  strokeWidth="1.1"
                />
                <rect
                  x="146"
                  y="92"
                  width="42"
                  height="8"
                  fill={selectedPart === 'linear_rail' ? 'rgba(232,122,36,0.18)' : 'transparent'}
                  stroke={strokeFor('linear_rail')}
                  strokeWidth={selectedPart === 'linear_rail' ? 1.4 : 1}
                />
                <line
                  x1="160"
                  y1="40"
                  x2="160"
                  y2="27"
                  stroke={strokeFor('linear_rail')}
                  strokeWidth="0.9"
                />
                <text
                  x="160"
                  y="23"
                  fill={textFillFor('linear_rail')}
                  fontSize="8"
                  fontFamily="JetBrains Mono, monospace"
                  textAnchor="middle"
                >
                  02
                </text>
              </g>

              {/* 01 — Motion Unit Moving Front Heads */}
              <g
                onClick={() => onSelectPart(selectedPart === 'motion_unit' ? null : 'motion_unit')}
                className="cursor-pointer"
              >
                <rect
                  x="42"
                  y="22"
                  width="14"
                  height="44"
                  fill={selectedPart === 'motion_unit' ? 'rgba(232,122,36,0.2)' : '#0C0E13'}
                  stroke={strokeFor('motion_unit')}
                  strokeWidth={selectedPart === 'motion_unit' ? 1.5 : 1.1}
                />
                <rect
                  x="92"
                  y="74"
                  width="14"
                  height="44"
                  fill={selectedPart === 'motion_unit' ? 'rgba(232,122,36,0.2)' : '#0C0E13'}
                  stroke={strokeFor('motion_unit')}
                  strokeWidth={selectedPart === 'motion_unit' ? 1.5 : 1.1}
                />
                <line
                  x1="49"
                  y1="22"
                  x2="49"
                  y2="11"
                  stroke={strokeFor('motion_unit')}
                  strokeWidth="0.9"
                />
                <text
                  x="49"
                  y="8"
                  fill={textFillFor('motion_unit')}
                  fontSize="8"
                  fontFamily="JetBrains Mono, monospace"
                  textAnchor="middle"
                >
                  01
                </text>
              </g>

              {/* 03 — Motion Controller (CryoCathode Block) */}
              <g
                onClick={() =>
                  onSelectPart(selectedPart === 'motion_controller' ? null : 'motion_controller')
                }
                className="cursor-pointer"
              >
                <rect
                  x="194"
                  y="79"
                  width="22"
                  height="14"
                  fill={
                    selectedPart === 'motion_controller' ? 'rgba(232,122,36,0.2)' : 'transparent'
                  }
                  stroke={strokeFor('motion_controller')}
                  strokeWidth={selectedPart === 'motion_controller' ? 1.6 : 1.1}
                />
                <line
                  x1="216"
                  y1="86"
                  x2="236"
                  y2="86"
                  stroke={strokeFor('motion_controller')}
                  strokeWidth="0.9"
                />
                <text
                  x="241"
                  y="89"
                  fill={textFillFor('motion_controller')}
                  fontSize="8"
                  fontFamily="JetBrains Mono, monospace"
                >
                  03
                </text>
              </g>

              {/* 05 Callout */}
              <text
                x="241"
                y="112"
                fill={textFillFor('die_cast_cabinet')}
                fontSize="8"
                fontFamily="JetBrains Mono, monospace"
                onClick={() =>
                  onSelectPart(selectedPart === 'die_cast_cabinet' ? null : 'die_cast_cabinet')
                }
                className="cursor-pointer"
              >
                05
              </text>
            </svg>
          </div>

          {/* Numbered Interactive Organ List (01 - 05) */}
          <div className="divide-y divide-white/[0.07] border-t border-white/[0.08]">
            {KINETIC_COMPONENTS.map((comp) => {
              const isSelected = selectedPart === comp.id;
              return (
                <button
                  key={comp.id}
                  type="button"
                  onClick={() => onSelectPart(isSelected ? null : comp.id)}
                  className={`w-full text-left px-3 py-2 flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[rgba(var(--tessera-accent-rgb),0.14)] text-white'
                      : 'text-[#B4BAC6] hover:text-white hover:bg-white/[0.05]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`font-mono text-[10px] tabular-nums shrink-0 ${
                        isSelected ? 'text-[var(--tessera-accent)] font-semibold' : 'text-[#6B7280]'
                      }`}
                    >
                      {comp.code}
                    </span>
                    <span
                      className={`text-[11px] truncate ${
                        isSelected ? 'font-semibold text-[#F4F4F5]' : 'font-medium'
                      }`}
                    >
                      {comp.label}
                    </span>
                  </div>
                  <span
                    className={`font-mono text-[10px] tabular-nums shrink-0 ${
                      isSelected ? 'text-[var(--tessera-accent)]' : 'text-[#8E95A3]'
                    }`}
                  >
                    {comp.metric}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Concise Active Organ Detail Footer */}
          {activeInfo && (
            <div className="px-3 py-2 bg-white/[0.04] border-t border-white/[0.1] text-[11px] text-[#E4E4E7] leading-snug">
              <span className="font-mono text-[var(--tessera-accent)] mr-1.5">{activeInfo.code} ·</span>
              {activeInfo.description}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
