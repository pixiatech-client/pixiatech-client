'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  FileText,
  Pause,
  Play,
  Power,
  Sun,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import {
  ComponentPartId,
  CURATED_SHOWS,
  CuratedShowOption,
  FEATURED_ASSETS,
  FEATURED_SPECS,
  HERO_METRICS,
} from '../data/kineticData';
import {
  CameraPreset,
  CameraState,
  KineticWallScene,
  MotionPattern,
  VisualTheme,
} from '../three/KineticWallScene';
import { ComponentBlueprintPanel } from './ComponentBlueprintPanel';
import { KineticTierSlider, MATRIX_STEPS, RollingNumber } from './KineticTierSlider';
import { LightBeamButton } from './LightBeamButton';
import { ResilientImage } from './ResilientImage';
import { SpringValueSlider } from './SpringValueSlider';

type ViewportMode = 'scene3d' | 'hardware' | 'atrium';
type AccordionTab = 'envergure' | 'mouvement' | 'signal';

const ACCORDION_TABS: { id: AccordionTab; label: string }[] = [
  { id: 'envergure', label: '01. Envergure' },
  { id: 'mouvement', label: '02. Mouvement' },
  { id: 'signal', label: '03. Signal & Caméra' },
];

const PATTERN_OPTIONS: { id: MotionPattern; label: string }[] = [
  { id: 'wave', label: 'Onde fluide' },
  { id: 'sculpture', label: 'Sculpture 3D' },
  { id: 'pulse', label: 'Impulsion' },
  { id: 'interactive', label: 'Pointeur' },
  { id: 'video_depth', label: 'Relief vidéo' },
];

const CAMERA_PRESETS: { id: CameraPreset; label: string }[] = [
  { id: 'cinema', label: 'Cinéma' },
  { id: 'grazing', label: 'Rasant' },
  { id: 'mechanical', label: 'Mécanique' },
  { id: 'front', label: 'Face' },
];

const STORAGE_KEY = 'tessera-mk250-prefs-v4';

interface PersistedPrefs {
  pattern: MotionPattern;
  activeShowId: string;
  theme: VisualTheme;
  cameraPreset: CameraPreset;
  matrixStepIndex: number;
  maxStrokeMm: number;
  speedFactor: number;
  showActuators: boolean;
  ledsEnabled: boolean;
  studioLightsEnabled: boolean;
  activeTab: AccordionTab;
  blueprintMinimized: boolean;
  blueprintPos: { x: number; y: number };
  cameraState?: CameraState;
}

const DEFAULT_PREFS: PersistedPrefs = {
  pattern: 'sculpture', // Sculpture 3D
  activeShowId: 'amber',
  theme: 'amber',
  cameraPreset: 'cinema',
  matrixStepIndex: 12, // Monumental 20x12 (240 caissons)
  maxStrokeMm: 250, // Course max 250 mm
  speedFactor: 1.4, // Vitesse 1,19 m/s
  showActuators: true,
  ledsEnabled: true,
  studioLightsEnabled: true,
  activeTab: 'envergure',
  blueprintMinimized: false, // Menu architecture ouvert par défaut
  blueprintPos: { x: 0, y: 0 },
};

