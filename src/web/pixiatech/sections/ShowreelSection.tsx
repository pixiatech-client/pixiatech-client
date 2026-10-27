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
  const video1Ref = useRef<HTMLVideoElement>(null);
  const video2Ref = useRef<HTMLVideoElement>(null);

  const [scrollProgress, setScrollProgress] = useState(0);
  const [inspectorMode, setInspectorMode] = useState<InspectorMode>('realistic');
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });

  // Configurable Video URL from CMS, fallback to /youtube-video.mp4
  const videoSrc = getCmsText(cmsData, 'videoUrl', activeLang, '/youtube-video.mp4');

  // Configurable images from CMS (fallback to hardcoded WebP assets)
  const img1Src = (cmsData['image1Src'] as string | undefined) || '/assets/showreel/ref-1-city-far.webp';
  const img2Src = (cmsData['image2Src'] as string | undefined) || '/assets/showreel/ref-2-city-mid.webp';
  const img3Src = (cmsData['image3Src'] as string | undefined) || '/assets/showreel/ref-3-facade-screen.webp';
  const img4Src = (cmsData['image4Src'] as string | undefined) || '/assets/showreel/ref-4-led-macro.webp';

  // Configurable image adjustments (position X/Y, scale, width, height)
  const img1PosX = parseFloat((cmsData['img1PosX'] as string | undefined) || '0');
  const img1PosY = parseFloat((cmsData['img1PosY'] as string | undefined) || '0');
  const img1Scale = parseFloat((cmsData['img1Scale'] as string | undefined) || '1');
  const img1Width = parseFloat((cmsData['img1Width'] as string | undefined) || '100');
  const img1Height = parseFloat((cmsData['img1Height'] as string | undefined) || '100');

  const img2PosX = parseFloat((cmsData['img2PosX'] as string | undefined) || '0');
  const img2PosY = parseFloat((cmsData['img2PosY'] as string | undefined) || '0');
  const img2Scale = parseFloat((cmsData['img2Scale'] as string | undefined) || '1');
  const img2Width = parseFloat((cmsData['img2Width'] as string | undefined) || '100');
  const img2Height = parseFloat((cmsData['img2Height'] as string | undefined) || '100');

  const img3PosX = parseFloat((cmsData['img3PosX'] as string | undefined) || '0');
  const img3PosY = parseFloat((cmsData['img3PosY'] as string | undefined) || '0');
  const img3Scale = parseFloat((cmsData['img3Scale'] as string | undefined) || '1');
  const img3Width = parseFloat((cmsData['img3Width'] as string | undefined) || '100');
  const img3Height = parseFloat((cmsData['img3Height'] as string | undefined) || '100');

  const img4PosX = parseFloat((cmsData['img4PosX'] as string | undefined) || '0');
  const img4PosY = parseFloat((cmsData['img4PosY'] as string | undefined) || '0');
  const img4Scale = parseFloat((cmsData['img4Scale'] as string | undefined) || '1');
  const img4Width = parseFloat((cmsData['img4Width'] as string | undefined) || '100');
  const img4Height = parseFloat((cmsData['img4Height'] as string | undefined) || '100');

  // Configurable screen position on each image layer (percentage values, fallback to current hardcoded)
  const screen1 = {
    left: parseFloat((cmsData['screen1Left'] as string | undefined) || '43.66'),
    top: parseFloat((cmsData['screen1Top'] as string | undefined) || '54.52'),
    width: parseFloat((cmsData['screen1Width'] as string | undefined) || '12.68'),
    height: parseFloat((cmsData['screen1Height'] as string | undefined) || '10.84'),
  };
  const screen2 = {
    left: parseFloat((cmsData['screen2Left'] as string | undefined) || '34.63'),
    top: parseFloat((cmsData['screen2Top'] as string | undefined) || '34.01'),
    width: parseFloat((cmsData['screen2Width'] as string | undefined) || '30.50'),
    height: parseFloat((cmsData['screen2Height'] as string | undefined) || '25.19'),
  };
  const screen3 = {
    left: parseFloat((cmsData['screen3Left'] as string | undefined) || '24.76'),
    top: parseFloat((cmsData['screen3Top'] as string | undefined) || '15.41'),
    width: parseFloat((cmsData['screen3Width'] as string | undefined) || '50.36'),
    height: parseFloat((cmsData['screen3Height'] as string | undefined) || '40.70'),
  };

  // Synchronize frame playback across all video screen instances
  useEffect(() => {
    const master = videoRef.current;
    if (!master) return;
    const syncTime = () => {
      const cur = master.currentTime;
      if (video1Ref.current && Math.abs(video1Ref.current.currentTime - cur) > 0.1) {
        video1Ref.current.currentTime = cur;
      }
      if (video2Ref.current && Math.abs(video2Ref.current.currentTime - cur) > 0.1) {
        video2Ref.current.currentTime = cur;
      }
    };
    master.addEventListener('timeupdate', syncTime);
    return () => {
      master.removeEventListener('timeupdate', syncTime);
    };
  }, []);

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

  // Preload all 4 reference zoom images (CMS-configurable, fallback WebP)
  useEffect(() => {
    const imagesToPreload = [
      img1Src,
      img2Src,
      img3Src,
      img4Src,
      '/assets/showreel/stage-1-micro-diode.jpg',
    ];
    imagesToPreload.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, [img1Src, img2Src, img3Src, img4Src]);

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

  // Telemetry values updated continuously
  const hudDistance =
    scrollProgress < 0.25
      ? Math.round(520 - (scrollProgress / 0.25) * 440) + ' m'
      : scrollProgress < 0.50
      ? Math.round(80 - ((scrollProgress - 0.25) / 0.25) * 75) + ' m'
      : scrollProgress < 0.72
      ? (5.0 - ((scrollProgress - 0.50) / 0.22) * 4.6).toFixed(1) + ' m'
      : scrollProgress < 0.86
      ? Math.round(400 - ((scrollProgress - 0.72) / 0.14) * 380) + ' mm'
      : (20 - ((scrollProgress - 0.86) / 0.14) * 19.1).toFixed(1) + ' mm';

  const hudPixels =
    scrollProgress < 0.25
      ? '120 M'
      : scrollProgress < 0.50
      ? '48 M'
      : scrollProgress < 0.72
      ? '4K Ultra-Black'
      : scrollProgress < 0.86
      ? 'Matrice Diodes RGB'
      : 'P0.9 (Or / Saphir)';

  const hudScale =
    scrollProgress < 0.25
      ? 'VUE LOINTAINE'
      : scrollProgress < 0.50
      ? 'FAÇADE SIÈGE'
      : scrollProgress < 0.72
      ? 'ÉCRAN GÉANT'
      : scrollProgress < 0.86
      ? 'MACRO DIODES'
      : 'SCHÉMA NANOMÉTRIQUE';

  const heroOpacity = Math.max(0, 1 - scrollProgress / 0.16);

  // =========================================================================
  // 5-STAGE CINEMATIC PROGRESSION:
  // 1. Ville lointaine (REF-1 WebP) with active video in distant screen
  // 2. Vue intermédiaire plaza (REF-2 WebP) with active video in facade screen
  // 3. Façade rapprochée & écran géant (REF-3 WebP) with full-scale active video
  // 4. Macro des LED RGB (REF-4 WebP) with video luminance behind diodes
  // 5. Plongée supplémentaire au cœur de la diode : schéma nanométrique vectoriel
  //    (or, cavités biseautées, diodes RGB) + micro-structure saphir/or
  // =========================================================================

  // Crossfade opacities with ultra-smooth transition windows
  const op1 = Math.max(0, Math.min(1, 1 - (scrollProgress - 0.21) / 0.07));
  const op2 = Math.min(
    Math.max(0, Math.min(1, (scrollProgress - 0.21) / 0.07)),
    Math.max(0, Math.min(1, 1 - (scrollProgress - 0.46) / 0.07))
  );
  // Layer 3 (Facade Screen): active from 0.46, stays visible under Layer 4 so the video illuminates micro-LEDs until Layer 5 reveals
  const op3 = Math.min(
    Math.max(0, Math.min(1, (scrollProgress - 0.46) / 0.07)),
    Math.max(0, Math.min(1, 1 - (scrollProgress - 0.85) / 0.08))
  );
  // Layer 4 (Macro LED photo): active from 0.70 to 0.92, blends on top of the zoomed screen video
  const op4 = Math.min(
    Math.max(0, Math.min(1, (scrollProgress - 0.70) / 0.06)),
    Math.max(0, Math.min(1, 1 - (scrollProgress - 0.86) / 0.08))
  );
  // Layer 5 (Detailed Diode Schematic): reveals from 0.85 to 1.00
  const op5 = Math.max(0, Math.min(1, (scrollProgress - 0.85) / 0.08));

  // CMS-configurable camera / scale settings with hardcoded fallbacks
  const l1ScaleMax = parseFloat((cmsData['l1ScaleMax'] as string | undefined) || '1.39');
  const l1OriginX = parseFloat((cmsData['l1OriginX'] as string | undefined) || '49.97');
  const l1OriginY = parseFloat((cmsData['l1OriginY'] as string | undefined) || '59.88');
  const l1XShift = parseFloat((cmsData['l1XShift'] as string | undefined) || '0');
  const l1YShift = parseFloat((cmsData['l1YShift'] as string | undefined) || '14.1');
  const l1CamPosX = parseFloat((cmsData['l1CamPosX'] as string | undefined) || '0');
  const l1CamPosY = parseFloat((cmsData['l1CamPosY'] as string | undefined) || '0');

  const l2ScaleMax = parseFloat((cmsData['l2ScaleMax'] as string | undefined) || '0.66');
  const l2OriginX = parseFloat((cmsData['l2OriginX'] as string | undefined) || '49.85');
  const l2OriginY = parseFloat((cmsData['l2OriginY'] as string | undefined) || '46.55');
  const l2XShift = parseFloat((cmsData['l2XShift'] as string | undefined) || '0');
  const l2YShift = parseFloat((cmsData['l2YShift'] as string | undefined) || '10.0');
  const l2CamPosX = parseFloat((cmsData['l2CamPosX'] as string | undefined) || '0');
  const l2CamPosY = parseFloat((cmsData['l2CamPosY'] as string | undefined) || '0');

  const l3ScaleMax = parseFloat((cmsData['l3ScaleMax'] as string | undefined) || '1.65');
  const l3OriginX = parseFloat((cmsData['l3OriginX'] as string | undefined) || '49.94');
  const l3OriginY = parseFloat((cmsData['l3OriginY'] as string | undefined) || '35.76');
  const l3XShift = parseFloat((cmsData['l3XShift'] as string | undefined) || '0');
  const l3YShift = parseFloat((cmsData['l3YShift'] as string | undefined) || '0');
  const l3CamPosX = parseFloat((cmsData['l3CamPosX'] as string | undefined) || '0');
  const l3CamPosY = parseFloat((cmsData['l3CamPosY'] as string | undefined) || '0');

  const l4ScaleMax = parseFloat((cmsData['l4ScaleMax'] as string | undefined) || '1.35');
  const l4OriginX = parseFloat((cmsData['l4OriginX'] as string | undefined) || '50.0');
  const l4OriginY = parseFloat((cmsData['l4OriginY'] as string | undefined) || '50.0');
  const l4XShift = parseFloat((cmsData['l4XShift'] as string | undefined) || '0');
  const l4YShift = parseFloat((cmsData['l4YShift'] as string | undefined) || '0');
  const l4CamPosX = parseFloat((cmsData['l4CamPosX'] as string | undefined) || '0');
  const l4CamPosY = parseFloat((cmsData['l4CamPosY'] as string | undefined) || '0');

  // Layer 1 scale & camera travel
  const p1 = Math.min(1, scrollProgress / 0.25);
  const scale1 = 1.0 + p1 * l1ScaleMax;
  const xShift1 = l1CamPosX + p1 * l1XShift;
  const yShift1 = l1CamPosY - p1 * l1YShift;

  // Layer 2 scale & camera travel
  const p2 = Math.max(0, Math.min(1, (scrollProgress - 0.25) / 0.25));
  const scale2 = 1.0 + p2 * l2ScaleMax;
  const xShift2 = l2CamPosX + p2 * l2XShift;
  const yShift2 = l2CamPosY - p2 * l2YShift;

  // Layer 3 scale & camera travel: zooms from 1.0 (facade view) to 2.65 (filling viewport with screen) and deeper into pixels
  const p3 = Math.max(0, Math.min(1, (scrollProgress - 0.50) / 0.22));
  const p3Deep = Math.max(0, Math.min(1, (scrollProgress - 0.72) / 0.13));
  const scale3 = 1.0 + p3 * l3ScaleMax + p3Deep * 0.70;
  const xShift3 = l3CamPosX + p3 * l3XShift;
  const yShift3 = l3CamPosY - p3 * l3YShift;

  // Layer 4 (Macro LED) scale & camera travel
  const p4 = Math.max(0, Math.min(1, (scrollProgress - 0.72) / 0.28));
  const scale4 = 1.0 + p4 * l4ScaleMax;
  const xShift4 = l4CamPosX + p4 * l4XShift;
  const yShift4 = l4CamPosY - p4 * l4YShift;

  // Layer 5 (Detailed Diode Schematic) zoom
  const p5 = Math.max(0, Math.min(1, (scrollProgress - 0.85) / 0.15));
  const scale5 = 1.0 + p5 * 0.45;

  // Momentary subtle motion blur during transitions (peaks at 1.8px strictly during crossfades, 0px otherwise)
  const blurT1 = Math.max(0, 1 - Math.abs(scrollProgress - 0.25) / 0.035);
  const blurT2 = Math.max(0, 1 - Math.abs(scrollProgress - 0.50) / 0.035);
  const blurT3 = Math.max(0, 1 - Math.abs(scrollProgress - 0.72) / 0.035);
  const motionBlurPx = Math.max(blurT1, blurT2, blurT3) * 1.8;

  // Cabinet seams grid visibility on screen as camera approaches
  const cabinetLinesOpacity = Math.max(0, Math.min(0.65, (scrollProgress - 0.46) * 3.2));

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
            filter: motionBlurPx > 0.05 ? `blur(${motionBlurPx.toFixed(1)}px)` : undefined,
            willChange: 'transform, filter',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            pointerEvents: 'none',
            zIndex: 2,
          }}
        >
          {/* LAYER 1: REF-1 (City Skyline Far) */}
          {op1 > 0.001 && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                opacity: op1.toFixed(3),
                transformOrigin: `${l1OriginX}% ${l1OriginY}%`,
                transform: `translate3d(${xShift1.toFixed(2)}%, ${yShift1.toFixed(2)}%, 0) scale(${scale1.toFixed(3)})`,
                willChange: 'transform, opacity',
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                zIndex: 1,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img1Src}
                alt="PIXIATECH Skyline & Écran Architectural"
                style={{
                  width: `${img1Width}%`,
                  height: `${img1Height}%`,
                  objectFit: 'cover',
                  display: 'block',
                  backgroundColor: '#000000',
                  transform: `translate3d(${img1PosX}%, ${img1PosY}%, 0) scale(${img1Scale})`,
                }}
              />

              {/* VIDEO ANCHORED RIGIDLY TO REF-1's SCREEN FRAME */}
              <div
                style={{
                  position: 'absolute',
                  left: `${screen1.left}%`,
                  top: `${screen1.top}%`,
                  width: `${screen1.width}%`,
                  height: `${screen1.height}%`,
                  overflow: 'hidden',
                  borderRadius: 1,
                  boxShadow: '0 0 15px rgba(195, 249, 16, 0.45)',
                  pointerEvents: 'none',
                }}
              >
                <video
                  ref={video1Ref}
                  src={videoSrc}
                  autoPlay
                  loop
                  muted
                  playsInline
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
              </div>
            </div>
          )}

          {/* LAYER 2: REF-2 (Plaza / Intermediate View) */}
          {op2 > 0.001 && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                opacity: op2.toFixed(3),
                transformOrigin: `${l2OriginX}% ${l2OriginY}%`,
                transform: `translate3d(${xShift2.toFixed(2)}%, ${yShift2.toFixed(2)}%, 0) scale(${scale2.toFixed(3)})`,
                willChange: 'transform, opacity',
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                zIndex: 2,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img2Src}
                alt="PIXIATECH Façade Bâtiment Vue Rapprochée"
                style={{
                  width: `${img2Width}%`,
                  height: `${img2Height}%`,
                  objectFit: 'cover',
                  display: 'block',
                  backgroundColor: '#000000',
                  transform: `translate3d(${img2PosX}%, ${img2PosY}%, 0) scale(${img2Scale})`,
                }}
              />

              {/* VIDEO ANCHORED RIGIDLY TO REF-2's SCREEN FRAME */}
              <div
                style={{
                  position: 'absolute',
                  left: `${screen2.left}%`,
                  top: `${screen2.top}%`,
                  width: `${screen2.width}%`,
                  height: `${screen2.height}%`,
                  overflow: 'hidden',
                  borderRadius: 1.5,
                  boxShadow: '0 0 25px rgba(195, 249, 16, 0.4)',
                  pointerEvents: 'none',
                }}
              >
                <video
                  ref={video2Ref}
                  src={videoSrc}
                  autoPlay
                  loop
                  muted
                  playsInline
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
              </div>
            </div>
          )}

          {/* LAYER 3: REF-3 (Close Façade & Giant Screen) */}
          {op3 > 0.001 && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                opacity: op3.toFixed(3),
                transformOrigin: `${l3OriginX}% ${l3OriginY}%`,
                transform: `translate3d(${xShift3.toFixed(2)}%, ${yShift3.toFixed(2)}%, 0) scale(${scale3.toFixed(3)})`,
                willChange: 'transform, opacity',
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                zIndex: 3,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img3Src}
                alt="PIXIATECH Écran Géant Façade"
                style={{
                  width: `${img3Width}%`,
                  height: `${img3Height}%`,
                  objectFit: 'cover',
                  display: 'block',
                  backgroundColor: '#000000',
                  transform: `translate3d(${img3PosX}%, ${img3PosY}%, 0) scale(${img3Scale})`,
                }}
              />

              {/* VIDEO ANCHORED EXACTLY TO REF-3's SCREEN FRAME (0px DRIFT, 0px GAP) */}
              <div
                style={{
                  position: 'absolute',
                  left: `${screen3.left}%`,
                  top: `${screen3.top}%`,
                  width: `${screen3.width}%`,
                  height: `${screen3.height}%`,
                  overflow: 'hidden',
                  boxShadow:
                    scrollProgress > 0.45 && scrollProgress < 0.72
                      ? '0 0 45px rgba(195, 249, 16, 0.35), inset 0 0 25px rgba(0,0,0,0.6)'
                      : undefined,
                  pointerEvents: scrollProgress > 0.45 ? 'auto' : 'none',
                }}
              >
                {/* Master HTML5 Video */}
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

                {/* FLICKER-FREE INSPECTOR TINT OVERLAYS (Thermal & Grid) */}
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
          )}

          {/* LAYER 4: REF-4 (Physical RGB Micro-LED Macro Matrix) */}
          {op4 > 0.001 && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                opacity: op4.toFixed(3),
                transformOrigin: `${l4OriginX}% ${l4OriginY}%`,
                transform: `translate3d(${xShift4.toFixed(2)}%, ${yShift4.toFixed(2)}%, 0) scale(${scale4.toFixed(3)})`,
                willChange: 'transform, opacity',
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                mixBlendMode: 'screen',
                zIndex: 5,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img4Src}
                alt="PIXIATECH Macro Diode Micro-LED RGB"
                style={{
                  width: `${img4Width}%`,
                  height: `${img4Height}%`,
                  objectFit: 'cover',
                  display: 'block',
                  backgroundColor: '#000000',
                  transform: `translate3d(${img4PosX}%, ${img4PosY}%, 0) scale(${img4Scale})`,
                }}
              />
            </div>
          )}

          {/* LAYER 5: DETAILED DIODE SCHEMATIC & STRUCTURE REVELATION (Deep dive inside the diode) */}
          {op5 > 0.001 && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                opacity: op5.toFixed(3),
                transformOrigin: '50% 50%',
                transform: `scale(${scale5.toFixed(3)})`,
                willChange: 'transform, opacity',
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                zIndex: 6,
                backgroundColor: '#040608',
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

              {/* Real MicroLED Diode Structure Macro Photo Overlay */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  opacity: Math.max(0, Math.min(0.65, (scrollProgress - 0.90) / 0.08)),
                  mixBlendMode: 'screen',
                  pointerEvents: 'none',
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
                    filter: 'contrast(1.2) brightness(1.1)',
                  }}
                />
              </div>

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
          )}
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
                  [videoRef, video1Ref, video2Ref].forEach((r) => {
                    if (r.current) r.current.muted = !isMuted;
                  });
                  setIsMuted(!isMuted);
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
