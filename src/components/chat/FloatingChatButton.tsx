'use client';

/**
 * FloatingChatButton Component
 * Features: Draggable with screen constraints, responsive positioning.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { WizardBotFlow } from '@/components/chat/WizardBotFlow';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useI18n } from '@/lib/i18n';
import {
  PIXIA_MASCOT_RELEASE_EVENT,
  PIXIA_MASCOT_TAKEOVER_EVENT,
  PIXIA_OPEN_CHATBOT_EVENT,
  consumePendingChatOpen,
  isMascotTakeover,
  notifyChatState,
} from '@/lib/pixia-global';
import type { Product, Settings, LaborSettings, DeliverySettings, Locations } from '@/lib/types';

/* Salut d'accueil du robot côté application : même trame que la mascotte du
   site (frappe caractère par caractère, maintien, fondu de sortie). */
const GREET_TYPE_MS = 42;
const GREET_HOLD_MS = 3400;
const GREET_FADE_MS = 600;

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

  const { t } = useI18n();

  /* Bulle d'accueil du robot (version application) : le message enregistré
     depuis l'admin (`settings.botWelcomeMessage`) sinon le message d'accueil du
     chat (`bot.welcome`, disponible dans les 3 langues) — le robot dit donc la
     même chose dans la bulle et dans le premier message du chat. */
  const greeting = (
    (typeof settings.botWelcomeMessage === 'string' ? settings.botWelcomeMessage.trim() : '') ||
    t('bot.welcome')
  ).trim();
  /** Message figé au montage : le salut n'est joué qu'une fois par chargement. */
  const greetingRef = useRef(greeting);
  const greetCleanupRef = useRef<(() => void) | null>(null);
  const [greetText, setGreetText] = useState('');
  const [bubbleMounted, setBubbleMounted] = useState(false);
  /** Début du fondu de sortie (comme `markedAtRef` de la mascotte du site). */
  const [bubbleFading, setBubbleFading] = useState(false);

  /** Interrompt le salut en cours (chat ouvert, mascotte du site…). */
  const dismissGreeting = useCallback(() => {
    greetCleanupRef.current?.();
    greetCleanupRef.current = null;
    setBubbleFading(false);
    setBubbleMounted(false);
  }, []);

  /* Salut unique par chargement de page : l'effet (aucune dépendance) ne se
     rejoue pas lors des navigations internes — pas de réarmement au scroll ni
     au changement de page ; une actualisation remonte le composant et rejoue le
     salut. Idempotent : la double invocation des effets en développement
     (StrictMode) doit pouvoir le relancer. */
  useEffect(() => {
    // Sur le site public, la mascotte globale porte le salut : le robot
    // applicatif (masqué) reste muet.
    if (isMascotTakeover()) return;
    const message = greetingRef.current;
    if (!message) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timeouts: number[] = [];
    let typeId = 0;

    setGreetText('');
    setBubbleFading(false);
    setBubbleMounted(true);

    if (reduceMotion) {
      setGreetText(message);
    } else {
      let i = 0;
      typeId = window.setInterval(() => {
        i += 1;
        setGreetText(message.slice(0, i));
        if (i >= message.length) window.clearInterval(typeId);
      }, GREET_TYPE_MS);
    }

    // Même cycle que la mascotte du site : maintien, puis fondu linéaire
    // avant démontage (l'opacité est pilotée par CSS via `bubbleFading`).
    const typingMs = reduceMotion ? 0 : message.length * GREET_TYPE_MS;
    timeouts.push(window.setTimeout(() => setBubbleFading(true), typingMs + GREET_HOLD_MS));
    timeouts.push(
      window.setTimeout(
        () => setBubbleMounted(false),
        typingMs + GREET_HOLD_MS + GREET_FADE_MS
      )
    );

    greetCleanupRef.current = () => {
      if (typeId) window.clearInterval(typeId);
      timeouts.forEach((id) => window.clearTimeout(id));
    };

    return () => {
      greetCleanupRef.current?.();
      greetCleanupRef.current = null;
    };
  }, []);

  /* Ouvrir le chat consomme le salut : la bulle ne réapparaît pas à la
     fermeture (le robot a déjà parlé). */
  useEffect(() => {
    if (!isOpen) return;
    dismissGreeting();
  }, [isOpen, dismissGreeting]);

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
    const handleTakeover = () => {
      // La mascotte du site reprend le salut : la bulle applicative se tait.
      setTakeover(true);
      dismissGreeting();
    };
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
  }, [dismissGreeting]);

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
        {/* Bulle d'accueil du robot (version application) : mêmes styles et
            mêmes timings que la mascotte du site — frappe caractère par
            caractère, maintien, puis fondu linéaire de 600 ms. Apparition
            instantanée, non bloquante (aucun événement pointeur), masquée dès
            que le chat s'ouvre. Placée à gauche du robot (tête au centre) ou,
            sur mobile, au-dessus — comme la mascotte du site. */}
        {/* `width: max-content` + `max-width` (comme la bulle `position: fixed`
            du site) : sans cela, la bulle positionnée en `right: 100%` dans le
            petit conteneur du robot est réduite par le calcul « shrink-to-fit »
            à la largeur de son plus long mot (bulle étroite et haute).
            Sur mobile le robot est collé au bord gauche : la bulle est alignée
            sur son bord gauche (équivalent du « clamp » du site, 12 px de marge)
            et bornée à 70vw — elle ne peut donc pas sortir de l'écran. */}
        <div
          className="pointer-events-none absolute z-10 max-w-[min(280px,70vw)]"
          style={
            isMobile
              ? { width: 'max-content', bottom: '100%', left: 0, marginBottom: 12 }
              : { width: 'max-content', right: '100%', top: '50%', transform: 'translateY(-50%)', marginRight: 12 }
          }
        >
          {bubbleMounted && !isOpen && (
            <div
              data-pixia-app-bubble
              style={{
                padding: '14px 18px',
                borderRadius: '18px',
                background: 'rgba(225, 255, 170, 0.97)',
                color: '#0f1a00',
                fontFamily: 'Satoshi, "Helvetica Neue", Helvetica, Arial, sans-serif',
                fontSize: '14px',
                lineHeight: 1.45,
                fontWeight: 600,
                boxShadow: '0 20px 45px rgba(0,0,0,0.35)',
                border: '1px solid rgba(195, 249, 16, 0.6)',
                willChange: 'opacity',
                pointerEvents: 'none',
                opacity: bubbleFading ? 0 : 1,
                transition: `opacity ${GREET_FADE_MS}ms linear`,
              }}
            >
              {greetText}
              {greetText.length > 0 && greetText.length < greetingRef.current.length && (
                <span aria-hidden="true">|</span>
              )}
            </div>
          )}
        </div>

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
