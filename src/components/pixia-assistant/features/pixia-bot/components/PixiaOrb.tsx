'use client';

import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

export type OrbTone = 'question' | 'success' | 'retry' | 'blue' | 'error';

interface PixiaOrbProps {
  tone?: OrbTone;
  isTyping: boolean;
  hasError?: boolean;
  isSuccess?: boolean;
  sizePx?: number;
  floating?: boolean;
  onClick?: () => void;
}

const TONE_PALETTE: Record<OrbTone, { primary: string; secondary: string }> = {
  // Mauve quand le robot pose une question / attend une réponse
  question: {
    primary: 'rgba(168, 85, 247, 0.58)',
    secondary: 'rgba(192, 132, 252, 0.42)',
  },
  // Vert quand la réponse est correcte ou terminée
  success: {
    primary: 'rgba(16, 185, 129, 0.62)',
    secondary: 'rgba(43, 214, 131, 0.44)',
  },
  // Bleu lors de plusieurs tentatives / reprise
  retry: {
    primary: 'rgba(37, 99, 235, 0.66)',
    secondary: 'rgba(56, 189, 248, 0.46)',
  },
  // Bleu éclatant à l'étape finale Félicitations / Succès
  blue: {
    primary: 'rgba(59, 130, 246, 0.78)',
    secondary: 'rgba(56, 189, 248, 0.56)',
  },
  // Rouge en cas d'erreur (email, téléphone, saisie erronée)
  error: {
    primary: 'rgba(239, 68, 68, 0.86)',
    secondary: 'rgba(255, 72, 72, 0.62)',
  },
};

