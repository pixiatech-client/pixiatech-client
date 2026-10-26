'use client';

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Language } from '../../pixiatech-translations';
import { useCms } from '@/lib/site-web/cms-context';
import { getCmsText, normalizeLang } from '@/lib/site-web/cms-i18n';
import { useSectionStyle } from '../../cms/useSectionStyle';
import { Sparkles, Eye, Scan, Flame, ArrowRight, CheckCircle2 } from 'lucide-react';

interface ShowreelSectionProps {
  lang?: Language;
  onOpenConsultation?: () => void;
}

type InspectorMode = 'cinema' | 'optics' | 'thermal';

interface StageMeta {
  id: number;
  image: string;
  tag: string;
  scaleMetric: string;
  pixelsCount: string;
  pitch: string;
  nits: string;
  refresh: string;
}

const STAGES: StageMeta[] = [
  {
    id: 1,
    image: '/assets/showreel/stage-1-micro-diode.jpg',
    tag: 'MICROLED SMD',
    scaleMetric: '0.9 mm',
    pixelsCount: '3 Diodes RGB',
    pitch: 'P0.9 Ultra-Fine',
    nits: '1,500 nits',
    refresh: '7,680 Hz',
  },
  {
    id: 2,
    image: '/assets/showreel/stage-2-cabinet-module.jpg',
    tag: 'CHÂSSIS MAGNÉSIUM',
    scaleMetric: '500 mm',
    pixelsCount: '250,000 px',
    pitch: 'Calibration ±0.01mm',
    nits: '2,200 nits',
    refresh: '7,680 Hz',
  },
  {
    id: 3,
    image: '/assets/showreel/stage-3-xr-soundstage.jpg',
    tag: 'STUDIO XR & CINÉMA',
    scaleMetric: '35 m',
    pixelsCount: '38,400,000 px',
    pitch: 'Courbure R=8m',
    nits: '2,500 nits HDR',
    refresh: '7,680 Hz Genlock',
  },
  {
    id: 4,
    image: '/assets/showreel/stage-4-architectural-city.jpg',
    tag: 'MÉTROPOLE ARCHITECTURALE',
    scaleMetric: '180 m',
    pixelsCount: '120,000,000 px',
    pitch: 'DOOH 10,000 nits',
    nits: '10,000 nits',
    refresh: '3,840 Hz',
  },
];

