'use client';

/**
 * FloatingChatButton Component
 * Features: Draggable with screen constraints, responsive positioning.
 */

import React, { useState, useRef } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { WizardBotFlow } from '@/components/chat/WizardBotFlow';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import type { Product, Settings, LaborSettings, DeliverySettings, Locations } from '@/lib/types';

interface FloatingChatButtonProps {
  allProducts: Product[];
  settings: Settings;
  laborSettings: LaborSettings;
  deliverySettings: DeliverySettings;
  locations: Locations | null;
  onHome?: () => void;
}

export function FloatingChatButton({ allProducts, settings, laborSettings, deliverySettings, locations, onHome }: FloatingChatButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const constraintsRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const videoRef = useRef<HTMLVideoElement>(null);

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
        whileDrag={{ cursor: "grabbing", scale: 1.1 }}
        className={cn(
          "fixed z-[101] pointer-events-auto touch-none",
          isMobile ? "bottom-24 left-2" : "bottom-[38%] right-12"
        )}
        style={{ touchAction: "none" }}
      >
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsOpen(!isOpen)}
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
