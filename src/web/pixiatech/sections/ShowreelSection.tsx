'use client';

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Language } from '../../pixiatech-translations';
import { useCms } from '@/lib/site-web/cms-context';
import { getCmsText, normalizeLang } from '@/lib/site-web/cms-i18n';
import { useSectionStyle } from '../../cms/useSectionStyle';
import { Eye, Grid, Flame, Play, Pause, Volume2, VolumeX, ArrowRight, Sparkles } from 'lucide-react';

interface ShowreelSectionProps {
  lang?: Language;
  onOpenConsultation?: () => void;
}

type InspectorMode = 'realistic' | 'grid' | 'thermal';

export const ShowreelSection: React.FC<ShowreelSectionProps> = ({ lang = 'FR', onOpenConsultation }) => {
  const { pages, currentLang, isEditing } = useCms();
  const cmsData = (pages['home']?.sections?.showreel as Record<string, unknown>) || {};
  const cms = useSectionStyle(cmsData);
  const activeLang = isEditing ? currentLang : normalizeLang(lang);

  const containerRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [scrollProgress, setScrollProgress] = useState(0);
  const [inspectorMode, setInspectorMode] = useState<InspectorMode>('realistic');
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const [cursorInSticky, setCursorInSticky] = useState(false);

  // CMS Internationalized texts
  const t = useMemo(() => {
    return {
      label: getCmsText(cmsData, 'label', activeLang, 'PIXIATECH / SHOWREEL EXPÉRIENCE'),
      scrollHint: getCmsText(
        cmsData,
        'scrollHint',
        activeLang,
        activeLang === 'fr' ? 'FAITES DÉFILER — ZOOM DIRECT DANS L’ÉCRAN' : 'SCROLL TO DIVE DIRECTLY INTO THE SCREEN'
      ),
      eyebrow: getCmsText(
        cmsData,
        'eyebrow',
        activeLang,
        activeLang === 'fr' ? '02 / SHOWREEL — DE LA VILLE AU CŒUR DE L’ÉCRAN' : '02 / SHOWREEL — FROM THE CITY INTO THE SCREEN'
      ),
      head1: getCmsText(
        cmsData,
        'head1',
        activeLang,
        activeLang === 'fr' ? 'AFFICHEZ' : 'SCREEN THE'
      ),
      head2: getCmsText(
        cmsData,
        'head2',
        activeLang,
        activeLang === 'fr' ? "L'IMPOSSIBLE." : 'IMPOSSIBLE.'
      ),
      lede: getCmsText(
        cmsData,
        'lede',
        activeLang,
        activeLang === 'fr'
          ? "Faites défiler — la caméra avance de la skyline métropolitaine jusqu’à pénétrer au cœur même de l’écran LED."
          : 'Scroll down — the camera glides forward from the metropolitan skyline until entering the heart of the LED display.'
      ),
      chapters: [
        [
          getCmsText(cmsData, 'ch1Eyebrow', activeLang, activeLang === 'fr' ? '01 / LA CITÉ' : '01 / THE METROPOLIS'),
          getCmsText(cmsData, 'ch1TitleLine1', activeLang, activeLang === 'fr' ? 'L’Écran au Cœur' : 'The Display at the Heart'),
          getCmsText(cmsData, 'ch1TitleLine2', activeLang, activeLang === 'fr' ? 'de la métropole.' : 'of the metropolis.'),
          getCmsText(
            cmsData,
            'ch1Desc',
            activeLang,
            activeLang === 'fr'
              ? "Parfaitement intégré dans la façade de verre, l'écran monumental PIXIATECH captive l'espace urbain avec une luminosité calibrée de 10,000 nits."
              : 'Seamlessly integrated into the glass architectural facade, PIXIATECH monumental display commands the city space with 10,000 nits calibrated brightness.'
          ),
        ],
        [
          getCmsText(cmsData, 'ch2Eyebrow', activeLang, activeLang === 'fr' ? '02 / L’ATRIUM' : '02 / THE ATRIUM'),
          getCmsText(cmsData, 'ch2TitleLine1', activeLang, activeLang === 'fr' ? 'Intégration Façade' : 'Facade Integration'),
          getCmsText(cmsData, 'ch2TitleLine2', activeLang, activeLang === 'fr' ? '& structure de verre.' : '& glass structure.'),
          getCmsText(
            cmsData,
            'ch2Desc',
            activeLang,
            activeLang === 'fr'
              ? "Usinage millimétrique et dissipation thermique passive zéro bruit. L'écran fait corps avec l'architecture sans altérer la transparence du bâtiment."
              : 'Millimeter engineering and zero-noise passive heat dissipation. The screen becomes one with the architecture.'
          ),
        ],
        [
          getCmsText(cmsData, 'ch3Eyebrow', activeLang, activeLang === 'fr' ? '03 / LE MUR' : '03 / THE WALL'),
          getCmsText(cmsData, 'ch3TitleLine1', activeLang, activeLang === 'fr' ? 'Cabinets 500 × 500 mm' : '500 × 500 mm Cabinets'),
          getCmsText(cmsData, 'ch3TitleLine2', activeLang, activeLang === 'fr' ? 'une surface continue.' : 'one seamless surface.'),
          getCmsText(
            cmsData,
            'ch3Desc',
            activeLang,
            activeLang === 'fr'
              ? "Alliage de magnésium, verrouillage magnétique instantané. Zéro ligne de démarcation entre les dalles, même à bout portant."
              : 'Magnesium alloy, instant magnetic locking. Zero seam lines between panels even at close range.'
          ),
        ],
        [
          getCmsText(cmsData, 'ch4Eyebrow', activeLang, activeLang === 'fr' ? '04 / L’IMMERSION' : '04 / IMMERSION'),
          getCmsText(cmsData, 'ch4TitleLine1', activeLang, activeLang === 'fr' ? 'Au cœur de l’image' : 'Inside the visual'),
          getCmsText(cmsData, 'ch4TitleLine2', activeLang, activeLang === 'fr' ? '& de la technologie.' : '& pure technology.'),
          '',
        ],
      ],
      cta: getCmsText(
        cmsData,
        'cta',
        activeLang,
        activeLang === 'fr' ? 'Lancer un projet sur-mesure →' : 'Start a custom project →'
      ),
      steps: [
        getCmsText(cmsData, 'step1', activeLang, '01. VILLE'),
        getCmsText(cmsData, 'step2', activeLang, '02. FAÇADE'),
        getCmsText(cmsData, 'step3', activeLang, '03. MUR LED'),
        getCmsText(cmsData, 'step4', activeLang, activeLang === 'fr' ? '04. DANS L’ÉCRAN' : '04. INSIDE SCREEN'),
      ],
      hud: [
        getCmsText(cmsData, 'hudDistanceLabel', activeLang, activeLang === 'fr' ? 'DISTANCE CAMÉRA' : 'CAMERA DISTANCE'),
        getCmsText(cmsData, 'hudPixelsLabel', activeLang, activeLang === 'fr' ? 'DÉFINITION ÉCRAN' : 'SCREEN DEFINITION'),
        getCmsText(cmsData, 'hudScaleLabel', activeLang, activeLang === 'fr' ? 'PLAN OPTIQUE' : 'OPTICAL PLANE'),
      ],
      smdPixel: getCmsText(cmsData, 'smdPixelLabel', activeLang, 'DANS L’ÉCRAN'),
      modes: {
        realistic: activeLang === 'fr' ? 'Rendu Réaliste' : 'Realistic View',
        grid: activeLang === 'fr' ? 'Grille Cabinets 500mm' : '500mm Cabinet Grid',
        thermal: activeLang === 'fr' ? 'Luminance & Chaleur' : 'Luminance & Heatmap',
      },
    };
  }, [cmsData, activeLang]);

  // Smooth scroll lerp tracking
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
      curP += (targetP - curP) * 0.12;
      if (Math.abs(targetP - curP) < 0.0004) {
        curP = targetP;
      }
      setScrollProgress(curP);
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

  // Ambient canvas overlay for particles and optical laser lines
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

    const particles = Array.from({ length: 30 }, () => ({
      x: Math.random(),
      y: Math.random(),
      speed: 0.0006 + Math.random() * 0.0014,
      size: 1 + Math.random() * 2,
      opacity: 0.2 + Math.random() * 0.4,
    }));

    let frame = 0;

    const render = () => {
      frame++;
      ctx.clearRect(0, 0, width, height);

      // Light dust particles in cinema atmosphere
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

      // Laser sweep if in grid/optics mode
      if (inspectorMode === 'grid') {
        const sweepY = (frame * 3) % height;
        ctx.fillStyle = 'rgba(195, 249, 16, 0.15)';
        ctx.fillRect(0, sweepY, width, 2);
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animId);
    };
  }, [inspectorMode]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setMousePos({ x, y });
  }, []);

  // Jump directly to any of the 4 zoom stages
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

  // Continuous Zoom Mathematics:
  // Screen center on image: x = 50.0%, y = 38.9%
  // As scrollProgress goes 0 -> 1:
  // scale goes 1.0 -> 5.2
  // We also slightly offset translateY so that as we zoom, the screen moves from 38.9% to true optical center 50%
  const zoomScale = 1.0 + Math.pow(scrollProgress, 1.25) * 4.25; // 1.0 -> 5.25
  const verticalShift = scrollProgress * 11.1; // shifts upward to align screen center

  // Subtle mouse tilt parallax
  const tiltX = (mousePos.x - 0.5) * 12;
  const tiltY = (mousePos.y - 0.5) * 8;

  // Calculate current stage index (0 to 3)
  const currentStageIdx = Math.min(3, Math.max(0, Math.floor(scrollProgress * 3.99)));

  // Telemetry values based on continuous zoom
  const hudDistance =
    scrollProgress < 0.25
      ? Math.round(280 - scrollProgress * 600) + ' m'
      : scrollProgress < 0.6
      ? Math.round(65 - (scrollProgress - 0.25) * 150) + ' m'
      : scrollProgress < 0.85
      ? (5.5 - (scrollProgress - 0.6) * 18).toFixed(1) + ' m'
      : Math.round(150 - (scrollProgress - 0.85) * 900) + ' mm';

  const hudPixels =
    scrollProgress < 0.25
      ? '120 M'
      : scrollProgress < 0.6
      ? '48 M'
      : scrollProgress < 0.85
      ? '8.2 M'
      : '4K UHD (P0.9)';

  const hudScale =
    scrollProgress < 0.25
      ? 'SKYLINE METRO'
      : scrollProgress < 0.6
      ? 'FAÇADE VERRE'
      : scrollProgress < 0.85
      ? 'MUR DE CABINETS'
      : 'DANS L’ÉCRAN';

  const heroOpacity = Math.max(0, 1 - scrollProgress / 0.14);

  // When zoomed deep into the screen (scrollProgress > 0.75), transition into the screen content
  const screenImmersionOpacity = Math.max(0, Math.min(1, (scrollProgress - 0.72) / 0.18));

  return (
    <div
      id="showreel"
      ref={containerRef}
      className="sr-wrap"
      style={{
        position: 'relative',
        backgroundColor: cms.section.backgroundColor ?? '#020306',
        color: '#F5F4F0',
        height: '540vh',
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
          backgroundColor: '#020306',
        }}
      >
        {/* CONTINUOUS CAMERA DOLLY ZOOM CONTAINER */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transformOrigin: '50% 38.9%', // Pinned right at the center of the monumental screen!
            transform: `scale(${zoomScale.toFixed(4)}) translateY(${verticalShift.toFixed(2)}%) translate3d(${tiltX.toFixed(1)}px, ${tiltY.toFixed(1)}px, 0)`,
            willChange: 'transform',
            pointerEvents: 'none',
          }}
        >
          {/* THE PHOTOREALISTIC CITY SCENE (Kept consistently throughout the journey) */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/showreel/flagship-city-facade.jpg"
            alt="PIXIATECH Monumental Architectural LED Screen"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter:
                inspectorMode === 'thermal'
                  ? 'contrast(1.5) saturate(2.2) hue-rotate(190deg)'
                  : inspectorMode === 'grid'
                  ? 'contrast(1.15) brightness(0.95)'
                  : 'contrast(1.05) brightness(0.96)',
              transition: 'filter 300ms ease',
            }}
          />

          {/* DYNAMIC SCREEN CONTENT / VIDEO (Mapped right into the screen coordinate bounding box) */}
          <div
            style={{
              position: 'absolute',
              left: '39.4%',
              top: '24.8%',
              width: '21.2%',
              height: '28.2%',
              overflow: 'hidden',
              borderRadius: 3,
              boxShadow: '0 0 40px rgba(195, 249, 16, 0.4), inset 0 0 20px rgba(0,0,0,0.6)',
              pointerEvents: scrollProgress > 0.65 ? 'auto' : 'none',
            }}
          >
            {/* Real HTML5 Video looping inside the screen */}
            <video
              ref={videoRef}
              src="/youtube-video.mp4"
              autoPlay
              loop
              muted={isMuted}
              playsInline
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: 0.92,
              }}
            />

            {/* Seamless 500x500mm Cabinet Grid Overlay (Revealed when zooming in or in grid mode) */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                opacity:
                  inspectorMode === 'grid'
                    ? 0.75
                    : Math.max(0, Math.min(0.45, (scrollProgress - 0.4) * 0.9)),
                backgroundImage:
                  'linear-gradient(to right, rgba(255,255,255,0.25) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.25) 1px, transparent 1px)',
                backgroundSize: '25% 25%',
                pointerEvents: 'none',
                transition: 'opacity 200ms ease',
              }}
            />

            {/* Scanline Sweep effect */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(195, 249, 16, 0.08) 50%, rgba(255,255,255,0) 100%)',
                backgroundSize: '100% 40px',
                animation: 'xr-blink 2s linear infinite',
                pointerEvents: 'none',
              }}
            />
          </div>

          {/* FINAL DEEP DIVE: MicroLED Diode Micro-Structure (Fades in when deeply inside the screen) */}
          <div
            style={{
              position: 'absolute',
              left: '39.4%',
              top: '24.8%',
              width: '21.2%',
              height: '28.2%',
              opacity: screenImmersionOpacity.toFixed(3),
              pointerEvents: 'none',
              overflow: 'hidden',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/showreel/stage-1-micro-diode.jpg"
              alt="MicroLED Diode Structure"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: `scale(${(1.0 + (scrollProgress - 0.72) * 0.6).toFixed(3)})`,
                filter: 'contrast(1.2) brightness(1.1)',
              }}
            />
          </div>
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

        {/* CINEMATIC EDGE VIGNETTES */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse 95% 85% at 50% 50%, rgba(2, 3, 6, 0.1) 40%, rgba(2, 3, 6, 0.85) 100%)',
            pointerEvents: 'none',
            zIndex: 11,
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(2,3,6,0.92) 0%, rgba(2,3,6,0.1) 22%, rgba(2,3,6,0.1) 68%, rgba(2,3,6,0.95) 100%)',
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
              background: 'rgba(6, 10, 16, 0.8)',
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

          {/* INSPECTOR VIEW MODES */}
          <div
            className="hidden md:flex"
            style={{
              alignItems: 'center',
              gap: 6,
              padding: '4px 6px',
              borderRadius: 999,
              background: 'rgba(6, 10, 16, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              backdropFilter: 'blur(12px)',
            }}
          >
            {(['realistic', 'grid', 'thermal'] as InspectorMode[]).map((mode) => {
              const active = inspectorMode === mode;
              const Icon = mode === 'realistic' ? Eye : mode === 'grid' ? Grid : Flame;
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

          {/* Sound / Video Controls when zoomed in */}
          {scrollProgress > 0.6 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 8px',
                borderRadius: 999,
                background: 'rgba(6, 10, 16, 0.8)',
                border: '1px solid rgba(195, 249, 16, 0.3)',
                backdropFilter: 'blur(12px)',
              }}
            >
              <button
                type="button"
                onClick={() => {
                  if (videoRef.current) {
                    if (isVideoPlaying) {
                      videoRef.current.pause();
                      setIsVideoPlaying(false);
                    } else {
                      videoRef.current.play();
                      setIsVideoPlaying(true);
                    }
                  }
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#C3F910',
                  padding: 4,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {isVideoPlaying ? <Pause style={{ width: 14, height: 14 }} /> : <Play style={{ width: 14, height: 14 }} />}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (videoRef.current) {
                    videoRef.current.muted = !isMuted;
                    setIsMuted(!isMuted);
                  }
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#C3F910',
                  padding: 4,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {isMuted ? <VolumeX style={{ width: 14, height: 14 }} /> : <Volume2 style={{ width: 14, height: 14 }} />}
              </button>
            </div>
          )}

          {/* Scroll Hint */}
          <div
            className="hidden sm:flex"
            style={{
              padding: '6px 14px',
              borderRadius: 999,
              background: 'rgba(6, 10, 16, 0.8)',
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

        {/* RIGHT TELEMETRY HUD (Instrument Cluster) */}
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
              background: 'rgba(6, 10, 16, 0.84)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              backdropFilter: 'blur(16px)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            {/* Metric 1: Distance */}
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
                {hudDistance}
              </div>
            </div>

            {/* Metric 2: Visible Pixels / Resolution */}
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
                {hudPixels}
              </div>
            </div>

            {/* Metric 3: Active Stage */}
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
                {t.hud[2]}
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  letterSpacing: '.08em',
                  color: '#FFFFFF',
                  fontFamily: 'var(--font-mono, monospace)',
                }}
              >
                {hudScale}
              </div>
            </div>

            {/* Specs Line */}
            <div style={{ height: 1, background: 'rgba(255, 255, 255, 0.08)' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <div style={{ fontSize: 9, letterSpacing: '.18em', color: '#6B7280', fontFamily: 'var(--font-mono)' }}>
                  LUMINANCE
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#E5E7EB', marginTop: 2 }}>
                  10,000 nits
                </div>
              </div>
              <div>
                <div style={{ fontSize: 9, letterSpacing: '.18em', color: '#6B7280', fontFamily: 'var(--font-mono)' }}>
                  GENLOCK
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#C3F910', marginTop: 2 }}>
                  7,680 Hz
                </div>
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

        {/* PROGRESSIVE CHAPTER OVERLAYS (One for each zoom level) */}
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
