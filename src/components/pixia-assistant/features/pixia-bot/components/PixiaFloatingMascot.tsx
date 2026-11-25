'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import type { Language } from '../../../core/types';

interface PixiaFloatingMascotProps {
  lang?: Language;
  initialPosition?: 'center' | 'bottom-right';
  onOpen: () => void;
}

const BOX_SIZE = 154;
const PADDING = 16;

function computeInitialCoords(mode: 'center' | 'bottom-right'): { x: number; y: number } {
  if (typeof window === 'undefined') return { x: 240, y: 200 };
  const maxX = Math.max(PADDING, window.innerWidth - BOX_SIZE - PADDING);
  const maxY = Math.max(PADDING, window.innerHeight - BOX_SIZE - PADDING);

  if (mode === 'bottom-right') {
    return {
      x: Math.max(PADDING, maxX - 16),
      y: Math.max(PADDING, maxY - 16),
    };
  }
  return {
    x: Math.round(Math.min(maxX, Math.max(PADDING, window.innerWidth / 2 - BOX_SIZE / 2))),
    y: Math.round(Math.min(maxY, Math.max(PADDING, window.innerHeight / 2 - BOX_SIZE / 2))),
  };
}

export function PixiaFloatingMascot({
  lang = 'fr',
  initialPosition = 'center',
  onOpen,
}: PixiaFloatingMascotProps) {
  // Valeur initiale déterministe pour le prerender serveur : la position réelle
  // est calculée après montage, quand `window` est disponible.
  const [coords, setCoords] = useState<{ x: number; y: number }>({ x: 240, y: 200 });
  const [isDragging, setIsDragging] = useState(false);
  const [showGreeting, setShowGreeting] = useState(true);
  const [videoFailed, setVideoFailed] = useState(false);

  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    moved: boolean;
  } | null>(null);

  // Placement réel après hydratation (évite un décalage serveur/navigateur).
  useEffect(() => {
    setCoords(computeInitialCoords(initialPosition));
  }, [initialPosition]);

  // Auto-hide transient welcome message after 4.5s
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setShowGreeting(false);
    }, 4500);
    return () => window.clearTimeout(timer);
  }, []);

  // Clamp coordinates if viewport resizes
  useEffect(() => {
    const handleResize = () => {
      setCoords((prev) => {
        const maxX = Math.max(PADDING, window.innerWidth - BOX_SIZE - PADDING);
        const maxY = Math.max(PADDING, window.innerHeight - BOX_SIZE - PADDING);
        return {
          x: Math.min(maxX, Math.max(PADDING, prev.x)),
          y: Math.min(maxY, Math.max(PADDING, prev.y)),
        };
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originX: coords.x,
      originY: coords.y,
      moved: false,
    };
    setIsDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const state = dragRef.current;
    if (!state || state.pointerId !== e.pointerId) return;

    const dx = e.clientX - state.startX;
    const dy = e.clientY - state.startY;
    if (!state.moved && Math.hypot(dx, dy) > 6) {
      state.moved = true;
      setShowGreeting(false);
    }

    if (state.moved) {
      const maxX = Math.max(PADDING, window.innerWidth - BOX_SIZE - PADDING);
      const maxY = Math.max(PADDING, window.innerHeight - BOX_SIZE - PADDING);
      setCoords({
        x: Math.min(maxX, Math.max(PADDING, state.originX + dx)),
        y: Math.min(maxY, Math.max(PADDING, state.originY + dy)),
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const state = dragRef.current;
    if (!state || state.pointerId !== e.pointerId) return;
    dragRef.current = null;
    setIsDragging(false);

    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }

    if (!state.moved) {
      setShowGreeting(false);
      onOpen();
    }
  };

  const greetingText =
    lang === 'fr'
      ? 'Bonjour, je suis Assistant Bot Pixia'
      : 'Hello, I am Assistant Bot Pixia';

  return (
    <div
      data-pixia-drag="true"
      className="pointer-events-auto z-30"
      draggable={false}
      tabIndex={0}
      role="button"
      aria-label={lang === 'fr' ? 'Ouvrir Assistant Bot Pixia' : 'Open Assistant Bot Pixia'}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => {
        dragRef.current = null;
        setIsDragging(false);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setShowGreeting(false);
          onOpen();
        }
      }}
      style={{
        position: 'fixed',
        left: `${coords.x}px`,
        top: `${coords.y}px`,
        width: `${BOX_SIZE}px`,
        height: `${BOX_SIZE}px`,
        touchAction: 'none',
        willChange: 'transform',
        userSelect: 'none',
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
    >
      {/* Message d'accueil éphémère qui disparaît automatiquement */}
      <AnimatePresence>
        {showGreeting && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.95 }}
            transition={{ duration: 0.28 }}
            className="pointer-events-none absolute -top-14 left-1/2 -translate-x-1/2 w-max max-w-[260px] rounded-2xl border border-white/14 bg-[#17171A]/95 px-4 py-2 text-center text-xs font-medium text-white shadow-[0_14px_35px_rgba(0,0,0,0.55)] backdrop-blur-md"
          >
            {greetingText}
          </motion.div>
        )}
      </AnimatePresence>


      {/* Grand robot animé flottant */}
      <motion.div
        data-pixia-mascot="true"
        animate={isDragging ? { y: 0, scale: 1.04 } : { y: [0, -10, 0], scale: 1 }}
        transition={
          isDragging
            ? { duration: 0.15 }
            : { duration: 3.4, repeat: Infinity, ease: 'easeInOut' }
        }
        style={{
          width: `${BOX_SIZE}px`,
          height: `${BOX_SIZE}px`,
          opacity: 1,
          pointerEvents: 'none',
          willChange: 'transform, opacity',
          transformOrigin: 'center center',
        }}
      >
        {!videoFailed ? (
          <video
            data-pixia-video="true"
            src="/bot-avatars/pixia_robot.webm"
            poster="/bot-avatars/010.webp"
            autoPlay
            muted
            playsInline
            loop
            preload="auto"
            onError={() => setVideoFailed(true)}
            className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--ui-accent)] w-full h-full object-contain bg-transparent select-none"
            style={{
              display: 'block',
              userSelect: 'none',
            }}
          />
        ) : (
          <img
            src="/bot-avatars/010.webp"
            alt="Assistant Bot Pixia"
            className="w-full h-full object-contain bg-transparent select-none"
          />
        )}
      </motion.div>
    </div>
  );
}
