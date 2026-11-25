'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { consumePendingChatOpen, isMascotTakeover } from '@/lib/pixia-global';
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
  // L'état du relais est lu dans un effet (API navigateur) pour ne pas casser
  // le rendu serveur / l'hydratation : le drapeau global est la référence.
  const [mascotHiddenByTakeover, setMascotHiddenByTakeover] = useState(false);
  const modalPanelRef = useRef<HTMLDivElement | null>(null);

  const visible = shouldRenderFloatingChat(
    currentPathname,
    bootstrap.settings.isWizardBotEnabled
  );

  useEffect(() => {
    setMascotHiddenByTakeover(isMascotTakeover());

    // Consomme la demande d'ouverture posée avant le montage du widget,
    // exactement comme le fait le bouton flottant historique.
    if (consumePendingChatOpen()) {
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

  // Verrouillage de la page pendant que l'assistant est ouvert : le document
  // ne défile plus (y compris au-dessus du header), seule la conversation
  // conserve son propre défilement. La position d'origine est restaurée à la
  // fermeture et tous les écouteurs sont retirés.
  useEffect(() => {
    if (!isOpen || !visible) return;

    const body = document.body;
    const root = document.documentElement;
    const scrollY = window.scrollY;
    const previous = {
      bodyOverflow: body.style.overflow,
      bodyPosition: body.style.position,
      bodyTop: body.style.top,
      bodyLeft: body.style.left,
      bodyRight: body.style.right,
      bodyWidth: body.style.width,
      rootOverflow: root.style.overflow,
    };

    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.width = '100%';
    body.style.overflow = 'hidden';
    root.style.overflow = 'hidden';

    const isInsideChat = (target: EventTarget | null) =>
      target instanceof Node && Boolean(modalPanelRef.current?.contains(target));

    // Empêche le scroll chaîné (molette / tactile) de atteindre le document
    // lorsque le pointeur est au-dessus du site, du header ou du voile.
    const blockOutsideScroll = (event: WheelEvent | TouchEvent) => {
      if (!isInsideChat(event.target)) event.preventDefault();
    };

    window.addEventListener('wheel', blockOutsideScroll, { passive: false });
    window.addEventListener('touchmove', blockOutsideScroll, { passive: false });

    return () => {
      window.removeEventListener('wheel', blockOutsideScroll);
      window.removeEventListener('touchmove', blockOutsideScroll);
      root.style.overflow = previous.rootOverflow;
      body.style.overflow = previous.bodyOverflow;
      body.style.position = previous.bodyPosition;
      body.style.top = previous.bodyTop;
      body.style.left = previous.bodyLeft;
      body.style.right = previous.bodyRight;
      body.style.width = previous.bodyWidth;
      window.scrollTo(0, scrollY);
    };
  }, [isOpen, visible]);

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
            className="fixed inset-0 z-[2000] bg-black/55 backdrop-blur-md"
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
            className="fixed inset-0 z-[2001] flex items-center justify-center p-4 sm:p-6 pointer-events-none"
          >
            <div
              ref={modalPanelRef}
              role="dialog"
              aria-label="Assistant Bot Pixia"
              className="w-full max-w-[940px] pointer-events-auto"
            >
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
