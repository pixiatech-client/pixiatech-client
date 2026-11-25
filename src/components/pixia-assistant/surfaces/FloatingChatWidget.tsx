'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import type { BootstrapPayload, Language } from '../core/types';
import { PixiaFloatingMascot } from '../features/pixia-bot/components/PixiaFloatingMascot';
import { PixiaChatWorkspace } from '../features/pixia-bot/PixiaChatWorkspace';
import {
  PIXIA_EVENTS,
  emitChatState,
  shouldRenderFloatingChat,
} from './pixia-events';

interface FloatingChatWidgetProps {
  bootstrap: BootstrapPayload;
  currentPathname: string;
  initialLang?: Language;
}

export function FloatingChatWidget({
  bootstrap,
  currentPathname,
  initialLang = 'fr',
}: FloatingChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasMountedChat, setHasMountedChat] = useState(false);
  const [mascotHiddenByTakeover, setMascotHiddenByTakeover] = useState(
    Boolean(window.__pixiaMascotTakeover)
  );

  const visible = shouldRenderFloatingChat(
    currentPathname,
    bootstrap.settings.isWizardBotEnabled
  );

  useEffect(() => {
    if (window.__pixiaChatOpenPending) {
      setHasMountedChat(true);
      setIsOpen(true);
      emitChatState(true);
    }

    const handleOpen = () => {
      setHasMountedChat(true);
      setIsOpen(true);
      emitChatState(true);
    };
    const handleTakeover = () => setMascotHiddenByTakeover(true);
    const handleRelease = () => setMascotHiddenByTakeover(false);

    window.addEventListener(PIXIA_EVENTS.OPEN_CHATBOT, handleOpen);
    window.addEventListener(PIXIA_EVENTS.MASCOT_TAKEOVER, handleTakeover);
    window.addEventListener(PIXIA_EVENTS.MASCOT_RELEASE, handleRelease);

    return () => {
      window.removeEventListener(PIXIA_EVENTS.OPEN_CHATBOT, handleOpen);
      window.removeEventListener(PIXIA_EVENTS.MASCOT_TAKEOVER, handleTakeover);
      window.removeEventListener(PIXIA_EVENTS.MASCOT_RELEASE, handleRelease);
    };
  }, []);

  if (!visible) return null;

  const openChat = () => {
    setHasMountedChat(true);
    setIsOpen(true);
    emitChatState(true);
  };

  const closeChat = () => {
    setIsOpen(false);
    setHasMountedChat(false);
    emitChatState(false);
  };

  return (
    <>
      {!isOpen && !mascotHiddenByTakeover && (
        <PixiaFloatingMascot
          lang={initialLang}
          initialPosition="bottom-right"
          onOpen={openChat}
        />
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={closeChat}
            className="fixed inset-0 z-40 bg-black/55 backdrop-blur-md"
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {hasMountedChat && isOpen && (
          <motion.div
            key="pixia-floating-modal"
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pointer-events-none"
          >
            <div className="w-full max-w-[940px] pointer-events-auto">
              <PixiaChatWorkspace
                bootstrap={bootstrap}
                initialLang={initialLang}
                onClose={closeChat}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
