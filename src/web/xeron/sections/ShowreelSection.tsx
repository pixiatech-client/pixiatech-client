'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Language } from '../../xeron-translations';

interface ShowreelSectionProps {
  lang?: Language;
  onOpenConsultation?: () => void;
}

export const ShowreelSection: React.FC<ShowreelSectionProps> = ({ lang = 'FR', onOpenConsultation }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const t = {
    label: 'PIXIATECH / SHOWREEL',
    scrollHint: lang === 'FR' ? 'FAITES DÉFILER — DU PIXEL À LA VILLE' : 'SCROLL TO PULL BACK — ONE PIXEL TO THE CITY',
    eyebrow: lang === 'FR' ? '02 / SHOWREEL — DU PIXEL À LA VILLE' : '02 / SHOWREEL — ONE PIXEL TO THE CITY',
    head1: lang === 'FR' ? 'AFFICHEZ' : 'SCREEN THE',
    head2: lang === 'FR' ? "L'IMPOSSIBLE." : 'IMPOSSIBLE.',
    lede:
      lang === 'FR'
        ? "Faites défiler — la caméra recule d'un seul pixel LED jusqu'à l'horizon de la métropole."
        : 'Keep scrolling — the camera pulls back from a single LED to the whole city.',
    chapters:
      lang === 'FR'
        ? [
            ['01 / LE MODULE', 'Des milliers de pixels.', 'Un module calibré.', "Chaque LED est mesurée et appairée en laboratoire afin d'assurer une chromaticité et une luminance parfaites d'un bord à l'autre."],
            ['02 / LE MUR', "Les cabinets s'assemblent en", 'une surface continue.', 'Châssis 500 × 500 mm, profondeur 29.5 mm. Aucune limite de largeur ou de hauteur.'],
            ["03 / L'ARCHITECTURE", "L'écran devient", 'la façade.', "Nous n'intégrons pas simplement des écrans dans l'espace : nous faisons des écrans une partie intégrante de l'architecture."],
            ['04 / LA VILLE', 'De la technologie', 'à la skyline métropolitaine.', ''],
          ]
        : [
            ['01 / THE MODULE', 'Thousands of pixels.', 'One calibrated module.', 'Every LED measured and matched, so no module is brighter than its neighbour.'],
            ['02 / THE WALL', 'Cabinets lock into', 'one seamless surface.', '500 × 500 mm cabinets, 29.5 mm deep. Any width. Any height.'],
            ['03 / THE ARCHITECTURE', 'The screen becomes', 'the façade.', "We don't place screens into spaces. We make screens part of the space."],
            ['04 / THE CITY', 'From engineering', 'to every surface.', ''],
          ],
    cta: lang === 'FR' ? 'Découvrir les réalisations →' : 'See the projects →',
    steps: lang === 'FR' ? ['PIXEL', 'MODULE', 'MUR', 'FAÇADE', 'VILLE'] : ['PIXEL', 'MODULE', 'WALL', 'FAÇADE', 'CITY'],
    hud: lang === 'FR' ? ['DISTANCE CAMÉRA', 'PIXELS VISIBLES', 'ÉCHELLE VISUELLE'] : ['CAMERA DISTANCE', 'PIXELS IN VIEW', 'WHAT YOU SEE'],
    content: { tagline: 'Science Behind The LED' },
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const sticky = stickyRef.current;
    if (!canvas || !container || !sticky) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.matchMedia('(max-width: 760px)').matches;
    let isCancelled = false;

    const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
    if (!ctx) return;

    const maxDpr = isMobile ? 1 : 1.25;
    let currentDpr = Math.min(window.devicePixelRatio || 1, maxDpr);
    let viewW = 0;
    let viewH = 0;
    let animId = 0;
    let isIntersecting = true;
    let scrollProgressTarget = 0;
    let scrollProgressCur = 0;
    let mouseTiltX = 0;
    let mouseTiltY = 0;
    let frameCount = 0;
    let lastTimestamp = 0;
    let lastScrollTime = 0;
    let smoothedFps = 16;
    let lastDprChangeTime = 0;

    const resize = () => {
      viewW = sticky.clientWidth;
      viewH = sticky.clientHeight;
      canvas.width = Math.round(viewW * currentDpr);
      canvas.height = Math.round(viewH * currentDpr);
      ctx.setTransform(currentDpr, 0, 0, currentDpr, 0, 0);
      ctx.imageSmoothingQuality = currentDpr < 1 ? 'low' : 'medium';
    };
    resize();

    const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);

    let seedState = 4242;
    const prng = () => {
      seedState = (16807 * seedState) % 0x7fffffff;
      return (seedState - 1) / 0x7ffffffe;
    };

    interface Building {
      x: number;
      z: number;
      w: number;
      d: number;
      h: number;
      led: boolean;
      hue: number;
      seed: number;
      tower?: boolean;
      tex?: HTMLCanvasElement;
      texS?: HTMLCanvasElement;
      ledTex?: HTMLCanvasElement;
    }

    const buildings: Building[] = [];
    const countW = isMobile ? 150 : 240;
    const countL = isMobile ? 50 : 80;

    for (let i = 0; i < countW; i++) {
      const side = 0.5 > prng() ? -1 : 1;
      const bZ = -60 + 900 * prng();
      const bX = side * (24 + 420 * prng());
      buildings.push({
        x: bX,
        z: bZ,
        w: 14 + 34 * prng(),
        d: 14 + 40 * prng(),
        h: 12 + prng() * prng() * 150,
        led: 0.22 > prng(),
        hue: [205, 330, 20, 150, 260][Math.floor(5 * prng())],
        seed: prng(),
      });
    }

    for (let i = 0; i < countL; i++) {
      const bZ = 60 + 900 * prng();
      const bX = -320 + 640 * prng();
      if (Math.abs(bX) >= 40 || bZ >= 120) {
        buildings.push({
          x: bX,
          z: bZ,
          w: 14 + 30 * prng(),
          d: 14 + 30 * prng(),
          h: 10 + prng() * prng() * 120,
          led: 0.15 > prng(),
          hue: [205, 330, 20][Math.floor(3 * prng())],
          seed: prng(),
        });
      }
    }

    for (const b of buildings.slice()) {
      if (b.h > 55 && b.seed > 0.68) {
        buildings.push({
          x: b.x,
          z: b.z + 0.01,
          w: 0.55 * b.w,
          d: 0.55 * b.d,
          h: 1.5 * b.h,
          led: false,
          hue: b.hue,
          seed: (7.3 * b.seed) % 1,
          tower: true,
        });
      }
    }

    const generateBuildingTex = (
      width: number,
      height: number,
      seedVal: number,
      opts?: { retail?: boolean }
    ): HTMLCanvasElement => {
      const cols = Math.max(2, Math.min(48, Math.round(width / 2.6)));
      const rows = Math.max(2, Math.min(140, Math.round(height / 3.2)));
      const c = document.createElement('canvas');
      c.width = 4 * cols;
      c.height = 4 * rows;
      const bCtx = c.getContext('2d');
      if (!bCtx) return c;

      let s = (0x7ffffffe * seedVal) | 1;
      const rnd = () => {
        s = (16807 * s) % 0x7fffffff;
        return s / 0x7fffffff;
      };

      const isCoolTone = 0.3 > rnd();
      const baseL = isCoolTone ? 14 : 9 + 6 * rnd();
      const grad = bCtx.createLinearGradient(0, 0, 0, c.height);
      grad.addColorStop(0, isCoolTone ? 'rgb(18,22,34)' : `rgb(${0 | baseL},${0 | baseL},${(baseL + 2) | 0})`);
      grad.addColorStop(1, isCoolTone ? 'rgb(10,12,20)' : `rgb(${(baseL - 3) | 0},${(baseL - 3) | 0},${(baseL - 1) | 0})`);
      bCtx.fillStyle = grad;
      bCtx.fillRect(0, 0, c.width, c.height);

      const litProb = isCoolTone ? 0.08 + 0.08 * rnd() : 0.16 + 0.16 * rnd();
      bCtx.fillStyle = 'rgba(0,0,0,.35)';
      for (let i = 0; i < cols; i++) {
        bCtx.fillRect(4 * i + 3, 0, 1, c.height);
      }

      for (let r = 0; r < rows; r++) {
        const rowDark = 0.16 > rnd();
        const rowSparse = 0.05 > rnd();
        for (let col = 0; col < cols; col++) {
          const p = rnd();
          if (rowDark || (p > litProb && !rowSparse)) {
            bCtx.fillStyle = isCoolTone
              ? `rgba(90,120,170,${0.06 + 0.1 * rnd()})`
              : `rgba(40,48,70,${0.12 + 0.18 * rnd()})`;
            bCtx.fillRect(4 * col, 4 * r + 1, 2, 2);
            continue;
          }
          bCtx.fillStyle =
            0.7 > rnd()
              ? `rgba(255,${205 + ((30 * rnd()) | 0)},${140 + ((40 * rnd()) | 0)},${0.28 + 0.3 * rnd()})`
              : `rgba(${160 + ((40 * rnd()) | 0)},${190 + ((30 * rnd()) | 0)},255,${0.22 + 0.26 * rnd()})`;
          bCtx.fillRect(4 * col, 4 * r + 1, 2, 2);
        }
      }

      if (opts?.retail) {
        bCtx.fillStyle = 'rgba(255,190,120,.35)';
        bCtx.fillRect(0, c.height - 4, c.width, 4);
      }
      if (0.35 > rnd()) {
        bCtx.fillStyle = 'rgba(255,230,190,.35)';
        bCtx.fillRect(0, 0, c.width, 2);
      }
      return c;
    };

    for (const b of buildings) {
      b.tex = generateBuildingTex(b.w, b.h, b.seed, { retail: !b.tower && b.seed < 0.35 });
      b.texS = generateBuildingTex(b.d, b.h, (3.1 * b.seed) % 1);
      if (b.led) {
        const lCanvas = document.createElement('canvas');
        lCanvas.width = 16;
        lCanvas.height = 2;
        const lCtx = lCanvas.getContext('2d');
        if (lCtx) {
          for (let p = 0; p < 16; p++) {
            lCtx.fillStyle = `hsl(${b.hue + ((45 * Math.sin((p / 16) * 5 + 9 * b.seed)) | 0)} 90% ${
              40 + ((20 * Math.sin((p / 16) * 9)) | 0)
            }%)`;
            lCtx.fillRect(p, 0, 1, 2);
          }
        }
        b.ledTex = lCanvas;
      }
    }

    const mainFacadeTex = generateBuildingTex(32, 62, 0.42);
    const mainSideTex = generateBuildingTex(30, 62, 0.77);

    const shadowGradCanvas = document.createElement('canvas');
    shadowGradCanvas.width = 1;
    shadowGradCanvas.height = 64;
    const sgCtx = shadowGradCanvas.getContext('2d');
    if (sgCtx) {
      const g = sgCtx.createLinearGradient(0, 0, 0, 64);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, 'rgba(0,0,0,.6)');
      sgCtx.fillStyle = g;
      sgCtx.fillRect(0, 0, 1, 64);
    }

    const billboardCanvas = document.createElement('canvas');
    billboardCanvas.width = 1536;
    billboardCanvas.height = 896;
    const bbCtx = billboardCanvas.getContext('2d');

    const sampleCanvas = document.createElement('canvas');
    sampleCanvas.width = 96;
    sampleCanvas.height = 56;
    const sCtx = sampleCanvas.getContext('2d', { willReadFrequently: true });
    let sampleData: Uint8ClampedArray | null = null;

    const dotCanvas = document.createElement('canvas');
    dotCanvas.width = 8;
    dotCanvas.height = 8;
    const dotCtx = dotCanvas.getContext('2d');
    if (dotCtx) {
      dotCtx.fillStyle = 'rgba(255,255,255,.07)';
      dotCtx.beginPath();
      dotCtx.arc(4, 4, 1.1, 0, 2 * Math.PI);
      dotCtx.fill();
    }
    const dotPattern = bbCtx ? bbCtx.createPattern(dotCanvas, 'repeat') : null;

    const contentImg = new Image();
    contentImg.src = '/assets/showreel-content.jpg?v=' + Date.now();
    contentImg.onload = () => {
      hasBuiltBillboard = false;
      requestRender();
    };

    const dustParticles = Array.from({ length: 40 }, (_, idx) => ({
      x: 0.08 + ((137.5 * idx) % 1) * 0.52,
      y: (61.3 * idx) % 1,
      s: 0.6 + ((7 * idx) % 5) / 5,
      v: 0.004 + ((3 * idx) % 7) / 900,
    }));

    let hasBuiltBillboard = false;

    const sampleColorAt = (u: number, v: number): [number, number, number] => {
      if (!sampleData) return [0.2, 0.2, 0.3];
      const pxX = Math.floor(96 * clamp(u, 0, 0.999));
      const pxY = Math.floor(56 * clamp(v, 0, 0.999));
      const idx = (96 * pxY + pxX) * 4;
      return [sampleData[idx] / 255, sampleData[idx + 1] / 255, sampleData[idx + 2] / 255];
    };

    let cachedDiodeCanvas: HTMLCanvasElement | null = null;
    let cachedDiodeSize = 0;

    const drawRoundedRect = (
      c: CanvasRenderingContext2D,
      x: number,
      y: number,
      w: number,
      h: number,
      r: number
    ) => {
      c.beginPath();
      c.moveTo(x + r, y);
      c.arcTo(x + w, y, x + w, y + h, r);
      c.arcTo(x + w, y + h, x, y + h, r);
      c.arcTo(x, y + h, x, y, r);
      c.arcTo(x, y, x + w, y, r);
      c.closePath();
    };

    const diodeGlowCanvas = document.createElement('canvas');
    diodeGlowCanvas.width = 64;
    diodeGlowCanvas.height = 64;
    const dgCtx = diodeGlowCanvas.getContext('2d');
    if (dgCtx) {
      const g = dgCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
      g.addColorStop(0, 'rgba(255,255,255,.55)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      dgCtx.fillStyle = g;
      dgCtx.fillRect(0, 0, 64, 64);
    }

    const hudDistance = container.querySelector('[data-hud="scale"]');
    const hudPixels = container.querySelector('[data-hud="px"]');
    const hudStage = container.querySelector('[data-hud="dist"]');
    const hudBar = container.querySelector<HTMLDivElement>('[data-hud="bar"]');
    const hudHero = container.querySelector<HTMLDivElement>('[data-hud="hero"]');
    const chapters = Array.from(container.querySelectorAll<HTMLDivElement>('.xr-ch'));

    const blurCanvas = document.createElement('canvas');
    const skyCanvas = document.createElement('canvas');
    let lastSkyHoriz = -1;
    let lastCanvasW = 0;
    let lastCanvasH = 0;
    const stepNames = t.steps;
    let lastStageIdx = -1;

    const renderFrame = (timestamp: number) => {
      animId = 0;
      if (isCancelled) return;

      const deltaMs = lastTimestamp ? timestamp - lastTimestamp : 16;
      lastTimestamp = timestamp;
      const timeSec = timestamp / 1000;

      scrollProgressCur += (scrollProgressTarget - scrollProgressCur) * (prefersReducedMotion ? 1 : 0.18);
      const isSettled = Math.abs(scrollProgressTarget - scrollProgressCur) < 3e-4;
      const rawS = isSettled ? scrollProgressTarget : scrollProgressCur;
      const s = isFinite(rawS) ? Math.max(0, Math.min(1, rawS)) : 0;
      const isIdle = isSettled && timestamp - lastScrollTime > 400;

      frameCount++;
      if (isIdle && frameCount % 2 === 1) {
        if (isIntersecting && !prefersReducedMotion && !isCancelled) {
          animId = requestAnimationFrame(renderFrame);
        }
        return;
      }

      smoothedFps += (deltaMs - smoothedFps) * 0.15;
      if (!isIdle && timestamp - lastDprChangeTime > 400) {
        const targetDpr = Math.min(window.devicePixelRatio || 1, maxDpr);
        if (smoothedFps > 24 && currentDpr > 0.6) {
          currentDpr = Math.max(0.6, currentDpr - (smoothedFps > 40 ? 0.2 : 0.1));
          resize();
          lastDprChangeTime = timestamp;
        } else if (smoothedFps < 14 && currentDpr < targetDpr) {
          currentDpr = Math.min(targetDpr, currentDpr + 0.1);
          resize();
          lastDprChangeTime = timestamp;
        }
      }

      const camDist = Math.max(0.02, 0.02 * Math.pow(10, 4.65 * s));
      const distRatio = clamp((camDist - 120) / 780, 0, 1);
      const camHeight = 13 + 137 * Math.pow(distRatio, 1.6);
      const camOffsetX = mouseTiltX * camDist * 0.01 + Math.sin(0.13 * timeSec) * camDist * 0.003;
      const projScale = 0.95 * viewW;
      const horizonY = viewH * (0.5 + 0.06 * distRatio) + 12 * mouseTiltY;

      const project = (pX: number, pY: number, pZ: number) => {
        const depth = pZ + camDist;
        if (!isFinite(depth) || depth < 1e-6) {
          return { x: 0, y: 0, dz: depth };
        }
        const x = viewW / 2 + ((pX - camOffsetX) * projScale) / depth;
        const y = horizonY - ((pY - camHeight) * projScale) / depth;
        return { x: isFinite(x) ? x : viewW / 2, y: isFinite(y) ? y : horizonY, dz: depth };
      };

      const pixelScreenScale = (0.01 * projScale) / camDist;

      if (!hasBuiltBillboard && bbCtx && sCtx) {
        if (contentImg.complete && contentImg.naturalWidth > 0) {
          bbCtx.drawImage(contentImg, 0, 0, 1536, 896);
        } else {
          const bgGrad = bbCtx.createLinearGradient(0, 0, 0, 896);
          bgGrad.addColorStop(0, '#0a0503');
          bgGrad.addColorStop(1, '#050302');
          bbCtx.fillStyle = bgGrad;
          bbCtx.fillRect(0, 0, 1536, 896);

          // Render PIXIATECH Brand typographic logotype and tagline
          bbCtx.fillStyle = '#F5F4F0';
          bbCtx.font = "900 170px Satoshi, 'JetBrains Mono', sans-serif";
          bbCtx.textAlign = 'right';
          bbCtx.textBaseline = 'middle';
          bbCtx.fillText('PIXIATECH', 1482.24, 385.28);

          // Green dot on brand
          bbCtx.fillStyle = '#C3F910';
          bbCtx.beginPath();
          bbCtx.arc(1496, 320, 10, 0, 2 * Math.PI);
          bbCtx.fill();

          bbCtx.fillStyle = '#FFFFFF';
          bbCtx.font = '500 48px Satoshi, sans-serif';
          bbCtx.fillText(t.content.tagline, 1466.88, 555.52);

          bbCtx.textAlign = 'left';
          bbCtx.textBaseline = 'alphabetic';
        }

        if (dotPattern) {
          bbCtx.fillStyle = dotPattern;
          bbCtx.fillRect(0, 0, 1536, 896);
        }

        sCtx.drawImage(billboardCanvas, 0, 0, 96, 56);
        sampleData = sCtx.getImageData(0, 0, 96, 56).data;
        hasBuiltBillboard = true;
      }

      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, viewW, viewH);

      if (camDist > 8 && canvas.width > 0 && canvas.height > 0) {
        if (Math.abs(horizonY - lastSkyHoriz) > 1 || lastCanvasW !== canvas.width || lastCanvasH !== canvas.height) {
          lastSkyHoriz = horizonY;
          lastCanvasW = canvas.width;
          lastCanvasH = canvas.height;
          skyCanvas.width = Math.max(1, canvas.width);
          skyCanvas.height = Math.max(1, canvas.height);
          const sCtxInner = skyCanvas.getContext('2d');
          if (sCtxInner) {
            sCtxInner.setTransform(currentDpr, 0, 0, currentDpr, 0, 0);
            const skyGrad = sCtxInner.createLinearGradient(0, 0, 0, horizonY);
            skyGrad.addColorStop(0, '#040406');
            skyGrad.addColorStop(0.75, '#0A0E1A');
            skyGrad.addColorStop(1, '#182036');
            sCtxInner.fillStyle = skyGrad;
            sCtxInner.fillRect(0, 0, viewW, horizonY + 1);

            const groundGrad = sCtxInner.createLinearGradient(0, horizonY, 0, viewH);
            groundGrad.addColorStop(0, '#0F1420');
            groundGrad.addColorStop(0.3, '#07080B');
            groundGrad.addColorStop(1, '#040404');
            sCtxInner.fillStyle = groundGrad;
            sCtxInner.fillRect(0, horizonY, viewW, viewH - horizonY);

            const haze = sCtxInner.createLinearGradient(0, horizonY - 120, 0, horizonY + 30);
            haze.addColorStop(0, 'rgba(24,32,54,0)');
            haze.addColorStop(1, 'rgba(24,32,54,.8)');
            sCtxInner.fillStyle = haze;
            sCtxInner.fillRect(0, horizonY - 120, viewW, 150);
          }
        }

        if (skyCanvas.width > 0 && skyCanvas.height > 0) {
          ctx.save();
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.drawImage(skyCanvas, 0, 0);
          ctx.restore();
        }

        // City stars / atmospheric speckles
        ctx.fillStyle = 'rgba(245,244,240,.25)';
        for (let idx = 0; idx < 40; idx++) {
          if (Math.sin(0.8 * timeSec + idx) >= 0) {
            ctx.fillRect((173.3 * idx) % viewW, (61.7 * idx) % (0.7 * horizonY), 1.2, 1.2);
          }
        }
      }

      const quad = (
        p1: { x: number; y: number },
        p2: { x: number; y: number },
        p3: { x: number; y: number },
        p4: { x: number; y: number }
      ) => {
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.lineTo(p3.x, p3.y);
        ctx.lineTo(p4.x, p4.y);
        ctx.closePath();
      };

      const drawMappedImage = (
        img: HTMLCanvasElement,
        p1: { x: number; y: number },
        p2: { x: number; y: number },
        p3: { x: number; y: number },
        p4: { x: number; y: number }
      ) => {
        ctx.save();
        quad(p1, p2, p3, p4);
        ctx.clip();
        const dX = p2.x - p1.x;
        const dY = p2.y - p1.y;
        const midX = (p4.x - p1.x + (p3.x - p2.x)) / 2;
        const midY = (p4.y - p1.y + (p3.y - p2.y)) / 2;
        ctx.transform(dX / img.width, dY / img.width, midX / img.height, midY / img.height, p1.x, p1.y);
        ctx.drawImage(img, 0, 0);
        ctx.restore();
      };

      if (camDist > 12) {
        const visibleBuildings: { b: Building; z0: number }[] = [];
        for (const b of buildings) {
          if (b.z + b.d + camDist > 4 && b.z + camDist < 1100) {
            visibleBuildings.push({ b, z0: Math.max(b.z, -camDist + 4) });
          }
        }
        visibleBuildings.sort((a, b) => b.z0 - a.z0);

        for (const { b, z0 } of visibleBuildings) {
          const farZ = b.z + b.d;
          const leftX = b.x - b.w / 2;
          const rightX = b.x + b.w / 2;
          const distFactor = Math.pow(clamp((z0 + camDist) / 1100, 0, 1), 0.65);

          const ptBL = project(leftX, 0, z0);
          const ptBR = project(rightX, 0, z0);
          const ptTL = project(leftX, b.h, z0);
          const ptTR = project(rightX, b.h, z0);

          if (ptBR.x < -40 || ptBL.x > viewW + 40 || ptTL.y > viewH + 40) continue;

          const screenW = ptBR.x - ptBL.x;
          const screenH = ptBL.y - ptTL.y;

          if (screenW < 1.5) {
            ctx.fillStyle = `rgba(16,18,26,${1 - distFactor})`;
            ctx.fillRect(ptBL.x, ptTL.y, Math.max(1, screenW), screenH);
            continue;
          }

          if (b.tex) {
            ctx.drawImage(b.tex, ptBL.x, ptTL.y, screenW, screenH);
          }

          const sideX = b.x < 0 ? rightX : leftX;
          const sBL = project(sideX, 0, z0);
          const sFL = project(sideX, 0, farZ);
          const sFT = project(sideX, b.h, farZ);
          const sBT = project(sideX, b.h, z0);
          const sideW = Math.abs(sFL.x - sBL.x);

          if (sideW > 1) {
            if (screenW > 60 && b.texS) {
              drawMappedImage(b.texS, sBL, sFL, sFT, sBT);
              ctx.fillStyle = 'rgba(0,0,0,.45)';
            } else {
              ctx.fillStyle = screenW > 10 ? 'rgba(10,12,18,.96)' : 'rgba(8,9,13,.9)';
            }
            quad(sBL, sFL, sFT, sBT);
            ctx.fill();
          }

          if (camHeight > b.h) {
            const rFL = project(leftX, b.h, farZ);
            const rFR = project(rightX, b.h, farZ);
            ctx.fillStyle = `rgb(${((22 - 6 * distFactor) | 0)},${((24 - 4 * distFactor) | 0)},30)`;
            quad(ptTL, ptTR, rFR, rFL);
            ctx.fill();

            if (screenW > 30) {
              ctx.fillStyle = '#0A0B0F';
              ctx.fillRect(ptTL.x + 0.3 * screenW, ptTL.y + (rFL.y - ptTL.y) * 0.3, 0.18 * screenW, (rFL.y - ptTL.y) * 0.3);
            }
          }

          if (screenW > 14) {
            ctx.drawImage(shadowGradCanvas, ptBL.x, ptBL.y - 0.12 * screenH, screenW, 0.12 * screenH);
          }

          if (distFactor > 0.06) {
            ctx.fillStyle = `rgba(24,32,54,${(0.9 * distFactor).toFixed(2)})`;
            ctx.fillRect(ptBL.x, ptTL.y, screenW, screenH);
            if (sideW > 1) {
              quad(sBL, sFL, sFT, sBT);
              ctx.fill();
            }
          }

          if (screenW > 24) {
            ctx.strokeStyle = `rgba(245,244,240,${(0.08 * (1 - distFactor)).toFixed(3)})`;
            ctx.lineWidth = 1;
            ctx.strokeRect(ptBL.x, ptTL.y, screenW, screenH);
          }

          if (b.h > 150 && screenH > 120) {
            const antX = (ptTL.x + ptTR.x) / 2;
            const antLen = 0.08 * screenH;
            ctx.strokeStyle = 'rgba(200,200,200,.5)';
            ctx.beginPath();
            ctx.moveTo(antX, ptTL.y);
            ctx.lineTo(antX, ptTL.y - antLen);
            ctx.stroke();

            const beaconLit = Math.sin(2 * timeSec + 9 * b.seed) > 0.6;
            ctx.fillStyle = `rgba(255,40,30,${0.4 + 0.6 * (beaconLit ? 1 : 0)})`;
            ctx.fillRect(antX - 1.5, ptTL.y - antLen - 1.5, 3, 3);
          }

          if (b.led && b.ledTex && screenW > 5 && distFactor < 0.9) {
            const ledX = ptBL.x + 0.1 * screenW;
            const ledY = ptTL.y + 0.1 * screenH;
            const ledW = 0.8 * screenW;
            const ledH = 0.38 * screenH;
            ctx.globalAlpha = (0.75 + 0.25 * Math.sin(1.1 * timeSec + 9 * b.seed)) * (1 - 0.6 * distFactor);
            ctx.drawImage(b.ledTex, ledX, ledY, ledW, ledH);
            ctx.globalAlpha = 1;
          }
        }
      }

      // The Main Skyscraper carrying the PIXIATECH Screen
      const mainBL = project(-16, 0, 0);
      const mainBR = project(16, 0, 0);
      const mainTR = project(16, 62, 0);
      const mainTL = project(-16, 62, 0);

      if (camDist > 30) {
        ctx.drawImage(mainFacadeTex, mainBL.x, mainTR.y, mainBR.x - mainBL.x, mainBL.y - mainTR.y);
        const sideBR = project(16, 0, 30);
        const sideTR = project(16, 62, 30);
        drawMappedImage(mainSideTex, mainBR, sideBR, sideTR, mainTR);
        ctx.fillStyle = 'rgba(0,0,0,.45)';
        quad(mainBR, sideBR, sideTR, mainTR);
        ctx.fill();

        if (camHeight > 62) {
          const topTL = project(-16, 62, 30);
          const topTR = project(16, 62, 30);
          ctx.fillStyle = '#171920';
          quad(mainTL, mainTR, topTR, topTL);
          ctx.fill();
        }

        ctx.drawImage(
          shadowGradCanvas,
          mainBL.x,
          mainBL.y - (mainBL.y - mainTR.y) * 0.1,
          mainBR.x - mainBL.x,
          (mainBL.y - mainTR.y) * 0.1
        );
      } else {
        const wallGrad = ctx.createLinearGradient(mainBL.x, 0, mainBR.x, 0);
        wallGrad.addColorStop(0, '#121211');
        wallGrad.addColorStop(1, '#0B0B0A');
        ctx.fillStyle = wallGrad;
        ctx.fillRect(
          Math.max(-2, mainBL.x),
          Math.max(-2, mainTR.y),
          Math.min(viewW + 4, mainBR.x - mainBL.x),
          Math.min(viewH + 4, mainBL.y - mainTR.y)
        );
      }

      const scrBL = project(-12, 6, 0);
      const scrTR = project(12, 20, 0);
      const scrX = scrBL.x;
      const scrY = scrTR.y;
      const scrW = scrTR.x - scrBL.x;
      const scrH = scrBL.y - scrTR.y;

      const colMin = clamp(Math.floor((0 - scrX) / pixelScreenScale), 0, 2400);
      const colMax = clamp(Math.ceil((viewW - scrX) / pixelScreenScale), 0, 2400);
      const rowMin = clamp(Math.floor((0 - scrY) / pixelScreenScale), 0, 1400);
      const rowMax = clamp(Math.ceil((viewH - scrY) / pixelScreenScale), 0, 1400);

      ctx.save();
      ctx.beginPath();
      ctx.rect(Math.max(scrX, -2), Math.max(scrY, -2), Math.min(scrW, viewW + 4), Math.min(scrH, viewH + 4));
      ctx.clip();

      if (pixelScreenScale >= 26) {
        ctx.fillStyle = '#070707';
        ctx.fillRect(0, 0, viewW, viewH);

        const getDiodeCache = (sz: number) => {
          const roundedSz = Math.round(sz);
          if (cachedDiodeCanvas && cachedDiodeSize === roundedSz) return cachedDiodeCanvas;
          const c = document.createElement('canvas');
          c.width = c.height = roundedSz;
          const dCtx = c.getContext('2d');
          if (!dCtx) return c;

          const innerSz = 0.82 * roundedSz;
          const offset = (roundedSz - innerSz) / 2;
          const diagGrad = dCtx.createLinearGradient(offset, offset, offset + innerSz, offset + innerSz);
          diagGrad.addColorStop(0, '#171716');
          diagGrad.addColorStop(1, '#050505');
          dCtx.fillStyle = diagGrad;
          drawRoundedRect(dCtx, offset, offset, innerSz, innerSz, 0.07 * innerSz);
          dCtx.fill();

          dCtx.fillStyle = '#0B0B0A';
          drawRoundedRect(
            dCtx,
            roundedSz / 2 - 0.4 * innerSz,
            roundedSz / 2 - 0.32 * innerSz,
            0.8 * innerSz,
            0.64 * innerSz,
            0.04 * innerSz
          );
          dCtx.fill();

          if (roundedSz > 90) {
            dCtx.fillStyle = 'rgba(255,255,255,.08)';
            drawRoundedRect(dCtx, offset, offset, 0.5 * innerSz, 0.5 * innerSz, 0.07 * innerSz);
            dCtx.fill();
            dCtx.fillStyle = '#4A4A46';
            dCtx.fillRect(roundedSz / 2 - 0.42 * innerSz, offset + innerSz + 1, 0.3 * innerSz, 0.05 * innerSz);
            dCtx.fillRect(roundedSz / 2 + 0.12 * innerSz, offset + innerSz + 1, 0.3 * innerSz, 0.05 * innerSz);
          }

          cachedDiodeCanvas = c;
          cachedDiodeSize = roundedSz;
          return c;
        };

        const diodePkg = getDiodeCache(pixelScreenScale);
        const subW = 0.13 * pixelScreenScale;
        const subH = 0.34 * pixelScreenScale;
        const subGap = 0.1 * pixelScreenScale;
        const colors = ['255,46,31', '34,232,106', '42,107,255'];

        for (let r = rowMin; r < rowMax; r++) {
          for (let c = colMin; c < colMax; c++) {
            const pCenterX = scrX + (c + 0.5) * pixelScreenScale;
            const pCenterY = scrY + (r + 0.5) * pixelScreenScale;
            const rgb = sampleColorAt(c / 2400, r / 1400);

            ctx.drawImage(diodePkg, pCenterX - pixelScreenScale / 2, pCenterY - pixelScreenScale / 2, pixelScreenScale, pixelScreenScale);

            for (let sub = 0; sub < 3; sub++) {
              const subX = pCenterX - (1.5 * subW + subGap) + sub * (subW + subGap);
              const intensity = rgb[sub];

              if (pixelScreenScale > 60 && intensity > 0.05) {
                ctx.globalAlpha = 0.9 * intensity;
                ctx.drawImage(
                  diodeGlowCanvas,
                  subX + subW / 2 - 0.38 * pixelScreenScale,
                  pCenterY - 0.38 * pixelScreenScale,
                  0.76 * pixelScreenScale,
                  0.76 * pixelScreenScale
                );
                ctx.globalAlpha = 1;
              }

              ctx.fillStyle = `rgba(${colors[sub]},${0.25 + 0.75 * intensity})`;
              drawRoundedRect(ctx, subX, pCenterY - subH / 2, subW, subH, 0.25 * subW);
              ctx.fill();

              if (intensity > 0.3) {
                ctx.fillStyle = `rgba(255,255,255,${0.5 * intensity})`;
                drawRoundedRect(ctx, subX + 0.2 * subW, pCenterY - subH / 2 + 0.08 * subH, 0.35 * subW, 0.28 * subH, 0.15 * subW);
                ctx.fill();
              }
            }
          }
        }
      } else if (50 * pixelScreenScale >= 3 && camDist > 1 && !prefersReducedMotion) {
        const cabColMin = Math.max(0, Math.floor(colMin / 50));
        const cabColMax = Math.min(48, Math.ceil(colMax / 50));
        const cabRowMin = Math.max(0, Math.floor(rowMin / 50));
        const cabRowMax = Math.min(28, Math.ceil(rowMax / 50));

        ctx.fillStyle = '#040404';
        ctx.fillRect(Math.max(scrX, -2), Math.max(scrY, -2), Math.min(scrW, viewW + 4), Math.min(scrH, viewH + 4));

        const distFade = clamp((camDist - 1) / 3, 0, 1);

        for (let r = cabRowMin; r < cabRowMax; r++) {
          for (let c = cabColMax - 1; c >= cabColMin; c--) {
            const cLeft = -12 + 0.5 * c;
            const cRight = cLeft + 0.5;
            const cTop = 20 - 0.5 * r;
            const pBL = project(cLeft, cTop - 0.5, 0);
            const pTR = project(cRight, cTop, 0);
            const cW = pTR.x - pBL.x;
            const cH = pBL.y - pTR.y;

            if (pTR.x < -cW || pBL.x > viewW + cW || pBL.y < -cH || pTR.y > viewH + cH) continue;

            const extrusion = distFade * (0.5 + 0.5 * Math.sin(0.9 * timeSec + 0.35 * c + 0.5 * r)) * 0.12 * cW;
            const topX = pBL.x + 0.5 * extrusion;
            const topY = pTR.y - 0.9 * extrusion;

            if (extrusion > 0.4) {
              ctx.fillStyle = '#121211';
              ctx.beginPath();
              ctx.moveTo(pBL.x, pTR.y);
              ctx.lineTo(topX, topY);
              ctx.lineTo(topX, topY + cH);
              ctx.lineTo(pBL.x, pBL.y);
              ctx.closePath();
              ctx.fill();

              ctx.fillStyle = '#060606';
              ctx.beginPath();
              ctx.moveTo(pBL.x, pBL.y);
              ctx.lineTo(topX, topY + cH);
              ctx.lineTo(topX + cW, topY + cH);
              ctx.lineTo(pTR.x, pBL.y);
              ctx.closePath();
              ctx.fill();
            }

            ctx.drawImage(billboardCanvas, 32 * c, 32 * r, 32, 32, topX, topY, cW, cH);

            if (cW > 160) {
              ctx.globalAlpha = 0.16;
              ctx.strokeStyle = '#000';
              ctx.lineWidth = Math.max(0.6, (cW / 50) * 0.3);
              const gridStep = cW / 50;
              ctx.beginPath();
              for (let lineX = topX; lineX <= topX + cW; lineX += gridStep) {
                ctx.moveTo(lineX, topY);
                ctx.lineTo(lineX, topY + cH);
              }
              for (let lineY = topY; lineY <= topY + cH; lineY += gridStep) {
                ctx.moveTo(topX, lineY);
                ctx.lineTo(topX + cW, lineY);
              }
              ctx.stroke();
              ctx.globalAlpha = 1;
            }

            ctx.strokeStyle = 'rgba(0,0,0,.5)';
            ctx.lineWidth = 1;
            ctx.strokeRect(topX + 0.5, topY + 0.5, cW - 1, cH - 1);
          }
        }

        const sweepPhase = (0.07 * timeSec) % 1;
        const sweepGrad = ctx.createLinearGradient(scrX + scrW * (sweepPhase - 0.6), scrY, scrX + scrW * (sweepPhase + 0.2), scrY + scrH);
        sweepGrad.addColorStop(0, 'rgba(255,255,255,0)');
        sweepGrad.addColorStop(0.5, 'rgba(255,255,255,.05)');
        sweepGrad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = sweepGrad;
        ctx.fillRect(Math.max(scrX, 0), Math.max(scrY, 0), Math.min(scrW, viewW), Math.min(scrH, viewH));
      } else {
        const srcW = Math.max(1, ((colMax - colMin) * 1536) / 2400);
        const srcH = Math.max(1, ((rowMax - rowMin) * 896) / 1400);
        const floatZ = 1.03 + 0.02 * Math.sin(0.11 * timeSec);
        const floatOffX = (floatZ - 1) * 1536 * (0.5 + 0.4 * Math.sin(0.07 * timeSec));

        if (colMax > colMin && rowMax > rowMin) {
          ctx.drawImage(
            billboardCanvas,
            (1536 * colMin) / 2400 + floatOffX / floatZ,
            (896 * rowMin) / 1400 + ((floatZ - 1) * 448) / floatZ,
            srcW / floatZ,
            srcH / floatZ,
            scrX + colMin * pixelScreenScale,
            scrY + rowMin * pixelScreenScale,
            (colMax - colMin) * pixelScreenScale,
            (rowMax - rowMin) * pixelScreenScale
          );
        }

        if (scrW > 120) {
          ctx.save();
          ctx.globalCompositeOperation = 'lighter';
          ctx.fillStyle = '#ffd9a0';
          const pScale = scrW / 1536;
          for (const d of dustParticles) {
            const pY = ((d.y - timeSec * d.v) % 1 + 1) % 1;
            ctx.globalAlpha = 0.2 + 0.5 * Math.abs(Math.sin(1.7 * timeSec + 50 * d.x));
            const pSize = Math.max(1, 3 * d.s * pScale);
            ctx.fillRect(scrX + d.x * scrW, scrY + pY * scrH * 0.86, pSize, pSize);
          }
          ctx.restore();
        }

        if (pixelScreenScale >= 2.4) {
          const alpha = clamp((pixelScreenScale - 2.4) / 6, 0.18, 0.7);
          ctx.strokeStyle = `rgba(0,0,0,${alpha})`;
          ctx.lineWidth = Math.max(0.6, 0.3 * pixelScreenScale);
          const minX = Math.max(0, scrX);
          const maxX = Math.min(viewW, scrX + scrW);
          const minY = Math.max(0, scrY);
          const maxY = Math.min(viewH, scrY + scrH);
          ctx.beginPath();
          for (let c = colMin; c <= colMax; c++) {
            const lineX = scrX + c * pixelScreenScale;
            ctx.moveTo(lineX, minY);
            ctx.lineTo(lineX, maxY);
          }
          for (let r = rowMin; r <= rowMax; r++) {
            const lineY = scrY + r * pixelScreenScale;
            ctx.moveTo(minX, lineY);
            ctx.lineTo(maxX, lineY);
          }
          ctx.stroke();
        } else if (pixelScreenScale > 1.2) {
          ctx.globalAlpha = (pixelScreenScale - 1.2) * 0.25;
          ctx.fillStyle = '#000';
          for (let lineY = Math.max(0, scrY); lineY < Math.min(viewH, scrY + scrH); lineY += 2.4) {
            ctx.fillRect(Math.max(0, scrX), lineY, Math.min(viewW, scrW), 0.8);
          }
          ctx.globalAlpha = 1;
        }

        const cabinetGridW = 50 * pixelScreenScale;
        const halfCabinetGridW = 25 * pixelScreenScale;

        if (cabinetGridW >= 14 && cabinetGridW < viewW) {
          ctx.strokeStyle = `rgba(0,0,0,${clamp((cabinetGridW - 14) / 40, 0.2, 0.6)})`;
          ctx.lineWidth = Math.max(1, 0.02 * cabinetGridW);
          ctx.beginPath();
          for (let gX = scrX; gX <= scrX + scrW + 1; gX += cabinetGridW) {
            if (gX >= -2 && gX <= viewW + 2) {
              ctx.moveTo(gX, scrY);
              ctx.lineTo(gX, scrY + scrH);
            }
          }
          for (let gY = scrY; gY <= scrY + scrH + 1; gY += cabinetGridW) {
            if (gY >= -2 && gY <= viewH + 2) {
              ctx.moveTo(scrX, gY);
              ctx.lineTo(scrX + scrW, gY);
            }
          }
          ctx.stroke();
        }

        if (halfCabinetGridW >= 40 && halfCabinetGridW < viewW) {
          ctx.strokeStyle = 'rgba(0,0,0,.3)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          for (let gX = scrX; gX <= scrX + scrW + 1; gX += halfCabinetGridW) {
            if (gX >= -2 && gX <= viewW + 2) {
              ctx.moveTo(gX, scrY);
              ctx.lineTo(gX, scrY + scrH);
            }
          }
          for (let gY = scrY; gY <= scrY + scrH + 1; gY += halfCabinetGridW) {
            if (gY >= -2 && gY <= viewH + 2) {
              ctx.moveTo(scrX, gY);
              ctx.lineTo(scrX + scrW, gY);
            }
          }
          ctx.stroke();
        }

        // Scanline sweep
        const scanY = scrY + ((0.3 * timeSec) % 1) * scrH;
        const scanGrad = ctx.createLinearGradient(0, scanY - 30, 0, scanY + 30);
        scanGrad.addColorStop(0, 'rgba(0,0,0,0)');
        scanGrad.addColorStop(0.5, 'rgba(0,0,0,.2)');
        scanGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = scanGrad;
        ctx.fillRect(scrX, scanY - 30, scrW, 60);
      }

      ctx.restore();

      if (pixelScreenScale < 26) {
        ctx.strokeStyle = 'rgba(245,244,240,.25)';
        ctx.lineWidth = 1;
        ctx.strokeRect(scrX, scrY, scrW, scrH);
      }

      if (camDist > 20) {
        const reflBL = project(-12, -6, 0);
        const reflTR = project(12, -20, 0);
        if (reflTR.x - reflBL.x < 2e4) {
          ctx.save();
          ctx.globalAlpha = 0.28;
          ctx.translate(0, reflBL.y + (reflTR.y - reflBL.y));
          ctx.scale(1, -1);
          ctx.drawImage(billboardCanvas, reflBL.x, 0, reflTR.x - reflBL.x, reflTR.y - reflBL.y);
          ctx.restore();
        }

        const hazeGrad = ctx.createLinearGradient(0, mainBL.y, 0, reflTR.y);
        hazeGrad.addColorStop(0, 'rgba(5,5,5,.15)');
        hazeGrad.addColorStop(1, 'rgba(5,5,5,1)');
        ctx.fillStyle = hazeGrad;
        ctx.fillRect(0, mainBL.y, viewW, Math.max(0, reflTR.y - mainBL.y) + 2);

        if (camDist > 140 && canvas.width > 0 && canvas.height > 0) {
          ctx.save();
          ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = 0.16;
          const bloomGrad = ctx.createRadialGradient(
            scrX + scrW / 2,
            scrY + scrH / 2,
            0,
            scrX + scrW / 2,
            scrY + scrH / 2,
            1.1 * scrW
          );
          bloomGrad.addColorStop(0, 'rgba(90,140,255,1)');
          bloomGrad.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = bloomGrad;
          ctx.fillRect(
            Math.max(0, scrX - scrW),
            Math.max(0, scrY - scrH),
            Math.min(viewW, 3 * scrW),
            Math.min(viewH, 3 * scrH)
          );
          ctx.restore();

          const blurW = Math.max(2, canvas.width >> 5);
          const blurH = Math.max(2, canvas.height >> 5);
          if (blurCanvas.width !== blurW || blurCanvas.height !== blurH) {
            blurCanvas.width = blurW;
            blurCanvas.height = blurH;
          }
          if (frameCount % 2 === 0) {
            blurCanvas.getContext('2d')?.drawImage(canvas, 0, 0, blurW, blurH);
          }
          ctx.save();
          ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = 0.3;
          ctx.drawImage(blurCanvas, 0, 0, viewW, viewH);
          ctx.restore();
        }
      }

      const visiblePixelCount = Math.min(336e4, (colMax - colMin) * (rowMax - rowMin));
      const distStr =
        camDist < 1
          ? Math.round(1e3 * camDist) + ' mm'
          : camDist < 1e3
          ? camDist.toFixed(camDist < 10 ? 1 : 0) + ' m'
          : (camDist / 1e3).toFixed(1) + ' km';

      if (hudDistance && hudDistance.textContent !== distStr) {
        hudDistance.textContent = distStr;
      }

      const pCount = Math.max(1, visiblePixelCount);
      const pxStr =
        pCount >= 1e6
          ? (pCount / 1e6).toFixed(2) + ' M'
          : pCount >= 1e3
          ? Math.round(pCount).toLocaleString('en-US')
          : String(Math.round(pCount));

      if (hudPixels && hudPixels.textContent !== pxStr) {
        hudPixels.textContent = pxStr;
      }

      const stageIdx =
        pixelScreenScale >= 26 ? 0 : camDist <= 1 ? 1 : 50 * pixelScreenScale >= 14 ? 2 : camDist < 140 ? 3 : 4;

      if (stageIdx !== lastStageIdx) {
        lastStageIdx = stageIdx;
        if (hudStage) {
          hudStage.textContent = ['SMD PIXEL', stepNames[1], stepNames[2], stepNames[3], stepNames[4]][stageIdx];
        }
      }

      if (hudBar) {
        hudBar.style.width = (100 * s).toFixed(1) + '%';
      }

      if (hudHero) {
        const heroOpacity = clamp(1 - s / 0.1, 0, 1);
        hudHero.style.opacity = String(heroOpacity);
        hudHero.style.transform = `translateY(${(1 - heroOpacity) * 30}px)`;
        hudHero.style.pointerEvents = heroOpacity > 0.5 ? 'auto' : 'none';
      }

      const chapterNorm = 4 * clamp((s - 0.14) / 0.86, 0, 1);
      const currentChNum = s < 0.14 ? 0 : Math.min(4, 1 + Math.floor(chapterNorm));
      const chapterFraction = s < 0.14 ? 0 : chapterNorm % 1;

      chapters.forEach((chEl) => {
        const chAttr = Number(chEl.getAttribute('data-ch') || 0);
        const isVisible = chAttr === currentChNum && chapterFraction < 0.9;
        const currentOpacity = chEl.style.opacity === '1';
        if (currentOpacity !== isVisible) {
          chEl.style.opacity = isVisible ? '1' : '0';
          chEl.style.transform = isVisible ? 'translateY(0)' : 'translateY(18px)';
          chEl.style.pointerEvents = isVisible ? 'auto' : 'none';
        }
      });

      if (isIntersecting && !prefersReducedMotion && !isCancelled) {
        animId = requestAnimationFrame(renderFrame);
      }
    };

    const requestRender = () => {
      if (!isCancelled && !animId) {
        animId = requestAnimationFrame(renderFrame);
      }
    };

    const onScroll = () => {
      const rect = container.getBoundingClientRect();
      scrollProgressTarget = rect.height > viewH ? clamp(-rect.top / (rect.height - viewH), 0, 1) : 0;
      lastScrollTime = performance.now();
      requestRender();
    };
    onScroll();

    const onMouseMove = (e: MouseEvent) => {
      const rect = sticky.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        mouseTiltX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
        mouseTiltY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    if (!isMobile) {
      sticky.addEventListener('mousemove', onMouseMove, { passive: true });
    }

    const io = new IntersectionObserver((entries) => {
      isIntersecting = entries[0].isIntersecting;
      if (isIntersecting) requestRender();
    });
    io.observe(container);

    const ro = new ResizeObserver(() => {
      resize();
      requestRender();
    });
    ro.observe(sticky);

    return () => {
      isCancelled = true;
      window.removeEventListener('scroll', onScroll);
      sticky.removeEventListener('mousemove', onMouseMove);
      io.disconnect();
      ro.disconnect();
      if (animId) cancelAnimationFrame(animId);
    };
  }, [lang]);

  const hudStatItem = (key: string, initialVal: string, label: string, color?: string) => (
    <div>
      <div
        data-hud={key}
        style={{
          fontSize: 'clamp(20px, 1.8vw, 28px)',
          fontWeight: 700,
          letterSpacing: '-.01em',
          color: color || '#F5F4F0',
        }}
      >
        {initialVal}
      </div>
      <div
        style={{
          fontSize: 9.5,
          letterSpacing: '.22em',
          color: '#7A7A76',
          marginTop: 4,
          fontFamily: 'monospace',
        }}
      >
        {label}
      </div>
    </div>
  );

  return (
    <div
      id="showreel"
      ref={containerRef}
      className="sr-wrap"
      style={{
        position: 'relative',
        background: '#050505',
        color: '#F5F4F0',
        height: '600vh',
      }}
    >
      <div
        ref={stickyRef}
        style={{
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflow: 'hidden',
        }}
      >
        {/* Fullscreen 3D Projection Canvas */}
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            display: 'block',
          }}
        />

        {/* Ambient Radial Vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(90% 90% at 50% 45%, rgba(5,5,5,0) 55%, rgba(5,5,5,.7) 100%)',
            pointerEvents: 'none',
          }}
        />

        {/* Cinematic Linear Gradients */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(90deg, rgba(5,5,5,.86) 0%, rgba(5,5,5,.45) 34%, rgba(5,5,5,0) 60%), linear-gradient(0deg, rgba(5,5,5,.9) 0%, rgba(5,5,5,.45) 24%, rgba(5,5,5,0) 46%)',
            pointerEvents: 'none',
          }}
        />

        <h2 style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', margin: 0 }}>
          {t.head1} {t.head2}
        </h2>

        {/* Sticky Top Bar */}
        <div
          className="xr-top"
          style={{
            position: 'absolute',
            top: 'calc(var(--nav-h, 88px) + 20px)',
            left: 'clamp(16px, 3.5vw, 64px)',
            right: 'clamp(16px, 3.5vw, 64px)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 16,
            pointerEvents: 'none',
            fontSize: 10.5,
            letterSpacing: '.26em',
            color: '#7A7A76',
            fontFamily: 'monospace',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span>{t.label}</span>
          </div>

          <span
            className="hidden sm:flex"
            style={{
              display: 'flex',
              gap: 10,
              alignItems: 'center',
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#C3F910',
                animation: 'xr-blink 1.4s ease-in-out infinite',
              }}
            />
            {t.scrollHint}
          </span>
        </div>

        {/* Right Floating Telemetry HUD */}
        <div
          className="hidden sm:flex"
          style={{
            position: 'absolute',
            top: '50%',
            right: 'clamp(16px, 3.5vw, 64px)',
            transform: 'translateY(-50%)',
            display: 'flex',
            flexDirection: 'column',
            gap: 22,
            pointerEvents: 'none',
            textAlign: 'right',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {hudStatItem('scale', '20 mm', t.hud[0])}
          {hudStatItem('px', '1', t.hud[1])}
          {hudStatItem('dist', 'SMD PIXEL', t.hud[2], '#C3F910')}
        </div>

        {/* Initial Hero Typography at Bottom-Left */}
        <div
          data-hud="hero"
          style={{
            position: 'absolute',
            left: 'clamp(16px, 3.5vw, 64px)',
            right: 'clamp(16px, 3.5vw, 64px)',
            bottom: 'clamp(56px, 8vh, 72px)',
            pointerEvents: 'none',
            transition: 'opacity .4s ease, transform .5s ease',
          }}
        >
          <div
            style={{
              fontSize: 11,
              letterSpacing: '.24em',
              color: '#A3A3A3',
              marginBottom: 22,
              fontFamily: 'monospace',
            }}
          >
            {t.eyebrow}
          </div>
          <div
            className="sr-h"
            style={{
              lineHeight: 0.92,
              letterSpacing: '-.035em',
              fontWeight: 900,
              maxWidth: 1000,
              fontSize: 'clamp(44px, 8.4vw, 132px)',
            }}
          >
            <span
              style={{
                display: 'block',
                color: 'transparent',
                WebkitTextStroke: '1.5px rgba(245,244,240,.9)',
              }}
            >
              {t.head1}
            </span>
            <span style={{ display: 'block', color: '#F5F4F0' }}>{t.head2}</span>
          </div>
          <p
            style={{
              margin: '26px 0 0',
              maxWidth: 460,
              fontSize: 15.5,
              lineHeight: 1.6,
              color: '#A3A3A3',
            }}
          >
            {t.lede}
          </p>
        </div>

        {/* Scroll Chapters that sequence in as user travels back */}
        {t.chapters.map((ch, idx) => (
          <div
            key={idx}
            className="xr-ch"
            data-ch={idx + 1}
            style={{
              position: 'absolute',
              left: 'clamp(16px, 3.5vw, 64px)',
              bottom: 'clamp(56px, 8vh, 72px)',
              maxWidth: 720,
              opacity: 0,
              transform: 'translateY(18px)',
              transition: 'opacity .4s ease, transform .5s ease',
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                fontSize: 11,
                letterSpacing: '.24em',
                color: '#A3A3A3',
                marginBottom: 18,
                fontFamily: 'monospace',
              }}
            >
              {ch[0]}
            </div>
            <div
              style={{
                fontSize: 'clamp(30px, 4.4vw, 72px)',
                lineHeight: 1,
                letterSpacing: '-.03em',
                fontWeight: 700,
                color: '#F5F4F0',
              }}
            >
              {ch[1]}
              <br />
              {ch[2]}
            </div>
            {ch[3] ? (
              <p
                style={{
                  margin: '20px 0 0',
                  maxWidth: 460,
                  fontSize: 15.5,
                  lineHeight: 1.6,
                  color: '#A3A3A3',
                }}
              >
                {ch[3]}
              </p>
            ) : (
              <div style={{ display: 'flex', gap: 14, marginTop: 28, pointerEvents: 'auto' }}>
                <button
                  type="button"
                  onClick={onOpenConsultation}
                  className="btn btn-solid"
                  style={{
                    padding: '15px 26px',
                    fontSize: 12.5,
                    textTransform: 'none',
                    letterSpacing: '.06em',
                    border: 0,
                    background: '#C3F910',
                    color: '#050505',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {t.cta}
                </button>
              </div>
            )}
          </div>
        ))}

        {/* Bottom Timeline with Scrubber & Steps */}
        <div
          style={{
            position: 'absolute',
            left: 'clamp(16px, 3.5vw, 64px)',
            right: 'clamp(16px, 3.5vw, 64px)',
            bottom: 22,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 20,
            pointerEvents: 'none',
            fontSize: 9.5,
            letterSpacing: '.2em',
            color: '#5A5A56',
            fontFamily: 'monospace',
          }}
        >
          <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 1, background: '#1F1F1F' }} />
          <div
            data-hud="bar"
            style={{
              position: 'absolute',
              left: 0,
              top: '50%',
              height: 1,
              width: '0%',
              background: '#C3F910',
              transition: 'width .1s linear',
            }}
          />
          {t.steps.map((st) => (
            <span key={st} style={{ position: 'relative', background: '#050505', padding: '0 8px' }}>
              {st}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
