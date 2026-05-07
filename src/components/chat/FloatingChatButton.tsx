'use client';

import React, { useState } from 'react';
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

  return (
    <>
      <div className="fixed bottom-6 right-6 z-[100] md:bottom-8 md:right-8">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "transition-all duration-300 relative",
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
      </div>

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
