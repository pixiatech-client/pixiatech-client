import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';
import type { BootstrapPayload } from './core/types.ts';
import { PixiaFloatingMascot } from './features/pixia-bot/components/PixiaFloatingMascot.tsx';
import { PixiaChatWorkspace } from './features/pixia-bot/PixiaChatWorkspace.tsx';
import { fetchBootstrap } from './services/pixia-api.ts';
import { ChatWidgetIframeView } from './surfaces/ChatWidgetIframeView.tsx';
import {
  PIXIA_EVENTS,
  emitChatState,
} from './surfaces/pixia-events.ts';

export default function App() {
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/chat-widget')) {
    return <ChatWidgetIframeView />;
  }

  const [bootstrap, setBootstrap] = useState<BootstrapPayload | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [hasMountedChat, setHasMountedChat] = useState(false);
  const [mascotHiddenByTakeover, setMascotHiddenByTakeover] = useState(
    () => typeof window !== 'undefined' && Boolean(window.__pixiaMascotTakeover)
  );

  const loadConfig = useCallback(async () => {
    try {
      setLoadError(null);
      const data = await fetchBootstrap();
      setBootstrap(data);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Unable to load bootstrap data');
    }
  }, []);

  useEffect(() => {
    void loadConfig();
  }, [loadConfig]);

  const openChat = useCallback(() => {
    setHasMountedChat(true);
    setIsOpen(true);
    emitChatState(true);
  }, []);

  const closeChat = useCallback(() => {
    setIsOpen(false);
    setHasMountedChat(false);
    emitChatState(false);
  }, []);

  useEffect(() => {
    if (window.__pixiaChatOpenPending) {
      openChat();
    }

    const handleTakeover = () => setMascotHiddenByTakeover(true);
    const handleRelease = () => setMascotHiddenByTakeover(false);

    window.addEventListener(PIXIA_EVENTS.OPEN_CHATBOT, openChat);
    window.addEventListener(PIXIA_EVENTS.MASCOT_TAKEOVER, handleTakeover);
    window.addEventListener(PIXIA_EVENTS.MASCOT_RELEASE, handleRelease);

    return () => {
      window.removeEventListener(PIXIA_EVENTS.OPEN_CHATBOT, openChat);
      window.removeEventListener(PIXIA_EVENTS.MASCOT_TAKEOVER, handleTakeover);
      window.removeEventListener(PIXIA_EVENTS.MASCOT_RELEASE, handleRelease);
    };
  }, [openChat]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeChat();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeChat]);

  return (
    <div
      className="relative min-h-screen w-full bg-[#0D0D10] text-[#F4F4F5] overflow-hidden"
      style={{
        backgroundImage:
          'radial-gradient(circle at 50% 48%, rgba(192, 132, 252, 0.08), transparent 45%), radial-gradient(circle at 50% 52%, rgba(56, 189, 248, 0.06), transparent 36%)',
      }}
    >
      {loadError && (
        <div className="fixed bottom-4 left-4 z-50 rounded-2xl border border-[#FB7185]/30 bg-[#17171A] px-4 py-3 flex items-center gap-3">
          <p className="text-xs text-[#FB7185]">{loadError}</p>
          <button
            type="button"
            onClick={() => void loadConfig()}
            className="rounded-xl bg-white px-3 py-1 text-xs font-semibold text-[#141416] cursor-pointer"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* État fermé : page vide, uniquement le grand robot flottant déplaçable */}
      {bootstrap &&
        bootstrap.settings.isWizardBotEnabled &&
        !isOpen &&
        !mascotHiddenByTakeover && (
          <PixiaFloatingMascot lang="fr" initialPosition="center" onOpen={openChat} />
        )}

      {/* Arrière-plan flouté à l'ouverture */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="pixia-blur-backdrop"
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

      {/* Fenêtre ouverte : Fiche technique (masquable/modifiable) + Chat 9:16 avec tête animée */}
      <AnimatePresence>
        {bootstrap && hasMountedChat && isOpen && (
          <motion.div
            key="pixia-chat-modal"
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pointer-events-none"
          >
            <div className="w-full max-w-[940px] pointer-events-auto">
              <PixiaChatWorkspace
                bootstrap={bootstrap}
                initialLang="fr"
                onClose={closeChat}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
