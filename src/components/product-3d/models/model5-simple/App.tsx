'use client';
import { useState } from 'react';
import {
  type AssemblyLayerId,
  type BackgroundPhaseId,
  type CameraPresetId,
  type ChassisFinishId,
  type DisplayPatternId,
  type WallMode,
} from './data/panelSpecs';
import {
  readProduct3DBoolean,
  readProduct3DParam,
  useProduct3DModelConfig,
} from '../../config-context';
import { AmbientBackdrop } from './components/AmbientBackdrop';
import { PhotonicsCanvas3D } from './components/PhotonicsCanvas3D';
import {
  ArchitectureBlueprint,
  ArchitectureLayers,
} from './components/ArchitectureBlueprint';

export default function App() {
  const params = useProduct3DModelConfig('model5-simple').params;
  const [wallMode, setWallMode] = useState<WallMode>(
    readProduct3DParam(params, 'wallMode', 'object', ['object', 'surface'])
  );
  const [explodeFactor, setExplodeFactor] = useState<number>(0);
  const [finishId, setFinishId] = useState<ChassisFinishId>(
    readProduct3DParam(params, 'finishId', 'obsidian', ['obsidian', 'titanium', 'raw'])
  );
  const [patternId, setPatternId] = useState<DisplayPatternId>(
    readProduct3DParam(params, 'patternId', 'fluid', ['fluid', 'ambient', 'calibration', 'off'])
  );
  const [activeLayer, setActiveLayer] = useState<AssemblyLayerId | null>(null);
  const [selectedModuleIdx, setSelectedModuleIdx] = useState<number | null>(null);
  const [showWireframe, setShowWireframe] = useState<boolean>(
    readProduct3DBoolean(params, 'showWireframe', false)
  );
  const [cameraPreset, setCameraPreset] = useState<CameraPresetId>(
    readProduct3DParam(params, 'cameraPreset', 'perspective', ['perspective', 'front', 'profile', 'rear'])
  );
  const [backgroundPhase, setBackgroundPhase] = useState<BackgroundPhaseId>('phase1');

  const handleSelectModule = (idx: number | null) => {
    setSelectedModuleIdx(idx);
    if (idx !== null) {
      setWallMode('object');
      if (cameraPreset === 'rear') {
        setCameraPreset('perspective');
      }
      setActiveLayer('module');
    } else if (activeLayer === 'module') {
      setActiveLayer(null);
    }
  };

  const handleSelectLayer = (layer: AssemblyLayerId | null) => {
    setActiveLayer(layer);
    if (!layer) {
      return;
    }
    if (layer !== 'module') {
      setSelectedModuleIdx(null);
    }
    if (layer === 'chassis' || layer === 'mount') {
      setCameraPreset('rear');
    }
    if (explodeFactor < 0.35 && layer !== 'module') {
      setExplodeFactor(0.58);
    }
  };

  const handleTriggerExplode = () => {
    setWallMode('object');
    setSelectedModuleIdx(null);
    setExplodeFactor((prev) => (prev > 0.25 ? 0 : 0.72));
    setCameraPreset('perspective');
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden text-[#F4F5F7]">
      {/* Animated Code-Driven Morphing Background (Phase 1 / Phase 2 / Phase 3) */}
      <AmbientBackdrop phase={backgroundPhase} />

      <main className="relative z-10 mx-auto max-w-[1380px] px-4 py-5 sm:px-6 sm:py-7 lg:px-10 lg:py-9">
        {/* Exact Section 02 Header */}
        <header id="conception" className="mb-5 sm:mb-7">
          <p className="font-mono-tech text-xs font-medium uppercase tracking-[0.16em] text-[#F59E0B]">
            02 / Conception architecturale
          </p>
          <h1 className="font-display mt-2 sm:mt-3 max-w-4xl text-[clamp(1.6rem,3.3vw,3rem)] font-semibold leading-[1.08] tracking-tight text-white">
            Usinage d’orfèvrerie &amp; Châssis Monobloc
          </h1>
        </header>

        {/* Responsive Grid:
            Mobile: 1) Header + FRONT|SIDE -> 2) 3D Stage immediately visible -> 3) Accordion options
            Desktop (lg): Unified Left Card (Header+FRONT|SIDE + Layers) | Right 3D Stage */}
        <div className="relative grid grid-cols-1 gap-4 lg:grid-cols-[0.95fr_1.25fr] lg:grid-rows-[auto_1fr] lg:gap-x-7 lg:gap-y-0">
          {/* Desktop unified flat glass surface for left column */}
          <div
            aria-hidden="true"
            className="pointer-events-none hidden lg:block glass-mirror rounded-2xl border border-white/[0.14] lg:col-start-1 lg:row-start-1 lg:row-span-2"
          />

          {/* Top Left (Desktop) / First Card (Mobile): Blueprint Header + FRONT|SIDE */}
          <div className="glass-mirror-mobile rounded-2xl border border-white/[0.14] p-4 sm:p-5 lg:col-start-1 lg:row-start-1 lg:z-10 lg:rounded-none lg:border-0 lg:p-6 lg:pb-4">
            <ArchitectureBlueprint
              selectedModuleIdx={selectedModuleIdx}
              onSelectModule={handleSelectModule}
              onTriggerExplode={handleTriggerExplode}
            />
          </div>

          {/* Right Column (Desktop) / Directly below FRONT|SIDE (Mobile): 3D Simulator */}
          <div className="lg:col-start-2 lg:row-start-1 lg:row-span-2">
            <PhotonicsCanvas3D
              wallMode={wallMode}
              onWallModeChange={setWallMode}
              explodeFactor={explodeFactor}
              onExplodeChange={setExplodeFactor}
              finishId={finishId}
              onFinishChange={setFinishId}
              patternId={patternId}
              onPatternChange={setPatternId}
              pitchId="p12"
              activeLayer={activeLayer}
              onActiveLayerChange={setActiveLayer}
              selectedModuleIdx={selectedModuleIdx}
              onSelectModule={handleSelectModule}
              showWireframe={showWireframe}
              onToggleWireframe={() => setShowWireframe((v) => !v)}
              cameraPreset={cameraPreset}
              onCameraPresetChange={setCameraPreset}
              backgroundPhase={backgroundPhase}
              onBackgroundPhaseChange={setBackgroundPhase}
            />
          </div>

          {/* Bottom Left (Desktop) / Below 3D Simulator (Mobile): Accordion Layer Options */}
          <div className="glass-mirror-mobile rounded-2xl border border-white/[0.14] p-3 sm:p-4 lg:col-start-1 lg:row-start-2 lg:z-10 lg:flex lg:flex-col lg:justify-end lg:rounded-none lg:border-0 lg:p-6 lg:pt-0">
            <ArchitectureLayers
              activeLayer={activeLayer}
              onSelectLayer={handleSelectLayer}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
