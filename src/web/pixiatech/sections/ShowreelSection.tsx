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
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [scrollProgress, setScrollProgress] = useState(0);
  const [inspectorMode, setInspectorMode] = useState<InspectorMode>('realistic');
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const [cursorInSticky, setCursorInSticky] = useState(false);

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
          getCmsText(cmsData, 'ch3TitleLine1', activeLang, activeLang === 'fr' ? 'Cabinets 500 × 500 mm' : '500 × 500 mm Cabinets'),
          getCmsText(cmsData, 'ch3TitleLine2', activeLang, activeLang === 'fr' ? '& trame des sous-pixels.' : '& sub-pixel raster.'),
          getCmsText(
            cmsData,
            'ch3Desc',
            activeLang,
            activeLang === 'fr'
              ? "Approchez-vous du mur : verrous magnétiques d'une planéité submillimétrique et alignement parfait des sous-pixels RGB sans coupure."
              : 'Step closer to the wall: submillimeter magnetic alignment and continuous RGB sub-pixel raster with zero visible seams.'
          ),
        ],
        [
          getCmsText(cmsData, 'ch4Eyebrow', activeLang, activeLang === 'fr' ? '04 / PLONGÉE DANS LE PIXEL' : '04 / DIVE INTO THE PIXEL'),
          getCmsText(cmsData, 'ch4TitleLine1', activeLang, activeLang === 'fr' ? 'Au cœur des diodes' : 'Inside the diodes'),
          getCmsText(cmsData, 'ch4TitleLine2', activeLang, activeLang === 'fr' ? 'MicroLED P0.9.' : 'MicroLED P0.9.'),
          getCmsText(
            cmsData,
            'ch4Desc',
            activeLang,
            activeLang === 'fr'
              ? "Vous entrez dans la matière : diodes microLED liées sur substrat saphir, pureté colorimétrique DCI-P3 99.8% et rafraîchissement cinéma 7,680Hz."
              : 'Enter into the matter: sapphire-bonded microLED diodes, 99.8% DCI-P3 color purity and 7,680Hz cinema genlock refresh rate.'
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
        getCmsText(cmsData, 'step1', activeLang, '01. VUE LOINTAINE'),
        getCmsText(cmsData, 'step2', activeLang, '02. FAÇADE SIÈGE'),
        getCmsText(cmsData, 'step3', activeLang, '03. TRAME 500MM'),
        getCmsText(cmsData, 'step4', activeLang, activeLang === 'fr' ? '04. DIODES RGB' : '04. RGB DIODES'),
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

  // Smooth scroll tracking
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
      speed: 0.0005 + Math.random() * 0.0012,
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
        const sweepY = (frame * 2.8) % height;
        ctx.fillStyle = 'rgba(195, 249, 16, 0.16)';
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
    const stageFractions = [0.04, 0.35, 0.65, 0.86];
    const targetY = containerTop + (stageFractions[stageIdx] || 0) * totalH;
    window.scrollTo({ top: targetY, behavior: 'smooth' });
  };

  // =========================================================================
  // MULTI-SCALE CAMERA JOURNEY (From kilometers to nanometer micro-diodes)
  // Phase 1 (0.00 -> 0.22): Distant Skyline (5.2 km away)
  // Phase 2 (0.22 -> 0.50): Flight into the Plaza and Building Entrance
  // Phase 3 (0.50 -> 0.75): Zoom to the LED screen (filling viewport) with 500mm cabinet seams
  // Phase 4 (0.75 -> 0.94): Full immersion inside razor-sharp RGB micro-diodes
  // Phase 5 (0.94 -> 1.00): Smooth transition into the next website section
  // =========================================================================

  // Distant skyline fade (Phase 1)
  const distantSkylineOpacity = Math.max(0, Math.min(1, 1 - (scrollProgress - 0.08) / 0.16));

  // Zoom scale on the flagship building:
  // Starts at 0.95 and accelerates smoothly up to 6.8x
  const zoomScale =
    scrollProgress < 0.22
      ? 1.0 + scrollProgress * 0.6
      : 1.13 + Math.pow((scrollProgress - 0.22) / 0.78, 1.4) * 5.6;

  // Shifts vertically from 32.94% to optical center 50%
  const verticalShift = Math.max(0, (scrollProgress - 0.22) / 0.78) * 17.06;

  // Subtle mouse tilt parallax
  const tiltX = (mousePos.x - 0.5) * 8;
  const tiltY = (mousePos.y - 0.5) * 6;

  // Chapter index based on calibrated milestones
  const currentStageIdx =
    scrollProgress < 0.24 ? 0 : scrollProgress < 0.52 ? 1 : scrollProgress < 0.75 ? 2 : 3;

  // Telemetry values updated continuously
  const hudDistance =
    scrollProgress < 0.24
      ? (5.2 - (scrollProgress / 0.24) * 4.9).toFixed(1) + ' km'
      : scrollProgress < 0.52
      ? Math.round(300 - ((scrollProgress - 0.24) / 0.28) * 260) + ' m'
      : scrollProgress < 0.75
      ? (40 - ((scrollProgress - 0.52) / 0.23) * 38).toFixed(1) + ' m'
      : Math.round(500 - ((scrollProgress - 0.75) / 0.25) * 490) + ' mm';

  const hudPixels =
    scrollProgress < 0.24
      ? '120 M'
      : scrollProgress < 0.52
      ? '48 M'
      : scrollProgress < 0.75
      ? '8.2 M (Dalles 500mm)'
      : '3 Diodes RGB (P0.9)';

  const hudScale =
    scrollProgress < 0.24
      ? 'SKYLINE 5.2 KM'
      : scrollProgress < 0.52
      ? 'FAÇADE SIÈGE'
      : scrollProgress < 0.75
      ? 'MUR DE CABINETS'
      : 'AU CŒUR DES LEDS';

  const heroOpacity = Math.max(0, 1 - scrollProgress / 0.16);

  // Cabinet seams (500x500mm grid): visible as we zoom close (0.48 -> 0.76)
  const cabinetLinesOpacity = Math.max(0, Math.min(0.65, (scrollProgress - 0.44) * 2.5));

  // RGB Sub-pixel Diode Raster (fine traits des LEDs): visible as we get very close
  const subpixelRasterOpacity = Math.max(0, Math.min(0.6, (scrollProgress - 0.6) * 3.2));

  // Ultra-Crisp Vector Diode Immersion (Zero Blur!): takes over from 0.74 to 0.95
  const diodeImmersionOpacity = Math.max(0, Math.min(1, (scrollProgress - 0.72) / 0.14));

  return (
    <div
      id="showreel"
      ref={containerRef}
      className="sr-wrap"
      style={{
        position: 'relative',
        backgroundColor: cms.section.backgroundColor ?? '#020306',
        color: '#F5F4F0',
        height: '780vh', // Extended scroll runway so user has plenty of time to explore inside the screen!
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
        {/* ================================================================= */}
        {/* PHASE 1: DISTANT SKYLINE METROPOLIS (Visible from kilometers away) */}
        {/* ================================================================= */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: distantSkylineOpacity.toFixed(3),
            pointerEvents: 'none',
            zIndex: 1,
            transform: `scale(${(1.0 + scrollProgress * 0.35).toFixed(3)}) translate3d(${(tiltX * 0.5).toFixed(1)}px, ${(tiltY * 0.5).toFixed(1)}px, 0)`,
            transition: 'opacity 300ms ease',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/showreel/stage-4-architectural-city.jpg"
            alt="Skyline Métropolitaine PIXIATECH à des kilomètres"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: 'brightness(0.9) contrast(1.1)',
            }}
          />
        </div>

        {/* ================================================================= */}
        {/* PHASE 2 & 3: CONTINUOUS DOLLY ZOOM ON FLAGSHIP BUILDING & SCREEN  */}
        {/* ================================================================= */}
        {/* Aspect-Ratio-Locked Container: EXACTLY 1376 x 768 (1.7916:1)     */}
        {/* Ensures the video and screen casing are locked to the sub-pixel! */}
        {/* ================================================================= */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: 'max(100vw, calc(100vh * 1.791666))',
            height: 'max(100vh, calc(100vw / 1.791666))',
            transformOrigin: '50.36% 32.94%', // EXACT mathematical center of the physical screen!
            transform: `translate(-50%, -50%) scale(${zoomScale.toFixed(4)}) translateY(${verticalShift.toFixed(2)}%) translate3d(${tiltX.toFixed(1)}px, ${tiltY.toFixed(1)}px, 0)`,
            willChange: 'transform',
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
              filter:
                inspectorMode === 'thermal'
                  ? 'contrast(1.5) saturate(2.2) hue-rotate(190deg)'
                  : inspectorMode === 'grid'
                  ? 'contrast(1.15) brightness(0.95)'
                  : 'contrast(1.05) brightness(0.96)',
              transition: 'filter 300ms ease',
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
              boxShadow: '0 0 35px rgba(195, 249, 16, 0.45), inset 0 0 25px rgba(0,0,0,0.6)',
              pointerEvents: scrollProgress > 0.45 ? 'auto' : 'none',
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

            {/* RGB Sub-pixel Diode Raster (Les traits fins des LEDs RGB) */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                opacity: subpixelRasterOpacity.toFixed(3),
                backgroundImage:
                  'repeating-linear-gradient(90deg, rgba(255,50,50,0.35) 0px, rgba(255,50,50,0.35) 1px, rgba(50,255,50,0.35) 1px, rgba(50,255,50,0.35) 2px, rgba(50,120,255,0.35) 2px, rgba(50,120,255,0.35) 3px, transparent 3px, transparent 4px), repeating-linear-gradient(0deg, rgba(0,0,0,0.4) 0px, rgba(0,0,0,0.4) 1px, transparent 1px, transparent 4px)',
                backgroundSize: '4px 4px',
                pointerEvents: 'none',
              }}
            />

            {/* Dynamic Laser Scanline */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(195, 249, 16, 0.1) 50%, rgba(255,255,255,0) 100%)',
                backgroundSize: '100% 40px',
                animation: 'xr-blink 2s linear infinite',
                pointerEvents: 'none',
              }}
            />
          </div>

          {/* =============================================================== */}
          {/* PHASE 4: IMMERSION AU CŒUR DES DIODES LED (100% VECTORIEL NET)  */}
          {/* =============================================================== */}
          <div
            style={{
              position: 'absolute',
              left: '32.70%',
              top: '13.02%',
              width: '35.32%',
              height: '39.84%',
              opacity: diodeImmersionOpacity.toFixed(3),
              pointerEvents: 'none',
              overflow: 'hidden',
              backgroundColor: '#05070B',
              borderRadius: 2,
            }}
          >
            {/* Razor-Sharp MicroLED Diode Cluster (High-Res Procedural Vector SVG) */}
            <svg
              viewBox="0 0 1000 600"
              preserveAspectRatio="xMidYMid slice"
              style={{
                width: '100%',
                height: '100%',
                display: 'block',
              }}
            >
              <defs>
                {/* Red Emitter Gradient */}
                <radialGradient id="redGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="35%" stopColor="#FF3322" />
                  <stop offset="100%" stopColor="#880000" />
                </radialGradient>
                {/* Green Emitter Gradient */}
                <radialGradient id="greenGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="35%" stopColor="#22E86A" />
                  <stop offset="100%" stopColor="#006622" />
                </radialGradient>
                {/* Blue Emitter Gradient */}
                <radialGradient id="blueGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="35%" stopColor="#3388FF" />
                  <stop offset="100%" stopColor="#002288" />
                </radialGradient>
                {/* Outer Diode Ambient Bloom */}
                <filter id="bloomFilter" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="8" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Matte Black Obsidian Substrate */}
              <rect width="1000" height="600" fill="#040608" />

              {/* Gold Circuit Nanometric Traces */}
              <g stroke="#C5A059" strokeWidth="2.5" opacity="0.45" fill="none">
                {/* Bus lines */}
                <line x1="0" y1="150" x2="1000" y2="150" strokeDasharray="12 6" />
                <line x1="0" y1="300" x2="1000" y2="300" strokeDasharray="12 6" />
                <line x1="0" y1="450" x2="1000" y2="450" strokeDasharray="12 6" />
                {/* Traces */}
                <path d="M 120 0 L 120 120 L 160 160 L 160 600" />
                <path d="M 370 0 L 370 270 L 410 310 L 410 600" />
                <path d="M 620 0 L 620 120 L 660 160 L 660 600" />
                <path d="M 870 0 L 870 270 L 910 310 L 910 600" />
              </g>

              {/* Diode Packages Grid (Sharp 4x2 Cluster with RGB sub-pixels) */}
              {[0, 250, 500, 750].map((dx, colIdx) =>
                [60, 260, 460].map((dy, rowIdx) => {
                  const pX = dx + 45;
                  const pY = dy + 20;
                  return (
                    <g key={`${colIdx}-${rowIdx}`} filter="url(#bloomFilter)">
                      {/* Diode Chip Substrate Box */}
                      <rect
                        x={pX}
                        y={pY}
                        width="160"
                        height="120"
                        rx="8"
                        fill="#0A0E14"
                        stroke="#1C2433"
                        strokeWidth="2"
                      />
                      {/* Diode Beveled Inner Cavity */}
                      <rect
                        x={pX + 12}
                        y={pY + 12}
                        width="136"
                        height="96"
                        rx="6"
                        fill="#05070B"
                        stroke="#121822"
                        strokeWidth="1.5"
                      />

                      {/* SUB-PIXEL 1: RED */}
                      <g>
                        <rect
                          x={pX + 24}
                          y={pY + 24}
                          width="26"
                          height="72"
                          rx="5"
                          fill="url(#redGlow)"
                        />
                        <circle cx={pX + 37} cy={pY + 60} r="14" fill="#FF4433" opacity="0.3" />
                      </g>

                      {/* SUB-PIXEL 2: GREEN */}
                      <g>
                        <rect
                          x={pX + 67}
                          y={pY + 24}
                          width="26"
                          height="72"
                          rx="5"
                          fill="url(#greenGlow)"
                        />
                        <circle cx={pX + 80} cy={pY + 60} r="14" fill="#22E86A" opacity="0.3" />
                      </g>

                      {/* SUB-PIXEL 3: BLUE */}
                      <g>
                        <rect
                          x={pX + 110}
                          y={pY + 24}
                          width="26"
                          height="72"
                          rx="5"
                          fill="url(#blueGlow)"
                        />
                        <circle cx={pX + 123} cy={pY + 60} r="14" fill="#3388FF" opacity="0.3" />
                      </g>

                      {/* Gold Wire Bond Dots */}
                      <circle cx={pX + 37} cy={pY + 16} r="2.5" fill="#C5A059" />
                      <circle cx={pX + 80} cy={pY + 16} r="2.5" fill="#C5A059" />
                      <circle cx={pX + 123} cy={pY + 16} r="2.5" fill="#C5A059" />
                    </g>
                  );
                })
              )}
            </svg>

            {/* Ambient Radial Vignette over Diodes */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  'radial-gradient(circle at 50% 50%, rgba(195, 249, 16, 0.15) 0%, rgba(2, 4, 8, 0.75) 85%)',
                mixBlendMode: 'screen',
                pointerEvents: 'none',
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
              'radial-gradient(ellipse 95% 85% at 50% 50%, rgba(2, 3, 6, 0.08) 40%, rgba(2, 3, 6, 0.88) 100%)',
            pointerEvents: 'none',
            zIndex: 11,
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(2,3,6,0.92) 0%, rgba(2,3,6,0.08) 22%, rgba(2,3,6,0.08) 68%, rgba(2,3,6,0.95) 100%)',
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
            {scrollProgress > 0.35 && (
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
                  fontSize: 17,
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
