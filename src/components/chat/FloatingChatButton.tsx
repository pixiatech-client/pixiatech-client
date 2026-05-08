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

  return (
    <>
      {/* Container used to define the boundaries for dragging */}
      <div ref={constraintsRef} className="fixed inset-0 pointer-events-none z-[100]" />

      <motion.div
        drag
        dragConstraints={constraintsRef}
        dragElastic={0.1}
        dragMomentum={false}
        className="fixed bottom-24 left-2 z-[101] md:bottom-20 md:left-auto md:right-8 pointer-events-auto touch-none"
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
              : "h-32 w-32 flex items-center justify-center bg-transparent"
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
                <motion.img
                  src="/robot-avatar.png"
                  alt="Assistant"
                  className="w-full h-full object-contain drop-shadow-2xl"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                />
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
