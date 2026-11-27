import React from 'react';
import { ChevronDown } from 'lucide-react';
import {
  ASSEMBLY_LAYERS,
  CABINET_DIMENSIONS,
  INSTALLATION_MODES,
  type AssemblyLayerId,
  type HorizontalPanelCount,
  type InstallationModeId,
} from '../data/panelSpecs';

interface ArchitectureBlueprintProps {
  installationMode: InstallationModeId;
  panelCount: HorizontalPanelCount;
  selectedModuleIdx: number | null;
  onSelectModule: (idx: number | null) => void;
  onTriggerExplode: () => void;
}

export const ArchitectureBlueprint: React.FC<ArchitectureBlueprintProps> = ({
  installationMode,
  panelCount,
  selectedModuleIdx,
  onSelectModule,
  onTriggerExplode,
}) => {
  const modeSpec = INSTALLATION_MODES[installationMode];
  const totalWidthMm = panelCount * CABINET_DIMENSIONS.widthMm;

  return (
    <section id="architecture" className="flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-3.5 sm:pb-4">
        <div>
          <p className="font-mono-tech text-[11px] sm:text-xs text-[#9CA3AF]">
            {totalWidthMm.toLocaleString('fr-FR')} × 2 000 mm · {modeSpec.label} · Film 1,8 mm
          </p>
          <h2 className="font-display mt-1 text-lg sm:text-xl font-semibold tracking-tight text-[#F4F5F7]">
            Architecture O-Raster Poster
          </h2>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <a
            href="#plus-tard"
            onClick={(e) => {
              const target = document.getElementById('plus-tard');
              if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                window.history.replaceState(null, '', '#plus-tard');
              }
            }}
            className="rounded-md border border-[#F59E0B]/50 bg-[#F59E0B]/10 px-3 py-1.5 text-xs font-medium text-[#FCD34D] hover:border-[#F59E0B] hover:bg-[#F59E0B]/20 transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer"
          >
            Détails
          </a>
          <button
            type="button"
            onClick={onTriggerExplode}
            className="rounded-md border border-white/[0.14] bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-[#E5E7EB] hover:border-[#F59E0B]/70 hover:text-white transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer"
          >
            Vue éclatée 3D
          </button>
        </div>
      </div>

      {/* FRONT + SIDE side-by-side on both mobile and desktop */}
      <div className="mt-3 rounded-xl border border-white/[0.1] bg-black/35 p-3 sm:p-4">
        <div className="grid grid-cols-[1fr_auto] items-start gap-4 sm:gap-8">
          {/* FRONT View (compact tall portrait 1000x2000mm 2x2 holographic module grid) */}
          <div className="min-w-0 flex flex-col items-start">
            <div className="mb-2 flex w-full max-w-[230px] sm:max-w-[260px] items-center justify-between gap-2 font-mono-tech text-[10px] sm:text-[11px] tracking-[0.06em] sm:tracking-[0.12em] text-[#71717A]">
              <span className="whitespace-nowrap">
                FRONT<span className="hidden sm:inline"> · {panelCount}×1 ({panelCount * 4} MOD.)</span>
              </span>
              <span
                className={`whitespace-nowrap ${
                  selectedModuleIdx !== null ? 'text-[#F59E0B]' : 'text-[#9CA3AF]'
                }`}
              >
                {selectedModuleIdx !== null ? (
                  `M${selectedModuleIdx + 1} EXTRAIT · OFF`
                ) : (
                  <>
                    <span className="sm:hidden">ACTIF · ON</span>
                    <span className="hidden sm:inline">HOLO · ON</span>
                  </>
                )}
              </span>
            </div>

            <div className="relative flex flex-col w-full max-w-[78px] sm:max-w-[84px] border border-white/25 bg-[#050608]">
              {/* Top Plug-and-Play Header Bar */}
              <div className="h-2 w-full border-b border-white/25 bg-[#12151C]" aria-hidden="true" />

              {/* 2x2 Transparent Film Grid (1000 x 2000 mm -> 1:2 portrait aspect) */}
              <div className="relative grid grid-cols-2 aspect-[1/2] w-full">
                {[0, 1, 2, 3].map((idx) => {
                  const isActive = selectedModuleIdx === idx;
                  const borderClasses =
                    idx === 0
                      ? 'border-r border-b border-dashed border-white/15'
                      : idx === 1
                        ? 'border-b border-dashed border-white/15'
                        : idx === 2
                          ? 'border-r border-dashed border-white/15'
                          : '';

                  return (
                    <button
                      key={idx}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => {
                        const next = isActive ? null : idx;
                        onSelectModule(next);
                      }}
                      aria-label={
                        isActive
                          ? `Réinsérer le module M${idx + 1}`
                          : `Extraire le module M${idx + 1} (couper son alimentation LED)`
                      }
                      className={`relative flex items-end justify-between p-1 sm:p-1.5 text-left transition-colors duration-150 cursor-pointer ${borderClasses} ${
                        isActive
                          ? 'bg-[#F59E0B]/[0.12] ring-1 ring-inset ring-[#F59E0B]'
                          : 'hover:bg-white/[0.03]'
                      }`}
                    >
                      <span
                        className={`font-mono-tech text-[9px] sm:text-[10px] font-medium ${
                          isActive ? 'text-[#FCD34D]' : 'text-[#A1A1AA]'
                        }`}
                      >
                        M{idx + 1}
                      </span>
                      <span
                        className={`font-mono-tech text-[7px] sm:text-[8px] tracking-[0.04em] ${
                          isActive ? 'text-[#F59E0B]' : 'text-[#52525B]'
                        }`}
                      >
                        {isActive ? 'OFF' : 'ON'}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Bottom Control Beam */}
              <div className="h-2 w-full border-t border-white/25 bg-[#12151C]" aria-hidden="true" />
            </div>

            {/* Caliper Dimension Rule */}
            <div className="mt-2.5 sm:mt-3 w-full max-w-[230px] sm:max-w-[260px]">
              <div className="flex items-center">
                <span className="h-2 w-px bg-white/30" aria-hidden="true" />
                <span className="h-px flex-1 bg-white/20" aria-hidden="true" />
                <span className="h-2 w-px bg-white/30" aria-hidden="true" />
              </div>
              <p className="mt-1.5 font-mono-tech text-[10px] sm:text-[11px] tracking-[0.06em] sm:tracking-[0.12em] text-[#9CA3AF] whitespace-nowrap">
                O-RASTER — {totalWidthMm} × 2000 × 55
              </p>
            </div>
          </div>

          {/* SIDE Slim Architectural Profile aligned right next to FRONT */}
          <div className="flex flex-col items-center pl-1 sm:pl-4">
            <span className="mb-2 font-mono-tech text-[10px] sm:text-[11px] tracking-[0.12em] text-[#71717A]">
              SIDE
            </span>
            <div className="relative flex h-[156px] sm:h-[172px] w-3.5 sm:w-4 items-stretch border border-white/20 bg-[#08090C]">
              <div className="h-full w-[2.5px] bg-[#F59E0B]" aria-hidden="true" />
            </div>
            <span className="mt-2.5 sm:mt-3 font-mono-tech text-[10px] sm:text-[11px] text-[#71717A] whitespace-nowrap">
              55 / 1,8 mm
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

interface ArchitectureLayersProps {
  activeLayer: AssemblyLayerId | null;
  onSelectLayer: (layer: AssemblyLayerId | null) => void;
  installationMode: InstallationModeId;
}

export const ArchitectureLayers: React.FC<ArchitectureLayersProps> = ({
  activeLayer,
  onSelectLayer,
  installationMode,
}) => {
  const modeSpec = INSTALLATION_MODES[installationMode];

  return (
    <div className="divide-y divide-white/[0.08] lg:border-t lg:border-white/[0.08]">
      {ASSEMBLY_LAYERS.map((layer) => {
        const isSelected = activeLayer === layer.id;
        const subtitle =
          layer.id === 'mount' ? `${modeSpec.label} · ${modeSpec.mountSummary}` : layer.subtitle;
        const thickness =
          layer.id === 'mount' ? modeSpec.shortLabel : layer.thicknessMm;

        return (
          <div key={layer.id} className="py-0.5">
            <button
              type="button"
              onClick={() => onSelectLayer(isSelected ? null : layer.id)}
              aria-expanded={isSelected}
              className={`w-full py-2 text-left transition-colors duration-150 cursor-pointer flex items-center justify-between gap-3 px-2 sm:px-2.5 rounded-sm ${
                isSelected ? 'bg-[#F59E0B]/[0.08]' : 'hover:bg-white/[0.03]'
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2.5">
                  <span
                    className={`font-mono-tech text-xs ${
                      isSelected ? 'text-[#F59E0B]' : 'text-[#71717A]'
                    }`}
                  >
                    {layer.index}.
                  </span>
                  <span className="text-sm font-medium text-[#F4F5F7]">{layer.name}</span>
                </div>

                {isSelected ? (
                  <div className="mt-1.5 pl-6">
                    <p className="text-xs leading-relaxed text-[#D1D5DB]">{layer.description}</p>
                    <p className="mt-1 font-mono-tech text-[10px] uppercase tracking-[0.08em] text-[#F59E0B]/90">
                      {layer.material}
                    </p>
                  </div>
                ) : (
                  <p className="hidden lg:block mt-1 pl-6 text-xs leading-relaxed text-[#9CA3AF]">
                    {subtitle}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="font-mono-tech text-xs text-[#D4D4D8]">{thickness}</span>
                <ChevronDown
                  aria-hidden="true"
                  className={`h-3.5 w-3.5 text-[#71717A] transition-transform duration-150 lg:hidden ${
                    isSelected ? 'rotate-180 text-[#F59E0B]' : ''
                  }`}
                />
              </div>
            </button>
          </div>
        );
      })}
    </div>
  );
};