export const ShowreelSection: React.FC<ShowreelSectionProps> = ({ lang = 'FR', onOpenConsultation }) => {
  const { pages, currentLang, isEditing } = useCms();
  const cmsData = (pages['home']?.sections?.showreel as Record<string, unknown>) || {};
  const cms = useSectionStyle(cmsData);
  const activeLang = isEditing ? currentLang : normalizeLang(lang);

  const containerRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [inspectorMode, setInspectorMode] = useState<InspectorMode>('cinema');
  const [scrollProgress, setScrollProgress] = useState(0);
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const [cursorInSticky, setCursorInSticky] = useState(false);

  // Internationalized texts with full CMS compatibility
  const t = useMemo(() => {
    return {
      label: getCmsText(cmsData, 'label', activeLang, 'PIXIATECH / SHOWREEL EXPÉRIENCE'),
      scrollHint: getCmsText(
        cmsData,
        'scrollHint',
        activeLang,
        activeLang === 'fr' ? 'FAITES DÉFILER POUR EXPLORER L’ÉCHELLE' : 'SCROLL TO EXPLORE THE SCALE'
      ),
      eyebrow: getCmsText(
        cmsData,
        'eyebrow',
        activeLang,
        activeLang === 'fr' ? '02 / SHOWREEL IMMERSIF — DE LA MATIÈRE À L’HORIZON' : '02 / IMMERSIVE SHOWREEL — FROM MATTER TO HORIZON'
      ),
      head1: getCmsText(
        cmsData,
        'head1',
        activeLang,
        activeLang === 'fr' ? 'L’INGÉNIERIE' : 'ENGINEERING'
      ),
      head2: getCmsText(
        cmsData,
        'head2',
        activeLang,
        activeLang === 'fr' ? 'SANS LIMITE.' : 'WITHOUT LIMITS.'
      ),
      lede: getCmsText(
        cmsData,
        'lede',
        activeLang,
        activeLang === 'fr'
          ? "De la précision nanométrique du micro-pixel jusqu’aux façades monumentales qui redéfinissent l’architecture urbaine."
          : 'From the nanometric precision of the micro-pixel to monumental facades that redefine urban architecture.'
      ),
      chapters: [
        [
          getCmsText(cmsData, 'ch1Eyebrow', activeLang, activeLang === 'fr' ? '01 / LA MATRICE' : '01 / THE MATRIX'),
          getCmsText(cmsData, 'ch1TitleLine1', activeLang, activeLang === 'fr' ? 'La pureté optique' : 'Optical purity'),
          getCmsText(cmsData, 'ch1TitleLine2', activeLang, activeLang === 'fr' ? 'au cœur du composant.' : 'at the core.'),
          getCmsText(
            cmsData,
            'ch1Desc',
            activeLang,
            activeLang === 'fr'
              ? "Chaque micro-diode est liée sur substrat de saphir avec nano-lentilles prismatiques. Contraste infini, zéro reflet parasite, chromaticité certifiée DCI-P3 à 99.8%."
              : 'Each micro-diode bonded to a sapphire substrate with prismatic nano-lenses. Infinite contrast, zero glare, certified 99.8% DCI-P3 color gamut.'
          ),
        ],
        [
          getCmsText(cmsData, 'ch2Eyebrow', activeLang, activeLang === 'fr' ? '02 / LE CHÂSSIS' : '02 / THE CHASSIS'),
          getCmsText(cmsData, 'ch2TitleLine1', activeLang, activeLang === 'fr' ? 'Alliage magnésium' : 'Magnesium alloy'),
          getCmsText(cmsData, 'ch2TitleLine2', activeLang, activeLang === 'fr' ? '& verrouillage laser.' : '& laser locking.'),
          getCmsText(
            cmsData,
            'ch2Desc',
            activeLang,
            activeLang === 'fr'
              ? "Usinage CNC au micron près. Connecteurs plaqués or flottants et verrous magnétiques pour un plan optique totalement imperceptible entre les cabinets."
              : 'Micron-tolerance CNC machining. Floating gold-plated connectors and magnetic alignment latches for a totally seamless optical plane.'
          ),
        ],
        [
          getCmsText(cmsData, 'ch3Eyebrow', activeLang, activeLang === 'fr' ? '03 / LE STUDIO XR' : '03 / THE XR STAGE'),
          getCmsText(cmsData, 'ch3TitleLine1', activeLang, activeLang === 'fr' ? 'Production virtuelle' : 'Virtual production'),
          getCmsText(cmsData, 'ch3TitleLine2', activeLang, activeLang === 'fr' ? 'sans compromis.' : 'without compromise.'),
          getCmsText(
            cmsData,
            'ch3Desc',
            activeLang,
            activeLang === 'fr'
              ? "Volume LED courbé avec genlock instantané à 7,680Hz. Suppression absolue du moiré et du banding sous les caméras cinéma les plus exigeantes."
              : 'Curved LED volume with 7,680Hz ultra-low latency genlock. Absolute elimination of moiré and camera banding under high-end cinema optics.'
          ),
        ],
        [
          getCmsText(cmsData, 'ch4Eyebrow', activeLang, activeLang === 'fr' ? '04 / L’ARCHITECTURE' : '04 / ARCHITECTURE'),
          getCmsText(cmsData, 'ch4TitleLine1', activeLang, activeLang === 'fr' ? 'De l’art visuel' : 'Visual artistry'),
          getCmsText(cmsData, 'ch4TitleLine2', activeLang, activeLang === 'fr' ? 'à l’échelle de la cité.' : 'scaled to the city.'),
          '',
        ],
      ],
      cta: getCmsText(
        cmsData,
        'cta',
        activeLang,
        activeLang === 'fr' ? 'Explorer nos réalisations d’envergure →' : 'Explore our flagship projects →'
      ),
      steps: [
        getCmsText(cmsData, 'step1', activeLang, '01. DIODE'),
        getCmsText(cmsData, 'step2', activeLang, '02. MODULE'),
        getCmsText(cmsData, 'step3', activeLang, activeLang === 'fr' ? '03. STUDIO XR' : '03. XR STAGE'),
        getCmsText(cmsData, 'step4', activeLang, activeLang === 'fr' ? '04. ARCHITECTURE' : '04. FAÇADE'),
      ],
      hud: [
        getCmsText(cmsData, 'hudDistanceLabel', activeLang, activeLang === 'fr' ? 'ÉCHELLE OPTIQUE' : 'OPTICAL SCALE'),
        getCmsText(cmsData, 'hudPixelsLabel', activeLang, activeLang === 'fr' ? 'DÉFINITION' : 'RESOLUTION'),
        getCmsText(cmsData, 'hudScaleLabel', activeLang, activeLang === 'fr' ? 'MODULE ACTIF' : 'ACTIVE MODULE'),
      ],
      smdPixel: getCmsText(cmsData, 'smdPixelLabel', activeLang, 'MICRO-OPTIQUE P0.9'),
      modes: {
        cinema: activeLang === 'fr' ? 'Rendu Cinématique' : 'Cinematic View',
        optics: activeLang === 'fr' ? 'Laser & Alignement' : 'Laser & Alignment',
        thermal: activeLang === 'fr' ? 'Luxmètre & Spectre' : 'Photometry & Spectrum',
      },
    };
  }, [cmsData, activeLang]);

  // Handle scroll detection and lerped progress
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let animId = 0;
    let targetP = 0;
    let curP = 0;

    const handleScroll = () => {
      const rect = container.getBoundingClientRect();
      const viewH = window.innerHeight;
      const totalH = rect.height - viewH;
      if (totalH <= 0) return;

      const p = Math.max(0, Math.min(1, -rect.top / totalH));
      targetP = p;
    };

    const updateLoop = () => {
      curP += (targetP - curP) * 0.14;
      if (Math.abs(targetP - curP) < 0.0005) {
        curP = targetP;
      }
      setScrollProgress(curP);

      // Determine stage (0 to 3)
      const stage = Math.min(3, Math.max(0, Math.floor(curP * 4)));
      setCurrentStageIdx(stage);

      animId = requestAnimationFrame(updateLoop);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    animId = requestAnimationFrame(updateLoop);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(animId);
    };
  }, []);

  // Ambient Canvas Effects: Volumetric light beam, cursor spotlight, laser grid
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let width = 0;
    let height = 0;

    const resize = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.round(width * Math.min(window.devicePixelRatio || 1, 1.5));
      canvas.height = Math.round(height * Math.min(window.devicePixelRatio || 1, 1.5));
      ctx.setTransform(
        Math.min(window.devicePixelRatio || 1, 1.5),
        0,
        0,
        Math.min(window.devicePixelRatio || 1, 1.5),
        0,
        0
      );
    };
    resize();
    window.addEventListener('resize', resize);

    // Particle motes for cinema lighting
    const particles = Array.from({ length: 45 }, () => ({
      x: Math.random(),
      y: Math.random(),
      speed: 0.0008 + Math.random() * 0.0016,
      size: 1 + Math.random() * 2,
      opacity: 0.15 + Math.random() * 0.45,
    }));

    let frame = 0;

    const render = () => {
      frame++;
      ctx.clearRect(0, 0, width, height);

      // Dynamic mouse spotlight
      const targetMouseX = mousePos.x * width;
      const targetMouseY = mousePos.y * height;

      // 1. Ambient Volumetric Glow
      const ambientGrad = ctx.createRadialGradient(
        targetMouseX,
        targetMouseY,
        20,
        targetMouseX,
        targetMouseY,
        width * 0.7
      );
      ambientGrad.addColorStop(0, 'rgba(195, 249, 16, 0.06)');
      ambientGrad.addColorStop(0.3, 'rgba(34, 211, 238, 0.03)');
      ambientGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = ambientGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Mode: Optics (Laser Vector Reticle & Micron Grid)
      if (inspectorMode === 'optics') {
        ctx.save();
        ctx.strokeStyle = 'rgba(195, 249, 16, 0.35)';
        ctx.lineWidth = 1;

        // Crosshair on cursor
        ctx.beginPath();
        ctx.moveTo(0, targetMouseY);
        ctx.lineTo(width, targetMouseY);
        ctx.moveTo(targetMouseX, 0);
        ctx.lineTo(targetMouseX, height);
        ctx.stroke();

        // Target reticle
        ctx.beginPath();
        ctx.arc(targetMouseX, targetMouseY, 28, 0, Math.PI * 2);
        ctx.arc(targetMouseX, targetMouseY, 48, 0, Math.PI * 2);
        ctx.stroke();

        // Technical angle ticks
        const rot = frame * 0.02;
        ctx.beginPath();
        ctx.arc(targetMouseX, targetMouseY, 38, rot, rot + Math.PI * 0.5);
        ctx.arc(targetMouseX, targetMouseY, 38, rot + Math.PI, rot + Math.PI * 1.5);
        ctx.stroke();

        // Grid scan lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        const step = 80;
        for (let x = 0; x < width; x += step) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
        for (let y = 0; y < height; y += step) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }
        ctx.restore();
      }

      // 3. Mode: Thermal / Photometry (False-color Heatmap Vignette)
      if (inspectorMode === 'thermal') {
        ctx.save();
        const thermGrad = ctx.createRadialGradient(
          width * 0.5,
          height * 0.5,
          50,
          width * 0.5,
          height * 0.5,
          width * 0.6
        );
        thermGrad.addColorStop(0, 'rgba(255, 60, 0, 0.12)');
        thermGrad.addColorStop(0.4, 'rgba(255, 180, 0, 0.08)');
        thermGrad.addColorStop(0.7, 'rgba(0, 160, 255, 0.1)');
        thermGrad.addColorStop(1, 'rgba(20, 0, 80, 0.25)');
        ctx.fillStyle = thermGrad;
        ctx.fillRect(0, 0, width, height);

        // Scanline sweep
        const scanY = (frame * 2.5) % height;
        ctx.fillStyle = 'rgba(195, 249, 16, 0.18)';
        ctx.fillRect(0, scanY, width, 2);
        ctx.restore();
      }

      // 4. Subtle Cinematic Floating Light Motes
      ctx.fillStyle = '#FFFFFF';
      for (const p of particles) {
        p.y -= p.speed;
        if (p.y < 0) p.y = 1;
        ctx.globalAlpha = p.opacity;
        ctx.beginPath();
        ctx.arc(p.x * width, p.y * height, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animId);
    };
  }, [mousePos, inspectorMode]);

  // Mouse tilt tracking for spatial parallax
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setMousePos({ x, y });
  }, []);

  // Jump to specific chapter smoothly
  const scrollToStage = (stageIdx: number) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const containerTop = rect.top + scrollTop;
    const totalH = rect.height - window.innerHeight;
    const targetY = containerTop + (stageIdx / 3) * totalH + 10;
    window.scrollTo({ top: targetY, behavior: 'smooth' });
  };

  const activeStage = STAGES[currentStageIdx] || STAGES[0];
  const heroOpacity = Math.max(0, 1 - scrollProgress / 0.12);

  return (
    <div
      id="showreel"
      ref={containerRef}
      className="sr-wrap"
      style={{
        position: 'relative',
        backgroundColor: cms.section.backgroundColor ?? '#020305',
        color: '#F5F4F0',
        height: '520vh',
        backgroundImage: cms.section.backgroundImage,
        backgroundSize: cms.section.backgroundSize,
        backgroundPosition: cms.section.backgroundPosition,
        backgroundRepeat: cms.section.backgroundRepeat,
      }}
    >
      {/* STICKY FULLSCREEN VIEWPORT */}
      <div
        ref={stickyRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setCursorInSticky(true)}
        onMouseLeave={() => setCursorInSticky(false)}
        style={{
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflow: 'hidden',
          backgroundColor: '#030508',
        }}
      >
        {/* BACKGROUND REALISTIC PHOTOGRAPHY STAGES (3D Parallax Stack) */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            overflow: 'hidden',
          }}
        >
          {STAGES.map((st, idx) => {
            // Stage visibility window
            // 4 stages: 0 (0-0.28), 1 (0.24-0.54), 2 (0.50-0.78), 3 (0.74-1.0)
            const stageCenters = [0.1, 0.38, 0.64, 0.9];
            const center = stageCenters[idx];
            const dist = Math.abs(scrollProgress - center);
            const opacity = Math.max(0, Math.min(1, 1 - dist / 0.22));

            // Spatial Dolly Zoom: Image scales down as camera pulls back
            const scale = 1.08 + (scrollProgress - center) * 0.15;
            const tiltX = (mousePos.x - 0.5) * 16;
            const tiltY = (mousePos.y - 0.5) * 12;

            return (
              <div
                key={st.id}
                style={{
                  position: 'absolute',
                  inset: 0,
                  opacity: opacity.toFixed(3),
                  transform: `scale(${scale.toFixed(4)}) translate3d(${tiltX.toFixed(1)}px, ${tiltY.toFixed(1)}px, 0)`,
                  transition: 'opacity 350ms cubic-bezier(0.23, 1, 0.32, 1)',
                  pointerEvents: 'none',
                  willChange: 'transform, opacity',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={st.image}
                  alt={st.tag}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    filter:
                      inspectorMode === 'thermal'
                        ? 'contrast(1.6) saturate(2.4) hue-rotate(180deg)'
                        : inspectorMode === 'optics'
                        ? 'contrast(1.2) brightness(0.95)'
                        : 'contrast(1.05) brightness(0.92)',
                    transition: 'filter 300ms ease',
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* INTERACTIVE AMBIENT CANVAS OVERLAY */}
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 10,
          }}
        />

        {/* CINEMATIC SHADOW & CONTRAST VIGNETTES */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse 95% 85% at 50% 50%, rgba(2, 4, 8, 0.1) 40%, rgba(2, 4, 8, 0.85) 100%)',
            pointerEvents: 'none',
            zIndex: 11,
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(2,4,8,0.92) 0%, rgba(2,4,8,0.2) 20%, rgba(2,4,8,0.2) 70%, rgba(2,4,8,0.95) 100%)',
            pointerEvents: 'none',
            zIndex: 12,
          }}
        />

        {/* TOP HUD BAR */}
        <div
          style={{
            position: 'absolute',
            top: 'calc(var(--nav-h, 88px) + 16px)',
            left: 'clamp(16px, 3.5vw, 64px)',
            right: 'clamp(16px, 3.5vw, 64px)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 16,
            zIndex: 30,
            pointerEvents: 'auto',
          }}
        >
          {/* Brand & Section Label */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '6px 14px',
              borderRadius: 999,
              background: 'rgba(10, 14, 20, 0.75)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              backdropFilter: 'blur(12px)',
            }}
          >
            <div
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: '#C3F910',
                boxShadow: '0 0 10px #C3F910',
                animation: 'xr-blink 1.4s ease-in-out infinite',
              }}
            />
            <span
              data-text-key="label"
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                letterSpacing: '.22em',
                color: '#E5E7EB',
                fontFamily: 'var(--font-mono, monospace)',
              }}
            >
              {t.label}
            </span>
          </div>

          {/* INSPECTOR VIEW MODES SWITCHER */}
          <div
            className="hidden md:flex"
            style={{
              alignItems: 'center',
              gap: 6,
              padding: '4px 6px',
              borderRadius: 999,
              background: 'rgba(10, 14, 20, 0.75)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              backdropFilter: 'blur(12px)',
            }}
          >
            {(['cinema', 'optics', 'thermal'] as InspectorMode[]).map((mode) => {
              const active = inspectorMode === mode;
              const Icon = mode === 'cinema' ? Eye : mode === 'optics' ? Scan : Flame;
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setInspectorMode(mode)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 12px',
                    borderRadius: 999,
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '.08em',
                    fontFamily: 'var(--font-mono, monospace)',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 200ms cubic-bezier(0.23, 1, 0.32, 1)',
                    background: active ? '#C3F910' : 'transparent',
                    color: active ? '#05070B' : '#9CA3AF',
                    boxShadow: active ? '0 0 16px rgba(195, 249, 16, 0.35)' : 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (!active) e.currentTarget.style.color = '#FFFFFF';
                  }}
                  onMouseLeave={(e) => {
                    if (!active) e.currentTarget.style.color = '#9CA3AF';
                  }}
                >
                  <Icon style={{ width: 12, height: 12 }} />
                  <span>{t.modes[mode]}</span>
                </button>
              );
            })}
          </div>

          {/* Scroll Hint */}
          <div
            className="hidden sm:flex"
            style={{
              padding: '6px 14px',
              borderRadius: 999,
              background: 'rgba(10, 14, 20, 0.75)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              backdropFilter: 'blur(12px)',
              fontSize: 10,
              letterSpacing: '.2em',
              color: '#9CA3AF',
              fontFamily: 'var(--font-mono, monospace)',
            }}
          >
            <span data-text-key="scrollHint">{t.scrollHint}</span>
          </div>
        </div>

        {/* RIGHT TELEMETRY HUD (Glassmorphism Instrument Cluster) */}
        <div
          className="hidden lg:flex"
          style={{
            position: 'absolute',
            top: '50%',
            right: 'clamp(16px, 3.5vw, 64px)',
            transform: 'translateY(-50%)',
            flexDirection: 'column',
            gap: 14,
            zIndex: 30,
            pointerEvents: 'none',
            width: 240,
          }}
        >
          <div
            style={{
              padding: '20px 22px',
              borderRadius: 20,
              background: 'rgba(8, 12, 18, 0.82)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              backdropFilter: 'blur(16px)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
              display: 'flex',
              flexDirection: 'column',
              gap: 18,
            }}
          >
            {/* Metric 1: Optical Scale */}
            <div>
              <div
                style={{
                  fontSize: 9.5,
                  letterSpacing: '.24em',
                  color: '#9CA3AF',
                  fontFamily: 'var(--font-mono, monospace)',
                  marginBottom: 4,
                }}
              >
                {t.hud[0]}
              </div>
              <div
                style={{
                  fontSize: 26,
                  fontWeight: 800,
                  letterSpacing: '-.02em',
                  color: '#FFFFFF',
                  fontFamily: 'var(--font-heading, sans-serif)',
                }}
              >
                {activeStage.scaleMetric}
              </div>
            </div>

            {/* Metric 2: Resolution / Pixels */}
            <div>
              <div
                style={{
                  fontSize: 9.5,
                  letterSpacing: '.24em',
                  color: '#9CA3AF',
                  fontFamily: 'var(--font-mono, monospace)',
                  marginBottom: 4,
                }}
              >
                {t.hud[1]}
              </div>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  letterSpacing: '-.01em',
                  color: '#C3F910',
                  fontFamily: 'var(--font-mono, monospace)',
                }}
              >
                {activeStage.pixelsCount}
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: 'rgba(255, 255, 255, 0.08)' }} />

            {/* Specs Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <div style={{ fontSize: 9, letterSpacing: '.18em', color: '#6B7280', fontFamily: 'var(--font-mono)' }}>
                  PITCH / PRÉCISION
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#E5E7EB', marginTop: 2 }}>
                  {activeStage.pitch}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 9, letterSpacing: '.18em', color: '#6B7280', fontFamily: 'var(--font-mono)' }}>
                  LUMINANCE HDR
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#E5E7EB', marginTop: 2 }}>
                  {activeStage.nits}
                </div>
              </div>
            </div>

            <div>
              <div style={{ fontSize: 9, letterSpacing: '.18em', color: '#6B7280', fontFamily: 'var(--font-mono)' }}>
                FRÉQUENCE GENLOCK
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#C3F910', marginTop: 2 }}>
                {activeStage.refresh}
              </div>
            </div>
          </div>
        </div>

        {/* HERO TITLE (Visible on Initial Scroll) */}
        <div
          style={{
            position: 'absolute',
            left: 'clamp(16px, 3.5vw, 64px)',
            bottom: 'clamp(72px, 11vh, 120px)',
            maxWidth: 960,
            zIndex: 30,
            opacity: heroOpacity.toFixed(3),
            transform: `translateY(${(1 - heroOpacity) * 20}px)`,
            pointerEvents: heroOpacity > 0.4 ? 'auto' : 'none',
            transition: 'opacity 300ms cubic-bezier(0.23, 1, 0.32, 1), transform 350ms cubic-bezier(0.23, 1, 0.32, 1)',
          }}
        >
          <div
            data-text-key="eyebrow"
            style={{
              fontSize: 11,
              letterSpacing: '.24em',
              color: '#C3F910',
              fontWeight: 700,
              marginBottom: 16,
              fontFamily: 'var(--font-mono)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span>{t.eyebrow}</span>
          </div>

          <h2
            style={{
              lineHeight: 0.94,
              letterSpacing: '-.035em',
              fontWeight: 900,
              fontSize: 'clamp(44px, 8.2vw, 120px)',
              margin: 0,
            }}
          >
            <span
              data-text-key="head1"
              style={{
                display: 'block',
                color: 'transparent',
                WebkitTextStroke: '1.5px rgba(245,244,240,.9)',
              }}
            >
              {t.head1}
            </span>
            <span
              data-text-key="head2"
              style={{
                display: 'block',
                color: '#F5F4F0',
                textShadow: '0 8px 32px rgba(0,0,0,0.8)',
              }}
            >
              {t.head2}
            </span>
          </h2>

          <p
            data-text-key="lede"
            style={{
              margin: '24px 0 0',
              maxWidth: 520,
              fontSize: 'clamp(14px, 1.3vw, 17px)',
              lineHeight: 1.6,
              color: '#D1D5DB',
              textShadow: '0 2px 10px rgba(0,0,0,0.8)',
            }}
          >
            {t.lede}
          </p>
        </div>

        {/* PROGRESSIVE CHAPTER OVERLAYS (One for each stage) */}
        {t.chapters.map((ch, idx) => {
          const isCurrent = currentStageIdx === idx && scrollProgress > 0.12;
          const chKey = [
            { eyebrow: 'ch1Eyebrow', line1: 'ch1TitleLine1', line2: 'ch1TitleLine2', desc: 'ch1Desc' },
            { eyebrow: 'ch2Eyebrow', line1: 'ch2TitleLine1', line2: 'ch2TitleLine2', desc: 'ch2Desc' },
            { eyebrow: 'ch3Eyebrow', line1: 'ch3TitleLine1', line2: 'ch3TitleLine2', desc: 'ch3Desc' },
            { eyebrow: 'ch4Eyebrow', line1: 'ch4TitleLine1', line2: 'ch4TitleLine2', desc: 'ch4Desc' },
          ][idx];

          return (
            <div
              key={idx}
              className="xr-ch"
              data-ch={idx + 1}
              style={{
                position: 'absolute',
                left: 'clamp(16px, 3.5vw, 64px)',
                bottom: 'clamp(72px, 11vh, 120px)',
                maxWidth: 720,
                opacity: isCurrent ? 1 : 0,
                transform: isCurrent ? 'translateY(0px)' : 'translateY(16px)',
                transition: 'opacity 320ms cubic-bezier(0.23, 1, 0.32, 1), transform 380ms cubic-bezier(0.23, 1, 0.32, 1)',
                pointerEvents: isCurrent ? 'auto' : 'none',
                zIndex: 35,
              }}
            >
              <div
                data-text-key={chKey?.eyebrow}
                style={{
                  fontSize: 11,
                  letterSpacing: '.24em',
                  color: '#C3F910',
                  fontWeight: 700,
                  marginBottom: 14,
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {ch[0]}
              </div>

              <div
                style={{
                  fontSize: 'clamp(32px, 4.8vw, 76px)',
                  lineHeight: 1.02,
                  letterSpacing: '-.03em',
                  fontWeight: 800,
                  color: '#FFFFFF',
                  textShadow: '0 8px 30px rgba(0,0,0,0.85)',
                }}
              >
                <span data-text-key={chKey?.line1} style={{ display: 'inline-block' }}>
                  {ch[1]}
                </span>
                <br />
                <span data-text-key={chKey?.line2} style={{ display: 'inline-block' }}>
                  {ch[2]}
                </span>
              </div>

              {ch[3] ? (
                <p
                  data-text-key={chKey?.desc}
                  style={{
                    margin: '20px 0 0',
                    maxWidth: 480,
                    fontSize: 'clamp(14px, 1.2vw, 16.5px)',
                    lineHeight: 1.6,
                    color: '#D1D5DB',
                    textShadow: '0 2px 10px rgba(0,0,0,0.8)',
                  }}
                >
                  {ch[3]}
                </p>
              ) : (
                <div style={{ display: 'flex', gap: 14, marginTop: 28 }}>
                  <button
                    type="button"
                    data-href="/web/contact"
                    data-text-key="cta"
                    onClick={() => {
                      if (document.body.classList.contains('cms-editing')) return;
                      if (onOpenConsultation) {
                        onOpenConsultation();
                      } else {
                        window.location.href = '/web/contact';
                      }
                    }}
                    className="btn btn-solid"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '16px 30px',
                      fontSize: 13.5,
                      textTransform: 'none',
                      letterSpacing: '.06em',
                      border: 0,
                      background: '#C3F910',
                      color: '#05070B',
                      fontWeight: 800,
                      borderRadius: 999,
                      cursor: 'pointer',
                      boxShadow: '0 10px 30px rgba(195, 249, 16, 0.4)',
                      transition: 'transform 160ms cubic-bezier(0.23, 1, 0.32, 1), opacity 160ms ease, box-shadow 160ms ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                      e.currentTarget.style.boxShadow = '0 14px 40px rgba(195, 249, 16, 0.55)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0px) scale(1)';
                      e.currentTarget.style.boxShadow = '0 10px 30px rgba(195, 249, 16, 0.4)';
                    }}
                    onMouseDown={(e) => {
                      e.currentTarget.style.transform = 'scale(0.97)';
                    }}
                    onMouseUp={(e) => {
                      e.currentTarget.style.transform = 'scale(1.02)';
                    }}
                  >
                    <span>{t.cta}</span>
                    <ArrowRight style={{ width: 16, height: 16 }} />
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {/* BOTTOM TIMELINE & STEP SCRUBBER */}
        <div
          style={{
            position: 'absolute',
            left: 'clamp(16px, 3.5vw, 64px)',
            right: 'clamp(16px, 3.5vw, 64px)',
            bottom: 22,
            zIndex: 40,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          {/* Progress track */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: 2,
              background: 'rgba(255, 255, 255, 0.12)',
              borderRadius: 2,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: `${(scrollProgress * 100).toFixed(1)}%`,
                background: '#C3F910',
                boxShadow: '0 0 12px #C3F910',
                transition: 'width 80ms linear',
              }}
            />
          </div>

          {/* Interactive Steps Badges */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: 10,
              letterSpacing: '.18em',
              fontFamily: 'var(--font-mono, monospace)',
            }}
          >
            {t.steps.map((stName, sIdx) => {
              const active = currentStageIdx === sIdx;
              return (
                <button
                  key={sIdx}
                  type="button"
                  data-text-key={`step${sIdx + 1}`}
                  onClick={() => scrollToStage(sIdx)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    padding: '4px 8px',
                    cursor: 'pointer',
                    color: active ? '#C3F910' : '#6B7280',
                    fontWeight: active ? 700 : 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'color 200ms ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!active) e.currentTarget.style.color = '#FFFFFF';
                  }}
                  onMouseLeave={(e) => {
                    if (!active) e.currentTarget.style.color = '#6B7280';
                  }}
                >
                  <span
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: '50%',
                      background: active ? '#C3F910' : 'rgba(255,255,255,0.2)',
                      boxShadow: active ? '0 0 8px #C3F910' : 'none',
                    }}
                  />
                  <span>{stName}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* CMS Optional Overlay Voile */}
        {cms.hasOverlay && (
          <div
            data-cms-bg-overlay
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: cms.overlayColor,
              pointerEvents: 'none',
              zIndex: 15,
            }}
          />
        )}
      </div>
    </div>
  );
};
