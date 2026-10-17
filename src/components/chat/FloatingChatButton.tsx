'use client';

/**
 * FloatingChatButton Component
 * Features: Draggable with screen constraints, responsive positioning.
 */

import React, { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { WizardBotFlow } from '@/components/chat/WizardBotFlow';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  PIXIA_MASCOT_RELEASE_EVENT,
  PIXIA_MASCOT_TAKEOVER_EVENT,
  PIXIA_OPEN_CHATBOT_EVENT,
  consumePendingChatOpen,
  isMascotTakeover,
  notifyChatState,
} from '@/lib/pixia-global';
import type { Product, Settings, LaborSettings, DeliverySettings, Locations } from '@/lib/types';

interface FloatingChatButtonProps {
  allProducts: Product[];
  settings: Settings;
  laborSettings: LaborSettings;
  deliverySettings: DeliverySettings;
  locations: Locations | null;
  onHome?: () => void;
  shifted?: boolean;
  elevated?: boolean;
}

export function FloatingChatButton({ allProducts, settings, laborSettings, deliverySettings, locations, onHome, shifted, elevated }: FloatingChatButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  /** L'animation globale de Pixia contrôle la mascotte : ce bouton se retire. */
  const [takeover, setTakeover] = useState(false);
  const constraintsRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const videoRef = useRef<HTMLVideoElement>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    const start = dragStartRef.current;
    dragStartRef.current = null;
    const moved = start
      ? Math.hypot(e.clientX - start.x, e.clientY - start.y)
      : 0;
    if (moved > 8) return;
    setIsOpen((prev) => !prev);
  };

  // Ouverture demandée par la mascotte globale (clic sur le robot ou la tête).
  // Un clic peut précéder le montage de ce bouton (données du chatbot chargées
  // en asynchrone) : la demande en attente est consommée au montage.
  useEffect(() => {
    if (consumePendingChatOpen()) setIsOpen(true);

    const handleOpenChat = () => {
      // La demande est servie : on vide le drapeau « en attente » pour qu'un
      // remontage ultérieur du bouton n'ouvre pas le chat tout seul.
      consumePendingChatOpen();
      setIsOpen(true);
    };
    const handleTakeover = () => setTakeover(true);
    const handleRelease = () => setTakeover(false);

    window.addEventListener(PIXIA_OPEN_CHATBOT_EVENT, handleOpenChat);
    window.addEventListener(PIXIA_MASCOT_TAKEOVER_EVENT, handleTakeover);
    window.addEventListener(PIXIA_MASCOT_RELEASE_EVENT, handleRelease);

    // L'animation a pu prendre le relais avant notre montage.
    setTakeover(isMascotTakeover());

    return () => {
      window.removeEventListener(PIXIA_OPEN_CHATBOT_EVENT, handleOpenChat);
      window.removeEventListener(PIXIA_MASCOT_TAKEOVER_EVENT, handleTakeover);
      window.removeEventListener(PIXIA_MASCOT_RELEASE_EVENT, handleRelease);
    };
  }, []);

  // L'animation globale se retire tant que le chat est ouvert (la mascotte
  // laisse la place à la conversation) puis reprend la main à la fermeture.
  useEffect(() => {
    notifyChatState(isOpen);
  }, [isOpen]);

  return (
    <>
      {/* Container used to define the boundaries for dragging */}
      <div ref={constraintsRef} className="fixed inset-0 pointer-events-none z-[100]" />

      <motion.div
        drag
        dragConstraints={constraintsRef}
        dragElastic={0.1}
        dragMomentum={true}
        whileHover={{ cursor: "grab", scale: 1.05 }}
        whileDrag={{ cursor: "grabbing", scale: 1.08 }}
        className={cn(
          "fixed pointer-events-auto touch-none will-change-transform transition-[bottom,left,right] duration-500 ease-out",
          elevated ? "z-[290]" : "z-[101]",
          // L'animation globale de Pixia porte la mascotte : ce robot se retire
          // entièrement (chat ouvert compris) — la fermeture reste celle de
          // WizardBotFlow, ce qui évite une croix en double.
          takeover && "hidden",
          isMobile ? "bottom-24 left-2" : shifted ? "bottom-[38%] right-[440px]" : "bottom-[38%] right-12"
        )}
        style={{ touchAction: "none" }}
      >
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          className={cn(
            "transition-all duration-300 relative cursor-grab active:cursor-grabbing",
            isOpen
              ? "h-14 w-14 rounded-full flex items-center justify-center bg-[#1a1d21] text-white rotate-90 shadow-2xl"
              : "h-28 sm:h-44 w-28 sm:w-44 flex items-center justify-center bg-transparent"
          )}
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ opacity: 0, rotate: -90 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: 90 }}
              >
                <X size={28} />
              </motion.div>
            ) : (
              <motion.div
                key="open"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                className="w-full h-full relative"
              >
                <div className="w-full h-full">
                  <video
                    ref={videoRef}
                    src="/bot-avatars/pixia_robot.webm"
                    poster="/bot-avatars/010.webp"
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-contain select-none"
                    style={{ background: 'transparent', display: 'block' }}
                    onTimeUpdate={() => {
                      const v = videoRef.current;
                      if (v && v.duration > 0 && v.currentTime >= v.duration - 0.04) {
                        v.currentTime = 0.04;
                      }
                    }}
                    onEnded={(e) => {
                      (e.target as HTMLVideoElement).currentTime = 0.04;
                      (e.target as HTMLVideoElement).play();
                    }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <WizardBotFlow
            onClose={() => {
              setIsOpen(false);
            }}
            onHome={() => {
              setIsOpen(false);
              onHome?.();
            }}
            allProducts={allProducts}
            settings={settings}
            laborSettings={laborSettings}
            deliverySettings={deliverySettings}
            locations={locations}
          />
        )}
      </AnimatePresence>
    </>
  );
}
