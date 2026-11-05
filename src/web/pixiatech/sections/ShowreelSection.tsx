'use client';

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Language } from '../../pixiatech-translations';
import { useCms } from '@/lib/site-web/cms-context';
import { getCmsText, normalizeLang } from '@/lib/site-web/cms-i18n';
import { useSectionStyle } from '../../cms/useSectionStyle';
import { Play, Pause, Volume2, VolumeX, ArrowRight } from 'lucide-react';
import {
  CameraKeyframe,
  DEFAULT_KEYFRAMES,
  DEFAULT_SCREEN_COORDS,
  DEFAULT_MASTER_IMAGE,
  evaluateCamera,
  parseKeyframesFromCms,
  parseLedKeyframesFromCms,
  parseLedTriggersFromCms,
  ScreenCoords,
} from './camera-engine';
import { MacroLedScene } from './MacroLedScene';

interface ShowreelSectionProps {
  lang?: Language;
  onOpenConsultation?: () => void;
}

export const ShowreelSection: React.FC<ShowreelSectionProps> = ({ lang = 'FR', onOpenConsultation }) => {
  const { pages, currentLang, isEditing } = useCms();
  const cmsData = (pages['home']?.sections?.showreel as Record<string, unknown>) || {};
  const cms = useSectionStyle(cmsData);
  const activeLang = isEditing ? currentLang : normalizeLang(lang);

  const containerRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const video1Ref = useRef<HTMLVideoElement>(null);
  const video2Ref = useRef<HTMLVideoElement>(null);

  const [scrollProgress, setScrollProgress] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });

  // Configurable Video URL from CMS, fallback to /youtube-video.mp4
  const videoSrc = getCmsText(cmsData, 'videoUrl', activeLang, '/youtube-video.mp4');

  // Master Image unique haute résolution
  const masterImageSrc =
    (cmsData['masterImageSrc'] as string | undefined) ||
    (cmsData['image1Src'] as string | undefined) ||
    DEFAULT_MASTER_IMAGE;

  // Image personnalisée pour la structure LED (optionnelle, défaut: MacroLedScene procédurale)
  const ledCustomImageSrc = (cmsData['ledCustomImageSrc'] as string | undefined) || '';

  // Contour personnalisé de l'écran vidéo
  const showVideoOutline = cmsData['showVideoOutline'] !== false && cmsData['showVideoOutline'] !== 'false';
  const videoOutlineColor = (cmsData['videoOutlineColor'] as string | undefined) || '#000000';

  // Cadrage unique de l'écran vidéo calé sur l'image master
  const screen: ScreenCoords = useMemo(() => ({
    left: parseFloat(String(cmsData['videoScreenLeft'] ?? cmsData['screen1Left'] ?? DEFAULT_SCREEN_COORDS.left)),
    top: parseFloat(String(cmsData['videoScreenTop'] ?? cmsData['screen1Top'] ?? DEFAULT_SCREEN_COORDS.top)),
    width: parseFloat(String(cmsData['videoScreenWidth'] ?? cmsData['screen1Width'] ?? DEFAULT_SCREEN_COORDS.width)),
    height: parseFloat(String(cmsData['videoScreenHeight'] ?? cmsData['screen1Height'] ?? DEFAULT_SCREEN_COORDS.height)),
  }), [cmsData]);

  // Images clés (Keyframes) de la caméra virtuelle principale
  const keyframes = useMemo(
    () => parseKeyframesFromCms(cmsData['cameraKeyframes']),
    [cmsData]
  );

  // Images clés et déclencheurs de Structure LED (animation secondaire indépendante)
  const ledKeyframes = useMemo(
    () => parseLedKeyframesFromCms(cmsData['ledKeyframes']),
    [cmsData]
  );

  const ledTriggers = useMemo(
    () => parseLedTriggersFromCms(cmsData['ledTriggers']),
    [cmsData]
  );

  // Option ON/OFF : afficher ou masquer les LED générées par le code (superposition procédurale)
  const showCodeLeds = cmsData['showCodeLeds'] !== false && cmsData['showCodeLeds'] !== 'false';

  // ── Interrupteurs CMS persistants ──────────────────────────────────────────
  const animationEnabled =
    cmsData['animationEnabled'] !== false && cmsData['animationEnabled'] !== 'false';
  const imagesEnabled =
    cmsData['imagesEnabled'] !== false && cmsData['imagesEnabled'] !== 'false';

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

  // Preload single master high-res image
  useEffect(() => {
    if (masterImageSrc) {
      const img = new Image();
      img.src = masterImageSrc;
    }
  }, [masterImageSrc]);

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
    const stageFractions = [0.02, 0.32, 0.58, 0.88];
    const targetY = containerTop + (stageFractions[stageIdx] || 0) * totalH;
    window.scrollTo({ top: targetY, behavior: 'smooth' });
  };

  // Subtle mouse tilt parallax (hardware accelerated)
  const tiltX = (mousePos.x - 0.5) * 8;
  const tiltY = (mousePos.y - 0.5) * 6;

  // Chapter index based on calibrated milestones
  const currentStageIdx =
    scrollProgress < 0.25 ? 0 : scrollProgress < 0.50 ? 1 : scrollProgress < 0.74 ? 2 : 3;

    // Telemetry values updated continuously (calibrated to IMAGE 2 at Étape C)
  const hudDistance =
    scrollProgress < 0.25
      ? Math.round(520 - (scrollProgress / 0.25) * 440) + ' m'
      : scrollProgress < 0.50
      ? Math.round(80 - ((scrollProgress - 0.25) / 0.25) * 75) + ' m'
      : scrollProgress < 0.70
      ? (5.5 - ((scrollProgress - 0.50) / 0.20) * 4.3).toFixed(1) + ' m'
      : scrollProgress < 0.88
      ? '239 mm'
      : (20 - ((scrollProgress - 0.88) / 0.12) * 19.1).toFixed(1) + ' mm';

  const hudPixels =
    scrollProgress < 0.25
      ? '120 M'
      : scrollProgress < 0.50
      ? '48 M'
      : scrollProgress < 0.70
      ? 'Grille 32 Modules (P0.9)'
      : scrollProgress < 0.88
      ? '3 Diodes RGB (P0.9)'
      : 'Diode P0.9 (Or / Saphir)';

  const hudScale =
    scrollProgress < 0.25
      ? 'VUE LOINTAINE'
      : scrollProgress < 0.50
      ? 'FAÇADE SIÈGE'
      : scrollProgress < 0.70
      ? 'TRAME STRUCTURELLE'
      : scrollProgress < 0.88
      ? 'AU CŒUR DES LEDS'
      : 'ÉMETTEURS MICRO-LED';

  const heroOpacity = Math.max(0, 1 - scrollProgress / 0.16);

  // Cabinet seams grid visibility on screen as camera approaches
  const cabinetLinesOpacity = Math.max(0, Math.min(0.65, (scrollProgress - 0.46) * 3.2));

  // Moteur de Caméra Virtuelle à Keyframes interpolé sur le défilement
  const camera = useMemo(
    () => evaluateCamera(keyframes, scrollProgress),
    [keyframes, scrollProgress]
  );

  // Déclencheur Structure LED actif sur la timeline globale
  const activeLedTrigger = useMemo(() => {
    if (!ledTriggers || ledTriggers.length === 0) return null;
    const sorted = [...ledTriggers].sort((a, b) => a.time - b.time);
    const fired = sorted.filter((t) => t.time <= scrollProgress);
    return fired.length > 0 ? fired[fired.length - 1] : null;
  }, [ledTriggers, scrollProgress]);

  // Progression de l'animation propre de Structure LED (de 0.00 à 1.00)
  const ledProgress = useMemo(() => {
    if (!activeLedTrigger) return 0;
    const span = 1.0 - activeLedTrigger.time;
    if (span <= 0.001) return 1;
    return Math.max(0, Math.min(1, (scrollProgress - activeLedTrigger.time) / span));
  }, [activeLedTrigger, scrollProgress]);

  // Caméra dédiée Structure LED interpolée sur sa propre progression
  const ledCamera = useMemo(
    () => evaluateCamera(ledKeyframes, ledProgress),
    [ledKeyframes, ledProgress]
  );

  // Opacité d'apparition de Structure LED à partir du déclencheur
  const ledOpacity = activeLedTrigger
    ? Math.min(1, (scrollProgress - activeLedTrigger.time) / 0.04)
    : 0;

  // Fondu de sortie de la vidéo lorsque la Structure LED prend le relais
  const videoFade = activeLedTrigger
    ? Math.max(0, 1 - (scrollProgress - activeLedTrigger.time) / 0.06)
    : 1;

  const camZoom = animationEnabled ? camera.zoom : 1.0;
  const camX = animationEnabled ? camera.x : 0;
  const camY = animationEnabled ? camera.y : 0;
  const camOriginX = camera.originX;
  const camOriginY = camera.originY;

  const curBorderRadius = scrollProgress < 0.25 ? 1 : scrollProgress < 0.50 ? 1.5 : 2;
  // Rendu net et réaliste sans lueur jaune parasite
  const curBoxShadow = 'none';

  return (
    <div
      id="showreel"
      ref={containerRef}
      className="sr-wrap"
      style={{
        position: 'relative',
        backgroundColor: cms.section.backgroundColor ?? '#020408',
        color: '#F5F4F0',
        height: '820vh', // Extended scroll runway for complete 5-stage deep exploration
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
        {/* ASPECT-RATIO-LOCKED 3D STAGE CONTAINER (16:9 = 1.777778)          */}
        {/* Displays the 4 WebP references + continuous video + detailed diode*/}
        {/* ================================================================= */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: 'max(100vw, calc(100vh * 1.777778))',
            height: 'max(100vh, calc(100vw / 1.777778))',
            transform: `translate(-50%, -50%) translate3d(${tiltX.toFixed(1)}px, ${tiltY.toFixed(1)}px, 0)`,
            filter: undefined,
            pointerEvents: 'none',
            zIndex: 2,
          }}
        >
          {/* SCÈNE DU MONDE VIRTUEL TRANSFORMÉE PAR LA CAMÉRA (ZOOM & PAN CONTINUS) */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              transformOrigin: `${camOriginX.toFixed(2)}% ${camOriginY.toFixed(2)}%`,
              transform: `translate3d(${camX.toFixed(2)}%, ${camY.toFixed(2)}%, 0) scale(${camZoom.toFixed(4)})`,
              willChange: 'transform',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
            }}
          >
            {/* 1 SEULE IMAGE HAUTE RÉSOLUTION (MASTER IMAGE) */}
            {imagesEnabled && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: '#000000',
                  zIndex: 1,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={masterImageSrc}
                  alt="PIXIATECH Skyline & Écran Architectural"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                    backgroundColor: '#000000',
                  }}
                />
              </div>
            )}

            {/* SURFACE VIDÉO ANCRÉE PHYSIQUEMENT DANS LA SCÈNE (RESTE ACTIVE JUSQU'À LA FIN) */}
            <div
              style={{
                position: 'absolute',
                left: `${screen.left}%`,
                top: `${screen.top}%`,
                width: `${screen.width}%`,
                height: `${screen.height}%`,
                overflow: 'hidden',
                borderRadius: curBorderRadius,
                boxShadow: curBoxShadow,
                outline: showVideoOutline ? `2px solid ${videoOutlineColor}` : 'none',
                outlineOffset: -1,
                boxSizing: 'border-box',
                zIndex: 2,
                pointerEvents: scrollProgress > 0.45 && scrollProgress < 0.85 ? 'auto' : 'none',
                backgroundColor: '#000000',
              }}
            >
                {/* Vidéo de l'écran (visible à distance et en approche) */}
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
                    display: 'block',
                    backgroundColor: '#000000',
                    opacity: videoFade,
                    transition: 'opacity 150ms ease',
                  }}
                />

                {/* Trame des cabinets 500mm */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    opacity: cabinetLinesOpacity.toFixed(3),
                    backgroundImage:
                      'linear-gradient(to right, rgba(0,0,0,0.7) 1.5px, transparent 1.5px), linear-gradient(to bottom, rgba(0,0,0,0.7) 1.5px, transparent 1.5px)',
                    backgroundSize: '16.66% 33.33%',
                    pointerEvents: 'none',
                    transition: 'opacity 200ms ease',
                  }}
                />

                {/* STRUCTURE LED : Animée indépendamment via ses propres keyframes dès le déclencheur */}
                {showCodeLeds && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      opacity: ledOpacity,
                      pointerEvents: 'none',
                      zIndex: 3,
                      transition: 'opacity 150ms ease',
                      transform: `translate3d(${ledCamera.x.toFixed(2)}%, ${ledCamera.y.toFixed(2)}%, 0) scale(${ledCamera.zoom.toFixed(4)})`,
                      transformOrigin: `${ledCamera.originX.toFixed(2)}% ${ledCamera.originY.toFixed(2)}%`,
                      willChange: 'transform, opacity',
                    }}
                  >
                    {ledCustomImageSrc ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={ledCustomImageSrc}
                        alt="Structure LED PIXIATECH"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block',
                        }}
                      />
                    ) : (
                      <MacroLedScene
                        opacity={1}
                        showCabinetGrid={ledProgress > 0.15}
                        style={{
                          width: '100%',
                          height: '100%',
                        }}
                      />
                    )}
                  </div>
                )}
              </div>
          </div>
        </div>

        {/* CINEMATIC EDGE VIGNETTES (S'estompe dès le zoom pour garder l'image nette et pure comme dans le studio) */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse 95% 85% at 50% 50%, rgba(2, 4, 8, 0.06) 40%, rgba(2, 4, 8, 0.88) 100%)',
            pointerEvents: 'none',
            zIndex: 11,
            opacity: Math.max(0, 1 - scrollProgress * 3.5),
            transition: 'opacity 200ms ease',
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
            opacity: Math.max(0, 1 - scrollProgress * 3.5),
            transition: 'opacity 200ms ease',
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
                background: 'var(--accent, #C3F910)',
                boxShadow: '0 0 10px var(--accent, #C3F910)',
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

          {/* Video Controls & Indicator */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                borderRadius: 999,
                background: 'rgba(6, 10, 16, 0.8)',
                border: '1px solid rgba(var(--accent-rgb, 195, 249, 16), 0.35)',
                backdropFilter: 'blur(12px)',
              }}
            >
              <button
                type="button"
                title={isVideoPlaying ? 'Pause vidéo' : 'Lecture vidéo'}
                onClick={() => {
                  const next = !isVideoPlaying;
                  setIsVideoPlaying(next);
                  [videoRef, video1Ref, video2Ref].forEach((r) => {
                    if (r.current) {
                      if (next) r.current.play().catch(() => {});
                      else r.current.pause();
                    }
                  });
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--accent, #C3F910)',
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
                  [videoRef, video1Ref, video2Ref].forEach((r) => {
                    if (r.current) r.current.muted = !isMuted;
                  });
                  setIsMuted(!isMuted);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--accent, #C3F910)',
                  padding: 4,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {isMuted ? <VolumeX style={{ width: 13, height: 13 }} /> : <Volume2 style={{ width: 13, height: 13 }} />}
              </button>
            </div>

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
                  color: 'var(--accent, #C3F910)',
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
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent, #C3F910)', marginTop: 2 }}>
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
              color: 'var(--accent, #C3F910)',
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
                  color: 'var(--accent, #C3F910)',
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
                      background: 'var(--accent, #C3F910)',
                      color: '#05070B',
                      fontWeight: 800,
                      borderRadius: 999,
                      cursor: 'pointer',
                      boxShadow: '0 10px 30px rgba(var(--accent-rgb, 195, 249, 16), 0.4)',
                      transition: 'transform 160ms cubic-bezier(0.23, 1, 0.32, 1), opacity 160ms ease, box-shadow 160ms ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                      e.currentTarget.style.boxShadow = '0 14px 40px rgba(var(--accent-rgb, 195, 249, 16), 0.55)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0px) scale(1)';
                      e.currentTarget.style.boxShadow = '0 10px 30px rgba(var(--accent-rgb, 195, 249, 16), 0.4)';
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
                background: 'var(--accent, #C3F910)',
                boxShadow: '0 0 12px var(--accent, #C3F910)',
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
                    color: active ? 'var(--accent, #C3F910)' : '#6B7280',
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
                      background: active ? 'var(--accent, #C3F910)' : 'rgba(255,255,255,0.2)',
                      boxShadow: active ? '0 0 8px var(--accent, #C3F910)' : 'none',
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