function loadPersistedPrefs(): PersistedPrefs {
  if (typeof window === 'undefined') return DEFAULT_PREFS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw) as Partial<PersistedPrefs>;
    return {
      ...DEFAULT_PREFS,
      ...parsed,
      blueprintPos: parsed.blueprintPos ?? DEFAULT_PREFS.blueprintPos,
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function FeaturedKineticSection() {
  const initialPrefs = useMemo(() => loadPersistedPrefs(), []);

  const sectionRef = useRef<HTMLElement | null>(null);
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<KineticWallScene | null>(null);
  const devVideoInputRef = useRef<HTMLInputElement | null>(null);
  const videoElRef = useRef<HTMLVideoElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const [viewportMode, setViewportMode] = useState<ViewportMode>('scene3d');
  const [activeTab, setActiveTab] = useState<AccordionTab>(initialPrefs.activeTab);
  // Toujours plié/contracté à chaque actualisation de la page
  const [dockCollapsed, setDockCollapsed] = useState<boolean>(true);

  const [pattern, setPattern] = useState<MotionPattern>(initialPrefs.pattern);
  const [activeShowId, setActiveShowId] = useState<string>(initialPrefs.activeShowId);
  const [theme, setTheme] = useState<VisualTheme>(initialPrefs.theme);
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>(initialPrefs.cameraPreset);
  const [matrixStepIndex, setMatrixStepIndex] = useState<number>(initialPrefs.matrixStepIndex);
  const [maxStrokeMm, setMaxStrokeMm] = useState<number>(initialPrefs.maxStrokeMm);
  const [speedFactor, setSpeedFactor] = useState<number>(initialPrefs.speedFactor);
  const [showActuators, setShowActuators] = useState<boolean>(initialPrefs.showActuators);
  const [ledsEnabled, setLedsEnabled] = useState<boolean>(initialPrefs.ledsEnabled);
  const [studioLightsEnabled, setStudioLightsEnabled] = useState<boolean>(
    initialPrefs.studioLightsEnabled
  );
  const [blueprintMinimized, setBlueprintMinimized] = useState<boolean>(
    initialPrefs.blueprintMinimized
  );
  const [blueprintPos, setBlueprintPos] = useState<{ x: number; y: number }>(
    initialPrefs.blueprintPos
  );
  const [cameraState, setCameraState] = useState<CameraState | undefined>(
    initialPrefs.cameraState
  );

  const [isPlaying, setIsPlaying] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return true;
  });

  const [hasActiveVideoStream, setHasActiveVideoStream] = useState<boolean>(false);
  const [videoMuted, setVideoMuted] = useState<boolean>(true);
  const [focusedComponent, setFocusedComponent] = useState<ComponentPartId | null>(null);
  const [specsOpen, setSpecsOpen] = useState<boolean>(false);
  const [webglFallback, setWebglFallback] = useState<boolean>(false);
  const [avgDepthMm, setAvgDepthMm] = useState<number>(125);

  const dims = MATRIX_STEPS[matrixStepIndex] ?? MATRIX_STEPS[12];

  // Persist user settings, camera position, and UI layout automatically (bottom dock always reloads collapsed)
  useEffect(() => {
    try {
      const payload: PersistedPrefs = {
        pattern,
        activeShowId,
        theme,
        cameraPreset,
        matrixStepIndex,
        maxStrokeMm,
        speedFactor,
        showActuators,
        ledsEnabled,
        studioLightsEnabled,
        activeTab,
        blueprintMinimized,
        blueprintPos,
        cameraState,
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage quota errors
    }
  }, [
    pattern,
    activeShowId,
    theme,
    cameraPreset,
    matrixStepIndex,
    maxStrokeMm,
    speedFactor,
    showActuators,
    ledsEnabled,
    studioLightsEnabled,
    activeTab,
    blueprintMinimized,
    blueprintPos,
    cameraState,
  ]);

  // Mount Three.js WebGL scene once
  useEffect(() => {
    const mount = canvasMountRef.current;
    if (!mount) return;

    try {
      const sceneCtrl = new KineticWallScene(
        mount,
        {
          cols: dims.cols,
          rows: dims.rows,
          pattern,
          theme,
          maxStrokeMm,
          speedFactor,
          showActuators,
          isPlaying,
          ledsEnabled,
          studioLightsEnabled,
          initialCamera: initialPrefs.cameraState,
        },
        {
          onTelemetry: (meanMm) => setAvgDepthMm(meanMm),
          onCameraChange: (nextCam) => setCameraState(nextCam),
          onContextLost: () => setWebglFallback(true),
        }
      );
      sceneRef.current = sceneCtrl;
      return () => {
        sceneCtrl.dispose();
        sceneRef.current = null;
        if (objectUrlRef.current) {
          URL.revokeObjectURL(objectUrlRef.current);
        }
      };
    } catch {
      setWebglFallback(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Push config updates to active Three.js scene
  useEffect(() => {
    sceneRef.current?.updateConfig({
      cols: dims.cols,
      rows: dims.rows,
      pattern,
      theme,
      maxStrokeMm,
      speedFactor,
      showActuators,
      isPlaying,
      ledsEnabled,
      studioLightsEnabled,
    });
  }, [
    dims.cols,
    dims.rows,
    pattern,
    theme,
    maxStrokeMm,
    speedFactor,
    showActuators,
    isPlaying,
    ledsEnabled,
    studioLightsEnabled,
  ]);

  // Sync HTMLVideoElement playback when active stream is loaded
  useEffect(() => {
    const video = videoElRef.current;
    if (!video || !hasActiveVideoStream) return;
    video.muted = videoMuted;
    if (isPlaying) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [isPlaying, videoMuted, hasActiveVideoStream]);

  // Hidden developer shortcut (Alt+V) for local MP4 previewing without exposing any client upload UI
  useEffect(() => {
    const handleDevKey = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        devVideoInputRef.current?.click();
      }
    };
    window.addEventListener('keydown', handleDevKey);
    return () => window.removeEventListener('keydown', handleDevKey);
  }, []);

  const detachVideoStream = () => {
    const video = videoElRef.current;
    if (video) {
      video.pause();
      video.removeAttribute('src');
      video.load();
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    sceneRef.current?.setVideoElement(null);
    setHasActiveVideoStream(false);
  };

  const attachVideoSource = (src: string, isBlob = false) => {
    const video = videoElRef.current;
    if (!video) return;

    if (objectUrlRef.current && !isBlob) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    video.src = src;
    video.muted = videoMuted;
    video.loop = true;

    const handleCanPlay = () => {
      sceneRef.current?.setVideoElement(video);
      setHasActiveVideoStream(true);
      setViewportMode('scene3d');
      setTheme('video');
      setPattern('video_depth');
      if (isPlaying) {
        video.play().catch(() => {});
      }
      video.removeEventListener('canplay', handleCanPlay);
    };

    video.addEventListener('canplay', handleCanPlay);
    video.load();
  };

  const handleSelectCuratedShow = (show: CuratedShowOption) => {
    setViewportMode('scene3d');
    setActiveShowId(show.id);

    if (show.videoUrl) {
      attachVideoSource(show.videoUrl, false);
    } else {
      if (hasActiveVideoStream) {
        detachVideoStream();
      }
      setTheme(show.theme);
      if (show.theme === 'show_prism' || show.theme === 'show_organic') {
        setPattern('video_depth');
      }
    }
  };

  const handleCameraPreset = (preset: CameraPreset) => {
    setViewportMode('scene3d');
    setFocusedComponent(null);
    setCameraPreset(preset);
    sceneRef.current?.setCameraPreset(preset);
  };

  const handleSelectComponent = (part: ComponentPartId | null) => {
    setViewportMode('scene3d');
    setFocusedComponent(part);
    if (part === 'linear_rail' || part === 'motion_unit' || part === 'motion_controller') {
      setShowActuators(true);
    }
    sceneRef.current?.focusComponent(part);
  };

  const speedDisplay = (speedFactor * 0.85).toFixed(2).replace('.', ',');

  return (
    <section
      ref={sectionRef}
      aria-labelledby="featured-mk250-title"
      className="relative w-full h-screen min-h-[680px] overflow-hidden bg-[#07080B] select-none"
    >
      {/* Hidden Video Source Element & Dev-Only File Input (Alt+V) */}
      <video
        ref={videoElRef}
        playsInline
        loop
        muted={videoMuted}
        crossOrigin="anonymous"
        className="hidden"
      />
      <input
        ref={devVideoInputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime,video/*"
        className="hidden"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && file.type.startsWith('video/')) {
            if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
            const url = URL.createObjectURL(file);
            objectUrlRef.current = url;
            setActiveShowId('dev_local');
            attachVideoSource(url, true);
          }
          e.target.value = '';
        }}
      />

      {/* Full-Bleed Three.js WebGL Viewport */}
      <div
        ref={canvasMountRef}
        className={`absolute inset-0 w-full h-full ${
          viewportMode === 'scene3d' && !webglFallback ? 'block' : 'hidden'
        }`}
      />

      {/* Fallback or Reference Photo Modes */}
      {(viewportMode !== 'scene3d' || webglFallback) && (
        <div className="absolute inset-0 w-full h-full bg-[#07080B]">
          <ResilientImage
            src={
              viewportMode === 'hardware'
                ? FEATURED_ASSETS.moduleRail
                : FEATURED_ASSETS.heroWall
            }
            alt={
              viewportMode === 'hardware'
                ? 'Caisson LED moulé 500x500 mm monté sur glissières linéaires en acier inoxydable et vis à billes'
                : 'Mur LED cinétique MK-250 intégré dans un atrium architectural en béton brut'
            }
            className="w-full h-full object-cover"
            fallbackTitle="TESSERA MK-250 Cinétique"
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-[#07080B]/85 via-[#07080B]/35 to-[#07080B]/65 pointer-events-none"
            aria-hidden="true"
          />
          <div
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(7,8,11,0.62)_0%,rgba(7,8,11,0.28)_58%,transparent_100%)] pointer-events-none"
            aria-hidden="true"
          />
        </div>
      )}

      {/* Top Semantic Header Bar — Couleur d'accent pilotée par --tessera-accent (src/index.css) */}
      <div className="relative z-10 w-full px-4 sm:px-6 pt-4 sm:pt-5 flex flex-col lg:flex-row lg:items-start justify-between gap-4 pointer-events-none">
        <div className="max-w-xl pointer-events-auto mt-6 sm:mt-8 ml-4 sm:ml-20 lg:ml-28">
          <p className="text-xs font-medium text-[var(--tessera-accent)] tracking-wide mb-1">
            04. Produit Phare · Architecture LED Cinétique
          </p>
          <h1
            id="featured-mk250-title"
            className="font-bold tracking-[-0.03em] text-[#F4F4F5] leading-[1.06]"
            style={{ fontSize: 'clamp(1.75rem, 3vw, 2.65rem)', textWrap: 'balance' }}
          >
            MK-250 Cinétique
          </h1>
          <p className="text-xs sm:text-sm text-[#D4D4D8] mt-1 leading-relaxed max-w-lg">
            Caissons aluminium 500 × 500 mm sur glissières linéaires · Unités 4-en-1 synchronisées
            sur 250 mm de course axiale · Faites glisser pour orbiter en 3D.
          </p>
        </div>

        {/* Top-Right View Mode + Technical Datasheet */}
        <div className="flex flex-wrap items-center gap-2.5 pointer-events-auto shrink-0">
          <div
            role="tablist"
            aria-label="Mode d'affichage"
            className="flex items-center gap-1 p-1 tessera-glass rounded-xl"
          >
            <button
              role="tab"
              type="button"
              aria-selected={viewportMode === 'scene3d'}
              onClick={() => setViewportMode('scene3d')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                viewportMode === 'scene3d'
                  ? 'bg-[var(--tessera-accent)] text-white'
                  : 'text-[#B4BAC6] hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              Scène 3D
            </button>
            <button
              role="tab"
              type="button"
              aria-selected={viewportMode === 'hardware'}
              onClick={() => setViewportMode('hardware')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                viewportMode === 'hardware'
                  ? 'bg-[var(--tessera-accent)] text-white'
                  : 'text-[#B4BAC6] hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              Châssis &amp; Rail
            </button>
            <button
              role="tab"
              type="button"
              aria-selected={viewportMode === 'atrium'}
              onClick={() => setViewportMode('atrium')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                viewportMode === 'atrium'
                  ? 'bg-[var(--tessera-accent)] text-white'
                  : 'text-[#B4BAC6] hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              Vue Atrium
            </button>
          </div>

          <button
            type="button"
            onClick={() => setSpecsOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-[#F4F4F5] tessera-glass-pill rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-[var(--tessera-accent)]" aria-hidden="true" />
            Fiche technique
          </button>
        </div>
      </div>

      {/* Draggable / Collapsible-to-Icon Interactive Schematic (01–05) */}
      <ComponentBlueprintPanel
        selectedPart={focusedComponent}
        onSelectPart={handleSelectComponent}
        dragConstraintsRef={sectionRef}
        initialPosition={blueprintPos}
        initialMinimized={blueprintMinimized}
        onPositionChange={setBlueprintPos}
        onMinimizedChange={setBlueprintMinimized}
      />

      {/*
        Section éditoriale centrée au milieu de la vue (modes Châssis & Rail / Vue Atrium)
        THÈME : Toutes les touches d'accentuation utilisent var(--tessera-accent)
        défini dans src/index.css pour s'adapter automatiquement à votre thème.
      */}
      <AnimatePresence>
        {viewportMode !== 'scene3d' && (
          <motion.div
            key="photo-editorial-centered"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-[46%] sm:top-[44%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-[90vw] max-w-[740px] flex flex-col items-center text-center"
          >
            {/* Compact Top Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-xl tessera-glass text-[11px] font-medium text-[#E4E4E7] mb-3">
              <span
                className="w-1.5 h-1.5 rounded-full bg-[var(--tessera-accent)]"
                aria-hidden="true"
              />
              <span>
                {viewportMode === 'hardware'
                  ? '01 · Ingénierie & Entraînement linéaire'
                  : '02 · Intégration monumentale en atrium'}
              </span>
            </div>

            {/* Inline Centered Spec Checkmarks */}
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-[11px] sm:text-xs font-medium text-[#D4D4D8] mb-3">
              {(viewportMode === 'hardware'
                ? ['Double rail inox', 'Vis à billes', 'CryoCathode', 'Course 250 mm']
                : ['Jusqu’à 240 caissons', 'Entraxe 1,5 mm', 'Quick-Lock', 'Service 24/7']
              ).map((item) => (
                <span key={item} className="inline-flex items-center gap-1.5">
                  <CheckCircle2
                    className="w-3.5 h-3.5 text-[var(--tessera-accent)] shrink-0"
                    aria-hidden="true"
                  />
                  <span>{item}</span>
                </span>
              ))}
            </div>

            {/* Centered Frameless Heading & Copy */}
            <AnimatePresence mode="wait">
              <motion.div
                key={viewportMode}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18 }}
                className="flex flex-col items-center"
              >
                <h2
                  className="font-bold tracking-[-0.03em] text-[#F4F4F5] leading-[1.06] drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]"
                  style={{ fontSize: 'clamp(1.6rem, 2.9vw, 2.5rem)', textWrap: 'balance' }}
                >
                  {viewportMode === 'hardware'
                    ? 'Mécanique de précision & vis à billes'
                    : 'Mur cinétique grand format en atrium'}
                </h2>

                <p className="text-xs sm:text-sm text-[#D4D4D8] mt-2.5 max-w-xl leading-relaxed drop-shadow-[0_1px_8px_rgba(0,0,0,0.85)]">
                  {viewportMode === 'hardware'
                    ? 'Caisson aluminium moulé 500 × 500 mm guidé sur double rail inoxydable rectifié, entraînement pas-à-pas silencieux et refroidissement passif continu.'
                    : 'Architecture LED motorisée capable de couvrir jusqu’à 60 m² sans cadre apparent, pensée pour les halls monumentaux, galeries et espaces culturels.'}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Centered Action Buttons (Secondary + Light Beam Electric CTA) */}
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() =>
                  setViewportMode(viewportMode === 'hardware' ? 'scene3d' : 'hardware')
                }
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-[#E4E4E7] tessera-glass-pill rounded-xl transition-colors cursor-pointer whitespace-nowrap"
              >
                {viewportMode === 'hardware'
                  ? 'Retour à la Scène 3D'
                  : 'Inspecter Châssis & Rail'}
              </button>

              <LightBeamButton
                onClick={() =>
                  setViewportMode(viewportMode === 'hardware' ? 'atrium' : 'scene3d')
                }
              >
                <span>
                  {viewportMode === 'hardware'
                    ? 'Explorer la Vue Atrium'
                    : 'Manipuler en Scène 3D'}
                </span>
                <ArrowRight
                  className="w-3.5 h-3.5 text-[var(--tessera-accent)]"
                  aria-hidden="true"
                />
              </LightBeamButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Compact Glossy 3-Part Accordion Control Dock (Scène 3D only) */}
      {viewportMode === 'scene3d' && !webglFallback && (
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-20 w-[94vw] max-w-[880px]">
        <div className="tessera-glass rounded-2xl overflow-hidden">
          {/* Slim Glossy Accordion Header Strip */}
          <div className={`flex flex-wrap items-center justify-between gap-2 px-2.5 py-2 ${!dockCollapsed ? 'tessera-glass-header' : ''}`}>
            {/* 3 Accordion Tabs (Only One Morceau Visible at a Time) */}
            <div
              role="tablist"
              aria-label="Sections de réglage 3D"
              className="flex items-center gap-1 tessera-glass-well p-1 rounded-xl"
            >
              {ACCORDION_TABS.map((tab) => {
                const isSelected = activeTab === tab.id && !dockCollapsed;
                return (
                  <button
                    key={tab.id}
                    role="tab"
                    type="button"
                    aria-selected={isSelected}
                    onClick={() => {
                      if (isSelected) {
                        setDockCollapsed(true);
                      } else {
                        setActiveTab(tab.id);
                        setDockCollapsed(false);
                      }
                    }}
                    className={`relative px-3 py-1.5 text-[11px] font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      isSelected ? 'text-white' : 'text-[#B4BAC6] hover:text-white'
                    }`}
                  >
                    {isSelected && (
                      <motion.span
                        layoutId="tessera-accordion-pill"
                        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                        className="absolute inset-0 bg-[var(--tessera-accent)] rounded-lg"
                      />
                    )}
                    <span className="relative z-10">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Compact Transport & Collapse Actions */}
            <div className="flex items-center gap-1.5 ml-auto">
              {hasActiveVideoStream && (
                <button
                  type="button"
                  onClick={() => setVideoMuted((m) => !m)}
                  aria-label={videoMuted ? 'Activer le son' : 'Couper le son'}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium text-[#D4D4D8] tessera-glass-pill hover:text-white rounded-xl transition-colors cursor-pointer whitespace-nowrap"
                >
                  {videoMuted ? (
                    <VolumeX className="w-3.5 h-3.5 text-[#A1A1AA]" aria-hidden="true" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5 text-[var(--tessera-accent)]" aria-hidden="true" />
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsPlaying((p) => !p)}
                aria-label={isPlaying ? 'Mettre en pause' : 'Lancer la lecture'}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium text-[#F4F4F5] tessera-glass-pill rounded-xl transition-colors cursor-pointer whitespace-nowrap"
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-3.5 h-3.5 text-[var(--tessera-accent)]" aria-hidden="true" />
                    <span className="hidden sm:inline">Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 text-[var(--tessera-accent)]" aria-hidden="true" />
                    <span className="hidden sm:inline">Lecture</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowActuators((s) => !s)}
                title={
                  showActuators
                    ? 'Masquer les glissières et vérins'
                    : 'Afficher les glissières et vérins'
                }
                aria-pressed={showActuators}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium border rounded-xl transition-colors cursor-pointer whitespace-nowrap ${
                  showActuators
                    ? 'bg-[#6BA6FF]/20 border-[#6BA6FF]/50 text-[#F4F4F5]'
                    : 'tessera-glass-pill text-[#B4BAC6] hover:text-white'
                }`}
              >
                {showActuators ? (
                  <Eye className="w-3.5 h-3.5 text-[#6BA6FF]" aria-hidden="true" />
                ) : (
                  <EyeOff className="w-3.5 h-3.5 text-[#71717A]" aria-hidden="true" />
                )}
                <span className="hidden sm:inline">Glissières</span>
              </button>

              <button
                type="button"
                onClick={() => setLedsEnabled((v) => !v)}
                title={ledsEnabled ? 'Éteindre les écrans LED' : 'Allumer les écrans LED'}
                aria-pressed={ledsEnabled}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium border rounded-xl transition-colors cursor-pointer whitespace-nowrap ${
                  ledsEnabled
                    ? 'bg-[rgba(var(--tessera-accent-rgb),0.2)] border-[rgba(var(--tessera-accent-rgb),0.5)] text-[#F4F4F5]'
                    : 'tessera-glass-pill text-[#B4BAC6] hover:text-white'
                }`}
              >
                <Power
                  className={`w-3.5 h-3.5 ${ledsEnabled ? 'text-[var(--tessera-accent)]' : 'text-[#71717A]'}`}
                  aria-hidden="true"
                />
                <span className="hidden sm:inline">Écrans</span>
              </button>

              <button
                type="button"
                onClick={() => setStudioLightsEnabled((v) => !v)}
                title={
                  studioLightsEnabled
                    ? 'Couper l’éclairage studio et les reflets'
                    : 'Activer l’éclairage studio'
                }
                aria-pressed={studioLightsEnabled}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium border rounded-xl transition-colors cursor-pointer whitespace-nowrap ${
                  studioLightsEnabled
                    ? 'bg-[#F5C451]/18 border-[#F5C451]/45 text-[#F4F4F5]'
                    : 'tessera-glass-pill text-[#B4BAC6] hover:text-white'
                }`}
              >
                <Sun
                  className={`w-3.5 h-3.5 ${studioLightsEnabled ? 'text-[#F5C451]' : 'text-[#71717A]'}`}
                  aria-hidden="true"
                />
                <span className="hidden sm:inline">Lumière</span>
              </button>

              <button
                type="button"
                onClick={() => setDockCollapsed((c) => !c)}
                aria-label={dockCollapsed ? 'Ouvrir les réglages' : 'Masquer les réglages'}
                className="inline-flex items-center justify-center w-8 h-8 text-[#A1A1AA] hover:text-white tessera-glass-pill rounded-xl transition-colors cursor-pointer"
              >
                {dockCollapsed ? (
                  <ChevronUp className="w-4 h-4 text-[var(--tessera-accent)]" aria-hidden="true" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[var(--tessera-accent)]" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          {/* Single-Section Accordion Content */}
          <AnimatePresence initial={false}>
            {!dockCollapsed && (
              <motion.div
                key="accordion-body"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden"
              >
                <div className="p-3.5 sm:px-4 sm:py-3.5">
                  <AnimatePresence mode="wait">
                    {activeTab === 'envergure' && (
                      <motion.div
                        key="tab-envergure"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.16 }}
                      >
                        <KineticTierSlider
                          stepIndex={matrixStepIndex}
                          onChangeStep={(nextIdx) => {
                            setViewportMode('scene3d');
                            setMatrixStepIndex(nextIdx);
                          }}
                        />
                      </motion.div>
                    )}

                    {activeTab === 'mouvement' && (
                      <motion.div
                        key="tab-mouvement"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.16 }}
                        className="space-y-3"
                      >
                        {/* Full-Label Choreography Pills */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <span className="text-[11px] font-medium text-[#8E95A3] shrink-0">
                            Chorégraphie
                          </span>
                          <div className="flex flex-wrap items-center gap-1 tessera-glass-well p-1 rounded-xl">
                            {PATTERN_OPTIONS.map((opt) => {
                              const isSelected = pattern === opt.id;
                              return (
                                <button
                                  key={opt.id}
                                  type="button"
                                  onClick={() => {
                                    setViewportMode('scene3d');
                                    setPattern(opt.id);
                                  }}
                                  className={`relative px-3 py-1.5 text-[11px] font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                                    isSelected
                                      ? 'text-white'
                                      : 'text-[#B4BAC6] hover:text-white'
                                  }`}
                                >
                                  {isSelected && (
                                    <motion.span
                                      layoutId="pattern-pill"
                                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                                      className="absolute inset-0 bg-[var(--tessera-accent)] rounded-lg"
                                    />
                                  )}
                                  <span className="relative z-10">{opt.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Rounded Spring Sliders + Live Avg Stroke */}
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-end">
                          <div className="sm:col-span-5">
                            <SpringValueSlider
                              id="stroke-3d"
                              label="Course max"
                              min={40}
                              max={250}
                              step={10}
                              value={maxStrokeMm}
                              displayValue={String(maxStrokeMm)}
                              unit="mm"
                              accent="amber"
                              onChange={setMaxStrokeMm}
                            />
                          </div>

                          <div className="sm:col-span-5">
                            <SpringValueSlider
                              id="speed-3d"
                              label="Vitesse"
                              min={0.2}
                              max={1.4}
                              step={0.1}
                              value={speedFactor}
                              displayValue={speedDisplay}
                              unit="m/s"
                              accent="blue"
                              onChange={setSpeedFactor}
                            />
                          </div>

                          <div className="sm:col-span-2 flex sm:flex-col items-center sm:items-end justify-between tessera-glass-well rounded-xl px-3 py-1.5">
                            <span className="text-[10px] text-[#8E95A3] whitespace-nowrap">
                              Course moy.
                            </span>
                            <div className="flex items-baseline gap-1 font-mono tabular-nums">
                              <RollingNumber
                                value={String(avgDepthMm)}
                                className="text-xs font-semibold text-[var(--tessera-accent)]"
                              />
                              <span className="text-[10px] text-[#8E95A3]">mm</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {activeTab === 'signal' && (
                      <motion.div
                        key="tab-signal"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.16 }}
                        className="space-y-3"
                      >
                        {/* Curated Visual & Video Shows */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <span className="text-[11px] font-medium text-[#8E95A3] shrink-0">
                            Shows &amp; Signal LED
                          </span>
                          <div className="flex flex-wrap items-center gap-1 tessera-glass-well p-1 rounded-xl">
                            {CURATED_SHOWS.map((show) => {
                              const isSelected = activeShowId === show.id;
                              return (
                                <button
                                  key={show.id}
                                  type="button"
                                  onClick={() => handleSelectCuratedShow(show)}
                                  className={`relative inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                                    isSelected
                                      ? 'text-white'
                                      : 'text-[#B4BAC6] hover:text-white'
                                  }`}
                                >
                                  {isSelected && (
                                    <motion.span
                                      layoutId="show-pill"
                                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                                      className="absolute inset-0 bg-white/[0.12] border border-white/20 rounded-lg"
                                    />
                                  )}
                                  <span
                                    className="relative z-10 w-2 h-2 rounded-full shrink-0"
                                    style={{ backgroundColor: show.accent }}
                                    aria-hidden="true"
                                  />
                                  <span className="relative z-10">{show.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* 3D Camera Presets */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <span className="text-[11px] font-medium text-[#8E95A3] shrink-0">
                            Angle Caméra 3D
                          </span>
                          <div className="flex flex-wrap items-center gap-1 tessera-glass-well p-1 rounded-xl">
                            {CAMERA_PRESETS.map((cam) => {
                              const isSelected = cameraPreset === cam.id;
                              return (
                                <button
                                  key={cam.id}
                                  type="button"
                                  onClick={() => handleCameraPreset(cam.id)}
                                  className={`relative px-3 py-1.5 text-[11px] font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                                    isSelected
                                      ? 'text-white'
                                      : 'text-[#B4BAC6] hover:text-white'
                                  }`}
                                >
                                  {isSelected && (
                                    <motion.span
                                      layoutId="camera-pill"
                                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                                      className="absolute inset-0 bg-[var(--tessera-accent)] rounded-lg"
                                    />
                                  )}
                                  <span className="relative z-10">{cam.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      )}

      {/* Architectural Glossy Technical Datasheet Modal */}
      {specsOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="specs-modal-title"
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSpecsOpen(false)}
        >
          <div
            className="w-full max-w-4xl tessera-glass rounded-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Glossy Header */}
            <div className="tessera-glass-header flex items-center justify-between px-6 py-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--tessera-accent)]">
                  TESSERA Systems · Spécifications d’ingénierie
                </p>
                <h2 id="specs-modal-title" className="text-lg font-semibold text-[#F4F4F5] mt-0.5">
                  MK-250 Cinétique — Fiche technique
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSpecsOpen(false)}
                aria-label="Fermer la fiche technique"
                className="w-9 h-9 inline-flex items-center justify-center rounded-xl text-[#A1A1AA] hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[78vh] overflow-y-auto">
              {/* 5-Column Key Architectural Metrics Grid */}
              <div>
                <div className="grid grid-cols-2 sm:grid-cols-5 tessera-glass-well rounded-xl overflow-hidden divide-y sm:divide-y-0 sm:divide-x divide-white/[0.09]">
                  {HERO_METRICS.map((item) => (
                    <div key={item.label} className="px-4 py-4">
                      <div className="font-display text-xl font-bold tracking-tight text-[#F4F4F5] tabular-nums">
                        {item.value}
                      </div>
                      <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#8E95A3] mt-1.5">
                        {item.label}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-[#A1A1AA] mt-3 leading-relaxed">
                  Système LED cinétique grand format — unités motrices 4-en-1 montées sur glissières
                  linéaires industrielles, conçu pour les atriums et façades architecturales de grande envergure.
                </p>
              </div>

              {/* Detailed Engineering Spec Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/[0.08] tessera-glass-well rounded-xl overflow-hidden">
                {FEATURED_SPECS.map((spec) => (
                  <div
                    key={spec.label}
                    className="bg-black/45 px-4 py-3.5 flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-[#B4BAC6]">{spec.label}</div>
                      <div className="text-[11px] text-[#71717A] mt-0.5 truncate">{spec.detail}</div>
                    </div>
                    <div className="font-mono text-xs sm:text-sm font-semibold text-[#F4F4F5] tabular-nums shrink-0 text-right">
                      {spec.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
