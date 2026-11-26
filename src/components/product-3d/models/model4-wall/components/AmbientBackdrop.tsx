'use client';
import React from 'react';
import { BACKGROUND_PHASES, type BackgroundPhaseId } from '../data/panelSpecs';

interface AmbientBackdropProps {
  phase: BackgroundPhaseId;
}

export const AmbientBackdrop: React.FC<AmbientBackdropProps> = ({ phase }) => {
  const spec = BACKGROUND_PHASES[phase];

  return (
    <div
      aria-hidden="true"
      data-testid="ambient-backdrop"
      data-phase={phase}
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden transition-colors duration-700"
      style={{ backgroundColor: spec.baseHex }}
    >
      {/* Morphing volumetric orb 1 (top-left / center-left behind blueprint glass) */}
      <div
        className="animate-pixia-morph-a absolute -top-[18%] -left-[8%] h-[62vw] w-[62vw] max-h-[760px] max-w-[760px] blur-[110px] transition-colors duration-700"
        style={{ backgroundColor: spec.orbSecondary }}
      />

      {/* Morphing volumetric orb 2 (right / behind 3D showcase & transparent dock) */}
      <div
        className="animate-pixia-morph-b absolute top-[12%] -right-[10%] h-[58vw] w-[58vw] max-h-[740px] max-w-[740px] blur-[120px] transition-colors duration-700"
        style={{ backgroundColor: spec.orbPrimary }}
      />

      {/* Lower ambient counter-glow for glass card reflection depth */}
      <div
        className="animate-pixia-morph-a absolute -bottom-[24%] left-[24%] h-[48vw] w-[68vw] max-h-[620px] max-w-[920px] blur-[130px] transition-colors duration-700"
        style={{ backgroundColor: spec.orbAccent, animationDelay: '-6s' }}
      />

      {/* Sweeping architectural light ribbon */}
      <div
        className="animate-pixia-beam absolute top-[14%] left-[12%] h-[36vh] w-[76vw] blur-[90px] transition-colors duration-700"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${spec.orbPrimary} 35%, ${spec.orbSecondary} 68%, transparent 100%)`,
        }}
      />

      {/* Subtle architectural vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 85% 75% at 50% 42%, transparent 28%, rgba(0, 0, 0, 0.58) 100%)',
        }}
      />
    </div>
  );
};