export function PixiaOrb({
  tone,
  isTyping,
  hasError = false,
  isSuccess = false,
  sizePx = 160,
  floating = true,
  onClick,
}: PixiaOrbProps) {
  const [videoFailed, setVideoFailed] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const posterImgRef = useRef<HTMLImageElement | null>(null);

  const resolvedTone: OrbTone =
    tone ?? (hasError ? 'error' : isSuccess ? 'success' : 'question');
  const { primary: glowColor, secondary: secondaryGlow } = TONE_PALETTE[resolvedTone];

  const widthPx = Math.round(sizePx * 1.25);
  const heightPx = sizePx;

  // Render transparent VP9 video via 2D RGBA canvas to completely bypass Chromium's
  // hardware TV-range YUV overlay quad artifact over backdrop-filter on initial paint.
  useEffect(() => {
    if (videoFailed) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const targetW = Math.round(widthPx * dpr);
    const targetH = Math.round(heightPx * dpr);
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }

    let cancelled = false;
    let rafId = 0;
    let vfcId = 0;

    const drawSource = (source: CanvasImageSource) => {
      if (cancelled) return;
      ctx.clearRect(0, 0, targetW, targetH);
      ctx.drawImage(source, 0, 0, targetW, targetH);
    };

    // Draw crisp poster frame immediately while video buffers frame 0
    const posterImg = new Image();
    posterImgRef.current = posterImg;
    posterImg.onload = () => {
      if (!cancelled && video.readyState < 2) {
        drawSource(posterImg);
      }
    };
    posterImg.src = '/pixiaicon-poster.png';
    if (posterImg.complete && posterImg.naturalWidth > 0 && video.readyState < 2) {
      drawSource(posterImg);
    }

    type VideoWithRVFC = HTMLVideoElement & {
      requestVideoFrameCallback?: (cb: () => void) => number;
      cancelVideoFrameCallback?: (id: number) => void;
    };
    const vWithCallback = video as VideoWithRVFC;

    const scheduleVideoPump = () => {
      if (cancelled) return;
      if (video.readyState >= 2) {
        drawSource(video);
      }
      if (typeof vWithCallback.requestVideoFrameCallback === 'function') {
        vfcId = vWithCallback.requestVideoFrameCallback(scheduleVideoPump);
      } else {
        rafId = window.requestAnimationFrame(scheduleVideoPump);
      }
    };

    const handleCanPlay = () => {
      if (cancelled) return;
      if (video.readyState >= 2) drawSource(video);
      void video.play().catch(() => {
        // Fallback stays on crisp poster if autoplay is strictly blocked
      });
    };

    video.addEventListener('loadeddata', handleCanPlay);
    video.addEventListener('canplay', handleCanPlay);
    void video.play().catch(() => {});
    scheduleVideoPump();

    return () => {
      cancelled = true;
      video.removeEventListener('loadeddata', handleCanPlay);
      video.removeEventListener('canplay', handleCanPlay);
      if (rafId) window.cancelAnimationFrame(rafId);
      if (vfcId && typeof vWithCallback.cancelVideoFrameCallback === 'function') {
        vWithCallback.cancelVideoFrameCallback(vfcId);
      }
    };
  }, [widthPx, heightPx, videoFailed]);

  return (
    <div className="relative inline-flex items-center justify-center select-none">
      {/* Lueur externe dynamique derrière la tête (mauve / vert / bleu / rouge) */}
      <motion.div
        aria-hidden="true"
        animate={{
          scale: isTyping ? [1, 1.15, 1] : [1, 1.08, 1],
          opacity: isTyping ? [0.88, 1, 0.88] : [0.74, 0.96, 0.74],
          background: `radial-gradient(circle, ${secondaryGlow} 0%, ${glowColor} 46%, transparent 74%)`,
        }}
        transition={{
          scale: { duration: isTyping ? 1.1 : 3.0, repeat: Infinity, ease: 'easeInOut' },
          opacity: { duration: isTyping ? 1.1 : 3.0, repeat: Infinity, ease: 'easeInOut' },
          background: { duration: 0.35, ease: 'easeOut' },
        }}
        style={{
          width: widthPx * 1.55,
          height: heightPx * 1.65,
        }}
        className="pointer-events-none absolute rounded-full blur-2xl"
      />

      {/* Second halo serré et circulaire */}
      <motion.div
        aria-hidden="true"
        animate={{
          scale: isTyping ? [1, 1.1, 1] : [1, 1.05, 1],
          background: `radial-gradient(circle, ${secondaryGlow} 0%, ${glowColor} 42%, transparent 72%)`,
        }}
        transition={{
          scale: { duration: isTyping ? 1.0 : 3.2, repeat: Infinity, ease: 'easeInOut' },
          background: { duration: 0.35, ease: 'easeOut' },
        }}
        style={{
          width: widthPx * 1.18,
          height: heightPx * 1.24,
        }}
        className="pointer-events-none absolute rounded-full blur-xl opacity-85"
      />

      {/* Hidden decoder element kept active at 2x2px opacity ~0 so Chromium feeds frames without promoting an overlay quad */}
      {!videoFailed && (
        <video
          ref={videoRef}
          aria-hidden="true"
          tabIndex={-1}
          src="/pixiaicon.webm"
          autoPlay
          muted
          playsInline
          loop
          preload="auto"
          onError={() => setVideoFailed(true)}
          className="pointer-events-none absolute h-[2px] w-[2px] opacity-[0.001]"
        />
      )}

      {/* Canvas 2D RGBA de la tête du robot avec masque elliptique doux (zéro carré résiduel dès la frame 0) */}
      <motion.div
        animate={
          floating
            ? {
                y: isTyping ? [0, -4, 0] : [0, -8, 0],
                scale: isTyping ? [1, 1.03, 1] : [1, 1.015, 1],
              }
            : { y: 0, scale: 1 }
        }
        transition={{
          duration: isTyping ? 1.1 : 3.4,
          repeat: floating ? Infinity : 0,
          ease: 'easeInOut',
        }}
        whileHover={onClick ? { scale: 1.05 } : undefined}
        whileTap={onClick ? { scale: 0.96 } : undefined}
        style={{
          width: widthPx,
          height: heightPx,
        }}
        className="relative flex items-center justify-center bg-transparent"
      >
        {!videoFailed ? (
          <canvas
            ref={canvasRef}
            data-pixia-icon="true"
            aria-label="Assistant Pixia"
            tabIndex={onClick ? 0 : undefined}
            role={onClick ? 'button' : undefined}
            onClick={onClick}
            onKeyDown={(e) => {
              if (onClick && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                onClick();
              }
            }}
            style={{
              width: widthPx,
              height: heightPx,
              maskImage:
                'radial-gradient(ellipse 49% 49% at 50% 48%, black 76%, rgba(0,0,0,0.55) 90%, transparent 100%)',
              WebkitMaskImage:
                'radial-gradient(ellipse 49% 49% at 50% 48%, black 76%, rgba(0,0,0,0.55) 90%, transparent 100%)',
            }}
            className={`focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--ui-accent)] select-none bg-transparent ${
              onClick ? 'cursor-pointer pointer-events-auto' : 'pointer-events-none'
            }`}
          />
        ) : (
          <img
            data-pixia-icon="true"
            src="/pixiaicon-poster.png"
            alt="Assistant Pixia"
            tabIndex={onClick ? 0 : undefined}
            role={onClick ? 'button' : undefined}
            onClick={onClick}
            onKeyDown={(e) => {
              if (onClick && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                onClick();
              }
            }}
            className={`focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--ui-accent)] w-full h-full object-contain select-none bg-transparent ${
              onClick ? 'cursor-pointer pointer-events-auto' : 'pointer-events-none'
            }`}
          />
        )}
      </motion.div>
    </div>
  );
}
