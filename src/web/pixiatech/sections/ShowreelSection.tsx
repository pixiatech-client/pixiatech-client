'use client';

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Language } from '../../pixiatech-translations';
import { useCms } from '@/lib/site-web/cms-context';
import { getCmsText, normalizeLang } from '@/lib/site-web/cms-i18n';
import { useSectionStyle } from '../../cms/useSectionStyle';
import { Eye, Grid, Flame, Play, Pause, Volume2, VolumeX, ArrowRight } from 'lucide-react';

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

  const [scrollProgress, setScrollProgress] = useState(0);
  const [inspectorMode, setInspectorMode] = useState<InspectorMode>('realistic');
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });

  // Configurable Video URL from CMS, fallback to /youtube-video.mp4
  const videoSrc = getCmsText(cmsData, 'videoUrl', activeLang, '/youtube-video.mp4');

  // CMS Internationalized texts
  const t = useMemo(() => {
    return {
      label: getCmsText(cmsData, 'label', activeLang, 'PIXIATECH / SHOWREEL EXPÉRIENCE'),
      scrollHint: getCmsText(
        cmsData,
        'scrollHint',
        activeLang,
        activeLang === 'fr' ? 'FAITES DÉFILER — DU LOIN AU CŒUR DES LEDS' : 'SCROLL TO DIVE INTO THE LED DIODES'
      ),
      eyebrow: getCmsText(
        cmsData,
        'eyebrow',
        activeLang,
        activeLang === 'fr' ? '02 / SHOWREEL — DU GRAND PAYSAGE AUX DIODES RGB' : '02 / SHOWREEL — FROM SKYLINE TO RGB DIODES'
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
          ? "Faites défiler — la caméra avance de la métropole à des kilomètres jusqu’à plonger au cœur des micro-diodes LED."
          : 'Scroll down — the camera travels from kilometers away across the metropolis into the microscopic LED diodes.'
      ),
      chapters: [
        [
          getCmsText(cmsData, 'ch1Eyebrow', activeLang, activeLang === 'fr' ? '01 / LA MÉTROPOLE' : '01 / THE METROPOLIS'),
          getCmsText(cmsData, 'ch1TitleLine1', activeLang, activeLang === 'fr' ? 'L’Écran à l’Échelle' : 'The Screen Across'),
          getCmsText(cmsData, 'ch1TitleLine2', activeLang, activeLang === 'fr' ? 'de la métropole.' : 'the metropolis.'),
          getCmsText(
            cmsData,
            'ch1Desc',
            activeLang,
            activeLang === 'fr'
              ? "Visible à des kilomètres dans la nuit urbaine, la technologie d'affichage monumental PIXIATECH rayonne avec une luminosité crête de 10,000 nits."
              : 'Visible kilometers away in the urban night, PIXIATECH monumental display technology commands the skyline with 10,000 nits peak brightness.'
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
              ? "Châssis architectural affleurant, usiné au micron près. L'écran fait corps avec l'architecture sans altérer la transparence du bâtiment."
              : 'Flush architectural chassis machined to the micron. The screen fuses with architecture without compromising transparency.'
          ),
        ],
        [
          getCmsText(cmsData, 'ch3Eyebrow', activeLang, activeLang === 'fr' ? '03 / LE MUR DE CABINETS' : '03 / THE CABINET WALL'),
          getCmsText(cmsData, 'ch3TitleLine1', activeLang, activeLang === 'fr' ? 'Matrice de Micro-LEDs' : 'Micro-LED Matrix'),
          getCmsText(cmsData, 'ch3TitleLine2', activeLang, activeLang === 'fr' ? '& trame des sous-pixels.' : '& sub-pixel raster.'),
          getCmsText(
            cmsData,
            'ch3Desc',
            activeLang,
            activeLang === 'fr'
              ? "Approchez-vous du mur : verrous magnétiques d'une planéité submillimétrique et alignement parfait des dizaines de diodes RGB sans coupure."
              : 'Step closer to the wall: submillimeter magnetic alignment and dense RGB diode matrix with zero visible seams.'
          ),
        ],
        [
          getCmsText(cmsData, 'ch4Eyebrow', activeLang, activeLang === 'fr' ? '04 / PLONGÉE DANS LE PIXEL' : '04 / DIVE INTO THE PIXEL'),
          getCmsText(cmsData, 'ch4TitleLine1', activeLang, activeLang === 'fr' ? 'Au cœur de la diode' : 'Inside the diode'),
          getCmsText(cmsData, 'ch4TitleLine2', activeLang, activeLang === 'fr' ? 'MicroLED P0.9.' : 'MicroLED P0.9.'),
          getCmsText(
            cmsData,
            'ch4Desc',
            activeLang,
            activeLang === 'fr'
              ? "Vous entrez dans la matière : diodes microLED liées sur substrat saphir, liaisons or nanométriques, pureté colorimétrique DCI-P3 99.8% et 7,680Hz."
              : 'Enter into the matter: sapphire-bonded microLED diodes, gold wire bonding, 99.8% DCI-P3 color purity and 7,680Hz genlock refresh rate.'
          ),
        ],
      ],
      cta: getCmsText(
        cmsData,
        'cta',
        activeLang,
        activeLang === 'fr' ? 'Lancer un projet sur-mesure →' : 'Start a custom project →'
      ),
      steps: [
        getCmsText(cmsData, 'step1', activeLang, '01. VUE DE LOIN'),
        getCmsText(cmsData, 'step2', activeLang, '02. FAÇADE SIÈGE'),
        getCmsText(cmsData, 'step3', activeLang, '03. TRAME 50+ LEDS'),
        getCmsText(cmsData, 'step4', activeLang, activeLang === 'fr' ? '04. DIODE D’OR P0.9' : '04. GOLD DIODE P0.9'),
      ],
      hud: [
        getCmsText(cmsData, 'hudDistanceLabel', activeLang, activeLang === 'fr' ? 'DISTANCE CAMÉRA' : 'CAMERA DISTANCE'),
        getCmsText(cmsData, 'hudPixelsLabel', activeLang, activeLang === 'fr' ? 'DÉFINITION ÉCRAN' : 'SCREEN DEFINITION'),
        getCmsText(cmsData, 'hudScaleLabel', activeLang, activeLang === 'fr' ? 'PLAN OPTIQUE' : 'OPTICAL PLANE'),
      ],
      smdPixel: getCmsText(cmsData, 'smdPixelLabel', activeLang, 'MICRO-DIODE P0.9'),
      modes: {
        realistic: activeLang === 'fr' ? 'Rendu Réaliste' : 'Realistic View',
        grid: activeLang === 'fr' ? 'Grille Cabinets 500mm' : '500mm Cabinet Grid',
        thermal: activeLang === 'fr' ? 'Luminance & Chaleur' : 'Luminance & Heatmap',
      },
    };
  }, [cmsData, activeLang]);

  // Smooth scroll tracking with hardware-stable lerp
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
      if (Math.abs(targetP - curP) < 0.0003) {
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
    const stageFractions = [0.02, 0.35, 0.68, 0.88];
    const targetY = containerTop + (stageFractions[stageIdx] || 0) * totalH;
    window.scrollTo({ top: targetY, behavior: 'smooth' });
  };

  // =========================================================================
  // CONTINUOUS EXPONENTIAL ZOOM PROFILE (PULLED BACK TO DISTANT VIEW AT START)
  // At scrollProgress = 0: zoomScale = 0.72 (Seen from far away across the plaza!)
  // At scrollProgress = 0.35: zoomScale = 1.25 (Flying into the entrance)
  // At scrollProgress = 0.60: zoomScale = 2.85 (Screen fills viewport)
  // At scrollProgress = 0.75: zoomScale = 5.20 (Dense 60-diode matrix)
  // At scrollProgress = 0.88 -> 0.95: zoomScale = 8.5+ (Deep macro microLED diode photo)
  // =========================================================================
  const zoomScale = 0.72 + Math.pow(scrollProgress, 1.45) * 8.2;
  const verticalShift = scrollProgress * 15.2;

  // Subtle mouse tilt parallax (hardware accelerated)
  const tiltX = (mousePos.x - 0.5) * 8;
  const tiltY = (mousePos.y - 0.5) * 6;

  // Chapter index based on calibrated milestones
  const currentStageIdx =
    scrollProgress < 0.26 ? 0 : scrollProgress < 0.52 ? 1 : scrollProgress < 0.76 ? 2 : 3;

  // Telemetry values updated continuously
  const hudDistance =
    scrollProgress < 0.26
      ? Math.round(520 - (scrollProgress / 0.26) * 440) + ' m'
      : scrollProgress < 0.52
      ? Math.round(80 - ((scrollProgress - 0.26) / 0.26) * 75) + ' m'
      : scrollProgress < 0.76
      ? (5.0 - ((scrollProgress - 0.52) / 0.24) * 4.6).toFixed(1) + ' m'
      : Math.round(400 - ((scrollProgress - 0.76) / 0.24) * 395) + ' mm';

  const hudPixels =
    scrollProgress < 0.26
      ? '120 M'
      : scrollProgress < 0.52
      ? '48 M'
      : scrollProgress < 0.76
      ? '60+ Diodes RGB'
      : 'Diode P0.9 (Or/Saphir)';

  const hudScale =
    scrollProgress < 0.26
      ? 'VUE LOINTAINE'
      : scrollProgress < 0.52
      ? 'FAÇADE SIÈGE'
      : scrollProgress < 0.76
      ? 'TRAME 60+ LEDS'
      : 'DIODE D’OR P0.9';

  const heroOpacity = Math.max(0, 1 - scrollProgress / 0.16);

  // Cabinet seams (500x500mm): visible as we zoom close
  const cabinetLinesOpacity = Math.max(0, Math.min(0.65, (scrollProgress - 0.42) * 2.5));

  // Dense 60+ Diode Matrix Opacity (Step 3A): visible from scroll 0.65 to 0.85
  const denseDiodeGridOpacity = Math.max(0, Math.min(1, (scrollProgress - 0.62) * 3.5));

  // Extreme Macro Diode Photo Opacity (Step 3B): zooms in deeper from scroll 0.82 to 0.95
  const macroDiodePhotoOpacity = Math.max(0, Math.min(1, (scrollProgress - 0.80) / 0.12));

  return (
    <div
      id="showreel"
      ref={containerRef}
      className="sr-wrap"
      style={{
        position: 'relative',
        backgroundColor: cms.section.backgroundColor ?? '#020408',
        color: '#F5F4F0',
        height: '780vh', // Extended scroll runway so user has plenty of time to explore!
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
        style={{
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflow: 'hidden',
          backgroundColor: '#020408',
        }}
      >
        {/* ================================================================= */}
        {/* ASPECT-RATIO-LOCKED 3D STAGE CONTAINER (1376:768 = 1.791666)     */}
        {/* Ensures the image, video, diode matrix, and macro photo are       */}
        {/* 100% locked to the exact sub-pixel with ZERO tearing or float!    */}
        {/* ================================================================= */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: 'max(140vw, calc(140vh * 1.791666))',
            height: 'max(140vh, calc(140vw / 1.791666))',
            transformOrigin: '50.36% 32.94%', // EXACT mathematical center of the physical screen!
            transform: `translate(-50%, -50%) scale(${zoomScale.toFixed(4)}) translateY(${verticalShift.toFixed(2)}%) translate3d(${tiltX.toFixed(1)}px, ${tiltY.toFixed(1)}px, 0)`,
            willChange: 'transform',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            pointerEvents: 'none',
            zIndex: 2,
          }}
        >
          {/* Base Photo: Flagship Headquarters with neutralized dark titanium casing */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/showreel/flagship-city-facade-v2.jpg"
            alt="PIXIATECH Siège Architectural et Écran Géant"
            style={{
              width: '100%',
              height: '100%',
              display: 'block',
              objectFit: 'fill',
            }}
          />

          {/* DYNAMIC SCREEN CONTENT / VIDEO (EXACT RECTANGLE: 32.70%, 13.02%, 35.32%, 39.84%) */}
          <div
            style={{
              position: 'absolute',
              left: '32.70%',
              top: '13.02%',
              width: '35.32%',
              height: '39.84%',
              overflow: 'hidden',
              borderRadius: 2,
              boxShadow: '0 0 35px rgba(195, 249, 16, 0.4), inset 0 0 25px rgba(0,0,0,0.6)',
              pointerEvents: scrollProgress > 0.4 ? 'auto' : 'none',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
            }}
          >
            {/* Real HTML5 Video looping inside the screen (Configurable in CMS or /youtube-video.mp4) */}
            <video
              ref={videoRef}
              src={videoSrc}
              autoPlay
              loop
              muted={isMuted}
              playsInline
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: 0.94,
              }}
            />

            {/* Cabinet Seams (Les traits des dalles 500x500mm — apparaissent lors du rapprochement) */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                opacity: inspectorMode === 'grid' ? 0.8 : cabinetLinesOpacity.toFixed(3),
                backgroundImage:
                  'linear-gradient(to right, rgba(0,0,0,0.7) 1.5px, transparent 1.5px), linear-gradient(to bottom, rgba(0,0,0,0.7) 1.5px, transparent 1.5px)',
                backgroundSize: '16.66% 33.33%', // 6x3 cabinet grid
                pointerEvents: 'none',
                transition: 'opacity 200ms ease',
              }}
            />

            {/* ============================================================= */}
            {/* STEP 3A: DENSE MATRIX OF 60+ COMPACT MICRO-LEDS (Au moins 50+) */}
            {/* 10 columns x 6 rows = 60 distinct MicroLED diodes with RGB     */}
            {/* ============================================================= */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                opacity: denseDiodeGridOpacity.toFixed(3),
                background: '#040609',
                display: 'grid',
                gridTemplateColumns: 'repeat(10, 1fr)',
                gridTemplateRows: 'repeat(6, 1fr)',
                gap: '4px',
                padding: '6px',
                boxSizing: 'border-box',
                pointerEvents: 'none',
                transition: 'opacity 180ms ease',
              }}
            >
              {Array.from({ length: 60 }).map((_, idx) => (
                <div
                  key={idx}
                  style={{
                    background: '#080c14',
                    borderRadius: '2px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: 'inset 0 0 3px rgba(0,0,0,0.9)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-evenly',
                    padding: '2px',
                    position: 'relative',
                  }}
                >
                  {/* Red sub-pixel */}
                  <span
                    style={{
                      width: '26%',
                      height: '76%',
                      borderRadius: '1px',
                      background: 'radial-gradient(circle, #ff4422 0%, #bb1100 100%)',
                      boxShadow: '0 0 4px rgba(255, 50, 20, 0.55)',
                      display: 'block',
                    }}
                  />
                  {/* Green sub-pixel */}
                  <span
                    style={{
                      width: '26%',
                      height: '76%',
                      borderRadius: '1px',
                      background: 'radial-gradient(circle, #33ff66 0%, #00aa22 100%)',
                      boxShadow: '0 0 4px rgba(34, 232, 106, 0.55)',
                      display: 'block',
                    }}
                  />
                  {/* Blue sub-pixel */}
                  <span
                    style={{
                      width: '26%',
                      height: '76%',
                      borderRadius: '1px',
                      background: 'radial-gradient(circle, #3388ff 0%, #0044bb 100%)',
                      boxShadow: '0 0 4px rgba(42, 107, 255, 0.55)',
                      display: 'block',
                    }}
                  />
                  {/* Gold Bond Dot */}
                  <span
                    style={{
                      position: 'absolute',
                      top: 1,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: 1.5,
                      height: 1.5,
                      borderRadius: '50%',
                      background: '#c5a059',
                      display: 'block',
                    }}
                  />
                </div>
              ))}
            </div>

            {/* ============================================================= */}
            {/* STEP 3B: EXTREME MACRO PHOTO (Image #1 avec fils d'or)        */}
            {/* Révélée en zoomant encore plus profondément dans la diode!     */}
            {/* ============================================================= */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                opacity: macroDiodePhotoOpacity.toFixed(3),
                pointerEvents: 'none',
                overflow: 'hidden',
                transition: 'opacity 200ms ease',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/assets/showreel/stage-1-micro-diode.jpg"
                alt="MicroLED Diode Structure Macro"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  filter: 'contrast(1.15) brightness(1.05)',
                  transform: `scale(${(1.0 + (scrollProgress - 0.8) * 0.4).toFixed(3)})`,
                }}
              />
            </div>

            {/* FLICKER-FREE INSPECTOR TINT OVERLAYS (Replaces heavy CSS filter) */}
            {inspectorMode === 'thermal' && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(255, 70, 0, 0.22)',
                  boxShadow: 'inset 0 0 80px rgba(0, 160, 255, 0.35)',
                  pointerEvents: 'none',
                }}
              />
            )}
            {inspectorMode === 'grid' && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(195, 249, 16, 0.08)',
                  pointerEvents: 'none',
                }}
              />
            )}
          </div>
        </div>

        {/* CINEMATIC EDGE VIGNETTES */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse 95% 85% at 50% 50%, rgba(2, 4, 8, 0.06) 40%, rgba(2, 4, 8, 0.88) 100%)',
            pointerEvents: 'none',
            zIndex: 11,
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(2,4,8,0.92) 0%, rgba(2,4,8,0.06) 22%, rgba(2,4,8,0.06) 68%, rgba(2,4,8,0.95) 100%)',
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

          {/* Video Controls & Indicator */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            {scrollProgress > 0.3 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 10px',
                  borderRadius: 999,
                  background: 'rgba(6, 10, 16, 0.8)',
                  border: '1px solid rgba(195, 249, 16, 0.35)',
                  backdropFilter: 'blur(12px)',
                }}
              >
                <button
                  type="button"
                  title={isVideoPlaying ? 'Pause vidéo' : 'Lecture vidéo'}
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
                  {isVideoPlaying ? <Pause style={{ width: 13, height: 13 }} /> : <Play style={{ width: 13, height: 13 }} />}
                </button>

                <button
                  type="button"
                  title={isMuted ? 'Activer le son' : 'Couper le son'}
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
                  {isMuted ? <VolumeX style={{ width: 13, height: 13 }} /> : <Volume2 style={{ width: 13, height: 13 }} />}
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
                  fontSize: 16.5,
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
                  fontSize: 12,
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
